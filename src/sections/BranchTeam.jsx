import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Reveal from "../components/Reveal";
import SmartImage from "../components/SmartImage";
import { branchPage } from "../lib/branchData";
import { fillTemplate } from "../lib/servicesData";

const { team: copy } = branchPage;
const EASE = [0.22, 1, 0.36, 1];

/* The consultants who see patients at this hospital, and nobody else.
 *
 * Not the full team: /doctors owns the team, and the link at the head of the
 * section is the way there. The optometrists are named in one line under the
 * cards with their portraits stacked beside it, so the reader knows the
 * hospital does its own refraction without the page growing three more cards
 * for it. */
export default function BranchTeam({ branch, team }) {
  const shouldReduceMotion = useReducedMotion();
  if (!team?.doctors.length) return null;

  const listNames = (people) => {
    const names = people.map((person) => person.name);
    if (names.length < 2) return names[0] ?? "";
    return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  };

  return (
    <section className="e-sec e-sec--tight br-team" aria-labelledby="br-team-title">
      <div className="e-shell">
        <Reveal className="e-head br-team__head">
          <span className="e-label">{copy.label}</span>
          <div className="e-head__body e-head__row">
            <h2 className="e-h2" id="br-team-title">
              {copy.title} <em>{branch.name}</em>
            </h2>
            <Link className="e-link" to="/doctors">
              {copy.ctaLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <p className="e-lede br-team__lede">{copy.lede}</p>
          </div>
        </Reveal>

        <ul className="br-team__grid" data-count={Math.min(team.doctors.length, 3)}>
          {team.doctors.map((doctor, position) => (
            <motion.li
              className="br-doc"
              key={doctor.name}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.55,
                ease: EASE,
                delay: shouldReduceMotion ? 0 : position * 0.09,
              }}
            >
              <div className="br-doc__media">
                <SmartImage
                  className="br-doc__img"
                  src={doctor.photo}
                  alt={doctor.photoAlt}
                  sizes="(min-width: 900px) 30vw, 50vw"
                />
              </div>
              <span className="br-doc__specialty">{doctor.specialty}</span>
              {/* Some records carry the specialty as the qualification too -
                  `Medical Officer, Medical Officer` is the same words twice. */}
              <h3 className="br-doc__name">
                {doctor.name}
                {doctor.qualifications && doctor.qualifications !== doctor.specialty ? (
                  <>
                    <span className="br-doc__sep">, </span>
                    <span className="br-doc__quals">{doctor.qualifications}</span>
                  </>
                ) : null}
              </h3>
              <p className="br-doc__text">{doctor.highlight ?? doctor.bio}</p>
            </motion.li>
          ))}
        </ul>

        {team.optometrists.length ? (
          <Reveal className="br-team__support" as="div">
            <span className="br-team__faces" aria-hidden="true">
              {team.optometrists.map((person) => (
                <img key={person.name} src={person.photo} alt="" loading="lazy" />
              ))}
            </span>
            <p>
              {fillTemplate(copy.supportNote, { count: team.optometrists.length })}{" "}
              <span>{listNames(team.optometrists)}.</span>
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
