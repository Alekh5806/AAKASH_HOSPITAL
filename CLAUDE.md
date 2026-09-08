# Aakash Eye Hospital Project Guide

This project is a production-ready, mobile-first website for Aakash Eye Hospital. The goal is to present a clear, premium, trustworthy, and easy-to-use digital experience for a multi-branch eye hospital. Most visitors are expected to use mobile devices, so every implementation decision must protect small-screen usability first.

## Product Direction

- Build a direct, simple, patient-friendly hospital website, not a complex web app.
- Prioritize fast navigation to services, doctors, hospitals, contact numbers, WhatsApp, maps, and appointment booking.
- Keep pages focused and easy to scan. Avoid long marketing sections, unnecessary animations, and complicated interactions.
- Design for a world-class multi-branch eye hospital: professional, clinical, calm, trustworthy, and polished.
- Mobile UI/UX is the primary experience. Desktop must still look premium, but mobile should never feel like an afterthought.
- Content should be clear for patients and families, including older users who may need larger touch targets, readable text, and obvious actions.

## Tech Stack

Runtime:

- React 19
- React DOM 19
- React Router DOM 7
- Vite 8
- Framer Motion for controlled animation
- Lucide React for icons
- React Hook Form for forms
- Zod and `@hookform/resolvers` for validation

Development:

- ESLint 9 with React, hooks, and refresh plugins
- Prettier 3
- Cloudflare Pages compatible static deployment

Important commands:

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

Deployment target:

- Build command: `npm run build`
- Output directory: `dist`
- Public static assets served from `public`
- Required production environment variable: `VITE_WEB3FORMS_ACCESS_KEY`

## Current File Structure

```text
.
|-- claude.md
|-- eslint.config.js
|-- index.html
|-- package.json
|-- README.md
|-- vite.config.js
|-- public
|   |-- robots.txt
|   |-- sitemap.xml
|   `-- assets
|       `-- media
|           |-- conditions
|           |-- doctors
|           |-- gallery
|           |-- heroes
|           |-- page-headers
|           `-- stock
`-- src
    |-- main.jsx
    |-- router.jsx
    |-- assets
    |   `-- images
    |-- components
    |   |-- AppPreloader.jsx
    |   |-- ButtonLink.jsx
    |   |-- CookieConsent.jsx
    |   |-- CountUp.jsx
    |   |-- Footer.jsx
    |   |-- Header.jsx
    |   |-- HydrateFallback.jsx
    |   |-- JsonLd.jsx
    |   |-- LazyMapFrame.jsx
    |   |-- PageHeader.jsx
    |   |-- Reveal.jsx
    |   |-- SEO.jsx
    |   |-- SmartImage.jsx
    |   `-- ThemeTokens.jsx
    |-- data
    |   |-- about.json
    |   |-- branches.json
    |   |-- doctors.json
    |   |-- gallery.json
    |   |-- home.json
    |   |-- navigation.json
    |   |-- README.md
    |   |-- services.json
    |   |-- site.json
    |   |-- testimonials.json
    |   `-- theme.json
    |-- i18n
    |   `-- strings.js
    |-- lib
    |   |-- aboutData.js
    |   |-- contact.js
    |   |-- coreData.js
    |   |-- data.js
    |   |-- doctorsData.js
    |   |-- galleryData.js
    |   |-- homeData.js
    |   |-- icons.js
    |   |-- motion.js
    |   |-- schemas.js
    |   |-- servicesData.js
    |   |-- submitAppointment.js
    |   `-- testimonialsData.js
    |-- pages
    |   |-- AboutJourneyPage.jsx
    |   |-- AboutVisionPage.jsx
    |   |-- AppointmentPage.jsx
    |   |-- BranchesPage.jsx
    |   |-- ContactPage.jsx
    |   |-- DoctorsPage.jsx
    |   |-- GalleryPage.jsx
    |   |-- HomePage.jsx
    |   |-- NotFoundPage.jsx
    |   |-- ServiceDetailPage.jsx
    |   `-- ServicesPage.jsx
    |-- sections
    |   |-- AboutSwitch.jsx          (both about pages)
    |   |-- BranchCards.jsx          (branches page)
    |   |-- ConditionsCarousel.jsx   (home)
    |   |-- CTASection.jsx
    |   |-- DoctorGrid.jsx           (doctors page)
    |   |-- DoctorHighlights.jsx     (home)
    |   |-- FAQ.jsx                  (service detail page)
    |   |-- Gallery.jsx
    |   |-- Hero.jsx                 (home)
    |   |-- ImpactStats.jsx          (home)
    |   |-- PageIntroGrid.jsx
    |   |-- PatientStories.jsx       (home)
    |   |-- ServiceGrid.jsx          (services page)
    |   `-- WhyChooseUs.jsx          (home)
    |-- styles
    |   |-- global.css
    |   |-- system.css
    |   |-- header.css
    |   |-- landing.css
    |   |-- about.css
    |   |-- footer.css
    |   `-- cookie.css
    `-- types
        `-- types.js
```

## Architecture Rules

- Pages live in `src/pages` and are loaded through `src/router.jsx` using lazy route modules.
- Reusable page sections live in `src/sections`.
- Shared UI primitives and layout components live in `src/components`.
- Editable content belongs in `src/data` JSON files whenever possible.
- Data access and validation helpers belong in `src/lib`.
- Global styling lives in `src/styles/global.css`; keep changes scoped and avoid unrelated rewrites.
- Namespaced stylesheets own their own components and are imported from `src/main.jsx` after `global.css`: the site header owns `src/styles/header.css` (`.hd` / `.hd__*`), the landing page owns `src/styles/landing.css` (`.lp-`), the footer owns `src/styles/footer.css` (`.ft-`), the two About pages own `src/styles/about.css` (`.ab-`), and the cookie consent owns `src/styles/cookie.css` (`.ck` / `.ck__*`). Never restyle these components from `global.css` or `system.css` - the header in particular used to be styled from three places at once, and one source of truth is what keeps it predictable.
- `src/lib/contact.js` holds the shared phone/WhatsApp/map link helpers. Use it instead of re-declaring `cleanTel`, `getPrimaryPhone`, `buildWhatsApp` or `buildMapLink` in a component.
- Public media should live under `public/assets/media` and be referenced with `/assets/media/...` paths. The hero film lives in `heroes/` alongside the stills.
- Prefer existing helpers such as `SEO`, `JsonLd`, `ButtonLink`, `SmartImage`, `Reveal`, and `LazyMapFrame` before creating new primitives.
- Remove dead components, imports, CSS selectors, and unused assets when a section is removed. This site must stay clean and deployment-ready.

## Landing Page Structure

The home page (`src/pages/HomePage.jsx`) renders, in order:

1. `Hero` - full-bleed hospital film with a serif accent headline, one primary CTA, a branch call link and a three-stat trust row.
2. `ImpactStats`
3. `ConditionsCarousel`
4. `WhyChooseUs`
5. `DoctorHighlights`
6. `PatientStories`

The page ends there, on the patient wall, and the footer carries the closing appointment CTA. Ten sections used to follow it - `StorySpread`, `TreatmentIndex`, `FeatureSpread`, `TechnologyBand`, `FacilityStrip`, `Timeline`, `SpecialistsRail`, `BranchLocator`, `FAQ` and `AppointmentBand` - and all ten were the pre-rebuild landing page. They were removed rather than reordered: each was built to a different reference from the six above it, and keeping them would have meant the page introduced the doctors twice (`SpecialistsRail` repeated `DoctorHighlights`) and the branches three times. Their section files, their `.e-index` / `.e-feature` / `.e-people` / `.e-loc` / `.e-close` / `.e-story` / `.e-tech` / `.e-facility` / `.e-time` rules in `landing.css`, and their `home.json` keys (`featuredServiceIds`, `quickTreatments`, `story`, `technology`, `facility`, `closing`) are gone with them. `FAQ.jsx` survives because `ServiceDetailPage` renders it; the home page's `FAQJsonLd` went with the visible FAQ, since structured data has to describe content the reader can actually see. Anything that replaces them is built one component at a time.

