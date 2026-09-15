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
  getPrimaryPhone,
  getStoredBranch,
} from "../lib/contact";
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
 * the map's readout at every width. */

const STACKED_QUERY = "(max-width: 1023px)";
/* The sticky map is stuck once its top reaches the header's edge - or the top
   of the screen, when the header has slid away on a scroll down. */
const STUCK_AT = 66;
/* How far under the stuck map the reading line sits: past the list's label,
   into the first row. */
const READ_LINE = 64;

function subscribeStacked(callback) {
  const media = window.matchMedia(STACKED_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function readStacked() {
  return window.matchMedia(STACKED_QUERY).matches;
}

export default function HospitalFinder({ items, copy }) {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams] = useSearchParams();
  const requested = searchParams.get("branch");
  const requestedSlug = items.some((item) => item.slug === requested) ? requested : null;
  const stacked = useSyncExternalStore(subscribeStacked, readStacked, () => false);

  const [selectedSlug, setSelectedSlug] = useState(
    () => requestedSlug ?? getStoredBranch(items)?.slug ?? items[0]?.slug ?? null,
  );
  const [previewSlug, setPreviewSlug] = useState(null);
  const activeSlug = previewSlug ?? selectedSlug;

  const mapRef = useRef(null);
  const listRef = useRef(null);
  const played = useInView(mapRef, { once: true, amount: 0.35 });

  const rowFor = useCallback(
    (slug) => listRef.current?.querySelector(`[data-slug="${slug}"]`) ?? null,
    [],
  );

  /* An old link naming a hospital lands on its row, not the top of the page.
     Two frames later, because the route manager scrolls every new route to
     the top on the next frame and would cancel this one. */
  useEffect(() => {
    if (!requestedSlug) return undefined;
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        rowFor(requestedSlug)?.scrollIntoView({
          block: "center",
          behavior: shouldReduceMotion ? "auto" : "smooth",
        });
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [requestedSlug, rowFor, shouldReduceMotion]);

  /* Stacked, the row just under the stuck map drives the selection - the one
     the reader has scrolled to, not the middle of whatever is visible, so the
     first row is lit the moment the map sticks and each row takes over as it
     passes beneath. Read from the boxes rather than an IntersectionObserver
     band, because the map's own edge moves by the header's height as the
     header hides and returns. */
  useEffect(() => {
    if (!stacked) return undefined;
    let frame = 0;
    const read = () => {
      frame = 0;
      const map = mapRef.current;
      const list = listRef.current;
      if (!map || !list) return;
      const mapRect = map.getBoundingClientRect();
      if (mapRect.top > STUCK_AT) return;
      const line = mapRect.bottom + READ_LINE;
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
    };
  }, [stacked]);

  const choose = (slug) => {
    setSelectedSlug(slug);
    setPreviewSlug(null);
    rowFor(slug)?.scrollIntoView({
      block: stacked ? "center" : "nearest",
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className="hs-find">
      <div className="hs-map" ref={mapRef}>
        <HospitalMap
          items={items}
          activeSlug={activeSlug}
          played={played}
          onPreview={setPreviewSlug}
          onChoose={choose}
          ghost={copy.mapGhost}
        />
        <div className="hs-map__stamp">
          <BranchStatus />
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
                onMouseEnter={() => setPreviewSlug(branch.slug)}
                onMouseLeave={() => setPreviewSlug(null)}
                onFocus={() => setPreviewSlug(branch.slug)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setPreviewSlug(null);
                }}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.45,
                  ease: [0.22, 1, 0.36, 1],
                  delay: shouldReduceMotion ? 0 : position * 0.06,
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
