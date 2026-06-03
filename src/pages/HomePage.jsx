import SEO from "../components/SEO";
import { BranchJsonLd, MedicalClinicJsonLd } from "../components/JsonLd";
import { branches, doctors, getServicesByIds, home, testimonials } from "../lib/data";
import BranchCards from "../sections/BranchCards";
import CareFinder from "../sections/CareFinder";
import CTASection from "../sections/CTASection";
import DoctorGrid from "../sections/DoctorGrid";
import Hero from "../sections/Hero";
import MissionVision from "../sections/MissionVision";
import ServiceGrid from "../sections/ServiceGrid";
import StatsBand from "../sections/StatsBand";
import TestimonialCarousel from "../sections/TestimonialCarousel";
import Timeline from "../sections/Timeline";

export default function HomePage() {
  const featuredServices = getServicesByIds(home.featuredServiceIds);

  return (
    <>
      <SEO meta={home.seo} />
      <MedicalClinicJsonLd />
      <BranchJsonLd />
      <Hero hero={home.hero} stats={home.stats} />
      <CareFinder />
      <StatsBand stats={home.stats} />
      <ServiceGrid
        services={featuredServices}
        eyebrow="Featured services"
        title="Advanced care pathways"
        description="The most requested care journeys, presented with simple routes into treatment details and booking."
        variant="featured"
      />
      <Timeline timeline={home.timeline} />
      <MissionVision data={home.missionVision} />
      <DoctorGrid
        doctors={doctors.items.slice(0, 4)}
        eyebrow="Specialists"
        title="Experienced eye care team"
        description="Meet a few members of the clinical and optometry team."
      />
      <TestimonialCarousel testimonials={testimonials.items} />
      <BranchCards branches={branches.items} />
      <CTASection cta={home.cta} />
    </>
  );
}
