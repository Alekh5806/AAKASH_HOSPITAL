import { branches, navigation, site } from "./coreData";
import { buildBranchHref } from "./contact";
import { describeHospitals, fillTemplate, profileHref, profiles, specialists } from "./doctorsData";
import { services } from "./servicesData";

export const notFoundPage = site.notFound;

/* The path the prerender writes the not-found page at (404.html). Any path no
   route claims would do; this one says what it is. A host serves that file
   for every unknown address, so the page reads the address from the browser,
   and at this path it knows only that it was opened as itself. */
export const NOT_FOUND_PATH = "/404";

const SITE_HOST = new URL(site.defaultSeo.url).host;
const LONGEST_PATH = 72;

/* The address as the reader typed it, for the page to say back to them, or
   null where the page cannot know it. */
export function describeTried(pathname) {
  if (!pathname || pathname === NOT_FOUND_PATH || pathname === "/") return null;
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // A malformed escape is shown as it arrived.
  }
  if (path.length > LONGEST_PATH) path = `${path.slice(0, LONGEST_PATH - 3)}...`;
  return { host: SITE_HOST, path };
}

/* ---------- the pages a lost reader can be sent to ---------- */

/* A page's title is what the header calls it, so the two never disagree;
   only a page the header does not list carries a title of its own. */
const NAV_LINKS = new Map(
  navigation.header.flatMap((item) => item.children ?? [item]).map((link) => [link.href, link]),
);

const FIGURES = {
  services: services.items.length,
  specialists: specialists.length,
  hospitals: branches.items.length,
  names: new Intl.ListFormat("en-GB").format(branches.items.map((branch) => branch.name)),
};

const PAGES = notFoundPage.pages.map((page) => {
  const link = NAV_LINKS.get(page.to);
  return {
    kind: "page",
    href: page.to,
    title: page.title ?? link?.label ?? page.to,
    detail: fillTemplate(page.description ?? link?.description ?? "", FIGURES),
    way: Boolean(page.way),
    words: page.keywords,
  };
});

/* ---------- matching the address against the site ---------- */

/* Words every title shares, which say nothing about which page is meant. The
   pages' own keywords may still use them: "services" names the index. */
const TITLE_NOISE = new Set([
  "and",
  "the",
  "for",
  "our",
  "with",
  "eye",
  "eyes",
  "care",
  "clinic",
  "services",
  "service",
  "surgery",
  "hospital",
  "aakash",
  "road",
  "near",
  "opp",
  "north",
  "gujarat",
  "circle",
  "ring",
  "floor",
  "wing",
  "complex",
  "tower",
  "arcade",
  "space",
]);

/* Parts of an address that belong to the old site's file names, not to a page. */
const PATH_NOISE = new Set([
  "www",
  "com",
  "html",
  "htm",
  "php",
  "asp",
  "aspx",
  "jsp",
  "index",
  "default",
  "page",
  "pages",
  "aakash",
  "akash",
  "eye",
  "eyes",
]);

function wordsOf(text = "") {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !/^\d+$/.test(word));
}

function titleWords(...texts) {
  return texts.flatMap((text) => wordsOf(text)).filter((word) => !TITLE_NOISE.has(word));
}

const BRANCH_NAMES = new Set(branches.items.map((branch) => branch.name.toLowerCase()));

const CANDIDATES = [
  ...services.items.map((service) => ({
    kind: "service",
    href: `/services/${service.slug}`,
    title: service.title,
    detail: service.shortDescription,
    words: titleWords(service.slug, service.title, service.shortTitle),
  })),
  ...profiles.map((doctor) => ({
    kind: "doctor",
    href: profileHref(doctor),
    title: doctor.name,
    detail: fillTemplate(notFoundPage.matches.doctorDetail, {
      specialty: doctor.specialty,
      hospitals: describeHospitals(doctor),
    }),
    words: titleWords(doctor.slug, doctor.name.replace(/^Dr\.\s*/, "")),
  })),
  ...branches.items.map((branch) => {
    /* The postal town where it is a second spelling (Himatnagar), never where
       it is another hospital's name (Gota and Juhapura are in Ahmedabad). */
    const town = branch.postalAddress?.addressLocality ?? "";
    const alias = BRANCH_NAMES.has(town.toLowerCase()) ? "" : town;
    return {
      kind: "branch",
      href: buildBranchHref(branch),
      title: branch.name,
      detail: branch.locality,
      words: titleWords(branch.slug, branch.name, branch.locality, alias),
    };
  }),
  ...PAGES,
].map((candidate) => ({ ...candidate, words: [...new Set(candidate.words)] }));

