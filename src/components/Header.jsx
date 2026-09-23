import { useCallback, useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Phone,
  Siren,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { branches, navigation, site } from "../lib/coreData";
import {
  BRANCH_STORAGE_KEY,
  buildBranchHref,
  buildMapLink,
  buildWhatsApp,
  cleanTel,
  getPrimaryBranch,
  getPrimaryPhone,
  storeBranch,
  BRANCH_CHANGE_EVENT,
} from "../lib/contact";

const { emergency, branchPicker, bookLabel, bookShortLabel, menuLabel, opdLabel } = site.header;

function readStoredBranch() {
  try {
    return window.localStorage.getItem(BRANCH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function findBranch(slug) {
  return branches.items.find((branch) => branch.slug === slug) ?? null;
}

function BranchPicker({ branch, isOpen, onSelect, onToggle }) {
  const listId = "hd-branch-list";

  return (
    <div className="hd__pop">
      <button
        className="hd__pop-toggle"
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-haspopup="true"
        onClick={onToggle}
      >
        <MapPin size={15} aria-hidden="true" />
        <span className="hd__pop-label">{branchPicker.label}</span>
        <span className="hd__pop-value">{branch.name}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="hd__panel" id={listId}>
          <span className="hd__panel-head">
            <span className="hd__panel-title">{branchPicker.menuTitle}</span>
            <span className="hd__panel-hint">{branchPicker.menuHint}</span>
          </span>
          <div className="hd__branch-list" role="radiogroup" aria-label={branchPicker.menuTitle}>
            {branches.items.map((item) => (
              <button
                key={item.slug}
                className="hd__branch-option"
                type="button"
                role="radio"
                aria-checked={item.slug === branch.slug}
                onClick={() => onSelect(item.slug)}
              >
                <span className="hd__branch-text">
                  <strong>
                    {item.name}
                    {item.isHeadquarters ? <span className="hd__tag">Head Office</span> : null}
                  </strong>
                  <small>{item.locality}</small>
                </span>
                {item.slug === branch.slug ? (
                  <Check className="hd__branch-check" size={18} aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
          <Link className="hd__panel-foot" to="/branches">
            <span>{branchPicker.allLabel}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/* One dropdown shell for every nav menu that has one: a single narrow column
   under its own trigger, because a short list reads faster in one column and
   the panel stays narrow enough to sit under the link that opened it rather
   than spanning half the header. Keyboard support is roving focus over the
   rows, which is what a menu button with a list of links is expected to do. */
function NavDropdown({
  label,
  panelId,
  headTitle,
  headMeta,
  items,
  footer,
  isActiveSection,
  isOpen,
  onClose,
  onToggle,
  triggerRef,
}) {
  const canHover = useRef(false);
  const panelRef = useRef(null);
  const closeTimer = useRef(0);
  const focusFirstOnOpen = useRef(false);

  useEffect(() => {
    canHover.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!isOpen || !focusFirstOnOpen.current) return;
    focusFirstOnOpen.current = false;
    panelRef.current?.querySelector(".hd__mega-item")?.focus();
  }, [isOpen]);

  function cancelClose() {
    window.clearTimeout(closeTimer.current);
  }

  // Pointer travel from the trigger to the panel crosses a diagonal, so the
  // menu waits a moment before closing rather than dropping out from under it.
  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(onClose, 160);
  }

  function moveFocus(step) {
    const rows = Array.from(panelRef.current?.querySelectorAll(".hd__mega-item") ?? []);
    if (rows.length === 0) return;
    const from = rows.indexOf(document.activeElement);
    const next = step === "first" ? 0 : step === "last" ? rows.length - 1 : from + step;
    rows[Math.min(Math.max(next, 0), rows.length - 1)].focus();
  }

  function onTriggerKeyDown(event) {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    if (isOpen) {
      moveFocus("first");
      return;
    }
    focusFirstOnOpen.current = true;
    onToggle(true);
  }

  function onPanelKeyDown(event) {
    const steps = { ArrowDown: 1, ArrowUp: -1, Home: "first", End: "last" };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    moveFocus(step);
  }

  return (
    <div
      className="hd__mega-wrap"
      onMouseEnter={() => {
        cancelClose();
        if (canHover.current) onToggle(true);
      }}
      onMouseLeave={() => {
        if (canHover.current) scheduleClose();
      }}
    >
      <button
        ref={triggerRef}
        className={`hd__nav-trigger ${isActiveSection ? "hd__nav-link--active" : ""}`}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="true"
        /* A fine pointer has already opened the menu by hovering the trigger,
           so a click there keeps it open rather than closing what the hover
           just showed; the menu leaves with the pointer. Touch and keyboard
           have no hover, so for them the click is the toggle. */
        onClick={() => onToggle(canHover.current ? true : !isOpen)}
        onKeyDown={onTriggerKeyDown}
      >
        <span>{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="hd__mega" id={panelId} ref={panelRef} onKeyDown={onPanelKeyDown}>
          <p className="hd__mega-head">
            <span>{headTitle}</span>
            {headMeta ? <small>{headMeta}</small> : null}
          </p>
          <div className="hd__mega-list">
            {items.map((item) => (
              <Link
                key={item.key}
                className="hd__mega-item"
                data-current={item.current ? "true" : undefined}
                aria-current={item.isPage ? "page" : undefined}
                to={item.to}
              >
                <span className="hd__mega-text">
                  <strong>
                    {item.title}
                    {item.tag ? <span className="hd__tag">{item.tag}</span> : null}
                  </strong>
                  <small>{item.subtitle}</small>
                </span>
                {item.current ? (
                  <Check className="hd__mega-mark" size={17} aria-hidden="true" />
                ) : (
                  <ChevronRight className="hd__mega-go" size={16} aria-hidden="true" />
                )}
              </Link>
            ))}
          </div>
          {footer ? (
            <Link className="hd__panel-foot" to={footer.to}>
              <span>{footer.label}</span>
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function Header() {
  const location = useLocation();
  const locationKey = `${location.pathname}${location.search}`;
  const headerRef = useRef(null);
  const drawerRef = useRef(null);
  const navRef = useRef(null);
  const stripRef = useRef(null);
  const menuButtonRef = useRef(null);
  const dropdownTriggers = useRef({});

  const [selectedSlug, setSelectedSlug] = useState(
    () => readStoredBranch() ?? getPrimaryBranch(branches.items).slug,
  );
  const [syncedLocationKey, setSyncedLocationKey] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBranchOpen, setDrawerBranchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  /* On the home page the header floats on the film until the film has gone
     past it; everywhere else it is on paper from the first frame. */
  const [overFilm, setOverFilm] = useState(true);
  const menusOpenRef = useRef(false);
  /* True until a branch has been stored for this reader. The drawer is the
     only place a phone chooses a hospital, so on a fresh visit its branch
     block opens expanded the first time the drawer does - the reader meets
     the six cities where the choice matters, with no prompt in the way. Read
     before the effect below stores the default. */
  const freshVisitRef = useRef(readStoredBranch() === null);

  const aboutNavItem = navigation.header.find((item) => item.dropdown === "about");
  const drawerNavItems = navigation.header.flatMap((item) => item.children ?? [item]);
  /* The logo is the way home, as it is on the reference, so the capsule does
     not spend a link on it. The drawer keeps Home: a menu the reader opened to
     go somewhere should list everywhere they can go. */
  const desktopNavItems = navigation.header.filter((item) => item.href !== "/");
  const selectedBranch = findBranch(selectedSlug) ?? getPrimaryBranch(branches.items);
  const selectedPhone = getPrimaryPhone(selectedBranch);
  /* A page opened for one hospital names it either way: the index carries it
     in the query, and a hospital's own page carries it in the path. */
  const pathBranchSlug = location.pathname.match(/^\/branches\/([^/]+)/)?.[1] ?? null;
  const urlBranchSlug = new URLSearchParams(location.search).get("branch") ?? pathBranchSlug;
  const isHospitalsSection = location.pathname.startsWith("/branches");
  const isAboutSection = location.pathname.startsWith("/about");
  const isHome = location.pathname === "/";
  const tone = isHome && overFilm ? "film" : "paper";

  const closeAll = useCallback(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
    setDrawerBranchOpen(false);
  }, []);

  const selectBranch = useCallback((slug) => {
    setSelectedSlug(slug);
    setOpenMenu(null);
  }, []);

  // Close every menu on navigation, and adopt the branch a page was opened for.
  // Adjusting state during render (rather than in an effect) avoids a flash of stale menus.
  if (locationKey !== syncedLocationKey) {
    setSyncedLocationKey(locationKey);
    setOpenMenu(null);
    setDrawerOpen(false);
    setDrawerBranchOpen(false);
    setIsHidden(false);
    setOverFilm(true);
    if (urlBranchSlug && findBranch(urlBranchSlug)) setSelectedSlug(urlBranchSlug);
  }

  useEffect(() => {
    storeBranch(selectedSlug);
  }, [selectedSlug]);

  /* The contact page's switchboard stores a hospital too. Follow it, so the
     number at the top of the screen is the one the reader just chose rather
     than the one from the last navigation. The header's own write above
     dispatches the same event with the same slug, which is a no-op here. */
  useEffect(() => {
    const follow = (event) => {
      if (findBranch(event.detail)) setSelectedSlug(event.detail);
    };
    window.addEventListener(BRANCH_CHANGE_EVENT, follow);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, follow);
  }, []);

  // A menu that is open must never be scrolled off screen, so the handler
  // reads the latest state from a ref rather than resubscribing on every open.
  useEffect(() => {
    menusOpenRef.current = Boolean(openMenu) || drawerOpen;
  }, [openMenu, drawerOpen]);

  /* Give the header back to the page while the reader is moving down, and
     return it the moment they scroll up. There is no bottom bar to fall back
     on, so the reveal has to be instant - the header is the only route back to
     the drawer's call actions and Book Appointment past the hero.

     Direction is read from travel, not from one frame's delta. Movement is
     summed while it keeps its sign and reset the moment it turns, and the
     header changes state once the sum passes TRAVEL. A per-frame threshold
     (6px) was what it replaced, and it failed two ways: a slow reading scroll
     of 3-4px a frame never crossed it in either direction, and a 120Hz phone
     halves every frame's delta, so ordinary flicks read as jitter there too.

     Nothing here changes the header's height. `isScrolled` only gives the
     paper band its hairline and shadow, and the film/paper change of shape
     happens inside a box whose size never moves, so no scroll position can
     make the document reflow under the reader - which is what the old
     compacting header needed a pair of thresholds and a settle window for. */
  useEffect(() => {
    const HIDE_AFTER = 160;
    const TRAVEL = 12;
    let frame = 0;
    let lastY = window.scrollY;
    let travelled = 0;

    function canHide(y) {
      const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 2;
      return !menusOpenRef.current && y > HIDE_AFTER && !atBottom;
    }

    function update() {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY;
      lastY = y;
      setIsScrolled(y > 4);

      if (!canHide(y)) {
        travelled = 0;
        setIsHidden(false);
        return;
      }

      if (delta === 0) return;

      if (Math.sign(delta) !== Math.sign(travelled)) travelled = 0;
      travelled += delta;
      if (Math.abs(travelled) > TRAVEL) setIsHidden(travelled > 0);
    }

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /* The home page's tone: film while the hero is still under the capsule,
     paper once its bottom edge has gone above the header's own. The hero is a
     lazy route module and may not exist when this subscribes, so until it does
     the header stays on film, which is what the first screen of `/` is. */
  useEffect(() => {
    if (!isHome) return undefined;
    let frame = 0;

    function check() {
      frame = 0;
      const hero = document.querySelector(".e-hero");
      const header = headerRef.current;
      if (!hero || !header) return;
      const strip = stripRef.current?.offsetHeight ?? 0;
      const cut = Math.max(strip - window.scrollY, 0) + header.offsetHeight;
      setOverFilm(hero.getBoundingClientRect().bottom > cut + 1);
    }

    function onChange() {
      if (!frame) frame = window.requestAnimationFrame(check);
    }

    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isHome]);

  /* One indicator travels between sections rather than a border blinking off
     one link and on to the next - the device every narrowing control on this
     site uses, written here as two custom properties on the nav rather than a
     framer layoutId, because the header sits in the root bundle and a 2px bar
     is not worth pulling framer-motion into every first load.

     The first placement must not slide in from the left edge, so the nav opens
     with its transition off and rAF turns it on once the bar has been painted
     where it belongs. A ResizeObserver re-places it when the row reflows,
     which is also what catches the web fonts landing and changing every
     label's width. */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    function place() {
      const active = nav.querySelector(".hd__nav-link--active");
      if (!active) {
        nav.style.setProperty("--hd-ink-o", "0");
        return;
      }
      const inset = parseFloat(getComputedStyle(active).paddingLeft) || 0;
      const box = active.getBoundingClientRect();
      const frame = nav.getBoundingClientRect();
      nav.style.setProperty("--hd-ink-x", `${box.left - frame.left + inset}px`);
      nav.style.setProperty("--hd-ink-w", `${box.width - inset * 2}px`);
      nav.style.setProperty("--hd-ink-o", "1");
    }

    place();
    const frame = window.requestAnimationFrame(() => {
      nav.setAttribute("data-ready", "true");
    });

    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [locationKey]);

  useEffect(() => {
    if (!openMenu) return undefined;

    function onPointerDown(event) {
      const inside =
        headerRef.current?.contains(event.target) || stripRef.current?.contains(event.target);
      if (!inside) setOpenMenu(null);
    }

    function onKeyDown(event) {
      if (event.key !== "Escape") return;
      setOpenMenu((current) => {
        dropdownTriggers.current[current]?.focus();
        return null;
      });
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const panel = drawerRef.current;
    const opener = menuButtonRef.current;
    const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    panel?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(panel?.querySelectorAll(selector) ?? []);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === panel)
      ) {
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
      /* The sheet took focus when it opened; hand it back to the button that
         opened it rather than dropping it on the body. */
      opener?.focus({ preventScroll: true });
    };
  }, [drawerOpen]);

  const dropdownMenus = {
    branches: {
      headMeta: `${branches.items.length} cities`,
      isActiveSection: isHospitalsSection,
      footer: { to: "/branches", label: branchPicker.allLabel },
      items: branches.items.map((item) => ({
        key: item.slug,
        to: buildBranchHref(item),
        title: item.name,
        tag: item.isHeadquarters ? "Head Office" : undefined,
        subtitle: item.locality,
        current: item.slug === (urlBranchSlug ?? selectedSlug),
        isPage: item.slug === urlBranchSlug,
      })),
    },
    about: {
      isActiveSection: isAboutSection,
      items: (aboutNavItem?.children ?? []).map((child) => ({
        key: child.href,
        to: child.href,
        title: child.label,
        subtitle: child.description,
        current: location.pathname === child.href,
        isPage: location.pathname === child.href,
      })),
    },
  };

  const bookHref = `/appointment?branch=${selectedBranch.slug}`;
  /* Visnagar answers its OPD on the emergency line. Printing the same digits
     twice under two labels reads as a fault, so the strip merges them into one
     labelled number - the rule the footer already applies to the same pair. */
  const emergencyTel = cleanTel(emergency.phone);
  const sharesEmergencyLine = cleanTel(selectedPhone) === emergencyTel;
  const urgentLink = (
    <a
      className="hd__urgent"
      href={`tel:${emergencyTel}`}
      aria-label={`${emergency.label} ${emergency.phone}`}
    >
      <Siren size={17} aria-hidden="true" />
      <span>{emergency.shortLabel}</span>
    </a>
  );

  return (
    <>
      {/* The reference's promo band, carrying what a hospital's should: the
          emergency line, and the chosen hospital with its own OPD number. It
          is not sticky - it scrolls away and the capsule stays. */}
      <div className="hd__strip" ref={stripRef}>
        <div className="hd__strip-in">
          <a
            className="hd__strip-item"
            href={`tel:${emergencyTel}`}
            aria-label={`${emergency.label} ${emergency.phone}`}
          >
            <span className="hd__strip-dot" aria-hidden="true" />
            <span>{sharesEmergencyLine ? emergency.combinedLabel : emergency.label}</span>
            <strong>{emergency.phone}</strong>
          </a>

          <div className="hd__strip-right">
            {sharesEmergencyLine ? null : (
              <>
                <a
                  className="hd__strip-item"
                  href={`tel:${cleanTel(selectedPhone)}`}
                  aria-label={`Call ${selectedBranch.name} ${opdLabel} on ${selectedPhone}`}
                >
                  <span>
                    {selectedBranch.name} {opdLabel}
                  </span>
                  <strong>{selectedPhone}</strong>
                </a>
                <span className="hd__strip-sep" aria-hidden="true" />
              </>
            )}
            <BranchPicker
              branch={selectedBranch}
              isOpen={openMenu === "branch-desktop"}
              onSelect={selectBranch}
              onToggle={() =>
                setOpenMenu((current) => (current === "branch-desktop" ? null : "branch-desktop"))
              }
            />
          </div>
        </div>
      </div>

      <header
        ref={headerRef}
        className={`hd ${isScrolled ? "hd--scrolled" : ""} ${
          isHidden && !openMenu && !drawerOpen ? "hd--hidden" : ""
        } ${drawerOpen ? "hd--drawer-open" : ""}`}
        data-tone={tone}
        data-over={isHome ? "" : undefined}
      >
        {/* One capsule, two shapes: an inset glass pill on the home film, a
            flat frosted band on paper. The logo, the nav and the action sit in
            the same place in both, so only the frame around them moves. */}
        <div className="hd__cap">
          <Link className="hd__brand" to="/" aria-label={`${site.brand.name} home`}>
            {isHome ? (
              <img
                className="hd__logo hd__logo--light"
                src={site.brand.logoLight}
                alt=""
                width="207"
                height="50"
              />
            ) : null}
            <img
              className="hd__logo hd__logo--ink"
              src={site.brand.logo}
              alt={site.brand.logoAlt}
              width="207"
              height="50"
            />
          </Link>

          <nav className="hd__nav" ref={navRef} data-ready="false" aria-label="Primary">
            {desktopNavItems.map((item) => {
              if (item.dropdown) {
                const menu = dropdownMenus[item.dropdown];

                return (
                  <NavDropdown
                    key={item.href}
                    label={item.label}
                    panelId={`hd-menu-${item.dropdown}`}
                    headTitle={item.menuTitle ?? item.label}
                    headMeta={menu.headMeta}
                    items={menu.items}
                    footer={menu.footer}
                    isActiveSection={menu.isActiveSection}
                    isOpen={openMenu === item.dropdown}
                    triggerRef={(node) => {
                      dropdownTriggers.current[item.dropdown] = node;
                    }}
                    onClose={() =>
                      /* A menu's close timer can fire after the pointer has
                           already opened the other menu; it must only close
                           itself, never whichever menu is open by then. */
                      setOpenMenu((current) => (current === item.dropdown ? null : current))
                    }
                    onToggle={(next) => setOpenMenu(next ? item.dropdown : null)}
                  />
                );
              }

              return (
                <NavLink
                  key={item.href}
                  className={({ isActive }) =>
                    `hd__nav-link ${isActive ? "hd__nav-link--active" : ""}`
                  }
                  to={item.href}
                  end={item.href === "/"}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="hd__actions">
            <Link className="hd__cta" to={bookHref}>
              <span>{bookLabel}</span>
            </Link>
          </div>

          {/* The phone's one action is a compact booking pill, on every screen.
              The emergency line is the first thing in the drawer's head. */}
          <div className="hd__mobile-actions">
            <Link
              className="hd__cta hd__mobile-cta"
              to={bookHref}
              aria-label={bookLabel}
            >
              <CalendarDays size={16} aria-hidden="true" />
              <span className="hd__cta-full">{bookLabel}</span>
              <span className="hd__cta-short" aria-hidden="true">
                {bookShortLabel}
              </span>
            </Link>
            <button
              ref={menuButtonRef}
              className="hd__iconbtn"
              type="button"
              aria-label={`Open ${menuLabel.toLowerCase()}`}
              aria-expanded={drawerOpen}
              aria-controls="hd-drawer"
              onClick={() => {
                setOpenMenu(null);
                setDrawerOpen(true);
                if (freshVisitRef.current) {
                  freshVisitRef.current = false;
                  setDrawerBranchOpen(true);
                }
              }}
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>

        {drawerOpen ? (
          <div
            className="hd__drawer"
            id="hd-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            onClick={(event) => {
              if (event.target === event.currentTarget) closeAll();
            }}
          >
            <div ref={drawerRef} className="hd__drawer-panel" tabIndex={-1}>
              {/* The head is the header's own brand row: logo, the emergency
                line, and the close button in the slot the menu button had. The
                open and closed states line up, and the emergency line stays
                where the reader just saw it instead of moving to the foot. */}
              <div className="hd__drawer-head">
                <img src={site.brand.logo} alt={site.brand.logoAlt} width="207" height="50" />
                <div className="hd__mobile-actions">
                  {urgentLink}
                  <button
                    className="hd__iconbtn"
                    type="button"
                    aria-label="Close menu"
                    onClick={closeAll}
                  >
                    <X size={22} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="hd__drawer-scroll">
                <div className="hd__drawer-branch">
                  {/* Two controls in one card. The hospital itself is the link
                    to its own page - on a phone there is no hospitals dropdown,
                    so this row is the one place the drawer names a hospital and
                    has to be the way to it as well. Change is the toggle that
                    opens the list; the two are siblings because a link cannot
                    sit inside a button. */}
                  <div className="hd__drawer-branch-summary">
                    <Link
                      className="hd__drawer-branch-page"
                      to={buildBranchHref(selectedBranch)}
                      onClick={closeAll}
                    >
                      <small>{branchPicker.label}</small>
                      <strong>
                        <MapPin size={17} aria-hidden="true" />
                        {selectedBranch.name}
                        <ChevronRight size={16} aria-hidden="true" />
                      </strong>
                      <span>{selectedBranch.locality}</span>
                    </Link>
                    <button
                      className="hd__drawer-branch-toggle"
                      type="button"
                      aria-label="Change your hospital"
                      aria-expanded={drawerBranchOpen}
                      aria-controls="hd-drawer-hospitals"
                      onClick={() => setDrawerBranchOpen((current) => !current)}
                    >
                      <span>{branchPicker.changeLabel}</span>
                      <ChevronDown size={16} aria-hidden="true" />
                    </button>
                  </div>

                  {drawerBranchOpen ? (
                    <div className="hd__drawer-sub" id="hd-drawer-hospitals">
                      <p className="hd__drawer-label" id="hd-drawer-hospitals-title">
                        {branchPicker.menuTitle}
                      </p>
                      {/* Choosing sets the branch in place and folds the list, so
                        the reader stays on the page they were on with Call OPD
                        and WhatsApp below now pointing at that hospital. The
                        rows used to be links to /branches; a selector that
                        navigates away is a detour. View all hospitals is the
                        way to that page. */}
                      <div role="radiogroup" aria-labelledby="hd-drawer-hospitals-title">
                        {branches.items.map((branch) => (
                          <button
                            key={branch.slug}
                            className="hd__drawer-branch-option"
                            type="button"
                            role="radio"
                            aria-checked={branch.slug === selectedSlug}
                            onClick={() => {
                              selectBranch(branch.slug);
                              setDrawerBranchOpen(false);
                            }}
                          >
                            <span>
                              <strong>
                                {branch.name}
                                {branch.isHeadquarters ? (
                                  <span className="hd__tag">Head Office</span>
                                ) : null}
                              </strong>
                              <small>{branch.locality}</small>
                            </span>
                            {branch.slug === selectedSlug ? (
                              <Check size={17} aria-hidden="true" />
                            ) : null}
                          </button>
                        ))}
                      </div>
                      <Link className="hd__drawer-sub-all" to="/branches" onClick={closeAll}>
                        <span>{branchPicker.allLabel}</span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  ) : null}
                </div>

                <nav className="hd__drawer-nav" aria-label="Mobile">
                  <p className="hd__drawer-label">{menuLabel}</p>
                  {drawerNavItems.map((item, index) => (
                    <NavLink
                      key={item.href}
                      className={({ isActive }) =>
                        `hd__drawer-link ${isActive ? "hd__drawer-link--active" : ""}`
                      }
                      style={{ "--hd-i": index }}
                      to={item.href}
                      end={item.href === "/"}
                      onClick={closeAll}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="hd__drawer-foot">
                <Link className="hd__cta" to={bookHref} onClick={closeAll}>
                  <CalendarDays size={18} aria-hidden="true" />
                  <span>{bookLabel}</span>
                </Link>
                <div className="hd__drawer-trio">
                  <a className="hd__ghost" href={`tel:${cleanTel(selectedPhone)}`}>
                    <Phone size={18} aria-hidden="true" />
                    <span>Call OPD</span>
                  </a>
                  <a
                    className="hd__ghost"
                    href={buildWhatsApp(selectedBranch)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    className="hd__ghost"
                    href={buildMapLink(selectedBranch)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation size={18} aria-hidden="true" />
                    <span>Directions</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </header>
    </>
  );
}
