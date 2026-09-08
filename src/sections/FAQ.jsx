import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FAQ({ items, label = "10 &mdash; Questions", title = "Common questions" }) {
  if (!items?.length) return null;

  return (
    <section className="e-sec e-sec--paper e-faq-section" aria-labelledby="e-faq-title">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{label}</span>
          <div className="e-head__body e-head__row">
            <h2 className="e-h2" id="e-faq-title">
              {title}
            </h2>
            <Link className="e-link" to="/contact">
              Ask us directly
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="e-faq">
          {items.map((item, index) => (
            <details key={item.question}>
              <summary>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{item.question}</span>
                <span className="e-faq__sign" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="e-faq__body">
                <span aria-hidden="true" />
                <p className="e-faq__answer">{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
