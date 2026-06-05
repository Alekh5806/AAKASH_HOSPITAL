import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarCheck2, CheckCircle2, Eye, MapPin, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { BreadcrumbJsonLd } from "../components/JsonLd";
import PageHeader from "../components/PageHeader";
import SEO from "../components/SEO";
import { site } from "../lib/coreData";
import { home } from "../lib/homeData";
import { revealVariants, staggerContainer } from "../lib/motion";
import CTASection from "../sections/CTASection";

const storyPoints = [
  "Started in Visnagar on 8 August 1993 with a focused ophthalmic care setup.",
  "Expanded from cataract care into LASIK, retina diagnostics and branch access.",
  "Built around continuity: patients can return with old case files and receive guided follow-up.",
];

const trustStats = [
  { label: "Years of care", value: "32+", icon: CalendarCheck2 },
  { label: "Branches", value: "3", icon: MapPin },
  { label: "Cataract procedures", value: "1,00,000+", icon: Eye },
];

export default function AboutPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <SEO meta={site.pageSeo.about} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]}
      />
      <PageHeader
        eyebrow="About us"
        title="Built on technology, trust and continuity of care"
        description="Aakash Eye Hospital started in Visnagar in 1993 and has grown into a multi-branch ophthalmic care network across Gujarat."
        image="/assets/media/page-headers/clinic-reception.jpg"
        variant="about"
      />
      <section className="section about-story-section">
        <div className="container about-story">
          <motion.div
            className="about-story__copy"
            variants={revealVariants(shouldReduceMotion, 18)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.24 }}
          >
            <span className="eyebrow">Hospital story</span>
            <h2>From one Visnagar centre to a trusted eye-care network</h2>
            <p>
              Aakash Eye Hospital combines long-standing clinical experience with technology-led
              diagnostics, surgical care and a patient relationship that continues beyond one visit.
            </p>
            <ul>
              {storyPoints.map((point) => (
                <li key={point}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <Link className="about-story__action" to="/appointment">
              Plan your visit
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </motion.div>
          <motion.div
            className="about-story__panel"
            aria-label="Aakash Eye Hospital trust summary"
            variants={revealVariants(shouldReduceMotion, 22)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.28 }}
            whileHover={shouldReduceMotion ? undefined : { y: -4 }}
          >
            <strong>Established</strong>
            <span>8 August 1993</span>
            <p>Technology-led care, multi-branch access and lifelong patient records.</p>
            <div className="about-story__stats">
              {trustStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div key={stat.label}>
                    <Icon size={19} aria-hidden="true" />
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="section about-journey-section">
        <div className="container">
          <motion.div
            className="about-section-head"
            variants={revealVariants(shouldReduceMotion)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.26 }}
          >
            <span className="eyebrow">{home.timeline.eyebrow}</span>
            <h2>How the hospital kept moving forward</h2>
            <p>Key moments that shaped the hospital&apos;s clinical capability and branch reach.</p>
          </motion.div>
          <motion.div
            className="about-journey"
            variants={staggerContainer(shouldReduceMotion)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.16 }}
          >
            {home.timeline.items.map((item, index) => (
              <motion.article
                key={`${item.year}-${item.title}`}
                variants={revealVariants(shouldReduceMotion, 16)}
                whileHover={shouldReduceMotion ? undefined : { x: 4 }}
              >
                <span>{item.year}</span>
                <div>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section about-principles-section">
        <div className="container about-principles">
          <motion.div
            className="about-section-head"
            variants={revealVariants(shouldReduceMotion)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.28 }}
          >
            <span className="eyebrow">{home.missionVision.eyebrow}</span>
            <h2>Care principles patients can feel</h2>
            <p>
              These are the operating promises behind consultation, surgery planning and follow-up.
            </p>
          </motion.div>
          <motion.div
            className="about-principles__grid"
            variants={staggerContainer(shouldReduceMotion)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
          >
            {home.missionVision.items.map((item) => (
              <motion.article
                key={item.title}
                variants={revealVariants(shouldReduceMotion, 18)}
                whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              >
                <ShieldCheck size={22} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>
      <CTASection cta={home.cta} />
    </>
  );
}
