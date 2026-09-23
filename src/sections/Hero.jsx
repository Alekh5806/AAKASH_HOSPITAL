import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { INTRO_DONE_EVENT, isIntroPending, useIntroDone } from "../lib/intro";

const PHONE_QUERY = "(max-width: 760px)";

/* The phone gets its own 3:4 encode rather than a CSS crop of the landscape
   one: `cover` in a portrait box would throw away two thirds of the frame and
   still ship the full 1920px width over mobile data. */
function usePhoneVariant() {
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const sync = () => setIsPhone(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return isPhone;
}

function HeroVideo({ video, reduceMotion }) {
  const videoRef = useRef(null);
  const isPhone = usePhoneVariant();
  const source = isPhone ? video.mobile : video.desktop;

  /* React sets `muted` as a property rather than an attribute, and Safari wants
     the attribute present on the element it is asked to autoplay. Setting both
     here costs nothing and removes the case where a browser refuses the film and
     paints its own play affordance over it. */
  const attachVideo = useCallback((element) => {
    videoRef.current = element;
    if (element) {
      element.muted = true;
      element.setAttribute("muted", "");
    }
  }, []);

  /* Reduced motion opens on the poster and hands the reader the play button,
     so motion is never started for them but is never taken away either. On a
     first visit the film is also held at its first frame while the opening
     curtain is up, and starts as the curtain opens onto it - otherwise the
     reader joins a loop that has been running unseen for two seconds. */
  const [heldAtMount] = useState(isIntroPending);
  const heldByIntroRef = useRef(heldAtMount);
  const [isPlaying, setIsPlaying] = useState(!reduceMotion && !heldAtMount);
  const pausedByUserRef = useRef(reduceMotion);

  const toggle = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) {
      pausedByUserRef.current = false;
      element.play().catch(() => {});
    } else {
      pausedByUserRef.current = true;
      element.pause();
    }
  }, []);

  /* Autoplay can be refused (iOS Low Power Mode, a data saver, a browser
     policy). The button has to show what actually happened, so the state
     follows the element's own events rather than the click. */
  useEffect(() => {
    const element = videoRef.current;
    if (!element) return undefined;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    return () => {
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
    };
  }, [source.mp4]);

  /* Decoding a loop nobody can see costs battery on a phone, so the video
     stops once it leaves the screen and resumes only if the reader had not
     deliberately paused it. */
  useEffect(() => {
    const element = videoRef.current;
    if (!element || reduceMotion) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!pausedByUserRef.current && !heldByIntroRef.current) {
            element.play().catch(() => {});
          }
        } else if (!element.paused) {
          element.pause();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [reduceMotion, source.mp4]);

  useEffect(() => {
    if (!heldByIntroRef.current || reduceMotion) return undefined;

    const release = () => {
      heldByIntroRef.current = false;
      if (!pausedByUserRef.current) videoRef.current?.play().catch(() => {});
    };
    window.addEventListener(INTRO_DONE_EVENT, release, { once: true });
    return () => window.removeEventListener(INTRO_DONE_EVENT, release);
  }, [reduceMotion]);

  return (
    <>
      <video
        key={source.mp4}
        ref={attachVideo}
        className="e-hero__video"
        poster={source.poster}
        autoPlay={!reduceMotion && !heldAtMount}
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noplaybackrate noremoteplayback"
        aria-label={video.description}
      >
        <source src={source.webm} type="video/webm" />
        <source src={source.mp4} type="video/mp4" />
      </video>

      <button
        type="button"
        className="e-hero__toggle"
        onClick={toggle}
        aria-pressed={!isPlaying}
        aria-label={isPlaying ? "Pause the background video" : "Play the background video"}
      >
        {isPlaying ? (
          <Pause size={15} aria-hidden="true" />
        ) : (
          <Play size={15} aria-hidden="true" />
        )}
      </button>
    </>
  );
}

export default function Hero({ hero }) {
  const shouldReduceMotion = useReducedMotion();
  /* The copy waits for the curtain and then a beat, so the aperture has
     cleared the headline before it rises; a page reached in-session has no
     curtain and no beat. */
  const introDone = useIntroDone();
  const [afterIntro] = useState(isIntroPending);

  return (
    <section className="e-hero" aria-label="Aakash Eye Hospital">
      <div className="e-hero__media">
        <HeroVideo video={hero.video} reduceMotion={Boolean(shouldReduceMotion)} />
        <span className="e-hero__scrim" aria-hidden="true" />
      </div>

      <div className="e-shell e-hero__inner">
        <motion.div
          className="e-hero__copy"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 22 }}
          animate={introDone || shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.85,
            delay: shouldReduceMotion || !afterIntro ? 0 : 0.35,
            ease: [0.32, 0.72, 0, 1],
          }}
        >
          {/* The reference's glass chip over its headline says the offer is easy
              to take up; this one says the same true thing about booking here. */}
          <p className="e-hero__eyebrow">
            <MessageCircle size={15} aria-hidden="true" />
            <span>{hero.eyebrow}</span>
          </p>
          {/* One line, as the reference's is: the roman word and the italic
              accent share it. */}
          <h1>
            {hero.title} <span className="e-hero__accent">{hero.titleAccent}</span>
          </h1>
          <p className="e-hero__lede">{hero.subtitle}</p>
          <div className="e-hero__actions">
            <Link className="e-btn e-btn--light e-hero__cta" to="/appointment">
              {hero.ctaLabel}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        <dl className="e-hero__stats">
          {hero.stats.map((stat) => (
            <div className="e-hero__stat" key={stat.label}>
              <dt className="e-num">{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
