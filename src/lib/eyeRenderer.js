import fragmentSource from "./eyeScene.frag";

/* The real eye behind the "where it is in the eye" route and a service's
 * overview: a WebGL canvas that traces the anatomy in one fragment shader.
 *
 * No 3D library. The eye is spheres, ellipsoids, slabs and cylinders, which a
 * shader solves exactly, so the whole model is this file and the shader -
 * about 20KB gzipped with the component - where three.js alone is several
 * times that before a single triangle of anatomy is drawn.
 *
 * It draws only when something moves, and it stops moving by itself. Choosing
 * a part, bringing the eye on screen or letting go of it starts a few seconds
 * of life - the slow sway while nothing is chosen, the breathing glow on a
 * chosen part, the light running along the rays - held to 30 frames a second
 * and then eased to rest, so a reader reading beside it costs the GPU nothing.
 *
 * It is sized to the device it lands on. The first time it is shown it times
 * a small frame and then a real one of its heaviest pose, and draws at the
 * sharpest resolution that fits the frame budget; a GPU too slow for even one
 * CSS pixel per pixel gets the drawing instead. */

const VERTEX = `attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const EYE_PARTS = ["front", "lens", "retina", "nerve", "lids", "muscles", "power"];

const PART_BY_ID = [null, ...EYE_PARTS];

/* Where the camera stands to show each part, and what the model does for it:
   `cut` opens the upper temporal quarter, `lids` draws the lids in, `rays`
   sends light through the opening. Yaw turns from the front toward the
   temporal side (the opened quarter), pitch from level to above. */
const POSES = {
  idle: {
    yaw: 0.8,
    pitch: 0.36,
    dist: 3.55,
    target: [0.02, -0.04, -0.18],
    cut: 1,
    lids: 0,
    rays: 0.5,
    pupil: 0.145,
  },
  /* three-quarters from the temple, so the clear dome stands out in profile
     in front of the iris - seen from straight ahead it is invisible, and a
     pin on it read as a pin on the coloured part */
  front: {
    yaw: 1.32,
    pitch: 0.14,
    dist: 3.3,
    target: [0.05, 0, 0.1],
    cut: 0,
    lids: 0,
    rays: 0,
    pupil: 0.145,
  },
  lens: {
    yaw: 0.9,
    pitch: 0.46,
    dist: 2.95,
    target: [0.06, 0.04, 0.3],
    cut: 1,
    lids: 0,
    rays: 0,
    pupil: 0.145,
  },
  retina: {
    yaw: 0.66,
    pitch: 0.58,
    dist: 3.35,
    target: [0.04, -0.1, -0.15],
    cut: 1,
    lids: 0,
    rays: 0,
    pupil: 0.145,
  },
  /* from the nose side, a little behind: the nerve leaves the back of the eye
     with the cornea still in the picture, so the reader can tell front from
     back - straight from behind it was a ball with a tube */
  nerve: {
    yaw: -1.16,
    pitch: 0.26,
    dist: 3.6,
    target: [-0.3, 0, -0.2],
    cut: 0,
    lids: 0,
    rays: 0,
    pupil: 0.145,
  },
  lids: {
    yaw: 0.2,
    pitch: 0.08,
    dist: 3.25,
    target: [-0.08, 0, 0.3],
    cut: 0,
    lids: 1,
    rays: 0,
    pupil: 0.145,
  },
  muscles: {
    yaw: 1.4,
    pitch: 0.52,
    dist: 3.55,
    target: [0, 0, -0.25],
    cut: 0,
    lids: 0,
    rays: 0,
    pupil: 0.145,
  },
  power: {
    yaw: 1.12,
    pitch: 0.7,
    dist: 3.4,
    target: [0.05, 0, 0.25],
    cut: 1,
    lids: 0,
    rays: 1,
    pupil: 0.145,
  },
};

/* The model opens on the patient looking straight at the reader, then turns
   and opens. */
const INTRO = {
  yaw: 0.12,
  pitch: 0.06,
  dist: 3.35,
  target: [0, 0, 0],
  cut: 0,
  lids: 0,
  rays: 0,
  pupil: 0.21,
};

/* The frame the device is timed on: the fundus close up through the opened
   quarter with the rays at full strength, the most expensive picture the
   model makes. */
const PROBE = { ...POSES.retina, rays: 1 };

/* A point on each part for the pin, with the way that point faces - a pin on
   the far side of the globe is hidden rather than floating over the near one. */
const ANCHORS = {
  front: { at: [0.31, 0, 1.053], facing: [0.5, 0, 0.866] },
  lens: { at: [0.2, 0.002, 0.585], facing: [0.3, 0.9, 0.3] },
  retina: { at: [0.13, -0.13, -0.855], facing: [-0.15, 0.3, 0.95] },
  nerve: { at: [-0.44, 0.15, -1.45], facing: [-0.3, 1, 0] },
  lids: { at: [0, 0.44, 1.1], facing: [0, 0.28, 0.96] },
  muscles: { at: [1.045, 0, -0.05], facing: [1, 0.2, 0] },
  power: { at: [0, 0, -0.871], facing: [0.3, 0.5, 0.8] },
};

const HALF_FOV = 0.38;
const AMBIENT_FRAME_MS = 1000 / 30;
const RETURN_AFTER_MS = 3500;
const PICK_GRID = 11;
const PICK_SPAN_CSS = 44;
/* how long the model stays alive after the last thing that happened to it */
const LIVE_MS = 6000;

/* Device pixels per CSS pixel the model may be drawn at, sharpest first. The
   heaviest pose must fit FRAME_BUDGET_MS at the chosen one; a device that
   needs more than FALLBACK_MS at one pixel per CSS pixel gets the drawing. */
const SCALES = [2, 1.75, 1.5, 1.25, 1];
const FRAME_BUDGET_MS = 12;
const FALLBACK_MS = 40;
const PROBE_W = 96;
const PROBE_H = 72;
const COMPLETION_STATUS_KHR = 0x91b1;

/* Kept for the whole visit, so the shader is compiled and the device timed
   once: a canvas that has left the page is parked here with its context and
   its program, and the next eye to mount takes it. */
let spare = null;
let inUse = 0;
let costPerPixel = null;
let tooSlow = false;

/** True once this device has been found too slow for the model this visit. */
export const isEyeModelTooSlow = () => tooSlow;

const cloneState = (pose) => ({ ...pose, target: [...pose.target] });

const idealScale = () => Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2);

function createEngine() {
  const canvas = document.createElement("canvas");
  canvas.className = "sv-model__canvas";
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    /* a browser that would draw this in software says so here, and the
       reader gets the drawing rather than a model at two frames a second */
    failIfMajorPerformanceCaveat: true,
  });
  if (!gl) throw new Error("eye: no WebGL");
  /* A software renderer that got past that - one a browser was told to use -
     takes seconds to compile this shader, before a frame can even be timed,
     and freezes the page while it does. It is known by its name. */
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const rendererName = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(rendererName)) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    tooSlow = true;
    throw new Error("eye: software renderer");
  }

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const shaders = [compile(gl.VERTEX_SHADER, VERTEX), compile(gl.FRAGMENT_SHADER, fragmentSource)];
  const program = gl.createProgram();
  shaders.forEach((shader) => gl.attachShader(program, shader));
  gl.linkProgram(program);

  const engine = {
    canvas,
    gl,
    program,
    shaders,
    /* with this, whether the compile has finished can be asked without
       waiting for it, so the page never freezes while it runs */
    parallel: Boolean(gl.getExtension("KHR_parallel_shader_compile")),
    linked: false,
    lost: false,
    onLost: null,
  };
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    engine.lost = true;
    engine.onLost?.();
  });
  return engine;
}

/* True once the program can draw, false while it is still compiling, and
   throws if it failed. Nothing asks for the compile's result until it is
   done, which is what keeps the compile off the main thread. */
function link(engine) {
  if (engine.linked) return true;
  const { gl, program } = engine;
  if (engine.parallel && !gl.getProgramParameter(program, COMPLETION_STATUS_KHR)) return false;
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = engine.shaders.map((shader) => gl.getShaderInfoLog(shader)).join(" ");
    throw new Error(`eye shader: ${log} ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  engine.uniforms = {};
  [
    "uRes",
    "uTime",
    "uEye",
    "uRight",
    "uUp",
    "uFwd",
    "uFocal",
    "uCut",
    "uLids",
    "uRays",
    "uDim",
    "uPupil",
    "uPulse",
    "uLive",
    "uQuality",
    "uHiA",
    "uHiB",
    "uPick",
    "uPickOrigin",
    "uPickStep",
  ].forEach((name) => {
    engine.uniforms[name] = gl.getUniformLocation(program, name);
  });

  /* The pointer is answered by the same shader: a small grid of rays around
     the pointer is drawn into an 11x11 target with each pixel carrying the
     part it landed on, and the nearest part to the centre wins. So a pick can
     never disagree with what is on the screen, and a thin part - the nerve
     seen end on, the fovea - is still a 44px target. */
  const pickTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, pickTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    PICK_GRID,
    PICK_GRID,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  engine.pickBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, engine.pickBuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickTexture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  engine.linked = true;
  return true;
}

