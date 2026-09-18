import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Clock, Copy, Landmark, Map, Navigation, PenLine, Phone } from "lucide-react";
import BranchMap from "../components/BranchMap";
import BranchStatus from "../components/BranchStatus";
import LazyMapFrame from "../components/LazyMapFrame";
import Reveal from "../components/Reveal";
import { buildMapLink, cleanTel } from "../lib/contact";
import { branchPage } from "../lib/branchData";
import { getBranchHours, getHoursRows } from "../lib/hours";

const { locate } = branchPage;
const COPIED_MS = 2200;
/* The card exists wherever the map sits above the details rather than beside
   them - the same width at which the two-column grid gives up. */
const STACKED_QUERY = "(max-width: 1023px)";

function subscribeToStacked(callback) {
  const query = window.matchMedia(STACKED_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/* Where the hospital is and how to reach it - the one question every visitor
 * to a hospital page has, answered on the page's one dark band.
 *
 * The map is a drawing of the postal address (see BranchMap) that plays as it
 * comes into view, with the live Google map one tap away inside the same
 * frame. Beside it: the address, the landmarks to look for, the numbers for
 * each desk, and the hours.
 *
 * **The same three blocks are read two ways, and the phone's way is the point
 * of this section.** From 1024px they stack in a column beside a sticky map,
 * which is what the width is for. Stacked under the map on a phone that column
 * was a 1504px wall - four screens of label-and-list for three facts, and the
 * reason the page read as complex there. Below 1024px the map, a three-tab
 * switch and one panel become a single card the reader taps through: address,
 * numbers,
 * hours. `stacked` is decided in JS rather than by CSS because the tabs are real
 * ARIA controls and must not exist on the width where every panel is open.
 *
 * The actions sit under the card at every width rather than inside a tab -
 * Directions is the thing a reader came for, and it must never be one tap
 * behind a label. */
export default function BranchLocate({ branch }) {
  const shouldReduceMotion = useReducedMotion();
  const frameRef = useRef(null);
  const panelObserverRef = useRef(null);
  const mapRef = useRef(null);
  const inView = useInView(mapRef, { once: true, amount: 0.45 });
  const [live, setLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState(locate.tabs[0].id);
  const stacked = useSyncExternalStore(
    subscribeToStacked,
    () => window.matchMedia(STACKED_QUERY).matches,
    () => false,
  );
  const { page } = branch;

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(`Aakash Eye Hospital, ${branch.address}`);
      setCopied(true);
    } catch {
      // No clipboard (an insecure context, or permission refused): the address
      // is on the screen, and the button simply stays as it was.
    }
  };

  /* The card grows to the panel rather than snapping to it, so the actions
     under it never jump out from under a thumb. A callback ref, not an effect:
     AnimatePresence holds the outgoing panel until its exit finishes, so an
     effect keyed on the tab would measure the panel that is leaving. The height
     is written straight to the DOM - it is a measurement, not something the
     render depends on. */
  const measurePanel = useCallback((node) => {
    panelObserverRef.current?.disconnect();
    panelObserverRef.current = null;
    if (!node) return;

    const apply = () => {
      if (frameRef.current) frameRef.current.style.height = `${node.offsetHeight}px`;
    };
    apply();

    if (typeof ResizeObserver === "undefined") return;
    panelObserverRef.current = new ResizeObserver(apply);
    panelObserverRef.current.observe(node);
  }, []);

  const addressPanel = (
    <>
      <span className="br-details__label">{locate.addressLabel}</span>
      {/* The PIN stays with its city: `Visnagar - 384315` is one token, so a
          balanced wrap can never start a line with the hyphen. */}
      <p className="br-details__address">{branch.address.replace(/ - /g, "\u00a0-\u00a0")}</p>
      <ul className="br-landmarks" aria-label={locate.landmarksLabel}>
        {page.landmarks.map((landmark) => (
          <li key={landmark.label}>
            <Landmark size={13} aria-hidden="true" />
            {landmark.label}
          </li>
        ))}
      </ul>
    </>
  );

  const numbersPanel = (
    <>
      <span className="br-details__label">{locate.desksLabel}</span>
      <ul className="br-desks">
        {branch.phoneGroups.map((group) => (
          <li key={group.label} className="br-desk">
            <span className="br-desk__name">
              <Phone size={14} aria-hidden="true" />
              {group.label}
            </span>
            <span className="br-desk__numbers">
              {group.numbers.map((number) => (
                <a key={number} href={`tel:${cleanTel(number)}`}>
                  {number}
                </a>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </>
  );

  const hours = getBranchHours(branch);
  const hoursPanel = (
    <>
      <span className="br-details__label">{locate.hoursLabel}</span>
      <ul className="br-hours">
        {getHoursRows(hours).map((row) => (
          <li key={row.label}>
            <Clock size={14} aria-hidden="true" />
            <span>
              <strong>{row.label}</strong>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      {hours.note ? <p className="br-details__note">{hours.note}</p> : null}
    </>
  );

  const panels = { address: addressPanel, numbers: numbersPanel, hours: hoursPanel };

  const actions = (
    <div className="br-details__actions">
      <a className="e-btn e-btn--light" href={buildMapLink(branch)} target="_blank" rel="noreferrer">
        <Navigation size={16} aria-hidden="true" />
        <span className="br-full">{locate.mapsLabel}</span>
        <span className="br-short">{locate.mapsShortLabel}</span>
      </a>
      <button
        className="br-copy"
        type="button"
        onClick={copyAddress}
        data-copied={copied ? "true" : undefined}
      >
        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        <span className="br-full">{copied ? locate.copiedLabel : locate.copyLabel}</span>
        <span className="br-short">{copied ? locate.copiedLabel : locate.copyShortLabel}</span>
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? locate.copiedLabel : ""}
        </span>
      </button>
    </div>
  );

  return (
    <section className="e-sec e-sec--dark br-locate" id="find-us" aria-labelledby="br-locate-title">
      <div className="e-shell">
        {/* The sentence that used to sit under this heading explained the map
            and gave the reader nothing to act on. In its place, and in exactly
            its position, the one fact on the page that changes through the day
            and the one a visitor actually wants before setting out. It stays
            under the heading at every width - in the label column it read ahead
            of the heading once the two stacked on a phone. */}
        <Reveal className="e-head">
          <span className="e-label">{locate.label}</span>
          <div className="e-head__body">
            <h2 className="e-h2" id="br-locate-title">
              {locate.title} <em>{locate.titleAccent}</em>
            </h2>
            <BranchStatus branch={branch} />
          </div>
        </Reveal>

        <div className="br-locate__grid">
          <div className="br-map" ref={mapRef} data-live={live ? "true" : undefined}>
            <AnimatePresence initial={false} mode="wait">
              {live ? (
                <motion.div
                  className="br-map__live"
                  key="live"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                >
                  <LazyMapFrame
                    className="br-map__iframe"
                    title={`${branch.name} map`}
                    src={branch.mapEmbed}
                  />
                </motion.div>
              ) : (
                <motion.div
                  className="br-map__sketch"
                  key="sketch"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                >
                  <BranchMap
                    active={inView}
                    landmarks={page.landmarks}
                    pinLabel={locate.pinLabel}
                    cityName={branch.name}
                    postcode={page.postcode}
                    postcodeLabel={locate.postcodeLabel}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              className="br-map__toggle"
              type="button"
              aria-pressed={live}
              onClick={() => setLive((value) => !value)}
            >
              {live ? <PenLine size={15} aria-hidden="true" /> : <Map size={15} aria-hidden="true" />}
              {live ? locate.drawnMapLabel : locate.liveMapLabel}
            </button>
          </div>

          <div className="br-details">
            {stacked ? (
              <>
                <div className="br-tabs" role="tablist" aria-label={locate.label}>
                  {locate.tabs.map((item) => (
                    <button
                      className="br-tab"
                      type="button"
                      key={item.id}
                      role="tab"
                      id={`br-tab-${item.id}`}
                      aria-selected={tab === item.id}
                      aria-controls={`br-panel-${item.id}`}
                      data-on={tab === item.id ? "true" : undefined}
                      onClick={() => setTab(item.id)}
                    >
                      {tab === item.id ? (
                        <motion.span
                          className="br-tab__pill"
                          layoutId="br-tab-pill"
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : { type: "spring", stiffness: 420, damping: 38 }
                          }
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="br-tab__text">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="br-tabs__frame" ref={frameRef}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      className="br-details__block br-details__block--panel"
                      key={tab}
                      ref={measurePanel}
                      id={`br-panel-${tab}`}
                      role="tabpanel"
                      aria-labelledby={`br-tab-${tab}`}
                      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: shouldReduceMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {panels[tab]}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {actions}
              </>
            ) : (
              <>
                <Reveal className="br-details__block" as="div">
                  {addressPanel}
                </Reveal>
                {actions}
                <Reveal className="br-details__block" as="div" delay={0.08}>
                  {numbersPanel}
                </Reveal>
                <Reveal className="br-details__block" as="div" delay={0.14}>
                  {hoursPanel}
                </Reveal>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
