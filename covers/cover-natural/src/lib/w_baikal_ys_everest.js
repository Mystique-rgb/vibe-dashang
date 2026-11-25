// Landscapes 5-7: baikal, yellowstone, everest.

import { clamp01, rgba, rng } from './gfx.js';
import { TAU, line, fillPoly, vgrad, traceSet, dstep, wavy, WONDER_POINTS } from './wcore.js';

// ----------------------------------------------------------------- baikal
// A frozen plane in perspective, white cracks radiating, ice hummocks.
export function baikal(c, k) {
  const { U, accent, A, G, t, rev, det } = k;
  const lw = 2.0 * U;
  const HZ = -0.255;

  // far shore
  const shore = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    shore.push([-0.52 + u * 1.04, HZ - 0.012 - Math.abs(Math.sin(u * 5.1)) * 0.045]);
  }
  line(c, shore, accent, lw * 1.1, 0.62 * A * clamp01(rev * 1.6), G * 0.8);

  // perspective grid on the ice, thinning toward the horizon
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 1; i <= 8; i++) {
    const u = i / 8;
    const y = HZ + Math.pow(u, 1.9) * 0.80;
    c.strokeStyle = rgba(accent, (0.055 + 0.045 * u) * A);
    c.lineWidth = lw * (0.5 + u * 0.7);
    c.beginPath();
    c.moveTo(-0.52, y);
    c.lineTo(0.52, y);
    c.stroke();
  }
  c.restore();

  // radiating cracks
  const centers = [
    { x: -0.16, y: 0.150, n: 7, len: 0.42 },
    { x: 0.20, y: 0.020, n: 5, len: 0.30 },
  ];
  let idx = 0;
  for (const ct of centers) {
    for (let i = 0; i < ct.n; i++) {
      const d = dstep(det, idx % WONDER_POINTS, WONDER_POINTS);
      idx++;
      if (d <= 0) continue;
      const flash = 1 + 1.2 * (1 - d);
      const ang = (i / ct.n) * TAU + ct.x * 3.1;
      const reach = ct.len * (0.55 + 0.65 * Math.abs(Math.sin(i * 2.3 + ct.y * 9)));
      const pts = [];
      for (let j = 0; j <= 8; j++) {
        const u = (j / 8) * d;
        const jitter = Math.sin(j * 2.7 + i) * 0.012 * u;
        pts.push([
          ct.x + Math.cos(ang) * reach * u + Math.cos(ang + 1.57) * jitter,
          ct.y + Math.sin(ang) * reach * u * 0.55 + Math.sin(ang + 1.57) * jitter * 0.5,
        ]);
      }
      line(c, pts, [255, 255, 255], lw * (1.0 + 0.4 * (1 - d)),
           0.55 * A * d * flash, G * 1.3);
    }
  }

  // ice hummocks: angular shards, bigger toward the camera
  const hr = rng(8803);
  for (let i = 0; i < 6; i++) {
    const d = dstep(det, i, 6);
    if (d <= 0) continue;
    const y = 0.19 + i * 0.062;
    const x = -0.40 + hr() * 0.80;
    const w = 0.045 + i * 0.020;
    const h = 0.020 + i * 0.014;
    const poly = [
      [x - w, y], [x - w * 0.35, y - h * (0.6 + hr() * 0.7)],
      [x + w * 0.15, y - h], [x + w * 0.75, y - h * 0.4], [x + w, y],
    ];
    fillPoly(c, poly, rgba(accent, 0.20 * A * d));
    line(c, poly, [230, 248, 255], lw * 0.9, 0.60 * A * d, G * 0.8, true);
  }

  // blowing snow drifting across the ice
  c.save();
  c.globalCompositeOperation = 'lighter';
  const sr = rng(6621);
  for (let i = 0; i < 44; i++) {
    const seed = sr();
    const x = ((seed + t * (0.06 + sr() * 0.09)) % 1.15) - 0.08;
    const y = HZ + 0.03 + sr() * 0.52;
    const a = 0.10 + 0.22 * Math.abs(Math.sin(t * 1.7 + i));
    c.fillStyle = rgba([255, 255, 255], a * A);
    c.beginPath();
    c.arc(x, y, (0.6 + sr() * 1.4) * U * 2.0, 0, TAU);
    c.fill();
  }
  c.restore();
}

