// The human eye, traced analytically: every body in the eye is a sphere, an
// ellipsoid, a slab, a cylinder or the space between two of them, so a ray is
// solved exactly rather than marched. That is what lets a phone draw a globe,
// a cornea, an iris, a lens and a fundus at full resolution. Only the four
// recti - bands whose thickness changes along their length - are marched, and
// only inside the thin shell they live in.
//
// Units: the globe's outer radius is 1 (about 12 mm). The eye looks along +z,
// up is +y, and nasal is -x: a left eye, seen by someone facing the patient.
// The segment that swings open is the upper temporal quarter (x > 0, y > 0).

precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uEye;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uFwd;
uniform float uFocal;
uniform float uCut;
uniform float uLids;
uniform float uRays;
uniform float uDim;
uniform float uPupil;
uniform float uPulse;
// 1 while the model is alive, easing to 0 as it comes to rest: the light
// running along the rays and the tear running down the duct go with it.
uniform float uLive;
uniform float uQuality;
uniform vec4 uHiA; // front, lens, retina, nerve
uniform vec4 uHiB; // lids, muscles, power
uniform float uPick;
uniform vec2 uPickOrigin;
uniform float uPickStep;

#define BIG 1e6
#define EPS 1e-4
#define HALF_PI 1.5707963

// ---------- anatomy ----------

const float R_OUT = 1.0;
const float R_IN = 0.875;
const float R_CHOROID = 0.935;
const float R_RPE = 0.905;
const vec3 OPEN_C = vec3(0.0, 0.0, 1.35);
const float OPEN_R = 0.7186;

const vec3 CORNEA_C = vec3(0.0, 0.0, 0.516);
const float CORNEA_R = 0.62;
const vec3 CORNEA_IC = vec3(0.0, 0.0, 0.506);
const float CORNEA_IR = 0.585;
const float CORNEA_Z = 0.83;

const float IRIS_Z0 = 0.765;
const float IRIS_Z1 = 0.8;
const float IRIS_R = 0.515;

const float CIL_Z0 = 0.585;
const float CIL_Z1 = 0.748;
const float CIL_R0 = 0.425;
const float CIL_R1 = 0.8;

const vec3 LENS_C = vec3(0.0, 0.0, 0.585);
const vec3 LENS_R = vec3(0.37, 0.37, 0.17);

const vec3 NERVE_A = vec3(-0.2265, 0.0, -0.871);
const vec3 NERVE_B = vec3(-0.639, 0.024, -2.05);
const float NERVE_R = 0.135;

const vec3 LID_C = vec3(0.0, 0.0, -1.3);
const float LID_R = 2.47;

const vec2 DISC = vec2(-0.235, 0.018);
const vec2 FOVEA = vec2(0.0, 0.0);

// ---------- materials ----------
// Solid surfaces carry a material number; the part a surface belongs to is
// derived from it, so the highlight, the ghosting and the pointer all agree.

const float M_SCLERA = 1.0;
const float M_CUT = 2.0;
const float M_INNER = 3.0;
const float M_RIM = 4.0;
const float M_IRIS = 5.0;
const float M_PUPIL = 6.0;
const float M_IRIS_CUT = 7.0;
const float M_CILIARY = 8.0;
const float M_CILIARY_CUT = 9.0;
const float M_NERVE = 10.0;
const float M_NERVE_CAP = 11.0;
const float M_MUSCLE = 12.0;

// ---------- small helpers ----------

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash13(i);
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
  return mix(
    mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
    mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
    f.z
  );
}

float fbm2(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    sum += amp * noise2(p);
    p = p * 2.03 + vec2(17.1, 9.3);
    amp *= 0.5;
  }
  return sum;
}

float fbm3(vec3 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 3; i++) {
    sum += amp * noise3(p);
    p = p * 2.07 + vec3(5.3, 11.7, 3.1);
    amp *= 0.5;
  }
  return sum;
}

