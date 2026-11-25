// Detailed wireframe geometry for the Seven Wonders of the Ancient World.
// Space: x in [-0.5, 0.5], y in [0, 1] pointing UP.

const L = (...pts) => pts;
const box = (x0, y0, x1, y1) => L([x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]);

function arcPts(cx, cy, rx, ry, a0, a1, seg) {
  const n = seg || 12;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}
const ellipse = (cx, cy, rx, ry, seg) => arcPts(cx, cy, rx, ry, 0, Math.PI * 2, seg || 20);

// A foliage canopy: scalloped domes opening UP (never a bowl).
function bush(lines, cx, cy, r, seg) {
  // A canopy drawn as a cloud: three overlapping semicircle bumps on top,
  // closed with a flat base. This reads as foliage, never as a bowl.
  const rx = r;
  const ry = r * 1.02;
  const b = 3;
  const w = (rx * 2) / b;
  const pts = [[cx - rx, cy]];
  for (let i = 0; i < b; i++) {
    const cxi = cx - rx + w * (i + 0.5);
    const rr = w * 0.62;
    const bump = arcPts(cxi, cy + rr * 0.10, rr, rr * (i === 1 ? 1.30 : 1.02), 0, Math.PI, 6);
    for (const q of bump) pts.push(q);
  }
  pts.push([cx + rx, cy]);
  pts.push([cx - rx, cy]);
  lines.push(pts);
  // one leaf stroke for texture
  lines.push(L([cx, cy + ry * 0.16], [cx, cy + ry * 0.56]));
}

function tree(lines, x, y, h, w) {
  // trunk
  lines.push(L([x - w * 0.055, y], [x - w * 0.040, y + h * 0.44]));
  lines.push(L([x + w * 0.055, y], [x + w * 0.040, y + h * 0.44]));
  // forking limbs
  lines.push(L([x, y + h * 0.22], [x - w * 0.38, y + h * 0.46]));
  lines.push(L([x, y + h * 0.28], [x + w * 0.38, y + h * 0.48]));
  // canopy resting on the fork
  bush(lines, x, y + h * 0.52, w * 0.72, 7);
}

function vine(lines, x, y, len, seed) {
  const pts = [];
  const seg = 9;
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    pts.push([x + Math.sin(u * 3.4 + seed) * len * 0.16, y - u * len]);
  }
  lines.push(pts);
  for (let i = 1; i < seg; i += 2) {
    const u = i / seg;
    const px = x + Math.sin(u * 3.4 + seed) * len * 0.16;
    const py = y - u * len;
    const side = i % 4 === 1 ? -1 : 1;
    const ex = px + side * len * 0.22;
    const ey = py - len * 0.09;
    lines.push(L([px, py], [ex, ey]));
    lines.push(arcPts((px + ex) / 2, (py + ey) / 2 - len * 0.035, len * 0.10, len * 0.065, 0, Math.PI, 5));
  }
}

