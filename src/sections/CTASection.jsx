import { CalendarDays, MapPinned } from "lucide-react";
import ButtonLink from "../components/ButtonLink";
import Reveal from "../components/Reveal";

export default function CTASection({ cta }) {
  return (
    <section className="section cta-section">
      <div className="container">
        <Reveal className="cta-panel">
          <div>
            <span className="eyebrow">Appointments</span>
            <h2>{cta.title}</h2>
            <p>{cta.description}</p>
          </div>
          <div className="cta-panel__actions">
            <ButtonLink to={cta.primary.href} icon={CalendarDays}>
              {cta.primary.label}
            </ButtonLink>
            <ButtonLink to={cta.secondary.href} variant="secondary" icon={MapPinned}>
              {cta.secondary.label}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
