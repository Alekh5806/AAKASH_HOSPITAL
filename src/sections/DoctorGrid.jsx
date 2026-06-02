import { motion, useReducedMotion } from "framer-motion";
import SmartImage from "../components/SmartImage";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function DoctorGrid({ doctors, eyebrow, title, description }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section doctor-section">
      <div className="container">
        <div className="section-heading">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
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
              <SmartImage src={doctor.photo} alt={doctor.photoAlt} className="doctor-card__photo" />
              <div className="doctor-card__body">
                <span>{doctor.specialty}</span>
                <h3>{doctor.name}</h3>
                <p className="doctor-card__qualification">{doctor.qualifications}</p>
                <p>{doctor.bio}</p>
                <div className="doctor-card__branches">
                  {doctor.branches.map((branch) => (
                    <span key={branch}>{branch}</span>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
