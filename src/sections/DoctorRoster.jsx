import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import DoctorPortrait from "../components/DoctorPortrait";
import DoctorPlaces from "../components/DoctorPlaces";
import {
  describeInterests,
  doctorsPage,
  fillTemplate,
  getDoctorPlaces,
  getRosterHospitals,
  groupDoctors,
  hasProfile,
  profileHref,
  seesPatientsAt,
} from "../lib/doctorsData";

const copy = doctorsPage;
const EASE = [0.22, 1, 0.36, 1];
const ALL = "all";
const PHONE = "(max-width: 640px)";
/* The cards on the first screen wait for the head and the filter above them,
   so the page reads top to bottom as it arrives. Cards reached later by
   scrolling, or brought in by a choice, arrive at once. */
const FIRST_SCREEN_LEAD = 0.38;
const FIRST_SCREEN_MS = 700;

/* The label and the readout rise after the head; the chips follow one by
   one, so the control assembles rather than appearing whole. `delay` is the
   head's own, so the order holds after the curtain too. */
const bar = (delay) => ({
  hidden: {},
  shown: { transition: { staggerChildren: 0.06, delayChildren: delay + 0.2 } },
});

const CHIPS = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const RISE = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

/* A card rises, then its portrait settles in the frame and its words come up
   behind it. `shown` is resolved when the card reaches the screen, not when
   it renders, so the first-screen lead is read at that moment. */
const CARD = {
  hidden: { opacity: 0, y: 20 },
  shown: ({ position, lead }) => {
    const delay = lead + Math.min(position, 3) * 0.07;
    return {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: EASE,
        delay,
        delayChildren: delay + 0.08,
        staggerChildren: 0.06,
      },
    };
  },
};

const SETTLE = {
  hidden: { scale: 1.14 },
  shown: { scale: 1, transition: { duration: 1.2, ease: EASE } },
};

