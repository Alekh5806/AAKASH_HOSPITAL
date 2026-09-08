import { createElement } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BreadcrumbJsonLd } from "../components/JsonLd";
import Reveal from "../components/Reveal";
import SEO from "../components/SEO";
import { about } from "../lib/aboutData";
import { site } from "../lib/coreData";
import { getIcon } from "../lib/icons";
import AboutSwitch from "../sections/AboutSwitch";

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
          </div>
          <AboutSwitch />
        </div>
      </section>

      <section className="e-sec e-sec--dark ab-say">
        <div className="e-shell">
          <div className="e-head">
            <span className="e-label">{vision.statementsLabel}</span>
          </div>
          <div className="ab-say__grid">
            {vision.statements.map((statement) => (
              <Reveal key={statement.kind} as="article" className="ab-say__item">
                <p className="ab-say__kind">
                  {createElement(getIcon(statement.icon), { size: 20, "aria-hidden": "true" })}
                  <span>{statement.kind}</span>
                </p>
                <p className="ab-say__text">{statement.text}</p>
                <p className="ab-say__note">{statement.note}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="e-sec ab-values">
        <div className="e-shell">
          <div className="e-head">
            <span className="e-label">{vision.valuesLabel}</span>
            <div className="e-head__body">
              <h2 className="e-h2">{vision.valuesTitle}</h2>
              <p className="e-lede">{vision.valuesLede}</p>
            </div>
          </div>

          <ul className="ab-values__grid">
            {vision.values.map((value, index) => (
              <li key={value.title}>
                <Reveal className="ab-values__card" delay={(index % 3) * 0.06}>
                  <span className="ab-values__icon" aria-hidden="true">
                    {createElement(getIcon(value.icon), { size: 22 })}
                  </span>
                  <h3 className="e-h3">{value.title}</h3>
                  <p className="e-body">{value.description}</p>
                </Reveal>
              </li>
            ))}
          </ul>

          <Link className="e-link ab-values__next" to="/about/journey">
            {vision.ctaLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
