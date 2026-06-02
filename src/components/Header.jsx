import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Menu, Phone, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { navigation, site } from "../lib/data";
import ButtonLink from "./ButtonLink";

function NavItems({ onNavigate }) {
  return navigation.header.map((item) => (
    <NavLink
      key={item.href}
      to={item.href}
      className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
      onClick={onNavigate}
    >
      {item.label}
    </NavLink>
  ));
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const previousPathRef = useRef(location.pathname);
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (previousPathRef.current === location.pathname) return undefined;
    previousPathRef.current = location.pathname;
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => setOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, open]);

  useEffect(() => {
    if (!open) return undefined;

    const panel = panelRef.current;
    const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = Array.from(panel?.querySelectorAll(selector) ?? []);
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    focusable[0]?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header__top">
        <div className="container site-header__top-inner">
          <a href={site.globalCtas.secondary.href}>
            <Phone size={15} aria-hidden="true" />
            <span>{site.globalCtas.secondary.label}</span>
          </a>
          <span>{site.brand.tagline}</span>
        </div>
      </div>
      <div className="container site-header__inner">
        <Link className="brand-mark" to="/" aria-label={`${site.brand.name} home`}>
          <img src={site.brand.logo} alt={site.brand.logoAlt} />
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          <NavItems />
        </nav>
        <div className="site-header__actions">
          <ButtonLink to="/appointment" icon={CalendarDays}>
            Book
          </ButtonLink>
          <button
            className="icon-button menu-button"
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          >
            <motion.div
              ref={panelRef}
              className="mobile-menu__panel"
              initial={{ x: shouldReduceMotion ? 0 : "100%" }}
              animate={{ x: 0 }}
              exit={{ x: shouldReduceMotion ? 0 : "100%" }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: "easeOut" }}
            >
              <div className="mobile-menu__head">
                <img src={site.brand.logo} alt={site.brand.logoAlt} />
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <X size={22} aria-hidden="true" />
                </button>
              </div>
              <nav className="mobile-menu__nav" aria-label="Mobile navigation">
                <NavItems onNavigate={() => setOpen(false)} />
              </nav>
              <ButtonLink to="/appointment" icon={CalendarDays} onClick={() => setOpen(false)}>
                Book Appointment
              </ButtonLink>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
