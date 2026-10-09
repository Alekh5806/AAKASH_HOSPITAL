import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import AboutSwitch from "./AboutSwitch";

const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/* The stamp's accent rule draws down and its words rise behind it, one at a
   time, so the date or the three promise words read as being set. */
const STAMP = {
  hidden: { clipPath: "inset(0% -12% 100% 0%)" },
  shown: {
    clipPath: "inset(0% -12% -12% 0%)",
    transition: { duration: 0.8, ease: EASE, staggerChildren: 0.08, delayChildren: 0.12 },
  },
};

const STAMP_WORD = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/* The opening of both About pages: eyebrow, headline, lede, the stamp beside
   it and the switch between the two pages. It arrives in reading order, and on
   a first visit it waits for the opening curtain so it is not spent unseen. */
export default function AboutHead({ page, stamp }) {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const stage = introDone || reduceMotion ? "shown" : "hidden";
  const initial = reduceMotion ? false : "hidden";
  const stacked = stamp.words.length > 1;

  return (
    <section className="e-sec e-sec--tight ab-top">
      <motion.div
        className="e-shell"
        initial={initial}
        animate={stage}
        variants={cascade(afterIntro ? 0.3 : 0.05)}
      >
        <motion.span className="e-label" variants={RISE}>
          {page.eyebrow}
        </motion.span>
        <motion.h1 className="e-h1 ab-top__title" variants={RISE}>
          {page.title}{" "}
          <motion.em variants={cascade(0.35, 0.11)}>
            {page.titleAccent.split(" ").map((word, index) => (
              <Fragment key={index}>
                {index > 0 ? " " : null}
                <motion.span className="ab-top__ink" variants={WRITE}>
                  {word}
                </motion.span>
              </Fragment>
            ))}
          </motion.em>
        </motion.h1>
        <motion.div className="ab-top__row" variants={cascade(0, 0.12)}>
          <motion.p className="e-lede ab-top__lede" variants={RISE}>
            {page.lede}
          </motion.p>
          <motion.p
            className={`ab-top__est${stacked ? " ab-top__est--stack" : ""}`}
            variants={STAMP}
          >
            <motion.span variants={STAMP_WORD}>{stamp.label}</motion.span>
            {stamp.words.map((word) => (
              <motion.strong key={word} variants={STAMP_WORD}>
                {word}
              </motion.strong>
            ))}
          </motion.p>
        </motion.div>
        <motion.div variants={RISE}>
          <AboutSwitch />
        </motion.div>
      </motion.div>
    </section>
  );
}
