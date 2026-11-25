const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;
const UI = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const SERIF = '"Songti SC", SimSun, "Noto Serif CJK SC", serif';
const ROMAN = 'Georgia, "Times New Roman", serif';
const clamp = n => Math.max(0, Math.min(1, n));
const mix = (a, b, t) => a + (b - a) * t;
const ease = n => { const x = clamp(n); return x * x * (3 - 2 * x); };
const land = n => 1 - (1 - clamp(n)) ** 3;
const noise = n => { const x = Math.sin(n * 127.1 + 31.7) * 43758.5453; return x - Math.floor(x); };

function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

function line(c, points, color, width = 1) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function shape(c, points, color) {
  c.beginPath();
  c.moveTo(...points[0]);
  for (const point of points.slice(1)) c.lineTo(...point);
  c.closePath();
  c.fillStyle = color;
  c.fill();
}

function ellipse(c, x, y, rx, ry, color, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, TAU);
  c.fillStyle = color;
  c.fill();
}

function arc(c, x, y, r, start, end, color, width) {
  c.beginPath();
  c.arc(x, y, r, start, end);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function gradient(c, x1, y1, x2, y2, stops) {
  const g = c.createLinearGradient(x1, y1, x2, y2);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

function glow(c, x, y, r, center, outer = '#00000000') {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, center);
  g.addColorStop(1, outer);
  rect(c, x - r, y - r, 2 * r, 2 * r, g);
}

function sky(c, top, horizon, floor) {
  rect(c, 0, 0, W, H, gradient(c, 0, 0, 0, H, [[0, top], [.68, horizon], [1, floor]]));
}

function text(c, value, x, y, size, color, { family = UI, weight = 600, align = 'left' } = {}) {
  c.textBaseline = 'middle';
  c.textAlign = align;
  c.font = `${weight} ${size}px ${family}`;
  c.fillStyle = color;
  c.fillText(value, x, y);
}

function at(c, x, y, scale, angle, draw) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(scale, scale);
  draw();
  c.restore();
}

function camera(c, scale, dx, dy, draw) {
  at(c, W / 2 + dx, 500 + dy, scale, 0, () => {
    c.translate(-W / 2, -500);
    draw();
  });
}

function dust(c, seed, drift, color, count = 56) {
  c.save();
  for (let i = 0; i < count; i++) {
    const n = i + seed * 211;
    const x = (noise(n) * 2100 + drift * (12 + noise(n + .5) * 28) + 2100) % 2100 - 90;
    const y = 45 + noise(n + .1) * 870;
    c.globalAlpha = .08 + noise(n + .2) * .32;
    ellipse(c, x, y, .7 + noise(n + .3) * 2.1, .7 + noise(n + .3) * 2.1, color);
  }
  c.restore();
}

function fibers(c, x, y, w, h, seed, color, count = 170) {
  c.save();
  for (let i = 0; i < count; i++) {
    const n = i + seed * 247;
    const px = x + noise(n) * (w - 20);
    const py = y + noise(n + .31) * (h - 4);
    c.globalAlpha = .10 + .30 * noise(n + .64);
    line(c, [[px, py], [px + 3 + 15 * noise(n + .47), py + noise(n + .7) * 3]], color);
  }
  c.restore();
}

function paper(c, x, y, w, h, colors, seed) {
  shape(c, [[x - 8, y + 9], [x + w + 14, y + 12], [x + w + 23, y + h + 22], [x - 14, y + h + 16]], '#09080d88');
  rect(c, x, y, w, h, gradient(c, x, y, x + w, y + h, [[0, colors[0]], [.51, colors[1]], [1, colors[0]]]));
  c.strokeStyle = colors[2];
  c.lineWidth = 2;
  c.strokeRect(x + 10, y + 10, w - 20, h - 20);
  fibers(c, x + 14, y + 14, w - 28, h - 28, seed, colors[2]);
}

function arch(c, x, y, w, h) {
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, y + w / 2);
  c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, TAU);
  c.lineTo(x + w, y + h);
  c.closePath();
}

function head(c, color, rim, angle = 0) {
  at(c, 0, 0, 1, angle, () => {
    c.beginPath();
    c.moveTo(-39, 66);
    c.bezierCurveTo(-32, 38, -56, 34, -56, -2);
    c.bezierCurveTo(-64, -48, -28, -71, 8, -63);
    c.bezierCurveTo(35, -62, 50, -42, 48, -23);
    c.lineTo(62, 2);
    c.lineTo(48, 8);
    c.lineTo(50, 24);
    c.quadraticCurveTo(50, 39, 26, 40);
    c.lineTo(23, 66);
    c.closePath();
    c.fillStyle = color;
    c.fill();
    line(c, [[-48, -32], [-37, -52], [-16, -62], [8, -63], [31, -54], [45, -39]], rim, 2.7);
    shape(c, [[-52, -2], [-57, -31], [-45, -51], [-19, -65], [9, -64], [34, -53], [34, -42], [11, -45], [-6, -32], [-25, -34], [-30, 2], [-38, 11]], '#0b0a10');
  });
}

function person(c, x, y, scale, { color = '#20171a', rim = '#a56e42', angle = 0, flip = false, collar = '#d6b58a', stride = 0, reach = 0, child = false, rear = false } = {}) {
  at(c, x, y, scale, 0, () => {
    if (flip) c.scale(-1, 1);
    const coat = child ? 142 : 222;
    for (const side of [-1, 1]) {
      const step = stride * side;
      shape(c, [[side * 23 - 18, coat - 20], [side * 33 + step * .43, coat + 36], [side * 30 + step, coat + 132], [side * 30 + step + 38, coat + 141], [side * 30 + step + 42, coat + 155], [side * 30 + step - 14, coat + 153], [side * 24 - 13, coat + 42]], '#141219');
    }
    shape(c, [[-40, 49], [-76, 71], [-91, 123], [-68, 161], [-57, coat], [-13, coat + 15], [6, coat - 2], [58, coat + 5], [44, 136], [60, 82], [27, 50]], color);
    line(c, [[-42, 51], [-75, 73], [-87, 119], [-69, 158]], rim, 3);
    if (rear) {
      ellipse(c, -3, -7, 53, 60, color);
      arc(c, -3, -7, 54, 3.42, 5.8, rim, 2.6);
      shape(c, [[-40, 43], [34, 42], [47, 66], [-46, 70]], collar);
      line(c, [[-2, 75], [-8, 145], [-5, coat]], '#c595684a', 2);
    } else {
      head(c, color, rim, angle);
      shape(c, [[-31, 56], [22, 47], [37, 76], [17, 98], [-2, 71], [-31, 76]], collar);
    }
    const handX = 49 + reach;
    line(c, [[32, 85], [51, 130], [handX, 157 - reach * .39]], color, 31);
    if (reach) ellipse(c, handX + 6, 156 - reach * .39, 16, 11, rim, -.3);
  });
}

