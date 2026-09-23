import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SmartImage from "../components/SmartImage";
import { doctorsPage, getDoctorHospitals, groupDoctors } from "../lib/doctorsData";

const copy = doctorsPage;
const EASE = [0.22, 1, 0.36, 1];
const ALL = "all";

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
 * The answer is read in two runs - the consultants, then the optometry team -
 * because on a medical site who is a doctor and who is an optometrist is not
 * a detail, and a run with nobody in it is not rendered rather than rendered
 * empty. */
export default function DoctorRoster({ items }) {
  const shouldReduceMotion = useReducedMotion();
  const [choice, setChoice] = useState(ALL);
  const chips = useRef({});

  const hospitals = getDoctorHospitals();
  const options = [{ slug: ALL, name: copy.allLabel, count: items.length }, ...hospitals];
  const chosen = hospitals.find((hospital) => hospital.slug === choice) ?? null;
  const shown = chosen ? items.filter((doctor) => doctor.branches.includes(chosen.name)) : items;
  const runs = groupDoctors(shown);

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
    setChoice(target.slug);
    chips.current[target.slug]?.focus();
  };

  return (
    <div className="dr-roster">
      <div className="dr-bar">
        <div className="dr-bar__read">
          <span className="e-label" id="dr-filter-label">
            {copy.filterLabel}
          </span>
          <p className="dr-status" role="status">
            {chosen
              ? fill(copy.statusFiltered, {
                  count: shown.length,
                  total: items.length,
                  branch: chosen.name,
                })
              : fill(copy.statusAll, { total: items.length })}
          </p>
        </div>

        <div
          className="dr-filter"
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
                onClick={() => setChoice(option.slug)}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
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
            <AnimatePresence mode="popLayout" initial={false}>
              {run.people.map((doctor, position) => (
                <motion.li
                  className="dr-card"
                  key={doctor.name}
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.42,
                    ease: EASE,
                    delay: shouldReduceMotion ? 0 : Math.min(position, 7) * 0.045,
                  }}
                >
                  <div className="dr-card__media">
                    <SmartImage
                      className="dr-card__img"
                      src={doctor.photo}
                      alt={doctor.photoAlt}
                      loading={position < 4 ? "eager" : "lazy"}
                      sizes="(min-width: 1180px) 22vw, (min-width: 641px) 40vw, 96px"
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
