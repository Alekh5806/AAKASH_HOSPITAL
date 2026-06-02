import branchesRaw from "../data/branches.json";
import doctorsRaw from "../data/doctors.json";
import galleryRaw from "../data/gallery.json";
import homeRaw from "../data/home.json";
import navigationRaw from "../data/navigation.json";
import servicesRaw from "../data/services.json";
import siteRaw from "../data/site.json";
import testimonialsRaw from "../data/testimonials.json";
import themeRaw from "../data/theme.json";
import {
  branchesSchema,
  doctorsSchema,
  gallerySchema,
  homeSchema,
  navigationSchema,
  servicesSchema,
  siteSchema,
  testimonialsSchema,
  themeSchema,
} from "./schemas";

/** @type {import("../types/types.js").SeoMeta} */
export const defaultSeo = siteSchema.parse(siteRaw).defaultSeo;

export const site = siteSchema.parse(siteRaw);
export const theme = themeSchema.parse(themeRaw);
export const navigation = navigationSchema.parse(navigationRaw);
export const home = homeSchema.parse(homeRaw);
export const services = servicesSchema.parse(servicesRaw);
export const doctors = doctorsSchema.parse(doctorsRaw);
export const branches = branchesSchema.parse(branchesRaw);
export const testimonials = testimonialsSchema.parse(testimonialsRaw);
export const gallery = gallerySchema.parse(galleryRaw);

export function getServiceBySlug(slug) {
  return services.items.find((service) => service.slug === slug);
}

export function getServicesByIds(ids) {
  return ids.map((id) => services.items.find((service) => service.id === id)).filter(Boolean);
}

export function getBranchBySlug(slug) {
  return branches.items.find((branch) => branch.slug === slug);
}

export function getPrimaryBranch() {
  return branches.items.find((branch) => branch.isHeadquarters) ?? branches.items[0];
}

export function getSeo(meta) {
  return {
    ...site.defaultSeo,
    ...meta,
  };
}