function quill(c, x, y, scale, angle, ink = '#251c25') {
  at(c, x, y, scale, angle, () => {
    c.beginPath();
    c.moveTo(6, -28);
    c.bezierCurveTo(22, -98, 69, -200, 165, -249);
    c.bezierCurveTo(158, -172, 100, -108, 55, -79);
    c.quadraticCurveTo(29, -64, 6, -28);
    c.fillStyle = gradient(c, 22, -35, 137, -180, [[0, '#a99b86'], [.51, '#fff0ce'], [1, '#887d78']]);
    c.fill();
    for (let i = 0; i < 9; i++) {
      const f = i / 9;
      const px = 29 + f * 104;
      const py = -59 - f * 153;
      line(c, [[px, py], [px - 7 - f * 13, py - 23]], '#473c426c', 1.5);
    }
    line(c, [[0, 0], [34, -70], [139, -221]], '#f8dfbc', 3);
    shape(c, [[0, 0], [4, -23], [15, -31], [9, -10]], ink);
  });
}

function starField(c, t) {
  for (let i = 0; i < 235; i++) {
    const parallax = .55 + (i % 3) * .35;
    const x = (noise(i + 12) * 2050 - t * 76 * parallax + 2050) % 2050 - 62;
    const y = 42 + noise(i + 204) * 910;
    const r = .55 + noise(i + 7.65) ** 3 * 2.3;
    c.globalAlpha = .24 + noise(i + .26) * .6;
    ellipse(c, x, y, r, r, i % 9 === 0 ? '#f1ceb0' : '#b7d8ef');
    if (i % 49 === 0) {
      glow(c, x, y, 28, '#acd2ff58');
      line(c, [[x - 8, y], [x + 8, y]], '#bcd9f59c');
      line(c, [[x, y - 8], [x, y + 8]], '#bcd9f59c');
    }
  }
  c.globalAlpha = 1;
}

function lostStar(c, { k, v, u, sceneFrame }) {
  if (!k) {
    sky(c, '#050a1b', '#102845', '#060a17');
    glow(c, 675 - v * 160, 396, 790, '#294b706b');
    glow(c, 1580 - v * 59, 517, 490, '#485b8037');
    const first = ease((sceneFrame - 2) / 6);
    const second = ease((sceneFrame - 12) / 6);
    const overshoot = sceneFrame < 13 ? 0 : Math.sin((sceneFrame - 13) * 1.6) * Math.exp(-(sceneFrame - 13) / 3.3);
    const trailingPan = Math.max(0, sceneFrame - 18) * 21;
    const focusX = mix(mix(960, 585, first), 1390, second) + trailingPan;
    const focusY = mix(mix(540, 424, first), 589, second);
    const zoom = 1 + first * 1.52 - second * .13;
    c.save();
    c.translate(960 - overshoot * 46, 540 + overshoot * 30);
    c.rotate(overshoot * .031);
    c.scale(zoom, zoom);
    c.translate(-focusX, -focusY);
    starField(c, v * .4);
    for (const [x, y, tint, amount] of [[585, 424, '#86c8ff', first * (1 - second)], [1390, 589, '#ffd0a6', second]]) {
      const pulse = Math.max(0, amount);
      glow(c, x, y, 43 + 27 * pulse, tint + '64');
      ellipse(c, x, y, 3.1 + 3 * pulse, 3.1 + 3 * pulse, '#fff6e4');
      line(c, [[x - 8 - 8 * pulse, y], [x + 8 + 8 * pulse, y]], tint + 'b0', 1);
      line(c, [[x, y - 8 - 8 * pulse], [x, y + 8 + 8 * pulse]], tint + 'a0', 1);
    }
    c.restore();
    return;
  }
  rect(c, 0, 0, W, H, '#090e1c');
  camera(c, 1.06 + v * .20, -340 * v, 38 * v, () => {
    at(c, 960, 460, 1, -.105, () => {
      paper(c, -1280, -575, 2570, 1170, ['#1e293a', '#536276', '#192c44'], 1);
      for (let i = -6; i <= 6; i++) {
        c.beginPath();
        c.moveTo(i * 155 - 75, -560);
        c.quadraticCurveTo(i * 155 + 110, 70, i * 155 - 100, 570);
        c.strokeStyle = '#b9c6c344'; c.lineWidth = 1.5; c.stroke();
      }
      for (let i = -4; i <= 4; i++) {
        c.beginPath();
        c.moveTo(-1050, i * 127);
        c.quadraticCurveTo(-4, i * 127 - 50, 1050, i * 127 + 43);
        c.strokeStyle = '#b9c6c344'; c.lineWidth = 1.5; c.stroke();
      }
      for (let i = 0; i < 65; i++) {
        const x = noise(110 + i) * 1840 - 920;
        const y = noise(11.2 + i) * 890 - 445;
        ellipse(c, x, y, 1.5 + noise(i) * 3.4, 1.5 + noise(i) * 3.4, '#d8d0b49e');
      }
      line(c, [[-646, 82], [-458, -97], [-203, -53], [-22, -165], [188, -30], [418, -163]], '#cdc9b57c', 2);
      line(c, [[122, -30], [253, -30]], '#daad8ba2');
      line(c, [[188, -96], [188, 32]], '#daad8ba2');
      arc(c, 188, -30, 36, 0, TAU, '#c56962a0', 2);
      glow(c, 188, -30, 91, '#c733397c');
      ellipse(c, 188, -30, 10, 10, '#e46f59');
      const edge = mix(680, -64, ease(v * .96 + u * .15));
      rect(c, edge - 200, -650, 1700, 1300, gradient(c, edge - 200, 0, edge + 172, 0, [[0, '#03061100'], [.7, '#030611ee'], [1, '#030611']]));
    });
  });
}

function inkwell(c, x, y, s) {
  at(c, x, y, s, 0, () => {
    ellipse(c, 21, 70, 103, 30, '#0808119c');
    shape(c, [[-63, -23], [-48, -40], [48, -40], [68, -19], [80, 55], [54, 76], [-52, 76], [-78, 55]], '#14151f');
    line(c, [[-71, 43], [-63, -21], [-43, -38], [42, -38]], '#9a8b83', 3);
    rect(c, -36, -57, 72, 29, '#211e26');
    ellipse(c, 0, -58, 36, 11, '#52434b');
    ellipse(c, 0, -58, 24, 6, '#070913');
  });
}

