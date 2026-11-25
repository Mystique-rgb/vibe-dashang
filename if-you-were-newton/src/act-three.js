import { clamp, lerp, ease, hash, path, line, ellipse, radial, light, paper, label, candle, beam } from './visual.js';

const TAU = 2 * Math.PI;
const umber = '#341f1b';
const copper = '#cf8e54';
const gold = '#ffcf8c';

function gradient(ctx, x1, y1, x2, y2, ...colors) {
  const paint = ctx.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, i) => paint.addColorStop(i / (colors.length - 1), color));
  return paint;
}

function drawing(ctx, commands, fill, stroke, width = 1) {
  ctx.beginPath();
  for (const [op, ...coords] of commands) {
    if (op === 'M') ctx.moveTo(...coords);
    else if (op === 'L') ctx.lineTo(...coords);
    else if (op === 'Q') ctx.quadraticCurveTo(...coords);
    else if (op === 'C') ctx.bezierCurveTo(...coords);
    else ctx.closePath();
  }
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function arc(ctx, x, y, rx, ry, start, end, color, width, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function insetCamera(ctx, x, y, zoom = 1, angle = 0) {
  ctx.translate(960, 418);
  ctx.rotate(angle);
  ctx.scale(zoom, zoom);
  ctx.translate(-x, -y);
}

function dot(ctx, x, y, r, brightness = 1) {
  if (brightness <= 0) return;
  ctx.save();
  ctx.globalAlpha *= brightness;
  light(ctx, x, y, r * 5, '255,177,104', .25);
  ellipse(ctx, x, y, r, r, '#e4a365', '#a7734b', 1);
  ellipse(ctx, x - r * .2, y - r * .26, r * .56, r * .48, '#ffe3ad');
  ctx.restore();
}

function arrow(ctx, x, y, ex, ey, color, width = 3, tip = 19) {
  const a = Math.atan2(ey - y, ex - x);
  line(ctx, [[x, y], [ex, ey]], color, width);
  path(ctx, [[ex, ey], [ex - tip * Math.cos(a - .42), ey - tip * Math.sin(a - .42)],
    [ex - tip * .74 * Math.cos(a), ey - tip * .74 * Math.sin(a)],
    [ex - tip * Math.cos(a + .42), ey - tip * Math.sin(a + .42)]], color);
}

function wood(ctx, x, y, w, h, seed = 7, vertical = false) {
  ctx.save();
  ctx.translate(x, y);
  if (vertical) { ctx.translate(w, 0); ctx.rotate(Math.PI / 2); }
  const length = vertical ? h : w;
  const breadth = vertical ? w : h;
  ctx.beginPath(); ctx.rect(0, 0, length, breadth); ctx.clip();
  ctx.fillStyle = vertical ? gradient(ctx, 0, 0, 0, breadth, '#261717', '#805034', '#5b3727', '#241619')
    : gradient(ctx, 0, 0, 0, breadth, '#271919', '#70462f', '#4b2d24', '#211719');
  ctx.fillRect(0, 0, length, breadth);
  for (let i = 0; i < Math.min(42, breadth / 2); i++) {
    const key = seed + i * 9;
    const yy = hash(key) * breadth;
    const sx = (hash(key + 1) - .2) * length * .65;
    const ex = (hash(key + 2) * .45 + .62) * length;
    const bend = (hash(key + 3) - .5) * 18;
    drawing(ctx, [['M', sx, yy], ['C', sx + length * .2, yy + bend, ex - length * .2, yy - bend, ex, yy + bend * .48]],
      null, i % 4 === 0 ? '#d79f6050' : '#1c11154d', i % 4 === 0 ? 1.2 : 2);
  }
  line(ctx, [[0, 2], [length, 2]], '#e7a66964', 3);
  line(ctx, [[0, breadth - 3], [length, breadth - 3]], '#150d12a8', 3);
  ctx.restore();
}

function writing(ctx, x, y, width, rows, gap, seed, color = '#4a2b23b5') {
  for (let i = 0; i < rows; i++) {
    let px = x + hash(seed + i) * 19;
    const py = y + i * gap;
    const limit = x + width * (.69 + .31 * hash(seed + i * 5));
    for (let j = 0; px < limit; j++) {
      const key = seed + i * 173 + j * 7;
      const size = 8 + hash(key) * 22;
      drawing(ctx, [['M', px, py], ['C', px + size * .2, py + 4, px + size * .39, py - gap * hash(key + 1) * .75, px + size * .34, py - 2],
        ['Q', px + size * .22, py + 5, px + size * .57, py - 2], ['Q', px + size * .78, py - 9, px + size, py + 1]], null, color, 1.45);
      px += size + 3 + 11 * hash(key + 2);
    }
  }
}

function hand(ctx, x, y, scale = 1, angle = 0, flip = 1, shadow = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale * flip, scale);
  const sleeve = shadow ? '#302420' : gradient(ctx, -375, -39, -135, 102, '#140f15', '#594039', '#37272a', '#170f17');
  drawing(ctx, [['M', -410, -67], ['L', -157, -51], ['Q', -136, -12, -153, 66], ['L', -406, 103], ['Z']], sleeve, shadow ? null : '#9c6a48', 2);
  if (!shadow) {
    for (let i = 0; i < 10; i++) {
      drawing(ctx, [['M', -397, -52 + 15 * i], ['Q', -275, -26 + 9 * i, -160, -40 + 10 * i]], null, i % 2 ? '#be81504d' : '#21131cd0', 2);
    }
    path(ctx, [[-174,-46],[-127,-36],[-120,49],[-158,66],[-172,46]], gradient(ctx, -148, -42, -148, 66, '#dcc19a', '#977b62', '#4c3832'), '#3c2926', 2);
    for (let i = 0; i < 8; i++) line(ctx, [[-164+i*5,-35],[-157+i*5,48]], '#f2d1a557', 1);
  }
  const skin = shadow ? '#302420' : gradient(ctx, -75, -63, -35, 72, '#edbc91', '#bf8c65', '#925a44', '#51332c');
  drawing(ctx, [['M', -132, -32], ['C', -98, -37, -81, -63, -39, -55], ['Q', -7, -50, 8, -39],
    ['L', 76, -21], ['Q', 92, -19, 91, -8], ['Q', 86, 2, 67, -1], ['L', 24, -6], ['L', 65, 9],
    ['Q', 77, 15, 72, 24], ['Q', 67, 31, 52, 26], ['L', 11, 16], ['L', 51, 35], ['Q', 60, 43, 49, 49],
    ['Q', 43, 52, 28, 46], ['L', -9, 35], ['Q', 27, 63, 12, 67], ['Q', 5, 74, -20, 58],
    ['L', -60, 45], ['Q', -94, 49, -125, 57], ['Z']], skin, shadow ? null : '#603b31', 2.3);
  if (!shadow) {
    drawing(ctx, [['M', -113, 14], ['C', -89, 1, -60, -1, -33, 2], ['Q', -18, 5, -7, 19], ['L', 8, 29],
      ['Q', 18, 44, 1, 50], ['Q', -9, 55, -26, 37], ['Q', -53, 34, -63, 26]], skin, '#6f4739', 1.9);
    drawing(ctx, [['M', -99, -25], ['Q', -68, -42, -42, -41], ['Q', -28, -36, -9, -35]], null, '#ffdbab99', 2);
    for (let i = 0; i < 4; i++) {
      const nx = [77, 61, 45, 9][i];
      const ny = [-9, 19, 42, 61][i];
      arc(ctx, nx, ny, 8, 4, -.95, 1.45, '#f2be955e', 1.4, .24);
    }
  }
  ctx.restore();
}

function quill(ctx, x, y, scale, angle) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  drawing(ctx, [['M', 0, 0], ['Q', 43, -14, 100, -20], ['C', 155, -75, 209, -55, 246, -64],
    ['C', 225, -15, 171, 12, 101, -10], ['Q', 50, -10, 0, 0], ['Z']],
  gradient(ctx, 110, -54, 130, 12, '#eccba0', '#ab815a', '#594132'), umber, 1.6);
  drawing(ctx, [['M', 0, 0], ['Q', 130, -16, 244, -63]], null, '#e6b67c', 2);
  path(ctx, [[0,0],[14,-4],[21,-3],[10,0]], '#1b1619');
  for (let i = 0; i < 20; i++) {
    const px = 111 + i * 6.6;
    line(ctx, [[px, -20 - i * 1.9], [px + 12, -27 - 23 * Math.sin(i / 21 * Math.PI / 2)]], '#5036268b', 1.1);
    line(ctx, [[px, -20 - i * 1.9], [px + 10, -6 - i * .81 - i * i * .066]], '#dcc09581', 1);
  }
  ctx.restore();
}