### Hero

`src/sections/Hero.jsx` owns the `.e-hero` rules at the top of `src/styles/landing.css`.

- The hero is a muted, looping film of the hospital - the building, the atrium reception, an examination room - following the Function Health reference. It replaced a still macro photograph of an eye; `eye-macro-wide.jpg` went with it.
- The source is a 6.9s 4K60 clip that is 100MB and unusable as shipped. Everything under `public/assets/media/heroes/hero-*` is encoded from it and must be re-encoded, never hand-edited. The recipe: crop `3688:2074:0:40` first, because the scenes after the first are composited inside a 3688x2154 box and carry black padding on the right and bottom edges that `cropdetect` will not find on its own (the opening exterior shot fills the full 3840x2160, so there is no bar spanning the whole frame). Then 1920x1080 for the landscape cut and a centred `1556:2074:1066:40` crop scaled to 900x1200 for the phone. Audio is stripped - autoplay requires it and the file does not need it.
- Two encodes rather than one CSS crop. `cover` in a portrait box would throw away two thirds of the landscape frame and still push the full 1920px width over mobile data; the 3:4 cut is framed for the phone and is a third of the bytes (webm 570KB against 1.25MB). `usePhoneVariant()` picks between them with `matchMedia` at the same 760px the layout breaks at, and the `key` on the element forces the reload when it changes.
- webm (VP9) first, mp4 (H.264) second, so the smaller file wins wherever it is understood.
- The phone crop also excludes the generator watermark that sits in the lower right of the source. The landscape cut still contains it.
- The film is not load-bearing. A poster frame carries the same scene, is what `prefers-reduced-motion` opens on, and is what stays if the video never arrives; it is preloaded per breakpoint from `index.html` because it is the LCP element.
- `.e-hero__media` is `z-index: 0`, not `-1`. The pause control lives inside it so it can sit in the corner of the film at every width, and a negative layer would put it behind the section and out of reach of the pointer. `.e-hero__inner` sits above it at `z-index: 1`.
- The control's label and `aria-pressed` follow the element's own `play`/`pause` events rather than the click, because autoplay can be refused (iOS Low Power Mode, a data saver, a browser policy) and the button has to show what actually happened.
- The element sets `muted` as an attribute as well as a property (React only does the latter, and Safari wants the attribute on the element it is asked to autoplay) and carries `disablePictureInPicture`, `disableRemotePlayback` and `controlsList`. A browser that refuses the film tends to paint its own play affordance over it, and the hero already has one control; there should never be two.
- The film pauses when it leaves the screen and resumes when it comes back, but a deliberate pause is remembered in `pausedByUserRef` and survives the round trip. Do not let the observer override it.
- Art direction still changes at 760px, but no longer by demoting the media to a band - the portrait encode is cut for that box and renders about 1:1 on a 3x screen. The section becomes a two-row grid: the film and the copy share the first row, and the stat row gets a solid navy band underneath, which is the reference layout. `.e-hero__inner` takes `display: contents` so its two children can hold their own rows; both then carry the shell width themselves. It is a plain div, so dissolving its box costs nothing semantically - do not do this to an element with an implicit ARIA role.
- The phone hero carries the headline and `Book appointment`, nothing else. The supporting sentence (`.e-hero__lede`) and the `Call OPD` link are hidden at <= 760px, matching the reference's single-CTA first screen. They are dropped rather than shrunk, and neither is lost to the reader: the same sentence opens the next section, and the header keeps a branch phone number and the emergency line one tap away at the top of every screen. Both still show from 761px up.
- `Book appointment` is therefore the one thing the phone layout protects, and it must clear the fold; the stat row is allowed to fall below it on short handsets because `ImpactStats` owns the numbers two sections later. On a 390x844 phone the hero measures 692px and leaves a 43px sliver of the next section, which is what invites the scroll. Verify by measuring, not by eye: emulate the phone and check `getBoundingClientRect().bottom <= innerHeight`.
- `.e-hero__copy` carries 62px of bottom padding on phones purely to leave the corner under the CTA free for the pause control. At 22px the control sat on top of the right end of the action row and stole part of its tap target.
- The control moves to the top right between 761px and 1040px, where the stat row has moved under the copy and the bottom right corner is no longer free.
- Contrast is a requirement, not a preference, and it has to hold across every scene rather than on the poster frame - the atrium skylight and the exam-room floor are near-white. Measure by seeking the film to several timestamps, making the glyphs `color: transparent` while leaving every background behind them painted rather than hiding the copy block (hiding it measures bare film and ignores any scrim or pill the text actually sits on, which once under-reported a measurement by a full 7 points), then sampling each text box and checking against WCAG (3:1 for the headline, 4.5:1 for body-size text).
- Sample each box as a **grid and keep the worst cell**, never as one average. Text sits on moving photography, so a bright patch under a single letter is exactly the failure a box average hides: the phone headline averaged a comfortable 5.40:1 over the same frame where its worst cell was 2.82:1, below the minimum. Worst local cell across six timestamps is now phone headline 4.72:1; desktop headline 4.69:1, lede 11.1:1, call link 15.6:1.
- The phone scrim is deliberately light. The heavy version it replaced was sized for a lede that needed 4.5:1, and once the lede was dropped it was holding nothing but a display line that needs 3:1 - all it did was flatten the lower half of every scene into solid navy, so the hero read as a dark panel with a strip of ceiling rather than as film. The gradient now grounds the last third and leaves the rest of the frame open. If copy is ever added back to the phone hero, the scrim has to be re-measured, not restored from memory.
- The phone CTA is a pill that hugs its label, not a full-bleed bar. The bar was the heaviest object on the screen and read as a slab of white across the frame; the reference lets the film carry the width and gives the action a shape. It stays a generous target at 54px tall with 30px of side padding, which is what matters for the older patients this site is built for - do not shrink it to make it prettier.
- The mobile crop was tested tighter (dropping the empty ceiling) and the tighter version is worse: it truncates the skylight arch mid-curve and crowds the exam room with a foreground stool. Keep the full-height 3:4 cut. The film reads as 70.5% of the phone viewport against the reference's 70%.

`AppointmentPage` reads `branch`, `service` and `name` from the query string so the hero card can prefill the full form.

### ImpactStats

`src/sections/ImpactStats.jsx` is the numbers band directly under the hero and owns the `.e-impact` rules at the end of `src/styles/landing.css`.

- Four cards - surgeries, patients, specialists and hospitals - each with a kicker numeral, a counted figure, a label, a line of copy and a small illustrative panel. The panel is what makes the section feel alive; the layout follows the Function Health "Testing is easy" reference.
- Card copy and the procedure mix / patient trend figures live in `home.impact`. The specialists card is derived from `doctors.json` and the hospitals card from `branches.json`, so neither duplicates content that already exists.
- The heading is the Gujarati line `impact.titleGujarati` over the English tagline (`impact.tagline` plus the accented `impact.taglineAccent`). Gujarati needs its own family - `--e-gujarati` (Noto Serif Gujarati, loaded in `index.html`) - because Inter Tight has no Gujarati coverage and the system fallback differs on every platform. The serif face is deliberate: it pairs with the Source Serif italic tagline and the hero's serif accent, where a grotesque read flat.
- `index.html` loads Source Serif 4 with its italic axis, so the tagline and the hero accent get true italics instead of browser-slanted romans.
- `.e-head__body` caps its measure at `46ch`, which is computed on 16px body text and is far too narrow for a 3.3rem display line; `.e-impact` clears that cap on the head and puts the measure on the tagline instead.
- Each card owns its own in-view trigger (`useInView` on the card, `amount: 0.45`) and passes it down to `CountUp` and to its panel. Do not move the trigger back onto the number itself: on a phone the figure sits near the top of a ~500px card, so watching the figure started the count while only the card's top edge had crossed the fold, and the count finished before the card was readable.
- The figures animate with `src/components/CountUp.jsx`, which counts when its `start` prop turns true and renders the final value immediately under `prefers-reduced-motion`. Numbers are grouped with `en-IN` (1,00,000), so keep values as plain numbers in JSON.
- The hospitals card cycles a highlighted branch chip every 1.9s; the cycle is disabled under reduced motion, and each chip links to `/branches?branch=<slug>`.
- Grid is 4 columns, 2 columns at <= 1080px and 1 column at <= 620px. The illustrative panels stretch (`flex: 1`) so their tops line up inside a row.
- Surgery, patient and procedure-mix numbers are placeholders until the hospital confirms them.

