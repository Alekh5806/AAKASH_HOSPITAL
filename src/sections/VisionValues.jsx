import { useEffect, useRef, useState } from "react";
import Reveal from "../components/Reveal";
import { about } from "../lib/aboutData";

const { vision } = about;

/* A ruled ledger rather than a grid of cards. Six cards said nothing about each
   other; six numbered rows read as one ordered set of rules, scan down a single
   edge, and stay the same shape on a phone as on a desktop - only the copy's
   indent changes, never the order or the content.
 *
 * The row the reader is on lights up. That state comes from scroll position as
 * well as from :hover, because hover does not exist on a touch screen and the
 * section would otherwise be inert on the device most patients use.
 *
 * There is no icon. Six lucide glyphs in six rings were decoration repeated six
 * times - the same mistake the hospitals menu made with six MapPin tiles and the
 * drawer made with a chevron on every nav row. The serif numeral is the marker,
 * and the row is the better for the width it gives back to the copy. */
export default function VisionValues() {
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === "undefined") return undefined;
    const rows = Array.from(list.children);
    if (!rows.length) return undefined;

    // A thin band across the middle of the viewport, so exactly one row is the
    // reader's row at any moment.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveIndex(Number(entry.target.dataset.index));
        });
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 },
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="e-sec ab-values">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{vision.valuesLabel}</span>
          <div className="e-head__body">
            <h2 className="e-h2">{vision.valuesTitle}</h2>
            <p className="e-lede">{vision.valuesLede}</p>
          </div>
        </div>

        <ol className="ab-values__list" ref={listRef}>
          {vision.values.map((value, index) => (
            <li
              className="ab-values__item"
              key={value.title}
              data-index={index}
              data-active={index === activeIndex ? "true" : undefined}
            >
              <Reveal className="ab-values__row" delay={(index % 3) * 0.05}>
                <span className="ab-values__index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="ab-values__lead">
                  <h3 className="e-h3">{value.title}</h3>
                  <p className="ab-values__source">
                    <span className="ab-values__from">{value.sourceKind}</span>
                    <q className="ab-values__quote">{value.source}</q>
                  </p>
                </div>
                <p className="e-body ab-values__text">{value.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
