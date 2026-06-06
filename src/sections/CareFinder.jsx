import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarDays,
  MapPinned,
  Search,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import ButtonLink from "../components/ButtonLink";
import { branches } from "../lib/coreData";
import { doctors } from "../lib/doctorsData";
import { services } from "../lib/servicesData";
import { revealVariants, staggerContainer } from "../lib/motion";

const quickSearches = ["Cataract", "LASIK", "Retina", "Glaucoma"];

function normalizeSearch(value = "") {
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactSearch(value = "") {
  return normalizeSearch(value).replace(/\s+/g, "");
}

function uniqueTerms(terms) {
  return [...new Set(terms.filter(Boolean).map(normalizeSearch).filter(Boolean))];
}

function serviceKeywords(service) {
  return [
    service.title,
    service.shortDescription,
    ...service.featureBullets,
    ...service.longDescription,
  ].join(" ");
}

function scoreResult(item, query) {
  if (!query) return item.defaultRank ?? 0;

  const normalized = normalizeSearch(query);
  const compact = compactSearch(query);
  const tokens = normalized.split(" ").filter(Boolean);
  const haystack = normalizeSearch(
    `${item.type} ${item.title} ${item.description} ${item.keywords} ${item.aliases.join(" ")}`,
  );
  const compactHaystack = compactSearch(haystack);
  let score = 0;

  if (item.aliases.some((alias) => normalizeSearch(alias) === normalized)) score += 180;
  if (normalizeSearch(item.title) === normalized) score += 160;
  if (haystack.includes(normalized)) score += 90;
  if (compact.length > 1 && compactHaystack.includes(compact)) score += 60;

  tokens.forEach((token) => {
    if (item.type.toLowerCase() === token) score += 80;
    if (normalizeSearch(item.title).split(" ").includes(token)) score += 34;
    if (haystack.split(" ").includes(token)) score += 22;
    if (compactHaystack.includes(token)) score += 8;
  });

  return score;
}

export default function CareFinder() {
  const [query, setQuery] = useState("");
  const shouldReduceMotion = useReducedMotion();
  const normalizedQuery = normalizeSearch(query);

  const results = useMemo(() => {
    const items = [
      ...services.items.map((service, index) => ({
        type: "Service",
        title: service.title,
        description: service.shortDescription,
        href: `/services/${service.slug}`,
        icon: Activity,
        keywords: serviceKeywords(service),
        aliases: uniqueTerms([
          "service",
          "services",
          "treatment",
          "treatments",
          "surgery",
          service.title,
          service.slug,
          service.id,
          ...(service.featureBullets ?? []),
        ]),
        defaultRank: 100 - index,
      })),
      ...doctors.items.map((doctor, index) => ({
        type: "Doctor",
        title: doctor.name,
        description: `${doctor.qualifications} | ${doctor.specialty} | ${doctor.branches.join(", ")}`,
        href: "/doctors",
        icon: UserRound,
        keywords: `${doctor.name} ${doctor.qualifications} ${doctor.specialty} ${doctor.bio} ${doctor.branches.join(" ")}`,
        aliases: uniqueTerms([
          "doctor",
          "doctors",
          "dr",
          "specialist",
          "specialists",
          "surgeon",
          "ophthalmologist",
          "ophthalmology",
          "eye doctor",
          "eye specialist",
          doctor.name.replace(/^Dr\.?\s+/i, ""),
          doctor.name,
          doctor.specialty,
          ...doctor.branches,
        ]),
        defaultRank: 60 - index,
      })),
      ...branches.items.map((branch, index) => ({
        type: "Branch",
        title: `${branch.name} Branch`,
        description: branch.address,
        href: "/branches",
        icon: Building2,
        keywords: `${branch.name} ${branch.address} ${branch.phoneGroups
          .flatMap((group) => group.numbers)
          .join(" ")} ${branch.phoneGroups.map((group) => group.label).join(" ")}`,
        aliases: uniqueTerms([
          "branch",
          "branches",
          "location",
          "locations",
          "clinic",
          "hospital",
          "address",
          "contact",
          "phone",
          "opd",
          branch.name,
          branch.slug,
          branch.isHeadquarters ? "headquarters" : "",
        ]),
        defaultRank: 40 - index,
      })),
    ];

    if (!normalizedQuery) {
      return items.filter((item) => item.type === "Service").slice(0, 4);
    }

    return items
      .map((item) => ({ ...item, score: scoreResult(item, normalizedQuery) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || (b.defaultRank ?? 0) - (a.defaultRank ?? 0))
      .slice(0, 4);
  }, [normalizedQuery]);

  return (
    <section className="section care-finder-section">
      <div className="container care-finder">
        <motion.div
          className="care-finder__intro"
          variants={revealVariants(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <span className="eyebrow">Find care faster</span>
          <h2>Find the right eye care in seconds</h2>
          <p>
            Search by concern, treatment, doctor or city and jump straight to the right care
            pathway.
          </p>
          <div className="care-finder__visual" aria-hidden="true">
            <span />
            <span />
            <span />
            <strong>Care Match</strong>
          </div>
          <div className="care-finder__chips" aria-label="Popular searches">
            {quickSearches.map((item) => (
              <button
                type="button"
                key={item}
                aria-pressed={normalizedQuery === item.toLowerCase()}
                onClick={() => setQuery(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="care-finder__panel"
          variants={revealVariants(shouldReduceMotion, 18)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="care-finder__panel-head">
            <span>
              <Sparkles size={16} aria-hidden="true" />
              Smart Search
            </span>
            <strong>{results.length ? `${results.length} matches` : "No match"}</strong>
          </div>

          <div>
            <label className="care-search">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">Search care</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cataract, LASIK, glaucoma, doctor, branch..."
              />
              {query ? (
                <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
                  <X size={16} aria-hidden="true" />
                </button>
              ) : null}
            </label>
            <p className="care-search__hint">
              Search services, doctors, branches, symptoms, or common treatments.
            </p>
          </div>

          <motion.div
            className="care-results"
            variants={staggerContainer(shouldReduceMotion)}
            initial="hidden"
            animate="visible"
          >
            {results.length ? (
              results.map((result) => {
                const Icon = result.icon;
                const typeClass = result.type.toLowerCase();

                return (
                  <motion.article
                    key={`${result.type}-${result.title}`}
                    className={`care-result-card care-result-card--${typeClass}`}
                    variants={revealVariants(shouldReduceMotion, 12)}
                  >
                    <Link to={result.href}>
                      <span className="care-result-card__top">
                        <span className="care-results__icon">
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <small>{result.type}</small>
                      </span>
                      <strong>{result.title}</strong>
                      <em>{result.description}</em>
                      <span className="care-result-card__arrow">
                        <ArrowUpRight size={17} aria-hidden="true" />
                        <span>Open page</span>
                      </span>
                    </Link>
                  </motion.article>
                );
              })
            ) : (
              <motion.article
                className="care-empty"
                variants={revealVariants(shouldReduceMotion, 12)}
              >
                <strong>No direct match found</strong>
                <span>Try cataract, LASIK, retina, glaucoma or branch name.</span>
              </motion.article>
            )}
          </motion.div>

          <div className="care-finder__actions">
            <ButtonLink to="/appointment" icon={CalendarDays}>
              Book Appointment
            </ButtonLink>
            <ButtonLink to="/branches" variant="secondary" icon={MapPinned}>
              View Branches
            </ButtonLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
