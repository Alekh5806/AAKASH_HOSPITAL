import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";
import { MapPin, Pause, Play, Quote } from "lucide-react";

/* A phone held sideways is still a phone: two drifting rows of cards are
   taller than its screen, and a finger gets no hover to stop them. */
const PHONE_QUERY = "(max-width: 760px), (max-width: 1023px) and (max-height: 520px)";
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

const MOUSE_QUERY = "(hover: hover) and (pointer: fine)";

/* Read before the first paint rather than in an effect, so a phone never
   renders the two-row desktop wall for a frame and then swaps it out. */
function mediaStore(query) {
  return {
    subscribe(onChange) {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    read: () => window.matchMedia(query).matches,
  };
}

const phoneStore = mediaStore(PHONE_QUERY);
const mouseStore = mediaStore(MOUSE_QUERY);

function useMedia(store) {
  return useSyncExternalStore(store.subscribe, store.read, () => false);
}

const keyOf = (item) => `${item.branch}-${item.theme}`;

/* The theme leads the card rather than closing it: on a wall that moves, the
   reader picks what to read from the tag and only then commits to the quote.
   The branch closes the card because it answers a different question - which
   hospital this was - and that one is worth a sentence-case line rather than a
   second tracked uppercase label competing with the tag. */
function VoiceCard({ item, place, echo }) {
  return (
    <li className="e-voices__card" aria-hidden={echo ? "true" : undefined}>
      <div className="e-voices__top">
        <span className="e-voices__theme">{item.theme}</span>
        <Quote className="e-voices__mark" size={18} aria-hidden="true" />
      </div>
      <blockquote className="e-voices__quote">{item.quote}</blockquote>
      <footer className="e-voices__meta">
        <MapPin size={14} aria-hidden="true" />
        {place(item)}
      </footer>
    </li>
  );
}

/* One card's stride on a rail: its width plus the track's gap. */
function strideOf(row) {
  const track = row.firstElementChild;
  const card = track?.firstElementChild;
  if (!card) return 0;
  return card.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
}

/* Moves the phone rail on by one card. The set is duplicated, so reaching
   the end of the first set is a silent scrollLeft correction onto identical
   content rather than a whip back across eight cards. */
function advance(row) {
  const stride = strideOf(row);
  if (!stride) return;
  const setWidth = stride * (row.firstElementChild.children.length / 2);
  if (row.scrollLeft >= setWidth - 1) row.scrollLeft -= setWidth;
  row.scrollBy({ left: stride, behavior: "smooth" });
}

/* One segment per quote: those already read are full, the one on screen
   fills while it is held, the rest are empty. Under reduced motion nothing
   advances, so the segment on screen is simply full. */
function paintStory(bar, clock, live) {
  [...bar.children].forEach((segment, index) => {
    let fill = 0;
    if (index < clock.current) fill = 1;
    else if (index === clock.current) fill = live ? clock.elapsed / PHONE_HOLD_MS : 1;
    segment.style.setProperty("--fill", fill.toFixed(4));
  });
}

/* The phone rail's clock, shown as the story bar under it. A quote is held
   for PHONE_HOLD_MS from the moment the rail arrives on it, then the rail
   advances one card. The rail is the single source of truth for which quote
   is on screen - a swipe and an advance land the same way - and a new quote
   always starts a full hold. Pausing, or a finger resting on the wall,
   freezes the clock where it is rather than starting it again, and the bar
   stops with it. Everything is written to the DOM, never to state: it moves
   every frame. */
function useStoryRail(rowsRef, barRef, total, { enabled, live, running }) {
  const clockRef = useRef({ current: -1, elapsed: 0, waiting: 0 });

  useEffect(() => {
    const row = rowsRef.current?.firstElementChild;
    const bar = barRef.current;
    if (!enabled || !row || !bar) return undefined;

    const clock = clockRef.current;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const stride = strideOf(row);
      if (!stride) return;
      const index = Math.round(row.scrollLeft / stride) % total;
      if (index !== clock.current) {
        clock.current = index;
        clock.elapsed = 0;
        clock.waiting = 0;
      }
      paintStory(bar, clock, live);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    sync();
    row.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      row.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [rowsRef, barRef, total, enabled, live]);

  useEffect(() => {
    const row = rowsRef.current?.firstElementChild;
    const bar = barRef.current;
    if (!enabled || !running || !row || !bar) return undefined;

    const clock = clockRef.current;
    let frame = 0;
    let last = 0;

    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      const delta = last ? Math.min(now - last, 100) : 0;
      last = now;
      /* Asked to advance and still on the same quote: wait for the rail,
         and give up waiting if it never moved. */
      if (clock.waiting) {
        if (now - clock.waiting > 1600) {
          clock.waiting = 0;
          clock.elapsed = 0;
        }
        return;
      }
      clock.elapsed = Math.min(clock.elapsed + delta, PHONE_HOLD_MS);
      bar.children[clock.current]?.style.setProperty(
        "--fill",
        (clock.elapsed / PHONE_HOLD_MS).toFixed(4),
      );
      if (clock.elapsed >= PHONE_HOLD_MS) {
        clock.waiting = now;
        advance(row);
      }
    };
    const start = () => {
      if (frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    /* The clock only runs while the wall is on screen, so a quote is never
       advanced past unseen and nothing ticks for a reader further down. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0.35 },
    );
    observer.observe(row);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [rowsRef, barRef, enabled, running]);
}

/* How many copies of a row's set its track carries. The drift moves the
   track by exactly one set and then starts again, so everything to the right
   of the window has to be track at every moment of the loop - three sets hold
   that on a 2560px monitor with six cards to a row, and leave room for the
   row's scroll-linked slide as it arrives (the end of landing.css). The phone
   rail keeps two: its silent wrap jumps back by one set. */
const LOOPS = { drift: 3, step: 2, static: 1 };

function VoicesRow({ items, reverse, paused, mode, place }) {
  const loops = LOOPS[mode];
  const duration = Math.round(items.length * SECONDS_PER_CARD * (reverse ? SECOND_ROW_SCALE : 1));

  return (
    <div className="e-voices__row" data-mode={mode}>
      <ul
        className="e-voices__track"
        data-reverse={reverse ? "true" : undefined}
        data-paused={paused ? "true" : undefined}
        style={
          mode === "drift"
            ? { "--voices-duration": `${duration}s`, "--voices-loops": loops }
            : undefined
        }
      >
        {Array.from({ length: loops }, (_, copy) =>
          items.map((item) => (
            <VoiceCard
              item={item}
              place={place}
              echo={copy > 0}
              key={copy ? `${keyOf(item)}-${copy}` : keyOf(item)}
            />
          )),
        )}
      </ul>
    </div>
  );
}

export default function PatientStories({ testimonials, voices }) {
  const shouldReduceMotion = useReducedMotion();
  const isPhone = useMedia(phoneStore);
  const hasMouse = useMedia(mouseStore);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const rowsRef = useRef(null);
  const barRef = useRef(null);

  /* Three behaviours, one per device and preference, because a phone cannot
     read a wall that never stops. `drift` is the continuous marquee, and it
     only works where three or four cards are on screen at once and most of
     them are whole. On a phone one card fills the width, so a card would be
     completely readable for about half a second in every ten; `step` holds
     each quote still long enough to read, then advances one card, and stays
     swipeable throughout. `static` drops the movement altogether. */
  const mode = shouldReduceMotion ? "static" : isPhone ? "step" : "drift";
  /* Under reduced motion a mouse gets every quote in a grid instead of two
     rails: a rail that does not move has to be scrolled sideways, and a mouse
     has no easy way to do that. A finger swipes, so phones and tablets keep
     their rails - a grid is six rows tall on a tablet. */
  const grid = mode === "static" && !isPhone && hasMouse;
  const half = Math.ceil(testimonials.length / 2);
  /* One row on a phone so the section stays a single band of the screen, two on
     wider screens where a lone row of cards leaves the width looking empty.
     Each row carries its own half of the list. They used to carry every quote
     each, and with the rows drifting past each other the same card was on
     screen twice at once - on a 2560px monitor, every card. The list is written
     so that each half holds one theme from every hospital (testimonials.json),
     so both rows visit all six. */
  const rows = isPhone ? [testimonials] : [testimonials.slice(0, half), testimonials.slice(half)];
  const place = (item) => voices.hospitalLabel.replace("{hospital}", item.hospital);
  /* The hospitals the wall actually quotes, in the list's own order - so the
     note can never name a hospital with no card on the wall. */
  const hospitals = new Intl.ListFormat("en-GB").format([
    ...new Set(testimonials.map((item) => item.hospital)),
  ]);

  const stopped = paused || held;

  useStoryRail(rowsRef, barRef, testimonials.length, {
    enabled: isPhone,
    live: mode === "step",
    running: mode === "step" && !stopped,
  });

  return (
    <section className="e-sec e-sec--dark e-voices" aria-labelledby="e-voices-title">
      <div className="e-shell">
        <div className="e-head e-head--wide">
          <div className="e-voices__labels">
            <span className="e-label">{voices.eyebrow}</span>
            <span className="e-voices__note">{voices.note.replace("{hospitals}", hospitals)}</span>
          </div>
          <div className="e-head__body">
            <h2 className="e-h2" id="e-voices-title">
              {voices.title}
            </h2>
            <p className="e-lede">{voices.lede}</p>
          </div>
        </div>
      </div>

      {grid ? (
        <div className="e-shell">
          <ul className="e-voices__grid">
            {testimonials.map((item) => (
              <VoiceCard item={item} place={place} key={keyOf(item)} />
            ))}
          </ul>
        </div>
      ) : (
        /* A pointer resting on the wall stops it. CSS :hover covers that on a
           mouse, but a finger gets no hover at all, and holding a quote still
           is exactly what a reader does when they want to finish reading it -
           on the phone rail it also keeps the rail from advancing out from
           under a swipe. */
        <div
          className="e-voices__rows"
          data-mode={mode}
          ref={rowsRef}
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
              place={place}
            />
          ))}
        </div>
      )}

      {mode === "static" && !isPhone ? null : (
        <div className="e-shell e-voices__foot">
          {/* The phone's story bar: one segment per quote, the one on screen
              filling while it is held. It is the rail's clock made visible,
              so a reader sees the next quote coming rather than having the
              card move out from under them. */}
          {isPhone ? (
            <div className="e-voices__story" ref={barRef} aria-hidden="true">
              {testimonials.map((item) => (
                <span key={keyOf(item)} />
              ))}
            </div>
          ) : null}
          {mode === "static" ? null : (
            <button
              type="button"
              className="e-voices__toggle"
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
            >
              {/* Solid glyphs, as on the hero's control: outlined, the pause
                  sign read as two hollow boxes at this size. */}
              {paused ? (
                <Play size={15} fill="currentColor" aria-hidden="true" />
              ) : (
                <Pause size={15} fill="currentColor" aria-hidden="true" />
              )}
              <span className="e-voices__toggleLabel">
                {paused ? voices.playLabel : voices.pauseLabel}
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
