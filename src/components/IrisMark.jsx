import { useReducedMotion } from "framer-motion";

/* The services page's one signature visual: an iris drawn from concentric
   rings, breathing slowly the way a real pupil does under changing light.
 *
 * It is SVG rather than a photograph because it has to sit behind type at every
 * width without a scrim, and because a stock close-up of an eye is the most
 * generic image an eye hospital can put on a page. Everything animates in CSS
 * on `transform` and `opacity` only, and `prefers-reduced-motion` renders it
 * still - it carries no information, so nothing is lost when it stops. */
export default function IrisMark() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      className="sv-iris"
      data-still={shouldReduceMotion ? "true" : undefined}
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

      {/* the iris body */}
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
              x1={200 + Math.cos(angle) * inner}
              y1={200 + Math.sin(angle) * inner}
              x2={200 + Math.cos(angle) * outer}
              y2={200 + Math.sin(angle) * outer}
            />
          );
        })}
      </g>

      <circle className="sv-iris__limbus" cx="200" cy="200" r="104" />
      <circle className="sv-iris__pupil" cx="200" cy="200" r="42" />
      <circle className="sv-iris__glow" cx="200" cy="200" r="104" fill="url(#sv-iris-glow)" />
      <circle className="sv-iris__spark" cx="168" cy="166" r="13" />
    </svg>
  );
}
