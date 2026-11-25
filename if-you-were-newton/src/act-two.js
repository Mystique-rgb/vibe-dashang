import { clamp, lerp, ease, hash, path, line, ellipse, radial, camera, light, beam, paper, label, figure, candle } from './visual.js';

const ink = '#523126';
const rim = '#b27b54';
const tau = Math.PI * 2;
const bands = ['#f54a39', '#ed8540', '#ecc371', '#7fbd8b', '#70a8cf', '#9479b7'];

function wash(ctx, x1, y1, x2, y2, colors) {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, i) => gradient.addColorStop(i / (colors.length - 1), color));
  return gradient;
}

function shape(ctx, start, segments, fill, stroke, width = 2) {
  ctx.beginPath();
  ctx.moveTo(...start);
  for (const segment of segments) {
    if (segment.length === 2) ctx.lineTo(...segment);
    else ctx.bezierCurveTo(...segment);
  }
  if (fill) {
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function shot(ctx, f, x, y, scale, dx, dy, push, tilt = 0) {
  camera(ctx, x + dx * f.v, y + dy * f.v, scale + push * ease(f.v), tilt);
}

function wood(ctx, x, y, w, h, seed = 1) {
  ctx.fillStyle = wash(ctx, x, y, x + w * .4, y + h, ['#2b1b1e', '#684332', '#432820', '#211619']);
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 7; i++) {
    const py = y + h * i / 7;
    line(ctx, [[x, py], [x + w, py + 5]], '#211417ad', 3);
    line(ctx, [[x, py + 4], [x + w, py + 8]], '#c2926236', 1.6);
  }
  for (let i = 0; i < 72; i++) {
    const n = seed + i * 17;
    const px = x + w * hash(n);
    const py = y + h * hash(n + 1);
    const length = Math.min(x + w - px, 22 + w * .14 * hash(n + 2));
    shape(ctx, [px, py], [[px + length * .35, py - 4, px + length * .72, py + 3, px + length, py]], null, i % 3 ? '#28171972' : '#d398632d', 1.3);
  }
}

function leaf(ctx, x, y, size, angle, color, edge = '#b9905659') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  shape(ctx, [0, 0], [[size * .36, -size * .52, size * .77, -size * .28, size, 0], [size * .68, size * .34, size * .24, size * .33, 0, 0]], color, edge, 1.2);
  line(ctx, [[0, 0], [size * .91, -.5]], edge, 1);
  for (let i = 1; i <= 3; i++) {
    const px = i * size / 5;
    line(ctx, [[px + size * .11, -size * .22], [px, 0], [px + size * .13, size * .19]], edge, .7);
  }
  ctx.restore();
}

function arrow(ctx, x, y, ex, ey, color, width = 3) {
  line(ctx, [[x, y], [ex, ey]], color, width);
  const theta = Math.atan2(ey - y, ex - x);
  path(ctx, [[ex, ey], [ex - 5 * width * Math.cos(theta - .42), ey - 5 * width * Math.sin(theta - .42)], [ex - 5 * width * Math.cos(theta + .42), ey - 5 * width * Math.sin(theta + .42)]], color);
}

function pen(ctx, x, y, angle, size, graphite = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  if (graphite) {
    path(ctx, [[0, 0], [24, -5], [149, -5], [154, 2], [149, 7], [24, 6]], wash(ctx, 0, -6, 0, 8, ['#a37d52', '#483232', '#241a1c']), ink);
    path(ctx, [[0, 0], [25, -5], [25, 6]], '#bb8f61', ink);
    path(ctx, [[0, 0], [8, -2], [8, 2]], '#35262a');
  } else {
    shape(ctx, [15, -3], [[58, -15, 92, -40, 157, -35], [147, -8, 105, 13, 35, 8], [15, -3]], wash(ctx, 70, -32, 80, 18, ['#ead0a5', '#b49672', '#6e5347']), ink);
    for (let i = 0; i < 16; i++) {
      const px = 39 + i * 6;
      line(ctx, [[px, 2 - i * 1.1], [px + 15, -11 - i * 1.5]], '#674d3c9c', .8);
    }
    line(ctx, [[0, 0], [61, 3], [149, -31]], '#755442', 2.4);
    path(ctx, [[0, 0], [14, -4], [12, 3]], '#23191b');
  }
  ctx.restore();
}

function hand(ctx, x, y, size, angle, coat = '#504038', pose = 'grip') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  const skin = wash(ctx, 0, -40, 48, 65, ['#edc59b', '#bb845e', '#76463b']);
  const fabric = wash(ctx, 82, -42, 136, 67, ['#9c7657', coat, '#21191f']);
  shape(ctx, [64, -31], [[109, -45, 120, -52, 212, -43], [225, 59], [151, 62, 110, 57, 59, 44]], fabric, ink, 2.5);
  for (let i = 0; i < 8; i++) {
    line(ctx, [[89 + i * 8, -21 - i * .9], [143 + i * 8, -18 + i * 2]], '#e1aa7330', 1.2);
  }
  path(ctx, [[61, -29], [79, -33], [95, 43], [68, 51]], '#cab298', '#664838', 2);
  line(ctx, [[72, -22], [83, 39]], '#866951', 1.5);
  if (pose === 'point') {
    shape(ctx, [67, -22], [[48, -28, 34, -22, 15, -17], [-13, -12, -44, -9, -48, -1], [-47, 10, -15, 5, 8, 5], [17, 8, 8, 17, 13, 22], [21, 33, 37, 34, 48, 41], [58, 47, 66, 43, 71, 37]], skin, ink, 2.3);
    shape(ctx, [54, -9], [[32, -15, 19, -5, 20, 6], [26, 13, 38, 9, 46, 17]], null, '#80543e', 2);
    line(ctx, [[-41, -3], [-26, -5], [-24, 2]], '#ecc09b', 1.5);
  } else {
    shape(ctx, [65, -25], [[42, -34, 38, -37, 23, -31], [8, -22, -10, -15, -13, -4], [-16, 5, -7, 8, 1, 4], [-5, 14, 0, 21, 12, 19], [10, 29, 19, 34, 31, 29], [37, 42, 53, 44, 68, 37]], skin, ink, 2.3);
    shape(ctx, [49, 19], [[27, 6, 17, 13, 6, 6], [-5, -3, 11, -13, 21, -14], [34, -11, 41, -10, 51, -4]], skin, '#825039', 1.8);
    line(ctx, [[5, 6], [14, 0], [22, 2]], '#efd1aa', 1.3);
  }
  ctx.restore();
}

function prism(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ellipse(ctx, 13, 54, 100, 25, '#120e1599');
  path(ctx, [[-84, 50], [10, -103], [58, -88], [110, 64], [61, 72]], wash(ctx, -78, -80, 110, 54, ['#b5ab9977', '#3d59744d', '#a99b83aa']), '#dfd3b1', 2.8);
  path(ctx, [[-84, 50], [10, -103], [61, 72]], wash(ctx, -57, -31, 79, 55, ['#e4d6b06e', '#58738a52', '#c79b7c99']), '#e3cdb0', 2.4);
  path(ctx, [[10, -103], [58, -88], [110, 64], [61, 72]], wash(ctx, 40, -67, 89, 58, ['#b5acaa9e', '#55637788', '#dfbaa0a6']), '#bead9f', 2);
  line(ctx, [[-73, 46], [10, -92], [49, 33]], '#fff0d1b8', 3);
  line(ctx, [[-66, 48], [53, 67], [100, 62]], '#dac5b0a0', 1.4);
  ctx.restore();
}

function ray(ctx, points, color, width) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  line(ctx, points, color + '29', width * 4);
  line(ctx, points, color + '87', width * 1.65);
  line(ctx, points, color, width * .53);
  ctx.restore();
}