// ================================================================ \u7A7A\u4E2D\u82B1\u56ED
function hangingGardens() {
  const lines = [];
  // Key silhouette: stepped terraces that OVERHANG their supports, so the
  // planted decks read as slabs held up on arches rather than a solid pyramid.
  const tiers = [
    { hw: 0.470, y0: 0.055, y1: 0.150, archH: 0.095, arches: 4 },
    { hw: 0.408, y0: 0.150, y1: 0.258, archH: 0.098, arches: 4 },
    { hw: 0.340, y0: 0.258, y1: 0.372, archH: 0.100, arches: 3 },
    { hw: 0.268, y0: 0.372, y1: 0.490, archH: 0.100, arches: 3 },
    { hw: 0.196, y0: 0.490, y1: 0.606, archH: 0.098, arches: 2 },
  ];

  // ---- base platform and stair
  lines.push(L([-0.500, 0.000], [0.500, 0.000]));
  lines.push(L([-0.500, 0.000], [-0.500, 0.048], [0.500, 0.048], [0.500, 0.000]));
  lines.push(L([-0.500, 0.048], [0.500, 0.048]));

  tiers.forEach((t, ti) => {
    const hw = t.hw;
    const y0 = t.y0;
    const y1 = t.y1;
    const nextHw = ti + 1 < tiers.length ? tiers[ti + 1].hw : 0.130;

    // ---- the deck: a thick slab that overhangs the tier below
    lines.push(L([-hw, y1], [hw, y1]));
    lines.push(L([-hw, y1 - 0.030], [hw, y1 - 0.030]));
    lines.push(L([-hw, y1], [-hw, y1 - 0.030]));
    lines.push(L([hw, y1], [hw, y1 - 0.030]));
    // soffit (underside) showing the overhang
    lines.push(L([-hw, y1 - 0.030], [-nextHw, y1 - 0.030]));
    lines.push(L([hw, y1 - 0.030], [nextHw, y1 - 0.030]));

    // ---- arcade UNDER the deck, carrying it: big open vaults
    const inner = nextHw * 0.80;
    const span = inner * 2;
    const n = t.arches;
    const step = span / n;
    const r = step * 0.36;
    const by = y0 + 0.004;
    for (let i = 0; i < n; i++) {
      const cx = -inner + step * (i + 0.5);
      // arch head
      lines.push(arcPts(cx, by, r, r * 1.5, 0, Math.PI, 10));
      // jambs down to the level below
      lines.push(L([cx - r, by], [cx - r, by + t.archH]));
      lines.push(L([cx + r, by], [cx + r, by + t.archH]));
      // one keystone tick per arch instead of a full voussoir fan
      lines.push(L([cx, by + r * 1.5], [cx, by + r * 1.5 + 0.014]));
    }
    // pier lines between the arches
    for (let i = 0; i <= n; i++) {
      const x = -inner + step * i;
      lines.push(L([x, by + t.archH], [x, y1 - 0.032]));
    }

    // ---- planting: the defining feature, big and unmistakable
    const plantY = y1;
    const nTree = Math.max(2, Math.round(hw * 5.0));
    for (let i = 0; i < nTree; i++) {
      const u = (i + 0.5) / nTree;
      const x = -hw * 0.90 + u * hw * 1.80;
      const seed = (i * 37 + ti * 19) % 100;
      const h = 0.105 + seed / 420;
      const w = 0.090 + ((i * 13 + ti * 7) % 12) / 170;
      tree(lines, x, plantY, h, w);
    }
    // one dominant tree per terrace, deliberately off-centre, taller than the rest
    const bigSide = ti % 2 === 0 ? -1 : 1;
    const bigX = bigSide * hw * (0.52 + (ti % 3) * 0.09);
    tree(lines, bigX, plantY, 0.150 + (ti % 3) * 0.018, 0.125);
    // a low continuous hedge along the lip
    for (let i = 0; i < nTree; i++) {
      const u = (i + 0.5) / nTree;
      const x = -hw * 0.94 + u * hw * 1.88;
      bush(lines, x, plantY - 0.006, 0.017, 6);
    }
    // long cascading vines pouring off the deck edge
    const nV = Math.max(2, Math.round(hw * 7));
    for (let i = 0; i < nV; i++) {
      const u = (i + 0.5) / nV;
      const x = -hw * 0.96 + u * hw * 1.92;
      const len = 0.085 + ((i * 29 + ti * 41) % 40) / 400;
      vine(lines, x, plantY - 0.012, len, i * 1.7 + ti);
    }
  });

  // ---- grand stair up the front
  const topY = tiers[tiers.length - 1].y1;
  lines.push(L([-0.030, 0.048], [-0.015, topY - 0.01]));
  lines.push(L([0.030, 0.048], [0.015, topY - 0.01]));
  for (let i = 0; i < 24; i++) {
    const y = 0.048 + (i / 24) * (topY - 0.058);
    const hw = 0.030 - 0.015 * (i / 24);
    lines.push(L([-hw, y], [hw, y]));
  }

  // ---- summit pavilion: a wide, low, crenellated Babylonian shrine
  lines.push(box(-0.098, topY, 0.098, topY + 0.048));
  lines.push(L([-0.112, topY + 0.048], [0.112, topY + 0.048]));
  for (let i = 0; i < 7; i++) {
    const x = -0.112 + (i * 0.224) / 6;
    lines.push(L([x, topY + 0.048], [x, topY + 0.066]));
  }
  lines.push(L([-0.112, topY + 0.066], [0.112, topY + 0.066]));
  // arch on the shrine face
  lines.push(arcPts(0, topY + 0.014, 0.030, 0.026, 0, Math.PI, 9));
  lines.push(L([-0.030, topY + 0.014], [-0.030, topY]));
  lines.push(L([0.030, topY + 0.014], [0.030, topY]));
  // side walls coming down to the deck
  lines.push(L([-0.098, topY], [-0.098, topY - 0.018]));
  lines.push(L([0.098, topY], [0.098, topY - 0.018]));
  // hanging lamp
  lines.push(L([0, topY + 0.066], [0, topY + 0.084]));
  lines.push(arcPts(0, topY + 0.090, 0.009, 0.011, 0, Math.PI * 2, 8));

  // ---- an aqueduct feeding the top terrace, coming in from the left
  lines.push(L([-0.500, 0.396], [-0.340, 0.396]));
  lines.push(L([-0.500, 0.372], [-0.340, 0.372]));
  for (let i = 0; i < 4; i++) {
    const x = -0.490 + i * 0.042;
    lines.push(L([x, 0.372], [x, 0.330]));
  }
  lines.push(arcPts(-0.340, 0.384, 0.026, 0.030, Math.PI * 0.5, Math.PI * 1.5, 8));

  return lines;
}

