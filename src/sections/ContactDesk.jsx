import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, MessageCircle, Navigation, Phone } from "lucide-react";
import BranchStatus from "../components/BranchStatus";
import { branches } from "../lib/coreData";
import {
  BRANCH_CHANGE_EVENT,
  buildMapLink,
  buildWhatsApp,
  cleanTel,
  getPrimaryPhone,
  getStoredBranch,
  storeBranch,
} from "../lib/contact";
import { contactPage } from "../lib/contactData";
import { fillTemplate } from "../lib/servicesData";

/* The switchboard: six hospitals on one side, one readout on the other, and a
 * cable between them.
 *
 * Choosing a hospital is the whole interaction. The cable draws from that
 * hospital's jack to the readout, a pulse rides it across, and as it lands the
 * OPD number rolls over digit by digit to the new hospital's - the page is
 * connecting the reader, and it shows them. Every way in (call, WhatsApp,
 * directions, email) then belongs to that hospital and nothing else on the
 * card needs explaining.
 *
 * The choice is the header's choice. It reads the hospital the header stored
 * for this reader, writes back through `storeBranch()` so the number at the
 * top of the screen follows, and listens for the header moving it, so the two
 * can never name different hospitals on one screen. */

const { desk } = contactPage;
const STACKED_QUERY = "(max-width: 899px)";
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const DRAW_MS = 460;
const PULSE_MS = 540;
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const ROLL = { type: "spring", stiffness: 110, damping: 17, mass: 0.9 };
/* The digits start turning as the pulse lands on the readout. */
const ROLL_DELAY = 0.3;

const CHANNELS = [
  { id: "call", icon: Phone, label: desk.callLabel, primary: true },
  { id: "whatsapp", icon: MessageCircle, label: desk.whatsappLabel },
  { id: "directions", icon: Navigation, label: desk.directionsLabel },
  { id: "email", icon: Mail, label: desk.emailLabel },
];

function channelHref(id, branch) {
  switch (id) {
    case "call":
      return `tel:${cleanTel(getPrimaryPhone(branch))}`;
    case "whatsapp":
      return buildWhatsApp(branch, fillTemplate(desk.whatsappMessage, { branch: branch.name }));
    case "directions":
      return buildMapLink(branch);
    default:
      return `mailto:${branch.email}`;
  }
}

/* The number is an odometer: one column per digit over a strip of 0-9, each
   a beat behind the last, so switching hospitals visibly turns the line over.
   The visible number holds until the pulse lands on the readout, then the
   punctuation swaps and the digits roll together - swapping the shape first
   showed a nonsense number for a third of a second. Punctuation is set as
   plain glyphs, and the real number sits in a visually hidden span, updated
   at once, for anyone who cannot see the strips. */
function NumberRoll({ value }) {
  const shouldReduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (shown === value) return undefined;
    const timer = window.setTimeout(
      () => setShown(value),
      shouldReduceMotion ? 0 : ROLL_DELAY * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [value, shown, shouldReduceMotion]);

  return (
    <span className="ct-odo">
      <span className="sr-only">{value}</span>
      {shown.split("").map((glyph, index) =>
        /\d/.test(glyph) ? (
          <span className="ct-odo__col" key={index} aria-hidden="true">
            <motion.span
              className="ct-odo__strip"
              initial={false}
              animate={{ y: `${Number(glyph) * -10}%` }}
              transition={shouldReduceMotion ? { duration: 0 } : { ...ROLL, delay: index * 0.035 }}
            >
              {DIGITS.map((digit) => (
                <span key={digit}>{digit}</span>
              ))}
            </motion.span>
          </span>
        ) : (
          <span className="ct-odo__glyph" key={index} aria-hidden="true">
            {glyph}
          </span>
        ),
      )}
    </span>
  );
}