function optics(ctx, f) {
  const views = [[960, 530, .96, 32, -13, .06], [1120, 504, 1.34, 245, 29, .1], [1600, 466, 1.92, 85, 20, .24]];
  shot(ctx, f, ...views[f.k]);
  wood(ctx, -280, 670, 2490, 630, 12);
  // The red ray enters the second prism from the slit and reaches the same spot in every view.
  const split = [458, 427], slit = [850, 449], second = [1144, 466], hit = [1640, 554];
  path(ctx, [[1498, 199], [1798, 146], [1833, 673], [1525, 724]], '#402831', rim, 4);
  path(ctx, [[1511, 212], [1784, 164], [1818, 661], [1538, 706]], wash(ctx, 1530, 258, 1824, 668, ['#c4a989', '#927568', '#59414a']), '#dbad85', 2);
  for (let i = 0; i < 22; i++) {
    const y = 236 + i * 20;
    line(ctx, [[1538, y], [1787, y - 37]], '#efc6a521', 1);
  }
  path(ctx, [[1550, 719], [1603, 706], [1594, 763], [1546, 784]], '#3e282b', rim, 2);
  prism(ctx, 446, 429, 1.1);
  prism(ctx, 1142, 474, .98);
  ray(ctx, [[-130, 369], split], '#fff0c1', 9);
  for (let i = 1; i < bands.length; i++) {
    const retreat = f.k === 2 ? 1 - ease(f.v * 2.4) : 1;
    if (retreat > 0) ray(ctx, [split, [837, 449 + i * 27 * retreat]], bands[i], 5 * retreat);
  }
  path(ctx, [[783, 316], [852, 307], [879, 440], [804, 444]], wash(ctx, 787, 321, 881, 440, ['#9a6b44', '#47302d', '#261820']), rim, 2);
  path(ctx, [[804, 456], [879, 452], [894, 632], [823, 651]], wash(ctx, 810, 463, 893, 649, ['#905c3c', '#52312b', '#301d23']), rim, 2);
  for (const [x, y] of [[807, 337], [848, 330], [842, 619], [878, 612]]) ellipse(ctx, x, y, 5, 5, '#342423', '#c19264');
  ray(ctx, [split, slit, second, hit], bands[0], 7.5);
  light(ctx, ...hit, 105, '248,61,42', .54);
  ellipse(ctx, ...hit, 14, 19, '#b52c2c');
  ellipse(ctx, hit[0] - 2, hit[1], 8, 13, '#ff5846', '#ffa291', 1.2);
}

function graphPaper(ctx, f, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  paper(ctx, -456, -246, 912, 490, 132);
  for (let i = 0; i <= 16; i++) {
    const px = -384 + i * 48;
    line(ctx, [[px, -187], [px, 184]], '#71483528', 1);
    line(ctx, [[px, 151], [px, 165]], '#704733', 1.2);
  }
  for (let i = 0; i < 9; i++) line(ctx, [[-385, -187 + i * 46], [384, -187 + i * 46]], '#71483528', 1);
  arrow(ctx, -384, 158, 377, 158, ink, 2);
  arrow(ctx, -365, 182, -365, -176, ink, 2);
  const curveY = x => 55 - .00068 * (x + 158) ** 2;
  const curve = Array.from({ length: 45 }, (_, i) => {
    const x = -342 + i * 15;
    return [x, curveY(x)];
  });
  path(ctx, curve, null, '#6c302b', 4.5, false);
  const px = 96, py = curveY(px);
  const gap = lerp(145, 10, ease(f.v));
  const qx = px + gap, qy = curveY(qx);
  const slope = f.k ? -.00136 * (px + 158) : (qy - py) / gap;
  line(ctx, [[px - 189, py - 189 * slope], [px + 226, py + 226 * slope]], '#313c39', 2.8);
  ctx.setLineDash([5, 7]);
  line(ctx, [[px, py], [px, 158]], '#754f3a9b', 1.5);
  if (!f.k) line(ctx, [[px, 158], [qx, 158], [qx, qy]], '#754f3a9b', 1.5);
  ctx.setLineDash([]);
  ellipse(ctx, px, py, 7, 7, '#452a2a', '#ecd4a6', 1.6);
  label(ctx, 'P', px - 22, py - 13, 22, ink);
  if (!f.k) {
    ellipse(ctx, qx, qy, 6, 6, '#8d4332', '#efd1a2', 1.6);
    label(ctx, 'Q', qx + 13, qy + 5, 22, ink);
  }
  ctx.restore();
}

function changes(ctx, f) {
  if (!f.k) {
    shot(ctx, f, 970, 593, 1.04, 65, -19, .1, -.065);
    wood(ctx, -260, 270, 2410, 1020, 13);
    path(ctx, [[338, 317], [1378, 262], [1450, 778], [365, 852]], '#513726', '#a67551', 5);
    paper(ctx, 403, 339, 1000, 454, 128);
    paper(ctx, 430, 308, 976, 453, 209);
    graphPaper(ctx, f, 942, 520, 1);
    const lift = Math.sin(ease(f.v) * Math.PI) * 163;
    shape(ctx, [492, 690], [[686, 728 - lift * .1, 989, 739, 1340, 718], [1349, 697 - lift * .56, 1329, 676 - lift, 1324, 676 - lift], [1030, 723 - lift, 701, 749 - lift * .35, 492, 690]], wash(ctx, 680, 679 - lift, 685, 741, ['#f1d9ab', '#c19a6c', '#694433']), '#7f5139', 2);
    hand(ctx, 1336, 701 - lift * .72, 1.25, -.22);
    light(ctx, 503, 379, 330, '255,192,123', .17);
  } else {
    shot(ctx, f, 1020, 685, 1.09, 107, -19, .16, .035);
    wood(ctx, -300, 291, 2500, 950, 31);
    graphPaper(ctx, f, 955, 544, 1.43);
    ctx.save();
    ctx.translate(1170, 411);
    ctx.rotate(-.35);
    path(ctx, [[-270, -28], [274, -28], [274, 2], [-270, 2]], wash(ctx, 0, -28, 0, 2, ['#946c47', '#d2ac75', '#b58a5a']), '#754b32', 2);
    for (let i = 0; i < 35; i++) line(ctx, [[-257 + i * 15, -1], [-257 + i * 15, i % 5 ? -9 : -18]], ink, 1);
    ctx.restore();
    ellipse(ctx, 448, 653, 7, 5, '#332231', '#a36d4e', 1.2);
    ellipse(ctx, 446, 651, 2, 1.4, '#e1b787');
  }
}

function bark(ctx, start, segments, weight) {
  shape(ctx, start, segments, null, '#382528', weight + 9);
  shape(ctx, start, segments, null, '#634334', weight);
  const offset = weight * .24;
  shape(ctx, [start[0], start[1] - offset], segments.map(segment => segment.map((v, i) => i % 2 ? v - offset : v)), null, '#ae785185', weight * .22);
}

function apple(ctx, x, y, scale, angle, hanging = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  const color = radial(ctx, -20, -29, 112, [[0, '#e9a05c'], [.24, '#c86342'], [.56, '#964335'], [.8, '#672833'], [1, '#371e29']]);
  shape(ctx, [-1, -38], [[-26, -60, -59, -43, -61, -8], [-68, 20, -44, 64, -17, 62], [-5, 60, 2, 58, 14, 62], [46, 60, 63, 18, 56, -12], [51, -44, 22, -55, -1, -38]], color, '#4c282a', 3.5);
  shape(ctx, [-22, -35], [[-12, -41, 0, -32, 12, -37]], null, '#6e3329', 4);
  shape(ctx, [-3, -35], [[-4, -53, -1, -66, hanging ? 2 : 6, hanging ? -88 : -69]], null, '#4e3425', 6);
  shape(ctx, [-1, -39], [[-2, -54, 3, -66, hanging ? 4 : 8, hanging ? -89 : -68]], null, '#b58351', 1.4);
  shape(ctx, [-44, -16], [[-40, -37, -23, -43, -13, -36]], null, '#f7c18689', 3.4);
  for (let i = 0; i < 34; i++) {
    const theta = tau * hash(158 + i * 11);
    const radius = 37 * Math.sqrt(hash(161 + i * 11));
    ellipse(ctx, 1.13 * radius * Math.cos(theta), 3 + 1.35 * radius * Math.sin(theta), 1 + hash(159 + i * 11), 1.1, '#f1a76a65');
  }
  ctx.restore();
}

function blades(ctx, x, y, scale, seed, bend = 0, count = 14) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const shades = ['#373a2d', '#575438', '#766640', '#978054', '#594c32'];
  for (let i = 0; i < count; i++) {
    const n = seed + i * 13;
    const lx = (hash(n) - .5) * 114;
    const length = 29 + hash(n + 1) * 116;
    const tip = lx + (hash(n + 2) - .48 + bend) * 106;
    shape(ctx, [lx - 4, 0], [[lx - 3, -length * .43, tip - 11, -length * .8, tip, -length], [tip + 5, -length * .73, lx + 8, -length * .51, lx + 5, 0]], shades[i % shades.length], '#bd975953', .95);
  }
  ctx.restore();
}

function ground(ctx, y, seed) {
  shape(ctx, [-400, y + 48], [[77, y - 39, 310, y + 44, 633, y + 6], [1015, y - 40, 1150, y + 54, 1490, y + 7], [1815, y - 40, 2110, y + 38, 2390, y + 5], [2390, 1320], [-400, 1320]], wash(ctx, 0, y - 19, 0, 1190, ['#684a35', '#493425', '#261c1d', '#151318']), '#6c5136', 2);
  for (let i = 0; i < 105; i++) {
    const n = seed + i * 23;
    const x = -300 + hash(n) * 2550;
    const py = y + 46 + hash(n + 1) * Math.max(70, 1110 - y);
    const r = 1 + hash(n + 2) * 8;
    ellipse(ctx, x, py, r * 2, r * .44, i % 4 ? '#281f1cad' : '#a37f52a6');
    if (i % 6 === 0) leaf(ctx, x, py, r * 8, hash(n + 3) * 6, '#765039');
  }
}

