import { branches } from "./coreData";
import { getServiceBySlug, services } from "./servicesData";

export const branchPage = branches.page;

export function getBranchBySlug(slug) {
  return branches.items.find((branch) => branch.slug === slug) ?? null;
}

export function getOtherBranches(slug) {
  return branches.items.filter((branch) => branch.slug !== slug);
}

/* A hospital's own `page.services` is a narrowing, not a requirement: until the
   hospital confirms which treatments it actually runs, its page lists
   everything the network offers rather than guessing a shorter list. */
export function getBranchServices(branch) {
  const slugs = branch.page?.services;
  if (!slugs?.length) return services.items;
  return slugs.map(getServiceBySlug).filter(Boolean);
}
