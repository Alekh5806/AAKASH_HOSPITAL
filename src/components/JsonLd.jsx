import { branches, site } from "../lib/coreData";
import { buildBranchHref, getPrimaryBranch } from "../lib/contact";
import { getBranchHours, toOpeningHoursSpecification } from "../lib/hours";

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

/* The same block the page's live open/closed pill reads, so the hours a search
   engine is told can never drift from the hours a reader is shown. Each
   hospital's node carries its own; the organisation carries the head office's. */
function openingHours(branch) {
  return toOpeningHoursSpecification(getBranchHours(branch));
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
    logo: absoluteUrl(site.brand.logoRaster),
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
    openingHoursSpecification: openingHours(getPrimaryBranch(branches.items)),
    availableService: services.map((service) => ({
      "@type": "MedicalProcedure",
      name: service.title,
      url: absoluteUrl(`/services/${service.slug}`),
    })),
  };

  return <JsonLd data={organization} />;
}

function branchNode(branch) {
  return {
    "@type": ["MedicalClinic", "LocalBusiness"],
    "@id": `${siteUrl}/branches#${branch.slug}`,
    name: `${site.brand.name} - ${branch.name}`,
    url: absoluteUrl(buildBranchHref(branch)),
    image: absoluteUrl(branch.page?.seo?.image ?? site.defaultSeo.image),
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
    openingHoursSpecification: openingHours(branch),
    geo: {
      "@type": "GeoCoordinates",
      latitude: branch.coords.lat,
      longitude: branch.coords.lng,
    },
  };
}

export function BranchJsonLd() {
  const graph = branches.items.map(branchNode);
  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}

/* One hospital's own page: the same node the index graph carries, on its own,
   so the page describes exactly one place. */
export function BranchPageJsonLd({ branch }) {
  return <JsonLd data={{ "@context": "https://schema.org", ...branchNode(branch) }} />;
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
