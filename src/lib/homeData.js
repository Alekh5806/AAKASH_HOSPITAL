import homeRaw from "../data/home.json";
import { getServiceBySlug } from "./servicesData";

export const home = homeRaw;

/* The "Conditions we treat" picker lists services by slug and carries only the
   one line written for it; the title, photograph, icon and sentence are the
   service's own, so nothing about a service is written twice. A slug that
   matches nothing is dropped rather than rendered as an empty slot. */
export function getTreatedConditions() {
  return home.conditions.items
    .map((item) => {
      const service = getServiceBySlug(item.service);
      return service ? { ...item, service } : null;
    })
    .filter(Boolean);
}