function orchardDepth(ctx, f, y) {
  for (let i = 0; i < 11; i++) {
    const x = -61 + i * 215 + 51 * hash(251 + i);
    const bend = 120 * (hash(291 + i) - .52);
    shape(ctx, [x - 25, y], [[x + bend, y - 226, x + bend - 8, y - 480, x + bend + 62, -110], [x + bend + 85, -110], [x + bend + 49, y - 463, x + 55, y - 190, x + 42, y]], i % 3 ? '#292e25' : '#38392b', '#85603d63', 2);
    for (let j = 0; j < 6; j++) {
      ellipse(ctx, x + 72 * Math.sin(j * 2.6 + i), 18 + j * 69, 143 * (.75 + hash(i * 19 + j) * .45), 66, j % 2 ? '#2c38295c' : '#69704a38');
    }
  }
  beam(ctx, [[1199, -100], [1350, -100], [1057, y + 170], [660, y + 165]], '255,207,129', .37);
  light(ctx, 1130 + Math.sin(f.a * 3) * 13, y - 111, 460, '235,177,92', .2);
}

function appleBough(ctx, x, y, time, showing, fracture = 0) {
  ctx.save();
  ctx.translate(x, y);
  const sway = Math.sin(time * 7.1) * .035;
  ctx.rotate(sway);
  bark(ctx, [-505, -149], [[-348, -103, -170, -29, 12, 3], [97, 14, 188, 25, 298, 3]], 27);
  bark(ctx, [-346, -109], [[-249, -127, -109, -124, 57, -170]], 15);
  bark(ctx, [-148, -48], [[-72, -101, -18, -81, 72, -118]], 10);
  bark(ctx, [29, 5], [[24, 19, 7, 33, 2 + fracture * 6, 45 - fracture * 7]], 5);
  const greens = ['#42513a', '#68704a', '#837c4c', '#354732', '#9b8854'];
  for (let i = 0; i < 22; i++) {
    const n = 100 + i * 37;
    const px = -450 + hash(n) * 730;
    const py = -143 + (px + 450) * .19 + (hash(n + 1) - .52) * 145;
    leaf(ctx, px, py, 35 + hash(n + 2) * 80, hash(n + 3) * tau + .06 * Math.sin(time * 9 + i), greens[i % greens.length]);
  }
  if (showing) apple(ctx, 0, 132 + fracture * 8, 1, sway * 3, true);
  ctx.restore();
}

function orchard(ctx, f) {
  if (f.k === 0) {
    shot(ctx, f, 864, 525, 1.06, 125, 25, .14, -.02);
    orchardDepth(ctx, f, 612);
    ground(ctx, 605, 14);
    for (let i = 0; i < 21; i++) blades(ctx, i * 115 - 155, 736 + 139 * hash(i + 120), .62 + hash(i + 118) * 1.79, i * 31, Math.sin(f.a * 7 + i) * .12);
    for (let i = 0; i < 14; i++) {
      const x = i < 7 ? 48 + i * 58 : 1470 + (i - 7) * 72;
      leaf(ctx, x - f.v * 68, 660 - (i % 4) * 93, 183 + i % 4 * 32, i * 1.84, i % 2 ? '#4e4e2c' : '#293a29');
    }
  } else if (f.k === 1) {
    shot(ctx, f, 1070, 287, 1.58, 68, 55, .16, .045);
    orchardDepth(ctx, f, 703);
    appleBough(ctx, 1124, 213, f.a, true, ease(f.v) * .32);
    light(ctx, 1204, 312, 275, '249,177,102', .22);
  } else if (f.k === 2) {
    shot(ctx, f, 1190, 326, 1.33, -149, 114, .15, -.07 + .12 * f.v);
    orchardDepth(ctx, f, 720);
    appleBough(ctx, 1131, 139, f.a, true, ease((f.v - .65) / .35));
    ctx.save();
    ctx.translate(283 + f.v * 150, 372 - f.v * 69);
    ctx.rotate(.22 + .34 * f.v);
    bark(ctx, [-560, -116], [[-233, -80, 92, 64, 500, 112]], 25);
    for (let i = 0; i < 11; i++) leaf(ctx, -410 + i * 72, -93 + 21 * i, 139, (i % 2 ? 1.67 : -1.28) + i * .07, i % 3 ? '#364830' : '#6f6d3f');
    ctx.restore();
  } else {
    shot(ctx, f, 1000, 414, 1.15, 27, 20, .05);
    orchardDepth(ctx, f, 1400);
    appleBough(ctx, 1004, 78, f.a, false, 1);
    beam(ctx, [[1170, -30], [1290, -28], [1080, 858], [875, 858]], '255,203,116', .43);
    const fall = clamp(f.v * 1.18);
    const y = 210 + 1030 * fall * fall;
    if (y < 990) apple(ctx, 1004 + 27 * fall, y, 1.16, .1 + fall * .46);
  }
}

const newton = { coat: '#49342e', hair: ['#987350', '#654435', '#302328'] };
const halley = { coat: '#294742', hair: ['#846748', '#533d32', '#2b2428'] };

function eye(ctx, x, y, size, gaze, blink = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  const gap = 1 - blink * .94;
  shape(ctx, [-30, 1], [[-15, -17 * gap, 9, -18 * gap, 27, -2], [9, 14 * gap, -9, 12 * gap, -30, 1]], '#c3a18a', '#633a31', 2.7);
  ctx.save();
  ctx.clip();
  ellipse(ctx, gaze * 12, -2 + Math.abs(gaze) * 3, 11, 12, '#6d624b', '#51392e', 1.3);
  ellipse(ctx, gaze * 12, -1 + Math.abs(gaze) * 3, 5, 6, '#241c21');
  ellipse(ctx, gaze * 12 - 3, -5, 2.6, 2.4, '#ffe1af');
  ctx.restore();
  shape(ctx, [-34, 1], [[-20, -13 * gap, 1, -21 * gap, 30, -3]], null, '#3c2826', 3.4);
  shape(ctx, [-35, -18], [[-18, -36, 6, -37, 34, -24]], null, '#583b2e', 6);
  for (let i = 0; i < 13; i++) line(ctx, [[-31 + 5 * i, -19 - 10 * Math.sin(i / 12 * Math.PI)], [-26 + 5 * i, -24 - 11 * Math.sin(i / 12 * Math.PI)]], '#a376514f', 1);
  shape(ctx, [-23, 14], [[-7, 23, 12, 20, 23, 12]], null, '#7c4e3c', 1.4);
  ctx.restore();
}

function face(ctx, x, y, size, facing, person, gaze, older = false, blink = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size * facing, size);
  const hal = person === halley;
  const hair = wash(ctx, -105, -87, 102, 102, person.hair);
  const skin = wash(ctx, -61, -85, 92, 89, ['#8f5f46', '#dfad80', '#b98260', '#71504b']);
  const width = older ? 18 : 0;
  shape(ctx, [-106 - width, 105], [[-132 - width, 51, -128, -93, -77, -123], [-19, -157, 58, -134, 71, -90], [93, -49, 73, -37, 65, -12], [74, 22, 84, 83, 60, 119], [35, 155, 5, 120, -24, 145], [-61, 164, -71, 124, -106 - width, 105]], hair, '#683f32', 3.2);
  shape(ctx, [-43, 47], [[-45, 83, -58, 95, -73, 106], [-19, 137, 25, 142, 48, 96], [24, 85, 25, 70, 28, 43]], skin, '#6c4434', 2);
  shape(ctx, [-53, -68], [[-29, -109, 29, -112, 53, -81], [65, -59, 61, -48, 63, -31], [69, -17, 90, -5, hal ? 79 : 90, 4], [83, 8, 71, 10, 67, 8], [62, 18, 68, 24, 64, 27], [60, 32, 68, 44, 59, 52], [42, 79, 14, 78, -13, 62], [-34, 52, -44, 31, -52, 14], [-70, 18, -79, 1, -68, -14], [-65, -41, -61, -57, -53, -68]], skin, '#875638', 2.7);
  shape(ctx, [-54, -68], [[-24, -101, 29, -111, 57, -80], [34, -95, -27, -71, -41, -37], [-48, -20, -55, -17, -67, -5], [-84, 32, -65, 86, -86, 117], [-103, 101, -116, 72, -112, 44], [-122, -9, -107, -63, -54, -68]], hair, '#765039', 2.5);
  for (let i = 0; i < 24; i++) {
    const x0 = -102 + (i % 10) * 5.1;
    const y0 = -69 + Math.floor(i / 10) * 19;
    const d = hash(121 + i) * 32;
    shape(ctx, [x0 + 51 + d, y0 - 43], [[x0 + 18, y0 - 52, x0 - d, y0 + 13, x0 + 1, y0 + 45], [x0 + 15, y0 + 77, x0 - 10, y0 + 96, x0 + 2, y0 + 138]], null, i % 3 ? '#39272594' : '#b78b596c', i % 3 ? 1.4 : 2.2);
  }
  shape(ctx, [-62, -6], [[-71, -16, -74, 5, -61, 10]], null, '#8e5743', 2.6);
  shape(ctx, [14, -14], [[36, -6, 49, -17, 52, -29]], null, '#945943', 2.3);
  shape(ctx, [35, 26], [[46, 22, 55, 22, 63, 25]], null, '#6b3a33', 2.8);
  shape(ctx, [39, 32], [[47, 36, 55, 34, 60, 31]], null, '#edb1848c', 1.5);
  line(ctx, [[67, -1], [76, 2], [80, 0]], '#724235', 1.6);
  eye(ctx, 32, -36, .66, gaze, blink);
  if (older) {
    shape(ctx, [3, -68], [[15, -74, 37, -71, 50, -65]], null, '#784c3d8a', 1.3);
    shape(ctx, [13, -61], [[24, -65, 35, -65, 48, -62]], null, '#784c3d8a', 1.3);
    shape(ctx, [56, 12], [[50, 15, 45, 17, 42, 21]], null, '#784c3d8a', 1.3);
  }
  ctx.restore();
}

