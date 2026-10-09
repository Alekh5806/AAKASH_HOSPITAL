import { Fragment, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import ServiceActions from "../components/ServiceActions";
import SmartImage from "../components/SmartImage";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import { getCategoryLabel, serviceDetail, splitServiceTitle } from "../lib/servicesData";

const { hero } = serviceDetail;
const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* The frame lifts in behind the head, and its chips follow it one by one.
   Both take their delay from the head's start, so the order holds whether
   the page waited for the opening curtain or not. */
const FRAME = {
  hidden: { opacity: 0, y: 26 },
  shown: (delay) => ({ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay } }),
};

const CHIP = {
  hidden: { opacity: 0, y: 14 },
  shown: (delay) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay } }),
};

/* The opening, built to the Function Health "What we test" reference: an
 * editorial head on warm paper, then one wide media card that carries the
 * photograph and a rail of glass chips along its foot.
 *
 * It replaced a full-bleed navy band with the copy laid over the photograph.
 * That band had to fight its own picture for contrast on eleven very different
 * photographs, and it read as a stock banner rather than as the opening of a
 * document. Splitting the two - words on paper, picture in a frame - lets the
 * type be set properly and lets the photograph be a photograph.
 *
 * Three things carry the reference and are the ones most easily lost:
 *
 * 1. The headline is **serif**, centred, with its closing word in italic
 *    accent. `splitServiceTitle` takes that word off the end of the title -
 *    every service but Oculoplasty ends on the noun that names the kind of
 *    care, which is exactly the word the reference italicises.
 * 2. The card is a **wide letterbox**, not a hero band: the photograph sits
 *    inside a rounded frame with air around it.
 * 3. The chips are **translucent glass over the photograph**, not a list under
 *    it, each one a ticked line. The reference writes "Included" on every card
 *    because its list has 160+ tests and inclusion varies; everything shown
 *    here is included by definition, so the word was the same noun printed four
 *    times under a label that had already said it. The tick carries it.
 *
 * The chips are the service's own `featureBullets`, and they live here rather
 * than in the explore card below - this is the one page element that says what
 * the reader actually gets, and saying it twice on one page is what the rest of
 * this page is built to avoid.
 *
 * It arrives in reading order - the way back, the headline with its accent
 * word written in, the sentence, the actions - and then the frame lifts in and
 * its photograph settles. On a first visit all of it waits for the opening
 * curtain, the About, doctors and services heads' rule, so none of it is spent
 * unseen. */
export default function ServiceHero({ service, part, branch, urgent, actionsRef }) {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const chipsRef = useRef(null);
  const { lead, accent } = splitServiceTitle(service.title);

  const initial = reduceMotion ? false : "hidden";
  const state = introDone || reduceMotion ? "shown" : "hidden";
  /* After the curtain the aperture has to clear the head before it rises. */
  const delay = afterIntro ? 0.3 : 0.05;

  /* Below 901px the chips are a rail, and its ends fade only where there is
     something past them - the doctors filter's device. A chip cut at the
     frame's edge with nothing to say the rail continues reads as a defect.
     Written straight to the DOM: it is a measurement of the scroller, not
     something the render depends on. */
  useEffect(() => {
    const rail = chipsRef.current;
    const wrap = rail?.parentElement;
    if (!rail || !wrap) return undefined;
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      wrap.dataset.start = rail.scrollLeft > 4 ? "true" : "false";
      wrap.dataset.end = max > 4 && rail.scrollLeft < max - 4 ? "true" : "false";
    };
    sync();
    document.fonts?.ready.then(sync).catch(() => {});
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <section className="sd-hero" data-urgent={urgent ? "true" : undefined}>
      <motion.div
        className="e-shell"
        initial={initial}
        animate={state}
        variants={cascade(delay, 0.09)}
      >
        <motion.div variants={RISE}>
          <Link className="sd-hero__back" to="/services">
            <ArrowLeft size={15} aria-hidden="true" />
            {serviceDetail.backLabel}
          </Link>
        </motion.div>

        <motion.div className="sd-hero__head" variants={cascade(0, 0.09)}>
          <motion.h1 className="sd-hero__title" variants={RISE}>
            {lead}
            {accent && lead ? " " : null}
            {accent ? (
              <motion.em variants={cascade(0.4, 0.11)}>
                {accent.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    {index > 0 ? " " : null}
                    <motion.span className="sd-hero__ink" variants={WRITE}>
                      {word}
                    </motion.span>
                  </Fragment>
                ))}
              </motion.em>
            ) : null}
          </motion.h1>

          <motion.p className="sd-hero__lede" variants={RISE}>
            {service.shortDescription}
          </motion.p>

          <motion.div className="sd-hero__actions" variants={RISE}>
            <ServiceActions service={service} branch={branch} urgent={urgent} ref={actionsRef} />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="e-shell sd-frame"
        data-in={state === "shown" ? "true" : undefined}
        initial={initial}
        animate={state}
        variants={FRAME}
        custom={delay + 0.34}
      >
        <div className="sd-frame__media">
          <SmartImage
            className="sd-frame__img"
            src={service.image}
            alt={service.imageAlt}
            loading="eager"
            sizes="(min-width: 1280px) 1240px, 100vw"
          />
          <span className="sd-frame__scrim" aria-hidden="true" />
        </div>

        {/* The two facts that identify the service, as glass on the photograph.
            Both are derived, and both are hidden below 640px: the kind of care
            is how the reader got here and the part of the eye opens the first
            tab below, so on a phone they are two more things to read before the
            picture. */}
        <div className="sd-frame__tags">
          <span>
            <i aria-hidden="true" />
            {getCategoryLabel(service.category)}
          </span>
          {part ? <span>{part.label}</span> : null}
        </div>

        <div className="sd-frame__foot">
          <span className="sd-frame__label">{hero.includedLabel}</span>

          {/* A scroll-snap rail on a phone, where four chips cannot share the
              width; they simply fit in a row from 901px up. The wrapper
              carries the rail's end fades, which cannot live on the scroller
              itself - they would scroll away with its content. */}
          <div className="sd-chips__wrap">
            <ul className="sd-chips" ref={chipsRef}>
              {service.featureBullets.map((bullet, position) => (
                <motion.li
                  className="sd-chip"
                  key={bullet}
                  initial={initial}
                  animate={state}
                  variants={CHIP}
                  custom={delay + 0.62 + position * 0.09}
                >
                  <span className="sd-chip__tick" aria-hidden="true">
                    <Check size={12} />
                  </span>
                  <p>{bullet}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      <p className="e-shell sd-hero__note">{hero.includedNote}</p>
    </section>
  );
}
