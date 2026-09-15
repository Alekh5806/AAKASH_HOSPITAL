import servicesRaw from "../data/services.json";

export const services = servicesRaw;

export const servicePage = servicesRaw.page;

export const serviceDetail = servicesRaw.page.detail;

export function getServiceBySlug(slug) {
  return services.items.find((service) => service.slug === slug);
}

export function getServicesByIds(ids) {
  return ids.map((id) => services.items.find((service) => service.id === id)).filter(Boolean);
}

/* The finder's concern list is the only place patient-language symptoms are
   written, so anything else that needs them reads them back out of it. */
export function getConcernsForService(slug) {
  return servicePage.finder.concerns.filter((concern) => concern.service === slug);
}

export function getCategoryLabel(id) {
  return servicePage.categories.find((category) => category.id === id)?.label ?? "";
}

/* Filter chips are built from the categories that actually have services, with
   their real counts, so adding or removing a service can never leave a chip
   that filters to nothing. */
export function getCategoryFilters() {
  return servicePage.categories
    .map((category) => ({
      ...category,
      count: services.items.filter((service) => service.category === category.id).length,
    }))
    .filter((category) => category.count > 0);
}

/* The list keeps its source order and every service keeps the number it has in
   that order, so "07" means the Myopia Clinic whether the reader is looking at
   all eleven or at the three children's services on their own. */
export function getNumberedServices() {
  return services.items.map((service, index) => ({
    ...service,
    position: String(index + 1).padStart(2, "0"),
  }));
}

/* Sentences keep their tokens in the JSON rather than being assembled out of
   fragments in a component, so a copy change never needs a code change. */
export function fillTemplate(template = "", values = {}) {
  return template.replace(/\{(\w+)\}/g, (token, key) =>
    key in values ? String(values[key]) : token,
  );
}

/* The part of the eye a service is concerned with, and the plain-language
   sentence that describes it - both already written, in the finder's own
   `parts` list, because that is what routes a reader who can point at the
   trouble but cannot name it. Emergency Eye Care maps to no part on purpose. */
export function getPartForService(slug) {
  return servicePage.finder.parts.find((part) => part.services.includes(slug)) ?? null;
}

/* The Function Health reference sets the closing word of a display headline in
   an italic accent, and every service title but one ends on the word that names
   the kind of care - Surgery, Care, Services, Clinic, Examination. A one-word
   title keeps the roman face rather than being italicised whole. */
export function splitServiceTitle(title = "") {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { lead: title, accent: "" };
  return { lead: words.slice(0, -1).join(" "), accent: words[words.length - 1] };
}

export function getServicePosition(slug) {
  return getNumberedServices().find((service) => service.slug === slug)?.position ?? "";
}

/* Same kind of care first, then the rest of the list in source order. The
   top-up is what keeps the rail honest for Emergency Eye Care, which is the
   only service in its category - a related rail with nothing in it is worse
   than one that widens. */
export function getRelatedServices(slug, limit = 3) {
  const current = getServiceBySlug(slug);
  if (!current) return [];
  const rest = getNumberedServices().filter((service) => service.slug !== slug);
  return [
    ...rest.filter((service) => service.category === current.category),
    ...rest.filter((service) => service.category !== current.category),
  ].slice(0, limit);
}