// ================================================================ \u5B99\u65AF\u795E\u50CF
function statueOfZeus() {
  const lines = [];
  // plinth
  lines.push(box(-0.330, 0.000, 0.330, 0.024));
  lines.push(L([-0.300, 0.024], [0.300, 0.024]));

  // ---- throne
  lines.push(arcPts(0, 0.62, 0.185, 0.30, 0, Math.PI, 20));
  lines.push(L([-0.185, 0.62], [-0.185, 0.255]));
  lines.push(L([0.185, 0.62], [0.185, 0.255]));
  lines.push(arcPts(0, 0.62, 0.155, 0.265, 0, Math.PI, 18));
  lines.push(L([-0.155, 0.62], [-0.155, 0.30]));
  lines.push(L([0.155, 0.62], [0.155, 0.30]));
  lines.push(L([-0.20, 0.255], [-0.20, 0.024], [-0.165, 0.024]));
  lines.push(L([0.20, 0.255], [0.20, 0.024], [0.165, 0.024]));
  lines.push(L([-0.215, 0.255], [0.215, 0.255]));
  // armrests
  for (const s of [-1, 1]) {
    lines.push(L([s * 0.20, 0.44], [s * 0.315, 0.44], [s * 0.315, 0.40], [s * 0.20, 0.40]));
    lines.push(arcPts(s * 0.295, 0.455, 0.022, 0.026, 0, Math.PI * 2, 10));
    lines.push(L([s * 0.315, 0.40], [s * 0.30, 0.34], [s * 0.255, 0.335]));
  }
  // footstool
  lines.push(box(-0.175, 0.024, 0.175, 0.070));
  lines.push(L([-0.16, 0.070], [0.16, 0.070]));
  for (const s of [-1, 1]) {
    lines.push(L([s * 0.15, 0.024], [s * 0.185, 0.040], [s * 0.15, 0.052]));
  }

  // ---- the god
  lines.push(ellipse(0, 0.845, 0.048, 0.058, 20));
  lines.push(arcPts(0, 0.855, 0.056, 0.052, Math.PI * 0.12, Math.PI * 0.88, 12));
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.14 + (i / 6) * 0.72);
    const bx = Math.cos(a) * 0.056;
    const by = 0.855 + Math.sin(a) * 0.052;
    lines.push(L([bx, by], [bx * 1.30, by + 0.016]));
    lines.push(L([bx * 1.30, by + 0.016], [bx * 1.18, by + 0.028]));
  }
  lines.push(L([-0.026, 0.862], [0, 0.866], [0.026, 0.862]));
  lines.push(L([0, 0.858], [0.004, 0.836], [-0.006, 0.834]));
  lines.push(L([-0.038, 0.822], [-0.046, 0.788], [-0.030, 0.762], [0, 0.750],
    [0.030, 0.762], [0.046, 0.788], [0.038, 0.822]));
  for (let i = -2; i <= 2; i++) {
    lines.push(L([i * 0.014, 0.800], [i * 0.016, 0.768]));
  }
  lines.push(L([-0.024, 0.790], [-0.026, 0.762]));
  lines.push(L([0.024, 0.790], [0.026, 0.762]));

  lines.push(L([-0.026, 0.760], [-0.078, 0.744], [-0.104, 0.712], [-0.098, 0.660]));
  lines.push(L([0.026, 0.760], [0.078, 0.744], [0.104, 0.712], [0.098, 0.660]));
  lines.push(L([-0.062, 0.700], [-0.028, 0.688], [-0.004, 0.702]));
  lines.push(L([0.062, 0.700], [0.028, 0.688], [0.004, 0.702]));
  lines.push(L([0, 0.700], [0, 0.648]));
  lines.push(L([-0.048, 0.652], [0, 0.638], [0.048, 0.652]));
  lines.push(L([-0.050, 0.610], [0, 0.596], [0.050, 0.610]));
  lines.push(L([-0.098, 0.660], [-0.120, 0.600], [-0.116, 0.540], [-0.070, 0.512]));
  lines.push(L([0.098, 0.660], [0.120, 0.600], [0.116, 0.540], [0.070, 0.512]));
  for (let i = -3; i <= 3; i++) {
    lines.push(L([i * 0.026, 0.600], [i * 0.030, 0.520]));
  }

  // right arm raised, holding Nike
  lines.push(L([0.098, 0.712], [0.140, 0.752], [0.158, 0.800]));
  lines.push(L([0.140, 0.752], [0.118, 0.742]));
  lines.push(ellipse(0.166, 0.836, 0.014, 0.020, 12));
  lines.push(L([0.166, 0.818], [0.166, 0.806]));
  lines.push(L([0.152, 0.846], [0.132, 0.862], [0.140, 0.836], [0.152, 0.826]));
  lines.push(L([0.180, 0.846], [0.200, 0.862], [0.192, 0.836], [0.180, 0.826]));
  lines.push(L([0.166, 0.806], [0.176, 0.792], [0.166, 0.788]));
  lines.push(arcPts(0.166, 0.808, 0.016, 0.012, 0, Math.PI * 2, 10));

  // left arm out to the scepter
  lines.push(L([-0.098, 0.712], [-0.190, 0.640], [-0.292, 0.556]));
  lines.push(arcPts(-0.300, 0.552, 0.014, 0.014, 0, Math.PI * 2, 10));

  // scepter with eagle, clear of the shoulder
  lines.push(L([-0.300, 0.024], [-0.300, 0.900]));
  lines.push(arcPts(-0.300, 0.920, 0.026, 0.020, 0, Math.PI * 2, 14));
  lines.push(L([-0.324, 0.925], [-0.348, 0.940], [-0.324, 0.934]));
  lines.push(L([-0.276, 0.925], [-0.252, 0.940], [-0.276, 0.934]));
  lines.push(L([-0.300, 0.940], [-0.300, 0.954]));

  // seated legs
  lines.push(L([-0.070, 0.512], [-0.128, 0.452], [-0.140, 0.330]));
  lines.push(L([0.070, 0.512], [0.128, 0.452], [0.140, 0.330]));
  lines.push(arcPts(-0.140, 0.322, 0.020, 0.018, 0, Math.PI * 2, 10));
  lines.push(arcPts(0.140, 0.322, 0.020, 0.018, 0, Math.PI * 2, 10));
  lines.push(L([-0.140, 0.306], [-0.130, 0.150], [-0.128, 0.024]));
  lines.push(L([0.140, 0.306], [0.130, 0.150], [0.128, 0.024]));
  lines.push(L([-0.128, 0.024], [-0.168, 0.024], [-0.164, 0.052], [-0.128, 0.060]));
  lines.push(L([0.128, 0.024], [0.168, 0.024], [0.164, 0.052], [0.128, 0.060]));

  return lines;
}