function blankCoordinate(c, { k, v, u }) {
  sky(c, '#100e1b', '#342631', '#100d17');
  const hit = land(v / .31);
  camera(c, k ? 1.9 + .13 * v : 1 + .055 * v, k ? -153 : 0, k ? -85 : 0, () => {
    at(c, 952, 558, 1, -.13, () => {
      paper(c, -436, -253, 946, 519, ['#65575d', '#b1a19a', '#51464a'], 2);
      for (let i = 0; i < 6; i++) line(c, [[-363, -133 + i * 60], [404, -133 + i * 60]], '#3f414b63');
      for (let i = 0; i < 9; i++) line(c, [[-350 + i * 88, -163], [-350 + i * 88, 206]], '#3f414b43');
      line(c, [[-25, 32], [16, 32], [16, -8]], '#ece3c0b3', 2);
      line(c, [[96, -8], [96, 32], [135, 32]], '#ece3c0b3', 2);
      if (k) {
        c.save();
        c.globalAlpha = ease((v - .25) * 4);
        text(c, 'α  2ʰ  ·  δ', -111, 29, 30, '#30232c', { family: ROMAN, weight: 400 });
        line(c, [[85, 33], [85 + 18 * ease(v), 36]], '#332129', 2);
        c.restore();
      }
      inkwell(c, 466, -243, 1.05);
      if (k) {
        const y = 34 - 189 * (1 - hit);
        ellipse(c, 95, 39, 23 + 30 * (1 - hit), 5, '#37293552');
        quill(c, 91 + (1 - hit) * 35, y, 1.61, -.17 + .07 * hit);
        if (v > .26) ellipse(c, 91, 35, 2 + ease(v) * 2, 2.5, '#251720');
      } else quill(c, 364 - u * 42, -57, 1.15, -.27);
    });
  });
}

function gable(c, x, y, w, h, wall, roof, trim, detail = false) {
  rect(c, x, y, w, h, wall);
  shape(c, [[x - 18, y + 3], [x + w * .49, y - w * .49], [x + w + 22, y + 3]], roof);
  line(c, [[x - 18, y + 2], [x + w * .49, y - w * .49], [x + w + 20, y + 2]], trim, 3);
  if (!detail) return;
  rect(c, x + w * .17, y + h * .20, w * .20, h * .31, roof);
  rect(c, x + w * .62, y + h * .20, w * .19, h * .31, roof);
  for (const z of [.27, .71]) line(c, [[x + w * z, y + h * .20], [x + w * z, y + h * .51]], trim, 2);
  line(c, [[x, y + 9], [x + w, y + 9], [x + w, y + h]], roof, 9);
}

function workshop(c, { k, v, u }) {
  sky(c, '#533130', '#df9c58', '#623a2f');
  glow(c, k ? 465 : 1460, 254, 975, '#ffd18aab');
  const drift = v * (k ? -95 : 156);
  for (let i = 0; i < 11; i++) {
    const x = i * 205 - 125 - drift * .23;
    gable(c, x, 370 + noise(i + 31) * 144, 200, 400, '#794f3d', '#653f39', '#c6875d', i % 2 === 0);
  }
  shape(c, [[0, 679], [670, 613], [1441, 628], [1920, 721], [1920, 1080], [0, 1080]], '#51372e');
  for (let i = 0; i < 24; i++) {
    const y = 704 + i * 14;
    line(c, [[0, y + 25], [630, y - 42], [1920, y + 32]], '#d18e6243', 2);
  }
  if (!k) {
    const push = v * v * (3 - 2 * v);
    camera(c, 1.04 + .30 * push, -235 * push, 25 - 61 * push, () => {
      gable(c, -100, 306, 399, 514, '#492c2d', '#2b2026', '#9e603e', true);
      gable(c, 1540, 335, 458, 508, '#46282a', '#291c25', '#9e603e', true);
      person(c, 319 - 260 * v, 380, 2.07, { rear: true, stride: 24 * Math.sin(8 * v), rim: '#bc7651', color: '#251d23', collar: '#8b6252' });
      person(c, 939, 606, .81, { child: true, angle: .24, color: '#392624', rim: '#d89d6d', collar: '#96705a' });
      const swing = land(v * 5);
      const hammerY = mix(418, 654, swing);
      line(c, [[1290, 625], [1461, 625], [1507, 698], [1231, 698]], '#3f2324', 21);
      for (let i = 0; i < 4; i++) line(c, [[1286 + i * 10, 644 + i * 12], [1490, 641 + i * 13]], '#be7c4f6c', 3);
      person(c, 1510, 444, 1.29, { flip: true, reach: 81, rim: '#ad6b4c' });
      at(c, 1374, hammerY, 1, -.45 + swing * .43, () => {
        line(c, [[26, 8], [75, -93]], '#7a4934', 16);
        rect(c, -27, -24, 113, 47, '#302125');
        rect(c, -27, -24, 113, 4, '#c08756');
      });
    });
  } else {
    camera(c, 1.13 - .055 * ease(v), -72 + 112 * v, -22 + 31 * v, () => {
      shape(c, [[0, 738], [512, 675], [1445, 652], [1920, 747], [1920, 1080], [0, 1080]], '#865b42');
      shape(c, [[0, 841], [1137, 751], [1920, 815], [1920, 1080], [0, 1080]], '#382b2c');
      line(c, [[0, 840], [1137, 750], [1920, 815]], '#d49e69', 6);
      person(c, 665, 561, 1.49, { child: true, reach: 42 + 65 * Math.sin(Math.PI * clamp(v * 1.3)), angle: mix(.47, -.24, ease((v - .58) * 3)), rim: '#e2ae79', color: '#392622', collar: '#9a7360' });
      for (let i = 0; i < 10; i++) {
        const settle = ease(v * 2.5 - i * .14);
        const x = 895 + (i % 5) * 57 + (1 - settle) * (96 + noise(i) * 80);
        const y = 685 + Math.floor(i / 5) * 36 - (1 - settle) * 30;
        at(c, x, y, 1, -.22 + (1 - settle) * .48, () => {
          rect(c, -22, 6, 54, 9, '#4b322b');
          rect(c, -23, 0, 53, 8, '#d9a267');
        });
      }
      shape(c, [[0, 780], [156, 711], [144, 1080], [0, 1080]], '#251f25');
    });
  }
  dust(c, 3, u, '#ffd09b');
}

