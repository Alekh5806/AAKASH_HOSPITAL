import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { site } from "../lib/coreData";
import {
  INTRO_CAP_MS,
  INTRO_DISMISS_AFTER_MS,
  INTRO_DONE_EVENT,
  INTRO_DRAW_MS,
  INTRO_EXIT_MS,
  INTRO_FLOOR_MS,
  INTRO_QUICK_MS,
  introElapsed,
  isIntroPending,
  rememberIntro,
} from "../lib/intro";
import IntroMark from "./IntroMark";

const STATIC_FRAME_ID = "app-intro";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Waits for the fonts the curtain and the page both use, and for the first
   screen's own picture - the hero poster, a hospital's facade - so the aperture
   never opens onto an empty frame. Anything else is covered by the cap. */
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

export default function AppPreloader() {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(isIntroPending);
  const [phase, setPhase] = useState("hold");
  const [still] = useState(prefersReducedMotion);
  const phaseRef = useRef("hold");
  const rootRef = useRef(null);

  /* The static first frame in index.html has been on screen since first
     paint; this component paints the identical frame in its place. Both
     happen before the browser paints: the wordmark and the line rise on the
     frame's clock, so the curtain is handed the elapsed time at commit -
     measured at render it ran up to 160ms early and the rise visibly stepped
     back - and the static frame goes in the same step so the two never
     overlap for a frame. */
  useLayoutEffect(() => {
    rootRef.current?.style.setProperty("--pl-t", `${Math.round(introElapsed())}ms`);
    document.getElementById(STATIC_FRAME_ID)?.remove();
  }, [isVisible]);

  /* While the curtain is up nothing under it may scroll or take focus - the
     page is finished and live underneath, so it is made inert. */
  useEffect(() => {
    if (!isVisible) return undefined;

    document.body.classList.add("pl-lock");
    const covered = Array.from(document.getElementById("root")?.children ?? []).filter(
      (element) => !element.classList.contains("pl"),
    );
    covered.forEach((element) => element.setAttribute("inert", ""));

    return () => {
      document.body.classList.remove("pl-lock");
      covered.forEach((element) => element.removeAttribute("inert"));
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return undefined;

    const isHome = pathname === "/";
    const timers = [];
    let cancelled = false;

    function lift() {
      if (cancelled || phaseRef.current !== "hold") return;
      phaseRef.current = "open";
      rememberIntro();
      window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));

      /* A curtain that was only up for the blink of a fast load is dropped,
         not opened: an aperture over nothing reads as a glitch. The home page
         always holds the floor, so its aperture always plays. */
      const quick = !isHome && introElapsed() < INTRO_QUICK_MS;
      if (still || quick) {
        setIsVisible(false);
        return;
      }

      setPhase("open");
      timers.push(window.setTimeout(() => setIsVisible(false), INTRO_EXIT_MS));
    }

    /* Both from the static frame's first paint, so a slow load spends them
       before React arrives; on the home page neither may cut the draw-in short. */
    const sinceFrame = introElapsed();
    const floor = isHome && !still ? Math.max(INTRO_FLOOR_MS - sinceFrame, INTRO_DRAW_MS) : 0;
    const cap = Math.max(INTRO_CAP_MS - sinceFrame, isHome && !still ? INTRO_DRAW_MS : 0);
    const floorPassed = new Promise((resolve) => {
      timers.push(window.setTimeout(resolve, floor));
    });

    Promise.all([whenFirstScreenReady(), floorPassed]).then(lift, lift);
    timers.push(window.setTimeout(lift, cap));

    /* Dismissible once it has been seen: a tap, Enter or Escape. */
    const armedAt = performance.now() + INTRO_DISMISS_AFTER_MS;
    const dismiss = () => {
      if (performance.now() >= armedAt) lift();
    };
    const onKey = (event) => {
      if (event.key === "Escape" || event.key === "Enter") dismiss();
    };
    window.addEventListener("pointerdown", dismiss);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", onKey);
    };
  }, [isVisible, pathname, still]);

  if (!isVisible) return null;

  return (
    <div
      ref={rootRef}
      className="pl"
      data-phase={phase}
      data-still={still ? "" : undefined}
      role="status"
      aria-label={`${site.brand.name} is opening`}
    >
      <IntroMark />
    </div>
  );
}
