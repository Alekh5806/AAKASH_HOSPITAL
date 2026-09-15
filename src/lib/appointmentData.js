import { z } from "zod";
import appointmentRaw from "../data/appointment.json";
import { site } from "./coreData";
import { fillTemplate } from "./servicesData";

export const appointmentPage = appointmentRaw;

const { fields, message: messageCopy } = appointmentRaw;
const hours = site.openingHours;

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

export const appointmentSchema = z.object({
  name: z.string().trim().min(2, fields.name.error),
  phone: z.string().refine((value) => parseMobile(value).valid, fields.phone.error),
  branch: z.string().min(1, fields.branch.error),
  service: z.string().min(1, fields.service.error),
  preferredDate: z
    .string()
    .refine(
      (value) => value === "" || (value >= todayIso() && isOpenDay(value)),
      fields.date.error,
    ),
  daypart: z.string(),
  message: z
    .string()
    .trim()
    .max(fields.message.maxLength, fillTemplate(fields.message.error, { max: fields.message.maxLength })),
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

export function isStepComplete(stepId, values) {
  const shape = appointmentSchema.pick(
    Object.fromEntries(STEP_FIELDS[stepId].map((field) => [field, true])),
  );
  return shape.safeParse(values).success;
}

/* ---------- days, on the hospital's clock ---------- */

function hospitalParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: hours.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    iso: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function toMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function todayIso() {
  return hospitalParts().iso;
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

export function isOpenDay(iso) {
  return hours.days.includes(weekdayOf(iso));
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

/* The next open days from today, on the hospital's clock. Sundays are
   skipped because the OPD is closed, and today drops out once the OPD has
   closed for the day - a reader at 7 PM must not be offered a slot that has
   already passed. */
export function getOpenDays(count = OPEN_DAYS_SHOWN) {
  const { iso: today, minutes } = hospitalParts();
  const days = [];
  let offset = minutes >= toMinutes(hours.closes) ? 1 : 0;
  while (days.length < count && offset < count * 3) {
    const iso = shiftIso(today, offset);
    if (isOpenDay(iso)) {
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
