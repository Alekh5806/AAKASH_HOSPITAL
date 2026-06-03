import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowUpRight, Building2, CalendarDays, MapPinned, Search, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import ButtonLink from "../components/ButtonLink";
import { branches, doctors, services } from "../lib/data";
import { revealVariants, staggerContainer } from "../lib/motion";

const quickSearches = ["Cataract", "LASIK", "Retina", "Glaucoma"];

function serviceKeywords(service) {
  return [
    service.title,
    service.shortDescription,
    ...service.featureBullets,
    ...service.longDescription,
  ].join(" ");
}

export default function CareFinder() {
  const [query, setQuery] = useState("");
  const shouldReduceMotion = useReducedMotion();
  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    const items = [
      ...services.items.map((service) => ({
        type: "Service",
        title: service.title,
        description: service.shortDescription,
        href: `/services/${service.slug}`,
        icon: Activity,
        keywords: serviceKeywords(service),
      })),
      ...doctors.items.map((doctor) => ({
        type: "Doctor",
        title: doctor.name,
        description: `${doctor.qualifications} | ${doctor.specialty} | ${doctor.branches.join(", ")}`,
        href: "/doctors",
        icon: UserRound,
        keywords: `${doctor.name} ${doctor.qualifications} ${doctor.specialty} ${doctor.branches.join(" ")}`,
      })),
      ...branches.items.map((branch) => ({
        type: "Branch",
        title: `${branch.name} Branch`,
        description: branch.address,
        href: "/branches",
        icon: Building2,
        keywords: `${branch.name} ${branch.address} ${branch.phoneGroups
          .flatMap((group) => group.numbers)
          .join(" ")}`,
      })),
    ];

    if (!normalizedQuery) {
      return items.filter((item) => item.type === "Service").slice(0, 4);
    }

    return items
      .filter((item) => `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(normalizedQuery))
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
            Search by concern, treatment, doctor or city and jump straight to the right care pathway.
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
              Smart search
            </span>
            <strong>{results.length ? `${results.length} matches` : "No match"}</strong>
          </div>

          <label className="care-search">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">Search care</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cataract, LASIK, glaucoma, doctor, branch..."
            />
          </label>

          <motion.div
            className="care-results"
            variants={staggerContainer(shouldReduceMotion)}
            initial="hidden"
            animate="visible"
          >
            {results.length ? results.map((result) => {
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
                    </span>
                  </Link>
                </motion.article>
              );
            }) : (
              <motion.article className="care-empty" variants={revealVariants(shouldReduceMotion, 12)}>
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
