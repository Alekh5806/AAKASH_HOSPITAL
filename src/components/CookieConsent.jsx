import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, Cookie, X } from "lucide-react";
import { site } from "../lib/coreData";
import { applyBranchConsent } from "../lib/contact";
import { readConsent, writeConsent } from "../lib/consent";
import { useHydrated } from "../lib/hydration";
import { INTRO_DONE_EVENT, INTRO_EXIT_MS, isIntroPending } from "../lib/intro";

/* On a first visit the banner waits for the opening curtain to lift and then
   settles in a beat later, so it is never slid in behind the intro; a visit
   with no curtain gets it after a short pause rather than the old fixed wait. */
const BANNER_DELAY_MS = 600;
const BANNER_AFTER_INTRO_MS = INTRO_EXIT_MS + 500;
/* Every exit in cookie.css finishes inside this: the phone sheet's 300ms drop
   is the longest. Each surface holds its last frame until it goes. */
const LEAVE_MS = 320;
const FOCUSABLE = 'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

const { banner: bannerCopy, dialog: dialogCopy, categories, savedMessage } = site.cookies;
const optionalCategories = categories.filter((category) => category.id !== "necessary");

/* Every optional category starts off, which is also exactly what Reject
   optional stores. A pre-ticked switch would be consent the reader never gave,
   and it has to be written out key by key: a bare { necessary: true } would let
   normalize() fill the missing categories back in from the defaults. */
const noOptional = optionalCategories.reduce(
  (preferences, category) => ({ ...preferences, [category.id]: false }),
  { necessary: true },
);
const allPreferences = optionalCategories.reduce(
  (preferences, category) => ({ ...preferences, [category.id]: true }),
  { necessary: true },
);

function normalize(preferences) {
  return { ...noOptional, ...preferences, necessary: true };
}

