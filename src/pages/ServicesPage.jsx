import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import CountUp from "../components/CountUp";
import { ServicesJsonLd } from "../components/JsonLd";
import IrisMark from "../components/IrisMark";
import SEO from "../components/SEO";
import { branches } from "../lib/coreData";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import { servicePage, services } from "../lib/servicesData";
import ServiceEmergency from "../sections/ServiceEmergency";
import ServiceExplorer from "../sections/ServiceExplorer";
import ServicePathway from "../sections/ServicePathway";
import "../styles/services.css";

const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 16 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/* The stamp is the About pages' founding-date stamp, and it is set the same
   way: the accent rule draws down and the words rise behind it. */
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

/* The stamp's figures start counting as their words land, rather than being
   most of the way through by the time the reader can see them. */
const COUNT_AFTER_MS = 480;

/* Four sections and one job each: who we are (the opening), which service is
   yours (the explorer), what happens when you arrive (the pathway), and what
   must not wait (the urgent band). The urgent band sits last because it is the
   exception to everything above it - all of that can wait for an appointment
   and it cannot.
 *
 * The opening arrives in reading order - label, headline, the accent written
 * in, the lede, the stamp counting up, the actions - while the iris draws
 * itself in beside it. On a first visit all of it waits for the opening
 * curtain, so none of it is spent unseen. */
export default function ServicesPage() {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const [counting, setCounting] = useState(false);
  const initial = reduceMotion ? false : "hidden";
  const shown = introDone || reduceMotion;
  /* After the curtain the aperture has to clear the head before it rises. */
  const delay = afterIntro ? 0.3 : 0.05;

  useEffect(() => {
    if (!shown) return undefined;
    const timer = window.setTimeout(() => setCounting(true), delay * 1000 + COUNT_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [shown, delay]);

  const figures = [
    { value: services.items.length, word: "services" },
    { value: branches.items.length, word: "hospitals" },
  ];

  return (
    <>
      <SEO meta={services.seo} />
      <ServicesJsonLd meta={services.seo} services={services.items} />

      <section className="e-sec e-sec--tight sv-top">
        <motion.div
          className="e-shell sv-top__shell"
          initial={initial}
          animate={shown ? "shown" : "hidden"}
          variants={cascade(delay)}
        >
          <div className="sv-top__copy">
            <motion.span className="e-label sv-top__label" variants={RISE}>
              {servicePage.eyebrow}
            </motion.span>
            <motion.h1 className="e-h1 sv-top__title" variants={RISE}>
              {servicePage.title}{" "}
              <motion.em variants={cascade(0.35, 0.11)}>
                {servicePage.titleAccent.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    {index > 0 ? " " : null}
                    <motion.span className="sv-top__ink" variants={WRITE}>
                      {word}
                    </motion.span>
                  </Fragment>
                ))}
              </motion.em>
            </motion.h1>

            <motion.div className="sv-top__row" variants={cascade(0, 0.12)}>
              <motion.p className="e-lede sv-top__lede" variants={RISE}>
                {servicePage.lede}
              </motion.p>
              {/* Both figures are counted rather than written, so the stamp can
                  never contradict the list below it or the branch list. */}
              <motion.p className="sv-top__stamp" variants={STAMP}>
                <motion.span className="sv-top__stamp-label" variants={STAMP_WORD}>
                  {servicePage.stampLabel}
                </motion.span>
                <span className="sv-top__figures">
                  {figures.map((figure) => (
                    <motion.strong
                      key={figure.word}
                      variants={STAMP_WORD}
                      style={{ "--sv-digits": String(figure.value).length }}
                    >
                      <CountUp value={figure.value} start={counting} duration={1.1} /> {figure.word}
                    </motion.strong>
                  ))}
                </span>
              </motion.p>
            </motion.div>

            <motion.div className="sv-top__actions" variants={RISE}>
              <a className="e-btn" href="#find-a-service">
                {servicePage.finder.ctaLabel}
                <ArrowRight size={16} aria-hidden="true" />
              </a>
              <Link
                className="sv-top__urgent"
                to={`/services/${servicePage.emergency.serviceSlug}`}
              >
                <AlertTriangle size={16} aria-hidden="true" />
                {servicePage.emergency.label}
              </Link>
            </motion.div>
          </div>

          <div className="sv-top__mark">
            <IrisMark start={shown} delay={delay} />
          </div>
        </motion.div>
      </section>

      <ServiceExplorer />

      <ServicePathway />

      <ServiceEmergency />
    </>
  );
}
