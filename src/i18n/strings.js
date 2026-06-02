import { site } from "../lib/data";

const dictionary = {
  en: {
    brandName: site.brand.name,
    skipToContent: "Skip to content",
    bookAppointment: "Book Appointment",
  },
};

export function t(key, locale = "en") {
  return dictionary[locale]?.[key] ?? dictionary.en[key] ?? key;
}
