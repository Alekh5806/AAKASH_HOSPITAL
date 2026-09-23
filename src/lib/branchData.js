import { branches } from "./coreData";
import { doctors, isOptometrist } from "./doctorsData";
import { getServiceBySlug, services } from "./servicesData";

export const branchPage = branches.page;

export function getBranchBySlug(slug) {
  return branches.items.find((branch) => branch.slug === slug) ?? null;
}

export function getOtherBranches(slug) {
  return branches.items.filter((branch) => branch.slug !== slug);
}

/* doctors.json names branches by their display name, not their slug. */
export function getBranchTeam(branch) {
  const team = doctors.items.filter((doctor) => doctor.branches.includes(branch.name));
  return {
    doctors: team.filter((doctor) => !isOptometrist(doctor)),
    optometrists: team.filter(isOptometrist),
  };
}

/* A hospital's own `page.services` is a narrowing, not a requirement: until the
   hospital confirms which treatments it actually runs, its page lists
   everything the network offers rather than guessing a shorter list. */
export function getBranchServices(branch) {
  const slugs = branch.page?.services;
  if (!slugs?.length) return services.items;
  return slugs.map(getServiceBySlug).filter(Boolean);
}