float lum(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

bool within(float t, vec2 iv) {
  return t > iv.x + EPS && t < iv.y - EPS;
}

vec2 sphereIv(vec3 ro, vec3 rd, vec3 c, float r) {
  vec3 oc = ro - c;
  float b = dot(oc, rd);
  float h = b * b - (dot(oc, oc) - r * r);
  if (h < 0.0) return vec2(BIG, -BIG);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

vec2 ellipsoidIv(vec3 ro, vec3 rd, vec3 c, vec3 r) {
  vec3 ocn = (ro - c) / r;
  vec3 rdn = rd / r;
  float a = dot(rdn, rdn);
  float b = dot(ocn, rdn);
  float h = b * b - a * (dot(ocn, ocn) - 1.0);
  if (h < 0.0) return vec2(BIG, -BIG);
  h = sqrt(h);
  return vec2((-b - h) / a, (-b + h) / a);
}

vec2 slabIv(vec3 ro, vec3 rd, float z0, float z1) {
  if (abs(rd.z) < 1e-6) {
    return (ro.z > z0 && ro.z < z1) ? vec2(-BIG, BIG) : vec2(BIG, -BIG);
  }
  float ta = (z0 - ro.z) / rd.z;
  float tb = (z1 - ro.z) / rd.z;
  return vec2(min(ta, tb), max(ta, tb));
}

// an infinite cylinder around the z axis
vec2 cylinderIv(vec3 ro, vec3 rd, float r) {
  float a = dot(rd.xy, rd.xy);
  float b = dot(ro.xy, rd.xy);
  float c = dot(ro.xy, ro.xy) - r * r;
  if (a < 1e-9) return c < 0.0 ? vec2(-BIG, BIG) : vec2(BIG, -BIG);
  float h = b * b - a * c;
  if (h < 0.0) return vec2(BIG, -BIG);
  h = sqrt(h);
  return vec2((-b - h) / a, (-b + h) / a);
}

// The removed segment is the region y > 0 and on the far side of a plane that
// turns about the visual axis with uCut - at 0 nothing is removed, at 1 the
// whole upper temporal quarter is. Both are half-spaces, so the segment is
// convex and a ray crosses it in one interval. `exitN` is the cut face the ray
// meets as it leaves the segment, which is the face it sees.
vec2 clipHalf(vec2 iv, float o, float d, vec3 n, inout vec3 exitN) {
  if (abs(d) < 1e-7) return o >= 0.0 ? iv : vec2(BIG, -BIG);
  float t = -o / d;
  if (d > 0.0) {
    iv.x = max(iv.x, t);
  } else if (t < iv.y) {
    iv.y = t;
    exitN = n;
  }
  return iv;
}

vec2 cutPlane() {
  float phi = uCut * HALF_PI;
  return vec2(sin(phi), -cos(phi));
}

vec2 segmentIv(vec3 ro, vec3 rd, out vec3 exitN) {
  exitN = vec3(0.0, 1.0, 0.0);
  if (uCut < 0.002) return vec2(BIG, -BIG);
  vec2 n2 = cutPlane();
  vec2 iv = vec2(-BIG, BIG);
  iv = clipHalf(iv, ro.y, rd.y, vec3(0.0, 1.0, 0.0), exitN);
  iv = clipHalf(iv, dot(ro.xy, n2), dot(rd.xy, n2), vec3(n2, 0.0), exitN);
  return iv;
}

bool inSegment(vec3 p) {
  if (uCut < 0.002) return false;
  return p.y > 0.0 && dot(p.xy, cutPlane()) > 0.0;
}

// ---------- the solid scene ----------

struct Hit {
  float t;
  vec3 n;
  float mat;
};

void keep(inout Hit best, float t, vec3 n, float mat) {
  if (t > EPS && t < best.t) {
    best.t = t;
    best.n = n;
    best.mat = mat;
  }
}

// The globe's wall: the shell between the outer and inner spheres, open at the
// front where the cornea takes over, less the segment.
void traceWall(vec3 ro, vec3 rd, vec2 seg, vec3 segN, inout Hit best) {
  vec2 o = sphereIv(ro, rd, vec3(0.0), R_OUT);
  if (o.y < 0.0) return;
  vec2 i = sphereIv(ro, rd, vec3(0.0), R_IN);
  vec2 b = sphereIv(ro, rd, OPEN_C, OPEN_R);

  float t = o.x;
  if (!within(t, i) && !within(t, b) && !within(t, seg)) {
    vec3 p = ro + rd * t;
    keep(best, t, normalize(p), M_SCLERA);
  }
  t = i.y;
  if (within(t, o) && !within(t, b) && !within(t, seg)) {
    vec3 p = ro + rd * t;
    keep(best, t, -normalize(p), M_INNER);
  }
  t = b.y;
  if (within(t, o) && !within(t, i) && !within(t, seg)) {
    vec3 p = ro + rd * t;
    keep(best, t, normalize(OPEN_C - p), M_RIM);
  }
  t = seg.y;
  if (within(t, o) && !within(t, i) && !within(t, b)) {
    keep(best, t, segN, M_CUT);
  }
}

// a ring: a slab between two planes, outside one cylinder and inside another
void traceRing(
  vec3 ro, vec3 rd, vec2 seg, vec3 segN,
  float z0, float z1, float r0, float r1, float faceMat, float innerMat, float cutMat,
  bool clipToGlobe, inout Hit best
) {
  vec2 s = slabIv(ro, rd, z0, z1);
  if (s.y < 0.0 || s.x > best.t) return;
  vec2 outer = cylinderIv(ro, rd, r1);
  vec2 hole = cylinderIv(ro, rd, r0);
  vec2 globe = clipToGlobe ? sphereIv(ro, rd, vec3(0.0), 0.99) : vec2(-BIG, BIG);

  float t = s.x;
  if (within(t, outer) && !within(t, hole) && !within(t, seg) && within(t, globe)) {
    keep(best, t, vec3(0.0, 0.0, rd.z < 0.0 ? 1.0 : -1.0), faceMat);
  }
  t = hole.y;
  if (within(t, s) && within(t, outer) && !within(t, seg) && within(t, globe)) {
    vec3 p = ro + rd * t;
    keep(best, t, vec3(-normalize(p.xy), 0.0), innerMat);
  }
  t = seg.y;
  if (within(t, s) && within(t, outer) && !within(t, hole) && within(t, globe)) {
    keep(best, t, segN, cutMat);
  }
}

// iq's capped cylinder
vec4 capsuleCylinder(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float ra) {
  vec3 ba = pb - pa;
  vec3 oc = ro - pa;
  float baba = dot(ba, ba);
  float bard = dot(ba, rd);
  float baoc = dot(ba, oc);
  float k2 = baba - bard * bard;
  float k1 = baba * dot(oc, rd) - baoc * bard;
  float k0 = baba * dot(oc, oc) - baoc * baoc - ra * ra * baba;
  float h = k1 * k1 - k2 * k0;
  if (h < 0.0) return vec4(-1.0);
  h = sqrt(h);
  float t = (-k1 - h) / k2;
  float y = baoc + t * bard;
  if (y > 0.0 && y < baba) return vec4(t, (oc + t * rd - ba * y / baba) / ra);
  t = (((y < 0.0) ? 0.0 : baba) - baoc) / bard;
  if (abs(k1 + k2 * t) < h) return vec4(t, ba * sign(y) / sqrt(baba));
  return vec4(-1.0);
}

// ---------- the four recti ----------
// Each is a band lying on the globe along its meridian: a thin white tendon at
// its insertion, thickening into the red belly, cut off behind the equator the
// way an anatomical model shows them. Their insertions follow the spiral of
// Tillaux - medial nearest the cornea, superior furthest.

float muscleField(vec3 p) {
  float r = length(p);
  float az = atan(p.y, p.x);
  float k = floor(az / HALF_PI + 0.5);
  float dpsi = az - k * HALF_PI;
  float th = acos(clamp(p.z / max(r, 1e-4), -1.0, 1.0));
  float ins = k > 0.5 && k < 1.5 ? 1.19 : (abs(k) > 1.5 ? 0.995 : (k < -0.5 ? 1.08 : 1.12));
  float grow = smoothstep(ins, ins + 0.5, th);
  float h = mix(0.006, 0.068, grow) * (1.0 - 0.2 * smoothstep(1.7, 2.2, th));
  float w = mix(0.13, 0.27, smoothstep(ins, ins + 0.36, th));
  float across = abs(dpsi) * r * sin(th);
  float lat = across - w;
  // a belly, not a strap: thickest down the middle, thinning to its edges
  float profile = sqrt(max(1.0 - (across / w) * (across / w), 0.0));
  float rad = r - (1.0 + h * (0.35 + 0.65 * profile));
  float span = max(ins - th, th - 2.2) * r;
  float d = max(max(rad, lat), span);
  d = max(d, 0.995 - r);
  if (uCut > 0.002) {
    d = max(d, min(p.y, dot(p.xy, cutPlane())));
  }
  return d;
}

void traceMuscles(vec3 ro, vec3 rd, inout Hit best) {
  vec2 shell = sphereIv(ro, rd, vec3(0.0), 1.065);
  if (shell.y < 0.0 || shell.x > best.t) return;
  float t = max(shell.x, 0.0);
  float tEnd = min(shell.y, best.t);
  for (int i = 0; i < 28; i++) {
    vec3 p = ro + rd * t;
    float d = muscleField(p);
    if (d < 0.0009) {
      vec2 e = vec2(0.0015, -0.0015);
      vec3 n = normalize(
        e.xyy * muscleField(p + e.xyy) +
        e.yyx * muscleField(p + e.yyx) +
        e.yxy * muscleField(p + e.yxy) +
        e.xxx * muscleField(p + e.xxx)
      );
      keep(best, t, n, M_MUSCLE);
      return;
    }
    t += max(d * 0.85, 0.0025);
    if (t > tEnd) return;
  }
}

Hit traceSolid(vec3 ro, vec3 rd) {
  Hit best;
  best.t = BIG;
  best.n = vec3(0.0);
  best.mat = 0.0;

  vec3 segN;
  vec2 seg = segmentIv(ro, rd, segN);

  traceWall(ro, rd, seg, segN, best);
  traceRing(ro, rd, seg, segN, IRIS_Z0, IRIS_Z1, uPupil, IRIS_R, M_IRIS, M_PUPIL, M_IRIS_CUT, false, best);
  traceRing(ro, rd, seg, segN, CIL_Z0, CIL_Z1, CIL_R0, CIL_R1, M_CILIARY, M_CILIARY, M_CILIARY_CUT, true, best);

  vec4 nerve = capsuleCylinder(ro, rd, NERVE_A, NERVE_B, NERVE_R);
  if (nerve.x > EPS) {
    vec3 axis = normalize(NERVE_B - NERVE_A);
    keep(best, nerve.x, nerve.yzw, abs(dot(nerve.yzw, axis)) > 0.9 ? M_NERVE_CAP : M_NERVE);
  }

  traceMuscles(ro, rd, best);
  return best;
}

// The same shell, asked only whether anything stands between a point and the
// light. The iris is left out: it is too thin to throw a shadow worth its cost.
float occluded(vec3 ro, vec3 rd) {
  vec3 segN;
  vec2 seg = segmentIv(ro, rd, segN);
  Hit h;
  h.t = BIG;
  h.n = vec3(0.0);
  h.mat = 0.0;
  traceWall(ro, rd, seg, segN, h);
  traceRing(ro, rd, seg, segN, CIL_Z0, CIL_Z1, CIL_R0, CIL_R1, M_CILIARY, M_CILIARY, M_CILIARY_CUT, true, h);
  return h.t < BIG ? 1.0 : 0.0;
}

// ---------- the lids ----------
// The lids live on one sphere in front of the eye; the fissure between them is
// an almond that closes to the canthi. They slide in from above and below as
// uLids rises, and the skin dissolves at its edge rather than ending in a rim.

float lidUpper(float x) {
  float k = max(1.0 - (x / 1.12) * (x / 1.12), 0.0);
  return mix(1.9, 0.41, uLids) * pow(k, 0.62) - 0.015;
}

float lidLower(float x) {
  float k = max(1.0 - (x / 1.12) * (x / 1.12), 0.0);
  return -mix(1.9, 0.44, uLids) * pow(k, 0.85) - 0.035 - 0.03 * max(-x, 0.0);
}

// ---------- light ----------

vec3 toCamera(vec3 d) {
  return vec3(dot(d, uRight), dot(d, uUp), -dot(d, uFwd));
}

// A studio: a large softbox above and to the left of the viewer, a narrow
// strip to the right, and a dim room. The cornea's catchlight is the softbox.
vec3 environment(vec3 d) {
  vec3 c = toCamera(d);
  float sky = smoothstep(-0.55, 0.9, c.y);
  vec3 col = mix(vec3(0.035, 0.04, 0.05), vec3(0.34, 0.39, 0.45), sky);
  vec2 box = vec2((c.x + 0.42) / 0.3, (c.y - 0.5) / 0.24);
  float softbox = (1.0 - smoothstep(0.7, 1.0, max(abs(box.x), abs(box.y)))) * smoothstep(0.05, 0.3, c.z);
  col += vec3(26.0, 25.0, 23.5) * softbox;
  vec2 strip = vec2((c.x - 0.78) / 0.05, (c.y + 0.05) / 0.42);
  float band = (1.0 - smoothstep(0.6, 1.0, max(abs(strip.x), abs(strip.y)))) * smoothstep(-0.1, 0.2, c.z);
  col += vec3(4.0, 4.6, 5.4) * band;
  return col;
}

vec3 keyDir() {
  return normalize(-0.5 * uRight + 0.62 * uUp - 0.62 * uFwd);
}

vec3 fillDir() {
  return normalize(0.75 * uRight - 0.25 * uUp - 0.55 * uFwd);
}

vec3 rimDir() {
  return normalize(0.3 * uRight + 0.5 * uUp + 0.8 * uFwd);
}

float fresnel(vec3 n, vec3 rd, float f0) {
  float c = 1.0 - clamp(dot(n, -rd), 0.0, 1.0);
  return f0 + (1.0 - f0) * c * c * c * c * c;
}

// ---------- surfaces ----------

float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C) {
  vec2 a = B - A;
  vec2 b = A - 2.0 * B + C;
  vec2 c = a * 2.0;
  vec2 d = A - pos;
  float kk = 1.0 / dot(b, b);
  float kx = kk * dot(a, b);
  float ky = kk * (2.0 * dot(a, a) + dot(d, b)) / 3.0;
  float kz = kk * dot(d, a);
  float res;
  float p = ky - kx * kx;
  float p3 = p * p * p;
  float q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
  float h = q * q + 4.0 * p3;
  if (h >= 0.0) {
    h = sqrt(h);
    vec2 x = (vec2(h, -h) - q) / 2.0;
    vec2 uv = sign(x) * pow(abs(x), vec2(1.0 / 3.0));
    float t = clamp(uv.x + uv.y - kx, 0.0, 1.0);
    vec2 w = d + (c + b * t) * t;
    res = dot(w, w);
  } else {
    float z = sqrt(-p);
    float v = acos(q / (p * z * 2.0)) / 3.0;
    float m = cos(v);
    float n = sin(v) * 1.732050808;
    vec3 t = clamp(vec3(m + m, -n - m, n - m) * z - kx, 0.0, 1.0);
    vec2 w0 = d + (c + b * t.x) * t.x;
    vec2 w1 = d + (c + b * t.y) * t.y;
    res = min(dot(w0, w0), dot(w1, w1));
  }
  return sqrt(res);
}

// The retinal circulation: arteries and veins leave the disc, arch above and
// below the macula and thin out toward the periphery - the picture every
// ophthalmologist knows from the slit lamp.
vec2 retinalVessels(vec2 q) {
  float vein = 1.0;
  float artery = 1.0;
  vec2 d0 = DISC + vec2(0.012, 0.018);
  vec2 d1 = DISC + vec2(0.012, -0.012);
  vein = min(vein, sdBezier(q, d0, vec2(-0.1, 0.36), vec2(0.36, 0.3)) - 0.011);
  vein = min(vein, sdBezier(q, d1, vec2(-0.1, -0.36), vec2(0.36, -0.31)) - 0.011);
  vein = min(vein, sdBezier(q, vec2(0.36, 0.3), vec2(0.55, 0.28), vec2(0.66, 0.12)) - 0.007);
  vein = min(vein, sdBezier(q, vec2(0.36, -0.31), vec2(0.56, -0.3), vec2(0.66, -0.1)) - 0.007);
  vein = min(vein, sdBezier(q, DISC, vec2(-0.38, 0.1), vec2(-0.6, 0.3)) - 0.009);
  vein = min(vein, sdBezier(q, DISC, vec2(-0.38, -0.12), vec2(-0.58, -0.34)) - 0.009);
  artery = min(artery, sdBezier(q, DISC + vec2(0.0, 0.03), vec2(-0.14, 0.31), vec2(0.38, 0.23)) - 0.0075);
  artery = min(artery, sdBezier(q, DISC + vec2(0.0, -0.025), vec2(-0.14, -0.31), vec2(0.38, -0.24)) - 0.0075);
  artery = min(artery, sdBezier(q, vec2(0.02, 0.24), vec2(0.07, 0.17), vec2(0.13, 0.1)) - 0.004);
  artery = min(artery, sdBezier(q, vec2(0.02, -0.24), vec2(0.08, -0.17), vec2(0.13, -0.1)) - 0.004);
  artery = min(artery, sdBezier(q, DISC, vec2(-0.4, 0.02), vec2(-0.66, 0.02)) - 0.006);
  return vec2(artery, vein);
}

vec3 fundusColor(vec3 p, out float discMask) {
  vec2 q = p.xy;
  vec3 col = vec3(0.56, 0.13, 0.045);
  col *= 0.82 + 0.34 * fbm2(q * 7.0 + 3.0);
  float edge = length(q);
  col = mix(col, vec3(0.33, 0.07, 0.03), smoothstep(0.35, 0.8, edge) * 0.5);

  float dm = length(q - FOVEA);
  col *= mix(0.46, 1.0, smoothstep(0.02, 0.17, dm));
  col = mix(col, vec3(0.42, 0.25, 0.05), (1.0 - smoothstep(0.0, 0.05, dm)) * 0.35);

  if (p.z < -0.3) {
    vec2 v = retinalVessels(q);
    float aa = 0.0035;
    col = mix(col, vec3(0.62, 0.05, 0.03), 1.0 - smoothstep(-aa, aa, v.x));
    col = mix(col, vec3(0.3, 0.02, 0.035), 1.0 - smoothstep(-aa, aa, v.y));
  }

  float dd = length((q - DISC) * vec2(1.0, 0.88));
  discMask = 1.0 - smoothstep(0.066, 0.082, dd);
  vec3 disc = mix(vec3(0.88, 0.55, 0.36), vec3(0.97, 0.84, 0.7), 1.0 - smoothstep(0.018, 0.04, dd));
  col = mix(col, disc, discMask);
  return col;
}

vec3 irisColor(vec3 p) {
  vec2 q = p.xy;
  float r = length(q);
  float a = atan(q.y, q.x);
  float u = clamp((r - uPupil) / (IRIS_R - uPupil), 0.0, 1.0);
  // the stroma's fibres run from the pupil to the root, wandering as they go
  float wander = a + 0.07 * (noise2(vec2(r * 14.0, a * 2.0)) - 0.5);
  float fibres = fbm2(vec2(wander * 26.0, r * 3.0));
  float strands = noise2(vec2(wander * 95.0, r * 9.0));
  vec3 inner = vec3(0.25, 0.12, 0.04);
  vec3 outer = vec3(0.1, 0.045, 0.018);
  vec3 col = mix(inner, outer, smoothstep(0.2, 0.55, u));
  col *= 0.55 + 0.7 * fibres + 0.3 * (strands - 0.5);
  // the collarette: a raised, lighter ring a third of the way out
  float collarette = exp(-pow((u - 0.3 - 0.03 * sin(a * 7.0 + noise2(vec2(a * 3.0, 1.0)) * 4.0)) / 0.05, 2.0));
  col += vec3(0.12, 0.058, 0.018) * collarette * (0.5 + fibres);
  // crypts: small dark pits just outside the collarette
  float crypts = smoothstep(0.62, 0.8, fbm2(vec2(wander * 9.0, u * 7.0 + 3.0)));
  col *= 1.0 - 0.55 * crypts * smoothstep(0.32, 0.42, u) * smoothstep(0.85, 0.55, u);
  col *= 1.0 - 0.14 * smoothstep(0.7, 1.0, sin(u * 38.0 + fibres * 3.0)) * smoothstep(0.6, 0.85, u);
  // the dark limbal ring, then the pigment ruff at the pupil
  col *= mix(1.0, 0.22, smoothstep(0.78, 1.0, u));
  col = mix(col, vec3(0.05, 0.028, 0.016), 1.0 - smoothstep(0.0, 0.05, u));
  return col;
}

// the cut face of the globe's wall, in the order a section shows it
vec3 wallSection(vec3 p, out float part) {
  float r = length(p);
  float fibre = noise2(vec2(atan(p.y + p.z, p.x) * 60.0, r * 90.0));
  part = 0.0;
  // in front of the ora serrata the retina gives way to the ciliary body
  float anterior = smoothstep(0.5, 0.58, p.z);
  if (r > R_CHOROID) {
    return vec3(0.83, 0.8, 0.74) * (0.9 + 0.12 * fibre);
  }
  if (r > R_RPE + 0.004) {
    float vessels = noise2(p.xy * 60.0 + p.z * 40.0);
    return mix(vec3(0.3, 0.045, 0.035), vec3(0.16, 0.035, 0.03), vessels);
  }
  if (r > R_RPE) {
    return vec3(0.07, 0.035, 0.025);
  }
  if (anterior > 0.5) {
    return vec3(0.1, 0.05, 0.035);
  }
  part = 3.0;
  float layers = 0.85 + 0.15 * sin(r * 520.0);
  return vec3(0.82, 0.44, 0.3) * layers;
}

// ---------- the part each surface belongs to ----------

// Around the chosen part, what gives it context keeps its colour: the eye
// behind the lids, the iris seen through the cornea, the disc on the retina,
// and the iris again for the nerve and the muscles - seen from the side, a
// grey front left the reader unable to tell the front of the eye from its back.
float contextKeep(float mat, float disc) {
  float keep = uHiB.x * 0.8;
  if (mat == M_IRIS || mat == M_PUPIL) keep = max(keep, max(uHiA.x, max(uHiA.w, uHiB.y) * 0.85));
  if (mat == M_INNER && disc > 0.5) keep = max(keep, uHiA.z);
  if (mat == M_INNER && disc < 0.5) keep = max(keep, uHiA.w * 0.6 + uHiB.z * 0.5);
  if (mat == M_SCLERA) keep = max(keep, uHiA.x * 0.5);
  return keep;
}

float solidPart(float mat, vec3 p, float disc) {
  if (mat == M_SCLERA) return p.z > 0.72 ? 1.0 : 0.0;
  if (mat == M_INNER) return disc > 0.5 ? 4.0 : (p.z < 0.52 ? 3.0 : 0.0);
  if (mat == M_NERVE || mat == M_NERVE_CAP) return 4.0;
  if (mat == M_MUSCLE) return 6.0;
  return 0.0;
}

float highlight(float part) {
  if (part < 0.5) return 0.0;
  if (part < 1.5) return uHiA.x;
  if (part < 2.5) return uHiA.y;
  if (part < 3.5) return uHiA.z;
  if (part < 4.5) return uHiA.w;
  if (part < 5.5) return uHiB.x;
  if (part < 6.5) return uHiB.y;
  return uHiB.z;
}

const vec3 ACCENT = vec3(0.72, 0.035, 0.2);

// The chosen part keeps its colour and gains a magenta edge that breathes;
// everything else steps back toward the ground it sits on, so one part reads
// inside a drawing this dense.
vec3 emphasise(vec3 col, float part, vec3 n, vec3 rd, float keep) {
  float hi = highlight(part);
  float ghost = uDim * (1.0 - hi) * (1.0 - keep);
  float l = lum(col);
  col = mix(col, vec3(l) * 0.62 + vec3(0.3, 0.33, 0.37), ghost * 0.42);
  if (hi > 0.001) {
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 2.2);
    float glow = 0.1 + 0.08 * uPulse + rim * (0.7 + 0.3 * uPulse);
    col = mix(col, col * vec3(1.15, 0.72, 0.86), 0.35 * hi);
    col += ACCENT * glow * hi;
  }
  return col;
}

