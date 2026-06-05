import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarCheck2, Eye, MapPinned, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import AnimatedCounter from "../components/AnimatedCounter";
import { revealVariants, staggerContainer } from "../lib/motion";

const statIcons = [CalendarCheck2, MapPinned, Eye, Sparkles];
const statLinks = {
  "Years of care": "/about",
  Branches: "/branches",
  "Cataract procedures": "/services/phaco-cataract-surgery",
  "Core specialties": "/services",
};

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
            <div>
              <span className="eyebrow">Care impact</span>
              <h2>Trusted eye care, measured clearly</h2>
              <p>Key indicators patients look for before choosing an eye hospital.</p>
            </div>
            <Link className="stats-band__intro-link" to="/about">
              Hospital profile
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
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
              const href = statLinks[stat.label] ?? "/about";

              return (
                <motion.article
                  className="stat-card"
                  key={stat.label}
                  variants={revealVariants(shouldReduceMotion)}
                >
                  <Link to={href} aria-label={`Open details for ${stat.label}`}>
                    <div className="stat-card__top">
                      <div className="stat-card__icon">
                        <Icon size={20} aria-hidden="true" />
                      </div>
                      <span className="stat-card__action">
                        View
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </span>
                    </div>
                    <strong>
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </strong>
                    <h3>{stat.label}</h3>
                    <p>{stat.description}</p>
                  </Link>
                </motion.article>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
