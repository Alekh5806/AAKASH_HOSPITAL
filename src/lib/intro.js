import { useEffect, useState } from "react";

/* The opening curtain and the two things that wait on it - the hero film and
   the cookie sheet - read these rather than each other. `index.html` reads the
   storage key inline before first paint to skip its static first frame. */
export const INTRO_STORAGE_KEY = "aakash_intro_seen";
export const INTRO_DONE_EVENT = "aakash:intro-done";

/* All from navigation start, not from mount: the static frame in index.html
   is on screen from the first paint, so a slow route load spends the floor
   before React even arrives and adds no hold of its own. */
export const INTRO_FLOOR_MS = 1100;
export const INTRO_CAP_MS = 3200;
/* From mount: the iris takes this long to draw, and the home page never
   opens the aperture over a half-drawn iris, however late React arrived. */
export const INTRO_DRAW_MS = 1000;
export const INTRO_QUICK_MS = 420;
export const INTRO_EXIT_MS = 850;
export const INTRO_DISMISS_AFTER_MS = 500;

export function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function rememberIntro() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
  } catch {
    // Storage can be unavailable in strict privacy modes; the curtain still lifts.
  }
}

export function isIntroPending() {
  return typeof window !== "undefined" && !hasSeenIntro();
}

/* Milliseconds since the static frame in index.html painted - its inline
   script stamps the moment - which is the clock the wordmark's rise and the
   floor run on. Navigation start would put React ahead of the frame after a
   slow HTML fetch. */
export function introElapsed() {
  return performance.now() - (window.__aakashIntroStart ?? 0);
}

/* True once the curtain has started to lift, or at once when there was no
   curtain for this page load. */
export function useIntroDone() {
  const [done, setDone] = useState(() => !isIntroPending());

  useEffect(() => {
    if (done) return undefined;

    const onDone = () => setDone(true);
    window.addEventListener(INTRO_DONE_EVENT, onDone, { once: true });
    return () => window.removeEventListener(INTRO_DONE_EVENT, onDone);
  }, [done]);

  return done;
}
