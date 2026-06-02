import { motion, useReducedMotion } from "framer-motion";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function Timeline({ timeline }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section section-band timeline-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">{timeline.eyebrow}</span>
          <h2>{timeline.title}</h2>
        </div>
        <motion.ol
          className="timeline"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
        >
          {timeline.items.map((item) => (
            <motion.li key={`${item.year}-${item.title}`} variants={revealVariants(shouldReduceMotion)}>
              <span>{item.year}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
