import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "../components/Reveal";
import { branches } from "../lib/coreData";
import { buildBranchHref } from "../lib/contact";
import { branchPage } from "../lib/branchData";
import { fillTemplate } from "../lib/servicesData";

const { others } = branchPage;

/* The way on from a hospital that was not the nearest one.
 *
 * One card at every width, reflowing three across on a laptop, two on a tablet
 * and one on a phone - nothing here is a different component on a different
 * device. Each card is the whole link: a hospital with its own page opens that
 * page, the rest open the index with that hospital selected.
 *
 * **The five identical map pins are gone.** They repeated one glyph five times
 * and told the reader nothing about which hospital was which - the same mistake
 * the hospitals menu made with six `MapPin` tiles and the drawer made with a
 * chevron on every row, both removed for this reason. What differs between
 * these five is the city and the street it is on, so those carry the card: the
 * city in the serif the rest of this page uses for the things it names, the
 * locality under it, and `Head office` where it is true. */
export default function BranchOthers({ branches: items }) {
  const shouldReduceMotion = useReducedMotion();
  if (!items?.length) return null;

  return (
    <section className="e-sec e-sec--tight e-sec--paper br-others" aria-labelledby="br-others-title">
      <div className="e-shell">
        <Reveal className="e-head br-others__head">
          <span className="e-label">{others.label}</span>
          <div className="e-head__body e-head__row">
            <h2 className="e-h2" id="br-others-title">
              {others.title}
            </h2>
            <Link className="e-link" to="/branches">
              {others.ctaLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <p className="e-lede br-others__lede">
              {fillTemplate(others.lede, { count: branches.items.length })}
            </p>
          </div>
        </Reveal>

        <ul className="br-others__list">
          {items.map((branch, position) => (
            <motion.li
              key={branch.slug}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
                delay: shouldReduceMotion ? 0 : position * 0.07,
              }}
            >
              <Link className="br-others__row" to={buildBranchHref(branch)}>
                <span className="br-others__copy">
                  <span className="br-others__name">
                    {branch.name}
                    {branch.isHeadquarters ? <em>{others.tag}</em> : null}
                  </span>
                  <span className="br-others__where">{branch.locality}</span>
                </span>
                <span className="br-others__arrow" aria-hidden="true">
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
