import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SmartImage from "../components/SmartImage";
import { doctorsPage, getDoctorHospitals, groupDoctors } from "../lib/doctorsData";

const copy = doctorsPage;
const EASE = [0.22, 1, 0.36, 1];
const ALL = "all";
const PHONE = "(max-width: 640px)";

/* Not imported from servicesData: that module pulls services.json in with it,
   and this route has no other reason to carry the eleven services. */
function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (token, key) =>
    key in values ? String(values[key]) : token,
  );
}

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
 * The answer is read in two runs - the consultants, then the optometry team -
 * because on a medical site who is a doctor and who is an optometrist is not
 * a detail, and a run with nobody in it is not rendered rather than rendered
 * empty. */
export default function DoctorRoster({ items }) {
  const shouldReduceMotion = useReducedMotion();
  const [choice, setChoice] = useState(ALL);
  const chips = useRef({});
  const rosterRef = useRef(null);
  const railRef = useRef(null);

  const hospitals = getDoctorHospitals();
  const options = [{ slug: ALL, name: copy.allLabel, count: items.length }, ...hospitals];
  const chosen = hospitals.find((hospital) => hospital.slug === choice) ?? null;
  const shown = chosen ? items.filter((doctor) => doctor.branches.includes(chosen.name)) : items;
  const runs = groupDoctors(shown);
  const status = chosen
    ? fill(copy.statusFiltered, {
        count: shown.length,
        total: items.length,
        branch: chosen.name,
      })
    : fill(copy.statusAll, { total: items.length });

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
    if (roster.getBoundingClientRect().top >= rail.getBoundingClientRect().top) return;
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
      <div className="dr-bar">
        <div className="dr-bar__read">
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
        </div>

        <div
          className="dr-filter"
          ref={railRef}
          role="radiogroup"
          aria-labelledby="dr-filter-label"
          onKeyDown={onKeyDown}
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
        </div>
      </div>

      {runs.map((run) => (
        <section className="dr-run" key={run.id} aria-labelledby={`dr-run-${run.id}`}>
          <h2 className="dr-run__head" id={`dr-run-${run.id}`}>
            {run.label}
            <span className="dr-run__count">{run.people.length}</span>
          </h2>

          <motion.ul className="dr-grid" layout={!shouldReduceMotion}>
            {/* No `initial={false}` here: it suppresses the entrance for the
                cards present on the first render, which is every card on the
                page, and the whole list arrived already there. */}
            <AnimatePresence mode="popLayout">
              {run.people.map((doctor, position) => (
                <motion.li
                  className="dr-card"
                  key={doctor.name}
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
                  /* Each card rises as it reaches the screen rather than on
                     mount: on a phone the run is two and a half screens long,
                     so a mount-time entrance is spent on cards nobody has
                     scrolled to yet and the rest of the list is simply there. */
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.25 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.46,
                    ease: EASE,
                    delay: shouldReduceMotion ? 0 : Math.min(position, 3) * 0.05,
                  }}
                >
                  <div className="dr-card__media">
                    <SmartImage
                      className="dr-card__img"
                      src={doctor.photo}
                      alt={doctor.photoAlt}
                      loading={position < 4 ? "eager" : "lazy"}
                      sizes="(min-width: 1024px) 22vw, (min-width: 641px) 30vw, 104px"
                    />
                  </div>

                  <div className="dr-card__body">
                    <span className="dr-card__specialty">{doctor.specialty}</span>
                    {/* Some records carry the specialty as the qualification
                        too - `Medical Officer, Medical Officer` is the same
                        words twice. */}
                    <h3 className="dr-card__name">
                      {doctor.name}
                      {doctor.qualifications && doctor.qualifications !== doctor.specialty ? (
                        <span className="dr-card__quals">{doctor.qualifications}</span>
                      ) : null}
                    </h3>
                    {/* No hospital row under the sentence: every `highlight`
                        opens by naming the hospital, so a labelled line
                        repeating it would be the same words twice - the call
                        the landing rail's cards already make. */}
                    <p className="dr-card__text">{doctor.highlight ?? doctor.bio}</p>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </section>
      ))}
    </div>
  );
}
