import { Link } from "react-router-dom";
import { buildBranchHref, buildMapLink, cleanTel, getConfirmedPrimaryPhone } from "../lib/contact";
import { doctorsPage, fillTemplate } from "../lib/doctorsData";
import { getBranchHours, getHoursRows } from "../lib/hours";

const copy = doctorsPage.profile;

/* Where and when the doctor can be seen: one card per hospital, in the site's
 * order. A hospital they are based at prints its OPD hours (from its own
 * `hours` block, the figure the hospital page shows); one they visit prints
 * their clinic days where the hospital has given them, and says how to find
 * out where it has not. Each card is the way into that hospital's page, and
 * carries the three things a reader does next - book there, call, go. */
export default function DoctorVisits({ doctor, hospitals }) {
  return (
    <section className="dp-sec dp-where" aria-labelledby="dp-where-title">
      <div className="e-shell">
        <header className="dp-sec__head">
          <span className="e-label">{copy.whereLabel}</span>
          <h2 className="dp-sec__title" id="dp-where-title">
            {fillTemplate(copy.whereTitle, { name: doctor.name })}
          </h2>
        </header>

        <ul className="dp-places" data-count={hospitals.length}>
          {hospitals.map(({ branch, based, schedule }) => {
            const phone = getConfirmedPrimaryPhone(branch);
            const rows = getHoursRows(getBranchHours(branch)).filter((row) => row.open);
            return (
              <li className="dp-place" key={branch.slug}>
                <div className="dp-place__head">
                  <h3 className="dp-place__name">
                    <Link to={buildBranchHref(branch)}>{branch.name}</Link>
                  </h3>
                  <span className="dp-place__tag" data-based={based ? "" : undefined}>
                    {based ? copy.basedTag : copy.visitingTag}
                  </span>
                </div>
                <p className="dp-place__locality">{branch.locality}</p>

                <dl className="dp-place__when">
                  <dt>{based ? copy.hoursLabel : copy.daysLabel}</dt>
                  {based ? (
                    rows.map((row) => (
                      <dd key={row.label}>
                        {row.label}, {row.value}
                      </dd>
                    ))
                  ) : (
                    <dd>{schedule ?? copy.daysUnknown}</dd>
                  )}
                </dl>

                <div className="dp-place__actions">
                  <Link className="e-link" to={`/appointment?branch=${branch.slug}`}>
                    {copy.bookHere}
                    <span className="sr-only"> at {branch.name}</span>
                  </Link>
                  {phone ? (
                    <a className="e-link" href={`tel:${cleanTel(phone)}`}>
                      {copy.callHere}
                      <span className="sr-only">, {branch.name}</span>
                    </a>
                  ) : null}
                  <a
                    className="e-link"
                    href={buildMapLink(branch)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.directions}
                    <span className="sr-only"> to {branch.name}</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
