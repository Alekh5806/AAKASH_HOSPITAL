import { useEffect, useState } from "react";
import { site } from "../lib/coreData";

const PRELOADER_KEY = "aakash_intro_seen";

function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(PRELOADER_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberIntro() {
  try {
    window.sessionStorage.setItem(PRELOADER_KEY, "true");
  } catch {
    // Storage can be unavailable in strict privacy modes; the loader can still dismiss normally.
  }
}

export default function AppPreloader() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !hasSeenIntro();
  });
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!isVisible) return undefined;

    const leaveTimer = window.setTimeout(() => setIsLeaving(true), 1450);
    const doneTimer = window.setTimeout(() => {
      rememberIntro();
      setIsVisible(false);
    }, 1900);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <section
      className={`app-preloader${isLeaving ? " app-preloader--leaving" : ""}`}
      aria-label="Loading Aakash Eye Hospital"
      aria-live="polite"
    >
      <div className="app-preloader__mark" aria-hidden="true">
        <span className="app-preloader__orbit" />
        <span className="app-preloader__scan" />
        <img src={site.brand.logo} alt="" />
      </div>
      <div className="app-preloader__copy">
        <span>Advanced eye care since 1993</span>
        <strong>{site.brand.name}</strong>
        <p>Your eyes in safe hand</p>
      </div>
      <div className="app-preloader__progress" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