vec3 light(vec3 p, vec3 n, vec3 rd, vec3 albedo, float wrap, float gloss, float specAmt, float f0, float cavity) {
  vec3 key = keyDir();
  float ndl = dot(n, key);
  float diffuse = clamp((ndl + wrap) / (1.0 + wrap), 0.0, 1.0);
  float shadow = 1.0;
  if (ndl > -wrap) {
    shadow = 1.0 - occluded(p + n * 0.002, key);
    if (uQuality > 0.5) {
      vec3 side = normalize(cross(key, uUp));
      float s2 = 1.0 - occluded(p + n * 0.002, normalize(key + side * 0.07));
      float s3 = 1.0 - occluded(p + n * 0.002, normalize(key - side * 0.07 + uUp * 0.05));
      shadow = (shadow + s2 + s3) / 3.0;
    }
  }
  vec3 warm = vec3(0.9, 0.36, 0.26) * wrap;
  vec3 col = albedo * (vec3(2.35, 2.28, 2.18) * diffuse * shadow);
  col += albedo * warm * (1.0 - clamp(abs(ndl) * 1.6, 0.0, 1.0)) * shadow * 0.9;
  col += albedo * vec3(0.3, 0.36, 0.44) * clamp(dot(n, fillDir()), 0.0, 1.0);
  float hemi = 0.5 + 0.5 * dot(n, uUp);
  col += albedo * mix(vec3(0.1, 0.1, 0.11), vec3(0.3, 0.33, 0.37), hemi) * cavity;
  col += albedo * vec3(0.55, 0.6, 0.7) * pow(clamp(dot(n, rimDir()), 0.0, 1.0), 2.0) * 0.35 * cavity;
  // inside the opened eye a lamp over the viewer's shoulder, as in a
  // photograph of a sectioned specimen
  col += albedo * vec3(1.25, 1.2, 1.15) * clamp(dot(n, -rd), 0.0, 1.0) * (1.0 - cavity) * 1.6 * uCut;
  vec3 h = normalize(key - rd);
  col += vec3(2.4) * specAmt * pow(clamp(dot(n, h), 0.0, 1.0), gloss) * shadow;
  // the room's reflection belongs on the wet outer surfaces, not in the eye
  col += environment(reflect(rd, n)) * fresnel(n, rd, f0) * max(cavity * 2.2 - 1.2, 0.0);
  return col;
}

