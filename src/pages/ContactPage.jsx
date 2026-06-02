import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { BranchJsonLd } from "../components/JsonLd";
import { branches, site } from "../lib/data";
import BranchCards from "../sections/BranchCards";

export default function ContactPage() {
  return (
    <>
      <SEO meta={site.pageSeo.contact} />
      <BranchJsonLd />
      <PageHeader
        eyebrow="Contact"
        title="Talk to the right branch"
        description="Use the direct OPD, operation and LASIK appointment numbers for the branch nearest to you."
      />
      <BranchCards branches={branches.items} showMaps />
    </>
  );
}
