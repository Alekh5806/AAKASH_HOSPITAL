import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck2, Eye, MapPinned, Sparkles } from "lucide-react";
import AnimatedCounter from "../components/AnimatedCounter";
import { revealVariants, staggerContainer } from "../lib/motion";

const statIcons = [CalendarCheck2, MapPinned, Eye, Sparkles];

export default function StatsBand({ stats }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="stats-band section">
      <div className="container">
        <motion.div
          className="stats-band__panel"
          variants={revealVariants(shouldReduceMotion, 18)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="stats-band__intro">
            <span className="eyebrow">Care impact</span>
            <h2>Trusted eye care, measured clearly</h2>
          </div>
          <motion.div
            className="stats-band__grid"
            variants={staggerContainer(shouldReduceMotion)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {stats.map((stat, index) => {
              const Icon = statIcons[index] ?? Sparkles;

              return (
                <motion.article className="stat-card" key={stat.label} variants={revealVariants(shouldReduceMotion)}>
                  <div className="stat-card__icon">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <strong>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </strong>
                  <h3>{stat.label}</h3>
                  <p>{stat.description}</p>
                </motion.article>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
