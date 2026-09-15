import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MessageCircle, Navigation, Phone } from "lucide-react";
import { buildMapLink, buildWhatsApp, cleanTel, getPrimaryPhone } from "../lib/contact";
import { branchPage } from "../lib/branchData";
import { fillTemplate } from "../lib/servicesData";

/* The hero's actions for one hospital: book here, call here, message here,
 * get here. Unlike the service page there is no branch to choose - the page is
 * the branch - so the number itself sits under the call label, and the
 * appointment link carries this hospital's slug.
 *
 * The row takes a ref because the sticky action bar watches it: the bar rises
 * exactly when these actions leave the screen. React 19 passes `ref` as an
 * ordinary prop. */
export default function BranchActions({ branch, ref }) {
  const shouldReduceMotion = useReducedMotion();
  const phone = getPrimaryPhone(branch);
  const press = shouldReduceMotion ? undefined : { scale: 0.98 };

  return (
    <div className="br-act" ref={ref}>
      <motion.div className="br-act__wrap" whileTap={press}>
        <Link className="e-btn br-act__book" to={`/appointment?branch=${branch.slug}`}>
          <CalendarDays size={17} aria-hidden="true" />
          {fillTemplate(branchPage.bookLabel, { branch: branch.name })}
        </Link>
      </motion.div>

      {phone ? (
        <a className="br-act__quiet" href={`tel:${cleanTel(phone)}`}>
          <Phone size={16} aria-hidden="true" />
          <span>
            {branchPage.callLabel}
            <em>{phone}</em>
          </span>
        </a>
      ) : null}

      {branch.whatsappNumber ? (
        <a
          className="br-act__quiet"
          href={buildWhatsApp(
            branch,
            fillTemplate(branchPage.whatsappMessage, { branch: branch.name }),
          )}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={16} aria-hidden="true" />
          <span>
            {branchPage.whatsappLabel}
            <em>{branch.name}</em>
          </span>
        </a>
      ) : null}

      <a className="br-act__quiet" href={buildMapLink(branch)} target="_blank" rel="noreferrer">
        <Navigation size={16} aria-hidden="true" />
        <span>
          {branchPage.directionsLabel}
          <em>{branch.name}</em>
        </span>
      </a>
    </div>
  );
}
