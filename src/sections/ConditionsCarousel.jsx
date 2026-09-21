import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategoryLabel } from "../lib/servicesData";

/* Where the picker becomes a rail. Above it the wheel and the stage sit side
   by side; below it every service is a card in a scroll-snap rail, the
   reference's phone layout. Decided in JS rather than CSS because the two
   shapes carry different roles - tabs beside a tab panel, and a list - and a
   role="tab" that is display: none is a lie to a screen reader. */
const WIDE_QUERY = "(min-width: 1024px)";

/* One slot of the wheel. Must equal --cond-item in landing.css: the drum's
   height and its padding are built from it there, and the roll offset here. */
const ITEM_HEIGHT = 76;

/* The wheel's roll. Stiff enough to settle inside a second, soft enough that
   a long jump (01 to 11) reads as the drum turning rather than snapping. */
const ROLL_SPRING = { type: "spring", stiffness: 210, damping: 30, mass: 1 };

/* How far down the drum starts, in slots, before it rolls into place the
   first time the wheel is seen - the one unasked-for move here, and it is
   what tells the reader this is a wheel and not a list. */
const ARRIVE_SLOTS = 1.5;

function subscribeToWide(callback) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

const clampIndex = (index, count) => Math.min(Math.max(index, 0), count - 1);

const pad = (index) => String(index + 1).padStart(2, "0");

/* The eleven services as a picker - one wheel of names beside one photograph -
 * after the "Centres of Excellence" reference: on a wide screen the reader
 * rolls a drum of service names and the stage answers with that service's
 * photograph and a card; on a phone the same eleven are a rail of cards, each
 * a photograph with a white card overlapping its foot.
 *
 * Nothing here is written for this section but the one-line headline per
 * service in home.json. The name, photograph, icon and sentence are the
 * service's own, read through getTreatedConditions(), so a service renamed or
 * re-shot in services.json changes here without a second edit.
 */
