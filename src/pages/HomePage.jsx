import SEO from "../components/SEO";
import { BranchJsonLd, MedicalClinicJsonLd } from "../components/JsonLd";
import { branches } from "../lib/coreData";
import { doctors } from "../lib/doctorsData";
import { home } from "../lib/homeData";
import { getServicesByIds, services } from "../lib/servicesData";
import { testimonials } from "../lib/testimonialsData";
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
import VisionClarityFeature from "../sections/VisionClarityFeature";

export default function HomePage() {
  const featuredServices = getServicesByIds(home.featuredServiceIds);

  return (
    <>
      <SEO meta={home.seo} />
      <MedicalClinicJsonLd services={services.items} />
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
      <VisionClarityFeature />
      <Timeline timeline={home.timeline} />
      <MissionVision data={home.missionVision} />
      <DoctorGrid
        doctors={doctors.items.slice(0, 4)}
        eyebrow="Specialist team"
        title="Care led by focused eye specialists"
        description="A multi-branch clinical team for cataract, LASIK, retina, OPD and ongoing eye-care guidance."
      />
      <TestimonialCarousel testimonials={testimonials.items} />
      <BranchCards branches={branches.items} />
      <CTASection cta={home.cta} />
    </>
  );
}
