import { BreadcrumbJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { about } from "../lib/aboutData";
import { site } from "../lib/coreData";
import AboutNext from "../sections/AboutNext";
import AboutSwitch from "../sections/AboutSwitch";
import VisionStatements from "../sections/VisionStatements";
import VisionValues from "../sections/VisionValues";

const { vision } = about;

export default function AboutVisionPage() {
  return (
    <>
      <SEO meta={site.pageSeo.aboutVision} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about/journey" },
          { name: "Vision and mission", href: "/about/vision" },
        ]}
      />

      <section className="e-sec e-sec--tight ab-top">
        <div className="e-shell">
          <span className="e-label">{vision.eyebrow}</span>
          <h1 className="e-h1 ab-top__title">
            {vision.title} <em>{vision.titleAccent}</em>
          </h1>
          <div className="ab-top__row">
            <p className="e-lede ab-top__lede">{vision.lede}</p>
            {/* The sibling of the journey page's founding date, in the same
                stamp: there it dates the hospital, here it names the three
                words the vision statement rests on. */}
            <p className="ab-top__est ab-top__est--stack">
              <span>{vision.promiseLabel}</span>
              {vision.promise.map((word) => (
                <strong key={word}>{word}</strong>
              ))}
            </p>
          </div>
          <AboutSwitch />
        </div>
      </section>

      <VisionStatements />

      <VisionValues />

      <AboutNext />
    </>
  );
}
