import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Navigation, Phone } from "lucide-react";
import BranchStatus from "../components/BranchStatus";
import HospitalMap from "../components/HospitalMap";
import {
  buildBranchHref,
  buildMapLink,
  cleanTel,
  getPrimaryBranch,
  getPrimaryPhone,
  getStoredBranch,
} from "../lib/contact";
import { useClientState } from "../lib/hydration";
import { fillTemplate } from "../lib/servicesData";

/* The whole of the hospitals index: a drawn map of Gujarat beside six rows,
 * one per hospital, and the two answer each other.
 *
 * The rows are the controls. Each one is the way into that hospital's own
 * page and carries the two things a person in the street wants first - the
 * OPD number and directions - so the reader never has to open a page to get a
 * number. Everything else about a hospital (its team, its photographs, its
 * desks and hours) lives on that page and is not repeated here; the build
 * before this one listed the six hospitals three times on one screen.
 *
 * The map follows the reader. On a fine pointer the row under the cursor
 * lights its dot (preview), a click on a dot chooses it (selection), and the
 * two are separate state so a mouse crossing the map can never change what
 * the reader chose. On a phone there is no hover: the map sticks under the
 * header and the row passing beneath it is the one lit, so scrolling the list
 * walks the traveller down the state. At rest the lit hospital is the one the
 * header has stored for this reader, so the map and the number at the top of
 * the screen never disagree; `?branch=<slug>` from an old link wins over it.
 * The lit hospital's own label turns into a white pill, in place, and that is
 * the map's readout at every width.
 *
 * Hover and focus preview only for a mouse and a keyboard. A tap fires the
 * compatibility mouse events and focuses the link it lands on, and neither is
 * ever undone on a phone - so a tap on `Call OPD` used to pin the map to that
 * hospital for the rest of the visit while the rows scrolled on beneath it. */

const STACKED_QUERY = "(max-width: 1023px)";
/* How far under the stuck map the reading line sits: past the list's label,
   into the first row. */
const READ_LINE = 64;
/* A row brought to the reading line lands with the line this far inside it. */
const ROW_INSET = 22;
/* Header.jsx does not hide the header in the first 160px of the page. */
const HEADER_HIDES_AFTER = 160;
/* How long the walker stands down while a chosen row is scrolled to the
   line, so the hospitals it passes on the way do not light one by one. */
const TRAVEL_LOCK_MS = 1000;

