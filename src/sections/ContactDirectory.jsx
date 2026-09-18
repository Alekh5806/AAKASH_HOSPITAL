import { useEffect, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Mail, Plus, TriangleAlert } from "lucide-react";
import { branches, site } from "../lib/coreData";
import {
  BRANCH_CHANGE_EVENT,
  buildBranchHref,
  cleanTel,
  getPrimaryBranch,
  getStoredBranch,
} from "../lib/contact";
import { contactPage, mergeDesks } from "../lib/contactData";
import { getBranchHours, getHoursRows } from "../lib/hours";
import { fillTemplate } from "../lib/servicesData";

/* Every number, every hospital, as one ruled ledger.
 *
 * The switchboard above answers "how do I reach my hospital"; this answers
 * "which desk" - the operation and LASIK lines the OPD number does not carry.
 * The emergency line leads because it is the one number that belongs to no
 * single hospital, and the email and the hours close the list because both
 * are the same everywhere. Each row's name is the way into that hospital's
 * own page, so nothing else about a hospital is written here.
 *
 * Below 900px each hospital is a fold rather than an open row. Six open rows
 * of pills were a 2600px wall on a phone, most of it numbers for hospitals
 * the reader had not chosen; folded, the six names fit one screen and the
 * hospital chosen in the switchboard is the one already open - the folds
 * follow the same stored hospital, so the two sections always agree. */

const { directory } = contactPage;
const EASE = [0.22, 1, 0.36, 1];
const STACKED_QUERY = "(max-width: 899px)";

function subscribeStacked(callback) {
  const media = window.matchMedia(STACKED_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function readStacked() {
  return window.matchMedia(STACKED_QUERY).matches;
}

/* One line per number, labelled by its desk on the first line only. */
function deskLines(branch) {
  return mergeDesks(branch.phoneGroups).flatMap((group) =>
    group.numbers.map((number, index) => ({
      key: `${group.label}-${number}`,
      label: index === 0 ? group.label : "",
      number,
    })),
  );
}

function RowName({ branch }) {
  return (
    <>
      <span className="ct-row__city">
        {branch.name}
        {branch.isHeadquarters ? <em>{directory.headOfficeTag}</em> : null}
      </span>
      <span className="ct-row__where">{branch.locality}</span>
    </>
  );
}

export default function ContactDirectory() {
  const shouldReduceMotion = useReducedMotion();
  const stacked = useSyncExternalStore(subscribeStacked, readStacked, () => false);
  const items = branches.items;
  const emergency = site.header.emergency;
  const email = getPrimaryBranch(items).email;
  const [chosen, setChosen] = useState(() => getStoredBranch(items));
  const [openSlugs, setOpenSlugs] = useState(() => new Set([chosen.slug]));

  /* The hospital chosen in the switchboard opens its fold here too, and the
     hours at the foot are its own - the six can differ, so the foot names the
     hospital it is describing rather than stating one figure for all. */
  useEffect(() => {
    const follow = (event) => {
      const next = items.find((item) => item.slug === event.detail);
      if (!next) return;
      setChosen(next);
      setOpenSlugs((open) => (open.has(next.slug) ? open : new Set([...open, next.slug])));
    };
    window.addEventListener(BRANCH_CHANGE_EVENT, follow);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, follow);
  }, [items]);

  const toggle = (slug, isOpen) => {
    setOpenSlugs((open) => {
      if (open.has(slug) === isOpen) return open;
      const next = new Set(open);
      if (isOpen) next.add(slug);
      else next.delete(slug);
      return next;
    });
  };

  const reveal = (delay = 0) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE, delay },
  });

  return (
    <section className="e-sec e-sec--paper ct-dir" aria-labelledby="ct-dir-title">
      <div className="e-shell">
        <header className="e-head">
          <span className="e-label">{directory.label}</span>
          <div className="e-head__body">
            <h2 className="e-h2" id="ct-dir-title">
              {directory.title} <em>{directory.titleAccent}</em>
            </h2>
            <p className="e-lede">{directory.lede}</p>
          </div>
        </header>

        <motion.a className="ct-urgent" href={`tel:${cleanTel(emergency.phone)}`} {...reveal()}>
          <span className="ct-urgent__mark" aria-hidden="true">
            <TriangleAlert size={20} />
          </span>
          <span className="ct-urgent__label">{directory.emergencyLabel}</span>
          <span className="ct-urgent__number">{emergency.phone}</span>
          <span className="ct-urgent__note">{directory.emergencyNote}</span>
        </motion.a>

        <ul className="ct-ledger">
          {items.map((branch, position) => (
            <motion.li className="ct-row" key={branch.slug} {...reveal(position * 0.05)}>
              {stacked ? (
                <details
                  className="ct-fold"
                  open={openSlugs.has(branch.slug)}
                  onToggle={(event) => toggle(branch.slug, event.currentTarget.open)}
                >
                  <summary className="ct-fold__summary">
                    <span className="ct-row__name">
                      <RowName branch={branch} />
                    </span>
                    <span className="ct-fold__mark" aria-hidden="true">
                      <Plus size={18} />
                    </span>
                  </summary>
                  <div className="ct-fold__body">
                    {deskLines(branch).map((line) => (
                      <a className="ct-line" href={`tel:${cleanTel(line.number)}`} key={line.key}>
                        <span className="ct-line__label">{line.label}</span>
                        <span className="ct-line__number">{line.number}</span>
                      </a>
                    ))}
                    <Link className="ct-line ct-line--go" to={buildBranchHref(branch)}>
                      <span className="ct-line__label">{directory.openLabel}</span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </details>
              ) : (
                <>
                  <Link className="ct-row__name" to={buildBranchHref(branch)}>
                    <RowName branch={branch} />
                    <span className="ct-row__go" aria-hidden="true">
                      {directory.openLabel}
                      <ArrowUpRight size={15} />
                    </span>
                  </Link>

                  <div className="ct-row__desks">
                    {mergeDesks(branch.phoneGroups).map((group) => (
                      <div className="ct-deskline" key={group.label}>
                        <span className="ct-deskline__label">{group.label}</span>
                        <span className="ct-deskline__numbers">
                          {group.numbers.map((number) => (
                            <a className="ct-num" href={`tel:${cleanTel(number)}`} key={number}>
                              {number}
                            </a>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.li>
          ))}
        </ul>

        <motion.div className="ct-foot" {...reveal()}>
          <div className="ct-foot__cell">
            <span className="e-label">{directory.emailLabel}</span>
            <a className="ct-foot__mail" href={`mailto:${email}`}>
              <Mail size={18} aria-hidden="true" />
              {email}
            </a>
            <span className="ct-foot__note">{directory.emailNote}</span>
          </div>
          <div className="ct-foot__cell">
            <span className="e-label">
              {directory.hoursLabel} <i aria-hidden="true">·</i> {chosen.name}
            </span>
            <dl className="ct-hours">
              {getHoursRows(getBranchHours(chosen)).map((entry) => (
                <div key={entry.label}>
                  <dt>{entry.label}</dt>
                  <dd>{entry.value}</dd>
                </div>
              ))}
            </dl>
            <span className="ct-foot__note">
              {fillTemplate(directory.hoursNote, { branch: chosen.name })}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