function manuscript(ctx, x, y, w, h, layers, seed) {
  for (let i = layers - 1; i >= 0; i--) {
    const dx = i * 2.6 + (i ? 13 * hash(seed + i) : 0);
    paper(ctx, x + dx, y + i * 4.3, w, h, seed + i * 29);
  }
  line(ctx, [[x + 49, y + 34], [x + 52, y + h - 27]], '#8d4f3f85', 1.5);
  writing(ctx, x + 72, y + 90, w * .53, 7, h / 10, seed);
  const gx = x + w * .78, gy = y + h * .54;
  arc(ctx, gx, gy, w * .13, h * .26, -2.56, 1.98, '#634031', 1.7, -.35);
  line(ctx, [[gx - w * .085, gy + h * .20], [gx, gy], [gx + w * .08, gy - h * .17], [gx - w * .085, gy + h * .20]], '#633e32a3', 1.8);
  ellipse(ctx, gx, gy, 3, 3, '#653628');
}

function pressWeight(ctx, x, y, w, h) {
  path(ctx, [[x,y],[x+w*.89,y-14],[x+w,y+8],[x+w*.12,y+28]],
    gradient(ctx, x, y-10, x+w, y+26, '#775b4d', '#a58264', '#4b3937'), umber, 2);
  path(ctx, [[x+w*.12,y+28],[x+w,y+8],[x+w,y+h],[x+w*.12,y+h+20]],
    gradient(ctx, x, y+6, x, y+h+20, '#725440', '#322124'), umber, 2);
  path(ctx, [[x,y],[x+w*.12,y+28],[x+w*.12,y+h+20],[x,y+h-4]], '#382629', umber, 2);
  for (let i = 0; i < 28; i++) {
    const px = x + w * (.14 + .81 * hash(i + 474));
    const py = y + 25 - (px - x) * 18 / w + (h - 26) * hash(i + 506);
    line(ctx, [[px,py],[px+2+8*hash(i+534),py-1]], '#d39e6465', 1.4);
  }
}

function tiedCord(ctx, x, y, closing) {
  const slack = (1 - closing) * 102;
  const knots = [['M',x-17,y+195],['C',x-34,y+92,x-22-slack,y-103,x-12,y-180],
    ['M',x+5,y+193],['C',x-8,y+65,x+8+slack,y-123,x+3,y-180],
    ['M',x-11,y-42],['C',x-70-slack,y-96,x-145-slack,y-28,x-23,y-26],
    ['C',x+87+slack,y-89,x+102+slack,y-13,x-23,y-26],['Q',x-21,y+12,x-89-slack,y+51],
    ['M',x-13,y-31],['Q',x+32,y+6,x+84+slack,y+42]];
  drawing(ctx, knots, null, '#351b24', 12);
  ctx.save(); ctx.translate(-1, -1);
  drawing(ctx, knots, null, '#95453d', 7);
  ctx.translate(-1, -1);
  drawing(ctx, knots, null, '#dc7d60a6', 2);
  ctx.restore();
}

function manuscripts(ctx, f) {
  const p = ease(f.v);
  if (f.k === 0) {
    insetCamera(ctx, 960 - 50 * p, 431, 1 + .09 * p, -.035);
    wood(ctx, 248, 353, 1420, 383);
    wood(ctx, 193, 720, 1521, 79, 280);
    candle(ctx, 1152, 406, 225, f.t);
    beam(ctx, [[1149,150],[1160,199],[1490,656],[470,680]], '255,168,80', .22);
    ctx.save(); ctx.translate(0, -34 * p);
    paper(ctx, 593 - 75 * (1 - p), 410, 548, 223, 38);
    manuscript(ctx, 626, 400, 577, 229, 7, 803);
    ctx.restore();
    pressWeight(ctx, 1240, 438, 222, 76);
    hand(ctx, 724 + 121 * p, 527 - 50 * p, 1.1, -.18);
    hand(ctx, 1174 - 51 * p, 536 - 49 * p, .91, -.09, -1);
    light(ctx, 1014, 418, 250, '255,166,93', .13);
  } else if (f.k === 1) {
    insetCamera(ctx, 968 + 28 * p, 427, 1.05 + .08 * p, .07 - .055 * p);
    wood(ctx, 224, 116, 1470, 625, 390);
    ctx.save(); ctx.translate(240 * (1 - p), -42 * (1 - p)); ctx.rotate(-.07 * (1 - p));
    manuscript(ctx, 584, 230, 694, 380, 9, 652);
    ctx.restore();
    tiedCord(ctx, 908, 420, p);
    hand(ctx, 1199 - 172 * p, 306 + 46 * p, .70, -.38, -1);
    hand(ctx, 631 + 144 * p, 565 - 58 * p, .75, -.37);
    pressWeight(ctx, 1305, 471, 177, 71);
  } else {
    insetCamera(ctx, 735 + 280 * p, 444, 1.19 - .13 * p, .035);
    wood(ctx, 120, 335, 1720, 375, 114);
    wood(ctx, 105, 699, 1760, 64, 71);
    ctx.save(); ctx.translate(404, 454); ctx.transform(1, -.14, .20, .76, 0, 0);
    manuscript(ctx, 0, 17, 417, 223, 1, 727);
    ctx.restore();
    ctx.save(); ctx.translate(915, 390); ctx.transform(1, -.12, .32, .72, 0, 0);
    manuscript(ctx, 0, 0, 556, 244, 16, 923);
    ctx.restore();
    pressWeight(ctx, 1385, 401, 131, 58);
    quill(ctx, 592 + 473 * p, 536 - 60 * p, 1.23, -.46 + .18 * p);
    light(ctx, 1042, 463, 280, '255,161,89', .19);
  }
}

function darkSheet(ctx, x, y, w, h) {
  path(ctx, [[x,y+7],[x+w*.84,y],[x+w-2,y+6],[x+w,y+h-17],[x+w-49,y+h],[x+4,y+h-3]],
    gradient(ctx, x, y+h, x+w*.85, y, '#181922', '#382b2a', '#524032', '#2a2629'), '#a47a535e', 2);
  ctx.save();
  ctx.strokeStyle = '#e8b37a15'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 17, y + 19, w - 37, h - 42);
  for (let i = 0; i < 94; i++) {
    const px = x + 22 + hash(i * 7 + 609) * (w - 49);
    const py = y + 21 + hash(i * 7 + 611) * (h - 46);
    line(ctx, [[px,py],[px+2+17*hash(i*7+613),py-1]], i % 3 ? '#ebc48a13' : '#140e1561', 1);
  }
  ctx.restore();
}

function setSquare(ctx) {
  ctx.save(); ctx.translate(555, 619); ctx.rotate(-.24);
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(338, 0); ctx.lineTo(0, -243); ctx.closePath();
  ctx.moveTo(47, -42); ctx.lineTo(47, -155); ctx.lineTo(210, -42); ctx.closePath();
  ctx.fillStyle = gradient(ctx, 0, 0, 210, -130, '#99754a', '#593b2a', '#bf945d');
  ctx.fill('evenodd'); ctx.strokeStyle = '#d6a26d85'; ctx.lineWidth = 2; ctx.stroke();
  for (let i = 1; i < 31; i++) line(ctx, [[i*10,-3],[i*10,i%5 ? -12 : -23]], '#38251f', 1.6);
  ctx.restore();
}

function pauseDiagram(ctx, f) {
  const p = ease(f.v);
  if (f.k === 0) insetCamera(ctx, 955 + 13 * p, 414 - 26 * p, .9 + .20 * p, -.04);
  if (f.k === 1) insetCamera(ctx, 948 + 40 * p, 356, 1.14 + .10 * p, .037);
  if (f.k === 2) insetCamera(ctx, 1001 + 16 * p, 375 + 11 * p, 1.5 + .16 * p, -.035);
  darkSheet(ctx, 294, 133, 1333, 603);
  if (f.k < 2) setSquare(ctx);
  ctx.save();
  ctx.setLineDash([4, 12]);
  line(ctx, [[740,375],[1355,375]], '#e2b88945', 1.6);
  line(ctx, [[1000,250],[1000,646]], '#e2b88934', 1.6);
  ctx.restore();
  drawing(ctx, [['M',627,462],['Q',758,391,938,377],['M',1065,380],['Q',1283,406,1394,531]], null, '#c28b5979', f.k === 2 ? 1.8 : 3.3);
  if (f.k === 1) {
    ctx.save(); ctx.globalAlpha = .50 * ease(f.v * 2 + .2);
    hand(ctx, 1113 - 75 * p, 386 + 14 * p, 1.4, .23, -1, true);
    ctx.restore();
    quill(ctx, 1001, 350, 1.48, -.38);
    ellipse(ctx, 1000, 368, 6, 2, '#21141a9c');
  } else if (f.k === 2) {
    arrow(ctx, 1000, 373, 1302, 373, '#e1ae73', 3.4, 22);
    for (let i = 0; i < 8; i++) {
      const py = 398 + i * 22;
      const size = 22 - i * 1.72;
      line(ctx, [[1000 - size,py],[1000 + size,py]], i % 2 ? '#d29c666a' : '#e8b97caa', 1.8);
    }
  }
  arc(ctx, 1000, 374, 12, 12, .6, 5.45, '#dcaf7c95', 1.7);
  light(ctx, 1000, 375, f.k === 2 ? 223 : 300, '230,162,95', f.k === 1 ? .13 : .23);
}

