import { ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { about } from "../lib/aboutData";
import { navigation } from "../lib/coreData";

const aboutNav = navigation.header.find((item) => item.dropdown === "about");
const PAGE_KEYS = { "/about/journey": "journey", "/about/vision": "vision" };

/* Both About pages end by pointing at the other one, and this is that ending.
   It reads the same navigation.header About children the dropdown and
   AboutSwitch do, so the two pages can never disagree about what the other one
   is called or where it lives, and it previews the next page with that page's
   own headline and lede rather than a second summary written for the link. */
export default function AboutNext() {
  const { pathname } = useLocation();
  const options = aboutNav?.children ?? [];
  const current = options.find((option) => option.href === pathname);
  const target = options.find((option) => option.href !== pathname);
  if (!current || !target) return null;

  const currentPage = about[PAGE_KEYS[current.href]];
  const targetPage = about[PAGE_KEYS[target.href]];
  if (!currentPage || !targetPage) return null;

  return (
    <section className="e-sec e-sec--tight ab-next">
      <div className="e-shell">
        <div className="ab-next__panel">
          <div className="ab-next__copy">
            <span className="e-label">{about.nextLabel}</span>
            <h2 className="e-h2 ab-next__title">
              {targetPage.title} <em>{targetPage.titleAccent}</em>
            </h2>
            <p className="e-lede ab-next__lede">{targetPage.lede}</p>
          </div>
          <Link className="e-btn e-btn--light ab-next__cta" to={target.href}>
            {currentPage.ctaLabel}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
