import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MessageCircle, Phone } from "lucide-react";
import { site } from "../lib/coreData";
import { buildWhatsApp, cleanTel, getPrimaryPhone } from "../lib/contact";
import { fillTemplate, serviceDetail } from "../lib/servicesData";

/* The hero's actions, on the navy: book, call, ask.
 *
 * The phone number and the WhatsApp thread belong to the hospital the reader
 * chose in the header, and the branch name is printed under the label, because
 * a number should never be offered without saying whose it is.
 *
 * Emergency Eye Care inverts the order: the helpline is the filled action and
 * booking is the quiet one, because an appointment is the wrong answer to the
 * one service on the site that cannot wait for one.
 *
 * The row takes a ref because the sticky action bar watches it: the bar rises
 * exactly when these actions leave the screen, so a reader never sees the same
 * button twice. React 19 passes `ref` as an ordinary prop, so no forwardRef. */
export default function ServiceActions({ service, branch, urgent = false, ref }) {
  const shouldReduceMotion = useReducedMotion();
  const phone = getPrimaryPhone(branch);
  const message = fillTemplate(serviceDetail.whatsappMessage, { service: service.title });
  const bookHref = `/appointment?service=${service.id}${branch ? `&branch=${branch.slug}` : ""}`;
  const emergencyPhone = site.header.emergency.phone;

  const press = shouldReduceMotion ? undefined : { scale: 0.98 };

  return (
    <div className="sd-act" ref={ref}>
      {urgent && emergencyPhone ? (
        <motion.a
          className="e-btn sd-act__urgent"
          href={`tel:${cleanTel(emergencyPhone)}`}
          whileTap={press}
        >
          <Phone size={17} aria-hidden="true" />
          <span>{site.header.emergency.label}</span>
          <strong>{emergencyPhone}</strong>
        </motion.a>
      ) : null}

      <motion.div className="sd-act__wrap" whileTap={press}>
        <Link className={`e-btn ${urgent ? "e-btn--outline" : ""} sd-act__book`} to={bookHref}>
          <CalendarDays size={17} aria-hidden="true" />
          {serviceDetail.bookLabel}
        </Link>
      </motion.div>

      {!urgent && phone ? (
        <a className="sd-act__quiet" href={`tel:${cleanTel(phone)}`}>
          <Phone size={16} aria-hidden="true" />
          <span>
            {serviceDetail.callLabel}
            <em>{branch.name}</em>
          </span>
        </a>
      ) : null}

      {branch?.whatsappNumber ? (
        <a
          className="sd-act__quiet"
          href={buildWhatsApp(branch, message)}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={16} aria-hidden="true" />
          <span>
            {serviceDetail.whatsappLabel}
            <em>{branch.name}</em>
          </span>
        </a>
      ) : null}
    </div>
  );
}
