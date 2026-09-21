import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import BranchActions from "../components/BranchActions";
import { site } from "../lib/coreData";
import { branchPage } from "../lib/branchData";
import { fillTemplate } from "../lib/servicesData";

const EASE = [0.22, 1, 0.36, 1];

/* The opening of a hospital's page, in the same shape as a service page's:
 * an editorial head on warm paper, then one wide media card carrying the
 * hospital's own photograph with a rail of glass facts along its foot.
 *
 * The headline is the network's name with the city in italic accent - that is
 * how the hospital is spoken of ("Aakash, Visnagar"), and it is the one word
 * on the page that changes from hospital to hospital. The two glass tags are
 * derived: head office or branch, and the founding year. The four facts are
 * the hospital's own `facts`, and they are the only list on the page that
 * says what this building offers. */
export default function BranchHero({ branch, actionsRef }) {
  const shouldReduceMotion = useReducedMotion();
  const { page } = branch;

  const stage = {
    hidden: {},
    visible: {
      transition: shouldReduceMotion ? {} : { staggerChildren: 0.07, delayChildren: 0.06 },
    },
  };

  const rise = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.55, ease: EASE },
    },
  };

  return (
    <section className="br-hero">
      <div className="e-shell">
        <Link className="br-hero__back" to="/branches">
          <ArrowLeft size={15} aria-hidden="true" />
          {branchPage.backLabel}
        </Link>

        <motion.div className="br-hero__head" variants={stage} initial="hidden" animate="visible">
          <motion.h1 className="br-hero__title" variants={rise}>
            {site.brand.name}
            <em>{branch.name}</em>
          </motion.h1>

          {/* Two sentences on paper is the right opening on a laptop and four
              lines of preamble before the first action on a phone, so the phone
              gets the hospital's own shorter line. Authored, never truncated -
              the cookie sheet's bodyShort device. */}
          <motion.p className="br-hero__lede" variants={rise}>
            <span className="br-full">{page.lede}</span>
            <span className="br-short">{page.ledeShort ?? page.lede}</span>
          </motion.p>

          <motion.div className="br-hero__actions" variants={rise}>
            <BranchActions branch={branch} ref={actionsRef} />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="e-shell br-frame"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: EASE, delay: 0.18 }}
      >
        <div className="br-frame__media">
          {/* The phone frame is nearly square and the desktop one a letterbox,
              so the phone gets the 1000px encode rather than the 2000px one. */}
          <picture>
            <source media="(max-width: 900px)" srcSet={page.imageSmall} />
            <img
              className="br-frame__img"
              src={page.image}
              alt={page.imageAlt}
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              sizes="(min-width: 1280px) 1240px, 100vw"
            />
          </picture>
          <span className="br-frame__scrim" aria-hidden="true" />
        </div>

        <div className="br-frame__tags">
          <span>
            <i aria-hidden="true" />
            {branch.isHeadquarters ? branchPage.headOfficeTag : branchPage.branchTag}
          </span>
          {page.establishedYear ? (
            <span>{fillTemplate(branchPage.sinceTag, { year: page.establishedYear })}</span>
          ) : null}
        </div>

        <div className="br-frame__foot">
          <span className="br-frame__label">{branchPage.factsLabel}</span>
          <ul className="br-chips">
            {page.facts.map((fact, position) => (
              <motion.li
                className="br-chip"
                key={fact}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.5,
                  ease: EASE,
                  delay: shouldReduceMotion ? 0 : 0.42 + position * 0.09,
                }}
              >
                <span className="br-chip__tick" aria-hidden="true">
                  <Check size={12} />
                </span>
                <p>{fact}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
