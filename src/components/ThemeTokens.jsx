import { useEffect } from "react";
import { theme } from "../lib/coreData";

function toCssVar(group, key) {
  return `--${group}-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;
}

export default function ThemeTokens() {
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(toCssVar("color", key), value);
    });
    Object.entries(theme.fonts).forEach(([key, value]) => {
      root.style.setProperty(toCssVar("font", key), value);
    });
    Object.entries(theme.radius).forEach(([key, value]) => {
      root.style.setProperty(toCssVar("radius", key), value);
    });
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(toCssVar("shadow", key), value);
    });
  }, []);

  return null;
}
