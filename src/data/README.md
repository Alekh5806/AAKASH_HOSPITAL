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