const land = [
  [[-17,35],[-6,36],[4,37],[12,34],[21,32],[31,31],[34,24],[40,15],[49,12],[51,10],[44,1],[40,-5],[40,-12],[34,-17],[33,-26],[26,-34],[19,-35],[14,-27],[11,-17],[12,-10],[8,-5],[1,4],[-9,4],[-15,10],[-17,17],[-16,24],[-12,29]],
  [[-10,36],[-9,43],[-2,43],[-5,48],[3,49],[7,53],[12,55],[9,58],[5,61],[11,65],[16,69],[24,71],[31,69],[28,64],[25,60],[31,59],[34,64],[42,67],[57,69],[74,70],[80,66],[80,49],[72,46],[67,42],[62,40],[56,43],[51,37],[49,28],[54,24],[56,20],[51,15],[43,12],[42,20],[36,27],[33,30],[36,36],[29,37],[25,40],[30,43],[36,46],[30,47],[24,44],[27,41],[23,38],[20,42],[17,45],[13,45],[17,40],[15,39],[10,44],[6,43],[2,42],[-1,38]],
  [[-10,51],[-9,54],[-6,55],[-5,51],[-7,50]], [[-6,50],[-3,53],[-6,57],[-3,59],[0,57],[-2,54],[1,52],[-2,50]],
  [[-25,64],[-22,66],[-14,66],[-14,64],[-20,63]], [[47,-13],[50,-16],[49,-23],[45,-26],[43,-24],[44,-19]],
  [[-54,60],[-46,61],[-40,65],[-30,68],[-20,77],[-22,81],[-39,83],[-58,80],[-62,73],[-53,69]],
  [[-64,10],[-58,8],[-52,4],[-48,0],[-41,-3],[-35,-6],[-36,-12],[-39,-17],[-40,-22],[-47,-27],[-50,-32],[-57,-39],[-62,-42],[-65,-48],[-67,-55],[-72,-54],[-74,-45],[-74,-25],[-71,-11],[-77,0],[-79,6],[-73,11]],
];

function orthographic(lon, lat, spin) {
  const a = (lon - spin) * Math.PI / 180;
  const b = lat * Math.PI / 180;
  return [Math.cos(b) * Math.sin(a), -.94 * Math.sin(b) + .34 * Math.cos(b) * Math.cos(a),
    .94 * Math.cos(b) * Math.cos(a) + .34 * Math.sin(b)];
}

function earth(ctx, x, y, r, spin) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 240, r / 240);
  light(ctx, -28, -28, 327, '82,148,209', .24);
  ellipse(ctx, 0, 0, 240, 240, radial(ctx, -106, -116, 385, [[0,'#74a8bf'],[.25,'#3c7ba0'],[.55,'#214c73'],[.8,'#142d50'],[1,'#0a162c']]));
  ctx.beginPath(); ctx.arc(0, 0, 240, 0, TAU); ctx.clip();
  for (let lat = -60; lat <= 60; lat += 15) {
    const points = [];
    for (let d = -88; d <= 88; d += 4) {
      const [px, py, z] = orthographic(spin + d, lat, spin);
      if (z > 0) points.push([px * 240, py * 240]);
    }
    line(ctx, points, '#aedfec24', 1);
  }
  for (let d = -75; d <= 75; d += 15) {
    const points = [];
    for (let lat = -80; lat <= 80; lat += 4) {
      const [px, py, z] = orthographic(spin + d, lat, spin);
      if (z > 0) points.push([px * 240, py * 240]);
    }
    line(ctx, points, '#aedfec20', 1);
  }
  const earthColors = gradient(ctx, -200, -120, 180, 150, '#9ba887', '#698f84', '#9ba17c', '#47686e');
  for (const coast of land) {
    const points = coast.map(([lon, lat]) => {
      let [px, py, depth] = orthographic(lon, lat, spin);
      if (depth < 0) { const length = Math.hypot(px, py); px /= length; py /= length; }
      return [px * 240, py * 240];
    });
    path(ctx, points, earthColors, '#acc8acbd', 1.4);
    ctx.save(); ctx.clip();
    const xs = points.map(([px]) => px);
    const ys = points.map(([, py]) => py);
    const left = Math.min(...xs), right = Math.max(...xs);
    const top = Math.min(...ys), bottom = Math.max(...ys);
    const strokes = Math.ceil((right - left) * (bottom - top) / 220);
    for (let i = 0; i < strokes; i++) {
      const sx = lerp(left, right, hash(i * 5 + 805));
      const sy = lerp(top, bottom, hash(i * 5 + 808));
      line(ctx, [[sx,sy],[sx+3+hash(i+327)*17,sy-3]], i % 3 ? '#d0bd8848' : '#26434969', 1.6);
    }
    ctx.restore();
  }
  for (let band = 0; band < 7; band++) {
    for (let i = 0; i < 12; i++) {
      const key = 1100 + band * 303 + i * 11;
      const px = -222 + i * 37 + hash(key) * 31;
      const py = -182 + band * 52 + Math.sin(i * .42 + band * 2.4) * 27 + hash(key + 2) * 18;
      drawing(ctx, [['M',px,py],['Q',px+20,py-17,px+54,py-12],['Q',px+79,py-12,px+95,py-21]], null,
        band % 3 === 0 ? '#deece278' : '#a6d4e135', 1 + hash(key + 4) * 2.7);
    }
  }
  ellipse(ctx, 0, 0, 240, 240, gradient(ctx, -174, -162, 190, 166, '#fff0c92c', '#25395200', '#0a13295e', '#070e22e8'));
  ctx.restore();
  arc(ctx, x, y, r, r, 0, TAU, '#754e42', 2.3);
  arc(ctx, x, y, r, r, 2.68, 5.03, '#bbdce5', 3.2);
  arc(ctx, x, y, r + 4, r + 4, 3.00, 4.87, '#89bbd269', 2.7);
  arc(ctx, x, y, r + 9, r + 9, 3.23, 4.63, '#77abd235', 2);
  arc(ctx, x, y, r - 2, r - 2, 3.70, 4.48, '#fae3ba85', 2);
}

function moon(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 48, r / 48);
  light(ctx, 0, 0, 94, '237,170,100', .23);
  ellipse(ctx, 0, 0, 48, 48, radial(ctx, -23, -24, 77, [[0,'#ffdfae'],[.40,'#d4b18a'],[.72,'#957668'],[.88,'#624c4d'],[1,'#372d3c']]), '#dda977', 2);
  ctx.beginPath(); ctx.arc(0, 0, 46.5, 0, TAU); ctx.clip();
  for (let i = 0; i < 53; i++) {
    const a = hash(330 + i * 5) * TAU;
    const dist = Math.sqrt(hash(332 + i * 5)) * 46;
    const px = Math.cos(a) * dist, py = Math.sin(a) * dist;
    const size = 1.2 + 7 * hash(334 + i * 5) ** 2;
    ellipse(ctx, px, py, size * 1.2, size * .77, '#543f416a');
    arc(ctx, px, py, size * 1.17, size * .84, .07, 2.56, '#edcd9b75', 1.2, -.2);
  }
  arc(ctx, 0, 0, 46, 46, 2.88, 4.92, '#ffe9bfcc', 1.5);
  ctx.restore();
}

function horizon(ctx, x, y, rx, ry, power) {
  ctx.save(); ctx.globalAlpha *= power;
  ellipse(ctx, x, y, rx, ry, gradient(ctx, x, y - ry, x, y - ry + 280, '#759092', '#324557', '#181d2b85', '#17192300'));
  arc(ctx, x, y, rx, ry, 3.82, 5.62, '#9ab6ba62', 2.1);
  arc(ctx, x, y, rx + 6, ry + 5, 4.02, 5.37, '#deb88b79', 1.6);
  for (let i = 0; i < 12; i++) {
    const r = 9 + i * 7;
    arc(ctx, x - 32 - 8 * i, y - 1, rx - r, ry - r, 4.01 - .04 * i, 4.62 + .047 * i, '#a6c0bd23', 1.3);
  }
  ctx.restore();
}

