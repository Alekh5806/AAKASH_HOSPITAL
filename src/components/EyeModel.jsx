import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MoveHorizontal } from "lucide-react";
import EyeDiagram from "./EyeDiagram";
import { createEyeRenderer, isEyeModelTooSlow } from "../lib/eyeRenderer";
import { useClientState } from "../lib/hydration";
import { useIntroDone } from "../lib/intro";

const DRAG_START_PX = 6;
/* the name tag sits this far above the pin, and never closer to the frame's
   edge than TAG_EDGE */
const TAG_GAP = 14;
const TAG_EDGE = 6;

const canRender = () =>
  typeof window !== "undefined" && "WebGLRenderingContext" in window && !isEyeModelTooSlow();

/* The eye itself: a real human eye the reader can turn, that turns by itself
 * to show whichever part is asked about - the upper quarter swings open for
 * the lens and the retina, light runs through it for focusing power, the lids
 * close in for the lids - and a pin marks the spot, with the part's name
 * beside it when `label` is given.
 *
 * It takes EyeDiagram's props and keeps EyeDiagram as its fallback, so a
 * browser without WebGL, a GPU that drops the context, or a device too slow
 * to draw it gets the drawing instead of an empty or crawling frame.
 *
 * Hover previews, a tap or click chooses, a drag turns, and none of them
 * navigates. A hover over the model lights the part without turning the eye -
 * turning to a part the pointer is resting on would move it out from under
 * the pointer. The chips remain the real controls: the model is aria-hidden,
 * and everything it can show, a chip can choose. */
