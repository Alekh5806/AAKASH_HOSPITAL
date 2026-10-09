import { Fragment } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ContactJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { contactPage } from "../lib/contactData";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import ContactDesk from "../sections/ContactDesk";
import ContactDirectory from "../sections/ContactDirectory";
import "../styles/contact.css";

const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* The route to booking arrives after the card has connected. */
const LAST = {
  hidden: { opacity: 0, y: 10 },
  shown: (delay) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay } }),
};

/* The contact page: one head, one instrument, one directory.
 *
 * The switchboard connects the reader to the hospital they chose - call,
 * WhatsApp, directions, email - and the ledger under it carries every desk
 * number at every hospital. Booking lives on its own page and the footer
 * carries the appointment CTA, so there is no form here and no closing band.
 *
 * The page arrives in reading order - the head, then the card and its
 * connection - and on a first visit it waits for the opening curtain, so none
 * of it is spent unseen. */
export default function ContactPage() {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const initial = reduceMotion ? false : "hidden";
  const stage = introDone || reduceMotion ? "shown" : "hidden";
  /* After the curtain the aperture has to clear the head before it rises. */
  const delay = afterIntro ? 0.3 : 0.05;

  return (
    <>
      <SEO meta={contactPage.seo} />
      <ContactJsonLd meta={contactPage.seo} />

      <section className="ct" aria-labelledby="ct-title">
        <div className="e-shell">
          <motion.header
            className="ct-head"
            initial={initial}
            animate={stage}
            variants={cascade(delay)}
          >
            <motion.span className="e-label" variants={RISE}>
              {contactPage.label}
            </motion.span>
            <motion.h1 className="ct-head__title" id="ct-title" variants={RISE}>
              {contactPage.title}{" "}
              <motion.em variants={cascade(0.35, 0.11)}>
                {contactPage.titleAccent.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    {index > 0 ? " " : null}
                    <motion.span className="ct-head__ink" variants={WRITE}>
                      {word}
                    </motion.span>
                  </Fragment>
                ))}
              </motion.em>
            </motion.h1>
            <motion.p className="ct-head__lede" variants={RISE}>
              {contactPage.lede}
            </motion.p>
          </motion.header>

          <ContactDesk ready={introDone} delay={delay} />

          <motion.p
            className="ct-book"
            initial={initial}
            animate={stage}
            variants={LAST}
            custom={delay + 1.1}
          >
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
