import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import EyeDiagram from "../components/EyeDiagram";
import SymptomScene from "../components/SymptomScene";
import SmartImage from "../components/SmartImage";
import {
  getCategoryFilters,
  getCategoryLabel,
  getNumberedServices,
  servicePage,
} from "../lib/servicesData";

const { finder, index } = servicePage;
const EASE = [0.22, 1, 0.36, 1];

/* Below this the list is the phone grid rather than the ledger. Decided in
   JS, not CSS, because the two are different markup: the ledger is five
   labelled sections and the grid is one list, and a section that is
   `display: contents` on a phone is a landmark with no box. */
const PHONE_QUERY = "(max-width: 640px)";

function subscribeToPhone(callback) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/* One instrument, not two. The finder and the list used to be separate
   sections that each rendered their own answer card, so a reader met the same
   object twice and had to work out which one was the answer.
 *
 * Now there are three routes into a single list - the words a patient would
 * use, the part of the eye they would point at, and the kind of care they
 * already know they want - and choosing any of them narrows the list in place
 * underneath. Nothing navigates on its own: hover previews, choosing filters,
 * and only a link the reader presses leaves the section. */
export default function ServiceExplorer() {
  const shouldReduceMotion = useReducedMotion();
  const listRef = useRef(null);
  const resultsRef = useRef(null);
  const gridRef = useRef(null);
  const [gridSeen, setGridSeen] = useState(false);

  const [mode, setMode] = useState("notice");
  const [direction, setDirection] = useState(1);
  const [concern, setConcern] = useState(null);
  /* Same split as the eye: hovering a symptom previews it on the chart, only
     a click narrows the list. */
  const [previewConcern, setPreviewConcern] = useState(null);
  const shownConcern = previewConcern ?? concern;
  /* Preview and choice are separate state, not one value. Hover highlights a
     region so the reader can see what they would get; only a click narrows the
     list. Sharing one value meant a mouse crossing the eye silently re-filtered
     the page - the same fault as the old hover-navigates bug, one level down. */
  const [part, setPart] = useState(null);
  const [previewPart, setPreviewPart] = useState(null);
  const [kind, setKind] = useState(null);
  const [activeSlug, setActiveSlug] = useState(null);
  const phone = useSyncExternalStore(
    subscribeToPhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );

  /* The phone grid's cards arrive the first time the grid is on screen, and
     the trigger is re-armed whenever the grid mounts: framer's useInView
     watches the node a ref held when the effect ran, and a page opened wide
     and narrowed later would have handed it the ledger's node and left every
     card at opacity 0. */
  useEffect(() => {
    if (!phone || gridSeen) return undefined;
    const node = gridRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setGridSeen(true);
        observer.disconnect();
      },
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [phone, gridSeen]);
  const gridShown =
    gridSeen || shouldReduceMotion || typeof IntersectionObserver === "undefined";

  const all = useMemo(() => getNumberedServices(), []);
  const categories = useMemo(() => getCategoryFilters(), []);
  const activePart = useMemo(() => finder.parts.find((p) => p.id === part) ?? null, [part]);
  const shownPart = previewPart ?? part;
  const shownPartEntry = useMemo(
    () => finder.parts.find((p) => p.id === shownPart) ?? null,
    [shownPart],
  );

  /* One narrowing at a time. Three filters that stack would need explaining;
     three that replace each other never do. */
  const filter = useMemo(() => {
    if (mode === "notice" && concern) {
      return { slugs: [concern.service], criterion: concern.label };
    }
    if (mode === "part" && activePart) {
      return { slugs: activePart.services, criterion: activePart.label, hint: activePart.hint };
    }
    if (mode === "kind" && kind) {
      const category = categories.find((c) => c.id === kind);
      return {
        slugs: all.filter((s) => s.category === kind).map((s) => s.slug),
        criterion: category?.label,
      };
    }
    return null;
  }, [mode, concern, activePart, kind, categories, all]);

  const shown = useMemo(
    () => (filter ? all.filter((service) => filter.slugs.includes(service.slug)) : all),
    [all, filter],
  );

  /* The list is read in runs, not as eleven equal rows: the source order is
     already grouped by kind of care, so each run gets its heading once and the
     rows under it carry only their own name. Any narrowing keeps the same
     shape - two surgical answers still sit under "Surgical care". */
  const groups = useMemo(() => {
    const runs = [];
    shown.forEach((service) => {
      const last = runs[runs.length - 1];
      if (last && last.id === service.category) last.services.push(service);
      else
        runs.push({
          id: service.category,
          label: getCategoryLabel(service.category),
          services: [service],
        });
    });
    return runs;
  }, [shown]);

  const active = shown.find((s) => s.slug === activeSlug) ?? shown[0] ?? null;

  /* The pane follows the reader down the list. Scroll position is the base
     signal so it is never stale on a touch screen; a pointer overrides it. */
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return undefined;
    const rows = Array.from(list.querySelectorAll(".sv-row"));
    if (!rows.length) return undefined;
    /* On the phone grid nothing follows the reader; the tiles answer taps. */
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSlug(entry.target.dataset.slug);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [shown.length, phone]);

  /* Where the results sit beside the controls there is nothing to do. Stacked
     on a phone they land below the whole control card, so a reader chooses and
     sees nothing happen. Revealing the result of a tap is the opposite of the
     auto-scroll that used to fling the reader past it. */
  const revealResults = useCallback(() => {
    requestAnimationFrame(() => {
      const node = resultsRef.current;
      if (!node) return;
      const box = node.getBoundingClientRect();
      const visible = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0);
      if (visible >= Math.min(box.height, 240)) return;
      node.scrollIntoView({ block: "nearest", behavior: shouldReduceMotion ? "auto" : "smooth" });
    });
  }, [shouldReduceMotion]);

  const switchMode = (next) => {
    const order = finder.modes.map((entry) => entry.id);
    setDirection(order.indexOf(next) >= order.indexOf(mode) ? 1 : -1);
    setMode(next);
    setConcern(null);
    setPreviewConcern(null);
    setPart(null);
    setPreviewPart(null);
    setKind(null);
  };

  const clearFilter = () => {
    setConcern(null);
    setPreviewConcern(null);
    setPart(null);
    setPreviewPart(null);
    setKind(null);
  };

  const choosePart = (id) => {
    setPart(id);
    setPreviewPart(null);
    revealResults();
  };

  /* On a phone the chips and the kind cards are rails, and a rail shows the
     edge of the next item on purpose. Chrome only scrolls a focused element
     into view when none of it is visible, so a keyboard reader tabbing along
     the rail landed on a chip half under the card's edge. Nearest on both
     axes brings it in without moving the page. */
  const revealInRail = (node) => {
    node.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  /* The route content slides in the direction the tab pill travelled, so a
     switch reads as moving along a row of three rather than swapping a card. */
  const slide = {
    enter: (dir) => (shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: dir * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => (shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: dir * -28 }),
  };
  const fade = shouldReduceMotion ? { duration: 0 } : { duration: 0.38, ease: EASE };
  const total = all.length;
  const statusTemplate = filter ? finder.status.filtered : finder.status.all;
  const statusText = statusTemplate.replace("{count}", shown.length).replace("{total}", total);
  /* Splits the template at its number tokens so the figures render in their
     own element without the sentence leaving the JSON. */
  const statusParts = statusTemplate.split(/(\{count\}|\{total\})/).map((piece, index) => {
    if (piece === "{count}") return { key: index, figure: String(shown.length) };
    if (piece === "{total}") return { key: index, figure: String(total) };
    return { key: index, text: piece };
  });

  return (
    <section className="e-sec sv-explorer" id="find-a-service">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{finder.label}</span>
          <div className="e-head__body">
            <h2 className="e-h2">{finder.title}</h2>
            <p className="e-lede">{finder.lede}</p>
          </div>
        </div>

        {/* The controls sit on one raised card so the three routes read as one
            instrument rather than three unrelated rows of chips. */}
        <div className="sv-console">
          <div className="sv-console__head">
            <div className="sv-modes" role="group" aria-label={finder.title}>
              {finder.modes.map((entry) => (
                <button
                  className="sv-mode"
                  key={entry.id}
                  type="button"
                  aria-pressed={mode === entry.id}
                  data-on={mode === entry.id ? "true" : undefined}
                  onClick={() => switchMode(entry.id)}
                >
                  {mode === entry.id ? (
                    <motion.span
                      className="sv-mode__pill"
                      layoutId="sv-mode-pill"
                      aria-hidden="true"
                      transition={
                        shouldReduceMotion ? { duration: 0 } : { duration: 0.34, ease: EASE }
                      }
                    />
                  ) : null}
                  <span className="sv-mode__label sv-mode__label--full">{entry.label}</span>
                  <span className="sv-mode__label sv-mode__label--short">
                    {entry.shortLabel ?? entry.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="sv-console__body">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {mode === "notice" ? (
                <motion.div
                  className="sv-notice"
                  key="notice"
                  onMouseLeave={() => setPreviewConcern(null)}
                  custom={direction}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={fade}
                >
                  {/* One chart is the whole preview: hover on a pointer, the
                      pinned readout on a phone. Its hint carries two strings
                      and CSS picks one on the pointer - a phone has no hover,
                      and a hint that offers one reads as written for a
                      different device. */}
                  <SymptomScene
                    visual={shownConcern?.visual ?? "clear"}
                    heading={finder.sceneLabel}
                    label={shownConcern ? shownConcern.label : finder.sceneClear}
                    idle={!shownConcern}
                    hint={
                      <>
                        <span className="sv-scene__hint-full">{finder.sceneHint}</span>
                        <span className="sv-scene__hint-touch">{finder.sceneHintTouch}</span>
                      </>
                    }
                  />

                  <div className="sv-notice__groups">
                    {finder.groups.map((group) => {
                      const members = finder.concerns.filter((c) => c.group === group.id);
                      if (!members.length) return null;
                      return (
                        <div className="sv-notice__group" key={group.id}>
                          <span className="sv-notice__group-label">{group.label}</span>
                          {/* The same chips the eye route uses, so the two
                              visual routes are one control vocabulary. */}
                          <div className="sv-symptoms">
                            {members.map((entry, position) => {
                              const on = concern?.label === entry.label;
                              return (
                                <motion.button
                                  className="sv-chip sv-chip--symptom"
                                  key={entry.label}
                                  type="button"
                                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: shouldReduceMotion ? 0 : 0.3,
                                    ease: EASE,
                                    delay: shouldReduceMotion ? 0 : position * 0.035,
                                  }}
                                  whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                                  aria-pressed={on}
                                  data-on={on ? "true" : undefined}
                                  data-preview={
                                    !on && previewConcern?.label === entry.label
                                      ? "true"
                                      : undefined
                                  }
                                  onMouseEnter={() => setPreviewConcern(entry)}
                                  onFocus={(event) => {
                                    setPreviewConcern(entry);
                                    revealInRail(event.currentTarget);
                                  }}
                                  onBlur={() => setPreviewConcern(null)}
                                  onClick={() => {
                                    setConcern(on ? null : entry);
                                    setPreviewConcern(null);
                                    if (!on) revealResults();
                                  }}
                                >
                                  {/* Two labels, CSS picks one: the sentence
                                      beside the chart on a wide screen, the
                                      short form in the phone's rail. The
                                      readout and the status line always
                                      print the full sentence. */}
                                  <span className="sv-chip__label sv-chip__label--full">
                                    {entry.label}
                                  </span>
                                  <span className="sv-chip__label sv-chip__label--short">
                                    {entry.shortLabel ?? entry.label}
                                  </span>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : mode === "kind" ? (
                <motion.div
                  className="sv-kinds"
                  key="kind"
                  custom={direction}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={fade}
                >
                  {categories.map((entry, position) => {
                    const on = kind === entry.id;
                    const members = all.filter((service) => service.category === entry.id);
                    return (
                      <motion.button
                        className="sv-kind"
                        key={entry.id}
                        type="button"
                        data-tone={entry.id}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.34,
                          ease: EASE,
                          delay: shouldReduceMotion ? 0 : position * 0.05,
                        }}
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
                        aria-pressed={on}
                        data-on={on ? "true" : undefined}
                        onFocus={(event) => revealInRail(event.currentTarget)}
                        onClick={() => {
                          setKind(on ? null : entry.id);
                          if (!on) revealResults();
                        }}
                      >
                        <span className="sv-kind__head">
                          <span className="sv-kind__label">{entry.label}</span>
                          <span className="sv-kind__count">{entry.count}</span>
                        </span>
                        {/* The members are the reason the card exists: a reader
                            sees what "Specialty clinics" contains before
                            spending a tap on it. */}
                        <span className="sv-kind__members">
                          {members.map((service) => (
                            <span className="sv-kind__member" key={service.slug}>
                              <span className="sv-kind__num">{service.position}</span>
                              {service.title}
                            </span>
                          ))}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  className="sv-parts"
                  onMouseLeave={() => setPreviewPart(null)}
                  key="part"
                  custom={direction}
                  variants={slide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={fade}
                >
                  <div className="sv-parts__frame" data-idle={shownPart ? undefined : "true"}>
                    <EyeDiagram
                      activePart={shownPart}
                      onPreviewPart={setPreviewPart}
                      onChoosePart={choosePart}
                    />
                  </div>

                  <p
                    className="sv-parts__caption"
                    data-on={shownPartEntry ? "true" : undefined}
                    aria-hidden="true"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={shownPartEntry?.id ?? "none"}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
                      >
                        {shownPartEntry ? shownPartEntry.hint : finder.partsLede}
                      </motion.span>
                    </AnimatePresence>
                  </p>

                  <ul className="sv-parts__list">
                    {finder.parts.map((entry) => (
                      <li key={entry.id}>
                        <motion.button
                          className="sv-chip sv-chip--part"
                          type="button"
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                          aria-pressed={part === entry.id}
                          data-on={shownPart === entry.id ? "true" : undefined}
                          onMouseEnter={() => setPreviewPart(entry.id)}
                          onFocus={() => setPreviewPart(entry.id)}
                          onBlur={() => setPreviewPart(null)}
                          onClick={() => choosePart(entry.id)}
                        >
                          {entry.label}
                        </motion.button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="sv-console__note">{finder.note}</p>
        </div>

        {/* The one status line on the page: what the list is showing, why, and
            how to undo it. */}
        <div className="sv-status" ref={resultsRef}>
          <p className="sv-status__count" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                className="sv-status__figure"
                key={statusText}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: EASE }}
              >
                {statusParts.map((piece) =>
                  piece.figure !== undefined ? (
                    <strong className="sv-status__num" key={piece.key}>
                      {piece.figure}
                    </strong>
                  ) : (
                    <span key={piece.key}>{piece.text}</span>
                  ),
                )}
              </motion.span>
            </AnimatePresence>
            {filter?.criterion ? <span className="sv-status__crit">{filter.criterion}</span> : null}
          </p>
          <AnimatePresence initial={false}>
            {filter ? (
              <motion.button
                className="sv-status__clear"
                type="button"
                onClick={clearFilter}
                initial={shouldReduceMotion ? false : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 8 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: EASE }}
              >
                <RotateCcw size={15} aria-hidden="true" />
                {finder.status.clear}
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="sv-index__split">
          {/* Decorative: it mirrors the row the reader is already on, and every
              word in it is a copy of something in that row. */}
          <aside className="sv-stage" aria-hidden="true">
            <div className="sv-stage__inner">
              <AnimatePresence mode="wait" initial={false}>
                {active ? (
                  <motion.div
                    className="sv-stage__card"
                    key={active.slug}
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: EASE }}
                  >
                    <div className="sv-stage__media">
                      <SmartImage
                        src={active.image}
                        alt=""
                        className="sv-stage__img"
                        sizes="(min-width: 1024px) 40vw, 100vw"
                      />
                      <span className="sv-stage__num">{active.position}</span>
                    </div>
                    <div className="sv-stage__body">
                      <span className="sv-stage__cat">{getCategoryLabel(active.category)}</span>
                      <p className="sv-stage__title">{active.title}</p>
                      <ul className="sv-stage__points">
                        {(active.featureBullets ?? []).slice(0, 3).map((point) => (
                          <li key={point}>
                            <Check size={14} />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </aside>

          <div className="sv-results">
            {phone ? (
              /* The phone's list is a grid of cards, three across, all eleven
                 on one screen, after the card-grid reference: a coloured edge
                 for the kind of care, the service's number, its short name
                 and a way in. No glyphs - eleven of them read as clutter, and
                 a name is faster on its own. The runs are dropped here: the
                 care-type route is the grouping, live, and its cards carry
                 the same edge colours, so the colour is learnable.

                 The last card takes whatever columns its row leaves empty and
                 lays out sideways with its sentence (the span is computed
                 here, not with :nth-child - popLayout keeps exiting cards in
                 the DOM while they leave, and a CSS count would land on one).
                 One answer is a card with the service's photograph, its full
                 name and its sentence: an answer deserves more than a tile. */
              <ol
                className="sv-grid"
                data-in={gridShown ? "true" : undefined}
                aria-label={index.label}
                ref={(node) => {
                  listRef.current = node;
                  gridRef.current = node;
                }}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {shown.map((service, position) => {
                    const single = shown.length === 1;
                    const spare = single ? 0 : (3 - (shown.length % 3)) % 3;
                    const wide = !single && spare > 0 && position === shown.length - 1;
                    const urgent = service.category === "urgent";
                    return (
                      <motion.li
                        className="sv-tile"
                        key={service.slug}
                        data-tone={service.category}
                        data-single={single ? "true" : undefined}
                        data-wide={wide ? String(spare + 1) : undefined}
                        data-match={filter ? "true" : undefined}
                        style={{ "--i": position }}
                        layout={shouldReduceMotion ? false : "position"}
                        initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                          shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.9 }
                        }
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.38,
                          ease: EASE,
                          delay: shouldReduceMotion ? 0 : Math.min(position, 8) * 0.03,
                          layout: { duration: shouldReduceMotion ? 0 : 0.42, ease: EASE },
                        }}
                      >
                        <Link className="sv-tile__link" to={`/services/${service.slug}`}>
                          {single ? (
                            <span className="sv-tile__photo" aria-hidden="true">
                              <SmartImage
                                src={service.thumb}
                                alt=""
                                className="sv-tile__img"
                                sizes="96px"
                              />
                            </span>
                          ) : (
                            <span className="sv-tile__num" aria-hidden="true">
                              {service.position}
                            </span>
                          )}
                          <span className="sv-tile__name">
                            {single ? service.title : (service.shortTitle ?? service.title)}
                          </span>
                          <span className="sv-tile__text">{service.shortDescription}</span>
                          {single ? (
                            <span className="sv-tile__arrow" aria-hidden="true">
                              <ArrowRight size={16} />
                            </span>
                          ) : (
                            <span className="sv-tile__more" aria-hidden="true">
                              {urgent ? (
                                index.urgentLabel
                              ) : (
                                <>
                                  <span className="sv-tile__moreLong">{index.cardLabel}</span>
                                  <span className="sv-tile__moreShort">
                                    {index.cardLabelShort}
                                  </span>
                                </>
                              )}
                              <ArrowRight size={14} />
                            </span>
                          )}
                        </Link>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ol>
            ) : (
              <div className="sv-list" ref={listRef}>
                <AnimatePresence initial={false} mode="popLayout">
                  {groups.map((group) => (
                    <motion.section
                      className="sv-group"
                      key={group.id}
                      aria-labelledby={`sv-group-${group.id}`}
                      layout={shouldReduceMotion ? false : "position"}
                      initial={shouldReduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.36, ease: EASE }}
                    >
                      <h3 className="sv-group__head" id={`sv-group-${group.id}`}>
                        <span className="sv-group__label">{group.label}</span>
                        <span className="sv-group__count">{group.services.length}</span>
                      </h3>
                      <ol className="sv-group__list">
                        <AnimatePresence initial={false} mode="popLayout">
                          {group.services.map((service, position) => (
                            <motion.li
                              className="sv-row"
                              key={service.slug}
                              id={`service-${service.slug}`}
                              data-slug={service.slug}
                              data-on={service.slug === active?.slug ? "true" : undefined}
                              onMouseEnter={() => setActiveSlug(service.slug)}
                              onFocus={() => setActiveSlug(service.slug)}
                              layout={shouldReduceMotion ? false : "position"}
                              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                              transition={{
                                duration: shouldReduceMotion ? 0 : 0.4,
                                ease: EASE,
                                delay: shouldReduceMotion ? 0 : Math.min(position, 6) * 0.035,
                              }}
                            >
                              <Link className="sv-row__link" to={`/services/${service.slug}`}>
                                <span className="sv-row__num" aria-hidden="true">
                                  {service.position}
                                </span>
                                {/* Decorative: the row's name is the label, and on a
                                  wide screen the pane shows the same picture large. */}
                                <span className="sv-row__thumb" aria-hidden="true">
                                  <SmartImage
                                    src={service.thumb}
                                    alt=""
                                    className="sv-row__img"
                                    sizes="72px"
                                  />
                                </span>
                                <span className="sv-row__title">{service.title}</span>
                                <span className="sv-row__text">{service.shortDescription}</span>
                                <span className="sv-row__open">
                                  <span className="sv-row__open-label">{index.openLabel}</span>
                                  <span className="sv-row__arrow" aria-hidden="true">
                                    <ArrowRight size={16} />
                                  </span>
                                </span>
                              </Link>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ol>
                    </motion.section>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {shown.length === 0 ? (
              <div className="sv-empty">
                <p className="sv-empty__title">{finder.status.emptyTitle}</p>
                <p className="sv-empty__text">{finder.status.emptyText}</p>
              </div>
            ) : null}

            <p className="sv-index__note">{servicePage.availabilityNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
