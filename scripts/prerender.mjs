/* Build step 3 of 3 (see "build" in package.json): turns the single-page app
 * into a static site a search engine reads in one request.
 *
 *   1. `vite build` writes the app to dist/ (dist/index.html is the template).
 *   2. `vite build --ssr src/entry-server.jsx` writes the renderer to dist-server/.
 *   3. This script renders every page into dist/ and writes the files a host
 *      needs: 404.html, sitemap.xml, robots.txt, and the redirect, header and
 *      clean-URL rules for Cloudflare and Netlify (_redirects, _headers) and
 *      Apache / LiteSpeed (.htaccess). The hosting platform is not settled, so
 *      every likely one is covered from the same sources.
 *
 * It fails the build, rather than shipping, when a page loses its title, its
 * single h1, its canonical or valid JSON-LD - the regressions that cost
 * rankings silently. */

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const serverDir = join(root, "dist-server");
const readJson = (path) => JSON.parse(readFileSync(join(root, path), "utf8"));

const { render, getPages, NOT_FOUND_PATH, headHtml, SITE_URL } = await import(
  pathToFileURL(join(serverDir, "entry-server.js")).href
);

const template = readFileSync(join(dist, "index.html"), "utf8");

/* ---------- each page's own stylesheet and chunks ----------
   main.jsx carries only the CSS every page needs; each page imports its own
   namespaced sheet, so Vite writes it beside the page's chunk. A visitor's
   first page links that sheet in its head - render-blocking, right after the
   shared one - so the page never paints unstyled. Moving between pages in the
   app, Vite loads the next page's sheet before the page renders. */
const manifest = JSON.parse(readFileSync(join(dist, ".vite", "manifest.json"), "utf8"));

function chunksOf(key, order = [], seen = new Set()) {
  if (seen.has(key) || !manifest[key]) return order;
  seen.add(key);
  for (const dependency of manifest[key].imports ?? []) chunksOf(dependency, order, seen);
  order.push(key);
  return order;
}

const loadedByShell = new Set(chunksOf("index.html"));

/* The page's chunks are fetched once the first screen has painted and its LCP
   image (the one marked fetchpriority="high") is in, or after 3s, whichever
   comes first - never with the HTML. Started with the HTML they took the
   bandwidth the hero picture needed (home LCP 1.27s against 0.98s); left to
   the router, React waited a round trip longer for them (3.77s against
   4.10s) - measured at 4x CPU on a 1.6Mbps line. Written as an inline script
   ahead of the stylesheets, so the parser never waits on them to run it. */
function warmScript(files) {
  if (!files.length) return "";
  const hrefs = JSON.stringify(files.map((file) => `/${file}`));
  return `<script>(function(u){var d=0;function go(){if(d)return;d=1;u.forEach(function(h){if(document.querySelector('link[href="'+h+'"]'))return;var l=document.createElement("link");l.rel="modulepreload";l.crossOrigin="";l.href=h;document.head.appendChild(l)})}function painted(){var i=document.querySelector('img[fetchpriority="high"]');if(!i||i.complete)return go();i.addEventListener("load",go);i.addEventListener("error",go)}requestAnimationFrame(function(){setTimeout(painted,0)});setTimeout(go,3000)})(${hrefs})</script>`;
}

function pageAssets(pageModule) {
  if (!manifest[pageModule]) throw new Error(`${pageModule} is not in the build manifest`);
  const chunks = chunksOf(pageModule).filter((key) => !loadedByShell.has(key));
  const css = [...new Set(chunks.flatMap((key) => manifest[key].css ?? []))];
  return {
    warm: warmScript(chunks.map((key) => manifest[key].file)),
    styles: css.map((file) => `<link rel="stylesheet" crossorigin href="/${file}">`),
  };
}
for (const marker of ["<!--app-head-->", "<!--app-html-->"]) {
  if (!template.includes(marker)) throw new Error(`dist/index.html has lost its ${marker} marker`);
}

const errors = [];
const warnings = [];
const host = new URL(SITE_URL).host;
const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------- pixel sizes, for og:image:width / height ---------- */