vec3 shadeSolid(Hit h, vec3 ro, vec3 rd, out float part) {
  vec3 p = ro + rd * h.t;
  vec3 n = h.n;
  float disc = 0.0;
  part = 0.0;
  vec3 col;

  if (h.mat == M_SCLERA) {
    float mottle = fbm3(p * 4.0);
    vec3 albedo = mix(vec3(0.82, 0.79, 0.75), vec3(0.86, 0.84, 0.82), mottle);
    albedo = mix(albedo, vec3(0.78, 0.7, 0.6), smoothstep(-0.2, -0.9, p.z) * 0.45);
    vec3 q = p * 3.6 + vec3(fbm3(p * 2.6) * 0.9);
    float ridge = 1.0 - abs(noise3(q) * 2.0 - 1.0);
    float fine = 1.0 - abs(noise3(q * 2.4 + 4.0) * 2.0 - 1.0);
    float vessel = smoothstep(0.972, 0.998, ridge) * smoothstep(0.3, 0.55, noise3(p * 2.0 + 9.0));
    vessel += 0.45 * smoothstep(0.986, 0.999, fine) * smoothstep(0.45, 0.7, noise3(p * 2.2 + 3.0));
    float cz = p.z;
    vessel *= smoothstep(0.84, 0.66, cz) * smoothstep(-0.5, 0.2, cz);
    albedo = mix(albedo, vec3(0.62, 0.1, 0.08), clamp(vessel, 0.0, 1.0) * 0.7);
    // the limbus: the white turns faintly grey-blue where it thins to the cornea
    albedo = mix(albedo, vec3(0.55, 0.6, 0.66), smoothstep(0.78, 0.85, p.z) * 0.35);
    float lidShade = 1.0;
    if (uLids > 0.01) {
      vec3 lq = p - LID_C;
      float under = min(lidUpper(lq.x) - lq.y, lq.y - lidLower(lq.x));
      lidShade = mix(1.0, mix(0.45, 1.0, smoothstep(0.0, 0.14, under)), uLids);
    }
    col = light(p, n, rd, albedo, 0.35, 140.0, 0.55, 0.03, 1.0) * lidShade;
  } else if (h.mat == M_INNER) {
    vec3 albedo;
    if (p.z > 0.52) {
      float ridges = 0.7 + 0.3 * sin(atan(p.y, p.x) * 70.0);
      albedo = vec3(0.12, 0.055, 0.035) * ridges;
    } else {
      albedo = fundusColor(p, disc);
      albedo = mix(albedo, vec3(0.16, 0.06, 0.04), smoothstep(0.35, 0.52, p.z));
    }
    col = light(p, n, rd, albedo, 0.2, 60.0, 0.25, 0.02, 0.55);
  } else if (h.mat == M_RIM) {
    col = light(p, n, rd, vec3(0.16, 0.11, 0.09), 0.25, 30.0, 0.05, 0.02, 0.7);
  } else if (h.mat == M_CUT) {
    vec3 albedo = wallSection(p, part);
    col = light(p, n, rd, albedo, 0.25, 30.0, 0.12, 0.02, 0.9);
    // a dark line where the section meets the outer and inner surfaces
    float r = length(p);
    col *= mix(0.55, 1.0, smoothstep(0.0, 0.006, R_OUT - r) * smoothstep(0.0, 0.004, r - R_IN));
  } else if (h.mat == M_IRIS) {
    vec3 albedo = n.z > 0.0 ? irisColor(p) : vec3(0.035, 0.018, 0.012);
    col = light(p, n, rd, albedo, 0.3, 40.0, 0.1, 0.02, 0.8);
  } else if (h.mat == M_PUPIL || h.mat == M_IRIS_CUT) {
    float front = smoothstep(IRIS_Z0 + 0.012, IRIS_Z1, p.z);
    vec3 albedo = mix(vec3(0.03, 0.016, 0.012), vec3(0.2, 0.09, 0.035), front);
    col = light(p, n, rd, albedo, 0.3, 30.0, 0.08, 0.02, 0.8);
  } else if (h.mat == M_CILIARY || h.mat == M_CILIARY_CUT) {
    float ridges = 0.72 + 0.28 * sin(atan(p.y, p.x) * 80.0);
    vec3 albedo = vec3(0.13, 0.058, 0.036) * (h.mat == M_CILIARY ? ridges : 1.0);
    col = light(p, n, rd, albedo, 0.3, 30.0, 0.1, 0.02, 0.65);
  } else if (h.mat == M_NERVE) {
    vec3 axis = normalize(NERVE_B - NERVE_A);
    float along = dot(p - NERVE_A, axis);
    float streak = noise2(vec2(atan(dot(p, uUp), dot(p, uRight)) * 14.0, along * 3.0));
    vec3 albedo = vec3(0.86, 0.78, 0.64) * (0.88 + 0.16 * streak);
    float vessel = smoothstep(0.975, 0.998, 1.0 - abs(noise3(p * 6.0) * 2.0 - 1.0));
    albedo = mix(albedo, vec3(0.62, 0.12, 0.08), vessel * 0.6);
    col = light(p, n, rd, albedo, 0.4, 50.0, 0.2, 0.02, 1.0);
  } else if (h.mat == M_NERVE_CAP) {
    vec3 axis = normalize(NERVE_B - NERVE_A);
    vec3 d = p - NERVE_B;
    vec3 u1 = normalize(cross(axis, vec3(0.0, 1.0, 0.0)));
    vec3 u2 = cross(axis, u1);
    vec2 c = vec2(dot(d, u1), dot(d, u2)) / NERVE_R;
    float rr = length(c);
    vec3 albedo = vec3(0.9, 0.84, 0.72);
    float bundles = noise2(c * 9.0);
    albedo *= 0.82 + 0.28 * smoothstep(0.35, 0.65, bundles);
    albedo = mix(albedo, vec3(0.8, 0.76, 0.7), smoothstep(0.82, 0.86, rr));
    albedo = mix(albedo, vec3(0.62, 0.05, 0.04), 1.0 - smoothstep(0.08, 0.11, length(c - vec2(0.1, 0.02))));
    albedo = mix(albedo, vec3(0.3, 0.03, 0.08), 1.0 - smoothstep(0.1, 0.13, length(c + vec2(0.12, 0.0))));
    col = light(p, n, rd, albedo, 0.3, 30.0, 0.1, 0.02, 1.0);
  } else {
    // the recti: fibres run along the meridian, and the tendon is white
    float r = length(p);
    float th = acos(clamp(p.z / r, -1.0, 1.0));
    float az = atan(p.y, p.x);
    float k = floor(az / HALF_PI + 0.5);
    float ins = k > 0.5 && k < 1.5 ? 1.19 : (abs(k) > 1.5 ? 0.995 : (k < -0.5 ? 1.08 : 1.12));
    float tendon = 1.0 - smoothstep(ins + 0.12, ins + 0.42, th);
    float fibres = noise2(vec2((az - k * HALF_PI) * 110.0, th * 3.0));
    vec3 flesh = vec3(0.48, 0.075, 0.055) * (0.72 + 0.4 * fibres);
    bool sectioned = inSegment(p + n * 0.004) || abs(dot(n, vec3(0.0, 1.0, 0.0))) > 0.97;
    if (sectioned && uCut > 0.002) flesh = vec3(0.56, 0.1, 0.08) * (0.85 + 0.25 * noise2(p.xz * 80.0));
    vec3 albedo = mix(flesh, vec3(0.8, 0.76, 0.7) * (0.92 + 0.1 * fibres), tendon);
    col = light(p, n, rd, albedo, 0.45, 60.0, 0.35, 0.03, 1.0);
  }

  if (part == 0.0) part = solidPart(h.mat, p, disc);
  // the white of the eye is never lit in the accent - a magenta ring round the
  // iris reads as an inflamed eye, the one picture an eye hospital must not show
  if (h.mat == M_SCLERA) part = 0.0;
  // with the eye whole, its inside is as dark as a pupil is
  if (h.mat == M_INNER || h.mat == M_CILIARY || h.mat == M_PUPIL) col *= mix(0.03, 1.0, uCut);
  return emphasise(col, part, n, rd, contextKeep(h.mat, disc));
}

