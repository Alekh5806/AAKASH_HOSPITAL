import { branches, site } from "../lib/data";

export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function MedicalClinicJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: site.brand.name,
    url: site.defaultSeo.url,
    logo: new URL(site.brand.logo, site.defaultSeo.url).toString(),
    foundingDate: site.brand.establishedDate,
    medicalSpecialty: "Ophthalmology",
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
  };

  return <JsonLd data={organization} />;
}

export function BranchJsonLd() {
  const graph = branches.items.map((branch) => ({
    "@type": "LocalBusiness",
    name: `${site.brand.name} - ${branch.name}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressRegion: "Gujarat",
      addressCountry: "IN",
    },
    email: branch.email,
    telephone: branch.phoneGroups.flatMap((group) => group.numbers),
    geo: {
      "@type": "GeoCoordinates",
      latitude: branch.coords.lat,
      longitude: branch.coords.lng,
    },
  }));

  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}
