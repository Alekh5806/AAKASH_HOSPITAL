import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MessageCircle, Navigation, Phone } from "lucide-react";
import { buildMapLink, buildWhatsApp, cleanTel, getPrimaryPhone } from "../lib/contact";
import { branchPage } from "../lib/branchData";
import { fillTemplate } from "../lib/servicesData";

/* The hospital's actions, within reach at every point of the page on a phone:
 * call, message, directions, book. Same mechanics as the service page's bar -
 * sticky at the bottom of <main> so it releases at the footer, and it rises
 * only once the hero's own actions have left the screen, so a reader never
 * sees the same button twice. Phones and small tablets only. */
export default function BranchActionBar({ branch, anchorRef }) {
  const shouldReduceMotion = useReducedMotion();
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const anchor = anchorRef?.current;
    if (!anchor || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setShown(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorRef]);

  const phone = getPrimaryPhone(branch);
  const message = fillTemplate(branchPage.whatsappMessage, { branch: branch.name });

  return (
    <motion.div
      className="br-bar"
      role="group"
      aria-label={branchPage.barLabel}
      data-shown={shown ? "true" : undefined}
      initial={false}
      animate={{ y: shown ? 0 : "115%" }}
      transition={
        shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }
      }
    >
      <div className="br-bar__inner">
        {phone ? (
          <a className="br-bar__quiet" href={`tel:${cleanTel(phone)}`}>
            <Phone size={17} aria-hidden="true" />
            <span>{branchPage.callLabel}</span>
          </a>
        ) : null}

        {branch.whatsappNumber ? (
          <a
            className="br-bar__quiet"
            href={buildWhatsApp(branch, message)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={17} aria-hidden="true" />
            <span>{branchPage.whatsappLabel}</span>
          </a>
        ) : null}

        <a className="br-bar__quiet" href={buildMapLink(branch)} target="_blank" rel="noreferrer">
          <Navigation size={17} aria-hidden="true" />
          <span>{branchPage.directionsLabel}</span>
        </a>

        <Link className="br-bar__book" to={`/appointment?branch=${branch.slug}`}>
          <CalendarDays size={17} aria-hidden="true" />
          {/* Two labels, CSS picks one: the full one has no room beside three
              glyph buttons on the narrowest phones. */}
          <span className="br-bar__full">
            {fillTemplate(branchPage.bookLabel, { branch: branch.name })}
          </span>
          <span className="br-bar__short">{branchPage.bookShortLabel}</span>
        </Link>
      </div>
    </motion.div>
  );
}
