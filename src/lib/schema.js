import { branches, site } from "./coreData";
import { buildBranchHref, buildMapLink, cleanTel, confirmedProfiles, getPrimaryBranch } from "./contact";
import { getBranchHours, toOpeningHoursSpecification } from "./hours";
import { SITE_URL, absoluteUrl, canonicalPath } from "./seo";

/* Structured data for every page, built as one linked @graph per page.
 *
 * Every node has a stable @id, so the organisation, the website, the six
 * hospitals, the doctors and the services are the same entities on every page
 * that mentions them, and search engines can join them up across the site:
 *
 *   https://www.aakasheyehospital.com/#organization       the network
 *   https://www.aakasheyehospital.com/#website            the website
 *   /branches/<slug>#hospital                             one hospital
 *   /services/<slug>#service                              one service
 *   /doctors/<slug>#physician                             one doctor (their own page)
 *   /doctors#<name-slug>                                  one optometrist (no page)
 *   <page url>#webpage, #breadcrumb, #faq-<n>             one page's own nodes
 *
 * Only what the reader can see goes in. A phone number still marked
 * `unconfirmed` in branches.json, a review date nobody has given, a rating or
 * an award the hospital has not published - none of it is ever emitted. */

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
const LOGO_ID = `${SITE_URL}/#logo`;
const LANGUAGE = "en-IN";
const SPECIALTY = "Ophthalmology";

export function slugify(text = "") {
  return text
    .toLowerCase()
    .replace(/^(dr|mr|mrs|ms)\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const branchId = (branch) => `${absoluteUrl(`/branches/${branch.slug}`)}#hospital`;
export const serviceId = (service) => `${absoluteUrl(`/services/${service.slug}`)}#service`;
const doctorUrl = (doctor) => absoluteUrl(doctor.slug ? `/doctors/${doctor.slug}` : "/doctors");
export const doctorId = (doctor) =>
  doctor.slug ? `${doctorUrl(doctor)}#physician` : `${doctorUrl(doctor)}#${slugify(doctor.name)}`;
const pageUrl = (path) => absoluteUrl(canonicalPath(path));
const pageId = (path) => `${pageUrl(path)}#webpage`;
const breadcrumbId = (path) => `${pageUrl(path)}#breadcrumb`;
const ref = (id) => ({ "@id": id });

function toE164(number) {
  const digits = cleanTel(number).replace(/^\+/, "");
  if (cleanTel(number).startsWith("+")) return `+${digits}`;
  return `+91${digits.replace(/^0/, "")}`;
}

/* The numbers a hospital has confirmed, in E.164, OPD first, never repeated. */
function confirmedPhones(branch) {
  const numbers = branch.phoneGroups
    .filter((group) => !group.unconfirmed)
    .flatMap((group) => group.numbers)
    .map(toE164);
  return [...new Set(numbers)];
}

function postalAddress(branch) {
  return {
    "@type": "PostalAddress",
    ...branch.postalAddress,
    ...(branch.page?.postcode ? { postalCode: branch.page.postcode } : {}),
  };
}

function imageObject(path, caption) {
  return { "@type": "ImageObject", url: absoluteUrl(path), ...(caption ? { caption } : {}) };
}

function socialProfiles(links = []) {
  return confirmedProfiles(links).map((link) => link.href);
}

function compact(node) {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) =>
      Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null && value !== "",
    ),
  );
}

export function organizationNode() {
  const head = getPrimaryBranch(branches.items);
  const emergency = site.header?.emergency?.phone;
  return compact({
    "@type": "MedicalOrganization",
    "@id": ORGANIZATION_ID,
    name: site.brand.name,
    alternateName: site.brand.alternateNames,
    url: `${SITE_URL}/`,
    logo: {
      "@type": "ImageObject",
      "@id": LOGO_ID,
      url: absoluteUrl(site.brand.logoRaster),
      contentUrl: absoluteUrl(site.brand.logoRaster),
      caption: site.brand.name,
      width: site.brand.logoRasterWidth,
      height: site.brand.logoRasterHeight,
    },
    image: ref(LOGO_ID),
    description: site.defaultSeo.description,
    slogan: site.brand.tagline,
    foundingDate: site.brand.establishedDate,
    foundingLocation: head ? { "@type": "Place", name: `${head.name}, Gujarat, India` } : undefined,
    medicalSpecialty: SPECIALTY,
    email: head?.email,
    telephone: head ? confirmedPhones(head)[0] : undefined,
    address: head ? postalAddress(head) : undefined,
    areaServed: { "@type": "State", name: "Gujarat", containedInPlace: { "@type": "Country", name: "India" } },
    sameAs: socialProfiles(site.socialLinks),
    contactPoint: emergency
      ? [
          {
            "@type": "ContactPoint",
            contactType: "emergency",
            telephone: toE164(emergency),
            areaServed: "IN",
            availableLanguage: site.brand.languages,
          },
        ]
      : undefined,
    subOrganization: branches.items.map((branch) => ref(branchId(branch))),
  });
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: site.brand.name,
    alternateName: site.brand.alternateNames,
    description: site.defaultSeo.description,
    publisher: ref(ORGANIZATION_ID),
    inLanguage: LANGUAGE,
  };
}

/* What a hospital offers, as the entities its page lists. The service pages
   describe each one; here they are referenced, never re-described. */
function serviceReference(service) {
  return {
    "@type": service.schemaType || "MedicalProcedure",
    "@id": serviceId(service),
    name: service.title,
    url: absoluteUrl(`/services/${service.slug}`),
  };
}