const LINE = {
  hidden: { opacity: 0, y: 10 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* The whole team, and one question narrowing it: which hospital.
 *
 * The filter is the only control on the page, so it is a real radio group -
 * one answer at a time, arrow keys walking the row, and the chosen chip's
 * fill as one element that travels (`layoutId`), the site's pill device. The
 * readout beside it is not decoration: a narrowed list with nothing saying so
 * just looks like a short list, which is the lesson the services explorer
 * paid for.
 *
 * On a phone the chips are a rail that sticks under the header for as long as
 * the roster is on screen, so the control is never somewhere the reader has
 * to scroll back to, and a choice made with the list already scrolled brings
 * the readout back up with it.
 *
 * The answer is read in three runs - the consultants, the visiting
 * specialists, then the optometry team - because on a medical site who is a
 * doctor and who is an optometrist is not a detail, and a specialist who only
 * holds clinics on set days is not someone a patient can walk in and see. A
 * doctor's run is decided from the hospital chosen: one who is resident at
 * Ahmedabad and visits Visnagar is a consultant under Ahmedabad and a visiting
 * specialist under Visnagar. A run with nobody in it is not rendered. */
export default function DoctorRoster({ items, ready, delay = 0 }) {
  const shouldReduceMotion = useReducedMotion();
  const play = ready && !shouldReduceMotion;
  const [choice, setChoice] = useState(ALL);
  const [arrived, setArrived] = useState(false);
  const chips = useRef({});
  const rosterRef = useRef(null);
  const railRef = useRef(null);

  const hospitals = getRosterHospitals();
  const options = [{ slug: ALL, name: copy.allLabel, count: items.length }, ...hospitals];
  const chosen = hospitals.find((hospital) => hospital.slug === choice) ?? null;
  const shown = chosen ? items.filter((doctor) => seesPatientsAt(doctor, chosen.name)) : items;
  const runs = groupDoctors(shown, chosen?.name);
  const status = chosen
    ? fillTemplate(copy.statusFiltered, {
        count: shown.length,
        total: items.length,
        branch: chosen.name,
      })
    : fillTemplate(copy.statusAll, { total: items.length });

  useEffect(() => {
    if (!ready) return undefined;
    const timer = window.setTimeout(() => setArrived(true), FIRST_SCREEN_MS);
    return () => window.clearTimeout(timer);
  }, [ready]);

  /* The rail's ends are faded only where there is something past them, the
     doctor rail's device - a fade at an end the reader has already reached
     dims a chip for nothing. Written straight to the DOM: it is a
     measurement of the scroller, not something the render depends on. */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      rail.dataset.start = rail.scrollLeft > 4 ? "true" : "false";
      rail.dataset.end = max > 4 && rail.scrollLeft < max - 4 ? "true" : "false";
    };
    sync();
    /* Chip widths change when the UI face lands, and with them the overflow. */
    document.fonts?.ready.then(sync).catch(() => {});
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  /* Chrome only scrolls a focused element into view when none of it is
     visible, so a chip peeking at the rail's edge stays half under it when
     tabbed to.
     Keyboard focus only, and `:focus-visible` is what tells the two apart: a
     touch focuses the chip on the way down, and scrolling the rail there
     moved the chip out from under the finger - the touchend then landed on
     the rail rather than the chip and the tap selected nothing. */
  const revealChip = (event) => {
    if (!window.matchMedia(PHONE).matches) return;
    if (!event.currentTarget.matches(":focus-visible")) return;
    event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  /* Where the rail is stuck, the head and the readout have scrolled away, so
     a narrowing would change a list the reader cannot see the top of - and a
     narrowing that shortens the page can leave them below its new end. Bring
     the roster back under the rail, and only then. */
  const choose = (slug) => {
    setChoice(slug);
    /* A chip tapped while it was half under the rail's end fade should end up
       whole: horizontal only, since a chip in the stuck rail is already fully
       visible vertically. */
    chips.current[slug]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const roster = rosterRef.current;
    const rail = railRef.current;
    if (!roster || !rail || !window.matchMedia(PHONE).matches) return;
    /* Stuck is the rail sitting on its sticky offset. The roster's own top is
       no test: the readout sits above the rail in the flow, so it is always
       higher, and a first tap at the top of the page moved it 95px. */
    const stuckAt = parseFloat(window.getComputedStyle(rail).top) || 0;
    if (rail.getBoundingClientRect().top > stuckAt + 1) return;
    roster.scrollIntoView({
      block: "start",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  const onKeyDown = (event) => {
    const index = options.findIndex((option) => option.slug === choice);
    let target = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      target = options[(index + 1) % options.length];
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      target = options[(index - 1 + options.length) % options.length];
    } else if (event.key === "Home") {
      target = options[0];
    } else if (event.key === "End") {
      target = options[options.length - 1];
    }
    if (!target) return;
    event.preventDefault();
    choose(target.slug);
    chips.current[target.slug]?.focus({ preventScroll: true });
    chips.current[target.slug]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  return (
    <div className="dr-roster" ref={rosterRef}>
      <motion.div
        className="dr-bar"
        initial={shouldReduceMotion ? false : "hidden"}
        animate={play || shouldReduceMotion ? "shown" : "hidden"}
        variants={bar(delay)}
      >
        <motion.div className="dr-bar__read" variants={RISE}>
          <span className="e-label" id="dr-filter-label">
            {copy.filterLabel}
          </span>
          <p className="dr-status" role="status">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={choice}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: EASE }}
              >
                {status}
              </motion.span>
            </AnimatePresence>
          </p>
        </motion.div>

        <motion.div
          className="dr-filter"
          ref={railRef}
          role="radiogroup"
          aria-labelledby="dr-filter-label"
          onKeyDown={onKeyDown}
          variants={CHIPS}
        >
          {options.map((option) => {
            const checked = option.slug === choice;
            return (
              <motion.button
                key={option.slug}
                type="button"
                className="dr-chip"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                data-on={checked ? "true" : undefined}
                ref={(node) => {
                  chips.current[option.slug] = node;
                }}
                onClick={() => choose(option.slug)}
                onFocus={revealChip}
                variants={RISE}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              >
                {checked ? (
                  <motion.span
                    className="dr-chip__bg"
                    layoutId="dr-chip-bg"
                    aria-hidden="true"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 38 }
                    }
                  />
                ) : null}
                <span className="dr-chip__label">{option.name}</span>
                <span className="dr-chip__count">{option.count}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>

      {/* A run that empties fades out rather than vanishing, and one that
          comes back fades in; the cards inside arrive on their own. A run
          glides to its new place with the cards rather than jumping ahead
          of them, and so does the page's foot (DoctorsPage) - a foot that
          jumped up let a card on its way from the second row slide across
          `Book an appointment`. */}
      <AnimatePresence mode="popLayout" initial={false}>
        {runs.map((run) => (
          <motion.section
            className="dr-run"
            key={run.id}
            aria-labelledby={`dr-run-${run.id}`}
            layout={shouldReduceMotion ? false : "position"}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.26,
              ease: EASE,
              layout: { duration: 0.46, ease: EASE },
            }}
          >
            <h2 className="dr-run__head" id={`dr-run-${run.id}`}>
              {run.label}{" "}
              {/* The count turns over with the choice, so the heading is seen
                to answer it rather than silently changing. */}
              <span className="dr-run__count">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={run.people.length}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: EASE }}
                  >
                    {run.people.length}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h2>
            {run.note ? <p className="dr-run__note">{run.note}</p> : null}

            {/* The list itself carries no layout animation: it has no
                ground of its own to show, and resizing it scaled the cards
                inside toward its middle for a frame or two. */}
            <ul className="dr-grid">
              {/* No `initial={false}` here: it suppresses the entrance for the
                cards present on the first render, which is every card on the
                page, and the whole list arrived already there. */}
              <AnimatePresence mode="popLayout">
                {run.people.map((doctor, position) => (
                  <motion.li
                    className="dr-card"
                    key={doctor.name}
                    layout={!shouldReduceMotion}
                    custom={{ position, lead: arrived ? 0 : delay + FIRST_SCREEN_LEAD }}
                    variants={CARD}
                    initial={shouldReduceMotion ? false : "hidden"}
                    /* Each card rises as it reaches the screen rather than on
                     mount: on a phone the run is two and a half screens long,
                     so a mount-time entrance is spent on cards nobody has
                     scrolled to yet and the rest of the list is simply there.
                     Not before the curtain has lifted, either.
                     The trigger is a distance, not a share: a card whose top
                     is 24px inside the fold (44px with its 20px start offset)
                     rises. A quarter of a 470px desktop card is 117px of
                     blank ground at the fold before anything starts. */
                    whileInView={play ? "shown" : undefined}
                    viewport={{ once: true, margin: "0px 0px -24px 0px" }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0, transition: { duration: 0 } }
                        : { opacity: 0, scale: 0.94, transition: { duration: 0.3, ease: EASE } }
                    }
                    transition={{ layout: { duration: 0.46, ease: EASE } }}
                  >
                    <div className="dr-card__media">
                      <motion.div className="dr-card__frame" variants={SETTLE}>
                        <DoctorPortrait
                          doctor={doctor}
                          className="dr-card__img"
                          loading={position < 4 ? "eager" : "lazy"}
                          sizes="(min-width: 641px) 120px, 104px"
                        />
                      </motion.div>
                    </div>

                    <div className="dr-card__body">
                      <motion.span className="dr-card__specialty" variants={LINE}>
                        {doctor.specialty}
                      </motion.span>
                      <motion.h3 className="dr-card__name" variants={LINE}>
                        {hasProfile(doctor) ? (
                          <Link className="dr-card__link" to={profileHref(doctor)}>
                            {doctor.name}
                          </Link>
                        ) : (
                          doctor.name
                        )}
                        {doctor.qualifications ? " " : null}
                        {doctor.qualifications ? (
                          <span className="dr-card__quals">{doctor.qualifications}</span>
                        ) : null}
                      </motion.h3>
                      {doctor.interests?.length ? (
                        <motion.p className="dr-card__text" variants={LINE}>
                          {describeInterests(doctor)}
                        </motion.p>
                      ) : null}
                      {/* Where and when, on the card's foot: the same lines
                        under every choice, so a card that moves between runs
                        never changes what it says on the way. */}
                      <motion.div className="dr-card__where" variants={LINE}>
                        <DoctorPlaces lines={getDoctorPlaces(doctor)} />
                        {hasProfile(doctor) ? (
                          <span className="dr-card__more" aria-hidden="true">
                            {copy.profile.moreLabel}
                            <ArrowRight size={14} />
                          </span>
                        ) : null}
                      </motion.div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </motion.section>
        ))}
      </AnimatePresence>
    </div>
  );
}
