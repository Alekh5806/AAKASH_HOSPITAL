import { useCallback, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* Brings a keyboard-focused tile clear of the rail's fades. The browser's
   `nearest` leaves a tile alone once it is inside the rail's box, even under a
   fade, and the rail snaps - a scroll to anywhere but a snap stop is pulled
   back to the stop it came from. So the rail moves to the first stop (a
   tile's start at the scroll padding, which is the fades' width) that clears
   the tile. */
function clearOfFades(node) {
  const list = node.parentElement;
  const style = window.getComputedStyle(list);
  const padStart = parseFloat(style.scrollPaddingLeft) || 0;
  const padEnd = parseFloat(style.scrollPaddingRight) || 0;
  const box = list.getBoundingClientRect();
  const at = (element) => element.getBoundingClientRect().left - box.left + list.scrollLeft;
  const left = at(node);
  const right = left + node.offsetWidth;
  const view = list.scrollLeft;
  let target = view;
  if (right > view + list.clientWidth - padEnd) {
    const need = right - (list.clientWidth - padEnd);
    const stops = [...list.children].map((tile) => Math.max(0, at(tile) - padStart));
    target = stops.find((stop) => stop >= need) ?? list.scrollWidth;
  } else if (left < view + padStart) {
    target = Math.max(0, left - padStart);
  }
  if (target !== view) list.scrollLeft = target;
}

/* One choice from a short list, as a radio group of chips.
 *
 * The booking flow asks four of its five questions this way - which hospital,
 * what for, which day, what time - so the group is built once. It is a real
 * radio group: `role="radio"` with `aria-checked`, a roving tabstop, and the
 * arrow keys walking the list the way a native group does. The chosen chip's
 * tint is one element that travels (`layoutId`), the site's pill device, and
 * a ring at the chip's edge fills and draws a check so "this one" is never
 * only a colour.
 *
 * `groups` lets the options be read in runs under a heading - the reasons for
 * a visit are grouped by kind of care - while the keyboard still walks one
 * flat list. What a chip says is up to the caller (`renderOption`); the shape
 * is chosen with `data-shape`. The `tile` shape is a rail that scrolls
 * sideways, and it fades at an end only where there is more past it. */
export default function ChoiceGroup({
  id,
  label,
  groups,
  value,
  onChange,
  renderOption,
  shape = "row",
  className = "",
  describedBy,
}) {
  const shouldReduceMotion = useReducedMotion();
  const nodes = useRef({});
  /* Chips take the panel's named states so a step assembles chip by chip
     behind its head rather than landing as one block. */
  const chip = shouldReduceMotion
    ? undefined
    : {
        enter: { opacity: 0, y: 10, scale: 0.98 },
        center: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0 },
      };
  const options = groups.flatMap((group) => group.options);
  const checkedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === value),
  );

  /* The rail's ends: written straight to the DOM from a passive scroll
     listener - a measurement of the scroller, not render state. */
  const watchEdges = useCallback((list) => {
    if (!list) return undefined;
    const sync = () => {
      const max = list.scrollWidth - list.clientWidth;
      list.dataset.start = list.scrollLeft > 4 ? "true" : "false";
      list.dataset.end = max > 4 && list.scrollLeft < max - 4 ? "true" : "false";
    };
    sync();
    list.addEventListener("scroll", sync, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    observer?.observe(list);
    return () => {
      list.removeEventListener("scroll", sync);
      observer?.disconnect();
    };
  }, []);

  const onKeyDown = (event) => {
    let target = null;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      target = options[(checkedIndex + 1) % options.length];
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      target = options[(checkedIndex - 1 + options.length) % options.length];
    } else if (event.key === "Home") {
      target = options[0];
    } else if (event.key === "End") {
      target = options[options.length - 1];
    }
    if (!target) return;
    event.preventDefault();
    onChange(target.id);
    /* Chrome only scrolls a focused element into view when none of it is
       showing, so a chip half off the screen, or a tile peeking at the
       rail's edge, would stay half hidden. */
    const node = nodes.current[target.id];
    if (!node) return;
    node.focus({ preventScroll: true });
    if (shape === "tile") clearOfFades(node);
    else node.scrollIntoView({ block: "nearest" });
  };

  return (
    <div
      className={`ap-choice ${className}`.trim()}
      data-shape={shape}
      role="radiogroup"
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-describedby={describedBy}
      onKeyDown={onKeyDown}
    >
      {label ? (
        <p className="ap-choice__label e-label" id={`${id}-label`}>
          {label}
        </p>
      ) : null}
      {groups.map((group) => (
        <div className="ap-choice__group" key={group.id ?? group.label ?? "all"}>
          {group.label ? <p className="ap-choice__heading">{group.label}</p> : null}
          <div className="ap-choice__list" ref={shape === "tile" ? watchEdges : undefined}>
            {group.options.map((option) => {
              const checked = option.id === value;
              const tabbable =
                checked || (!value && options[checkedIndex]?.id === option.id);
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  className="ap-chip"
                  role="radio"
                  aria-checked={checked}
                  tabIndex={tabbable ? 0 : -1}
                  data-on={checked ? "true" : undefined}
                  data-tone={option.tone}
                  ref={(node) => {
                    nodes.current[option.id] = node;
                  }}
                  onClick={() => onChange(option.id)}
                  variants={chip}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                >
                  {checked ? (
                    <motion.span
                      className="ap-chip__bg"
                      layoutId={`${id}-bg`}
                      aria-hidden="true"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 38 }
                      }
                    />
                  ) : null}
                  <span className="ap-chip__body">{renderOption(option, checked)}</span>
                  <span className="ap-chip__mark" aria-hidden="true" />
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
