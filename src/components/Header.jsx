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
import { splitEstablished } from "../lib/brand";
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

const { emergency, branchPicker, establishedLabel } = site.header;
const established = splitEstablished(establishedLabel);

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
        <MapPin size={16} aria-hidden="true" />
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
  const menusOpenRef = useRef(false);
  /* True until a branch has been stored for this reader. The drawer is the
     only place a phone chooses a hospital, so on a fresh visit its branch
     block opens expanded the first time the drawer does - the reader meets
     the six cities where the choice matters, with no prompt in the way. Read
     before the effect below stores the default. */
  const freshVisitRef = useRef(readStoredBranch() === null);

  const aboutNavItem = navigation.header.find((item) => item.dropdown === "about");
  const drawerNavItems = navigation.header.flatMap((item) => item.children ?? [item]);
  const selectedBranch = findBranch(selectedSlug) ?? getPrimaryBranch(branches.items);
  const selectedPhone = getPrimaryPhone(selectedBranch);
  /* A page opened for one hospital names it either way: the index carries it
     in the query, and a hospital's own page carries it in the path. */
  const pathBranchSlug = location.pathname.match(/^\/branches\/([^/]+)/)?.[1] ?? null;
  const urlBranchSlug = new URLSearchParams(location.search).get("branch") ?? pathBranchSlug;
  const isHospitalsSection = location.pathname.startsWith("/branches");
  const isAboutSection = location.pathname.startsWith("/about");

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

  /* Compact past COMPACT_ON, and give the header back to the page while the
     reader is moving down, returning it the moment they scroll up. There is
     no bottom bar to fall back on, so the reveal has to be instant - the
     header is the only route back to the drawer's call actions and Book
     Appointment once the reader has scrolled past the hero.
     DELTA ignores the jitter of a trackpad or an iOS rubber-band bounce.

     Compacting takes height out of the flow above every section (the desktop
     brand row shrinks; phones no longer compact anything now that the city
     bar is gone), so the browser's scroll anchoring shifts the offset to
     compensate. With a single threshold that shift dropped the offset back
     under it, the header re-expanded, the offset shifted again, and it
     flickered in place at one scroll position. COMPACT_ON and COMPACT_OFF are
     spread wider than that shift so the compensation can never cross back over
     the threshold, and SETTLE_MS stops the induced jump from being read as the
     reader scrolling.

     The settle window needs a fallback, because this handler only ever runs on
     a scroll event. A flick that crosses COMPACT_ON and then stops inside the
     window fires nothing further, so the direction it was travelling is never
     applied and the header stays put for good - it reads as a header that
     simply does not hide. resolveSettle() is that fallback and it is
     deliberately narrow: it runs once when the window closes, only if no scroll
     event resolved the direction in the meantime, and only on net movement
     larger than SETTLE_NET. That floor sits clear of any height the header
     gives up, so the anchoring jump the window exists to ignore can never
     satisfy it. */
  useEffect(() => {
    const HIDE_AFTER = 160;
    const DELTA = 6;
    const COMPACT_ON = 96;
    const COMPACT_OFF = 16;
    const SETTLE_MS = 350;
    const SETTLE_NET = 64;
    let frame = 0;
    let timer = 0;
    let lastY = window.scrollY;
    let compact = lastY > COMPACT_ON;
    let settleUntil = 0;
    let settleFromY = lastY;
    let settledByScroll = true;

    function canHide(y) {
      const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 2;
      return !menusOpenRef.current && y > HIDE_AFTER && !atBottom;
    }

    function resolveSettle() {
      timer = 0;
      if (settledByScroll) return;
      const y = Math.max(window.scrollY, 0);
      const net = y - settleFromY;
      if (!canHide(y) || Math.abs(net) <= SETTLE_NET) return;
      settledByScroll = true;
      setIsHidden(net > 0);
      lastY = y;
    }

    function update() {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY;
      const nextCompact = compact ? y > COMPACT_OFF : y > COMPACT_ON;

      if (nextCompact !== compact) {
        compact = nextCompact;
        settleUntil = performance.now() + SETTLE_MS;
        settleFromY = lastY;
        settledByScroll = false;
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(resolveSettle, SETTLE_MS + 20);
        setIsScrolled(nextCompact);
      }

      if (!canHide(y)) {
        settledByScroll = true;
        setIsHidden(false);
      } else if (performance.now() >= settleUntil && Math.abs(delta) > DELTA) {
        settledByScroll = true;
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
      if (timer) window.clearTimeout(timer);
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
      <div className="hd__main">
        <div className="hd__container">
          <Link className="hd__brand" to="/" aria-label={`${site.brand.name} home`}>
            <img src={site.brand.logo} alt={site.brand.logoAlt} width="178" height="48" />
            <span className="hd__brand-est" aria-hidden="true">
              <span className="hd__brand-since">
                <span className="hd__brand-since-word">{established.word}</span>
                <span className="hd__brand-since-year">{established.year}</span>
              </span>
              <span className="hd__brand-note">Trusted eye care</span>
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
              ref={menuButtonRef}
              className="hd__iconbtn"
              type="button"
              aria-label="Open menu"
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
      </div>

      <div className="hd__navbar">
        <div className="hd__container">
          <nav className="hd__nav" aria-label="Primary">
            {navigation.header.map((item) => {
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
                    onClose={() => setOpenMenu(null)}
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
              <img src={site.brand.logo} alt={site.brand.logoAlt} width="148" height="40" />
              <div className="hd__mobile-actions">
                {emergencyLink}
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
                    <span>Change</span>
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
                <p className="hd__drawer-label">Menu</p>
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
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
