import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Info, RotateCcw } from "lucide-react";
import EyeModel from "../components/EyeModel";
import { prewarmEyeModel } from "../lib/eyeRenderer";
import { useHydrated } from "../lib/hydration";
import SymptomScene from "../components/SymptomScene";
import SmartImage from "../components/SmartImage";
import {
  getCategoryFilters,
  getCategoryLabel,
  fillTemplate,
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
/* Longer than the eye route's 200ms caption swap, so the answers are measured
   where they will stay. The ledger's rows take longer to land: their glide is
   400ms, and the ones leaving take 360ms to go. */
const REVEAL_SETTLE_MS = 260;
const LEDGER_SETTLE_MS = 480;
/* A part chosen on a phone first turns the eye to it; the page moves on to the
   answer once the turn has landed, rather than scrolling the eye away mid-turn. */
const EYE_TURN_MS = 1000;
/* The console's arrival: its top rule draws across and the eye chart pulls
   into focus - blurred, overshooting, sharp - the first time the console is
   on screen. The chart's pass is 1.5s after a 250ms beat; the attribute that
   runs it is taken off once it has finished, so it never replays when the
   reader comes back to the symptoms route, and a hover after it is the
   chart's own again. */
const CHART_FOCUS_MS = 1800;
/* A hand on the eye route - a pointer arriving, a finger going down, the
   keyboard landing on it - starts the model's shader compiling, so the eye is
   ready by the time the route has opened rather than a beat after. */
const WARM_EYE = {
  onPointerEnter: prewarmEyeModel,
  onPointerDown: prewarmEyeModel,
  onFocus: prewarmEyeModel,
};

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
  const consoleRef = useRef(null);
  const resultsRef = useRef(null);
  const revealPending = useRef(false);
  const revealDelay = useRef(REVEAL_SETTLE_MS);
  const [gridSeen, setGridSeen] = useState(false);
  const [consoleSeen, setConsoleSeen] = useState(false);
  const [chartFocusing, setChartFocusing] = useState(false);

  const [mode, setMode] = useState("notice");
  const [direction, setDirection] = useState(1);
  const [concern, setConcern] = useState(null);
  /* Same split as the eye: hovering a symptom previews it on the chart, only
     a click narrows the list. */
  const [previewConcern, setPreviewConcern] = useState(null);
  /* On a phone the symptom groups are pages of one scroller under a row of
     tabs; this is the page the scroller is on. */
  const [groupPage, setGroupPage] = useState(0);
  const groupsRef = useRef(null);
  const groupNavRef = useRef(null);
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

  /* The phone grid's cards arrive the first time the grid is on screen. The
     observer is a callback ref rather than an effect because the grid mounts
     and unmounts: it only shows while nothing is chosen, and a reader who
     chooses before scrolling down has to get the entrance on the grid that
     comes back, not on the node an effect saw first. */
  const watchGrid = useCallback((node) => {
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
  }, []);
  /* Without an observer there is nothing to wait for, so the grid and the
     console are simply on. The prerendered page shows them on too, whole for
     a reader without JavaScript; they switch off as React adopts the page,
     unseen under the curtain or the veil, and on again as the reader reaches
     them. */
  const hydrated = useHydrated();
  const observerless = !hydrated || typeof IntersectionObserver === "undefined";
  const gridShown = gridSeen || shouldReduceMotion || observerless;

  useEffect(() => {
    const node = consoleRef.current;
    if (!node || shouldReduceMotion || typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    let timer = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setConsoleSeen(true);
        setChartFocusing(true);
        timer = window.setTimeout(() => setChartFocusing(false), CHART_FOCUS_MS);
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [shouldReduceMotion]);
  const consoleOn = consoleSeen || shouldReduceMotion || observerless;

  const all = useMemo(() => getNumberedServices(), []);
  const activeMode = finder.modes.find((entry) => entry.id === mode);
  /* Only groups that hold a description, so a tab can never open an empty
     page and the tabs and the pages always count the same. */
  const symptomGroups = useMemo(
    () =>
      finder.groups
        .map((group) => ({
          ...group,
          members: finder.concerns.filter((entry) => entry.group === group.id),
        }))
        .filter((group) => group.members.length),
    [],
  );
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

  /* The services on the list now, for the reveal below: rows on their way out
     stay in the DOM for a moment after a choice, and the first row there can
     be one that is leaving. */
  const shownSlugs = useRef([]);
  useEffect(() => {
    shownSlugs.current = shown.map((service) => service.slug);
  }, [shown]);

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

  /* A choice moves the page the least distance that puts the whole first
     answer on screen, and never so far that the line saying what the list is
     showing goes under the header - the chip or part just used stays as close
     to view as the answer allows. It is the opposite of the auto-scroll that
     used to fling the reader past the answer, and it used to stop short the
     other way: it brought the count to the foot of the screen and left the
     answer under the fold, on a laptop as much as on a phone. Nothing moves
     when the answer is already on screen. */
  const revealFirst = useCallback(
    (first) => {
      const status = resultsRef.current;
      if (!first || !status) return;
      const header = document.querySelector(".hd")?.getBoundingClientRect().bottom ?? 0;
      const overshoot = first.getBoundingClientRect().bottom + 16 - window.innerHeight;
      const headroom = status.getBoundingClientRect().top - Math.max(header, 0) - 12;
      const distance = Math.min(overshoot, headroom);
      if (distance <= 0) return;
      window.scrollBy({ top: distance, behavior: shouldReduceMotion ? "auto" : "smooth" });
    },
    [shouldReduceMotion],
  );

  /* It measures once the answers have landed, not on the next frame: the
     ledger's rows glide into their new places, and the eye route swaps its
     caption 200ms after a choice - a hint a line longer pushed the first card
     21px under the fold on a 320px phone. A part of the eye waits for the eye
     to turn first (settle), so the page does not carry it away mid-turn. */
  const revealResults = useCallback(
    (settle = REVEAL_SETTLE_MS) => {
      /* On a phone the answers are new cards that mount after the choice, so
         revealAnswers runs from their list's ref. */
      if (phone) {
        revealPending.current = true;
        revealDelay.current = settle;
        return;
      }
      window.setTimeout(
        () => {
          const rows = listRef.current?.querySelectorAll(".sv-row") ?? [];
          revealFirst(
            Array.from(rows).find((row) => shownSlugs.current.includes(row.dataset.slug)),
          );
        },
        Math.max(settle, LEDGER_SETTLE_MS),
      );
    },
    [phone, revealFirst],
  );

  const revealAnswers = useCallback(
    (node) => {
      if (!node || !revealPending.current) return;
      revealPending.current = false;
      window.setTimeout(() => revealFirst(node.firstElementChild), revealDelay.current);
    },
    [revealFirst],
  );

  const switchMode = (next) => {
    const order = finder.modes.map((entry) => entry.id);
    setDirection(order.indexOf(next) >= order.indexOf(mode) ? 1 : -1);
    setMode(next);
    setGroupPage(0);
    revealPending.current = false;
    setConcern(null);
    setPreviewConcern(null);
    setPart(null);
    setPreviewPart(null);
    setKind(null);
  };

  const clearFilter = () => {
    revealPending.current = false;
    setConcern(null);
    setPreviewConcern(null);
    setPart(null);
    setPreviewPart(null);
    setKind(null);
  };

  const choosePart = (id) => {
    setPart(id);
    setPreviewPart(null);
    revealResults(shouldReduceMotion ? REVEAL_SETTLE_MS : EYE_TURN_MS);
  };

  /* The scroller is the single source of truth for the symptom groups: the
     tabs never set the page, they scroll the pager and it reports back, so a
     swipe and a tap can never disagree. The tab bar's indicator follows the
     finger frame by frame through --sv-gp, written straight to the DOM - it is
     a measurement of the scroller, not render state. */
  const onGroupsScroll = (event) => {
    const node = event.currentTarget;
    if (!node.clientWidth) return;
    const progress = node.scrollLeft / node.clientWidth;
    groupNavRef.current?.style.setProperty("--sv-gp", progress.toFixed(3));
    setGroupPage(Math.round(progress));
  };

  const showGroup = (position) => {
    const node = groupsRef.current;
    if (!node) return;
    node.scrollTo({
      left: position * node.clientWidth,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  /* Below 901px the symptom groups are pages of one scroller. Chrome only
     scrolls a focused element into view when none of it is visible, and
     "nearest" is the wrong move on a pager anyway: it scrolls only until the
     chip's far edge shows, the pager snaps back to the nearer page, and the
     first chip of the next group was focused out of sight. So a chip that
     takes focus brings its whole page in; on a wide screen, where the groups
     do not scroll, nothing moves. */
  const revealGroupOf = (node) => {
    const pager = groupsRef.current;
    const page = node.closest(".sv-notice__group");
    if (!pager || !page || pager.scrollWidth <= pager.clientWidth + 1) return;
    showGroup(Array.prototype.indexOf.call(pager.children, page));
  };

  /* The route content slides in the direction the tab pill travelled, so a
     switch reads as moving along a row of three rather than swapping a card. */
  const slide = {
    enter: (dir) => (shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: dir * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir) => (shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: dir * -28 }),
  };
  const fade = shouldReduceMotion ? { duration: 0 } : { duration: 0.38, ease: EASE };
  /* The answers rise one after another behind the count, so a change of
     answer reads as the list being dealt again rather than text swapping. */
  const answerList = { hidden: {}, shown: { transition: { staggerChildren: 0.07 } } };
  const answerItem = {
    hidden: { opacity: 0, y: 12 },
    shown: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE } },
  };
  const total = all.length;
  /* The grid closes on a full row: the last card takes whatever columns its
     row leaves empty. */
  const spare = (3 - (all.length % 3)) % 3;
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
        <div
          className="sv-console"
          ref={consoleRef}
          data-on={consoleOn ? "true" : undefined}
          data-focus={chartFocusing ? "true" : undefined}
        >
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
                  {...(entry.id === "part" ? WARM_EYE : null)}
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
            {/* Phone only: each route asks its question in words, so the
                reader is told what to do rather than shown a row of tabs and
                left to work it out. The tab's short label names the route;
                this says what the route wants from them. */}
            <motion.h3
              className="sv-ask"
              key={mode}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: EASE }}
            >
              {activeMode?.question}
            </motion.h3>

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
                  {/* One chart is the whole preview: beside the chips on a
                      wide screen, a landscape readout above them below 901px.
                      Its hint carries two strings and CSS picks one on the
                      pointer - a phone has no hover, and a hint that offers
                      one reads as written for a different device. */}
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

                  {/* Below 901px the groups are pages of one scroller and these
                      are its tabs. A two-row rail used to show the edge of a
                      third column and a cut-off heading at the card's edge,
                      which read as a layout fault, and nothing said how many
                      descriptions there were. A tab row names every group,
                      and a page is always whole. */}
                  <div
                    className="sv-groupnav"
                    ref={groupNavRef}
                    style={{ "--sv-groups": symptomGroups.length }}
                  >
                    {symptomGroups.map((group, position) => (
                      <button
                        className="sv-groupnav__tab"
                        key={group.id}
                        type="button"
                        aria-current={groupPage === position ? "true" : undefined}
                        data-on={groupPage === position ? "true" : undefined}
                        onClick={() => showGroup(position)}
                      >
                        {group.shortLabel ?? group.label}
                      </button>
                    ))}
                    <span className="sv-groupnav__bar" aria-hidden="true" />
                  </div>

                  <div className="sv-notice__groups" ref={groupsRef} onScroll={onGroupsScroll}>
                    {symptomGroups.map((group) => {
                      const members = group.members;
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
                                    revealGroupOf(event.currentTarget);
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
                                      short form on the pager below 901px.
                                      The readout and the status line always
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
                        onClick={() => {
                          setKind(on ? null : entry.id);
                          if (!on) revealResults();
                        }}
                      >
                        <span className="sv-kind__head">
                          <span className="sv-kind__label">{entry.label}</span>
                          <span className="sv-kind__count">{entry.count}</span>
                        </span>
                        {/* Phone only, in place of the count badge: a count
                            says more as words under the name. */}
                        <span className="sv-kind__sub">
                          {fillTemplate(
                            entry.count === 1
                              ? finder.status.kindCountOne
                              : finder.status.kindCount,
                            { count: entry.count },
                          )}
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
                    <EyeModel
                      activePart={shownPart}
                      label={shownPartEntry?.label}
                      onPreviewPart={setPreviewPart}
                      onChoosePart={choosePart}
                      hint={finder.modelHintChoose}
                      hintTouch={finder.modelHintChooseTouch}
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

          <p className="sv-console__note">
            <Info className="sv-note__icon" size={16} aria-hidden="true" />
            <span>{finder.note}</span>
          </p>
        </div>

        {/* The one status line on the page: what the list is showing, why, and
            how to undo it. A phone gets it as the results' own header - what
            the list is, why it is showing these, and one button back to all
            eleven - because a count with a chip and an outlined Clear under it
            read as three controls rather than one answer. */}
        {phone ? (
          <div className="sv-sum" ref={resultsRef} data-filtered={filter ? "true" : undefined}>
            <div className="sv-sum__top">
              <h3 className="sv-sum__title">
                {filter ? finder.status.matchTitle : finder.status.allTitle}
              </h3>
              {filter ? (
                <button className="sv-sum__clear" type="button" onClick={clearFilter}>
                  <RotateCcw size={15} aria-hidden="true" />
                  <span className="sv-sum__clear-full">
                    {fillTemplate(finder.status.showAll, { total })}
                  </span>
                  <span className="sv-sum__clear-short">{finder.status.showAllShort}</span>
                </button>
              ) : null}
            </div>
            {/* The live region stays mounted and its words change, which is
                what a screen reader announces; the span inside is keyed so a
                new reason fades in rather than swapping. */}
            <p className="sv-sum__line" aria-live="polite">
              <motion.span
                key={filter ? `${mode}-${filter.criterion}` : "all"}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: EASE }}
              >
                {filter ? (
                  <>
                    {finder.status.because} <strong>{filter.criterion}</strong>
                    <span className="sv-sum__count">
                      {fillTemplate(finder.status.countOf, { count: shown.length, total })}
                    </span>
                  </>
                ) : (
                  fillTemplate(finder.status.all, { total })
                )}
              </motion.span>
            </p>
          </div>
        ) : (
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
              {filter?.criterion ? (
                <span className="sv-status__crit">{filter.criterion}</span>
              ) : null}
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
        )}

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
              filter ? (
                /* Any narrowing on a phone - a symptom, a part of the eye, a
                   kind of care; one answer or three - is the same card, full
                   width, one under the other. It used to depend on the count:
                   one answer was a photo card, three were tiles with no
                   sentence, two were a tile beside a sideways card, so a
                   symptom and a kind of care answered with different objects.
                   The card is the grid's tile opened up - the same edge, the
                   same number, the same name and way in - with the room to
                   carry the service's photograph, its kind of care and its
                   sentence, which is what an answer is owed. Keyed on the
                   choice, so a new answer is dealt fresh rather than morphed. */
                <motion.ol
                  className="sv-answers"
                  key={`${mode}-${filter.criterion}`}
                  aria-label={index.label}
                  ref={revealAnswers}
                  variants={answerList}
                  initial={shouldReduceMotion ? false : "hidden"}
                  animate="shown"
                >
                  {shown.map((service) => (
                    <motion.li
                      className="sv-answer"
                      key={service.slug}
                      data-tone={service.category}
                      variants={shouldReduceMotion ? undefined : answerItem}
                    >
                      <Link className="sv-answer__link" to={`/services/${service.slug}`}>
                        <span className="sv-answer__photo" aria-hidden="true">
                          <SmartImage
                            src={service.thumb}
                            alt=""
                            className="sv-answer__img"
                            sizes="96px"
                          />
                        </span>
                        <span className="sv-answer__body">
                          <span className="sv-answer__meta">
                            <span className="sv-answer__num" aria-hidden="true">
                              {service.position}
                            </span>
                            <span className="sv-answer__cat">
                              {getCategoryLabel(service.category)}
                            </span>
                          </span>
                          <span className="sv-answer__name">{service.title}</span>
                          <span className="sv-answer__text">{service.shortDescription}</span>
                          <span className="sv-answer__more" aria-hidden="true">
                            {service.category === "urgent" ? index.urgentLabel : index.cardLabel}
                            <ArrowRight size={15} />
                          </span>
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </motion.ol>
              ) : (
                /* With nothing chosen the phone's list is a grid of cards,
                   three across, all eleven on one screen, after the card-grid
                   reference: a coloured edge for the kind of care, the
                   service's number, its short name and a way in. No glyphs -
                   eleven of them read as clutter, and a name is faster on its
                   own. The last card takes whatever columns its row leaves
                   empty and lays out sideways with its sentence. Coming back
                   from an answer, the grid fades in whole. */
                <motion.ol
                  className="sv-grid"
                  key="grid"
                  data-in={gridShown ? "true" : undefined}
                  aria-label={index.label}
                  ref={watchGrid}
                  initial={gridSeen && !shouldReduceMotion ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={fade}
                >
                  {all.map((service, position) => {
                    const wide = spare > 0 && position === all.length - 1;
                    return (
                      <li
                        className="sv-tile"
                        key={service.slug}
                        data-tone={service.category}
                        data-wide={wide ? String(spare + 1) : undefined}
                        style={{ "--i": position }}
                      >
                        <Link className="sv-tile__link" to={`/services/${service.slug}`}>
                          <span className="sv-tile__num" aria-hidden="true">
                            {service.position}
                          </span>
                          <span className="sv-tile__name">
                            {service.shortTitle ?? service.title}
                          </span>
                          <span className="sv-tile__text">{service.shortDescription}</span>
                          <span className="sv-tile__more" aria-hidden="true">
                            {service.category === "urgent" ? (
                              index.urgentLabel
                            ) : (
                              <>
                                <span className="sv-tile__moreLong">{index.cardLabel}</span>
                                <span className="sv-tile__moreShort">{index.cardLabelShort}</span>
                              </>
                            )}
                            <ArrowRight size={14} />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </motion.ol>
              )
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
                        <span className="sv-group__label">{group.label}</span>{" "}
                        <span className="sv-group__count">{group.services.length}</span>
                      </h3>
                      <ol className="sv-group__list">
                        <AnimatePresence initial={false} mode="popLayout">
                          {group.services.map((service, position) => (
                            <motion.li
                              className="sv-row"
                              key={service.slug}
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

            <p className="sv-index__note">
              <Info className="sv-note__icon" size={16} aria-hidden="true" />
              <span>{servicePage.availabilityNote}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
