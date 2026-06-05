import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { BreadcrumbJsonLd, FAQJsonLd, ServiceJsonLd } from "../components/JsonLd";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import SmartImage from "../components/SmartImage";
import { branches } from "../lib/coreData";
import { home } from "../lib/homeData";
import { getServiceBySlug } from "../lib/servicesData";
import CTASection from "../sections/CTASection";
import FAQ from "../sections/FAQ";

function cleanTel(number) {
  return number.startsWith("+") ? number.replace(/[^\d+]/g, "") : number.replace(/\D/g, "");
}

function getPrimaryPhone(branch) {
  return (
    branch.phoneGroups.find((group) => group.label.toLowerCase().includes("opd"))?.numbers[0] ??
    branch.phoneGroups[0]?.numbers[0] ??
    ""
  );
}

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const service = getServiceBySlug(slug);
  const primaryBranch = branches.items.find((branch) => branch.isHeadquarters) ?? branches.items[0];
  const primaryPhone = primaryBranch ? getPrimaryPhone(primaryBranch) : "";

  if (!service) {
    return (
      <>
        <SEO
          meta={{
            title: "Service Not Found | Aakash Eye Hospital",
            description: "This service could not be found.",
          }}
        />
        <PageHeader
          eyebrow="Service"
          title="Service not found"
          description="The service you are looking for is not available in the current content."
        />
        <section className="section">
          <div className="container">
            <Link className="text-link" to="/services">
              Back to services
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <SEO meta={service.seo} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: service.title, href: `/services/${service.slug}` },
        ]}
      />
      <ServiceJsonLd service={service} />
      <FAQJsonLd items={service.faq} />
      <PageHeader eyebrow="Service" title={service.title} description={service.shortDescription} />
      <section className="section service-detail">
        <div className="container service-detail__grid">
          <div className="service-detail__media">
            <SmartImage
              src={service.image}
              alt={service.imageAlt}
              className="service-detail__image"
            />
            <div className="service-detail__summary">
              <span>Care pathway</span>
              <strong>Consultation first, treatment after suitability confirmation.</strong>
            </div>
          </div>
          <div className="service-detail__copy">
            <span className="eyebrow">Service overview</span>
            <h2>What this care pathway includes</h2>
            {service.longDescription.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="service-detail__actions">
              <Link to="/appointment">
                <CalendarDays size={18} aria-hidden="true" />
                Book appointment
              </Link>
              <a
                href={`https://wa.me/${primaryBranch.whatsappNumber}?text=${encodeURIComponent(
                  `Hello Aakash Eye Hospital, I would like to ask about ${service.title}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} aria-hidden="true" />
                WhatsApp
              </a>
              {primaryPhone ? (
                <a href={`tel:${cleanTel(primaryPhone)}`}>
                  <Phone size={18} aria-hidden="true" />
                  Call OPD
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="section service-detail-highlights">
        <div className="container">
          <div className="service-detail-head">
            <span className="eyebrow">Highlights</span>
            <h2>What patients should know</h2>
            <p>Key points to discuss with the care team before planning the next step.</p>
          </div>
          <ul className="feature-list">
            {service.featureBullets.map((feature) => (
              <li key={feature}>
                <CheckCircle2 size={19} aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section service-detail-branches">
        <div className="container service-detail-branch-panel">
          <div>
            <span className="eyebrow">Branch guidance</span>
            <h2>Confirm availability before visiting</h2>
            <p>
              Service availability and doctor timing can vary by branch. Share your concern with the
              appointment desk so the team can guide you to the right location.
            </p>
          </div>
          <Link to="/branches">
            <MapPin size={18} aria-hidden="true" />
            View branches
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <FAQ items={service.faq} title={`${service.title} questions`} />
      <CTASection cta={home.cta} />
    </>
  );
}