function portrait(ctx, x, y, size, facing, person, gaze, options = {}) {
  const { older = false, lean = 0, blink = 0 } = options;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size * facing, size);
  ctx.rotate(lean);
  const fabric = wash(ctx, -202, 86, 99, 275, ['#31252a', person.coat, '#856044', '#201a20']);
  shape(ctx, [-48, 80], [[-102, 92, -176, 121, -191, 192], [-203, 226, -220, 284, -226, 364], [165, 369], [139, 307, 142, 207, 96, 150], [79, 120, 28, 98, -4, 93]], fabric, '#82583d', 3);
  shape(ctx, [-117, 110], [[-114, 173, -70, 225, -23, 279]], null, '#b588586e', 3);
  shape(ctx, [83, 142], [[78, 181, 98, 232, 111, 287]], null, '#d4a27582', 2.2);
  shape(ctx, [-60, 88], [[-19, 101, 8, 112, 46, 93], [62, 112, 69, 141, 76, 158], [34, 153, 9, 139, -5, 123], [-15, 146], [-65, 128]], '#c6b198', '#7e573f', 2);
  for (let i = 0; i < 18; i++) {
    const n = i * 9;
    line(ctx, [[-164 + hash(n) * 62, 142 + hash(n + 1) * 201], [-132 + hash(n) * 68, 149 + hash(n + 1) * 201]], '#a8784d35', 1.4);
  }
  for (let i = 0; i < 5; i++) ellipse(ctx, 38 + i * 4, 178 + i * 30, 4, 6, '#a98358', '#59372c', 1.5);
  face(ctx, 0, 0, 1, 1, person, gaze, older, blink);
  ctx.restore();
}

function hollow(ctx, x, y, rx, ry) {
  ellipse(ctx, x, y, rx, ry, radial(ctx, x, y, rx, [[0, '#21181b'], [.62, '#31211f'], [1, '#634531']]), '#825c3c83', 2);
  for (let i = 0; i < 9; i++) {
    const px = x + (hash(390 + i) - .5) * rx * 1.6;
    ellipse(ctx, px, y + (hash(489 + i) - .4) * ry, 5 + hash(781 + i) * 9, 2.4, '#a27b4c9e');
  }
}

function impact(ctx, f) {
  if (f.k === 0) {
    shot(ctx, f, 861, 578, 1.08, 106, 0, .075, -.025);
    orchardDepth(ctx, f, 580);
    ground(ctx, 552, 45);
    const x = lerp(488, 972, 1 - (1 - f.v) ** 2);
    const y = 640 - 23 * Math.sin(f.v * Math.PI * 3) * (1 - f.v);
    ellipse(ctx, x + 23, 715, 118, 22, '#241a1d99');
    apple(ctx, x, y, 1.26, .32 + (x - 488) / 74);
    blades(ctx, 325, 758, 1.51, 218, .45);
    blades(ctx, 1465, 745, 1.4, 754, .12);
    for (let i = 0; i < 14; i++) {
      const d = f.v * (16 + hash(i * 13) * 104);
      ellipse(ctx, 516 - d + i * 9, 715 - Math.sin(f.v * Math.PI) * (11 + hash(i) * 92), 2 + hash(i + 617) * 4, 2, '#a47b50a0');
    }
  } else if (f.k === 1) {
    shot(ctx, f, 1044, 606, 1.42, 136, -19, .08, .17);
    ground(ctx, 143, 72);
    const x = lerp(964, 1148, ease(f.v));
    apple(ctx, x, 594 + f.v * 15, 1.24, 6.86 + (x - 964) / 68);
    for (let i = 0; i < 9; i++) {
      const px = 970 + i * 38;
      const distance = Math.abs(x - px);
      const drag = Math.max(0, 1 - distance / 120);
      leaf(ctx, px + drag * 17, 607 + (i % 2 ? 77 : -89) * (1 + drag * .25), 94 + hash(i + 61) * 57, i * 1.9 + drag * .62, i % 2 ? '#716741' : '#6f4c31');
    }
    light(ctx, 1167, 554, 337, '245,173,101', .18);
  } else if (f.k === 2) {
    shot(ctx, f, 1011, 473, 1.76, 64, 25, .13, -.03);
    const gaze = lerp(-.45, .94, ease(f.v * 1.28));
    face(ctx, 1054, 615, 4.15, 1, newton, gaze);
    light(ctx, 1307, 415, 390, '255,200,128', .22);
  } else if (f.k === 3) {
    shot(ctx, f, 1005, 564, 1.33, 74, -20, .1);
    ground(ctx, 600, 19);
    const rebound = .95 * Math.exp(-3.4 * f.v) * Math.cos(f.v * 11);
    light(ctx, 1074, 541, 377, '255,204,115', .28);
    blades(ctx, 1050, 655, 2.15, 179, .04, 9);
    const tip = 1026 + rebound * 212;
    shape(ctx, [1008, 696], [[1000, 582, tip - 63, 506, tip, 354], [tip + 37, 479, 1040, 607, 1020, 696]], wash(ctx, 1050, 356, 1005, 696, ['#ae965e', '#766643', '#303729']), '#c49a5e9a', 1.9);
    shape(ctx, [1014, 689], [[1014, 583, tip - 21, 455, tip, 360]], null, '#ded09185', 1.4);
    blades(ctx, 1539, 755, 1.45, 175, .3);
  } else {
    shot(ctx, f, 1044, 566, 1.04, 87, 36, .31);
    ground(ctx, 435, 51);
    hollow(ctx, 1150, 674, 291, 86);
    const settle = 1 - ease(f.v * 2.4);
    apple(ctx, 1139 + 14 * (1 - settle), 600, 1.55, .35 - .19 * settle);
    for (let i = 0; i < 7; i++) blades(ctx, 510 + i * 206, 759 + hash(i + 12) * 81, .73 + hash(i + 28), 170 + i * 13, .18);
    light(ctx, 1134, 586, 315, '255,176,93', .2);
  }
}

function trough(ctx, x, y, s, time, reflection) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const sway = Math.sin(time * 3.1) * 5;
  for (const lx of [-323, 334]) {
    path(ctx, [[lx - 17, 84], [lx + 24, 83], [lx + 51 + sway, 306], [lx + 12 + sway, 313]], wash(ctx, lx, 92, lx + 60, 293, ['#856546', '#533b31', '#2a2227']), ink, 2.5);
  }
  path(ctx, [[-326, 179], [390, 202], [386, 226], [-316, 204]], '#533a30', '#8d694f', 3);
  path(ctx, [[-501, -30], [471, -30], [425, 125], [-437, 125]], wash(ctx, 0, -30, 0, 125, ['#927453', '#5b4335', '#36262b']), '#79543e', 4);
  path(ctx, [[-501, -30], [-424, -114], [401, -114], [471, -30], [435, 24], [-463, 24]], '#655143', '#ab8763', 3);
  const water = [[-461, -31], [-406, -95], [383, -95], [439, -31], [413, 3], [-444, 3]];
  path(ctx, water, wash(ctx, 0, -95, 0, 7, ['#2f4855', '#465966', '#202d3a']), '#b3946d', 2);
  ctx.save();
  path(ctx, water);
  ctx.clip();
  const cx = 91, cy = -49;
  const power = reflection ? .5 : .22;
  light(ctx, cx, cy, 107, '207,217,195', power);
  ellipse(ctx, cx, cy, 39, 18, '#c6cdbaaf');
  for (let i = 0; i < 6; i++) {
    const spread = (time * 1.43 + i * .169) % 1;
    const radius = 12 + spread * 247;
    ctx.globalAlpha = (1 - spread) * (reflection ? .84 : .27);
    ellipse(ctx, cx, cy, radius, 4 + radius * .145, null, '#e1dcc0', 1.3);
  }
  ctx.restore();
  for (let i = 0; i < 11; i++) line(ctx, [[-429, 35 + i * 7], [432 - i * 1.3, 31 + i * 8]], i % 2 ? '#352b27a8' : '#a47d5540', 1.5);
  ctx.restore();
}

