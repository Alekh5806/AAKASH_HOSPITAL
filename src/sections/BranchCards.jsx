import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { revealVariants, staggerContainer } from "../lib/motion";

function cleanTel(number) {
  return number.startsWith("+") ? number.replace(/[^\d+]/g, "") : number.replace(/\D/g, "");
}

function getPrimaryPhone(branch) {
  return (
    branch.phoneGroups.find((group) => group.label.toLowerCase().includes("opd"))?.numbers[0] ??
    branch.phoneGroups[0]?.numbers[0] ??
    ""
  );
}

function buildWhatsAppLink(branch) {
  const text = `Hello Aakash Eye Hospital, I would like to book an appointment at ${branch.name}.`;
  return `https://wa.me/${branch.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function buildMapLink(branch) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Aakash Eye Hospital ${branch.name}`,
  )}`;
}

export default function BranchCards({ branches, showMaps = false }) {
  const shouldReduceMotion = useReducedMotion();
  const [selectedSlug, setSelectedSlug] = useState(
    branches.find((branch) => branch.isHeadquarters)?.slug ?? branches[0]?.slug,
  );
  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.slug === selectedSlug) ?? branches[0],
    [branches, selectedSlug],
  );
  const primaryPhone = selectedBranch ? getPrimaryPhone(selectedBranch) : "";

  return (
    <section className="section branch-section">
      <div className="container branch-locator">
        <div className="branch-locator__top">
          <div className="section-heading">
            <span className="eyebrow">Three branches</span>
            <h2>Care close to your city</h2>
            <p>Choose a branch, view the right contact numbers and start booking without leaving the page.</p>
          </div>
          <div className="branch-tabs" role="tablist" aria-label="Select branch">
            {branches.map((branch) => (
              <button
                key={branch.slug}
                type="button"
                aria-selected={selectedBranch?.slug === branch.slug}
                onClick={() => setSelectedSlug(branch.slug)}
              >
                <span>{branch.isHeadquarters ? "Headquarters" : "Branch"}</span>
                <strong>{branch.name}</strong>
              </button>
            ))}
          </div>
        </div>

        {selectedBranch ? (
          <motion.div
            className="branch-showcase"
            variants={revealVariants(shouldReduceMotion)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
          >
            <div className="branch-showcase__content">
              <div className="branch-showcase__header">
                <span>
                  <Building2 size={17} aria-hidden="true" />
                  {selectedBranch.isHeadquarters ? "Headquarters" : "Branch"}
                </span>
                <h3>{selectedBranch.name}</h3>
                <p>{selectedBranch.address}</p>
              </div>

              <div className="branch-showcase__actions">
                <Link to="/appointment">
                  <CalendarDays size={18} aria-hidden="true" />
                  Book {selectedBranch.name}
                </Link>
                <a href={`tel:${cleanTel(primaryPhone)}`}>
                  <Phone size={18} aria-hidden="true" />
                  Call OPD
                </a>
                <a href={buildWhatsAppLink(selectedBranch)} target="_blank" rel="noreferrer">
                  <MessageCircle size={18} aria-hidden="true" />
                  WhatsApp
                </a>
              </div>

              <div className="branch-contact-grid">
                {selectedBranch.phoneGroups.map((group) => (
                  <div key={group.label}>
                    <strong>{group.label}</strong>
                    {group.numbers.map((number) => (
                      <a href={`tel:${cleanTel(number)}`} key={number}>
                        <Phone size={15} aria-hidden="true" />
                        {number}
                      </a>
                    ))}
                  </div>
                ))}
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${selectedBranch.email}`}>
                    <Mail size={15} aria-hidden="true" />
                    {selectedBranch.email}
                  </a>
                </div>
              </div>

              <small>{selectedBranch.hoursLabel}</small>
            </div>

            <div className="branch-showcase__map">
              {showMaps ? (
                <iframe
                  title={`${selectedBranch.name} map`}
                  src={selectedBranch.mapEmbed}
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="branch-map-card" aria-label="Branch coverage overview">
                  <span>Gujarat</span>
                  {branches.map((branch, index) => (
                    <button
                      key={branch.slug}
                      type="button"
                      className={`branch-map-pin branch-map-pin--${index + 1}`}
                      aria-label={`Show ${branch.name}`}
                      aria-pressed={selectedBranch.slug === branch.slug}
                      onClick={() => setSelectedSlug(branch.slug)}
                    >
                      {branch.name}
                    </button>
                  ))}
                </div>
              )}
              <a href={buildMapLink(selectedBranch)} target="_blank" rel="noreferrer">
                <Navigation size={17} aria-hidden="true" />
                Open in Google Maps
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        ) : null}

        <motion.div
          className={`branch-grid ${showMaps ? "branch-grid--maps" : ""}`}
          variants={staggerContainer(shouldReduceMotion)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.16 }}
        >
          {branches.map((branch) => (
            <motion.article
              key={branch.slug}
              className={`branch-card card-hover ${selectedBranch?.slug === branch.slug ? "branch-card--active" : ""}`}
              variants={revealVariants(shouldReduceMotion)}
              whileHover={shouldReduceMotion ? undefined : { y: -7 }}
            >
              <div className="branch-card__head">
                <div>
                  <span>{branch.isHeadquarters ? "Headquarters" : "Branch"}</span>
                  <h3>{branch.name}</h3>
                </div>
                <button type="button" aria-label={`Select ${branch.name}`} onClick={() => setSelectedSlug(branch.slug)}>
                  <MapPinned size={21} aria-hidden="true" />
                </button>
              </div>
              <p>{branch.address}</p>
              <a href={`mailto:${branch.email}`} className="branch-card__email">
                <Mail size={16} aria-hidden="true" />
                {branch.email}
              </a>
              <div className="branch-card__phones">
                {branch.phoneGroups.map((group) => (
                  <div key={group.label}>
                    <strong>{group.label}</strong>
                    {group.numbers.map((number) => (
                      <a href={`tel:${cleanTel(number)}`} key={number}>
                        <Phone size={15} aria-hidden="true" />
                        {number}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
              <div className="branch-card__actions">
                <Link to="/appointment">
                  <CalendarDays size={16} aria-hidden="true" />
                  Book {branch.name}
                </Link>
                <a
                  href={`https://wa.me/${branch.whatsappNumber}?text=${encodeURIComponent(
                    `Hello Aakash Eye Hospital, I would like to book an appointment at ${branch.name}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
              <button className="branch-card__details" type="button" onClick={() => setSelectedSlug(branch.slug)}>
                <MapPin size={16} aria-hidden="true" />
                View details
              </button>
              <small>{branch.hoursLabel}</small>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