function incompleteOrbit(ctx, f) {
  const p = ease(f.v);
  if (f.k === 0) {
    insetCamera(ctx, 952, 395, 1.01 + .031 * p);
    darkSheet(ctx, 195, 144, 1515, 561);
    ctx.save(); ctx.setLineDash([6, 13]);
    line(ctx, [[435,365],[1485,365]], '#b8936859', 1.6);
    ctx.restore();
    for (let i = 0; i < 7; i++) {
      const x = 500 + i * 143;
      line(ctx, [[x,379],[x,398]], '#b9976c69', 1.45);
      dot(ctx, x, 365, i === 0 ? 8 : 6, i ? ease(f.v * 8 - i + .5) : 1);
    }
    return;
  }
  if (f.k === 1) {
    insetCamera(ctx, 960 + 65 * p, 444 - 21 * p, 1.02 + .10 * p, -.08);
    light(ctx, 1040, 555, 517, '146,179,206', .18 + .15 * p);
    horizon(ctx, 965, 1090, 910, 518, .36 + .60 * p);
    for (let i = 0; i < 6; i++) dot(ctx, 481 + i * 149, 296 + i * 13, 5.5, .66);
    return;
  }
  insetCamera(ctx, 971 + 28 * p, 439 + 12 * p, 1.06 + .03 * p);
  horizon(ctx, 862, 998, 865, 474, .77);
  const width = 610, height = 326;
  const first = -Math.PI / 2 - .25;
  const end = first + 1.51;
  arc(ctx, 850, 558, width, height, first, lerp(first + .13, end, p), '#bb754d48', 12);
  arc(ctx, 850, 558, width, height, first, lerp(first + .13, end, p), '#e7a56f', 2.8);
  for (let i = 0; i < 5; i++) {
    const angle = first + i * .33 + .10;
    const x = 850 + width * Math.cos(angle), y = 558 + height * Math.sin(angle);
    const inward = ease(f.v * 6 - i + .32);
    dot(ctx, x, y, 6, inward);
    if (inward > 0) {
      ctx.save(); ctx.globalAlpha *= inward;
      arrow(ctx, x, y + 15, lerp(x, 850, .19), lerp(y, 690, .27), '#ffd096', 2.2, 12);
      ctx.restore();
    }
  }
}

function heldPoint(ctx, f) {
  const crossing = ease((f.v - .54) / .43);
  const x = 1011 + 123 * crossing;
  const y = 399 + 30 * crossing;
  ctx.save(); ctx.translate(960, 420); ctx.rotate(.16 - .042 * ease(f.v)); ctx.translate(-960, -420);
  const glow = radial(ctx, 1015, 433, 570, [[0,'#68798a27'],[.46,'#41364432'],[1,'#130f1900']]);
  ellipse(ctx, 1015, 433, 720, 176, glow);
  arc(ctx, 856, 1043, 672, 539, 4.40, 5.31, '#9bbec252', 2);
  arc(ctx, 856, 1041, 670, 539, 4.49, 5.16, '#f5ca9670', 1.5);
  dot(ctx, x, y, 8 + crossing, .92 - .59 * Math.sin(Math.PI * clamp(f.v / .70)) + .06 * crossing);
  ctx.restore();
}

function orbitalReveal(ctx, f) {
  const p = ease(f.v);
  const opening = f.k === 0 ? 1 - (1 - f.v) ** 4 : 1;
  const cx = f.k === 0 ? 964 - 20 * opening : 944 + 24 * p;
  const cy = 399 + 7 * opening;
  const rx = 654 - 85 * opening + (f.k === 1 ? 65 + 18 * p : 0);
  const ry = f.k === 0 ? 303 - 25 * opening : 213 + 15 * p;
  const tilt = f.k === 0 ? -.045 - .025 * opening : -.22 + .12 * p;
  const globe = f.k === 0 ? 240 - 24 * opening : 195 + 6 * p;
  const phase = -.79 + f.a * 1.22;
  const pos = angle => [cx + rx * Math.cos(angle) * Math.cos(tilt) - ry * Math.sin(angle) * Math.sin(tilt),
    cy + rx * Math.cos(angle) * Math.sin(tilt) + ry * Math.sin(angle) * Math.cos(tilt)];
  light(ctx, cx - 62, cy - 40, 590, '83,140,190', .16);
  arc(ctx, cx, cy, rx, ry, 0, TAU, '#f4ac6330', 15, tilt);
  arc(ctx, cx, cy, rx, ry, 0, TAU, '#dda36b', 3.6, tilt);
  arc(ctx, cx, cy, rx, ry, Math.PI, TAU, '#faad8754', 6, tilt);
  earth(ctx, cx - 46, cy - 3, globe, 8 + 4 * f.a);
  arc(ctx, cx, cy, rx, ry, 0, Math.PI, '#ffd49e43', 10, tilt);
  arc(ctx, cx, cy, rx, ry, 0, Math.PI, '#efaa70', 4, tilt);
  for (let i = 3; i > 0; i--) {
    arc(ctx, cx, cy, rx, ry, phase - .45 - .14 * i, phase - .031, ['','#ffcc80ab','#f1a36555','#d7773c27'][i], 2 + i * 2, tilt);
  }
  if (f.k === 1) {
    for (const angle of [1.12, 3.59]) {
      const [x, y] = pos(angle - .049), [ex, ey] = pos(angle + .006);
      arrow(ctx, x, y, ex, ey, '#ffd19c', 3.4, 15);
    }
  }
  moon(ctx, ...pos(phase), f.k === 0 ? 50 - 6 * opening : 44);
}

function compareEvidence(ctx, f) {
  const p = ease(f.v);
  if (f.k === 0) insetCamera(ctx, 968 - 7 * p, 418, 1 + .035 * p, -.012);
  else insetCamera(ctx, 1019 - 57 * p, 405, 1.25 - .34 * p, .019 * (1 - p));
  const left = [[235,182],[925,155],[908,716],[250,682]];
  const right = [[985,155],[1718,181],[1698,683],[1002,716]];
  path(ctx, left, gradient(ctx, 280, 160, 812, 735, '#604333', '#2e292e', '#1b1a22'), '#ac785b', 2.7);
  path(ctx, right, gradient(ctx, 1660, 165, 1020, 715, '#465d67', '#292f3c', '#1a1e2b'), '#9e7b68', 2.7);
  for (let i = 0; i < 14; i++) {
    line(ctx, [[280,230 + 30*i],[881,215 + 34*i]], '#c6a27917', 1);
    line(ctx, [[1015,216 + 34*i],[1660,232 + 30*i]], '#aad0db1a', 1);
  }
  const drop = f.k === 0 ? 248 + 297 * p ** 2 : 546;
  wood(ctx, 452, 205, 38, 414, 349, true);
  for (let i = 0; i < 15; i++) line(ctx, [[491,224 + i * 25],[i % 4 ? 506 : 526,224 + i * 25]], '#d0a777ab', 1.8);
  line(ctx, [[600,224],[600,632]], '#e7b4865a', 1.6);
  for (let i = 0; i < 4; i++) {
    const y = 248 + i * i * 28;
    if (y < drop - 47) ellipse(ctx, 600, y, 13 + i * 2, 13 + i * 2, '#88665545', '#d3ab7472', 1.3);
  }
  ellipse(ctx, 600, drop, 48, 48, radial(ctx, 583, drop - 17, 78, [[0,'#efe1c6'],[.22,'#afaa9c'],[.52,'#5f5a56'],[.8,'#32323b'],[1,'#211e28']]), '#9c725c', 2.3);
  arc(ctx, 600, drop, 44, 44, 3.33, 4.9, '#ffe0ad80', 2.4);
  const cx = 1342, cy = 541;
  const phase = -2.51 + (f.k === 0 ? p : 1 + .27 * p) * 1.58;
  const mx = cx + Math.cos(phase) * 245, my = cy + Math.sin(phase) * 292;
  arc(ctx, cx, cy, 245, 292, -2.72, -.15, '#e3a66c', 3.4);
  earth(ctx, cx, cy, 78, 12);
  moon(ctx, mx, my, 31);
  const build = f.k ? 1 : .38 + .62 * ease(f.v * 3.1);
  ctx.save(); ctx.globalAlpha *= build;
  light(ctx, 709, 431, 151, '255,181,105', .23);
  light(ctx, 1360, 399, 155, '255,181,105', .20);
  arrow(ctx, 706, 352, 706, 517, gold, 5, 28);
  arrow(ctx, lerp(mx,cx,.22), lerp(my,cy,.22), lerp(mx,cx,.66), lerp(my,cy,.66), gold, 5, 28);
  ctx.restore();
  line(ctx, [[955,170],[953,692]], '#e8ae7652', 2);
}

function iron(ctx, x, y, w, h) {
  path(ctx, [[x+7,y],[x+w-8,y],[x+w,y+6],[x+w,y+h-4],[x+6,y+h],[x,y+h-7],[x,y+8]],
    gradient(ctx, x, y, x+19, y+h, '#ac9879', '#686264', '#2f2b32', '#6c554b'), '#352229', 2.4);
  line(ctx, [[x+9,y+4],[x+w-10,y+4]], '#e2c59c89', 1.6);
}