function classroom(c, { k, v, u }) {
  sky(c, '#252b23', '#5a6142', '#252921');
  glow(c, 1365, 332, 800, '#cbd08a4f');
  if (!k) {
    camera(c, 1.02 + v * .055, -30 * v, 0, () => {
      rect(c, 471, 149, 930, 471, '#756345');
      rect(c, 493, 171, 886, 424, '#24372e');
      ellipse(c, 928, 392, 376, 120, '#9ba88b13');
      fibers(c, 505, 190, 857, 376, 4, '#a2ad91');
      text(c, '1 + 2 + 3 + ··· + 100', 700, 340, 64, '#d6dac0', { family: ROMAN, weight: 400 });
      const turn = ease(v * 1.75);
      person(c, 1420 - turn * 63, 396, 1.33, { flip: true, reach: 65 * (1 - turn), angle: mix(-.25, .13, turn), rim: '#9d9c68', color: '#272924' });
      line(c, [[1269 + turn * 31, 542 + turn * 21], [1252 + turn * 34, 536 + turn * 21]], '#d8d9ae', 7);
      for (let i = 0; i < 6; i++) {
        person(c, 222 + i * 256, 664 + 36 * (i % 2) + ease(v * 2 - i * .11) * 19, .87 + (i % 2) * .12, { child: true, rear: true, color: '#252825', rim: '#797a53', collar: '#827657' });
      }
      shape(c, [[0, 834], [1900, 819], [1920, 1080], [0, 1080]], '#191f1c');
    });
  } else {
    camera(c, 1.02 + .10 * v, 208 - 380 * land(v), -16 * v, () => {
      for (let i = 0; i < 4; i++) {
        const x = -80 + i * 381;
        shape(c, [[x - 30, 621], [x + 347, 522], [x + 500, 753], [x + 58, 892]], i === 3 ? '#746746' : '#454a36');
        shape(c, [[x + 18, 667], [x + 246, 605], [x + 314, 715], [x + 79, 786]], '#303a32');
        line(c, [[x + 18, 667], [x + 246, 605], [x + 314, 715]], '#ad9b6d', 8);
        shape(c, [[x - 140, 869], [x + 12, 710], [x + 96, 683], [x + 130, 722], [x + 31, 816]], '#272721');
        ellipse(c, x + 109, 708, 42, 19, '#a88964', -.31);
        const raise = i === 3 ? ease((v - .42) * 2.3) : 0;
        line(c, [[x + 104, 712 - raise * 19], [x + 163, 731 - raise * 86]], '#e1dbc1', 7);
        if (i === 3) {
          const handY = 708 - raise * 20;
          ellipse(c, x + 120, handY, 30, 17, '#c7a57b', -.25);
          for (let p = 0; p < 5; p++) ellipse(c, x + 111 + p * 6, handY - 5 + noise(p) * 10, 1.7, 1.7, '#e5ddc6');
        }
      }
      shape(c, [[0, 894], [1920, 861], [1920, 1080], [0, 1080]], '#1b211d');
    });
    dust(c, 4, u, '#d0cca0', 28);
  }
}

function pairing(c, { k, v, u }) {
  sky(c, '#080a0e', '#151517', '#08090e');
  glow(c, 963, 442, 725, '#73534348');
  const cream = '#f2e4ca';
  if (!k) {
    const slide = land(v * 1.4);
    line(c, [[960, 164], [960, 858]], '#c5a16a36', 2);
    for (let i = 0; i < 5; i++) {
      const p = land(v * 2.5 - i * .13);
      const y = 248 + i * 113;
      c.globalAlpha = (i > 2 ? .35 : .93) * p;
      text(c, i === 3 ? '⋮' : `${i < 3 ? i + 1 : 50}`, mix(-160, 542, p), y, 83, cream, { family: ROMAN, align: 'center' });
      text(c, i === 3 ? '⋮' : `${i < 3 ? 100 - i : 51}`, mix(2060, 1378, p), y, 83, cream, { family: ROMAN, align: 'center' });
    }
    c.globalAlpha = 1;
    line(c, [[210, 178], [210 + 390 * slide, 178]], '#a77143', 3);
    line(c, [[1710, 178], [1710 - 390 * slide, 178]], '#a77143', 3);
  } else {
    for (let i = 0; i < 2; i++) {
      const fold = land(v * 3.2 - i * .22);
      const y = 252 + i * 133;
      const xl = mix(542, 812, fold);
      const xr = mix(1378, 1108, fold);
      const opacity = 1 - .47 * ease((v - .49) * 3);
      c.globalAlpha = opacity;
      line(c, [[xl + 52, y + 23], [960, y + 62 - fold * 23], [xr - 76, y + 23]], '#c79555', 2);
      text(c, `${i + 1}`, xl, y, 83, cream, { family: ROMAN, align: 'center' });
      text(c, `${100 - i}`, xr, y, 83, cream, { family: ROMAN, align: 'center' });
      c.globalAlpha = fold * opacity;
      text(c, '＋', 960, y + 5, 45, '#d1a76c', { align: 'center' });
    }
    const slam = land((v - .42) * 3.2);
    c.globalAlpha = slam;
    line(c, [[350 + 95 * (1 - slam), 501], [1570 - 95 * (1 - slam), 501]], '#a8784d', 2);
    text(c, '50 × 101 =', 990 - slam * 204, 665, 89, cream, { family: ROMAN, align: 'right' });
    at(c, 859 + 285 * (1 - slam), 662, 1 + .10 * (1 - slam), 0, () => {
      text(c, '5050', 0, 0, 208, '#f7d999', { family: ROMAN });
    });
    c.globalAlpha = 1;
  }
  dust(c, 5, u, '#ba9c71', 23);
}

function polygonPoints(n, x, y, r, angle = -Math.PI / 2) {
  return Array.from({ length: n }, (_, i) => [x + Math.cos(angle + i * TAU / n) * r, y + Math.sin(angle + i * TAU / n) * r]);
}

function trace(c, points, progress, color, width) {
  const count = points.length - 1;
  const position = clamp(progress) * count;
  const index = Math.floor(position);
  const path = points.slice(0, index + 1);
  if (index < count) {
    const start = points[index];
    const next = points[index + 1];
    path.push([mix(start[0], next[0], position - index), mix(start[1], next[1], position - index)]);
  }
  if (path.length > 1) line(c, path, color, width);
  return path.at(-1);
}

function compass(c, x, y, s, angle, spread) {
  at(c, x, y, s, angle, () => {
    const jointX = spread * .5;
    const jointY = -238;
    for (const tip of [0, spread]) {
      line(c, [[tip, 0], [tip + (jointX - tip) * .23, -69], [jointX, jointY]], '#251d25', 17);
      line(c, [[tip, -1], [tip + (jointX - tip) * .23, -69], [jointX, jointY]], '#b59b70', 5);
      line(c, [[tip, 1], [tip + (jointX - tip) * .075, -25]], '#d6c7ad', 3);
    }
    ellipse(c, jointX, jointY, 23, 20, '#33282c');
    arc(c, jointX, jointY, 19, 0, TAU, '#d0b180', 3);
    ellipse(c, jointX, jointY, 5, 5, '#d4af76');
    rect(c, jointX - 8, jointY - 43, 16, 30, '#9e8667');
  });
}

function ruler(c, x, y, width, angle, color = '#887452') {
  at(c, x, y, 1, angle, () => {
    rect(c, -4, 10, width + 12, 58, '#19182255');
    rect(c, 0, 0, width, 58, color);
    line(c, [[0, 2], [width, 2]], '#eccea0', 3);
    for (let i = 0; i < width - 20; i += 17) {
      line(c, [[13 + i, 3], [13 + i, i % 85 === 0 ? 30 : 16]], '#40373e', 1.8);
    }
  });
}

