import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export default function CountUp({ value, suffix = "", start = false, duration = 1.7 }) {
  const shouldReduceMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!start || shouldReduceMotion) return undefined;

    let frame = 0;
    const startedAt = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startedAt) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [start, value, duration, shouldReduceMotion]);

  /* The count restarts from zero every time its card comes back into view,
     so the digits on screen are only ever a picture of the figure; the figure
     itself is always whole in the hidden span. */
  return (
    <span className="e-count">
      <span className="sr-only">
        {value.toLocaleString("en-IN")}
        {suffix}
      </span>
      <span className="e-count__value" aria-hidden="true">
        {(shouldReduceMotion ? value : current).toLocaleString("en-IN")}
      </span>
      {suffix ? (
        <span className="e-count__suffix" aria-hidden="true">
          {suffix}
        </span>
      ) : null}
    </span>
  );
}
