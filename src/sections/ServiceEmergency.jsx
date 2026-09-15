import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "../components/Reveal";
import { site } from "../lib/coreData";
import { cleanTel } from "../lib/contact";
import { servicePage } from "../lib/servicesData";

const { emergency } = servicePage;
const EASE = [0.22, 1, 0.36, 1];

/* The closing band, and the only section on the site that is neither paper nor
   navy: an urgent notice that looks like every other band is a notice nobody
   reads.
 *
 * It is ordered act -> recognise -> meanwhile, and that order is the whole
 * design. The build before it opened with a five-line paragraph about chemical
 * exposure, put two competing buttons under it, and left the actual phone
 * number as small body text at the very bottom - so a reader with a detaching
 * retina met first aid for a different emergency before they could find the
 * number. The number is now the loudest object in the section and the first
 * thing under the heading. */
export default function ServiceEmergency({ showMore = true }) {
  const shouldReduceMotion = useReducedMotion();
  const phone = site.header.emergency.phone;

  return (
    <section className="e-sec sv-urgent" id="emergency">
      <div className="e-shell">
        <div className="sv-urgent__top">
          <Reveal className="sv-urgent__head">
            <span className="sv-urgent__label">
              <span className="sv-urgent__beacon" aria-hidden="true">
                <AlertTriangle size={15} />
              </span>
              {emergency.label}
            </span>
            <h2 className="e-h2 sv-urgent__title">{emergency.title}</h2>
            <p className="sv-urgent__lede">{emergency.lede}</p>
          </Reveal>

          {/* The number itself is the control, not a button that describes one.
              A white block on the rust field is the hardest-contrast object the
              palette allows, which is what an emergency action should be. It
              sits beside the heading rather than under it, where the right half
              of the row was otherwise empty. */}
          <Reveal className="sv-urgent__call" delay={0.06}>
            {phone ? (
              <a className="sv-call" href={`tel:${cleanTel(phone)}`}>
                <span className="sv-call__label">{site.header.emergency.label}</span>
                <span className="sv-call__number">{phone}</span>
                <span className="sv-call__action">
                  <Phone size={18} aria-hidden="true" />
                  {emergency.ctaLabel}
                </span>
              </a>
            ) : null}
            <p className="sv-urgent__hint">{emergency.callHint}</p>
          </Reveal>
        </div>

        <Reveal className="sv-urgent__signs" delay={0.1}>
          <span className="sv-urgent__signs-label">{emergency.signsLabel}</span>
          <ul className="sv-urgent__list">
            {emergency.signs.map((sign, position) => (
              <motion.li
                key={sign}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.34,
                  ease: EASE,
                  delay: shouldReduceMotion ? 0 : position * 0.045,
                }}
              >
                {sign}
              </motion.li>
            ))}
          </ul>
        </Reveal>

        {/* First aid a reader may need before they reach a phone, but for one
            scenario out of nine - so it sits after the signs rather than ahead
            of them, where it used to outweigh the emergency it is part of. */}
        <Reveal className="sv-urgent__aid" delay={0.12}>
          <span className="sv-urgent__aid-label">{emergency.immediateLabel}</span>
          <p className="sv-urgent__aid-text">{emergency.immediateText}</p>
        </Reveal>

        {/* The band also stands in for the symptom chart on the emergency
            service page itself, where this link would point at the page the
            reader is already on. */}
        {showMore ? (
          <Reveal className="sv-urgent__more" delay={0.16}>
            <Link className="sv-urgent__link" to={`/services/${emergency.serviceSlug}`}>
              {emergency.secondaryLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