// ---------- the clear bodies ----------
// Layers composite front to back: `add` is premultiplied colour, `trans` what
// they let through. A ray records the cornea, the lens, the cut face of the
// vitreous and the lids, in whatever order it meets them.

struct Layer {
  float t;
  vec3 add;
  vec3 trans;
  float part;
};

Layer noLayer() {
  Layer l;
  l.t = BIG;
  l.add = vec3(0.0);
  l.trans = vec3(1.0);
  l.part = 0.0;
  return l;
}

Layer traceCornea(vec3 ro, vec3 rd, vec2 seg, vec3 segN, out vec3 refracted) {
  Layer l = noLayer();
  refracted = rd;
  vec2 o = sphereIv(ro, rd, CORNEA_C, CORNEA_R);
  if (o.y < 0.0) return l;
  vec2 i = sphereIv(ro, rd, CORNEA_IC, CORNEA_IR);

  float best = BIG;
  vec3 n = vec3(0.0);
  bool section = false;
  float t = o.x;
  vec3 p = ro + rd * t;
  if (t > EPS && p.z > CORNEA_Z && !within(t, i) && !within(t, seg)) {
    best = t;
    n = normalize(p - CORNEA_C);
  }
  t = i.y;
  p = ro + rd * t;
  if (t > EPS && t < best && p.z > CORNEA_Z && within(t, o) && !within(t, seg)) {
    best = t;
    n = -normalize(p - CORNEA_IC);
  }
  t = seg.y;
  p = ro + rd * t;
  if (t > EPS && t < best && p.z > CORNEA_Z && within(t, o) && !within(t, i)) {
    best = t;
    n = segN;
    section = true;
  }
  if (best >= BIG) return l;

  p = ro + rd * best;
  l.t = best;
  l.part = 1.0;
  float f = fresnel(n, rd, 0.028);
  float hi = uHiA.x;
  if (section) {
    l.add = vec3(0.62, 0.74, 0.8) * 0.28 * (0.75 + 0.35 * clamp(dot(n, keyDir()), 0.0, 1.0));
    l.trans = vec3(0.7, 0.76, 0.8);
    l.add += ACCENT * 0.55 * hi;
  } else {
    l.add = environment(reflect(rd, n)) * f;
    vec3 h = normalize(keyDir() - rd);
    l.add += vec3(3.2) * pow(clamp(dot(n, h), 0.0, 1.0), 900.0);
    l.trans = vec3(0.965, 0.985, 0.99) * (1.0 - f);
    refracted = refract(rd, n, 1.0 / 1.376);
    if (dot(refracted, refracted) < 0.5) refracted = rd;
    // lit, the clear dome shows its edge in the accent and a faint wash
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 4.0);
    l.add += ACCENT * (0.03 + 0.03 * uPulse + rim * (0.75 + 0.35 * uPulse)) * hi;
  }
  return l;
}

