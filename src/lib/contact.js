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

export function storeBranch(slug) {
  try {
    window.localStorage.setItem(BRANCH_STORAGE_KEY, slug);
  } catch {
    // Storage can be blocked in privacy modes; the session still works.
  }
  window.dispatchEvent(new CustomEvent(BRANCH_CHANGE_EVENT, { detail: slug }));
}

export function getStoredBranch(items = []) {
  if (typeof window === "undefined") return getPrimaryBranch(items);
  let slug = null;
  try {
    slug = window.localStorage.getItem(BRANCH_STORAGE_KEY);
  } catch {
    slug = null;
  }
  return items.find((branch) => branch.slug === slug) ?? getPrimaryBranch(items);
}