### ConditionsCarousel

`src/sections/ConditionsCarousel.jsx` follows the Dr Agarwal's "Conditions we treat" rail and owns the `.e-cond` rules at the end of `src/styles/landing.css`.

- Six condition slides live in `home.conditions.slides`. Each carries its own photograph, headline, a quote attributed to a doctor by exact `name` (matched against `doctors.json` for the photo and specialty), `treatments` pills that link to `/services/<slug>`, and a `Learn more` href. Every slug must exist in `services.json`.
- The rail is a native `scroll-snap` container - swipe on touch, arrows and dots on pointer devices, keyboard scrollable, and it degrades to a plain horizontal scroller without JS. Do not add a carousel library.
- `scroll-padding-inline` must always match the track's `padding-inline`. `scroll-snap-align: start` aligns to the scrollport edge, which sits inside the padding, so without it the rail auto-scrolls past its own inset and the first slide sits flush to the window instead of lining up with the heading.
- Arrows and dots scroll by a measured stride (slide width + gap) rather than by element offsets, which keeps them correct at every breakpoint.
- Art direction changes at 760px for the same reason the hero does. Desktop and tablet put the copy over the photograph behind a horizontal scrim; phones drop the scrim, show the photo as a 200px band and put the copy on solid navy. Measured white-on-photo contrast for the headline was 10.7:1 on desktop and 6.6:1 at 900px, but as low as 2.1:1 on a 390px phone, where the copy spans the full slide and crosses the bright part of the frame. The band reads 14.3:1. Re-measure if the scrim, crop or breakpoint changes.
- Condition photography lives in `public/assets/media/conditions` and is Pexels-licensed; the Pexels photo id is kept in each filename so the source stays traceable. The bladeless slide uses the hospital's own theatre photograph.
- A phone must get the section head and a whole slide in one screen. The budget on a 390x844 device is 779px (844 minus the 65px collapsed header; the 60px quick-actions bar that used to sit below it has been removed); the head plus slide is 602px. Anything added to a slide has to come out of that budget - the first build was 832px for the slide alone and needed a full screen of scrolling.
- The savings come from authored content and from flattening, never from truncation: `quoteShort` carries a one-line version of each quote for phones (`quoteFull` / `quoteShort` are swapped with CSS at 760px). Never clamp the full quote with `-webkit-line-clamp`; write a shorter one in `home.json` instead.
- The phone slide is flat, not nested. On desktop the doctor quote is a white card floated over the right of the photograph, which is where its weight belongs. Stacked on a phone that same card became a white panel inside a navy panel inside a rail - three frames deep, the nested-card clutter this site is supposed to avoid - so at <= 760px the card dissolves to a hairline rule and the quote sits directly on the navy. Measured against `#0c2c49`: the doctor name 14.1:1, the specialty 7.5:1, the quote 10.7:1.
- The phone slide reads condition -> what it is -> who says so -> act. `.e-cond__copy` takes `display: contents` at that width so its three children join the body's flex flow and `order` can put `Learn more` last, nearest the thumb. It is a plain div, so dissolving its box costs nothing semantically - do not do this to an element with an implicit ARIA role.
- Two things were cut for the phone rather than shrunk. The chevrons are hidden: nobody reaches for one on a touch screen when the next slide is already peeking at the edge of the rail, and they cost a whole 42px row. The related-treatment pills are hidden too - `Learn more` already opens the slide's own service page, and a single leftover pill beside it read as an arbitrary second choice rather than a shortcut. The freed height goes back into the photograph, which is 150px instead of the 110px strip it was.
- The dots stay as the position indicator and stay tappable: a 9px dot with a 10px transparent border gives a 29px target, past the WCAG 2.2 minimum of 24px, without growing the dot. Two traps there - the `[data-active]` rule must repeat `background-clip: content-box`, because its `background` shorthand resets the property and paints the whole 29px box, and the list needs `margin-left: -10px` so the first dot still lines up with the container edge the label and heading align to.
- `relatedTreatments()` drops any pill whose slug matches the slide's own `href`, because that pill and the Learn more button would be the same link. Give each slide three treatments so two survive the filter.
- Slide copy and doctor quotes are placeholder wording and need clinical sign-off before launch.

### WhyChooseUs

`src/sections/WhyChooseUs.jsx` is the bento mosaic under the conditions rail and owns the `.e-why` rules in `src/styles/landing.css`. It follows the Narayana Health "Why Choose Narayana Health?" reference.

- Six tiles - expert care, advanced technology, care across locations, patient first, old case file promise, quality promise - live in `home.trust.items`. Each carries an `icon` (resolved through `src/lib/icons.js`, never imported ad hoc), a `tone`, a one-line `description` and a small uppercase `meta` proof line.
- Colour comes from `data-tone` in the JSON, never from `nth-child`, so reordering the items cannot scramble the palette. Tones are `navy`, `teal`, `accent` (dark, white text) and `clinical`, `paper` (light, ink text); three dark and three light keeps the rhythm of the reference without turning into a rainbow.
- The mosaic is a plain grid with per-column offsets: three columns with `nth-child(3n+2)` and `nth-child(3n+3)` pushed down, two columns with `nth-child(2n)` pushed down at <= 900px, and a flat two-column grid at <= 560px. `align-items: start` is what lets the tiles keep their natural heights.
- Phones keep two columns rather than dropping to one. Six full-width tiles measured 1891px - 2.24 screens on a 390x844 phone - which is more scrolling than a trust section earns before a reader abandons it; two columns turn six rows into three at 1230px (1.46 screens) and hide nothing. Every tile keeps its full sentence, its proof line and its visual, and the reader can weigh two reasons at a glance instead of holding one in memory while thumbing to the next. The height comes out of the frame - padding, gaps, icon and visual sizes - and never out of the type, because older patients read this site: `.e-why__text` is 0.88rem and `.e-why__meta` 0.7rem at that width, near their full-width sizes.
- Every visual is refitted for the ~137px column in the same block (smaller avatars and overlap, shorter scan and map bands, tighter pills, chips and checklist rows). Check `documentElement.scrollWidth` against `innerWidth` after touching one - a visual that overflows its column is what breaks the whole page's horizontal fit.
- Tile text contrast is measured, not assumed. White at 0.82 over each dark tone gives 10.0:1 navy, 6.3:1 teal, 4.7:1 accent for the body copy. The `meta` line at 0.72 measured 3.89:1 on the magenta tile, below the 4.5:1 that 0.72rem uppercase text needs, so dark-tile meta sits at 0.88 (accent 5.2:1). Re-measure if a tone colour changes.
- This section deliberately carries no figures. `ImpactStats` two sections earlier already owns the numbers, and repeating 6 hospitals or 9 specialists here read as padding.
- Descriptions are one sentence each on purpose: six stacked tiles reached 2001px on a 390px phone with two-sentence copy, and 1617px with one. Tighten the copy before adding phone-only overrides.
- Each tile carries a small visual keyed by `visual` in the JSON, and every one of them illustrates its own point rather than decorating: `team` stacks the real consultant photos from `doctors.json`, `scan` is a diagnostic trace that draws bar by bar under a single sweeping beam, `map` connects one dot per branch along a dashed route, `explain` shows the three steps of a consultation, `files` fans out case-file years, and `checklist` ticks the protocol steps. Supporting strings live in `home.trust` (`explainSteps`, `filesYears`, `checklist`).
- Visuals never hard-code colour. The tile exposes `--why-ink`, `--why-line`, `--why-soft` and `--why-chip`, and the dark tones override all four, so a visual works on navy, teal, magenta or paper without knowing which it is on.
- Like an ImpactStats card, the tile owns the in-view trigger (`useInView`, `amount: 0.4`) and passes `active` down; the visuals animate once and hold. Under `prefers-reduced-motion` every visual renders its finished state immediately.
- The icon is rendered with `createElement(getIcon(...))` rather than `const Icon = getIcon(...)`. Inside a named component the assignment trips `react-hooks/static-components`; the `.map()` callbacks in `ServiceGrid` and `PageIntroGrid` get away with the older pattern, but do not copy it into a component here.
- The visuals cost 369px of phone height (1617px to 1986px). That was a deliberate trade for the section feeling alive; if the page ever needs the height back, the visual band is the first thing to shrink.

