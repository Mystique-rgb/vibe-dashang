const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;
const clamp = t => Math.max(0, Math.min(1, t));
const mix = (a, b, t) => a + (b - a) * t;
const ease = t => { const x = clamp(t); return x * x * (3 - 2 * x); };
const rgba = (rgb, a) => `rgba(${rgb},${clamp(a)})`;
const grain = (i, seed) => {
  const n = Math.imul(i ^ (seed * 1027369), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}
function poly(c, points, fill, stroke, width = 1) {
  c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  if (fill) { c.closePath(); c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = width; c.strokeStyle = stroke; c.stroke(); }
}
function line(c, x, y, X, Y, stroke, width = 1) {
  poly(c, [[x, y], [X, Y]], null, stroke, width);
}
function oval(c, x, y, rx, ry, fill, stroke, width = 1, from = 0, to = TAU, angle = 0) {
  if (to <= from) return;
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, from, to);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function linear(c, x, y, X, Y, stops) {
  const g = c.createLinearGradient(x, y, X, Y);
  stops.forEach(([at, color]) => g.addColorStop(at, color));
  return g;
}
function fill(c, top, bottom) {
  rect(c, 0, 0, W, H, linear(c, 0, 0, 0, H, [[0, top], [1, bottom]]));
}
function glow(c, x, y, r, rgb, alpha) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(rgb, alpha));
  g.addColorStop(.26, rgba(rgb, alpha * .56));
  g.addColorStop(1, rgba(rgb, 0));
  rect(c, x - r, y - r, r * 2, r * 2, g);
}
function point(c, x, y, r, rgb, a = 1) {
  glow(c, x, y, 8 * r, rgb, .43 * a);
  oval(c, x, y, r, r, rgba(rgb, a));
}
function type(c, value, x, y, size, color, align = 'left', weight = 500, family = 'sans-serif') {
  c.font = `${weight} ${size}px ${family === 'mono' ? 'Consolas, monospace' : '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif'}`;
  c.textBaseline = 'middle';
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(value, x, y);
}
function camera(c, x, y, scale, angle = 0) {
  c.translate(W / 2, H / 2);
  c.scale(scale, scale);
  c.rotate(angle);
  c.translate(-x, -y);
}
function stars(c, seed, rgb, count, x = 0, y = 0, w = W, h = H) {
  for (let i = 0; i < count; i++) {
    const px = x + w * grain(i * 3, seed);
    const py = y + h * grain(i * 3 + 1, seed);
    const n = grain(i * 3 + 2, seed);
    const r = .7 + n ** 5 * 2.7;
    oval(c, px, py, r, r, rgba(rgb, .12 + n * .49));
    if (n > .971) {
      line(c, px - 8, py, px + 8, py, rgba(rgb, .25));
      line(c, px, py - 8, px, py + 8, rgba(rgb, .25));
    }
  }
}
function dust(c, t, seed, rgb, count, area, speed = 24) {
  const [x, y, w, h] = area;
  for (let i = 0; i < count; i++) {
    const n = grain(i * 4, seed);
    const base = grain(i * 4 + 1, seed);
    const px = x + ((base * w + t * speed * (.4 + n) + w * 10) % w);
    const py = y + grain(i * 4 + 2, seed) * h + Math.sin(t * .8 + i) * (6 + n * 11);
    const alpha = .06 + n ** 2 * .32;
    line(c, px, py, px + 2 + n * Math.abs(speed) * .13, py + n * 2, rgba(rgb, alpha), 1 + n * 1.65);
  }
}
function vignette(c, strength = .55) {
  const g = c.createRadialGradient(960, 485, 300, 960, 535, 1140);
  g.addColorStop(0, '#00000000');
  g.addColorStop(1, rgba('1,4,9', strength));
  rect(c, 0, 0, W, H, g);
}
function ticks(c, x, y, count, gap, color, tall = 24) {
  for (let i = 0; i <= count; i++) {
    const h = i % 5 === 0 ? tall : tall * .41;
    line(c, x + i * gap, y, x + i * gap, y - h, color, i % 5 === 0 ? 2 : 1);
  }
}
function curve(c, [x, y, x1, y1, x2, y2, X, Y], color, width, end = 1) {
  if (end <= 0) return;
  if (end < 1) {
    const a = mix(x, x1, end), b = mix(y, y1, end);
    const d = mix(x1, x2, end), e = mix(y1, y2, end);
    const g = mix(x2, X, end), h = mix(y2, Y, end);
    const j = mix(a, d, end), k = mix(b, e, end);
    c.beginPath(); c.moveTo(x, y);
    c.bezierCurveTo(a, b, j, k, mix(j, mix(d, g, end), end), mix(k, mix(e, h, end), end));
  } else {
    c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x1, y1, x2, y2, X, Y);
  }
  c.strokeStyle = color; c.lineWidth = width; c.stroke();
}

function town(c, seed, base, unit, body, lights, illuminated = .4) {
  for (let i = -2; i < 40; i++) {
    const n = i + 2;
    const x = i * unit;
    const w = unit * (.62 + grain(n, seed + 1) * .69);
    const h = unit * (.5 + grain(n, seed + 2) * 1.85);
    const y = base - h;
    const peak = y - unit * (.15 + grain(n, seed + 3) * .52);
    poly(c, [[x, base + 35], [x, y + 5], [x + w * .52, peak], [x + w, y], [x + w, base + 35]], body);
    if (n % 7 === 0) {
      rect(c, x + w * .72, peak - unit * .45, w * .17, unit * .85, body);
      rect(c, x + w * .68, peak - unit * .45, w * .25, unit * .07, body);
    }
    for (let j = 0; j < 4; j++) {
      if (grain(n * 4 + j, seed + 4) < illuminated) {
        rect(c, x + w * (.21 + j % 2 * .42), y + h * (.23 + Math.floor(j / 2) * .38), 4 + unit * .06, 5 + unit * .08, lights);
      }
    }
  }
}

