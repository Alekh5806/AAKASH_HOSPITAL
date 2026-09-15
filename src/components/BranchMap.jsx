import { motion, useReducedMotion } from "framer-motion";

/* A sketch of the hospital's own address, drawn rather than embedded.
 *
 * Every element here is a fact from the postal address - the road, the two
 * landmarks either side of the hospital, the PIN - laid out the way a local
 * would draw it on the back of a card. A Google map at this size is a grey
 * field with one pin on it and tells a first-time visitor nothing they can
 * repeat to a driver; the sketch names the things they will actually look for.
 * The live map is one tap away inside the same frame.
 *
 * The drawing plays when it comes into view: the road draws itself across,
 * the landmarks land either side of it, the hospital block fills, and the pin
 * drops with a ripple. A dot travels the road to the hospital, which is what
 * says "this is how you arrive". Under reduced motion every stroke is already
 * drawn and nothing ripples.
 *
 * Lines and shapes are SVG; the labels are HTML placed in percentages over it,
 * because SVG text scales with the viewBox and 13px in a 600px drawing is 8px
 * on a phone. HTML labels keep a real type size at every width.
 *
 * Geometry is in a 600x440 space. The road is one cubic curve, and the two
 * landmark blocks sit on the road's own points at t=0.3 and t=0.8 so they
 * read as "on this road" rather than floating near it. */

const ROAD = "M -10 330 C 160 320, 260 200, 610 110";
const CROSS = "M 220 -10 L 270 450";
const PIN_AT = { x: 336, y: 158 };

const PIN_PATH =
  "M 0 0 c -8 -10 -13 -17 -13 -25 a 13 13 0 1 1 26 0 c 0 8 -5 15 -13 25 z";

