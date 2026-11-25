// Landscapes 1-2: canyon, falls.

import { clamp01, rgba, rng } from './gfx.js';
import { TAU, line, fillPoly, vgrad, traceSet, dstep, wavy } from './wcore.js';

// ------------------------------------------------------------------ canyon
// Front-on view: a stepped rim dropping into the inner gorge, horizontal strata
// across the far wall, a river threading the bottom.
export function canyon(c, k) {
  const { U, accent, A, G, t, rev, det } = k;
  const lw = 2.0 * U;

  const rim = [
    [-0.54, -0.30], [-0.45, -0.30], [-0.45, -0.232], [-0.383, -0.232],
    [-0.383, -0.163], [-0.320, -0.163], [-0.320, -0.094], [-0.258, -0.094],
    [-0.258, -0.024], [-0.198, -0.024], [-0.198, 0.042], [-0.140, 0.042],
    [-0.140, 0.102], [-0.086, 0.102], [-0.086, 0.152], [-0.034, 0.152],
    [0.030, 0.152], [0.030, 0.098], [0.086, 0.098], [0.086, 0.036],
    [0.146, 0.036], [0.146, -0.032], [0.208, -0.032], [0.208, -0.101],
    [0.272, -0.101], [0.272, -0.170], [0.338, -0.170], [0.338, -0.236],
    [0.408, -0.236], [0.408, -0.298], [0.54, -0.298],
  ];
  const rock = rim.concat([[0.54, 0.58], [-0.54, 0.58]]);

  fillPoly(c, rock, vgrad(c, -0.30, 0.58, accent, 0.115 * A, 0.030 * A));

  // horizontal strata, clipped to the rock mass
  c.save();
  c.beginPath();
  c.moveTo(rock[0][0], rock[0][1]);
  for (let i = 1; i < rock.length; i++) c.lineTo(rock[i][0], rock[i][1]);
  c.closePath();
  c.clip();
  const LEVELS = 12;
  for (let i = 0; i < LEVELS; i++) {
    const y = -0.272 + i * 0.0705;
    const d = dstep(det, i, LEVELS);
    if (d <= 0) continue;
    const flash = 1 + 0.9 * (1 - d);
    const a = (0.30 + 0.16 * (i % 2)) * A * d * flash;
    line(c, [[-0.56, y], [0.56, y]], accent, lw * 0.85, Math.min(1, a), G * 0.5);
  }
  c.restore();

  line(c, rim, accent, lw * 1.5, 0.95 * A * clamp01(rev * 1.6), G, false);

  // erosion gullies hanging off the rim steps
  c.save();
  c.globalCompositeOperation = 'lighter';
  const gr = rng(1207);
  for (let i = 1; i < rim.length - 1; i += 2) {
    const p = rim[i];
    const d = dstep(det, i % 12, 12);
    if (d <= 0) continue;
    const len = (0.030 + gr() * 0.055) * d;
    c.strokeStyle = rgba(accent, 0.42 * A * d);
    c.lineWidth = lw * 0.6;
    c.beginPath();
    c.moveTo(p[0], p[1]);
    c.lineTo(p[0] + (gr() - 0.5) * 0.012, p[1] + len);
    c.stroke();
  }
  c.restore();

  // river on the gorge floor: two offset waves so the water visibly moves
  for (let k = 0; k < 3; k++) {
    const rp = wavy(-0.150 + k * 0.012, 0.446 + k * 0.010,
                    0.150 - k * 0.012, 0.440 + k * 0.010,
                    0.014, 3.0 + k, t * (0.9 + k * 0.3) + k * 1.7, 26);
    line(c, rp, [255, 250, 240], lw * (1.2 - k * 0.25), (0.62 - k * 0.16) * A, 1.4);
  }

  // dust drifting through the gorge, so the rock never sits still
  c.save();
  c.globalCompositeOperation = 'lighter';
  const cd = rng(5519);
  for (let i = 0; i < 34; i++) {
    const seed = cd();
    const x = ((seed + t * (0.010 + cd() * 0.022)) % 1.10) - 0.05;
    const y = -0.10 + cd() * 0.62;
    const a = 0.08 + 0.20 * Math.abs(Math.sin(t * 1.5 + i));
    c.fillStyle = rgba(accent, a * A);
    c.beginPath();
    c.arc(x, y + Math.sin(t * 0.8 + i) * 0.012, (0.5 + cd() * 1.3) * U * 2, 0, TAU);
    c.fill();
  }
  c.restore();

  // far mesa above the rim, faint, for scale
  const mesa = [
    [-0.54, -0.352], [-0.34, -0.352], [-0.34, -0.392], [-0.20, -0.392],
    [-0.20, -0.352], [-0.06, -0.352], [-0.06, -0.400], [0.10, -0.400],
    [0.10, -0.356], [0.26, -0.356], [0.26, -0.404], [0.40, -0.404],
    [0.40, -0.360], [0.54, -0.360],
  ];
  line(c, mesa, accent, lw * 0.7, 0.20 * A * rev, 0.3);
}