// ------------------------------------------------------------- yellowstone
// A geyser cone throwing a steam column, a prismatic spring below.
export function yellowstone(c, k) {
  const { U, accent, A, G, t, rev, det } = k;
  const lw = 2.0 * U;

  // prismatic spring: concentric rings in perspective
  const SX = 0.02;
  const SY = 0.395;
  const RX = 0.46;
  const RY = 0.125;
  const bands = [
    { s: 1.00, col: [255, 122, 26], a: 0.55 },
    { s: 0.80, col: [242, 196, 14], a: 0.60 },
    { s: 0.62, col: [170, 220, 90], a: 0.50 },
    { s: 0.45, col: [70, 200, 210], a: 0.55 },
    { s: 0.28, col: [40, 120, 220], a: 0.65 },
  ];
  c.save();
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    const d = dstep(det, i, bands.length);
    if (d <= 0) continue;
    const rr = b.s * (1 + (1 - d) * 0.20);
    c.strokeStyle = rgba(b.col, b.a * A * d);
    c.lineWidth = lw * 2.0;
    c.beginPath();
    c.ellipse(SX, SY, RX * rr, RY * rr, 0, 0, TAU);
    c.stroke();
  }
  c.globalCompositeOperation = 'lighter';
  const core = c.createRadialGradient(SX, SY, 0, SX, SY, RX * 0.30);
  core.addColorStop(0, 'rgba(120,200,255,' + (0.34 * A * clamp01(det * 1.5)) + ')');
  core.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = core;
  c.beginPath();
  c.ellipse(SX, SY, RX * 0.30, RY * 0.30, 0, 0, TAU);
  c.fill();
  c.restore();

  // geyser cone behind the spring
  const cone = [
    [-0.36, 0.245], [-0.30, 0.150], [-0.26, 0.100], [-0.235, 0.062],
    [-0.205, 0.052], [-0.175, 0.066], [-0.155, 0.106], [-0.12, 0.158],
    [-0.075, 0.250],
  ];
  fillPoly(c, cone.concat([[-0.075, 0.30], [-0.36, 0.30]]),
           vgrad(c, 0.05, 0.30, accent, 0.26 * A, 0.10 * A));
  line(c, cone, accent, lw * 1.3, 0.86 * A * clamp01(rev * 1.6), G * 1.0);

  // steam column: twelve strands rising and dissolving
  const N = 12;
  const VX = -0.205;
  const VY = 0.048;
  const sr = rng(5507);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++) {
    const d = dstep(det, i, N);
    if (d <= 0) continue;
    const flash = 1 + 0.8 * (1 - d);
    const spread = 0.055 + i * 0.011;
    const topY = -0.50 + sr() * 0.05;
    const pts = wavy(
      VX + (sr() - 0.5) * 0.02, VY,
      VX + (sr() - 0.5) * spread * 2.2, topY,
      spread * (0.5 + sr() * 0.6), 1.6 + sr() * 1.2,
      t * 0.8 + i * 1.7, 16
    );
    const a = (0.26 + 0.20 * (1 - i / N)) * A * d * flash;
    c.strokeStyle = rgba(i % 3 === 0 ? [255, 255, 255] : accent, a);
    c.lineWidth = lw * (1.4 + sr() * 1.4);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let j = 1; j < pts.length; j++) c.lineTo(pts[j][0], pts[j][1]);
    c.stroke();
  }
  const mg = c.createRadialGradient(VX, VY - 0.02, 0, VX, VY - 0.02, 0.16);
  mg.addColorStop(0, 'rgba(255,255,255,' + (0.22 * A) + ')');
  mg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = mg;
  c.beginPath();
  c.arc(VX, VY - 0.02, 0.16, 0, TAU);
  c.fill();
  c.restore();

  // dead lodgepole pines at the base
  for (let i = 0; i < 5; i++) {
    const x = 0.24 + i * 0.048;
    const h = 0.075 + (i % 3) * 0.022;
    const y = 0.318;
    line(c, [[x, y], [x + 0.004, y - h]], accent, lw * 0.7,
         0.42 * A * clamp01(det * 1.3), G * 0.4);
  }
}

