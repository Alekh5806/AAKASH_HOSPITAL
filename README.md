# Aakash Eye Hospital

Production-ready React/Vite website for Aakash Eye Hospital. Content is driven by JSON files in `src/data`, with reusable React sections, route-level code splitting, Framer Motion animation, SEO metadata, JSON-LD, and an appointment flow that composes a WhatsApp booking request for the chosen hospital.

## Setup

```bash
npm install
npm run dev
```

Build and checks:

```bash
npm run lint
npm run build
npm run preview
```

## Environment

No environment variables are needed. The appointment page (`/appointment`) builds a WhatsApp message from the reader's answers (`src/lib/appointmentData.js`) and opens it against the chosen hospital's `whatsappNumber` in `branches.json`; nothing is posted to a server.

## Editing Content

All editable site content lives in `src/data`:

- `site.json`: brand, logo, global CTAs, SEO defaults, business hours, footer and cookie consent copy
- `navigation.json`: header navigation and the footer's two page-link columns
- `theme.json`: colors, fonts, radius and shadows
- `home.json`: hero, impact numbers, conditions picker, trust tiles, doctor highlights and patient voices
- `about.json`: the journey timeline and the vision, mission and core values
- `services.json`: the services index, the eleven services and their detail pages
- `doctors.json`: doctor and optometry team profiles
- `branches.json`: addresses, phone groups, email, maps, WhatsApp numbers and each hospital's own page
- `contact.json`: the contact page's copy (every number on it comes from `branches.json`)
- `appointment.json`: the booking flow's steps, fields, slip and WhatsApp message templates
- `testimonials.json`: patient quotes
- `gallery.json`: facility and social activity media

See `src/data/README.md` for editor-friendly examples.

## Language Support

Version 1 is English-only. Every visible string lives in `src/data`, so a second language would be a second set of JSON files rather than a change to any component.

## Cloudflare Pages Deployment

1. Push the repository to GitHub or another Git provider.
2. In Cloudflare Pages, create a project from the repo.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Deploy. Cloudflare Pages will serve `public/robots.txt`, `public/sitemap.xml`, and built assets from `dist`.

`wrangler.jsonc` describes the same deployment for the Wrangler CLI: it serves `dist` as a single-page app, so every route falls back to `index.html`.

## Dependency List

Runtime:

- `react`
- `react-dom`
- `react-router-dom`
- `framer-motion`
- `lucide-react`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`

Development:

- `vite`
- `@vitejs/plugin-react`
- `eslint`
- `@eslint/js`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `prettier`

## File Tree

```text
.
├── .gitignore
├── .prettierrc
├── CLAUDE.md
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── vite.config.js
├── wrangler.jsonc
├── public
│   ├── assets
│   │   ├── logo.png
│   │   └── media
│   │       ├── branches
│   │       ├── conditions
│   │       ├── doctors
│   │       ├── gallery
│   │       ├── heroes
│   │       ├── journey
│   │       ├── page-headers
│   │       ├── services
│   │       └── stock
│   ├── robots.txt
│   └── sitemap.xml
└── src
    ├── components   shared UI primitives and layout
    ├── data         all editable content (see data/README.md)
    ├── lib          data access, validation and link helpers
    ├── pages        one file per route, lazy-loaded from router.jsx
    ├── sections     page sections composed by the pages
    ├── styles       global.css, system.css and one namespaced sheet per surface
    ├── main.jsx
    └── router.jsx
```

`CLAUDE.md` carries the full file-by-file tree and the reasoning behind every section.

## Testing Checklist

- Run `npm run lint`.
- Run `npm run build`.
- Start `npm run dev` and check every route: `/`, `/about/journey`, `/about/vision`, `/services`, `/services/:slug`, `/doctors`, `/branches`, `/branches/:slug`, `/gallery`, `/appointment`, `/contact`, and a missing route.
- Test mobile menu open, focus movement, route click close, and Escape close.
- Test route transitions and prefers-reduced-motion in browser dev tools.
- Walk the appointment flow to `Send on WhatsApp`; confirm the chosen hospital's number and the message text are correct.
- Run Lighthouse mobile for Performance, Accessibility, Best Practices and SEO.

## Assumptions And TODOs

- Legacy content came from `https://aakasheyehospital.com/` and linked legacy pages.
- Ahmedabad OPD mobile differs between the project brief and legacy site. `branches.json` uses the brief value `+91-937-415-1616`; verify before launch.
- Map coordinates are approximate and marked in `branches.json`; verify before launch.
- Doctor bios are concise placeholders based on available qualifications and roles; replace with approved biographies.
- Business hours are placeholders; confirm current OPD timings by branch.
- The years-of-service stat is modernized from the 8 August 1993 founding date.
