import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { ChevronDown } from "lucide-react";
import SmartImage from "../components/SmartImage";
import { about } from "../lib/aboutData";
import { branches } from "../lib/coreData";
import { doctors } from "../lib/doctorsData";

const { journey } = about;
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const MEDIA_SIZES = "(min-width: 1024px) 46vw, 92vw";
const ROLL = { type: "spring", stiffness: 170, damping: 24, mass: 0.9 };

/* Shares of a stop's scroll segment, and they are deliberately not symmetrical.
   The outgoing photograph dissolves away over the tail of its own segment and is
   gone exactly as the next one starts to wipe open, so the frame is never empty
   and two photographs are never mixed. The copy is a beat behind the picture at
   both ends, which is what stops one stop's paragraph from being read on top of
   the next one's. */
const WIPE = 0.26;
const MEDIA_OUT_START = 0.78;
const MEDIA_OUT = 0.22;
const COPY_IN_START = 0.04;
const COPY_IN = 0.22;
const COPY_OUT_START = 0.8;
const COPY_OUT = 0.16;
const COPY_LIFT = 46;
const ZOOM_FROM = 1.16;
const GHOST_DRIFT = 7;

/* A pinned frame needs height to hold a photograph, a year and a paragraph at
   once. A phone held sideways has none, so below this the stage unpins and the
   stops stack into an ordinary article - the same fallback reduced motion gets. */
