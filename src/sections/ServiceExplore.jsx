import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import EyeDiagram from "../components/EyeDiagram";
import SymptomScene from "../components/SymptomScene";
import { getPartForService, serviceDetail } from "../lib/servicesData";

const { tabs } = serviceDetail;
const EASE = [0.22, 1, 0.36, 1];
/* Long enough for the panel to have arrived, short enough that a reader who
   went looking for the drawing is not left waiting for it. */
const LIGHT_UP_MS = 420;

/* The drawing lands unlit and the part lights a beat later, so the reader
   watches the answer arrive instead of being handed it. The regions already
   carry a 220ms colour transition and the lit one breathes a glow, so this
   needs nothing but the delayed switch - and it re-runs every time the panel
   mounts, because AnimatePresence unmounts the panel it is inside. */
function AreaFigure({ part, still }) {
  const [lit, setLit] = useState(still);

  useEffect(() => {
    if (still) return undefined;
    const timer = setTimeout(() => setLit(true), LIGHT_UP_MS);
    return () => clearTimeout(timer);
  }, [still]);

  return (
    <figure className="sd-area">
      <EyeDiagram activePart={lit ? part.id : null} />
      <figcaption>
        <span>{serviceDetail.areaLabel}</span>
        <strong>{part.label}</strong>
        <em>{part.hint}</em>
      </figcaption>
    </figure>
  );
}

/* Everything a patient wants to know about one service, in one card they
 * explore rather than four bands they scroll past.
 *
 * The page this replaced put overview, anatomy, causes and treatment in
 * separate full-width sections. On a phone that was four screens of scrolling
 * to reach the thing the reader actually came for, and each section had to
 * carry its own heading to explain itself. Four tabs in one card is the same
 * content in one screen, and the tab bar is the explanation.
 *
 * Tabs are built from what the service actually has: a routine eye examination
 * has no "why it happens", so that tab is not rendered rather than rendered
 * empty. Content swaps in the direction the pill travels, so a switch reads as
 * moving along a row rather than as the page changing underneath.
 *
 * Nothing here navigates. The signs list changes the chart beside it and
 * nothing else. */