export default function BranchMap({
  active,
  landmarks,
  pinLabel,
  cityName,
  postcode,
  postcodeLabel,
}) {
  const shouldReduceMotion = useReducedMotion();
  const road = landmarks.find((item) => item.kind === "road");
  const places = landmarks.filter((item) => item.kind !== "road");
  const [left, right] = places;

  const done = shouldReduceMotion || active;
  const ease = [0.22, 1, 0.36, 1];
  const draw = (delay, duration = 1.1) => ({
    initial: shouldReduceMotion ? false : { pathLength: 0, opacity: 0 },
    animate: done ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 },
    transition: shouldReduceMotion ? { duration: 0 } : { duration, ease, delay },
  });
  const pop = (delay) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, scale: 0.6 },
    animate: done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 260, damping: 20, delay },
  });
  const label = (delay) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 6 },
    animate: done ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
    transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease, delay },
  });

  return (
    <div className="br-map__scene" aria-hidden="true">
      <svg className="br-map__svg" viewBox="0 0 600 440" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="br-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" />
          </pattern>
          <radialGradient id="br-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b81657" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#b81657" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="600" height="440" fill="url(#br-grid)" />

        {/* Building footprints, faint, so the drawing reads as a town rather
            than two lines on a grid. */}
        <g fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.09)" strokeWidth="1.5">
          <rect x="120" y="100" width="70" height="46" rx="4" />
          <rect x="30" y="180" width="46" height="70" rx="4" />
          <rect x="360" y="40" width="88" height="40" rx="4" />
          <rect x="470" y="300" width="60" height="58" rx="4" />
          <rect x="200" y="380" width="96" height="36" rx="4" />
          <rect x="540" y="150" width="44" height="80" rx="4" />
          <rect x="330" y="280" width="54" height="44" rx="4" />
        </g>

        {/* Minor streets: static, faint, so the two named roads read as the
            ones that matter. */}
        <g stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none">
          <path d="M -10 80 L 610 60" />
          <path d="M -10 405 L 610 380" />
          <path d="M 520 -10 L 500 450" />
          <path d="M 90 -10 L 60 450" />
        </g>

        {/* The cross street, then the named road over it. */}
        <motion.path
          d={CROSS}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="10"
          strokeLinecap="round"
          {...draw(0.55, 0.9)}
        />

        <motion.path
          d={ROAD}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="22"
          strokeLinecap="round"
          {...draw(0, 1.2)}
        />
        {/* The dashed centre line is revealed through a mask that draws along
            the road, because a pathLength animation replaces the dash pattern
            with its own and the line came out solid. */}
        <mask id="br-road-reveal" maskUnits="userSpaceOnUse">
          <motion.path
            d={ROAD}
            fill="none"
            stroke="#fff"
            strokeWidth="30"
            strokeLinecap="round"
            {...draw(0.15, 1.2)}
          />
        </mask>
        <path
          d={ROAD}
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeDasharray="10 12"
          strokeLinecap="round"
          mask="url(#br-road-reveal)"
        />

        {/* Landmarks: outlined blocks on the road's own points. */}
        <motion.rect
          x="72"
          y="345"
          width="84"
          height="44"
          rx="6"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
          style={{ transformOrigin: "114px 367px" }}
          {...pop(1.05)}
        />
        <motion.rect
          x="424"
          y="196"
          width="72"
          height="46"
          rx="6"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
          style={{ transformOrigin: "460px 219px" }}
          {...pop(1.25)}
        />

        {/* The hospital, filled, with a glow that marks it as the destination. */}
        <motion.circle
          cx={PIN_AT.x}
          cy={PIN_AT.y}
          r="70"
          fill="url(#br-glow)"
          style={{ transformOrigin: `${PIN_AT.x}px ${PIN_AT.y}px` }}
          {...pop(1.5)}
        />
        <motion.rect
          x="298"
          y="150"
          width="78"
          height="56"
          rx="7"
          fill="rgba(255,255,255,0.92)"
          stroke="#fff"
          strokeWidth="2"
          style={{ transformOrigin: "337px 178px" }}
          {...pop(1.45)}
        />
        <motion.g
          initial={shouldReduceMotion ? false : { opacity: 0, y: -46 }}
          animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: -46 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 18, delay: 1.7 }
          }
        >
          <path
            d={PIN_PATH}
            transform={`translate(${PIN_AT.x} ${PIN_AT.y + 20})`}
            fill="#b81657"
            stroke="#fff"
            strokeWidth="2.5"
          />
          <circle cx={PIN_AT.x} cy={PIN_AT.y - 5} r="4.5" fill="#fff" />
        </motion.g>

        {/* Ripples from the pin's foot: three rings, one behind the other. */}
        {done && !shouldReduceMotion
          ? [0, 0.8, 1.6].map((delay) => (
              <motion.circle
                key={delay}
                cx={PIN_AT.x}
                cy={PIN_AT.y + 20}
                fill="none"
                stroke="#fff"
                strokeWidth="1.5"
                initial={{ r: 4, opacity: 0 }}
                animate={{ r: [4, 44], opacity: [0.7, 0] }}
                transition={{
                  duration: 2.4,
                  ease: "easeOut",
                  repeat: Infinity,
                  delay: 2.1 + delay,
                }}
              />
            ))
          : null}

        {/* The traveller: a dot that follows the road to the hospital. It
            stops where the road meets the block (the centre line crosses the
            block's edge at 0.55 of its length), so it reads as arriving at the
            door. At 0.6 it came to rest inside the building, and a white dot
            in the corner of the hospital read as a stray mark on every one of
            the six maps. */}
        {done && !shouldReduceMotion ? (
          <circle r="6" fill="#fff" stroke="#b81657" strokeWidth="3">
            <animateMotion
              dur="2.4s"
              begin="0.3s"
              fill="freeze"
              keyPoints="0;0.53"
              keyTimes="0;1"
              calcMode="linear"
              path={ROAD}
            />
          </circle>
        ) : null}

      </svg>

      {/* Labels in HTML over the drawing, at real type sizes. */}
      {road ? (
        <motion.span className="br-map__road" style={{ left: "3%", top: "59%" }} {...label(0.9)}>
          {road.label}
        </motion.span>
      ) : null}
      {/* Anchored to the frame's edges rather than centred on their blocks.
          Centred, a long name ran off the drawing - `Healing Touch Hospital` is
          148px on a 358px map and was cut in half at the left edge. Anchored,
          every label grows inward and wraps rather than clipping, whatever the
          hospital's address happens to name. */}
      {left ? (
        <motion.span
          className="br-map__place"
          data-side="left"
          style={{ left: "4%", top: "83.5%" }}
          {...label(1.2)}
        >
          {left.label}
        </motion.span>
      ) : null}
      {/* The right label hangs from its top edge rather than centring on the
          block's row: a name that wraps then grows downward, into open ground,
          instead of upward into the hospital block - `Gujarat Vepari Maha
          Mandal` on two lines reached the hospital's own block on a phone. */}
      {right ? (
        <motion.span
          className="br-map__place"
          data-side="right"
          style={{ right: "4%", top: "47.5%" }}
          {...label(1.4)}
        >
          {right.label}
        </motion.span>
      ) : null}
      <motion.span className="br-map__pin" style={{ left: "56%", top: "27%" }} {...label(1.95)}>
        {pinLabel}
      </motion.span>
      <span className="br-map__ghost">{cityName}</span>

      {postcode ? (
        <span className="br-map__stamp">
          <small>{postcodeLabel}</small>
          {postcode}
        </span>
      ) : null}
    </div>
  );
}
