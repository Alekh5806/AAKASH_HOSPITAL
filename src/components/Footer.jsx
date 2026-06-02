import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { branches, navigation, site } from "../lib/data";

export default function Footer() {
  const primaryBranch = branches.items[0];

  return (
    <footer className="site-footer">
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
        <div className="site-footer__group">
          <h2>Visit</h2>
          <ul className="footer-contacts">
            <li>
              <MapPin size={17} aria-hidden="true" />
              <span>{primaryBranch.address}</span>
            </li>
            <li>
              <Phone size={17} aria-hidden="true" />
              <a href="tel:+917600082710">+91-760-008-2710</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="container site-footer__bottom">
        <p>
          &copy; {new Date().getFullYear()} {site.footer.copyright}
        </p>
        <p>{site.footer.sourceNote}</p>
      </div>
    </footer>
  );
}