function typeChase(ctx, x, y, wide, slide = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(wide / 560, wide / 560);
  iron(ctx, 0, 0, 560, 251);
  ctx.fillStyle = '#20191d'; ctx.fillRect(13, 12, 534, 222);
  for (let row = 0; row < 7; row++) {
    let sx = 24;
    for (let col = 0; col < 25; col++) {
      const key = 920 + row * 61 + col * 7;
      const w = 10 + 17 * hash(key);
      if (sx + w > 531) break;
      if (row !== 3 || col !== 9) {
        ctx.fillStyle = col % 3 ? '#736566' : '#9b8370';
        ctx.fillRect(sx, 19 + row * 30, w, 21);
        line(ctx, [[sx,20+row*30],[sx+w-1,20+row*30]], '#d6b28d75', 1);
        if (col % 3 !== 0) label(ctx, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(row * 13 + col * 17) % 26], sx + w / 2, 35 + row * 30, 16, '#2d2326', 'center');
      } else {
        const d = (1 - slide) * 53;
        iron(ctx, sx, 109 - d, w, 21);
        label(ctx, 'R', sx + w / 2, 125 - d, 16, '#ead0a7', 'center');
      }
      sx += w + 4;
    }
  }
  ctx.restore();
}

function inkRoller(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.25);
  line(ctx, [[-94,0],[118,0]], '#a87d5d', 15);
  iron(ctx, -69, -24, 144, 48);
  ctx.fillStyle = gradient(ctx, 0,-23,0,21,'#3e3436','#2c2025','#130f16','#4d3c3c');
  ctx.fillRect(-66, -21, 137, 42);
  ellipse(ctx, -64, 0, 10, 21, '#392e35', '#ae8d75', 1.6);
  wood(ctx, 108, -11, 71, 22, 40);
  ctx.restore();
}

function beamScrew(ctx, x, y, height) {
  wood(ctx, x - 45, y, 90, height, 730, true);
  ctx.save(); ctx.beginPath(); ctx.rect(x - 43, y + 8, 86, height - 12); ctx.clip();
  for (let i = -2; i < height / 19 + 1; i++) {
    const yy = y + i * 19;
    drawing(ctx, [['M',x-52,yy],['Q',x-6,yy+34,x+52,yy+12]], null, '#24161c', 9);
    drawing(ctx, [['M',x-52,yy-3],['Q',x-6,yy+30,x+52,yy+9]], null, '#b27e53a2', 2);
  }
  ctx.restore();
}

function printFace(ctx, x, y, w, h, title = false) {
  paper(ctx, x, y, w, h, 1687);
  const color = '#352321';
  if (title) {
    label(ctx, 'PHILOSOPHIÆ', x + w / 2, y + h * .24, w * .064, color, 'center');
    label(ctx, 'NATURALIS', x + w / 2, y + h * .36, w * .088, color, 'center');
    label(ctx, 'PRINCIPIA', x + w / 2, y + h * .50, w * .116, color, 'center');
    label(ctx, 'MATHEMATICA', x + w / 2, y + h * .62, w * .075, color, 'center');
    line(ctx, [[x+w*.31,y+h*.70],[x+w*.69,y+h*.70]], '#5b3630', 2);
    label(ctx, 'Auctore IS. NEWTON', x + w / 2, y + h * .78, w * .042, color, 'center');
    label(ctx, 'LONDINI · MDCLXXXVII', x + w / 2, y + h * .90, w * .032, color, 'center');
  } else {
    label(ctx, 'PROPOSITIO I.', x + w / 2, y + h * .20, w * .057, color, 'center');
    writing(ctx, x + w * .11, y + h * .31, w * .75, 8, h * .068, 159, '#382423');
    line(ctx, [[x+w*.11,y+h*.88],[x+w*.89,y+h*.88]], '#57372b6b', 1.2);
  }
}

function pressBed(ctx, x, y, w) {
  path(ctx, [[x,y],[x+w*.8,y-75],[x+w,y-13],[x+w*.14,y+71]],
    gradient(ctx, x, y, x+w, y+43, '#4b322d', '#856043', '#2b2226'), '#b18055a0', 2);
  path(ctx, [[x,y],[x+w*.14,y+71],[x+w,y-13],[x+w,y+28],[x+w*.14,y+113],[x,y+42]],
    gradient(ctx, x, y+14, x, y+109, '#7e5034', '#3f2724', '#211722'), '#905e46', 2);
  for (let i = 0; i < 6; i++) line(ctx, [[x+w*.16,y+77+i*4],[x+w-11,y-6+i*4]], '#d7a67327', 1.2);
}

function printing(ctx, f) {
  const p = ease(f.v);
  if (f.k === 0) insetCamera(ctx, 944 + 82 * p, 429, 1.02 + .09 * p, -.07);
  if (f.k === 1) insetCamera(ctx, 955, 466 - 37 * p, .96 + .115 * p, .085);
  if (f.k === 2) insetCamera(ctx, 1081 + 171 * p, 551 + 12 * p, 1.26 - .068 * p, -.025);
  wood(ctx, 439, 148, 103, 665, 630, true);
  wood(ctx, 1248, 133, 95, 650, 257, true);
  wood(ctx, 402, 113, 991, 121, 293);
  wood(ctx, 567, 178, 679, 60, 338);
  beam(ctx, [[1390,116],[1422,140],[1191,673],[658,694]], '255,188,110', .26);
  for (const x of [478, 1296]) {
    for (const y of [156, 203, 602, 744]) {
      ellipse(ctx, x, y, 12, 12, '#26232a', '#c8976d9c', 2.5);
      line(ctx, [[x-6,y-3],[x+5,y+3]], '#887063', 1.6);
    }
  }
  const down = f.k === 0 ? 0 : f.k === 1 ? 180 * ease((f.v - .08) / .65) : 180 - 106 * ease(f.v * 4 + .28);
  beamScrew(ctx, 910, 167, 170 + down);
  const lever = .15 + down * .0025;
  line(ctx, [[832,243],[914,255],[1278,255 + lever * 210]], '#37221e', 23);
  line(ctx, [[832,239],[914,251],[1280,251 + lever * 210]], '#aa7454', 6);
  ellipse(ctx, 1283, 255 + lever * 210, 19, 14, '#563632', '#c88652', 3);
  pressBed(ctx, 485, 665, 1000);
  pressBed(ctx, 536, 591, 797);
  if (f.k === 1) {
    ctx.save(); ctx.translate(607, 509); ctx.transform(1, -.09, .45, .46, 0, 0);
    paper(ctx, 18, 10, 558, 214, 1687);
    ctx.restore();
  }
  const plate = 319 + down;
  ctx.save(); ctx.translate(560, plate); ctx.transform(1, -.09, .43, .65, 0, 0);
  wood(ctx, 0, 0, 660, 96, 914);
  iron(ctx, 7, 73, 651, 67);
  for (let i = 0; i < 8; i++) ellipse(ctx, 43 + i * 83, 102, 6, 6, '#261b22', '#bfa285', 1.2);
  ctx.restore();
  if (f.k === 0) {
    ctx.save(); ctx.translate(590, 480); ctx.transform(1, -.10, .45, .55, 0, 0);
    typeChase(ctx, 0, 0, 618, p);
    ctx.restore();
    inkRoller(ctx, 1277, 492);
    hand(ctx, 924, 494 - 35 * (1 - p), .85, .28, -1);
    light(ctx, 866, 523, 218, '255,172,99', .27);
  } else if (f.k === 1) {
    light(ctx, 1006, 547, 195, '249,166,90', .18);
    const contact = ease((f.v - .56) / .18);
    line(ctx, [[631,550],[1182,499]], `rgba(33,16,21,${.30 + contact * .56})`, 11 + 8 * contact);
  } else {
    const pull = ease((f.v - .08) / .82);
    ctx.save(); ctx.translate(663 + 420 * pull, 518 + 43 * pull); ctx.transform(1, -.14, .42, .58, 0, 0);
    printFace(ctx, 0, 0, 581, 238);
    ctx.restore();
    hand(ctx, 1311 + 348 * pull, 548 + 25 * pull, .94, -.20, -1);
    light(ctx, 1137 + 158 * pull, 555, 217, '255,173,97', .24);
  }
}

function leatherCover(ctx, x, y, w, h) {
  const corners = [[x+28,y],[x+w-12,y+4],[x+w,y+18],[x+w-4,y+h-15],[x+w-20,y+h-1],[x+22,y+h],[x,y+h-17],[x+2,y+23]];
  path(ctx, corners, gradient(ctx, x, y, x+w, y+h, '#785144', '#2e2529', '#211b24', '#090e18'), '#bb896082', 3.4);
  ctx.save(); ctx.clip();
  for (let i = 0; i < 125; i++) {
    const key = 496 + i * 7;
    const px = x + 18 + hash(key) * (w - 35);
    const py = y + hash(key + 1) * h;
    line(ctx, [[px,py],[px+2+13*hash(key+3),py+hash(key+4)*4]], i % 3 ? '#aa745029' : '#0c0c15b1', 1.35);
  }
  ctx.strokeStyle = '#c18b6d85'; ctx.lineWidth = 1.7;
  ctx.strokeRect(x + 39, y + 22, w - 63, h - 44);
  ctx.strokeStyle = '#b8826447'; ctx.strokeRect(x + 48, y + 30, w - 81, h - 60);
  ctx.restore();
  for (let i = 0; i < 5; i++) line(ctx, [[x+3,y+35+i*(h-70)/4],[x+31,y+37+i*(h-70)/4]], '#ae7c5cb5', 4);
}