export function hospitalNode(branch, { services = [] } = {}) {
  const phones = confirmedPhones(branch);
  const image = branch.page?.image ?? site.defaultSeo.image;
  return compact({
    "@type": ["Hospital", "MedicalClinic"],
    "@id": branchId(branch),
    name: `${site.brand.name}, ${branch.name}`,
    alternateName: branch.alternateNames,
    url: absoluteUrl(buildBranchHref(branch)),
    image: imageObject(image, branch.page?.imageAlt),
    description: branch.page?.seo?.description,
    telephone: phones[0],
    email: branch.email,
    address: postalAddress(branch),
    geo: branch.coords
      ? { "@type": "GeoCoordinates", latitude: branch.coords.lat, longitude: branch.coords.lng }
      : undefined,
    hasMap: buildMapLink(branch),
    openingHoursSpecification: toOpeningHoursSpecification(getBranchHours(branch)),
    medicalSpecialty: SPECIALTY,
    availableService: services.map(serviceReference),
    parentOrganization: ref(ORGANIZATION_ID),
    sameAs: socialProfiles(branch.socialLinks),
    contactPoint: branch.phoneGroups
      .filter((group) => !group.unconfirmed)
      .map((group) => ({
        "@type": "ContactPoint",
        contactType: `${group.label} desk`,
        telephone: [...new Set(group.numbers.map(toE164))],
        areaServed: "IN",
        availableLanguage: site.brand.languages,
      })),
  });
}

function credentials(doctor) {
  return (doctor.qualifications ?? "")
    .split(/,\s*/)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ "@type": "EducationalOccupationalCredential", name }));
}

/* A consultant is an IndividualPhysician practising at their hospitals; an
   optometrist is not a physician, so they are a Person who works for one.
   `services` (on a doctor's own page) are the treatments the page lists. */
export function doctorNode(doctor, { optometrist = false, services = [] } = {}) {
  const hospitals = branches.items.filter(
    (branch) =>
      doctor.branches.includes(branch.name) ||
      (doctor.visiting ?? []).some((visit) => visit.branch === branch.name),
  );
  const shared = {
    "@id": doctorId(doctor),
    name: doctor.name,
    image: doctor.photo ? absoluteUrl(doctor.photo) : undefined,
    url: doctorUrl(doctor),
    hasCredential: credentials(doctor),
    knowsAbout: doctor.interests,
  };

  if (optometrist) {
    return compact({
      "@type": "Person",
      ...shared,
      jobTitle: doctor.specialty,
      worksFor: hospitals.map((branch) => ref(branchId(branch))),
    });
  }

  return compact({
    "@type": "IndividualPhysician",
    ...shared,
    description: doctor.specialty,
    occupationalCategory: doctor.specialty,
    medicalSpecialty: SPECIALTY,
    practicesAt: hospitals.map((branch) => ref(branchId(branch))),
    hospitalAffiliation: hospitals.map((branch) => ref(branchId(branch))),
    availableService: services.map(serviceReference),
    parentOrganization: ref(ORGANIZATION_ID),
  });
}

export function serviceNode(service, { part } = {}) {
  const review = service.review;
  return compact({
    "@type": service.schemaType || "MedicalProcedure",
    "@id": serviceId(service),
    name: service.title,
    alternateName: service.alternateNames,
    description: service.shortDescription,
    url: absoluteUrl(`/services/${service.slug}`),
    image: imageObject(service.image, service.imageAlt),
    relevantSpecialty: SPECIALTY,
    bodyLocation: part?.label,
    reviewedBy: review?.by ? { "@type": "Person", name: review.by } : undefined,
  });
}

export function breadcrumbNode(path, items) {
  return {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId(path),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(canonicalPath(item.href)),
    })),
  };
}

export function faqNodes(path, items = []) {
  return items.map((item, index) => ({
    "@type": "Question",
    "@id": `${pageUrl(path)}#faq-${index + 1}`,
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));
}

/* The page itself. `types` adds AboutPage, ContactPage, CollectionPage,
   MedicalWebPage or FAQPage; `about` and `mainEntity` point at the entity the
   page is about; a medical review is printed only when the data carries one,
   and is then shown on the page too. */
export function webPageNode(path, { head, types = [], about, mainEntity, breadcrumb, image, review } = {}) {
  return compact({
    "@type": types.length ? types : "WebPage",
    "@id": pageId(path),
    url: pageUrl(path),
    name: head?.title,
    description: head?.description,
    isPartOf: ref(WEBSITE_ID),
    about,
    mainEntity,
    breadcrumb: breadcrumb ? ref(breadcrumbId(path)) : undefined,
    primaryImageOfPage: image ? imageObject(image) : undefined,
    inLanguage: LANGUAGE,
    lastReviewed: review?.on,
    reviewedBy: review?.by ? { "@type": "Person", name: review.by } : undefined,
  });
}

export function graph(nodes) {
  return { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) };
}

/* Every page's graph: the organisation and the website (so each page stands on
   its own), the page, its breadcrumb trail, and whatever the page is about. */
export function pageGraph({ path, meta, types, about, mainEntity, crumbs, image, review, nodes = [] }) {
  return graph([
    organizationNode(),
    websiteNode(),
    webPageNode(path, {
      head: meta,
      types,
      about,
      mainEntity,
      breadcrumb: Boolean(crumbs?.length),
      image: image ?? meta?.image,
      review,
    }),
    crumbs?.length ? breadcrumbNode(path, crumbs) : null,
    ...nodes,
  ]);
}

export function itemList(entities) {
  return {
    "@type": "ItemList",
    numberOfItems: entities.length,
    itemListElement: entities.map((entity, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: entity,
    })),
  };
}

export { ref, serviceReference };
