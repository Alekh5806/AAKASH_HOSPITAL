import { motion, useReducedMotion } from "framer-motion";
import { getIcon } from "../lib/icons";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function MissionVision({ data }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section mission-section">
      <div className="container mission-section__inner">
        <div className="section-heading section-heading--sticky">
          <span className="eyebrow">{data.eyebrow}</span>
          <h2>{data.title}</h2>
        </div>
        <motion.div
          className="mission-grid"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {data.items.map((item) => {
            const Icon = getIcon(item.icon);

            return (
              <motion.article
                className="mission-card card-hover"
                key={item.title}
                variants={revealVariants(shouldReduceMotion)}
                whileHover={shouldReduceMotion ? undefined : { y: -7 }}
              >
                <Icon size={26} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