function openBook(ctx, turn, diagram) {
  wood(ctx, 356, 517, 1201, 152, 82);
  path(ctx, [[419,493],[1496,489],[1418,655],[484,664]], '#442923', '#b685566b', 3);
  for (let i = 4; i >= 0; i--) {
    leatherCover(ctx, 475 - i * 3, 192 + i * 7, 968 + i * 6, 434);
  }
  if (diagram) {
    paper(ctx, 967, 203, 465, 407, 603);
    label(ctx, 'PROPOSITIO I.', 1199, 277, 27, '#352321', 'center');
    writing(ctx, 1018, 306, 354, 2, 20, 606);
  } else {
    printFace(ctx, 967, 203, 465, 407, true);
  }
  paper(ctx, 486, 204, 474, 402, 601);
  writing(ctx, 548, 309, 324, 7, 31, 1687, '#6141326b');
  drawing(ctx, [['M',956,204],['Q',942,367,956,619]], null, '#31201f', 9);
  for (let i = 0; i < 6; i++) {
    const y = 229 + i * 70;
    drawing(ctx, [['M',946,y],['Q',957,y-5,969,y+2]], null, '#6d4231', 2.6);
  }
  if (diagram) {
    ctx.save(); ctx.beginPath(); ctx.rect(969, 308, 450, 292); ctx.clip();
    const cx = 1189, cy = 523;
    ellipse(ctx, cx, cy, 54, 54, '#8e624747', '#624033', 2);
    arc(ctx, cx, cy, 170, 133, 0, TAU, '#693c31', 2.6, -.12);
    const points = [[1026,487],[1097,416],[1200,389],[1302,412],[1355,472]];
    for (const [x,y] of points) {
      ellipse(ctx, x,y,4,4,'#57362a');
      line(ctx, [[x,y],[cx,cy]], '#653f3288', 1.3);
    }
    arrow(ctx, 1198, 388, 1261, 390, '#6a402e', 2.5, 11);
    ctx.restore();
  }
  if (turn > 0 && turn < 1) {
    const x = Math.cos(Math.PI * turn) * 452;
    const lift = Math.sin(Math.PI * turn) * 105;
    drawing(ctx, [['M',960,204],['Q',960+x*.56,192-lift,960+x,203-lift],['L',960+x,596-lift*.47],
      ['Q',960+x*.54,611-lift*.55,960,608],['Z']], gradient(ctx, 960-Math.abs(x)-2, 240, 961+Math.abs(x), 510, '#b99367', '#efd4a7', '#7d573f'), '#ad845d', 2.3);
    for (let i = 0; i < 7; i++) {
      const yy = 305 + i * 35;
      drawing(ctx, [['M',960+x*.18,yy],['Q',960+x*.56,yy-lift*.48,960+x*.89,yy-lift*.70]], null, '#74503981', 1.45);
    }
  }
}

function receivedBook(ctx, f) {
  const p = ease(f.v);
  if (f.k === 0) {
    insetCamera(ctx, 953 + 23 * p, 421, 1.10 + .065 * p, .012);
    wood(ctx, 258, 654, 1424, 90, 768);
    wood(ctx, 668, 571, 651, 117, 42);
    light(ctx, 862, 338, 333, '255,185,109', .19);
    const fall = ease(f.v * 1.2);
    ctx.save(); ctx.translate(588 + 54 * fall, 259 + 113 * fall); ctx.rotate(-.23 + .11 * fall); ctx.transform(1, .04, .42, .62, 0, 0);
    leatherCover(ctx, -4, 19, 644, 373);
    for (let i = 7; i >= 0; i--) paper(ctx, 17, 15 + i * 3.8, 601, 350, 44 + i);
    leatherCover(ctx, 0, 0, 641, 363);
    label(ctx, 'PRINCIPIA', 331, 192, 56, '#d3a16f', 'center');
    ctx.restore();
    hand(ctx, 1131, 590 - 19 * fall, 1.24, -.22, -1);
    hand(ctx, 719, 291 + 83 * fall, .82, .19);
  } else if (f.k === 1) {
    insetCamera(ctx, 957, 404 + 26 * p, 1.015 + .12 * p, .039 - .027 * p);
    openBook(ctx, ease((f.v - .12) / .82), false);
    light(ctx, 1001, 366, 287, '255,199,121', .13);
  } else {
    insetCamera(ctx, 1109 + 83 * p, 330 + 127 * p, 1.34 + .23 * p, -.072);
    openBook(ctx, 0, true);
    light(ctx, 1170, 497, 242, '255,192,106', .18);
  }
}

function engravedWorld(ctx, x, y, r) {
  ellipse(ctx, x, y, r, r, gradient(ctx, x - r*.7, y - r*.8, x + r*.65, y + r*.72, '#d09d64', '#b2794c', '#73432f', '#2c1f25'), '#3d251f', 3);
  ctx.save(); ctx.clip();
  for (let i = -r * 1.7; i < r * 2; i += 6.5) {
    const shade = (i + r * 1.7) / (r * 3.7);
    drawing(ctx, [['M',x-r-10,y+i+r*.41],['Q',x,y+i,x+r+10,y+i-r*.42]], null, shade > .43 ? '#3e251e79' : '#593a2d63', shade > .51 ? 1.65 : 1.0);
  }
  for (let i = -2; i <= 2; i++) {
    ellipse(ctx, x, y + i * r*.23, r, r * .085, null, '#f2c48b65', 1.45);
    arc(ctx, x, y, r*.27 + Math.abs(i)*r*.21, r, 0, TAU, '#4a302759', 1.35, .22 + i*.13);
  }
  arc(ctx, x, y, r * .89, r * .89, .32, 2.76, '#2b1e257a', 3);
  arc(ctx, x, y, r * .95, r * .95, 3.33, 5.88, '#ecc58c7a', 2);
  ctx.restore();
  arc(ctx, x, y, r + 3, r + 3, 3.20, 6.20, '#e2ae71', 2.4);
}

function ridge(ctx, x, y) {
  const pts = [[x-84,y+123],[x-57,y+85],[x-27,y+73],[x-13,y+36],[x,y],[x+14,y+18],
    [x+27,y+49],[x+48,y+63],[x+58,y+87],[x+74,y+93],[x+93,y+115],[x+46,y+148],[x-14,y+156]];
  path(ctx, pts, gradient(ctx, x-63,y+26,x+82,y+119,'#c18a59','#784b36','#39272a'), '#38241f', 2.7);
  ctx.save(); ctx.clip();
  for (let i = 0; i < 44; i++) {
    const xx = x - 94 + i * 4.9;
    line(ctx, [[xx-28,y+20],[xx+9,y+89],[xx+1,y+126]], i % 3 ? '#32202570' : '#e8b17a72', 1.25);
  }
  ctx.restore();
  line(ctx, [[x-56,y+84],[x-28,y+73],[x-12,y+36],[x,y],[x+13,y+18]], '#f6c68b', 2.2);
}

function experiment(ctx, f) {
  const p = ease(f.v);
  if (f.k === 0) insetCamera(ctx, 758 + 190*p, 325, 1.36 - .14*p, -.04);
  if (f.k === 1) insetCamera(ctx, 931 + 106*p, 365, 1.15 - .14*p, .14 - .10*p);
  if (f.k === 2) insetCamera(ctx, 979 - 19*p, 415, 1.18 - .30*p, -.045);
  const cx = 960, cy = 483, r = 242;
  darkSheet(ctx, 256, 97, 1408, 692);
  light(ctx, 920, 360, 435, '255,166,92', .24);
  engravedWorld(ctx, cx, cy, r);
  const start = -2.18;
  const launchR = 323;
  const lx = cx + launchR * Math.cos(start), ly = cy + launchR * Math.sin(start);
  ridge(ctx, lx, ly);
  for (let j = 0; j <= f.k; j++) {
    const travel = j === f.k ? .15 + .85 * p : 1;
    const points = [];
    for (let i = 0; i <= 90; i++) {
      const t = i / 90 * travel;
      const a = start + t * [1.08, 2.12, TAU][j];
      const radius = j === 2 ? launchR + 27 * Math.sin(t * TAU) ** 2
        : lerp(launchR, r + 1, t) + [62,134][j] * Math.sin(t * Math.PI);
      points.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)]);
    }
    line(ctx, points, j === f.k ? '#472822ab' : '#744c39b0', 6);
    line(ctx, points, j === f.k ? '#ffd39a' : '#ba8456', j === f.k ? 2.8 : 1.7);
    for (let i = 14; i < 90; i += 14) {
      const [x,y] = points[i];
      ellipse(ctx, x, y, 3.1, 3.1, '#efb579');
    }
    if (j === f.k) dot(ctx, ...points.at(-1), 6.4);
  }
  dot(ctx, lx, ly, 5.1, .82);
}

