import { motion, useReducedMotion } from "framer-motion";
import { getIcon } from "../lib/icons";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function PageIntroGrid({ eyebrow, title, description, items, className = "" }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className={`section page-intro-grid ${className}`.trim()}>
      <div className="container">
        <div className="page-intro-grid__head">
          <div className="section-heading">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        <motion.div
          className="page-intro-grid__cards"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.18 }}
        >
          {items.map((item) => {
            const Icon = item.icon ? getIcon(item.icon) : null;

            return (
              <motion.article
                key={item.title}
                className="page-intro-card card-hover"
                variants={revealVariants(shouldReduceMotion)}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              >
                <div className="page-intro-card__top">
                  {Icon ? (
                    <span className="page-intro-card__icon">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                  ) : null}
                  {item.kicker ? <small>{item.kicker}</small> : null}
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
