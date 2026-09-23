import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BreadcrumbJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { doctors, doctorsPage } from "../lib/doctorsData";
import DoctorRoster from "../sections/DoctorRoster";

/* The doctors page: one head and one roster.
 *
 * The page it replaced was the old PageHeader over a nine-card grid and a
 * closing CTA band. The team is the page - so the head names it, the roster
 * carries every consultant and optometrist with one question narrowing them
 * (which hospital), and the footer carries the appointment CTA the way it
 * does on every other page. */
export default function DoctorsPage() {
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
      <SEO meta={doctors.seo} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Doctors", href: "/doctors" },
        ]}
      />

      <section className="dr" aria-labelledby="dr-title">
        <div className="e-shell">
          <header className="dr-head">
            <motion.span className="e-label" {...rise(0)}>
              {doctorsPage.label}
            </motion.span>
            <motion.h1 className="dr-head__title" id="dr-title" {...rise(0.07)}>
              {doctorsPage.title} <em>{doctorsPage.titleAccent}</em>
            </motion.h1>
            <motion.p className="dr-head__lede" {...rise(0.14)}>
              {doctorsPage.lede}
            </motion.p>
          </header>

          <DoctorRoster items={doctors.items} />

          <footer className="dr-foot">
            <p className="dr-foot__text">{doctorsPage.foot.text}</p>
            <div className="dr-foot__links">
              <Link className="e-link" to="/appointment">
                {doctorsPage.foot.ctaLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className="e-link" to="/contact">
                {doctorsPage.foot.contactLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}