// ========================================================== \u963F\u5C14\u5FD2\u5F25\u65AF\u795E\u5E99
function templeOfArtemis() {
  const lines = [];
  lines.push(box(-0.500, 0.000, 0.500, 0.040));
  lines.push(box(-0.478, 0.040, 0.478, 0.076));
  lines.push(box(-0.456, 0.076, 0.456, 0.112));
  const y0 = 0.112;
  const capY = 0.640;

  // back colonnade
  const nB = 13;
  for (let i = 0; i < nB; i++) {
    const x = -0.392 + (i * 0.784) / (nB - 1);
    const yb = y0 + 0.030;
    lines.push(L([x - 0.010, yb], [x - 0.009, capY - 0.020]));
    lines.push(L([x + 0.010, yb], [x + 0.009, capY - 0.020]));
    lines.push(L([x - 0.016, capY - 0.020], [x + 0.016, capY - 0.020]));
    lines.push(L([x - 0.014, yb], [x + 0.014, yb]));
  }

  // front colonnade
  const nF = 11;
  for (let i = 0; i < nF; i++) {
    const x = -0.418 + (i * 0.836) / (nF - 1);
    lines.push(L([x - 0.015, y0], [x - 0.012, capY - 0.052]));
    lines.push(L([x + 0.015, y0], [x + 0.012, capY - 0.052]));
    lines.push(L([x - 0.021, y0], [x - 0.021, y0 + 0.014], [x + 0.021, y0 + 0.014], [x + 0.021, y0]));
    lines.push(L([x - 0.024, capY - 0.052], [x + 0.024, capY - 0.052]));
    lines.push(arcPts(x - 0.016, capY - 0.040, 0.010, 0.012, 0, Math.PI * 2, 9));
    lines.push(arcPts(x + 0.016, capY - 0.040, 0.010, 0.012, 0, Math.PI * 2, 9));
    lines.push(box(x - 0.026, capY - 0.028, x + 0.026, capY));
    lines.push(L([x - 0.014, y0 + 0.026], [x + 0.014, y0 + 0.026]));
    lines.push(L([x - 0.014, y0 + 0.062], [x + 0.014, y0 + 0.062]));
    if (i % 2 === 0) {
      lines.push(L([x - 0.007, y0 + 0.032], [x + 0.007, y0 + 0.056]));
      lines.push(L([x + 0.007, y0 + 0.032], [x - 0.007, y0 + 0.056]));
    }
    if (i % 2 === 1) {
      lines.push(L([x, y0 + 0.075], [x, capY - 0.062]));
    }
  }

  lines.push(box(-0.462, capY, 0.462, 0.672));
  lines.push(box(-0.470, 0.672, 0.470, 0.694));
  lines.push(L([-0.462, 0.656], [0.462, 0.656]));
  for (let i = 0; i < 34; i++) {
    const x = -0.455 + (i * 0.910) / 33;
    lines.push(L([x, 0.676], [x, 0.690]));
  }
  for (let i = 0; i < 44; i++) {
    const x = -0.464 + (i * 0.928) / 43;
    lines.push(L([x, 0.694], [x, 0.702]));
  }
  lines.push(box(-0.478, 0.702, 0.478, 0.726));

  lines.push(L([-0.478, 0.726], [0, 0.916], [0.478, 0.726]));
  lines.push(L([-0.428, 0.736], [0, 0.886], [0.428, 0.736]));
  lines.push(L([-0.16, 0.740], [-0.10, 0.796], [-0.04, 0.740]));
  lines.push(L([-0.02, 0.740], [0.04, 0.804], [0.10, 0.740]));
  lines.push(L([-0.478, 0.726], [-0.498, 0.752]));
  lines.push(L([0.478, 0.726], [0.498, 0.752]));
  lines.push(L([0, 0.916], [0, 0.950]));
  lines.push(arcPts(0, 0.958, 0.020, 0.024, Math.PI, Math.PI * 2, 8));
  lines.push(L([-0.478, 0.752], [-0.492, 0.788]));
  lines.push(L([0.478, 0.752], [0.492, 0.788]));

  return lines;
}

// ======================================================== \u6469\u7D22\u62C9\u65AF\u9675\u5893
function mausoleum() {
  const lines = [];
  // ---- massive solid podium (no steps: that is the temple's signature)
  lines.push(box(-0.500, 0.000, 0.500, 0.062));
  lines.push(box(-0.470, 0.062, 0.470, 0.300));
  // deep horizontal coursing so it reads as a solid masonry block
  for (let r = 1; r < 6; r++) {
    const y = 0.062 + (r / 6) * 0.238;
    lines.push(L([-0.470, y], [0.470, y]));
  }
  // vertical joints, staggered per course
  for (let r = 0; r < 6; r++) {
    const y0 = 0.062 + (r / 6) * 0.238;
    const y1 = 0.062 + ((r + 1) / 6) * 0.238;
    const cnt = 11;
    for (let k = 1; k < cnt; k++) {
      const u = (k + (r % 2) * 0.5) / cnt;
      if (u <= 0.02 || u >= 0.98) continue;
      const x = -0.470 + u * 0.940;
      lines.push(L([x, y0], [x, y1]));
    }
  }
  // sculpted relief band across the middle of the podium
  lines.push(L([-0.470, 0.176], [0.470, 0.176]));
  lines.push(L([-0.470, 0.200], [0.470, 0.200]));
  for (let i = 0; i < 30; i++) {
    const x = -0.462 + (i * 0.924) / 29;
    lines.push(L([x, 0.178], [x, 0.198]));
  }
  // corner statues standing on the podium top
  for (const s of [-1, 1]) {
    lines.push(L([s * 0.432, 0.300], [s * 0.428, 0.362], [s * 0.452, 0.362], [s * 0.448, 0.300]));
    lines.push(ellipse(s * 0.440, 0.372, 0.010, 0.013, 9));
    lines.push(L([s * 0.440, 0.362], [s * 0.440, 0.344]));
    lines.push(L([s * 0.440, 0.372], [s * 0.440, 0.386]));
  }

  // ---- peristyle: a ring of columns standing ON the podium
  const y0 = 0.300;
  const capY = 0.566;
  const n = 13;
  for (let i = 0; i < n; i++) {
    const x = -0.386 + (i * 0.772) / (n - 1);
    lines.push(L([x - 0.010, y0], [x - 0.0085, capY - 0.034]));
    lines.push(L([x + 0.010, y0], [x + 0.0085, capY - 0.034]));
    lines.push(L([x - 0.017, capY - 0.034], [x + 0.017, capY - 0.034]));
    lines.push(box(x - 0.018, capY - 0.020, x + 0.018, capY));
    lines.push(L([x - 0.014, y0], [x + 0.014, y0]));
  }
  // cella wall set behind the columns
  lines.push(box(-0.330, y0 + 0.016, 0.330, capY - 0.008));

  // ---- entablature (flat: no pediment)
  lines.push(box(-0.404, capY, 0.404, 0.596));
  lines.push(box(-0.418, 0.596, 0.418, 0.616));
  // dentil row
  for (let i = 0; i < 34; i++) {
    const x = -0.404 + (i * 0.808) / 33;
    lines.push(L([x, 0.616], [x, 0.626]));
  }
  lines.push(box(-0.426, 0.626, 0.426, 0.642));

  // ---- stepped pyramid roof: 12 clearly separated steps
  const STEPS = 12;
  for (let i = 0; i < STEPS; i++) {
    const hw = 0.400 - i * 0.0305;
    const y = 0.642 + i * 0.0225;
    lines.push(L([-hw, y], [hw, y]));
    lines.push(L([-hw, y], [-hw + 0.0305, y + 0.0225]));
    lines.push(L([hw, y], [hw - 0.0305, y + 0.0225]));
  }
  lines.push(L([-0.034, 0.912], [0.034, 0.912]));

  // ---- quadriga: four horses, chariot, driver
  lines.push(box(-0.086, 0.912, 0.086, 0.928));
  for (let i = 0; i < 4; i++) {
    const x = -0.066 + i * 0.044;
    // body
    lines.push(L([x - 0.014, 0.928], [x - 0.014, 0.966], [x + 0.014, 0.966], [x + 0.014, 0.928]));
    // neck and head, rearing
    lines.push(L([x - 0.014, 0.966], [x - 0.030, 0.988], [x - 0.020, 0.996]));
    lines.push(L([x - 0.030, 0.988], [x - 0.038, 0.980]));
    // forelegs
    lines.push(L([x - 0.014, 0.940], [x - 0.030, 0.952]));
    lines.push(L([x - 0.014, 0.934], [x - 0.026, 0.944]));
    // tail
    lines.push(L([x + 0.014, 0.966], [x + 0.026, 0.950]));
  }
  // chariot box
  lines.push(L([-0.022, 0.966], [-0.022, 1.000], [0.022, 1.000], [0.022, 0.966]));
  lines.push(L([-0.022, 0.984], [0.022, 0.984]));
  // driver
  lines.push(ellipse(0, 1.010, 0.008, 0.010, 8));
  lines.push(L([0, 1.000], [0, 1.002]));
  // whip
  lines.push(L([0.010, 1.006], [0.040, 1.020], [0.052, 1.010]));

  return lines;
}

