import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

export default function TestimonialCarousel({ testimonials }) {
  const [active, setActive] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const current = testimonials[active];
  const stars = useMemo(
    () => Array.from({ length: current.rating }, (_, index) => index),
    [current.rating],
  );

  function go(delta) {
    setActive((index) => (index + delta + testimonials.length) % testimonials.length);
  }

  function onDragEnd(_, info) {
    if (Math.abs(info.offset.x) < 40) return;
    go(info.offset.x < 0 ? 1 : -1);
  }

  function onKeyDown(event) {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  }

  return (
    <section className="section section-band testimonial-section">
      <div className="container testimonial-section__inner">
        <div className="testimonial-section__copy">
          <div className="section-heading">
            <span className="eyebrow">Patient feedback</span>
            <h2>What patients appreciate after their visit</h2>
            <p>Public review themes shaped into clear, readable patient-experience highlights.</p>
          </div>
          <div className="testimonial-metrics" aria-label="Testimonial summary">
            <span>Public review themes</span>
            <span>{testimonials.length} care signals</span>
          </div>
        </div>
        <div
          className="testimonial-carousel"
          role="region"
          aria-label="Patient testimonials carousel"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <motion.article
            key={current.name}
            className="testimonial-card"
            drag={shouldReduceMotion ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={onDragEnd}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -28 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
          >
            <div className="testimonial-card__quote-icon">
              <Quote size={24} aria-hidden="true" />
            </div>
            {current.theme ? (
              <span className="testimonial-card__theme">{current.theme}</span>
            ) : null}
            <div
              className="testimonial-card__stars"
              aria-label={`${current.rating} out of 5 stars`}
            >
              {stars.map((star) => (
                <Star key={star} size={18} fill="currentColor" aria-hidden="true" />
              ))}
            </div>
            <blockquote>{current.quote}</blockquote>
            <footer>
              <div>
                <strong>{current.name}</strong>
                <span>{current.location}</span>
              </div>
              {current.sourceLabel ? <em>{current.sourceLabel}</em> : null}
            </footer>
          </motion.article>
          <div className="carousel-controls">
            <button
              type="button"
              className="icon-button"
              aria-label="Previous testimonial"
              onClick={() => go(-1)}
            >
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <span>
              {active + 1} / {testimonials.length}
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Next testimonial"
              onClick={() => go(1)}
            >
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
