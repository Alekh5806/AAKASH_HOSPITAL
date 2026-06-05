import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { BranchJsonLd, BreadcrumbJsonLd } from "../components/JsonLd";
import { branches } from "../lib/coreData";
import { home } from "../lib/homeData";
import BranchCards from "../sections/BranchCards";
import CTASection from "../sections/CTASection";

export default function BranchesPage() {
  return (
    <>
      <SEO meta={branches.seo} />
      <BranchJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Branches", href: "/branches" },
        ]}
      />
      <PageHeader
        eyebrow="Branches"
        title="Visit Aakash Eye Hospital"
        description="Find branch contacts for OPD, operation and LASIK appointments."
        image="/assets/media/page-headers/hospital-corridor.jpg"
        variant="branches"
      />
      <BranchCards branches={branches.items} showMaps />
      <CTASection cta={home.cta} />
    </>
  );
}