function imageSize(publicPath) {
  const file = join(dist, publicPath);
  if (!existsSync(file)) return null;
  const buffer = readFileSync(file);
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xff || (marker >= 0xd0 && marker <= 0xd9)) {
        offset += marker === 0xff ? 1 : 2;
        continue;
      }
      const length = buffer.readUInt16BE(offset + 2);
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

/* ---------- the static copy ---------- */

/* The prerendered page is what a crawler, a social preview and a reader
   without JavaScript see, and what React adopts for everyone else (main.jsx).
   framer-motion renders each element at the start of its entrance -
   transparent, shifted, clipped - but the static copy is the finished page:
   readable without JavaScript, and painted whole in the first frame (under
   the curtain or the reload veil). So each starting pose comes out of the
   style attribute and is kept beside it in data-ssr-style, which main.jsx
   puts back just before React adopts the page, so React's first pass and the
   page it adopts match exactly. */
function staticCopy(html) {
  return html.replace(/\sstyle="([^"]*)"/g, (attribute, declarations) => {
    const kept = declarations
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(
        (declaration) =>
          declaration &&
          !/^opacity\s*:\s*0(\.\d+)?$/i.test(declaration) &&
          !/^(transform|clip-path)\s*:/i.test(declaration),
      );
    const full = declarations
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean);
    if (kept.length === full.length) return attribute;
    const style = kept.length ? ` style="${kept.join(";")}"` : "";
    return `${style} data-ssr-style="${declarations}"`;
  });
}

function attribute(tag, name) {
  return new RegExp(`\\s${name}="([^"]*)"`, "i").exec(tag)?.[1];
}

function preloadLink({ href, srcset, sizes, media }) {
  const parts = ['rel="preload"', 'as="image"', 'fetchpriority="high"'];
  if (srcset && /\s\d+[wx]/.test(srcset)) {
    parts.push(`imagesrcset="${srcset}"`);
    if (sizes) parts.push(`imagesizes="${sizes}"`);
  } else {
    parts.push(`href="${href ?? srcset}"`);
  }
  if (media) parts.push(`media="${media}"`);
  return `<link ${parts.join(" ")} />`;
}

/* The first picture a page paints is its LCP element, so it is fetched with
   the HTML rather than after the app: the home film's two posters, or the
   image a page marks fetchpriority="high" (its hero) with the <picture>
   sources around it. */
function preloadsFor(page, html) {
  if (page.path === "/") {
    const video = readJson("src/data/home.json").hero.video;
    return [
      preloadLink({ href: video.desktop.poster, media: "(min-width: 761px)" }),
      preloadLink({ href: video.mobile.poster, media: "(max-width: 760px)" }),
    ];
  }

  const image = /<img\b[^>]*fetchpriority="high"[^>]*>/i.exec(html);
  if (!image) return [];
  const before = html.slice(0, image.index);
  const pictureStart = before.lastIndexOf("<picture");
  const insidePicture = pictureStart > before.lastIndexOf("</picture>");
  const sources = insidePicture
    ? [...before.slice(pictureStart).matchAll(/<source\b[^>]*>/gi)].map((match) => ({
        srcset: attribute(match[0], "srcset"),
        media: attribute(match[0], "media"),
      }))
    : [];
  const links = sources
    .filter((source) => source.srcset)
    .map((source) => preloadLink({ srcset: source.srcset, media: source.media }));
  const others = sources
    .filter((source) => source.media)
    .map((source) => `not all and ${source.media}`);
  links.push(
    preloadLink({
      href: attribute(image[0], "src"),
      srcset: attribute(image[0], "srcset"),
      sizes: attribute(image[0], "sizes"),
      media: others.length === 1 ? others[0] : undefined,
    }),
  );
  return links;
}

/* ---------- dates, for the sitemap ---------- */

/* lastmod is the date the page's own sources last changed in git - or today
   for a file with uncommitted edits. A shallow clone (some CI builds) cannot
   date files honestly, and a wrong lastmod teaches search engines to ignore
   the field, so then it is left out. The first file of each kind is also the
   page's own module - the route's lazy import, whose stylesheet and chunks
   pageAssets() writes into its HTML. */
