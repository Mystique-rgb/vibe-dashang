// ---------------------------------------------------------------- the figure
// Bald profile facing left, reconstructed from V1 (bcb265...mp4, frame 4.60s).
//
// Coordinate frame: head centre at (0,0), half head height (crown->chin) = 1.
// So the skull runs y=-1..+1 and the nose tip reaches x=-1.00. The halo ring is
// centred slightly above the head centre, like the reference.
//
// Pure functions only: same arguments -> same pixels.

import { rgba, clamp01, easeOutQuint, easeOutCubic } from './gfx.js';

// 12 eyes sit on the halo ring. scene.js and the sfx track both read this, so
// every light point gets exactly one sound.
export const HALO_EYES = 12;
export const HALO_RADIUS = 1.34;
export const HALO_CY = -0.14;

// Outer silhouette, clockwise from the crown: down the face, around the jaw and
// neck, then up the back of the skull.
const PROFILE = [
  [-0.319, -1.000],  // crown
  [-0.545, -0.944],
  [-0.652, -0.770],  // forehead top
  [-0.700, -0.580],  // forehead
  [-0.712, -0.452],  // brow ridge
  [-0.700, -0.360],  // brow point
  [-0.660, -0.318],  // nose root, hard notch
  [-0.760, -0.244],  // bridge segment 1
  [-0.846, -0.140],  // bridge segment 2
  [-0.930, -0.020],  // bridge segment 3
  [-0.996,  0.180],  // bridge segment 4
  [-1.030,  0.352],  // needle nose tip
  [-0.996,  0.404],  // hard break under the tip
  [-0.986,  0.436],  // sharp underside
  [-0.918,  0.470],  // nostril
  [-0.876,  0.534],  // philtrum
  [-0.902,  0.606],  // upper lip, juts
  [-0.848,  0.648],  // mouth line
  [-0.888,  0.716],  // lower lip
  [-0.856,  0.800],  // chin crease
  [-0.848,  0.884],  // chin corner, angular
  [-0.796,  1.010],  // chin point
  [-0.686,  1.108],  // jaw underside
  [-0.544,  1.206],  // jaw angle, hard
  [-0.500,  1.376],  // neck front
  [-0.480,  1.600],
  [ 0.360,  1.600],
  [ 0.400,  1.330],
  [ 0.470,  1.130],  // nape
  [ 0.640,  0.900],
  [ 0.790,  0.620],
  [ 0.876,  0.300],
  [ 0.904, -0.020],
  [ 0.868, -0.380],
  [ 0.760, -0.720],
  [ 0.480, -0.950],
  [ 0.060, -1.020],
];

// Body: shoulders and chest below the collar. Drawn as two open polylines that
// run off the bottom of the frame, so the figure reads as bust rather than a
// floating head. Coordinates share the head frame (chin = +1.0).
const BODY_LEFT = [
  [-0.560, 1.760],   // under the collar, front
  [-0.960, 2.020],
  [-1.420, 2.330],   // sharp shoulder break
  [-1.800, 2.700],   // shoulder front, wide
  [-1.960, 3.120],   // asymmetric: this side tapers in
  [-2.080, 3.700],
];

const BODY_RIGHT = [
  [ 0.520, 1.760],   // under the collar, back
  [ 0.900, 2.080],
  [ 1.480, 2.290],   // higher, sharper shoulder break than the left
  [ 1.900, 2.640],
  [ 2.240, 3.040],   // asymmetric: this side flares out further
  [ 2.420, 3.700],
];

// Collar sits across the neck/shoulder join.
const COLLAR = [
  [-0.640, 1.620],
  [-0.900, 1.940],
  [ 0.860, 1.940],
  [ 0.560, 1.620],
];

// Catmull-Rom -> cubic bezier, closed.
function smoothClosed(ctx, pts, tension) {
  const n = pts.length;
  const T = tension === undefined ? 0.5 : tension;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * T * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * T * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * T * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * T * 2;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
  }
  ctx.closePath();
}

// Smooth open polyline through the points (quadratic midpoints).
function smoothOpen(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
}

const scaled = (pts, s) => pts.map((p) => [p[0] * s, p[1] * s]);

// Hard-edged closed path: straight segments with only the slightest corner
// rounding. The reference silhouette is all angles, so Catmull-Rom smoothing
// (which rounds every vertex) was the main thing making it look soft.
function sharpClosed(ctx, pts, round) {
  const n = pts.length;
  const R = round === undefined ? 0.14 : round;   // 0 = pure polygon
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    // trim each corner back by R along both edges, then join with a short line
    const d1 = Math.hypot(cur[0] - prev[0], cur[1] - prev[1]) || 1;
    const d2 = Math.hypot(next[0] - cur[0], next[1] - cur[1]) || 1;
    const a = [cur[0] - ((cur[0] - prev[0]) / d1) * R * Math.min(1, d1 * 0.4),
               cur[1] - ((cur[1] - prev[1]) / d1) * R * Math.min(1, d1 * 0.4)];
    const b = [cur[0] + ((next[0] - cur[0]) / d2) * R * Math.min(1, d2 * 0.4),
               cur[1] + ((next[1] - cur[1]) / d2) * R * Math.min(1, d2 * 0.4)];
    if (i === 0) ctx.moveTo(a[0], a[1]);
    else ctx.lineTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
  }
  ctx.closePath();
}

// ------------------------------------------------------------------ features

