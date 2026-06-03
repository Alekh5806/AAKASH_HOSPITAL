import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import SmartImage from "../components/SmartImage";
import { getIcon } from "../lib/icons";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function ServiceGrid({ services, eyebrow, title, description, variant = "default" }) {
  const shouldReduceMotion = useReducedMotion();
  const isFeatured = variant === "featured";

  return (
    <section className={`section service-grid-section service-grid-section--${variant}`}>
      <div className="container">
        <div className="service-grid-section__head">
          <div className="section-heading">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          {isFeatured ? (
            <Link className="text-link service-grid-section__all" to="/services">
              All services <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <motion.div
          className={`service-grid service-grid--${variant}`}
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.16 }}
        >
          {services.map((service) => {
            const Icon = getIcon(service.icon);

            return (
              <motion.article
                key={service.id}
                className={`service-card card-hover ${isFeatured ? "service-card--pathway" : ""}`}
                variants={revealVariants(shouldReduceMotion)}
                whileHover={shouldReduceMotion ? undefined : { y: -8, scale: 1.01 }}
              >
                <Link to={`/services/${service.slug}`} aria-label={`Read about ${service.title}`}>
                  <SmartImage
                    src={service.image}
                    alt={service.imageAlt}
                    className="service-card__image"
                    loading="eager"
                  />
                  <div className="service-card__body">
                    <div className="service-card__icon">
                      <Icon size={24} aria-hidden="true" />
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.shortDescription}</p>
                    <span className="text-link">
                      View service <ArrowUpRight size={16} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
