import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "../components/CountUp";
import { buildBranchHref } from "../lib/contact";
import { getInitials } from "../lib/doctorsData";
import { SCROLL_DRIVEN, cardEntrance, useInViewReplay } from "../lib/motion";

const EASE = [0.32, 0.72, 0, 1];

/* Where the four cards are a rail - a phone, or a phone held sideways. Must
   match the rail's media query in landing.css. The rail is the same four
   cards in the same list, laid out by CSS; all this decides is that a card
   in the rail takes no framer entrance (see StatCard) and that a tap on a
   card waiting at the edge brings it in. */
const RAIL_QUERY = "(max-width: 620px), (max-width: 1023px) and (max-height: 520px)";

function subscribeToRail(callback) {
  const query = window.matchMedia(RAIL_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const twoDigits = (value) => String(value).padStart(2, "0");

/* Where the rail rests on each card: the card's own start, or the end of the
   rail for a card that cannot reach its start. Layout offsets, so a card
   that is scaled or mid-arrival reads the same. */
function railStops(rail) {
  const cards = Array.from(rail.children);
  const inset = cards[0]?.offsetLeft ?? 0;
  const end = rail.scrollWidth - rail.clientWidth;
  return cards.map((card) => Math.min(card.offsetLeft - inset, end));
}

/* The rail is the single source of truth for which card is on screen: the
   arrows only scroll it, and it reports back, so a swipe and a press can
   never disagree. How far along it is goes straight to the pager's track as
   a custom property on every frame - it is a measurement of the scroller,
   not render state - and only a change of card re-renders. On a wide screen
   the list is a grid with nothing to scroll, and none of this runs. */
function useRail(reduced) {
  const railRef = useRef(null);
  const pagerRef = useRef(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    let frame = 0;

    const read = () => {
      frame = 0;
      const end = rail.scrollWidth - rail.clientWidth;
      if (end <= 1) return;
      const left = rail.scrollLeft;
      const share = Math.min(Math.max(left / end, 0), 1);
      pagerRef.current?.style.setProperty("--impact-at", share.toFixed(4));
      const stops = railStops(rail);
      let nearest = 0;
      stops.forEach((stop, position) => {
        if (Math.abs(stop - left) <= Math.abs(stops[nearest] - left)) nearest = position;
      });
      setIndex(nearest);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };

    rail.addEventListener("scroll", schedule, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(rail);
    return () => {
      rail.removeEventListener("scroll", schedule);
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const go = (next) => {
    const rail = railRef.current;
    if (!rail) return;
    const stops = railStops(rail);
    const target = stops[Math.min(Math.max(next, 0), stops.length - 1)];
    rail.scrollTo({ left: target, behavior: reduced ? "auto" : "smooth" });
  };

  return { railRef, pagerRef, index, go };
}

function MixVisual({ mix, active, reduced }) {
  return (
    <ul className="e-impact__mix">
      {mix.map((row, index) => (
        <li key={row.name}>
          <span className="e-impact__mixName">{row.name}</span>
          <span className="e-impact__track">
            <motion.span
              className="e-impact__fill"
              initial={{ width: reduced ? `${row.share}%` : "0%" }}
              animate={{ width: active || reduced ? `${row.share}%` : "0%" }}
              transition={{
                duration: reduced ? 0 : 0.9,
                delay: reduced ? 0 : 0.15 + index * 0.12,
                ease: EASE,
              }}
            />
          </span>
          <span className="e-impact__mixShare">{row.share}%</span>
        </li>
      ))}
    </ul>
  );
}

/* The drawing scales on both axes to whatever box the plot is given
   (preserveAspectRatio none, strokes that do not scale with it), so the end
   dot is HTML to stay round, and the line is revealed by a wipe rather than a
   pathLength draw, which does not survive a non-scaling stroke. */
function TrendVisual({ trend, active, reduced }) {
  const width = 240;
  const height = 74;
  const inset = 5;
  const span = width - inset * 2;
  const step = span / (trend.points.length - 1);
  const coords = trend.points.map((point, index) => [
    inset + index * step,
    height - (point / 100) * (height - 12) - 6,
  ]);
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `${line} L${width - inset} ${height} L${inset} ${height} Z`;
  const [lastX, lastY] = coords[coords.length - 1];
  const shown = active || reduced;
  const drawn = "inset(0% 0% 0% 0%)";
  const hidden = "inset(0% 100% 0% 0%)";

  return (
    <div className="e-impact__trend">
      <p className="e-impact__caption">{trend.caption}</p>
      <div className="e-impact__plot" role="img" aria-label={trend.caption}>
        <motion.svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          initial={{ clipPath: reduced ? drawn : hidden }}
          animate={{ clipPath: shown ? drawn : hidden }}
          transition={{ duration: reduced ? 0 : 1.2, delay: reduced ? 0 : 0.2, ease: EASE }}
        >
          <path d={area} className="e-impact__area" />
          <path d={line} className="e-impact__line" />
        </motion.svg>
        <motion.span
          className="e-impact__dot"
          style={{ left: `${(lastX / width) * 100}%`, top: `${(lastY / height) * 100}%` }}
          initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.4 }}
          animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : 0.4 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 1.2, ease: EASE }}
        />
      </div>
      <div className="e-impact__axis">
        <span>{trend.startLabel}</span>
        <span>{trend.endLabel}</span>
      </div>
    </div>
  );
}

function PeopleVisual({ people, extra, active, reduced }) {
  const shown = active || reduced;

  return (
    <ul className="e-impact__people">
      {people.map((person, index) => (
        <motion.li
          key={person.name}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 12 }}
          transition={{
            duration: reduced ? 0 : 0.55,
            delay: reduced ? 0 : 0.15 + index * 0.13,
            ease: EASE,
          }}
        >
          <span className="e-impact__avatar" aria-hidden="true">
            {getInitials(person.name)}
          </span>
          <span className="e-impact__personBody">
            <strong>{person.name}</strong>
            <em>{person.specialty}</em>
          </span>
        </motion.li>
      ))}
      {extra > 0 ? <li className="e-impact__more">+{extra} more across our branches</li> : null}
    </ul>
  );
}

