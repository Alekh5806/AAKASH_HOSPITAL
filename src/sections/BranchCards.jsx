import { motion, useReducedMotion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { revealVariants, staggerContainer } from "../lib/motion";

function cleanTel(number) {
  return number.startsWith("+") ? number.replace(/[^\d+]/g, "") : number.replace(/\D/g, "");
}

export default function BranchCards({ branches, showMaps = false }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="section branch-section">
      <div className="container">
        <div className="section-heading">
          <span className="eyebrow">Three branches</span>
          <h2>Care close to your city</h2>
          <p>Choose a branch for OPD, operation or LASIK appointments.</p>
        </div>
        <motion.div
          className={`branch-grid ${showMaps ? "branch-grid--maps" : ""}`}
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.16 }}
        >
          {branches.map((branch) => (
            <motion.article
              key={branch.slug}
              className="branch-card card-hover"
              variants={revealVariants(shouldReduceMotion)}
              whileHover={shouldReduceMotion ? undefined : { y: -7 }}
            >
              <div className="branch-card__head">
                <div>
                  <span>{branch.isHeadquarters ? "Headquarters" : "Branch"}</span>
                  <h3>{branch.name}</h3>
                </div>
                <MapPin size={25} aria-hidden="true" />
              </div>
              <p>{branch.address}</p>
              <a href={`mailto:${branch.email}`} className="branch-card__email">
                <Mail size={16} aria-hidden="true" />
                {branch.email}
              </a>
              <div className="branch-card__phones">
                {branch.phoneGroups.map((group) => (
                  <div key={group.label}>
                    <strong>{group.label}</strong>
                    {group.numbers.map((number) => (
                      <a href={`tel:${cleanTel(number)}`} key={number}>
                        <Phone size={15} aria-hidden="true" />
                        {number}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
              <small>{branch.hoursLabel}</small>
              {showMaps ? (
                <iframe
                  title={`${branch.name} map`}
                  src={branch.mapEmbed}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : null}
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
