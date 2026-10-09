import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/* Node and the browser can disagree in the last digit of a sine, and the
   prerendered page has to carry exactly the numbers React's first pass draws,
   so every computed coordinate is fixed to three places - a thousandth of a
   unit in a 400-unit drawing. */
const at = (value) => value.toFixed(3);

/* How far the iris travels toward the pointer, as a share of the eye's own
   reach (see .sv-iris__eye), and how far the pointer has to be before the
   eye is looking all the way at it - in widths of the mark. */
const GAZE_REACH = 2.4;
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/* The services page's one signature visual: an iris drawn from concentric
   rings, breathing slowly the way a real pupil does under changing light.
 *
 * It is SVG rather than a photograph because it has to sit behind type at every
 * width without a scrim, and because a stock close-up of an eye is the most
 * generic image an eye hospital can put on a page. Everything animates in CSS
 * on `transform`, `translate`, `scale` and `opacity` only.
 *
 * It arrives the way the opening curtain's iris does - the pupil is there
 * first, the limbus draws round it, the stroma grows out of it and the rings
 * arrive last - once `start` turns true, `delay` seconds after the head
 * starts to rise. On a mouse or a trackpad it then looks toward the pointer,
 * the pupil a little further than the iris round it, and back to the reader
 * when the pointer leaves the window. `prefers-reduced-motion` renders it
 * finished and still: it carries no information, so nothing is lost. */
export default function IrisMark({ start = true, delay = 0 }) {
  const shouldReduceMotion = useReducedMotion();
  const svgRef = useRef(null);
  const [drawn, setDrawn] = useState(false);

  /* Two frames in the undrawn state before the switch, so the transitions
     have a first state to leave even on a page that mounts with `start`
     already true. */
  useEffect(() => {
    if (!start || shouldReduceMotion) return undefined;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setDrawn(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [start, shouldReduceMotion]);

  /* The gaze is written straight to the element - it is a measurement of the
     pointer, not render state - at most once a frame, and only while the mark
     is on screen. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || shouldReduceMotion || !window.matchMedia(FINE_POINTER).matches) {
      return undefined;
    }

    let visible = false;
    let frame = 0;
    let pointer = null;

    const look = () => {
      frame = 0;
      let x = 0;
      let y = 0;
      if (pointer) {
        const box = svg.getBoundingClientRect();
        const dx = pointer.x - (box.left + box.width / 2);
        const dy = pointer.y - (box.top + box.height / 2);
        const distance = Math.hypot(dx, dy) || 1;
        const pull = Math.min(1, distance / (box.width * GAZE_REACH));
        x = (dx / distance) * pull;
        y = (dy / distance) * pull;
      }
      svg.style.setProperty("--sv-gx", x.toFixed(3));
      svg.style.setProperty("--sv-gy", y.toFixed(3));
    };

    const schedule = () => {
      if (visible && !frame) frame = requestAnimationFrame(look);
    };
    const onMove = (event) => {
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const onLeave = () => {
      pointer = null;
      schedule();
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(svg);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [shouldReduceMotion]);

  return (
    <svg
      ref={svgRef}
      className="sv-iris"
      data-still={shouldReduceMotion ? "true" : undefined}
      data-drawn={drawn || shouldReduceMotion ? "true" : undefined}
      style={{ "--sv-iris-delay": `${delay}s` }}
      viewBox="0 0 400 400"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="sv-iris-core" cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor="#1b5f86" />
          <stop offset="58%" stopColor="#123c61" />
          <stop offset="100%" stopColor="#0c2c49" />
        </radialGradient>
        <radialGradient id="sv-iris-glow" cx="38%" cy="34%" r="46%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* the outer field - three rings that drift at different speeds */}
      <g className="sv-iris__field">
        <circle className="sv-iris__ring sv-iris__ring--a" cx="200" cy="200" r="192" />
        <circle className="sv-iris__ring sv-iris__ring--b" cx="200" cy="200" r="158" />
        <circle className="sv-iris__ring sv-iris__ring--c" cx="200" cy="200" r="126" />
      </g>

      {/* everything that turns with the gaze */}
      <g className="sv-iris__eye">
        <circle className="sv-iris__body" cx="200" cy="200" r="104" fill="url(#sv-iris-core)" />

        {/* stroma - the fibres that make an iris read as an iris */}
        <g className="sv-iris__stroma">
          {Array.from({ length: 48 }, (_, i) => {
            const angle = (i / 48) * Math.PI * 2;
            const inner = 46;
            const outer = i % 4 === 0 ? 100 : 88;
            return (
              <line
                key={i}
                x1={at(200 + Math.cos(angle) * inner)}
                y1={at(200 + Math.sin(angle) * inner)}
                x2={at(200 + Math.cos(angle) * outer)}
                y2={at(200 + Math.sin(angle) * outer)}
              />
            );
          })}
        </g>

        <circle className="sv-iris__limbus" cx="200" cy="200" r="104" />
        <g className="sv-iris__lens">
          <circle className="sv-iris__pupil" cx="200" cy="200" r="42" />
        </g>
        <circle className="sv-iris__glow" cx="200" cy="200" r="104" fill="url(#sv-iris-glow)" />
      </g>

      {/* the reflection of the room stays where the light is while the eye
          turns under it */}
      <circle className="sv-iris__spark" cx="168" cy="166" r="13" />
    </svg>
  );
}
