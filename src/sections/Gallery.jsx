import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import SmartImage from "../components/SmartImage";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function Gallery({ categories, items }) {
  const [active, setActive] = useState("all");
  const shouldReduceMotion = useReducedMotion();
  const categoryLabels = useMemo(
    () => new Map(categories.map((category) => [category.id, category.label])),
    [categories],
  );
  const categoryCounts = useMemo(
    () =>
      categories.reduce((counts, category) => {
        counts[category.id] =
          category.id === "all"
            ? items.length
            : items.filter((item) => item.category === category.id).length;
        return counts;
      }, {}),
    [categories, items],
  );
  const visibleItems = useMemo(
    () => (active === "all" ? items : items.filter((item) => item.category === active)),
    [active, items],
  );
  const activeLabel = categoryLabels.get(active) || "Gallery";

  return (
    <section className="section gallery-section">
      <div className="container">
        <div className="gallery-section__head">
          <div className="section-heading gallery-section__heading">
            <span className="eyebrow">Gallery</span>
            <h2>Facilities and social activity</h2>
            <p>
              A closer look at the spaces, technology, and outreach moments that shape the
              hospital experience.
            </p>
          </div>
          <div className="gallery-summary" aria-label={`${visibleItems.length} ${activeLabel} photos`}>
            <strong>{visibleItems.length}</strong>
            <span>{activeLabel} photos</span>
          </div>
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
              <span className="segmented-control__label">{category.label}</span>
              <span className="segmented-control__count">{categoryCounts[category.id]}</span>
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
          {visibleItems.map((item, index) => (
            <motion.figure
              key={item.id}
              className={`gallery-card card-hover${index < 2 ? " gallery-card--feature" : ""}`}
              variants={revealVariants(shouldReduceMotion)}
              whileHover={shouldReduceMotion ? undefined : { y: -8 }}
            >
              <SmartImage
                src={item.image}
                alt={item.alt}
                className="gallery-card__image"
                sizes="(min-width: 1040px) 38vw, (min-width: 720px) 50vw, 100vw"
              />
              <figcaption>
                <span className="gallery-card__tag">{categoryLabels.get(item.category)}</span>
                <strong>{item.title}</strong>
                <span className="gallery-card__caption">{item.caption}</span>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
