import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "../components/CountUp";
import { buildBranchHref, getPrimaryBranch } from "../lib/contact";
import { getInitials } from "../lib/doctorsData";
import { SCROLL_DRIVEN, cardEntrance, useInViewReplay } from "../lib/motion";

const EASE = [0.32, 0.72, 0, 1];

/* Where the four cards become the phone's proof card - a phone, or a phone
   held sideways. Must match the card's media query in landing.css. Decided
   in JS because the card is different markup, not a restyle: one
   photograph and one band of figures in place of four cards of charts. */
const PHONE_QUERY = "(max-width: 620px), (max-width: 1023px) and (max-height: 520px)";

function subscribeToPhone(callback) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function MixVisual({ mix, active, reduced }) {
  return (
    <ul className="e-impact__mix">
      {mix.map((row, index) => (
        <li key={row.name}>
          <span className="e-impact__mixName">{row.name}</span>
          <span className="e-impact__track">
            <motion.span
              className="e-impact__fill"
              initial={{ width: reduced ? `${row.share}%` : "0%" }}
              animate={{ width: active || reduced ? `${row.share}%` : "0%" }}
              transition={{
                duration: reduced ? 0 : 0.9,
                delay: reduced ? 0 : 0.15 + index * 0.12,
                ease: EASE,
              }}
            />
          </span>
          <span className="e-impact__mixShare">{row.share}%</span>
        </li>
      ))}
    </ul>
  );
}

/* The drawing scales on both axes to whatever box the plot is given
   (preserveAspectRatio none, strokes that do not scale with it), so the end
   dot is HTML to stay round, and the line is revealed by a wipe rather than a
   pathLength draw, which does not survive a non-scaling stroke. */
function TrendVisual({ trend, active, reduced }) {
  const width = 240;
  const height = 74;
  const inset = 5;
  const span = width - inset * 2;
  const step = span / (trend.points.length - 1);
  const coords = trend.points.map((point, index) => [
    inset + index * step,
    height - (point / 100) * (height - 12) - 6,
  ]);
  const line = coords.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `${line} L${width - inset} ${height} L${inset} ${height} Z`;
  const [lastX, lastY] = coords[coords.length - 1];
  const shown = active || reduced;
  const drawn = "inset(0% 0% 0% 0%)";
  const hidden = "inset(0% 100% 0% 0%)";

  return (
    <div className="e-impact__trend">
      <p className="e-impact__caption">{trend.caption}</p>
      <div className="e-impact__plot" role="img" aria-label={trend.caption}>
        <motion.svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          initial={{ clipPath: reduced ? drawn : hidden }}
          animate={{ clipPath: shown ? drawn : hidden }}
          transition={{ duration: reduced ? 0 : 1.2, delay: reduced ? 0 : 0.2, ease: EASE }}
        >
          <path d={area} className="e-impact__area" />
          <path d={line} className="e-impact__line" />
        </motion.svg>
        <motion.span
          className="e-impact__dot"
          style={{ left: `${(lastX / width) * 100}%`, top: `${(lastY / height) * 100}%` }}
          initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.4 }}
          animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : 0.4 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 1.2, ease: EASE }}
        />
      </div>
      <div className="e-impact__axis">
        <span>{trend.startLabel}</span>
        <span>{trend.endLabel}</span>
      </div>
    </div>
  );
}

function PeopleVisual({ people, extra, active, reduced }) {
  const shown = active || reduced;

  return (
    <ul className="e-impact__people">
      {people.map((person, index) => (
        <motion.li
          key={person.name}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
          animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 12 }}
          transition={{
            duration: reduced ? 0 : 0.55,
            delay: reduced ? 0 : 0.15 + index * 0.13,
            ease: EASE,
          }}
        >
          <span className="e-impact__avatar" aria-hidden="true">
            {getInitials(person.name)}
          </span>
          <span className="e-impact__personBody">
            <strong>{person.name}</strong>
            <em>{person.specialty}</em>
          </span>
        </motion.li>
      ))}
      {extra > 0 ? <li className="e-impact__more">+{extra} more across our branches</li> : null}
    </ul>
  );
}

