import { ArrowRight, ArrowUp, Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { branches, navigation, site } from "../lib/coreData";
import { buildWhatsApp, cleanTel, getPrimaryBranch } from "../lib/contact";

/* lucide-react 1.x dropped its brand icons, so the three marks the hospital
   actually links to are inlined here and keyed by `icon` in site.json. */
const socialMarks = {
  facebook:
    "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12z",
  instagram:
    "M12 4.16c2.54 0 2.85.01 3.85.06.93.04 1.44.2 1.77.33.45.17.77.38 1.1.71.34.34.55.65.72 1.1.13.34.29.85.33 1.78.05 1 .06 1.31.06 3.86s-.01 2.85-.06 3.85c-.04.93-.2 1.44-.33 1.78-.17.45-.38.76-.72 1.1-.33.33-.65.54-1.1.71-.33.13-.84.29-1.77.34-1 .04-1.31.05-3.85.05s-2.85-.01-3.85-.05c-.93-.05-1.44-.21-1.78-.34-.45-.17-.76-.38-1.1-.71-.33-.34-.54-.65-.71-1.1-.13-.34-.29-.85-.34-1.78-.04-1-.05-1.3-.05-3.85s.01-2.86.05-3.86c.05-.93.21-1.44.34-1.78.17-.45.38-.76.71-1.1.34-.33.65-.54 1.1-.71.34-.13.85-.29 1.78-.33 1-.05 1.31-.06 3.85-.06zm0-1.72c-2.59 0-2.91.01-3.93.06-1.01.04-1.7.21-2.31.44-.62.25-1.15.57-1.68 1.1-.52.52-.85 1.05-1.09 1.67-.24.61-.4 1.3-.45 2.31-.04 1.02-.06 1.34-.06 3.93s.02 2.91.06 3.93c.05 1.01.21 1.7.45 2.31.24.62.57 1.15 1.09 1.67.53.53 1.06.85 1.68 1.1.61.23 1.3.4 2.31.44 1.02.05 1.34.06 3.93.06s2.91-.01 3.93-.06c1.01-.04 1.7-.21 2.31-.44.62-.25 1.15-.57 1.67-1.1.53-.52.85-1.05 1.1-1.67.23-.61.4-1.3.44-2.31.05-1.02.06-1.34.06-3.93s-.01-2.91-.06-3.93c-.04-1.01-.21-1.7-.44-2.31a4.66 4.66 0 0 0-1.1-1.67 4.66 4.66 0 0 0-1.67-1.1c-.61-.23-1.3-.4-2.31-.44-1.02-.05-1.34-.06-3.93-.06zm0 4.64a4.92 4.92 0 1 0 0 9.84 4.92 4.92 0 0 0 0-9.84zm0 8.12a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm6.27-8.31a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0z",
  x: "M17.53 3h2.82l-6.16 7.04L21.44 21h-5.68l-4.44-5.81L6.23 21H3.4l6.59-7.53L2.83 3h5.82l4.02 5.31zm-.99 16.31h1.56L7.53 4.61H5.85z",
};

function SocialMark({ name }) {
  const path = socialMarks[name];
  if (!path) return null;
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function columnId(title) {
  return `ft-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/* "Since 1993" is set as two typographic parts: a tracked micro word and the
   year in the serif italic accent the rest of the footer uses. The year is
   read off the end of the label so the JSON stays a single plain string. */
function splitEstablished(label) {
  const match = /^(.*?)\s*(\d{4})\s*$/.exec(label);
  return match ? { word: match[1], year: match[2] } : { word: label, year: "" };
}

export default function Footer() {
  const primaryBranch = getPrimaryBranch(branches.items);
  const helpline = site.header.emergency.phone;
  const email = primaryBranch.email;
  const hours = site.businessHours[0];
  const { cta, contactLabels } = site.footer;
  const { word: sinceWord, year: sinceYear } = splitEstablished(site.header.establishedLabel);

  function openCookiePreferences() {
    window.dispatchEvent(new Event("aakash:open-cookie-preferences"));
  }

  function scrollToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <footer className="ft" id="site-footer">
      <div className="e-shell">
        <div className="ft__card">
          <div className="ft__masthead">
            <Link className="ft__brand" to="/" aria-label={`${site.brand.name} home`}>
              <img src={site.brand.logo} alt={site.brand.logoAlt} width="210" height="70" />
            </Link>
            <span className="ft__since">
              <span className="ft__since-word">{sinceWord}</span>
              <span className="ft__since-year">{sinceYear}</span>
            </span>
          </div>

          <div className="ft__reach">
            <ul className="ft__contact">
              <li>
                <Phone size={17} aria-hidden="true" />
                <div>
                  <span>{contactLabels.phone}</span>
                  <a href={`tel:${cleanTel(helpline)}`}>{helpline}</a>
                </div>
              </li>
              <li>
                <Mail size={17} aria-hidden="true" />
                <div>
                  <span>{contactLabels.email}</span>
                  <a href={`mailto:${email}`}>{email}</a>
                </div>
              </li>
              <li>
                <Clock size={17} aria-hidden="true" />
                <div>
                  <span>{contactLabels.hours}</span>
                  <strong>
                    {hours.label}, {hours.value}
                  </strong>
                </div>
              </li>
            </ul>
            <p className="ft__emergency">{site.footer.emergencyNote}</p>
          </div>

          <div className="ft__body">
            <section className="ft__act" aria-labelledby="ft-act-title">
              <h2 className="ft__actTitle" id="ft-act-title">
                {cta.title} <em>{cta.titleAccent}</em>
              </h2>
              <p className="ft__actLede">{cta.lede}</p>

              <div className="ft__actions">
                <Link className="ft__cta" to="/appointment">
                  {cta.primaryLabel}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a
                  className="ft__ghost"
                  href={buildWhatsApp(primaryBranch)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={17} aria-hidden="true" />
                  {cta.whatsappLabel}
                </a>
              </div>

            </section>

            {navigation.footer.map((group) => (
              <nav className="ft__col" key={group.title} aria-labelledby={columnId(group.title)}>
                <h3 id={columnId(group.title)}>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link to={item.href}>{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            <nav className="ft__col" aria-labelledby="ft-hospitals">
              <h3 id="ft-hospitals">{site.footer.hospitalsTitle}</h3>
              <ul>
                {branches.items.map((branch) => (
                  <li key={branch.slug}>
                    <Link to={`/branches?branch=${branch.slug}`}>
                      {branch.name}
                      {branch.isHeadquarters ? <em>Head office</em> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="ft__utility">
            {site.socialLinks?.length ? (
              <div className="ft__social">
                {site.socialLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${site.brand.name} on ${link.label}`}
                  >
                    <SocialMark name={link.icon} />
                  </a>
                ))}
              </div>
            ) : null}

            <div className="ft__legal">
              <button type="button" onClick={openCookiePreferences}>
                Privacy and cookie preferences
              </button>
              <button className="ft__top" type="button" onClick={scrollToTop}>
                Back to top
                <ArrowUp size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="ft__fine">
          {site.footer.disclaimers.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p className="ft__copy">
            <span>{site.footer.legalNote}</span>
            <span>
              &copy; {new Date().getFullYear()} {site.footer.copyright}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
