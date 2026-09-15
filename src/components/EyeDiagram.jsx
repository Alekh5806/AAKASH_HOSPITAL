/* A cross-section of the eye, pointing left, with one selectable region per
   part the hospital treats. It exists because a patient knows *where* the
   trouble is long before they know what it is called - "the back of my eye" is
   a thing anyone can point at, "retina" is not.
 *
 * It is drawn rather than modelled. Depth here is gradients, specular
 * highlights and layered translucency, which cost nothing to ship, stay crisp
 * at every size, and leave the whole thing themeable and screen-reader safe. A
 * WebGL model would buy a little more realism for a library, a GPU cost on the
 * phones most patients use, and a canvas with no accessible structure at all.
 *
 * Hover previews, click chooses, and neither one navigates. They are separate
 * props on purpose: wiring hover to the commit handler is exactly how a stray
 * mouse movement once started re-filtering the page. */
export default function EyeDiagram({ activePart, onPreviewPart, onChoosePart }) {
  const region = (id) => ({
    className: "sv-eye__region",
    "data-on": activePart === id ? "true" : undefined,
    "data-dim": activePart && activePart !== id ? "true" : undefined,
    onMouseEnter: () => onPreviewPart?.(id),
    onClick: () => onChoosePart?.(id),
  });

  return (
    <svg
      className="sv-eye"
      viewBox="0 40 520 300"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Light falls from the upper left, and every shaded body below agrees
            with that one direction - which is what stops a set of gradients
            from reading as a set of unrelated blobs. */}
        <radialGradient id="sv-eye-sclera" cx="34%" cy="28%" r="82%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="52%" stopColor="#eef1f4" />
          <stop offset="86%" stopColor="#d9e0e6" />
          <stop offset="100%" stopColor="#c5ced6" />
        </radialGradient>

        <radialGradient id="sv-eye-vitreous" cx="42%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#eff6fa" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#cfdfe9" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#a9c2d2" stopOpacity="0.55" />
        </radialGradient>

        <linearGradient id="sv-eye-cornea" x1="100%" y1="20%" x2="0%" y2="80%">
          <stop offset="0%" stopColor="#dff3fa" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#a8dced" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#6fbdd6" stopOpacity="0.42" />
        </linearGradient>

        <radialGradient id="sv-eye-iris" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#3a8fb8" />
          <stop offset="55%" stopColor="#17567f" />
          <stop offset="100%" stopColor="#0a2b45" />
        </radialGradient>

        <linearGradient id="sv-eye-lens" x1="0%" y1="8%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="45%" stopColor="#c3e6f3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#7cbcd6" stopOpacity="0.72" />
        </linearGradient>

        {/* Across the stalk rather than along it, so the nerve reads as a
            cylinder catching the same light as everything else. */}
        <linearGradient id="sv-eye-nerve" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a6c96" />
          <stop offset="42%" stopColor="#123c61" />
          <stop offset="100%" stopColor="#08243c" />
        </linearGradient>

        <linearGradient id="sv-eye-retina" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0c2c49" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#123c61" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#0c2c49" stopOpacity="0.45" />
        </linearGradient>

        <linearGradient id="sv-eye-muscle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9aa7b1" />
          <stop offset="100%" stopColor="#c6cfd6" stopOpacity="0.35" />
        </linearGradient>

        <radialGradient id="sv-eye-ground" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0c2c49" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0c2c49" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* a soft contact shadow, so the globe sits on the page rather than
          floating on it */}
      <ellipse cx="278" cy="322" rx="150" ry="17" fill="url(#sv-eye-ground)" />

      <circle className="sv-eye__globe" cx="270" cy="190" r="125" fill="url(#sv-eye-sclera)" />
      <circle className="sv-eye__vitreous" cx="270" cy="190" r="112" fill="url(#sv-eye-vitreous)" />

      {/* the sheen across the top left of the globe */}
      <ellipse
        className="sv-eye__sheen"
        cx="216"
        cy="128"
        rx="62"
        ry="34"
        transform="rotate(-32 216 128)"
      />

      {/* focusing power - the light arriving and being bent */}
      <g {...region("power")}>
        <g className="sv-eye__rays">
          <path d="M14 150 L128 172" />
          <path d="M14 190 L128 190" />
          <path d="M14 230 L128 208" />
        </g>
        <circle className="sv-eye__hit" cx="62" cy="190" r="48" />
      </g>

      {/* eyelids */}
      <g {...region("lids")}>
        <path className="sv-eye__lid" d="M132 122 Q196 54 292 66" />
        <path className="sv-eye__lid" d="M132 258 Q196 326 292 314" />
        <circle className="sv-eye__hit" cx="208" cy="80" r="46" />
        <circle className="sv-eye__hit" cx="208" cy="300" r="46" />
      </g>

      {/* alignment - the muscles that aim the eye */}
      <g {...region("muscles")}>
        <path className="sv-eye__muscle" d="M300 70 Q392 84 462 118" />
        <path className="sv-eye__muscle" d="M300 310 Q392 296 462 262" />
        <circle className="sv-eye__hit" cx="398" cy="82" r="46" />
        <circle className="sv-eye__hit" cx="398" cy="298" r="46" />
      </g>

      {/* the retina, with the macula marked on it */}
      <g {...region("retina")}>
        <path className="sv-eye__retina" d="M286 68 Q392 92 392 190 Q392 288 286 312" />
        <circle className="sv-eye__macula" cx="391" cy="190" r="9" />
        <circle className="sv-eye__hit" cx="374" cy="126" r="46" />
        <circle className="sv-eye__hit" cx="374" cy="254" r="46" />
      </g>

      {/* the optic nerve */}
      <g {...region("nerve")}>
        <path className="sv-eye__nerve" d="M388 216 Q436 244 496 250" />
        <circle className="sv-eye__hit" cx="454" cy="242" r="46" />
      </g>

      {/* front window - the cornea, with its own glint */}
      <g {...region("front")}>
        <path className="sv-eye__cornea" d="M160 118 Q116 190 160 262" />
        <path className="sv-eye__glint" d="M150 142 Q132 172 136 200" />
        <path className="sv-eye__iris-arm" d="M162 122 L184 148" />
        <path className="sv-eye__iris-arm" d="M162 258 L184 232" />
        <circle className="sv-eye__hit" cx="128" cy="190" r="46" />
      </g>

      {/* the lens */}
      <g {...region("lens")}>
        <ellipse className="sv-eye__lens" cx="198" cy="190" rx="22" ry="47" />
        <path className="sv-eye__lens-glint" d="M189 160 Q182 190 189 220" />
        <circle className="sv-eye__hit" cx="198" cy="190" r="46" />
      </g>
    </svg>
  );
}