Layer traceLens(vec3 ro, vec3 rd, vec2 seg, vec3 segN) {
  Layer l = noLayer();
  vec2 e = ellipsoidIv(ro, rd, LENS_C, LENS_R);
  if (e.y < 0.0) return l;
  float best = BIG;
  vec3 n = vec3(0.0);
  bool section = false;
  if (e.x > EPS && !within(e.x, seg)) {
    best = e.x;
    vec3 p = ro + rd * e.x;
    n = normalize((p - LENS_C) / (LENS_R * LENS_R));
  }
  if (seg.y > EPS && seg.y < best && within(seg.y, e)) {
    best = seg.y;
    n = segN;
    section = true;
  }
  if (best >= BIG) return l;
  vec3 p = ro + rd * best;
  l.t = best;
  l.part = 2.0;
  if (section) {
    float e2 = length((p - LENS_C) / LENS_R);
    vec3 nucleus = vec3(0.86, 0.66, 0.34);
    vec3 cortex = vec3(0.9, 0.86, 0.76);
    vec3 c = mix(nucleus, cortex, smoothstep(0.45, 0.7, e2));
    c *= 0.88 + 0.12 * sin(e2 * 46.0);
    float a = mix(0.62, 0.3, smoothstep(0.45, 0.72, e2));
    a = mix(a, 0.85, smoothstep(0.95, 0.995, e2));
    float lit = 0.8 + 0.5 * clamp(dot(n, keyDir()), 0.0, 1.0);
    l.add = c * a * lit;
    l.trans = vec3(1.0 - a) * vec3(1.0, 0.94, 0.82);
  } else {
    float f = fresnel(n, rd, 0.04);
    l.add = environment(reflect(rd, n)) * f * 0.8 + vec3(0.2, 0.17, 0.11) * 0.18;
    vec3 h = normalize(keyDir() - rd);
    l.add += vec3(1.6) * pow(clamp(dot(n, h), 0.0, 1.0), 300.0);
    l.trans = vec3(0.9, 0.86, 0.72) * (1.0 - f);
  }
  // with the eye whole the lens is seen only through a dark pupil
  if (!section) l.add *= mix(0.3, 1.0, uCut);
  float hi = uHiA.y;
  float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 1.5);
  l.add = mix(l.add, l.add * vec3(1.1, 0.75, 0.88), 0.4 * hi);
  l.add += ACCENT * (0.14 + 0.08 * uPulse + rim * (0.8 + 0.4 * uPulse)) * hi;
  l.add *= 1.0 - 0.3 * uDim * (1.0 - hi);
  return l;
}

// The gel that fills the eye has no colour of its own, but its cut face
// catches the light - which is what tells the reader the eye is full.
Layer traceVitreous(vec3 ro, vec3 rd, vec2 seg, vec3 segN, float solidT) {
  Layer l = noLayer();
  if (uCut < 0.002 || seg.y <= EPS || seg.y > solidT) return l;
  vec3 p = ro + rd * seg.y;
  if (length(p) > R_IN - 0.002) return l;
  if (length((p - LENS_C) / LENS_R) < 1.0) return l;
  if (p.z > 0.6 && length(p.xy) < 0.47) return l;
  vec3 n = segN;
  float f = fresnel(n, rd, 0.02);
  l.t = seg.y;
  l.add = vec3(0.62, 0.72, 0.8) * (0.035 + 0.25 * f);
  l.trans = vec3(0.94, 0.955, 0.965);
  return l;
}

// Lashes grow from the margin in an irregular row, fan outward toward the
// corners and curl away from the eye. `m` is the distance out from the margin.
float lashes(float x, float m, float len, float seed) {
  if (m < 0.0 || m > len) return 0.0;
  float density = 92.0;
  float best = 1.0;
  float base = floor(x * density);
  for (int i = -1; i <= 1; i++) {
    float cell = base + float(i);
    float j = hash12(vec2(cell, seed));
    float x0 = (cell + 0.15 + 0.7 * j) / density;
    float reach = len * (0.55 + 0.45 * hash12(vec2(cell, seed + 7.0)));
    float tilt = 0.5 * x0 + 0.2 * (j - 0.5);
    float xs = x0 + tilt * m + 1.2 * x0 * m * m;
    float w = 0.0034 * (1.0 - m / reach);
    if (m < reach) best = min(best, abs(x - xs) - w);
  }
  return 1.0 - smoothstep(0.0, 0.0022, best);
}