function BranchVisual({ branches, active, reduced }) {
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    if (!active || reduced || branches.length < 2) return undefined;
    const timer = setInterval(() => {
      setHighlighted((current) => (current + 1) % branches.length);
    }, 1900);
    return () => clearInterval(timer);
  }, [active, reduced, branches.length]);

  return (
    <ul className="e-impact__branches">
      {branches.map((branch, index) => (
        <li key={branch.slug}>
          <Link
            className="e-impact__chip"
            data-active={index === highlighted ? "true" : "false"}
            to={buildBranchHref(branch)}
          >
            <MapPin size={13} aria-hidden="true" />
            {branch.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* The card - not the number - owns the in-view trigger. Watching the small
   figure instead meant a card could start counting while only its top edge
   had crept over the fold on a phone, so the count was finished before the
   card was actually readable. The count and the visual play again every time
   the reader comes back to the card: each return is a new `round`, and the
   two are keyed on it so they start again from zero, off screen. */
function StatCard({ card, index, renderVisual, reduced, inRail, onReach }) {
  const cardRef = useRef(null);
  const { inView, round } = useInViewReplay(cardRef, 0.45);
  const arrival = useInViewReplay(cardRef, 0.2);
  const active = inView || reduced;
  /* Where the scroll drives the card's arrival (landing.css), framer's
     entrance stands down so the two never move the card at once. In the
     rail it stands down as well: a card waiting a swipe away shows a sliver
     of itself, and an entrance that waits for a fifth of the card would
     leave that sliver - the one thing saying there is more - blank. */
  const entrance =
    reduced || SCROLL_DRIVEN || inRail
      ? {}
      : cardEntrance(arrival.inView, {
          index,
          distance: 26,
          duration: 0.7,
          stagger: 0.09,
          ease: EASE,
        });

  return (
    <motion.li
      className="e-impact__card"
      data-visual={card.visual}
      ref={cardRef}
      onClick={onReach}
      {...entrance}
    >
      <span className="e-impact__kicker">{card.kicker}</span>
      <p className="e-impact__figure">
        <CountUp key={round} value={card.value} suffix={card.suffix} start={active} />
      </p>
      <h3 className="e-impact__label">{card.label}</h3>
      <p className="e-impact__desc">{card.description}</p>
      <div className="e-impact__visual" key={round}>
        {renderVisual(card, active)}
      </div>
    </motion.li>
  );
}

/* The rail's foot on a phone: where the reader is, how far the rail runs,
   and a press for anyone who would rather not swipe. Rendered at every
   width and shown by CSS only where the cards are a rail, so the page is
   one markup on every device. An arrow at its end is dimmed rather than
   disabled, because a disabled button drops the focus it was holding. */
function RailPager({ pagerRef, index, total, onStep, labels, controls }) {
  const atStart = index === 0;
  const atEnd = index === total - 1;

  return (
    <div className="e-impact__pager" ref={pagerRef} style={{ "--impact-n": total }}>
      <span className="e-impact__count" aria-hidden="true">
        <b>{twoDigits(index + 1)}</b>
        <span>/ {twoDigits(total)}</span>
      </span>
      <span className="e-impact__bar" aria-hidden="true">
        <span />
      </span>
      <span className="e-impact__steps">
        <button
          type="button"
          className="e-impact__step"
          aria-label={labels.previous}
          aria-controls={controls}
          aria-disabled={atStart}
          onClick={() => (atStart ? undefined : onStep(index - 1))}
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="e-impact__step"
          aria-label={labels.next}
          aria-controls={controls}
          aria-disabled={atEnd}
          onClick={() => (atEnd ? undefined : onStep(index + 1))}
        >
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </span>
    </div>
  );
}

export default function ImpactStats({ impact, counts, branches, doctors }) {
  const shouldReduceMotion = useReducedMotion();
  const inRail = useSyncExternalStore(
    subscribeToRail,
    () => window.matchMedia(RAIL_QUERY).matches,
    () => false,
  );
  const { railRef, pagerRef, index, go } = useRail(shouldReduceMotion);
  const cards = impact.cards.map((card) =>
    card.count ? { ...card, value: counts[card.count] } : card,
  );
  const visuals = {
    mix: (card, active) => (
      <MixVisual mix={card.mix} active={active} reduced={shouldReduceMotion} />
    ),
    trend: (card, active) => (
      <TrendVisual trend={card.trend} active={active} reduced={shouldReduceMotion} />
    ),
    people: (card, active) => (
      <PeopleVisual
        people={doctors.slice(0, 3)}
        extra={Math.max(doctors.length - 3, 0)}
        active={active}
        reduced={shouldReduceMotion}
      />
    ),
    branches: (card, active) => (
      <BranchVisual branches={branches} active={active} reduced={shouldReduceMotion} />
    ),
  };
  const renderVisual = (card, active) => visuals[card.visual]?.(card, active);

  return (
    <section className="e-sec e-sec--paper e-impact" aria-labelledby="e-impact-title">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{impact.eyebrow}</span>
          <div className="e-head__body">
            <h2 className="e-h2 e-impact__title" id="e-impact-title">
              <span className="e-impact__gu" lang="gu">
                {impact.titleGujarati}
              </span>{" "}
              <span className="e-impact__tagline">
                {impact.tagline}{" "}
                <span className="e-impact__taglineAccent">{impact.taglineAccent}</span>
              </span>
            </h2>
          </div>
        </div>

        {/* One list at every width: a grid of four on a laptop, two by two on
            a tablet, and on a phone a rail the reader swipes - the same
            cards, laid out by CSS (landing.css), so nothing is rebuilt when
            the page is adopted and no device gets a lesser section. */}
        <ul className="e-impact__grid" id="e-impact-cards" ref={railRef}>
          {cards.map((card, position) => (
            <StatCard
              key={card.id}
              card={card}
              index={position}
              renderVisual={renderVisual}
              reduced={shouldReduceMotion}
              inRail={inRail}
              /* A tap on the card waiting at the edge brings it in: its
                 shoulder is what the thumb is nearest. The arrows are the
                 control a keyboard and a screen reader use. */
              onReach={inRail && position !== index ? () => go(position) : undefined}
            />
          ))}
        </ul>

        <RailPager
          pagerRef={pagerRef}
          index={index}
          total={cards.length}
          onStep={go}
          labels={{ previous: impact.previousLabel, next: impact.nextLabel }}
          controls="e-impact-cards"
        />

        {/* Both ways on are in the page and CSS shows one. Under the rail it
            is the hospitals: the hero's booking button is a screen above,
            the header carries its own, and the services index under this
            band answers "how we treat". */}
        <p className="e-impact__nearest">
          <Link className="e-link" to="/branches">
            {impact.nearestLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
        <div className="e-impact__actions">
          <Link className="e-btn" to={impact.actions.primary.href}>
            {impact.actions.primary.label}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link className="e-btn e-btn--outline" to={impact.actions.secondary.href}>
            {impact.actions.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