### DoctorHighlights

`src/sections/DoctorHighlights.jsx` is the portrait rail under the trust mosaic and owns the `.e-docs` rules at the end of `src/styles/landing.css`. It follows the Function Health "Built with the world's top doctors" reference closely, and the things that make it read as that reference are the ones most easily lost - a first build put the head in this page's usual left-aligned label column with the arrows beside it and it stopped looking like the reference at all. Keep all five:

1. The head is **centred**, not the `.e-head` label/body grid the rest of the page uses.
2. The headline is **serif** (`--e-serif`), not Inter Tight - this is the one section on the page that leads with the serif - with the closing phrase in italic accent (`.e-docs__title em`, fed by `titleAccent`).
3. A centred, muted subtitle sits under it, in the register of the reference's "Function's Medical & Scientific Board".
4. The arrows **float over the photographs** at the left and right edges of the rail, as accent-outlined circles.
5. There are **no dots and no counter**.

- Section copy lives in `home.doctorHighlights` (`title`, `titleAccent`, `lede`, `ctaLabel`) and the card order in its `featured` array, which lists doctors by exact `name`. Names are resolved against `doctors.json` and anything that does not match is dropped, so a rename in one file cannot render an empty card.
- Card content comes from `doctors.json` and nothing is duplicated into `home.json`: the name carries its post-nominals inline (`Dr. Vishnu S. Patel, MBBS, MS`) exactly as the reference does, over the one-line `highlight`. `highlight` was added for this section - `bio` is written for the doctors page and runs too long for a ~290px card. It is two short sentences, the first naming the branch, so the card needs no separate location row.
- The portraits are **square, not 4:5**. The reference crops square, and the hospital's own files are 270x260, so a 1:1 box is both the faithful crop and very nearly a 1:1 render of the source rather than an upscale. Do not "improve" this to a tall portrait box - it upscales harder and crops the shoulders.
- Each arrow is **unmounted, not disabled**, at the end it cannot move toward: the reference shows no left arrow on the first screen. `sync()` only tracks `atStart` / `atEnd`; there is no page index to keep, because there are no dots to feed.
- The arrows are centred on the **photograph**, not the card - the card is taller than its image by the name and description. Since the media is square, half the card width is exactly half the image height, which is why `top` repeats the card's own `clamp()`. If the card width changes, that clamp has to change in both places.
- The card at each edge is ghosted by `.e-docs__fade` rather than cut, which is what tells the reader the rail continues; the strip is `pointer-events: none` so it cannot swallow a swipe. The fades are hidden at <= 760px - the reference cuts the peeking card cleanly on a phone, and at that width the fade only washed out the one portrait the reader is about to swipe to.
- The arrows are hidden at <= 760px for the same reason as the conditions rail: the next portrait is already peeking, and a swipe is the gesture people reach for. Nothing else is dropped on a phone - every card keeps its portrait, full name and sentence.
- The rail is the same native `scroll-snap` container as `ConditionsCarousel`. Do not add a carousel library, and keep `scroll-padding-inline` equal to the track's `padding-inline` (both drop to 16px at <= 720px so the first card lines up with the shell the heading uses).
- Measured with no page overflow and no sub-24px target from 320px to 1920px; the arrows appear and disappear at the right ends and behave identically under `prefers-reduced-motion`.
- **The portraits are the weak part of this section and the fix is new photography, not CSS.** Every file in `public/assets/media/doctors` is 270x260, letterboxed onto white, with backgrounds from white to grey to pink and wildly inconsistent framing - one doctor is a tight face crop, the next a full-body shot. The square box, `object-position: 50% 16%` and the tint behind the image are damage control. Replace with ~1200x1500 studio portraits shot at a consistent distance on a consistent background; nothing in the CSS needs to change when they land.
- This rail is now the only place the landing page introduces the doctors. `SpecialistsRail` used to repeat the first four of the same people in a grid further down; it was removed with the rest of the old tail, and nothing should reintroduce a second doctor block here.

### PatientStories

`src/sections/PatientStories.jsx` is the moving wall of patient quotes directly under the doctor rail and owns the `.e-voices` rules in `src/styles/landing.css`. It replaced a static two-column grid of the same quotes that sat near the bottom of the page.

- It sits immediately after `DoctorHighlights` on purpose: the reader has just been shown who the doctors are, and the next question is what it was like to be treated by them. That is also why it is the one dark band in the upper half of the page - it separates two paper sections and gives the quotes their own room.
- Section copy lives in `home.voices` (`eyebrow`, `title`, `lede`, `note`); the quotes come from `testimonials.json` and nothing is duplicated between the two.
- The head is the page's ordinary `.e-head` label/body grid rather than the centred serif head of `DoctorHighlights` above it. Two centred serif heads back to back read as one long title block. The `note` sits under the eyebrow in the label column, which is otherwise empty on desktop.
- The eyebrow is text, not a number. Renumbering `01`-`09` across the page to slot a tenth section in was churn with nothing to show for it, and the three sections above this one already carry text eyebrows.

**Three behaviours, one per device and preference.** `mode` is chosen in JS - `static` under `prefers-reduced-motion`, `step` on a phone (`matchMedia` at the same 760px the rest of the page breaks at), `drift` everywhere else - and is set on both `.e-voices__rows` and each row so the CSS can follow it.

- `drift` is the continuous marquee: two rows, opposite directions, a duplicated card set inside a track that translates by exactly one set. No JS ticker and no carousel library.
- `step` is a phone-only self-advancing snap rail: it holds a card still for `PHONE_HOLD_MS` (5s), advances exactly one card, and stays swipeable throughout. **A phone cannot use the drift.** One card fills the width there, so a whole card was readable for about half a second in every ten - the rest of the time the reader was looking at a quote clipped mid-sentence at both ends. This is the section's central compromise; do not "simplify" the phone back onto the marquee.
- `static` drops the movement, renders one card set, and hides the control. Same quotes, swipeable, nothing moving.
- The rail wrap is silent: `step` keeps the duplicate set, so reaching the end of the first set is a `scrollLeft -= setWidth` correction onto identical content rather than a smooth whip back across eight cards.

**The rest of the mechanics.**

- The drift keyframe ends at `calc(-50% - var(--voices-gap) / 2)`, not at `-50%`: the track holds two sets and `2n - 1` gaps, so `-50%` alone lands half a gap short and the join shows as a stutter once per cycle. Measured seam error is 0px at 390px, 1440px, 1920px and 2560px; re-measure if the gap or the card count changes.
- Both rows carry **every** quote rather than half each. A set narrower than the viewport opens a gap at the trailing edge - four cards is about 1480px, fine at 1280px and broken at 1920px. Eight cards is 2938px and clears a 2560px monitor. The second row starts halfway through the list and runs `SECOND_ROW_SCALE` slower, which is what stops the two rows drifting as a fixed pair.
- One row on a phone so the section stays a single band of the screen, two from 761px up where a lone row leaves the width looking empty.
- The second card set carries `aria-hidden`, so each quote reaches a screen reader once.
- Motion is stoppable three ways, because moving text that runs for more than five seconds has to be: the `Pause quotes` control, `:hover` / `:focus-within` on the wall, and a `pointerdown` hold. The hold is what covers touch - a finger gets no hover - and on the `step` rail it also keeps the rail from advancing out from under a swipe.
- Cards drift at about 42px a second (`SECONDS_PER_CARD` is seconds per card width). Do not speed either mode up to make the section feel livelier; the phone hold in particular is sized for a 17-word quote read by an older patient.

