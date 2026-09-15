import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import Reveal from "../components/Reveal";
import SmartImage from "../components/SmartImage";
import { branchPage } from "../lib/branchData";

const { inside } = branchPage;

/* The hospital's own photographs of itself: the hall a visitor waits in, the
 * room they are examined in, the street they arrive on. For a first visit -
 * and for the family member booking it - this is what makes the building a
 * place rather than an address.
 *
 * **One shape at every width: a stage, a caption, a row of thumbnails.** The
 * build before this was three different galleries - a three-up mosaic on a
 * laptop, a two-column grid on a tablet and a swipe rail on a phone - so the
 * section a reader met depended on the device, and only the laptop showed the
 * photographs at a size worth looking at. Now every width gets the same
 * instrument and only its measurements change: one large photograph, the four
 * thumbnails under it, and the full-screen viewer a tap away.
 *
 * **The stage fills with the photograph.** All four are the hospital's own 4:3
 * frames, so one crop ratio suits every one of them. It was contained over a
 * blurred copy of itself while the set mixed portrait and landscape; if a
 * portrait photograph is ever added back, that treatment has to come back with
 * it rather than the photograph being cropped.
 *
 * The stage is a native scroll-snap rail, so a phone swipes it with the
 * browser's own momentum and direction lock. Scroll position is the single
 * source of truth: the thumbnails do not set the index, they scroll the rail
 * and the rail reports back, which is what keeps the two in step no matter
 * which one the reader used. */
export default function BranchInside({ branch }) {
  const shouldReduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [openAt, setOpenAt] = useState(null);
  const [current, setCurrent] = useState(0);
  const stageRef = useRef(null);
  const railRef = useRef(null);
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const { gallery } = branch.page;

  /* Opening at the tapped photograph is a scroll write, not an animation: the
     rail must be there before the reader sees it. */
  const mountRail = useCallback(
    (node) => {
      railRef.current = node;
      if (!node || openAt === null) return;
      node.scrollLeft = openAt * node.clientWidth;
    },
    [openAt],
  );

  const showPhoto = (position) => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.scrollTo({
      left: position * stage.clientWidth,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  const open = (position, event) => {
    openerRef.current = event.currentTarget;
    setCurrent(position);
    setOpenAt(position);
  };

  const close = useCallback(() => setOpenAt(null), []);

  /* The page behind must not scroll under the viewer, and the reader must land
     back on the photograph they opened - the opener is held in a local so the
     cleanup cannot read a ref that has already moved on. The lock is a class
     rather than an inline style: react-hooks/immutability rejects writing to
     document.body.style, and a class is one rule this stylesheet owns. */
  useEffect(() => {
    if (openAt === null) return undefined;
    const opener = openerRef.current;
    document.body.classList.add("br-locked");
    closeRef.current?.focus();

    return () => {
      document.body.classList.remove("br-locked");
      opener?.focus({ preventScroll: true });
    };
  }, [openAt]);

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll("button:not([disabled]), [tabindex='0']");
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const step = (delta) => {
    const rail = railRef.current;
    if (!rail) return;
    const next = Math.min(gallery.length - 1, Math.max(0, current + delta));
    rail.scrollTo({
      left: next * rail.clientWidth,
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  };

  if (!gallery?.length) return null;

  return (
    <section className="e-sec e-sec--tight br-inside" aria-labelledby="br-inside-title">
      <div className="e-shell">
        <Reveal className="e-head">
          <span className="e-label">{inside.label}</span>
          <div className="e-head__body">
            <h2 className="e-h2" id="br-inside-title">
              {inside.title} <em>{branch.name}</em>
            </h2>
            <p className="e-lede">{inside.lede}</p>
          </div>
        </Reveal>

        <Reveal className="br-gallery" as="div">
          <div
            className="br-gallery__stage"
            ref={stageRef}
            onScroll={(event) => {
              const stage = event.currentTarget;
              setIndex(Math.round(stage.scrollLeft / stage.clientWidth));
            }}
          >
            {gallery.map((photo, position) => (
              <button
                className="br-gallery__slide"
                key={photo.src}
                type="button"
                /* A roving tabstop: only the photograph on screen takes one, so
                   the gallery costs the keyboard five stops rather than nine.
                   The thumbnails reach the rest. */
                tabIndex={position === index ? 0 : -1}
                onClick={(event) => open(position, event)}
                aria-label={`${inside.openLabel}: ${photo.caption}`}
              >
                <SmartImage
                  className="br-gallery__img"
                  src={photo.src}
                  alt={photo.alt}
                  loading={position === 0 ? "eager" : "lazy"}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
                <span className="br-gallery__zoom" aria-hidden="true">
                  <Maximize2 size={15} />
                </span>
              </button>
            ))}
          </div>

          <p className="br-gallery__caption">
            <span>{gallery[index]?.caption}</span>
            <em>
              {index + 1} / {gallery.length}
            </em>
          </p>

          <ul className="br-gallery__thumbs">
            {gallery.map((photo, position) => (
              <li key={photo.src}>
                <button
                  className="br-gallery__thumb"
                  type="button"
                  data-on={position === index ? "true" : undefined}
                  aria-current={position === index ? "true" : undefined}
                  onClick={() => showPhoto(position)}
                  aria-label={`${inside.showLabel}: ${photo.caption}`}
                >
                  <img src={photo.src} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <AnimatePresence>
        {openAt !== null ? (
          <motion.div
            className="br-viewer"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={inside.viewerLabel}
            onKeyDown={onKeyDown}
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.24 }}
          >
            <button
              className="br-viewer__close"
              type="button"
              ref={closeRef}
              onClick={close}
              aria-label={inside.closeLabel}
            >
              <X size={20} aria-hidden="true" />
            </button>

            <div
              className="br-viewer__rail"
              ref={mountRail}
              tabIndex={0}
              aria-label={inside.viewerLabel}
              onScroll={(event) => {
                const rail = event.currentTarget;
                setCurrent(Math.round(rail.scrollLeft / rail.clientWidth));
              }}
            >
              {gallery.map((photo) => (
                <figure className="br-viewer__slide" key={photo.src}>
                  <img src={photo.src} alt={photo.alt} />
                </figure>
              ))}
            </div>

            <button
              className="br-viewer__step"
              type="button"
              data-side="prev"
              onClick={() => step(-1)}
              disabled={current === 0}
              aria-label={`${inside.showLabel}: ${gallery[Math.max(0, current - 1)].caption}`}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              className="br-viewer__step"
              type="button"
              data-side="next"
              onClick={() => step(1)}
              disabled={current === gallery.length - 1}
              aria-label={`${inside.showLabel}: ${
                gallery[Math.min(gallery.length - 1, current + 1)].caption
              }`}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>

            <p className="br-viewer__caption">
              <span>{gallery[current]?.caption}</span>
              <em>
                {current + 1} / {gallery.length}
              </em>
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