// ========================================================== \u7F57\u5FB7\u5C9B\u5DE8\u50CF
function colossus() {
  const lines = [];
  lines.push(box(-0.500, 0.000, -0.270, 0.072));
  lines.push(box(0.270, 0.000, 0.500, 0.072));
  for (const s of [-1, 1]) {
    const x0 = s * 0.270;
    const x1 = s * 0.500;
    lines.push(L([x0, 0.072], [x1, 0.072]));
    for (let i = 1; i < 4; i++) {
      const y = (i / 4) * 0.072;
      lines.push(L([x0, y], [x1, y]));
    }
    for (let i = 0; i < 5; i++) {
      const u = (i + 0.5) / 5;
      const x = x0 + (x1 - x0) * u;
      lines.push(L([x, 0.0], [x, 0.018]));
      lines.push(L([x + 0.018, 0.018], [x + 0.018, 0.036]));
    }
    lines.push(L([s * 0.360, 0.072], [s * 0.352, 0.104], [s * 0.368, 0.104]));
    lines.push(arcPts(s * 0.360, 0.110, 0.016, 0.010, 0, Math.PI, 8));
  }

  // ship passing between the legs
  lines.push(L([-0.105, 0.030], [0.105, 0.030], [0.078, 0.058], [-0.082, 0.058], [-0.105, 0.030]));
  lines.push(L([0, 0.058], [0, 0.112]));
  lines.push(L([0, 0.108], [0.052, 0.084], [0, 0.062]));
  lines.push(L([0, 0.104], [-0.040, 0.086], [0, 0.070]));
  for (let i = -2; i <= 2; i++) {
    lines.push(L([i * 0.032, 0.032], [i * 0.040 - 0.010, 0.004]));
  }

  // legs: wide brace, shaped calves, feet on the moles
  for (const s of [-1, 1]) {
    lines.push(L([s * 0.070, 0.436], [s * 0.140, 0.372], [s * 0.164, 0.300],
      [s * 0.166, 0.230], [s * 0.192, 0.150], [s * 0.206, 0.086]));
    lines.push(L([s * 0.026, 0.442], [s * 0.076, 0.372], [s * 0.090, 0.300],
      [s * 0.104, 0.222], [s * 0.134, 0.150], [s * 0.154, 0.086]));
    lines.push(arcPts(s * 0.128, 0.252, 0.027, 0.025, Math.PI * 1.05, Math.PI * 2.0, 10));
    lines.push(L([s * 0.192, 0.150], [s * 0.176, 0.110], [s * 0.154, 0.086]));
    lines.push(L([s * 0.154, 0.086], [s * 0.130, 0.074], [s * 0.134, 0.104], [s * 0.212, 0.104], [s * 0.206, 0.086]));
    lines.push(L([s * 0.172, 0.074], [s * 0.172, 0.092]));
  }

  // hips and torso
  lines.push(L([-0.058, 0.430], [-0.070, 0.500], [-0.088, 0.560], [-0.100, 0.640],
    [-0.112, 0.712], [-0.086, 0.752]));
  lines.push(L([0.058, 0.430], [0.070, 0.500], [0.088, 0.560], [0.100, 0.640],
    [0.112, 0.712], [0.086, 0.752]));
  lines.push(L([-0.070, 0.500], [0, 0.492], [0.070, 0.500]));
  lines.push(L([-0.092, 0.690], [-0.040, 0.706], [0, 0.696]));
  lines.push(L([0.092, 0.690], [0.040, 0.706], [0, 0.696]));
  lines.push(L([0, 0.696], [0, 0.620]));
  lines.push(L([-0.062, 0.622], [0, 0.612], [0.062, 0.622]));
  lines.push(L([-0.050, 0.578], [0, 0.570], [0.050, 0.578]));
  lines.push(L([-0.056, 0.540], [0, 0.532], [0.056, 0.540]));

  // head with radiant crown
  lines.push(L([-0.024, 0.752], [-0.024, 0.782]));
  lines.push(L([0.024, 0.752], [0.024, 0.782]));
  lines.push(ellipse(0, 0.822, 0.042, 0.048, 18));
  lines.push(L([-0.022, 0.836], [0, 0.840], [0.022, 0.836]));
  lines.push(L([0, 0.832], [0.004, 0.812], [-0.006, 0.810]));
  lines.push(L([-0.020, 0.800], [0, 0.796], [0.020, 0.800]));
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.05 + (i / 8) * 0.90);
    const bx = Math.cos(a) * 0.042;
    const by = 0.822 + Math.sin(a) * 0.048;
    lines.push(L([bx, by], [bx * 1.95, 0.822 + (by - 0.822) * 2.05]));
  }

  // right arm raised with the spear
  lines.push(L([0.100, 0.712], [0.146, 0.762], [0.176, 0.840]));
  lines.push(L([0.146, 0.762], [0.116, 0.748]));
  lines.push(arcPts(0.118, 0.726, 0.030, 0.026, Math.PI * 1.1, Math.PI * 2.1, 10));
  lines.push(arcPts(0.178, 0.848, 0.015, 0.013, 0, Math.PI * 2, 9));
  lines.push(L([0.180, 0.210], [0.180, 1.000]));
  lines.push(L([0.172, 0.938], [0.180, 1.000], [0.188, 0.938]));
  lines.push(L([0.172, 0.310], [0.180, 0.298], [0.188, 0.310]));

  // left arm lowered
  lines.push(L([-0.086, 0.748], [-0.146, 0.680], [-0.160, 0.596]));
  lines.push(arcPts(-0.160, 0.584, 0.014, 0.014, 0, Math.PI * 2, 9));

  // cloak
  lines.push(L([-0.100, 0.712], [-0.180, 0.600], [-0.212, 0.460], [-0.196, 0.330], [-0.150, 0.256]));
  lines.push(L([-0.160, 0.584], [-0.186, 0.470], [-0.178, 0.360]));
  for (let i = 0; i < 4; i++) {
    lines.push(L([-0.112 - i * 0.016, 0.700 - i * 0.070],
      [-0.170 - i * 0.012, 0.480 - i * 0.055]));
  }

  return lines;
}