**Card anatomy and contrast.**

- The theme chip leads the card and the branch closes it. On a wall that moves the reader picks what to read from the tag, then commits to the quote; the branch answers a different question and gets a sentence-case 0.85rem line with a pin, not a second tracked uppercase label competing with the chip at the opposite corner - which is what the first build had.
- The rule above the branch line lands at the same height across a row, which keeps the wall level while the quotes run to different lengths. Keep quote copy between about 16 and 21 words so the cards stay close in height.
- Contrast is measured, not assumed. Cards are white: quote (`--e-ink`) 17:1, branch line (`--e-ink-2`) 7.6:1, theme chip (`--e-navy-2` on `--color-clinical`) 8.9:1. `--e-ink-3` is 2.9:1 on white and is used only for the pin glyph beside the branch text. On the navy: the head note at `rgba(255,255,255,0.62)` is 6.4:1, and the control's border is `0.45` rather than the hero control's `0.34` because `0.34` measured 2.63:1, short of the 3:1 a control boundary needs.
- The cards carry a shadow because they are the only light objects in a dark band and were lying flat on it.
- Edge fades belong to `drift` only. A rail snaps to whole cards, so the only thing left to fade would be the card the reader is reading.
- Themes five to eight (`Waiting and flow`, `Clear costs`, `Follow-up care`, `Facilities`) were written for this wall and need hospital sign-off before launch, like the four before them. They are summarised review themes, not verbatim quotes, and the section says so on the page.

## Current Routes

```text
/
/about                (redirects to /about/journey)
/about/journey
/about/vision
/services
/services/:slug
/doctors
/branches
/gallery
/appointment
/contact
/*
```

The navigation uses `Our Hospitals` in the header with a dropdown that links branch choices into the existing `/branches?branch=<slug>` experience. Separate branch detail pages are planned later, but should not be created until requested.

## About us

About us is **two pages behind one nav item**, not one page. The header's `About` entry is a dropdown: the reader chooses `Our journey` or `Vision and mission` and lands on that page directly. `/about` itself is a redirect to `/about/journey`, so old links and bookmarks still resolve.

- All copy lives in `src/data/about.json` and is read through `src/lib/aboutData.js`. The pages are `src/pages/AboutJourneyPage.jsx` and `src/pages/AboutVisionPage.jsx`, and both own `src/styles/about.css` (`.ab-`).
- These are the **first inner pages built in the `.e-*` design system** from `system.css` rather than on `PageHeader` and the older `global.css` page styles. They use `.e-sec`, `.e-shell`, `.e-head`, `.e-h1`/`.e-h2`/`.e-h3`, `.e-lede`, `.e-body` and `.e-link`, and `about.css` only adds what those do not cover. Nothing here restyles a shared primitive.
- The page they replaced was a single `/about` route rendering a story panel, a flat journey list and a principles grid. Its `.about-*` rules (about 430 lines of `global.css`), its `about-panel-sheen` keyframe and the `.page-header--about` variant went with it.
- Both pages end by pointing at the other one, and the footer carries the appointment CTA, so neither renders `CTASection`.

### AboutSwitch

`src/sections/AboutSwitch.jsx` is the two-up control under the head of **both** pages, and it reads the same `navigation.header` About `children` the dropdown does - the labels can never drift between the header and the page.

- It exists because the dropdown is a desktop affordance: on a phone that choice is buried inside the drawer, so without this the reader would have to open the drawer to move between two sibling pages. Here it is one tap.
- The current page is the filled navy card, so the control doubles as a "you are here" marker. Two columns from 761px up, stacked on a phone.

### Our journey

`AboutJourneyPage` is the animated timeline. Milestones come from `about.journey.milestones`; the closing `now` card is the only one whose figures are computed - years from `journey.establishedYear`, hospitals from `branches.json`, specialists from `doctors.json` - so the count of hospitals can never contradict the rest of the site.

- The spine fills as the reader scrolls (`useScroll` on the track plus `useSpring`), which is the whole point of the page: it shows how far through the story you are without a separate progress bar. Under `prefers-reduced-motion` the fill renders complete and every card renders at full opacity - verified, not assumed.
- Each milestone owns its own `useInView` trigger and animates its dot and card once, the same pattern `ImpactStats` and `WhyChooseUs` use on the landing page.
- **The marker column width and the spine position share one token, `--ab-gutter`.** The dot is centred in that column and the spine sits at half of it, so a dot lands on the line at every breakpoint. They were separate values first and the phone dots sat 8px to the left of the spine. Measured dot-to-spine offset is now 0px at 320, 390, 820 and 1440px; re-measure if either value changes.
- Cards alternate around a centred spine above 900px and fall to a single column beside a left gutter below it. Alternating needs width a phone does not have, and one reading edge scans faster.
- The `now` card's tag is `Where we are`, not `Today` - the year slot already says `Today`, and the pill repeating it read as a mistake.

### Vision and mission

`AboutVisionPage` is the mission, the vision and the core values.

- The two statements sit in the page's one dark band, set in the serif at display size, because they are the hospital's own words and they should read as a statement rather than as a card.
- The six core values are all derived from those two sentences (safety, affordability, technology, continuity, teaching, access) rather than invented alongside them. `Old case file promise` and `Quality promise` from the old page survive here as two of the six.
- The value cards carry an icon, a title and one sentence, and no figures - `ImpactStats` on the landing page owns the numbers.
- A decorative `01`-`06` numeral was dropped from the cards: it measured 2.9:1 (`--e-ink-3` on paper) and told the reader nothing the list order did not.

**Contrast is measured, not assumed.** On the navy: statements and the switch's active card 14.3:1, statement notes 7.7:1, the `now` card's body 10.0:1 and its figure labels 8.1:1. On paper: headings 18.2:1, body and milestone tags 7.8:1, the lede 7.8:1. One fix came out of measuring - the `Established` micro label was `--e-ink-3` at 3.19:1 and moved to `--e-ink-2`. Note that `.e-label` itself measures 3.19:1 on light sections **site-wide**, which is a pre-existing issue on the landing page too, not something these pages introduced.

Measured with no page overflow and no target under 24px at 320, 390, 820 and 1440px.

## Header

`src/components/Header.jsx` follows the Narayana Health reference layout and is the only consumer of `src/styles/header.css`.

- Desktop (>= 1041px): a brand row (logo, `Since 1993` lockup, emergency helpline, selected-branch phone, branch picker, Book Appointment) above a nav row carrying the primary links. The lockup is decorative and hides below 1200px so the contact details and CTA are never squeezed out.
- Everything in the header aligns to the container edges: the logo, the first nav link text, the rule between the two rows, and the trailing CTA. Nav spacing comes from `gap`, not from link padding, so the first link and its active underline stay flush with the logo. Verify alignment by measuring, not by eye.
- Mobile (<= 1040px): a navy branch bar on top, then a brand row with the emergency link and the menu button; the nav row is replaced by a right-side drawer.
- The header keeps a selected branch in `localStorage` (`aakash_selected_branch`). It drives the displayed OPD number, the Book Appointment query string and the drawer call/WhatsApp/directions actions, and it adopts `?branch=<slug>` whenever a page is opened for a specific branch.
- Nav items come from `navigation.header`. An item carrying a `dropdown` key renders a menu instead of a link - `"branches"` for the hospitals menu and `"about"` for the two About pages - and its label comes from that JSON entry rather than being written into the component. Header labels and the emergency number live in `site.header`.
- Both menus are the same component, `NavDropdown`, which owns the `.hd__mega*` rules: one narrow column, hover-open gated on a fine pointer, a close timer over the gap, and roving `ArrowDown`/`ArrowUp`/`Home`/`End` focus with `Escape` returning focus to its trigger. It takes rows and an optional footer link, so the hospitals menu keeps `View all hospitals` and the About menu has no footer. Triggers are held in one `dropdownTriggers` map keyed by the dropdown name, which is what lets `Escape` focus the right one. Do not fork it for a third menu - add rows.

### Hospitals menu

