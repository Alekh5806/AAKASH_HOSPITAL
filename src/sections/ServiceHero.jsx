import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import ServiceActions from "../components/ServiceActions";
import SmartImage from "../components/SmartImage";
import { getCategoryLabel, serviceDetail, splitServiceTitle } from "../lib/servicesData";

const { hero } = serviceDetail;
const EASE = [0.22, 1, 0.36, 1];

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
 * this page is built to avoid. */
export default function ServiceHero({ service, part, branch, urgent, actionsRef }) {
  const shouldReduceMotion = useReducedMotion();
  const { lead, accent } = splitServiceTitle(service.title);

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
    <section className="sd-hero" data-urgent={urgent ? "true" : undefined}>
      <div className="e-shell">
        <Link className="sd-hero__back" to="/services">
          <ArrowLeft size={15} aria-hidden="true" />
          {serviceDetail.backLabel}
        </Link>

        <motion.div className="sd-hero__head" variants={stage} initial="hidden" animate="visible">
          <motion.h1 className="sd-hero__title" variants={rise}>
            {lead}
            {accent ? <em>{accent}</em> : null}
          </motion.h1>

          <motion.p className="sd-hero__lede" variants={rise}>
            {service.shortDescription}
          </motion.p>

          <motion.div className="sd-hero__actions" variants={rise}>
            <ServiceActions service={service} branch={branch} urgent={urgent} ref={actionsRef} />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        className="e-shell sd-frame"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: EASE, delay: 0.18 }}
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
              width; they simply fit in a row from 901px up. */}
          <ul className="sd-chips">
            {service.featureBullets.map((bullet, position) => (
              <motion.li
                className="sd-chip"
                key={bullet}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.5,
                  ease: EASE,
                  delay: shouldReduceMotion ? 0 : 0.42 + position * 0.09,
                }}
              >
                <span className="sd-chip__tick" aria-hidden="true">
                  <Check size={12} />
                </span>
                <p>{bullet}</p>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      <p className="e-shell sd-hero__note">{hero.includedNote}</p>
    </section>
  );
}