// Profile is drawn facing right. Local origin is at the brow, with the coat extending down.
function profile(c, x, y, scale, { angle = 0, facing = 1, rim = '#6b655e', gauss = false } = {}) {
  c.save(); c.translate(x, y); c.scale(facing * scale, scale); c.rotate(angle);
  const coat = linear(c, -104, 90, 106, 100, [[0, '#090b13'], [.7, '#101621'], [1, '#232831']]);
  c.beginPath(); c.moveTo(-41, 58);
  c.bezierCurveTo(-84, 76, -110, 128, -114, 200);
  c.lineTo(-121, 315); c.lineTo(112, 315);
  c.bezierCurveTo(115, 205, 95, 132, 45, 99); c.lineTo(21, 67); c.closePath();
  c.fillStyle = coat; c.fill(); c.strokeStyle = rim; c.lineWidth = 1.45; c.stroke();
  c.beginPath(); c.moveTo(-41, 76);
  c.bezierCurveTo(-43, 48, -79, 25, -71, -14);
  c.bezierCurveTo(-72, -54, -29, -76, 10, -66);
  c.bezierCurveTo(38, -59, 49, -43, 50, -15);
  c.lineTo(51, 2); c.lineTo(70, 24); c.lineTo(56, 30);
  c.lineTo(54, 42); c.lineTo(59, 49); c.lineTo(52, 56);
  c.bezierCurveTo(48, 76, 23, 69, 12, 67); c.lineTo(19, 91); c.closePath();
  c.fillStyle = '#12151b'; c.fill(); c.strokeStyle = rim; c.stroke();
  c.beginPath(); c.moveTo(-46, 63);
  c.bezierCurveTo(-66, 47, -94, 4, -75, -31);
  c.bezierCurveTo(-62, -60, -40, -79, -5, -75);
  c.quadraticCurveTo(32, -79, 48, -48); c.lineTo(43, -27);
  c.quadraticCurveTo(31, -43, 18, -48); c.quadraticCurveTo(8, -15, -19, -10);
  c.lineTo(-25, 21); c.lineTo(-40, 22); c.lineTo(-37, 54); c.closePath();
  c.fillStyle = gauss ? '#090c13' : '#34333a'; c.fill(); c.strokeStyle = rim; c.stroke();
  if (!gauss) {
    oval(c, -64, 44, 20, 17, '#24252d', rim, 1.3);
    oval(c, -85, 54, 17, 11, '#1c212e', rim, 1.2);
    curve(c, [-68, 56, -85, 75, -96, 73, -102, 66], rim, 2);
  }
  poly(c, [[-30, 74], [17, 80], [43, 108], [19, 118], [-12, 97]], gauss ? '#ded6ba' : '#a78f71');
  poly(c, [[-47, 79], [-9, 100], [45, 158], [10, 146], [-27, 121]], '#181e27', rim, 1.2);
  c.restore();
}

function scope(c, x, y, scale, rotation) {
  c.save(); c.translate(x, y); c.scale(scale, scale);
  poly(c, [[-22, 65], [21, 65], [47, 388], [12, 388], [0, 146], [-115, 388], [-152, 388]], '#0b101b', '#724f39', 2);
  oval(c, 0, 27, 56, 60, '#111926', '#aa8056', 4);
  oval(c, 0, 27, 40, 44, null, '#735136', 3);
  for (let i = 0; i < 17; i++) {
    const a = i * TAU / 17;
    line(c, Math.cos(a) * 42, 27 + Math.sin(a) * 46, Math.cos(a) * 51, 27 + Math.sin(a) * 56, '#bd9063', 2);
  }
  c.rotate(rotation);
  poly(c, [[-199, -12], [173, -28], [192, -34], [204, -34], [204, 22], [178, 22], [-199, 11]], '#1b2634', '#c3986d', 2);
  rect(c, -214, -15, 24, 29, '#222d38');
  rect(c, 173, -27, 12, 47, '#906c49'); rect(c, 198, -34, 10, 56, '#c39764');
  line(c, -180, -8, 163, -22, '#b28c62', 2);
  oval(c, 0, 0, 17, 17, '#141a24', '#c59566', 3);
  c.restore();
}

function palermo(c, f) {
  const { v, u, t, k } = f;
  fill(c, '#080e24', '#263950');
  glow(c, 1300, 392, 680, '70,129,179', .52);
  stars(c, 14, '199,220,245', 150, 10, 15, 1900, 655);
  c.save(); c.translate(-22 * u, -28 * v);
  town(c, 14, k ? 731 : 715, 65, '#273147', '#9b8254', .24);
  town(c, 41, k ? 827 : 832, 100, '#151e32', '#ba864d', .25);
  c.restore();
  c.save();
  if (!k) {
    camera(c, 920 + 77 * v, 671 - 180 * v, 1.13 + .13 * v, -.02);
    poly(c, [[-580, 864], [542, 784], [2200, 897], [2450, 1310], [-580, 1310]], '#0a1422');
    poly(c, [[1000, 826], [1300, 613], [1702, 610], [2050, 902]], '#151d2d', '#354052', 3);
    profile(c, 1391, 656, .67, {angle: .28 + .1 * v, rim: '#947459'});
    scope(c, 1612, 717, .6, -.30 + .10 * v);
    glow(c, 1270, 798, 260, '247,166,80', .43);
    oval(c, 1270, 798, 5, 9, '#ffd59a');
    rect(c, 1243, 808, 53, 11, '#322628');
    poly(c, [[-300, 774], [2240, 925], [2240, 960], [-300, 814]], '#070e19', '#364257', 3);
    for (let i = 0; i < 20; i++) {
      const x = i * 150 - 310, y = 792 + i * 8.8;
      poly(c, [[x - 7, y], [x + 16, y + 1], [x + 18, y + 230], [x - 10, y + 230]], '#080f1c');
    }
  } else {
    camera(c, 1040 + 82 * v, 556 - 18 * v, 1 + .15 * v, -.016 * (1 - v));
    poly(c, [[50, 270], [390, 240], [569, 324], [569, 946], [50, 946]], '#121a2b');
    rect(c, 265, 362, 216, 392, '#281f2c');
    glow(c, 374, 548, 575, '242,145,70', .55);
    rect(c, 303, 414, 138, 254, linear(c, 292, 421, 453, 690, [[0, '#e7a86c'], [1, '#5c382f']]));
    line(c, 369, 408, 369, 701, '#473031', 10); line(c, 303, 532, 442, 532, '#473031', 8);
    poly(c, [[439, 519], [1520, 780], [1745, 940], [439, 660]], '#edaa5213');
    profile(c, 735 + 49 * ease(v), 480 + 18 * v, 1.5, {angle: .16 + .26 * ease(v), rim: '#bb8b61'});
    scope(c, 1153, 527, 1.46, -.191 + .06 * Math.exp(-9 * v));
    curve(c, [682, 704, 808, 709, 877, 629, 1021, 592], '#171b25', 62);
    curve(c, [695, 682, 813, 691, 896, 601, 1015, 578], '#ae7c53aa', 2);
    oval(c, 1023, 586, 19, 13, '#735348', '#d1a36b', 1.2, 0, TAU, -.3);
    poly(c, [[-110, 862], [2050, 855], [2090, 930], [-130, 976]], '#090e17', '#404555', 3);
  }
  c.restore();
  dust(c, t, 314, '153,182,215', 43, [0, 210, W, 690]);
  line(c, 103, 170, 500, 170, '#dcb9897b', 2);
  vignette(c);
}

