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

- `site.json`: brand, logo, global CTAs, SEO defaults, footer, business hours
- `navigation.json`: header and footer navigation
- `theme.json`: colors, fonts, radius and shadows
- `home.json`: hero, stats, timeline, mission/vision and homepage CTA
- `services.json`: service cards, service detail pages and FAQs
- `doctors.json`: doctor and optometry team profiles
- `branches.json`: addresses, phone groups, email, maps and WhatsApp numbers
- `testimonials.json`: patient quotes
- `gallery.json`: facility and social activity media

See `src/data/README.md` for editor-friendly examples.

## Language Support

Version 1 is English-only. The lightweight helper in `src/i18n/strings.js` keeps shared text centralized so a future locale dictionary can be added without restructuring page components. Future translated JSON can follow the same shapes currently validated in `src/lib/schemas.js`.

## Cloudflare Pages Deployment

1. Push the repository to GitHub or another Git provider.
2. In Cloudflare Pages, create a project from the repo.
3. Set the build command to `npm run build`.
4. Set the output directory to `dist`.
5. Deploy. Cloudflare Pages will serve `public/robots.txt`, `public/sitemap.xml`, and built assets from `dist`.

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
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
│   ├── assets
│   │   ├── logo.png
│   │   └── media
│   │       ├── doctors
│   │       ├── gallery
│   │       └── heroes
│   ├── robots.txt
│   └── sitemap.xml
├── src
│   ├── components
│   ├── data
│   │   ├── README.md
│   │   ├── branches.json
│   │   ├── doctors.json
│   │   ├── gallery.json
│   │   ├── home.json
│   │   ├── navigation.json
│   │   ├── services.json
│   │   ├── site.json
│   │   ├── testimonials.json
│   │   └── theme.json
│   ├── i18n
│   ├── lib
│   ├── main.jsx
│   ├── pages
│   ├── router.jsx
│   ├── sections
│   ├── styles
│   └── types
└── vite.config.js
```

## Testing Checklist

- Run `npm run lint`.
- Run `npm run build`.
- Start `npm run dev` and check every route: `/`, `/about`, `/services`, `/services/:slug`, `/doctors`, `/branches`, `/gallery`, `/appointment`, `/contact`, and a missing route.
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
