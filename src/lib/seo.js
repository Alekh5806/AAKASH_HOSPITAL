import { createContext } from "react";
import { site } from "./coreData";

/* One place decides every absolute URL the site prints: canonicals, Open Graph,
   JSON-LD ids, the sitemap and robots.txt all read SITE_URL, so moving the
   canonical host is a one-line change in site.json. */
export const SITE_URL = site.defaultSeo.url.replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

/* The canonical form of a path: no query string, no fragment, no trailing
   slash (Cloudflare serves /services and redirects /services/ to it), and
   only the root keeps its slash. */
export function canonicalPath(pathname = "/") {
  const path = pathname.split(/[?#]/)[0].replace(/\/{2,}/g, "/");
  if (path === "" || path === "/") return "/";
  return path.replace(/\/+$/, "");
}

const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

/* Resolves a page's `seo` block against the site defaults into the full head
   the page should carry. Pure, so the prerender and the browser agree. */
export function buildHead(meta = {}, pathname = "/") {
  const resolved = { ...site.defaultSeo, ...meta };
  const canonical = absoluteUrl(resolved.path ?? canonicalPath(pathname));
  const image = resolved.image ? absoluteUrl(resolved.image) : "";

  return {
    title: resolved.title,
    description: resolved.description,
    robots: resolved.robots || DEFAULT_ROBOTS,
    canonical,
    ogTitle: resolved.ogTitle || resolved.title,
    ogDescription: resolved.ogDescription || resolved.description,
    ogType: resolved.ogType || "website",
    image,
    imagePath: resolved.image || "",
    imageAlt: resolved.imageAlt || resolved.ogTitle || resolved.title,
    noindex: /noindex/i.test(resolved.robots || ""),
  };
}

/* The tags a head carries, as plain data: the prerender serialises them, the
   browser writes them. `size` is the image's pixel size where the caller
   knows it (the prerender reads it off the file); a browser navigating
   between pages does not need it - social crawlers only read the HTML. */
export function headTags(head, { size } = {}) {
  /* A page that asks not to be indexed (the not-found page) names no
     canonical: there is no URL it stands for. */
  const url = head.noindex ? "" : head.canonical;
  const tags = [
    { tag: "meta", attrs: { name: "description", content: head.description } },
    { tag: "meta", attrs: { name: "robots", content: head.robots } },
    { tag: "link", attrs: { rel: "canonical", href: url } },
    { tag: "meta", attrs: { property: "og:site_name", content: site.brand.name } },
    { tag: "meta", attrs: { property: "og:locale", content: "en_IN" } },
    { tag: "meta", attrs: { property: "og:type", content: head.ogType } },
    { tag: "meta", attrs: { property: "og:url", content: url } },
    { tag: "meta", attrs: { property: "og:title", content: head.ogTitle } },
    { tag: "meta", attrs: { property: "og:description", content: head.ogDescription } },
  ];

  if (head.image) {
    tags.push({ tag: "meta", attrs: { property: "og:image", content: head.image } });
    if (size) {
      tags.push(
        { tag: "meta", attrs: { property: "og:image:width", content: String(size.width) } },
        { tag: "meta", attrs: { property: "og:image:height", content: String(size.height) } },
      );
    }
    tags.push({ tag: "meta", attrs: { property: "og:image:alt", content: head.imageAlt } });
  }

  tags.push(
    { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
    { tag: "meta", attrs: { name: "twitter:title", content: head.ogTitle } },
    { tag: "meta", attrs: { name: "twitter:description", content: head.ogDescription } },
  );
  if (head.image) {
    tags.push(
      { tag: "meta", attrs: { name: "twitter:image", content: head.image } },
      { tag: "meta", attrs: { name: "twitter:image:alt", content: head.imageAlt } },
    );
  }

  /* Search engine ownership tokens, when site.json carries them (a DNS record
     is the better proof, and needs nothing here). */
  const verification = site.verification ?? {};
  tags.push(
    { tag: "meta", attrs: { name: "google-site-verification", content: verification.google } },
    { tag: "meta", attrs: { name: "msvalidate.01", content: verification.bing } },
  );

  return tags.filter((entry) => Object.values(entry.attrs).every((value) => value));
}

/* The prerender passes a function here and receives each page's resolved head
   during render, so the static HTML carries the same title, description,
   canonical and social tags the browser sets. In the browser there is no
   provider and SEO applies the head in an effect. */
export const HeadCollectorContext = createContext(null);

const MANAGED = "data-seo";

/* The browser's half: replaces whatever head the previous page (or the
   prerender) left with this page's. Every tag it owns carries data-seo, so a
   page without an image cannot inherit the last page's og:image. */
export function applyHead(head) {
  document.title = head.title;
  document.head.querySelectorAll(`[${MANAGED}]`).forEach((element) => element.remove());

  let previous = document.head.querySelector("title");
  for (const { tag, attrs } of headTags(head)) {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
    element.setAttribute(MANAGED, "");
    document.head.insertBefore(element, previous?.nextSibling ?? null);
    previous = element;
  }
}

/* The prerender's half: the same tags as HTML, marked so the browser's first
   applyHead() replaces them rather than doubling them. */
export function headHtml(head, { size } = {}) {
  const escape = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const tags = headTags(head, { size }).map(({ tag, attrs }) => {
    const attributes = Object.entries(attrs)
      .map(([name, value]) => `${name}="${escape(value)}"`)
      .join(" ");
    return `<${tag} ${attributes} ${MANAGED} />`;
  });
  return [`<title>${escape(head.title)}</title>`, ...tags].join("\n    ");
}
