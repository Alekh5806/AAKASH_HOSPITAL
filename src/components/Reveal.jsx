import { motion, useReducedMotion } from "framer-motion";
import { revealVariants } from "../lib/motion";

export default function Reveal({ children, className = "", as = "div", delay = 0, distance = 24 }) {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as] ?? motion.div;
  const variants = revealVariants(shouldReduceMotion, distance);

  if (variants.visible.transition) {
    variants.visible.transition.delay = delay;
  }

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.22 }}
    >
      {children}
    </Component>
  );
}
