import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SmartImage from "../components/SmartImage";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function Gallery({ categories, items }) {
  const [active, setActive] = useState("all");
  const shouldReduceMotion = useReducedMotion();
  const visibleItems = useMemo(
    () => (active === "all" ? items : items.filter((item) => item.category === active)),
    [active, items],
  );

  return (
    <section className="section gallery-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Gallery</span>
          <h2>Facilities and social activity</h2>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Gallery categories">
          {categories.map((category) => (
            <button
              type="button"
              key={category.id}
              role="tab"
              aria-selected={active === category.id}
              onClick={() => setActive(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
        <motion.div
          className="gallery-grid"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {visibleItems.map((item) => (
            <motion.figure
              key={item.id}
              className="gallery-card card-hover"
              variants={revealVariants(shouldReduceMotion)}
              whileHover={shouldReduceMotion ? undefined : { y: -8 }}
            >
              <SmartImage src={item.image} alt={item.alt} className="gallery-card__image" />
              <figcaption>
                <strong>{item.title}</strong>
                <span>{item.caption}</span>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
