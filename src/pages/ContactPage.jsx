import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BranchJsonLd, BreadcrumbJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { contactPage } from "../lib/contactData";
import ContactDesk from "../sections/ContactDesk";
import ContactDirectory from "../sections/ContactDirectory";

/* The contact page: one head, one instrument, one directory.
 *
 * The switchboard connects the reader to the hospital they chose - call,
 * WhatsApp, directions, email - and the ledger under it carries every desk
 * number at every hospital. Booking lives on its own page and the footer
 * carries the appointment CTA, so there is no form here and no closing band. */
export default function ContactPage() {
  const shouldReduceMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  });

  return (
    <>
      <SEO meta={contactPage.seo} />
      <BranchJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />

      <section className="ct" aria-labelledby="ct-title">
        <div className="e-shell">
          <header className="ct-head">
            <motion.span className="e-label" {...rise(0)}>
              {contactPage.label}
            </motion.span>
            <motion.h1 className="ct-head__title" id="ct-title" {...rise(0.07)}>
              {contactPage.title} <em>{contactPage.titleAccent}</em>
            </motion.h1>
            <motion.p className="ct-head__lede" {...rise(0.14)}>
              {contactPage.lede}
            </motion.p>
          </header>

          <ContactDesk />

          <motion.p className="ct-book" {...rise(0.4)}>
            <Link className="e-link" to="/appointment">
              {contactPage.bookLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </motion.p>
        </div>
      </section>

      <ContactDirectory />
    </>
  );
}
