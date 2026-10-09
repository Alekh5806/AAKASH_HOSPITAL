import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SEO from "../components/SEO";
import { BranchesJsonLd } from "../components/JsonLd";
import { branches } from "../lib/coreData";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import { fillTemplate } from "../lib/servicesData";
import HospitalFinder from "../sections/HospitalFinder";
import "../styles/hospitals.css";

const COUNT_WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* The hospitals index: one head and one instrument.
 *
 * Its job is to get a reader to the right hospital and, if that is all they
 * need, to its number or its door without another page. Each hospital's own
 * page carries everything else, so nothing about a hospital is written twice.
 * The footer carries the appointment CTA on every page, so there is no closing
 * band here either.
 *
 * The page arrives in reading order - the head, the state written in, then the
 * map drawing itself and the rows beside it - and on a first visit it waits
 * for the opening curtain, so none of it is spent unseen. */
export default function BranchesPage() {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const initial = reduceMotion ? false : "hidden";
  const stage = introDone || reduceMotion ? "shown" : "hidden";
  /* After the curtain the aperture has to clear the head before it rises. */
  const delay = afterIntro ? 0.3 : 0.05;
  const { index, items } = branches;
  const count = COUNT_WORDS[items.length] ?? String(items.length);

  return (
    <>
      <SEO meta={branches.seo} />
      <BranchesJsonLd meta={branches.seo} />

      <section className="hs" aria-labelledby="hs-title">
        <div className="e-shell">
          <motion.header
            className="hs-head"
            initial={initial}
            animate={stage}
            variants={cascade(delay)}
          >
            <motion.span className="e-label" variants={RISE}>
              {index.label}
            </motion.span>
            <motion.h1 className="hs-head__title" id="hs-title" variants={RISE}>
              {fillTemplate(index.title, { count })}{" "}
              <motion.em variants={cascade(0.35, 0.11)}>
                {index.titleAccent.split(" ").map((word, position) => (
                  <Fragment key={position}>
                    {position > 0 ? " " : null}
                    <motion.span className="hs-head__ink" variants={WRITE}>
                      {word}
                    </motion.span>
                  </Fragment>
                ))}
              </motion.em>
            </motion.h1>
            <motion.p className="hs-head__lede" variants={RISE}>
              {index.lede}
            </motion.p>
          </motion.header>

          <HospitalFinder items={items} copy={index} ready={introDone} delay={delay} />
        </div>
      </section>
    </>
  );
}
