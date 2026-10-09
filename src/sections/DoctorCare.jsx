import { Link } from "react-router-dom";
import { doctorsPage, fillTemplate } from "../lib/doctorsData";

const copy = doctorsPage.profile;

/* The treatments to see this doctor for - their own `services` in
 * doctors.json, drawn from the interests and specialty they listed - each the
 * way into the service's page, with the picture and the sentence the services
 * index uses for it. Rows, not cards: the services index reads as a ledger,
 * and a row says the same thing in a third of the height. */
export default function DoctorCare({ doctor, services }) {
  if (!services.length) return null;

  return (
    <section className="dp-sec dp-care" aria-labelledby="dp-care-title">
      <div className="e-shell">
        <header className="dp-sec__head">
          <span className="e-label">{copy.careLabel}</span>
          <h2 className="dp-sec__title" id="dp-care-title">
            {fillTemplate(copy.careTitle, { name: doctor.name })}
          </h2>
        </header>

        <ul className="dp-care__list" data-count={services.length}>
          {services.map((service) => (
            <li key={service.slug}>
              <Link className="dp-care__link" to={`/services/${service.slug}`}>
                <img
                  className="dp-care__thumb"
                  src={service.thumb}
                  alt=""
                  width="240"
                  height="240"
                  loading="lazy"
                  decoding="async"
                />
                <span className="dp-care__text">
                  <span className="dp-care__title">{service.title}</span>
                  <span className="dp-care__desc">{service.shortDescription}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