Layer traceLids(vec3 ro, vec3 rd) {
  Layer l = noLayer();
  if (uLids < 0.01) return l;
  vec2 s = sphereIv(ro, rd, LID_C, LID_R);
  float t = s.x > EPS ? s.x : s.y;
  if (t <= EPS) return l;
  vec3 p = ro + rd * t;
  vec3 q = p - LID_C;
  if (p.z < 0.1) return l;
  float up = lidUpper(q.x);
  float lo = lidLower(q.x);
  // a little of the margin's own thickness shows inside the fissure
  float thick = 0.03;
  float aboveUpper = q.y - up;
  float belowLower = lo - q.y;
  bool upper = aboveUpper > -thick && q.y > 0.0;
  bool lower = belowLower > -thick && q.y <= 0.0;
  if (!upper && !lower && abs(q.x) < 1.12) return l;

  float fade = 1.0 - smoothstep(0.95, 1.55, length(q.xy * vec2(0.82, 1.0)));
  float alpha = uLids * fade;
  if (alpha < 0.004) return l;

  float margin = upper ? aboveUpper : belowLower;
  if (abs(q.x) >= 1.12) margin = max(margin, 0.2);
  vec3 n = normalize(q);
  vec3 skinTone = vec3(0.36, 0.19, 0.12);
  vec3 c;

  if (margin < 0.0) {
    // the margin's edge: moist, pinker, turned toward the eye
    vec3 inward = normalize(vec3(0.0, upper ? -1.0 : 1.0, 0.25));
    n = normalize(mix(n, inward, 0.8));
    vec3 edge = mix(vec3(0.5, 0.22, 0.18), vec3(0.62, 0.3, 0.26), smoothstep(-thick, 0.0, margin));
    c = edge;
  } else {
    float roll = 1.0 - smoothstep(0.0, 0.07, margin);
    vec3 inward = normalize(vec3(0.0, upper ? -1.0 : 1.0, -0.3));
    n = normalize(mix(n, inward, roll * 0.5));
    vec3 skin = skinTone * (0.9 + 0.16 * fbm2(q.xy * 26.0));
    skin *= 0.94 + 0.06 * noise2(q.xy * 140.0);
    if (upper) {
      // the lid crease, and the fold of skin above it
      float crease = exp(-pow((margin - 0.27 - 0.04 * q.x * q.x) / 0.022, 2.0)) * smoothstep(1.1, 0.4, abs(q.x));
      skin *= 1.0 - 0.32 * crease;
      skin *= 1.0 + 0.06 * smoothstep(0.3, 0.42, margin);
    }
    skin = mix(skin, vec3(0.5, 0.24, 0.19), (1.0 - smoothstep(0.0, 0.02, margin)) * 0.6);
    float lash = lashes(q.x, margin, upper ? 0.14 : 0.07, upper ? 1.0 : 2.0);
    lash *= smoothstep(1.08, 0.72, abs(q.x));
    c = mix(skin, vec3(0.02, 0.013, 0.01), lash * 0.94);
  }

  vec3 key = keyDir();
  float ndl = dot(n, key);
  vec3 lit = c * vec3(2.1, 2.02, 1.94) * clamp((ndl + 0.45) / 1.45, 0.0, 1.0);
  lit += c * vec3(0.85, 0.3, 0.18) * 0.4 * (1.0 - clamp(abs(ndl) * 1.5, 0.0, 1.0));
  lit += c * vec3(0.28, 0.3, 0.34);
  vec3 h = normalize(key - rd);
  lit += vec3(0.35) * pow(clamp(dot(n, h), 0.0, 1.0), margin < 0.0 ? 120.0 : 30.0);

  // lit, the margins draw in the accent
  float hi = uHiB.x;
  float line = exp(-pow(max(margin, 0.0) / 0.035, 2.0)) * smoothstep(1.12, 0.9, abs(q.x));
  lit += ACCENT * line * (0.7 + 0.4 * uPulse) * hi;

  l.t = t;
  l.part = 5.0;
  l.add = lit * alpha;
  l.trans = vec3(1.0 - alpha);
  return l;
}

void swapIf(inout Layer a, inout Layer b) {
  if (b.t < a.t) {
    Layer tmp = a;
    a = b;
    b = tmp;
  }
}

// ---------- glows: the light that focuses, and the tears ----------

// closest approach between the view ray and a segment: (distance, ray t, s)
vec3 rayToSegment(vec3 ro, vec3 rd, vec3 a, vec3 b) {
  vec3 ab = b - a;
  vec3 ao = ro - a;
  float abab = dot(ab, ab);
  float abrd = dot(ab, rd);
  float aoab = dot(ao, ab);
  float aord = dot(ao, rd);
  float denom = abab - abrd * abrd;
  float s = denom > 1e-6 ? clamp((aoab - aord * abrd) / denom, 0.0, 1.0) : 0.0;
  float t = max(dot(a + ab * s - ro, rd), 0.0);
  s = clamp(dot(ro + rd * t - a, ab) / abab, 0.0, 1.0);
  vec3 closest = a + ab * s;
  t = max(dot(closest - ro, rd), 0.0);
  return vec3(length(ro + rd * t - closest), t, s);
}

float beam(vec3 ro, vec3 rd, vec3 a, vec3 b, float width, float solidT, float pixel, float s0, float s1, inout float flow) {
  vec3 q = rayToSegment(ro, rd, a, b);
  if (q.y > solidT) return 0.0;
  float w = width + pixel * q.y;
  float core = exp(-pow(q.x / w, 2.0));
  float halo = exp(-pow(q.x / (w * 5.0), 2.0)) * 0.22;
  float s = mix(s0, s1, q.z);
  float pulse = fract(uTime * 0.28 - s);
  flow = max(flow, core * exp(-pow((pulse - 0.5) / 0.05, 2.0)));
  return core + halo;
}

// Five rays enter through the opened quarter, bend at the cornea and again at
// the lens, and meet on the fovea.
vec4 lightRays(vec3 ro, vec3 rd, float solidT, float pixel) {
  if (uRays < 0.01) return vec4(0.0);
  vec3 focus = vec3(0.0, 0.0, -R_IN + 0.004);
  float glow = 0.0;
  float flow = 0.0;
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float az = 0.16 + fk * 0.31;
    vec2 dir = vec2(cos(az), sin(az));
    float r0 = k == 2 ? 0.2 : 0.31;
    vec3 far = vec3(dir * r0, 2.3);
    vec3 cornea = vec3(dir * r0, CORNEA_C.z + sqrt(CORNEA_R * CORNEA_R - r0 * r0));
    vec3 lens = vec3(dir * r0 * 0.78, LENS_C.z + LENS_R.z * 0.6);
    glow += beam(ro, rd, far, cornea, 0.006, solidT, pixel, 0.0, 0.33, flow);
    glow += beam(ro, rd, cornea, lens, 0.006, solidT, pixel, 0.33, 0.5, flow);
    glow += beam(ro, rd, lens, focus, 0.0055, solidT, pixel, 0.5, 1.0, flow);
  }
  float spot = rayToSegment(ro, rd, focus, focus + vec3(0.0, 0.0, 0.001)).x;
  float focusGlow = exp(-pow(spot / (0.03 + pixel * 3.0), 2.0)) * 1.4;
  float intensity = uRays * (glow + flow * 1.6 * uLive + focusGlow);
  return vec4(vec3(1.0, 0.86, 0.6) * intensity, min(intensity, 1.0));
}

// Tears are made above and outside the eye and drain at its inner corner:
// shown as an x-ray, because both lie under the skin the lids are drawn in.
float tube(vec3 ro, vec3 rd, vec3 a, vec3 b, float r, float solidT, float pixel) {
  vec3 q = rayToSegment(ro, rd, a, b);
  if (q.y > solidT) return 0.0;
  float w = r + pixel * q.y;
  float d = q.x / w;
  return smoothstep(1.0, 0.7, d) * (0.25 + 0.75 * smoothstep(0.3, 0.95, d));
}

