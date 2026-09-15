import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BreadcrumbJsonLd, FAQJsonLd, ServiceJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import ServiceActionBar from "../components/ServiceActionBar";
import { branches } from "../lib/coreData";
import { BRANCH_CHANGE_EVENT, getStoredBranch } from "../lib/contact";
import {
  getNumberedServices,
  getPartForService,
  getRelatedServices,
  getServiceBySlug,
  serviceDetail,
  servicePage,
} from "../lib/servicesData";
import ServiceEmergency from "../sections/ServiceEmergency";
import ServiceExplore from "../sections/ServiceExplore";
import ServiceFaq from "../sections/ServiceFaq";
import ServiceHero from "../sections/ServiceHero";
import ServiceRelated from "../sections/ServiceRelated";
import ServiceVisit from "../sections/ServiceVisit";

/* One service, in five short blocks: what it is (a hero), everything about it
 * (one card the reader explores), what a visit looks like, what they still want
 * to ask, and the way on.
 *
 * The build before this one gave each of those its own full-width band and ran
 * to eight screens on a phone. Most people open a hospital website on a phone,
 * often on the way in, so the detail now lives in a tabbed card instead of a
 * stack of sections, and the actions follow the reader down the screen.
 *
 * Emergency Eye Care keeps the same shape with two changes: the hero leads with
 * the helpline, and the urgent band from the index page replaces the visit band
 * - six steps that all begin with booking are the wrong answer there. */
export default function ServiceDetailPage() {
  const { slug } = useParams();
  const heroActionsRef = useRef(null);
  const service = getServiceBySlug(slug);
  /* The hospital the reader picked in the header, so the number this page
     offers is never a different one from the number at the top of the screen -
     including when they change it while they are still reading. */
  const [branch, setBranch] = useState(() => getStoredBranch(branches.items));

  useEffect(() => {
    const sync = () => setBranch(getStoredBranch(branches.items));
    window.addEventListener(BRANCH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, sync);
  }, []);

  const part = useMemo(() => (service ? getPartForService(service.slug) : null), [service]);
  const related = useMemo(() => (service ? getRelatedServices(service.slug) : []), [service]);
  const isUrgent = service?.category === "urgent";

  if (!service) {
    const { notFound } = serviceDetail;
    return (
      <>
        <SEO
          meta={{ title: "Service not found | Aakash Eye Hospital", description: notFound.lede }}
        />
        <section className="e-sec sd-missing">
          <div className="e-shell">
            <span className="sd-label">{notFound.label}</span>
            <h1 className="e-h1 sd-missing__title">{notFound.title}</h1>
            <p className="e-lede sd-missing__lede">{notFound.lede}</p>
            <Link className="e-btn" to="/services">
              {notFound.ctaLabel}
            </Link>
          </div>
        </section>
        <ServiceRelated items={getNumberedServices()} title={servicePage.index.title} />
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

      <ServiceHero
        service={service}
        part={part}
        branch={branch}
        urgent={isUrgent}
        actionsRef={heroActionsRef}
      />

      <ServiceExplore service={service} />

      {isUrgent ? <ServiceEmergency showMore={false} /> : <ServiceVisit branch={branch} />}

      <ServiceFaq items={service.faq} />

      <ServiceRelated items={related} />

      <ServiceActionBar
        service={service}
        branch={branch}
        urgent={isUrgent}
        anchorRef={heroActionsRef}
      />
    </>
  );
}
