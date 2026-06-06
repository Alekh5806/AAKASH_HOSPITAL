import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { revealVariants } from "../lib/motion";

const clarityWords = [
  "Aakash Eye",
  "clear vision",
  "trusted care",
  "advanced care",
  "LASIK",
  "cataract",
  "retina",
];

export default function VisionClarityFeature() {
  const shouldReduceMotion = useReducedMotion();
  const baseId = useId().replace(/:/g, "");
  const clipId = `${baseId}-lenses`;
  const outsideMaskId = `${baseId}-outside`;
  const rimId = `${baseId}-rim`;
  const lensId = `${baseId}-lens`;
  const glassGlowId = `${baseId}-glass-glow`;
  const softTextId = `${baseId}-soft-text`;
  const lensTextId = `${baseId}-lens-text`;
  const leftArmPath = "M130 174 C170 148 198 150 224 166";
  const rightArmPath = "M870 174 C830 148 802 150 776 166";
  const leftLensPath = "M205 165 C205 106 253 72 344 76 C438 80 494 122 484 185 C473 257 417 298 326 292 C244 287 205 231 205 165 Z";
  const rightLensPath = "M795 165 C795 106 747 72 656 76 C562 80 506 122 516 185 C527 257 583 298 674 292 C756 287 795 231 795 165 Z";
  const marqueeText = Array.from({ length: 6 }, () => clarityWords.join("     ")).join("     ");

  return (
    <section className="vision-clarity-section" aria-label="Aakash Eye Hospital clear vision animation">
      <div className="container vision-clarity">
        <motion.div
          className="vision-clarity__animation"
          variants={revealVariants(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.24 }}
          aria-hidden="true"
        >
          <div className="vision-clarity__stage">
            <svg
              className="vision-clarity__svg"
              viewBox="0 0 1000 360"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id={rimId} x1="170" x2="830" y1="80" y2="302">
                  <stop offset="0" stopColor="#112a6a" />
                  <stop offset="0.36" stopColor="#1556a6" />
                  <stop offset="0.62" stopColor="#0a8f95" />
                  <stop offset="1" stopColor="#112a6a" />
                </linearGradient>
                <linearGradient id={lensId} x1="210" x2="790" y1="82" y2="300">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.62" />
                  <stop offset="0.44" stopColor="#eefcff" stopOpacity="0.34" />
                  <stop offset="1" stopColor="#c8eef7" stopOpacity="0.2" />
                </linearGradient>
                <radialGradient id={glassGlowId} cx="34%" cy="24%" r="70%">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.72" />
                  <stop offset="0.42" stopColor="#ffffff" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={softTextId} x1="0" x2="1000" y1="176" y2="176">
                  <stop offset="0" stopColor="#0a8f95" stopOpacity="0.2" />
                  <stop offset="0.32" stopColor="#1b3a8b" stopOpacity="0.28" />
                  <stop offset="0.66" stopColor="#e5007d" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#0a8f95" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id={lensTextId} x1="190" x2="810" y1="176" y2="176">
                  <stop offset="0" stopColor="#0a8f95" />
                  <stop offset="0.38" stopColor="#112a6a" />
                  <stop offset="0.72" stopColor="#e5007d" />
                  <stop offset="1" stopColor="#1556a6" />
                </linearGradient>
                <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                  <path d={leftLensPath} />
                  <path d={rightLensPath} />
                </clipPath>
                <mask id={outsideMaskId} maskUnits="userSpaceOnUse">
                  <rect width="1000" height="360" fill="white" />
                  <path d={leftLensPath} fill="black" />
                  <path d={rightLensPath} fill="black" />
                  <path d={leftLensPath} fill="none" stroke="black" strokeLinejoin="round" strokeWidth="36" />
                  <path d={rightLensPath} fill="none" stroke="black" strokeLinejoin="round" strokeWidth="36" />
                  <path d={leftArmPath} fill="none" stroke="black" strokeLinecap="round" strokeWidth="34" />
                  <path d={rightArmPath} fill="none" stroke="black" strokeLinecap="round" strokeWidth="34" />
                  <path d="M0 116 C92 124 151 150 238 184 C152 212 82 225 0 218 Z" fill="black" />
                  <path d="M1000 116 C908 124 849 150 762 184 C848 212 918 225 1000 218 Z" fill="black" />
                  <path d="M488 176 C494 153 506 153 512 176" fill="none" stroke="black" strokeLinecap="round" strokeWidth="42" />
                  <path d="M208 166 L246 176" fill="none" stroke="black" strokeLinecap="round" strokeWidth="32" />
                  <path d="M792 166 L754 176" fill="none" stroke="black" strokeLinecap="round" strokeWidth="32" />
                </mask>
              </defs>

              <g className="vision-clarity__svg-track vision-clarity__svg-track--soft" mask={`url(#${outsideMaskId})`}>
                <text x="-180" y="197" fill={`url(#${softTextId})`}>{marqueeText}</text>
              </g>

              <g clipPath={`url(#${clipId})`}>
                <g className="vision-clarity__svg-track vision-clarity__svg-track--lens">
                  <text x="-180" y="197" fill={`url(#${lensTextId})`}>{marqueeText}</text>
                </g>
              </g>

              <g className="vision-clarity__svg-frame">
                <ellipse className="vision-clarity__svg-ground" cx="500" cy="304" rx="318" ry="25" />
                <path
                  className="vision-clarity__svg-arm"
                  d={leftArmPath}
                  stroke={`url(#${rimId})`}
                />
                <path
                  className="vision-clarity__svg-arm"
                  d={rightArmPath}
                  stroke={`url(#${rimId})`}
                />
                <path className="vision-clarity__svg-glass" d={leftLensPath} fill={`url(#${lensId})`} />
                <path className="vision-clarity__svg-glass" d={rightLensPath} fill={`url(#${lensId})`} />
                <path className="vision-clarity__svg-glow" d={leftLensPath} fill={`url(#${glassGlowId})`} />
                <path className="vision-clarity__svg-glow" d={rightLensPath} fill={`url(#${glassGlowId})`} />
                <path className="vision-clarity__svg-lens" d={leftLensPath} stroke={`url(#${rimId})`} />
                <path className="vision-clarity__svg-lens" d={rightLensPath} stroke={`url(#${rimId})`} />
                <path className="vision-clarity__svg-bridge" d="M488 176 C494 153 506 153 512 176" stroke={`url(#${rimId})`} />
                <path className="vision-clarity__svg-hinge" d="M208 166 L246 176" stroke={`url(#${rimId})`} />
                <path className="vision-clarity__svg-hinge" d="M792 166 L754 176" stroke={`url(#${rimId})`} />
                <ellipse className="vision-clarity__svg-nose-pad vision-clarity__svg-nose-pad--left" cx="474" cy="214" rx="12" ry="28" />
                <ellipse className="vision-clarity__svg-nose-pad vision-clarity__svg-nose-pad--right" cx="526" cy="214" rx="12" ry="28" />
                <circle className="vision-clarity__svg-screw" cx="242" cy="177" r="5" />
                <circle className="vision-clarity__svg-screw" cx="758" cy="177" r="5" />
                <path className="vision-clarity__svg-highlight" d="M282 122 C324 92 400 96 438 130" />
                <path className="vision-clarity__svg-highlight" d="M562 122 C604 92 680 96 718 130" />
                <path className="vision-clarity__svg-lens-shine" d="M250 208 C306 244 410 240 460 208" />
                <path className="vision-clarity__svg-lens-shine" d="M540 208 C596 244 700 240 750 208" />
              </g>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
