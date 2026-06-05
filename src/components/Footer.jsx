import { useState } from "react";
import { CalendarDays, Clock, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import LazyMapFrame from "./LazyMapFrame";
import { branches, navigation, site } from "../lib/coreData";

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

function buildMapLink(branch) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Aakash Eye Hospital ${branch.name} ${branch.address}`,
  )}`;
}

function buildWhatsAppLink(branch) {
  return `https://wa.me/${branch.whatsappNumber}?text=${encodeURIComponent(
    `Hello Aakash Eye Hospital, I would like to book an appointment at ${branch.name}.`,
  )}`;
}

export default function Footer() {
  const primaryBranch = branches.items.find((branch) => branch.isHeadquarters) ?? branches.items[0];
  const primaryPhone = getPrimaryPhone(primaryBranch);
  const [selectedMapBranch, setSelectedMapBranch] = useState(primaryBranch);
  const footerLinks = [
    { label: "Home", href: "/" },
    ...navigation.header.filter((item) => item.href !== "/"),
    { label: "Book Appointment", href: "/appointment" },
  ];

  function openCookiePreferences() {
    window.dispatchEvent(new Event("aakash:open-cookie-preferences"));
  }

  return (
    <footer className="site-footer" id="site-footer">
      <div className="container site-footer__grid">
        <section
          className="site-footer__group site-footer__group--contact"
          aria-labelledby="footer-contact"
        >
          <img className="site-footer__logo" src={site.brand.logo} alt={site.brand.logoAlt} />
          <h2 id="footer-contact">Contact Us</h2>
          <ul className="footer-contacts">
            <li>
              <Phone size={17} aria-hidden="true" />
              <a href={`tel:${cleanTel(primaryPhone)}`}>{primaryPhone}</a>
            </li>
            <li>
              <Mail size={17} aria-hidden="true" />
              <a href={`mailto:${primaryBranch.email}`}>{primaryBranch.email}</a>
            </li>
            <li>
              <Clock size={17} aria-hidden="true" />
              <span>{site.businessHours[0]?.value ?? "Call branch for OPD schedule"}</span>
            </li>
          </ul>
          <div className="site-footer__actions">
            <Link to="/appointment">
              <CalendarDays size={17} aria-hidden="true" />
              Book Appointment
            </Link>
            <a href={buildWhatsAppLink(primaryBranch)} target="_blank" rel="noreferrer">
              <MessageCircle size={17} aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </section>

        <section
          className="site-footer__group site-footer__group--addresses"
          aria-labelledby="footer-address"
        >
          <h2 id="footer-address">Branch Addresses</h2>
          <div className="footer-branch-list" aria-label="Aakash Eye Hospital branch addresses">
            {branches.items.map((branch) => {
              const phone = getPrimaryPhone(branch);
              const isSelected = selectedMapBranch.slug === branch.slug;

              return (
                <article
                  className={`footer-address-card ${isSelected ? "footer-address-card--active" : ""}`}
                  key={branch.slug}
                >
                  <div className="footer-address-card__head">
                    <strong>{branch.name}</strong>
                    <span>{branch.isHeadquarters ? "Head Office" : "Branch"}</span>
                  </div>
                  <p>
                    <MapPin size={17} aria-hidden="true" />
                    <span>{branch.address}</span>
                  </p>
                  <div className="footer-address-card__actions">
                    <a href={`tel:${cleanTel(phone)}`}>
                      <Phone size={15} aria-hidden="true" />
                      Call
                    </a>
                    <a href={buildMapLink(branch)} target="_blank" rel="noreferrer">
                      <Navigation size={15} aria-hidden="true" />
                      Directions
                    </a>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedMapBranch(branch)}
                    >
                      Show Map
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="site-footer__group" aria-labelledby="footer-links">
          <h2 id="footer-links">Links</h2>
          <nav aria-label="Footer navigation">
            <ul>
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        <section
          className="site-footer__group site-footer__group--map"
          aria-labelledby="footer-map"
        >
          <h2 id="footer-map">Map Location</h2>
          <p className="site-footer__map-branch">{selectedMapBranch.name} Branch</p>
          <LazyMapFrame
            title={`Map to Aakash Eye Hospital ${selectedMapBranch.name}`}
            src={selectedMapBranch.mapEmbed}
          />
          <a
            className="site-footer__map-link"
            href={buildMapLink(selectedMapBranch)}
            target="_blank"
            rel="noreferrer"
          >
            <Navigation size={16} aria-hidden="true" />
            Open in Maps
          </a>
        </section>
      </div>

      <div className="container site-footer__bottom">
        <p>
          &copy; {new Date().getFullYear()} {site.footer.copyright}
        </p>
        <a href="#main-content" aria-label="Back to top">
          Back to top
        </a>
        <button type="button" onClick={openCookiePreferences}>
          Privacy & Cookie Preferences
        </button>
      </div>
    </footer>
  );
}