function moonlight(ctx, f) {
  if (!f.k) {
    shot(ctx, f, 1010, 599, 1.03, 78, -147, .14, -.065);
    shape(ctx, [-300, 765], [[241, 469, 362, 653, 725, 607], [1068, 548, 1406, 487, 2173, 576], [2180, 1110], [-300, 1150]], '#21292b', '#655744', 3);
    for (let i = 0; i < 10; i++) {
      const x = 341 + i * 189;
      bark(ctx, [x, 630], [[x + 39, 437, x + 13, 284, x + 63, 157]], 13 + i % 3 * 7);
      bark(ctx, [x + 31, 421], [[x + 44, 339, x + 108, 310, x + 137, 248]], 6);
    }
    light(ctx, 1395, 194, 220, '178,213,224', .31);
    ellipse(ctx, 1395, 194, 33, 34, '#d5d7c0', '#e0caa06e', 2);
    ellipse(ctx, 1386, 192, 10, 5, '#abb1a2a0');
    trough(ctx, 1160, 676, .91, f.a, false);
    figure(ctx, 442, 1060, 775, { pose: 'back', young: true, tone: '#50403d' });
  } else {
    shot(ctx, f, 1098, 479, 1.07, 64, -22, .24, .045);
    ground(ctx, 700, 24);
    trough(ctx, 948, 568, 1.55, f.v, true);
    light(ctx, 1089, 492, 332, '145,191,211', .18);
  }
}

function metalBall(ctx, x, y, r) {
  ellipse(ctx, x, y, r, r, radial(ctx, x - r * .35, y - r * .36, r * 1.65, [[0, '#f0d3a2'], [.3, '#a57850'], [.61, '#6a4941'], [1, '#282027']]), '#4b3029', 2.2);
  shape(ctx, [x - r * .72, y - r * .23], [[x - r * .64, y - r * .58, x - r * .21, y - r * .83, x + r * .12, y - r * .71]], null, '#ffdfa391', 2);
}

function turntable(ctx, x, y, rx, ry) {
  ellipse(ctx, x, y + 33, rx, ry, '#302126', ink, 5);
  ellipse(ctx, x, y, rx, ry, wash(ctx, x - rx * .6, y - ry, x + rx * .65, y + ry, ['#95704c', '#73533c', '#4b322c']), '#a27a54', 4);
  ellipse(ctx, x, y, rx * .87, ry * .87, null, '#50362c', 2);
  for (let i = 0; i < 72; i++) {
    const theta = i * tau / 72;
    const reach = i % 6 ? .942 : .90;
    line(ctx, [[x + rx * reach * Math.cos(theta), y + ry * reach * Math.sin(theta)], [x + rx * .975 * Math.cos(theta), y + ry * .975 * Math.sin(theta)]], i % 6 ? '#c6a37098' : '#ecd3a2', i % 6 ? 1.25 : 2.6);
  }
  for (let i = 0; i < 29; i++) {
    const yy = (hash(673 + i * 11) - .5) * 1.67;
    const xx = Math.sqrt(1 - yy * yy) * .83;
    line(ctx, [[x - rx * xx, y + ry * yy], [x + rx * (xx - .06), y + ry * yy + 2]], '#d5a37120', 1.2);
  }
}

function swinging(ctx, f) {
  if (!f.k) {
    shot(ctx, f, 923, 513, 1.05, 160, 3, .12, -.045);
    wood(ctx, -400, 676, 2750, 610, 74);
    beam(ctx, [[530, 80], [761, 50], [1525, 685], [1045, 756]], '255,187,107', .37);
    turntable(ctx, 997, 629, 674, 100);
    const x = lerp(546, 1485, f.v);
    const y = 537 + 51 * Math.sin(f.v * Math.PI);
    line(ctx, [[988, 22], [x, y]], '#c7a77c', 2.5);
    for (let i = 3; i >= 1; i--) ellipse(ctx, x - 29 * i, y - i * 2, 38 + i * 8, 30 - i, '#cf9a5c25');
    ellipse(ctx, x + 16, y + 49, 58, 8, '#27191b92');
    metalBall(ctx, x, y, 43);
  } else {
    const graphic = f.k === 2;
    shot(ctx, f, graphic ? 1124 : 916, graphic ? 496 : 527, graphic ? 1.25 : .94, graphic ? -195 : 54, graphic ? 10 : -38, .13, graphic ? -.085 : 0);
    wood(ctx, -360, 8, 2660, 1320, 95);
    const x = 920, y = 468;
    turntable(ctx, x, y, 495, 344);
    const theta = graphic ? -.24 + .57 * f.v : -2.55 + 5.75 * f.v;
    const radius = graphic ? 260 : 267;
    const bx = x + radius * Math.cos(theta), by = y + radius * Math.sin(theta);
    if (graphic) {
      ctx.beginPath();
      ctx.arc(x, y, radius, theta - tau * ease(f.v * 1.9), theta);
      ctx.strokeStyle = '#ebc18dcc';
      ctx.lineWidth = 3.3;
      ctx.stroke();
      arrow(ctx, bx, by, bx - 163 * Math.sin(theta), by + 163 * Math.cos(theta), '#e7bd79', 4);
      arrow(ctx, bx, by, lerp(bx, x, .71), lerp(by, y, .71), '#9f5540', 4);
    }
    line(ctx, [[x, y], [bx, by]], '#e0c39a', 2.5);
    if (!graphic) hand(ctx, x, y, 1.15, -2.5);
    else ellipse(ctx, x, y, 8, 8, '#8c5640', '#e6bd8a', 2);
    metalBall(ctx, bx, by, 26);
    light(ctx, bx, by, 139, '247,189,101', .18);
  }
}

function scriptLines(ctx, x, y, width, rows, seed, step = 20) {
  for (let r = 0; r < rows; r++) {
    let px = x + (r % 5 ? 0 : 17);
    const end = x + width * (r === rows - 1 ? .63 : .88 + .11 * hash(seed + r));
    for (let i = 0; px < end; i++) {
      const n = seed + r * 389 + i * 41;
      const w = Math.min(end - px, 9 + hash(n) * 26);
      const py = y + r * step;
      shape(ctx, [px, py], [[px + w * .13, py - 3 - hash(n + 3) * 7, px + w * .23, py + 5, px + w * .36, py - 1], [px + w * .52, py - 7, px + w * .64, py + 3, px + w, py - 2]], null, i % 4 ? '#613b2f96' : '#452b28bc', 1.16);
      px += w + 3 + hash(n + 1) * 7;
    }
  }
}

function envelope(ctx, x, y, w, h, sealed = false) {
  paper(ctx, x, y, w, h, 789);
  path(ctx, [[x + 4, y + h - 4], [x + w * .46, y + h * .31], [x + w - 4, y + h - 4]], '#b38c6255', '#6f4634', 1.8);
  shape(ctx, [x + 4, y + 7], [[x + w * .42, y + h * .59, x + w * .48, y + h * .76, x + w * .53, y + h * .63], [x + w - 5, y + 5]], wash(ctx, x, y, x + w * .2, y + h, ['#dbbc8f', '#bd9467', '#75503b']), '#78523b', 2);
  if (sealed) seal(ctx, x + w * .52, y + h * .61, w * .055, 0);
}

function printLines(ctx, x, y, width, rows, seed) {
  for (let r = 0; r < rows; r++) {
    let cursor = x;
    const end = x + width * (r === rows - 1 ? .7 : .99);
    for (let j = 0; cursor < end; j++) {
      const length = Math.min(end - cursor, 11 + hash(seed + r * 139 + j * 31) * 35);
      line(ctx, [[cursor, y + r * 16], [cursor + length, y + r * 16]], '#624333a6', 2.8);
      cursor += length + 6;
    }
  }
}

