import { BreadcrumbJsonLd, ServiceListJsonLd } from "../components/JsonLd";
import PageIntroGrid from "../sections/PageIntroGrid";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { home } from "../lib/homeData";
import { services } from "../lib/servicesData";
import CTASection from "../sections/CTASection";
import ServiceGrid from "../sections/ServiceGrid";

const serviceIntroItems = [
  {
    title: "Start with OPD",
    kicker: "Step 01",
    icon: "Stethoscope",
    description: "Begin with a complete eye evaluation and move into the right care pathway.",
  },
  {
    title: "Confirm suitability",
    kicker: "Step 02",
    icon: "ScanEye",
    description: "Diagnostics help the team guide cataract, LASIK, retina or glaucoma decisions.",
  },
  {
    title: "Plan your visit",
    kicker: "Step 03",
    icon: "CalendarCheck",
    description: "Choose a branch and book with the correct department or surgery desk.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <SEO meta={services.seo} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
        ]}
      />
      <ServiceListJsonLd services={services.items} />
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
      <PageIntroGrid
        className="services-pathway"
        eyebrow="Care pathway"
        title="Simple steps before treatment"
        description="A clear route helps patients understand where to start without guessing the right service."
        items={serviceIntroItems}
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
        description="Explore focused services and open the one that matches your concern, diagnosis or planned procedure."
      />
      <CTASection cta={home.cta} />
    </>
  );
}
