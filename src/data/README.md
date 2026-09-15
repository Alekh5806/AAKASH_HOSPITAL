# Editing Site Content

Most updates only require editing JSON files in this folder. Keep commas and quotes exactly like the examples below. After saving, the local Vite server updates the page automatically.

## Update A Doctor

Open `doctors.json`, find the doctor in `items`, and edit the fields:

```json
{
  "name": "Dr. Vishnu S. Patel",
  "qualifications": "MBBS, MS",
  "specialty": "Ophthalmic Surgeon",
  "photo": "/assets/media/doctors/vishnu-patel.jpg",
  "photoAlt": "Dr. Vishnu S. Patel",
  "bio": "Approved short biography goes here.",
  "branches": ["Visnagar"]
}
```

Use image paths from `public/assets/media/doctors`. Add a new image there, then reference it as `/assets/media/doctors/file-name.jpg`.

## Update A Service

Open `services.json`, find the service in `items`, and edit copy, bullets or FAQs:

```json
{
  "id": "glaucoma-care",
  "slug": "glaucoma-care",
  "title": "Glaucoma Care",
  "shortDescription": "Short card text shown on service grids.",
  "longDescription": ["Paragraph one.", "Paragraph two."],
  "icon": "Gauge",
  "image": "/assets/media/gallery/facility-4.jpg",
  "imageAlt": "Diagnostic care area for glaucoma evaluation",
  "featureBullets": ["Pressure and optic nerve evaluation"],
  "faq": [
    {
      "question": "Question text?",
      "answer": "Answer text."
    }
  ]
}
```

The `slug` controls the page URL. Changing it changes the route.

## Update A Branch

Open `branches.json`, find the branch in `items`, and edit contact details:

```json
{
  "name": "Visnagar",
  "slug": "visnagar",
  "isHeadquarters": true,
  "address": "Near New Court, M.N. College Road, Near GEB, Visnagar - 384315, North Gujarat",
  "email": "info@aakasheyehospital.com",
  "phoneGroups": [
    {
      "label": "OPD",
      "numbers": ["+91-760-008-2710"]
    }
  ],
  "whatsappNumber": "917600082710",
  "mapEmbed": "https://www.google.com/maps?q=Aakash%20Eye%20Hospital%20Visnagar&output=embed"
}
```

For WhatsApp, use digits only with the country code, without `+`, spaces or hyphens.

### A Branch Page

Every branch has a page at `/branches/<slug>`, driven entirely by its `page` block. Nothing in the code knows which hospital it is rendering, so editing this block is how you change a page.

```json
"page": {
  "seo": { "title": "...", "description": "...", "image": "/assets/media/branches/<slug>/facade-1000.jpg" },
  "lede": "One or two sentences about this hospital.",
  "ledeShort": "The same thing in one sentence, for phones.",
  "image": "/assets/media/branches/<slug>/facade-2000.jpg",
  "imageSmall": "/assets/media/branches/<slug>/facade-1000.jpg",
  "imageAlt": "What the photograph shows",
  "facts": ["Four short facts", "shown as chips", "on the photograph", "in the hero"],
  "landmarks": [
    { "label": "Main road name", "kind": "road" },
    { "label": "Landmark before it", "kind": "landmark" },
    { "label": "Landmark after it", "kind": "landmark" }
  ],
  "gallery": [{ "src": "/assets/media/branches/<slug>/waiting-hall.jpg", "alt": "...", "caption": "Waiting hall" }],

  "establishedYear": 1993,
  "postcode": "384315",
  "services": ["cataract-surgery", "lasik-refractive-surgery"]
}
```

The last three are optional and the page adapts to what is there:

- **`establishedYear`** - leave it out and the hero shows no `Since` tag. Do not estimate a year.
- **`postcode`** - leave it out and the map shows no PIN stamp.
- **`services`** - leave it out and the page lists all eleven. Add the slugs a hospital actually runs to narrow it.

`landmarks` wants one `road` and two `landmark` entries; the drawn map puts the hospital on that road between those two. An address that names no road still works - the map draws the road unlabelled.

**The doctors section comes from `doctors.json`, not from here.** A hospital appears on a doctor's `branches` list and its page grows a team section; a hospital nobody is listed at renders no team section at all. Add the consultants and the section appears.

**Photographs.** Only Visnagar's are its own. The other five borrow them, and their hero is the waiting hall rather than the Visnagar facade so that no page claims a building it cannot show. When a hospital sends its own photography, put the files in `public/assets/media/branches/<slug>/` and point this block at them. Encode, never hand-edit: `ffmpeg -i <source> -vf "scale=2000:-1" -q:v 5 facade-2000.jpg`, and the same at `scale=1000:-1`.

The labels every hospital page shares - button names, section titles, the locate card's tab names - live in the top-level `page` block of `branches.json`, not in a branch.

### The Hospitals Index

`/branches` is a drawn map of Gujarat beside one row per hospital. The page's own words - the heading, the lede, the row labels and the note under the list - live in the top-level `index` block of `branches.json`.

Where a hospital sits on the map is its `map` point: a share of the drawing's width and height, and the side its name is written on.

```json
"map": { "x": 61.2, "y": 25.6, "side": "left" }
```

A hospital without a `map` point is still listed but does not appear on the drawing. The three Ahmedabad hospitals are deliberately spread a little further apart than they really are, so each keeps its own dot and name; if a new hospital is added near them, place it by eye and check that no two names touch on a 320px phone.

### The Contact Page

`/contact` shows no phone number of its own. Every number, address and email on it comes from `branches.json` (each hospital's `phoneGroups`, `address`, `email` and `whatsappNumber`) and the emergency line from `site.json` under `header.emergency`, so changing a number there changes it on the contact page too.

The page's own words - the heading, the switchboard's labels and its WhatsApp message, and the directory's labels - live in `contact.json`:

```json
"desk": {
  "pickLabel": "Choose your hospital",
  "readoutLabel": "OPD line",
  "whatsappMessage": "Hello Aakash Eye Hospital, I would like to reach the {branch} hospital."
}
```

`{branch}` is replaced with the hospital's name. A hospital whose OPD and operation desks share the same numbers (Bharuch today) is listed once under a joined label rather than twice.