function shortArc(c, f) {
  const {k, v, t, a} = f;
  fill(c, '#091b1d', '#0e2524');
  glow(c, k ? 1060 : 745, 530, 850, '89,143,110', .28);
  c.save();
  if (k) camera(c, 1090 + 17 * v, 481 - 13 * v, 2.34 + .20 * v, -.13);
  for (let i = 0; i < 10; i++) {
    oval(c, 992, 592, 280 + i * 91, 112 + i * 59, null, '#a5c5a021', 1.2, 0, TAU, -.33);
  }
  for (let i = 0; i < 15; i++) {
    const x = 170 + i * 121;
    curve(c, [x - 250, -120, x + 110, 180, x - 120, 820, x + 110, 1210], '#9dbc9a23', 1.25);
  }
  stars(c, 15, '203,230,191', 211);
  const x = p => 941 + p * 307;
  const y = p => 515 - 99 * p + p * p * 39;
  oval(c, 507, 361, 10, 10, null, '#abc8a788', 1.5);
  oval(c, 1358, 616, 12, 12, null, '#abc8a788', 1.5);
  poly(c, [[507, 361], [702, 596], [897, 693], [1358, 616], [1513, 321]], null, '#a4c2a34c', 1.3);
  const progress = clamp((a + .20) / 3.16);
  curve(c, [941, 515, 1043, 482, 1146, 462, 1248, 455], '#d0e9a691', k ? 2.15 : 2.85, progress);
  [0, .47, .92].forEach((p, i) => {
    const seen = ease((progress - p) / .06);
    if (!seen) return;
    const pulse = Math.exp(-Math.abs(progress - p - .045) * 29);
    line(c, x(p) - 3, y(p) - 14 - pulse * 9, x(p) + 3, y(p) + 13, rgba('239,214,146', .72 * seen), 2.2);
    oval(c, x(p), y(p), 6 + pulse * 8, 6 + pulse * 8, null, rgba('244,219,148', seen * (.3 + .6 * pulse)), 1);
    if (k) type(c, `0${i + 1}`, x(p), y(p) + 36, 13, rgba('208,208,165', .78 * seen), 'center', 400, 'mono');
  });
  const px = x(progress), py = y(progress);
  point(c, px, py, k ? 4 : 5, '255,237,165');
  oval(c, px, py, 15 + Math.sin(t * 6) * 2, 15 + Math.sin(t * 6) * 2, null, '#e1dc8a75', 1.3);
  c.restore();
  if (k) {
    line(c, 196, 793, 1715, 793, '#bed2aa68', 1.4);
    ticks(c, 196, 793, 40, 37.9, '#c6d8b75c');
  }
  vignette(c, .49);
}

function daylight(c, f) {
  const {k, v, u} = f;
  fill(c, '#111d33', '#515867');
  const sx = k ? 969 - 31 * v : 844 + 166 * v;
  const sy = k ? 452 - 12 * v : 458 - 29 * v;
  if (k) {
    c.save(); camera(c, 965, 461, 1.42 + v * .11);
    stars(c, 16, '212,222,235', 45); c.restore();
    oval(c, sx, sy, 153 + 56 * v, 153 + 56 * v, null, '#c9d7de32', 2);
    line(c, 192, sy, sx - 176, sy, '#dce0d955', 1);
  } else {
    stars(c, 16, '212,222,235', 166);
    curve(c, [200, 749, 506, 568, 930, 395, 1611, 341], '#c1cfce42', 2, .63 + v * .17);
    for (let i = 0; i < 4; i++) oval(c, 785, 515, 471 + i * 110, 157 + i * 73, null, '#f0efcc18', 2, .05, 3.65, -.22);
  }
  point(c, sx, sy, k ? 8 : 5.2, '255,244,202', k ? 1 - ease((v - .17) / .66) : 1);
  const edge = k ? 1440 - 1270 * v : 2220 - 720 * v;
  const r = k ? 1410 : 1240;
  const cy = 462 - 102 * u;
  glow(c, edge + r - 180, cy, r + 650, '255,190,118', .85);
  glow(c, edge + r, cy, r + 335, '255,235,191', .98);
  const sun = c.createRadialGradient(edge + r + 120, cy, 0, edge + r, cy, r);
  sun.addColorStop(0, '#ffffff'); sun.addColorStop(.78, '#fff9e7'); sun.addColorStop(1, '#fff2cb');
  oval(c, edge + r, cy, r, r, sun, '#fff9e6', k ? 9 : 5);
  if (k) rect(c, 0, 0, W, H, rgba('255,249,229', ease((v - .74) / .23)));
}

