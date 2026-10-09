import { Link } from "react-router-dom";
import DoctorPortrait from "../components/DoctorPortrait";
import { describeHospitals, doctorsPage, fillTemplate, profileHref } from "../lib/doctorsData";

const copy = doctorsPage.profile;

/* The other doctors at the same hospitals, each the way into their own page -
 * so a reader comparing two surgeons, or looking for the retina specialist at
 * the hospital they already know, never has to go back to the roster. */
export default function DoctorColleagues({ doctor, colleagues }) {
  if (!colleagues.length) return null;

  return (
    <section className="dp-sec dp-team" aria-labelledby="dp-team-title">
      <div className="e-shell">
        <header className="dp-sec__head">
          <span className="e-label">{copy.teamLabel}</span>
          <h2 className="dp-sec__title" id="dp-team-title">
            {fillTemplate(copy.teamTitle, { hospitals: describeHospitals(doctor) })}
          </h2>
        </header>

        <ul className="dp-team__list">
          {colleagues.map((colleague) => (
            <li key={colleague.slug}>
              <Link className="dp-mate" to={profileHref(colleague)}>
                <span className="dp-mate__face">
                  <DoctorPortrait
                    doctor={colleague}
                    className="dp-mate__img"
                    sizes="64px"
                    decorative
                  />
                </span>
                <span className="dp-mate__text">
                  <span className="dp-mate__name">{colleague.name}</span>
                  <span className="dp-mate__role">{colleague.specialty}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
