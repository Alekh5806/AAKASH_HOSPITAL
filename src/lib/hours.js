import { site } from "./coreData";

/* One hospital's OPD hours, read from its own `hours` block in branches.json.
 *
 * Every hospital carries its own block, so the six can keep different hours
 * and different days; `site.openingHours` is the network default a hospital
 * without a block inherits (and the one place the time zone lives), the way a
 * hospital without a `services` list shows everything the network offers.
 *
 * The block is the single truth: the printed rows (`Monday to Saturday,
 * 9:00 AM - 6:00 PM`), the live open/closed pill, the appointment flow's open
 * days and the JSON-LD are all derived from the same `schedule`, so none of
 * them can disagree with another. A schedule is a list of slots, each a set of
 * days with one opening and one closing time; a Saturday half day or a lunch
 * break is a second slot, not a second field. */

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function byWeekOrder(first, second) {
  return WEEK.indexOf(first) - WEEK.indexOf(second);
}

export function getBranchHours(branch) {
  const merged = { ...site.openingHours, ...(branch?.hours ?? {}) };
  const schedule = (merged.schedule ?? []).map((slot) => ({
    ...slot,
    days: [...slot.days].sort(byWeekOrder),
  }));
  const openDays = WEEK.filter((day) => schedule.some((slot) => slot.days.includes(day)));
  return {
    timeZone: merged.timeZone,
    schedule,
    closedNote: merged.closedNote ?? "",
    note: merged.note ?? "",
    openDays,
    closedDays: WEEK.filter((day) => !openDays.includes(day)),
  };
}

export function toMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/* "09:00" -> "9:00 AM", the way the hours are printed everywhere. */
export function formatTime(time) {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

export function formatRange(slot) {
  return `${formatTime(slot.opens)} - ${formatTime(slot.closes)}`;
}

/* A day set as a reader says it: a run of three or more is `Monday to
   Saturday`, two days are `Saturday and Sunday`, and anything broken up is
   listed, `Monday, Wednesday and Friday`. */
export function describeDays(days) {
  const sorted = [...days].sort(byWeekOrder);
  if (sorted.length === 0) return "";
  if (sorted.length === 1) return sorted[0];
  const first = WEEK.indexOf(sorted[0]);
  const consecutive = sorted.every((day, index) => WEEK.indexOf(day) === first + index);
  if (consecutive && sorted.length >= 3) return `${sorted[0]} to ${sorted[sorted.length - 1]}`;
  return `${sorted.slice(0, -1).join(", ")} and ${sorted[sorted.length - 1]}`;
}

/* The printed rows: one per distinct day set (two slots on the same days,
   such as a morning and an evening session, share a row), then the closed
   days with the hospital's own note for them. */
export function getHoursRows(hours) {
  const rows = [];
  hours.schedule.forEach((slot) => {
    const label = describeDays(slot.days);
    const row = rows.find((entry) => entry.label === label);
    if (row) {
      row.value = `${row.value}, ${formatRange(slot)}`;
    } else {
      rows.push({ label, value: formatRange(slot), open: true });
    }
  });
  if (hours.closedDays.length && hours.closedNote) {
    rows.push({ label: describeDays(hours.closedDays), value: hours.closedNote, open: false });
  }
  return rows;
}

export function slotsOn(hours, weekday) {
  return hours.schedule
    .filter((slot) => slot.days.includes(weekday))
    .sort((first, second) => toMinutes(first.opens) - toMinutes(second.opens));
}

export function isOpenOn(hours, weekday) {
  return hours.openDays.includes(weekday);
}

/* The last closing time of a day, after which today is over for the OPD. */
export function closesOn(hours, weekday) {
  const slots = slotsOn(hours, weekday);
  return slots.length ? slots[slots.length - 1].closes : null;
}

/* The clock is the hospital's, never the reader's: a patient in Gujarat and a
   son in Toronto must be told the same thing, so the weekday and the time are
   read in the hospital's zone rather than from the device. */
export function hospitalNow(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    iso: `${value("year")}-${value("month")}-${value("day")}`,
    weekday: value("weekday"),
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

/* Whether the OPD is open at this moment, and what happens next: the time it
   closes if it is open, or the time it opens if it is not - today's next slot
   if there is one, otherwise the first slot of the next open day. A day with
   no slot at all is `closedToday`, which the pill words with the hospital's
   own closed-day note. */
export function getOpenState(hours, now = hospitalNow(hours.timeZone)) {
  const today = slotsOn(hours, now.weekday);
  if (!today.length) return { open: false, closedToday: true };
  const current = today.find(
    (slot) => now.minutes >= toMinutes(slot.opens) && now.minutes < toMinutes(slot.closes),
  );
  if (current) return { open: true, closedToday: false, closes: current.closes };
  const later = today.find((slot) => toMinutes(slot.opens) > now.minutes);
  if (later) return { open: false, closedToday: false, opens: later.opens };
  const todayIndex = WEEK.indexOf(now.weekday);
  for (let ahead = 1; ahead <= WEEK.length; ahead += 1) {
    const slots = slotsOn(hours, WEEK[(todayIndex + ahead) % WEEK.length]);
    if (slots.length) return { open: false, closedToday: false, opens: slots[0].opens };
  }
  return { open: false, closedToday: true };
}

/* JSON-LD's shape for the same block, so the hours a search engine is told can
   never drift from the hours a reader is shown. */
export function toOpeningHoursSpecification(hours) {
  return hours.schedule.map((slot) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: slot.days,
    opens: slot.opens,
    closes: slot.closes,
  }));
}