function subscribeStacked(callback) {
  const media = window.matchMedia(STACKED_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function readStacked() {
  return window.matchMedia(STACKED_QUERY).matches;
}

function isKeyboardFocus(element) {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

export default function HospitalFinder({ items, copy, ready = true, delay = 0 }) {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const requested = searchParams.get("branch");
  const requestedSlug = items.some((item) => item.slug === requested) ? requested : null;
  const stacked = useSyncExternalStore(subscribeStacked, readStacked, () => false);

  /* The reader's own hospital is lit as React adopts the page; the
     prerendered map lights the head office. */
  const [selectedSlug, setSelectedSlug] = useClientState(
    () => requestedSlug ?? getStoredBranch(items)?.slug ?? items[0]?.slug ?? null,
    getPrimaryBranch(items)?.slug ?? null,
  );
  const [previewSlug, setPreviewSlug] = useState(null);
  const activeSlug = previewSlug ?? selectedSlug;
  const activeBranch = items.find((item) => item.slug === activeSlug) ?? items[0];

  const dockRef = useRef(null);
  const mapRef = useRef(null);
  const listRef = useRef(null);
  const lockRef = useRef(0);
  /* The map draws itself once it is on screen and the opening curtain has
     lifted - on a first visit it is on screen under the curtain. */
  const inView = useInView(mapRef, { once: true, amount: 0.35 });
  const played = inView && ready;

  /* The rows on the first screen arrive in order behind the head; a row
     reached later by scrolling arrives the moment it does. */
  const [arrived, setArrived] = useState(false);
  useEffect(() => {
    if (!ready || arrived) return undefined;
    const timer = window.setTimeout(() => setArrived(true), (delay + 1.2) * 1000);
    return () => window.clearTimeout(timer);
  }, [ready, arrived, delay]);

  const rowFor = useCallback(
    (slug) => listRef.current?.querySelector(`[data-slug="${slug}"]`) ?? null,
    [],
  );

  /* Brings a hospital's row to the reader. Stacked, that means under the
     stuck map, on the reading line - centred, a row sat above or below the
     line (the header's 72px decides which) and the walker lit its neighbour
     the moment the reader touched the page again. The line depends on
     whether the header will be showing when the scroll ends: it hides on a
     scroll down past 160px and returns on any scroll up. */
  const bringToRow = useCallback(
    (slug, block) => {
      const row = rowFor(slug);
      const dock = dockRef.current;
      const map = mapRef.current;
      if (!row) return;
      const behavior = shouldReduceMotion ? "auto" : "smooth";
      if (!dock || !map || window.getComputedStyle(dock).position !== "sticky" || !stacked) {
        row.scrollIntoView({ block, behavior });
        return;
      }
      const rowTop = row.getBoundingClientRect().top + window.scrollY;
      const mapFoot = map.getBoundingClientRect().bottom - dock.getBoundingClientRect().top;
      const header = document.querySelector(".hd")?.getBoundingClientRect().height ?? 0;
      const aim = (stuckTop) => rowTop - (stuckTop + mapFoot + READ_LINE - ROW_INSET);
      let target = aim(header);
      if (target > window.scrollY && target > HEADER_HIDES_AFTER) target = aim(0);
      lockRef.current = window.performance.now() + (shouldReduceMotion ? 0 : TRAVEL_LOCK_MS);
      window.scrollTo({ top: Math.max(0, target), behavior });
    },
    [rowFor, shouldReduceMotion, stacked],
  );

  /* An old link naming a hospital lands on its row, not the top of the page.
     Two frames later, because the route manager scrolls every new route to
     the top on the next frame and would cancel this one. */
  useEffect(() => {
    if (!requestedSlug) return undefined;
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => bringToRow(requestedSlug, "center"));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [requestedSlug, bringToRow]);

  /* Stacked, the row just under the stuck map drives the selection - the one
     the reader has scrolled to, not the middle of whatever is visible, so the
     first row is lit the moment the map sticks and each row takes over as it
     passes beneath. Read from the boxes rather than an IntersectionObserver
     band, because the map's own edge moves by the header's height as the
     header hides and returns. */
  useEffect(() => {
    if (!stacked) return undefined;
    const dock = dockRef.current;
    let frame = 0;
    const read = () => {
      frame = 0;
      const map = mapRef.current;
      const list = listRef.current;
      if (!dock || !map || !list) return;
      /* Stuck is the dock sitting on its own sticky offset - 72px under the
         header, or 0 once the header has slid away - read from the style,
         never a constant: a fixed threshold under the header's height froze
         the lit row on every scroll back up. A sideways phone unpins the
         dock, and then there is no map on screen to answer the rows. The
         dock's soft foot only shows while it is stuck; at rest it would lie
         over the list's label. */
      const style = window.getComputedStyle(dock);
      const stuck =
        style.position === "sticky" &&
        dock.getBoundingClientRect().top <= (parseFloat(style.top) || 0) + 2;
      dock.toggleAttribute("data-stuck", stuck);
      if (!stuck || window.performance.now() < lockRef.current) return;
      const line = map.getBoundingClientRect().bottom + READ_LINE;
      let nearest = null;
      let nearestDistance = Infinity;
      list.querySelectorAll("[data-slug]").forEach((row) => {
        const rect = row.getBoundingClientRect();
        const distance =
          line < rect.top ? rect.top - line : line > rect.bottom ? line - rect.bottom : 0;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = row.dataset.slug;
        }
      });
      if (nearest) setSelectedSlug(nearest);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      dock?.removeAttribute("data-stuck");
    };
  }, [stacked, setSelectedSlug]);

  const choose = (slug) => {
    setSelectedSlug(slug);
    setPreviewSlug(null);
    bringToRow(slug, "nearest");
  };

  return (
    <div className="hs-find">
      {/* The dock is what sticks; the map is the card inside it. Stacked, the
          dock is paper with a soft foot, so the rows slide under a clean edge
          instead of being sliced by the card's rounded corners. */}
      <div className="hs-dock" ref={dockRef}>
        <div className="hs-map" ref={mapRef}>
          <HospitalMap
            items={items}
            activeSlug={activeSlug}
            played={played}
            lead={delay + 0.15}
            onPreview={setPreviewSlug}
            onChoose={choose}
            ghost={copy.mapGhost}
          />
          {/* The lit hospital's own hours: the six can differ, so the pill
              over the map is the readout for whichever row is lit, not a
              network figure said once. */}
          <div className="hs-map__stamp">
            <BranchStatus branch={activeBranch} />
          </div>
        </div>
      </div>

      <div className="hs-list">
        <h2 className="e-label hs-list__label" id="hs-list-label">
          {copy.listLabel}
        </h2>
        <ul className="hs-rows" ref={listRef} aria-labelledby="hs-list-label">
          {items.map((branch, position) => {
            const phone = getPrimaryPhone(branch);
            return (
              <motion.li
                key={branch.slug}
                className="hs-row"
                data-slug={branch.slug}
                data-active={branch.slug === activeSlug ? "true" : undefined}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setPreviewSlug(branch.slug);
                }}
                onPointerLeave={() => setPreviewSlug(null)}
                onFocus={(event) => {
                  if (isKeyboardFocus(event.target)) setPreviewSlug(branch.slug);
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setPreviewSlug(null);
                }}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={ready || shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: shouldReduceMotion || arrived ? 0 : delay + 0.3 + position * 0.07,
                }}
              >
                {/* The whole row opens the hospital's page: the link's halo
                    covers the row, and the two actions sit above it. */}
                <Link className="hs-row__main" to={buildBranchHref(branch)}>
                  <span className="hs-row__name">
                    {branch.name}
                    {branch.isHeadquarters ? <em>{copy.headOfficeTag}</em> : null}
                  </span>
                  <span className="hs-row__where">{branch.locality}</span>
                </Link>

                <span className="hs-row__actions">
                  {phone ? (
                    <a
                      className="hs-row__act"
                      href={`tel:${cleanTel(phone)}`}
                      aria-label={fillTemplate(copy.callAria, { branch: branch.name })}
                    >
                      <Phone size={16} aria-hidden="true" />
                      <span className="hs-row__word">{copy.callLabel}</span>
                    </a>
                  ) : null}
                  <a
                    className="hs-row__act"
                    href={buildMapLink(branch)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={fillTemplate(copy.directionsAria, { branch: branch.name })}
                  >
                    <Navigation size={16} aria-hidden="true" />
                    <span className="hs-row__word">{copy.directionsLabel}</span>
                  </a>
                </span>

                {/* The row's route marker: visual only, since the link is the
                    whole row, so it takes no pointer and no name of its own. */}
                <span className="hs-row__go" aria-hidden="true">
                  <span>{copy.openLabel}</span>
                  <ArrowUpRight size={16} />
                </span>
              </motion.li>
            );
          })}
        </ul>
        <p className="hs-note">{copy.note}</p>
      </div>
    </div>
  );
}
