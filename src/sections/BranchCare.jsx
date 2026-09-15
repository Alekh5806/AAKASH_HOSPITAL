import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "../components/Reveal";
import { branchPage } from "../lib/branchData";
import { getCategoryLabel } from "../lib/servicesData";

const { care } = branchPage;
const EASE = [0.22, 1, 0.36, 1];

/* What can be treated here.
 *
 * **Read in runs under a heading, and packed two across.** Three builds came
 * before this one. A cloud of eleven pills said nothing about how the
 * treatments relate; eleven uniform full-width pills were tidy but flat; and a
 * ruled ledger of eleven rows - a name at the left edge and an arrow circle
 * pinned to the right - spent most of every row on nothing, which is exactly
 * how it read on a phone.
 *
 * The runs stay, because the source order in `services.json` is already grouped
 * by kind of care and a heading reading `Specialty clinics` is the first thing
 * a hesitant reader uses to find their own line. What changed is the object
 * under them: a compact card that is only as wide as it needs to be, two to a
 * row at every width, so the block reads as a set of treatments rather than a
 * column of half-empty rows.
 *
 * **No arrow on the card and no count on the heading.** Eleven identical arrows
 * tell a reader nothing - the same reason the hospitals menu dropped its six
 * map pins and the drawer its chevrons - and the cards themselves are the
 * count. Both were pure width, and width was the problem.
 *
 * The index still owns the explaining; this band only answers "is my treatment
 * done at this hospital". */
export default function BranchCare({ services }) {
  const shouldReduceMotion = useReducedMotion();
  if (!services?.length) return null;

  const groups = [];
  services.forEach((service) => {
    const last = groups[groups.length - 1];
    if (last && last.id === service.category) {
      last.items.push(service);
      return;
    }
    groups.push({
      id: service.category,
      label: getCategoryLabel(service.category),
      items: [service],
    });
  });

  return (
    <section className="e-sec e-sec--tight e-sec--paper br-care" aria-labelledby="br-care-title">
      <div className="e-shell">
        <Reveal className="e-head br-care__head">
          <span className="e-label">{care.label}</span>
          <div className="e-head__body e-head__row">
            <h2 className="e-h2 br-care__title" id="br-care-title">
              {care.title}
            </h2>
            <Link className="e-link" to="/services">
              {care.ctaLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>

        <ul className="br-care__groups">
          {groups.map((group, groupIndex) => (
            <motion.li
              className="br-care__group"
              key={group.id}
              data-urgent={group.id === "urgent" ? "true" : undefined}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.5,
                ease: EASE,
                delay: shouldReduceMotion ? 0 : groupIndex * 0.08,
              }}
            >
              <p className="br-care__kind">{group.label}</p>

              <ul className="br-care__rows">
                {group.items.map((service) => (
                  <li key={service.slug}>
                    <Link className="br-care__row" to={`/services/${service.slug}`}>
                      <span className="br-care__name">{service.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
