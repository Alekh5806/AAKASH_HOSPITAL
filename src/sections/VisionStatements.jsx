import { createElement } from "react";
import Reveal from "../components/Reveal";
import { about } from "../lib/aboutData";
import { getIcon } from "../lib/icons";

const { vision } = about;

/* The statements are the hospital's own words and are quoted verbatim, so the
   only editorial decision here is which phrase carries the promise. `highlight`
   names a substring of `text` and is lifted into the accent serif; a phrase that
   does not appear in the sentence is simply ignored rather than dropped or
   duplicated, so a wording change can never silently lose part of a statement. */
function emphasise(text, highlight) {
  const at = highlight ? text.indexOf(highlight) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <em className="ab-say__mark">{highlight}</em>
      {text.slice(at + highlight.length)}
    </>
  );
}

export default function VisionStatements() {
  return (
    <section className="e-sec e-sec--dark ab-say">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{vision.statementsLabel}</span>
          <div className="e-head__body">
            <h2 className="e-h2">{vision.statementsTitle}</h2>
          </div>
        </div>

        <ol className="ab-say__list">
          {vision.statements.map((statement, index) => (
            <li className="ab-say__item" key={statement.kind}>
              <Reveal className="ab-say__mark-col" delay={index * 0.05}>
                <span className="ab-say__icon" aria-hidden="true">
                  {createElement(getIcon(statement.icon), { size: 22 })}
                </span>
                <span className="ab-say__index" aria-hidden="true">
                  {statement.index}
                </span>
                <h3 className="ab-say__kind">{statement.kind}</h3>
              </Reveal>

              <Reveal className="ab-say__body" delay={index * 0.05 + 0.08}>
                <p className="ab-say__text">{emphasise(statement.text, statement.highlight)}</p>
                <p className="ab-say__note">{statement.note}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