function archive(c, f) {
  const {k, v, t} = f;
  fill(c, '#343f47', '#121920');
  glow(c, 310 + 1390 * v, 455, 900, '180,204,204', .29);
  if (!k) {
    c.save(); camera(c, 950 + 88 * v, 552 - 28 * v, 1.03 + .11 * v, -.052);
    for (let row = -1; row < 4; row++) {
      for (let col = -1; col < 7; col++) {
        const x = 62 + col * 333, y = 135 + row * 252;
        rect(c, x, y, 312, 234, '#172129');
        poly(c, [[x, y], [x + 35, y + 35], [x + 38, y + 182], [x, y + 223]], '#3d4950');
        poly(c, [[x, y + 223], [x + 38, y + 182], [x + 283, y + 183], [x + 312, y + 223]], '#444d52');
        for (let i = 0; i < 10; i++) {
          const px = x + 49 + i * 22;
          const h = 62 + grain(row * 57 + col * 12 + i, 171) * 81;
          poly(c, [[px, y + 185], [px + 3, y + 185 - h], [px + 17, y + 176 - h], [px + 20, y + 185]], i % 4 ? '#586164' : '#7a7c71');
          line(c, px + 7, y + 183, px + 9, y + 189 - h, '#b8b7a876', 1.5);
        }
        rect(c, x, y + 221, 312, 13, '#252e35');
        line(c, x, y + 220, x + 312, y + 220, '#a2b1b16d', 2);
      }
    }
    c.save(); c.globalCompositeOperation = 'screen';
    const beam = linear(c, 0, 375 + 80 * v, 0, 526 + 80 * v, [[0, '#bbcfc300'], [.57, '#dbe2cb4f'], [1, '#bbcfc300']]);
    rect(c, -130, 375 + 80 * v, W + 260, 151, beam);
    c.restore(); c.restore();
  } else {
    c.save(); camera(c, 978, 550 + 86 * v, 1.02 + .12 * v, -.034);
    rect(c, 165, 86, 1590, 890, '#0c1117');
    poly(c, [[245, 293], [1689, 244], [1710, 912], [220, 940]], '#525956', '#959e92', 3);
    poly(c, [[250, 239], [1654, 209], [1693, 883], [222, 907]], linear(c, 270, 234, 1693, 892, [[0, '#afbaaf'], [.46, '#c9cbb8'], [1, '#737d73']]));
    line(c, 401, 251, 401, 851, '#7148448a', 2);
    for (let i = 0; i < 8; i++) {
      const y = 345 + i * 68;
      line(c, 293, y, 1600, y - 24, i === 2 ? '#2d434be0' : '#40545a85', i === 2 ? 3 : 1.4);
    }
    for (let col = 0; col < 7; col++) {
      const x = 465 + col * 153;
      type(c, `01.${String(2 + col).padStart(2, '0')}`, x, 305 - col * 2, 24, '#454e50', 'left', 400, 'mono');
      type(c, ['02° 13′', '03° 24′', '04° 18′', '05° 41′', '07° 09′', '08° 32′', '09° 00′'][col], x, 379 - col * 2, 27, '#313e46', 'left', 500, 'mono');
      line(c, x - 23, 258, x - 23, 840, '#40545a43');
    }
    const w = 1113 * ease(v * 1.4);
    if (w > 0) rect(c, 433, 493, w, 305, '#ecebc122');
    type(c, '9°', 1428, 574, 111, '#775750', 'center', 600, 'mono');
    poly(c, [[132, 109], [225, 143], [214, 924], [121, 960]], '#141b21');
    poly(c, [[1654, 125], [1795, 73], [1800, 969], [1715, 908]], '#141b21');
    c.restore();
  }
  dust(c, t, 17, '202,216,201', 37, [0, 325, W, 435], 16);
  vignette(c, .65);
}

function paperChart(c, x, y, s, angle) {
  c.translate(x, y); c.rotate(angle); c.scale(s, s);
  const edge = [[-651, -367], [651, -367], [651, 367], [-651, 367]];
  poly(c, edge, linear(c, -611, -200, 650, 215, [[0, '#8a5965'], [.48, '#b3aaa1'], [1, '#60768a']]), '#dcc3b4', 3);
  c.save(); c.beginPath(); c.rect(-624, -340, 1248, 680); c.clip();
  for (let i = 0; i < 11; i++) oval(c, 12, 41, 100 + i * 68, 64 + i * 51, null, '#26354760', 1.15, 0, TAU, -.31);
  for (let i = 0; i < 14; i++) {
    const x = -651 + i * 98;
    curve(c, [x - 60, -355, x + 170, -163, x - 145, 165, x + 57, 352], '#2f404f62', 1.2);
  }
  stars(c, 18, '230,226,212', 110, -565, -283, 1130, 566);
  poly(c, [[-471, -173], [-369, 34], [-257, 83], [-165, -61], [-6, -135], [100, -39], [227, 33], [366, -132], [509, -178]], null, '#353442ac', 2);
  c.restore();
  rect(c, -624, -340, 1248, 1, '#362e45');
  line(c, -624, 327, 624, 327, '#2e3649a5', 1);
  ticks(c, -600, 327, 40, 30, '#393649a0', 20);
}

function direction(c, x, y, X, Y, progress, color) {
  if (progress <= 0) return;
  const endX = mix(x, X, progress), endY = mix(y, Y, progress);
  const angle = Math.atan2(Y - y, X - x);
  line(c, x, y, endX, endY, color, 4);
  c.save(); c.translate(endX, endY); c.rotate(angle);
  poly(c, [[27, 0], [-20, -15], [-10, 0], [-20, 15]], color);
  c.restore();
}

function disagreement(c, f) {
  const {k, v, t} = f;
  fill(c, '#100c1f', '#23243e');
  glow(c, 340 + 500 * v, 445, 740, '173,56,117', k ? .4 : .72);
  glow(c, 1490 - 400 * v, 388, 690, '54,102,177', k ? .77 : .50);
  if (!k) {
    c.save(); camera(c, 949 + 61 * v, 540 - 22 * v, 1 + .11 * v);
    for (let i = 0; i < 7; i++) {
      const x = 240 + i * 235;
      line(c, x, 105, x, 820, '#a98ba523', 3);
      line(c, x, 784, 960 + (x - 960) * 1.48, 1050, '#a98ba537', 3);
    }
    poly(c, [[490, 329], [1550, 318], [1680, 728], [385, 736]], '#1b1627', '#615670', 3);
    c.save(); paperChart(c, 1010, 503, .69, -.018); c.restore();
    profile(c, 340 + 28 * v, 430 - 10 * v, 1.75, {angle: .10 + .14 * v, rim: '#c37d99'});
    profile(c, 1558 - 23 * v, 448 + 8 * v, 1.64, {facing: -1, angle: .18 + .1 * v, rim: '#739bc3', gauss: true});
    poly(c, [[-80, 869], [1999, 848], [2020, 1090], [-80, 1120]], '#0b0d17', '#514352', 3);
    c.restore();
  } else {
    c.save(); camera(c, 964 - 32 * v, 500 + 19 * v, 1 + .12 * v, -.035 + .055 * v);
    paperChart(c, 957, 501, 1.16, -.074);
    oval(c, -1, -14, 15, 15, '#e7d2b6', '#363746', 2);
    direction(c, -8, -16, -454, 116, ease(v * 2.32), '#912d59');
    direction(c, 6, -17, 480, -150, ease((v - .38) * 2.45), '#1d4272');
    c.restore();
  }
  dust(c, t, 181, '198,159,198', 41, [0, 170, W, 744], 16);
  vignette(c);
}

function sheet(c, x, y, scale, angle, ink, rows = 5) {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
  poly(c, [[-207, -118], [194, -128], [216, 121], [-217, 129]], '#160f13a0');
  poly(c, [[-221, -132], [202, -133], [211, 114], [-213, 123]], linear(c, -188, -135, 169, 130, [[0, '#e3ca98'], [.6, '#ba9e78'], [1, '#736551']]), '#c9b487', 1.4);
  for (let i = 0; i < rows; i++) {
    const y = -87 + i * 31;
    for (let j = 0; j < 25; j++) {
      const x = -174 + j * 14;
      if (grain(i * 29 + j, 192) > .76) continue;
      curve(c, [x, y, x + 3, y - 14 + j % 8, x + 9, y + 6, x + 13, y - 2], ink, 1.6);
    }
    line(c, -179, y + 5, 169, y + 5, '#674d3e42', .7);
  }
  c.restore();
}

