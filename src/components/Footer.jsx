import { useSyncExternalStore } from "react";
import { ArrowRight, ArrowUp, Clock, Mail, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { splitEstablished } from "../lib/brand";
import { branches, navigation, site } from "../lib/coreData";
import {
  BRANCH_CHANGE_EVENT,
  buildBranchHref,
  buildWhatsApp,
  cleanTel,
  confirmedProfiles,
  getPrimaryBranch,
  getPrimaryPhone,
  getStoredBranch,
} from "../lib/contact";
import { getBranchHours, getHoursRows } from "../lib/hours";
import { useCurrentYear } from "../lib/hydration";
import SocialMark from "./SocialMark";

/* The reader's hospital, as the header stored it. `useSyncExternalStore`
   rather than state plus a listener: the header adopts a hospital page's own
   hospital in its mount effect, which runs before this component's effects
   would subscribe, and a listener added after that dispatch misses it - the
   footer then named Visnagar on the Bharuch page. The store hook re-reads the
   snapshot when it subscribes, so a change dispatched in between is seen. */
function subscribeToBranch(callback) {
  window.addEventListener(BRANCH_CHANGE_EVENT, callback);
  return () => window.removeEventListener(BRANCH_CHANGE_EVENT, callback);
}

function readStoredSlug() {
  return getStoredBranch(branches.items).slug;
}

function readDefaultSlug() {
  return getPrimaryBranch(branches.items).slug;
}

function columnId(title) {
  return `ft-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/* A hyphenated word such as "check-up" is one word to the reader, so it never
   breaks at its hyphen: the phone column set "Need an eye check-" over "up or
   a second opinion?" until this kept the compound whole. */
function keepCompounds(text) {
  return text.split(/(\S+-\S+)/).map((part, index) =>
    index % 2 === 1 ? (
      <span className="ft__nobr" key={index}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/* The address may break after its "@" and nowhere else: on a 320px phone it is
   wider than its cell, and with no break opportunity it ran past the card. */
function breakAfterAt(address) {
  const at = address.indexOf("@");
  if (at < 0) return address;
  return (
    <>
      {address.slice(0, at + 1)}
      <wbr />
      {address.slice(at + 1)}
    </>
  );
}

export default function Footer() {
  const primaryBranch = getPrimaryBranch(branches.items);
  const { emergency, opdLabel } = site.header;
  const email = primaryBranch.email;
  const { cta, contactLabels } = site.footer;

  /* The OPD number, the hours and the WhatsApp thread are the reader's
     hospital's - the one the header stored - and each names it, because the
     six can differ and a figure for "the OPD" with no hospital attached would
     be somebody else's on five pages out of six. It follows the header while
     the reader is still on the page, the way every other number on the site
     does. */
  const chosenSlug = useSyncExternalStore(subscribeToBranch, readStoredSlug, readDefaultSlug);
  const year = useCurrentYear();
  const chosenBranch = branches.items.find((branch) => branch.slug === chosenSlug) ?? primaryBranch;
  const chosenPhone = getPrimaryPhone(chosenBranch);
  /* The network's own profiles once the hospital confirms them; until then the
     reader's hospital's accounts, or the head office's where it has none. The
     label names whose they are. */
  const social = [
    { owner: site.brand.name, links: confirmedProfiles(site.socialLinks) },
    {
      owner: `${site.brand.name} ${chosenBranch.name}`,
      links: confirmedProfiles(chosenBranch.socialLinks),
    },
    {
      owner: `${site.brand.name} ${primaryBranch.name}`,
      links: confirmedProfiles(primaryBranch.socialLinks),
    },
  ].find((entry) => entry.links.length) ?? { owner: site.brand.name, links: [] };
  const hoursRows = getHoursRows(getBranchHours(chosenBranch)).filter((row) => row.open);
  const { word: sinceWord, year: sinceYear } = splitEstablished(site.header.establishedLabel);

  /* Visnagar answers its OPD on the emergency line, so there it is one number
     under the header's combined label; any other hospital gets its own OPD row
     beside the helpline - the header strip's rule, so the top and the foot of
     the page never offer a number under two different names. */
  const sharesEmergencyLine = cleanTel(chosenPhone) === cleanTel(emergency.phone);

  function openCookiePreferences() {
    window.dispatchEvent(new Event("aakash:open-cookie-preferences"));
  }

  /* A keyboard or screen-reader press (`detail` 0) takes focus to the top as
     well, so the next Tab starts at the skip link rather than past the footer. */
  function scrollToTop(event) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    if (event.detail === 0) document.querySelector(".skip-link")?.focus({ preventScroll: true });
  }

  return (
    <footer className="ft" id="site-footer">
      <div className="e-shell">
        <div className="ft__card">
          <div className="ft__masthead">
            <Link className="ft__brand" to="/" aria-label={`${site.brand.name} home`}>
              <img src={site.brand.logo} alt={site.brand.logoAlt} width="207" height="50" />
            </Link>
            <span className="ft__since">
              <span className="ft__since-word">{sinceWord}</span>
              <span className="ft__since-year">{sinceYear}</span>
            </span>
          </div>

          <div className="ft__reach">
            {/* Network-wide first, then the reader's hospital, so in two
                columns the second row is all one hospital and in one column
                its number and its hours sit together. */}
            <ul className="ft__contact" data-count={sharesEmergencyLine ? 3 : 4}>
              <li>
                <Phone size={17} aria-hidden="true" />
                <div>
                  <span>{sharesEmergencyLine ? emergency.combinedLabel : emergency.label}</span>
                  <a href={`tel:${cleanTel(emergency.phone)}`}>{emergency.phone}</a>
                </div>
              </li>
              <li>
                <Mail size={17} aria-hidden="true" />
                <div>
                  <span>{contactLabels.email}</span>
                  <a href={`mailto:${email}`}>{breakAfterAt(email)}</a>
                </div>
              </li>
              {sharesEmergencyLine ? null : (
                <li>
                  <Phone size={17} aria-hidden="true" />
                  <div>
                    <span>
                      {chosenBranch.name} {opdLabel}
                    </span>
                    <a href={`tel:${cleanTel(chosenPhone)}`}>{chosenPhone}</a>
                  </div>
                </li>
              )}
              <li>
                <Clock size={17} aria-hidden="true" />
                <div>
                  <span>
                    {contactLabels.hours} · {chosenBranch.name}
                  </span>
                  <strong>
                    {hoursRows.map((row) => (
                      <span className="ft__hours" key={row.label}>
                        {row.label}, <span className="ft__nobr">{row.value}</span>
                      </span>
                    ))}
                  </strong>
                </div>
              </li>
            </ul>
            <p className="ft__emergency">{site.footer.emergencyNote}</p>
          </div>

          <div className="ft__body">
            <section className="ft__act" aria-labelledby="ft-act-title">
              <h2 className="ft__actTitle" id="ft-act-title">
                {keepCompounds(cta.title)} <em>{keepCompounds(cta.titleAccent)}</em>
              </h2>
              <p className="ft__actLede">{cta.lede}</p>

              <div className="ft__actions">
                <Link className="ft__cta" to="/appointment">
                  {cta.primaryLabel}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a
                  className="ft__ghost"
                  href={buildWhatsApp(chosenBranch)}
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
                <h2 id={columnId(group.title)}>{group.title}</h2>
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
              <h2 id="ft-hospitals">{site.footer.hospitalsTitle}</h2>
              <ul>
                {branches.items.map((branch) => (
                  <li key={branch.slug}>
                    <Link to={buildBranchHref(branch)}>
                      {branch.name}
                      {branch.isHeadquarters ? <em>Head office</em> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="ft__utility">
            {social.links.length ? (
              <div className="ft__social">
                {social.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${social.owner} on ${link.label}`}
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
              &copy; {year} {site.footer.copyright}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
