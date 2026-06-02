import Reveal from "./Reveal";

export default function PageHeader({ eyebrow, title, description }) {
  return (
    <section className="page-header section-band">
      <div className="container page-header__inner">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <Reveal as="div" className="page-header__copy">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </Reveal>
      </div>
    </section>
  );
}