export default function ContactDesk() {
  const shouldReduceMotion = useReducedMotion();
  const items = branches.items;
  const [slug, setSlug] = useState(() => getStoredBranch(items).slug);
  const branch = items.find((item) => item.slug === slug) ?? items[0];
  const phone = getPrimaryPhone(branch);

  const cardRef = useRef(null);
  const railRef = useRef(null);
  const svgRef = useRef(null);
  const cableRef = useRef(null);
  const pulseRef = useRef(null);
  const readoutJackRef = useRef(null);
  const jackRefs = useRef({});
  const pulseFrame = useRef(0);
  const slugRef = useRef(slug);

  /* Follow the header while the reader is still on the page. */
  useEffect(() => {
    const follow = (event) => {
      if (items.some((item) => item.slug === event.detail)) setSlug(event.detail);
    };
    window.addEventListener(BRANCH_CHANGE_EVENT, follow);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, follow);
  }, [items]);

  /* The cable is geometry, measured from the two jacks and written straight
     to the path. Stacked, it is routed from the chosen pill down to the
     readout; side by side, it crosses the gutter with horizontal tangents at
     both ends so it never runs back through the rows. Laying it only moves the line;
     connecting replays it. */
  const lay = useCallback(() => {
    const card = cardRef.current;
    const from = jackRefs.current[slugRef.current]?.querySelector(".ct-jack__ring");
    const to = readoutJackRef.current;
    const path = cableRef.current;
    const svg = svgRef.current;
    if (!card || !from || !to || !path || !svg) return null;

    const box = card.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const x1 = a.left + a.width / 2 - box.left;
    const y1 = a.top + a.height / 2 - box.top;
    const x2 = b.left + b.width / 2 - box.left;
    const y2 = b.top + b.height / 2 - box.top;
    const stacked = window.matchMedia(STACKED_QUERY).matches;
    let d;
    if (stacked) {
      /* Stacked, the chips sit in two columns and the cable is a bus down the
         gutter between them: out of the chosen chip's ring (which faces the
         gutter), down the gutter to just under the grid, across to the
         readout's column and down into its jack, every corner rounded. On
         the narrowest phones the chips are one column and the bus runs down
         the card's right margin instead. An S-curve had grazed the
         neighbouring chips, and a rail that scrolled hid four of the six
         hospitals behind a swipe. */
      const grid = railRef.current.getBoundingClientRect();
      const chip = from.closest(".ct-jack").getBoundingClientRect();
      const oneColumn = chip.width > grid.width * 0.75;
      const bus = oneColumn ? grid.right - box.left + 9 : grid.left + grid.width / 2 - box.left;
      const mid = (grid.bottom - box.top + y2) / 2;
      const radius = Math.min(12, Math.abs(bus - x1) / 2, Math.abs(bus - x2) / 2, y2 - mid);
      const toBus = Math.sign(bus - x1) || 1;
      const toJack = Math.sign(x2 - bus) || -1;
      d = [
        `M${x1},${y1} H${bus - toBus * radius}`,
        `Q${bus},${y1} ${bus},${y1 + radius}`,
        `V${mid - radius}`,
        `Q${bus},${mid} ${bus + toJack * radius},${mid}`,
        `H${x2 - toJack * radius}`,
        `Q${x2},${mid} ${x2},${mid + radius}`,
        `V${y2}`,
      ].join(" ");
    } else {
      const k = (x2 - x1) * 0.5 + Math.min(Math.abs(y2 - y1) * 0.2, 80);
      d = `M${x1},${y1} C${x1 + k},${y1} ${x2 - k},${y2} ${x2},${y2}`;
    }

    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    path.setAttribute("d", d);
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    /* A connect in flight owns the offset; otherwise the line is whole. */
    if (!path.getAnimations().length) path.style.strokeDashoffset = "0";
    return { path, length, to };
  }, []);

  const connect = useCallback(() => {
    const laid = lay();
    const pulse = pulseRef.current;
    if (!laid || !pulse) return;
    const { path, length, to } = laid;
    path.getAnimations().forEach((animation) => animation.cancel());
    window.cancelAnimationFrame(pulseFrame.current);

    if (shouldReduceMotion) {
      path.style.strokeDashoffset = "0";
      pulse.style.opacity = "0";
      return;
    }

    path.style.strokeDashoffset = `${length}`;
    path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
      duration: DRAW_MS,
      easing: EASE,
      fill: "forwards",
    });

    /* The pulse rides the cable to the readout and the jack takes the hit as
       it lands - the moment the number starts to turn. It reads the path
       fresh each frame, so a cable re-laid under it by a resize carries it
       rather than losing it. */
    const started = performance.now();
    pulse.style.opacity = "1";
    const ride = (now) => {
      const t = Math.min(1, (now - started) / PULSE_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      const point = path.getPointAtLength(path.getTotalLength() * eased);
      pulse.setAttribute("cx", point.x);
      pulse.setAttribute("cy", point.y);
      if (t < 1) {
        pulseFrame.current = window.requestAnimationFrame(ride);
        return;
      }
      pulse.style.opacity = "0";
      to.classList.remove("is-hit");
      void to.offsetWidth;
      to.classList.add("is-hit");
    };
    pulseFrame.current = window.requestAnimationFrame(ride);
  }, [lay, shouldReduceMotion]);

  useLayoutEffect(() => {
    slugRef.current = slug;
    connect();
  }, [connect, slug]);

  /* Any move of either jack - a resize, a font landing - lays the cable
     again in place without replaying it. Subscribed once: the observer's
     first callback fires on observe, right after the mount connect, and is
     skipped so it cannot cut that connect short. */
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    let frame = 0;
    let first = true;
    const relay = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        lay();
      });
    };
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      relay();
    });
    observer.observe(card);
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(pulseFrame.current);
    };
  }, [lay]);

  const choose = (next) => {
    if (next === slug) return;
    setSlug(next);
    storeBranch(next);
  };

  /* Arrow keys walk the group the way a native radio group does. */
  const onKeyDown = (event) => {
    const index = items.findIndex((item) => item.slug === slug);
    let target = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      target = items[(index + 1) % items.length];
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      target = items[(index - 1 + items.length) % items.length];
    } else if (event.key === "Home") {
      target = items[0];
    } else if (event.key === "End") {
      target = items[items.length - 1];
    }
    if (!target) return;
    event.preventDefault();
    choose(target.slug);
    jackRefs.current[target.slug]?.focus();
  };

  return (
    <motion.div
      className="ct-desk"
      ref={cardRef}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.22 }
      }
    >
      <svg className="ct-desk__wire" ref={svgRef} aria-hidden="true" focusable="false">
        <path className="ct-desk__cable" ref={cableRef} />
        <circle className="ct-desk__pulse" ref={pulseRef} r="5" />
      </svg>

      <div className="ct-pick">
        <p className="e-label ct-pick__label" id="ct-pick-label">
          {desk.pickLabel}
        </p>
        <div
          className="ct-pick__rail"
          ref={railRef}
          role="radiogroup"
          aria-labelledby="ct-pick-label"
          onKeyDown={onKeyDown}
        >
          {items.map((item) => {
            const checked = item.slug === slug;
            return (
              <button
                key={item.slug}
                type="button"
                className="ct-jack"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                data-checked={checked ? "true" : undefined}
                ref={(node) => {
                  jackRefs.current[item.slug] = node;
                }}
                onClick={() => choose(item.slug)}
              >
                {checked ? (
                  <motion.span
                    className="ct-jack__bg"
                    layoutId="ct-jack-bg"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 38 }
                    }
                  />
                ) : null}
                <span className="ct-jack__name">
                  {item.name}
                  {item.isHeadquarters ? <em>{desk.headOfficeTag}</em> : null}
                </span>
                <span className="ct-jack__where">{item.locality}</span>
                <span className="ct-jack__ring" aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <p className="ct-pick__hint">{desk.pickHint}</p>
      </div>

      <div className="ct-readout">
        <p className="ct-readout__label">
          <span className="ct-readout__jack" ref={readoutJackRef} aria-hidden="true" />
          <span className="e-label">
            {desk.readoutLabel} <i aria-hidden="true">·</i> {branch.name}
          </span>
        </p>
        <p className="sr-only" aria-live="polite">
          {fillTemplate(desk.connectedLabel, { branch: branch.name })}
        </p>

        <a className="ct-readout__number" href={`tel:${cleanTel(phone)}`}>
          <NumberRoll value={phone} />
        </a>

        <BranchStatus branch={branch} />

        <motion.p
          className="ct-readout__address"
          key={branch.slug}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.45, delay: 0.25, ease: "easeOut" }
          }
        >
          {branch.address}
        </motion.p>

        <div className="ct-acts">
          {CHANNELS.map(({ id, icon: Icon, label, primary }) => {
            const external = id === "whatsapp" || id === "directions";
            return (
              <motion.a
                key={id}
                className="ct-act"
                data-primary={primary ? "true" : undefined}
                href={channelHref(id, branch)}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