function darkCircle(c, { k, v, u }) {
  sky(c, '#111a2b', '#3b505f', '#101923');
  camera(c, k ? 1.09 + v * .11 : 1 + v * .06, k ? 20 : 170 - 55 * v, 0, () => {
    at(c, 960, 492, 1, k ? 0 : -.14, () => {
      paper(c, -735, -445, 1470, 890, ['#33424f', '#667885', '#1e3140'], 6);
      const r = k ? 303 : 264;
      line(c, [[-490, 0], [500, 0]], '#bccbd54f');
      line(c, [[0, -396], [0, 390]], '#bccbd54f');
      glow(c, -95 + u * 190, -52, 397, '#dbe5ec4e');
      arc(c, 0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * (k ? 1 : ease(v * 1.26)), '#d4e1e0', 3.2);
      ellipse(c, 0, 0, 5, 5, '#e2d3b6');
      const points = polygonPoints(17, 0, 0, r, -.73);
      if (k) {
        for (const [x, y] of points) ellipse(c, x, y, 3.5, 3.5, '#e3ddca');
        trace(c, points, .48 + .45 * ease(v * 1.8), '#eee2be', 3.6);
        line(c, [[-193, -239], [235, 183]], '#b4c4c892', 1.6);
      }
      ruler(c, k ? -631 : -611, k ? 224 : 143, k ? 443 : 576, k ? -.84 : .19, '#737473');
      compass(c, k ? 293 : -104, k ? 157 : 31, k ? .91 : 1.05, -.25 + .39 * v, 256);
    });
  });
}

function rooftop(c, { k, v, u }) {
  sky(c, k ? '#51313c' : '#553442', '#ecae68', '#624036');
  const sunX = mix(897, 1008, u);
  glow(c, sunX, k ? 485 : 528, 850, '#ffc977d6');
  glow(c, sunX - 70, 553, 400, '#fff1afce');
  for (let i = 0; i < 11; i++) {
    ellipse(c, noise(i + 84) * 2110 - 95 + 40 * u, 371 + i * 28, 210 + noise(i) * 450, 10 + noise(i + 81) * 17, '#f7d0a32b', -.022);
  }
  const parallax = v * (k ? 45 : 83);
  for (let i = 0; i < 13; i++) {
    const x = i * 162 - 123 - parallax * .27;
    gable(c, x, 690 + noise(i + 17) * 88, 154, 340, '#805246', '#815246', '#bf8464');
  }
  const towerX = 1358 - parallax * .44;
  const towerY = k ? 739 : 637;
  rect(c, towerX, towerY, 77, 288, '#553a3b');
  shape(c, [[towerX - 16, towerY + 7], [towerX + 37, towerY - 116], [towerX + 92, towerY + 7]], '#553a3b');
  rect(c, towerX + 24, towerY + 29, 26, 64, '#d08758');
  line(c, [[towerX + 37, towerY - 140], [towerX + 37, towerY - 111]], '#6a453f', 4);
  const ridge = k ? 820 : 752;
  shape(c, [[0, 922], [448 - parallax, ridge + 43], [940 - parallax, ridge], [1585, 956], [1920, 909], [1920, 1080], [0, 1080]], '#231c26');
  line(c, [[0, 922], [448 - parallax, ridge + 43], [940 - parallax, ridge], [1585, 956]], '#e1a56c', 4);
  for (let i = 0; i < 9; i++) line(c, [[122 * i - 95, 1020], [122 * i + 69, 868 + i * 9]], '#744c42', 2);
  const figureX = k ? 555 - 44 * v : 813 - 115 * v;
  const figureScale = k ? 1.43 + .06 * v : 1.15 + v * .21;
  const footing = mix(ridge + 43, ridge, (figureX - 448 + parallax) / 492);
  person(c, figureX, footing - 371 * figureScale, figureScale, { rear: true, color: '#241b24', rim: '#ffd392', collar: '#ecd5a8' });
  if (k) {
    for (const [i, glyph] of ['高', '斯'].entries()) {
      const beat = land((v - i * .172) * 5.5);
      c.globalAlpha = beat;
      at(c, 1000 + i * 336 + (1 - beat) * 181, 365 + (1 - beat) * 34, 1 + (1 - beat) * .15, 0, () => {
        text(c, glyph, 6, 9, 318, '#482c34', { family: SERIF, weight: 900 });
        text(c, glyph, 0, 0, 318, '#ffe4b0', { family: SERIF, weight: 900 });
      });
    }
    c.globalAlpha = ease((v - .35) * 4);
    line(c, [[1025, 600], [1095, 600]], '#f7d092', 3);
    text(c, '假如你是高斯', 1122, 600, 44, '#fff0cb', { family: SERIF });
    c.globalAlpha = 1;
  }
  dust(c, 7, u, '#ffe2a8', 34);
}

function tallWindow(c, x, y, w, h) {
  arch(c, x - 20, y - 20, w + 40, h + 40);
  c.fillStyle = '#382c31'; c.fill();
  c.save();
  arch(c, x, y, w, h); c.clip();
  rect(c, x, y, w, h, gradient(c, x, y, x + w, y + h, [[0, '#b2a58d'], [.62, '#ffe5a8'], [1, '#b48555']]));
  glow(c, x + w * .42, y + h * .57, w, '#fff4c6');
  for (let i = 0; i < 4; i++) {
    const ox = x + w * i / 3;
    line(c, [[ox, y], [ox, y + h]], '#5f4b42', 9);
  }
  for (let i = 1; i < 5; i++) {
    const oy = y + h * i / 5;
    line(c, [[x, oy], [x + w, oy]], '#5f4b42', 8);
  }
  c.restore();
}

function book(c, x, y, w, h, angle, cover, pages = '#d5ba8b') {
  at(c, x, y, 1, angle, () => {
    rect(c, -w / 2 + 8, -h / 2 + 13, w, h, '#130e1668');
    rect(c, -w / 2, -h / 2, w, h, cover);
    rect(c, -w / 2 + 16, h / 2 - 23, w - 24, 17, pages);
    for (let i = 0; i < 3; i++) line(c, [[-w / 2 + 21, h / 2 - 20 + i * 5], [w / 2 - 10, h / 2 - 20 + i * 5]], '#745e4d80');
    line(c, [[-w / 2 + 17, -h / 2 + 5], [-w / 2 + 17, h / 2 - 4]], '#ca996b86', 3);
    c.strokeStyle = '#d4a67198'; c.lineWidth = 2;
    c.strokeRect(-w / 2 + 30, -h / 2 + 17, w - 48, h - 46);
  });
}

