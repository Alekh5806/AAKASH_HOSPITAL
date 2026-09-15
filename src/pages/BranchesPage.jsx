import { motion, useReducedMotion } from "framer-motion";
import SEO from "../components/SEO";
import { BranchJsonLd, BreadcrumbJsonLd } from "../components/JsonLd";
import { branches } from "../lib/coreData";
import { fillTemplate } from "../lib/servicesData";
import HospitalFinder from "../sections/HospitalFinder";

const COUNT_WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

/* The hospitals index: one head and one instrument.
 *
 * Its job is to get a reader to the right hospital and, if that is all they
 * need, to its number or its door without another page. Each hospital's own
 * page carries everything else, so nothing about a hospital is written twice.
 * The footer carries the appointment CTA on every page, so there is no closing
 * band here either. */
export default function BranchesPage() {
  const shouldReduceMotion = useReducedMotion();
  const { index, items } = branches;
  const count = COUNT_WORDS[items.length] ?? String(items.length);
  const rise = (delay) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  });

  return (
    <>
      <SEO meta={branches.seo} />
      <BranchJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Our Hospitals", href: "/branches" },
        ]}
      />

      <section className="hs" aria-labelledby="hs-title">
        <div className="e-shell">
          <header className="hs-head">
            <motion.span className="e-label" {...rise(0)}>
              {index.label}
            </motion.span>
            <motion.h1 className="hs-head__title" id="hs-title" {...rise(0.07)}>
              {fillTemplate(index.title, { count })} <em>{index.titleAccent}</em>
            </motion.h1>
            <motion.p className="hs-head__lede" {...rise(0.14)}>
              {index.lede}
            </motion.p>
          </header>

          <HospitalFinder items={items} copy={index} />
        </div>
      </section>
    </>
  );
}
