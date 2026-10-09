import { PageJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { about } from "../lib/aboutData";
import { site } from "../lib/coreData";
import AboutHead from "../sections/AboutHead";
import AboutNext from "../sections/AboutNext";
import JourneyTimeline from "../sections/JourneyTimeline";
import "../styles/about.css";

const { journey } = about;

export default function AboutJourneyPage() {
  return (
    <>
      <SEO meta={site.pageSeo.aboutJourney} />
      <PageJsonLd
        path="/about/journey"
        meta={site.pageSeo.aboutJourney}
        types={["AboutPage"]}
        crumbs={[{ name: "Our journey", href: "/about/journey" }]}
      />

      <AboutHead
        page={journey}
        stamp={{ label: journey.establishedCaption, words: [journey.establishedLabel] }}
      />
      <JourneyTimeline />
      <AboutNext />
    </>
  );
}