export default function ConditionsCarousel({ conditions, items }) {
  const shouldReduceMotion = useReducedMotion();
  const wide = useSyncExternalStore(
    subscribeToWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );
  const [active, setActive] = useState(0);

  const choose = useCallback(
    (index) => setActive(clampIndex(index, items.length)),
    [items.length],
  );

  if (items.length === 0) return null;

  return (
    <section className="e-sec e-cond" aria-labelledby="e-cond-title">
      <div className="e-shell">
        <header className="e-cond__head">
          <span className="e-label">{conditions.eyebrow}</span>
          <h2 className="e-h2" id="e-cond-title">
            {conditions.title}
          </h2>
          <p className="e-lede">{conditions.tagline}</p>
        </header>
      </div>

      {wide ? (
        <div className="e-shell">
          <Picker
            items={items}
            labels={conditions}
            active={active}
            onChoose={choose}
            reduceMotion={shouldReduceMotion}
          />
        </div>
      ) : (
        <Rail
          items={items}
          labels={conditions}
          active={active}
          onChoose={choose}
          reduceMotion={shouldReduceMotion}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ wide -- */

function Picker({ items, labels, active, onChoose, reduceMotion }) {
  const baseId = useId();
  const wheelRef = useRef(null);
  const tabRefs = useRef([]);
  const offset = useMotionValue(-active * ITEM_HEIGHT + ARRIVE_SLOTS * ITEM_HEIGHT);
  const inView = useInView(wheelRef, { once: true, amount: 0.5 });
  const count = items.length;

  /* Every stage photograph that has been asked for stays mounted, so rolling
     back to a service the reader has already seen is instant. The set only
     ever grows inside the choose handler - never in an effect. */
  const neighbours = (index) =>
    [index - 1, index, index + 1].filter((near) => near >= 0 && near < count);
  const [requested, setRequested] = useState(() => new Set(neighbours(active)));
  const [under, setUnder] = useState(null);

  const choose = (index) => {
    const next = clampIndex(index, count);
    if (next === active) return;
    setUnder(active);
    setRequested((previous) => new Set([...previous, ...neighbours(next)]));
    onChoose(next);
  };

  /* Each name's distance from the centre slot, in slots, written straight to
     the DOM on every frame of the roll. The CSS turns --d into size, weight
     and fade, so the whole drum moves as one and never re-renders to do it. */
  const paint = useCallback((value) => {
    tabRefs.current.forEach((element, index) => {
      if (!element) return;
      const distance = Math.abs(index * ITEM_HEIGHT + value) / ITEM_HEIGHT;
      element.style.setProperty("--d", Math.min(distance, 3).toFixed(3));
    });
  }, []);

  useMotionValueEvent(offset, "change", paint);

  /* The first paint is explicit: a value that does not change fires no change
     event, and without it every name would sit at --d 0, the chosen size.
     The drum holds its arrival offset until the wheel is on screen, so the
     roll-in is seen rather than spent above the fold. */
  useEffect(() => {
    const target = -active * ITEM_HEIGHT;
    if (reduceMotion) {
      offset.jump(target);
      paint(target);
      return undefined;
    }
    paint(offset.get());
    if (!inView) return undefined;
    const controls = animate(offset, target, ROLL_SPRING);
    return () => controls.stop();
  }, [active, inView, offset, paint, reduceMotion]);

  const onKeyDown = (event) => {
    const moves = {
      ArrowDown: active + 1,
      ArrowUp: active - 1,
      Home: 0,
      End: count - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = clampIndex(moves[event.key], count);
    choose(next);
    tabRefs.current[next]?.focus({ preventScroll: true });
  };

  const current = items[active];
  const tabId = (index) => `${baseId}-tab-${index}`;
  const panelId = `${baseId}-panel`;

  return (
    <div className="e-cond__desk">
      <div className="e-cond__wheel" ref={wheelRef}>
        <p className="e-cond__count" aria-hidden="true">
          {pad(active)}
          <span>/ {pad(count - 1)}</span>
        </p>

        <button
          type="button"
          className="e-cond__step"
          onClick={() => choose(active - 1)}
          disabled={active === 0}
          aria-label={labels.previousLabel}
        >
          <ChevronUp size={22} aria-hidden="true" />
        </button>

        <div
          className="e-cond__drum"
          role="tablist"
          aria-orientation="vertical"
          aria-label={labels.title}
          onKeyDown={onKeyDown}
        >
          <motion.div className="e-cond__list" style={{ y: offset }}>
            {items.map((item, index) => (
              <button
                type="button"
                key={item.service.slug}
                id={tabId(index)}
                role="tab"
                className="e-cond__item"
                aria-selected={index === active}
                aria-controls={panelId}
                tabIndex={index === active ? 0 : -1}
                data-active={index === active ? "true" : undefined}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                onClick={() => choose(index)}
              >
                {item.service.title}
              </button>
            ))}
          </motion.div>
          <span className="e-cond__lens" aria-hidden="true" />
        </div>

        <button
          type="button"
          className="e-cond__step"
          onClick={() => choose(active + 1)}
          disabled={active === count - 1}
          aria-label={labels.nextLabel}
        >
          <ChevronDown size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="e-cond__stage" role="tabpanel" id={panelId} aria-labelledby={tabId(active)}>
        <div className="e-cond__photos" aria-hidden="true">
          {items.map((item, index) =>
            requested.has(index) ? (
              <StagePhoto
                key={item.service.slug}
                service={item.service}
                role={index === active ? "on" : index === under ? "under" : "off"}
              />
            ) : null,
          )}
        </div>

        {/* The floor is one static gradient under every caption, so only the
            words swap - a gradient that left with the caption blinked the
            photograph bright between services. */}
        <span className="e-cond__floor" aria-hidden="true" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            className="e-cond__caption"
            key={current.service.slug}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <Caption item={current} ctaLabel={labels.ctaLabel} kind />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* A stage photograph is one of three things: the one on top ("on", fading in
   over whatever was there), the one it is covering ("under", held at full
   opacity so the stage is never blank while the next file arrives), or off.
   The fade only starts once the file has decoded, so a slow image never
   shows half-painted. */
function StagePhoto({ service, role }) {
  const [loaded, setLoaded] = useState(false);
  const markLoaded = () => setLoaded(true);

  return (
    <img
      className="e-cond__photo"
      src={service.image}
      alt=""
      loading="lazy"
      decoding="async"
      data-role={role}
      data-loaded={loaded ? "true" : undefined}
      onLoad={markLoaded}
      ref={(element) => {
        if (element?.complete && element.naturalWidth > 0) markLoaded();
      }}
    />
  );
}

/* ---------------------------------------------------------------- narrow -- */

function Rail({ items, labels, active, onChoose, reduceMotion }) {
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const initialRef = useRef(active);
  const count = items.length;

  const getStride = () => {
    const track = trackRef.current;
    const slide = track?.firstElementChild;
    if (!track || !slide) return 0;
    return slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
  };

  /* Scroll position is the single source of truth: the arrows scroll the rail
     and the rail reports back, which is what keeps the counter and the bar in
     step whichever the reader used. The bar's fill is written every frame. */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    const sync = () => {
      const stride = getStride();
      if (!stride) return;
      onChoose(Math.round(track.scrollLeft / stride));
      const travel = track.scrollWidth - track.clientWidth;
      barRef.current?.style.setProperty(
        "--cond-progress",
        travel > 0 ? Math.min(track.scrollLeft / travel, 1).toFixed(4) : "1",
      );
    };

    const stride = getStride();
    if (stride) track.scrollLeft = initialRef.current * stride;
    sync();

    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      track.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [onChoose]);

  const goTo = (index) => {
    const track = trackRef.current;
    const stride = getStride();
    if (!track || !stride) return;
    track.scrollTo({
      left: clampIndex(index, count) * stride,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className="e-cond__rail">
      <ul className="e-cond__track" ref={trackRef}>
        {items.map((item, index) => (
          <li className="e-cond__slide" key={item.service.slug} aria-label={`${index + 1} of ${count}`}>
            <img
              className="e-cond__photo"
              src={item.service.image}
              alt={item.service.imageAlt}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
            />
            <span className="e-cond__floor" aria-hidden="true" />
            <div className="e-cond__caption">
              <Caption item={item} ctaLabel={labels.ctaLabel} name />
            </div>
          </li>
        ))}
      </ul>

      <div className="e-cond__foot">
        <p className="e-cond__count" aria-hidden="true">
          {pad(active)}
          <span>/ {pad(count - 1)}</span>
        </p>
        <span className="e-cond__bar" ref={barRef} aria-hidden="true" />
        <div className="e-cond__arrows">
          <button
            type="button"
            className="e-cond__step"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
            aria-label={labels.previousLabel}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="e-cond__step"
            onClick={() => goTo(active + 1)}
            disabled={active === count - 1}
            aria-label={labels.nextLabel}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- shared -- */

/* The same caption on the stage and in a rail slide: the one line written
   for this section, the service's own sentence, and a filled button to its
   page, on the photograph's floor. The stage names the kind of care above it
   (the wheel already names the service); a rail slide names the service
   instead, because there is no wheel to do it. */
function Caption({ item, ctaLabel, kind = false, name = false }) {
  return (
    <>
      <div className="e-cond__words">
        {kind ? <span className="e-cond__kind">{getCategoryLabel(item.service.category)}</span> : null}
        {name ? <h3 className="e-cond__name">{item.service.title}</h3> : null}
        <p className="e-cond__headline">{item.headline}</p>
        <p className="e-cond__text">{item.service.shortDescription}</p>
      </div>
      <Link className="e-btn e-btn--light e-cond__go" to={`/services/${item.service.slug}`}>
        {ctaLabel}
        <span className="e-cond__sr">: {item.service.title}</span>
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </>
  );
}
