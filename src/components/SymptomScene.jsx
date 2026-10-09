import { useReducedMotion } from "framer-motion";
import { SNELLEN_BASELINES, SNELLEN_ROWS, SNELLEN_VIEW } from "../lib/snellen";

function Chart({ ghost = false }) {
  return (
    <svg
      className={`sv-scene__chart${ghost ? " sv-scene__chart--ghost" : ""}`}
      viewBox={SNELLEN_VIEW}
      preserveAspectRatio="xMidYMin slice"
      focusable="false"
    >
      {SNELLEN_ROWS.map((row, index) => (
        <g key={row.acuity}>
          <text
            className="sv-scene__row"
            x="118"
            y={SNELLEN_BASELINES[index]}
            fontSize={row.size}
            textAnchor="middle"
          >
            {row.letters}
          </text>
          <text
            className="sv-scene__acuity"
            x="248"
            y={SNELLEN_BASELINES[index] - row.size * 0.32}
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
