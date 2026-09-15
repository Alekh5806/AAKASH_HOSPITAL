import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "../components/Reveal";
import SmartImage from "../components/SmartImage";
import { fillTemplate, getCategoryLabel, serviceDetail, services } from "../lib/servicesData";

const { related } = serviceDetail;

/* The way on from a page that was not the right one. Same kind of care first,
 * then the list widens - the top-up is what keeps the rail honest for Emergency
 * Eye Care, the only service in its category.
 *
 * Rows, not cards: the index already reads as a ledger, and a row says the same
 * thing in a third of the height on the phone most patients use. The pictures
 * are the index's own 240px thumbnails, so this ships no new bytes. */
export default function ServiceRelated({ items, title }) {
  const shouldReduceMotion = useReducedMotion();
  if (!items?.length) return null;

  return (
    <section className="sd-sec sd-related" aria-labelledby="sd-related-title">
      <div className="e-shell">
        <Reveal className="sd-head">
          <div>
            <span className="sd-label">{related.label}</span>
            <h2 className="sd-h2" id="sd-related-title">
              {title ?? related.title}
            </h2>
          </div>
          <Link className="e-link" to="/services">
            {fillTemplate(related.ctaLabel, { count: services.items.length })}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </Reveal>

        <ul className="sd-related__list">
          {items.map((service, position) => (
            <motion.li
              key={service.slug}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
                delay: shouldReduceMotion ? 0 : position * 0.07,
              }}
            >
              <Link className="sd-related__row" to={`/services/${service.slug}`}>
                <span className="sd-related__media">
                  <SmartImage
                    className="sd-related__img"
                    src={service.thumb ?? service.image}
                    alt=""
                    sizes="84px"
                  />
                </span>
                <span className="sd-related__copy">
                  <span className="sd-related__cat">{getCategoryLabel(service.category)}</span>
                  <span className="sd-related__name">{service.title}</span>
                </span>
                <span className="sd-related__arrow" aria-hidden="true">
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
