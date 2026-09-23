import doctorsRaw from "../data/doctors.json";
import { branches } from "./coreData";

export const doctors = doctorsRaw;
export const doctorsPage = doctorsRaw.page;

/* Optometry is read off the specialty rather than stored as a flag: the
   records carry `Optometry` and `Senior Optometry`, and one rule beats two
   places that can disagree about who is a consultant. The roster's two runs
   and a hospital page's team split on this same test. */
export function isOptometrist(doctor) {
  return /optometr/i.test(doctor.specialty);
}

/* doctors.json names a hospital by its display name, not its slug, so the
   filter is derived from branches.json in the site's own hospital order and
   a hospital with nobody listed is left out rather than offered as an empty
   answer. */
export function getDoctorHospitals() {
  return branches.items
    .map((branch) => ({
      slug: branch.slug,
      name: branch.name,
      count: doctorsRaw.items.filter((doctor) => doctor.branches.includes(branch.name)).length,
    }))
    .filter((hospital) => hospital.count > 0);
}

export function groupDoctors(items) {
  return doctorsPage.groups
    .map((group) => ({
      ...group,
      people: items.filter((doctor) =>
        group.id === "optometry" ? isOptometrist(doctor) : !isOptometrist(doctor),
      ),
    }))
    .filter((group) => group.people.length);
}
