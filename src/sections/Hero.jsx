import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useHydrated } from "../lib/hydration";
import { INTRO_DONE_EVENT, isIntroPending, useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade } from "../lib/motion";

const PHONE_QUERY = "(max-width: 760px)";
const EASE = [0.32, 0.72, 0, 1];

/* The copy arrives in reading order - chip, headline, sentence, button - and
   the figures follow it, the service hero's stagger. Each part rises on its
   own, so the eye is led down the column rather than handed a block. */
const RISE = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

/* The phone gets its own 3:4 encode rather than a CSS crop of the landscape
   one: `cover` in a portrait box would throw away two thirds of the frame and
   still ship the full 1920px width over mobile data. The film only ever
   mounts in the browser (see HeroPoster), so it starts on the right encode
   rather than fetching the desktop poster on a phone first. */
function usePhoneVariant() {
  const [isPhone, setIsPhone] = useState(() => window.matchMedia(PHONE_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const sync = () => setIsPhone(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return isPhone;
}

/* The prerendered hero carries the film's poster, the right one for the screen
   through a <picture>: it is the first frame the reader sees and the page's
   largest paint. React adopts it as it is, and the film takes its place in
   the pass after (useHydrated), under the curtain or the reload veil - the
   same frame, so nothing is seen to change. */
function HeroPoster({ video }) {
  return (
    <picture style={{ display: "contents" }}>
      <source media={PHONE_QUERY} srcSet={video.mobile.poster} />
      <img
        className="e-hero__video"
        src={video.desktop.poster}
        alt=""
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
}

function HeroFilm({ video, reduceMotion }) {
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

  /* The film opens on a focus pull, so its first frame - the poster the
     browser shows until playback starts - is a blur. That is right for a
     film about to play and wrong for one that will not: under reduced motion,
     or when autoplay is refused (iOS Low Power Mode, a data saver), the
     reader would be left looking at a smear. Those two get a sharp frame of
     the atrium instead. A refusal fires no pause event, so the control is
     told here as well, or it would go on offering to pause a still film. */
  const [refused, setRefused] = useState(false);
  const poster = reduceMotion || refused ? source.still : source.poster;

  const attempt = useCallback((element) => {
    element.play().catch((error) => {
      if (error?.name !== "NotAllowedError") return;
      setRefused(true);
      setIsPlaying(false);
    });
  }, []);

  const toggle = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) {
      pausedByUserRef.current = false;
      attempt(element);
    } else {
      pausedByUserRef.current = true;
      element.pause();
    }
  }, [attempt]);

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
            attempt(element);
          }
        } else if (!element.paused) {
          element.pause();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [attempt, reduceMotion, source.mp4]);

  useEffect(() => {
    if (!heldByIntroRef.current || reduceMotion) return undefined;

    const release = () => {
      heldByIntroRef.current = false;
      if (!pausedByUserRef.current && videoRef.current) attempt(videoRef.current);
    };
    window.addEventListener(INTRO_DONE_EVENT, release, { once: true });
    return () => window.removeEventListener(INTRO_DONE_EVENT, release);
  }, [attempt, reduceMotion]);

  return (
    <>
      <video
        key={source.mp4}
        ref={attachVideo}
        className="e-hero__video"
        poster={poster}
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

      <FilmToggle isPlaying={isPlaying} onClick={toggle} />
    </>
  );
}

function FilmToggle({ isPlaying, onClick }) {
  return (
    <button
      type="button"
      className="e-hero__toggle"
      onClick={onClick}
      aria-pressed={!isPlaying}
      aria-label={isPlaying ? "Pause the background video" : "Play the background video"}
    >
      {/* Solid glyphs: at this size the outlined pair read as two hollow
          boxes rather than a pause sign. */}
      {isPlaying ? (
        <Pause size={16} fill="currentColor" aria-hidden="true" />
      ) : (
        <Play size={16} fill="currentColor" aria-hidden="true" />
      )}
    </button>
  );
}

export default function Hero({ hero, counts }) {
  const reduceMotion = Boolean(useReducedMotion());
  const hydrated = useHydrated();
  /* The copy waits for the curtain and then a beat, so the aperture has
     cleared the headline before it rises; a page reached in-session has no
     curtain and no beat. */
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const lead = afterIntro ? 0.35 : 0.05;
  const stage = introDone || reduceMotion ? "shown" : "hidden";
  const initial = reduceMotion ? false : "hidden";

  return (
    <section className="e-hero" aria-label="Aakash Eye Hospital">
      <div className="e-hero__media">
        {hydrated ? (
          <HeroFilm video={hero.video} reduceMotion={reduceMotion} />
        ) : (
          <>
            <HeroPoster video={hero.video} />
            {/* The build is made as if the curtain were up, when the film is
                held at its first frame and the control offers to play it. */}
            <FilmToggle isPlaying={false} />
          </>
        )}
        <span className="e-hero__scrim" aria-hidden="true" />
      </div>
      <span className="e-hero__shade" aria-hidden="true" />

      <div className="e-shell e-hero__inner">
        <motion.div
          className="e-hero__copy"
          initial={initial}
          animate={stage}
          variants={cascade(lead)}
        >
          {/* The reference's glass chip over its headline says the offer is easy
              to take up; this one says the same true thing about booking here. */}
          <motion.p className="e-hero__eyebrow" variants={RISE}>
            <MessageCircle size={15} aria-hidden="true" />
            <span>{hero.eyebrow}</span>
          </motion.p>
          {/* One line, as the reference's is: the roman word and the italic
              accent share it. */}
          <motion.h1 variants={RISE}>
            {hero.title} <span className="e-hero__accent">{hero.titleAccent}</span>
          </motion.h1>
          <motion.p className="e-hero__lede" variants={RISE}>
            {hero.subtitle}
          </motion.p>
          <motion.div className="e-hero__actions" variants={RISE}>
            <Link className="e-btn e-btn--light e-hero__cta" to="/appointment">
              {hero.ctaLabel}
              <span className="e-hero__cta-disc" aria-hidden="true">
                <ArrowRight size={18} />
              </span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.dl
          className="e-hero__stats"
          initial={initial}
          animate={stage}
          variants={cascade(lead + 0.3)}
        >
          {hero.stats.map((stat) => (
            <motion.div className="e-hero__stat" key={stat.label} variants={RISE}>
              <dt className="e-num">
                {stat.count ? String(counts[stat.count]).padStart(2, "0") : stat.value}
              </dt>
              <dd>{stat.label}</dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}
