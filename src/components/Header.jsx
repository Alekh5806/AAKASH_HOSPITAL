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
  buildMapLink,
  buildWhatsApp,
  cleanTel,
  getPrimaryBranch,
  getPrimaryPhone,
} from "../lib/contact";

const BRANCH_STORAGE_KEY = "aakash_selected_branch";
const { emergency, branchPicker, establishedLabel } = site.header;

function branchHref(slug) {
  return `/branches?branch=${slug}`;
}

function readStoredBranch() {
  try {
    return window.localStorage.getItem(BRANCH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeBranch(slug) {
  try {
    window.localStorage.setItem(BRANCH_STORAGE_KEY, slug);
  } catch {
    // Storage can be blocked in privacy modes; the header still works for this session.
  }
}

function findBranch(slug) {
  return branches.items.find((branch) => branch.slug === slug) ?? null;
}

function BranchPicker({ branch, isOpen, onSelect, onToggle, variant }) {
  const listId = `hd-branch-list-${variant}`;

  return (
    <div className="hd__pop">
      <button
        className={variant === "citybar" ? "hd__citybar-toggle" : "hd__pop-toggle"}
        type="button"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-haspopup="true"
        onClick={onToggle}
      >
        <MapPin size={16} aria-hidden="true" />
        {variant === "citybar" ? (
          <span className="hd__pop-label">{branchPicker.label}</span>
        ) : null}
        <span className="hd__pop-value">{branch.name}</span>
        <ChevronDown size={15} aria-hidden="true" />
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

/* The hospitals menu is a single-column list, not a two-column mega panel: six
   short city names read faster in one column, and the panel stays narrow
   enough to sit under its own trigger rather than spanning half the header.
   Keyboard support is roving focus over the rows, which is what a menu button
   with a list of links is expected to do. */
function HospitalsMenu({
  label,
  activeSlug,
  selectedSlug,
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
    const items = Array.from(panelRef.current?.querySelectorAll(".hd__mega-item") ?? []);
    if (items.length === 0) return;
    const from = items.indexOf(document.activeElement);
    const next = step === "first" ? 0 : step === "last" ? items.length - 1 : from + step;
    items[Math.min(Math.max(next, 0), items.length - 1)].focus();
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

  const currentSlug = activeSlug ?? selectedSlug;

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
        aria-controls="hd-hospitals-menu"
        aria-haspopup="true"
        onClick={() => onToggle(!isOpen)}
        onKeyDown={onTriggerKeyDown}
      >
        <span>{label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="hd__mega" id="hd-hospitals-menu" ref={panelRef} onKeyDown={onPanelKeyDown}>
          <p className="hd__mega-head">
            <span>{branchPicker.menuTitle}</span>
            <small>{branches.items.length} cities</small>
          </p>
          <div className="hd__mega-list">
            {branches.items.map((item) => (
              <Link
                key={item.slug}
                className="hd__mega-item"
                data-current={item.slug === currentSlug ? "true" : undefined}
                aria-current={item.slug === activeSlug ? "page" : undefined}
                to={branchHref(item.slug)}
              >
                <span className="hd__mega-text">
                  <strong>
                    {item.name}
                    {item.isHeadquarters ? <span className="hd__tag">Head Office</span> : null}
                  </strong>
                  <small>{item.locality}</small>
                </span>
                {item.slug === currentSlug ? (
                  <Check className="hd__mega-mark" size={17} aria-hidden="true" />
                ) : (
                  <ChevronRight className="hd__mega-go" size={16} aria-hidden="true" />
                )}
              </Link>
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

export default function Header() {
  const location = useLocation();
  const locationKey = `${location.pathname}${location.search}`;
  const headerRef = useRef(null);
  const drawerRef = useRef(null);
  const hospitalsTriggerRef = useRef(null);

  const [selectedSlug, setSelectedSlug] = useState(
    () => readStoredBranch() ?? getPrimaryBranch(branches.items).slug,
  );
  const [syncedLocationKey, setSyncedLocationKey] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBranchOpen, setDrawerBranchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const menusOpenRef = useRef(false);

  const selectedBranch = findBranch(selectedSlug) ?? getPrimaryBranch(branches.items);
  const selectedPhone = getPrimaryPhone(selectedBranch);
  const urlBranchSlug = new URLSearchParams(location.search).get("branch");
  const isHospitalsSection = location.pathname === "/branches";

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
    if (urlBranchSlug && findBranch(urlBranchSlug)) setSelectedSlug(urlBranchSlug);
  }

  useEffect(() => {
    storeBranch(selectedSlug);
  }, [selectedSlug]);

  // A menu that is open must never be scrolled off screen, so the handler
  // reads the latest state from a ref rather than resubscribing on every open.
  useEffect(() => {
    menusOpenRef.current = Boolean(openMenu) || drawerOpen;
  }, [openMenu, drawerOpen]);

  /* Compact past COMPACT_ON, and on small screens give the 109px header back to
     the page while the reader is moving down, returning it the moment they
     scroll up. There is no bottom bar to fall back on, so the reveal has to be
     instant - the header is the only route back to the branch phone number and
     Book Appointment once the reader has scrolled past the hero.
     DELTA ignores the jitter of a trackpad or an iOS rubber-band bounce.

     Compacting removes the 44px city bar from the flow above every section, so
     the browser's scroll anchoring shifts the offset to compensate. With a
     single threshold that shift dropped the offset back under it, the bar
     re-expanded, the offset shifted again, and the header flickered in place at
     one scroll position on phones (desktop hides the city bar, so it never saw
     it). COMPACT_ON and COMPACT_OFF are spread wider than that 44px shift so
     the compensation can never cross back over the threshold, and SETTLE_MS
     stops the induced jump from being read as the reader scrolling. */
  useEffect(() => {
    const HIDE_AFTER = 160;
    const DELTA = 6;
    const COMPACT_ON = 96;
    const COMPACT_OFF = 16;
    const SETTLE_MS = 350;
    let frame = 0;
    let lastY = window.scrollY;
    let compact = lastY > COMPACT_ON;
    let settleUntil = 0;

    function update() {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY;
      const atBottom =
        window.innerHeight + y >= document.documentElement.scrollHeight - 2;
      const nextCompact = compact ? y > COMPACT_OFF : y > COMPACT_ON;

      if (nextCompact !== compact) {
        compact = nextCompact;
        settleUntil = performance.now() + SETTLE_MS;
        setIsScrolled(nextCompact);
      }

      if (menusOpenRef.current || y <= HIDE_AFTER || atBottom) {
        setIsHidden(false);
      } else if (performance.now() >= settleUntil && Math.abs(delta) > DELTA) {
        setIsHidden(delta > 0);
      }

      lastY = y;
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

  useEffect(() => {
    if (!openMenu) return undefined;

    function onPointerDown(event) {
      if (!headerRef.current?.contains(event.target)) setOpenMenu(null);
    }

    function onKeyDown(event) {
      if (event.key !== "Escape") return;
      setOpenMenu((current) => {
        if (current === "hospitals") hospitalsTriggerRef.current?.focus();
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

      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
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
  }, [drawerOpen]);

  const bookHref = `/appointment?branch=${selectedBranch.slug}`;
  const emergencyLink = (
    <a
      className="hd__emergency"
      href={`tel:${cleanTel(emergency.phone)}`}
      aria-label={`${emergency.label} ${emergency.phone}`}
    >
      <Siren size={18} aria-hidden="true" />
      <span className="hd__emergency-full">{emergency.label}</span>
      <span className="hd__emergency-short">{emergency.shortLabel}</span>
    </a>
  );

  return (
    <header
      ref={headerRef}
      className={`hd ${isScrolled ? "hd--scrolled" : ""} ${
        isHidden && !openMenu && !drawerOpen ? "hd--hidden" : ""
      } ${drawerOpen ? "hd--drawer-open" : ""}`}
    >
      <div className="hd__citybar">
        <div className="hd__container">
          <BranchPicker
            branch={selectedBranch}
            isOpen={openMenu === "branch-mobile"}
            variant="citybar"
            onSelect={selectBranch}
            onToggle={() => setOpenMenu((current) => (current === "branch-mobile" ? null : "branch-mobile"))}
          />
        </div>
      </div>

      <div className="hd__main">
        <div className="hd__container">
          <Link className="hd__brand" to="/" aria-label={`${site.brand.name} home`}>
            <img src={site.brand.logo} alt={site.brand.logoAlt} width="178" height="48" />
            <span className="hd__brand-est" aria-hidden="true">
              <strong>{establishedLabel}</strong>
              <span>Trusted eye care</span>
            </span>
          </Link>

          <div className="hd__utils">
            {emergencyLink}
            <a
              className="hd__phone"
              href={`tel:${cleanTel(selectedPhone)}`}
              aria-label={`Call ${selectedBranch.name} OPD on ${selectedPhone}`}
            >
              <Phone size={18} aria-hidden="true" />
              <strong>{selectedPhone}</strong>
            </a>
            <BranchPicker
              branch={selectedBranch}
              isOpen={openMenu === "branch-desktop"}
              variant="desktop"
              onSelect={selectBranch}
              onToggle={() =>
                setOpenMenu((current) => (current === "branch-desktop" ? null : "branch-desktop"))
              }
            />
            <Link className="hd__cta" to={bookHref}>
              <CalendarDays size={18} aria-hidden="true" />
              <span>Book Appointment</span>
            </Link>
          </div>

          <div className="hd__mobile-actions">
            {emergencyLink}
            <button
              className="hd__iconbtn"
              type="button"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              aria-controls="hd-drawer"
              onClick={() => {
                setOpenMenu(null);
                setDrawerOpen(true);
              }}
            >
              <Menu size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="hd__navbar">
        <div className="hd__container">
          <nav className="hd__nav" aria-label="Primary">
            {navigation.header.map((item) =>
              item.dropdown === "branches" ? (
                <HospitalsMenu
                  key={item.href}
                  label={item.label}
                  activeSlug={urlBranchSlug}
                  selectedSlug={selectedSlug}
                  isActiveSection={isHospitalsSection}
                  isOpen={openMenu === "hospitals"}
                  triggerRef={hospitalsTriggerRef}
                  onClose={() => setOpenMenu(null)}
                  onToggle={(next) => setOpenMenu(next ? "hospitals" : null)}
                />
              ) : (
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
              ),
            )}
          </nav>
        </div>
      </div>

      {drawerOpen ? (
        <div className="hd__drawer" id="hd-drawer" role="dialog" aria-modal="true" aria-label="Site menu">
          <div ref={drawerRef} className="hd__drawer-panel" tabIndex={-1}>
            <div className="hd__drawer-head">
              <img src={site.brand.logo} alt={site.brand.logoAlt} width="148" height="40" />
              <button
                className="hd__drawer-close"
                type="button"
                aria-label="Close menu"
                onClick={closeAll}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="hd__drawer-scroll">
              <div className="hd__drawer-branch">
                <button
                  className="hd__drawer-branch-toggle"
                  type="button"
                  aria-expanded={drawerBranchOpen}
                  aria-controls="hd-drawer-hospitals"
                  onClick={() => setDrawerBranchOpen((current) => !current)}
                >
                  <span className="hd__drawer-branch-text">
                    <small>{branchPicker.label}</small>
                    <strong>
                      <MapPin size={17} aria-hidden="true" />
                      {selectedBranch.name}
                    </strong>
                    <span>{selectedBranch.locality}</span>
                  </span>
                  <span className="hd__drawer-branch-cue">
                    <span>Change</span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </span>
                </button>

                {drawerBranchOpen ? (
                  <div className="hd__drawer-sub" id="hd-drawer-hospitals">
                    <p className="hd__drawer-label">{branchPicker.menuTitle}</p>
                    {branches.items.map((branch) => (
                      <Link
                        key={branch.slug}
                        className="hd__drawer-branch-link"
                        data-current={
                          branch.slug === (urlBranchSlug ?? selectedSlug) ? "true" : undefined
                        }
                        aria-current={branch.slug === urlBranchSlug ? "page" : undefined}
                        to={branchHref(branch.slug)}
                        onClick={closeAll}
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
                        {branch.slug === (urlBranchSlug ?? selectedSlug) ? (
                          <Check size={17} aria-hidden="true" />
                        ) : null}
                      </Link>
                    ))}
                    <Link className="hd__drawer-sub-all" to="/branches" onClick={closeAll}>
                      <span>{branchPicker.allLabel}</span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                ) : null}
              </div>

              <nav className="hd__drawer-nav" aria-label="Mobile">
                <p className="hd__drawer-label">Menu</p>
                {navigation.header.map((item, index) => (
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
                <span>Book Appointment</span>
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
              {emergencyLink}
            </div>
          </div>
        </div>
      ) : null}

    </header>
  );
}