function attic(c, f) {
  const {k, v, t} = f;
  fill(c, '#1d161f', '#241c23');
  glow(c, 1458 - 330 * v, 498, 830, '156,89,49', .52);
  glow(c, k ? 1377 : 325, 373, 665, '86,132,172', .36);
  c.save();
  if (!k) camera(c, 978 + 196 * v, 558 - 19 * v, 1.04 + .31 * v, -.03);
  else camera(c, 1000 + 57 * v, 512 + 21 * v, 1.07 + .14 * v);
  const wx = k ? 1110 : 505;
  rect(c, wx, 179, 510, 460, '#120e17');
  c.save(); c.beginPath(); c.rect(wx + 15, 197, 480, 385); c.clip();
  rect(c, wx, 189, 510, 450, linear(c, 0, 190, 0, 620, [[0, '#28344e'], [1, '#7a686d']]));
  c.translate(wx - 22 * v, 0); stars(c, 19, '212,219,232', 81, 0, 200, 550, 350);
  town(c, 19, 616, 46, '#242637', '#d3a56c', .51); c.restore();
  line(c, wx + 258, 181, wx + 258, 620, '#1e1922', 14);
  line(c, wx, 418, wx + 510, 418, '#1e1922', 12);
  poly(c, [[-380, 413], [1020, -213], [1168, -154], [-320, 558]], '#100d17', '#403243', 2);
  poly(c, [[883, -157], [1050, -158], [2170, 533], [2168, 698]], '#171019', '#49343a', 2);
  if (k) profile(c, 690 + 21 * v, 403 + 38 * ease(v), 1.68, {angle: .09 + .30 * ease(v), rim: '#b08768', gauss: true});
  poly(c, [[k ? 207 : 844, k ? 704 : 655], [1513, k ? 713 : 666], [2075, 979], [-617, 1100]], '#3b2a27', '#946c51', 3);
  poly(c, [[-617, 1100], [2075, 979], [2075, 1160], [-617, 1242]], '#100e17');
  for (let i = 0; i < 8; i++) {
    line(c, 869 - i * 21, 665 + i * 10, -460 + i * 331, 1060, '#bc825338', 2);
  }
  const px = k ? 1020 : 1300, py = k ? 755 : 811;
  glow(c, px + 300, py - 135, 445, '255,169,76', .68);
  sheet(c, px - 192, py + 42, .79, -.12, '#4b3e3c', 6);
  sheet(c, px + 77, py - 9, .78 + ease(v) * .13, .17 - .18 * ease(v), '#524241', 3);
  line(c, px + 317, py - 149, px + 364, py + 37, '#372327', 12);
  rect(c, px + 337, py + 38, 69, 11, '#211923');
  poly(c, [[px + 294, py - 182], [px + 329, py - 182], [px + 349, py - 143], [px + 277, py - 137]], '#4c352b', '#b78746', 2);
  point(c, px + 309, py - 140, 6.4 + Math.sin(t * 10), '255,206,124');
  if (k) {
    curve(c, [604, 714, 665, 765, 744, 736, 904 + 20 * v, 752], '#111017', 56);
    curve(c, [612, 694, 679, 745, 753, 719, 892 + 20 * v, 735], '#a77d58a1', 2);
    oval(c, 920 + 20 * v, 752, 36, 13, '#795a48', '#c19b70', 1.3, 0, TAU, -.08);
  }
  c.restore();
  dust(c, t, 19, '210,166,106', 53, [0, 270, W, 646], 18);
  vignette(c, .65);
}

function candidateCurves(c, f) {
  const {k, v, a} = f;
  fill(c, '#09182d', '#172f48');
  glow(c, 985 + 160 * v, 493, 1030, '57,124,171', .40);
  stars(c, 20, '180,216,230', 125);
  c.save();
  if (k) camera(c, 955, 531, 1.20 - .30 * v);
  else camera(c, 954 + 40 * v, 543 - 12 * v, 1.19 + .10 * v, -.14 + .05 * v);
  for (let i = -5; i < 30; i++) {
    const x = i * 90;
    line(c, x, -140, x, 1220, i % 5 ? '#b1dcee23' : '#b1dcee51', i % 5 ? 1 : 1.8);
  }
  for (let i = -3; i < 17; i++) line(c, -210, i * 90, 2130, i * 90, '#b1dcee25');
  const A = [667, 587], B = [1142, 441];
  if (!k) {
    line(c, A[0], A[1], B[0], B[1], '#bfe0e65c', 2);
    [A, B].forEach(([x, y]) => {
      line(c, x, y + 20, x, 904, '#b0e3ef54');
      oval(c, x, y, 31 - 13 * ease(v), 31 - 13 * ease(v), null, '#c3e9f8a1', 1.8);
    });
  } else {
    for (let i = 0; i < 5; i++) {
      const p = ease((v - i * .123) * 2.65);
      if (!p) continue;
      const bend = 2 - i;
      const col = ['#c1ebf2','#91c6d9','#78a9c3','#8aacc1','#6293b3'][i];
      const width = 3 - i * .27;
      // Mirror the control handles at A and B so each candidate has a continuous tangent.
      curve(c, [A[0], A[1], 469, 654 + bend * 29, 292, 757 + bend * 112, -75, 662 + bend * 164], col, width, p);
      curve(c, [A[0], A[1], 865, 520 - bend * 29, 950, 490 - bend * 29, B[0], B[1]], col, width, p);
      curve(c, [B[0], B[1], 1334, 392 + bend * 29, 1532, 286 + bend * 105, 2020, 315 + bend * 155], col, width, p);
    }
  }
  [A, B].forEach(([x, y], i) => {
    point(c, x, y, 8, '252,222,166');
    type(c, i ? 'B' : 'A', x + 28, y + 26, 26, '#dbedf0', 'left', 500, 'mono');
  });
  c.restore();
  line(c, 1555, 161, 1806, 161, '#b5d3e174', 1.3);
  vignette(c, .48);
}

