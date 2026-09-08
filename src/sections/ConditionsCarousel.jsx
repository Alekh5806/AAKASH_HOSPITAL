import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ConditionsCarousel({ conditions, doctors }) {
  const shouldReduceMotion = useReducedMotion();
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = conditions.slides.length;

  const findDoctor = (name) => doctors.find((doctor) => doctor.name === name);

  /* The Learn more button already goes to the slide's own service page, so a
     pill pointing at the same slug is a duplicate link. Drop it and show the
     related treatments instead. */
  const relatedTreatments = (slide) => {
    const target = slide.href.split("/").pop();
    const related = slide.treatments.filter((treatment) => treatment.slug !== target);
    return related.length > 0 ? related : slide.treatments;
  };

  const getStride = () => {
    const track = trackRef.current;
    const slide = track?.firstElementChild;
    if (!slide) return 0;
    return slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
  };

  const syncActiveIndex = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.firstElementChild;
    if (!slide) return;
    const stride =
      slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
    if (!stride) return;
    const index = Math.round(track.scrollLeft / stride);
    setActiveIndex(Math.min(Math.max(index, 0), slideCount - 1));
  }, [slideCount]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    track.addEventListener("scroll", syncActiveIndex, { passive: true });
    return () => track.removeEventListener("scroll", syncActiveIndex);
  }, [syncActiveIndex]);

  const goTo = (index) => {
    const track = trackRef.current;
    const stride = getStride();
    if (!track || !stride) return;
    const target = Math.min(Math.max(index, 0), slideCount - 1);
    track.scrollTo({
      left: target * stride,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <section className="e-sec e-cond" aria-labelledby="e-cond-title">
      <div className="e-shell e-cond__head">
        <div>
          <span className="e-label">{conditions.eyebrow}</span>
          <h2 className="e-h2" id="e-cond-title">
            {conditions.title}
          </h2>
        </div>

        <div className="e-cond__nav">
          <button
            type="button"
            className="e-cond__arrow"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous condition"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <ol className="e-cond__dots">
            {conditions.slides.map((slide, index) => (
              <li key={slide.id}>
                <button
                  type="button"
                  data-active={index === activeIndex ? "true" : "false"}
                  onClick={() => goTo(index)}
                  aria-label={`Go to ${slide.category}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                />
              </li>
            ))}
          </ol>
          <button
            type="button"
            className="e-cond__arrow"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex === slideCount - 1}
            aria-label="Next condition"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul className="e-cond__track" ref={trackRef}>
        {conditions.slides.map((slide, index) => {
          const doctor = findDoctor(slide.doctor);

          return (
            <li className="e-cond__slide" key={slide.id} aria-label={`${index + 1} of ${slideCount}`}>
              <img
                className="e-cond__photo"
                src={slide.image}
                alt={slide.imageAlt}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
              />
              <span className="e-cond__scrim" aria-hidden="true" />

              <div className="e-cond__body">
                <div className="e-cond__copy">
                  <span className="e-cond__cat">
                    <Sparkle size={15} aria-hidden="true" />
                    {slide.category}
                  </span>
                  <p className="e-cond__lead">{slide.headline}</p>
                  <Link className="e-btn e-btn--light e-cond__cta" to={slide.href}>
                    Learn more
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </div>

                <div className="e-cond__card">
                  {doctor ? (
                    <div className="e-cond__doctor">
                      <img src={doctor.photo} alt="" loading="lazy" decoding="async" />
                      <span>
                        <strong>{doctor.name}</strong>
                        <em>{doctor.specialty}</em>
                      </span>
                    </div>
                  ) : null}
                  <blockquote>
                    <span className="e-cond__quoteFull">{slide.quote}</span>
                    <span className="e-cond__quoteShort">{slide.quoteShort}</span>
                  </blockquote>
                  <p className="e-cond__cardLabel">Top treatments</p>
                  <ul className="e-cond__pills">
                    {relatedTreatments(slide).map((treatment) => (
                      <li key={treatment.slug}>
                        <Link to={`/services/${treatment.slug}`}>{treatment.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
