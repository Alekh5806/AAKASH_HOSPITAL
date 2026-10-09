import { createElement, useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import Reveal from "../components/Reveal";
import { about } from "../lib/aboutData";
import { getIcon } from "../lib/icons";

const { vision } = about;

/* How far down the screen the reading line sits. A word is lit once the
   statement has been read past it, so the lit text always ends a little under
   the middle of the screen, where the reader's eye is. */
const READ_LINE = 0.62;

/* The statements are the hospital's own words and are quoted verbatim, so the
   only editorial decision here is which phrase carries the promise. `highlight`
   names a substring of `text` and is lifted into the accent serif; a phrase that
   does not appear in the sentence is simply ignored rather than dropped or
   duplicated, so a wording change can never silently lose part of a statement.

   Every word is its own span carrying its place in the sentence (`--at`, 0 to
   1), which is what the reading light below is measured against. */
function splitStatement(text, highlight) {
  const at = highlight ? text.indexOf(highlight) : -1;
  const parts =
    at < 0
      ? [{ text, mark: false }]
      : [
          { text: text.slice(0, at), mark: false },
          { text: highlight, mark: true },
          { text: text.slice(at + highlight.length), mark: false },
        ];
  const split = parts.map((part) => part.text.split(/(\s+)/));
  const isWord = (token) => token !== "" && !/^\s+$/.test(token);
  const count = split.flat().filter(isWord).length;
  let index = 0;

  return parts.map((part, partIndex) => {
    const tokens = split[partIndex].map((token, tokenIndex) => {
      if (!isWord(token)) return token;
      const place = index / count;
      index += 1;
      return (
        <span className="ab-say__word" key={tokenIndex} style={{ "--at": place.toFixed(4) }}>
          {token}
        </span>
      );
    });
    return part.mark ? (
      <em className="ab-say__mark" key={partIndex}>
        {tokens}
      </em>
    ) : (
      <span key={partIndex}>{tokens}</span>
    );
  });
}

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export default function VisionStatements() {
  const listRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  /* The reading light: each statement lights word by word as it is scrolled
     past the reading line, and the ring round its mark fills with it. One
     number per statement (`--read`) is written straight to the DOM - it is a
     measurement of the scroll, not render state - and CSS turns it into each
     word's opacity. Reduced motion never sets it, and the CSS fallback is a
     statement read in full. */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || shouldReduceMotion) return undefined;
    const items = Array.from(list.querySelectorAll(".ab-say__item"));
    const texts = items.map((item) => item.querySelector(".ab-say__text"));
    let frame = 0;
    let watching = false;

    const paint = () => {
      frame = 0;
      const line = window.innerHeight * READ_LINE;
      const reads = texts.map((text) => {
        const box = text.getBoundingClientRect();
        return clamp01((line - box.top) / Math.max(1, box.height));
      });
      items.forEach((item, index) => item.style.setProperty("--read", reads[index].toFixed(4)));
    };
    const schedule = () => {
      if (watching && !frame) frame = requestAnimationFrame(paint);
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              watching = entry.isIntersecting;
              schedule();
            },
            { rootMargin: "25% 0px 25% 0px" },
          );
    if (observer) observer.observe(list);
    else watching = true;

    paint();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      items.forEach((item) => item.style.removeProperty("--read"));
    };
  }, [shouldReduceMotion]);

  return (
    <section className="e-sec e-sec--dark ab-say">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{vision.statementsLabel}</span>
          <div className="e-head__body">
            <h2 className="e-h2">{vision.statementsTitle}</h2>
          </div>
        </div>

        <ol className="ab-say__list" ref={listRef}>
          {vision.statements.map((statement, index) => (
            <li className="ab-say__item" key={statement.kind}>
              <Reveal className="ab-say__mark-col" delay={index * 0.05}>
                <span className="ab-say__icon" aria-hidden="true">
                  <svg className="ab-say__ring" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="23" pathLength="1" />
                  </svg>
                  {createElement(getIcon(statement.icon), { size: 22 })}
                </span>
                <span className="ab-say__index" aria-hidden="true">
                  {statement.index}
                </span>
                <h3 className="ab-say__kind">{statement.kind}</h3>
              </Reveal>

              <Reveal className="ab-say__body" delay={index * 0.05 + 0.08}>
                <p className="ab-say__text">
                  {splitStatement(statement.text, statement.highlight)}
                </p>
                <p className="ab-say__note">{statement.note}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