// ======================================================= \u4E9A\u5386\u5C71\u5927\u706F\u5854
function lighthouse() {
  const lines = [];
  lines.push(L([-0.500, 0.000], [-0.440, 0.030], [-0.360, 0.016], [-0.300, 0.042],
    [0.300, 0.042], [0.360, 0.016], [0.440, 0.030], [0.500, 0.000]));
  lines.push(L([-0.300, 0.042], [-0.250, 0.070], [0.250, 0.070], [0.300, 0.042]));

  lines.push(L([-0.250, 0.070], [-0.250, 0.086], [-0.208, 0.392], [0.208, 0.392],
    [0.250, 0.086], [0.250, 0.070]));
  lines.push(L([-0.250, 0.086], [0.250, 0.086]));
  for (const s of [-1, 1]) {
    lines.push(L([s * 0.248, 0.086], [s * 0.206, 0.392]));
    lines.push(L([s * 0.228, 0.086], [s * 0.188, 0.392]));
  }
  for (let r = 0; r < 3; r++) {
    const y = 0.120 + r * 0.086;
    const hw = 0.240 - r * 0.012;
    for (let i = -1; i <= 1; i++) {
      const cx = i * hw * 0.56;
      const rw = 0.020;
      lines.push(L([cx - rw, y], [cx - rw, y + 0.044]));
      lines.push(L([cx + rw, y], [cx + rw, y + 0.044]));
      lines.push(arcPts(cx, y + 0.044, rw, rw * 0.9, 0, Math.PI, 8));
    }
  }
  lines.push(L([-0.243, 0.204], [0.243, 0.204]));
  lines.push(L([-0.226, 0.290], [0.226, 0.290]));

  lines.push(box(-0.236, 0.392, 0.236, 0.416));
  for (let i = 0; i < 15; i++) {
    const x = -0.226 + (i * 0.452) / 14;
    lines.push(L([x, 0.416], [x, 0.436]));
  }
  lines.push(L([-0.236, 0.436], [0.236, 0.436]));

  lines.push(L([-0.168, 0.436], [-0.126, 0.632], [0.126, 0.632], [0.168, 0.436]));
  for (const f of [-0.66, -0.22, 0.22, 0.66]) {
    lines.push(L([f * 0.168, 0.436], [f * 0.126, 0.632]));
  }
  for (let i = -1; i <= 1; i++) {
    const cx = i * 0.070;
    lines.push(box(cx - 0.013, 0.486, cx + 0.013, 0.536));
    lines.push(arcPts(cx, 0.536, 0.013, 0.012, 0, Math.PI, 7));
    lines.push(box(cx - 0.013, 0.566, cx + 0.013, 0.612));
  }
  lines.push(box(-0.150, 0.632, 0.150, 0.652));
  for (let i = 0; i < 11; i++) {
    const x = -0.142 + (i * 0.284) / 10;
    lines.push(L([x, 0.652], [x, 0.668]));
  }
  lines.push(L([-0.150, 0.668], [0.150, 0.668]));

  lines.push(box(-0.096, 0.668, 0.096, 0.812));
  for (let i = 1; i < 6; i++) {
    const x = -0.096 + (i * 0.192) / 6;
    lines.push(L([x, 0.668], [x, 0.812]));
  }
  for (let i = -1; i <= 1; i++) {
    const cx = i * 0.052;
    lines.push(box(cx - 0.010, 0.706, cx + 0.010, 0.748));
  }

  lines.push(L([-0.084, 0.812], [-0.084, 0.878]));
  lines.push(L([0.084, 0.812], [0.084, 0.878]));
  for (let i = 0; i < 5; i++) {
    const x = -0.084 + (i * 0.168) / 4;
    lines.push(L([x, 0.812], [x, 0.878]));
  }
  lines.push(arcPts(0, 0.860, 0.048, 0.020, Math.PI, Math.PI * 2, 12));
  lines.push(L([-0.048, 0.860], [0.048, 0.860]));
  lines.push(L([-0.034, 0.872], [-0.040, 0.918], [-0.016, 0.898], [-0.004, 0.948],
    [0.010, 0.900], [0.032, 0.920], [0.036, 0.872]));
  lines.push(L([-0.020, 0.872], [-0.014, 0.904], [0.000, 0.884], [0.014, 0.906], [0.020, 0.872]));
  lines.push(arcPts(0, 0.862, 0.070, 0.030, Math.PI * 1.06, Math.PI * 1.94, 12));
  lines.push(arcPts(0, 0.878, 0.086, 0.042, 0, Math.PI, 14));

  lines.push(L([-0.012, 0.918], [-0.012, 0.950], [0.012, 0.950], [0.012, 0.918]));
  lines.push(ellipse(0, 0.960, 0.008, 0.010, 8));
  lines.push(L([0, 0.970], [0, 0.996]));
  lines.push(L([-0.016, 0.978], [0.016, 0.978]));
  lines.push(L([0.016, 0.978], [0.030, 0.990], [0.020, 0.996]));

  for (const s of [-1, 1]) {
    lines.push(L([s * 0.092, 0.866], [s * 0.300, 0.906]));
    lines.push(L([s * 0.092, 0.858], [s * 0.300, 0.836]));
    lines.push(L([s * 0.092, 0.862], [s * 0.300, 0.870]));
    lines.push(L([s * 0.330, 0.912], [s * 0.400, 0.930]));
    lines.push(L([s * 0.330, 0.828], [s * 0.400, 0.812]));
  }

  return lines;
}

