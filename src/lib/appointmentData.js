import { z } from "zod";
import appointmentRaw from "../data/appointment.json";
import { branches, site } from "./coreData";
import {
  closesOn,
  describeDays,
  getBranchHours,
  hospitalNow,
  isOpenOn,
  toMinutes,
} from "./hours";
import { fillTemplate } from "./servicesData";

export const appointmentPage = appointmentRaw;

const { fields, message: messageCopy } = appointmentRaw;

export const STEP_IDS = ["who", "where", "what", "when", "send"];
export const UNSURE_SERVICE = "unsure";
export const OPEN_DAYS_SHOWN = 10;

/* ---------- the mobile number ---------- */

/* Most readers type ten digits; some paste `+91 98765 43210`, `09876543210`
   or a number from abroad. Everything is reduced to its digits, an Indian
   trunk or country prefix is dropped, and what is left has to be a ten-digit
   mobile - or, with a leading plus, any 8-15 digit international number. */
export function parseMobile(raw = "") {
  const international = raw.trim().startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (/^[6-9]\d{9}$/.test(digits)) {
    return { valid: true, display: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` };
  }
  if (international && digits.length >= 8 && digits.length <= 15) {
    return { valid: true, display: `+${digits}` };
  }
  return { valid: false, display: raw.trim() };
}

/* ---------- validation ---------- */

/* The preferred day is checked against the chosen hospital's own days, so it
   is an object-level refinement rather than a field one: a Saturday is a fine
   answer for a hospital open on Saturdays and a closed day for one that is
   not, and only the whole form knows which hospital was chosen. */
export const appointmentSchema = z
  .object({
    name: z.string().trim().min(2, fields.name.error),
    phone: z.string().refine((value) => parseMobile(value).valid, fields.phone.error),
    branch: z.string().min(1, fields.branch.error),
    service: z.string().min(1, fields.service.error),
    preferredDate: z.string(),
    daypart: z.string(),
    message: z
      .string()
      .trim()
      .max(
        fields.message.maxLength,
        fillTemplate(fields.message.error, { max: fields.message.maxLength }),
      ),
  })
  .superRefine((values, ctx) => {
    const date = values.preferredDate;
    if (!date) return;
    const branch = findBranch(values.branch);
    if (date >= todayIso() && isOpenDay(date, branch)) return;
    ctx.addIssue({
      code: "custom",
      path: ["preferredDate"],
      message: fillTemplate(fields.date.error, {
        days: describeDays(getBranchHours(branch).openDays),
      }),
    });
  });

/* Which fields each step owns, so a step can be validated on its own before
   the reader moves on, and the rail can say which steps are complete. */
export const STEP_FIELDS = {
  who: ["name", "phone"],
  where: ["branch"],
  what: ["service"],
  when: ["preferredDate", "daypart"],
  send: ["message"],
};

/* One parse of the whole form, read for this step's fields only. `pick()`
   would drop the object-level day check above, and the step that owns the
   date is exactly the one that needs it. */
export function isStepComplete(stepId, values) {
  const result = appointmentSchema.safeParse(values);
  if (result.success) return true;
  const owned = STEP_FIELDS[stepId];
  return !result.error.issues.some((issue) => owned.includes(issue.path[0]));
}

/* ---------- days, on the hospital's clock ---------- */

export function findBranch(slug) {
  return branches.items.find((branch) => branch.slug === slug) ?? null;
}

export function todayIso() {
  return hospitalNow(site.openingHours.timeZone).iso;
}

/* Dates are handled as ISO strings at UTC noon, so adding days and reading the
   weekday can never drift across a midnight in the reader's own zone. */
function dateAt(iso) {
  return new Date(`${iso}T12:00:00Z`);
}

function shiftIso(iso, days) {
  const date = dateAt(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekdayOf(iso) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long" }).format(dateAt(iso));
}

export function isOpenDay(iso, branch) {
  return isOpenOn(getBranchHours(branch), weekdayOf(iso));
}

export function formatDayShort(iso) {
  const date = dateAt(iso);
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short" }).format(date);
  const day = date.getUTCDate();
  const month = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(date);
  return { weekday, day: String(day), month };
}

export function formatDayLong(iso) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateAt(iso));
}

/* The next open days from today for one hospital, on its own clock. Its
   closed days are skipped, and today drops out once its OPD has closed for
   the day - a reader at 7 PM must not be offered a slot that has already
   passed. */
export function getOpenDays(branch, count = OPEN_DAYS_SHOWN) {
  const hours = getBranchHours(branch);
  const { iso: today, weekday, minutes } = hospitalNow(hours.timeZone);
  const closes = closesOn(hours, weekday);
  const days = [];
  let offset = closes && minutes >= toMinutes(closes) ? 1 : 0;
  while (days.length < count && offset < count * 3) {
    const iso = shiftIso(today, offset);
    if (isOpenDay(iso, branch)) {
      days.push({
        iso,
        offset,
        relative:
          offset === 0 ? fields.date.todayLabel : offset === 1 ? fields.date.tomorrowLabel : "",
        ...formatDayShort(iso),
      });
    }
    offset += 1;
  }
  return days;
}

/* ---------- what the reader will send ---------- */

export function getDaypart(id) {
  return fields.daypart.options.find((option) => option.id === id) ?? null;
}

export function describeDate(iso) {
  return iso ? formatDayLong(iso) : messageCopy.anyDay;
}

export function describeDaypart(id) {
  const daypart = getDaypart(id);
  return daypart ? `${daypart.label} (${daypart.range})` : messageCopy.anyTime;
}

export function describeService(serviceId, service) {
  if (serviceId === UNSURE_SERVICE) return fields.service.unsureValue;
  return service?.title ?? "";
}

/* The WhatsApp message. Each line is a template in the JSON so the wording
   can change without a code change; a line whose value is empty is dropped
   rather than sent as `Note: -`. */
export function buildAppointmentMessage(values, branch, service) {
  const { lines } = messageCopy;
  const rows = {
    name: values.name.trim(),
    phone: parseMobile(values.phone).display,
    service: describeService(values.service, service),
    date: describeDate(values.preferredDate),
    daypart: describeDaypart(values.daypart),
    message: values.message.trim(),
  };
  const body = Object.keys(lines)
    .filter((key) => rows[key])
    .map((key) => fillTemplate(lines[key], { value: rows[key] }));
  return [
    fillTemplate(messageCopy.heading, { branch: branch.name }),
    "",
    ...body,
    "",
    messageCopy.closing,
  ].join("\n");
}