function published(ctx, f) {
  if (!f.k) {
    shot(ctx, f, 1012, 538, .96, 125, 62, .13, -.09);
    wood(ctx, -300, 97, 2600, 1220, 176);
    envelope(ctx, 582, 391, 861, 348);
    const x = 667 + 227 * ease(f.v);
    const y = 291 - 111 * ease(f.v);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-.07);
    paper(ctx, 0, 0, 632, 512, 483);
    label(ctx, 'Cambridge', 465, 77, 27, ink);
    scriptLines(ctx, 57, 136, 519, 14, 147, 22);
    line(ctx, [[13, 298], [617, 298]], '#7351374f', 1.7);
    hand(ctx, 602, 143, 1.25, -.5, '#6a4c3c');
    ctx.restore();
    light(ctx, x + 304, y + 180, 370, '255,215,147', .23);
  } else {
    shot(ctx, f, 855, 501, .97, 252, 21, .1, .018);
    wood(ctx, -310, 68, 2650, 1300, 183);
    paper(ctx, 355, 159, 1210, 637, 159);
    ellipse(ctx, 949, 477, 20, 308, '#55362653');
    paper(ctx, 369, 137, 566, 627, 351);
    paper(ctx, 957, 128, 578, 633, 258);
    label(ctx, 'PHILOSOPHICAL', 947, 245, 61, '#603b29', 'center');
    label(ctx, 'TRANSACTIONS.', 947, 315, 70, '#57372a', 'center');
    line(ctx, [[503, 348], [1404, 348]], '#775135', 2.5);
    label(ctx, 'NUMB. 80.    •    1672', 948, 392, 25, ink, 'center');
    for (const x of [430, 1011]) printLines(ctx, x, 455, 456, 15, 11 + x);
    const y = 302 + 116 * ease(f.v);
    paper(ctx, 993, y, 475, 244, 362);
    label(ctx, 'Of Light and Colours', 1030, y + 60, 34, ink);
    printLines(ctx, 1031, y + 96, 385, 7, 584);
    shape(ctx, [1352, y - 27], [[1411, y - 62, 1450, y - 4, 1409, y + 25], [1386, y + 47, 1351, y + 33, 1368, y + 2]], null, '#5f402c', 9);
    shape(ctx, [1352, y - 28], [[1411, y - 63, 1450, y - 5, 1409, y + 24], [1386, y + 46, 1351, y + 32, 1368, y + 1]], null, '#b6935d', 3.8);
  }
}

function seal(ctx, x, y, r, split) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(r / 43, r / 43);
  const wax = wash(ctx, -28, -41, 28, 43, ['#b66b4b', '#8e382e', '#50282b']);
  if (split > 0) {
    shape(ctx, [-split, -39], [[-42, -47, -56, -5, -32, 21], [-27, 33, -15 - split, 44, 3 - split, 37], [-11 - split, 13], [4 - split, 2], [-9 - split, -8], [-split, -39]], wax, '#552c28', 2);
    shape(ctx, [split + 3, -40], [[31 + split, -45, 58 + split, -8, 38 + split, 18], [29 + split, 44, 15 + split, 49, 7 + split, 39], [-2 + split, 15], [15 + split, 2], [1 + split, -12], [split + 3, -40]], wax, '#552c28', 2);
  } else {
    shape(ctx, [-34, -27], [[-18, -50, 19, -46, 33, -30], [59, -12, 45, 23, 23, 29], [14, 52, -33, 42, -40, 20], [-55, 0, -48, -17, -34, -27]], wax, '#5e312b', 2);
    ellipse(ctx, 1, -2, 30, 28, null, '#c07755', 2.6);
    ellipse(ctx, 1, -2, 24, 22, null, '#632c2b', 1.8);
    path(ctx, [[-13, -9], [-3, -16], [12, -13], [15, 0], [7, 12], [-3, 17], [-13, 6]], '#6b302a', '#c77753', 1.4);
  }
  ctx.restore();
}

function hookePaper(ctx, x, y, w, h, focus) {
  paper(ctx, x, y, w, h, 1679);
  label(ctx, 'London, 24 November 1679', x + .09 * w, y + .15 * h, .035 * w, ink);
  scriptLines(ctx, x + .09 * w, y + .25 * h, .81 * w, 5, 319, .046 * h);
  if (focus) {
    label(ctx, '沿切线向前运动，同时受向心吸引', x + .5 * w, y + .59 * h, .042 * w, '#4e3028', 'center');
    line(ctx, [[x + .18 * w, y + .636 * h], [x + .82 * w, y + .636 * h]], '#8e654d91', 1.5);
  } else scriptLines(ctx, x + .09 * w, y + .52 * h, .81 * w, 4, 726, .046 * h);
  ctx.save();
  ctx.translate(x + .57 * w, y + .82 * h);
  ctx.rotate(-.065);
  ctx.font = `italic ${w * .09}px Georgia, serif`;
  ctx.fillStyle = '#462721';
  ctx.fillText('Robert Hooke', 0, 0);
  shape(ctx, [11, 13], [[w * .12, -10, w * .30, 9, w * .36, -8], [w * .3, 25, w * .17, 12, w * .12, 19]], null, '#643929', 2);
  ctx.restore();
}

function correspondence(ctx, f) {
  if (!f.k) {
    shot(ctx, f, 948, 637, 1.1, 35, 34, .19);
    wood(ctx, -300, -270, 2520, 823, 458);
    path(ctx, [[-320, 505], [2210, 540], [2190, 580], [-270, 548]], '#312126', rim, 2.5);
    path(ctx, [[-320, 548], [2190, 580], [2193, 612], [-270, 589]], '#110e14');
    beam(ctx, [[689, 548], [1170, 554], [1566, 851], [447, 852]], '247,165,85', .35);
    const y = 460 + 191 * ease(f.v);
    ctx.save();
    path(ctx, [[-270, 548], [2190, 580], [2190, 1230], [-270, 1230]]);
    ctx.clip();
    ctx.translate(697 + 38 * f.v, y);
    ctx.rotate(.045);
    envelope(ctx, 0, 0, 737, 166, true);
    ctx.restore();
  } else if (f.k === 1) {
    shot(ctx, f, 1025, 540, 1.19, 37, 6, .24, .035);
    wood(ctx, -260, 62, 2460, 1230, 473);
    envelope(ctx, 520, 259, 904, 441);
    const cut = ease((f.v - .24) / .39);
    const x = 1123 - cut * 156, y = 558 - cut * 27;
    seal(ctx, 990, 528, 52, cut > .56 ? cut * 15 : 0);
    path(ctx, [[x, y], [x + 142, y - 91], [x + 180, y - 91], [x + 139, y - 43]], wash(ctx, x + 20, y, x + 124, y - 80, ['#d1baa3', '#827c77', '#d8c9aa']), '#4d3430', 2);
    line(ctx, [[x + 151, y - 64], [x + 264, y - 135]], '#634335', 19);
    line(ctx, [[x + 155, y - 69], [x + 262, y - 136]], '#a77d57', 4);
    hand(ctx, x + 220, y - 107, 1.28, -.43);
    light(ctx, 986, 525, 194, '255,179,104', .14);
  } else {
    const views = [null, null, [1200, 688, 1.82, 78, -19, .12, .06], [983, 521, 1.02, 31, 13, .08, -.035], [1240, 529, 1.02, 169, 13, .1, .025], [1445, 722, 1.24, 388, 61, .22, .095]];
    shot(ctx, f, ...views[f.k]);
    if (f.k !== 5) wood(ctx, -250, 208, 2440, 1040, 513);
    hookePaper(ctx, 439, 215, 1022, 568, f.k === 3 || f.k === 4);
    if (f.k === 4) {
      const p = ease(f.v);
      shape(ctx, [881, 618], [[1170, 697, 1360, 612, lerp(1360, 1820, p), 503 - 52 * p]], null, '#d2a171', 3.5);
      const x = lerp(1360, 1820, p), y = 503 - 52 * p;
      arrow(ctx, x - 65, y + 25, x, y, '#e3b278', 3.4);
      if (x > 1510) arrow(ctx, x - 40, y + 18, x - 139, y + 119, '#a85c45', 3);
    }
    if (f.k === 5) {
      const shade = ease((f.v - .18) / .78);
      ctx.fillStyle = `rgba(13,10,16,${shade})`;
      ctx.fillRect(940, 120, 1610, 1080);
    }
  }
}

function tricorn(ctx, x, y, scale, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  const felt = wash(ctx, -83, -50, 87, 33, ['#715445', '#342c2c', '#1c1a22']);
  shape(ctx, [-148, 26], [[-84, 17, -77, -22, -62, -40], [-39, -68, 7, -87, 38, -54], [52, -41, 61, -20, 73, -6], [99, 13, 126, 12, 148, 26], [138, 51, 85, 59, 36, 57], [-34, 56, -116, 53, -148, 26]], felt, '#b68a5f', 3.3);
  shape(ctx, [-145, 26], [[-75, 38, -61, 42, -15, 23], [29, 10, 103, -11, 145, 26], [121, 47, 61, 56, 11, 58], [-59, 58, -113, 46, -145, 26]], '#2e262c', '#b18b60', 2.2);
  shape(ctx, [-124, 31], [[-12, 52, 62, 6, 110, 19]], null, '#d6b47d70', 1.6);
  ellipse(ctx, 83, 24, 8, 8, '#8b6947', '#b79163');
  ctx.restore();
}