function discard(engine) {
  engine.onLost = null;
  engine.canvas.remove();
  engine.gl.getExtension("WEBGL_lose_context")?.loseContext();
}

function acquire() {
  const engine = spare;
  spare = null;
  inUse += 1;
  if (engine && !engine.lost && !engine.gl.isContextLost()) return engine;
  try {
    return createEngine();
  } catch (error) {
    inUse -= 1;
    throw error;
  }
}

function release(engine) {
  inUse = Math.max(0, inUse - 1);
  engine.onLost = null;
  engine.canvas.remove();
  if (spare || tooSlow || engine.lost || engine.gl.isContextLost()) {
    discard(engine);
    return;
  }
  spare = engine;
}

/** Starts the shader compiling before the eye is asked for - the reader's
    hand on the "where it is in the eye" route - so the model is ready by the
    time the route has opened. The compile runs in the browser's GPU process;
    nothing waits on it here. */
export function prewarmEyeModel() {
  if (spare || inUse || tooSlow || typeof window === "undefined") return;
  if (!("WebGLRenderingContext" in window)) return;
  try {
    spare = createEngine();
  } catch {
    /* EyeModel finds the same failure when it mounts, and draws instead */
  }
}

/* A critically damped spring: fast, never overshoots, and lands exactly. */
function spring(value, velocity, target, omega, dt) {
  const delta = value - target;
  const temp = (velocity + omega * delta) * dt;
  const decay = Math.exp(-omega * dt);
  return [target + (delta + temp) * decay, (velocity - omega * temp) * decay];
}

