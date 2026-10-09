import doctorsRaw from "../data/doctors.json";
import { branches } from "./coreData";
import { getHoursRows } from "./hours";

export const doctors = doctorsRaw;
export const doctorsPage = doctorsRaw.page;

const SITE_ORDER = branches.items.map((branch) => branch.name);
const listFormat = new Intl.ListFormat("en-GB");

/* Not imported from servicesData: that module pulls services.json in with it,
   and the doctors page has no other reason to carry the eleven services. */
export function fillTemplate(template = "", values = {}) {
  return template.replace(/\{(\w+)\}/g, (token, key) =>
    key in values ? String(values[key]) : token,
  );
}

function bySiteOrder(first, second) {
  return SITE_ORDER.indexOf(first) - SITE_ORDER.indexOf(second);
}

/* Optometry is read off the specialty rather than stored as a flag, so one
   rule decides it for the roster's runs, a hospital's team and the counts. */
export function isOptometrist(doctor) {
  return /optometr/i.test(doctor.specialty);
}

/* The consultants: what the hero, the numbers band and the journey's closing
   figure all count, so the three can never disagree. */
export const specialists = doctorsRaw.items.filter((doctor) => !isOptometrist(doctor));

/* "Dr. Vishnu S. Patel" -> "VP": first and last name, the title and middle
   initials dropped. */
