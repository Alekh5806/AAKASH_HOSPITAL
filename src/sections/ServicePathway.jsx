import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { servicePage } from "../lib/servicesData";

const { pathway } = servicePage;
const EASE = [0.22, 1, 0.36, 1];

/* The page's one dark band. Whichever of the eleven services a reader has just
   opened, the route to it is the same, and saying so once here is what stops
   eleven service pages each repeating it.
 *
 * The section plays as a route rather than appearing as six tiles: the rule
 * draws itself across, then each marker lands and its step rises behind it, in
 * order. The order is the content - it is a sequence, and a reader who sees it
 * assemble left to right has already been told that. */
export default function ServicePathway() {
  const stepsRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const inView = useInView(stepsRef, { once: true, amount: 0.3 });
  const drawn = shouldReduceMotion || inView;

  return (
    <section className="e-sec e-sec--dark sv-path">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{pathway.label}</span>
          <div className="e-head__body">
            <h2 className="e-h2 sv-path__title">{pathway.title}</h2>
          </div>
        </div>

        <ol className="sv-path__steps" ref={stepsRef} data-drawn={drawn ? "true" : undefined}>
          {pathway.steps.map((step, position) => (
            <li className="sv-path__step" key={step.title} style={{ "--sv-i": position }}>
              <span className="sv-path__dot" aria-hidden="true" />
              <motion.div
                className="sv-path__body"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: drawn ? 1 : 0, y: drawn ? 0 : 14 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.5,
                  ease: EASE,
                  // a beat behind this step's own marker, so the dot lands and
                  // the step rises behind it rather than the two arriving together
                  delay: shouldReduceMotion ? 0 : 0.34 + position * 0.16,
                }}
              >
                <span className="sv-path__kicker">{step.kicker}</span>
                <h3 className="sv-path__name">{step.title}</h3>
                <p className="sv-path__text">{step.description}</p>
              </motion.div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
