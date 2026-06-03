import { motion, useReducedMotion } from "framer-motion";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function Timeline({ timeline }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section section-band timeline-section">
      <div className="container">
        <div className="timeline-section__head">
          <div className="section-heading">
            <span className="eyebrow">{timeline.eyebrow}</span>
            <h2>{timeline.title}</h2>
          </div>
          <p>From a Visnagar beginning to advanced diagnostics and multi-branch access.</p>
        </div>
        <motion.ol
          className="timeline"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
        >
          {timeline.items.map((item, index) => (
            <motion.li key={`${item.year}-${item.title}`} variants={revealVariants(shouldReduceMotion)}>
              <span className="timeline__year">{item.year}</span>
              <div className="timeline__card">
                <span className="timeline__index">{String(index + 1).padStart(2, "0")}</span>
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
