import { useReducedMotion } from "framer-motion";

/* The rows and acuity fractions of the standard Snellen chart, as on the wall
   of every examination room. Sizes are in viewBox units and fall in the same
   proportion the real chart uses. */
const ROWS = [
  { letters: "E", size: 62, acuity: "20/200" },
  { letters: "L T", size: 44, acuity: "20/100" },
  { letters: "F P H", size: 33, acuity: "20/70" },
  { letters: "O L C F", size: 25, acuity: "20/50" },
  { letters: "D H J B S", size: 20, acuity: "20/40" },
  { letters: "E P T Z O", size: 16, acuity: "20/30" },
  { letters: "C F D H J", size: 13, acuity: "20/25" },
  { letters: "L T I P H", size: 11, acuity: "20/20" },
];

/* Rows sit at the baselines a real chart uses - a big gap under the E, then
   tightening as the letters shrink. */
const BASELINES = [72, 140, 194, 240, 280, 314, 343, 368];

const VIEW = "0 0 260 392";

function Chart({ ghost = false }) {
  return (
    <svg
      className={`sv-scene__chart${ghost ? " sv-scene__chart--ghost" : ""}`}
      viewBox={VIEW}
      preserveAspectRatio="xMidYMin slice"
      focusable="false"
    >
      {ROWS.map((row, index) => (
        <g key={row.acuity}>
          <text
            className="sv-scene__row"
            x="118"
            y={BASELINES[index]}
            fontSize={row.size}
            textAnchor="middle"
          >
            {row.letters}
          </text>
          <text
            className="sv-scene__acuity"
            x="248"
            y={BASELINES[index] - row.size * 0.32}
            textAnchor="end"
          >
            {row.acuity}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* An eye chart that shows what a symptom does to vision. It is the symptoms
   route's counterpart to the anatomy drawing: there a patient points at where
   the trouble is, here they recognise what it looks like.
 *
 * It is the Snellen chart, redrawn rather than embedded: a raster would blur
   under its own effects, could not be themed, and would ship bytes for a thing
   eight lines of text describe exactly.
 *
 * `visual` names the effect and CSS draws it, so a new concern needs a word
   in the JSON and nothing here. There is one chart per route, never one per
   option: a 60px thumbnail beside every symptom was tried, and at that size
   blur, haze, glare and clear all read as the same fuzzy E - thirteen of them
   were noise, not a comparison. `idle` says no symptom is being shown, which
   is when the caption offers its `hint`.
 *
 * The effects are how patients commonly describe their sight, not clinical
   findings - the note under the console says so, and nothing in this frame
   should ever read as a diagnosis. The chart is aria-hidden: the buttons carry
   the words. Under prefers-reduced-motion the floaters hold still rather than
   drift, and every effect still renders in its finished state. */
export default function SymptomScene({ visual = "clear", label, heading, hint, idle = false }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="sv-scene"
      data-visual={visual}
      data-idle={idle ? "true" : undefined}
      data-still={shouldReduceMotion ? "true" : undefined}
      aria-hidden="true"
    >
      <div className="sv-scene__frame">
        {/* drawn twice so "double" can offset a ghost of it */}
        <Chart />
        <Chart ghost />

        {/* effect layers - each one only shows for the visual that owns it */}
        <span className="sv-scene__haze" />
        <span className="sv-scene__glare sv-scene__glare--a" />
        <span className="sv-scene__glare sv-scene__glare--b" />
        <span className="sv-scene__glare sv-scene__glare--c" />
        <span className="sv-scene__floater sv-scene__floater--a" />
        <span className="sv-scene__floater sv-scene__floater--b" />
        <span className="sv-scene__floater sv-scene__floater--c" />
        <span className="sv-scene__spots" />
        <span className="sv-scene__vignette" />
        <span className="sv-scene__lid" />
      </div>

      {heading || label || hint ? (
        <div className="sv-scene__caption">
          {heading ? <span className="sv-scene__eyebrow">{heading}</span> : null}
          {label ? <p className="sv-scene__label">{label}</p> : null}
          {hint ? <p className="sv-scene__hint">{hint}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
