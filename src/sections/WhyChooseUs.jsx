import { createElement, useEffect, useRef, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { getIcon } from "../lib/icons";
import { SCROLL_DRIVEN, cardEntrance, useInViewReplay } from "../lib/motion";

const EASE = [0.32, 0.72, 0, 1];

/* A phone held upright: the six reasons are one deck of full-width cards,
   each sticking a title row below the one before it, so the finished stack
   is an index of all six. Must match the deck block in landing.css. */
const DECK_QUERY = "(max-width: 620px) and (min-height: 521px)";

function subscribeToDeck(callback) {
  const query = window.matchMedia(DECK_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/* A covered card recedes by how far the cards over it have travelled, so the
   stack reads as a deck seen from above. Every card is held to the tallest
   one's height, which is what lets the deck square up behind the last card as
   the section leaves. Both are measurements written straight to the DOM. */
function useDeck(listRef, enabled) {
  useEffect(() => {
    const list = listRef.current;
    if (!enabled || !list) return undefined;

    const cards = [...list.children];
    let strip = 0;
    let frame = 0;
    let width = 0;
    const depths = cards.map(() => -1);

    const paint = () => {
      frame = 0;
      const tops = cards.map((card) => card.getBoundingClientRect().top);
      const heights = cards.map((card) => card.offsetHeight);
      const covered = cards.map((card, index) => {
        if (index === 0) return 0;
        const travel = heights[index - 1] - strip;
        const moved = tops[index - 1] + heights[index - 1] - tops[index];
        return travel > 0 ? Math.min(Math.max(moved / travel, 0), 1) : 0;
      });
      cards.forEach((card, index) => {
        let depth = 0;
        for (let next = index + 1; next < cards.length; next += 1) depth += covered[next];
        const rounded = Math.round(depth * 1000) / 1000;
        if (rounded !== depths[index]) {
          depths[index] = rounded;
          card.style.setProperty("--why-depth", rounded);
        }
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    let live = true;
    const measure = () => {
      if (!live) return;
      width = list.clientWidth;
      strip = cards[0].querySelector(".e-why__title").offsetHeight;
      list.style.removeProperty("--why-card-h");
      const tallest = Math.max(...cards.map((card) => card.offsetHeight));
      list.style.setProperty("--why-card-h", `${tallest}px`);
      schedule();
    };

    const resize = new ResizeObserver(() => {
      if (list.clientWidth !== width) measure();
    });
    const visible = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        window.addEventListener("scroll", schedule, { passive: true });
        schedule();
      } else {
        window.removeEventListener("scroll", schedule);
      }
    });

    measure();
    resize.observe(list);
    visible.observe(list);
    document.fonts?.ready.then(measure);

    return () => {
      live = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      visible.disconnect();
      window.removeEventListener("scroll", schedule);
      list.style.removeProperty("--why-card-h");
      cards.forEach((card) => card.style.removeProperty("--why-depth"));
    };
  }, [listRef, enabled]);
}

/* Six small visuals, one per tile. Each is plain CSS or inline SVG that
   inherits its colour from the tile's tone, so nothing here needs to know
   whether it is sitting on navy or on paper. */

/* Faces only: a tile this size is a stack of portraits, and a doctor without
   one yet is counted in the `+N` rather than shown as a monogram. */
function TeamVisual({ doctors, active, reduced }) {
  const shown = doctors.filter((doctor) => doctor.photo).slice(0, 4);
  const remaining = Math.max(doctors.length - shown.length, 0);

  return (
    <div className="e-why__team">
      {shown.map((doctor, index) => (
        <motion.img
          key={doctor.name}
          src={doctor.photo}
          alt=""
          loading="lazy"
          decoding="async"
          initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          animate={active || reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
          transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : index * 0.09, ease: EASE }}
        />
      ))}
      {remaining > 0 ? (
        <motion.span
          className="e-why__teamMore"
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={active || reduced ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.42, ease: EASE }}
        >
          +{remaining}
        </motion.span>
      ) : null}
    </div>
  );
}

function ScanVisual({ active, reduced }) {
  const trace = [10, 20, 32, 24, 38, 28, 16, 30, 22, 34, 18, 26];

  return (
    <div className="e-why__scan">
      <div className="e-why__scanTrace" aria-hidden="true">
        {trace.map((height, index) => (
          <motion.span
            key={`${height}-${index}`}
            initial={{ height: reduced ? height : 3 }}
            animate={{ height: active || reduced ? height : 3 }}
            transition={{
              duration: reduced ? 0 : 0.45,
              delay: reduced ? 0 : index * 0.04,
              ease: EASE,
            }}
          />
        ))}
      </div>
      <motion.span
        className="e-why__scanBeam"
        aria-hidden="true"
        initial={{ left: "0%", opacity: 0 }}
        animate={
          active && !reduced
            ? { left: ["0%", "100%"], opacity: [0, 1, 1, 0] }
            : { left: "0%", opacity: 0 }
        }
        transition={{ duration: reduced ? 0 : 1.4, delay: reduced ? 0 : 0.3, ease: "easeInOut" }}
      />
    </div>
  );
}

function MapVisual({ branches, active, reduced }) {
  const points = [
    [10, 34], [32, 18], [54, 30], [72, 14], [90, 26], [110, 40],
  ].slice(0, Math.max(branches.length, 2));
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");

  return (
    <div className="e-why__map">
      <svg viewBox="0 0 120 52" role="presentation" aria-hidden="true">
        <motion.path
          d={line}
          className="e-why__mapLine"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: active || reduced ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.15, ease: EASE }}
        />
        {points.map(([x, y], index) => (
          <motion.circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r="4"
            className="e-why__mapDot"
            initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
            animate={active || reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
            transition={{
              duration: reduced ? 0 : 0.35,
              delay: reduced ? 0 : 0.2 + index * 0.12,
              ease: EASE,
            }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        ))}
      </svg>
    </div>
  );
}

function ExplainVisual({ steps, active, reduced }) {
  return (
    <ol className="e-why__explain">
      {steps.map((step, index) => (
        <motion.li
          key={step}
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          animate={active || reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : index * 0.14, ease: EASE }}
        >
          {step}
        </motion.li>
      ))}
    </ol>
  );
}