// =========================================================== \u80E1\u592B\u91D1\u5B57\u5854
function greatPyramid() {
  const lines = [];
  const apex = [0.0, 1.0];
  const left = [-0.470, 0.030];
  const right = [0.210, 0.030];
  const back = [0.470, 0.190];

  lines.push(L(apex, left, right, apex));
  lines.push(L(apex, right, back, apex));

  const COURSES = 13;
  for (let i = 1; i < COURSES; i++) {
    const h = i / COURSES;
    const l = [left[0] + (apex[0] - left[0]) * h, left[1] + (apex[1] - left[1]) * h];
    const r = [right[0] + (apex[0] - right[0]) * h, right[1] + (apex[1] - right[1]) * h];
    const b = [back[0] + (apex[0] - back[0]) * h, back[1] + (apex[1] - back[1]) * h];
    lines.push(L(l, r));
    lines.push(L(r, b));
  }
  for (let i = 0; i < COURSES; i++) {
    const h0 = i / COURSES;
    const h1 = (i + 1) / COURSES;
    const count = Math.max(2, Math.round(4 - i * 0.12));
    const off = (i % 2) * 0.5;
    for (let k = 1; k < count; k++) {
      const u = (k + off) / count;
      if (u <= 0.04 || u >= 0.96) continue;
      const x0 = left[0] + (right[0] - left[0]) * u;
      const y0 = left[1] + (right[1] - left[1]) * u;
      const x1 = left[0] + (apex[0] - left[0]) * h1;
      const y1 = left[1] + (apex[1] - left[1]) * h1;
      const xa = x0 + (x1 - x0) * h0 * 0.9;
      const ya = y0 + (y1 - y0) * h0 * 0.9;
      const xb = x0 + (x1 - x0) * h1;
      const yb = y0 + (y1 - y0) * h1;
      lines.push(L([xa, ya], [xb, yb]));
    }
  }
  for (let i = 2; i < COURSES; i += 3) {
    const h = i / COURSES;
    const r = [right[0] + (apex[0] - right[0]) * h, right[1] + (apex[1] - right[1]) * h];
    const b = [back[0] + (apex[0] - back[0]) * h, back[1] + (apex[1] - back[1]) * h];
    lines.push(L([r[0] + (b[0] - r[0]) * 0.45, r[1] + (b[1] - r[1]) * 0.45],
      [r[0] + (b[0] - r[0]) * 0.5, r[1] + (b[1] - r[1]) * 0.5 + 0.02]));
  }

  // surviving casing at the apex
  lines.push(L([-0.062, 0.868], [0, 1.0], [0.062, 0.868]));
  lines.push(L([-0.040, 0.916], [0, 1.0], [0.040, 0.916]));

  // entrance with its gable
  lines.push(L([-0.196, 0.030], [-0.196, 0.132], [-0.150, 0.156], [-0.150, 0.030]));
  lines.push(L([-0.196, 0.132], [-0.150, 0.156]));
  lines.push(L([-0.206, 0.132], [-0.173, 0.176], [-0.140, 0.132]));
  lines.push(L([-0.173, 0.150], [-0.173, 0.220]));
  lines.push(L([-0.186, 0.196], [-0.173, 0.220], [-0.160, 0.196]));

  // base platform
  lines.push(L([-0.500, 0.014], [0.230, 0.014]));
  lines.push(L([0.230, 0.014], [0.500, 0.176]));
  lines.push(L([-0.470, 0.030], [-0.500, 0.014]));
  lines.push(L([0.470, 0.190], [0.500, 0.176]));

  // the Great Sphinx, couchant
  const sx = 0.360;
  const sy = 0.026;
  lines.push(L([sx - 0.118, sy], [sx + 0.118, sy]));
  lines.push(L([sx - 0.030, sy + 0.026], [sx - 0.052, sy + 0.070], [sx + 0.030, sy + 0.072],
    [sx + 0.104, sy + 0.044], [sx + 0.118, sy + 0.010]));
  lines.push(L([sx + 0.104, sy + 0.044], [sx + 0.070, sy + 0.020], [sx + 0.030, sy + 0.026]));
  lines.push(L([sx - 0.030, sy + 0.026], [sx - 0.048, sy + 0.008]));
  lines.push(L([sx - 0.052, sy + 0.070], [sx - 0.090, sy + 0.058], [sx - 0.104, sy + 0.026]));
  lines.push(L([sx - 0.104, sy + 0.026], [sx - 0.052, sy + 0.020], [sx - 0.006, sy + 0.020]));
  lines.push(L([sx - 0.096, sy + 0.004], [sx - 0.046, sy + 0.004], [sx - 0.040, sy + 0.020]));
  lines.push(L([sx - 0.104, sy + 0.026], [sx - 0.116, sy + 0.062], [sx - 0.096, sy + 0.086]));
  lines.push(L([sx - 0.052, sy + 0.070], [sx - 0.056, sy + 0.090]));
  lines.push(ellipse(sx - 0.086, sy + 0.090, 0.022, 0.024, 12));
  lines.push(L([sx - 0.104, sy + 0.062], [sx - 0.086, sy + 0.034]));
  lines.push(L([sx - 0.068, sy + 0.062], [sx - 0.060, sy + 0.036]));

  // subsidiary pyramids behind
  lines.push(L([-0.500, 0.014], [-0.404, 0.126], [-0.308, 0.014]));
  lines.push(L([-0.500, 0.014], [-0.404, 0.126], [-0.404, 0.014]));

  return lines;
}

