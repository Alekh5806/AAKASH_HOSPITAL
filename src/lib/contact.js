import { allowsCategory } from "./consent";

export function cleanTel(number = "") {
  return number.startsWith("+") ? number.replace(/[^\d+]/g, "") : number.replace(/\D/g, "");
}

export function getPrimaryPhone(branch) {
  if (!branch) return "";
  return (
    branch.phoneGroups.find((group) => group.label.toLowerCase().includes("opd"))?.numbers[0] ??
    branch.phoneGroups[0]?.numbers[0] ??
    ""
  );
}

/* The OPD number only once the hospital has confirmed it - a group still
   flagged `unconfirmed` in branches.json holds a placeholder, and a new
   surface never offers a call to a number that may be someone else's. */
export function getConfirmedPrimaryPhone(branch) {
  if (!branch) return "";
  const group =
    branch.phoneGroups.find((entry) => entry.label.toLowerCase().includes("opd")) ??
    branch.phoneGroups[0];
  return group && !group.unconfirmed ? (group.numbers[0] ?? "") : "";
}

export function getPrimaryBranch(items = []) {
  return items.find((branch) => branch.isHeadquarters) ?? items[0];
}

export function buildWhatsApp(branch, message) {
  const text =
    message ??
    `Hello Aakash Eye Hospital, I would like to book an appointment at ${branch?.name ?? ""}.`;
  return `https://wa.me/${branch?.whatsappNumber ?? ""}?text=${encodeURIComponent(text)}`;
}

/* Only a branch carrying a `page` block has a page of its own. Everything else
   still opens the branches index with that hospital selected, so the header,
   the footer and the impact chips can offer one link per hospital without
   knowing which of them has been built out. Lives here rather than in
   branchData so the header does not pull the doctors and services data into
   the root bundle for one link. */
export function hasBranchPage(branch) {
  return Boolean(branch?.page);
}

export function buildBranchHref(branch) {
  return hasBranchPage(branch) ? `/branches/${branch.slug}` : `/branches?branch=${branch.slug}`;
}

/* A social profile is shown, and named in the structured data, only once the
   hospital has confirmed it: an `unconfirmed` entry stays in the data as a
   lead and is printed nowhere. */
export function confirmedProfiles(links = []) {
  return links.filter((link) => link.href && !link.unconfirmed);
}

export function buildMapLink(branch) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Aakash Eye Hospital ${branch?.name ?? ""} ${branch?.address ?? ""}`,
  )}`;
}

/* The header stores the reader's hospital under this key. Anything that offers
   a phone number, a WhatsApp thread or directions reads the same key, so two
   places on one screen can never disagree about which hospital was chosen.
   The event is what keeps them agreeing while the reader is still on the page:
   localStorage fires nothing in the tab that wrote it, so a page that only read
   the key on mount would go on offering the old hospital's number after the
   header had moved on. */
export const BRANCH_STORAGE_KEY = "aakash_selected_branch";
export const BRANCH_CHANGE_EVENT = "aakash:branch-change";

/* Remembering the hospital between visits is the "Website experience" cookie
   category, so it waits for the reader's yes: until then the choice lives in
   sessionStorage and is gone when the tab closes. Either way it is read back
   through readStoredBranchSlug(), so nothing else needs to know which. */
function keepBranch(slug) {
  try {
    const persist = allowsCategory("experience");
    const [keep, drop] = persist
      ? [window.localStorage, window.sessionStorage]
      : [window.sessionStorage, window.localStorage];
    keep.setItem(BRANCH_STORAGE_KEY, slug);
    drop.removeItem(BRANCH_STORAGE_KEY);
  } catch {
    // Storage can be blocked in privacy modes; the page state still works.
  }
}

export function storeBranch(slug) {
  keepBranch(slug);
  window.dispatchEvent(new CustomEvent(BRANCH_CHANGE_EVENT, { detail: slug }));
}

export function readStoredBranchSlug() {
  try {
    return (
      window.localStorage.getItem(BRANCH_STORAGE_KEY) ??
      window.sessionStorage.getItem(BRANCH_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

/* Run when the cookie choice changes and once per load: moves the stored
   hospital into whichever storage the current choice allows. The value does
   not change, so nothing is announced. */
export function applyBranchConsent() {
  const slug = readStoredBranchSlug();
  if (slug) keepBranch(slug);
}

export function getStoredBranch(items = []) {
  if (typeof window === "undefined") return getPrimaryBranch(items);
  const slug = readStoredBranchSlug();
  return items.find((branch) => branch.slug === slug) ?? getPrimaryBranch(items);
}
