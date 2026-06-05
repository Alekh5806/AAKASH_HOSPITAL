import { branches, site } from "../lib/coreData";

const siteUrl = site.defaultSeo.url.replace(/\/$/, "");

function absoluteUrl(path = "/") {
  return new URL(path, `${siteUrl}/`).toString();
}

function branchPhone(branch) {
  return branch.phoneGroups.flatMap((group) => group.numbers);
}

function allPhones() {
  return branches.items.flatMap((branch) => branchPhone(branch));
}

function openingHours() {
  return [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "18:00",
    },
  ];
}

export default function JsonLd({ data }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function MedicalClinicJsonLd({ services = [] }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "@id": `${siteUrl}/#medical-clinic`,
    name: site.brand.name,
    url: site.defaultSeo.url,
    logo: absoluteUrl(site.brand.logo),
    image: absoluteUrl(site.defaultSeo.image),
    foundingDate: site.brand.establishedDate,
    medicalSpecialty: "Ophthalmology",
    priceRange: "$$",
    telephone: allPhones(),
    sameAs: site.socialLinks.map((link) => link.href),
    contactPoint: branches.items.map((branch) => ({
      "@type": "ContactPoint",
      contactType: `${branch.name} appointment desk`,
      telephone: branchPhone(branch),
      email: branch.email,
      areaServed: "IN-GJ",
      availableLanguage: ["English", "Gujarati", "Hindi"],
    })),
    branchOf: {
      "@type": "Organization",
      name: site.brand.name,
    },
    address: branches.items.map((branch) => ({
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressRegion: "Gujarat",
      addressCountry: "IN",
    })),
    openingHoursSpecification: openingHours(),
    availableService: services.map((service) => ({
      "@type": "MedicalProcedure",
      name: service.title,
      url: absoluteUrl(`/services/${service.slug}`),
    })),
  };

  return <JsonLd data={organization} />;
}

export function BranchJsonLd() {
  const graph = branches.items.map((branch) => ({
    "@type": ["MedicalClinic", "LocalBusiness"],
    "@id": `${siteUrl}/branches#${branch.slug}`,
    name: `${site.brand.name} - ${branch.name}`,
    url: `${siteUrl}/branches`,
    image: absoluteUrl(site.defaultSeo.image),
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressRegion: "Gujarat",
      addressCountry: "IN",
    },
    email: branch.email,
    telephone: branchPhone(branch),
    priceRange: "$$",
    medicalSpecialty: "Ophthalmology",
    parentOrganization: {
      "@id": `${siteUrl}/#medical-clinic`,
    },
    hasMap: branch.mapEmbed,
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Gujarat",
    },
    openingHoursSpecification: openingHours(),
    geo: {
      "@type": "GeoCoordinates",
      latitude: branch.coords.lat,
      longitude: branch.coords.lng,
    },
  }));

  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}

export function BreadcrumbJsonLd({ items }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.href),
        })),
      }}
    />
  );
}

export function ServiceJsonLd({ service }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${siteUrl}/services/${service.slug}#service`,
        name: service.title,
        description: service.shortDescription,
        image: absoluteUrl(service.image),
        url: `${siteUrl}/services/${service.slug}`,
        medicalSpecialty: "Ophthalmology",
        provider: {
          "@id": `${siteUrl}/#medical-clinic`,
        },
        availableAtOrFrom: branches.items.map((branch) => ({
          "@id": `${siteUrl}/branches#${branch.slug}`,
        })),
      }}
    />
  );
}

export function FAQJsonLd({ items }) {
  if (!items?.length) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}

export function ServiceListJsonLd({ services = [] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Aakash Eye Hospital services",
        itemListElement: services.map((service, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: service.title,
          url: `${siteUrl}/services/${service.slug}`,
        })),
      }}
    />
  );
}
