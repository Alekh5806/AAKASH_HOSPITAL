import Reveal from "./Reveal";

export default function PageHeader({ eyebrow, title, description, image, variant = "default" }) {
  const style = image ? { "--page-header-image": `url(${image})` } : undefined;

  return (
    <section
      className={`page-header page-header--${variant}${image ? " page-header--image" : ""} section-band`}
      style={style}
    >
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