function BranchVisual({ branches, active, reduced }) {
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    if (!active || reduced || branches.length < 2) return undefined;
    const timer = setInterval(() => {
      setHighlighted((current) => (current + 1) % branches.length);
    }, 1900);
    return () => clearInterval(timer);
  }, [active, reduced, branches.length]);

  return (
    <ul className="e-impact__branches">
      {branches.map((branch, index) => (
        <li key={branch.slug}>
          <Link
            className="e-impact__chip"
            data-active={index === highlighted ? "true" : "false"}
            to={buildBranchHref(branch)}
          >
            <MapPin size={13} aria-hidden="true" />
            {branch.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* The card - not the number - owns the in-view trigger. Watching the small
   figure instead meant a card could start counting while only its top edge
   had crept over the fold on a phone, so the count was finished before the
   card was actually readable. The count and the visual play again every time
   the reader comes back to the card: each return is a new `round`, and the
   two are keyed on it so they start again from zero, off screen. */
function StatCard({ card, index, renderVisual, reduced }) {
  const cardRef = useRef(null);
  const { inView, round } = useInViewReplay(cardRef, 0.45);
  const arrival = useInViewReplay(cardRef, 0.2);
  const active = inView || reduced;
  /* Where the scroll drives the card's arrival (landing.css), framer's
     entrance stands down so the two never move the card at once. */
  const entrance =
    reduced || SCROLL_DRIVEN
      ? {}
      : cardEntrance(arrival.inView, {
          index,
          distance: 26,
          duration: 0.7,
          stagger: 0.09,
          ease: EASE,
        });

  return (
    <motion.li className="e-impact__card" data-visual={card.visual} ref={cardRef} {...entrance}>
      <span className="e-impact__kicker">{card.kicker}</span>
      <p className="e-impact__figure">
        <CountUp key={round} value={card.value} suffix={card.suffix} start={active} />
      </p>
      <h3 className="e-impact__label">{card.label}</h3>
      <p className="e-impact__desc">{card.description}</p>
      <div className="e-impact__visual" key={round}>
        {renderVisual(card, active)}
      </div>
    </motion.li>
  );
}

/* The phone's numbers band: one card, the hospital where the figures began
 * over the figures themselves.
 *
 * The head office's own photograph (its hospital page's, read from
 * branches.json) dissolves into a navy band, and the four figures sit on
 * that band in the hero's own figure style - cream serif, labels at 0.78
 * white, ruled two by two - so the band reads as the hero's figures row
 * carried onto a real building rather than as a second design. It is the
 * hero film's composition at card size, which is what makes it belong to
 * the page it follows.
 *
 * It replaced two phone builds that each read as a dashboard: a console of
 * four tiles over a tabbed chart panel, then a ledger of 58px figures over
 * gradient bar charts. The charts are a laptop's: on a phone the figures say
 * enough, and they say it at the hero's size rather than a headline's. */
function ProofCard({ cards, photo, tag, reduced }) {
  const cardRef = useRef(null);
  const bandRef = useRef(null);
  const arrival = useInViewReplay(cardRef, 0.2);
  const { inView, round } = useInViewReplay(bandRef, 0.6);
  const active = inView || reduced;
  const entrance =
    reduced || SCROLL_DRIVEN
      ? {}
      : cardEntrance(arrival.inView, { distance: 26, duration: 0.7, stagger: 0, ease: EASE });

  return (
    <motion.div className="e-impact__proof" ref={cardRef} {...entrance}>
      {photo ? (
        <div className="e-impact__photo">
          <img
            src={photo.src}
            alt={photo.alt}
            width="1000"
            height="750"
            loading="lazy"
            decoding="async"
          />
          {tag ? (
            <span className="e-impact__tag">
              <MapPin size={14} aria-hidden="true" />
              {tag}
            </span>
          ) : null}
        </div>
      ) : null}
      <dl className="e-impact__band" ref={bandRef}>
        {cards.map((card) => (
          <div className="e-impact__fact" key={card.id}>
            <dt>
              <CountUp key={round} value={card.value} suffix={card.suffix} start={active} />
            </dt>
            <dd>{card.label}</dd>
          </div>
        ))}
      </dl>
    </motion.div>
  );
}

export default function ImpactStats({ impact, counts, branches, doctors }) {
  const shouldReduceMotion = useReducedMotion();
  const phone = useSyncExternalStore(
    subscribeToPhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
  const cards = impact.cards.map((card) =>
    card.count ? { ...card, value: counts[card.count] } : card,
  );
  /* The phone card's photograph is the head office's own, from its hospital
     page, and the tag says which building it is and since when - or only
     which, for a head office with no confirmed year. */
  const headOffice = getPrimaryBranch(branches);
  const headPage = headOffice?.page;
  const photo = headPage?.image
    ? { src: headPage.imageSmall ?? headPage.image, alt: headPage.imageAlt ?? "" }
    : null;
  const photoTag = headOffice
    ? (headPage?.establishedYear ? impact.photoTag : impact.photoTagNoYear)
        .replace("{city}", headOffice.name)
        .replace("{year}", headPage?.establishedYear)
    : "";
  const visuals = {
    mix: (card, active) => (
      <MixVisual mix={card.mix} active={active} reduced={shouldReduceMotion} />
    ),
    trend: (card, active) => (
      <TrendVisual trend={card.trend} active={active} reduced={shouldReduceMotion} />
    ),
    people: (card, active) => (
      <PeopleVisual
        people={doctors.slice(0, 3)}
        extra={Math.max(doctors.length - 3, 0)}
        active={active}
        reduced={shouldReduceMotion}
      />
    ),
    branches: (card, active) => (
      <BranchVisual branches={branches} active={active} reduced={shouldReduceMotion} />
    ),
  };
  const renderVisual = (card, active) => visuals[card.visual]?.(card, active);

  return (
    <section className="e-sec e-sec--paper e-impact" aria-labelledby="e-impact-title">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{impact.eyebrow}</span>
          <div className="e-head__body">
            <h2 className="e-h2 e-impact__title" id="e-impact-title">
              <span className="e-impact__gu" lang="gu">
                {impact.titleGujarati}
              </span>{" "}
              <span className="e-impact__tagline">
                {impact.tagline}{" "}
                <span className="e-impact__taglineAccent">{impact.taglineAccent}</span>
              </span>
            </h2>
          </div>
        </div>

        {phone ? (
          <ProofCard cards={cards} photo={photo} tag={photoTag} reduced={shouldReduceMotion} />
        ) : (
          <ul className="e-impact__grid">
            {cards.map((card, index) => (
              <StatCard
                key={card.id}
                card={card}
                index={index}
                renderVisual={renderVisual}
                reduced={shouldReduceMotion}
              />
            ))}
          </ul>
        )}

        {/* On a phone the band's one way on is to the hospitals: the hero's
            booking button is a screen above and the header carries its own,
            and the services index under this band answers "how we treat". */}
        {phone ? (
          <p className="e-impact__nearest">
            <Link className="e-link" to="/branches">
              {impact.nearestLabel}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </p>
        ) : (
          <div className="e-impact__actions">
            <Link className="e-btn" to={impact.actions.primary.href}>
              {impact.actions.primary.label}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="e-btn e-btn--outline" to={impact.actions.secondary.href}>
              {impact.actions.secondary.label}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
