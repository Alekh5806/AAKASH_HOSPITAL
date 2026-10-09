import { Fragment } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DoctorsJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { doctors, doctorsPage, isOptometrist } from "../lib/doctorsData";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import DoctorRoster from "../sections/DoctorRoster";
import "../styles/doctors.css";

const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* The doctors page: one head and one roster.
 *
 * The page it replaced was the old PageHeader over a nine-card grid and a
 * closing CTA band. The team is the page - so the head names it, the roster
 * carries every consultant and optometrist with one question narrowing them
 * (which hospital), and the footer carries the appointment CTA the way it
 * does on every other page.
 *
 * The page arrives in reading order - head, then the filter, then the cards
 * on screen - and on a first visit it waits for the opening curtain, so none
 * of it is spent unseen. */
export default function DoctorsPage() {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const initial = reduceMotion ? false : "hidden";
  const stage = introDone || reduceMotion ? "shown" : "hidden";
  /* After the curtain the aperture has to clear the head before it rises. */
  const delay = afterIntro ? 0.3 : 0.05;

  return (
    <>
      <SEO meta={doctors.seo} />
      <DoctorsJsonLd meta={doctors.seo} doctors={doctors.items} isOptometrist={isOptometrist} />

      <section className="dr" aria-labelledby="dr-title">
        <div className="e-shell">
          <motion.header
            className="dr-head"
            initial={initial}
            animate={stage}
            variants={cascade(delay)}
          >
            <motion.span className="e-label" variants={RISE}>
              {doctorsPage.label}
            </motion.span>
            <motion.h1 className="dr-head__title" id="dr-title" variants={RISE}>
              {doctorsPage.title}{" "}
              <motion.em variants={cascade(0.35, 0.11)}>
                {doctorsPage.titleAccent.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    {index > 0 ? " " : null}
                    <motion.span className="dr-head__ink" variants={WRITE}>
                      {word}
                    </motion.span>
                  </Fragment>
                ))}
              </motion.em>
            </motion.h1>
            <motion.p className="dr-head__lede" variants={RISE}>
              {doctorsPage.lede}
            </motion.p>
          </motion.header>

          {/* One layout group, so the foot is measured with the roster and
              glides with it when a choice changes the list's height. */}
          <LayoutGroup>
            <DoctorRoster items={doctors.items} ready={introDone} delay={delay} />

            <motion.footer
              className="dr-foot"
              layout={reduceMotion ? false : "position"}
              transition={{ layout: { duration: 0.46, ease: EASE } }}
            >
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
            </motion.footer>
          </LayoutGroup>
        </div>
      </section>
    </>
  );
}
