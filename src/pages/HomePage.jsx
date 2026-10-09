import SEO from "../components/SEO";
import { HomeJsonLd } from "../components/JsonLd";
import { branches } from "../lib/coreData";
import { doctors, specialists } from "../lib/doctorsData";
import { getTreatedConditions, home } from "../lib/homeData";
import { getPatientVoices } from "../lib/testimonialsData";
import ConditionsCarousel from "../sections/ConditionsCarousel";
import DoctorHighlights from "../sections/DoctorHighlights";
import Hero from "../sections/Hero";
import ImpactStats from "../sections/ImpactStats";
import PatientStories from "../sections/PatientStories";
import WhyChooseUs from "../sections/WhyChooseUs";
import "../styles/landing.css";

/* The figures the hero and the numbers band print, counted from the data
   rather than typed into home.json, so they follow doctors.json and
   branches.json - and agree with the journey page's closing figures. */
const counts = { hospitals: branches.items.length, specialists: specialists.length };

export default function HomePage() {
  return (
    <>
      <SEO meta={home.seo} />
      <HomeJsonLd meta={home.seo} />
      <Hero hero={home.hero} counts={counts} />
      <ImpactStats
        impact={home.impact}
        counts={counts}
        branches={branches.items}
        doctors={specialists}
      />
      <ConditionsCarousel conditions={home.conditions} items={getTreatedConditions()} />
      <WhyChooseUs trust={home.trust} doctors={doctors.items} branches={branches.items} />
      <DoctorHighlights doctorHighlights={home.doctorHighlights} doctors={doctors.items} />
      <PatientStories testimonials={getPatientVoices()} voices={home.voices} />
    </>
  );
}
