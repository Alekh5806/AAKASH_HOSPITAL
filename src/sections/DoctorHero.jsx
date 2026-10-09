import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CalendarDays, Phone } from "lucide-react";
import DoctorPortrait from "../components/DoctorPortrait";
import { cleanTel, getConfirmedPrimaryPhone } from "../lib/contact";
import { describeInterests, doctorsPage, fillTemplate } from "../lib/doctorsData";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade } from "../lib/motion";

const EASE = [0.22, 1, 0.36, 1];
const copy = doctorsPage.profile;

const RISE = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* The portrait settles into its frame the way the roster's cards do. */
const FACE = {
  hidden: { opacity: 0, scale: 0.96 },
  shown: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE } },
};

/* Who the doctor is and the two things a reader came to do: book with them,
 * or call the hospital where they are based.
 *
 * The roster card made large - portrait, specialty in the accent micro-caps,
 * the name, the post-nominals on their own line, the areas of interest - so
 * a reader arriving from a card recognises the person at once. The name is
 * the page's one h1, in the serif the site's heads use. It arrives in
 * reading order, and on a first visit after the opening curtain. */
export default function DoctorHero({ doctor, home }) {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const initial = reduceMotion ? false : "hidden";
  const stage = introDone || reduceMotion ? "shown" : "hidden";
  const delay = afterIntro ? 0.3 : 0.05;
  const phone = getConfirmedPrimaryPhone(home.branch);
  const interests = describeInterests(doctor);

  return (
    <section className="dp-hero" aria-labelledby="dp-name">
      <motion.div
        className="e-shell"
        initial={initial}
        animate={stage}
        variants={cascade(delay, 0.08)}
      >
        <motion.div variants={RISE}>
          <Link className="dp-back" to="/doctors">
            <ArrowLeft size={15} aria-hidden="true" />
            {copy.backLabel}
          </Link>
        </motion.div>

        <div className="dp-hero__grid">
          <motion.div className="dp-hero__face" variants={FACE}>
            <DoctorPortrait
              doctor={doctor}
              className="dp-hero__img"
              loading="eager"
              sizes="(min-width: 761px) 260px, 128px"
            />
          </motion.div>

          <div className="dp-hero__body">
            <motion.span className="dp-hero__specialty" variants={RISE}>
              {doctor.specialty}
            </motion.span>
            <motion.h1 className="dp-hero__name" id="dp-name" variants={RISE}>
              {doctor.name}
            </motion.h1>
            {doctor.qualifications ? (
              <motion.p className="dp-hero__quals" variants={RISE}>
                {doctor.qualifications}
              </motion.p>
            ) : null}
            {interests ? (
              <motion.p className="dp-hero__interests" variants={RISE}>
                <span className="dp-hero__interests-label">{copy.interestsLabel}</span>
                {interests}
              </motion.p>
            ) : null}
            <motion.div className="dp-hero__actions" variants={RISE}>
              <Link className="e-btn" to={`/appointment?branch=${home.branch.slug}`}>
                <CalendarDays size={17} aria-hidden="true" />
                {fillTemplate(copy.bookLabel, { hospital: home.branch.name })}
              </Link>
              {phone ? (
                <a className="e-btn e-btn--outline dp-hero__call" href={`tel:${cleanTel(phone)}`}>
                  <Phone size={17} aria-hidden="true" />
                  {fillTemplate(copy.callLabel, { hospital: home.branch.name })}
                </a>
              ) : null}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
