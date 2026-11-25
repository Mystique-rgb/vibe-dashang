// Landscapes 3-4: cave, glacier.

import { clamp01, rgba, rng } from './gfx.js';
import { TAU, line, fillPoly, vgrad, traceSet, dstep } from './wcore.js';

// -------------------------------------------------------------------- cave
// A dome receding into darkness, stalactites hanging, a light shaft falling.
export function cave(c, k) {
  const { U, accent, A, G, t, rev, det } = k;
  const lw = 2.0 * U;

  // receding arches give the tunnel its depth
  const arches = [];
  for (let i = 3; i >= 1; i--) {
    const sc = 1 - i * 0.19;
    const cy = -0.02 + i * 0.035;
    const pts = [];
    for (let a = 0; a <= 40; a++) {
      const th = Math.PI + (a / 40) * Math.PI;
      pts.push([Math.cos(th) * 0.46 * sc, cy + Math.sin(th) * 0.44 * sc]);
    }
    pts.push([0.46 * sc, 0.56]);
    pts.push([-0.46 * sc, 0.56]);
    pts.push([-0.46 * sc, cy]);
    arches.push(pts);
  }
  for (let i = 0; i < arches.length; i++) {
    line(c, arches[i], accent, lw * (0.7 + i * 0.15),
         (0.16 + i * 0.10) * A * rev, G * 0.4);
  }
  const outer = arches[arches.length - 1];
  line(c, outer, accent, lw * 1.5, 0.92 * A * clamp01(rev * 1.5), G);

  // stalactites from the ceiling
  const N = 12;
  const sr = rng(7717);
  c.save();
  for (let i = 0; i < N; i++) {
    const d = dstep(det, i, N);
    if (d <= 0) continue;
    const flash = 1 + 0.9 * (1 - d);
    const th = Math.PI + ((i + 0.5) / N) * Math.PI;
    const bx = Math.cos(th) * 0.44;
    const by = -0.02 + Math.sin(th) * 0.42;
    const len = (0.045 + sr() * 0.135) * d;
    const w = 0.010 + sr() * 0.016;
    const tip = [bx + (sr() - 0.5) * 0.012, by + len];
    const cone = [[bx - w, by], [tip[0], tip[1]], [bx + w, by]];
    fillPoly(c, cone, rgba(accent, 0.22 * A * d));
    line(c, cone, accent, lw * 0.8, 0.72 * A * d * flash, G * 0.6, true);
  }
  // stalagmites from the floor
  for (let i = 0; i < 7; i++) {
    const d = dstep(det, i, 7);
    if (d <= 0) continue;
    const bx = -0.36 + (i / 6) * 0.72 + (sr() - 0.5) * 0.05;
    const len = (0.05 + sr() * 0.10) * d;
    const w = 0.014 + sr() * 0.016;
    const cone = [[bx - w, 0.50], [bx + (sr() - 0.5) * 0.010, 0.50 - len], [bx + w, 0.50]];
    fillPoly(c, cone, rgba(accent, 0.20 * A * d));
    line(c, cone, accent, lw * 0.8, 0.66 * A * d, G * 0.6, true);
  }
  c.restore();

  // light shaft from a ceiling gap
  c.save();
  c.globalCompositeOperation = 'lighter';
  const sh = [[-0.045, -0.44], [0.045, -0.44], [0.175, 0.50], [-0.175, 0.50]];
  const g = c.createLinearGradient(0, -0.44, 0, 0.50);
  g.addColorStop(0, 'rgba(255,255,255,' + (0.16 * A * clamp01(det * 1.5)) + ')');
  g.addColorStop(0.6, rgba(accent, 0.05 * A * clamp01(det * 1.5)));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  fillPoly(c, sh, g);
  c.restore();

  // flowstone curtain on the right wall
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const x = 0.20 + i * 0.028;
    const top = -0.14 + Math.sin(i * 1.7) * 0.05;
    c.strokeStyle = rgba(accent, (0.20 - i * 0.012) * A * clamp01(det * 1.2));
    c.lineWidth = lw * 1.3;
    c.beginPath();
    c.moveTo(x, top);
    for (let j = 1; j <= 6; j++) {
      const u = j / 6;
      c.lineTo(x + Math.sin(u * 5 + i + t * 0.2) * 0.010, top + u * (0.36 + i * 0.012));
    }
    c.stroke();
  }

  // motes floating in the light shaft: the cave has to breathe
  const mr = rng(3391);
  for (let i = 0; i < 40; i++) {
    const seed = mr();
    const y = ((seed + t * (0.030 + mr() * 0.045)) % 1.06) - 0.03;
    const spread = 0.045 + (y + 0.5) * 0.13;
    const x = (mr() - 0.5) * spread * 2 + Math.sin(t * 0.6 + i) * 0.012;
    const a = 0.10 + 0.26 * Math.abs(Math.sin(t * 1.3 + i * 0.8));
    c.fillStyle = rgba([255, 250, 235], a * A * clamp01(det * 1.5));
    c.beginPath();
    c.arc(x, y, (0.5 + mr() * 1.2) * U * 2, 0, TAU);
    c.fill();
  }
  c.restore();
}