function curls(ctx, back) {
  const darkHair = back ? '#291d21' : '#322126';
  drawing(ctx, [['M',-206,255],['C',-233,199,-245,145,-211,109],['C',-230,57,-179,14,-132,13],
    ['C',-107,-16,-69,-2,-31,5],['C',3,-22,62,-6,81,20],['C',131,13,157,44,156,81],
    ['C',188,85,204,127,190,150],['C',220,185,202,232,219,256],['C',242,298,237,369,195,403],
    ['C',188,441,165,451,141,440],['C',110,482,77,458,58,438],['C',31,469,-3,454,-16,441],
    ['C',-45,470,-69,440,-78,429],['C',-119,459,-147,422,-149,405],['C',-202,424,-218,370,-213,353],
    ['C',-248,327,-236,286,-206,255],['Z']],
  gradient(ctx,-263,96,188,343,'#291c23','#876349','#634633',darkHair), '#a57854', 2.4);
  ctx.save(); ctx.clip();
  const columns = back ? 26 : 20;
  for (let i = 0; i < columns; i++) {
    const key = 2986 + i * 13;
    const x = -218 + i * 425 / columns;
    const top = 12 + Math.abs(x + 40) * .51 + 24 * hash(key);
    const y = top + 299 + 65 * hash(key + 4);
    const sway = 17 + 32 * hash(key + 1);
    const lock = [['M',x,top],['C',x-sway,top+49,x+sway,top+90,x-7,top+124],
      ['C',x-22,top+155,x+sway,top+174,x+3,top+214],['C',x-sway,top+241,x+sway,top+278,x-4,y]];
    drawing(ctx, lock, null, '#281a215e', 9 + 6 * hash(key + 2));
    ctx.save(); ctx.translate(-3 - 4 * hash(key + 5), -1);
    drawing(ctx, lock, null, i % 3 === 1 ? '#deb3879d' : '#ad815986', i % 3 === 1 ? 2.5 : 1.7);
    ctx.translate(-5, 5);
    drawing(ctx, lock, null, '#d2a47862', 1);
    ctx.restore();
  }
  for (let i = 0; i < 25; i++) {
    const k = 837 + i * 13;
    const x = -198 + hash(k) * 381;
    const y = 145 + hash(k + 3) * 258;
    drawing(ctx, [['M',x-13,y-18],['C',x-15,y+21,x+22,y+29,x+18,y+8],['Q',x+12,y-6,x+3,y+6]], null,
      i % 4 ? '#c18f647d' : '#f1c999bc', 1.6);
  }
  ctx.restore();
}

function newtonBack(ctx, x, y, scale) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  drawing(ctx, [['M',-350,649],['C',-346,525,-336,422,-308,362],['C',-260,301,-172,317,-141,280],
    ['L',94,275],['C',142,294,166,318,223,335],['C',267,365,284,473,283,649],['Z']],
  gradient(ctx,-360,396,271,467,'#221d24','#52403c','#302632','#18151f'), '#a27958', 3);
  path(ctx,[[-146,286],[102,278],[132,330],[-148,345],[-176,319]], gradient(ctx,-167,306,133,333,'#ae8b70','#c5a789','#705149'), '#613e32', 2);
  for (let i = 0; i < 15; i++) {
    const left = -1 + i * 22;
    drawing(ctx, [['M',-157+left*.19,354],['Q',-278+left,447,-298+left,641]], null, i % 3 ? '#291d298f' : '#a377573e', 1.7 + i % 3);
  }
  curls(ctx, true);
  ctx.restore();
}

function skylight(ctx) {
  const corners = [[976,72],[1430,71],[1729,236],[1328,282]];
  path(ctx, corners, gradient(ctx, 1087, 78, 1639, 256, '#6f766c', '#c0b396', '#e6be8b', '#55717a'), '#4e3529', 10);
  for (let i = 1; i < 7; i++) {
    const p = i / 7;
    line(ctx, [[lerp(976,1430,p),lerp(72,71,p)],[lerp(1328,1729,p),lerp(282,236,p)]], '#634a3c', 6);
  }
  for (let i = 1; i < 4; i++) {
    const p = i / 4;
    line(ctx, [[lerp(976,1328,p),lerp(72,282,p)],[lerp(1430,1729,p),lerp(71,236,p)]], '#6d5444', 5);
  }
}

function returningNewton(ctx, f) {
  const p = ease(f.v);
  if (f.k === 0) {
    insetCamera(ctx, 826 + 132*p, 582 - 166*p, 1.36 - .44*p, -.04);
    skylight(ctx);
    ctx.save(); ctx.translate(1192, 229); ctx.transform(1, -.17, .087, .97, 0, 0);
    path(ctx, [[0,0],[522,0],[522,455],[0,455]], '#261c23', '#91704f', 3);
    for (let i = 0; i < 4; i++) {
      const y = 109 + i * 105;
      for (let j = 0; j < 21; j++) {
        const key = 305 + i * 111 + j * 4;
        const h = 44 + 45 * hash(key);
        const x = 15 + j * 24;
        path(ctx, [[x,y],[x-4,y-h],[x+17,y-h+(j%3)*3],[x+21,y]], ['#5a3934','#675143','#344149','#44333a','#775640'][Math.floor(hash(key+1)*5)], '#cc95654f', 1.5);
        line(ctx, [[x+1,y-h+13],[x+15,y-h+13]], '#c2986c7f', 1.4);
      }
      wood(ctx, 0, y, 522, 13, y);
    }
    ctx.restore();
    beam(ctx, [[1380,155],[1492,190],[1602-106*p,686],[1033-106*p,685]], '255,197,120', .26);
    newtonBack(ctx, 902, 194, .76);
    wood(ctx, 315, 655, 1232, 107, 406);
    ellipse(ctx, 719, 690, 176, 35, '#1e1821');
    ellipse(ctx, 719, 672, 157, 40, gradient(ctx, 626,634,811,701,'#b38f64','#7d5a49','#3d2a2b'), '#af8262', 2);
    arc(ctx, 719, 674, 144, 31, 3.4, 5.99, '#f7d8a990', 2);
  } else {
    insetCamera(ctx, 966 + 62*p, 532 - 32*p, 1.15 + .15*p, .068);
    wood(ctx, 292, 483, 1321, 237, 212);
    ellipse(ctx, 575, 581, 108, 24, '#2c1d21', '#a7805d', 2.2);
    ellipse(ctx, 575, 570, 103, 25, gradient(ctx, 515,550,623,597,'#ab8c66','#513c35','#332525'), '#c2a27a', 2);
    ctx.save(); ctx.translate(656 + 190*p, 366 - 58*p); ctx.rotate(-.10 + .21*p); ctx.transform(1, -.10, .29, .78, 0, 0);
    paper(ctx, 0, 0, 533, 315, 347);
    writing(ctx, 39, 65, 419, 5, 27, 441);
    label(ctx, 'Is. Newton', 294, 240, 33, '#59392c');
    drawing(ctx, [['M',272,258],['Q',372,225,476,235]], null, '#80513a', 1.6);
    ctx.restore();
    hand(ctx, 1230 + 80*p, 535 - 74*p, 1.12, -.30, -1);
    light(ctx, 960 + 64*p, 449 - 34*p, 260, '255,198,130', .24);
  }
}

