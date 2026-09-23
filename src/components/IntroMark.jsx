import { site } from "../lib/coreData";
import { splitTagline } from "../lib/brand";

const STROMA_COUNT = 48;

/* The opening curtain's composition - the iris, the wordmark and one serif
   line - shared by the curtain and the initial route wait so a reload never
   shows a different frame from the one the reader has already met. The
   services page's IrisMark vocabulary, redrawn here without framer so the
   root bundle does not pay for it. */
export default function IntroMark() {
  const [taglineLead, taglineSince] = splitTagline(site.brand.tagline);

  return (
    <>
      <div className="pl__stage">
        <svg className="pl__iris" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="pl-iris-core" cx="50%" cy="46%" r="52%">
              <stop offset="0%" stopColor="#1b5f86" />
              <stop offset="58%" stopColor="#123c61" />
              <stop offset="100%" stopColor="#0c2c49" />
            </radialGradient>
            <radialGradient id="pl-iris-glow" cx="38%" cy="34%" r="46%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="pl__field">
            <circle className="pl__ring pl__ring--a" cx="200" cy="200" r="192" />
            <circle className="pl__ring pl__ring--b" cx="200" cy="200" r="158" />
            <circle className="pl__ring pl__ring--c" cx="200" cy="200" r="126" />
          </g>

          <circle className="pl__body" cx="200" cy="200" r="104" fill="url(#pl-iris-core)" />

          <g className="pl__stroma">
            {Array.from({ length: STROMA_COUNT }, (_, index) => {
              const angle = (index / STROMA_COUNT) * Math.PI * 2;
              const inner = 46;
              const outer = index % 4 === 0 ? 100 : 88;
              return (
                <line
                  key={index}
                  style={{ "--pl-i": index }}
                  x1={200 + Math.cos(angle) * inner}
                  y1={200 + Math.sin(angle) * inner}
                  x2={200 + Math.cos(angle) * outer}
                  y2={200 + Math.sin(angle) * outer}
                />
              );
            })}
          </g>

          <circle className="pl__limbus" cx="200" cy="200" r="104" pathLength="1" />
          <circle className="pl__glow" cx="200" cy="200" r="104" fill="url(#pl-iris-glow)" />
          <circle className="pl__pupil" cx="200" cy="200" r="12" />
          <circle className="pl__spark" cx="170" cy="168" r="10" />
        </svg>
      </div>

      <div className="pl__copy">
        <img className="pl__logo" src={site.brand.logo} alt="" width="207" height="50" />
        <p className="pl__line">
          {taglineLead}
          {taglineSince ? <em> {taglineSince}</em> : null}
        </p>
      </div>
    </>
  );
}
