import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CalendarDays, ChevronRight, Sparkles, Stethoscope } from "lucide-react";
import ButtonLink from "../components/ButtonLink";

export default function Hero({ hero }) {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, 90]);
  const layerY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? [0, 0] : [0, -44]);
  const currentSlide = hero.slides[active];

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % hero.slides.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [hero.slides.length, shouldReduceMotion]);

  return (
    <section className="hero" ref={ref}>
      <motion.div className="hero__media" style={{ y: imageY }}>
        {hero.slides.map((slide, index) => (
          <motion.img
            key={slide.image}
            src={slide.image}
            alt={slide.alt}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            initial={false}
            animate={{
              opacity: active === index ? 1 : 0,
              scale: shouldReduceMotion ? 1 : active === index ? 1.02 : 1,
            }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.8 }}
          />
        ))}
      </motion.div>
      <div className="hero__overlay" />
      <motion.div className="hero__gradient" style={{ y: layerY }} />
      <div className="hero__scan" aria-hidden="true" />
      <div className="container hero__inner">
        <motion.div
          className="hero__copy"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.7, ease: "easeOut" }}
        >
          <span className="eyebrow hero__eyebrow">{hero.eyebrow}</span>
          <h1>{hero.title}</h1>
          <p>{hero.subtitle}</p>
          <div className="hero__ctas">
            <ButtonLink to={hero.ctas[0].href} icon={CalendarDays}>
              {hero.ctas[0].label}
            </ButtonLink>
            <ButtonLink to={hero.ctas[1].href} variant="secondary" icon={Stethoscope}>
              {hero.ctas[1].label}
            </ButtonLink>
          </div>
          <div className="hero__trust">
            <span>Since 1993</span>
            <span>3 Gujarat branches</span>
            <span>1,00,000+ cataract procedures</span>
          </div>
        </motion.div>

        <motion.aside
          className="hero__showcase"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 28, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.75, delay: 0.12 }}
          aria-label="Featured care"
        >
          <div className="hero__showcase-media">
            <motion.img
              key={currentSlide.image}
              src={currentSlide.image}
              alt={currentSlide.alt}
              loading="eager"
              decoding="async"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            />
            <span>
              <Sparkles size={16} aria-hidden="true" />
              Featured Care
            </span>
          </div>
          <div className="hero__showcase-copy">
            <h2>{currentSlide.title}</h2>
            <p>{currentSlide.description}</p>
            <div className="hero__showcase-bottom">
              <div className="hero__dots" aria-label="Hero slides">
                {hero.slides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    aria-label={`Show ${slide.title}`}
                    aria-pressed={active === index}
                    onClick={() => setActive(index)}
                  />
                ))}
              </div>
              <ButtonLink to="/services" variant="secondary" icon={ChevronRight}>
                View Care
              </ButtonLink>
            </div>
          </div>
        </motion.aside>

      </div>
    </section>
  );
}