// The closed state is a small per-sin glyph sitting where the eye would be.
// When the eye opens, a solid V2-style eye (filled sclera + iris + pupil + spec)
// grows over the glyph and hides it. Reference eye measured from V2: a filled
// disc ~0.10 of head radius, aspect 1.0, fill ratio 0.78.
function drawEye(ctx, s, alpha, open, accent, sin, t) {
  const o = clamp01(open || 0);

  // eye slot in head-local units
  const cxE = -0.475;
  const cyE = -0.130;

  // ---- closed glyph, visible while the lid is shut
  const glyphA = alpha * (1 - clamp01(o * 1.6));
  if (glyphA > 0.01) {
    ctx.save();
    ctx.translate(cxE * s, cyE * s);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.95 * glyphA + ')';
    ctx.lineWidth = Math.max(1.8, s * 0.030);

    if (sin === 'lust') {
      // small heart
      const r = 0.062 * s;
      const k = 1 + Math.sin(t * 3.6) * 0.10;
      ctx.scale(k, k);
      ctx.beginPath();
      ctx.moveTo(0, r * 0.95);
      ctx.bezierCurveTo(-r * 2.05, -r * 0.55, -r * 0.95, -r * 2.05, 0, -r * 0.72);
      ctx.bezierCurveTo(r * 0.95, -r * 2.05, r * 2.05, -r * 0.55, 0, r * 0.95);
      ctx.closePath();
      ctx.stroke();
    } else if (sin === 'greed') {
      // RMB sign
      ctx.beginPath();
      ctx.moveTo(-0.055 * s, -0.080 * s);
      ctx.lineTo(0.000 * s, -0.014 * s);
      ctx.lineTo(0.055 * s, -0.080 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0.000 * s, -0.014 * s);
      ctx.lineTo(0.000 * s, 0.082 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.048 * s, 0.016 * s);
      ctx.lineTo(0.048 * s, 0.016 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.048 * s, 0.046 * s);
      ctx.lineTo(0.048 * s, 0.046 * s);
      ctx.stroke();
    } else if (sin === 'anger') {
      // small flame
      const wob = Math.sin(t * 6.0) * 0.012 * s;
      ctx.beginPath();
      ctx.moveTo(0, -0.090 * s);
      ctx.bezierCurveTo(0.062 * s + wob, -0.020 * s, 0.052 * s, 0.062 * s, 0, 0.078 * s);
      ctx.bezierCurveTo(-0.052 * s, 0.062 * s, -0.062 * s + wob, -0.020 * s, 0, -0.090 * s);
      ctx.closePath();
      ctx.stroke();
      // inner flame
      ctx.strokeStyle = rgba(accent, 0.90 * glyphA);
      ctx.lineWidth = Math.max(1.0, s * 0.008);
      ctx.beginPath();
      ctx.moveTo(0, -0.030 * s);
      ctx.quadraticCurveTo(0.026 * s, 0.014 * s, 0, 0.046 * s);
      ctx.quadraticCurveTo(-0.026 * s, 0.014 * s, 0, -0.030 * s);
      ctx.stroke();
    } else {
      // default: a shallow downward arc (the original "wave line")
      ctx.beginPath();
      ctx.moveTo(-0.100 * s, -0.008 * s);
      ctx.quadraticCurveTo(0.000 * s, 0.088 * s, 0.100 * s, -0.008 * s);
      ctx.stroke();
      // and a small circle above it for the sins that use one
      if (sin === 'gluttony' || sin === 'sloth' || sin === 'envy' || sin === 'pride') {
        ctx.strokeStyle = rgba(accent, 0.85 * glyphA);
        ctx.lineWidth = Math.max(1.3, s * 0.013);
        ctx.beginPath();
        ctx.arc(0, -0.030 * s, 0.048 * s, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---- the open eye: a blade of light, not a round eyeball.
  // The reference has a thin bright wedge slanting up-forward, which is what
  // gives the face its 目中无人 look.
  if (o > 0.02) {
    const k = clamp01(o);
    ctx.save();
    ctx.translate(cxE * s, cyE * s);
    ctx.rotate(-0.30);          // slant up toward the front of the face

    const L = 0.150 * s * k;    // half length
    const Hh = 0.042 * s * k;   // half height at the root

    // bloom
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, L * 2.4);
    bg.addColorStop(0, 'rgba(255,255,255,' + 0.60 * k * alpha + ')');
    bg.addColorStop(0.28, rgba(accent, 0.46 * k * alpha));
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(0, 0, L * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // the blade: a tapered wedge, sharp at the outer end
    ctx.beginPath();
    ctx.moveTo(-L, 0);
    ctx.quadraticCurveTo(-L * 0.15, -Hh, L * 0.62, -Hh * 0.42);
    ctx.lineTo(L, 0);
    ctx.quadraticCurveTo(L * 0.55, Hh * 0.55, -L * 0.55, Hh * 0.80);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,253,255,' + 0.96 * k * alpha + ')';
    ctx.fill();

    // hot core line through it
    ctx.beginPath();
    ctx.moveTo(-L * 0.82, Hh * 0.10);
    ctx.lineTo(L * 0.92, -Hh * 0.06);
    ctx.strokeStyle = 'rgba(255,255,255,' + k * alpha + ')';
    ctx.lineWidth = Math.max(1.4, s * 0.014);
    ctx.stroke();

    // a small dark pupil slit so it still reads as an eye
    ctx.beginPath();
    ctx.ellipse(-L * 0.10, 0, L * 0.10, Hh * 0.52, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,4,16,' + 0.88 * k * alpha + ')';
    ctx.fill();

    ctx.restore();

    // the lid line, lifting as it opens
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.88 * alpha * (1 - k * 0.45) + ')';
    ctx.lineWidth = Math.max(1.6, s * 0.026);
    ctx.lineCap = 'round';
    const lidY = cyE + 0.086 * (1 - k);
    ctx.beginPath();
    ctx.moveTo((cxE - 0.118) * s, lidY * s);
    ctx.quadraticCurveTo(cxE * s, (lidY - 0.028 * k) * s, (cxE + 0.118) * s, lidY * s);
    ctx.stroke();
    ctx.restore();
  }

  // ---- brow, always present
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.46 * alpha + ')';
  ctx.lineWidth = Math.max(1.2, s * 0.020);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-0.700 * s, -0.300 * s);
  ctx.quadraticCurveTo(-0.480 * s, -0.365 * s, -0.280 * s, -0.280 * s);
  ctx.stroke();
  ctx.restore();
}

function drawEar(ctx, s, alpha) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.82 * alpha + ')';
  ctx.lineWidth = Math.max(1.4, s * 0.026);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0.500 * s, 0.080 * s);
  ctx.bezierCurveTo(0.760 * s, 0.040 * s, 0.770 * s, 0.500 * s, 0.520 * s, 0.560 * s);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.46 * alpha + ')';
  ctx.lineWidth = Math.max(1.0, s * 0.016);
  ctx.beginPath();
  ctx.moveTo(0.570 * s, 0.200 * s);
  ctx.quadraticCurveTo(0.680 * s, 0.360 * s, 0.570 * s, 0.430 * s);
  ctx.stroke();
  ctx.restore();
}

function drawMouth(ctx, s, alpha) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.74 * alpha + ')';
  ctx.lineWidth = Math.max(1.2, s * 0.019);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-0.884 * s, 0.630 * s);
  ctx.quadraticCurveTo(-0.862 * s, 0.655 * s, -0.845 * s, 0.672 * s);
  ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------- interior texture / detail
// Each sin gets its own engraved detail INSIDE the silhouette so the six
// figures stop looking like the same picture recoloured.

