/* The rows and acuity fractions of the standard Snellen chart, as on the wall
   of every examination room. Sizes are in viewBox units and fall in the same
   proportion the real chart uses. The symptoms readout draws it as it is; the
   not-found page sets 4 0 4 on its top line. */
export const SNELLEN_ROWS = [
  { letters: "E", size: 62, acuity: "20/200" },
  { letters: "L T", size: 44, acuity: "20/100" },
  { letters: "F P H", size: 33, acuity: "20/70" },
  { letters: "O L C F", size: 25, acuity: "20/50" },
  { letters: "D H J B S", size: 20, acuity: "20/40" },
  { letters: "E P T Z O", size: 16, acuity: "20/30" },
  { letters: "C F D H J", size: 13, acuity: "20/25" },
  { letters: "L T I P H", size: 11, acuity: "20/20" },
];

/* Rows sit at the baselines a real chart uses - a big gap under the E, then
   tightening as the letters shrink. */
export const SNELLEN_BASELINES = [72, 140, 194, 240, 280, 314, 343, 368];

export const SNELLEN_VIEW = "0 0 260 392";