// ---------------------------------------------------------------- everest
// Pyramid summit, three rock bands, a plume torn off by the jet stream.
export function everest(c, k) {
  const { U, accent, A, G, t, rev, det } = k;
  const lw = 2.0 * U;
  const SX = 0.045;
  const SY = -0.445;

  const outline = [
    [SX, SY],
    [SX - 0.045, SY + 0.062],
    [SX - 0.075, SY + 0.128],
    [SX - 0.128, SY + 0.196],
    [SX - 0.152, SY + 0.268],
    [SX - 0.225, SY + 0.330],
    [SX - 0.268, SY + 0.402],
    [SX - 0.352, SY + 0.462],
    [SX - 0.430, SY + 0.548],
    [SX - 0.520, SY + 0.600],
  ];
  const rightSide = [
    [SX, SY],
    [SX + 0.052, SY + 0.058],
    [SX + 0.088, SY + 0.116],
    [SX + 0.155, SY + 0.170],
    [SX + 0.196, SY + 0.238],
    [SX + 0.272, SY + 0.292],
    [SX + 0.330, SY + 0.360],
    [SX + 0.420, SY + 0.412],
    [SX + 0.520, SY + 0.452],
  ];
  const base = [[SX + 0.520, SY + 0.452], [SX + 0.520, 0.60],
                [SX - 0.520, 0.60], [SX - 0.520, SY + 0.600]];
  const face = outline.concat(base, rightSide.slice().reverse());

  fillPoly(c, face, vgrad(c, SY, 0.55, accent, 0.20 * A, 0.055 * A));

  // the outline traces in like a pen stroke
  traceSet(c, [outline, rightSide], rev, accent, lw * 1.7, 0.95 * A, G * 1.2);

  // the front ridge splits the face into two planes
  const frontRidge = [
    [SX, SY],
    [SX + 0.030, SY + 0.110],
    [SX + 0.020, SY + 0.215],
    [SX - 0.010, SY + 0.330],
    [SX - 0.040, SY + 0.455],
    [SX - 0.058, SY + 0.600],
  ];
  line(c, frontRidge, accent, lw * 1.0, 0.62 * A * clamp01(rev * 1.4), G * 0.7);

  // secondary spurs
  const spurs = [
    [[SX - 0.128, SY + 0.196], [SX - 0.060, SY + 0.330], [SX - 0.030, SY + 0.470]],
    [[SX + 0.155, SY + 0.170], [SX + 0.090, SY + 0.300], [SX + 0.060, SY + 0.450]],
  ];
  for (const sp of spurs) line(c, sp, accent, lw * 0.7, 0.34 * A * clamp01(rev * 1.4), G * 0.4);

  // rock bands across the face; the yellow band is the famous one
  const N = 12;
  const br = rng(2207);
  for (let i = 0; i < N; i++) {
    const d = dstep(det, i, N);
    if (d <= 0) continue;
    const flash = 1 + 0.9 * (1 - d);
    const y = SY + 0.075 + (i / N) * 0.50;
    const u = (y - SY) / 0.52;
    const halfW = 0.055 + u * 0.46;
    const sag = 0.030 * Math.sin(u * 2.6);
    const pts = [];
    for (let j = 0; j <= 10; j++) {
      const v = j / 10;
      const x = SX - halfW + v * halfW * 2;
      const wob = Math.sin(v * 4.2 + i * 1.3) * 0.012;
      pts.push([x, y + sag * (1 - Math.abs(v * 2 - 1)) + wob]);
    }
    const isBand = i === 4;
    line(c, pts, isBand ? [255, 214, 120] : accent,
         lw * (isBand ? 1.5 : 0.75),
         (isBand ? 0.78 : 0.30 + br() * 0.16) * A * d * flash,
         G * (isBand ? 1.2 : 0.5));
  }

  // the plume, torn off the summit by the jet stream
  c.save();
  c.globalCompositeOperation = 'lighter';
  const pl = clamp01(det * 1.4);
  for (let i = 0; i < 6; i++) {
    const yOff = -0.012 + i * 0.016;
    const pts = wavy(
      SX + 0.010, SY + yOff,
      SX + 0.44 + i * 0.030, SY + yOff - 0.028 + i * 0.014,
      0.020 + i * 0.008, 1.4 + i * 0.4, t * 1.1 + i * 2.0, 20
    );
    c.strokeStyle = rgba(i % 2 === 0 ? [255, 255, 255] : accent,
                         (0.42 - i * 0.05) * A * pl);
    c.lineWidth = lw * (1.8 - i * 0.20);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let j = 1; j < pts.length; j++) c.lineTo(pts[j][0], pts[j][1]);
    c.stroke();
  }
  const cg = c.createRadialGradient(SX, SY, 0, SX, SY, 0.13);
  cg.addColorStop(0, 'rgba(255,236,190,' + (0.42 * A) + ')');
  cg.addColorStop(0.4, rgba(accent, 0.18 * A));
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = cg;
  c.beginPath();
  c.arc(SX, SY, 0.13, 0, TAU);
  c.fill();
  c.restore();

  // seracs along the base
  const sr = rng(9919);
  for (let i = 0; i < 9; i++) {
    const x = -0.46 + i * 0.115;
    const h = 0.028 + sr() * 0.045;
    const w = 0.030 + sr() * 0.030;
    const y = 0.545;
    const poly = [[x - w, y], [x - w * 0.3, y - h], [x + w * 0.4, y - h * 0.7], [x + w, y]];
    fillPoly(c, poly, rgba(accent, 0.18 * A * clamp01(det * 1.3)));
    line(c, poly, accent, lw * 0.7, 0.40 * A * clamp01(det * 1.3), G * 0.4, true);
  }
}
