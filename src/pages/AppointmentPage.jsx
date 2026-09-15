import { motion, useReducedMotion } from "framer-motion";
import { BreadcrumbJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { appointmentPage } from "../lib/appointmentData";
import BookingFlow from "../sections/BookingFlow";

/* The appointment page: one head and one instrument.
 *
 * The flow asks five short questions and writes the request onto a slip as
 * it goes; Send opens WhatsApp with that request addressed to the chosen
 * hospital's line. There is no form posting anywhere and no closing band -
 * the footer carries the site's appointment CTA and this page is where it
 * leads. Whatever the reader arrived from can prefill it: `?branch=<slug>`
 * from a hospital page, `?service=<id>` from a treatment page, `?name=`. */
export default function AppointmentPage() {
  const shouldReduceMotion = useReducedMotion();
  const rise = (delay) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  });

  return (
    <>
      <SEO meta={appointmentPage.seo} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Appointment", href: "/appointment" },
        ]}
      />

      <section className="ap" aria-labelledby="ap-title">
        <div className="e-shell">
          <header className="ap-head">
            <motion.span className="e-label" {...rise(0)}>
              {appointmentPage.label}
            </motion.span>
            <motion.h1 className="ap-head__title" id="ap-title" {...rise(0.07)}>
              {appointmentPage.title}{" "}
              {/* The promise writes itself in, left to right, once the line
                  has risen - the one flourish the head has. */}
              <motion.em
                initial={shouldReduceMotion ? false : { clipPath: "inset(0 100% -0.2em 0)" }}
                animate={{ clipPath: "inset(0 0% -0.2em 0)" }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 }
                }
              >
                {appointmentPage.titleAccent}
              </motion.em>
            </motion.h1>
            <motion.p className="ap-head__lede" {...rise(0.14)}>
              {appointmentPage.lede}
            </motion.p>
          </header>

          <BookingFlow />
        </div>
      </section>
    </>
  );
}