const SHORT_VIEWPORT = "(max-height: 520px)";

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function subscribeShortViewport(onChange) {
  const query = window.matchMedia(SHORT_VIEWPORT);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useShortViewport() {
  return useSyncExternalStore(
    subscribeShortViewport,
    () => window.matchMedia(SHORT_VIEWPORT).matches,
    () => false,
  );
}

/* The year is the clock of the stage: each digit rolls from the previous stop's
   year to this one as the reader arrives, so time visibly advances. A label that
   is not a plain number - the closing "Today" - is set as a word instead. */
function YearRoll({ value, from, active, className }) {
  const shouldReduceMotion = useReducedMotion();
  const digits = /^\d+$/.test(value) ? value.split("") : null;
  const fromDigits =
    from && /^\d+$/.test(from) && from.length === value.length ? from.split("") : null;

  if (!digits) {
    return <span className={`${className} ab-stage__odo--word`}>{value}</span>;
  }

  return (
    <span className={className}>
      <span className="ab-stage__odo-a11y">{value}</span>
      {digits.map((digit, index) => {
        const resting = active || !fromDigits ? digit : fromDigits[index];
        return (
          <span className="ab-stage__odo-col" key={index} aria-hidden="true">
            <motion.span
              className="ab-stage__odo-strip"
              animate={{ y: `${Number(resting) * -10}%` }}
              transition={shouldReduceMotion ? { duration: 0 } : { ...ROLL, delay: index * 0.05 }}
            >
              {DIGITS.map((glyph) => (
                <span key={glyph}>{glyph}</span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

/* Every stop owns one segment of the stage's scroll and paints itself from it:
   it wipes in behind a travelling accent line, holds while it is readable, then
   lifts out as the next one arrives.

   The styles are written straight to the DOM rather than handed to motion
   values. Scroll-linked `style` values are promoted to WAAPI animations, and a
   stop whose segment starts at progress 0 was mishandled there - the opening
   stop faded *up* across the whole stage instead of out at the end of its own
   segment, so two stops were legible at once. Writing them here keeps the
   mapping exact, and costs six property writes per stop per frame. */
function Stop({ stop, index, count, progress, previousYear, isActive, staticMode }) {
  const rootRef = useRef(null);
  const mediaRef = useRef(null);
  const frameRef = useRef(null);
  const zoomRef = useRef(null);
  const sweepRef = useRef(null);
  const copyRef = useRef(null);
  const ghostRef = useRef(null);
  const isNow = stop.kind === "now";
  const live = staticMode || isActive;

  const paint = useCallback(
    (value) => {
      const root = rootRef.current;
      if (!root) return;
      const seg = 1 / count;
      const local = (value - index * seg) / seg;
      const first = index === 0;
      const last = index === count - 1;

      const wipe = first ? 1 : clamp01(local / WIPE);
      const mediaOut = last ? 0 : clamp01((local - MEDIA_OUT_START) / MEDIA_OUT);
      const copyIn = first ? 1 : clamp01((local - COPY_IN_START) / COPY_IN);
      const copyOut = last ? 0 : clamp01((local - COPY_OUT_START) / COPY_OUT);
      const copyShown = Math.min(copyIn, 1 - copyOut);
      const held = clamp01(local);
      const hidden = (1 - wipe) * 100;

      root.style.pointerEvents = copyShown > 0.55 ? "auto" : "none";

      // Gated on arrival as well as departure: a stop still ahead has its
      // photograph clipped away, but the frame it sits in would otherwise keep
      // painting its own panel and drop shadow over the stop being played.
      const mediaIn = first ? 1 : clamp01(local / 0.02);
      if (mediaRef.current)
        mediaRef.current.style.opacity = String(Math.min(mediaIn, 1 - mediaOut));
      if (frameRef.current) frameRef.current.style.clipPath = `inset(0% 0% ${hidden}% 0%)`;
      if (zoomRef.current) {
        zoomRef.current.style.transform = `scale(${ZOOM_FROM - (ZOOM_FROM - 1) * held})`;
      }
      if (sweepRef.current) {
        sweepRef.current.style.top = `${100 - hidden}%`;
        sweepRef.current.style.opacity = String(clamp01(Math.min(hidden, 100 - hidden) / 8));
      }
      if (copyRef.current) {
        copyRef.current.style.opacity = String(copyShown);
        copyRef.current.style.transform = `translateY(${(1 - copyIn) * COPY_LIFT - copyOut * COPY_LIFT}px)`;
      }
      if (ghostRef.current) {
        ghostRef.current.style.opacity = String(copyShown);
        ghostRef.current.style.transform = `translateY(-50%) translateX(${(0.5 - held) * 2 * GHOST_DRIFT}%)`;
      }
    },
    [count, index],
  );

  useMotionValueEvent(progress, "change", (value) => {
    if (!staticMode) paint(value);
  });

  useEffect(() => {
    const refs = [rootRef, mediaRef, frameRef, zoomRef, sweepRef, copyRef, ghostRef];
    if (staticMode) {
      refs.forEach((ref) => ref.current?.removeAttribute("style"));
      return undefined;
    }
    const frame = requestAnimationFrame(() => paint(progress.get()));
    return () => cancelAnimationFrame(frame);
  }, [staticMode, paint, progress]);

  return (
    <li
      className="ab-stage__stop"
      id={`journey-${stop.key}`}
      data-kind={stop.kind}
      ref={rootRef}
      inert={(!staticMode && !isActive) || undefined}
    >
      <span className="ab-stage__ghost" aria-hidden="true" ref={ghostRef}>
        <YearRoll
          className="ab-stage__odo ab-stage__odo--ghost"
          value={stop.year}
          from={previousYear}
          active={live}
        />
      </span>

      <figure className="ab-stage__media" ref={mediaRef}>
        <span className="ab-stage__frame" ref={frameRef}>
          <span className="ab-stage__zoom" ref={zoomRef}>
            <SmartImage
              src={stop.image}
              alt={stop.alt}
              sizes={MEDIA_SIZES}
              loading={index === 0 ? "eager" : "lazy"}
            />
          </span>
        </span>
        <span className="ab-stage__sweep" aria-hidden="true" ref={sweepRef} />
      </figure>

      <div className="ab-stage__copy" ref={copyRef}>
        <p className="ab-stage__count">
          <span>{pad(index + 1)}</span>
          <i aria-hidden="true" />
          <span>{pad(count)}</span>
        </p>
        <span className="ab-stage__tag">{stop.tag}</span>
        <YearRoll className="ab-stage__odo" value={stop.year} from={previousYear} active={live} />
        <h3 className="e-h3">{stop.title}</h3>
        <p className="e-body">{stop.description}</p>

        {isNow ? (
          <div className="ab-stage__figures">
            {stop.figures.map((figure) => (
              <div key={figure.key}>
                <strong>{figure.value}</strong>
                <span>{figure.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="ab-stage__metric">{stop.metric}</p>
        )}
      </div>
    </li>
  );
}

export default function JourneyTimeline() {
  const shouldReduceMotion = useReducedMotion();
  const shortViewport = useShortViewport();
  const staticMode = Boolean(shouldReduceMotion) || shortViewport;
  const stageRef = useRef(null);
  const fillRef = useRef(null);
  const headRef = useRef(null);
  const chipNodes = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const stops = useMemo(() => {
    const figureValues = {
      years: new Date().getFullYear() - journey.establishedYear,
      hospitals: branches.items.length,
      specialists: doctors.items.length,
    };
    return [
      ...journey.milestones.map((milestone) => ({
        ...milestone,
        key: milestone.year,
        kind: "milestone",
      })),
      {
        ...journey.now,
        key: "today",
        kind: "now",
        year: journey.now.label,
        figures: journey.now.figures.map((figure) => ({
          ...figure,
          value: figureValues[figure.key],
        })),
      },
    ];
  }, []);

  const count = stops.length;

  // The stage is pinned for its whole height, so progress runs from the moment
  // its top meets the viewport to the moment its bottom does.
  const { scrollYProgress } = useScroll({ target: stageRef, offset: ["start start", "end end"] });

  const toIndex = useCallback(
    (value) => Math.max(0, Math.min(count - 1, Math.floor(value * count))),
    [count],
  );

  // The playhead lands on the tick of the stop being played rather than drifting
  // between two of them, so the rail reads as a position and not as a percentage.
  const paintRail = useCallback(
    (value) => {
      const travelled = clamp01((value * count - 0.5) / Math.max(1, count - 1));
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${travelled})`;
      if (headRef.current) headRef.current.style.left = `${travelled * 100}%`;
    },
    [count],
  );

  useMotionValueEvent(scrollYProgress, "change", (value) => {
    if (staticMode) return;
    setActiveIndex(toIndex(value));
    paintRail(value);
  });

  // Unpinned there are no segments to divide, so which stop the reader is on is
  // whichever one is crossing the middle of the viewport.
  useEffect(() => {
    if (!staticMode || typeof IntersectionObserver === "undefined") return undefined;
    const nodes = stops
      .map((stop) => document.getElementById(`journey-${stop.key}`))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = nodes.indexOf(entry.target);
          if (index >= 0) setActiveIndex(index);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [staticMode, stops]);

  // A reader can land mid-stage on a refresh or a back navigation, so the first
  // frame is painted from the real scroll position rather than assumed.
  useEffect(() => {
    if (staticMode) {
      fillRef.current?.removeAttribute("style");
      headRef.current?.removeAttribute("style");
      return undefined;
    }
    const frame = requestAnimationFrame(() => {
      const value = scrollYProgress.get();
      setActiveIndex(toIndex(value));
      paintRail(value);
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollYProgress, toIndex, paintRail, staticMode]);

  // Unpinned, the stops are ordinary blocks and each has an id; pinned, there is
  // only one box on screen, so a jump is a scroll to the offset that plays it.
  const goToStop = useCallback(
    (index) => {
      const stage = stageRef.current;
      if (!stage) return;
      if (staticMode) {
        document.getElementById(`journey-${stops[index].key}`)?.scrollIntoView({ block: "start" });
        return;
      }
      const range = stage.offsetHeight - window.innerHeight;
      if (range <= 0) {
        stage.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const stageTop = stage.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: stageTop + ((index + 0.5) / count) * range, behavior: "smooth" });
    },
    [count, staticMode, stops],
  );

  const handleRailKeyDown = useCallback(
    (event, index) => {
      const last = count - 1;
      let next = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = Math.min(last, index + 1);
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = Math.max(0, index - 1);
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = last;
      if (next === null) return;
      event.preventDefault();
      chipNodes.current[next]?.focus();
      goToStop(next);
    },
    [count, goToStop],
  );

  return (
    <section className="ab-time">
      {/* The film's title card. It is on the navy rather than on the paper above
          it, so the page changes ground once, deliberately, instead of stacking
          a second block of dark-on-white text in front of a dark stage. */}
      <div className="ab-time__intro">
        <div className="e-shell ab-time__intro-grid">
          <span className="e-label">{journey.milestonesLabel}</span>
          <h2 className="ab-time__intro-title">{journey.milestonesTitle}</h2>
          <p className="e-lede ab-time__intro-lede">{journey.milestonesLede}</p>
          <p className="ab-time__cue">
            <ChevronDown size={16} aria-hidden="true" />
            {journey.scrollCue}
          </p>
        </div>
      </div>

      <div
        className="ab-stage"
        ref={stageRef}
        data-mode={staticMode ? "static" : "scroll"}
        style={{ "--stops": count }}
      >
        <div className="ab-stage__pin">
          <div className="ab-stage__inner">
            <ol className="ab-stage__stops">
              {stops.map((stop, index) => (
                <Stop
                  key={stop.key}
                  stop={stop}
                  index={index}
                  count={count}
                  progress={scrollYProgress}
                  previousYear={index > 0 ? stops[index - 1].year : undefined}
                  isActive={index === activeIndex}
                  staticMode={staticMode}
                />
              ))}
            </ol>
          </div>

          <nav className="ab-rail" aria-label={journey.railLabel}>
            <div className="ab-rail__shell">
              <div className="ab-rail__track" aria-hidden="true">
                <span className="ab-rail__fill" ref={fillRef} />
                <span className="ab-rail__head" ref={headRef} />
              </div>
              <ol className="ab-rail__list">
                {stops.map((stop, index) => (
                  <li key={stop.key}>
                    <button
                      type="button"
                      className="ab-rail__btn"
                      data-state={
                        index === activeIndex ? "on" : index < activeIndex ? "past" : "ahead"
                      }
                      aria-current={index === activeIndex ? "true" : undefined}
                      tabIndex={index === activeIndex ? 0 : -1}
                      ref={(node) => {
                        chipNodes.current[index] = node;
                      }}
                      onClick={() => goToStop(index)}
                      onKeyDown={(event) => handleRailKeyDown(event, index)}
                    >
                      <span className="ab-rail__dot" aria-hidden="true" />
                      <span className="ab-rail__year">{stop.year}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </nav>
        </div>
      </div>
    </section>
  );
}
