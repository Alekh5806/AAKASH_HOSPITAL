import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
}

export default function AnimatedCounter({ value, suffix = "", duration = 1200 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduceMotion ? value : 0);

  useEffect(() => {
    if (!inView) return undefined;
    if (shouldReduceMotion) {
      return undefined;
    }

    let frameId;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, inView, shouldReduceMotion, value]);

  return (
    <span ref={ref}>
      {formatNumber(shouldReduceMotion ? value : display)}
      {suffix}
    </span>
  );
}