function observations(c, f) {
  const {k, v, t, a} = f;
  fill(c, '#281d22', '#4d3427');
  glow(c, k ? 978 : 678 + v * 170, k ? 583 : 443, 980, '217,159,81', .53);
  dust(c, t, 211, '252,212,145', 100, [0, 80, W, 900], 34);
  c.save();
  if (k) camera(c, 965 + 33 * v, 527 - 39 * v, 1.04 + .09 * v, -.035);
  else camera(c, 834 + 275 * v, 555 - 22 * v, 1.17 + .14 * v);
  const quad = k ? [[420,281],[1465,227],[1815,749],[337,868]] : [[272,485],[1530,430],[2115,887],[-230,956]];
  poly(c, [quad[3], quad[2], [quad[2][0], quad[2][1] + 67], [quad[3][0], quad[3][1] + 83]], '#24191c', '#816647', 2);
  poly(c, quad, linear(c, 117, 351, 1567, 858, [[0, '#98764c'], [.47, '#784e35'], [1, '#402d27']]), '#d5a873', 3);
  for (let i = 1; i < 12; i++) {
    const t = i / 12;
    line(c, mix(quad[0][0], quad[3][0], t), mix(quad[0][1], quad[3][1], t), mix(quad[1][0], quad[2][0], t), mix(quad[1][1], quad[2][1], t), '#e7bc7e3f');
    line(c, mix(quad[0][0], quad[1][0], t), mix(quad[0][1], quad[1][1], t), mix(quad[3][0], quad[2][0], t), mix(quad[3][1], quad[2][1], t), '#e7bc7e3f');
  }
  const marks = k ? [[708,651],[976,573],[1264,509]] : [[616,705],[985,651],[1366,593]];
  curve(c, [410, 791, 764, 591, 1210, 501, 1524, 468], '#f3cf977f', 2, k ? .93 : .32 + v * .61);
  marks.forEach(([x, y], i) => {
    const p = ease((a - i * .47 + .08) * 4.9);
    if (!p) return;
    const sx = k ? 1040 + (i - 1) * 52 : x + 53;
    const sy = k ? 268 + i * 15 : y - 60;
    const h = k ? ease((v - i * .205 + .03) * 3.3) : p;
    oval(c, x, y + 5, 46, k ? 19 : 12, '#2419236e', '#e2b57e65');
    point(c, x, y, 6.5, '255,221,150', .96);
    line(c, x, y - 3, mix(x, sx, h), mix(y, sy, h), rgba('253,210,134', .85), k ? 2.4 : 3.1);
    if (h > 0) point(c, mix(x, sx, h), mix(y, sy, h), 3.5, '255,228,167', h);
    type(c, `0${i + 1}`, x + 9, y + 38, 25, '#f3d19d', 'left', 500, 'mono');
  });
  c.restore();
  vignette(c, .53);
}

function orbit(c, f) {
  const {k, v, t} = f;
  fill(c, '#101f2d', '#25303d');
  glow(c, k ? 665 : 975, 524, 965, '63,121,149', .49);
  stars(c, 22, '202,216,225', 153);
  c.save();
  if (k) camera(c, 956 + v * 11, 540, .89 + .13 * ease(v), -.045 + v * .024);
  else camera(c, 1004 + 77 * v, 520 - 38 * v, 1.06 + .13 * v, -.22 + v * .055);
  const cx = 961;
  const cy = k ? 509 : 575;
  const rx = 802;
  const ry = k ? 287 : 94;
  const phase = 3.67;
  const lap = k ? mix(.17, 1, ease(v * 1.42)) : .059 + .091 * v;
  const focalX = k ? cx - Math.sqrt(rx ** 2 - ry ** 2) : 618;
  for (let i = 0; i < 5; i++) {
    const alpha = k ? .28 * (1 - ease(v * 1.2)) : .12 + i * .028;
    oval(c, cx - i * 24, cy + i * 7, rx - 45 + i * 30, ry * (.62 + i * .24), null, rgba('155,187,202', alpha), 1.8, .13, TAU, (i - 2) * .048);
  }
  line(c, 43, cy, 1873, cy, '#b2c9cc38', 1);
  line(c, cx, 150, cx, 878, '#b2c9cc2e', 1);
  for (let i = 0; i < 13; i++) {
    const a = i * TAU / 12;
    const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
    line(c, cx + Math.cos(a) * (rx - 15), cy + Math.sin(a) * (ry - 11), x, y, '#92b1be70', 1.2);
  }
  point(c, focalX, cy, k ? 20 : 11, '255,213,138', .93);
  oval(c, focalX, cy, k ? 42 : 25, k ? 42 : 15, null, '#f6cd886b');
  if (k) type(c, '太阳', focalX + 53, cy + 29, 27, '#e9cea4');
  oval(c, cx, cy, rx, ry, null, '#35515f', 2.6);
  oval(c, cx, cy, rx, ry, null, '#92b9c9ac', k ? 7 : 4, phase, phase + TAU * lap);
  oval(c, cx, cy, rx, ry, null, k ? '#def1e6' : '#8fbcc8', k ? 2.8 : 2, phase, phase + TAU * lap);
  const p = phase + TAU * lap + (k ? 0 : Math.sin(t * 2.35) * .016);
  point(c, cx + rx * Math.cos(p), cy + ry * Math.sin(p), k ? 6 : 4, '238,239,196');
  if (k) {
    line(c, 258, 873, 1660, 873, '#b6cdd38a', 1.35);
    ticks(c, 258, 873, 60, 23.36, '#bdd5d38c', 24);
  }
  c.restore();
  vignette(c, .5);
}