// ----------------------------------------------------------------- glacier
// A blue-white ice wall with vertical crevasses, bergs in front, peaks behind.
export function glacier(c, k) {
  const { U, accent, A, G, t, rev, det } = k;
  const lw = 2.0 * U;
  const WATER = 0.115;

  const peaks = [
    [[-0.52, -0.10], [-0.40, -0.34], [-0.30, -0.16], [-0.22, -0.40], [-0.10, -0.12]],
    [[0.10, -0.10], [0.24, -0.36], [0.34, -0.14], [0.44, -0.32], [0.54, -0.10]],
  ];
  for (const p of peaks) line(c, p, accent, lw * 0.8, 0.26 * A * rev, G * 0.4);

  // the ice wall
  const top = [
    [-0.34, -0.235], [-0.26, -0.262], [-0.16, -0.238], [-0.05, -0.268],
    [0.06, -0.240], [0.17, -0.266], [0.28, -0.238], [0.38, -0.258],
  ];
  const face = top.concat([[0.38, WATER], [-0.34, WATER]]);
  fillPoly(c, face, vgrad(c, -0.26, WATER, accent, 0.22 * A, 0.10 * A));
  line(c, top, [255, 255, 255], lw * 1.3, 0.86 * A * clamp01(rev * 1.6), G * 1.1);
  line(c, [[-0.34, WATER], [0.38, WATER]], [255, 255, 255], lw * 1.5, 0.90 * A, G * 1.0);

  // vertical crevasses on the face
  const N = 12;
  const cr = rng(3319);
  for (let i = 0; i < N; i++) {
    const d = dstep(det, i, N);
    if (d <= 0) continue;
    const flash = 1 + 1.0 * (1 - d);
    const x = -0.31 + (i / (N - 1)) * 0.66;
    const topY = -0.245 + cr() * 0.020;
    const botY = WATER - cr() * 0.055;
    const lean = (cr() - 0.5) * 0.05;
    const pts = [[x, topY], [x + lean * 0.4, (topY + botY) * 0.5], [x + lean, botY]];
    line(c, pts, [225, 250, 255], lw * 1.0, 0.62 * A * d * flash, G * 0.9);
    if (cr() > 0.45) {
      const by = topY + (botY - topY) * (0.35 + cr() * 0.3);
      line(c, [[x + lean * 0.5, by], [x + lean * 0.5 + (cr() - 0.5) * 0.06, by + 0.05]],
           [225, 250, 255], lw * 0.7, 0.40 * A * d, G * 0.5);
    }
  }

  // water in front
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const y = WATER + 0.028 + i * 0.042;
    c.strokeStyle = rgba(accent, (0.22 - i * 0.018) * A);
    c.lineWidth = lw * 0.8;
    c.beginPath();
    for (let j = 0; j <= 20; j++) {
      const x = -0.52 + (j / 20) * 1.04;
      const yy = y + Math.sin(j * 0.9 + t * 1.6 + i) * 0.006;
      if (j === 0) c.moveTo(x, yy); else c.lineTo(x, yy);
    }
    c.stroke();
  }
  c.restore();

  // floating bergs
  const bergs = [
    { x: -0.28, y: 0.245, w: 0.155, h: 0.075 },
    { x: 0.10, y: 0.300, w: 0.115, h: 0.058 },
    { x: 0.33, y: 0.205, w: 0.080, h: 0.042 },
  ];
  for (const b of bergs) {
    const poly = [
      [b.x - b.w, b.y], [b.x - b.w * 0.55, b.y - b.h],
      [b.x - b.w * 0.05, b.y - b.h * 0.72], [b.x + b.w * 0.45, b.y - b.h * 0.95],
      [b.x + b.w, b.y], [b.x + b.w * 0.4, b.y + b.h * 0.42],
      [b.x - b.w * 0.45, b.y + b.h * 0.34],
    ];
    fillPoly(c, poly, rgba(accent, 0.16 * A));
    line(c, poly, [235, 252, 255], lw * 0.9, 0.66 * A * clamp01(det * 1.4), G * 0.7, true);
  }
}
