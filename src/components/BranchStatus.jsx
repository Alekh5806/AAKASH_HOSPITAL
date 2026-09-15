import { useEffect, useState } from "react";
import { site } from "../lib/coreData";
import { branchPage } from "../lib/branchData";
import { fillTemplate } from "../lib/servicesData";

const { status } = branchPage.locate;
const hours = site.openingHours;
const TICK_MS = 60000;

/* Whether the OPD is open, right now.
 *
 * It replaced a sentence explaining the map, which said nothing a reader could
 * act on. This is the one fact on the page that changes through the day, and it
 * is the question a visitor asks before they set out - so it is also the one
 * thing here that is genuinely alive: it re-reads the clock every minute and
 * the dot breathes while the doors are open.
 *
 * The clock is the hospital's, not the reader's. A patient in Gujarat and a son
 * in Toronto must be told the same thing, so the weekday and the time are read
 * in `site.openingHours.timeZone` rather than from the device. */
function hospitalNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: hours.timeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: value("weekday"),
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function toMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function toLabel(time) {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function resolve() {
  const { weekday, minutes } = hospitalNow();
  if (!hours.days.includes(weekday)) {
    return { open: false, label: status.closedTodayLabel, detail: hours.closedNote };
  }
  const opens = toMinutes(hours.opens);
  const closes = toMinutes(hours.closes);
  if (minutes >= opens && minutes < closes) {
    return {
      open: true,
      label: status.openLabel,
      detail: fillTemplate(status.closesAt, { time: toLabel(hours.closes) }),
    };
  }
  return {
    open: false,
    label: status.closedLabel,
    detail: fillTemplate(status.opensAt, { time: toLabel(hours.opens) }),
  };
}

export default function BranchStatus() {
  const [now, setNow] = useState(() => resolve());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(resolve()), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    /* The state is a pill and the detail is a line under it. Both inside one
       pill, `Emergency and prior appointments only` wrapped it to five lines on
       a phone and the shape stopped reading as a status. */
    <p className="br-status" data-open={now.open ? "true" : undefined}>
      <span className="br-status__pill">
        <span className="br-status__dot" aria-hidden="true" />
        {now.label}
      </span>
      <span className="br-status__detail">{now.detail}</span>
    </p>
  );
}
