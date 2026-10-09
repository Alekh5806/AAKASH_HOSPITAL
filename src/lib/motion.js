import { useEffect, useState } from "react";

export function revealVariants(reducedMotion = false, distance = 24) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    };
  }

  return {
    hidden: { opacity: 0.96, y: Math.min(distance, 10) },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

export function staggerContainer(reducedMotion = false) {
  return {
    hidden: {},
    visible: {
      transition: reducedMotion ? {} : { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
}

/* A head's parts arrive in reading order: each child with a `hidden` /
   `shown` pair rises after the one before it. */
export const cascade = (delay, stagger = 0.08) => ({
  hidden: {},
  shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/* An accent phrase writes itself in once its line has risen - the About,
   doctors, services and service heads' device. Each word is clipped in its
   own inline-block, so a phrase that wraps is never cut to its first line,
   and the resting inset is negative so the italic's overhang and descenders
   are never cut. */
export const WRITE = {
  hidden: { clipPath: "inset(-0.15em 100% -0.3em -0.15em)" },
  shown: {
    clipPath: "inset(-0.15em -0.3em -0.3em -0.15em)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/* True where the browser can drive a CSS animation from the page's scroll
   position (animation-timeline). There the home page's sections arrive by
   the scroll choreography at the end of landing.css, and a section's framer
   entrance has to stand down or the two would move the same element at once;
   elsewhere (Firefox today, Safari before 26) framer's entrance is what the
   reader gets. Read once - support cannot change during a visit. The
   prerender assumes support: only a browser that has it adopts the
   prerendered page (main.jsx), and every other one builds its own. */
export const SCROLL_DRIVEN =
  typeof window === "undefined" ||
  (typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timeline: view()"));

/* In view for as long as the element is being looked at, and played again
   every time the reader comes back to it. `inView` turns true once `amount`
   of the element is on screen and turns false only when none of it is, so a
   card never un-plays while any of it is visible - it resets off screen and
   arrives again on the way back. `round` counts those resets: a component
   keys what it animates on it, so each return starts from the first frame
   rather than reversing out of the last one. A reset is skipped while focus
   is inside, because remounting would drop a keyboard reader's place. */
export function useInViewReplay(ref, amount) {
  const [state, setState] = useState({ inView: false, round: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;

    /* The ratio reported at a crossing can land a hair under the threshold
       that fired it; without the tolerance that card would never play. */
    const reached = amount - 0.01;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= reached) {
          setState((current) => (current.inView ? current : { ...current, inView: true }));
        } else if (!entry.isIntersecting && !element.contains(document.activeElement)) {
          setState((current) =>
            current.inView ? { inView: false, round: current.round + 1 } : current,
          );
        }
      },
      { threshold: [0, amount] },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, amount]);

  return state;
}

/* A card's framer entrance where the scroll does not drive it (Firefox,
   Safari before 26). It follows useInViewReplay: it rises each time the card
   comes back, and drops back to its start with no transition while the card
   is off screen, so nothing is ever seen leaving. */
export function cardEntrance(shown, { index = 0, distance, duration, stagger, ease }) {
  return {
    initial: { opacity: 0, y: distance },
    animate: shown
      ? { opacity: 1, y: 0, transition: { duration, delay: index * stagger, ease } }
      : { opacity: 0, y: distance, transition: { duration: 0 } },
  };
}
