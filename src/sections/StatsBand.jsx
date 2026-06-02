import { motion, useReducedMotion } from "framer-motion";
import AnimatedCounter from "../components/AnimatedCounter";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function StatsBand({ stats }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="stats-band section">
      <div className="container">
        <motion.div
          className="stats-band__grid"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {stats.map((stat) => (
            <motion.article className="stat-card" key={stat.label} variants={revealVariants(shouldReduceMotion)}>
              <strong>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </strong>
              <h2>{stat.label}</h2>
              <p>{stat.description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