function stones(ctx, horizon, seed) {
  const vanishing = 1190;
  path(ctx, [[-380, 1290], [1050, horizon], [1310, horizon], [2600, 1290]], wash(ctx, 1040, horizon, 1040, 1190, ['#5d5952', '#38363b', '#252329', '#15151c']), '#6b5247', 2);
  for (let row = 0; row < 13; row++) {
    const depth = (row / 12) ** 2;
    const y = lerp(horizon, 1280, depth);
    const step = lerp(23, 450, depth);
    for (let col = -5; col <= 4; col++) {
      const x = vanishing + (col + (row % 2) * .45) * step;
      const px = x + step * (.6 + hash(seed + col + row * 19) * .33);
      line(ctx, [[x, y + 2], [px, y - 4]], '#ad987e62', 1.6 + depth * 2);
      line(ctx, [[x, y], [x - (x - vanishing) * .12, lerp(y, horizon, .26)]], '#211a22a1', 2.6);
    }
  }
}

function hall(ctx) {
  stones(ctx, 461, 561);
  beam(ctx, [[1080, 356], [1321, 358], [1954, 943], [564, 962]], '180,212,222', .23);
  for (let i = 4; i >= 0; i--) {
    const depth = (i + 1) / 5;
    const x = 1190 - 1088 * depth;
    const y = 149 - i * 57;
    const width = 1810 * depth;
    const floor = 521 + i * 53;
    const arch = wash(ctx, x, y, x + 170, floor, ['#79614f', '#403740', '#30262d']);
    shape(ctx, [x, floor], [[x, y + 215], [x + width * .22, y - 136, x + width * .75, y - 136, x + width, y + 215], [x + width, floor], [x + width - 39 * depth, floor], [x + width - 39 * depth, y + 225], [x + width * .73, y - 91, x + width * .24, y - 91, x + 39 * depth, y + 226], [x + 39 * depth, floor]], arch, '#a17a596b', 2);
    for (const px of [x, x + width - 39 * depth]) {
      for (let j = 0; j < 5; j++) line(ctx, [[px, floor - 29 - j * 57 * depth], [px + 37 * depth, floor - 27 - j * 57 * depth]], '#2d2327', 2.2);
    }
  }
  path(ctx, [[1105, 480], [1105, 320], [1140, 268], [1222, 268], [1251, 317], [1251, 475]], wash(ctx, 1113, 269, 1244, 476, ['#766653', '#9ca5a1', '#464f56']), '#a98969', 3);
  line(ctx, [[1176, 279], [1176, 478]], '#39333a', 3);
}

function shoe(ctx, x, y, size, stride, front) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.rotate(stride * .22);
  const leather = wash(ctx, -100, -69, 105, 40, ['#5a4840', '#372e30', '#15151c']);
  shape(ctx, [-16, -173], [[2, -112, -7, -66, -29, -31], [36, -17], [75, -57, 69, -107, 90, -172]], front ? '#4c3f3a' : '#333339', '#946d54', 2);
  shape(ctx, [-35, -41], [[-2, -59, 43, -59, 60, -38], [73, -25, 75, -16, 88, -10], [117, 0, 113, 22, 84, 26], [27, 29, -2, 24, -52, 20], [-92, 20, -118, 8, -107, -5], [-90, -26, -63, -15, -35, -41]], leather, '#977355', 2.7);
  shape(ctx, [-102, 9], [[-77, 19, -41, 15, 5, 20], [47, 25, 85, 24, 105, 19]], null, '#1b181e', 5);
  path(ctx, [[-4, -43], [25, -43], [35, -23], [5, -22]], '#7d634b', '#cfab72', 2.6);
  line(ctx, [[6, -41], [22, -25]], '#d4ad75', 2.2);
  ctx.restore();
}

function studyWindow(ctx, x, y, width, height) {
  shape(ctx, [x, y + height], [[x, y + height * .28], [x + width * .06, y - height * .09, x + width * .94, y - height * .09, x + width, y + height * .28], [x + width, y + height]], wash(ctx, x, y, x + width, y + height, ['#c9bda2', '#877f76', '#515a60']), '#7d604b', 7);
  for (let i = 1; i < 4; i++) line(ctx, [[x + width * i / 4, y + (i === 2 ? 4 : 27)], [x + width * i / 4, y + height]], '#564647', 7);
  for (let i = 1; i < 5; i++) line(ctx, [[x, y + height * i / 5], [x + width, y + height * i / 5]], '#604b43', 5.8);
  line(ctx, [[x - 20, y + height], [x + width + 27, y + height]], '#a68a67', 9);
}

function arrival(ctx, f) {
  if (!f.k) {
    shot(ctx, f, 1007, 514, .95, 119, -13, .12, -.025);
    hall(ctx);
    const advance = ease(f.v);
    const x = 1195 - advance * 160, y = 482 + advance * 155;
    figure(ctx, x, y, 186 + advance * 206, { facing: -1, tone: halley.coat, time: f.a, walk: true });
    tricorn(ctx, x, y - (186 + advance * 206) * .953, .28 + advance * .32, .07);
    wood(ctx, 144, 706, 310, 55, 458);
    if (f.v < .57) candle(ctx, 291, 706, 127, f.t);
    else {
      ellipse(ctx, 291, 706, 39, 6, '#413031', rim, 1.5);
      path(ctx, [[280, 702], [281, 604], [299, 604], [303, 703]], '#978063', '#634737', 1.1);
      line(ctx, [[289, 604], [291, 593]], '#211a23', 3);
      shape(ctx, [290, 591], [[287, 576, 319, 575, 318 + f.v * 38, 555], [349 + f.v * 29, 524, 359, 506, 371 + f.v * 20, 484]], null, `rgba(184,179,158,${.30 * (1 - f.v)})`, 7);
    }
  } else if (f.k === 1) {
    shot(ctx, f, 935, 557, 1.15, 188, -14, .13, -.06);
    stones(ctx, 273, 578);
    const walk = f.v * tau * 2.75;
    const x = 875 + 350 * f.v;
    const sway = Math.sin(walk);
    ellipse(ctx, x + 37, 708, 367, 54, '#69858b52', '#ae9d8261', 2);
    for (let i = 0; i < 6; i++) ellipse(ctx, x + 68, 694, 66 + i * 32, 7 + i * 6, null, '#beba9a3d', 1.4);
    shoe(ctx, x - 84 + sway * 144, 672 - Math.max(0, sway) * 56, 1.37, sway, false);
    shoe(ctx, x + 39 - sway * 161, 698 - Math.max(0, -sway) * 63, 1.65, -sway, true);
    shape(ctx, [x - 354, 78], [[x - 286, 232, x - 233 - sway * 60, 416, x - 311 + sway * 69, 489], [x - 140, 532, x - 55, 445, x + 18, 518], [x + 93, 563, x + 213, 461, x + 260, 445], [x + 191, 355, x + 186, 182, x + 287, 43]], wash(ctx, x - 203, 160, x + 273, 498, ['#1b3435', '#465745', '#213132']), '#9b7954', 3);
    for (let i = 0; i < 8; i++) shape(ctx, [x - 219 + i * 49, 172], [[x - 194 + i * 45, 287, x - 177 + i * 44, 426, x - 230 + i * 58 + sway * 27, 481]], null, '#9c956349', 2.2);
  } else {
    shot(ctx, f, 989, 536, 1.04, 55, -20, .10, .026);
    studyWindow(ctx, 1358, 56, 332, 571);
    beam(ctx, [[1392, 285], [1584, 297], [1140, 795], [831, 780]], '255,213,157', .32);
    portrait(ctx, 1381, 459, 1.2, -1, newton, .85, { older: true });
    wood(ctx, 1034, 731, 950, 288, 602);
    paper(ctx, 1186, 684, 433, 92, 609);
    const stop = ease(f.v * 3.4);
    pen(ctx, 1286 - 28 * stop, 712 - 43 * stop, -.42, .9);
    hand(ctx, 1330 - 28 * stop, 693 - 43 * stop, .82, -.32);
    portrait(ctx, 685, 422, 1.67, 1, halley, .75, { lean: .06 * f.v });
    const remove = ease(f.v * 1.42);
    const hx = 652 + remove * 276, hy = 232 - 119 * Math.sin(remove * Math.PI) + 365 * remove;
    hand(ctx, hx + 100, hy + 15, .95, .73, halley.coat);
    tricorn(ctx, hx, hy, 1.32, -.54 * remove);
    light(ctx, 1392, 416, 335, '255,213,160', .17);
  }
}

function brassWeight(ctx, x, y) {
  ellipse(ctx, x + 12, y + 17, 69, 26, '#39212281');
  path(ctx, [[x - 61, y - 8], [x + 49, y - 14], [x + 66, y + 14], [x - 48, y + 24]], '#755039', ink, 2.8);
  ellipse(ctx, x, y - 11, 58, 26, wash(ctx, x - 50, y - 26, x + 51, y + 8, ['#efce87', '#a57b4c', '#674833']), '#61402d', 2.3);
  ellipse(ctx, x, y - 13, 46, 18, null, '#e6bc78b3', 1.8);
  ellipse(ctx, x, y - 15, 17, 10, '#7c583a', '#d4a966', 2);
}

