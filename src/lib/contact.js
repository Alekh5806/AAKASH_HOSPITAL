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

export function buildMapLink(branch) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Aakash Eye Hospital ${branch?.name ?? ""} ${branch?.address ?? ""}`,
  )}`;
}