vec4 tearGlands(vec3 ro, vec3 rd, float solidT, float pixel) {
  if (uLids < 0.05) return vec4(0.0);
  vec3 gc = vec3(0.74, 0.8, 0.42);
  vec3 gr = vec3(0.3, 0.1, 0.19);
  vec2 e = ellipsoidIv(ro, rd, gc, gr);
  float gland = 0.0;
  if (e.y > 0.0 && e.x < solidT) {
    float thick = clamp((min(e.y, solidT) - max(e.x, 0.0)) / (2.0 * gr.y), 0.0, 1.0);
    vec3 p = ro + rd * max(e.x, 0.0);
    float lobes = smoothstep(0.3, 0.75, noise3(p * 34.0)) * 0.6 + 0.4;
    float edge = pow(1.0 - thick, 3.0);
    gland = (0.16 + 0.34 * lobes * thick + 0.9 * edge);
  }
  float ducts = 0.0;
  vec3 pu = vec3(-0.93, 0.18, 0.93);
  vec3 pl = vec3(-0.93, -0.16, 0.93);
  vec3 junction = vec3(-1.13, 0.02, 0.76);
  vec3 sacTop = vec3(-1.17, 0.22, 0.68);
  vec3 sacFoot = vec3(-1.17, -0.14, 0.68);
  vec3 ductFoot = vec3(-1.1, -1.02, 0.55);
  ducts = max(ducts, tube(ro, rd, pu, pu + vec3(-0.02, 0.06, -0.02), 0.02, solidT, pixel));
  ducts = max(ducts, tube(ro, rd, pu + vec3(-0.02, 0.06, -0.02), junction, 0.02, solidT, pixel));
  ducts = max(ducts, tube(ro, rd, pl, pl + vec3(-0.02, -0.06, -0.02), 0.02, solidT, pixel));
  ducts = max(ducts, tube(ro, rd, pl + vec3(-0.02, -0.06, -0.02), junction, 0.02, solidT, pixel));
  ducts = max(ducts, tube(ro, rd, sacTop, sacFoot, 0.06, solidT, pixel));
  ducts = max(ducts, tube(ro, rd, sacFoot, ductFoot, 0.042, solidT, pixel));
  float flowY = fract(uTime * 0.22);
  vec3 drop = mix(sacTop, ductFoot, flowY);
  float dropGlow = exp(-pow(rayToSegment(ro, rd, drop, drop + vec3(0.0, 0.001, 0.0)).x / 0.05, 2.0)) * step(0.001, ducts);
  float amount = gland + ducts + dropGlow * 0.8 * uLive;
  float a = uLids * clamp(amount * 0.55, 0.0, 0.85);
  vec3 col = mix(vec3(0.55, 0.72, 0.9), vec3(0.98, 0.5, 0.72), uHiB.x) * amount * 0.75;
  return vec4(col * uLids, a);
}

// ---------- the frame ----------

vec3 toneMap(vec3 x) {
  x *= 0.62;
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 px = uPick > 0.5 ? uPickOrigin + gl_FragCoord.xy * uPickStep : gl_FragCoord.xy;
  vec2 uv = (px - 0.5 * uRes) / uFocal;
  vec3 ro = uEye;
  vec3 rd = normalize(uFwd + uv.x * uRight + uv.y * uUp);
  float pixel = 1.0 / uFocal;

  vec3 segN;
  vec2 seg = segmentIv(ro, rd, segN);

  vec3 bent;
  Layer cornea = traceCornea(ro, rd, seg, segN, bent);
  Hit solid = traceSolid(ro, rd);
  vec3 ro2 = ro;
  vec3 rd2 = rd;
  if (cornea.t >= solid.t) {
    // the cornea is on the far side of something solid
    cornea = noLayer();
  } else if (cornea.t < BIG && dot(bent, rd) < 0.9999) {
    // seen through the cornea, everything behind it is seen bent
    ro2 = ro + rd * cornea.t;
    rd2 = bent;
    solid = traceSolid(ro2, rd2);
  }
  vec3 segN2;
  vec2 seg2 = segmentIv(ro2, rd2, segN2);
  float solidT = solid.t;
  // the solid depth measured along the unbent ray, for everything that ignores
  // the cornea's refraction
  float solidT0 = solid.t < BIG ? length(ro2 + rd2 * solid.t - ro) : BIG;

  Layer lens = traceLens(ro2, rd2, seg2, segN2);
  if (lens.t > solidT) lens = noLayer();
  if (lens.t < BIG) lens.t = length(ro2 + rd2 * lens.t - ro);
  Layer vitreous = traceVitreous(ro2, rd2, seg2, segN2, solidT);
  if (vitreous.t < BIG) vitreous.t = length(ro2 + rd2 * vitreous.t - ro);
  Layer lids = traceLids(ro, rd);
  if (lids.t > solidT0) lids = noLayer();

  // the clear layers, sorted front to back
  Layer l0 = cornea;
  Layer l1 = lens;
  Layer l2 = vitreous;
  Layer l3 = lids;
  swapIf(l0, l1);
  swapIf(l2, l3);
  swapIf(l0, l2);
  swapIf(l1, l3);
  swapIf(l1, l2);

  vec4 rays = lightRays(ro, rd, solidT0, pixel);
  vec4 tears = tearGlands(ro, rd, solidT0, pixel);

  if (uPick > 0.5) {
    float id = 0.0;
    if (l0.part > 0.5 && l0.t < BIG) id = l0.part;
    else if (l1.part > 0.5 && l1.t < BIG) id = l1.part;
    else if (l2.part > 0.5 && l2.t < BIG) id = l2.part;
    else if (l3.part > 0.5 && l3.t < BIG) id = l3.part;
    if (tears.a > 0.25) id = 5.0;
    if (id < 0.5 && rays.a > 0.3) id = 7.0;
    if (id < 0.5 && solid.t < BIG) {
      float part;
      vec3 p = ro2 + rd2 * solid.t;
      float disc = 0.0;
      if (solid.mat == M_INNER && p.z < 0.52) fundusColor(p, disc);
      if (solid.mat == M_CUT) {
        wallSection(p, part);
        id = part > 0.5 ? part : 0.0;
      } else {
        id = solidPart(solid.mat, p, disc);
      }
    }
    gl_FragColor = vec4(id / 255.0, 0.0, 0.0, 1.0);
    return;
  }

  vec3 base = vec3(0.0);
  float baseA = 0.0;
  if (solid.t < BIG) {
    float part;
    base = shadeSolid(solid, ro2, rd2, part);
    baseA = 1.0;
  } else {
    // a soft shadow on an imagined table under the eye
    float tf = (-1.32 - ro.y) / rd.y;
    if (tf > 0.0 && rd.y < 0.0) {
      vec3 f = ro + rd * tf;
      float s = exp(-(f.x * f.x / 0.9 + (f.z + 0.35) * (f.z + 0.35) / 1.9) * 1.6);
      // fade before the frame's edge, so the shadow never ends in a line
      vec2 edge = min(px, uRes - px) / min(uRes.x, uRes.y);
      s *= smoothstep(0.0, 0.14, min(edge.x, edge.y));
      baseA = s * 0.3;
      base = vec3(0.02, 0.05, 0.09) * baseA;
    }
  }

  vec3 acc = vec3(0.0);
  vec3 trans = vec3(1.0);
  acc += trans * l0.add; trans *= l0.trans;
  acc += trans * l1.add; trans *= l1.trans;
  acc += trans * l2.add; trans *= l2.trans;
  acc += trans * l3.add; trans *= l3.trans;

  vec3 col = acc + trans * base;
  float alpha = 1.0 - (1.0 - baseA) * dot(trans, vec3(1.0 / 3.0));

  col += rays.rgb * (1.0 + uHiB.z * 0.6);
  alpha = max(alpha, rays.a * 0.9);
  col += tears.rgb;
  alpha = max(alpha, tears.a);

  alpha = clamp(alpha, 0.0, 1.0);
  // tone map the colour itself, not colour already multiplied by coverage:
  // curving a premultiplied value brightens a faint edge into a halo
  vec3 straight = alpha > 0.0005 ? col / alpha : vec3(0.0);
  straight = pow(toneMap(straight), vec3(1.0 / 2.2));
  gl_FragColor = vec4(straight * alpha, alpha);
}