export default function EyeModel({
  activePart,
  label,
  onPreviewPart,
  onChoosePart,
  hint,
  hintTouch,
}) {
  const interactive = Boolean(onChoosePart);
  const reduceMotion = Boolean(useReducedMotion());
  const introDone = useIntroDone();
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const pinRef = useRef(null);
  const tagRef = useRef(null);
  const tagSizeRef = useRef({ width: 0, height: 0 });
  const rendererRef = useRef(null);
  const hoverRef = useRef(null);
  const dragRef = useRef(null);
  const pickFrameRef = useRef(0);
  /* The prerendered page carries the drawing, since the build cannot know
     whether the reader's browser draws WebGL; the model takes its place as
     React adopts the page. */
  const [failed, setFailed] = useClientState(() => !canRender(), true);
  const [ready, setReady] = useState(false);

  /* The pin and its tag are written straight to the DOM on every frame the
     model draws: they are a projection of the camera, not something the
     render depends on. The tag centres over the pin, stays inside the frame,
     and drops below the pin when there is no room above it. */
  const placePin = useCallback((point) => {
    const pin = pinRef.current;
    const tag = tagRef.current;
    if (!pin) return;
    if (!point) {
      pin.dataset.on = "false";
      if (tag) tag.dataset.on = "false";
      return;
    }
    pin.style.translate = `${point.x.toFixed(1)}px ${point.y.toFixed(1)}px`;
    pin.dataset.on = "true";
    if (!tag) return;
    const { width, height } = tagSizeRef.current;
    const x = Math.max(TAG_EDGE, Math.min(point.x - width / 2, point.width - width - TAG_EDGE));
    const above = point.y - TAG_GAP - height;
    const y = above >= TAG_EDGE ? above : point.y + TAG_GAP;
    tag.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    tag.dataset.on = "true";
  }, []);

  /* A new name is measured before the next frame places it, and hidden until
     then: the pin has not reached the new part yet. */
  useLayoutEffect(() => {
    const tag = tagRef.current;
    if (!tag) return;
    tagSizeRef.current = { width: tag.offsetWidth, height: tag.offsetHeight };
    tag.dataset.on = "false";
  }, [label]);

  useEffect(() => {
    if (failed) return undefined;
    let renderer;
    try {
      renderer = createEyeRenderer(stageRef.current, {
        reducedMotion: reduceMotion,
        onPin: placePin,
        onFirstFrame: () => setReady(true),
        onFail: () => setFailed(true),
      });
    } catch {
      /* deferred: a state change straight out of an effect's body re-renders
         in the middle of the commit */
      queueMicrotask(() => setFailed(true));
      return undefined;
    }
    rendererRef.current = renderer;

    return () => {
      cancelAnimationFrame(pickFrameRef.current);
      renderer.destroy();
      rendererRef.current = null;
    };
    // The renderer is built once; motion preference changes are passed on below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed, placePin]);

  useEffect(() => {
    rendererRef.current?.setReducedMotion(reduceMotion);
  }, [reduceMotion]);

  /* Drawn only while on screen, and not before the opening curtain has lifted
     - the model's own opening, turning from the reader and swinging open, is
     not spent where nobody can see it. */
  useEffect(() => {
    const root = rootRef.current;
    const renderer = rendererRef.current;
    if (!root || !renderer || !introDone) return undefined;

    let onScreen = false;
    const apply = () => renderer.setVisible(onScreen && document.visibilityState === "visible");
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        apply();
      },
      { rootMargin: "80px 0px" },
    );
    observer.observe(root);
    document.addEventListener("visibilitychange", apply);

    const resize = new ResizeObserver(() => renderer.resize());
    resize.observe(root);

    return () => {
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener("visibilitychange", apply);
      renderer.setVisible(false);
    };
  }, [introDone, failed]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setHighlight(activePart);
    /* lit by the pointer resting on the model: light it, do not turn to it */
    if (activePart && activePart === hoverRef.current) return;
    renderer.setPose(activePart);
  }, [activePart, failed]);

  if (failed) {
    return (
      <EyeDiagram
        activePart={activePart}
        onPreviewPart={onPreviewPart}
        onChoosePart={onChoosePart}
      />
    );
  }

  const localPoint = (event) => {
    const rect = stageRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const setHover = (part) => {
    if (hoverRef.current === part) return;
    hoverRef.current = part;
    rootRef.current.dataset.over = part ? "true" : "false";
    onPreviewPart?.(part);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0 || !rendererRef.current) return;
    dragRef.current = {
      id: event.pointerId,
      type: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
  };

  const onPointerMove = (event) => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const drag = dragRef.current;
    if (drag && drag.id === event.pointerId) {
      if (!drag.moved) {
        const travel = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
        if (travel < DRAG_START_PX) return;
        drag.moved = true;
        rootRef.current.setPointerCapture?.(event.pointerId);
        renderer.setDragging(true);
      }
      /* a finger turns the eye sideways only: up and down belong to the page */
      renderer.rotateBy(event.clientX - drag.x, drag.type === "mouse" ? event.clientY - drag.y : 0);
      drag.x = event.clientX;
      drag.y = event.clientY;
      return;
    }
    if (!interactive || event.pointerType !== "mouse") return;
    /* one pick per frame, however fast the pointer moves */
    if (pickFrameRef.current) return;
    const point = localPoint(event);
    pickFrameRef.current = requestAnimationFrame(() => {
      pickFrameRef.current = 0;
      if (rendererRef.current) setHover(rendererRef.current.pick(point.x, point.y));
    });
  };

  const endDrag = (event, cancelled) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    const renderer = rendererRef.current;
    if (!renderer) return;
    if (drag.moved) {
      renderer.setDragging(false);
      return;
    }
    if (cancelled || !interactive) return;
    const point = localPoint(event);
    const part = renderer.pick(point.x, point.y);
    if (!part) return;
    /* chosen, so the eye may turn to it now */
    hoverRef.current = null;
    onChoosePart(part);
  };

  const onPointerLeave = () => {
    /* a pick still waiting for its frame would light a part after the
       pointer has gone */
    cancelAnimationFrame(pickFrameRef.current);
    pickFrameRef.current = 0;
    rootRef.current.dataset.over = "false";
    if (interactive && hoverRef.current) setHover(null);
  };

  return (
    <div
      className="sv-model"
      ref={rootRef}
      data-ready={ready ? "true" : undefined}
      data-interactive={interactive ? "true" : undefined}
      aria-hidden="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => endDrag(event, false)}
      onPointerCancel={(event) => endDrag(event, true)}
      onPointerLeave={onPointerLeave}
    >
      {/* the renderer puts its canvas first in the stage */}
      <div className="sv-model__stage" ref={stageRef}>
        <span className="sv-model__pin" ref={pinRef} data-on="false" />
        {label ? (
          <span className="sv-model__tag" ref={tagRef} data-on="false">
            {label}
          </span>
        ) : null}
      </div>
      {hint ? (
        <span className="sv-model__hint">
          <MoveHorizontal size={15} aria-hidden="true" />
          <span className="sv-model__hint-fine">{hint}</span>
          <span className="sv-model__hint-touch">{hintTouch ?? hint}</span>
        </span>
      ) : null}
    </div>
  );
}