function prediction(c, f) {
  const {k, v, t} = f;
  const X = 978, Y = 467;
  fill(c, '#1d0b13', '#3f151d');
  glow(c, X, Y, 1005, '178,49,44', k ? .56 : .41);
  for (let i = 0; i < 120; i++) {
    const y = i * 9;
    line(c, 0, y, W, y, rgba('243,150,112', .03 + grain(i, 23) * .07));
  }
  if (!k) {
    const offset = 348 * (1 - ease(v));
    c.save(); camera(c, 946 + 33 * v, 529 - 39 * v, 1.02 + v * .14, -.042 * (1 - v));
    const left = 276 + offset, right = 1658 - offset;
    poly(c, [[left, 753], [left, 238], [X, 238]], null, '#f1d5c8', 3);
    poly(c, [[right, 235], [right, 753], [X, 753]], null, '#f1d5c8', 3);
    ticks(c, left + 14, 754, 29, (right - left - 28) / 29, '#b8827e', 21);
    for (let i = 0; i < 11; i++) oval(c, X, Y, 105 + 61 * i, 73 + 43 * i, null, '#f38d7586', i % 3 ? 1 : 2, .13 + i * .05, 2.99 - i * .07, -.28);
    line(c, left, Y + 113, X - offset * .52, Y + 34, '#efdbd0bb', 2);
    line(c, right, Y - 134, X + offset * .50, Y - 41, '#efdbd0bb', 2);
    type(c, 'α', left + 42, 297, 36, '#edd2cb', 'left', 400, 'mono');
    type(c, 'δ', right - 42, 698, 36, '#edd2cb', 'right', 400, 'mono');
    c.restore();
  } else {
    const ring = ease(v * 2.9);
    rect(c, 0, 0, 322 + ring * 44, H, '#130912bf');
    rect(c, 1568 - ring * 44, 0, W - 1568 + ring * 44, H, '#130912bf');
    line(c, 358, Y, X - 22, Y, '#edb3a8', 2);
    line(c, X + 22, Y, 1533, Y, '#edb3a8', 2);
    line(c, X, 169, X, Y - 22, '#edb3a8', 2);
    line(c, X, Y + 22, X, 591, '#edb3a8', 2);
    oval(c, X, Y, 47 + ring * 184, 47 + ring * 108, null, rgba('255,159,131', .68 - ring * .59), 2);
    oval(c, X, Y, 31, 31, null, '#f9beaa', 2.3);
    // The intersection is fixed from the first frame of the 74.38 s cut.
    point(c, X, Y, 8 + Math.exp(-v * 20) * 3, '255,231,192');
    line(c, X - 15, Y, X + 15, Y, '#fff4db', 2);
    line(c, X, Y - 15, X, Y + 15, '#fff4db', 2);
    type(c, '往这里找', X, 720, 150 + 5 * ease(v), '#fae4cf', 'center', 900);
  }
  dust(c, t, 231, '241,151,119', 33, [170, 130, 1520, 760], 24);
  vignette(c, .56);
}

function letter(c, f) {
  const {k, v, t} = f;
  fill(c, '#1d1319', '#36251e');
  glow(c, k ? 1100 : 703 + 249 * v, 519, 884, '234,163,75', k ? .34 : .60);
  c.save();
  if (!k) camera(c, 946 + 57 * v, 526 - 37 * v, 1.04 + .14 * v, -.045);
  else camera(c, 967 + 51 * v, 550 - 22 * v, 1.18 + .16 * v, .035 - .05 * v);
  poly(c, [[-270, 429], [1763, 280], [2230, 1090], [-280, 1205]], k ? '#221a1d' : '#543721', '#8a5f36', 2.5);
  for (let i = 0; i < 12; i++) {
    const x = -195 + i * 152 + (k ? 0 : 76 * v);
    poly(c, [[x, 381], [x + 60, 374], [x + 383, 1060], [x + 156, 1074]], k ? '#9a693410' : '#ffd08d1c');
  }
  if (!k) {
    const p = ease(v * 1.15);
    const x = 940 + 55 * p, y = 604 - 12 * p;
    c.save(); c.translate(x, y); c.rotate(-.16 + .07 * p);
    poly(c, [[-431, -136], [431, -136], [480, 217], [-456, 218]], '#21161891');
    poly(c, [[-421, -149], [422, -149], [455, 188], [-435, 188]], linear(c, -420, -200, 420, 180, [[0, '#e2c08c'], [.54, '#f2dcae'], [1, '#b99866']]), '#f0d0a0', 2);
    for (let i = 0; i < 5; i++) {
      const y = -105 + i * 44;
      for (let j = 0; j < 13; j++) {
        const x = -300 + j * 47;
        curve(c, [x, y, x + 18, y - 29 + grain(j, 241) * 13, x + 19, y + 6, x + 39, y - 3], '#6545369f', 2.2);
      }
    }
    const rise = 325 * Math.sin(p * Math.PI);
    const foldY = mix(188, -52, p) - rise * .31;
    poly(c, [[-428, 95], [444, 95], [434 - 44 * p, foldY], [-428 + 33 * p, foldY]], linear(c, 0, foldY, 0, 96, [[0, '#eed9af'], [1, '#a57a50']]), '#dfbe8f', 2.3);
    line(c, -428, 95, 444, 95, '#99794a', 2);
    c.restore();
  } else {
    const x = 965, y = 555;
    c.save(); c.translate(x, y); c.rotate(-.182);
    poly(c, [[-459, -217], [464, -212], [477, 227], [-451, 229]], '#08090c88');
    poly(c, [[-474, -230], [449, -228], [462, 212], [-466, 213]], linear(c, -394, -192, 457, 265, [[0, '#f1d6a1'], [.47, '#f5e2b9'], [1, '#bca078']]), '#f1d5a4', 2.7);
    poly(c, [[-474, -230], [-19, 18], [449, -228]], '#e3c599', '#ab865f', 2);
    line(c, -466, 213, -99, -25, '#ae8d67', 2);
    line(c, 462, 212, 68, -28, '#ae8d67', 2);
    const release = ease((v - .32) / .54);
    const stampHeight = 147 * (1 - release) * Math.exp(-v * 21) + 236 * release;
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      oval(c, Math.cos(a) * 31 - 16, Math.sin(a) * 25 + 21, 16 + grain(i, 24) * 9, 15, '#86262b');
    }
    oval(c, -16, 21, 44, 38, '#a13332', '#c45a48', 2);
    oval(c, -16, 21, 27, 25, null, '#691e26', 3);
    poly(c, [[-31, 24], [-16, 5], [-2, 23], [-15, 37], [-31, 24]], null, '#6e2227', 2);
    c.save(); c.translate(-16 + release * 175, 21 - stampHeight); c.rotate(.24 * release);
    oval(c, -1, 1, 57, 28, '#120a12a5');
    oval(c, 0, -11, 49, 30, '#674335', '#c28e5c', 2.4);
    rect(c, -49, -33, 98, 23, '#855334');
    oval(c, 0, -31, 49, 25, '#a07349', '#cf9c61', 2);
    poly(c, [[-24,-35],[-19,-79],[-30,-117],[-21,-148],[22,-148],[32,-117],[19,-76],[24,-36]], '#38252a', '#946e54', 3);
    oval(c, 1, -147, 24, 13, '#674736', '#aa7854', 2);
    c.restore(); c.restore();
  }
  c.restore();
  dust(c, t, 24, '255,205,141', 35, [0, 220, W, 698], 16);
  vignette(c, .67);
}

