import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { home, services } from "../lib/data";
import CTASection from "../sections/CTASection";
import ServiceGrid from "../sections/ServiceGrid";

export default function ServicesPage() {
  return (
    <>
      <SEO meta={services.seo} />
      <PageHeader
        eyebrow="Services"
        title="Ophthalmic services designed around clarity"
        description="From first OPD visit to advanced surgery, each service is structured to help patients understand the next step."
      />
      <ServiceGrid
        services={services.items}
        eyebrow="All services"
        title="Care for every stage of eye health"
      />
      <CTASection cta={home.cta} />
    </>
  );
}