// ------------------------------------------------------------------- falls
// A 1.7 km curtain dropping 108 m, split by rock islands, into a black gorge.
export function falls(c, k) {
  const { U, accent, A, G, t, rev, det } = k;
  const lw = 2.0 * U;
  const LIP = -0.245;
  const BASE = 0.075;

  // upstream river surface
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const y = LIP - 0.020 - i * 0.022;
    c.strokeStyle = rgba(accent, (0.16 - i * 0.014) * A);
    c.lineWidth = lw * 0.7;
    c.beginPath();
    c.moveTo(-0.50, y + Math.sin(t * 1.3 + i) * 0.004);
    c.lineTo(0.50, y + Math.sin(t * 1.1 + i * 1.7) * 0.004);
    c.stroke();
  }
  c.restore();

  // the lip
  const lip = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    lip.push([-0.50 + u, LIP - Math.cos(u * TAU - Math.PI) * 0.004]);
  }
  line(c, lip, [255, 255, 255], lw * 1.6, 0.92 * A * clamp01(rev * 1.5), G * 1.2);

  // the curtain: vertical strands, each a slightly bowed fall of water
  const N = 12;
  const islands = [-0.215, 0.045, 0.300];
  c.save();
  for (let i = 0; i < N; i++) {
    const d = dstep(det, i, N);
    if (d <= 0) continue;
    const flash = 1 + 1.1 * (1 - d);
    const x0 = -0.485 + (i / (N - 1)) * 0.97;
    let blocked = false;
    for (const ix of islands) if (Math.abs(x0 - ix) < 0.030) blocked = true;
    if (blocked) continue;
    const bow = x0 * 0.10;
    c.save();
    c.strokeStyle = rgba(accent, 0.40 * A * d * flash);
    c.lineWidth = lw * 1.1;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x0, LIP);
    c.lineTo(x0 + bow * 0.35, LIP + (BASE - LIP) * 0.42);
    c.lineTo(x0 + bow * 0.85, BASE - 0.012);
    c.lineTo(x0 + bow, BASE);
    c.stroke();
    c.restore();

    // a bright parcel of water running down the strand
    const sp = ((t * 1.5 + i * 0.37) % 1);
    if (sp > 0.02 && sp < 0.98) {
      const yy = LIP + (BASE - LIP) * sp;
      const xx = x0 + bow * sp * sp;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(255,255,255,' + (0.55 * A * d) + ')';
      c.lineWidth = lw * 1.3;
      c.beginPath();
      c.moveTo(xx, yy - 0.035);
      c.lineTo(xx + bow * 0.05, yy);
      c.stroke();
      c.restore();
    }
  }
  c.restore();

  // rock islands splitting the curtain
  for (const ix of islands) {
    const isl = [
      [ix - 0.028, LIP - 0.004], [ix - 0.016, LIP + 0.030],
      [ix - 0.010, BASE - 0.030], [ix + 0.008, BASE + 0.004],
      [ix + 0.020, LIP + 0.026], [ix + 0.030, LIP - 0.004],
    ];
    fillPoly(c, isl, 'rgba(0,0,0,0.90)');
    line(c, isl, accent, lw * 0.9, 0.62 * A, G * 0.7, true);
  }

  // gorge below
  const gorge = [
    [-0.50, BASE + 0.012], [-0.30, BASE + 0.010], [-0.245, BASE + 0.060],
    [-0.120, BASE + 0.120], [-0.030, BASE + 0.175], [0.040, BASE + 0.235],
    [0.105, BASE + 0.300], [0.175, BASE + 0.250], [0.250, BASE + 0.175],
    [0.330, BASE + 0.100], [0.400, BASE + 0.055], [0.50, BASE + 0.048],
  ];
  fillPoly(c, gorge.concat([[0.50, 0.58], [-0.50, 0.58]]),
           vgrad(c, BASE, 0.58, accent, 0.10 * A, 0.02 * A));
  line(c, gorge, accent, lw * 1.1, 0.72 * A, G * 0.8);

  // mist boiling out of the gorge
  c.save();
  c.globalCompositeOperation = 'lighter';
  const mr = rng(4471);
  for (let i = 0; i < 34; i++) {
    const seed = mr();
    const rise = ((seed + t * (0.055 + mr() * 0.05)) % 1);
    const y = BASE + 0.03 - rise * 0.34;
    const x = -0.44 + mr() * 0.88 + Math.sin(t * 0.7 + i) * 0.035;
    const rad = (0.035 + mr() * 0.055) * (0.5 + rise);
    const a = (1 - rise) * (0.10 + mr() * 0.10) * A;
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,255,255,' + a + ')');
    g.addColorStop(0.5, rgba(accent, a * 0.5));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, rad, 0, TAU);
    c.fill();
  }
  c.restore();

  // rainbow in the mist
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = rgba([255, 220, 235], 0.20 * A * clamp01(det * 2));
  c.lineWidth = lw * 1.6;
  c.beginPath();
  c.arc(0.02, BASE + 0.10, 0.30, Math.PI * 1.06, Math.PI * 1.94);
  c.stroke();
  c.restore();
}
