import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
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
          <p className="mission-section__lead">
            Four care principles that guide every consultation, procedure and follow-up visit.
          </p>
          <Link className="mission-section__action" to="/appointment">
            Plan a visit
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <motion.div
          className="mission-grid"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {data.items.map((item, index) => {
            const Icon = getIcon(item.icon);

            return (
              <motion.article
                className="mission-card card-hover"
                key={item.title}
                variants={revealVariants(shouldReduceMotion)}
                whileHover={shouldReduceMotion ? undefined : { y: -7 }}
              >
                <div className="mission-card__top">
                  <span className="mission-card__index">{String(index + 1).padStart(2, "0")}</span>
                  <div className="mission-card__icon">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                </div>
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