/* A word worth less the more pages share it: "patel" names nine doctors and
   on its own picks out none of them, "vishnu" names one. */
const WEIGHT = new Map();
for (const candidate of CANDIDATES) {
  for (const word of candidate.words) WEIGHT.set(word, (WEIGHT.get(word) ?? 0) + 1);
}
for (const [word, count] of WEIGHT) WEIGHT.set(word, 1 / count);

/* Edit distance with adjacent letters swapped counted as one slip. */
function distance(first, second) {
  const rows = Array.from({ length: first.length + 1 }, (_, row) => [row]);
  for (let column = 1; column <= second.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= first.length; row += 1) {
    for (let column = 1; column <= second.length; column += 1) {
      const cost = first[row - 1] === second[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost,
      );
      if (
        row > 1 &&
        column > 1 &&
        first[row - 1] === second[column - 2] &&
        first[row - 2] === second[column - 1]
      ) {
        rows[row][column] = Math.min(rows[row][column], rows[row - 2][column - 2] + 1);
      }
    }
  }
  return rows[first.length][second.length];
}

/* How closely a word in the address matches a word of a page: exactly, as the
   start of it ("catar", "doctor"), with a slip or two ("cataratc"), or run
   together with others ("cataractsurgery"). */
function likeness(typed, word) {
  if (typed === word) return 1;
  const shorter = Math.min(typed.length, word.length);
  if (shorter >= 4 && (word.startsWith(typed) || typed.startsWith(word))) return 0.8;
  const slips = shorter >= 8 ? 2 : shorter >= 5 ? 1 : 0;
  if (slips && Math.abs(typed.length - word.length) <= slips && distance(typed, word) <= slips) {
    return 0.7;
  }
  if (word.length >= 5 && typed.length > word.length + 2 && typed.includes(word)) return 0.6;
  return 0;
}

/* The first part of an address says what kind of page was meant, so
   /doctors/<a name> prefers a doctor to a treatment that shares a word. */
const SECTIONS = {
  service: ["services", "service", "treatments", "treatment"],
  doctor: ["doctors", "doctor", "team"],
  branch: ["branches", "branch", "hospitals", "hospital", "locations"],
};
const SECTION_BOOST = 1.6;
const MIN_SCORE = 0.5;
const SHARE_OF_BEST = 0.35;

function sectionOf(firstWord) {
  if (!firstWord) return null;
  return (
    Object.keys(SECTIONS).find((kind) =>
      SECTIONS[kind].some((word) => likeness(firstWord, word) >= 0.7),
    ) ?? null
  );
}

/* Up to `limit` pages the address most likely meant, best first. An address
   that matches nothing well enough gets no guesses at all: a wrong suggestion
   costs a reader more than none. */
export function suggestFor(pathname = "", limit = 3) {
  if (pathname === NOT_FOUND_PATH) return [];
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // Matched as it arrived.
  }
  const typed = wordsOf(path).filter((word) => !PATH_NOISE.has(word));
  if (!typed.length) return [];
  const section = sectionOf(typed[0]);

  const scored = CANDIDATES.map((candidate, order) => {
    let score = 0;
    for (const word of typed) {
      let best = 0;
      for (const own of candidate.words) {
        const like = likeness(word, own);
        if (like) best = Math.max(best, like * WEIGHT.get(own));
      }
      score += best;
    }
    if (candidate.kind === section) score *= SECTION_BOOST;
    return { candidate, score, order };
  }).filter((entry) => entry.score >= MIN_SCORE);

  const top = Math.max(0, ...scored.map((entry) => entry.score));
  return scored
    .filter((entry) => entry.score >= top * SHARE_OF_BEST)
    .sort((first, second) => second.score - first.score || first.order - second.order)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

/* The site's main ways in, less any the guesses have already offered. */
export function getWays(matches = []) {
  const offered = new Set(matches.map((match) => match.href));
  return PAGES.filter((page) => page.way && !offered.has(page.href));
}
