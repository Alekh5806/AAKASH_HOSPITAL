import { useEffect, useState } from "react";
import { isIntroPending } from "../lib/intro";
import IntroMark from "./IntroMark";

/* A reload with the intro already seen shows this between React's first
   render and the first route module. A cached route arrives in well under
   this, so the frame stays bare paper and nothing flashes; only a genuinely
   slow load gets the mark, still and finished, faded in. On a first visit
   the static frame in index.html is already the frame, and this renders
   nothing rather than painting a finished iris over its seed. */
const SETTLE_MS = 350;

export default function HydrateFallback() {
  const [settled, setSettled] = useState(false);
  const [introPending] = useState(isIntroPending);

  useEffect(() => {
    if (introPending) return undefined;

    const timer = window.setTimeout(() => setSettled(true), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [introPending]);

  if (introPending) return null;

  return (
    <section
      className="pl pl--wait"
      data-still=""
      data-settled={settled ? "" : undefined}
      role="status"
      aria-label="Loading page"
    >
      <IntroMark />
    </section>
  );
}