function queryPaper(ctx, x, y, motion) {
  paper(ctx, x, y, 820, 448, 1684);
  const cx = x + 359, cy = y + 239;
  ellipse(ctx, cx, cy, 88, 74, null, '#6e4f3b6e', 2);
  ellipse(ctx, cx, cy, 176, 148, null, '#6e4f3b6e', 2);
  for (let i = 0; i < 48; i++) {
    const angle = tau * i / 48;
    const ax = Math.cos(angle), ay = Math.sin(angle);
    for (const r of [88, 176]) line(ctx, [[cx + (r - 4) * ax, cy + (r - 4) * ay * .84], [cx + (r + 4) * ax, cy + (r + 4) * ay * .84]], '#7954398c', 1.15);
  }
  ellipse(ctx, cx, cy, 7, 7, '#693e30', '#d59e65', 2);
  ctx.save();
  ctx.globalAlpha = .25 + .75 * ease(motion);
  arrow(ctx, cx, cy, cx + 88, cy, '#643e2e', 2.6);
  arrow(ctx, cx, cy, cx - 176, cy, '#643e2e', 2.6);
  ellipse(ctx, cx + 88, cy, 5, 5, '#653b2d');
  ellipse(ctx, cx - 176, cy, 5, 5, '#653b2d');
  label(ctx, 'r', cx + 49, cy - 14, 29, ink, 'center');
  label(ctx, '2r', cx - 123, cy - 14, 29, ink, 'center');
  label(ctx, 'F', cx + 119, cy + 21, 26, ink);
  label(ctx, '¼ F', cx - 208, cy + 37, 26, ink, 'center');
  ctx.restore();
}

function question(ctx, f) {
  if (!f.k) {
    shot(ctx, f, 1064, 600, 1.03, -54, 19, .13, -.10);
    wood(ctx, -250, 116, 2375, 1150, 677);
    const travel = 268 * ease(f.v * 1.24);
    const x = 792 - travel, y = 424 - travel * .32;
    queryPaper(ctx, x, y, 0);
    brassWeight(ctx, 505, 581);
    hand(ctx, x + 773, y + 237, 1.57, .19, halley.coat, 'point');
    light(ctx, 745, 464, 466, '254,202,133', .23);
  } else if (f.k === 1) {
    shot(ctx, f, 1024, 535, 1.04, -115, -31, .18, .043);
    wood(ctx, -270, 84, 2480, 1230, 678);
    queryPaper(ctx, 495, 286, f.v * 1.7);
    brassWeight(ctx, 505, 581);
    const p = ease(f.v);
    hand(ctx, 1150 - p * 148, 521 - p * 8, 1.19, -.14, halley.coat, 'point');
    shape(ctx, [1580, 661], [[1398, 780, 1291, 958, 1176, 1180], [2210, 1190], [2134, 697], [1932, 567, 1696, 593, 1580, 661]], wash(ctx, 1430, 650, 1940, 1070, ['#615248', '#2a433e', '#182229']), '#977556', 4);
    shape(ctx, [1603, 689], [[1469, 777, 1386, 860, 1297, 1058]], null, '#a28b6266', 3);
    light(ctx, 889, 492, 357, '255,194,124', .15);
  } else {
    shot(ctx, f, 958, 471, 1.15, -43, -27, .19, .017);
    studyWindow(ctx, 270, 78, 351, 547);
    beam(ctx, [[390, 279], [574, 269], [1428, 657], [1041, 777]], '246,195,126', .33);
    const lift = ease((f.v - .13) / .68);
    const blink = Math.max(0, 1 - Math.abs(f.v - .22) * 23);
    portrait(ctx, 1062, 435 - 32 * lift, 2.13, -1, newton, lerp(-.65, .79, lift), { older: true, lean: lerp(.21, -.10, lift), blink });
    shape(ctx, [-260, 1083], [[-67, 870, 160, 669, 349, 690], [470, 716, 532, 878, 604, 1110]], '#283936', '#735842', 3);
    light(ctx, 1047, 354, 374, '255,191,122', .17);
  }
}

function pin(ctx, x, y, drop) {
  const top = y - 32 - drop;
  ellipse(ctx, x + 4, y + 4, 15 + drop * .08, 6, '#48352863');
  line(ctx, [[x, y - drop], [x, top]], '#644336', 7);
  line(ctx, [[x - 1.5, y - drop], [x - 1.5, top]], '#e5c695', 2.2);
  ellipse(ctx, x, top, 13, 9, wash(ctx, x - 8, top - 9, x + 8, top + 9, ['#e8cd8c', '#aa7c48', '#715039']), '#624130', 1.9);
}

function drawingBoard(ctx, x, y, focus) {
  path(ctx, [[x - 25, y - 18], [x + 1085, y - 23], [x + 1098, y + 619], [x - 31, y + 636]], '#513831', '#967354', 4);
  const board = [[x, y + 2], [x + 1061, y - 1], [x + 1071, y + 600], [x + 3, y + 613]];
  path(ctx, board, wash(ctx, x + 280, y - 89, x + 912, y + 659, ['#f0dec0', '#d8c0a2', '#aa876d']), '#c39e78', 3);
  for (let i = 0; i < 75; i++) {
    const px = x + 16 + hash(i * 13 + 613) * 1012;
    const py = y + 9 + hash(i * 13 + 614) * 591;
    line(ctx, [[px, py], [px + 3 + hash(i * 13 + 615) * 18, py - 1]], '#916d4d28', 1);
  }
  if (focus) {
    ctx.setLineDash([4, 10]);
    line(ctx, [[x + 138, y + 359], [x + 918, y + 359]], '#79543e67', 1.4);
    ctx.setLineDash([]);
  }
}

function answer(ctx, f) {
  const c = 174, a = 362, b = Math.sqrt(a * a - c * c);
  const x = f.k === 2 ? 1334 : 958;
  const y = f.k === 2 ? 569 : 546;
  const views = [[973, 597, 1.21, -55, 28, .12, .035], [979, 582, 1.07, 28, -12, .15, -.047], [978, 598, 1.1, 57, 10, .08, .027]];
  shot(ctx, f, ...views[f.k]);
  if (f.k === 2) {
    studyWindow(ctx, 116, 63, 338, 485);
    portrait(ctx, 645 + 43 * ease(f.v), 352 + 31 * ease(f.v), 1.83, 1, halley, .87, { lean: .08 + .19 * ease(f.v) });
    wood(ctx, 223, 630, 2010, 631, 822);
  }
  drawingBoard(ctx, x - 530, y - 359, f.k !== 2);
  if (!f.k) {
    const leftDrop = 125 * (1 - ease(f.v / .6));
    const rightDrop = 157 * (1 - ease((f.v - .22) / .65));
    shape(ctx, [x - c, y - leftDrop], [[x - 117, y + 78, x + 110, y + 91, x + c, y - rightDrop]], null, '#916445', 2.5);
    pin(ctx, x - c, y, leftDrop);
    pin(ctx, x + c, y, rightDrop);
    if (f.v < .9) hand(ctx, x + c + 4, y - rightDrop - 35, 1.18, -1.2);
    light(ctx, x + 77, y - 67, 362, '255,194,126', .16);
  } else {
    const start = Math.PI * 1.08;
    const sweep = f.k === 1 ? lerp(.09, 1.77, ease(f.v)) : 1.77;
    const theta = start + sweep;
    const px = x + a * Math.cos(theta), py = y + b * Math.sin(theta);
    ctx.beginPath();
    ctx.ellipse(x, y, a, b, 0, start, theta);
    ctx.strokeStyle = '#514038';
    ctx.lineWidth = 5;
    ctx.stroke();
    line(ctx, [[x - c, y - 6], [px, py], [x + c, y - 6]], '#936746', 2.8);
    pin(ctx, x - c, y, 0);
    if (f.k === 1) {
      pin(ctx, x + c, y, 0);
      const angle = -.66 - .12 * f.v;
      pen(ctx, px, py, angle, 1.85, true);
      hand(ctx, px + 87 * Math.cos(angle), py + 87 * Math.sin(angle), 1.28, -.22);
    } else {
      // The other half of the diagram sits beyond the foreground frame edge.
      const shade = wash(ctx, x - 80, y, x + 51, y, ['#301f2200', '#281c22f4']);
      path(ctx, [[x - 78, y - 414], [2310, y - 421], [2310, 1260], [x + 230, 1260]], shade);
      light(ctx, 797, 437, 389, '251,188,111', .19);
    }
  }
}

const scenes = [optics, changes, orchard, impact, moonlight, swinging, published, correspondence, arrival, question, answer];

export function drawActTwo(ctx, f) {
  const draw = scenes[f.id - 12];
  if (!draw) return;
  ctx.save();
  try {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    draw(ctx, f);
  } finally {
    ctx.restore();
  }
}
