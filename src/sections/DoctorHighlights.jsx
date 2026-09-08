import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { revealVariants, staggerContainer } from "../lib/motion";

export default function DoctorHighlights({ doctorHighlights, doctors }) {
  const shouldReduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

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
      track.clientWidth - parseFloat(styles.paddingLeft || 0) - parseFloat(styles.paddingRight || 0);
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
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {featured.map((doctor, index) => (
            <motion.li
              className="e-docs__card"
              key={doctor.name}
              variants={revealVariants(shouldReduceMotion)}
            >
              <div className="e-docs__media">
                <img
                  src={doctor.photo}
                  alt={doctor.photoAlt}
                  loading={index < 4 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
              <h3 className="e-docs__name">
                {doctor.name}, {doctor.qualifications}
              </h3>
              <p className="e-docs__text">{doctor.highlight}</p>
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