export default function ServiceExplore({ service }) {
  const shouldReduceMotion = useReducedMotion();
  const scrollerRef = useRef(null);
  const frameRef = useRef(null);
  const observerRef = useRef(null);
  const part = useMemo(() => getPartForService(service.slug), [service.slug]);

  const panels = useMemo(
    () =>
      [
        { id: "overview", label: tabs.overview },
        service.causes?.length ? { id: "causes", label: tabs.causes } : null,
        service.symptoms?.length ? { id: "symptoms", label: tabs.symptoms } : null,
      ].filter(Boolean),
    [service],
  );

  const [active, setActive] = useState(panels[0].id);
  const [direction, setDirection] = useState(1);
  const [sign, setSign] = useState(0);

  const shownSign = service.symptoms?.[sign] ?? service.symptoms?.[0];

  const switchTo = (id) => {
    const order = panels.map((panel) => panel.id);
    setDirection(order.indexOf(id) >= order.indexOf(active) ? 1 : -1);
    setActive(id);
    /* The chosen tab is centred by writing scrollLeft on its own scroller,
       never with scrollIntoView - that would scroll the page as well. */
    requestAnimationFrame(() => {
      const scroller = scrollerRef.current;
      const chip = scroller?.querySelector(`[data-tab="${id}"]`);
      if (!scroller || !chip) return;
      scroller.scrollTo({
        left: Math.max(0, chip.offsetLeft - (scroller.clientWidth - chip.offsetWidth) / 2),
        behavior: shouldReduceMotion ? "auto" : "smooth",
      });
    });
  };

  /* The card grows and shrinks to the tab rather than snapping to it, so the
     page never jumps under the reader's thumb.
   *
   * It is a callback ref, not an effect keyed on the active tab. AnimatePresence
   * holds the outgoing panel until its exit finishes, so an effect that fires
   * when the tab changes measures the panel that is leaving - and then its
   * observer reports zero the moment that panel detaches, collapsing the card.
   * The callback fires when the incoming panel actually mounts, which is the
   * only moment the measurement is meaningful. The height is written straight
   * to the DOM: a state setter here trips react-hooks/set-state-in-effect, and
   * the value is a measurement, not something the render depends on. */
  const measurePanel = useCallback((node) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const apply = () => {
      if (frameRef.current) frameRef.current.style.height = `${node.offsetHeight}px`;
    };
    apply();

    if (typeof ResizeObserver === "undefined") return;
    observerRef.current = new ResizeObserver(apply);
    observerRef.current.observe(node);
  }, []);

  /* The panel slides in the direction the pill travelled and its contents
     arrive behind it, one line at a time. A tab that assembles reads as a
     different view of the same card; a tab that appears whole reads as the page
     having been replaced. */
  const variants = {
    enter: (dir) => (shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 24 }),
    center: {
      opacity: 1,
      x: 0,
      transition: shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.3, ease: EASE, staggerChildren: 0.06, delayChildren: 0.05 },
    },
    exit: (dir) => (shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -24 }),
  };

  const item = {
    enter: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 },
    center: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.42, ease: EASE },
    },
    exit: { opacity: 0 },
  };

  const press = shouldReduceMotion ? undefined : { scale: 0.985 };

  return (
    <section className="sd-explore" id="detail" aria-label={service.title}>
      <div className="e-shell">
        <div className="sd-card">
          <div className="sd-card__tabs" role="tablist" aria-label={service.title}>
            <div className="sd-card__scroller" ref={scrollerRef}>
              {panels.map((panel) => (
                <motion.button
                  type="button"
                  className="sd-tab"
                  key={panel.id}
                  role="tab"
                  id={`sd-tab-${panel.id}`}
                  data-tab={panel.id}
                  data-on={active === panel.id ? "true" : undefined}
                  aria-selected={active === panel.id}
                  aria-controls={`sd-panel-${panel.id}`}
                  onClick={() => switchTo(panel.id)}
                  whileTap={press}
                >
                  {active === panel.id ? (
                    <motion.span
                      className="sd-tab__pill"
                      layoutId="sd-tab-pill"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 38 }
                      }
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="sd-tab__text">{panel.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="sd-card__frame" ref={frameRef}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                className="sd-card__body"
                key={active}
                ref={measurePanel}
                id={`sd-panel-${active}`}
                role="tabpanel"
                aria-labelledby={`sd-tab-${active}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: shouldReduceMotion ? 0 : 0.32, ease: EASE }}
              >
                {active === "overview" ? (
                  <div className="sd-split">
                    <div className="sd-prose">
                      {service.longDescription.map((paragraph, position) => (
                        <motion.p
                          key={paragraph}
                          className={position === 0 ? "sd-prose__lead" : undefined}
                          variants={item}
                        >
                          {paragraph}
                        </motion.p>
                      ))}
                    </div>

                    {/* A patient knows where the trouble is long before they
                        know what it is called. The part and its sentence are
                        the finder's own, and the drawing carries no handlers -
                        the part is a fact about this service, not a control. */}
                    {part ? (
                      <motion.div className="sd-split__figure" variants={item}>
                        <AreaFigure part={part} still={shouldReduceMotion} />
                      </motion.div>
                    ) : null}
                  </div>
                ) : null}

                {active === "causes" ? (
                  <ol className="sd-list">
                    {service.causes.map((cause, position) => (
                      <motion.li key={cause} variants={item}>
                        <span aria-hidden="true">{String(position + 1).padStart(2, "0")}</span>
                        <p>{cause}</p>
                      </motion.li>
                    ))}
                  </ol>
                ) : null}

                {active === "symptoms" ? (
                  <div className="sd-split sd-split--signs">
                    <ul className="sd-signs">
                      {service.symptoms.map((symptom, position) => (
                        <motion.li key={symptom.text} variants={item}>
                          <motion.button
                            type="button"
                            whileTap={press}
                            className="sd-sign"
                            data-on={sign === position ? "true" : undefined}
                            aria-pressed={sign === position}
                            onClick={() => setSign(position)}
                          >
                            <span className="sd-sign__text">{symptom.text}</span>
                            <span className="sd-sign__mark" aria-hidden="true" />
                          </motion.button>
                        </motion.li>
                      ))}
                    </ul>

                    <motion.div className="sd-chart" variants={item}>
                      <SymptomScene visual={shownSign?.visual} label={shownSign?.text} />
                      <p className="sd-chart__hint">{serviceDetail.symptomsHint}</p>
                    </motion.div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          {active === "symptoms" ? (
            <p className="sd-card__note">{serviceDetail.symptomsNote}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
