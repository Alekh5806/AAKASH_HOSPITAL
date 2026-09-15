import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, MessageCircle, Phone } from "lucide-react";
import { site } from "../lib/coreData";
import { buildWhatsApp, cleanTel, getPrimaryPhone } from "../lib/contact";
import { fillTemplate, serviceDetail } from "../lib/servicesData";

/* The actions, within reach at every point of the page, on the device most
 * patients read this on.
 *
 * Most people open a hospital website on a phone, often in a waiting room or on
 * the way in, and the thing they want is to book or to call - not to scroll
 * back to the top to find the button. So the bar follows them down.
 *
 * It is `position: sticky; bottom: 0` inside <main>, not `position: fixed`.
 * Sticky means it releases at the end of the page instead of sitting on top of
 * the footer, so it needs no spacer, fights nothing for z-index, and hands the
 * screen back exactly where the footer's own appointment CTA takes over. A
 * fixed bar would also cover the drawer's thumb-zone actions and the cookie
 * sheet.
 *
 * It rises the moment the hero's own actions leave the screen and drops back
 * when they return, so a reader never sees the same button twice. That is why
 * it watches an element rather than a scroll offset: the hero is a different
 * height on every service and at every width, and a number picked once would be
 * wrong on most of them.
 *
 * Phones and small tablets only: on a desktop the actions in the hero are never
 * far, and a bar across the bottom of a wide screen is clutter. */
export default function ServiceActionBar({ service, branch, urgent = false, anchorRef }) {
  const shouldReduceMotion = useReducedMotion();
  /* Without an observer there is nothing to hide the bar for, so it simply
     stays. Deciding that at initialisation keeps the setter out of the effect
     body, which react-hooks/set-state-in-effect rejects. */
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

  const phone = urgent ? site.header.emergency.phone : getPrimaryPhone(branch);
  const message = fillTemplate(serviceDetail.whatsappMessage, { service: service.title });
  const bookHref = `/appointment?service=${service.id}${branch ? `&branch=${branch.slug}` : ""}`;

  return (
    <motion.div
      className="sd-bar"
      role="group"
      aria-label={serviceDetail.barLabel}
      data-shown={shown ? "true" : undefined}
      initial={false}
      animate={{ y: shown ? 0 : "115%" }}
      transition={
        shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }
      }
    >
      <div className="sd-bar__inner">
        {phone ? (
          <a
            className="sd-bar__quiet"
            href={`tel:${cleanTel(phone)}`}
            data-urgent={urgent ? "true" : undefined}
          >
            <Phone size={17} aria-hidden="true" />
            {urgent ? site.header.emergency.label : serviceDetail.callLabel}
          </a>
        ) : null}

        {branch?.whatsappNumber ? (
          <a
            className="sd-bar__quiet"
            href={buildWhatsApp(branch, message)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={17} aria-hidden="true" />
            {serviceDetail.whatsappLabel}
          </a>
        ) : null}

        <Link className="sd-bar__book" to={bookHref}>
          <CalendarDays size={17} aria-hidden="true" />
          {serviceDetail.bookLabel}
        </Link>
      </div>
    </motion.div>
  );
}