function patron(c, { k, v, u }) {
  sky(c, '#231d29', '#826649', '#2e2327');
  if (!k) {
    camera(c, 1.01 + v * .07, -35 * v, 7 * v, () => {
      tallWindow(c, 731, 80, 462, 697);
      glow(c, 972, 384, 655, '#ffd78b61');
      shape(c, [[809, 373], [1086, 385], [1621, 950], [470, 950]], '#f7c98238');
      shape(c, [[0, 777], [1920, 748], [1920, 1080], [0, 1080]], '#33272b');
      shape(c, [[733, 776], [1136, 766], [1520, 999], [407, 999]], '#b1825458');
      rect(c, 612, 750, 635, 20, '#614235');
      shape(c, [[1313, 718], [1313, 477], [1344, 435], [1466, 432], [1510, 486], [1508, 781], [1487, 849], [1459, 850], [1466, 747], [1359, 749], [1340, 842], [1316, 840]], '#31242a');
      person(c, 1448, 452, .93, { flip: true, reach: 34, rim: '#8c654e', color: '#38292b', collar: '#9e8368' });
      person(c, 652 + 13 * ease(v), 507, .86, { child: true, angle: -.18 * v, rim: '#b78355', color: '#291f27', collar: '#fae9bb' });
      rect(c, 0, 0, 333 + v * 18, H, '#201923');
      rect(c, 327 + v * 18, 0, 21, H, '#4d3430');
      rect(c, 1685, 0, 260, H, '#32232a');
    });
  } else {
    const exchange = ease(v * 1.38);
    camera(c, 1 + v * .10, -32 * v, 13 * v, () => {
      tallWindow(c, 376, -202, 561, 885);
      glow(c, 681, 385, 743, '#ffe1a15d');
      shape(c, [[263, 773], [669, 627], [1723, 705], [1920, 963], [0, 1054]], '#694d3e');
      person(c, 1514 + 83 * exchange, 316, 1.54, { flip: true, angle: .19, rim: '#62484a', color: '#27202a', collar: '#5f4e56' });
      rect(c, 1263, 0, 690, 981, gradient(c, 1210, 0, 1720, 0, [[0, '#17152000'], [1, '#171520e8']]));
      const bx = mix(1115, 865, exchange);
      const by = mix(506, 559, exchange);
      line(c, [[1671, 295], [1350 - exchange * 65, 457], [bx + 148 + exchange * 138, by - 5]], '#211c27', 129);
      ellipse(c, bx + 146 + exchange * 135, by - 3, 57, 28, '#aa7956', .15);
      line(c, [[233, 909], [555, 754], [bx - 103, by + 94]], '#39282a', 111);
      line(c, [[399, 817], [560, 747], [bx - 107, by + 90]], '#ae774b', 3);
      ellipse(c, bx - 84, by + 82, 61, 29, '#c69d70', -.43);
      book(c, bx, by, 367, 219, mix(.24, -.13, exchange), '#593734');
      ellipse(c, bx - 139, by + 81, 33, 13, '#d2a879', -.31);
      shape(c, [[0, 822], [253, 916], [365, 1080], [0, 1080]], '#251e28');
    });
  }
  dust(c, 8, u, '#ffe6ae');
}

function portal(c, x, y, w, h, outer, band) {
  arch(c, x, y, w, h);
  c.strokeStyle = outer; c.lineWidth = w * .132; c.stroke();
  arch(c, x - 8, y - 10, w + 16, h + 9);
  c.strokeStyle = band; c.lineWidth = 3; c.stroke();
}

function gottingen(c, { k, v, u }) {
  sky(c, '#1c2d36', '#66878a', '#1b2d38');
  const cx = 1000;
  glow(c, cx, 474, 545, '#bad3c775');
  if (!k) {
    shape(c, [[0, 1080], [773, 527], [1250, 527], [1920, 1080]], '#384e56');
    for (let i = 0; i < 12; i++) {
      const d = .07 + i / 12;
      const q = (d + v * .072) ** 2;
      line(c, [[cx - 1120 * q, 537 + 520 * q], [cx + 1040 * q, 537 + 520 * q]], '#a9c0b13d', 3);
    }
    for (let i = 0; i < 6; i++) {
      const z = .16 + (5 - i) * .14 + v * .11;
      const w = 345 + z * z * 1700;
      portal(c, cx - w / 2, 518 - w * .48, w, w * .79, i < 4 ? '#30454e' : '#1c2c37', '#89a39e78');
    }
    arch(c, 909, 371, 178, 235);
    c.fillStyle = '#26353d'; c.fill();
    rect(c, 929, 444, 141, 150, '#aebbac');
    person(c, 908 + v * 36, 659 - v * 39, .46 - v * .09, { rear: true, stride: 30 * Math.sin(v * TAU), rim: '#acb6a7', color: '#202d38' });
  } else {
    const step = Math.sin(v * TAU * 1.75);
    const sweep = mix(224, -255, ease(v));
    camera(c, 1.02 + v * .16, -42 * v, 16 * v, () => {
      arch(c, 717, 108, 554, 768);
      c.fillStyle = '#aebfb1'; c.fill();
      portal(c, 716, 102, 557, 761, '#324750', '#aec1b3');
      shape(c, [[796, 261], [967, 311], [972, 851], [794, 887]], '#3d5459');
      shape(c, [[1275, 255], [1130, 302], [1131, 857], [1277, 882]], '#354c55');
      shape(c, [[0, 1001], [717, 852], [1274, 852], [1920, 999], [1920, 1080], [0, 1080]], '#293c45');
      const px = 955 + v * 97;
      const py = 552 - v * 51 - Math.abs(step) * 12;
      person(c, px, py, 1.33 - v * .47, { rear: true, stride: step * 37, rim: '#bfc5ad', color: '#27313d' });
      line(c, [[px - 42, py + 91], [px + 59, py + 212]], '#987d62', 8);
      at(c, px + 63 + step * 8, py + 233, 1 - v * .27, step * .08, () => {
        shape(c, [[-53, -35], [47, -35], [52, 45], [-52, 46]], '#4d3b37');
        line(c, [[-53, -32], [0, -4], [47, -33]], '#b39169', 3);
      });
      rect(c, sweep, -50, 345, 1150, '#152630');
      rect(c, sweep + 326, -50, 17, 1150, '#627b79');
    });
  }
  dust(c, 9, u, '#d8e4ce', 24);
}

