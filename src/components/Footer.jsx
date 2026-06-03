import { ArrowUpRight, CalendarDays, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { branches, navigation, site } from "../lib/data";

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

  return (
    <footer className="site-footer" id="site-footer">
      <div className="container site-footer__visit">
        <div>
          <span>Visit Aakash Eye Hospital</span>
          <h2>Three Gujarat branches, one clear route to care.</h2>
          <p>Choose the nearest branch for OPD, cataract, retina, glaucoma and laser care guidance.</p>
        </div>
        <div className="site-footer__visit-actions">
          <Link to="/appointment">
            <CalendarDays size={18} aria-hidden="true" />
            Book appointment
          </Link>
          <Link to="/branches">
            View branches
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="container site-footer__branches" aria-label="Branch contact details">
        {branches.items.map((branch) => {
          const phone = getPrimaryPhone(branch);

          return (
            <article className="footer-branch" key={branch.slug}>
              <div className="footer-branch__head">
                <span>{branch.isHeadquarters ? "Headquarters" : "Branch"}</span>
                <h3>{branch.name}</h3>
              </div>
              <p>
                <MapPin size={18} aria-hidden="true" />
                <span>{branch.address}</span>
              </p>
              <div className="footer-branch__actions">
                <a href={`tel:${cleanTel(phone)}`}>
                  <Phone size={16} aria-hidden="true" />
                  {phone}
                </a>
                <a href={buildMapLink(branch)} target="_blank" rel="noreferrer">
                  <Navigation size={16} aria-hidden="true" />
                  Directions
                </a>
                <a href={buildWhatsAppLink(branch)} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} aria-hidden="true" />
                  WhatsApp
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <img src={site.brand.logo} alt={site.brand.logoAlt} />
          <p>{site.footer.summary}</p>
          <a href={`mailto:${primaryBranch.email}`}>
            <Mail size={17} aria-hidden="true" />
            {primaryBranch.email}
          </a>
        </div>
        {navigation.footer.map((group) => (
          <div className="site-footer__group" key={group.title}>
            <h2>{group.title}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link to={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="site-footer__group site-footer__group--contact">
          <h2>Quick Contact</h2>
          <ul className="footer-contacts">
            <li>
              <Phone size={17} aria-hidden="true" />
              <a href={`tel:${cleanTel(primaryPhone)}`}>{primaryPhone}</a>
            </li>
            <li>
              <MessageCircle size={17} aria-hidden="true" />
              <a href={buildWhatsAppLink(primaryBranch)} target="_blank" rel="noreferrer">
                WhatsApp Visnagar
              </a>
            </li>
            <li>
              <Navigation size={17} aria-hidden="true" />
              <a href={buildMapLink(primaryBranch)} target="_blank" rel="noreferrer">
                Open headquarters map
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <p>
          &copy; {new Date().getFullYear()} {site.footer.copyright}
        </p>
        <p>Established 1993 · Visnagar, Ahmedabad and Bharuch</p>
      </div>
    </footer>
  );
}
