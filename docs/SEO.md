# SEO handbook: Aakash Eye Hospital

The single reference for how this site is set up for search, what was done in each session, and what is still open. **Hosting and launch steps are in [`hosting.md`](hosting.md).** Session 1: 3 October 2026 (the foundation). Session 2: 3 October 2026 (doctor profile pages, section 16).

## 1. Summary

The redesign was a client-rendered single-page app. Every URL returned the same HTML, carrying the home page's title and a canonical pointing at `/`, and unknown URLs answered 200. The live domain still runs the 2018 PHP site, whose URLs (`cataract.php`, `lasik.php`, `ourteam.php`, `team_details.php?team_id=N` and others) are what Google has indexed. Nothing redirected them. Launched as it stood, the site would have turned every ranked URL into a soft 404, and search engines and social previews would have seen one generic page.

Session 1 rebuilt the foundation so that does not happen, in a way that needs no rework whichever host is chosen:

- **Every page is prerendered as static HTML at build time.** That's 25 pages plus `404.html`, each with its own title, description, canonical on `https://www.aakasheyehospital.com`, Open Graph and Twitter tags, a page-specific social image, one linked JSON-LD `@graph`, and the full page text. Readers see exactly the site as before: the opening curtain, or a paper veil on reload, covers the static copy until React takes over.
- **Real 404s and server-side 301s**: a 25-entry redirect map covering every legacy URL, generated for Cloudflare and Netlify (`_redirects`) and for Apache/LiteSpeed (`.htaccess`).
- **A generated sitemap** (git-dated `lastmod`, image entries) and robots.txt, rebuilt from the data on every build.
- **Structured data rebuilt** as one `@graph` per page with stable `@id`s: a `MedicalOrganization`, the `WebSite`, each hospital as `Hospital` + `MedicalClinic`, doctors as `IndividualPhysician` (optometrists as `Person`), services as medical procedures, breadcrumbs, and FAQ for visible questions. It validates with 0 issues against the schema.org vocabulary across 262 nodes.
- **Metadata rewritten from a keyword map**: 25 unique titles (44-60 characters) and descriptions (145-155), local and patient-first.
- **Crawl-visible fixes**:
  - H1s and headings that read as merged words to a crawler ("CataractSurgery", "Dr. Vishnu S. PatelMS (Ophth)") now have real spaces.
  - Migration notes left visible in service copy ("The legacy site describes…") are gone.
  - The guessed social handles that were showing in the footer are hidden until confirmed.
- **Internal links**: each service page now links to the hospital pages offering it, and doctor cards link to their hospitals. Hospital pages went from 8 to 19 in-content inbound links.
- **Performance**:
  - Fonts are self-hosted, so no third-party requests remain.
  - Metric-matched fallback fonts took home CLS from 0.112 to 0.001.
  - The home hero's LCP went from 7.6s to 2.6s under Lighthouse's mobile throttling (performance score 59 to 84).
  - Below-the-fold images are now lazy.
- **Lighthouse (mobile)**: SEO 100, accessibility 100 and best practices 100 on every page type tested.

## 2. How search works on this site now (maintenance guide)

```
npm run build
  1. vite build                                   -> dist/ (the app; dist/index.html is the template)
  2. vite build --ssr src/entry-server.jsx        -> dist-server/ (the renderer, deleted afterwards)
  3. node scripts/prerender.mjs                   -> every page, 404.html, sitemap.xml, robots.txt,
                                                     _redirects, _headers, .htaccess, .assetsignore
```