function geometryBoard(c, { k, v, u }) {
  sky(c, '#524b42', '#a09b83', '#514f46');
  camera(c, k ? 1 + .16 * v : 1.02 + .044 * v, k ? -23 * v : 0, 0, () => {
    paper(c, 154, 62, 1612, 891, ['#b3a68a', '#e2d6b7', '#807763'], 10);
    glow(c, 974, 468, mix(972, 483, u), '#fff7d978');
    const x = 962;
    const y = 498;
    const r = k ? 295 : 278;
    line(c, [[433, y], [1486, y]], '#827b6577');
    line(c, [[x, 108], [x, 919]], '#827b6577');
    arc(c, x, y, r + 25, 0, TAU, '#655e587a', 1.5);
    if (!k) {
      const points = polygonPoints(5, x, y, r, -.5 * Math.PI + Math.PI * ease(v));
      shape(c, points, '#6a6f7025');
      line(c, [...points, points[0]], '#3c4650', 5);
      for (const point of points) {
        line(c, [[x, y], point], '#7b77748a', 1.5);
        ellipse(c, ...point, 6, 6, '#3b4650');
      }
    } else {
      const points = polygonPoints(17, x, y, r);
      for (const [i, [px, py]] of points.entries()) {
        const drop = land(v * 3.12 - i * .092);
        c.globalAlpha = drop;
        ellipse(c, px, py - (1 - drop) * 72, 4.7 + (1 - drop) * 4, 4.7, '#36454f');
      }
      c.globalAlpha = 1;
      trace(c, points, ease((v - .32) * 1.79), '#424d58', 3.5);
      text(c, '17', 1395, 321, 115, '#494d4a', { family: ROMAN, align: 'center' });
      line(c, [[1355, 390], [1435, 390]], '#867048', 2);
    }
  });
}

function construction(c, { k, v, u }) {
  sky(c, '#35242a', '#98603c', '#3a282a');
  glow(c, 1006, 476, 1032, '#e7a65a98');
  if (k === 0) {
    camera(c, 1.01 + .09 * v, 19 * v, 0, () => {
      at(c, 980, 512, 1, -.10, () => {
        paper(c, -677, -355, 1350, 712, ['#9e6a43', '#e1ba77', '#75513c'], 11);
        const fall = land(v / .42);
        arc(c, 0, 6, 297, -1.3, -1.3 + ease((v - .37) * 1.37) * TAU, '#665143', 2.6);
        ellipse(c, 0, 6, 4, 4, '#7d5138');
        ellipse(c, 43, 12, 79 - 48 * fall, 7, '#432d3b44');
        compass(c, 0, 6 - 126 * (1 - fall), 1.08, -.17 + .14 * fall, 276);
        ruler(c, 228, 178, 555, -.38);
      });
    });
  } else if (k === 1) {
    const pull = ease(v * 1.15);
    shape(c, [[0, 623], [1062, 289], [1920, 488], [1920, 1080], [0, 1080]], '#ad7848');
    shape(c, [[0, 685], [1092, 353], [1920, 510], [1920, 948], [0, 965]], gradient(c, 0, 229, 1830, 896, [[0, '#895d42'], [.50, '#e6be82'], [1, '#98724e']]));
    fibers(c, 35, 706, 1840, 211, 19, '#71503b');
    const slope = Math.tan(-.29);
    const edgeY = x => 836 + (x - 212) * slope;
    const rulerX = mix(-56, 187, pull);
    ruler(c, rulerX, edgeY(rulerX) + 4, 1510, -.29, '#8e643e');
    const x = mix(212, 1556, pull);
    const y = edgeY(x) - 14;
    line(c, [[212, edgeY(212)], [x, y + 14]], '#714934', 3.4);
    line(c, [[x + 310, y - 169], [x + 185, y - 112], [x + 58, y - 44]], '#342530', 109);
    ellipse(c, x + 62, y - 35, 69, 32, '#b98052', -.32);
    line(c, [[x, y + 14], [x + 66, y - 91]], '#3c2931', 9);
    line(c, [[x + 2, y + 13], [x + 16, y - 9]], '#e9cb94', 3);
  } else {
    const close = ease(v * 1.52);
    const expansion = ease((v - .52) * 2.6);
    const radius = mix(286, 449, expansion);
    const x = 924;
    const y = mix(491, 495, expansion);
    paper(c, 93, 31, 1738, 946, ['#986641', '#d3a16b', '#78544c'], 21);
    glow(c, x + 7, y, 687, '#ffd693be');
    arc(c, x, y, radius, 0, TAU, '#7252449d', 2);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      line(c, [[x - dx * (radius + 21), y - dy * (radius + 21)], [x + dx * (radius + 21), y + dy * (radius + 21)]], '#8e634966');
    }
    const points = polygonPoints(17, x, y, radius, -.81);
    const progress = .46 + .54 * close;
    c.save();
    c.globalAlpha = .25 * expansion;
    shape(c, points, '#d1833e');
    c.restore();
    for (const [px, py] of points) ellipse(c, px, py, 4.2, 4.2, '#6e4535');
    const endpoint = trace(c, [...points, points[0]], progress, '#4c3537', 5 + 1.1 * expansion);
    const hit = ease((v - .57) * 8) * (1 - ease((v - .69) * 4.7));
    if (hit > 0) {
      c.save(); c.globalAlpha = hit;
      glow(c, ...points[0], 158, '#fff0adce');
      ellipse(c, ...points[0], 8, 8, '#fff5bf');
      c.restore();
    }
    if (close < .995) {
      const angle = -.36 + v * .24;
      at(c, endpoint[0], endpoint[1], 1, angle, () => {
        line(c, [[0, 0], [39, -74]], '#4c383a', 7);
        ellipse(c, 55, -61, 36, 23, '#a67455', -.2);
        line(c, [[88, -70], [235, -103]], '#3d2b33', 67);
      });
    }
    c.globalAlpha = ease((v - .53) * 4);
    text(c, '1796 · 尺规可作', 1396, 752, 37, '#422e30', { family: SERIF });
    line(c, [[1398, 790], [1734, 790]], '#77513c', 2);
    c.globalAlpha = 1;
  }
  dust(c, 11, u, '#ffe8ba', 26);
}

