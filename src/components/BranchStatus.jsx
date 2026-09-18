import { useEffect, useState } from "react";
import { branchPage } from "../lib/branchData";
import { formatTime, getBranchHours, getOpenState } from "../lib/hours";
import { fillTemplate } from "../lib/servicesData";

const { status } = branchPage.locate;
const TICK_MS = 60000;

/* Whether this hospital's OPD is open, right now.
 *
 * It replaced a sentence explaining the map, which said nothing a reader could
 * act on. This is the one fact on the page that changes through the day, and it
 * is the question a visitor asks before they set out - so it is also the one
 * thing here that is genuinely alive: it re-reads the clock every minute and
 * the dot breathes while the doors are open.
 *
 * It reads the hospital's own `hours` block, so two hospitals with different
 * days or times get different answers, and the clock is the hospital's rather
 * than the reader's (see `hospitalNow` in lib/hours.js). The state is resolved
 * in render rather than held: the branch can change under the pill (the
 * switchboard, the slip and the index map all move it) and a held value would
 * go on describing the old hospital until the next tick. */
function resolve(branch) {
  const hours = getBranchHours(branch);
  const state = getOpenState(hours);
  if (state.closedToday) {
    return { open: false, label: status.closedTodayLabel, detail: hours.closedNote };
  }
  if (state.open) {
    return {
      open: true,
      label: status.openLabel,
      detail: fillTemplate(status.closesAt, { time: formatTime(state.closes) }),
    };
  }
  return {
    open: false,
    label: status.closedLabel,
    detail: fillTemplate(status.opensAt, { time: formatTime(state.opens) }),
  };
}

export default function BranchStatus({ branch }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((tick) => tick + 1), TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const now = resolve(branch);

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
