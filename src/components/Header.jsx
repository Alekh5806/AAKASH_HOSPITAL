import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { branches, navigation, site } from "../lib/coreData";
import { formatTime, getBranchHours, getOpenState } from "../lib/hours";
import { useClientState, useHydrated } from "../lib/hydration";
import {
  buildBranchHref,
  buildMapLink,
  buildWhatsApp,
  cleanTel,
  getPrimaryBranch,
  getPrimaryPhone,
  readStoredBranchSlug,
  storeBranch,
  BRANCH_CHANGE_EVENT,
} from "../lib/contact";

const {
  emergency,
  branchPicker,
  bookLabel,
  bookShortLabel,
  menuLabel,
  opdLabel,
  drawer: drawerCopy,
} = site.header;

function findBranch(slug) {
  return branches.items.find((branch) => branch.slug === slug) ?? null;
}

/* The phone menu opens as a circle of paper growing from the menu button, and
   each piece of its content fades in as that circle reaches it. The distance
   from the button to a link differs with the screen - on a phone held
   sideways the links are across the whole width - so the delays are measured
   on the screen in hand rather than written into the stylesheet. These two
   must match `.hd__drawer[data-state="open"] .hd__bloom` in header.css.

   The curve is the header's own ease-out: the circle leaves the button at
   speed and settles into the far corner. The ease-in-out it replaced spent
   its first tenth of a second barely moving, which read as the tap not
   having landed. */
const BLOOM_MS = 520;
const BLOOM_EASE = [0.32, 0.72, 0, 1];

function bezier(progress, first, second) {
  const rest = 1 - progress;
  return (
    3 * rest * rest * progress * first + 3 * rest * progress * progress * second + progress ** 3
  );
}

/* Milliseconds after the bloom starts at which its edge has travelled `share`
   of its full radius. */
function bloomReaches(share) {
  let low = 0;
  let high = 1;
  for (let step = 0; step < 24; step += 1) {
    const middle = (low + high) / 2;
    if (bezier(middle, BLOOM_EASE[1], BLOOM_EASE[3]) < share) low = middle;
    else high = middle;
  }
  return bezier(high, BLOOM_EASE[0], BLOOM_EASE[2]) * BLOOM_MS;
}

/* The bloom is centred on the close button, and its radius is the distance
   from there to the farthest corner of the screen - no more, so the shutting
   circle is on screen from its first frame rather than spending a tenth of a
   second shrinking off it. The stylesheet's `hypot(100vw, 100vh)` is only the
   fallback. */
function measureBloom(sheet) {
  const close = sheet?.querySelector(".hd__sheet-close");
  if (!close) return null;
  const button = close.getBoundingClientRect();
  const originX = button.left + button.width / 2;
  const originY = button.top + button.height / 2;
  const radius =
    Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    ) + 2;
  sheet.parentElement.style.setProperty("--hd-or", `${Math.round(radius)}px`);
  return { originX, originY, radius };
}

/* An element is covered once the bloom's edge has passed its farthest
   corner, and that is when it starts to fade in. */
function stageReveal(sheet) {
  const bloom = measureBloom(sheet);
  if (!bloom) return;
  const { originX, originY, radius } = bloom;
  sheet.querySelectorAll("[data-reveal]").forEach((element) => {
    const box = element.getBoundingClientRect();
    const reach = Math.hypot(
      Math.max(Math.abs(box.left - originX), Math.abs(box.right - originX)),
      Math.max(Math.abs(box.top - originY), Math.abs(box.bottom - originY)),
    );
    const delay = bloomReaches(Math.min(reach / radius, 1));
    element.style.setProperty("--hd-at", `${Math.round(delay)}ms`);
  });
}

/* Whether the chosen hospital's OPD is open now, in the words the menu's card
   prints under its name - read from the hospital's own hours, on its clock. */
function describeOpd(branch) {
  const state = getOpenState(getBranchHours(branch));
  if (state.closedToday) return { open: false, label: drawerCopy.closedTodayLabel };
  if (state.open) {
    return { open: true, label: drawerCopy.openUntil.replace("{time}", formatTime(state.closes)) };
  }
  return { open: false, label: drawerCopy.opensAt.replace("{time}", formatTime(state.opens)) };
}

/* Three bars drawn in CSS rather than an icon file, because the menu's close
   button is the same three bars turning into a cross in the same place - the
   menu button and the close button read as one control changing state. */
