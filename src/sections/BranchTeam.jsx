import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import DoctorPlaces from "../components/DoctorPlaces";
import DoctorPortrait from "../components/DoctorPortrait";
import { branchPage } from "../lib/branchData";
import {
  describeInterests,
  doctorsPage,
  getDoctorPlaces,
  hasProfile,
  listNames,
  profileHref,
} from "../lib/doctorsData";
import { fillTemplate } from "../lib/servicesData";

const { team: copy } = branchPage;
/* The visiting group's name and note are the doctors page's own, so the two
   pages can never call it different things. */
const visitingGroup = doctorsPage.groups.find((group) => group.id === "visiting");

/* The doctors page's card, seen from this hospital: its place lines say only
   what a reader here does not already know - the doctor's other hospitals,
   or the days a visiting specialist is here. */
function DoctorCard({ doctor, here, heading: Heading }) {
  const places = getDoctorPlaces(doctor, here);
  return (
    <li className="br-doc">
      <div className="br-doc__media">
        <DoctorPortrait
          doctor={doctor}
          className="br-doc__img"
          sizes="(min-width: 641px) 120px, 92px"
        />
      </div>
      <div className="br-doc__body">
        <span className="br-doc__specialty">{doctor.specialty}</span>
        <Heading className="br-doc__name">
          {hasProfile(doctor) ? (
            <Link className="br-doc__link" to={profileHref(doctor)}>
              {doctor.name}
            </Link>
          ) : (
            doctor.name
          )}
          {doctor.qualifications ? " " : null}
          {doctor.qualifications ? (
            <span className="br-doc__quals">{doctor.qualifications}</span>
          ) : null}
        </Heading>
        {doctor.interests?.length ? (
          <p className="br-doc__text">{describeInterests(doctor)}</p>
        ) : null}
        {places.length ? (
          <div className="br-doc__where">
            <DoctorPlaces lines={places} />
          </div>
        ) : null}
        {hasProfile(doctor) ? (
          <span className="br-doc__more" aria-hidden="true">
            {doctorsPage.profile.moreLabel}
            <ArrowRight size={14} />
          </span>
        ) : null}
      </div>
    </li>
  );
}

/* The people who see patients at this hospital, and nobody else.
 *
 * Not the full team: /doctors owns the team, and the link at the head of the
 * section is the way there. The consultants come first; the specialists who
 * hold clinics here on set days follow under their own heading, because a
 * patient cannot walk in and see them any day; and the optometrists are named
 * in one line under both with their faces stacked beside it, so the reader
 * knows the hospital does its own refraction without the page growing a card
 * for each of them. */
export default function BranchTeam({ branch, team }) {
  if (!team?.doctors.length && !team?.visiting.length) return null;

  const supportNote =
    team.optometrists.length === 1
      ? copy.supportNoteOne
      : fillTemplate(copy.supportNote, { count: team.optometrists.length });

  return (
    <section className="e-sec e-sec--tight br-team" aria-labelledby="br-team-title">
      <div className="e-shell">
        <div className="e-head br-team__head">
          <span className="e-label">{copy.label}</span>
          <div className="e-head__body e-head__row">
            <h2 className="e-h2" id="br-team-title">
              {copy.title} <em>{branch.name}</em>
            </h2>
            <Link className="e-link" to="/doctors">
              {copy.ctaLabel}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <p className="e-lede br-team__lede">{copy.lede}</p>
          </div>
        </div>

        {team.doctors.length ? (
          <ul className="br-team__grid" data-count={Math.min(team.doctors.length, 2)}>
            {team.doctors.map((doctor) => (
              <DoctorCard key={doctor.name} doctor={doctor} here={branch.name} heading="h3" />
            ))}
          </ul>
        ) : null}

        {team.visiting.length ? (
          <div className="br-team__group">
            <h3 className="br-team__group-title">{visitingGroup.label}</h3>
            <p className="br-team__group-note">{visitingGroup.note}</p>
            <ul className="br-team__grid" data-count={Math.min(team.visiting.length, 2)}>
              {team.visiting.map((doctor) => (
                <DoctorCard key={doctor.name} doctor={doctor} here={branch.name} heading="h4" />
              ))}
            </ul>
          </div>
        ) : null}

        {team.optometrists.length ? (
          <div className="br-team__support">
            <span className="br-team__faces" aria-hidden="true">
              {team.optometrists.map((person) => (
                <DoctorPortrait key={person.name} doctor={person} decorative />
              ))}
            </span>
            <p>
              {supportNote}{" "}
              <span>{listNames(team.optometrists.map((person) => person.name))}.</span>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