function diary(c, { k, v, u }) {
  sky(c, '#301e25', '#76503d', '#241a24');
  if (!k) {
    const drift = 245 * v;
    for (let row = 0; row < 3; row++) {
      const y = 89 + row * 296;
      rect(c, 0, y - 15, W, 255, '#2d2025');
      for (let i = 0; i < 19; i++) {
        const n = row * 23 + i;
        const x = i * 125 - 72 - drift;
        const h = 168 + noise(n + 42) * 67;
        const w = 58 + noise(n + 21) * 53;
        at(c, x + w * .5, y + 232 - h * .5, 1, (noise(n) - .5) * .13, () => {
          rect(c, -w * .5, -h * .5, w, h, n === 32 ? '#92603e' : ['#443032', '#5f3e36', '#553638'][n % 3]);
          rect(c, -w * .5 + 6, -h * .5, 4, h, '#af80555c');
          for (const y of [-h * .33, h * .33]) line(c, [[-w * .38, y], [w * .35, y]], '#b9825377', 2);
        });
      }
      rect(c, 0, y + 229, W, 21, '#634335');
      rect(c, 0, y + 249, W, 26, '#291d25');
    }
    rect(c, 0, 0, W, H, gradient(c, 324, 0, 1550, 0, [[0, '#140f1aee'], [.43, '#170f170c'], [.54, '#f4aa672b'], [.72, '#160e19b9'], [1, '#160e19ee']]));
  } else {
    camera(c, 1.02 + .08 * v, 24 * v, -15 * v, () => {
      at(c, 955, 480, 1, -.075, () => {
        paper(c, -1015, -618, 1021, 1218, ['#a58462', '#ccb38b', '#725641'], 12);
        paper(c, 8, -618, 1065, 1218, ['#ac8861', '#e2ca9d', '#755943'], 27);
        rect(c, -115, -620, 265, 1218, gradient(c, -115, 0, 150, 0, [[0, '#52403800'], [.47, '#4e342da2'], [1, '#62403800']]));
        for (let i = 0; i < 9; i++) line(c, [[132, -140 + i * 68], [882, -140 + i * 68]], '#785b5152');
        glow(c, 221 + v * 475, -152, 570, '#fff2b06d');
        text(c, '1796.03.30', 139, -222, 103, '#49302c', { family: ROMAN, weight: 400 });
        const stroke = ease(v * 3);
        line(c, [[147, -164], [mix(147, 315, stroke), mix(-164, -168, stroke)]], '#795044', 2.2);
        quill(c, 630 + 297 * ease(v), -195 - 69 * ease(v), 1.64, -.19 + .3 * ease(v));
        const flip = ease((v - .70) * 3.5);
        if (flip > 0) {
          const edge = mix(1070, -370, flip);
          c.beginPath();
          c.moveTo(1070, -618); c.lineTo(edge, -605 + 125 * flip);
          c.quadraticCurveTo(edge - 108 * flip, -11, edge + 61 * flip, 600 - 45 * flip);
          c.lineTo(1070, 600); c.closePath();
          c.fillStyle = gradient(c, edge - 100, 0, Math.max(edge + 1, 1070), 0, [[0, '#f0d8ac'], [.37, '#c49b72'], [1, '#78503d']]); c.fill();
        }
      });
    });
  }
  dust(c, 12, u, '#ffe4b0', 26);
}

function printshop(c, { k, v, u }) {
  sky(c, '#271620', '#683232', '#241721');
  glow(c, 1158, 310, 728, '#b9694869');
  if (!k) {
    const press = ease((v - .30) * 3.1) * (1 - .48 * ease((v - .72) * 3.2));
    camera(c, 1.02 + .35 * land(v), -94 * v, 16 * v, () => {
      at(c, 955, 490, 1, -.12, () => {
        rect(c, -717, -371, 1434, 775, '#38242a');
        rect(c, -698, -350, 1396, 731, '#7c453b');
        for (let row = 0; row < 6; row++) {
          for (let col = 0; col < 13; col++) {
            const x = -672 + col * 103;
            const y = -327 + row * 115;
            rect(c, x, y, 94, 103, '#291e27');
            for (let j = 0; j < 3; j++) {
              const n = row * 223 + col * 17 + j;
              const sy = y + 18 + noise(n) * 51;
              const sx = x + j * 26 + 8;
              rect(c, sx, sy, 21, 32, '#80655d');
              rect(c, sx + 1, sy, 20, 4, '#ac8d77');
              text(c, 'aeontscru'[Math.floor(noise(n + 1.8) * 9)], sx + 11, sy + 17, 21, '#3a2b32', { family: ROMAN, align: 'center' });
            }
          }
        }
        rect(c, -682, -363, 1366, 13, '#b27354');
      });
      const py = mix(-334, 134, press);
      line(c, [[1480, -50], [1430, 307], [1445, 764]], '#2a181f', 92);
      line(c, [[1498, -55], [1459, 309], [1471, 759]], '#8d4f42', 7);
      rect(c, 977, py, 469, 161, '#49262b');
      rect(c, 951, py + 152, 517, 31, '#b86d51');
      rect(c, 891, py + 185, 620, 127, '#331d26');
      rect(c, 895, py + 291, 613, 14, '#a65b46');
      ellipse(c, 1199, 538, 307, 104, '#1e142157');
    });
  } else {
    const close = ease(v * 1.62);
    camera(c, 1.01 + .15 * v, 38 * v, -12 * v, () => {
      at(c, 932, 493, 1, -.16 + v * .08, () => {
        book(c, 0, 45, 828, 647, 0, '#583037', '#bd976e');
        c.save();
        c.translate(0, 322);
        c.scale(1, mix(.45, 1, close));
        c.translate(0, -322);
        rect(c, -418, -303, 836, 629, gradient(c, -415, 0, 420, 0, [[0, '#331e29'], [.29, '#653037'], [.66, '#843e3a'], [1, '#522934']]));
        fibers(c, -393, -282, 788, 584, 13, '#d69568');
        c.strokeStyle = '#d2a272a8'; c.lineWidth = 3;
        c.strokeRect(-372, -262, 738, 547);
        c.strokeRect(-357, -246, 707, 515);
        for (const x of [-342, 341]) for (const y of [-230, 256]) ellipse(c, x, y, 5, 5, '#d2a272');
        const band = mix(-580, 605, ease(v));
        c.save(); c.beginPath(); c.rect(-418, -303, 836, 629); c.clip();
        rect(c, band - 230, -310, 460, 655, gradient(c, band - 230, 0, band + 230, 0, [[0, '#ffd09500'], [.53, '#ffd0954a'], [1, '#ffd09500']]));
        c.restore();
        c.globalAlpha = .42 + .58 * ease((v - .13) * 2.27);
        text(c, 'DISQUISITIONES', 0, -106, 61, '#f0bf82', { family: ROMAN, align: 'center' });
        text(c, 'ARITHMETICAE', 0, -35, 60, '#f0bf82', { family: ROMAN, align: 'center' });
        line(c, [[-177, 40], [177, 40]], '#cd995f', 2);
        text(c, '1801 ·《算术研究》', 0, 111, 42, '#f6d39b', { family: SERIF, align: 'center' });
        c.restore();
      });
    });
  }
  dust(c, 13, u, '#eeb28d', 26);
}

const scenes = [lostStar, blankCoordinate, workshop, classroom, pairing, darkCircle,
  rooftop, patron, gottingen, geometryBoard, construction, diary, printshop];

export function drawActOne(ctx, f) {
  const draw = scenes[f.id - 1];
  if (!draw) return;
  ctx.save();
  try {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    draw(ctx, f);
    const vignette = ctx.createRadialGradient(960, 476, 327, 960, 476, 1126);
    vignette.addColorStop(0, '#07091100');
    vignette.addColorStop(.72, '#0709110c');
    vignette.addColorStop(1, '#07091196');
    rect(ctx, 0, 0, W, H, vignette);
    const subtitleFloor = gradient(ctx, 0, 917, 0, H, [[0, '#0a0b1100'], [.51, '#0a0b1154'], [1, '#0a0b11ca']]);
    rect(ctx, 0, 917, W, H - 917, subtitleFloor);
  } finally {
    ctx.restore();
  }
}
