import Reveal from "../components/Reveal";

export default function FAQ({ items, title = "Frequently asked questions" }) {
  if (!items?.length) return null;

  return (
    <section className="section faq-section">
      <div className="container faq-section__inner">
        <div className="section-heading">
          <span className="eyebrow">FAQ</span>
          <h2>{title}</h2>
        </div>
        <div className="faq-list">
          {items.map((item) => (
            <Reveal as="details" key={item.question} className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
