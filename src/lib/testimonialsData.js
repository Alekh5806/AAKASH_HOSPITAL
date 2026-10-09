import testimonialsRaw from "../data/testimonials.json";
import { branches } from "./coreData";

/* Each theme names its hospital by slug, and the name printed on the card
   comes from branches.json, so the two files can never disagree about what a
   hospital is called. A slug that matches no hospital is dropped rather than
   rendered with an empty place line. */
export function getPatientVoices() {
  const names = new Map(branches.items.map((branch) => [branch.slug, branch.name]));
  return testimonialsRaw.items
    .filter((item) => names.has(item.branch))
    .map((item) => ({ ...item, hospital: names.get(item.branch) }));
}