The hospitals menu is `NavDropdown` fed by `branches.json`; the drawer renders the same list as `.hd__drawer-branch-link` rows.

- It is a **single 340px column**, not the 660px two-column mega panel it replaced. Six short city names read faster in one column, and a narrow panel sits under its own trigger instead of spanning half the header - the wide version was a white slab dropped over the hero with no visible relationship to the link that opened it.
- The panel is offset left by `--hd-mega-inset` (22px, its own padding plus the row padding) so the branch names line up under the nav label, and a small caret points back at the trigger.
- The six identical `MapPin` tiles are gone. They repeated the same glyph six times and told the reader nothing; the row now carries name, `Head Office` tag and locality, with a check on the branch the reader is on (or has selected) and a chevron that appears on hover only. Six permanent arrows would be the same mistake as six pins.
- The check marks `activeSlug ?? selectedSlug`, and `aria-current="page"` is set only when the URL is actually showing that branch. It is deliberately **not** the magenta inset bar the drawer's nav links use - that bar means "the page you are on", and "your hospital" is a different claim.
- A 10px gap sits between the trigger and the panel, so the panel bridges it with a transparent `::before` strip and closes on a 160ms timer. Without both, the menu died halfway through the diagonal travel from the link to the first row.
- Keyboard: `ArrowDown` on the trigger opens the menu and focuses the first city, `ArrowDown` / `ArrowUp` / `Home` / `End` move between rows, `Escape` closes and returns focus to the trigger. Hover-open is still gated on `(hover: hover) and (pointer: fine)`.
- The panel caps its height against the viewport and scrolls, so a short laptop window still reaches Juhapura and `View all hospitals`.
- Below 1041px there is no dropdown at all - the drawer's branch block carries the same rows at 52px tall with the same check.
- On scroll past 96px the branch bar collapses and the brand row shrinks, and the header takes a shadow; it expands again below 16px. Those two thresholds are deliberately far apart. Collapsing removes the 44px city bar from the flow above every section, so the browser compensates with scroll anchoring - measured at a 28px jump on a 390px phone. With a single 24px threshold that jump landed back under the threshold, the bar re-expanded, the offset jumped again, and the header flickered in place at one scroll position (desktop hides the city bar entirely, so only phones and tablets saw it). Keep the gap wider than the anchoring jump if either the city bar height or the threshold changes, and re-measure by resting at y=30-50 on a phone viewport and counting class changes per frame.
- The header slides away at every width (`hd--hidden`, a `translateY(-100%)` transform) while the reader scrolls down, and returns on the first scroll up. It reclaims 65px on a phone and 121px on desktop. There is no bottom bar to fall back on, so the reveal has to be instant at every width - never gate it behind a delay, and never lengthen the scroll-up distance needed to bring it back.
- Direction detection also stands down for 350ms after a collapse or expand, so the scroll-anchoring jump those cause is never read as the reader scrolling.
- The hide is guarded so it can never trap the user: it does not engage above 160px of scroll, while any dropdown or the drawer is open (`menusOpenRef`), at the very bottom of the page, or when anything inside the header has focus (`.hd:focus-within`). A route change resets it. Movements smaller than 6px are ignored so trackpad jitter and iOS rubber-banding do not flicker the bar.
- The header is `position: sticky` and hides with a transform, so nothing reflows and the page never shifts when it moves. Keep it that way - animating height or toggling `display` here would cost layout on every scroll frame.
- `html` carries `scroll-padding-top` in `global.css` so anchor targets land below the sticky header rather than under it.

### Mobile drawer

The drawer is the `.hd__drawer*` rules in `header.css`, and it is a navigation menu first: the reader opened it to go somewhere.

- **Order is nav, then actions.** The panel is a fixed brand row, a scrolling middle, and a footer pinned in the thumb zone (Book Appointment, then Call OPD / WhatsApp / Directions as a three-up, then the emergency line). Before this the CTA, two ghost buttons and a four-line address block sat *above* the links, so a 390x844 phone showed three of the routes and the reader had to scroll a menu to reach Gallery or Contact.
- **A parent with `children` is replaced by its children, not by an accordion.** `drawerNavItems` flattens `navigation.header`, so the drawer lists `Our journey` and `Vision and mission` as ordinary rows instead of an `About` row the reader has to expand. That is why the drawer has eight rows where the header nav has seven items.
- All eight rows and every action still fit a 390x844 phone with nothing to scroll (measured: `scrollHeight - clientHeight` on `.hd__drawer-scroll` is 0 at 390x844 and 414x896, 191px at 360x640). The eighth row was paid for out of the frame and never out of the type: rows are 48px rather than 52px (still clear of the 44px minimum; measured smallest target is 46px) and the branch block, the `Menu` label and the nav padding each gave up a few pixels. If a ninth row is ever added, re-measure - there is no slack left at 390x844.
- **One branch block, not two.** The address panel and the `Our Hospitals` accordion under it named the same hospital twice. The block at the top of the scroll area is now the only place a hospital is named: a summary row (`Your hospital`, name, locality) that expands to the six cities under a `Choose your hospital` heading - the heading is what keeps the checked row from reading as the summary printed twice. The nav row of the same name is an ordinary link to `/branches`, like every other row.
- **No chevron on a nav row.** Seven identical arrows pointing at seven links tell the reader nothing, for the same reason the desktop hospitals menu dropped its six `MapPin` tiles. The magenta inset bar still means "the page you are on"; the branch check still means "your hospital".
- The three footer actions stack icon over label. Side by side they are about 110px wide on a 390px phone, and `WhatsApp` beside an icon overflowed that at a readable size.
- Controls need `--hd-edge` (`#7f8b96`, 3.48:1 on white, 3.16:1 on `--color-surface-alt`), not `--hd-rule` - that hairline is 1.2:1 and WCAG 1.4.11 wants 3:1 on the boundary of a control. Do not put `--hd-rule` on a button here. Measured with no page overflow and no target under 44px at 320, 360, 390 and 1024px.
- The sheet is `min(400px, 92%)` so the dimmed page stays visible beside it; a full-bleed white panel read as a page rather than as a layer.
- Nav rows fade up on a 26ms-per-row stagger driven by an inline `--hd-i`. The header's blanket reduced-motion rule already flattens it.
- `@media (max-height: 720px)` tightens the frame - branch row, nav rows, buttons - and never the type, because older patients read this site.

## Footer

`src/components/Footer.jsx` follows the Function Health footer and is the only consumer of `src/styles/footer.css`. It renders on every route through `RootLayout`.

- The shape is the reference's: **one rounded card inset on a warmer ground**, with the fine print left outside the card on the ground itself. The card is `--ft-card` `#f8f7f3` and the ground `--ft-ground` `#e6e3db`; both are local to `.ft` rather than global tokens, because nothing else on the site uses this pair.
- It is **light, not the navy it used to be**. Three reasons, in order: `PatientStories` ends the home page on `--e-navy`, and two adjacent dark bands in slightly different navies read as a mistake rather than as a footer; the logo is a magenta-on-transparent wordmark that needed a white pill to survive on navy, which looked like a patch stuck to the page; and this is the densest block of small text on the site, where dark-on-light is the easier read for the older patients the site is built for.
- The inset above the card is `padding-top` on `.ft`, never `margin-top` on `.ft__card`. As a margin it collapsed straight out of the footer's box and the page background showed through as a white strip between the navy section above and the footer ground - visible on every page.
- The reference's app QR and store badges are dropped: there is no app. Its newsletter block is dropped too - there is no list to subscribe anyone to, and a form that posts nowhere is worse than no form. The action block that replaces it keeps that slot's position and typography (serif headline, italic accent from `--e-accent`, one line of support, then the buttons).
- The masthead is the wordmark plus a `Since 1993` tag, nothing else. A 25-word summary paragraph used to sit beside the logo and was removed; the tag keeps that row from reading as an empty band, and everything the paragraph said is on the page above it.
- The `Since 1993` tag is set in two parts, not one label: `SINCE` stays the tracked 0.72rem micro word the footer uses for contact labels, and the year is the serif italic accent (`--e-serif`, `--e-accent`), baseline-aligned beside it behind the hairline divider. As one uppercase micro string it read as a caption stuck to the logo; the serif year makes the pair a lockup and repeats the serif/italic pairing of the action headline and the hero accent. `splitEstablished()` reads the year off the end of `site.header.establishedLabel`, so the JSON stays one plain string and a label with no trailing year still renders whole. Measured with no overflow and one line at 320, 390 and 1440px.

