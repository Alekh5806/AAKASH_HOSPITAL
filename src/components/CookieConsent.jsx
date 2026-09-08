import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Cookie, X } from "lucide-react";
import { site } from "../lib/coreData";
import { getIcon } from "../lib/icons";

const COOKIE_NAME = "aakash_cookie_preferences";
const COOKIE_DAYS = 180;
/* The banner waits for AppPreloader (1900ms) to finish before it appears, so a
   first-time visitor never gets the consent card slid in behind the intro. */
const BANNER_DELAY_MS = 2100;
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

const { banner: bannerCopy, dialog: dialogCopy, categories } = site.cookies;
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

function readCookie() {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

function writeCookie(preferences) {
  const expires = new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(preferences))}; expires=${expires}; path=/; SameSite=Lax`;
}

function normalize(preferences) {
  return { ...noOptional, ...preferences, necessary: true };
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

function CookieCategory({ category, checked, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const isLocked = category.id === "necessary";
  const detailsId = `ck-details-${category.id}`;

  return (
    <li className="ck__cat" data-locked={isLocked || undefined}>
      <div className="ck__cat-head">
        <span className="ck__cat-icon" aria-hidden="true">
          {createElement(getIcon(category.icon), { size: 18, strokeWidth: 1.7 })}
        </span>
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

      <button
        type="button"
        className="ck__cat-more"
        aria-expanded={isOpen}
        aria-controls={detailsId}
        onClick={() => setIsOpen((open) => !open)}
      >
        {dialogCopy.detailsLabel}
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      <ul className="ck__cat-list" id={detailsId} hidden={!isOpen}>
        {category.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </li>
  );
}

function getStoredPreferences() {
  if (typeof document === "undefined") {
    return null;
  }

  const saved = readCookie();
  return saved ? normalize(saved) : null;
}

export default function CookieConsent() {
  const [storedPreferences] = useState(getStoredPreferences);
  const [mode, setMode] = useState(null);
  const [preferences, setPreferences] = useState(storedPreferences ?? noOptional);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    if (storedPreferences) return undefined;

    const timer = window.setTimeout(() => setMode("banner"), BANNER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [storedPreferences]);

  useEffect(() => {
    function openPreferences() {
      const saved = readCookie();

      if (saved) {
        setPreferences(normalize(saved));
      }

      openerRef.current = document.activeElement;
      setMode("dialog");
    }

    window.addEventListener("aakash:open-cookie-preferences", openPreferences);
    return () => window.removeEventListener("aakash:open-cookie-preferences", openPreferences);
  }, []);

  /* Closing the dialog without choosing falls back to the banner when nothing
     has been stored yet, so a reader who opens the details and changes their
     mind is still asked rather than silently left with no choice recorded. */
  const close = useCallback((options = {}) => {
    setMode(options.saved || readCookie() ? null : "banner");
    const opener = openerRef.current;
    openerRef.current = null;

    if (opener?.isConnected) {
      opener.focus();
    }
  }, []);

  /* The dialog is the only surface that takes the screen, so it is the only one
     that locks the page, traps Tab and answers Escape. The banner stays a
     dismissible layer the reader can scroll past. */
  useEffect(() => {
    if (mode !== "dialog") return undefined;

    const panel = dialogRef.current;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    panel?.querySelector(FOCUSABLE)?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
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
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mode, close]);

  function save(next) {
    const normalized = normalize(next);
    writeCookie(normalized);
    setPreferences(normalized);
    close({ saved: true });
  }

  function toggle(id) {
    setPreferences((current) => ({ ...current, [id]: !current[id] }));
  }

  if (!mode) {
    return null;
  }

  if (mode === "banner") {
    return (
      <aside className="ck ck__banner" aria-labelledby="ck-banner-title">
        <span className="ck__glyph" aria-hidden="true">
          <Cookie size={20} strokeWidth={1.7} />
        </span>
        <div className="ck__banner-copy">
          <span className="ck__eyebrow">{bannerCopy.eyebrow}</span>
          <h2 className="ck__banner-title" id="ck-banner-title">
            {bannerCopy.title}
          </h2>
          <p className="ck__text ck__text--full">{bannerCopy.body}</p>
          <p className="ck__text ck__text--short">{bannerCopy.bodyShort}</p>
        </div>
        <div className="ck__actions">
          <button
            type="button"
            className="ck__btn ck__btn--primary"
            onClick={() => save(allPreferences)}
          >
            {bannerCopy.acceptLabel}
          </button>
          <button type="button" className="ck__btn" onClick={() => save(noOptional)}>
            {bannerCopy.rejectLabel}
          </button>
          <button
            type="button"
            className="ck__more"
            onClick={() => {
              openerRef.current = null;
              setMode("dialog");
            }}
          >
            {bannerCopy.customiseLabel}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <div className="ck ck__overlay">
      <button
        type="button"
        className="ck__scrim"
        aria-label={dialogCopy.closeLabel}
        tabIndex={-1}
        onClick={() => close()}
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
          <div>
            <span className="ck__eyebrow">{dialogCopy.eyebrow}</span>
            <h2 className="ck__dialog-title" id="ck-dialog-title">
              {dialogCopy.title}
            </h2>
          </div>
          <button type="button" className="ck__close" onClick={() => close()}>
            <X size={18} aria-hidden="true" />
            <span className="ck__sr">{dialogCopy.closeLabel}</span>
          </button>
        </header>

        <div className="ck__dialog-body">
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
  );
}
