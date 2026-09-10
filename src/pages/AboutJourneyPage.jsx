import { BreadcrumbJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { about } from "../lib/aboutData";
import { site } from "../lib/coreData";
import AboutNext from "../sections/AboutNext";
import AboutSwitch from "../sections/AboutSwitch";
import JourneyTimeline from "../sections/JourneyTimeline";

const { journey } = about;

export default function AboutJourneyPage() {
  return (
    <>
      <SEO meta={site.pageSeo.aboutJourney} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about/journey" },
          { name: "Our journey", href: "/about/journey" },
        ]}
      />

      <section className="e-sec e-sec--tight ab-top">
        <div className="e-shell">
          <span className="e-label">{journey.eyebrow}</span>
          <h1 className="e-h1 ab-top__title">
            {journey.title} <em>{journey.titleAccent}</em>
          </h1>
          <div className="ab-top__row">
            <p className="e-lede ab-top__lede">{journey.lede}</p>
            <p className="ab-top__est">
              <span>Established</span>
              <strong>{journey.establishedLabel}</strong>
            </p>
          </div>
          <AboutSwitch />
        </div>
      </section>

      <JourneyTimeline />
      <AboutNext />
    </>
  );
}
