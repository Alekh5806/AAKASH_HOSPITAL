import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Eye, MapPinned, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { revealVariants, staggerContainer } from "../lib/motion";

const journeyItems = [
  {
    title: "Find the nearest branch",
    description: "Choose Visnagar, Ahmedabad or Bharuch and connect with the right OPD contact quickly.",
    icon: MapPinned,
    href: "/branches",
    cta: "Select Branch",
  },
  {
    title: "Understand your care pathway",
    description: "Explore cataract, LASIK, retina, glaucoma and general ophthalmology services in plain language.",
    icon: Eye,
    href: "/services",
    cta: "Explore Services",
  },
  {
    title: "Book without confusion",
    description: "Start a visit request online or call directly for appointment guidance and follow-up support.",
    icon: CalendarDays,
    href: "/appointment",
    cta: "Book Visit",
  },
];

export default function HomeAccess({ branches }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section home-access">
      <div className="container home-access__grid">
        <motion.div
          className="home-access__intro"
          variants={revealVariants(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <span className="eyebrow">Patient-first access</span>
          <h2>Clear routes into consultation, surgery and follow-up care</h2>
          <p>
            Aakash Eye Hospital helps patients move from concern to consultation with simple branch contacts, clear
            specialty information and direct appointment actions.
          </p>
          <div className="home-access__assurance">
            <div>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Technology-led care with a guided booking path</span>
            </div>
            <div>
              <Stethoscope size={18} aria-hidden="true" />
              <span>Support for OPD, surgery, retina, glaucoma and follow-up visits</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="home-access__cards"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {journeyItems.map((item) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.title}
                className="home-access__card card-hover"
                variants={revealVariants(shouldReduceMotion)}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              >
                <div className="home-access__card-top">
                  <span className="home-access__icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <Link to={item.href}>
                    {item.cta}
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            );
          })}
        </motion.div>

        <motion.div
          className="home-access__network"
          variants={revealVariants(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <span className="eyebrow">Branch network</span>
          <h3>Three Gujarat locations with one standard of care</h3>
          <div className="home-access__branch-list">
            {branches.map((branch) => (
              <article key={branch.slug}>
                <strong>{branch.name}</strong>
                <span>{branch.hoursLabel}</span>
              </article>
            ))}
          </div>
          <Link className="home-access__network-link" to="/branches">
            View branch details
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
