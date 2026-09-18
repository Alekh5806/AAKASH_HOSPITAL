/* The tagline is one string in site.json; the "since <year>" at its end is
   what gets the serif italic, the way the footer lifts the year off its
   `Since 1993` label. A tagline without it renders whole in roman. Plain JS
   with no React import because vite.config.js reads it for the static frame. */
export function splitTagline(tagline) {
  const match = /^(.*?)\s*\b(since\s+\d{4})$/i.exec(tagline);
  return match ? [match[1], match[2]] : [tagline, ""];
}

/* "Since 1993" is set as two typographic parts wherever the site shows it: a
   tracked micro word and the year in the serif italic accent. The year is read
   off the end of the label so the JSON stays a single plain string, and a label
   with no trailing year renders whole. The header's lockup and the footer's
   masthead both read this, so the two ends of every page set it identically. */
export function splitEstablished(label) {
  const match = /^(.*?)\s*(\d{4})\s*$/.exec(label);
  return match ? { word: match[1], year: match[2] } : { word: label, year: "" };
}