| Concern                                   | Where it lives                                                                                                                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A page's title, description, social image | its `seo` block in the data: `home.json`, `services.json` (`seo` and each item's `seo`), `doctors.json`, `branches.json` (`seo` and each item's `page.seo`), `contact.json`, `appointment.json`, `site.json` `pageSeo`             |
| Canonical host                            | `site.json` `defaultSeo.url`. Every absolute URL, the sitemap, robots.txt and the `.htaccess` host rule read it.                                                                                                                   |
| Head tags                                 | `src/lib/seo.js` (`buildHead`, `headTags`, `applyHead` in the browser, `headHtml` in the prerender) through `src/components/SEO.jsx`                                                                                               |
| Structured data                           | `src/lib/schema.js` builds the nodes, `src/components/JsonLd.jsx` composes one graph per page type                                                                                                                                 |
| Which pages exist                         | `getPages()` in `src/entry-server.jsx`, derived from the data. A new service or hospital page is prerendered and added to the sitemap automatically.                                                                               |
| Redirects                                 | `src/data/redirects.json`. Add a line whenever a live URL moves, and never delete one.                                                                                                                                             |
| Ownership tokens                          | `site.json` `verification.google` / `verification.bing` (only needed if not verifying by DNS)                                                                                                                                      |
| Social profiles                           | `site.json` `socialLinks` (network) and each hospital's `socialLinks` in `branches.json`. An entry with `"unconfirmed": true` is kept as a lead and shown nowhere.                                                                 |
| Phone numbers in schema                   | every `phoneGroups` entry, except groups marked `"unconfirmed": true` (the placeholder numbers)                                                                                                                                    |
| Structured address                        | each hospital's `postalAddress` (street, locality) plus `page.postcode`                                                                                                                                                            |
| A service's schema type                   | `schemaType` on each item in `services.json`                                                                                                                                                                                       |
| Medical review (E-E-A-T)                  | a service item's `review: { "by": "Dr. ...", "on": "YYYY-MM-DD" }` emits `reviewedBy` / `lastReviewed`. **Only add it once a doctor has actually reviewed the page.** The visible review line is a next-session item (section 12). |

**The build refuses to ship regressions.** `prerender.mjs` fails the build if any page loses its title, its single `<h1>`, its canonical or valid JSON-LD, renders as not-found, shares a title or description with another page, or if a redirect points at a page that does not exist. It warns when a title runs past 65 characters or a description falls outside 70-165.

**The static copy.** framer-motion's starting styles (opacity 0, transforms, clip-paths) are stripped from the prerendered HTML (and kept beside it, in `data-ssr-style`, for React), and the home hero carries its film's poster in a `<picture>`. The static page is therefore complete and readable without JavaScript, and its first paint counts toward LCP. **React adopts it rather than replacing it** (`hydrateRoot`, see section 17), so that first paint stays the page's largest; the reader's own values (their hospital, the OPD status right now, the cookie sheet) arrive under the curtain or the reload veil, so nobody sees the page settle. What the static HTML says where the build cannot know the answer: the head office's details rather than the reader's hospital, and "OPD hours" with the hospital's times rather than "open now".

## 3. Critical issues fixed

| #   | Issue (before)                                                                                                                                                                                       | Severity | Fix                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| 1   | Every legacy URL (`cataract.php`, `lasik.php`, `glaucoma.php`, `squint.php`, `pterygium.php`, `ourteam.php`, `team_details.php`, `eye-doctors.php`, `appointment_main.php`, ...) would 404 at launch | Critical | 301 map in `src/data/redirects.json`, emitted per host                                  |
| 2   | Every URL served identical HTML (home title, canonical `/`); content and JSON-LD only after JavaScript                                                                                               | Critical | Build-time prerendering of every route                                                  |
| 3   | Unknown URLs returned 200 (soft 404s); `/services/<bad>` was indexable; `/branches/<bad>` silently redirected                                                                                        | Critical | Real `404.html`, `noindex` on not-found states, unknown hospital slugs render not-found |
| 4   | Canonical host undecided: the old site answers on http/https and www/apex                                                                                                                            | Critical | `https://www` everywhere in code; host 301s documented per platform                     |
| 5   | Static `index.html` described "Visnagar, Ahmedabad and Bharuch" (3 of 6 hospitals), with the og:image a stock-looking photo                                                                          | High     | Per-page metadata; default social image is the real Visnagar building                   |
| 6   | Service H1s read as "CataractSurgery"; doctor headings as "Dr. ... PatelMS (Ophth)"                                                                                                                  | High     | Real spaces in ServiceHero, DoctorRoster, BranchTeam and four other headings            |
| 7   | Visible copy said "The legacy site describes..." on LASIK and glaucoma                                                                                                                               | High     | Rewritten (doctor sign-off listed below)                                                |
| 8   | Footer linked guessed social handles                                                                                                                                                                 | High     | Guesses flagged `unconfirmed` and hidden; verified hospital accounts shown              |
| 9   | JSON-LD: `medicalSpecialty` on a `Service`, address as one string, `priceRange "$$"`, placeholder phones, no stable entity graph                                                                     | High     | Rebuilt graph (section 7)                                                               |
| 10  | Hand-written sitemap with stale lastmods; robots.txt on the wrong host                                                                                                                               | Medium   | Generated on every build                                                                |
| 11  | Home hero poster preloaded on every route; desktop poster fetched on phones by static video                                                                                                          | Medium   | Per-route LCP preloads; static `<picture>` poster                                       |
| 12  | Google Fonts render-blocking (about 1.4s on mobile) and a third-party request on every page                                                                                                          | Medium   | Self-hosted fonts, two preloaded, metric-matched fallbacks                              |
| 13  | `theme.json` font stacks unquoted (`Source Serif 4, ...` is invalid CSS)                                                                                                                             | Low      | Quoted, with fallbacks                                                                  |

## 4. Page-by-page

| Page                                      | Title (chars)                                                           | Meta description (chars)                                                                                                                                             | H1                                              | JSON-LD types                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `/`                                       | Eye Hospital in Gujarat Since 1993 \| Aakash Eye Hospital (56)          | Six Aakash eye hospitals across Gujarat since 1993, in Visnagar, Ahmedabad, Gota, Juhapura, Himmatnagar and Bharuch. Cataract, LASIK and retina care. (149)          | Advanced eye care.                              | MedicalOrganization, WebSite, WebPage, Hospital, MedicalClinic                                              |
| `/about/journey`                          | Our Journey Since 1993 \| Aakash Eye Hospital (44)                      | How Aakash Eye Hospital grew from one Visnagar clinic in 1993: phaco cataract surgery from 1995, laser vision correction from 2009, Ahmedabad from 2014. (152)       | From one Visnagar clinic to an eye care network | MedicalOrganization, WebSite, AboutPage, BreadcrumbList                                                     |
| `/about/vision`                           | Vision, Mission and Core Values \| Aakash Eye Hospital (53)             | The mission, vision and core values behind Aakash Eye Hospital: only the care each patient truly needs, affordable and ethical, one standard everywhere. (152)       | Why this hospital exists                        | MedicalOrganization, WebSite, AboutPage, BreadcrumbList                                                     |
| `/services`                               | Eye Care Services and Treatments \| Aakash Eye Hospital (54)            | Cataract, LASIK, retina, glaucoma, squint and children's eye care at Aakash Eye Hospital, Gujarat. Find yours by what you notice and book on WhatsApp. (150)         | You don't need the medical word for it.         | MedicalOrganization, WebSite, CollectionPage, BreadcrumbList                                                |
| `/services/cataract-surgery`              | Cataract Surgery in Ahmedabad \| Aakash Eye Hospital (51)               | Cataract (motiyo) surgery by phaco, with the lens planned for your eye, in Ahmedabad, Visnagar, Bharuch and Himmatnagar. Ask about it on WhatsApp. (146)             | Cataract Surgery                                | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, SurgicalProcedure, Question          |
| `/services/comprehensive-eye-examination` | Complete Eye Check-Up in Ahmedabad \| Aakash Eye Hospital (56)          | Complete eye check-up: vision test, glasses number and a look at the front and back of the eye, at every Aakash Eye Hospital in Gujarat. Book on WhatsApp. (154)     | Comprehensive Eye Examination                   | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, DiagnosticProcedure, Question        |
| `/services/emergency-eye-care`            | Eye Emergency: Signs and What to Do \| Aakash Eye Hospital (57)         | Sudden vision loss, an eye injury or a chemical in the eye? See the signs that cannot wait, what to do first, and call the emergency helpline at once. (150)         | Emergency Eye Care                              | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, MedicalProcedure, Question           |
| `/services/glaucoma-care`                 | Glaucoma Treatment in Ahmedabad \| Aakash Eye Hospital (53)             | Glaucoma check-ups and lifelong care: eye pressure, optic nerve and field tests to protect your sight, in Ahmedabad and Visnagar. Book a check on WhatsApp. (155)    | Comprehensive Glaucoma Care                     | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, MedicalProcedure, Question           |
| `/services/lasik-refractive-surgery`      | LASIK Surgery in Ahmedabad & Visnagar \| Aakash Eye Hospital (59)       | Find out if LASIK suits your eyes. Laser vision correction since 2009, bladeless where suitable and ICL for higher numbers. Book a LASIK check on WhatsApp. (155)    | LASIK & Refractive Surgery                      | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, SurgicalProcedure, Question          |
| `/services/myopia-clinic`                 | Children's Myopia Clinic in Ahmedabad \| Aakash Eye Hospital (59)       | Is your child's spectacle number rising every year? Our myopia clinic tracks it over time and explains the control options, in Ahmedabad. Book on WhatsApp. (155)    | Myopia Clinic                                   | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, MedicalTherapy, Question             |
| `/services/oculoplasty`                   | Oculoplasty: Eyelid and Tear Duct Care \| Aakash Eye Hospital (60)      | Watering eye, a drooping eyelid or a lump on the lid? Oculoplasty care for eyelids and tear ducts in Ahmedabad, Bharuch and Visnagar. Ask us on WhatsApp. (153)      | Oculoplasty                                     | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, SurgicalProcedure, Question          |
| `/services/optical-services`              | Spectacles and Optical Services \| Aakash Eye Hospital (53)             | Spectacles made to your doctor's prescription, with frame and lens guidance and help with children's glasses. Ask on WhatsApp which hospital to visit. (150)         | Optical Services                                | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, MedicalTherapy, Question             |
| `/services/pediatric-eye-care`            | Pediatric Eye Care in Ahmedabad \| Aakash Eye Hospital (53)             | Children's eye check-ups, lazy eye care and school vision tests, with a visiting pediatric ophthalmologist in Ahmedabad. Book a visit on WhatsApp. (146)             | Pediatric Eye Care                              | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, MedicalProcedure, Question           |
| `/services/retina-services`               | Retina Specialists in Ahmedabad \| Aakash Eye Hospital (53)             | Retina specialists for diabetic retinopathy, macular problems, flashes and floaters, with OCT and laser, in Ahmedabad, Gota and Visnagar. Book on WhatsApp. (155)    | Retina Services                                 | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, MedicalProcedure, Question           |
| `/services/squint-services`               | Squint Eye Treatment in Ahmedabad \| Aakash Eye Hospital (55)           | Squint (crossed or turned eyes) in children and adults: assessment, glasses, and surgery when advised, in Ahmedabad and Visnagar. Book a check on WhatsApp. (155)    | Squint Services                                 | MedicalOrganization, WebSite, MedicalWebPage, FAQPage, BreadcrumbList, MedicalProcedure, Question           |
| `/doctors`                                | Eye Specialists and Surgeons \| Aakash Eye Hospital (50)                | Meet the eye surgeons, retina, oculoplasty and children's specialists and optometrists at every Aakash Eye Hospital in Gujarat. Book on WhatsApp. (145)              | Meet the doctors who will see you.              | MedicalOrganization, WebSite, CollectionPage, BreadcrumbList, IndividualPhysician, Person                   |
| `/doctors/dr-aakash-v-patel`              | Dr. Aakash V. Patel, Ophthalmic Surgeon \| Aakash Eye Hospital (61)     | Dr. Aakash V. Patel, Ophthalmic Surgeon at Aakash Eye Hospital in Visnagar and Gota. Interests include cataract surgery, FLACS and glaucoma. Book on WhatsApp. (158) | Dr. Aakash V. Patel                             | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-ashesh-patel`                | Dr. Ashesh Patel, Ophthalmologist \| Aakash Eye Hospital (55)           | Dr. Ashesh Patel, DO, MS (Ophth), Ophthalmologist at Aakash Eye Hospital in Bharuch. Book on WhatsApp. (102)                                                         | Dr. Ashesh Patel                                | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-dhaivat-vasavada`            | Dr. Dhaivat Vasavada, Senior Vitreoretina Consultant (52)               | Dr. Dhaivat Vasavada, MS (Ophth), FAECS, FAICO (VR), Senior Vitreoretina Consultant at Aakash Eye Hospital in Visnagar, Ahmedabad and Gota. Book on WhatsApp. (157)  | Dr. Dhaivat Vasavada                            | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-faizurraheman-chauhan`       | Dr. Faizurraheman Chauhan, Ophthalmologist \| Aakash Eye Hospital (64)  | Dr. Faizurraheman Chauhan, DOMS, Ophthalmologist at Aakash Eye Hospital in Juhapura. Book on WhatsApp. (102)                                                         | Dr. Faizurraheman Chauhan                       | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-gaurang-amin`                | Dr. Gaurang Amin, Ophthalmologist \| Aakash Eye Hospital (55)           | Dr. Gaurang Amin, MS (Ophth), DOMS, Ophthalmologist at Aakash Eye Hospital in Bharuch. Book on WhatsApp. (104)                                                       | Dr. Gaurang Amin                                | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-gunjan-shah`                 | Dr. Gunjan Shah, Cornea and Refractive Specialist (49)                  | Dr. Gunjan Shah, Cornea and Refractive Specialist at Aakash Eye Hospital in Ahmedabad. Book on WhatsApp. (104)                                                       | Dr. Gunjan Shah                                 | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-harsh-shah`                  | Dr. Harsh Shah, Oculoplasty Specialist \| Aakash Eye Hospital (60)      | Dr. Harsh Shah, MS (Ophth), Fellowship in Orbit and Oculoplasty, Oculoplasty Specialist at Aakash Eye Hospital in Ahmedabad. Book on WhatsApp. (142)                 | Dr. Harsh Shah                                  | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-kshitij-gandhi`              | Dr. Kshitij Gandhi, Ophthalmologist \| Aakash Eye Hospital (57)         | Dr. Kshitij Gandhi, MS (Ophth), Ophthalmologist at Aakash Eye Hospital in Gota. Book on WhatsApp. (97)                                                               | Dr. Kshitij Gandhi                              | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-kushal-shah`                 | Dr. Kushal Shah, Ophthalmic Surgeon \| Aakash Eye Hospital (57)         | Dr. Kushal Shah, MS (Ophth), Ophthalmic Surgeon at Aakash Eye Hospital in Ahmedabad. Book on WhatsApp. (102)                                                         | Dr. Kushal Shah                                 | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-nirav-zala`                  | Dr. Nirav Zala, Vitreoretina Consultant \| Aakash Eye Hospital (61)     | Dr. Nirav Zala, DNB (Ophth), FAECS, Vitreoretina Consultant at Aakash Eye Hospital in Visnagar, Ahmedabad and Gota. Book on WhatsApp. (133)                          | Dr. Nirav Zala                                  | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-nishant-m-patel`             | Dr. Nishant M. Patel, Ophthalmic Surgeon \| Aakash Eye Hospital (62)    | Dr. Nishant M. Patel, Ophthalmic Surgeon at Aakash Eye Hospital in Visnagar. Interests include cataract surgery, FLACS and pterygium. Book on WhatsApp. (151)        | Dr. Nishant M. Patel                            | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-pooja-yadav-patel`           | Dr. Pooja Yadav Patel, Oculoplasty Surgeon \| Aakash Eye Hospital (64)  | Dr. Pooja Yadav Patel, MS (Ophth), Oculoplasty Surgeon at Aakash Eye Hospital in Visnagar and Bharuch. Book on WhatsApp. (120)                                       | Dr. Pooja Yadav Patel                           | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-riddhi-bhatt`                | Dr. Riddhi Bhatt, Pediatric Ophthalmologist \| Aakash Eye Hospital (65) | Dr. Riddhi Bhatt, MS (Ophth), Pediatric Ophthalmologist at Aakash Eye Hospital in Ahmedabad. Book on WhatsApp. (110)                                                 | Dr. Riddhi Bhatt                                | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-ronak-patel`                 | Dr. Ronak Patel, Ophthalmologist \| Aakash Eye Hospital (54)            | Dr. Ronak Patel, DNB (Ophth), Ophthalmologist at Aakash Eye Hospital in Himmatnagar. Book on WhatsApp. (102)                                                         | Dr. Ronak Patel                                 | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-sanjay-b-patel`              | Dr. Sanjay B. Patel, Ophthalmic Surgeon \| Aakash Eye Hospital (61)     | Dr. Sanjay B. Patel, Ophthalmic Surgeon at Aakash Eye Hospital in Visnagar and Gota. Interests include cataract surgery, FLACS and glaucoma. Book on WhatsApp. (158) | Dr. Sanjay B. Patel                             | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-saurabh-kapoor`              | Dr. Saurabh Kapoor, Senior Phacorefractive Surgeon (50)                 | Dr. Saurabh Kapoor, DO, DNB (Ophth), MNAMS, Senior Phacorefractive Surgeon at Aakash Eye Hospital in Ahmedabad and Gota. Book on WhatsApp. (138)                     | Dr. Saurabh Kapoor                              | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-toral-a-patel`               | Dr. Toral A. Patel, Ophthalmic Surgeon \| Aakash Eye Hospital (60)      | Dr. Toral A. Patel, Ophthalmic Surgeon at Aakash Eye Hospital in Visnagar. Interests include LASIK, Femto LASIK, cataract surgery and FLACS. Book on WhatsApp. (158) | Dr. Toral A. Patel                              | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-vijay-gupta`                 | Dr. Vijay Gupta, Ophthalmic Surgeon \| Aakash Eye Hospital (57)         | Dr. Vijay Gupta, DO (Ophth), Ophthalmic Surgeon at Aakash Eye Hospital in Visnagar. Interests include cataract surgery and pterygium. Book on WhatsApp. (151)        | Dr. Vijay Gupta                                 | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/doctors/dr-vishnu-s-patel`              | Dr. Vishnu S. Patel, Ophthalmic Surgeon \| Aakash Eye Hospital (61)     | Dr. Vishnu S. Patel, Ophthalmic Surgeon at Aakash Eye Hospital in Visnagar and Gota. Interests include cataract surgery, FLACS and glaucoma. Book on WhatsApp. (158) | Dr. Vishnu S. Patel                             | MedicalOrganization, WebSite, ProfilePage, BreadcrumbList, IndividualPhysician                              |
| `/branches`                               | Hospital Branches and Directions \| Aakash Eye Hospital (54)            | Find your nearest Aakash Eye Hospital, from Visnagar and Himmatnagar to Ahmedabad (Odhav, Gota, Juhapura) and Bharuch, with OPD numbers and directions. (151)        | Six hospitals across Gujarat                    | MedicalOrganization, WebSite, CollectionPage, BreadcrumbList, Hospital, MedicalClinic                       |
| `/branches/ahmedabad`                     | Eye Hospital in Ahmedabad (Odhav) \| Aakash Eye Hospital (55)           | Aakash Eye Hospital at Odhav Circle on S.P. Ring Road, Ahmedabad, since 2014: cataract, retina and LASIK care with its own OPD. Call or book on WhatsApp. (153)      | Aakash Eye Hospital Ahmedabad                   | MedicalOrganization, WebSite, WebPage, BreadcrumbList, Hospital, MedicalClinic, IndividualPhysician, Person |
| `/branches/bharuch`                       | Eye Hospital in Bharuch \| Aakash Eye Hospital (45)                     | Aakash Eye Hospital in Bharuch at R K Casta, opposite Navi Vasahat, near Healing Touch Hospital. Cataract, retina and everyday eye care. Book on WhatsApp. (154)     | Aakash Eye Hospital Bharuch                     | MedicalOrganization, WebSite, WebPage, BreadcrumbList, Hospital, MedicalClinic, IndividualPhysician, Person |
| `/branches/gota`                          | Eye Hospital in Gota, Ahmedabad \| Aakash Eye Hospital (53)             | Aakash Eye Hospital at Ananta Space in Gota, Ahmedabad: cataract, LASIK, retina and everyday eye care, with its own OPD. Call or book on WhatsApp. (146)             | Aakash Eye Hospital Gota                        | MedicalOrganization, WebSite, WebPage, BreadcrumbList, Hospital, MedicalClinic, IndividualPhysician, Person |
| `/branches/himmatnagar`                   | Eye Hospital in Himmatnagar \| Aakash Eye Hospital (49)                 | Aakash Eye Hospital in Himmatnagar (Himatnagar) on Sahakari Jin Road, off NH-48, for Sabarkantha. Cataract, LASIK and everyday eye care. Book on WhatsApp. (154)     | Aakash Eye Hospital Himmatnagar                 | MedicalOrganization, WebSite, WebPage, BreadcrumbList, Hospital, MedicalClinic, IndividualPhysician, Person |
| `/branches/juhapura`                      | Eye Hospital in Juhapura, Sarkhej \| Aakash Eye Hospital (55)           | Aakash Eye Hospital at Amber Tower, Blue Water Complex, Vasna Road, Juhapura-Sarkhej, Ahmedabad. Cataract, LASIK and everyday eye care. Book on WhatsApp. (153)      | Aakash Eye Hospital Juhapura                    | MedicalOrganization, WebSite, WebPage, BreadcrumbList, Hospital, MedicalClinic, IndividualPhysician         |
| `/branches/visnagar`                      | Eye Hospital in Visnagar, Mehsana \| Aakash Eye Hospital (55)           | Aakash Eye Hospital's head office since 1993, near New Court on M.N. College Road, Visnagar. Cataract, LASIK, retina and glaucoma care. Book on WhatsApp. (153)      | Aakash Eye Hospital Visnagar                    | MedicalOrganization, WebSite, WebPage, BreadcrumbList, Hospital, MedicalClinic, IndividualPhysician         |
| `/appointment`                            | Book an Eye Appointment on WhatsApp \| Aakash Eye Hospital (57)         | Request an eye appointment at any Aakash Eye Hospital on WhatsApp: choose the hospital, the reason and a day. The hospital replies to confirm your slot. (152)       | Tell us when, we hold the slot.                 | MedicalOrganization, WebSite, WebPage, BreadcrumbList                                                       |
| `/contact`                                | Contact: Phone Numbers & WhatsApp \| Aakash Eye Hospital (55)           | Phone numbers, WhatsApp and directions for every Aakash Eye Hospital, from Visnagar and Himmatnagar to Ahmedabad and Bharuch, plus the emergency helpline. (154)     | The right desk, one call away.                  | MedicalOrganization, WebSite, ContactPage, BreadcrumbList, Hospital, MedicalClinic                          |

**Ownership, so pages never compete:**

- Brand queries go to `/`.
- "Eye hospital in Ahmedabad" goes to `/branches/ahmedabad` (Odhav, the first Ahmedabad hospital, since 2014). Gota and Juhapura own their locality names.
- Each town query ("eye hospital in Visnagar / Bharuch / Himmatnagar") goes to that hospital's page.
- Treatment queries go to the service page ("cataract surgery in Ahmedabad" to `/services/cataract-surgery`, and so on).
- `/services` owns "eye care services"; `/doctors` owns "eye specialists" and doctor-name queries until individual doctor pages exist.

Patient words now in metadata: _motiyo_ (cataract), _squint (crossed or turned eyes)_, _Himatnagar_ (the postal spelling), _Sabarkantha_, _Mehsana_. The full keyword research (Gujarati and Hindi behaviour, secondary keywords, content gaps per page) was the basis for these choices; its conclusions are folded into the tables above and the roadmap below.

## 5. Local SEO, hospital by hospital

| Hospital    | Address (PIN)                                                                                                                                      | Phones in schema       | Placeholder numbers    | Social (confirmed)  | Photos           | Team | Since       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------- | ------------------- | ---------------- | ---- | ----------- |
| Visnagar    | Near New Court, M.N. College Road, Near GEB, Visnagar - 384315, North Gujarat (384315)                                                             | OPD, Operation, LASIK  | none                   | Instagram, Facebook | own              | 9    | 1993        |
| Ahmedabad   | Siddhi Vinayak Arcade, 2nd Wing, 1st Floor, 200' S.P. Ring Road, Odhav Circle, Near Gujarat Vepari Maha Mandal, Odhav, Ahmedabad - 382410 (382410) | OPD, Operation / LASIK | none                   | Facebook            | own              | 8    | 2014        |
| Bharuch     | F-101-106, 201-204, R K Casta, Near Healing Touch Hospital, Opp. Navi Vasahat, Bharuch (**no PIN**)                                                | OPD, Operation         | none                   | none yet            | borrows Visnagar | 4    | unconfirmed |
| Gota        | Ananta Space, 505-08, Gota, Ahmedabad, Gujarat 382470 (382470)                                                                                     | none                   | OPD, Operation / LASIK | none yet            | borrows Visnagar | 9    | unconfirmed |
| Himmatnagar | 2nd Floor, Upadhyay M Corporate, Sahakari Jin Rd, near Ola Showroom, Sahakari Jin, NH48, Himatnagar, Gujarat 383001 (383001)                       | OPD                    | Operation / LASIK      | none yet            | own              | 3    | unconfirmed |
| Juhapura    | Amber Tower, 306-314, Blue Water Complex, Vasna Road, near Sagar Avenue, Sarkhej, Ahmedabad, Gujarat 380055 (380055)                               | none                   | OPD, Operation / LASIK | none yet            | own              | 1    | unconfirmed |

What each hospital page already has, and what makes it more than a doorway page:

- its own address and landmarks, a drawn map, desk numbers, OPD hours with a live open/closed status, its own doctors, its own photographs (four of six), the services it offers, and a `Hospital` + `MedicalClinic` node with geo, hours, its own `contactPoint`s and `sameAs`;
- an appointment button that preselects the hospital.

**NAP consistency checklist.** Make every listing match the site character for character:

- [ ] Name: **"Aakash Eye Hospital"** plus the area (e.g. "Aakash Eye Hospital - Odhav"). Use one pattern everywhere (GBP, Justdial, Practo, Lybrate, Bing, Apple, IndiaMART, Facebook).
- [ ] Address: exactly as in `branches.json` `address`. **Bharuch has no PIN on the site**: a public map listing gives `392001`. Confirm it, then add `page.postcode` for Bharuch.
- [ ] Phone: the OPD number first. **Gota, Juhapura and Himmatnagar's operation desk still carry placeholder numbers** (`+91-900-000-000x`). Never publish a listing with them. Himmatnagar's road signboard shows `+91 95120 41164` (now the site's Himmatnagar OPD).
- [ ] Ahmedabad's OPD mobile: the brief says `+91-937-415-1616`, the old site `+91-937-413-1616`. Confirm which.
- [ ] Bharuch's landline is stored as `(026)-42242359`. The STD code is `02642`, so the conventional form is `(02642) 242359`; aehbharuch.com copies the odd form. The schema already emits it correctly (`+912642242359`). Change the display form once confirmed.
- [ ] Coordinates in `branches.json` are approximate. Replace them with each GBP pin's exact lat/lng.
- [ ] Hours: confirm all six `hours` blocks. A directory (Bajaj Finserv Health) lists Odhav at 08:00-19:15; the site says 09:00-20:00.
- [ ] Justdial still lists Dr. Mahendra Patel and puts Dr. Vishnu S. Patel under Paediatricians. Ask for corrections.

**Google Business Profile plan (one profile per hospital):**

- **Primary category:** "Eye care center". **Secondary:** "Ophthalmologist", "LASIK surgeon" (where LASIK is done on site), "Optician" (where there is an optical counter), and "Hospital" only if the branch has its own operation theatre. Pick from GBP's own list, which changes.
- **Website link:** that hospital's own page, tagged so Search Console and analytics can tell GBP traffic apart: `https://www.aakasheyehospital.com/branches/visnagar?utm_source=google&utm_medium=organic&utm_campaign=gbp-visnagar`. The page's canonical drops the query, so the tagged URL never competes with the clean one.
- **Appointment link:** `https://www.aakasheyehospital.com/appointment?branch=visnagar&utm_source=google&utm_medium=organic&utm_campaign=gbp-visnagar-book`. It opens the booking flow with the hospital chosen.
- **Services:** list the eleven services with the site's names, each linked to its service page. Use the products/services descriptions from `services.json` `shortDescription`.
- **Photos:** the files in `public/assets/media/branches/<slug>/` (exterior first, so it matches what a visitor looks for), then the reception, the waiting hall and the consulting room. Bharuch and Gota need their own shoot: the site borrows Visnagar's interior for them and must not claim it as theirs.
- **Hospital attributes:** wheelchair access, parking, payments accepted, languages, but only the ones that are true.
- **Posts:** one a month per hospital (camp days, a new consultant's days, festival hours), each linking to the hospital page with UTM tags.
- **Q&A:** seed with real patient questions (fees policy if published, timings, parking, whether a dilated exam means bringing a driver), answered by the hospital account.
- **Reviews:** ask every patient at discharge or after the OPD visit, by WhatsApp, with the profile's review link. Ask everyone, not only happy patients (no "review gating"), and never offer anything in return. Reply to every review within a week. Never confirm that someone is a patient, and never mention a condition or treatment in a reply. Thank, invite them to call the hospital, and sign off with the hospital's name. Respond to negative reviews the same way and take the conversation offline.

## 6. Structured data

| Page type                     | `@graph`                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every page                    | `MedicalOrganization` (`/#organization`: logo, founding date and place, head-office address, emergency `ContactPoint`, `subOrganization` → the six hospitals, `alternateName` "Akash Eye Hospital"), `WebSite` (`/#website`), the page's `WebPage` node, `BreadcrumbList` (except home)        |
| Home, `/branches`, `/contact` | + six `Hospital`/`MedicalClinic` nodes (`/branches/<slug>#hospital`) with structured `PostalAddress`, `geo`, `openingHoursSpecification`, confirmed phones only, `hasMap`, `parentOrganization`, per-desk `ContactPoint`s, `sameAs`                                                            |
| Hospital page                 | + its `Hospital` node with `availableService` (the services it lists), + an `IndividualPhysician` (or `Person` for optometrists) for everyone who sees patients there, `practicesAt` → the hospital                                                                                            |
| `/services`                   | `CollectionPage` with an `ItemList` of the eleven services                                                                                                                                                                                                                                     |
| Service page                  | `MedicalWebPage` + `FAQPage` (`mainEntity` → the visible questions), the service as `SurgicalProcedure` / `MedicalProcedure` / `DiagnosticProcedure` / `MedicalTherapy` (`schemaType`), `bodyLocation` from the eye model's part, `reviewedBy` / `lastReviewed` once the data carries a review |
| `/doctors`                    | `CollectionPage` + `ItemList` + 25 people (`IndividualPhysician` / `Person`), with `hasCredential` (their degrees), `knowsAbout` (their listed interests) and `practicesAt` / `worksFor`                                                                                                       |
| About pages                   | `AboutPage`; `/appointment` a `WebPage`; `/contact` a `ContactPage`                                                                                                                                                                                                                            |

Deliberately **not** included: ratings, reviews, `AggregateRating`, prices, awards, accreditation, unconfirmed phones or social profiles, and anything not visible on the page. Several competitors mark up self-serving ratings, which risks a manual action.

## 7. Migration and redirects

The full map is `src/data/redirects.json` (25 entries):

| Old URL                                                                                             | New URL                                                                          |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `/`, `/index.php`, `/index.html`                                                                    | `/`                                                                              |
| `/about.php`, `/times_of_aakash.php`, `/socialactivity.php`, `/portfolio.php`                       | `/about/journey`                                                                 |
| `/ourteam.php`, `/eye-specialists.php`, `/team_details.php?team_id=*`, `/eye-doctors.php?team_id=*` | `/doctors`                                                                       |
| `/appointment_main.php`                                                                             | `/appointment`                                                                   |
| `/contact.php`, `/feedback.php`                                                                     | `/contact`                                                                       |
| `/cataract.php`, `/cataract.aspx`                                                                   | `/services/cataract-surgery`                                                     |
| `/lasik.php`, `/lasik.aspx`, `/advanced_facilities.php`                                             | `/services/lasik-refractive-surgery`                                             |
| `/glaucoma.php`, `/glaucoma.aspx`                                                                   | `/services/glaucoma-care`                                                        |
| `/squint.php`, `/squint.aspx`                                                                       | `/services/squint-services`                                                      |
| `/pterygium.php`, `/pterygium.aspx`                                                                 | `/services/oculoplasty` (the DCR/watering-eye half; see the pterygium gap below) |
| `/about`                                                                                            | `/about/journey`                                                                 |

Hosts outside the code (`hosting.md`): http and apex → `https://www`; `blog.aakasheyehospital.com` (4 posts) → the cataract and LASIK pages; `aehbharuch.com` → `/branches/bharuch`.

**Topic the old site ranked for that the new site lacks: pterygium ("vel").** The old `pterygium.php` covered pterygium excision with conjunctival autograft. Dr. Saurabh Kapoor's listed interests include pterygium, so the hospital still treats it. Add a doctor-written pterygium section, either to the comprehensive eye examination or oculoplasty page or as a condition guide (section 12), so that ranking has somewhere to land.

## 8. Validation (Session 1)

- `npm run lint`: clean (now also lints `scripts/` and `vite.config.js`). `npm run build`: 25 pages + 404, 0 prerender errors, 0 warnings.
- **Host behaviour** (local server emulating Cloudflare/Netlify): pages 200 at slash-less URLs, trailing slash → redirect, all legacy URLs 301 to their targets (query strings dropped), unknown paths 404 with the not-found page.
- **Browser** (headless Chrome, 390 and 1440 wide, 12 key routes): no console errors, no horizontal overflow, the curtain and veil removed after load, the head replaced (never duplicated) on client navigation, exactly one H1, one canonical and one JSON-LD script per page.
- **Touch** (390x664): service-page hospital links, doctor-card hospital links and the hospital "Follow" links each land on their own target; links rest in their sentence's ink after a tap.
- **Structured data**: 262 nodes, 0 issues against the schema.org vocabulary. The validator itself was proved on known-bad input.
- **Lighthouse mobile, devtools throttling, gzip host:**

| Page             | Performance | Accessibility | Best practices | SEO | FCP      | LCP  | CLS   |
| ---------------- | ----------- | ------------- | -------------- | --- | -------- | ---- | ----- |
| Home             | 84          | 100           | 100            | 100 | 2.5s     | 2.6s | 0.001 |
| Cataract surgery | 66-72       | 100           | 100            | 100 | 2.1-3.7s | 5.3s | 0     |
| Visnagar         | 68-72       | 100           | 100            | 100 | 2.3-3.8s | 4.6s | 0.001 |
| Doctors          | 63          | 100           | 100            | 100 | 3.7s     | 6.9s | 0.001 |

Measured directly in Chrome at slow-4G with 4x CPU: the cataract page's LCP is 1.7s (its hero sentence) and Visnagar's 3.2s (its facade photo). Lighthouse's own simulation over-counts LCP on these pages. The remaining cost is the single 285KB stylesheet (51KB gzipped) and the JPEG photographs (section 12).

## 9. Remaining risks

1. **The host is not chosen.** Until the two host-level jobs in `hosting.md` are done (one `https://www` host; `404.html` with status 404), the old site's ranking signals stay split across four hosts.
2. **Placeholder phone numbers** (Gota, Juhapura, Himmatnagar's operation desk) are still on the site. They're kept out of the schema, but readers can still call them.
3. **Unapproved clinical copy**: every service's causes, symptoms and FAQs, the emergency band, six newly written services and the eye model need a doctor's sign-off (CLAUDE.md "Known Launch Notes"). YMYL sites are judged on this.
4. **AI-generated hero film.** The home film was generated (its frames carried a generator watermark), but its accessible description calls it "the hospital building, the main atrium reception and an examination room". Replace it with real footage, or reword the description so it makes no claim the film can't back. This is a trust (E-E-A-T) issue, not a ranking one.
5. **Unconfirmed figures** on the home page (surgery and patient counts are placeholders, per CLAUDE.md). A number nobody can back is a liability on a medical site.
6. **Two competing hospital sites** (`aehbharuch.com`, the old blog) and directory listings with stale data.
7. **Hospital photography** is missing for Bharuch and Gota, and only 5 of 25 people have a portrait.
8. **PageSpeed's lab LCP is still 4.4-6.3s on mobile**, but no longer because of the paint: React now adopts the prerendered page (section 18), so Chrome's observed LCP is the first paint (67-107ms locally, against 2.1-2.3s before) and that is what real visitors report. What keeps the lab figure up is Lighthouse charging the app's script download to the LCP, because the script starts with the HTML. Starting the script after the first paint was tried and rejected: it made the page usable 0.04-0.37s later on a slow line (section 18).

## 10. Facts and approvals needed from the hospital

- **Hosting decision**, and access to DNS for the Search Console TXT record and the host redirects.
- **Phone numbers:** the real Gota, Juhapura and Himmatnagar operation numbers; which Ahmedabad OPD mobile is right; Bharuch's landline in its correct form; Bharuch's PIN.
- **Social accounts:** confirm `instagram.com/aeh.visnagar`, `facebook.com/eyehospitalvisnagar` and `facebook.com/AakashEyeHospitalOdhav` are the hospital's own. Supply the Instagram (and any Facebook) URL for Ahmedabad, Bharuch, Gota, Himmatnagar and Juhapura, and say which network-level accounts exist. The current leads (`facebook.com/AakashEyeCareHospital`, `instagram.com/aakash_eyehospital`, `x.com/aakashehospital`) sit in `site.json` flagged `unconfirmed`. Removing the flag publishes them.
- **Hours** for all six, the GBP pin coordinates, and the GBP admin access for each.
- **Ownership** of `aehbharuch.com` and `blog.aakasheyehospital.com`.
- The **consultation languages** (`site.brand.languages` says English, Gujarati and Hindi; the schema states this).
- Opening years for Bharuch, Gota, Himmatnagar and Juhapura; the founder's name and history (an IndiaMART listing names Dr. Vishnubhai Patel and 8 Aug 1993).
- Whether insurance/cashless/TPA and government schemes are accepted, per hospital, and whether prices may be published. Competitors rank with both; publish only what is confirmed.
- Doctor details for profile pages: registration numbers (with consent), "practising since" years, languages, OPD days, and a 1200x1500 portrait.

## 11. Copy needing a doctor's sign-off (added this session)

- LASIK `longDescription` (rewritten): "LASIK is a laser procedure that can remove or reduce dependence on glasses and contact lenses for suitable patients." plus the paragraph on topography, pachymetry and wavefront aberrometry. The old copy promised "permanent removal".
- Glaucoma `longDescription[1]` (rewritten): tonometry, perimetry, OCT of the nerve fibre layer and ganglion cells, optic disc and retinal photographs. The equipment brand names were dropped as unverified.
- All 25 meta descriptions (section 4), especially "Cataract (motiyo) surgery by phaco, with the lens planned for your eye", "Laser vision correction since 2009, bladeless where suitable and ICL for higher numbers" and "Retina specialists for diabetic retinopathy, macular problems, flashes and floaters, with OCT and laser".
- `site.defaultSeo.description` (the organisation's description in every page's structured data).

## 12. Roadmap: Session 2 onwards, in priority order

1. ~~**Doctor profile pages**~~: done in Session 2 (section 16). Grow them as the hospital supplies portraits, bios, languages, OPD days and registration numbers.
2. **Medical review line**: a visible "Medically reviewed by Dr. X, <date>" on service pages, linked to the doctor's profile, driven by the `review` field the schema already reads. No competitor has one.
3. **Image pipeline**: WebP/AVIF encodes with `srcset`/`sizes` for heroes, service photos and galleries. Lighthouse estimates 140-195KB saved per page, and the hospital-page LCP should come down by about 1s. Fix `SmartImage`'s `sizes` without `srcset`.
4. ~~**Per-route CSS**~~: done in Session 3 (section 17).
5. ~~**Adopt the prerendered page instead of replacing it**~~: done in Session 4 (section 17). What is left of the lab LCP is the app's script downloading before the first paint (section 18). Starting it after the first paint was built, measured and rejected: the curtain and the reload veil lifted later on a slow line.
6. **Condition guides** (`/conditions/<slug>`, doctor-written and reviewed): cataract (motiyo), pterygium (vel), watering eye/DCR, diabetic retinopathy, glaucoma, retinal detachment warning signs, myopia in children, squint, dry eye, floaters and flashes. Migrate the four old blog posts into them.
7. **Gujarati pages** (`/gu/...`) for home, the six hospitals, cataract, LASIK, glaucoma, emergency, contact and appointment, with reciprocal `hreflang` (en-IN / gu-IN). Unique in North Gujarat.
8. **Hospital pages**: visible FAQs (parking, timings, what to bring), a confirmed "patients come from" line, links to doctor profiles.
9. **Consent-safe analytics** (below), then the insurance/cashless page and cost explainer once the facts are confirmed.

## 13. Measurement plan

Load GA4 only when `site.json` carries a measurement ID **and** the reader has allowed the Analytics cookie category (`allowsCategory("analytics")` in `src/lib/consent.js`). The cookie copy already describes that category. Events, all lower-case snake case, each carrying `branch` (slug) and `page_type` where relevant:

| Event                          | Fired when                                                                  |
| ------------------------------ | --------------------------------------------------------------------------- |
| `click_call`                   | any `tel:` link (`desk`: OPD / operation / emergency)                       |
| `click_whatsapp`               | any `wa.me` link outside the booking flow                                   |
| `click_directions`             | any Google Maps link                                                        |
| `click_book`                   | any link to `/appointment` (`source`: hero, header, bar, footer)            |
| `branch_select`                | the header, contact switchboard or booking flow stores a hospital           |
| `appointment_step`             | the booking flow moves to a step (`step`: who / where / what / when / send) |
| `appointment_whatsapp_handoff` | Send on WhatsApp is pressed (`service`)                                     |
| `service_tab`, `faq_open`      | a service page's tab or question is opened                                  |

Reporting:

- **Search Console:** queries and pages, split brand vs non-brand, and per hospital page.
- **GBP Insights:** calls, direction requests and website clicks per hospital.
- **GA4:** the events above, with the `gbp-*` UTM campaigns separating Maps traffic from organic search.

## 14. Off-page

- **Citations** (same NAP as section 5): Google, Bing Places, Apple Business Connect, Justdial, Practo, Lybrate, Sulekha, Drlogy, Clinicspots, Bajaj Finserv Health, IndiaMART, Facebook and Instagram per hospital. Fix the stale ones listed above first.
- **Links worth having:** the Gujarat Ophthalmological Society and AIOS member listings for the consultants; local news coverage of eye camps (the old site's social-activity page shows camps); hospital and college partnerships; sponsorship pages for school screening camps. Avoid paid link packages and article spinners: the old site's footer credited an SEO vendor whose Scribd and SlideShare documents still float around.
- **Reputation:** the review workflow in section 5, and a monthly check of the top directory listings.

## 15. Competitors (summary of the Session 1 research)

| Competitor       | Strength                                                          | Weakness Aakash can beat                                                      |
| ---------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Dr. Agarwal's    | 828 doctor pages, city × service pages, published cataract prices | No branch in any Aakash town; no reviewed-by line; templated copy             |
| ASG              | 17 specialty × Ahmedabad pages, city hub, insurance blocks        | Thin doctor pages, 6 H1s on home, 1.9MB HTML                                  |
| Centre for Sight | Best clinical cataract page (about 4,200 words, price table)      | 474-word Ahmedabad page; doctor page 282 words                                |
| Raghudeep        | Strongest clinical reputation                                     | Home, doctors and services are an empty Angular shell to crawlers; no JSON-LD |
| Krisha           | Aggressive local SEO, Gujarati pages                              | One surgeon; doorway locality pages; contradictory credentials                |

**Where Aakash wins:** it's the only network in Visnagar, Himmatnagar, Gota, Odhav and Juhapura, with real hospital pages, live OPD status and real photographs; a fast prerendered site; medically reviewed content once item 2 lands; and doctor pages better than anyone's once item 1 lands.

## 16. Session 2: doctor profile pages

**Built:** `/doctors/<slug>` for the nineteen doctors (19 new indexable pages, 44 in all), from `doctors.json` alone. Each page has:

- **Hero:** portrait or monogram, specialty, the name as the H1, qualifications, areas of interest, and "Book at <hospital>" / "Call <hospital> OPD".
- **Where to see them:** a card per hospital, with OPD hours where they're based and clinic days where they visit.
- **Treatments:** linked to the service pages.
- **Colleagues:** up to six doctors sharing a hospital, linked to their profiles.
- **Structured data:** a `ProfilePage` whose main entity is an `IndividualPhysician` with its own URL, `practicesAt`, `hospitalAffiliation`, `availableService` and `hasCredential`.

Every doctor card (roster, hospital teams, home rail) now opens the doctor's page, and every hospital and service named on a profile links back. A doctor's name now has a page of its own to rank for, internally linked from the roster, the hospital they practise at, the home page and their colleagues.

**Rules it introduced:**

- **No calls to placeholder numbers:** a call action appears only for a confirmed number (`getConfirmedPrimaryPhone()`). Gota, Juhapura and Himmatnagar's operation desk get booking and directions only until their numbers are confirmed.
- **Treatments stay within the doctor's own listing:** each doctor's treatments (`services` in `doctors.json`) come only from their listed interests and specialty. The hospital should confirm the lists.

**Validation:**

- All 44 pages at 390 and 1440 wide: no overflow, one H1, one canonical, one JSON-LD script, no console errors.
- Schema: 357 nodes, 0 issues.
- Lighthouse mobile on profiles: performance 87-90; accessibility, best practices and SEO 100; LCP 2.4-2.7s; CLS 0.
- Real touch taps on all three kinds of card open the right profile, and hospital links inside cards still open hospitals.
- Keyboard focus rings the whole card.
- Checked in Safari 27 at phone and desktop width.

**To make them better (needs the hospital):** portraits for the 14 doctors without one, short bios, consultation languages, OPD days at each hospital, a "practising since" year, and registration numbers (with consent).

## 17. Session 3: stylesheets per page

**Built:** each page now loads the shared stylesheet (59KB, 12.2KB gzipped) and its own, instead of one 285KB stylesheet (51KB gzipped) on every page. Page sheets range from 8KB (doctors, a doctor, the hospitals index) to 53KB (the services pages). How it works, and the rules for adding a page, are in CLAUDE.md under "Stylesheets per page".

- **First page of a visit:** the prerender links the page's own sheet in its head, render-blocking, so nothing is ever painted unstyled.
- **Moving between pages:** Vite loads the next page's sheet before the page renders. Checked on two ten-page sequences at 390 and 1440px: every incoming page was styled when it was inserted, and its layout matched a direct load exactly.
- **The page's scripts:** these start downloading once the first screen has painted and its main picture has loaded. Preloaded with the HTML, they took the hero picture's bandwidth; left to the router, the page rendered later.

**Validation:**

- **Computed styles:** every element and pseudo-element on all 45 pages, at 390 and 1440px, matches the single-stylesheet build exactly.
- **Checks:** lint and the build's own checks pass, and there are no console errors on the dev server.
- **Not yet done:** the Safari re-check needs Safari in front for about ten minutes. Safari pauses a background page, so the run stalled.
- **Measured in Chrome** (4x CPU, 1.6Mbps line, medians of three runs):

| Page                | First paint, before → after | LCP, before → after | Page rendered, before → after |
| ------------------- | --------------------------- | ------------------- | ----------------------------- |
| Home                | 1.67 → 1.00s                | 1.67 → 1.01s        | 3.92 → 3.70s                  |
| Doctors             | 1.81 → 0.95s                | 1.89 → 0.95s        | 3.73 → 3.55s                  |
| A doctor            | 1.64 → 0.88s                | 1.72 → 0.88s        | 3.78 → 3.51s                  |
| Contact             | 1.64 → 0.84s                | 2.49 → 0.84s        | 3.26 → 3.04s                  |
| Book an appointment | 1.62 → 0.84s                | 1.62 → 0.84s        | 3.48 → 3.25s                  |
| Our hospitals       | 1.62 → 0.82s                | 1.62 → 0.82s        | 3.24 → 3.01s                  |
| Visnagar            | 1.72 → 0.96s                | 3.18 → 3.22s        | 4.00 → 3.89s                  |
| Emergency eye care  | 1.78 → 0.97s                | 6.83 → 6.73s        | 4.19 → 4.15s                  |
| Services            | 1.68 → 0.90s                | 1.68 → 4.40s        | 3.46 → 3.27s                  |
| Cataract surgery    | 1.75 → 0.98s                | 1.75 → 5.14s        | 4.21 → 4.14s                  |
| Our journey         | 1.64 → 0.84s                | 1.64 → 4.47s        | 3.54 → 3.29s                  |
| Vision and mission  | 1.62 → 0.83s                | 1.62 → 4.03s        | 3.18 → 2.93s                  |

- **Lighthouse mobile** (default settings, as PageSpeed Insights runs it, average of two runs):
  - **LCP:** lower on ten of twelve pages, level on contact, and 0.3s higher on the journey page.
  - **Performance score:** up on eight pages (home 68 to 71, Visnagar 72 to 75, booking and the hospitals index 77 to 80), level on three, and one point down on journey.

**What the last four rows mean, and the real fix.** On those four pages the first paint is earlier than before, but Chrome now counts a later paint as the LCP. The chain:

1. The prerendered page now paints before the web fonts arrive, so its text is in the size-matched fallback fonts.
2. React then replaces the page rather than reusing it.
3. Its copy, in the web fonts, comes out 1–3% wider wherever a line breaks differently.
4. Chrome counts any larger paint as the new LCP, so the copy rising in after the curtain (about 4s on this connection) becomes the figure.

This is not caused by the stylesheets. The single-stylesheet build hit the same race on other pages: contact reported 2.5s in one run and 5.6s in the next, and emergency 6.8s.

It is also what PageSpeed sees. In Lighthouse's own unthrottled pass, the counted paint is React's copy at about 2 seconds on nearly every page, in both builds, and its simulation turns that into the 4–9s mobile LCP every page reports.

Two narrower fixes were built and measured, and both rejected:

- **Block-mode font twins for the prerendered page:** this fixed these four pages and broke four others, where a heading's serif or italic font arrived after React.
- **Normal line wrapping in the prerendered page:** balanced lines turned out not to be the cause.

The real fix was roadmap item 5, done in Session 4 (section 18): React adopts the prerendered page, reuses its elements and paints nothing new.

**Measuring traps found on the way** (CLAUDE.md has the detail):

- **Image size header:** a test server must send `Content-Length` for images. Without it, Chrome judges the hero picture's detail from the bytes received so far and never counts it as the LCP.
- **Font timing:** DevTools network throttling shares bandwidth equally between requests. On it, fonts arrive much later than on a host that serves them first.

## 18. Session 4: React adopts the prerendered page

**Built:** React now takes over the page that is already on screen (`hydrateRoot`) instead of building a second copy over it (`createRoot`). Nothing on the page looks or behaves differently; what changes is that the first paint stays the largest one, so Chrome no longer counts React's rebuilt copy, painted about 2s later, as the page's LCP. CLAUDE.md ("Search and prerendering") has the rules a change must now keep - above all, a component's first render must produce exactly the markup the build wrote, and anything that depends on the reader (their hospital, the clock, the cookie choice, the screen) arrives in the render after.

- **Where it adopts:** in browsers that match the build's assumptions - scroll-driven animation understood (Chrome, Safari 26+), motion allowed, a page file that is this path's, and no query string a page reads. Everywhere else (Firefox, older Safari, reduced motion, `?branch=` links) the page is built fresh exactly as before, so no visitor is worse off.
- **What the static HTML now says where the build cannot know:** the head office's details rather than the reader's hospital, "OPD hours" with the hospital's times rather than "open now", and no cookie banner (it mounts when React takes over, as it did before). The JSON-LD, titles, canonicals and the build's checks are unchanged.
- **Found on the way and fixed:** both About pages shifted by 0.11-0.13 on every laptop - in the old build too - because the headline's width was measured in `ch` of a font that arrives after the first paint. It is now the same width in `em`, and the shift is gone.

**Validation:**

- **No mismatches:** React's development build reports every difference between its first render and the static page; every page was loaded as a first visit, as a returning reader (Bharuch stored, cookies accepted) and mid-visit (Himmatnagar this session, cookies refused), on a phone and a laptop - 156 loads, 0 messages - and 38 loads in Safari 27, 0 messages.
- **Same page:** the settled page (every element's text, state, position, size, visibility and opacity, with animations frozen) is identical to the old build on 16 representative pages in all six combinations; the only differences are the hospital map's ripple rings caught at different moments. The arrival was recorded frame by frame on seven pages (curtain and reload): the same sequence, at most one frame apart. Real touch taps (menu, film control, switchboard, booking, service tabs, doctors filter, symptoms, gallery) and the whole booking journey (every step, a hospital change, a day, Send, "Book for someone else") do the same in both builds.
- **Measured** (Lighthouse 12.8 default mobile, gzipped local host, two runs each, old to new):

| Page             | Observed LCP                       | Simulated LCP (PageSpeed) | Score          | CLS |
| ---------------- | ---------------------------------- | ------------------------- | -------------- | --- |
| Home             | 0.09-0.19s (same, the hero poster) | 6.1-6.2 to 6.2-6.3s       | 67-72 to 72-73 | 0   |
| Contact          | 2.15 to 0.07s                      | 4.40 to 4.36s             | 79 to 78       | 0   |
| Doctors          | 2.05 to 0.08s                      | 5.49 to 5.03s             | 73-75 to 75-76 | 0   |
| Services         | 2.24 to 0.10s                      | 5.03 to 4.88-5.03s        | 74 to 74-76    | 0   |
| Cataract surgery | 2.16 to 0.10s                      | 6.99 to 5.93-6.01s        | 68-75 to 72-73 | 0   |
| Visnagar         | 2.15 to 0.10s                      | 6.47 to 5.48s             | 69-70 to 73-74 | 0   |
| Book appointment | 2.33 to 0.07s                      | 4.66 to 4.58-4.66s        | 76-78 to 77-79 | 0   |
| Our journey      | 2.23 to 0.07s                      | 4.51 to 4.43s             | 78-79 to 78-79 | 0   |

- **Why the PageSpeed column moved less:** its simulation counts every request that starts before the observed LCP as blocking it, and the app's script starts with the HTML. Real visitors' Chrome reports the observed figure, which is what Google's Core Web Vitals use. Starting the script after the first paint was built and measured (4x CPU, 1.6Mbps, median of three, eight page and visit combinations): the first paint came 0.09-0.36s earlier, but React took the page over 0.04-0.37s later on every one and the curtain or the reload veil lifted 0.07-0.34s later, so it was not kept.