export function getInitials(name) {
  const parts = name
    .replace(/^(Dr|Mr|Mrs|Ms)\.\s*/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function visitsOf(doctor) {
  return doctor.visiting ?? [];
}

/* A hospital is named by its display name in branches.json, not its slug. A
   doctor sees patients there if it is one of their own hospitals or one they
   visit. */
export function seesPatientsAt(doctor, hospital) {
  return (
    doctor.branches.includes(hospital) ||
    visitsOf(doctor).some((visit) => visit.branch === hospital)
  );
}

function hospitalsOf(doctor) {
  const names = new Set([...doctor.branches, ...visitsOf(doctor).map((visit) => visit.branch)]);
  return [...names].sort(bySiteOrder);
}

/* Every hospital a doctor sees patients at, in the site's own order, as one
   line: `Visnagar, Ahmedabad and Gota`. */
export function describeHospitals(doctor) {
  return listFormat.format(hospitalsOf(doctor));
}

/* Which run a doctor reads in, seen from one hospital or (with none) from the
   whole network: someone who only visits it is a visiting specialist, and
   everyone else is split into the consultants and the optometry team. */
function runOf(doctor, hospital) {
  const visiting = hospital ? !doctor.branches.includes(hospital) : doctor.branches.length === 0;
  if (visiting) return "visiting";
  return isOptometrist(doctor) ? "optometry" : "doctors";
}

/* The roster's filter, derived from branches.json in the site's own order. A
   hospital with nobody listed is left out rather than offered as an empty
   answer. */
export function getRosterHospitals() {
  return branches.items
    .map((branch) => ({
      slug: branch.slug,
      name: branch.name,
      count: doctorsRaw.items.filter((doctor) => seesPatientsAt(doctor, branch.name)).length,
    }))
    .filter((hospital) => hospital.count > 0);
}

/* The runs in the order doctors.json lists them, each holding the people who
   read in it; a run with nobody in it is left out. */
export function groupDoctors(items, hospital = null) {
  return doctorsPage.groups
    .map((group) => ({
      ...group,
      people: items.filter((doctor) => runOf(doctor, hospital) === group.id),
    }))
    .filter((group) => group.people.length);
}

/* The areas of interest as one sentence-cased line. The JSON keeps each in
   the case it takes mid-sentence, so acronyms stay acronyms. A short term
   holds together (`Femto LASIK` broke across two lines in a phone's card);
   a long one is still free to wrap. */
export function describeInterests(doctor) {
  if (!doctor.interests?.length) return "";
  const terms = doctor.interests.map((term) =>
    term.length <= 16 ? term.replace(/ /g, " ") : term,
  );
  const line = listFormat.format(terms);
  return `${line[0].toUpperCase()}${line.slice(1)}`;
}

/* A visiting clinic's days and hours, printed the way a hospital's OPD hours
   are: `Tuesday and Saturday, 10:00 AM - 5:00 PM`. */
function describeVisit(visit) {
  return getHoursRows({ schedule: visit.schedule, closedDays: [] })
    .map((row) => `${row.label}, ${row.value}`)
    .join("; ");
}

/* Where and when a doctor can be seen, as short lines for a card's foot
 * (rendered by components/DoctorPlaces.jsx).
 *
 * With no hospital the lines say everything: their own hospitals, then each
 * hospital they visit, with its days where the hospital has given them. Seen
 * from one hospital's page they say only what that page's reader does not
 * already know: the doctor's other hospitals, or - for a visiting specialist -
 * where they are based and the days they are here. */
export function getDoctorPlaces(doctor, here = null) {
  const copy = doctorsPage.card;
  const own = [...doctor.branches].sort(bySiteOrder);
  const visits = [...visitsOf(doctor)].sort((first, second) =>
    bySiteOrder(first.branch, second.branch),
  );

  if (!here) {
    return [
      own.length ? placeLine(copy.seesAt, { hospitals: hospitalParts(own) }) : null,
      ...visits.map((visit) =>
        visit.schedule
          ? placeLine(copy.visitsOn, {
              hospital: hospitalParts([visit.branch]),
              schedule: describeVisit(visit),
            })
          : placeLine(copy.visits, { hospital: hospitalParts([visit.branch]) }),
      ),
    ].filter(Boolean);
  }

  if (own.includes(here)) {
    const others = hospitalsOf(doctor).filter((name) => name !== here);
    return others.length ? [placeLine(copy.alsoAt, { hospitals: hospitalParts(others) })] : [];
  }

  const visit = visits.find((entry) => entry.branch === here);
  return [
    own.length ? placeLine(copy.seesAt, { hospitals: hospitalParts(own) }) : null,
    visit?.schedule ? placeLine(copy.hereOn, { schedule: describeVisit(visit) }) : null,
  ].filter(Boolean);
}

/* A place line is a list of parts - `{ text }`, or `{ hospital }` naming one
   by its display name - so a card can make each hospital the way into its
   page while the sentence reads exactly as the template writes it. */
function hospitalParts(names) {
  return listFormat
    .formatToParts(names)
    .map((part) => (part.type === "element" ? { hospital: part.value } : { text: part.value }));
}

function placeLine(template, values) {
  return template
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .flatMap((piece) => {
      const key = /^\{(\w+)\}$/.exec(piece)?.[1];
      if (!key || !(key in values)) return [{ text: piece }];
      return Array.isArray(values[key]) ? values[key] : [{ text: String(values[key]) }];
    });
}

/* One hospital's team for its own page, split the way the roster splits it. */
export function getBranchTeam(branch) {
  const team = doctorsRaw.items.filter((doctor) => seesPatientsAt(doctor, branch.name));
  const run = (id) => team.filter((doctor) => runOf(doctor, branch.name) === id);
  return { doctors: run("doctors"), visiting: run("visiting"), optometrists: run("optometry") };
}

export function listNames(names) {
  return listFormat.format(names);
}

/* ---------- a doctor's own page ----------
 *
 * Every doctor carrying a `slug` in doctors.json has a page at
 * /doctors/<slug> - the nineteen who see patients as doctors. The optometry
 * team is read on the roster and the hospital pages: a page for a name and a
 * degree would be thin, and nobody searches for an optometrist by name. */

export function hasProfile(doctor) {
  return Boolean(doctor?.slug);
}

export function profileHref(doctor) {
  return `/doctors/${doctor.slug}`;
}

export function getDoctorBySlug(slug) {
  return doctorsRaw.items.find((doctor) => doctor.slug === slug && hasProfile(doctor)) ?? null;
}

export const profiles = doctorsRaw.items.filter(hasProfile);

/* The hospitals a doctor sees patients at, in the site's order, each with
   whether they are based there and - for a hospital they visit - the days,
   where the hospital has given them. */
export function getDoctorHospitals(doctor) {
  return branches.items.flatMap((branch) => {
    if (doctor.branches.includes(branch.name)) return [{ branch, based: true, schedule: null }];
    const visit = visitsOf(doctor).find((entry) => entry.branch === branch.name);
    if (!visit) return [];
    return [{ branch, based: false, schedule: visit.schedule ? describeVisit(visit) : null }];
  });
}

/* The doctors a reader might also see: the others with a page who share a
   hospital, those sharing the most hospitals first, then in the data's order. */
export function getColleagues(doctor, limit = 6) {
  const mine = new Set(hospitalsOf(doctor));
  return profiles
    .filter((other) => other !== doctor)
    .map((other, index) => ({
      other,
      index,
      shared: hospitalsOf(other).filter((name) => mine.has(name)).length,
    }))
    .filter((entry) => entry.shared > 0)
    .sort((first, second) => second.shared - first.shared || first.index - second.index)
    .slice(0, limit)
    .map((entry) => entry.other);
}

/* The page's head, written from the data: `Dr. Name, Specialty` with the
   brand where it fits, and the richest description that fits 160 characters:
   every area of interest, then the first three, then none - each with the
   qualifications and then without them. */
export function getProfileSeo(doctor) {
  const copy = doctorsPage.profile;
  const brand = " | Aakash Eye Hospital";
  const base = fillTemplate(copy.seoTitle, { name: doctor.name, specialty: doctor.specialty });
  const interestsLine = (terms) =>
    terms.length ? fillTemplate(copy.seoInterests, { interests: listFormat.format(terms) }) : "";
  const all = interestsLine(doctor.interests ?? []);
  const firstThree = interestsLine((doctor.interests ?? []).slice(0, 3));
  const values = {
    name: doctor.name,
    qualifications: doctor.qualifications,
    specialty: doctor.specialty,
    hospitals: describeHospitals(doctor),
  };
  const candidates = [all, firstThree, ""].flatMap((interests) => [
    fillTemplate(copy.seoDescription, { ...values, interests }),
    fillTemplate(copy.seoDescriptionShort, { ...values, interests }),
  ]);
  return {
    title: base.length + brand.length <= 65 ? `${base}${brand}` : base,
    description: candidates.find((text) => text.length <= 160) ?? candidates[candidates.length - 1],
    image: doctor.photo,
    imageAlt: doctor.photo
      ? fillTemplate(copy.imageAlt, { name: doctor.name, specialty: doctor.specialty })
      : undefined,
  };
}
