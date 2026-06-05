import servicesRaw from "../data/services.json";

export const services = servicesRaw;

export function getServiceBySlug(slug) {
  return services.items.find((service) => service.slug === slug);
}

export function getServicesByIds(ids) {
  return ids.map((id) => services.items.find((service) => service.id === id)).filter(Boolean);
}
