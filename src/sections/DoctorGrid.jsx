import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CalendarDays, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import SmartImage from "../components/SmartImage";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function DoctorGrid({ doctors, eyebrow, title, description }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section doctor-section">
      <div className="container">
        <div className="doctor-section__head">
          <div className="section-heading">
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <Link className="doctor-section__all" to="/doctors">
            View full team <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <motion.div
          className="doctor-grid"
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.16 }}
        >
          {doctors.map((doctor) => (
            <motion.article
              key={doctor.name}
                className="doctor-card card-hover"
                variants={revealVariants(shouldReduceMotion)}
                whileHover={shouldReduceMotion ? undefined : { y: -8 }}
              >
              <div className="doctor-card__media">
                <SmartImage
                  src={doctor.photo}
                  alt={doctor.photoAlt}
                  className="doctor-card__photo"
                  loading="eager"
                />
                <span>
                  <Stethoscope size={15} aria-hidden="true" />
                  {doctor.specialty}
                </span>
              </div>
              <div className="doctor-card__body">
                <h3>{doctor.name}</h3>
                <p className="doctor-card__qualification">{doctor.qualifications}</p>
                <p>{doctor.bio}</p>
                <div className="doctor-card__branches">
                  {doctor.branches.map((branch) => (
                    <span key={branch}>{branch}</span>
                  ))}
                </div>
                <Link className="doctor-card__cta" to="/appointment">
                  <CalendarDays size={16} aria-hidden="true" />
                  Book visit
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
