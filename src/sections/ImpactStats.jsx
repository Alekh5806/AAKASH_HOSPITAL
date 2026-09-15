import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import CountUp from "../components/CountUp";
import { buildBranchHref } from "../lib/contact";

const EASE = [0.32, 0.72, 0, 1];

function initialsOf(name) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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

  return (
    <div className="e-impact__trend">
      <p className="e-impact__caption">{trend.caption}</p>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={trend.caption}>
        <motion.path
          d={area}
          className="e-impact__area"
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={{ opacity: shown ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.8, delay: reduced ? 0 : 0.5, ease: EASE }}
        />
        <motion.path
          d={line}
          className="e-impact__line"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: shown ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 1.2, delay: reduced ? 0 : 0.2, ease: EASE }}
        />
        <motion.circle
          cx={lastX}
          cy={lastY}
          r="4"
          className="e-impact__dot"
          initial={{ opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.4 }}
          animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : 0.4 }}
          transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 1.1, ease: EASE }}
        />
      </svg>
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
            {initialsOf(person.name)}
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
   card was actually readable. */
function StatCard({ card, index, renderVisual, reduced }) {
  const cardRef = useRef(null);
  const inView = useInView(cardRef, { once: true, amount: 0.45 });
  const active = inView || reduced;

  return (
    <motion.li
      className="e-impact__card"
      data-visual={card.visual}
      ref={cardRef}
      initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : index * 0.09, ease: EASE }}
    >
      <span className="e-impact__kicker">{card.kicker}</span>
      <p className="e-impact__figure">
        <CountUp value={card.value} suffix={card.suffix} start={active} />
      </p>
      <h3 className="e-impact__label">{card.label}</h3>
      <p className="e-impact__desc">{card.description}</p>
      <div className="e-impact__visual">{renderVisual(card, active)}</div>
    </motion.li>
  );
}

export default function ImpactStats({ impact, branches, doctors }) {
  const shouldReduceMotion = useReducedMotion();

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

  return (
    <section className="e-sec e-sec--paper e-impact" aria-labelledby="e-impact-title">
      <div className="e-shell">
        <div className="e-head">
          <span className="e-label">{impact.eyebrow}</span>
          <div className="e-head__body">
            <h2 className="e-h2 e-impact__title" id="e-impact-title">
              <span className="e-impact__gu" lang="gu">
                {impact.titleGujarati}
              </span>
              <span className="e-impact__tagline">
                {impact.tagline} <span className="e-impact__taglineAccent">{impact.taglineAccent}</span>
              </span>
            </h2>
          </div>
        </div>

        <ul className="e-impact__grid">
          {impact.cards.map((card, index) => (
            <StatCard
              key={card.id}
              card={card}
              index={index}
              renderVisual={(current, active) => visuals[current.visual]?.(current, active)}
              reduced={shouldReduceMotion}
            />
          ))}
        </ul>

        <div className="e-impact__actions">
          <Link className="e-btn" to={impact.actions.primary.href}>
            {impact.actions.primary.label}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link className="e-btn e-btn--outline" to={impact.actions.secondary.href}>
            {impact.actions.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
