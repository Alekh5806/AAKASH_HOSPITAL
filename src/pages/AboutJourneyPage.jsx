import { useRef } from "react";
import { motion, useInView, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BreadcrumbJsonLd } from "../components/JsonLd";
import SEO from "../components/SEO";
import { about } from "../lib/aboutData";
import { branches, site } from "../lib/coreData";
import { doctors } from "../lib/doctorsData";
import AboutSwitch from "../sections/AboutSwitch";

const { journey } = about;

function Milestone({ milestone, index }) {
  const shouldReduceMotion = useReducedMotion();
  const itemRef = useRef(null);
  const inView = useInView(itemRef, { once: true, amount: 0.4 });
  const active = shouldReduceMotion || inView;

  return (
    <li className="ab-time__item" ref={itemRef} data-side={index % 2 === 0 ? "start" : "end"}>
      <span className="ab-time__marker" aria-hidden="true">
        <motion.span
          className="ab-time__dot"
          initial={shouldReduceMotion ? false : { scale: 0.3, opacity: 0 }}
          animate={active ? { scale: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        />
      </span>
      <motion.div
        className="ab-time__card"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
        animate={active ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      >
        <p className="ab-time__meta">
          <span className="ab-time__year">{milestone.year}</span>
          <span className="ab-time__tag">{milestone.tag}</span>
        </p>
        <h3 className="e-h3">{milestone.title}</h3>
        <p className="e-body">{milestone.description}</p>
        <p className="ab-time__metric">{milestone.metric}</p>
      </motion.div>
    </li>
  );
}

export default function AboutJourneyPage() {
  const shouldReduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const nowRef = useRef(null);
  const nowInView = useInView(nowRef, { once: true, amount: 0.3 });

  // The spine fills as the reader moves through the milestones, so the page
  // shows how far along the story they are without a separate progress bar.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 72%", "end 62%"],
  });
  const spineScale = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const figureValues = {
    years: new Date().getFullYear() - journey.establishedYear,
    hospitals: branches.items.length,
    specialists: doctors.items.length,
  };

  return (
    <>
      <SEO meta={site.pageSeo.aboutJourney} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about/journey" },
          { name: "Our journey", href: "/about/journey" },
        ]}
      />

      <section className="e-sec e-sec--tight ab-top">
        <div className="e-shell">
          <span className="e-label">{journey.eyebrow}</span>
          <h1 className="e-h1 ab-top__title">
            {journey.title} <em>{journey.titleAccent}</em>
          </h1>
          <div className="ab-top__row">
            <p className="e-lede ab-top__lede">{journey.lede}</p>
            <p className="ab-top__est">
              <span>Established</span>
              <strong>{journey.establishedLabel}</strong>
            </p>
          </div>
          <AboutSwitch />
        </div>
      </section>

      <section className="e-sec ab-time">
        <div className="e-shell">
          <div className="e-head">
            <span className="e-label">{journey.milestonesLabel}</span>
            <div className="e-head__body">
              <h2 className="e-h2">{journey.milestonesTitle}</h2>
              <p className="e-lede">{journey.milestonesLede}</p>
            </div>
          </div>

          <div className="ab-time__track" ref={trackRef}>
            <span className="ab-time__spine" aria-hidden="true">
              <motion.span
                className="ab-time__spine-fill"
                style={shouldReduceMotion ? { scaleY: 1 } : { scaleY: spineScale }}
              />
            </span>
            <ol className="ab-time__list">
              {journey.milestones.map((milestone, index) => (
                <Milestone key={milestone.year} milestone={milestone} index={index} />
              ))}

              <li
                className="ab-time__item ab-time__item--now"
                ref={nowRef}
                data-side={journey.milestones.length % 2 === 0 ? "start" : "end"}
              >
                <span className="ab-time__marker" aria-hidden="true">
                  <motion.span
                    className="ab-time__dot ab-time__dot--now"
                    initial={shouldReduceMotion ? false : { scale: 0.3, opacity: 0 }}
                    animate={shouldReduceMotion || nowInView ? { scale: 1, opacity: 1 } : undefined}
                    transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                  />
                </span>
                <motion.div
                  className="ab-time__card ab-time__card--now"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
                  animate={shouldReduceMotion || nowInView ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                >
                  <p className="ab-time__meta">
                    <span className="ab-time__year">{journey.now.label}</span>
                    <span className="ab-time__tag">{journey.now.tag}</span>
                  </p>
                  <h3 className="e-h3">{journey.now.title}</h3>
                  <p className="e-body">{journey.now.description}</p>
                  <div className="ab-time__figures">
                    {journey.now.figures.map((figure) => (
                      <div key={figure.key}>
                        <strong>{figureValues[figure.key]}</strong>
                        <span>{figure.label}</span>
                      </div>
                    ))}
                  </div>
                  <Link className="e-link ab-time__next" to="/about/vision">
                    {journey.now.ctaLabel}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </motion.div>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
