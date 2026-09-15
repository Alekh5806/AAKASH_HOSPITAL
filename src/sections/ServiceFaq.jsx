import { Link } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import Reveal from "../components/Reveal";
import { serviceDetail } from "../lib/servicesData";

const { questions } = serviceDetail;

/* The questions this service actually gets asked - six or seven of them - as
 * native disclosures.
 *
 * They stay <details> elements rather than a JS accordion: they open without
 * JavaScript, the browser gives them their keyboard behaviour and their
 * expanded state for free, and a reader searching the page with ctrl-F finds
 * answers that are still closed. Several can be open at once, because a reader
 * comparing two answers should not have to keep re-opening the first one.
 *
 * The head sits in its own column beside the list on a wide screen. A heading
 * spanning the full width above seven rows left the right half of every row
 * empty, and the answers need a measure anyway.
 *
 * `Ask us directly` sits at the end of the list, not in the head: a reader who
 * still has a question has it after reading the seven, which on a phone is a
 * screen and a half below where the head was. */
export default function ServiceFaq({ items }) {
  if (!items?.length) return null;

  return (
    <section className="sd-sec sd-faq" id="questions" aria-labelledby="sd-faq-title">
      <div className="e-shell sd-faq__shell">
        <Reveal className="sd-faq__head">
          <span className="sd-label">{questions.label}</span>
          <h2 className="sd-h2" id="sd-faq-title">
            {questions.title}
          </h2>
          <p className="sd-faq__lede">{questions.lede}</p>
        </Reveal>

        <Reveal className="sd-faq__list" delay={0.05}>
          {items.map((item, position) => (
            <details className="sd-faq__item" key={item.question}>
              <summary className="sd-faq__q">
                <span className="sd-faq__num" aria-hidden="true">
                  {String(position + 1).padStart(2, "0")}
                </span>
                <span className="sd-faq__text">{item.question}</span>
                <span className="sd-faq__sign" aria-hidden="true">
                  <Plus size={16} />
                </span>
              </summary>
              <div className="sd-faq__body">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}

          <p className="sd-faq__ask">
            <span>{questions.askLabel}</span>
            <Link className="e-link" to="/contact">
              {questions.ctaLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
