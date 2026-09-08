import SEO from "../components/SEO";
import { BranchJsonLd, MedicalClinicJsonLd } from "../components/JsonLd";
import { branches } from "../lib/coreData";
import { doctors } from "../lib/doctorsData";
import { home } from "../lib/homeData";
import { services } from "../lib/servicesData";
import { testimonials } from "../lib/testimonialsData";
import ConditionsCarousel from "../sections/ConditionsCarousel";
import DoctorHighlights from "../sections/DoctorHighlights";
import Hero from "../sections/Hero";
import ImpactStats from "../sections/ImpactStats";
import PatientStories from "../sections/PatientStories";
import WhyChooseUs from "../sections/WhyChooseUs";

export default function HomePage() {
  return (
    <>
      <SEO meta={home.seo} />
      <MedicalClinicJsonLd services={services.items} />
      <BranchJsonLd />
      <Hero hero={home.hero} />
      <ImpactStats impact={home.impact} branches={branches.items} doctors={doctors.items} />
      <ConditionsCarousel conditions={home.conditions} doctors={doctors.items} />
      <WhyChooseUs trust={home.trust} doctors={doctors.items} branches={branches.items} />
      <DoctorHighlights doctorHighlights={home.doctorHighlights} doctors={doctors.items} />
      <PatientStories testimonials={testimonials.items} voices={home.voices} />
    </>
  );
}