function engravedFace(ctx, reveal) {
  const shape = [['M',-89,119],['C',-77,85,-60,65,-21,62],['C',18,52,58,68,77,101],
    ['C',91,124,91,150,92,176],['Q',98,193,105,209],['Q',109,221,98,226],['L',92,232],
    ['Q',94,245,85,256],['Q',87,275,72,286],['C',65,310,58,328,38,343],
    ['Q',16,354,-10,344],['C',-41,332,-64,304,-74,280],['L',-88,248],['Q',-109,241,-113,218],
    ['Q',-121,193,-103,183],['C',-105,163,-100,140,-89,119],['Z']];
  drawing(ctx, shape, gradient(ctx,-113,146,107,255,'#583934','#ac7756','#d7aa7e','#a96f53'), '#754633', 2.6);
  ctx.save(); ctx.clip();
  drawing(ctx, [['M',-117,143],['Q',-87,107,-67,109],['Q',-72,173,-53,210],['Q',-27,231,-24,264],
    ['Q',-15,301,23,340],['Q',-36,375,-91,308],['L',-114,254],['Z']], '#77503e8f');
  drawing(ctx, [['M',-44,115],['Q',-13,82,42,103],['Q',66,118,66,143],['Q',22,128,-8,151],
    ['Q',-38,154,-44,115],['Z']], '#f0bd8c55');
  drawing(ctx, [['M',-15,228],['Q',-3,217,19,222],['Q',45,224,49,243],['Q',33,267,11,273],
    ['Q',-11,262,-15,228],['Z']], '#e7a87871');
  for (let i = 0; i < 38; i++) {
    const y = 110 + i * 6.8;
    const end = -61 + 76 * Math.sin(i / 38 * Math.PI / 2);
    drawing(ctx, [['M',-114,y+15],['Q',-69,y+14,end,y-3]], null, i % 4 ? '#60352f63' : '#f1bf8c66', 1);
  }
  for (let i = 0; i < 20; i++) {
    const x = -40 + i * 7;
    const y = 302 + hash(i + 880) * 30;
    line(ctx, [[x,y],[x+7,y-8]], '#f1b98b4f', 1);
  }
  ctx.restore();
  drawing(ctx, [['M',-92,200],['Q',-109,189,-107,210],['Q',-103,226,-91,230],['Q',-84,225,-98,217]], null, '#704339', 2);
  drawing(ctx, [['M',-38,177],['Q',-11,157,17,170],['M',55,163],['Q',72,155,87,166]], null, '#573530', 5.3);
  drawing(ctx, [['M',-34,189],['Q',-9,178,15,189],['Q',-11,197,-29,194],['Z'],
    ['M',56,179],['Q',75,168,90,178],['Q',76,186,61,184],['Z']], '#b78e72', '#5b3532', 2.1);
  ellipse(ctx, -7, 187.7, 6.8, 5.8, '#51413d');
  ellipse(ctx, 75, 177.4, 6.2, 5.4, '#51413d');
  ellipse(ctx, -5, 185.9, 1.9, 1.5, '#ffe2a6');
  ellipse(ctx, 77, 175.8, 1.8, 1.4, '#ffe2a6');
  drawing(ctx, [['M',47,171],['C',46,186,53,202,65,210],['Q',80,218,73,229],['Q',67,238,49,231],
    ['M',32,222],['Q',31,235,48,235]], null, '#835040', 2.5);
  drawing(ctx, [['M',13,207],['Q',2,206,-17,200],['M',60,195],['Q',74,196,84,190],
    ['M',1,266],['Q',25,269,36,259],['Q',50,256,65,260],['Q',79,255,82,259],['M',29,276],['Q',54,279,67,269],
    ['M',27,300],['Q',57,301,71,286],['M',-21,285],['Q',-12,303,4,313]], null, '#724238', 2.2);
  drawing(ctx, [['M',-51,136],['Q',-15,119,25,126],['M',-33,149],['Q',-3,136,25,141],
    ['M',47,175],['Q',53,202,69,212],['Q',76,218,73,223]], null, '#f8cb9cce', 2.3 + reveal);
}

function halfPortrait(ctx, x, y, scale, reveal) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  drawing(ctx, [['M',-420,643],['C',-403,541,-379,461,-319,423],['C',-253,388,-114,370,-68,311],
    ['L',56,311],['C',87,360,167,368,253,397],['C',322,419,365,500,394,643],['Z']],
  gradient(ctx,-386,489,315,565,'#312129','#5a4038','#79513c','#392a30','#1b1722'), '#a06a4a', 3);
  ctx.save(); ctx.clip();
  for (let i = 0; i < 68; i++) {
    const n = i / 67;
    const start = -388 + 766 * n;
    const end = start + (n - .5) * 268;
    drawing(ctx, [['M',start*.64,380],['Q',start*1.27,491,end,662]], null,
      i % 4 ? '#2619239c' : '#cf946356', i % 4 ? 1.9 : 2.4);
  }
  drawing(ctx, [['M',-420,593],['Q',-305,484,-235,463],['Q',-186,436,-147,470],['M',395,592],['Q',263,456,183,454]], null, '#bc86695d', 8);
  ctx.restore();
  path(ctx, [[-90,298],[62,288],[79,369],[123,391],[35,455],[-21,437],[-106,377]], gradient(ctx,-70,300,56,422,'#c28761','#845641','#c08b65'), '#57362c', 2);
  path(ctx, [[-99,350],[-20,389],[51,367],[105,352],[148,395],[99,473],[31,444],[-23,480],[-127,407]],
    gradient(ctx,-114,362,114,477,'#9e7c63','#e6bf98','#bc9576','#654b43'), '#926e50', 2.6);
  for (let i = 0; i < 22; i++) {
    const x = -114+i*11;
    const shift = (x-15)*.21;
    line(ctx, [[x,377+Math.abs(shift)*.23],[x+shift,420+Math.abs(shift)*.54]], '#6f504369', 1.2);
  }
  curls(ctx, false);
  engravedFace(ctx, reveal);
  drawing(ctx, [['M',-111,173],['C',-132,127,-94,82,-65,72],['Q',-53,63,-27,60],
    ['M',-111,173],['C',-134,201,-101,229,-116,265],['Q',-140,294,-112,329],['M',95,120],
    ['Q',106,167,108,181],['C',98,209,123,226,110,257],['C',80,293,122,329,99,361]],
  null, '#aa7855', 5.5);
  drawing(ctx, [['M',-119,163],['Q',-143,109,-88,78],['M',120,279],['Q',142,364,113,415],
    ['M',140,379],['Q',233,383,303,427],['Q',344,460,359,513]], null, '#f7bc7f9e', 2.6);
  ctx.restore();
}

function engravedEnding(ctx, f) {
  const p = ease(f.v);
  const reveal = ease(f.a / .86);
  const afterbeat = ease((f.t - 119.68) / .85);
  ctx.save();
  insetCamera(ctx, f.k === 0 ? 955 - 10 * p : 970 + 27 * p, 416,
    f.k === 0 ? .97 + .041 * p : 1.009 + .043 * p, f.k === 0 ? -.012 : .014 + .015 * p);
  const rim = [[536,101],[1380,101],[1447,146],[1447,687],[1394,744],[523,744],[472,691],[472,149]];
  path(ctx, rim, gradient(ctx, 518, 112, 1373, 736, '#8e5b43', '#4e302b', '#33252a', '#19151e'), '#ae744d', 3);
  const bevel = [[545,114],[1370,114],[1432,156],[1432,678],[1386,729],[532,729],[487,682],[487,157]];
  path(ctx, bevel, gradient(ctx, 530, 113, 1242, 702, '#3b2725', '#6d4432', '#32232b', '#1c1820'), '#cf925f77', 2);
  ctx.save(); ctx.clip();
  for (let i = 0; i < 82; i++) {
    const y = 124 + i * 7.7;
    drawing(ctx, [['M',491,y],['Q',924,y-38,1430,y+14]], null, i % 4 ? '#efbc7720' : '#160e1759', 1);
  }
  ellipse(ctx, 956, 402, 383, 319, null, '#e2a26738', 1.65);
  ellipse(ctx, 956, 402, 371, 307, null, '#2617218c', 2.1);
  for (const x of [505, 1414]) {
    for (const y of [169, 676]) ellipse(ctx, x, y, 7, 7, '#2a1f25', '#bd815e9e', 1.6);
  }
  const scan = 285 + reveal * 264;
  light(ctx, 970, scan, 384, '255,160,90', .14 + .13 * reveal);
  ctx.save(); ctx.globalAlpha = .18 + .82 * reveal;
  halfPortrait(ctx, 956 - 7 * f.k * p, 87, .998, reveal);
  ctx.restore();
  if (afterbeat > 0) {
    ellipse(ctx, 960, 410, 563, 448, radial(ctx, 995, 364, 450, [[0,'#160f1900'],[.29,'#160f1900'],[1,`rgba(17,12,20,${afterbeat * .54})`]]));
  }
  ctx.restore();
  ctx.restore();
  if (f.k === 1) {
    ctx.save(); ctx.globalAlpha = ease(f.v * 5 + .36);
    const plaque = [[685,820],[1235,820],[1272,848],[1272,959],[1235,983],[685,983],[648,959],[648,848]];
    path(ctx, plaque, gradient(ctx, 649, 818, 1270, 981, '#261b21', '#332323', '#221820'), '#98624892', 2);
    line(ctx, [[693,831],[1227,831]], '#c6936265', 1.2);
    for (const x of [674,1246]) ellipse(ctx, x, 901, 5.8, 5.8, '#886049', '#2d1b1d', 1.5);
    ctx.restore();
  }
}

const scenes = [manuscripts, pauseDiagram, incompleteOrbit, heldPoint, orbitalReveal, compareEvidence,
  printing, receivedBook, experiment, returningNewton, engravedEnding];

export function drawActThree(ctx, f) {
  const draw = scenes[f.id - 23];
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
