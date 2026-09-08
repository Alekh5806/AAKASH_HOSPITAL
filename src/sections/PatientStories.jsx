import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MapPin, Pause, Play, Quote } from "lucide-react";

const PHONE_QUERY = "(max-width: 760px)";
/* Seconds a card takes to travel its own width on the desktop drift, about
   42px a second. */
const SECONDS_PER_CARD = 7.5;
/* The second row runs slightly slower than the first. Two rows at one speed
   drift as a fixed pair and the wall reads as a single block sliding past;
   a small difference keeps the pattern from ever repeating. */
const SECOND_ROW_SCALE = 1.18;
/* How long a phone card is held still before the rail advances. A 17-word
   quote takes four to five seconds to read, and this site is read by older
   patients - do not shorten it to make the section feel livelier. */
const PHONE_HOLD_MS = 5000;

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

/* The theme leads the card rather than closing it: on a wall that moves, the
   reader picks what to read from the tag and only then commits to the quote.
   The branch closes the card because it answers a different question - which
   hospital this was - and that one is worth a sentence-case line rather than a
   second tracked uppercase label competing with the tag. */
function VoiceCard({ item, echo }) {
  return (
    <li className="e-voices__card" aria-hidden={echo ? "true" : undefined}>
      <div className="e-voices__top">
        <span className="e-voices__theme">{item.theme}</span>
        <Quote className="e-voices__mark" size={18} aria-hidden="true" />
      </div>
      <blockquote className="e-voices__quote">{item.quote}</blockquote>
      <footer className="e-voices__meta">
        <MapPin size={14} aria-hidden="true" />
        {item.location}
      </footer>
    </li>
  );
}

/* One card advance every PHONE_HOLD_MS. The set is duplicated here as well, so
   the wrap is a silent scrollLeft correction onto identical content rather
   than a whip back across eight cards. */
function useAutoAdvance(rowRef, active) {
  useEffect(() => {
    if (!active) return undefined;

    const step = () => {
      const row = rowRef.current;
      const track = row?.firstElementChild;
      const card = track?.firstElementChild;
      if (!row || !card) return;

      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const stride = card.getBoundingClientRect().width + gap;
      const setWidth = stride * (track.children.length / 2);
      if (!stride) return;

      if (row.scrollLeft >= setWidth - 1) {
        row.scrollLeft -= setWidth;
      }
      row.scrollBy({ left: stride, behavior: "smooth" });
    };

    const timer = setInterval(step, PHONE_HOLD_MS);
    return () => clearInterval(timer);
  }, [rowRef, active]);
}

function VoicesRow({ items, reverse, paused, mode, secondsPerCard }) {
  const rowRef = useRef(null);
  const duration = Math.round(items.length * secondsPerCard * (reverse ? SECOND_ROW_SCALE : 1));
  const loops = mode === "static" ? 1 : 2;

  useAutoAdvance(rowRef, mode === "step" && !paused);

  return (
    <div className="e-voices__row" data-mode={mode} ref={rowRef}>
      <ul
        className="e-voices__track"
        data-reverse={reverse ? "true" : undefined}
        data-paused={paused ? "true" : undefined}
        style={mode === "drift" ? { "--voices-duration": `${duration}s` } : undefined}
      >
        {items.map((item) => (
          <VoiceCard item={item} key={item.theme} />
        ))}
        {loops === 2
          ? items.map((item) => <VoiceCard item={item} echo key={`${item.theme}-echo`} />)
          : null}
      </ul>
    </div>
  );
}

export default function PatientStories({ testimonials, voices }) {
  const shouldReduceMotion = useReducedMotion();
  const isPhone = usePhoneVariant();
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);

  /* Three behaviours, one per device and preference, because a phone cannot
     read a wall that never stops. `drift` is the continuous marquee, and it
     only works where three or four cards are on screen at once and most of
     them are whole. On a phone one card fills the width, so a card would be
     completely readable for about half a second in every ten; `step` holds
     each quote still long enough to read, then advances one card, and stays
     swipeable throughout. `static` drops the movement altogether. */
  const mode = shouldReduceMotion ? "static" : isPhone ? "step" : "drift";
  const half = Math.ceil(testimonials.length / 2);
  /* One row on a phone so the section stays a single band of the screen, two on
     wider screens where a lone row of cards leaves the width looking empty.
     Both rows carry every quote rather than half each: the drift translates the
     track by exactly one set, so a set narrower than the viewport would open a
     gap at the trailing edge on a wide monitor. The second row starts halfway
     through the list and travels the other way, which is what keeps the two
     rows from reading as one repeated strip. */
  const rows = isPhone
    ? [testimonials]
    : [testimonials, [...testimonials.slice(half), ...testimonials.slice(0, half)]];

  const stopped = paused || held;

  return (
    <section className="e-sec e-sec--dark e-voices" aria-labelledby="e-voices-title">
      <div className="e-shell">
        <div className="e-head e-head--wide">
          <div className="e-voices__labels">
            <span className="e-label">{voices.eyebrow}</span>
            <span className="e-voices__note">{voices.note}</span>
          </div>
          <div className="e-head__body">
            <h2 className="e-h2" id="e-voices-title">
              {voices.title}
            </h2>
            <p className="e-lede">{voices.lede}</p>
          </div>
        </div>
      </div>

      {/* A pointer resting on the wall stops it. CSS :hover covers that on a
          mouse, but a finger gets no hover at all, and holding a quote still
          is exactly what a reader does when they want to finish reading it -
          on the phone rail it also keeps the rail from advancing out from
          under a swipe. */}
      <div
        className="e-voices__rows"
        data-mode={mode}
        onPointerDown={() => setHeld(true)}
        onPointerUp={() => setHeld(false)}
        onPointerCancel={() => setHeld(false)}
        onPointerLeave={() => setHeld(false)}
      >
        {rows.map((rowItems, index) => (
          <VoicesRow
            items={rowItems}
            key={index === 0 ? "row-a" : "row-b"}
            reverse={index === 1}
            paused={stopped}
            mode={mode}
            secondsPerCard={SECONDS_PER_CARD}
          />
        ))}
      </div>

      {mode === "static" ? null : (
        <div className="e-shell e-voices__foot">
          <button
            type="button"
            className="e-voices__toggle"
            onClick={() => setPaused((value) => !value)}
            aria-pressed={paused}
          >
            {paused ? (
              <Play size={15} aria-hidden="true" />
            ) : (
              <Pause size={15} aria-hidden="true" />
            )}
            {paused ? "Play quotes" : "Pause quotes"}
          </button>
        </div>
      )}
    </section>
  );
}
