import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { ServiceJsonLd } from "../components/JsonLd";
import LazyNotFound from "../components/LazyNotFound";
import SEO from "../components/SEO";
import ServiceActionBar from "../components/ServiceActionBar";
import { branches } from "../lib/coreData";
import { BRANCH_CHANGE_EVENT, getPrimaryBranch, getStoredBranch } from "../lib/contact";
import { useClientState } from "../lib/hydration";
import {
  getPartForService,
  getRelatedServices,
  getServiceBySlug,
  serviceDetail,
} from "../lib/servicesData";
import ServiceEmergency from "../sections/ServiceEmergency";
import ServiceExplore from "../sections/ServiceExplore";
import ServiceFaq from "../sections/ServiceFaq";
import ServiceHero from "../sections/ServiceHero";
import ServiceRelated from "../sections/ServiceRelated";
import ServiceVisit from "../sections/ServiceVisit";
import "../styles/services.css";
import "../styles/service-detail.css";

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
  const [branch, setBranch] = useClientState(
    () => getStoredBranch(branches.items),
    getPrimaryBranch(branches.items),
  );

  useEffect(() => {
    const sync = () => setBranch(getStoredBranch(branches.items));
    window.addEventListener(BRANCH_CHANGE_EVENT, sync);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, sync);
  }, [setBranch]);

  const part = useMemo(() => (service ? getPartForService(service.slug) : null), [service]);
  const related = useMemo(() => (service ? getRelatedServices(service.slug) : []), [service]);
  const isUrgent = service?.category === "urgent";

  /* A slug that names no service is the site's not-found page, which reads
     the address and offers the service it most likely meant. */
  if (!service) return <LazyNotFound />;

  return (
    <>
      <SEO meta={{ image: service.image, imageAlt: service.imageAlt, ...service.seo }} />
      <ServiceJsonLd service={service} part={part} />

      <ServiceHero
        service={service}
        part={part}
        branch={branch}
        urgent={isUrgent}
        actionsRef={heroActionsRef}
      />

      <ServiceExplore service={service} />

      {isUrgent ? (
        <ServiceEmergency
          showMore={false}
          label={serviceDetail.urgent.label}
          title={serviceDetail.urgent.title}
        />
      ) : (
        <ServiceVisit service={service} />
      )}

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
