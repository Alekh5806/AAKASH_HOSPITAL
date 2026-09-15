import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { BreadcrumbJsonLd, ServiceListJsonLd } from "../components/JsonLd";
import IrisMark from "../components/IrisMark";
import SEO from "../components/SEO";
import { branches } from "../lib/coreData";
import { servicePage, services } from "../lib/servicesData";
import ServiceEmergency from "../sections/ServiceEmergency";
import ServiceExplorer from "../sections/ServiceExplorer";
import ServicePathway from "../sections/ServicePathway";

/* Four sections and one job each: who we are (the opening), which service is
   yours (the explorer), what happens when you arrive (the pathway), and what
   must not wait (the urgent band). The urgent band sits last because it is the
   exception to everything above it - all of that can wait for an appointment
   and it cannot. */
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

      <section className="e-sec e-sec--tight sv-top">
        <div className="e-shell sv-top__shell">
          <div className="sv-top__copy">
            <span className="e-label">{servicePage.eyebrow}</span>
            <h1 className="e-h1 sv-top__title">
              {servicePage.title} <em>{servicePage.titleAccent}</em>
            </h1>

            <div className="sv-top__row">
              <p className="e-lede sv-top__lede">{servicePage.lede}</p>
              {/* Both figures are counted rather than written, so the stamp can
                never contradict the list below it or the branch list. */}
              <p className="sv-top__stamp">
                <span>{servicePage.stampLabel}</span>
                <strong>{services.items.length} services</strong>
                <strong>{branches.items.length} hospitals</strong>
              </p>
            </div>

            <div className="sv-top__actions">
              <a className="e-btn" href="#find-a-service">
                {servicePage.finder.ctaLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
              <Link
                className="sv-top__urgent"
                to={`/services/${servicePage.emergency.serviceSlug}`}
              >
                <AlertTriangle size={16} aria-hidden="true" />
                {servicePage.emergency.label}
              </Link>
            </div>
          </div>

          <div className="sv-top__mark">
            <IrisMark />
          </div>
        </div>
      </section>

      <ServiceExplorer />

      <ServicePathway />

      <ServiceEmergency />
    </>
  );
}