const SOURCES = {
  home: [
    "src/pages/HomePage.jsx",
    "src/data/home.json",
    "src/data/testimonials.json",
    "src/sections/Hero.jsx",
    "src/sections/ImpactStats.jsx",
    "src/sections/ConditionsCarousel.jsx",
    "src/sections/WhyChooseUs.jsx",
    "src/sections/DoctorHighlights.jsx",
    "src/sections/PatientStories.jsx",
  ],
  journey: [
    "src/pages/AboutJourneyPage.jsx",
    "src/data/about.json",
    "src/sections/JourneyTimeline.jsx",
    "src/sections/AboutHead.jsx",
    "src/sections/AboutNext.jsx",
  ],
  vision: [
    "src/pages/AboutVisionPage.jsx",
    "src/data/about.json",
    "src/sections/VisionStatements.jsx",
    "src/sections/VisionValues.jsx",
    "src/sections/AboutHead.jsx",
    "src/sections/AboutNext.jsx",
  ],
  services: [
    "src/pages/ServicesPage.jsx",
    "src/data/services.json",
    "src/sections/ServiceExplorer.jsx",
    "src/sections/ServicePathway.jsx",
    "src/sections/ServiceEmergency.jsx",
  ],
  service: [
    "src/pages/ServiceDetailPage.jsx",
    "src/data/services.json",
    "src/sections/ServiceHero.jsx",
    "src/sections/ServiceExplore.jsx",
    "src/sections/ServiceVisit.jsx",
    "src/sections/ServiceFaq.jsx",
    "src/sections/ServiceRelated.jsx",
  ],
  doctors: ["src/pages/DoctorsPage.jsx", "src/data/doctors.json", "src/sections/DoctorRoster.jsx"],
  doctor: [
    "src/pages/DoctorProfilePage.jsx",
    "src/data/doctors.json",
    "src/sections/DoctorHero.jsx",
    "src/sections/DoctorVisits.jsx",
    "src/sections/DoctorCare.jsx",
    "src/sections/DoctorColleagues.jsx",
  ],
  branches: [
    "src/pages/BranchesPage.jsx",
    "src/data/branches.json",
    "src/sections/HospitalFinder.jsx",
    "src/components/HospitalMap.jsx",
  ],
  branch: [
    "src/pages/BranchPage.jsx",
    "src/data/branches.json",
    "src/data/doctors.json",
    "src/sections/BranchHero.jsx",
    "src/sections/BranchLocate.jsx",
    "src/sections/BranchTeam.jsx",
    "src/sections/BranchCare.jsx",
    "src/sections/BranchInside.jsx",
    "src/sections/BranchOthers.jsx",
  ],
  appointment: [
    "src/pages/AppointmentPage.jsx",
    "src/data/appointment.json",
    "src/sections/BookingFlow.jsx",
    "src/sections/BookingSteps.jsx",
  ],
  contact: [
    "src/pages/ContactPage.jsx",
    "src/data/contact.json",
    "src/data/branches.json",
    "src/sections/ContactDesk.jsx",
    "src/sections/ContactDirectory.jsx",
  ],
};

function git(args) {
  return execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
}

let datesAvailable = true;
try {
  datesAvailable = git(["rev-parse", "--is-shallow-repository"]) === "false";
} catch {
  datesAvailable = false;
}
if (!datesAvailable) warnings.push("git history unavailable or shallow: sitemap lastmod left out");

const today = new Date().toISOString().slice(0, 10);
function lastModified(kind) {
  if (!datesAvailable) return null;
  const files = (SOURCES[kind] ?? []).filter((file) => existsSync(join(root, file)));
  if (!files.length) return null;
  if (git(["status", "--porcelain", "--", ...files])) return today;
  return git(["log", "-1", "--format=%cs", "--", ...files]) || null;
}

/* ---------- the content security policy ----------
   The site talks to no server and loads nothing from anyone else, so a page
   may run only its own scripts and frame only the hospitals' Google maps. The
   inline scripts each page carries (the curtain's clock and line, the page's
   chunk warmer) are allowed by the hash of their exact text, taken here from
   the page as written, so nothing injected into a page can run. Styles stay
   'unsafe-inline': the static copy carries style attributes and framer-motion
   writes a <style> element for popLayout. It is a <meta> so it holds on every
   host; frame-ancestors cannot be one, and is sent as a header below. */