**Bands, in DOM order, which is also the reading order at every width.** No `order` tricks - the visual order and the tab order are the same everywhere.

1. `.ft__masthead` - logo and the one-sentence summary.
2. `.ft__reach` - the OPD/emergency phone, the email and the OPD hours, with the emergency note under them behind an accent rule. The strip is `auto-fit` with a `260px` minimum rather than a fixed three columns, because the email is 26 characters at 1.12rem: at 768px a hard three-column grid ran it straight into the `OPD HOURS` label in the next cell. It drops to two columns at about 830px of card width and to one on a phone, with no breakpoint to keep in sync with the type size. These were first written into the action column and made it 420px taller than the link columns beside it, which left the bottom-left third of the card empty; as their own full-width band they fill the width, and on a phone the phone number lands second in the footer instead of below eighteen links.
3. `.ft__body` - three link columns plus the action block, which is explicitly placed in column 4 on desktop and falls to a full-width two-column band at <= 1080px.
4. `.ft__utility` - social pills on the left, `Privacy and cookie preferences` and `Back to top` on the right.
5. `.ft__fine` - the medical fine print and the copyright, outside the card.

**Content sources.** Nothing in the footer is hard-coded.

- `site.footer` holds `summary`, `hospitalsTitle`, the `cta` block, `contactLabels`, `emergencyNote`, `disclaimers`, `legalNote` and `copyright`.
- `navigation.footer` holds exactly the two link columns that are pages - `Treatments` and `Hospital`. The third column is the six branches, derived from `branches.json` and titled from `site.footer.hospitalsTitle`, so the branch list can never drift from the rest of the site. Every branch link is `/branches?branch=<slug>`, which the header adopts as the selected branch, so a footer branch link also sets the OPD number shown at the top of the next page.
- The phone is `site.header.emergency.phone`, which is currently the same number as the Visnagar OPD line - hence the single row labelled `OPD and emergency helpline` rather than two rows carrying one number twice. If the hospital ever separates them, this becomes two rows.
- The social links come from `site.socialLinks` - Facebook, Instagram and X - and render as brand-mark circles, as the reference has them. lucide-react 1.x removed its brand icons, so the three marks are inlined in `socialMarks` in `Footer.jsx` and keyed by the `icon` field in the JSON; a link whose `icon` matches no mark renders nothing, so add the path when adding an account. The circles are icon-only, so each carries `aria-label="<brand> on <platform>"` and its `svg` is `aria-hidden` - three labelled pills took the whole utility row.

**Typography.** The column headings are sentence case at 0.98rem in `--e-tight`, not the 0.72rem tracked uppercase micro-label the rest of the site uses for section labels. Uppercase made them the smallest type in the footer, sitting directly above the links they title, so each column read as one undifferentiated block; at 0.98rem a reader can land on a heading. The micro uppercase style stays on the contact labels, where it labels a value rather than titling a list. Link rows are 0.98rem, contact values 1.12rem, and the fine print 0.84rem capped at `108ch` - it ran the full 1240px shell before, at about 150 characters a line.

- `.ft__fine p` carries that `108ch` cap, and `.ft__copy` is a `p` inside `.ft__fine`, so the copyright rule needs `.ft__fine .ft__copy` to beat it. Written as a bare `.ft__copy` the cap won on specificity and the rule above the copyright stopped two thirds of the way across the page.
- Footer link labels are written to fit the two-column phone layout: `Bladeless laser`, `Eye check-up`, `Book appointment`. Measured with `Range.getClientRects()`, no footer link wraps at 320, 360, 390, 414, 480, 600 or 768px. If a label is lengthened, re-measure - a wrapped label knocks the two columns out of alignment row for row, which is what the shortening fixed.

**Breakpoints.** 1080px moves the action block out of column 4 into a full-width two-up band; 900px hides the `Head office` label; 860px stacks that band, because below it the copy column is under ~250px and the headline broke to four lines beside a half-empty button column; 720px drops the links to two columns; 380px drops them to one, where two columns are about 120px wide and half the labels wrapped.

**Contrast and targets are measured, not assumed.** On the card: body copy and link text `--e-ink-2` 7.3:1, headings and contact values `--e-ink` 17:1, the italic accent 6.0:1, the fine print 5.5:1 on the ground. Two things were fixed after measuring: the `Head office` label was `--e-ink-3` at 2.97:1 and moved to `--e-ink-2`, and control outlines needed their own token - `--ft-line` is the decorative hairline at 1.3:1 and is fine between bands, but WCAG 1.4.11 wants 3:1 on the boundary of a control, so pills and the ghost button use `--ft-edge` `#948f83` at 3.01:1. **Do not put `--ft-line` on a button, and do not lighten `--ft-edge` to match the rules.** The phone and email links carry `min-height: 26px` so both clear the WCAG 2.2 minimum on their own; measured minimum target across the whole footer is 26px, and there is no page overflow, from 320px to 1920px.

- `Head office` is hidden at <= 900px, where either two branches share a row or the column is about 210px, and the label wrapped the Visnagar row two lines taller than the other five. The branches page carries the same fact.
- `Back to top` honours `prefers-reduced-motion`: an instant jump rather than a smooth scroll across a 6000px page.

## Cookie consent

`src/components/CookieConsent.jsx` renders on every route through `RootLayout` and is the only consumer of `src/styles/cookie.css`. It is two surfaces and one state machine: a **banner** on a first visit, and a **dialog** opened from the banner's `Choose cookies` or from the footer's `Privacy and cookie preferences` link, which dispatches `aakash:open-cookie-preferences`.

