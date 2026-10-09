import { PageJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { about } from "../lib/aboutData";
import { site } from "../lib/coreData";
import AboutHead from "../sections/AboutHead";
import AboutNext from "../sections/AboutNext";
import VisionStatements from "../sections/VisionStatements";
import VisionValues from "../sections/VisionValues";
import "../styles/about.css";

const { vision } = about;

export default function AboutVisionPage() {
  return (
    <>
      <SEO meta={site.pageSeo.aboutVision} />
      <PageJsonLd
        path="/about/vision"
        meta={site.pageSeo.aboutVision}
        types={["AboutPage"]}
        crumbs={[
          { name: "About us", href: "/about/journey" },
          { name: "Vision and mission", href: "/about/vision" },
        ]}
      />

      {/* The stamp is the sibling of the journey page's founding date: there it
          dates the hospital, here it names the three words the vision
          statement rests on. */}
      <AboutHead page={vision} stamp={{ label: vision.promiseLabel, words: vision.promise }} />

      <VisionStatements />

      <VisionValues />

      <AboutNext />
    </>
  );
}