function FilesVisual({ years, active, reduced }) {
  return (
    <div className="e-why__files">
      {years.map((year, index) => (
        <motion.span
          key={year}
          initial={reduced ? { opacity: 1, x: 0, rotate: 0 } : { opacity: 0, x: -14, rotate: -4 }}
          animate={
            active || reduced
              ? { opacity: 1, x: 0, rotate: 0 }
              : { opacity: 0, x: -14, rotate: -4 }
          }
          transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : index * 0.11, ease: EASE }}
        >
          {year}
        </motion.span>
      ))}
    </div>
  );
}

function ChecklistVisual({ items, active, reduced }) {
  return (
    <ul className="e-why__check">
      {items.map((item, index) => (
        <motion.li
          key={item}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={active || reduced ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : index * 0.15, ease: EASE }}
        >
          <span aria-hidden="true">
            <Check size={11} strokeWidth={3} />
          </span>
          {item}
        </motion.li>
      ))}
    </ul>
  );
}

function TileVisual({ item, trust, doctors, branches, active, reduced }) {
  switch (item.visual) {
    case "team":
      return <TeamVisual doctors={doctors} active={active} reduced={reduced} />;
    case "scan":
      return <ScanVisual active={active} reduced={reduced} />;
    case "map":
      return <MapVisual branches={branches} active={active} reduced={reduced} />;
    case "explain":
      return <ExplainVisual steps={trust.explainSteps} active={active} reduced={reduced} />;
    case "files":
      return <FilesVisual years={trust.filesYears} active={active} reduced={reduced} />;
    case "checklist":
      return <ChecklistVisual items={trust.checklist} active={active} reduced={reduced} />;
    default:
      return null;
  }
}

/* The tile owns the in-view trigger and hands it to its visual, the same way
   an ImpactStats card does - watching the visual itself would start it while
   only the top edge of a tall tile had crossed the fold. The visual plays
   again each time the reader comes back to the tile, keyed on the `round`
   so it restarts from its first frame while the tile is off screen. */
function WhyTile({ item, index, trust, doctors, branches, reduced, deck }) {
  const tileRef = useRef(null);
  const { inView, round } = useInViewReplay(tileRef, 0.4);
  const arrival = useInViewReplay(tileRef, 0.3);
  const active = inView || reduced;
  /* Where the scroll drives the tile's arrival (landing.css), framer's
     entrance stands down so the two never move the tile at once. In the deck
     the card's own travel is the arrival: a card fading in over the one it
     covers would show that card through it. */
  const entrance =
    reduced || SCROLL_DRIVEN || deck
      ? {}
      : cardEntrance(arrival.inView, {
          index,
          distance: 24,
          duration: 0.65,
          stagger: 0.07,
          ease: EASE,
        });

  return (
    <motion.li
      className="e-why__tile"
      data-tone={item.tone}
      ref={tileRef}
      style={{ "--i": index }}
      {...entrance}
    >
      <span className="e-why__icon" aria-hidden="true">
        {createElement(getIcon(item.icon), { size: 22 })}
      </span>
      <h3 className="e-why__title">
        <span className="e-why__num" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>{" "}
        {item.title}
      </h3>
      <p className="e-why__text">{item.description}</p>
      {item.visual ? (
        <div className="e-why__visual" key={round}>
          <TileVisual
            item={item}
            trust={trust}
            doctors={doctors}
            branches={branches}
            active={active}
            reduced={reduced}
          />
        </div>
      ) : null}
      {item.meta ? <span className="e-why__meta">{item.meta}</span> : null}
    </motion.li>
  );
}

export default function WhyChooseUs({ trust, doctors, branches }) {
  const shouldReduceMotion = useReducedMotion();
  const listRef = useRef(null);
  const upright = useSyncExternalStore(
    subscribeToDeck,
    () => window.matchMedia(DECK_QUERY).matches,
    () => false,
  );
  /* Under reduced motion the same cards are a plain column: nothing slides
     over anything, the journey stage's rule for a pinned scene. */
  const deck = upright && !shouldReduceMotion;
  useDeck(listRef, deck);

  return (
    <section className="e-sec e-sec--paper e-why" aria-labelledby="e-why-title">
      <div className="e-shell">
        <div className="e-head e-head--wide">
          <span className="e-label">{trust.eyebrow}</span>
          <div className="e-head__body">
            <h2 className="e-h2" id="e-why-title">
              {trust.title}
            </h2>
          </div>
        </div>

        <ul className="e-why__grid" ref={listRef} data-deck={deck ? "" : undefined}>
          {trust.items.map((item, index) => (
            <WhyTile
              key={item.title}
              item={item}
              index={index}
              trust={trust}
              doctors={doctors}
              branches={branches}
              reduced={shouldReduceMotion}
              deck={deck}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
