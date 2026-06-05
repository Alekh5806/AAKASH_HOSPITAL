import { branches } from "./coreData";
export { branches, defaultSeo, getSeo, navigation, site, theme } from "./coreData";
export { doctors } from "./doctorsData";
export { gallery } from "./galleryData";
export { home } from "./homeData";
export { getServiceBySlug, getServicesByIds, services } from "./servicesData";
export { testimonials } from "./testimonialsData";

export function getBranchBySlug(slug) {
  return branches.items.find((branch) => branch.slug === slug);
}

export function getPrimaryBranch() {
  return branches.items.find((branch) => branch.isHeadquarters) ?? branches.items[0];
}
