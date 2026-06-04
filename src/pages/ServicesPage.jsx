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
        title={
          <>
            <span className="page-header__title-line">Ophthalmic services</span>
            <span className="page-header__title-line">designed around clarity</span>
          </>
        }
        description="Clear OPD and surgery guidance."
        image="/assets/media/page-headers/eye-exam-room.jpg"
        variant="services"
      />
      <ServiceGrid
        services={services.items}
        eyebrow="All services"
        title={
          <>
            <span className="section-heading__title-line">Care for every stage of</span>
            <span className="section-heading__title-line">eye health</span>
          </>
        }
      />
      <CTASection cta={home.cta} />
    </>
  );
}
