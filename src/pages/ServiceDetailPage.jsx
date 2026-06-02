import { CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import SmartImage from "../components/SmartImage";
import { getServiceBySlug, home } from "../lib/data";
import CTASection from "../sections/CTASection";
import FAQ from "../sections/FAQ";

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const service = getServiceBySlug(slug);

  if (!service) {
    return (
      <>
        <SEO meta={{ title: "Service Not Found | Aakash Eye Hospital", description: "This service could not be found." }} />
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
      <PageHeader eyebrow="Service" title={service.title} description={service.shortDescription} />
      <section className="section service-detail">
        <div className="container service-detail__grid">
          <SmartImage src={service.image} alt={service.imageAlt} className="service-detail__image" />
          <div className="service-detail__copy">
            {service.longDescription.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <ul className="feature-list">
              {service.featureBullets.map((feature) => (
                <li key={feature}>
                  <CheckCircle2 size={19} aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <FAQ items={service.faq} />
      <CTASection cta={home.cta} />
    </>
  );
}
