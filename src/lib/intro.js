import { useEffect } from "react";
import { useClientState } from "./hydration";

/* The opening curtain and the two things that wait on it - the hero film and
   the cookie sheet - read these rather than each other. `index.html` reads the
   storage key inline before first paint to skip its static first frame. */
export const INTRO_STORAGE_KEY = "aakash_intro_seen";
export const INTRO_DONE_EVENT = "aakash:intro-done";

/* All from the static frame's first paint, not from mount: the curtain is
   on screen from then, so a slow route load spends the floor before React
   even arrives and adds no hold of its own. The eye never opens before the
   logo has finished arriving (INTRO_BRAND_MS); on the home page it also
   holds a moment longer so the logo is seen (INTRO_FLOOR_MS); and nowhere
   does it stay shut past the cap. */
export const INTRO_BRAND_MS = 1000;
export const INTRO_FLOOR_MS = 1400;
export const INTRO_CAP_MS = 3200;
/* The opening - `pl-lid-up` in preloader.css. */
export const INTRO_EXIT_MS = 1100;
export const INTRO_DISMISS_AFTER_MS = 500;

/* Kept alongside the storage key, so a browser that refuses storage still
   knows the curtain has gone once it has - a page opened in the app after
   that must not wait for an opening that will never come. */
let openedThisVisit = false;
if (typeof window !== "undefined") {
  window.addEventListener(INTRO_DONE_EVENT, () => {
    openedThisVisit = true;
  });
}

export function hasSeenIntro() {
  if (openedThisVisit) return true;
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
   script stamps the moment - which is the clock the logo's arrival and the
   floor run on. Navigation start would put React ahead of the frame after a
   slow HTML fetch. */
export function introElapsed() {
  return performance.now() - (window.__aakashIntroStart ?? 0);
}

/* True once the curtain has started to lift, or at once when there was no
   curtain for this page load. The prerendered copy is built as if the
   curtain were up - the first visit, whose arrival is the one most worth
   getting exactly right - so a reload flips this to true the moment React
   has adopted the page, under the reload veil. */
export function useIntroDone() {
  const [done, setDone] = useClientState(() => !isIntroPending(), false);

  useEffect(() => {
    if (done) return undefined;

    const onDone = () => setDone(true);
    window.addEventListener(INTRO_DONE_EVENT, onDone, { once: true });
    return () => window.removeEventListener(INTRO_DONE_EVENT, onDone);
  }, [done, setDone]);

  return done;
}

/* Whether this page opened under the curtain - read when the page mounts, so
   a head knows to wait a beat for the aperture to clear it. */
export function useAfterIntro() {
  const [afterIntro] = useClientState(isIntroPending, true);
  return afterIntro;
}