function getStoredPreferences() {
  const saved = readConsent();
  return saved ? normalize(saved) : null;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CookieSwitch({ category, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      className="ck__switch"
      aria-checked={checked}
      aria-labelledby={`ck-cat-${category.id}`}
      onClick={onChange}
    >
      <span className="ck__switch-track" aria-hidden="true">
        <span className="ck__switch-knob" />
      </span>
      <span className="ck__switch-state">{checked ? "On" : "Off"}</span>
    </button>
  );
}

/* "What this stores" is a native disclosure, the FAQ's: it opens without
   JavaScript, the browser gives it its expanded state, and cookie.css lets it
   glide where ::details-content is understood. */
function CookieCategory({ category, checked, onChange }) {
  const isLocked = category.id === "necessary";

  return (
    <li className="ck__cat" data-locked={isLocked || undefined}>
      <div className="ck__cat-head">
        <span className="ck__cat-title" id={`ck-cat-${category.id}`}>
          {category.title}
        </span>
        {isLocked ? (
          <span className="ck__cat-lock">{category.lockedLabel}</span>
        ) : (
          <CookieSwitch category={category} checked={checked} onChange={onChange} />
        )}
      </div>

      <p className="ck__cat-text">{category.summary}</p>

      <details className="ck__cat-more">
        <summary className="ck__cat-summary">
          {dialogCopy.detailsLabel}
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <ul className="ck__cat-list">
          {category.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
    </li>
  );
}

/* The reader's cookie choice is in their browser, and the banner and the
   dialog only ever appear once the page is running, so neither is part of the
   prerendered page: they mount as React takes it over, which is when a page
   built fresh used to mount them. */
export default function CookieConsent() {
  return useHydrated() ? <CookieSheets /> : null;
}

function CookieSheets() {
  const [choice, setChoice] = useState(getStoredPreferences);
  const [preferences, setPreferences] = useState(choice ?? noOptional);
  const [bannerReady, setBannerReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  /* null, "dialog" (the dialog closes and the banner stays) or "all" (a choice
     was made and everything on screen goes). */
  const [leaving, setLeaving] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const dialogRef = useRef(null);
  const bodyRef = useRef(null);
  const chooseRef = useRef(null);
  const openerRef = useRef(null);
  const restoreRef = useRef(null);
  const leaveTimer = useRef(0);

  const showBanner = !choice && bannerReady;

  /* A hospital remembered before this choice existed - or before the reader
     changed it on another visit - moves to the storage the choice allows. */
  useEffect(() => {
    applyBranchConsent();
    return () => window.clearTimeout(leaveTimer.current);
  }, []);

  useEffect(() => {
    if (choice) return undefined;

    let timer = 0;
    const show = (delay) => {
      timer = window.setTimeout(() => setBannerReady(true), delay);
    };
    const onIntroDone = () => show(BANNER_AFTER_INTRO_MS);

    if (isIntroPending()) {
      window.addEventListener(INTRO_DONE_EVENT, onIntroDone, { once: true });
    } else {
      show(BANNER_DELAY_MS);
    }

    return () => {
      window.removeEventListener(INTRO_DONE_EVENT, onIntroDone);
      window.clearTimeout(timer);
    };
  }, [choice]);

  const onOpenPreferences = useEffectEvent(() => openDialog(document.activeElement));
  const onEscape = useEffectEvent(() => close());

  useEffect(() => {
    const open = () => onOpenPreferences();
    window.addEventListener("aakash:open-cookie-preferences", open);
    return () => window.removeEventListener("aakash:open-cookie-preferences", open);
  }, []);

  /* The dialog is the only surface that takes the screen, so it is the only one
     that locks the page, traps Tab and answers Escape. The banner stays a
     layer the reader can scroll past. */
  const trapping = dialogOpen && !leaving;

  useEffect(() => {
    if (!trapping) return undefined;

    const panel = dialogRef.current;
    document.body.classList.add("ck-locked");
    panel?.querySelector(FOCUSABLE)?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(panel?.querySelectorAll(FOCUSABLE) ?? []).filter(
        (node) => node.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("ck-locked");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [trapping]);

  /* Focus goes back to whatever opened the dialog once the dialog has let go
     of the page - for the banner's own link, that is also the moment the
     banner stops being inert. */
  useEffect(() => {
    if (trapping) return;
    const target = restoreRef.current;
    restoreRef.current = null;
    if (target?.isConnected) target.focus();
  }, [trapping]);

  /* The list scrolls inside the sheet on a phone; its foot fades only while
     there is more below, the phone menu's device. A measurement of the
     scroller, written straight to it, never render state. */
  useLayoutEffect(() => {
    if (!dialogOpen) return undefined;

    const body = bodyRef.current;
    if (!body) return undefined;

    body.scrollTop = 0;
    const mark = () => {
      body.toggleAttribute("data-more", body.scrollTop + body.clientHeight < body.scrollHeight - 4);
    };
    const observer = new ResizeObserver(mark);

    mark();
    observer.observe(body);
    Array.from(body.children).forEach((child) => observer.observe(child));
    body.addEventListener("scroll", mark, { passive: true });

    return () => {
      observer.disconnect();
      body.removeEventListener("scroll", mark);
    };
  }, [dialogOpen]);

  /* Every surface plays its exit before it goes; under reduced motion it
     simply goes. */
  function leave(kind, done) {
    if (prefersReducedMotion()) {
      done();
      return;
    }

    setLeaving(kind);
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      setLeaving(null);
      done();
    }, LEAVE_MS);
  }

  function openDialog(opener) {
    if (leaving) return;
    openerRef.current = opener ?? null;
    setPreferences(normalize(readConsent() ?? noOptional));
    setAnnouncement("");
    setDialogOpen(true);
  }

  /* Closing without choosing falls back to the banner when nothing has been
     stored yet - it was never taken away, only covered - so a reader who opens
     the details and changes their mind is still asked. */
  function close() {
    if (leaving) return;
    restoreRef.current = openerRef.current;
    leave("dialog", () => setDialogOpen(false));
  }

  function save(next) {
    if (leaving) return;

    const normalized = normalize(next);
    const opener = dialogOpen ? openerRef.current : null;

    writeConsent(normalized);
    applyBranchConsent();
    setPreferences(normalized);
    setAnnouncement(savedMessage);
    restoreRef.current = opener && !opener.closest?.(".ck__banner") ? opener : null;
    leave("all", () => {
      setChoice(normalized);
      setDialogOpen(false);
    });
  }

  function toggle(id) {
    setPreferences((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <>
      <p className="ck__sr" role="status">
        {announcement}
      </p>

      {showBanner ? (
        <aside
          className="ck ck__banner"
          aria-labelledby="ck-banner-title"
          data-state={leaving === "all" ? "leaving" : undefined}
          data-covered={dialogOpen && leaving !== "dialog" ? "" : undefined}
          inert={trapping}
        >
          <div className="ck__head">
            <span className="ck__glyph" aria-hidden="true">
              <Cookie size={20} strokeWidth={1.7} />
            </span>
            <div className="ck__heading">
              <span className="ck__eyebrow">{bannerCopy.eyebrow}</span>
              <h2 className="ck__banner-title" id="ck-banner-title">
                {bannerCopy.title}
              </h2>
            </div>
          </div>
          <p className="ck__text ck__text--full">{bannerCopy.body}</p>
          <p className="ck__text ck__text--short">{bannerCopy.bodyShort}</p>
          {/* The two decisions carry the same weight, the way GOV.UK sets
              them: refusing is never the harder or quieter choice. */}
          <div className="ck__actions">
            <button
              type="button"
              className="ck__btn ck__btn--primary"
              onClick={() => save(allPreferences)}
            >
              {bannerCopy.acceptLabel}
            </button>
            <button
              type="button"
              className="ck__btn ck__btn--primary"
              onClick={() => save(noOptional)}
            >
              {bannerCopy.rejectLabel}
            </button>
            <button
              type="button"
              className="ck__more"
              ref={chooseRef}
              onClick={(event) => openDialog(event.currentTarget)}
            >
              {bannerCopy.customiseLabel}
            </button>
          </div>
        </aside>
      ) : null}

      {/* Always mounted and hidden, like the phone menu: building it on the tap
          cost 34ms at 4x CPU before the sheet could start to rise, and opening
          is now one attribute. Closed, it is inert and invisible. */}
      <div
        className="ck ck__overlay"
        data-state={dialogOpen ? (leaving ? "leaving" : "open") : "closed"}
        inert={!dialogOpen}
      >
        <button
          type="button"
          className="ck__scrim"
          aria-label={dialogCopy.closeLabel}
          tabIndex={-1}
          onClick={close}
        />
        <section
          className="ck__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ck-dialog-title"
          aria-describedby="ck-dialog-lede"
          ref={dialogRef}
        >
          <header className="ck__dialog-head">
            <span className="ck__glyph" aria-hidden="true">
              <Cookie size={20} strokeWidth={1.7} />
            </span>
            <div className="ck__heading">
              <span className="ck__eyebrow">{dialogCopy.eyebrow}</span>
              <h2 className="ck__dialog-title" id="ck-dialog-title">
                {dialogCopy.title}
              </h2>
            </div>
            <button type="button" className="ck__close" onClick={close}>
              <X size={18} aria-hidden="true" />
              <span className="ck__sr">{dialogCopy.closeLabel}</span>
            </button>
          </header>

          <div className="ck__dialog-body" ref={bodyRef}>
            <p className="ck__text" id="ck-dialog-lede">
              {dialogCopy.lede}
            </p>

            <ul className="ck__cats">
              {categories.map((category) => (
                <CookieCategory
                  key={category.id}
                  category={category}
                  checked={category.id === "necessary" ? true : Boolean(preferences[category.id])}
                  onChange={() => toggle(category.id)}
                />
              ))}
            </ul>

            <p className="ck__note">{dialogCopy.note}</p>
          </div>

          <footer className="ck__dialog-foot">
            <button
              type="button"
              className="ck__btn ck__btn--primary"
              onClick={() => save(preferences)}
            >
              {dialogCopy.saveLabel}
            </button>
            <button type="button" className="ck__btn" onClick={() => save(allPreferences)}>
              {dialogCopy.acceptLabel}
            </button>
            <button type="button" className="ck__btn" onClick={() => save(noOptional)}>
              {dialogCopy.rejectLabel}
            </button>
          </footer>
        </section>
      </div>
    </>
  );
}