export const WONDERS = [
  {
    id: 'gardens', name: '\u7A7A\u4E2D\u82B1\u56ED', en: 'HANGING GARDENS OF BABYLON',
    accent: [86, 255, 196], lines: hangingGardens(),
    years: '\u516C\u5143\u524D 600 \u5E74 \u00B7 \u5DF4\u6BD4\u4F26',
    notes: ['\u4F20\u8BF4\u4E3A\u601D\u4E61\u7684\u738B\u540E\u800C\u5EFA', '\u81F3\u4ECA\u672A\u627E\u5230\u5B83\u7684\u9057\u8FF9'],
    stat: '25', statUnit: '\u7C73 \u00B7 \u53F0\u5730\u603B\u9AD8', statLabel: 'HEIGHT',
    fate: '\u662F\u5426\u5B58\u5728\u4ECD\u6709\u4E89\u8BAE', fateYear: '\u2014\u2014',
  },
  {
    id: 'zeus', name: '\u5B99\u65AF\u795E\u50CF', en: 'STATUE OF ZEUS AT OLYMPIA',
    accent: [255, 206, 84], lines: statueOfZeus(),
    years: '\u516C\u5143\u524D 435 \u5E74 \u00B7 \u5965\u6797\u5339\u4E9A',
    notes: ['\u8C61\u7259\u4E0E\u9EC4\u91D1\u8986\u4E8E\u6728\u80CE', '\u7531\u96D5\u523B\u5BB6\u83F2\u8FEA\u4E9A\u65AF\u6240\u4F5C'],
    stat: '12.4', statUnit: '\u7C73 \u00B7 \u5750\u50CF\u9AD8\u5EA6', statLabel: 'HEIGHT',
    fate: '\u6BC1\u4E8E\u5927\u706B', fateYear: '\u516C\u5143 5 \u4E16\u7EAA',
  },
  {
    id: 'artemis', name: '\u963F\u5C14\u5FD2\u5F25\u65AF\u795E\u5E99', en: 'TEMPLE OF ARTEMIS AT EPHESUS',
    accent: [104, 224, 255], lines: templeOfArtemis(),
    years: '\u516C\u5143\u524D 550 \u5E74 \u00B7 \u4EE5\u5F17\u6240',
    notes: ['127 \u6839\u77F3\u67F1 \u00B7 \u957F 115 \u7C73', '\u91CD\u5EFA\u4E03\u6B21'],
    stat: '127', statUnit: '\u6839 \u00B7 \u77F3\u67F1\u603B\u6570', statLabel: 'COLUMNS',
    fate: '\u88AB\u7EB5\u706B\u711A\u6BC1', fateYear: '\u516C\u5143\u524D 356 \u5E74',
  },
  {
    id: 'mausoleum', name: '\u6469\u7D22\u62C9\u65AF\u9675\u5893', en: 'MAUSOLEUM AT HALICARNASSUS',
    accent: [198, 148, 255], lines: mausoleum(),
    years: '\u516C\u5143\u524D 353 \u5E74 \u00B7 \u54C8\u5229\u5361\u7EB3\u82CF\u65AF',
    notes: ['400 \u5C0A\u72EC\u7ACB\u96D5\u50CF', '\u82F1\u8BED mausoleum \u7531\u6B64\u800C\u6765'],
    stat: '45', statUnit: '\u7C73 \u00B7 \u5EFA\u7B51\u9AD8\u5EA6', statLabel: 'HEIGHT',
    fate: '\u6BC1\u4E8E\u5730\u9707', fateYear: '12 \u4E16\u7EAA',
  },
  {
    id: 'colossus', name: '\u7F57\u5FB7\u5C9B\u5DE8\u50CF', en: 'COLOSSUS OF RHODES',
    accent: [255, 116, 96], lines: colossus(),
    years: '\u516C\u5143\u524D 280 \u5E74 \u00B7 \u7F57\u5FB7\u5C9B',
    notes: ['\u9752\u94DC\u4E0E\u94C1 \u00B7 \u592A\u9633\u795E\u8D6B\u5229\u4FC4\u65AF', '\u53E4\u4EE3\u4E16\u754C\u6700\u9AD8\u7684\u96D5\u50CF'],
    stat: '33', statUnit: '\u7C73 \u00B7 \u94DC\u50CF\u9AD8\u5EA6', statLabel: 'HEIGHT',
    fate: '\u5730\u9707\u5012\u584C', fateYear: '\u516C\u5143\u524D 226 \u5E74',
  },
  {
    id: 'lighthouse', name: '\u4E9A\u5386\u5C71\u5927\u706F\u5854', en: 'LIGHTHOUSE OF ALEXANDRIA',
    accent: [138, 188, 255], lines: lighthouse(),
    years: '\u516C\u5143\u524D 280 \u5E74 \u00B7 \u4E9A\u5386\u5C71\u5927\u6E2F',
    notes: ['\u4E09\u5C42\u5854\u8EAB \u00B7 \u9876\u90E8\u5E38\u5E74\u71C3\u706B', '\u5B58\u4E16\u7EA6 1600 \u5E74'],
    stat: '100', statUnit: '\u7C73 \u00B7 \u603B\u9AD8\u4EE5\u4E0A', statLabel: 'HEIGHT',
    fate: '\u6BC1\u4E8E\u5730\u9707', fateYear: '1303 \u5E74',
  },
];

export const PYRAMID = {
  id: 'khufu', name: '\u80E1\u592B\u91D1\u5B57\u5854', en: 'THE GREAT PYRAMID OF GIZA',
  accent: [255, 196, 72], lines: greatPyramid(),
  stat: '146.6', statUnit: '\u7C73 \u00B7 \u539F\u9AD8',
};

export function polyLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    d += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return d;
}

export function bounds(lines) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const pl of lines) for (const p of pl) {
    if (p[0] < x0) x0 = p[0];
    if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1];
    if (p[1] > y1) y1 = p[1];
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
