# Hosting and launch

The hosting platform is not chosen yet, so the build supports every likely one.
`npm run build` writes a complete static site to `dist/`:

| File                                                                      | What it is                                                                                  | Read by                                                                 |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `index.html`, `about/journey.html`, `services/cataract-surgery.html`, ... | Every page prerendered, with its own title, description, canonical, social tags and JSON-LD | every host                                                              |
| `404.html`                                                                | The not-found page (`noindex`)                                                              | every host; see the 404 rows below                                      |
| `sitemap.xml`, `robots.txt`                                               | Generated from the data on every build                                                      | every host                                                              |
| `_redirects`                                                              | The 301 map from `src/data/redirects.json`                                                  | Cloudflare Pages, Cloudflare Workers, Netlify                           |
| `_headers`                                                                | Caching, security headers, `noindex` on preview hosts                                       | Cloudflare Pages, Cloudflare Workers, Netlify                           |
| `.htaccess`                                                               | Redirects, clean URLs, trailing slash, one host, 404, caching, security headers, no dotfiles | Apache and LiteSpeed (cPanel, Hostinger and most Indian shared hosting) |
| `.assetsignore`                                                           | Keeps `.htaccess` out of a Cloudflare Workers upload                                        | Cloudflare Workers                                                      |

**Canonical URL form:** `https://www.aakasheyehospital.com/services/cataract-surgery`. That means `https`, the `www` host, no trailing slash and no `.html`. Every page declares it as its canonical, and the sitemap lists only these URLs.

## The two jobs every host needs, outside the code

1. **Send everything to one host.** `http://`, `https://aakasheyehospital.com` and every variant must answer with a `301` to `https://www.aakasheyehospital.com` on the same path. The old site answers 200 on all of them today, which splits its ranking signals.
2. **Serve `404.html` with a real 404 status** for any path that is not a page or a redirect.

Per platform:

### Cloudflare Workers (static assets): `wrangler.jsonc` is already set

- `not_found_handling: "404-page"` serves `dist/404.html` with status 404.
- `html_handling: "drop-trailing-slash"` serves `/services` from `services.html` and redirects `/services/` and `/services.html` to it.
- `_redirects` and `_headers` are applied automatically.
- **In the dashboard:** add `www.aakasheyehospital.com` as the Worker's custom domain. Then add a Redirect Rule (Rules > Redirect Rules > "Redirect from root to WWW") sending `aakasheyehospital.com/*` to `https://www.aakasheyehospital.com/${1}` with status 301 and the query string preserved. Finally, turn on SSL/TLS > Edge Certificates > **Always Use HTTPS**.

### Cloudflare Pages

- Build command `npm run build`, output directory `dist`.
- Because `404.html` exists, Pages turns off single-page-app mode and returns 404 for unknown paths, which is what we want.
- `/services` is served from `services.html`, and `_redirects` and `_headers` are applied.
- **In the dashboard:** add `www.aakasheyehospital.com` as the custom domain, add the same root-to-www Redirect Rule, and turn on Always Use HTTPS.
- `*.pages.dev` preview URLs get `X-Robots-Tag: noindex` from `_headers`.

### Netlify

- Build `npm run build`, publish `dist`. `_redirects`, `_headers` and `404.html` work as they are, and pretty URLs serve `/services` from `services.html`.
- **In Domain settings:** set `www.aakasheyehospital.com` as the primary domain (Netlify then 301s the apex to it) and turn on HTTPS. Deploy previews are `noindex` by default.

### Apache or LiteSpeed (cPanel, Hostinger, the old site's kind of server)

