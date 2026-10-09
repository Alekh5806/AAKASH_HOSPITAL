import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import DoctorPortrait from "../components/DoctorPortrait";
import { describeHospitals, fillTemplate, hasProfile, profileHref } from "../lib/doctorsData";
import { SCROLL_DRIVEN, revealVariants, staggerContainer, useInViewReplay } from "../lib/motion";

export default function DoctorHighlights({ doctorHighlights, doctors }) {
  const shouldReduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const arrival = useInViewReplay(trackRef, 0.2);
  /* Where the scroll deals the rail in (landing.css), the cards' own lift
     would be a second move on top of it, so they rest where they are. */
  const dealt = SCROLL_DRIVEN && !shouldReduceMotion;

  const featured = doctorHighlights.featured
    .map((name) => doctors.find((doctor) => doctor.name === name))
    .filter(Boolean);

  const measure = () => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !card) return null;

    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || 0);
    const stride = card.getBoundingClientRect().width + gap;
    if (!stride) return null;

    const inner =
      track.clientWidth -
      parseFloat(styles.paddingLeft || 0) -
      parseFloat(styles.paddingRight || 0);
    return { stride, perView: Math.max(1, Math.floor((inner + gap) / stride)) };
  };

  /* The reference shows no dots and no counter - the arrows simply disappear
     at the end they cannot move toward, which is why each one is unmounted
     rather than disabled. */
  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAtStart(track.scrollLeft <= 2);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    sync();
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      track.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const nudge = (direction) => {
    const track = trackRef.current;
    const metrics = measure();
    if (!track || !metrics) return;

    track.scrollBy({
      left: direction * metrics.perView * metrics.stride,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section className="e-sec e-docs" aria-labelledby="e-docs-title">
      <div className="e-shell e-docs__head">
        <h2 className="e-docs__title" id="e-docs-title">
          {doctorHighlights.title} <em>{doctorHighlights.titleAccent}</em>
        </h2>
        <p className="e-docs__sub">{doctorHighlights.lede}</p>
      </div>

      <div className="e-docs__rail">
        <motion.ul
          className="e-docs__track"
          ref={trackRef}
          variants={staggerContainer(shouldReduceMotion)}
          initial={dealt ? "visible" : "hidden"}
          animate={dealt || arrival.inView ? "visible" : "hidden"}
        >
          {featured.map((doctor) => (
            <motion.li
              className="e-docs__card"
              key={doctor.name}
              variants={revealVariants(shouldReduceMotion)}
            >
              <div className="e-docs__media">
                {/* Lazy, all of them: SmartImage marks an eager image high
                    priority, and this rail is four sections below the hero
                    film the first screen is waiting on. */}
                <DoctorPortrait doctor={doctor} sizes="(min-width: 761px) 292px, 70vw" />
              </div>
              <h3 className="e-docs__name">
                {hasProfile(doctor) ? (
                  <Link className="e-docs__link" to={profileHref(doctor)}>
                    {doctor.name}
                  </Link>
                ) : (
                  doctor.name
                )}
                , {doctor.qualifications}
              </h3>
              <p className="e-docs__text">
                {fillTemplate(doctorHighlights.cardText, {
                  specialty: doctor.specialty,
                  hospitals: describeHospitals(doctor),
                })}
              </p>
            </motion.li>
          ))}
        </motion.ul>

        <span className="e-docs__fade e-docs__fade--end" data-hidden={atEnd} aria-hidden="true" />
        <span
          className="e-docs__fade e-docs__fade--start"
          data-hidden={atStart}
          aria-hidden="true"
        />

        {!atStart ? (
          <button
            type="button"
            className="e-docs__arrow e-docs__arrow--prev"
            onClick={() => nudge(-1)}
            aria-label="Previous doctors"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        ) : null}
        {!atEnd ? (
          <button
            type="button"
            className="e-docs__arrow e-docs__arrow--next"
            onClick={() => nudge(1)}
            aria-label="Next doctors"
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="e-shell e-docs__foot">
        <Link className="e-link" to="/doctors">
          {doctorHighlights.ctaLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
