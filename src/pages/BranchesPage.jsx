import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { BranchJsonLd } from "../components/JsonLd";
import { branches, home } from "../lib/data";
import BranchCards from "../sections/BranchCards";
import CTASection from "../sections/CTASection";

export default function BranchesPage() {
  return (
    <>
      <SEO meta={branches.seo} />
      <BranchJsonLd />
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