- Upload the **contents** of `dist/`, including the hidden `.htaccess`, to the web root, replacing the old PHP site.
- `.htaccess` already handles the move to `https://www`, the redirect map, `/services` from `services.html`, slash-less URLs, `ErrorDocument 404 /404.html` and caching. It needs `mod_rewrite` and `mod_headers`, which nearly every host has on.
- **Delete the old `.php` files** after uploading. The redirects work either way, but the files shouldn't stay reachable by any other route.
- Install an SSL certificate first (AutoSSL or Let's Encrypt in cPanel). The https redirect assumes one exists.

### Vercel (if chosen)

Vercel reads its configuration from the repository, not from `dist/`. Add a root `vercel.json` with `"cleanUrls": true`, `"trailingSlash": false`, and a `redirects` array mirroring `src/data/redirects.json` (each with `"permanent": true`). Static `404.html` is served with a 404 automatically. Set `www` as the primary domain in the project's domain settings.

### Nginx (a VPS)

```nginx
server {
  listen 443 ssl http2;
  server_name www.aakasheyehospital.com;
  root /var/www/aakash/dist;
  include /var/www/aakash/redirects.conf;   # one "location = /old { return 301 /new; }" per redirect
  rewrite ^/(.+)/$ /$1 permanent;           # no trailing slash
  location / { try_files $uri $uri.html $uri/index.html =404; }
  error_page 404 /404.html;
  location /assets/app/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
  location ~ /\.(?!well-known/) { deny all; }
  # The headers _headers sends (nginx drops server-level add_header in any location that sets its own).
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header Content-Security-Policy "frame-ancestors 'self'" always;
  add_header Cross-Origin-Opener-Policy "same-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
  add_header Strict-Transport-Security "max-age=31536000" always;
  server_tokens off;
}
server { listen 80; listen 443 ssl; server_name aakasheyehospital.com; return 301 https://www.aakasheyehospital.com$request_uri; }
server { listen 80; server_name www.aakasheyehospital.com; return 301 https://www.aakasheyehospital.com$request_uri; }
```

## Security

The site is static: no server code, no database, no login, nothing posted anywhere. The booking form builds a WhatsApp message in the browser and the patient sends it from WhatsApp. That leaves a small attack surface, and the build covers it:

- **Every page carries its own Content-Security-Policy** as a `<meta>` tag, which `scripts/prerender.mjs` writes. Scripts may come only from the site itself, plus the page's inline scripts, allowed by the hash of their exact text. That means nothing injected into a page can run. The only thing it frames is the hospitals' Google maps (`www.google.com`, taken from `mapEmbed` in `branches.json`). Nothing is fetched from another origin, and there is no `eval` (zod runs `jitless` for this reason).
- **Every host sends the same headers** (`_headers`, `.htaccess`, and the nginx block above): `nosniff`, a referrer policy, `frame-ancestors 'self'` with `X-Frame-Options` (no other site can frame the pages), `Cross-Origin-Opener-Policy`, a `Permissions-Policy` refusing camera, microphone, location, payment and USB, and HSTS.
- **Nothing private is in `dist/`**: no source maps, no build manifest, no environment variables. The `.DS_Store` files Finder leaves in `public/` are deleted from the build.

What the host has to do:

1. **HTTPS everywhere** (the two jobs above), with "Always Use HTTPS" on. HSTS is one year without `includeSubDomains`. Add that, and HSTS preload, only once every subdomain (including `blog.`) serves HTTPS.
2. **Nothing may inject scripts into the pages.** The policy would block them, and the block shows as a console error. On Cloudflare, keep **Rocket Loader**, **Zaraz** and the automatic **Web Analytics** snippet off. If analytics is ever added, add its origin to `securityPolicy()` in `scripts/prerender.mjs` and load it only after `allowsCategory("analytics")` (see Cookie consent in `CLAUDE.md`).
3. **On Apache / cPanel, clear the web root** before uploading: the old site's `.php` files, any `.sql`, `.zip` or `.bak` backups, and old config files. `.htaccess` refuses every dotfile (`.env`, `.git`), but it cannot hide a backup with an ordinary name.
4. **Turn on two-factor login** for the hosting account, the domain registrar, the DNS provider and the GitHub account. Whoever controls any of these controls the site.

After launch, check the headers with `curl -sI https://www.aakasheyehospital.com/services` or securityheaders.com. Expect a missing full CSP header there: the policy is in each page's `<meta>`, which those tools do not read.

## Other hosts the hospital controls

- **`blog.aakasheyehospital.com`**: a 2021 WordPress blog with four posts. If it goes down with the old hosting, redirect each post at the host level (a Cloudflare Bulk Redirect, or the blog host's own redirect) to the matching page:
  - `/what-is-cataract-what-are-its-causes-and-symptoms/` → `/services/cataract-surgery`
  - `/know-more-about-cataract-surgery-its-advantages-and-disadvantages/` → `/services/cataract-surgery`
  - `/what-is-lasik-surgery-and-how-should-a-patient-prepare-for-it/` → `/services/lasik-refractive-surgery`
  - `/what-to-do-and-not-to-do-after-you-undergo-lasik-eye-surgery/` → `/services/lasik-refractive-surgery`
  - everything else → `https://www.aakasheyehospital.com/`
- **`aehbharuch.com`**: a second, unfinished Bharuch website (placeholder "Doctor Name" headings, the same address and phone). It competes with `/branches/bharuch` for the same searches. If the hospital owns the domain, 301 the whole domain to `https://www.aakasheyehospital.com/branches/bharuch`.

## Launch day, in order

1. Deploy, then confirm `https://www.aakasheyehospital.com/` serves the new home page.
2. Check the redirects with `curl -I`:
   - `http://aakasheyehospital.com/` → 301 to `https://www.aakasheyehospital.com/`
   - `/cataract.php` → 301 to `/services/cataract-surgery`
   - `/team_details.php?team_id=3` → 301 to `/doctors`
   - `/services/cataract-surgery/` → redirect to the slash-less URL
   - `/nonexistent` → 404
3. **Google Search Console**:
   - Add a **Domain property** for `aakasheyehospital.com`, verified by a DNS TXT record. That covers every host and protocol, with nothing needed in the code. If a URL-prefix property is used instead, put the HTML-tag token in `site.verification.google` and rebuild.
   - Submit `https://www.aakasheyehospital.com/sitemap.xml`.
   - In URL Inspection, request indexing for the home page, the six hospital pages, the cataract, LASIK and glaucoma pages and the doctors index.
   - Don't use the Change of Address tool: the domain is the same.
4. **Bing Webmaster Tools**: import the site from Search Console (or set `site.verification.bing`) and submit the sitemap. Bing's index also feeds several AI assistants' web results.
5. Leave the old sitemap URLs out of the new sitemap (they now redirect). Search engines recrawl them and follow the 301s.

## The first 30 days

| When          | Check                                                                                                                                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily, week 1 | Search Console > Pages: the new URLs moving to "Indexed", and old `.php` URLs reported as "Page with redirect" (expected). Any "Not found (404)" for an old URL means a missing redirect: add it to `src/data/redirects.json`.                                                                           |
| Daily, week 1 | Search Console > Sitemaps: 44 discovered (more as doctors and services are added), 0 errors.                                                                                                                                                                                                             |
| Weekly        | Performance report: clicks and impressions for brand queries (`aakash eye hospital`, `akash eye hospital`) and the town queries (`eye hospital visnagar`, `... himmatnagar`, `... bharuch`, `... odhav`). A dip in weeks 1-2 is normal during a move. A dip still present in week 4 needs investigating. |
| Weekly        | Enhancements: Breadcrumbs valid, FAQ items valid (FAQ rich results are limited to well-known health sites, so the markup is there but showing them is Google's choice), no unparsable structured data.                                                                                                   |
| Week 2        | Core Web Vitals report (field data needs 28 days of Chrome traffic): LCP, INP and CLS on mobile.                                                                                                                                                                                                         |
| Week 4        | Compare clicks with the 4 weeks before launch. Re-request indexing for any key page that is still not indexed.                                                                                                                                                                                           |