function wheel(c, x, y, r, a) {
  oval(c, x, y, r, r, null, '#0c151e', r * .13);
  oval(c, x, y, r * .96, r * .96, null, '#60737a', 1.5);
  for (let i = 0; i < 10; i++) {
    const p = a + i * TAU / 10;
    line(c, x, y, x + Math.cos(p) * r, y + Math.sin(p) * r, '#14202a', Math.max(2, r * .055));
  }
  oval(c, x, y, r * .16, r * .16, '#0a131e');
}

function carriage(c, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s);
  const a = t * 4.6;
  const ink = '#101a24', edge = '#65767c';
  line(c, -167, 26, 223, 12, ink, 13);
  poly(c, [[-220, 13], [-226, -97], [-185, -163], [-72, -175], [-37, -143], [-25, -17], [-66, 25], [-200, 25]], ink, edge, 2.7);
  poly(c, [[-188, -115], [-101, -124], [-99, -53], [-180, -50]], '#384751', '#788381', 2.3);
  line(c, -145, -120, -140, -52, '#17232d', 5);
  poly(c, [[-35, -2], [-31, -62], [44, -63], [68, -3]], ink, edge, 2);
  profile(c, 8, -107, .30, {angle: .16, rim: '#687577'});
  wheel(c, -173, 46, 63, a);
  wheel(c, -11, 55, 51, a);
  const bob = Math.sin(a * 1.33) * 4;
  poly(c, [[96, -37 + bob], [145, -69 + bob], [212, -63 + bob], [245, -88 + bob], [249, -125 + bob], [268, -148 + bob], [278, -129 + bob], [289, -146 + bob], [292, -123 + bob], [318, -104 + bob], [312, -88 + bob], [286, -94 + bob], [267, -51 + bob], [249, -14], [197, 0], [145, -8], [118, 12], [92, -6]], ink, edge, 2);
  curve(c, [108,-30, 76,-39, 78,34, 38,37], ink, 8);
  line(c, 255, -48, 307, -98 + bob, '#586d76', 2.3);
  line(c, 304, -94 + bob, 24, -75, '#435761', 1.8);
  [126, 153, 226, 246].forEach((lx, i) => {
    const swing = Math.sin(a * 1.35 + i * 2.3);
    const knee = lx + 23 * swing;
    const foot = lx + 40 * swing;
    poly(c, [[lx, -11], [knee, 37 + swing * 14], [foot, 74 - Math.abs(swing * 25)]], null, ink, i % 2 ? 9 : 12);
    line(c, foot, 74 - Math.abs(swing * 25), foot + 10, 74 - Math.abs(swing * 25), ink, 5);
  });
  c.restore();
}

function winterRoad(c, f) {
  const {k, v, t, a} = f;
  fill(c, '#263848', '#6f8588');
  glow(c, 1364, 375, 1020, '185,206,201', .48);
  const horizon = k ? 485 : 575;
  const dx = k ? 26 * v : 119 * v;
  poly(c, [[-260, horizon + 74], [62 - dx, horizon - 86], [380 - dx, horizon + 3], [573 - dx, horizon - 147], [862 - dx, horizon - 58], [1110 - dx, horizon - 131], [1430 - dx, horizon - 52], [1712 - dx, horizon - 188], [2210, horizon + 4], [2210, 914], [-260, 914]], '#465d68');
  poly(c, [[-280, horizon + 58], [308 - dx, horizon - 7], [587 - dx, horizon + 97], [845 - dx, horizon + 63], [1461 - dx, horizon + 141], [1666 - dx, horizon + 32], [2190, horizon + 26], [2190, 1090], [-280,1090]], '#657d82');
  for (let i = 0; i < 39; i++) {
    const x = i * 59 - dx * 1.9 - 160;
    const h = 15 + grain(i, 25) * 67;
    const y = horizon + 68 + grain(i, 250) * 76;
    poly(c, [[x - h * .19,y], [x,y - h], [x + h * .25,y]], i % 3 ? '#3d5661' : '#4a636d');
  }
  if (k) {
    poly(c, [[-70,1040],[419,797],[789,684],[1196,628],[1430,566],[1480,568],[1278,658],[918,750],[663,863],[494,1140]], '#8d9a98', '#afbbb2', 2.5);
    curve(c, [181, 1060, 625, 782, 1041, 668, 1468, 565], '#4b626c9c', 8);
    curve(c, [436, 1120, 725, 836, 1119, 700, 1476, 567], '#566c739f', 7);
    carriage(c, 851 + 551 * ease(v), 777 - 166 * ease(v), .57 - .37 * ease(v), a);
    c.save(); c.translate(497 - v * 28, 755); c.scale(.65, .65);
  } else {
    poly(c, [[-320,1040],[553-dx*.8,824],[1600-dx*.7,744],[2300,719],[2300,1090],[-320,1110]], '#8a9d9c');
    curve(c, [-200, 1061, 452 - dx, 960, 1012 - dx, 815, 2140, 768], '#475e68', 19);
    curve(c, [-190, 1121, 551 - dx, 1007, 1202 - dx, 880, 2150, 813], '#607780', 16);
    carriage(c, 685 + 411 * v, 750 - 33 * v, 1.44 - .08 * v, a);
    c.save(); c.translate(455 - 590 * v, 881); c.scale(1.4, 1.4);
  }
  poly(c, [[-12,9],[-10,-202],[3,-208],[13,9]], '#16262e', '#768d90', 2);
  poly(c, [[-76,-177],[54,-177],[76,-164],[55,-145],[-73,-152]], '#22323a', '#879a98', 2);
  c.restore();
  for (let i = 0; i < 29; i++) {
    const x = ((i * 83 - dx * 4 + 3300) % 2120) - 100;
    const y = 875 + grain(i, 252) * 237;
    const l = 12 + grain(i, 253) * 63;
    poly(c, [[x,y],[x+l*.37,y-19],[x+l*.59,y-12],[x+l,y]], '#283b43ab');
  }
  const snow = k ? ease((v - .18) * 1.3) : .17;
  glow(c, 740 + 806 * v, 811 - snow * 131, 1020, '196,217,210', snow * .67);
  dust(c, t, 251, '221,234,226', k ? 199 : 80, [-150, k ? 465 : 749, 2250, 620], k ? 238 : 135);
  vignette(c, .63);
  if (k) rect(c, 0, 0, W, H, rgba('7,9,13', ease((v - .88) / .12)));
}

const scenes = [palermo, shortArc, daylight, archive, disagreement, attic,
  candidateCurves, observations, orbit, prediction, letter, winterRoad];

export function drawActTwo(ctx, f) {
  const draw = scenes[f.id - 14];
  if (!draw) return;
  ctx.save();
  try {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    draw(ctx, f);
  } finally {
    ctx.restore();
  }
}
