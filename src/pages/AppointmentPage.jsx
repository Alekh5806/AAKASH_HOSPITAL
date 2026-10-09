import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PageJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { appointmentPage } from "../lib/appointmentData";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import BookingFlow from "../sections/BookingFlow";
import "../styles/appointment.css";

const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* The appointment page: one head and one instrument.
 *
 * The flow asks five short questions and writes the request onto a slip as
 * it goes; Send opens WhatsApp with that request addressed to the chosen
 * hospital's line. There is no form posting anywhere and no closing band -
 * the footer carries the site's appointment CTA and this page is where it
 * leads. Whatever the reader arrived from can prefill it: `?branch=<slug>`
 * from a hospital page, `?service=<id>` from a treatment page, `?name=`.
 *
 * The page arrives in reading order - the head, then the card and the slip
 * beside it - and on a first visit it waits for the opening curtain, so none
 * of it is spent unseen. */
export default function AppointmentPage() {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const initial = reduceMotion ? false : "hidden";
  const stage = introDone || reduceMotion ? "shown" : "hidden";
  /* After the curtain the aperture has to clear the head before it rises. */
  const delay = afterIntro ? 0.3 : 0.05;

  return (
    <>
      <SEO meta={appointmentPage.seo} />
      <PageJsonLd
        path="/appointment"
        meta={appointmentPage.seo}
        crumbs={[{ name: "Book an appointment", href: "/appointment" }]}
      />

      <section className="ap" aria-labelledby="ap-title">
        <div className="e-shell">
          <motion.header
            className="ap-head"
            initial={initial}
            animate={stage}
            variants={cascade(delay)}
          >
            <motion.span className="e-label" variants={RISE}>
              {appointmentPage.label}
            </motion.span>
            <motion.h1 className="ap-head__title" id="ap-title" variants={RISE}>
              {appointmentPage.title}{" "}
              <motion.em variants={cascade(0.35, 0.11)}>
                {appointmentPage.titleAccent.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    {index > 0 ? " " : null}
                    <motion.span className="ap-head__ink" variants={WRITE}>
                      {word}
                    </motion.span>
                  </Fragment>
                ))}
              </motion.em>
            </motion.h1>
            <motion.p className="ap-head__lede" variants={RISE}>
              {appointmentPage.lede}
            </motion.p>
          </motion.header>

          <BookingFlow start={introDone || reduceMotion} delay={delay} />
        </div>
      </section>
    </>
  );
}
