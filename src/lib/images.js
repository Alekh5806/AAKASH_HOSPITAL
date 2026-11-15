/* A photograph encoded at several widths (`[{ src, width }]` in the JSON) as a
   srcset, so a phone downloads the width its screen can show. */
export function toSrcSet(set) {
  return set?.length ? set.map(({ src, width }) => `${src} ${width}w`).join(", ") : undefined;
}
