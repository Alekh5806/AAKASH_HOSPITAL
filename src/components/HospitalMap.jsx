import { useEffect, useMemo, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";

/* Every Aakash hospital on one drawn map of Gujarat.
 *
 * It is a sketch, not an embed: the state's outline, a dashed route that
 * threads the six hospitals north to south, and a dot for each one. A Google
 * map of a whole state at this size is a grey field with six pins that all
 * look alike; the sketch is recognisable at a glance to anyone who lives here,
 * and it has exactly one thing on it - where the hospitals are.
 *
 * The drawing is aria-hidden and holds no controls a reader depends on. The
 * real controls are the rows beside it: the map answers them - the row under a
 * pointer, or the row under a thumb on a phone, lights its dot and turns its
 * label into a pill. On a fine pointer the dots take hover and click as an
 * enhancement, exactly as the eye diagram's regions do.
 *
 * It plays when it comes into view: the outline draws itself, the route
 * follows it, and the dots land in order. From then on one thing keeps
 * moving - a traveller that rides the route from the hospital that was lit to
 * the one that is, which is what says "one network" rather than six dots.
 * Under reduced motion everything is already drawn and the traveller is gone.
 *
 * Lines and dots are SVG; the labels are HTML placed in percentages over it,
 * because SVG text scales with the viewBox and 13px in a 660px drawing is 7px
 * on a phone. HTML labels keep a real type size at every width. The geometry is
 * a 660x492 space, and each hospital's point is a share of it in
 * branches.json - the three Ahmedabad hospitals are nudged apart there so each
 * keeps its own dot, because at true scale they sit inside one dot. */

export const MAP_W = 660;
export const MAP_H = 492;

/* A simplified Gujarat, clockwise from Lakhpat: Kutch, the Gulf of Kutch,
   Saurashtra, the Gulf of Khambhat, the southern coast, then the eastern and
   northern borders. Projected once from the coastline and smoothed. */
const OUTLINE =
  "M 63.4 113.3 C 58.1 117.6, 46.0 121.6, 42.6 127.7 C 39.1 133.8, 40.0 142.5, 42.6 149.8 C 45.1 157.2, 45.9 162.0, 57.9 171.9 C 70.0 181.9, 99.8 203.0, 114.8 209.5 C 129.9 215.9, 135.5 213.1, 148.3 210.4 C 161.1 207.7, 179.1 197.9, 191.6 193.1 C 204.1 188.3, 219.5 180.8, 223.2 181.6 C 227.0 182.4, 218.3 191.5, 214.2 197.9 C 210.1 204.3, 207.9 211.7, 198.8 220.0 C 189.8 228.4, 178.1 244.1, 160.0 247.9 C 141.9 251.8, 103.7 240.1, 90.5 243.1 C 77.2 246.2, 72.7 252.6, 80.5 266.2 C 88.3 279.8, 120.1 306.9, 137.4 324.9 C 154.7 342.8, 172.8 362.2, 184.4 373.9 C 196.0 385.6, 193.7 388.3, 207.0 395.1 C 220.2 401.8, 248.8 413.8, 263.9 414.3 C 278.9 414.8, 285.7 404.0, 297.3 397.9 C 308.9 391.9, 323.2 385.4, 333.4 377.8 C 343.7 370.1, 353.4 362.8, 358.7 351.8 C 364.0 340.7, 365.0 323.4, 365.0 311.4 C 365.0 299.4, 353.0 288.5, 358.7 279.7 C 364.4 270.8, 389.3 256.1, 399.4 258.5 C 409.4 260.9, 417.7 284.1, 419.2 294.1 C 420.7 304.0, 409.9 304.5, 408.4 318.1 C 406.9 331.8, 407.9 363.0, 410.2 375.8 C 412.5 388.7, 418.5 387.0, 421.9 395.1 C 425.4 403.1, 431.0 412.4, 431.0 423.9 C 431.0 435.5, 415.2 460.3, 421.9 464.3 C 428.7 468.3, 455.1 457.1, 471.6 448.0 C 488.2 438.8, 508.5 424.7, 521.3 409.5 C 534.1 394.3, 544.6 375.0, 548.4 356.6 C 552.2 338.2, 540.9 314.9, 543.9 298.9 C 546.9 282.9, 562.7 275.7, 566.5 260.4 C 570.2 245.2, 571.7 222.8, 566.5 207.5 C 561.2 192.3, 544.6 180.3, 534.8 169.1 C 525.1 157.8, 516.0 153.0, 507.7 140.2 C 499.5 127.4, 495.7 105.8, 485.2 92.1 C 474.6 78.5, 460.3 68.9, 444.5 58.5 C 428.7 48.0, 411.4 33.6, 390.3 29.6 C 369.2 25.6, 338.4 28.0, 318.1 34.4 C 297.7 40.8, 288.0 61.7, 268.4 68.1 C 248.8 74.5, 224.0 69.7, 200.6 72.9 C 177.3 76.1, 149.5 82.5, 128.4 87.3 C 107.3 92.1, 85.0 97.4, 74.2 101.7 C 63.4 106.1, 68.6 109.0, 63.4 113.3 Z";

const EASE = [0.22, 1, 0.36, 1];
const ROUTE_SAMPLES = 720;

function toUnits(point) {
  return { x: (point.x / 100) * MAP_W, y: (point.y / 100) * MAP_H };
}

/* A Catmull-Rom curve through the hospitals in north-to-south order, so the
   route reads as one road through the network rather than a star. */
function buildRoute(points) {
  if (points.length < 2) return "";
  const get = (index) => points[Math.max(0, Math.min(points.length - 1, index))];
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = get(index - 1);
    const p1 = get(index);
    const p2 = get(index + 1);
    const p3 = get(index + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    path += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return path;
}

export default function HospitalMap({ items, activeSlug, played, onPreview, onChoose, ghost }) {
  const shouldReduceMotion = useReducedMotion();
  const routeRef = useRef(null);
  const travellerRef = useRef(null);
  const stopsRef = useRef(new Map());
  const progress = useMotionValue(0);

  const pins = useMemo(
    () => items.filter((item) => item.map).map((item) => ({ ...item, unit: toUnits(item.map) })),
    [items],
  );
  const ordered = useMemo(() => [...pins].sort((a, b) => a.unit.y - b.unit.y), [pins]);
  const route = useMemo(() => buildRoute(ordered.map((pin) => pin.unit)), [ordered]);
  const done = shouldReduceMotion || played;

  /* Where along the route each hospital sits, measured once from the drawn
     path rather than assumed from the point list - the curve does not pass
     through its control points at even spacing. */
  useEffect(() => {
    const path = routeRef.current;
    if (!path || typeof path.getTotalLength !== "function") return;
    const total = path.getTotalLength();
    const samples = Array.from({ length: ROUTE_SAMPLES + 1 }, (_, step) => {
      const point = path.getPointAtLength((total * step) / ROUTE_SAMPLES);
      return { x: point.x, y: point.y, t: step / ROUTE_SAMPLES };
    });
    const stops = new Map();
    pins.forEach((pin) => {
      let best = samples[0];
      let bestDistance = Infinity;
      samples.forEach((sample) => {
        const distance = (sample.x - pin.unit.x) ** 2 + (sample.y - pin.unit.y) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = sample;
        }
      });
      stops.set(pin.slug, best.t);
    });
    stopsRef.current = stops;
  }, [pins, route]);

  /* The traveller's position is written straight to the DOM on every frame of
     the spring: it is a measurement along a path, not something the render
     depends on. */
  useEffect(() => {
    const path = routeRef.current;
    const traveller = travellerRef.current;
    if (!path || !traveller) return undefined;
    const total = path.getTotalLength();
    const place = (value) => {
      const point = path.getPointAtLength(total * value);
      traveller.setAttribute("cx", point.x.toFixed(2));
      traveller.setAttribute("cy", point.y.toFixed(2));
    };
    place(progress.get());
    return progress.on("change", place);
  }, [done, progress, route]);

  useEffect(() => {
    if (!done) return undefined;
    const target = stopsRef.current.get(activeSlug);
    if (target === undefined) return undefined;
    if (shouldReduceMotion) {
      progress.set(target);
      return undefined;
    }
    const controls = animate(progress, target, {
      type: "spring",
      stiffness: 46,
      damping: 15,
      mass: 0.9,
    });
    return () => controls.stop();
  }, [activeSlug, done, progress, shouldReduceMotion]);

  const draw = (delay, duration) => ({
    initial: shouldReduceMotion ? false : { pathLength: 0, opacity: 0 },
    animate: done ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 },
    transition: shouldReduceMotion ? { duration: 0 } : { duration, ease: EASE, delay },
  });
  const pop = (delay) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, scale: 0.4 },
    animate: done ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 300, damping: 18, delay },
  });
  const rise = (delay) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 6 },
    animate: done ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
    transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: EASE, delay },
  });
  const landAt = (slug) => 1.15 + ordered.findIndex((pin) => pin.slug === slug) * 0.13;

  return (
    <div className="hs-map__scene" aria-hidden="true">
      <svg
        className="hs-map__svg"
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id="hs-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.055)" />
          </pattern>
          <radialGradient id="hs-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff4d8f" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff4d8f" stopOpacity="0" />
          </radialGradient>
          <mask id="hs-route-reveal" maskUnits="userSpaceOnUse">
            <motion.path
              d={route}
              fill="none"
              stroke="#fff"
              strokeWidth="14"
              strokeLinecap="round"
              {...draw(0.7, 1.5)}
            />
          </mask>
        </defs>

        <rect width={MAP_W} height={MAP_H} fill="url(#hs-grid)" />

        {/* The state: a soft fill that lands first, and an outline that draws
            itself around it. */}
        <motion.path
          d={OUTLINE}
          fill="rgba(255,255,255,0.06)"
          stroke="none"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={done ? { opacity: 1 } : { opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.2, ease: EASE }}
        />
        <motion.path
          d={OUTLINE}
          fill="none"
          stroke="rgba(255,255,255,0.34)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          {...draw(0, 1.7)}
        />

        {/* The route through the hospitals: a dashed line revealed through a
            mask that draws along it, because a pathLength animation replaces
            the dash pattern with its own and the line comes out solid. */}
        <path
          ref={routeRef}
          d={route}
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.6"
          strokeDasharray="5 7"
          strokeLinecap="round"
          mask="url(#hs-route-reveal)"
        />

        {/* The dots, north to south. The lit one carries a glow and, when
            motion is allowed, ripples from its foot. */}
        {ordered.map((pin) => {
          const isActive = pin.slug === activeSlug;
          const { x, y } = pin.unit;
          return (
            <motion.g
              key={pin.slug}
              className="hs-map__pin"
              data-active={isActive ? "true" : undefined}
              style={{ transformOrigin: `${x}px ${y}px` }}
              {...pop(landAt(pin.slug))}
            >
              <circle
                className="hs-map__glow"
                cx={x}
                cy={y}
                r="30"
                fill="url(#hs-glow)"
                style={{ transformOrigin: `${x}px ${y}px` }}
              />
              {isActive && done && !shouldReduceMotion
                ? [0, 1.1].map((delay) => (
                    <motion.circle
                      key={delay}
                      cx={x}
                      cy={y}
                      fill="none"
                      stroke="#fff"
                      strokeWidth="1.4"
                      initial={{ r: 6, opacity: 0 }}
                      animate={{ r: [6, 30], opacity: [0.75, 0] }}
                      transition={{ duration: 2.2, ease: "easeOut", repeat: Infinity, delay }}
                    />
                  ))
                : null}
              {pin.isHeadquarters ? (
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="none"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth="1.2"
                  strokeDasharray="2.5 3"
                />
              ) : null}
              <circle className="hs-map__dot" cx={x} cy={y} r="6" />
              {/* A hit area far larger than the dot, for a fine pointer. */}
              <circle
                className="hs-map__hit"
                cx={x}
                cy={y}
                r="17"
                fill="transparent"
                onMouseEnter={() => onPreview?.(pin.slug)}
                onMouseLeave={() => onPreview?.(null)}
                onClick={() => onChoose?.(pin.slug)}
              />
            </motion.g>
          );
        })}

        {/* The traveller, riding the route to whichever hospital is lit. */}
        {done && !shouldReduceMotion ? (
          <motion.circle
            ref={travellerRef}
            className="hs-map__traveller"
            r="4.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 2.1 }}
          />
        ) : null}
      </svg>

      {/* Labels in HTML over the drawing, at real type sizes. The lit
          hospital's label becomes a white pill in place: the map's own
          readout, and one that covers nothing. A card floated over the dot
          was tried and dropped - the three Ahmedabad hospitals sit close
          enough that a card for one hid the names of the other two, and the
          row beside the map already carries the street. */}
      {ordered.map((pin) => (
        <motion.span
          key={pin.slug}
          className="hs-map__label"
          data-side={pin.map.side}
          data-active={pin.slug === activeSlug ? "true" : undefined}
          style={{ left: `${pin.map.x}%`, top: `${pin.map.y}%` }}
          {...rise(landAt(pin.slug) + 0.1)}
        >
          {pin.name}
        </motion.span>
      ))}

      <span className="hs-map__ghost">{ghost}</span>
    </div>
  );
}
