import { Fragment, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import SEO from "../components/SEO";
import { cleanTel } from "../lib/contact";
import { contactPage } from "../lib/contactData";
import { site } from "../lib/coreData";
import { useAfterIntro, useIntroDone } from "../lib/intro";
import { cascade, WRITE } from "../lib/motion";
import { describeTried, getWays, notFoundPage, suggestFor } from "../lib/notFoundData";
import { SNELLEN_BASELINES, SNELLEN_ROWS } from "../lib/snellen";
import "../styles/not-found.css";

const EASE = [0.22, 1, 0.36, 1];

const RISE = {
  hidden: { opacity: 0, y: 14 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const CHART = {
  hidden: { opacity: 0, y: 18 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

/* The chart's top line reads 4 0 4; every other line is the real chart. */
const ROWS = SNELLEN_ROWS.map((row, index) => (index === 0 ? { ...row, letters: "4 0 4" } : row));

/* The viewBox carries the board's margins, so one drawing serves the whole
   chart on a wide screen and its top three lines on a phone - the board's
   aspect ratio decides how much of it shows. */
function EyeChart() {
  return (
    <svg
      className="nf-chart__svg"
      viewBox="-16 -4 292 400"
      preserveAspectRatio="xMidYMin slice"
      focusable="false"
    >
      {ROWS.map((row, index) => (
        <g key={row.acuity}>
          <text
            className="nf-chart__row"
            x="118"
            y={SNELLEN_BASELINES[index]}
            fontSize={row.size}
            textAnchor="middle"
          >
            {row.letters}
          </text>
          <text
            className="nf-chart__acuity"
            x="248"
            y={SNELLEN_BASELINES[index] - row.size * 0.32}
            textAnchor="end"
          >
            {row.acuity}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* The not-found page: say plainly that the page is not here, guess what the
 * reader was after from the address they opened, and put the site's main ways
 * in - and the emergency line - one tap away.
 *
 * A host answers every unknown address with this page's prerendered copy, so
 * the address it reads is the reader's own; React builds it fresh there
 * (main.jsx adopts only a copy made for the path on screen), and the guesses
 * and the address are in its first render. Opened as /404 it knows neither,
 * which is also exactly what the build wrote.
 *
 * The eye chart is the page's one picture: its top line reads 4 0 4, and it
 * pulls into focus once as the page arrives - the services console's refraction
 * device. Under reduced motion it is simply sharp. */
export default function NotFoundPage() {
  const { pathname } = useLocation();
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const afterIntro = useAfterIntro();
  const initial = reduceMotion ? false : "hidden";
  const stage = introDone || reduceMotion ? "shown" : "hidden";
  const delay = afterIntro ? 0.3 : 0.05;

  const tried = describeTried(pathname);
  const matches = useMemo(() => suggestFor(pathname), [pathname]);
  const ways = useMemo(() => getWays(matches), [matches]);
  const { matches: matchCopy, ways: waysCopy } = notFoundPage;
  const emergency = site.header.emergency;
  const { directory } = contactPage;

  return (
    <>
      <SEO meta={notFoundPage.seo} />

      <section className="nf" aria-labelledby="nf-title">
        <motion.div
          className="e-shell nf-grid"
          initial={initial}
          animate={stage}
          variants={cascade(delay, 0.12)}
        >
          <motion.div className="nf-head" variants={cascade(0)}>
            <motion.span className="e-label nf-head__label" variants={RISE}>
              {notFoundPage.label}
            </motion.span>
            <motion.h1 className="nf-head__title" id="nf-title" variants={RISE}>
              {notFoundPage.title}{" "}
              <motion.em variants={cascade(0.35, 0.11)}>
                {notFoundPage.titleAccent.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    {index > 0 ? " " : null}
                    <motion.span className="nf-head__ink" variants={WRITE}>
                      {word}
                    </motion.span>
                  </Fragment>
                ))}
              </motion.em>
            </motion.h1>
            <motion.p className="nf-head__lede" variants={RISE}>
              {notFoundPage.lede}
            </motion.p>
            {tried ? (
              <motion.p className="nf-tried" variants={RISE}>
                <span className="nf-tried__label">{notFoundPage.triedLabel}</span>{" "}
                <span className="nf-tried__url">
                  <span className="nf-tried__host">{tried.host}</span>
                  {/* a long address breaks after a slash, not mid-word */}
                  <span className="nf-tried__path">
                    {tried.path.split("/").map((part, index) => (
                      <Fragment key={index}>
                        {index > 0 ? (
                          <>
                            /<wbr />
                          </>
                        ) : null}
                        {part}
                      </Fragment>
                    ))}
                  </span>
                </span>
              </motion.p>
            ) : null}
            <motion.div className="nf-acts" variants={RISE}>
              <Link className="e-btn nf-acts__book" to="/appointment">
                {notFoundPage.bookLabel}
              </Link>
              <Link className="e-btn e-btn--outline nf-acts__home" to="/">
                <span className="nf-long">{notFoundPage.homeLabel}</span>
                <span className="nf-short">{notFoundPage.homeShortLabel}</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="nf-chart"
            variants={CHART}
            data-in={stage === "shown" && !reduceMotion ? "" : undefined}
            aria-hidden="true"
          >
            <div className="nf-chart__board">
              <EyeChart />
            </div>
          </motion.div>

          <div className="nf-body">
            {matches.length ? (
              <motion.div className="nf-block" variants={cascade(0, 0.07)}>
                <motion.h2 className="nf-block__title" variants={RISE}>
                  {matches.length > 1 ? matchCopy.titleMany : matchCopy.title}
                </motion.h2>
                <ul className="nf-matches">
                  {matches.map((match) => (
                    <motion.li key={match.href} variants={RISE}>
                      <Link className="nf-match" to={match.href}>
                        <span className="nf-match__kind">{matchCopy.kinds[match.kind]}</span>
                        <span className="nf-match__title">{match.title}</span>
                        <span className="nf-match__detail">{match.detail}</span>
                        <span className="nf-match__go" aria-hidden="true">
                          <ArrowRight size={18} />
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ) : null}

            {ways.length ? (
              <motion.div className="nf-block" variants={cascade(0, 0.06)}>
                <motion.h2 className="nf-block__title" variants={RISE}>
                  {matches.length ? waysCopy.titleAfterMatches : waysCopy.title}
                </motion.h2>
                <ul className="nf-ways">
                  {ways.map((way) => (
                    <motion.li key={way.href} variants={RISE}>
                      <Link className="nf-way" to={way.href}>
                        <span className="nf-way__title">{way.title}</span>
                        <span className="nf-way__detail">{way.detail}</span>
                        <ArrowRight className="nf-way__go" size={18} aria-hidden="true" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ) : null}

            <motion.a
              className="nf-urgent"
              href={`tel:${cleanTel(emergency.phone)}`}
              variants={RISE}
            >
              <span className="nf-urgent__mark" aria-hidden="true">
                <TriangleAlert size={20} />
              </span>
              <span className="nf-urgent__label">{directory.emergencyLabel}</span>
              <span className="nf-urgent__number">{emergency.phone}</span>
              <span className="nf-urgent__note">{directory.emergencyNote}</span>
            </motion.a>
          </div>
        </motion.div>
      </section>
    </>
  );
}