- **Every optional category starts off.** `noOptional` is both the initial state of the dialog and exactly what `Reject optional` stores, and it is written out key by key rather than as a bare `{ necessary: true }` - `normalize()` fills missing keys from that same object, so a short payload would have quietly re-enabled a category the reader had just refused. A pre-ticked switch is consent nobody gave; do not default one to on.
- The choice is stored in the `aakash_cookie_preferences` cookie for 180 days and read once through a lazy `useState` initialiser, not in an effect - `react-hooks/set-state-in-effect` rejects the effect version.
- The banner waits `BANNER_DELAY_MS` (2100ms) before it mounts, because `AppPreloader` covers the screen for 1900ms on a first visit and a consent card sliding in behind it is invisible.
- Its `z-index` is **190, deliberately under the header (200) and the mobile drawer (210)**. The drawer is a full-height sheet with Book Appointment and the call actions pinned in its thumb zone, and a consent card floating on top of those would cover them. The dialog is the surface that takes the screen, at 260.
- The dialog is the only one of the two that locks the page, traps `Tab`, answers `Escape` and returns focus to whatever opened it. The banner stays a layer the reader can scroll past.
- **Closing the dialog without choosing falls back to the banner** whenever nothing is stored yet, so a reader who opens the details and changes their mind is still asked rather than left with no choice recorded.
- Category switches are `role="switch"` buttons rather than checkboxes, labelled by the category title through `aria-labelledby`. The control is 54x32 and a `::after` inset of -6px stretches the pressable area to 44px without growing it. The `Necessary` row carries an `Always on` pill instead of a switch.
- Each category has a `What this stores` disclosure naming the actual cookies. `.ck__cat-list[hidden]` needs its own `display: none` - the `display: grid` on the list would otherwise beat the browser's `[hidden]` rule and the details would render permanently open.
- Phones and tablets get bottom sheets, desktop gets a centred card, and both animate under `ck-rise` / `ck-pop` with every animation and transition dropped under `prefers-reduced-motion`.
- Measured across 320-1920px: no page overflow, no target under 44px, and no button label wraps to a second line. Heights: banner 264px on a 390x844 phone (31% of the screen) and 304px on desktop; the dialog fits with no internal scroll at 1440x900 and 820x1180.
- The phone gets a shorter sentence from `cookies.banner.bodyShort`, swapped with CSS at 720px, the same way the conditions rail carries `quoteShort`. Height comes out of authored copy, never out of truncation - the stacked build with the full sentence stood 397px tall, 47% of a phone screen for a notice.
- Contrast is measured, not assumed. On the card: title 18.2:1, lede and note 7.8:1, category summary and detail lines 7.1:1, the magenta eyebrow 6.4:1, the primary button 14.3:1. Control boundaries need `--ck-edge` (`#7f8b96`, the header's edge value): 3.48:1 on the card and 3.16:1 on the footer band the ghost buttons sit on. `--ck-rule` is the 1.2:1 hairline and belongs between bands only - **do not put it on a button, and do not lighten `--ck-edge`**; `#949aa1` measured 2.58:1 on that band.
- All copy lives in `site.cookies` (`banner`, `dialog`, `categories`). The category `items` name real cookies - `aakash_cookie_preferences`, `aakash_selected_branch`, `aakash_intro_seen` - so a new stored value means a new line there.

**Launch note:** the site does not act on the stored preferences yet. `aakash_selected_branch` and `aakash_intro_seen` are written by `Header` and `AppPreloader` regardless of the `experience` choice, and there is no analytics script to gate. Both need wiring to this cookie before the consent notice is truthful.

## UI/UX Standards

- Mobile first: design and test from small screens upward.
- Keep navigation short, obvious, and thumb-friendly.
- Primary actions should be visible and direct: Book Appointment, Call, WhatsApp, Directions.
- Use large tap targets, readable type, strong contrast, and enough spacing for older patients.
- Keep sections purposeful. If a section does not help a patient decide, contact, book, or understand care, simplify or remove it.
- Avoid visual clutter, nested cards, decorative overload, and heavy animations.
- Use real hospital, doctor, branch, and treatment imagery where possible. Avoid generic stock-like visuals when real assets exist.
- Make branch selection easy on mobile; users should quickly choose Visnagar, Ahmedabad, or Bharuch.
- Use icons from Lucide React for actions and navigation cues.
- Preserve accessibility: semantic landmarks, labels, focus states, keyboard access, reduced-motion support, and alt text.
- Ensure every UI works at small mobile widths, tablet widths, laptop widths, and large desktop widths.

## Visual Direction

- The site should feel premium, clinical, clean, and trustworthy.
- Prefer calm medical colors from the existing theme over random new palettes.
- Keep typography readable and polished. Avoid text that is too small, too dense, or squeezed into cards.
- Use motion sparingly for reveal and orientation, not as decoration.
- Keep mobile pages direct and vertically efficient.
- Avoid unnecessary hero complexity. The homepage should get users to care options and contact routes quickly.

## Content And Data Rules

- `src/data/site.json`: brand, logo, global CTAs, defaults, business hours, social links, and the whole `footer` block (summary, action-block copy, contact labels, emergency note, medical fine print, copyright).
- `src/data/navigation.json`: header navigation, and the two page-link columns the footer renders. The footer's third column is the branches and is derived from `branches.json`.
- `src/data/home.json`: homepage hero, impact, conditions, trust, doctor-highlight and patient-voices copy. It also still holds `cta`, which the home page no longer renders - `CTASection` reads it on five inner pages. `timeline` and `missionVision` used to live here and are now `about.json`'s `journey.milestones` and `vision.statements`.
- `src/data/about.json`: the two About pages. `journey` holds the founding date, the milestone list and the closing `now` block; `vision` holds the mission and vision statements and the core values.
- `src/data/services.json`: service cards, service details, and FAQs.
- `src/data/doctors.json`: doctor profiles, branch associations and the one-line `highlight` used by `DoctorHighlights`.
- `src/data/branches.json`: branch names, slugs, addresses, phone groups, email, maps, WhatsApp numbers.
- `src/data/testimonials.json`: patient quotes, rendered by the `PatientStories` wall on the home page.
- `src/data/gallery.json`: gallery categories and media.
- `src/data/site.json` also holds `cookies`: the consent banner copy, the preferences dialog copy and the three cookie categories with the cookies each one names.
- Do not hard-code business content into components when it belongs in JSON.
- Keep branch slugs stable because URLs, query links, and future branch pages depend on them.

## SEO, Trust, And Medical Site Requirements

- Every route should use `SEO` metadata.
- Use JSON-LD helpers where relevant: medical clinic, branch, service, breadcrumb, and FAQ structured data.
- Keep copy medically responsible. Do not make unrealistic guarantees or exaggerated health claims.
- Make phone numbers, WhatsApp links, addresses, maps, and appointment CTAs easy to find.
- Keep `public/robots.txt` and `public/sitemap.xml` aligned with production routes when routes change.
- Verify branch contact details, business hours, maps, and doctor bios before launch.

## Performance Rules

- Keep route-level lazy loading through `src/router.jsx`.
- Use `SmartImage` and public optimized images when possible.
- Use `LazyMapFrame` for embedded maps.
- Avoid unnecessary large libraries.
- Avoid adding complex client-side state when simple JSON-driven rendering is enough.
- After major UI changes, run a production build and check bundle output.

## Quality Checklist Before Handoff

Run:

```bash
npm run lint
npm run build
```

Manual checks:

- Homepage looks clean and direct on mobile.
- Header menu works on desktop and mobile.
- `Our Hospitals` dropdown works and branch choices open the expected branch state.
- The hero's Book and Call actions are both above the fold on a phone.
- Appointment form validates properly.
- Phone, WhatsApp, maps, and email links work.
- All pages fit mobile width without horizontal scrolling.
- Reduced-motion mode does not depend on animation to understand content.
- Lighthouse mobile should be checked for Performance, Accessibility, Best Practices, and SEO before final deployment.

## Known Launch Notes

- Ahmedabad OPD mobile number must be verified before launch.
- Map coordinates are approximate and should be verified.
- Business hours are placeholders and should be confirmed by the hospital team.
- Doctor bios should be replaced with approved final copy, and the one-line `highlight` for each doctor needs the same sign-off.
- Patient-voice themes are summarised from public reviews and need hospital sign-off before launch.
- The journey timeline carries the five milestones the hospital has confirmed (1993, 1995, 2009, 2011, 2014). The opening years for Bharuch, Gota, Himmatnagar and Juhapura, and the year bladeless laser surgery started, are not in any data file - get them from the hospital and add them to `about.json` rather than estimating.
- The six core values on `/about/vision` are written from the approved mission and vision sentences, but the wording itself is drafted and needs hospital sign-off.
- The footer's medical fine print (`site.footer.disclaimers`, `emergencyNote`, `legalNote`) is drafted, not approved. It needs the hospital's sign-off, and `legalNote` in particular should be checked against the hospital's registration details before launch.
- `site.socialLinks` carries Facebook, Instagram and X. **The Instagram and X URLs are assumed from the Facebook handle and must be checked against the hospital's real accounts before launch.** Adding a further account needs a JSON entry plus its brand-mark path in `socialMarks`.
- Doctor portraits are 270x260 and inconsistently framed; replace with ~1200x1500 studio portraits on a consistent background before launch.
- The cookie consent stores a choice but nothing reads it yet: `aakash_selected_branch` and `aakash_intro_seen` are written regardless of the `experience` switch, and no analytics script exists to gate. Wire both to `aakash_cookie_preferences` before launch, and have the hospital check the wording in `site.cookies` against its privacy policy.
- Future work may include separate pages for each hospital branch, but for now the navbar links into `/branches?branch=<slug>`.

## Coding Style

- Keep changes minimal, focused, and consistent with existing patterns.
- Do not introduce new abstractions unless they remove real duplication or complexity.
- Prefer clear component names and readable JSX.
- Avoid one-letter variables.
- Avoid comments unless the code would otherwise be hard to understand.
- Use ASCII text unless the file already requires non-ASCII.
- Do not commit changes unless explicitly requested.