const CHARSET_TAG = '<meta charset="UTF-8" />';
if (!template.includes(CHARSET_TAG)) throw new Error(`dist/index.html has lost ${CHARSET_TAG}`);

const frameOrigins = [
  ...new Set(
    readJson("src/data/branches.json")
      .items.map((branch) => branch.mapEmbed)
      .filter(Boolean)
      .map((url) => new URL(url).origin),
  ),
];

function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const tag = `<script${attributes}>`;
    const type = attribute(tag, "type");
    if (/\ssrc=/i.test(tag) || (type && !/^(module|text\/javascript)$/i.test(type))) continue;
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return [...hashes];
}

function securityPolicy(html) {
  return [
    "default-src 'self'",
    ["script-src 'self'", ...inlineScriptHashes(html)].join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "media-src 'self'",
    "connect-src 'self'",
    `frame-src ${frameOrigins.join(" ") || "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/* ---------- render ---------- */

function outputFile(path) {
  return path === "/" ? join(dist, "index.html") : join(dist, `${path.slice(1)}.html`);
}

function writePage(path, html, head, extraHead, { warm, styles }) {
  const size = head.imagePath ? imageSize(head.imagePath) : null;
  const document = template
    .replace("<!--app-head-->", () =>
      [headHtml(head, { size }), ...extraHead, warm].filter(Boolean).join("\n    "),
    )
    .replace("</head>", () => `${styles.join("\n    ")}\n  </head>`)
    .replace('<div id="root">', () => `<div id="root" data-path="${path}">`)
    .replace("<!--app-html-->", () => staticCopy(html));
  const policy = `<meta http-equiv="Content-Security-Policy" content="${securityPolicy(document)}" />`;
  const file = outputFile(path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, document.replace(CHARSET_TAG, () => `${CHARSET_TAG}\n    ${policy}`));
}

function checkPage(page, result) {
  const where = page.path;
  const { html, head } = result;
  if (result.redirect) return errors.push(`${where}: redirects to ${result.redirect} - not a page`);
  if (!head?.title) return errors.push(`${where}: no <SEO> head was rendered`);
  if (head.noindex) errors.push(`${where}: renders as noindex (not-found?)`);
  const h1s = html.match(/<h1\b/gi)?.length ?? 0;
  if (h1s !== 1) errors.push(`${where}: ${h1s} <h1> elements (needs exactly one)`);
  const expected = page.path === "/" ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;
  if (head.canonical !== expected)
    errors.push(`${where}: canonical ${head.canonical}, expected ${expected}`);
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${where}: invalid JSON-LD (${error.message})`);
    }
  }
  if (!/application\/ld\+json/.test(html)) errors.push(`${where}: no JSON-LD`);
  if (head.title.length > 65) warnings.push(`${where}: title is ${head.title.length} characters`);
  const length = head.description?.length ?? 0;
  if (length < 70 || length > 165) warnings.push(`${where}: description is ${length} characters`);
}

const pages = getPages();
const rendered = [];
for (const page of pages) {
  const result = await render(page.path);
  checkPage(page, result);
  if (!result.html) continue;
  writePage(
    page.path,
    result.html,
    result.head,
    preloadsFor(page, result.html),
    pageAssets(SOURCES[page.kind][0]),
  );
  rendered.push({ ...page, ...result });
}

for (const field of ["title", "description"]) {
  const seen = new Map();
  for (const page of rendered) {
    const value = page.head[field];
    if (seen.has(value)) errors.push(`${page.path}: same ${field} as ${seen.get(value)}`);
    else seen.set(value, page.path);
  }
}

const notFound = await render(NOT_FOUND_PATH);
if (!notFound.head?.noindex) errors.push(`${NOT_FOUND_PATH}: the not-found page is not noindex`);
writePage(
  NOT_FOUND_PATH,
  notFound.html,
  notFound.head,
  [],
  pageAssets("src/pages/NotFoundPage.jsx"),
);

/* ---------- sitemap.xml and robots.txt ---------- */

/* Each page's own photographs - the images it shows with alt text - plus its
   social image, so image search finds the hospitals and the doctors. */
