import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "../components/Reveal";
import { serviceDetail, servicePage } from "../lib/servicesData";

const { visit } = serviceDetail;
const { pathway } = servicePage;

/* What a visit looks like, as a track the reader scrubs rather than a list they
 * scroll.
 *
 * The build before this one named the six steps and explained none of them: six
 * rows of a numbered circle and one word, each two thirds empty, 771px of phone
 * screen to say almost nothing. It read as a skeleton.
 *
 * The steps are a native scroll-snap rail - swipe on a touch screen, dots on a
 * pointer, and a plain horizontal scroller if the JavaScript never arrives. It
 * is the same mechanism the conditions rail and the doctor rail use, and for
 * the same reason: the browser gives momentum, snapping and - the part that
 * matters most here - the direction lock, so a horizontal swipe never fights the
 * page's vertical scroll. Do not replace it with a drag handler.
 *
 * Scroll position is the single source of truth. The dots do not set the step;
 * they scroll the rail, and the rail reports back. That is what keeps the two in
 * sync no matter which one the reader used.
 *
 * It does show the index pathway's step descriptions, which that section owns.
 * The rule it bends was written when this page had no room for them; one step
 * at a time costs about 84px, where six stacked paragraphs on eleven service
 * pages is what the rule exists to prevent. */
export default function ServiceVisit({ branch }) {
  const shouldReduceMotion = useReducedMotion();
  const railRef = useRef(null);
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  /* The fill follows the raw scroll offset, not the snapped step, so the rail
     fills under the reader's thumb as they drag rather than jumping when the
     snap lands. It is written straight to the DOM: it changes every frame of a
     scroll and nothing renders from it. */
  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const span = rail.scrollWidth - rail.clientWidth;
    const ratio = span > 0 ? Math.min(1, Math.max(0, rail.scrollLeft / span)) : 0;
    trackRef.current?.style.setProperty("--sd-progress", String(ratio));

    const index = Math.round(rail.scrollLeft / rail.clientWidth);
    setActive(Math.min(pathway.steps.length - 1, Math.max(0, index)));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };

    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [sync]);

  const goTo = (index) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollTo({
      left: index * rail.clientWidth,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section className="sd-sec sd-visit" id="visit" aria-labelledby="sd-visit-title">
      <div className="e-shell">
        <Reveal className="sd-head">
          <div>
            <span className="sd-label">{visit.label}</span>
            <h2 className="sd-h2" id="sd-visit-title">
              {visit.title}
            </h2>
          </div>
          <p className="sd-visit__lede">{visit.lede}</p>
        </Reveal>

        <Reveal className="sd-step">
          {/* The dots are the control and the order at once. aria-current marks
              the open step, which is what a stepper means - not a tablist,
              because these are steps rather than tabs and a roving tabstop
              would hide five of the six names from a reader tabbing through. */}
          <ol className="sd-step__track" ref={trackRef}>
            <span className="sd-step__fill" aria-hidden="true" />
            {pathway.steps.map((entry, position) => (
              <li key={entry.title}>
                <motion.button
                  type="button"
                  className="sd-step__dot"
                  aria-label={`${visit.stepLabel} ${position + 1}: ${entry.title}`}
                  aria-current={position === active ? "step" : undefined}
                  data-state={position === active ? "on" : position < active ? "done" : undefined}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
                  onClick={() => goTo(position)}
                >
                  <span aria-hidden="true">{entry.kicker}</span>
                </motion.button>
              </li>
            ))}
          </ol>

          <div className="sd-step__rail" ref={railRef}>
            {pathway.steps.map((entry) => (
              <div className="sd-step__panel" key={entry.title}>
                {/* No numeral here: the dot the reader just pressed is the
                    number, and printing it again one line below said the same
                    thing twice. */}
                <h3 className="sd-step__name">{entry.title}</h3>
                <p className="sd-step__text">{entry.description}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="sd-visit__note" delay={0.05}>
          <MapPin size={15} aria-hidden="true" />
          <div className="sd-visit__copy">
            <strong>{visit.availabilityTitle}</strong>
            <p>{servicePage.availabilityNote}</p>
          </div>
          <Link className="e-link" to="/branches">
            {branch ? branch.name : "Hospitals"}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