function MenuGlyph() {
  return (
    <span className="hd__glyph" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

/* The link list only scrolls on the shortest phones. A fade at its foot says
   there is more, and only while there is: a list that fits carries no fade,
   and one scrolled to its end loses it. Offsets rather than scrollHeight,
   because the rows are still rising into place when this first runs and a
   transformed row counts toward the scrollable overflow. */
function markMore(list) {
  if (!list) return;
  const last = list.lastElementChild;
  const end = last ? last.offsetTop + last.offsetHeight : 0;
  const more = end - list.scrollTop - list.clientHeight > 2;
  list.toggleAttribute("data-more", more);
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

  /* The reader's hospital is theirs, so the prerendered header names the head
     office and the hospital they chose arrives as React adopts the page; the
     location sync below runs again at that moment too, so a hospital's own
     page still names its hospital rather than the stored one. */
  const hydrated = useHydrated();
  const [selectedSlug, setSelectedSlug] = useClientState(
    () => readStoredBranchSlug() ?? getPrimaryBranch(branches.items).slug,
    getPrimaryBranch(branches.items).slug,
  );
  const [syncedLocationKey, setSyncedLocationKey] = useClientState(() => null, null);
  const [openMenu, setOpenMenu] = useState(null);
  /* The phone menu is open, closing, or closed. Closing is its own state
     because the sheet stays visible while its circle shuts over the page; the
     bloom's own animationend (or a timer, if that never fires) ends it. */
  const [drawer, setDrawer] = useState("closed");
  /* The hospital picker, a sheet that rises over the menu from its foot. */
  const [pickerOpen, setPickerOpen] = useState(false);
  /* The link the reader tapped, while its page loads. The menu stays open
     until the new page is there and then closes over it - closing at once
     showed the old page under the circle and then swapped it. */
  const [pendingHref, setPendingHref] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  /* On the home page the header floats on the film until the film has gone
     past it; everywhere else it is on paper from the first frame. */
  const [overFilm, setOverFilm] = useState(true);
  const menusOpenRef = useRef(false);
  const changeButtonRef = useRef(null);
  const pickerRef = useRef(null);
  const pickerOpenRef = useRef(false);
  const drawerOpen = drawer === "open";
  const drawerShown = drawer !== "closed";

  const aboutNavItem = navigation.header.find((item) => item.dropdown === "about");
  /* The sheet reads in two sizes, as the reference does: the places a patient
     goes to - home, the services, the doctors, the hospitals, contact - large,
     and the rest (the two About pages) small under them. A
     parent with children is replaced by its children, so both About pages are
     one tap away rather than behind an accordion. */
  const drawerPrimaryItems = navigation.header
    .filter((item) => item.drawerGroup !== "more")
    .flatMap((item) => item.children ?? [item]);
  const drawerMoreItems = navigation.header
    .filter((item) => item.drawerGroup === "more")
    .flatMap((item) => item.children ?? [item]);
  /* The logo is the way home, as it is on the reference, so the capsule does
     not spend a link on it. The drawer keeps Home: a menu the reader opened to
     go somewhere should list everywhere they can go. */
  const desktopNavItems = navigation.header.filter((item) => item.href !== "/");
  const selectedBranch = findBranch(selectedSlug) ?? getPrimaryBranch(branches.items);
  const selectedPhone = getPrimaryPhone(selectedBranch);
  /* The clock is the reader's too: the prerendered menu says nothing about
     whether the OPD is open. */
  const opdState = hydrated ? describeOpd(selectedBranch) : { open: false, label: "" };
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
    setPickerOpen(false);
    setDrawer((current) => (current === "open" ? "closing" : current));
  }, []);

  const selectBranch = useCallback(
    (slug) => {
      setSelectedSlug(slug);
      setOpenMenu(null);
    },
    [setSelectedSlug],
  );

  // Close every menu on navigation, and adopt the branch a page was opened for.
  // Adjusting state during render (rather than in an effect) avoids a flash of stale menus.
  if (locationKey !== syncedLocationKey) {
    setSyncedLocationKey(locationKey);
    setOpenMenu(null);
    setDrawer((current) => (current === "open" ? "closing" : current));
    setPickerOpen(false);
    setPendingHref(null);
    setIsHidden(false);
    setOverFilm(true);
    if (urlBranchSlug && findBranch(urlBranchSlug)) setSelectedSlug(urlBranchSlug);
  }

  /* Never while React is adopting the page: the header holds the build's
     hospital then, and writing it would overwrite the reader's own. */
  useEffect(() => {
    if (hydrated) storeBranch(selectedSlug);
  }, [hydrated, selectedSlug]);

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
  }, [setSelectedSlug]);

  // A menu that is open must never be scrolled off screen, so the handler
  // reads the latest state from a ref rather than resubscribing on every open.
  useEffect(() => {
    menusOpenRef.current = Boolean(openMenu) || drawerShown;
    pickerOpenRef.current = pickerOpen;
  }, [openMenu, drawerShown, pickerOpen]);

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
     paper once the section after it has reached the header's own bottom edge.
     That section is a sheet laid over the foot of the hero with rounded
     shoulders, so its top edge - not the hero's bottom, which sits under the
     sheet - is where the paper starts. The hero is a lazy route module and may
     not exist when this subscribes, so until it does the header stays on
     film, which is what the first screen of `/` is. */
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
      const sheet = hero.nextElementSibling;
      const edge = sheet ? sheet.getBoundingClientRect().top : hero.getBoundingClientRect().bottom;
      setOverFilm(edge > cut + 1);
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

    /* The strip's picker hangs from a bar that scrolls away, so a wheel or
       trackpad scroll closes it; left open it rode up over the sticky header
       and covered the booking pill. The nav menus hang from the header
       itself and stay put. A touch scroll starts with a pointerdown outside,
       which already closes it. */
    const openedAt = window.scrollY;
    function onScroll() {
      if (Math.abs(window.scrollY - openedAt) > 8) setOpenMenu(null);
    }
    const followsStrip = openMenu === "branch-desktop";

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    if (followsStrip) window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      if (followsStrip) window.removeEventListener("scroll", onScroll);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    const panel = drawerRef.current;
    const opener = menuButtonRef.current;
    const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    panel?.focus({ preventScroll: true });

    function onKeyDown(event) {
      if (event.key === "Escape") {
        /* Escape backs out one layer at a time: the picker, then the menu. */
        if (pickerOpenRef.current) {
          setPickerOpen(false);
          /* The menu under the picker is inert until this commits. */
          window.requestAnimationFrame(() => {
            changeButtonRef.current?.focus({ preventScroll: true });
          });
        } else {
          setDrawer("closing");
        }
        return;
      }

      if (event.key !== "Tab") return;

      /* Whichever layer is not in use is inert - the picker while it is down,
         the menu under it while it is up - and its controls stay out of the
         loop. */
      const focusable = Array.from(panel?.querySelectorAll(selector) ?? []).filter(
        (element) => !element.closest("[inert]"),
      );
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

    const list = panel?.querySelector(".hd__sheet-body");
    const onListScroll = () => markMore(list);
    markMore(list);

    /* A phone turned with the menu open has a new farthest corner, and the
       circle that shuts must start from it. */
    const remeasure = () => {
      measureBloom(panel);
      markMore(list);
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", remeasure);
    list?.addEventListener("scroll", onListScroll, { passive: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", remeasure);
      list?.removeEventListener("scroll", onListScroll);
      /* The sheet took focus when it opened; hand it back to the button that
         opened it rather than dropping it on the body. */
      opener?.focus({ preventScroll: true });
    };
  }, [drawerOpen]);

  /* The bloom's animationend hides the sheet once its circle has shut. The
     timer is the fallback for the case where that event never arrives - a tab
     hidden mid-close, say - so the page can never be left under the sheet. */
  useEffect(() => {
    if (drawer !== "closing") return undefined;
    const timer = window.setTimeout(() => {
      setDrawer((current) => (current === "closing" ? "closed" : current));
    }, 900);
    return () => window.clearTimeout(timer);
  }, [drawer]);

  function openDrawer() {
    setOpenMenu(null);
    setPickerOpen(false);
    setPendingHref(null);
    stageReveal(drawerRef.current);
    setDrawer("open");
  }

  /* A link to the page already on screen has nothing to load, so it closes the
     menu at once; any other marks itself and waits for its page. */
  function leaveDrawerFor(href) {
    const target = new URL(href, window.location.origin);
    if (target.pathname + target.search === location.pathname + location.search) {
      closeAll();
      return;
    }
    setPendingHref(href);
  }

  /* Focus follows the picker for a keyboard reader: into the chosen hospital
     when it rises, back onto the card when it drops. preventScroll, because
     the sheet is still travelling. */
  function openPicker() {
    setPickerOpen(true);
    window.requestAnimationFrame(() => {
      pickerRef.current?.querySelector('[aria-checked="true"]')?.focus({ preventScroll: true });
    });
  }

  function closePicker() {
    setPickerOpen(false);
    window.requestAnimationFrame(() => {
      changeButtonRef.current?.focus({ preventScroll: true });
    });
  }

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

  return (
    <>
      {/* The reference's promo band, carrying what a hospital's should: the
          emergency line, and the chosen hospital with its own OPD number. It
          is not sticky - it scrolls away and the capsule stays. */}
      <div className="hd__strip" ref={stripRef}>
        <div className="hd__strip-in">
          <a className="hd__strip-item" href={`tel:${emergencyTel}`}>
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
          isHidden && !openMenu && !drawerShown ? "hd--hidden" : ""
        } ${drawerShown ? "hd--drawer-open" : ""}`}
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
              <CalendarDays size={17} aria-hidden="true" />
              <span>{bookLabel}</span>
            </Link>
          </div>

          {/* The phone's one action is a compact booking pill, on every screen.
              The emergency line is the first thing in the drawer's head. */}
          <div className="hd__mobile-actions">
            <Link className="hd__cta hd__mobile-cta" to={bookHref} aria-label={bookLabel}>
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
              onClick={openDrawer}
            >
              <MenuGlyph />
            </button>
          </div>
        </div>

        {/* The phone menu. It is always mounted and hidden, so opening it is an
            attribute change rather than a React mount - on a phone the mount
            was what stalled the first frames of the opening. A circle of paper
            (the bloom) grows from the menu button and shrinks back into the
            close button, which sits exactly where the menu button was and is
            the same three bars turning into a cross; the content fades in as
            the circle reaches it. Everything that moves is a transform or an
            opacity, so the compositor runs it even while the page underneath
            is busy loading the route the reader chose. */}
        <div
          className="hd__drawer"
          id="hd-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={drawerCopy.label}
          data-state={drawer}
          data-picker={pickerOpen ? "open" : undefined}
          inert={!drawerOpen}
        >
          <span
            className="hd__bloom"
            aria-hidden="true"
            onAnimationEnd={(event) => {
              if (event.animationName === "hd-bloom-shut") setDrawer("closed");
            }}
          />
          <div ref={drawerRef} className="hd__sheet" tabIndex={-1}>
            <div className="hd__sheet-main" inert={pickerOpen}>
              {/* The header's own row, object for object: the logo where the
                  logo was, the emergency line in the booking pill's slot and at
                  its size, and the menu button - now a cross - where it was. */}
              <div className="hd__sheet-head">
                <span className="hd__sheet-rule" aria-hidden="true" data-reveal="" />
                <img
                  src={site.brand.logo}
                  alt={site.brand.logoAlt}
                  width="207"
                  height="50"
                  data-reveal=""
                />
                <div className="hd__sheet-tools">
                  <a
                    className="hd__sheet-urgent"
                    href={`tel:${emergencyTel}`}
                    aria-label={`${emergency.label} ${emergency.phone}`}
                    data-reveal=""
                  >
                    <span className="hd__sheet-beacon" aria-hidden="true" />
                    <span>{emergency.shortLabel}</span>
                  </a>
                  <button
                    className="hd__sheet-close"
                    type="button"
                    aria-label={drawerCopy.closeLabel}
                    onClick={closeAll}
                  >
                    <MenuGlyph />
                  </button>
                </div>
              </div>

              <nav className="hd__sheet-body" aria-label="Mobile">
                {drawerPrimaryItems.map((item) => (
                  <NavLink
                    key={item.href}
                    className="hd__sheet-link"
                    data-reveal=""
                    data-pending={pendingHref === item.href ? "" : undefined}
                    to={item.href}
                    end={item.href === "/"}
                    onClick={() => leaveDrawerFor(item.href)}
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <div className="hd__sheet-more">
                  {drawerMoreItems.map((item) => (
                    <NavLink
                      key={item.href}
                      className="hd__sheet-minor"
                      data-reveal=""
                      data-pending={pendingHref === item.href ? "" : undefined}
                      to={item.href}
                      onClick={() => leaveDrawerFor(item.href)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </nav>

              {/* The dock, where a thumb rests, under a hairline that mirrors
                  the head's: the hospital this reader has chosen, as a labelled
                  field - its name and whether its OPD is open right now, with
                  Change at its end - then the three ways to reach it, and the
                  booking. */}
              <div className="hd__sheet-dock">
                <span className="hd__sheet-rule" aria-hidden="true" data-reveal="" />
                <div className="hd__place">
                  <p className="hd__place-label" id="hd-place-label" data-reveal="">
                    {branchPicker.label}
                  </p>
                  <button
                    ref={changeButtonRef}
                    className="hd__place-field"
                    id="hd-place-field"
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={pickerOpen}
                    aria-controls="hd-drawer-hospitals"
                    aria-labelledby="hd-place-label hd-place-field"
                    data-reveal=""
                    onClick={openPicker}
                  >
                    <MapPin className="hd__place-pin" size={20} aria-hidden="true" />
                    <span className="hd__place-text" key={selectedBranch.slug}>
                      <strong>{selectedBranch.name}</strong>
                      <span className="hd__place-status" data-open={opdState.open ? "" : undefined}>
                        <span className="hd__place-dot" aria-hidden="true" />
                        {opdState.label}
                      </span>
                    </span>
                    <span className="hd__place-change">
                      {branchPicker.changeLabel}
                      <ChevronsUpDown size={17} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  </button>
                </div>

                <div className="hd__place-actions" data-reveal="">
                  <a href={`tel:${cleanTel(selectedPhone)}`}>
                    <Phone size={18} aria-hidden="true" />
                    <span>{drawerCopy.callLabel}</span>
                  </a>
                  <a href={buildWhatsApp(selectedBranch)} target="_blank" rel="noreferrer">
                    <MessageCircle size={18} aria-hidden="true" />
                    <span>{drawerCopy.whatsappLabel}</span>
                  </a>
                  <a href={buildMapLink(selectedBranch)} target="_blank" rel="noreferrer">
                    <Navigation size={17} aria-hidden="true" />
                    <span>{drawerCopy.directionsLabel}</span>
                  </a>
                </div>

                <Link
                  className="hd__sheet-book"
                  data-reveal=""
                  data-pending={pendingHref === bookHref ? "" : undefined}
                  to={bookHref}
                  onClick={() => leaveDrawerFor(bookHref)}
                >
                  <span>{bookLabel}</span>
                  <span className="hd__sheet-book-disc" aria-hidden="true">
                    <ArrowRight size={18} />
                  </span>
                </Link>
              </div>
            </div>

            {/* The hospitals rise from the foot as a sheet of their own over a
                dimmed menu - the picker a phone reader already knows - and
                drop away once one is chosen. The menu underneath never moves. */}
            <div className="hd__picker-scrim" aria-hidden="true" onClick={closePicker} />
            <div
              ref={pickerRef}
              className="hd__picker"
              id="hd-drawer-hospitals"
              role="dialog"
              aria-modal="true"
              aria-labelledby="hd-drawer-hospitals-title"
              inert={!pickerOpen}
            >
              <div className="hd__picker-top">
                <p className="hd__picker-title" id="hd-drawer-hospitals-title">
                  {branchPicker.menuTitle}
                </p>
                <button
                  className="hd__picker-close"
                  type="button"
                  aria-label={drawerCopy.pickerCloseLabel}
                  onClick={closePicker}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="hd__picker-scroll">
                <p className="hd__picker-hint">{branchPicker.menuHint}</p>
                <div
                  className="hd__picker-list"
                  role="radiogroup"
                  aria-labelledby="hd-drawer-hospitals-title"
                >
                  {branches.items.map((branch, index) => (
                    <button
                      key={branch.slug}
                      className="hd__pick"
                      style={{ "--hd-i": index }}
                      type="button"
                      role="radio"
                      aria-checked={branch.slug === selectedSlug}
                      onClick={() => {
                        selectBranch(branch.slug);
                        closePicker();
                      }}
                    >
                      <span className="hd__pick-text">
                        <strong>
                          {branch.name}
                          {branch.isHeadquarters ? (
                            <span className="hd__pick-tag">{drawerCopy.headOfficeLabel}</span>
                          ) : null}
                        </strong>
                        <small>{branch.locality}</small>
                      </span>
                      <span className="hd__pick-ring" aria-hidden="true">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    </button>
                  ))}
                </div>
                <Link
                  className="hd__picker-all"
                  to="/branches"
                  onClick={() => leaveDrawerFor("/branches")}
                >
                  <span>{branchPicker.allLabel}</span>
                  <ChevronRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