function pageImages(page) {
  const images = new Set();
  if (page.head.imagePath) images.add(page.head.imagePath);
  for (const match of page.html.matchAll(/<img\b[^>]*>/gi)) {
    const src = attribute(match[0], "src");
    const alt = attribute(match[0], "alt");
    if (src?.startsWith("/assets/media/") && alt) images.add(src);
  }
  return [...images].map((src) => new URL(src, `${SITE_URL}/`).toString());
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ...rendered.map((page) => {
    const lastmod = lastModified(page.kind);
    return [
      "  <url>",
      `    <loc>${escapeXml(page.head.canonical)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      ...pageImages(page).map(
        (src) => `    <image:image><image:loc>${escapeXml(src)}</image:loc></image:image>`,
      ),
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  }),
  "</urlset>",
  "",
].join("\n");
writeFileSync(join(dist, "sitemap.xml"), sitemap);

writeFileSync(
  join(dist, "robots.txt"),
  ["User-agent: *", "Allow: /", "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n"),
);

/* ---------- redirects, headers and clean URLs, per host ---------- */

const redirects = readJson("src/data/redirects.json").permanent;
const pagePaths = new Set(pages.map((page) => page.path));
for (const { from, to } of redirects) {
  if (pagePaths.has(from))
    errors.push(`redirects.json: ${from} is a live page and cannot redirect`);
  if (!pagePaths.has(to))
    errors.push(`redirects.json: ${from} points to ${to}, which is not a page`);
}

const banner = (comment) => [
  `${comment} Generated by scripts/prerender.mjs - edit src/data/redirects.json or the script, not this file.`,
];

/* Cloudflare Pages, Cloudflare Workers static assets and Netlify all read the
   same _redirects syntax (path, target, status). Host-level moves - the apex
   and http to https://www - are set in the host's dashboard; see docs/hosting.md. */
writeFileSync(
  join(dist, "_redirects"),
  [...banner("#"), ...redirects.map(({ from, to }) => `${from} ${to} 301`), ""].join("\n"),
);

/* The security headers every host sends. The page's own policy is the <meta>
   writePage() adds; this one only says who may frame the site. */
const SECURITY_HEADERS = [
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-Frame-Options", "SAMEORIGIN"],
  ["Content-Security-Policy", "frame-ancestors 'self'"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()"],
];
const HSTS = ["Strict-Transport-Security", "max-age=31536000"];

/* Bundles under /assets/app are fingerprinted and never change; photographs
   keep their names when replaced, so they revalidate after a week. Preview
   hosts are kept out of search results. */
writeFileSync(
  join(dist, "_headers"),
  [
    ...banner("#"),
    "/*",
    ...[...SECURITY_HEADERS, HSTS].map(([name, value]) => `  ${name}: ${value}`),
    "/assets/app/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/assets/media/*",
    "  Cache-Control: public, max-age=604800, stale-while-revalidate=86400",
    "/assets/fonts/*",
    "  Cache-Control: public, max-age=31536000",
    "https://:project.pages.dev/*",
    "  X-Robots-Tag: noindex",
    "https://:deployment.:project.pages.dev/*",
    "  X-Robots-Tag: noindex",
    "https://:worker.:account.workers.dev/*",
    "  X-Robots-Tag: noindex",
    "",
  ].join("\n"),
);

/* Apache and LiteSpeed (cPanel, Hostinger and most Indian shared hosting -
   the kind of server the old site ran on). One host, no trailing slashes,
   clean URLs onto the .html files, the redirect map, a real 404, caching and
   the same security headers. */
const wwwHost = escapeRegExp(host);
const apex = escapeRegExp(host.replace(/^www\./, ""));
const htaccess = [
  ...banner("#"),
  "Options -MultiViews -Indexes",
  "DirectorySlash Off",
  "DirectoryIndex index.html",
  "ErrorDocument 404 /404.html",
  "ServerSignature Off",
  "",
  "<IfModule mod_rewrite.c>",
  "  RewriteEngine On",
  "",
  "  # Nothing whose name starts with a dot is served: an old site's .env or",
  "  # .git left in the web root stays private.",
  "  RewriteRule (^|/)\\.(?!well-known/) - [F]",
  "",
  `  # One host: ${SITE_URL}`,
  `  RewriteCond %{HTTP_HOST} ^${apex}$ [NC]`,
  `  RewriteRule ^ ${SITE_URL}%{REQUEST_URI} [R=301,L,NE]`,
  "  RewriteCond %{HTTPS} off",
  "  RewriteCond %{HTTP:X-Forwarded-Proto} !https",
  `  RewriteCond %{HTTP_HOST} ^${wwwHost}$ [NC]`,
  `  RewriteRule ^ ${SITE_URL}%{REQUEST_URI} [R=301,L,NE]`,
  "",
  "  # Moved pages, from src/data/redirects.json (query strings are dropped).",
  ...redirects.flatMap(({ from, to }) =>
    from === "/index.html"
      ? [
          "  RewriteCond %{THE_REQUEST} \\s/index\\.html[\\s?]",
          `  RewriteRule ^index\\.html$ ${to} [R=301,L,QSD]`,
        ]
      : [`  RewriteRule ^${escapeRegExp(from.slice(1))}/?$ ${to} [R=301,L,QSD]`],
  ),
  "",
  "  # No trailing slash, and no .html in the address bar.",
  "  RewriteCond %{REQUEST_URI} ^(.+)/$",
  "  RewriteRule ^ %1 [R=301,L]",
  "  RewriteCond %{THE_REQUEST} \\s/([^?\\s]+)\\.html[\\s?]",
  "  RewriteRule ^ /%1 [R=301,L]",
  "",
  "  # /services/cataract-surgery is served from services/cataract-surgery.html.",
  "  RewriteCond %{REQUEST_FILENAME} !-f",
  "  RewriteCond %{REQUEST_FILENAME}.html -f",
  "  RewriteRule ^(.+)$ $1.html [L]",
  "</IfModule>",
  "",
  "<IfModule mod_headers.c>",
  ...SECURITY_HEADERS.map(([name, value]) => `  Header always set ${name} "${value}"`),
  `  Header always set ${HSTS[0]} "${HSTS[1]}" env=HTTPS`,
  "  Header always unset X-Powered-By",
  '  <FilesMatch "-[A-Za-z0-9_-]{8}\\.(js|css)$">',
  '    Header set Cache-Control "public, max-age=31536000, immutable"',
  "  </FilesMatch>",
  '  <FilesMatch "\\.woff2$">',
  '    Header set Cache-Control "public, max-age=31536000"',
  "  </FilesMatch>",
  '  <FilesMatch "\\.(jpe?g|png|webp|avif|svg|mp4|webm)$">',
  '    Header set Cache-Control "public, max-age=604800, stale-while-revalidate=86400"',
  "  </FilesMatch>",
  '  <FilesMatch "\\.html$">',
  '    Header set Cache-Control "public, max-age=0, must-revalidate"',
  "  </FilesMatch>",
  "</IfModule>",
  "",
  "<IfModule mod_mime.c>",
  "  AddType application/xml .xml",
  "  AddType video/webm .webm",
  "  AddType font/woff2 .woff2",
  "</IfModule>",
  "",
].join("\n");
writeFileSync(join(dist, ".htaccess"), htaccess);

/* Cloudflare Workers uploads everything in dist/; the Apache file is not for it. */
writeFileSync(join(dist, ".assetsignore"), ".htaccess\n");

/* Finder and Windows leave their own files in public/, and Vite copies public/
   as it is: a deployed .DS_Store lists its folder's files to anyone who asks. */
for (const entry of readdirSync(dist, { recursive: true })) {
  if (/(^|[\\/])(\.DS_Store|Thumbs\.db|desktop\.ini)$/i.test(entry)) rmSync(join(dist, entry));
}

/* ---------- report ---------- */

rmSync(serverDir, { recursive: true, force: true });
rmSync(join(dist, ".vite"), { recursive: true, force: true });

for (const warning of warnings) console.warn(`  warn  ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`  error ${error}`);
  console.error(`\nprerender: ${errors.length} error(s) - not shipping.`);
  process.exit(1);
}
console.log(
  `prerender: ${rendered.length} pages, 404.html, sitemap.xml (${rendered.length} URLs), robots.txt, ${redirects.length} redirects for ${host}`,
);