function cameraBasis(state) {
  const cp = Math.cos(state.pitch);
  const eye = [
    state.target[0] + state.dist * cp * Math.sin(state.yaw),
    state.target[1] + state.dist * Math.sin(state.pitch),
    state.target[2] + state.dist * cp * Math.cos(state.yaw),
  ];
  const fwd = normalize(sub(state.target, eye));
  const right = normalize(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  return { eye, fwd, right, up };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const normalize = (a) => {
  const length = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / length, a[1] / length, a[2] / length];
};

const focalFor = (pixels) => (0.5 * pixels) / Math.tan(HALF_FOV);

/**
 * Puts the eye's canvas into `stage` and drives it. Throws if WebGL is
 * missing; calls `onFail` if the context is lost or the device turns out too
 * slow, and the caller draws the fallback instead.
 */
export function createEyeRenderer(stage, { reducedMotion = false, onPin, onFirstFrame, onFail } = {}) {
  const engine = acquire();
  const { canvas, gl } = engine;
  stage.prepend(canvas);
  const pickPixels = new Uint8Array(PICK_GRID * PICK_GRID * 4);
  const probePixel = new Uint8Array(4);

  const current = cloneState(INTRO);
  const velocity = {
    yaw: 0,
    pitch: 0,
    dist: 0,
    cut: 0,
    lids: 0,
    rays: 0,
    pupil: 0,
    target: [0, 0, 0],
  };
  let goal = cloneState(POSES.idle);
  const glow = { hi: new Array(7).fill(0), dim: 0 };
  const glowGoal = { hi: new Array(7).fill(0), dim: 0 };

  let still = reducedMotion;
  let scale = idealScale();
  let width = 1;
  let height = 1;
  let cssWidth = 1;
  let cssHeight = 1;
  let visible = false;
  let raf = 0;
  let last = 0;
  let lastDrawn = 0;
  let ambientEvery = AMBIENT_FRAME_MS;
  let clock = 0;
  let introPending = !still;
  let cutHoldUntil = 0;
  let dragging = false;
  let heldUntil = 0;
  let spin = 0;
  let sway = 0;
  let liveUntil = 0;
  let vitality = 0;
  let destroyed = false;
  let failed = false;
  let prepared = false;
  let samples = 0;
  let slowFrames = 0;
  let crawlFrames = 0;
  let lastFrameAt = 0;
  let wakeTimer = 0;
  let drewFirst = false;
  let dirty = false;
  let highlighted = null;

  function fail() {
    if (failed) return;
    failed = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(wakeTimer);
    onFail?.();
  }
  engine.onLost = fail;

  function measure() {
    const rect = canvas.getBoundingClientRect();
    cssWidth = Math.max(rect.width, 1);
    cssHeight = Math.max(rect.height, 1);
    applyScale();
  }

  function applyScale() {
    width = Math.round(cssWidth * scale);
    height = Math.round(cssHeight * scale);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    /* The slow sway and the breathing are drawn at 30 a second, or less
       often on a GPU whose frame is dear, so they never keep it more than
       about 40% busy while the reader scrolls past. */
    const frameCost = costPerPixel === null ? 0 : costPerPixel * width * height;
    ambientEvery = Math.max(AMBIENT_FRAME_MS, frameCost * 2.5);
  }

  /* The sharpest scale whose heaviest frame fits the budget on this device;
     one pixel per CSS pixel if none does but that one is still usable, and
     null if not even that. A monitor at 1x is drawn at 1.5x and scaled down
     when it can afford to be - that is the model's anti-aliasing - and a
     phone's third pixel is never drawn: the eye cannot see it on a moving
     model and it costs more than half the frame. */
  function chooseScale() {
    const area = cssWidth * cssHeight;
    const ideal = idealScale();
    const fits = SCALES.find(
      (candidate) =>
        candidate <= ideal + 1e-3 && costPerPixel * area * candidate * candidate <= FRAME_BUDGET_MS,
    );
    if (fits) return fits;
    return costPerPixel * area <= FALLBACK_MS ? 1 : null;
  }

  /* The milliseconds one frame of the heaviest pose takes at w x h. Waiting
     for the GPU means a readPixels, and in Safari that is a round trip to
     its GPU process that costs more than a whole frame of this shader - so
     one frame and then three are timed, and the difference is the frames
     alone. The probe goes to the canvas and the real frame is drawn over it
     before the browser shows either. */
  function probe(w, h) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    upload(cameraBasis(PROBE), 0, false, PROBE, w, h, true);
    const run = (count) => {
      const start = performance.now();
      for (let index = 0; index < count; index += 1) gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, probePixel);
      return performance.now() - start;
    };
    /* the first draw at a size pays for setting it up */
    run(1);
    const one = run(1);
    const three = run(3);
    return Math.max(three - one, 0) / 2;
  }

  /* Timed once a visit. A small frame first says whether a real one is worth
     asking for at all - on a software renderer a full frame of this shader
     takes seconds - and which scale to time it at; then real frames at that
     scale give the cost of a pixel. */
  function calibrate() {
    measure();
    if (costPerPixel === null) {
      const rough = probe(PROBE_W, PROBE_H) / (PROBE_W * PROBE_H);
      const area = cssWidth * cssHeight;
      if (rough * area > FALLBACK_MS * 4) return null;
      const ideal = idealScale();
      scale =
        SCALES.find(
          (candidate) =>
            candidate <= ideal + 1e-3 && rough * area * candidate * candidate <= FRAME_BUDGET_MS * 3,
        ) ?? 1;
      applyScale();
      costPerPixel = probe(width, height) / (width * height);
    }
    return chooseScale();
  }

  function prepare() {
    try {
      if (!link(engine)) return false;
    } catch {
      fail();
      return false;
    }
    const chosen = calibrate();
    if (!chosen) {
      tooSlow = true;
      fail();
      return false;
    }
    scale = chosen;
    applyScale();
    prepared = true;
    return true;
  }

  function camera() {
    const state = { ...current, yaw: current.yaw + sway, target: current.target };
    return cameraBasis(state);
  }

  function upload(basis, time, pick, state = current, w = width, h = height, probing = false) {
    const { uniforms } = engine;
    const live = probing ? 1 : vitality;
    gl.uniform2f(uniforms.uRes, w, h);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform3fv(uniforms.uEye, basis.eye);
    gl.uniform3fv(uniforms.uRight, basis.right);
    gl.uniform3fv(uniforms.uUp, basis.up);
    gl.uniform3fv(uniforms.uFwd, basis.fwd);
    gl.uniform1f(uniforms.uFocal, focalFor(Math.min(w, h)));
    gl.uniform1f(uniforms.uCut, state.cut);
    gl.uniform1f(uniforms.uLids, state.lids);
    gl.uniform1f(uniforms.uRays, state.rays);
    gl.uniform1f(uniforms.uDim, probing ? 0 : glow.dim);
    gl.uniform1f(uniforms.uPupil, state.pupil + Math.sin(time * 1.25) * 0.006 * live);
    gl.uniform1f(uniforms.uPulse, 0.5 + 0.5 * Math.sin(time * 2.4) * live);
    gl.uniform1f(uniforms.uLive, live);
    /* the soft shadows go with the first step down from the sharpest scale */
    gl.uniform1f(uniforms.uQuality, probing || scale >= idealScale() - 1e-3 ? 1 : 0);
    const hi = probing ? [0, 0, 0, 0, 0, 0, 0] : glow.hi;
    gl.uniform4f(uniforms.uHiA, hi[0], hi[1], hi[2], hi[3]);
    gl.uniform4f(uniforms.uHiB, hi[4], hi[5], hi[6], 0);
    gl.uniform1f(uniforms.uPick, pick ? 1 : 0);
  }

  function draw(time) {
    const basis = camera();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    upload(basis, time, false);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    placePin(basis);
    if (!drewFirst) {
      drewFirst = true;
      onFirstFrame?.();
    }
  }

  function project(point, basis) {
    const rel = sub(point, basis.eye);
    const z = dot(rel, basis.fwd);
    if (z <= 0.01) return null;
    const focal = focalFor(Math.min(cssWidth, cssHeight));
    return {
      x: cssWidth / 2 + (focal * dot(rel, basis.right)) / z,
      y: cssHeight / 2 - (focal * dot(rel, basis.up)) / z,
    };
  }

  function placePin(basis) {
    if (!onPin) return;
    const anchor = highlighted ? ANCHORS[highlighted] : null;
    const strength = highlighted ? glow.hi[EYE_PARTS.indexOf(highlighted)] : 0;
    if (!anchor || strength < 0.5) {
      onPin(null);
      return;
    }
    const toCamera = normalize(sub(basis.eye, anchor.at));
    const facing = dot(normalize(anchor.facing), toCamera);
    const needsCut = highlighted === "lens" || highlighted === "retina" || highlighted === "power";
    const hidden =
      facing < 0.08 ||
      (needsCut && current.cut < 0.6) ||
      (highlighted === "lids" && current.lids < 0.6);
    const point = hidden ? null : project(anchor.at, basis);
    onPin(
      point && point.x > 0 && point.x < cssWidth && point.y > 0 && point.y < cssHeight
        ? { ...point, width: cssWidth, height: cssHeight }
        : null,
    );
  }

  function settled(held) {
    const close = (a, b) => Math.abs(a - b) < 5e-4;
    const pose =
      (held || (close(current.yaw, goal.yaw) && close(current.pitch, goal.pitch))) &&
      close(current.pupil, goal.pupil) &&
      close(current.dist, goal.dist) &&
      close(current.cut, goal.cut) &&
      close(current.lids, goal.lids) &&
      close(current.rays, goal.rays) &&
      current.target.every((value, index) => close(value, goal.target[index]));
    const lit =
      glow.hi.every((value, index) => close(value, glowGoal.hi[index])) &&
      close(glow.dim, glowGoal.dim);
    return pose && lit && Math.abs(spin) < 1e-3;
  }

  function step(dt, now) {
    if (still) {
      /* no animation, but a reader who turns the eye by hand keeps it where
         they left it until they choose another part */
      const held = dragging || now < heldUntil;
      const { yaw, pitch } = current;
      Object.assign(current, cloneState(goal));
      if (held) Object.assign(current, { yaw, pitch });
      glow.hi = [...glowGoal.hi];
      glow.dim = glowGoal.dim;
      vitality = 0;
      return;
    }
    /* One slow step for the camera, a quicker one for the light: the part is
       lit while the eye is still turning toward it. */
    const held = dragging || now < heldUntil;
    const turn = 4.2;
    if (!held) {
      [current.yaw, velocity.yaw] = spring(current.yaw, velocity.yaw, goal.yaw, turn, dt);
      [current.pitch, velocity.pitch] = spring(current.pitch, velocity.pitch, goal.pitch, turn, dt);
      spin = 0;
    } else {
      /* a flick keeps turning the eye for a moment after the finger lifts */
      if (!dragging) current.yaw += spin * dt;
      spin *= Math.exp(-5 * dt);
      velocity.yaw = 0;
      velocity.pitch = 0;
    }
    [current.dist, velocity.dist] = spring(current.dist, velocity.dist, goal.dist, turn, dt);
    for (let axis = 0; axis < 3; axis += 1) {
      [current.target[axis], velocity.target[axis]] = spring(
        current.target[axis],
        velocity.target[axis],
        goal.target[axis],
        turn,
        dt,
      );
    }
    if (now >= cutHoldUntil) {
      [current.cut, velocity.cut] = spring(current.cut, velocity.cut, goal.cut, 3.6, dt);
    }
    [current.lids, velocity.lids] = spring(current.lids, velocity.lids, goal.lids, 3.8, dt);
    [current.rays, velocity.rays] = spring(current.rays, velocity.rays, goal.rays, 3.2, dt);
    [current.pupil, velocity.pupil] = spring(current.pupil, velocity.pupil, goal.pupil, 2.4, dt);
    const fade = 1 - Math.exp(-9 * dt);
    glow.hi = glow.hi.map((value, index) => value + (glowGoal.hi[index] - value) * fade);
    glow.dim += (glowGoal.dim - glow.dim) * fade;

    /* Alive for a few seconds after something happens, then easing to rest:
       the sway, the breathing and the running light all scale with it. */
    const lively = now < liveUntil ? 1 : 0;
    vitality += (lively - vitality) * (1 - Math.exp(-2 * dt));

    /* While nothing is chosen the eye turns slowly to and fro - the one
       invitation on an untouched model - and settles the moment it is not. */
    const swayGoal = !highlighted && !held ? 0.26 * Math.sin(clock * 0.32) * vitality : 0;
    sway += (swayGoal - sway) * (1 - Math.exp(-2.2 * dt));
  }

  function ambient() {
    if (still) return false;
    return vitality > 0.003 || Math.abs(sway) > 3e-4;
  }

  function loop(now) {
    raf = 0;
    if (destroyed || failed || !visible) return;
    if (!prepared && !prepare()) {
      /* still compiling: ask again next frame */
      if (!failed) raf = requestAnimationFrame(loop);
      return;
    }
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
    last = now;
    clock += dt;
    step(dt, now);
    const held = dragging || now < heldUntil;
    const moving = !settled(held);
    if (moving || dirty || now - lastDrawn >= ambientEvery - 2) {
      draw(clock);
      adapt(now, moving);
      lastDrawn = now;
      dirty = false;
    }
    if (failed) return;
    if (moving || ambient()) {
      raf = requestAnimationFrame(loop);
    } else if (now < heldUntil && Number.isFinite(heldUntil)) {
      /* nothing to draw until the eye starts back toward its pose */
      wakeTimer = window.setTimeout(wake, heldUntil - now + 16);
    }
  }

  /* The safety net under the timing: a GPU that turns out slower than it
     timed shows up as long gaps between frames while the eye is turning.
     Resolution steps down a scale at a time, and a device still crawling at
     one pixel per CSS pixel gets the drawing. The first frame after a wake
     is not counted - its gap is the time the model spent asleep. */
  function adapt(now, moving) {
    const gap = now - lastFrameAt;
    const counted = moving && lastFrameAt > 0;
    lastFrameAt = now;
    if (!counted) return;
    samples += 1;
    if (gap > 34) slowFrames += 1;
    if (gap > 60) crawlFrames += 1;
    if (samples < 20) return;
    if (slowFrames > 12) {
      const lower = SCALES.find((candidate) => candidate < scale - 1e-3);
      if (lower) {
        costPerPixel *= (scale / lower) ** 2;
        scale = lower;
        applyScale();
        dirty = true;
      } else if (crawlFrames > 15) {
        tooSlow = true;
        fail();
      }
    }
    samples = 0;
    slowFrames = 0;
    crawlFrames = 0;
  }

  function wake() {
    window.clearTimeout(wakeTimer);
    if (!raf && visible && !destroyed && !failed) {
      last = 0;
      lastFrameAt = 0;
      raf = requestAnimationFrame(loop);
    }
  }

  function liven() {
    if (!still) liveUntil = performance.now() + LIVE_MS;
  }

  function setPose(part) {
    const next = cloneState(POSES[part] ?? POSES.idle);
    /* the shortest way round to the new yaw */
    const turns = Math.round((current.yaw - next.yaw) / (Math.PI * 2));
    next.yaw += turns * Math.PI * 2;
    goal = next;
    heldUntil = 0;
    liven();
    wake();
  }

  function setHighlight(part) {
    const next = part && EYE_PARTS.includes(part) ? part : null;
    if (next !== highlighted) liven();
    highlighted = next;
    glowGoal.hi = EYE_PARTS.map((id) => (id === highlighted ? 1 : 0));
    glowGoal.dim = highlighted ? 1 : 0;
    wake();
  }

  function setVisible(next) {
    const arriving = next && !visible;
    visible = next;
    if (!visible) return;
    if (introPending) {
      introPending = false;
      cutHoldUntil = performance.now() + 420;
    }
    if (arriving) liven();
    wake();
  }

  function rotateBy(dx, dy) {
    current.yaw -= dx * 0.009;
    current.pitch = Math.min(1.25, Math.max(-0.6, current.pitch + dy * 0.006));
    if (!still) spin = -dx * 0.009 * 60;
    dirty = true;
    wake();
  }

  /* After a drag the eye waits where the reader left it, then turns back to
     the part it is showing, so the answer is never left facing away. */
  function setDragging(next) {
    dragging = next;
    if (!next) {
      heldUntil = still ? Infinity : performance.now() + RETURN_AFTER_MS;
      liveUntil = heldUntil + LIVE_MS;
    }
    wake();
  }

  function pick(cssX, cssY) {
    if (!prepared || failed) return null;
    const basis = camera();
    const span = PICK_SPAN_CSS * scale;
    const stepPx = span / PICK_GRID;
    const px = cssX * scale;
    const py = (cssHeight - cssY) * scale;
    gl.bindFramebuffer(gl.FRAMEBUFFER, engine.pickBuffer);
    gl.viewport(0, 0, PICK_GRID, PICK_GRID);
    upload(basis, clock, true);
    gl.uniform2f(engine.uniforms.uPickOrigin, px - span / 2, py - span / 2);
    gl.uniform1f(engine.uniforms.uPickStep, stepPx);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, PICK_GRID, PICK_GRID, gl.RGBA, gl.UNSIGNED_BYTE, pickPixels);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniform1f(engine.uniforms.uPick, 0);

    const middle = (PICK_GRID - 1) / 2;
    let found = null;
    let nearest = Infinity;
    for (let row = 0; row < PICK_GRID; row += 1) {
      for (let col = 0; col < PICK_GRID; col += 1) {
        const id = pickPixels[(row * PICK_GRID + col) * 4];
        if (!id || id >= PART_BY_ID.length) continue;
        const distance = (row - middle) ** 2 + (col - middle) ** 2;
        if (distance < nearest) {
          nearest = distance;
          found = PART_BY_ID[id];
        }
      }
    }
    return found;
  }

  function setReducedMotion(next) {
    still = next;
    if (still) {
      introPending = false;
      sway = 0;
      spin = 0;
      vitality = 0;
    }
    wake();
  }

  /* A resize keeps the device's timing and only re-picks the scale: a phone
     turned sideways has a bigger canvas, and the same scale would cost more. */
  function resize() {
    measure();
    if (!prepared) return;
    scale = chooseScale() ?? 1;
    applyScale();
    if (visible && !failed) {
      draw(clock);
      wake();
    }
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
    window.clearTimeout(wakeTimer);
    release(engine);
  }

  if (still) Object.assign(current, cloneState(goal));
  measure();

  return {
    setPose,
    setHighlight,
    setVisible,
    rotateBy,
    setDragging,
    pick,
    setReducedMotion,
    resize,
    destroy,
  };
}
