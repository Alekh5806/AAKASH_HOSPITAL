import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import BranchStatus from "./BranchStatus";
import { appointmentPage, parseMobile } from "../lib/appointmentData";

const { slip } = appointmentPage;
const CHOICE_LINES = new Set(["branch", "service", "date", "daypart"]);
const EASE = [0.22, 1, 0.36, 1];
/* How far the slip tilts toward a mouse, in degrees. Small on purpose - it
   is a card of paper on a desk, not a hologram. */
const TILT_DEG = 3.5;
const PEN_SPRING = { type: "spring", stiffness: 380, damping: 32 };

/* The appointment slip: the request, written out as the reader answers.
 *
 * It is the paper token a hospital desk hands over, and it is also exactly
 * the message that will be sent - so the reader always sees what is going,
 * to which hospital, on which number. The navy head names the hospital and
 * its WhatsApp line and carries the live OPD status, because "when will they
 * reply" is the question that follows "what am I sending". A perforation
 * separates it from the lines below, which fill in one at a time: an empty
 * line is a dotted leader, a filled one is ink. When every required line is
 * in, a stamp lands.
 *
 * Three things make it read as alive rather than printed. The lines arrive
 * in sequence when the slip does - on a phone that is the last step, and the
 * slip prints itself there. A pen sits beside the line the reader is on and
 * travels down the slip as they go (`activeLine`, one element with a
 * `layoutId`). And a line that takes a chosen answer flashes a highlighter
 * sweep as the ink lands. A mouse over the desktop slip tilts it a few
 * degrees, which is what says it is paper and not a panel.
 *
 * `rows` is the same set of values the WhatsApp text is built from, already
 * described in words - the slip and the message can never say different
 * things. */
export default function BookingSlip({ branch, rows, ready, sent, compact, activeLine }) {
  const shouldReduceMotion = useReducedMotion();
  const still = Boolean(shouldReduceMotion);
  const number = parseMobile(`+${branch.whatsappNumber}`).display;
  const stampLabel = sent ? slip.sentStamp : slip.readyStamp;

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 170, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 170, damping: 20 });
  const tilts = !compact && !still;

  const onPointerMove = (event) => {
    if (!tilts || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    rotateY.set(x * TILT_DEG * 2);
    rotateX.set(-y * TILT_DEG * 2);
  };

  const settle = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const line = (index) => ({
    initial: still ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: still ? { duration: 0 } : { duration: 0.42, ease: EASE, delay: 0.16 + index * 0.07 },
  });

  return (
    <motion.aside
      className="ap-slip"
      data-compact={compact ? "true" : undefined}
      aria-label={slip.reviewLabel}
      style={tilts ? { rotateX: springX, rotateY: springY, transformPerspective: 1100 } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={settle}
    >
      <div className="ap-slip__head">
        <span className="e-label">{slip.kicker}</span>
        <p className="ap-slip__to">
          <span className="ap-slip__to-label">{slip.toLabel}</span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.strong
              key={branch.slug}
              initial={still ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={still ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: still ? 0 : 0.32, ease: EASE }}
            >
              {branch.name}
            </motion.strong>
          </AnimatePresence>
          <span className="ap-slip__via">
            {slip.viaLabel} <b>{number}</b>
          </span>
        </p>
        <BranchStatus branch={branch} />
      </div>

      <div className="ap-slip__tear" aria-hidden="true" />

      <dl className="ap-slip__lines">
        {Object.keys(slip.lines).map((key, index) => {
          const value = rows[key];
          const filled = Boolean(value);
          const active = key === activeLine;
          return (
            <motion.div
              className="ap-slip__line"
              key={key}
              data-filled={filled ? "true" : undefined}
              data-active={active ? "true" : undefined}
              {...line(index)}
            >
              {active ? (
                <motion.span
                  className="ap-slip__pen"
                  layoutId="ap-slip-pen"
                  aria-hidden="true"
                  transition={still ? { duration: 0 } : PEN_SPRING}
                />
              ) : null}
              <dt>{slip.lines[key]}</dt>
              <dd>
                {CHOICE_LINES.has(key) ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      className="ap-slip__value"
                      key={value || "empty"}
                      initial={still ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={still ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={{ duration: still ? 0 : 0.3, ease: EASE }}
                    >
                      {value || ""}
                    </motion.span>
                  </AnimatePresence>
                ) : (
                  <span className="ap-slip__value">{value || ""}</span>
                )}
                {/* The highlighter: a sweep across the line as a chosen answer
                    lands. Keyed on the value so it runs once per change. */}
                {filled && CHOICE_LINES.has(key) && !still ? (
                  <motion.span
                    className="ap-slip__wash"
                    key={`wash-${value}`}
                    aria-hidden="true"
                    initial={{ scaleX: 0, opacity: 0.55 }}
                    animate={{ scaleX: 1, opacity: 0 }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                ) : null}
              </dd>
            </motion.div>
          );
        })}
      </dl>

      <div className="ap-slip__foot">
        <div className="ap-slip__stamp-slot" aria-live="polite">
          <AnimatePresence>
            {ready ? (
              <motion.span
                className="ap-slip__stamp"
                key={stampLabel}
                data-sent={sent ? "true" : undefined}
                initial={still ? { opacity: 0 } : { opacity: 0, scale: 1.7, rotate: -18 }}
                animate={{ opacity: 1, scale: 1, rotate: -7 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={
                  still
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 520, damping: 26, mass: 0.7, delay: 0.2 }
                }
              >
                {stampLabel}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        <p className="ap-slip__note">{sent ? slip.sentNote : slip.note}</p>
      </div>
    </motion.aside>
  );
}
