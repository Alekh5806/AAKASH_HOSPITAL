/* The tagline is one string in site.json; the "since <year>" at its end is
   what gets the serif italic, the way the footer lifts the year off its
   `Since 1993` label. A tagline without it renders whole in roman. Plain JS
   with no React import because vite.config.js reads it for the static frame. */
export function splitTagline(tagline) {
  const match = /^(.*?)\s*\b(since\s+\d{4})$/i.exec(tagline);
  return match ? [match[1], match[2]] : [tagline, ""];
}