function drawInterior(ctx, s, accent, alpha, sin, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const line = (a, w) => {
    ctx.strokeStyle = rgba(accent, a * alpha);
    ctx.lineWidth = Math.max(1.0, s * w);
  };

  // a faint skull-plane seam every figure has, keeps the head from being a blob
  line(0.16, 0.016);
  ctx.beginPath();
  ctx.moveTo(-0.560 * s, -0.760 * s);
  ctx.quadraticCurveTo(-0.180 * s, -0.520 * s, 0.020 * s, -0.900 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-0.480 * s, 0.180 * s);
  ctx.quadraticCurveTo(0.020 * s, 0.420 * s, 0.560 * s, 0.240 * s);
  ctx.stroke();

  if (sin === 'lust') {
    // vertical light bars pouring down the face + a heart beating under the skin
    line(0.62, 0.020);
    for (let i = 0; i < 7; i++) {
      const x = -0.660 + i * 0.140;
      const len = 0.42 + (i % 3) * 0.18;
      ctx.beginPath();
      ctx.moveTo(x * s, -0.780 * s);
      ctx.lineTo(x * s, (-0.780 + len) * s);
      ctx.stroke();
    }
    line(0.50, 0.016);
    for (let i = 0; i < 4; i++) {
      const y0 = 0.040 + i * 0.230;
      ctx.beginPath();
      ctx.moveTo(-0.600 * s, y0 * s);
      ctx.lineTo(-0.380 * s, (y0 + 0.100) * s);
      ctx.lineTo(-0.160 * s, (y0 - 0.020) * s);
      ctx.stroke();
    }
    // pulsing heart
    const pulse = 0.55 + 0.45 * Math.sin(t * 3.4);
    ctx.save();
    ctx.translate(-0.180 * s, 0.300 * s);
    const r = 0.115 * s * (0.94 + pulse * 0.12);
    ctx.strokeStyle = rgba(accent, 0.80 * pulse * alpha);
    ctx.lineWidth = Math.max(1.4, s * 0.020);
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-r * 2.0, -r * 0.5, -r * 0.9, -r * 2.0, 0, -r * 0.72);
    ctx.bezierCurveTo(r * 0.9, -r * 2.0, r * 2.0, -r * 0.5, 0, r * 0.9);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  if (sin === 'gluttony') {
    // dense concentric hunger rings radiating from the jaw
    line(0.58, 0.017);
    for (let k = 0; k < 7; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = -0.9 + (i / 40) * 1.9;
        const rr = (0.26 + k * 0.145) * s;
        const x = (-0.230 + Math.cos(a) * rr / s) * s;
        const y = (0.480 + Math.sin(a) * rr / s) * s;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  if (sin === 'greed') {
    // stacked coin bars + a tally of vertical strokes
    line(0.66, 0.019);
    for (let k = 0; k < 7; k++) {
      const y = (-0.420 + k * 0.135);
      ctx.beginPath();
      ctx.moveTo(-0.500 * s, y * s);
      ctx.lineTo(0.240 * s, y * s);
      ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const x = (-0.560 + i * 0.110);
      ctx.beginPath();
      ctx.moveTo(x * s, 0.540 * s);
      ctx.lineTo(x * s, 0.760 * s);
      ctx.stroke();
    }
  }

  if (sin === 'sloth') {
    // heavy sagging sleep bands + a ticking clock
    line(0.56, 0.018);
    for (let k = 0; k < 8; k++) {
      ctx.beginPath();
      ctx.moveTo(-0.540 * s, (-0.420 + k * 0.230) * s);
      ctx.quadraticCurveTo(-0.120 * s, (-0.300 + k * 0.230) * s, 0.560 * s, (-0.420 + k * 0.230) * s);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(-0.150 * s, 0.360 * s);
    ctx.strokeStyle = rgba(accent, 0.55 * alpha);
    ctx.lineWidth = Math.max(1.2, s * 0.016);
    ctx.beginPath();
    ctx.arc(0, 0, 0.130 * s, 0, Math.PI * 2);
    ctx.stroke();
    const ha = -Math.PI / 2 + Math.sin(t * 0.35) * 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ha) * 0.100 * s, Math.sin(ha) * 0.100 * s);
    ctx.stroke();
    ctx.restore();
  }

  if (sin === 'anger') {
    // jagged fissures across the cheek and a hot core behind the brow
    line(0.85, 0.024);
    ctx.beginPath();
    ctx.moveTo(-0.640 * s, -0.020 * s);
    ctx.lineTo(-0.480 * s, 0.120 * s);
    ctx.lineTo(-0.560 * s, 0.240 * s);
    ctx.lineTo(-0.380 * s, 0.380 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.420 * s, -0.360 * s);
    ctx.lineTo(-0.260 * s, -0.220 * s);
    ctx.lineTo(-0.320 * s, -0.060 * s);
    ctx.stroke();
    const hot = 0.45 + 0.55 * Math.sin(t * 6.0);
    const hg = ctx.createRadialGradient(-0.500 * s, 0.120 * s, 0, -0.500 * s, 0.120 * s, 0.360 * s);
    hg.addColorStop(0, rgba(accent, 0.55 * hot * alpha));
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(-0.500 * s, 0.120 * s, 0.360 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  if (sin === 'envy') {
    // dense scale hatch across the temple + a watching slit
    line(0.60, 0.017);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 6; col++) {
        const x = (-0.520 + col * 0.150 + (row % 2) * 0.075);
        const y = (-0.640 + row * 0.150);
        ctx.beginPath();
        ctx.arc(x * s, y * s, 0.058 * s, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
    }
    // vertical slit pupil
    ctx.fillStyle = rgba(accent, 0.85 * alpha);
    ctx.beginPath();
    ctx.ellipse(-0.470 * s, 0.140 * s, 0.020 * s, 0.090 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (sin === 'pride') {
    // radiating crown-of-light lines from the forehead, plus a laurel arc
    line(0.52, 0.017);
    for (let i = 0; i < 17; i++) {
      const a = -Math.PI * 0.92 + (i / 16) * Math.PI * 0.70;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 0.34 * s, Math.sin(a) * 0.34 * s - 0.180 * s);
      ctx.lineTo(Math.cos(a) * 0.86 * s, Math.sin(a) * 0.86 * s - 0.180 * s);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-0.560 * s, 0.640 * s);
    ctx.quadraticCurveTo(-0.200 * s, 0.860 * s, 0.320 * s, 0.700 * s);
    ctx.stroke();
  }

  ctx.restore();
}

// ---------------------------------------------------------------- props
// Per-sin objects around the figure, as requested in the markers.
// Everything is drawn in head-local units so it scales with the figure.

function drawProps(ctx, s, accent, alpha, sin, t) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const A = (v) => clamp01(v) * alpha;

  // The props were reading as unreadable specks on a phone. Blow the whole layer
  // up and anchor it behind the bust so each object is legible at feed size.
  // anchor + scale solved so props land around x=0.42 of frame: clear of the
  // left-hand type (x<0.30) and clear of the bust (x>0.48).
  const PROP_SCALE = 2.2;
  ctx.translate(-0.78 * s, 0.26 * s);
  ctx.scale(PROP_SCALE, PROP_SCALE);
  ctx.translate(0.78, -0.26);

  if (sin === 'lust') {
    // phone charm on the left, hearts floating up out of it
    ctx.save();
    ctx.translate(-1.62 * s, 0.30 * s);
    ctx.strokeStyle = rgba(accent, A(0.92));
    ctx.lineWidth = Math.max(1.4, s * 0.016);
    ctx.beginPath();
    ctx.moveTo(0, -0.34 * s);
    ctx.quadraticCurveTo(0.10 * s, -0.16 * s, 0.02 * s, 0.02 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(-0.165 * s, 0.02 * s, 0.330 * s, 0.560 * s, 0.050 * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(accent, A(0.55));
    ctx.lineWidth = Math.max(0.8, s * 0.006);
    ctx.beginPath();
    ctx.roundRect(-0.118 * s, 0.082 * s, 0.236 * s, 0.420 * s, 0.028 * s);
    ctx.stroke();
    ctx.restore();

    // hearts rising out of the phone
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.42 + i * 0.21) % 1;
      const x = (-1.62 + Math.sin(ph * 5.0 + i) * 0.22) * s;
      const y = (0.28 - ph * 1.55) * s;
      const k = Math.sin(ph * Math.PI);
      const r = 0.062 * s * (0.55 + 0.45 * k);
      ctx.globalAlpha = A(0.85 * k);
      ctx.strokeStyle = rgba(accent, 0.95);
      ctx.lineWidth = Math.max(1.0, s * 0.009);
      ctx.beginPath();
      ctx.moveTo(x, y + r * 0.95);
      ctx.bezierCurveTo(x - r * 2.05, y - r * 0.55, x - r * 0.95, y - r * 2.05, x, y - r * 0.72);
      ctx.bezierCurveTo(x + r * 0.95, y - r * 2.05, x + r * 2.05, y - r * 0.55, x, y + r * 0.95);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  if (sin === 'gluttony') {
    // plate with food on the left, steam curling up
    ctx.save();
    ctx.translate(-1.70 * s, 0.66 * s);
    ctx.strokeStyle = rgba(accent, A(0.92));
    ctx.lineWidth = Math.max(1.4, s * 0.016);
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.360 * s, 0.115 * s, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 0.245 * s, 0.072 * s, 0, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(accent, A(0.50));
    ctx.lineWidth = Math.max(0.9, s * 0.007);
    ctx.stroke();
    ctx.strokeStyle = rgba(accent, A(0.88));
    ctx.lineWidth = Math.max(1.3, s * 0.013);
    ctx.beginPath();
    ctx.moveTo(-0.190 * s, -0.014 * s);
    ctx.quadraticCurveTo(-0.090 * s, -0.170 * s, 0.020 * s, -0.086 * s);
    ctx.quadraticCurveTo(0.130 * s, -0.150 * s, 0.196 * s, -0.014 * s);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const x0 = (-0.110 + i * 0.110) * s;
      const ph = (t * 0.55 + i * 0.33) % 1;
      ctx.globalAlpha = A(0.55 * Math.sin(ph * Math.PI));
      ctx.strokeStyle = rgba(accent, 0.85);
      ctx.lineWidth = Math.max(0.9, s * 0.007);
      ctx.beginPath();
      ctx.moveTo(x0, (-0.090 - ph * 0.30) * s);
      ctx.quadraticCurveTo(x0 + 0.055 * s, (-0.170 - ph * 0.30) * s,
                           x0 - 0.020 * s, (-0.250 - ph * 0.30) * s);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  if (sin === 'greed') {
    // coin glyphs drifting out
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const ph = (t * 0.34 + i * 0.20) % 1;
      const x = (-1.70 + ph * 0.95) * s;
      const y = (0.92 - ph * 0.72 + Math.sin(ph * 6 + i) * 0.06) * s;
      ctx.globalAlpha = A(0.85 * Math.sin(ph * Math.PI));
      ctx.strokeStyle = rgba(accent, 0.95);
      ctx.lineWidth = Math.max(1.0, s * 0.008);
      ctx.beginPath();
      ctx.arc(x, y, 0.165 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 0.062 * s, y - 0.070 * s);
      ctx.lineTo(x, y + 0.004 * s);
      ctx.lineTo(x + 0.062 * s, y - 0.070 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + 0.004 * s);
      ctx.lineTo(x, y + 0.086 * s);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // shopping cart - the comment singled this out, so it gets an extra bump
    ctx.save();
    ctx.translate(-1.72 * s, -0.30 * s);
    ctx.scale(1.55, 1.55);
    ctx.strokeStyle = rgba(accent, A(0.90));
    ctx.lineWidth = Math.max(1.4, s * 0.015);
    ctx.beginPath();
    ctx.moveTo(-0.180 * s, -0.130 * s);
    ctx.lineTo(-0.110 * s, -0.130 * s);
    ctx.lineTo(-0.030 * s, 0.090 * s);
    ctx.lineTo(0.230 * s, 0.090 * s);
    ctx.lineTo(0.290 * s, -0.090 * s);
    ctx.lineTo(-0.090 * s, -0.090 * s);
    ctx.stroke();
    for (const wx of [-0.010, 0.190]) {
      ctx.beginPath();
      ctx.arc(wx * s, 0.150 * s, 0.030 * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  }

  if (sin === 'sloth') {
    // ringing alarm clock + Zzz drifting off the head
    ctx.save();
    ctx.translate(-1.60 * s, 0.42 * s);
    const shake = Math.sin(t * 22) * 0.020 * s;
    ctx.translate(shake, 0);
    ctx.strokeStyle = rgba(accent, A(0.95));
    ctx.lineWidth = Math.max(1.5, s * 0.017);
    ctx.beginPath();
    ctx.arc(-0.130 * s, -0.140 * s, 0.070 * s, Math.PI, Math.PI * 2.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0.130 * s, -0.140 * s, 0.070 * s, Math.PI * 0.9, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0.010 * s, 0.185 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.0, s * 0.009);
    const ha = -Math.PI / 2 + Math.sin(t * 6) * 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0.010 * s);
    ctx.lineTo(Math.cos(ha) * 0.100 * s, 0.010 * s + Math.sin(ha) * 0.100 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0.010 * s);
    ctx.lineTo(0, 0.110 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.100 * s, 0.190 * s); ctx.lineTo(-0.150 * s, 0.250 * s);
    ctx.moveTo(0.100 * s, 0.190 * s); ctx.lineTo(0.150 * s, 0.250 * s);
    ctx.stroke();
    for (let i = 0; i < 2; i++) {
      const ph = (t * 1.1 + i * 0.5) % 1;
      ctx.globalAlpha = A(0.55 * (1 - ph));
      ctx.strokeStyle = rgba(accent, 0.90);
      ctx.lineWidth = Math.max(0.9, s * 0.007);
      ctx.beginPath();
      ctx.arc(0, 0.010 * s, (0.200 + ph * 0.170) * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Zzz
    ctx.save();
    const sizes = [0.150, 0.110, 0.078];
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.40 + i * 0.30) % 1;
      const x = (0.70 + ph * 0.85) * s;
      const y = (-1.55 - ph * 0.70) * s;
      ctx.globalAlpha = A(0.90 * Math.sin(ph * Math.PI));
      ctx.strokeStyle = rgba(accent, 0.95);
      ctx.lineWidth = Math.max(1.6, s * 0.024);
      const z = sizes[i] * s;
      ctx.beginPath();
      ctx.moveTo(x - z * 0.5, y - z * 0.5);
      ctx.lineTo(x + z * 0.5, y - z * 0.5);
      ctx.lineTo(x - z * 0.5, y + z * 0.5);
      ctx.lineTo(x + z * 0.5, y + z * 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  if (sin === 'anger') {
    // erupting volcano + anger cross
    ctx.save();
    ctx.translate(-1.72 * s, 0.78 * s);
    ctx.strokeStyle = rgba(accent, A(0.92));
    ctx.lineWidth = Math.max(1.4, s * 0.016);
    ctx.beginPath();
    ctx.moveTo(-0.520 * s, 0.240 * s);
    ctx.lineTo(-0.130 * s, -0.270 * s);
    ctx.lineTo(0.130 * s, -0.270 * s);
    ctx.lineTo(0.520 * s, 0.240 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.130 * s, -0.270 * s);
    ctx.lineTo(-0.045 * s, -0.160 * s);
    ctx.lineTo(0.045 * s, -0.160 * s);
    ctx.lineTo(0.130 * s, -0.270 * s);
    ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const ph = (t * 0.85 + i * 0.14) % 1;
      const ang = -Math.PI / 2 + (i - 3) * 0.22;
      const r0 = 0.10 * s + ph * 0.55 * s;
      ctx.globalAlpha = A(0.95 * (1 - ph));
      ctx.fillStyle = rgba(accent, 0.95);
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * r0 * 0.7, -0.150 * s + Math.sin(ang) * r0,
              (0.026 + 0.020 * (1 - ph)) * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    const k = 0.55 + 0.45 * Math.abs(Math.sin(t * 4.2));
    ctx.translate(1.28 * s, -1.18 * s);
    ctx.scale(k, k);
    ctx.strokeStyle = rgba(accent, A(0.95));
    ctx.lineWidth = Math.max(1.4, s * 0.014);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 0.070 * s, Math.sin(a) * 0.070 * s);
      ctx.lineTo(Math.cos(a) * 0.170 * s, Math.sin(a) * 0.170 * s);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (sin === 'envy') {
    // snake coiled around a gem
    ctx.save();
    ctx.translate(-1.66 * s, 0.50 * s);
    ctx.strokeStyle = rgba(accent, A(0.92));
    ctx.lineWidth = Math.max(1.5, s * 0.017);
    ctx.beginPath();
    ctx.moveTo(0, -0.230 * s);
    ctx.lineTo(0.170 * s, 0);
    ctx.lineTo(0, 0.230 * s);
    ctx.lineTo(-0.170 * s, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = rgba(accent, A(0.50));
    ctx.lineWidth = Math.max(0.8, s * 0.006);
    ctx.beginPath();
    ctx.moveTo(-0.170 * s, 0); ctx.lineTo(0.170 * s, 0);
    ctx.moveTo(0, -0.230 * s); ctx.lineTo(0, 0.230 * s);
    ctx.stroke();
    ctx.strokeStyle = rgba(accent, A(0.90));
    ctx.lineWidth = Math.max(1.4, s * 0.015);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const a = u * Math.PI * 4 + t * 0.9;
      const rr = (0.250 + u * 0.150) * s;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.72;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const ha = Math.PI * 4 + t * 0.9;
    const hx = Math.cos(ha) * 0.400 * s;
    const hy = Math.sin(ha) * 0.288 * s;
    ctx.beginPath();
    ctx.arc(hx, hy, 0.048 * s, 0, Math.PI * 2);
    ctx.fillStyle = rgba(accent, 0.92);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ---------------------------------------------------------------- decorations

// Headpiece from the reference: an explosive cluster of sharp spikes bursting
// from the top of the skull - no band, no even spacing, long ones mixed with
// short ones, all leaning back. Reads as ice crystal / flame, not a tiara.
function drawCrown(ctx, s, accent, alpha, o) {
  const g = o.glow || 0;
  const t = o.time || 0;
  const SPIKES = [
    { x: -0.36, len: 0.30, w: 0.030, lean: -0.55 },
    { x: -0.24, len: 0.52, w: 0.036, lean: -0.34 },
    { x: -0.12, len: 0.38, w: 0.028, lean: -0.16 },
    { x: -0.02, len: 0.74, w: 0.042, lean: -0.05 },
    { x:  0.09, len: 0.44, w: 0.030, lean:  0.10 },
    { x:  0.19, len: 0.62, w: 0.038, lean:  0.24 },
    { x:  0.30, len: 0.34, w: 0.026, lean:  0.42 },
    { x:  0.40, len: 0.46, w: 0.032, lean:  0.58 },
    { x:  0.50, len: 0.26, w: 0.022, lean:  0.72 },
    { x: -0.30, len: 0.18, w: 0.018, lean: -0.44 },
    { x: -0.06, len: 0.22, w: 0.020, lean: -0.10 },
    { x:  0.14, len: 0.19, w: 0.018, lean:  0.17 },
    { x:  0.25, len: 0.24, w: 0.020, lean:  0.33 },
    { x:  0.45, len: 0.16, w: 0.016, lean:  0.65 },
  ];

  const baseX = -0.070;
  const baseY = -0.945;

  ctx.save();
  ctx.translate(baseX * s, baseY * s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let i = 0; i < SPIKES.length; i++) {
    const sp = SPIKES[i];
    const x0 = sp.x * s;
    const y0 = 0;
    const tipX = (sp.x + sp.lean * sp.len) * s;
    const tipY = -sp.len * s;
    const midX = (sp.x + sp.lean * sp.len * 0.45 + Math.sin(t * 0.8 + i) * 0.012) * s;
    const midY = -sp.len * 0.52 * s;

    const isLong = sp.len > 0.33;
    if (isLong) {
      ctx.strokeStyle = rgba(accent, (0.16 + 0.14 * g) * alpha);
      ctx.lineWidth = Math.max(3.0, s * sp.w * 4.2);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(midX, midY, tipX, tipY);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(accent, (0.82 + 0.18 * g) * alpha);
    ctx.lineWidth = Math.max(1.6, s * sp.w * 1.9);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.72 * alpha + ')';
    ctx.lineWidth = Math.max(1.0, s * sp.w * 0.85);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();

    if (isLong) {
      const bg = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, s * 0.075);
      bg.addColorStop(0, 'rgba(255,255,255,' + 0.96 * alpha + ')');
      bg.addColorStop(0.38, rgba(accent, 0.72 * alpha));
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(tipX, tipY, s * 0.075, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const kg = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.28);
  kg.addColorStop(0, 'rgba(255,255,255,' + 0.55 * alpha + ')');
  kg.addColorStop(0.35, rgba(accent, 0.50 * alpha));
  kg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = kg;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHorns(ctx, s, accent, alpha) {
  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.90 * alpha);
  ctx.lineWidth = Math.max(2.0, s * 0.036);
  ctx.lineCap = 'round';
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sgn * 0.44 * s, -0.900 * s);
    ctx.quadraticCurveTo(sgn * 0.72 * s, -1.180 * s, sgn * 0.54 * s, -1.430 * s);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTopHat(ctx, s, accent, alpha) {
  ctx.save();
  ctx.translate(0, -0.960 * s);
  ctx.rotate(-0.10);
  ctx.strokeStyle = rgba(accent, 0.94 * alpha);
  ctx.lineWidth = Math.max(2.0, s * 0.034);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-0.840 * s, 0);
  ctx.lineTo(0.840 * s, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-0.470 * s, 0);
  ctx.lineTo(-0.430 * s, -0.700 * s);
  ctx.lineTo(0.430 * s, -0.700 * s);
  ctx.lineTo(0.470 * s, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.56 * alpha + ')';
  ctx.lineWidth = Math.max(1.3, s * 0.013);
  ctx.beginPath();
  ctx.moveTo(-0.456 * s, -0.175 * s);
  ctx.lineTo(0.456 * s, -0.175 * s);
  ctx.stroke();
  ctx.restore();
}

function drawFlames(ctx, s, accent, alpha, t) {
  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.94 * alpha);
  ctx.lineWidth = Math.max(1.8, s * 0.030);
  ctx.lineCap = 'round';
  const n = 11;
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    const ang = -Math.PI * 0.88 + p * Math.PI * 0.74;
    const wob = Math.sin(t * 5.0 + i * 1.3) * 0.065;
    const r0 = 1.00;
    const r1 = 1.66 + wob;
    const cx = Math.cos(ang) + 0.02;
    const cy = Math.sin(ang) - 0.14;
    const mx = Math.cos(ang + 0.09) * (r0 + (r1 - r0) * 0.58);
    const my = Math.sin(ang + 0.09) * (r0 + (r1 - r0) * 0.58) - 0.14;
    ctx.beginPath();
    ctx.moveTo(cx * r0 * s, cy * r0 * s);
    ctx.quadraticCurveTo(mx * s, my * s, cx * r1 * s, cy * r1 * s);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSnakes(ctx, s, accent, alpha, t) {
  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.88 * alpha);
  ctx.lineWidth = Math.max(1.6, s * 0.028);
  ctx.lineCap = 'round';
  const n = 13;
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1);
    const ang = -Math.PI * 0.92 + p * Math.PI * 0.86;
    const len = 0.44 + 0.17 * Math.sin(t * 2.2 + i * 0.9);
    const cx = Math.cos(ang);
    const cy = Math.sin(ang) - 0.20;
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const a0 = 1.02;
    const a1 = a0 + len;
    ctx.beginPath();
    ctx.moveTo(cx * a0 * s, cy * a0 * s);
    ctx.bezierCurveTo(
      cx * (a0 + len * 0.4) * s + nx * 0.13 * s, cy * (a0 + len * 0.4) * s + ny * 0.13 * s,
      cx * (a1 - 0.06) * s - nx * 0.13 * s, cy * (a1 - 0.06) * s - ny * 0.13 * s,
      cx * a1 * s, cy * a1 * s
    );
    ctx.stroke();
    const hx = cx * a1 * s;
    const hy = cy * a1 * s;
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, s * 0.11);
    hg.addColorStop(0, 'rgba(255,255,255,' + 0.96 * alpha + ')');
    hg.addColorStop(0.4, rgba(accent, 0.72 * alpha));
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(hx, hy, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawWaves(ctx, s, accent, alpha, t) {
  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.72 * alpha);
  ctx.lineWidth = Math.max(1.4, s * 0.023);
  for (let k = 0; k < 3; k++) {
    const r = (1.20 + k * 0.19) * s;
    ctx.beginPath();
    for (let i = 0; i <= 84; i++) {
      const a = -Math.PI * 0.96 + (i / 84) * Math.PI * 1.06;
      const rr = r + Math.sin(a * 7 + t * 1.8 + k * 1.2) * s * 0.042;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.90 - s * 0.34;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawHeart(ctx, s, accent, alpha, t) {
  ctx.save();
  ctx.translate(-0.05 * s, -1.28 * s);
  const pulse = 1 + Math.sin(t * 3.0) * 0.045;
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = rgba(accent, 0.94 * alpha);
  ctx.lineWidth = Math.max(2.0, s * 0.034);
  const r = 0.23 * s;
  ctx.beginPath();
  ctx.moveTo(0, r * 0.95);
  ctx.bezierCurveTo(-r * 2.1, -r * 0.5, -r * 0.95, -r * 2.2, 0, -r * 0.78);
  ctx.bezierCurveTo(r * 0.95, -r * 2.2, r * 2.1, -r * 0.5, 0, r * 0.95);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawSpikes(ctx, s, accent, alpha) {
  ctx.save();
  ctx.strokeStyle = rgba(accent, 0.55 * alpha);
  ctx.lineWidth = Math.max(1.0, s * 0.008);
  const n = 34;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r0 = 1.70;
    const r1 = 1.70 + (i % 4 === 0 ? 0.34 : 0.16);
    const cx = Math.cos(a);
    const cy = Math.sin(a) + HALO_CY;
    ctx.beginPath();
    ctx.moveTo(cx * r0 * s, cy * r0 * s);
    ctx.lineTo(cx * r1 * s, cy * r1 * s);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- halo & collar

function drawHalo(ctx, s, accent, alpha, o, t) {
  const ringA = (o.haloAlpha === undefined ? 1 : o.haloAlpha) * alpha;
  if (ringA <= 0.002) return;
  const R = HALO_RADIUS;
  const CY = HALO_CY;

  // `drawProgress` < 1 draws only part of the ring, so pride can be traced in.
  const prog = o.haloDraw === undefined ? 1 : clamp01(o.haloDraw);

  ctx.save();
  ctx.translate(0, CY * s);

  if (prog < 1) {
    // partially drawn ring: an arc plus a hot drawing tip
    const a0 = -Math.PI / 2;
    const a1 = a0 + Math.PI * 2 * prog;
    ctx.strokeStyle = rgba(accent, 0.72 * ringA);
    ctx.lineWidth = Math.max(2.4, s * 0.046);
    ctx.beginPath();
    ctx.arc(0, 0, R * s, a0, a1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.62 * ringA + ')';
    ctx.lineWidth = Math.max(1.2, s * 0.015);
    ctx.beginPath();
    ctx.arc(0, 0, R * s, a0, a1);
    ctx.stroke();
    // the pen tip
    const tx = Math.cos(a1) * R * s;
    const ty = Math.sin(a1) * R * s;
    const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, s * 0.28);
    tg.addColorStop(0, 'rgba(255,255,255,' + 0.95 * ringA + ')');
    tg.addColorStop(0.35, rgba(accent, 0.70 * ringA));
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.arc(tx, ty, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const rg = ctx.createRadialGradient(0, 0, R * s * 0.88, 0, 0, R * s * 1.14);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(0.55, rgba(accent, 0.18 * ringA));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, R * s * 1.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rgba(accent, 0.72 * ringA);
    ctx.lineWidth = Math.max(2.4, s * 0.046);
    ctx.beginPath();
    ctx.arc(0, 0, R * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,' + 0.62 * ringA + ')';
    ctx.lineWidth = Math.max(1.2, s * 0.015);
    ctx.beginPath();
    ctx.arc(0, 0, R * s, 0, Math.PI * 2);
    ctx.stroke();

    // tick marks on the ring, as in the reference: short radial strokes every
    // few degrees, longer every 6th, plus a few outward rays
    const tickRot = o.haloRot === undefined ? 0 : o.haloRot;
    ctx.strokeStyle = rgba(accent, 0.42 * ringA);
    ctx.lineWidth = Math.max(1.0, s * 0.010);
    for (let i = 0; i < 72; i++) {
      const a = tickRot + (i / 72) * Math.PI * 2;
      const long = i % 6 === 0;
      const r0 = R * s;
      const r1 = r0 + s * (long ? 0.115 : 0.055);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(accent, 0.30 * ringA);
    ctx.lineWidth = Math.max(1.2, s * 0.013);
    for (let i = 0; i < 12; i++) {
      const a = tickRot + (i / 12) * Math.PI * 2 + 0.13;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R * s, Math.sin(a) * R * s);
      ctx.lineTo(Math.cos(a) * (R + 0.30) * s, Math.sin(a) * (R + 0.30) * s);
      ctx.stroke();
    }
  }

  const lit = o.haloProgress === undefined ? 1 : o.haloProgress;
  const rot = o.haloRot === undefined ? 0 : o.haloRot;
  // only place eyes on the part of the ring that has been drawn
  const visibleArc = prog >= 1 ? 1 : prog;
  for (let i = 0; i < HALO_EYES; i++) {
    const frac = i / HALO_EYES;
    if (frac > visibleArc) continue;
    const ang = rot + frac * Math.PI * 2 - Math.PI / 2;
    const local = clamp01((lit * HALO_EYES - i) / 1.0);
    if (local <= 0) continue;
    const k = easeOutQuint(local);
    const ex0 = Math.cos(ang) * R * s;
    const ey0 = Math.sin(ang) * R * s;

    ctx.save();
    ctx.translate(ex0, ey0);
    ctx.rotate(ang + Math.PI / 2);
    const sc = 0.70 + 0.30 * k;
    ctx.scale(sc, sc);

    const ex = s * 0.165;
    const ey = s * 0.084;

    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ex * 2.2);
    g.addColorStop(0, 'rgba(255,255,255,' + 0.96 * k * ringA + ')');
    g.addColorStop(0.34, rgba(accent, 0.60 * k * ringA));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, ex * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,' + 0.95 * k * ringA + ')';
    ctx.lineWidth = Math.max(1.3, s * 0.013);
    ctx.beginPath();
    ctx.moveTo(-ex, 0);
    ctx.quadraticCurveTo(0, -ey * 1.55, ex, 0);
    ctx.quadraticCurveTo(0, ey * 1.55, -ex, 0);
    ctx.stroke();

    ctx.fillStyle = rgba(accent, 0.96 * k * ringA);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.8, ey * 0.54), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + 0.96 * k * ringA + ')';
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.0, ey * 0.27), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = rgba(accent, 0.76 * k * ringA);
    ctx.lineWidth = Math.max(0.9, s * 0.007);
    ctx.lineCap = 'round';
    for (let f = -1; f <= 1; f++) {
      const ax = ex * 0.70;
      const ay = f * ey * 0.60;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + s * 0.120, ay * 2.05);
      ctx.stroke();
    }
    ctx.restore();

    if (local > 0 && local < 1) {
      const f = 1 - local;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.82 * f * ringA + ')';
      ctx.lineWidth = Math.max(1.6, s * 0.022);
      ctx.beginPath();
      ctx.arc(ex0, ey0, s * (0.16 + 0.48 * (1 - f)), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (local >= 1) {
      const br = 0.55 + 0.45 * Math.sin(t * 2.6 + i * 0.9);
      ctx.save();
      const dg = ctx.createRadialGradient(ex0, ey0, 0, ex0, ey0, s * 0.34);
      dg.addColorStop(0, 'rgba(255,255,255,' + 0.56 * br * ringA + ')');
      dg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.arc(ex0, ey0, s * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

// Body: shoulders/chest outline plus a few interior seams, so the figure is a
// bust and not a floating head.
function drawBody(ctx, s, accent, alpha, drawProgress) {
  const p = drawProgress === undefined ? 1 : clamp01(drawProgress);
  if (p <= 0.001) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // fill the bust so the halo does not show through the shoulders
  ctx.beginPath();
  smoothOpen(ctx, scaled(BODY_LEFT, s));
  for (let i = BODY_RIGHT.length - 1; i >= 0; i--) {
    ctx.lineTo(BODY_RIGHT[i][0] * s, BODY_RIGHT[i][1] * s);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,' + 0.94 * alpha + ')';
  ctx.fill();

  // outline, drawn from the neck outward
  const drawSide = (pts) => {
    const n = pts.length;
    const upto = Math.max(2, Math.round(n * p));
    const sub = pts.slice(0, upto);
    ctx.beginPath();
    ctx.moveTo(sub[0][0] * s, sub[0][1] * s);
    for (let i = 1; i < sub.length; i++) ctx.lineTo(sub[i][0] * s, sub[i][1] * s);
    ctx.stroke();
  };
  const passes = [
    { w: 0.060, a: 0.13, c: accent },
    { w: 0.030, a: 0.88, c: accent },
    { w: 0.013, a: 0.98, c: [255, 255, 255] },
  ];
  for (const ps of passes) {
    ctx.strokeStyle = rgba(ps.c, ps.a * alpha);
    ctx.lineWidth = Math.max(1.0, s * ps.w);
    drawSide(BODY_LEFT);
    drawSide(BODY_RIGHT);
  }

  // interior seams: a chest V and a shoulder line
  if (p > 0.7) {
    const k = (p - 0.7) / 0.3;
    ctx.strokeStyle = rgba(accent, 0.30 * k * alpha);
    ctx.lineWidth = Math.max(1.0, s * 0.016);
    ctx.beginPath();
    ctx.moveTo(-0.420 * s, 2.060 * s);
    ctx.quadraticCurveTo(-0.180 * s, 2.420 * s, 0.060 * s, 2.180 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-1.560 * s, 2.760 * s);
    ctx.quadraticCurveTo(-0.200 * s, 2.480 * s, 1.240 * s, 2.740 * s);
    ctx.stroke();
    // crossed geometric shards across both shoulders - the reference has these
    // and they are what makes the bust read as broken armour rather than cloth
    ctx.strokeStyle = rgba(accent, 0.42 * k * alpha);
    ctx.lineWidth = Math.max(1.2, s * 0.018);
    const SHARDS = [
      [-1.640, 2.520, -0.980, 2.980],
      [-1.520, 2.980, -0.900, 2.500],
      [-1.180, 2.640, -0.620, 2.960],
      [ 1.560, 2.480, 0.960, 2.940],
      [ 1.700, 2.900, 1.020, 2.460],
      [ 1.120, 2.600, 0.560, 2.920],
      // a couple of long diagonals tying the two sides together
      [-0.760, 2.300,  0.520, 2.760],
      [ 0.640, 2.240, -0.460, 2.700],
    ];
    for (const [ax, ay, bx, by] of SHARDS) {
      ctx.beginPath();
      ctx.moveTo(ax * s, ay * s);
      ctx.lineTo(bx * s, by * s);
      ctx.stroke();
    }
    // small diamond studs at some intersections
    ctx.fillStyle = rgba(accent, 0.55 * k * alpha);
    for (const [ax, ay, bx, by] of SHARDS.slice(0, 6)) {
      const mx = ((ax + bx) / 2) * s;
      const my = ((ay + by) / 2) * s;
      const r = s * 0.030;
      ctx.beginPath();
      ctx.moveTo(mx, my - r);
      ctx.lineTo(mx + r, my);
      ctx.lineTo(mx, my + r);
      ctx.lineTo(mx - r, my);
      ctx.closePath();
      ctx.fill();
    }

    // collarbone ticks
    for (let i = 0; i < 5; i++) {
      const x = -1.100 + i * 0.520;
      ctx.beginPath();
      ctx.moveTo(x * s, 2.400 * s);
      ctx.lineTo((x + 0.060) * s, 2.470 * s);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A bold emblem on the chest, different per sin. High contrast on purpose: at
// thumbnail size this is what tells the six figures apart.
function drawEmblem(ctx, s, accent, alpha, sin, t) {
  const ex = -0.100;
  const ey = 2.560;
  const R = 0.360;

  ctx.save();
  ctx.translate(ex * s, ey * s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const stroke = (a, w) => {
    ctx.strokeStyle = rgba(accent, a * alpha);
    ctx.lineWidth = Math.max(1.6, s * w);
  };
  const fill = (a) => { ctx.fillStyle = rgba(accent, a * alpha); };

  // shared backing disc so every emblem sits on the same plate
  ctx.save();
  const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * s * 1.5);
  bg.addColorStop(0, rgba(accent, 0.20 * alpha));
  bg.addColorStop(0.62, rgba(accent, 0.07 * alpha));
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, R * s * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (sin === 'lust') {
    // heart, solid, with a beat
    const k = 1 + Math.sin(t * 3.4) * 0.06;
    ctx.scale(k, k);
    const r = R * s * 0.62;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.95);
    ctx.bezierCurveTo(-r * 2.05, -r * 0.55, -r * 0.95, -r * 2.1, 0, -r * 0.72);
    ctx.bezierCurveTo(r * 0.95, -r * 2.1, r * 2.05, -r * 0.55, 0, r * 0.95);
    ctx.closePath();
    fill(0.42);
    ctx.fill();
    stroke(0.95, 0.030);
    ctx.stroke();
  }

  if (sin === 'gluttony') {
    // three stacked bowls
    for (let i = 0; i < 3; i++) {
      const y = (-0.20 + i * 0.24) * s;
      const w = (0.62 - i * 0.09) * s;
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.quadraticCurveTo(0, y + 0.34 * s, w, y);
      ctx.stroke();
      stroke(0.55 - i * 0.10, 0.020);
    }
    stroke(0.95, 0.032);
    for (let i = 0; i < 3; i++) {
      const y = (-0.20 + i * 0.24) * s;
      const w = (0.62 - i * 0.09) * s;
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.quadraticCurveTo(0, y + 0.34 * s, w, y);
      ctx.stroke();
    }
  }

  if (sin === 'greed') {
    // a filled coin stack
    for (let i = 0; i < 4; i++) {
      const y = (0.30 - i * 0.20) * s;
      const w = (0.66 - i * 0.05) * s;
      ctx.beginPath();
      ctx.ellipse(0, y, w, 0.085 * s, 0, 0, Math.PI * 2);
      fill(0.30 + i * 0.10);
      ctx.fill();
      stroke(0.90, 0.024);
      ctx.stroke();
    }
  }

  if (sin === 'sloth') {
    // a big slow clock with a drooping hand
    ctx.beginPath();
    ctx.arc(0, 0, R * s * 0.86, 0, Math.PI * 2);
    stroke(0.90, 0.030);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * R * s * 0.72, Math.sin(a) * R * s * 0.72);
      ctx.lineTo(Math.cos(a) * R * s * 0.84, Math.sin(a) * R * s * 0.84);
      stroke(0.50, 0.016);
      ctx.stroke();
    }
    const ha = -Math.PI / 2 + Math.sin(t * 0.5) * 0.9;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ha) * R * s * 0.58, Math.sin(ha) * R * s * 0.58);
    stroke(0.98, 0.036);
    ctx.stroke();
  }

  if (sin === 'anger') {
    // a filled jagged starburst
    ctx.beginPath();
    const spikes = 11;
    for (let i = 0; i < spikes * 2; i++) {
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const rr = (i % 2 === 0 ? R * 0.95 : R * 0.46) * s;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    fill(0.34);
    ctx.fill();
    stroke(0.96, 0.030);
    ctx.stroke();
  }

  if (sin === 'envy') {
    // a big watching eye
    const w = R * s * 1.00;
    const hh = R * s * 0.56;
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.quadraticCurveTo(0, -hh * 1.6, w, 0);
    ctx.quadraticCurveTo(0, hh * 1.6, -w, 0);
    fill(0.22);
    ctx.fill();
    stroke(0.95, 0.030);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, R * s * 0.34, 0, Math.PI * 2);
    fill(0.85);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, R * s * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6,4,12,' + 0.95 * alpha + ')';
    ctx.fill();
  }

  if (sin === 'pride') {
    // a filled crown glyph
    ctx.beginPath();
    ctx.moveTo(-R * s * 0.92, R * s * 0.46);
    ctx.lineTo(-R * s * 0.92, -R * s * 0.16);
    ctx.lineTo(-R * s * 0.46, R * s * 0.10);
    ctx.lineTo(0, -R * s * 0.62);
    ctx.lineTo(R * s * 0.46, R * s * 0.10);
    ctx.lineTo(R * s * 0.92, -R * s * 0.16);
    ctx.lineTo(R * s * 0.92, R * s * 0.46);
    ctx.closePath();
    fill(0.34);
    ctx.fill();
    stroke(0.96, 0.032);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCollar(ctx, s, accent, alpha) {
  ctx.save();
  const poly = COLLAR.map((p) => [p[0] * s, p[1] * s]);
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
  ctx.fillStyle = rgba(accent, 0.13 * alpha);
  ctx.fill();
  ctx.strokeStyle = rgba(accent, 0.84 * alpha);
  ctx.lineWidth = Math.max(2.4, s * 0.046);
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,' + 0.40 * alpha + ')';
  ctx.lineWidth = Math.max(1.2, s * 0.015);
  ctx.beginPath();
  ctx.moveTo(-0.600 * s, 1.660 * s);
  ctx.lineTo(-0.850 * s, 1.920 * s);
  ctx.stroke();

  ctx.fillStyle = rgba(accent, 0.90 * alpha);
  for (let i = 0; i < 7; i++) {
    const p = i / 6;
    ctx.beginPath();
    ctx.arc((-0.740 + p * 1.400) * s, 1.800 * s, Math.max(1.7, s * 0.025), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(0.010 * s, 1.820 * s);
  ctx.rotate(Math.PI / 4);
  const dw = s * 0.080;
  ctx.fillStyle = rgba(accent, 0.56 * alpha);
  ctx.fillRect(-dw, -dw, dw * 2, dw * 2);
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.94 * alpha + ')';
  ctx.lineWidth = Math.max(1.6, s * 0.024);
  ctx.strokeRect(-dw, -dw, dw * 2, dw * 2);
  ctx.restore();
  ctx.restore();
}

// -------------------------------------------------------------------- compose

// Draw the whole figure around (0,0). `scale` is the head half-height in px.
//
// o: { scale, accent, sin, alpha, glow, time,
//      haloProgress, haloRot, haloAlpha, haloDraw,
//      eyeOpen,  bodyProgress, detailAlpha }
export function drawFigure(ctx, o) {
  const s = o.scale;
  const accent = o.accent;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const glow = o.glow === undefined ? 0 : o.glow;
  const t = o.time || 0;

  ctx.save();

  // wide soft bloom
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const outer = ctx.createRadialGradient(0, 0, s * 0.12, 0, 0, s * 2.30);
  outer.addColorStop(0, rgba(accent, (0.15 + 0.17 * glow) * alpha));
  outer.addColorStop(0.55, rgba(accent, (0.058 + 0.075 * glow) * alpha));
  outer.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = outer;
  ctx.beginPath();
  ctx.arc(0, 0, s * 2.30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // halo sits behind everything
  drawHalo(ctx, s, accent, alpha, o, t);

  // per-sin props float around the figure, behind the head
  if (o.props !== false) {
    // props sit behind the bust, so they get their own brightness instead of
    // inheriting the figure's (which dips to 0.88 on the scene half).
    const propA = o.propAlpha === undefined ? 1 : o.propAlpha;
    drawProps(ctx, s, accent, propA, o.sin, t);
  }

  // body behind the head (drawn first so the head outline wins at the join)
  drawBody(ctx, s, accent, alpha, o.bodyProgress === undefined ? 1 : o.bodyProgress);

  // marker #11: sloth slumps - the whole bust tilts and sinks slightly
  const slump = o.sin === 'sloth' ? 1 : 0;
  if (slump) {
    ctx.save();
    ctx.translate(0, 0.060 * s);
    ctx.rotate(0.075);
  }

  // head silhouette
  sharpClosed(ctx, scaled(PROFILE, s), 0.10);
  ctx.fillStyle = 'rgba(0,0,0,' + 0.95 * alpha + ')';
  ctx.fill();

  // decorations behind the head
  if (o.sin === 'greed') drawTopHat(ctx, s, accent, alpha);
  if (o.sin === 'gluttony') drawHorns(ctx, s, accent, alpha);
  if (o.sin === 'sloth') drawWaves(ctx, s, accent, alpha, t);
  if (o.sin === 'envy') drawSnakes(ctx, s, accent, alpha, t);
  if (o.sin === 'lust') drawHeart(ctx, s, accent, alpha, t);
  if (o.sin === 'pride') drawSpikes(ctx, s, accent, alpha);

  // engraved interior detail (per sin)
  drawInterior(ctx, s, accent, alpha * (o.detailAlpha === undefined ? 1 : o.detailAlpha), o.sin, t);

  // three-pass outline
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Tighter passes: the old 0.100-wide bloom was what made the silhouette read
  // as soft. A hard core with a narrow halo keeps the corners visible.
  const passes = [
    { w: 0.062, a: 0.13 + 0.16 * glow, c: accent },
    { w: 0.030, a: 0.92, c: accent },
    { w: 0.013, a: 1.00, c: [255, 255, 255] },
  ];
  for (const ps of passes) {
    sharpClosed(ctx, scaled(PROFILE, s), 0.06);
    ctx.strokeStyle = rgba(ps.c, ps.a * alpha);
    ctx.lineWidth = Math.max(1.0, s * ps.w);
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 6;
    ctx.stroke();
  }
  ctx.restore();

  // features
  drawEye(ctx, s, alpha, o.eyeOpen === undefined ? 0 : o.eyeOpen, accent, o.sin, t);
  drawEar(ctx, s, alpha);
  drawMouth(ctx, s, alpha);

  // decorations on top of the head
  if (o.sin === 'pride') drawCrown(ctx, s, accent, alpha, o);
  if (o.sin === 'anger') drawFlames(ctx, s, accent, alpha, t);

  if (slump) ctx.restore();

  // collar
  drawCollar(ctx, s, accent, alpha);

  // per-sin chest emblem
  if (o.emblem !== false) drawEmblem(ctx, s, accent, alpha, o.sin, t);

  ctx.restore();
}
