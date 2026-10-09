import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useHydrated } from "../lib/hydration";
import {
  INTRO_BRAND_MS,
  INTRO_CAP_MS,
  INTRO_DISMISS_AFTER_MS,
  INTRO_DONE_EVENT,
  INTRO_EXIT_MS,
  INTRO_FLOOR_MS,
  introElapsed,
  isIntroPending,
  rememberIntro,
} from "../lib/intro";

const FRAME_ID = "app-intro";
const WAIT_ID = "app-wait";

/* The line between the logo and the tagline is the curtain's progress: it
   fills as the page really loads, and the eye opens only once it is full.
   index.html takes it to about half (the frame is up, the serif is in); the
   app mounting takes it on, a slow load creeps it towards the end, and the
   first screen being ready closes it in SEAL_MS. */
const MOUNTED = [0.72, 600];
const CREEP = [0.9, 2800];
const SEAL_MS = 380;
const SEAL_QUICK_MS = 220;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Waits for the fonts the page uses and for the first screen's own picture -
   the hero poster, a hospital's facade - so the eye never opens onto an
   empty frame. Anything else is covered by the cap. */
async function whenFirstScreenReady() {
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();

  /* Two frames, because the hero picks its phone encode in an effect of its
     own and the first commit still carries the desktop poster. */
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  const media = document.querySelector("main video[poster], main img");
  const src = media ? media.getAttribute("poster") || media.currentSrc || media.src : "";

  if (!src) return fonts;

  const image = new Image();
  image.src = src;
  const decoded = image.decode().catch(() => {});
  return Promise.all([fonts, decoded]);
}

/* The curtain is the static frame in index.html, painted before any script;
   this takes it over rather than painting a copy. It holds the page still
   underneath, moves the loading line, and opens the frame once the first
   screen is ready and the logo has finished arriving - on the home page a
   moment later still, so the logo is seen before the film. */
export default function AppPreloader() {
  const { pathname } = useLocation();
  const [isHome] = useState(() => pathname === "/");
  /* Where React adopts the prerendered page, its first pass is the build's
     page and the reader's own values arrive in the pass after; everything
     here waits for that one, which is the moment a page built fresh used to
     mount. */
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return undefined;

    /* Whatever changed as React took over has been laid out in its final
       state; from here on the page's transitions are its own again. */
    const root = document.documentElement;
    if (root.classList.contains("app-adopting")) {
      void document.body.offsetHeight;
      root.classList.remove("app-adopting");
    }

    /* The paper veil over a prerendered page on a reload: React has rendered
       the page by now, so it goes. */
    document.getElementById(WAIT_ID)?.remove();

    const frame = document.getElementById(FRAME_ID);
    if (!frame) return undefined;
    if (!isIntroPending() || getComputedStyle(frame).visibility === "hidden") {
      frame.remove();
      return undefined;
    }

    const page = document.getElementById("root");
    const still = prefersReducedMotion();
    const timers = [];
    let phase = "hold";
    let cancelled = false;

    const later = (ms) =>
      new Promise((resolve) => {
        timers.push(window.setTimeout(resolve, Math.max(0, ms)));
      });

    const filled = () => parseFloat(frame.style.getPropertyValue("--pl-p")) || 0;

    /* The line's value only ever rises: index.html may already be past a
       step this would take it back to. */
    function fill(value, ms) {
      if (value <= filled()) return;
      frame.style.setProperty("--pl-pt", `${ms}ms`);
      frame.style.setProperty("--pl-p", String(value));
    }

    /* While the curtain is up nothing under it may scroll or take focus. */
    document.body.classList.add("pl-lock");
    page?.setAttribute("inert", "");

    function release() {
      document.body.classList.remove("pl-lock");
      page?.removeAttribute("inert");
    }

    function finish() {
      if (phase === "done") return;
      phase = "done";
      release();
      frame.remove();
    }

    function announce() {
      rememberIntro();
      window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
    }

    /* The opening is committed first and the page told a frame later: the
       hero starts its film and its copy on the signal, and that work landing
       in the opening's first frame delayed it (a 55ms frame at 6x CPU). The
       lids wait 60ms anyway, so nothing is seen to lag. */
    function open() {
      if (cancelled) return;
      phase = "open";
      frame.setAttribute("data-phase", "open");
      requestAnimationFrame(() => requestAnimationFrame(announce));
      /* The opening ends on the lid's own animationend; this only covers a
         browser that never fires one. */
      timers.push(window.setTimeout(finish, INTRO_EXIT_MS + 200));
    }

    function lift() {
      if (cancelled || phase !== "hold") return;
      phase = "lifting";

      if (still) {
        announce();
        finish();
        return;
      }

      /* The cap or a tap can arrive before the line is full; it closes
         quickly, and the eye opens on a full line. */
      if (filled() >= 1) {
        open();
        return;
      }
      fill(1, SEAL_QUICK_MS);
      timers.push(window.setTimeout(open, SEAL_QUICK_MS));
    }

    fill(...MOUNTED);
    timers.push(window.setTimeout(() => fill(...CREEP), MOUNTED[1]));

    const ready = whenFirstScreenReady()
      .catch(() => {})
      .then(() => {
        if (cancelled) return undefined;
        fill(1, SEAL_MS);
        return still ? undefined : later(SEAL_MS);
      });
    const floor = later(still ? 0 : (isHome ? INTRO_FLOOR_MS : INTRO_BRAND_MS) - introElapsed());
    Promise.all([ready, floor]).then(lift);
    timers.push(window.setTimeout(lift, INTRO_CAP_MS - introElapsed()));

    const onOpened = (event) => {
      if (event.animationName === "pl-lid-up") finish();
    };
    frame.addEventListener("animationend", onOpened);

    /* Dismissible once it has been seen: a tap, Enter or Escape. */
    const dismissibleAt = performance.now() + INTRO_DISMISS_AFTER_MS;
    const dismiss = () => {
      if (performance.now() >= dismissibleAt) lift();
    };
    const onKey = (event) => {
      if (event.key === "Escape" || event.key === "Enter") dismiss();
    };
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      frame.removeEventListener("animationend", onOpened);
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", onKey);
      if (phase !== "done") release();
    };
  }, [hydrated, isHome]);

  return null;
}
