import { Fragment, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import BranchActions from "../components/BranchActions";
import { site } from "../lib/coreData";
import { branchPage } from "../lib/branchData";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import { fillTemplate } from "../lib/servicesData";

const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/* The frame lifts in behind the head and its chips follow it one by one. Both
   take their delay from the head's start, so the order holds whether the page
   waited for the opening curtain or not. */
const FRAME = {
  hidden: { opacity: 0, y: 26 },
  shown: (delay) => ({ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE, delay } }),
};

const CHIP = {
  hidden: { opacity: 0, y: 14 },
  shown: (delay) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE, delay } }),
};

/* The opening of a hospital's page, in the same shape as a service page's:
 * an editorial head on warm paper, then one wide media card carrying the
 * hospital's own photograph with a rail of glass facts along its foot.
 *
 * The headline is the network's name with the city in italic accent - that is
 * how the hospital is spoken of ("Aakash, Visnagar"), and it is the one word
 * on the page that changes from hospital to hospital, so it is the word that
 * writes itself in. The two glass tags are derived: head office or branch, and
 * the founding year. The four facts are the hospital's own `facts`, and they
 * are the only list on the page that says what this building offers.
 *
 * It arrives in reading order - the way back, the headline, the sentence, the
 * actions - then the frame lifts in, its chips follow and the photograph
 * settles. On a first visit all of it waits for the opening curtain, the
 * service hero's rule, so none of it is spent unseen. */
export default function BranchHero({ branch, actionsRef }) {
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const chipsRef = useRef(null);
  const { page } = branch;

  const initial = reduceMotion ? false : "hidden";
  const state = introDone || reduceMotion ? "shown" : "hidden";
  /* After the curtain the aperture has to clear the head before it rises. */
  const delay = afterIntro ? 0.3 : 0.05;

  /* Below 901px the chips are a rail, and its ends fade only where there is
     something past them - a chip cut at the frame's edge with nothing to say
     the rail continues reads as a defect. Written straight to the DOM: it is a
     measurement of the scroller, not something the render depends on. */
  useEffect(() => {
    const rail = chipsRef.current;
    const wrap = rail?.parentElement;
    if (!rail || !wrap) return undefined;
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      wrap.dataset.start = rail.scrollLeft > 4 ? "true" : "false";
      wrap.dataset.end = max > 4 && rail.scrollLeft < max - 4 ? "true" : "false";
    };
    sync();
    document.fonts?.ready.then(sync).catch(() => {});
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <section className="br-hero">
      <motion.div
        className="e-shell"
        initial={initial}
        animate={state}
        variants={cascade(delay, 0.09)}
      >
        <motion.div variants={RISE}>
          <Link className="br-hero__back" to="/branches">
            <ArrowLeft size={15} aria-hidden="true" />
            {branchPage.backLabel}
          </Link>
        </motion.div>

        <motion.div className="br-hero__head" variants={cascade(0, 0.09)}>
          <motion.h1 className="br-hero__title" variants={RISE}>
            {site.brand.name}{" "}
            <motion.em variants={cascade(0.4, 0.11)}>
              {branch.name.split(" ").map((word, index) => (
                <Fragment key={index}>
                  {index > 0 ? " " : null}
                  <motion.span className="br-hero__ink" variants={WRITE}>
                    {word}
                  </motion.span>
                </Fragment>
              ))}
            </motion.em>
          </motion.h1>

          {/* Two sentences on paper is the right opening on a laptop and four
              lines of preamble before the first action on a phone, so the phone
              gets the hospital's own shorter line. Authored, never truncated -
              the cookie sheet's bodyShort device. */}
          <motion.p className="br-hero__lede" variants={RISE}>
            <span className="br-full">{page.lede}</span>
            <span className="br-short">{page.ledeShort ?? page.lede}</span>
          </motion.p>

          <motion.div className="br-hero__actions" variants={RISE}>
            <BranchActions branch={branch} ref={actionsRef} />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        className="e-shell br-frame"
        data-in={state === "shown" ? "true" : undefined}
        initial={initial}
        animate={state}
        variants={FRAME}
        custom={delay + 0.34}
      >
        <div className="br-frame__media">
          {/* The phone frame is nearly square and the desktop one a letterbox,
              so the phone gets the 1000px encode rather than the 2000px one. */}
          <picture>
            <source media="(max-width: 900px)" srcSet={page.imageSmall} />
            <img
              className="br-frame__img"
              src={page.image}
              alt={page.imageAlt}
              loading="eager"
              decoding="sync"
              fetchPriority="high"
              sizes="(min-width: 1280px) 1240px, 100vw"
            />
          </picture>
          <span className="br-frame__scrim" aria-hidden="true" />
        </div>

        <div className="br-frame__tags">
          <span>
            <i aria-hidden="true" />
            {branch.isHeadquarters ? branchPage.headOfficeTag : branchPage.branchTag}
          </span>
          {page.establishedYear ? (
            <span>{fillTemplate(branchPage.sinceTag, { year: page.establishedYear })}</span>
          ) : null}
        </div>

        <div className="br-frame__foot">
          <span className="br-frame__label">{branchPage.factsLabel}</span>

          {/* The wrapper carries the rail's end fades, which cannot live on the
              scroller itself - they would scroll away with its content. */}
          <div className="br-chips__wrap">
            <ul className="br-chips" ref={chipsRef}>
              {page.facts.map((fact, position) => (
                <motion.li
                  className="br-chip"
                  key={fact}
                  initial={initial}
                  animate={state}
                  variants={CHIP}
                  custom={delay + 0.62 + position * 0.09}
                >
                  <span className="br-chip__tick" aria-hidden="true">
                    <Check size={12} />
                  </span>
                  <p>{fact}</p>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
