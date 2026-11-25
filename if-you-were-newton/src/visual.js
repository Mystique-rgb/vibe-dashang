export const W = 1920;
export const H = 1080;
export const clamp = (x, min = 0, max = 1) => Math.max(min, Math.min(max, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = x => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export function hash(n) {
  const value = Math.imul(Math.floor(n) ^ 0x27d4eb2d, 0x85ebca6b);
  return ((value ^ (value >>> 13)) >>> 0) / 4294967296;
}
export function path(ctx, points, fill = null, stroke = null, width = 1, closed = true) {
  if (!points.length) return;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  if (closed) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
export const line = (ctx, points, stroke, width = 2) => path(ctx, points, null, stroke, width, false);
export function ellipse(ctx, x, y, rx, ry, fill, stroke = null, width = 1) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, 2 * Math.PI);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}
export function radial(ctx, x, y, r, stops) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  return gradient;
}
export function camera(ctx, x, y, scale = 1, rotation = 0) {
  ctx.translate(W / 2, H / 2);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.translate(-x, -y);
}
export function light(ctx, x, y, r, rgb = '255,176,93', power = .2) {
  const strength = clamp(power);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = radial(ctx, x, y, r, [[0, `rgba(${rgb},${strength})`], [.27, `rgba(${rgb},${strength * .42})`], [1, `rgba(${rgb},0)`]]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
export function beam(ctx, points, rgb = '255,176,93', power = .17) {
  if (points.length < 3) return;
  const [sx, sy] = points[0];
  const [ex, ey] = points.at(-2);
  const tone = ctx.createLinearGradient(sx, sy, ex, ey === sy && ex === sx ? ey + 1 : ey);
  tone.addColorStop(0, `rgba(${rgb},${clamp(power)})`);
  tone.addColorStop(.49, `rgba(${rgb},${clamp(power) * .33})`);
  tone.addColorStop(1, `rgba(${rgb},0)`);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  path(ctx, points, tone);
  ctx.restore();
}
export function paper(ctx, x, y, w, h, seed = 1) {
  const edge = [[x + 2, y + 4], [x + w * .62, y], [x + w - 7, y + 3], [x + w, y + h * .6], [x + w - 5, y + h - 2], [x + w * .34, y + h], [x, y + h - 4]];
  const tone = ctx.createLinearGradient(x, y, x + w, y + h);
  tone.addColorStop(0, '#dbc29a');
  tone.addColorStop(.4, '#c4a074');
  tone.addColorStop(1, '#765238');
  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 10;
  ctx.shadowColor = '#10090b99';
  path(ctx, edge, tone, '#ebbc8266', 1.1);
  ctx.restore();
  const count = Math.min(34, Math.round(h / 8));
  for (let i = 0; i < count; i++) {
    const px = x + w * (.04 + hash(seed + i * 13 + 21) * .88);
    const py = y + h * (.035 + hash(seed + i * 13 + 54) * .91);
    line(ctx, [[px, py], [px + (2 + 20 * hash(seed + i * 13 + 9)) * w / 400, py + .7]], '#63433338', 1);
  }
}
export function label(ctx, text, x, y, size, color, align = 'left') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 ${size}px "Noto Serif SC", "SimSun", Georgia, serif`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function figure(ctx, x, y, height, options = {}) {
  const { facing = 1, pose = 'side', tone = '#422e29', young = false, hat = false, time = 0 } = options;
  const walk = options.walk ? Math.sin(time * 8) * .12 : 0;
  const side = pose === 'side';
  const back = pose === 'back';
  const s = height / 340;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * facing, s);
  ellipse(ctx, 2, -3, 61, 11, '#08070a66');
  const edge = '#d79b5a89';
  path(ctx, [[-40, -111], [-6, -116], [-12, -21], [-2, -4], [-44 - walk * 90, -4], [-44 - walk * 54, -20]], '#171317', edge, 1.2);
  path(ctx, [[3, -115], [38, -114], [39 + walk * 55, -27], [55 + walk * 78, -6], [8 + walk * 54, -6], [9, -22]], '#21191c', edge, 1.2);
  const coat = ctx.createLinearGradient(-74, -248, 62, -140);
  coat.addColorStop(0, '#221818');
  coat.addColorStop(.42, tone);
  coat.addColorStop(1, '#171419');
  path(ctx, [[-20, -264], [-58, -247], [-74, -204], [-62, -152], [-65, -105], [-39, -94], [-13, -108], [28, -100], [61, -108], [49, -162], [67, -218], [42, -250], [19, -267]], coat, edge, 1.7);
  line(ctx, [[-44, -243], [-35, -210], [-48, -178], [-54, -141], [-47, -113]], '#ffd6a322', 2.5);
  line(ctx, [[33, -246], [45, -219], [30, -177], [28, -131], [45, -112]], '#edb5802e', 2.5);
  for (let n = 0; n < 11; n++) {
    const py = -235 + n * 10;
    line(ctx, [[-58 + n * 1.6, py], [-33 + n * 1.4, py + 8]], '#d29b7134', 1);
  }
  if (!back) {
    path(ctx, [[-22, -270], [-29, -248], [11, -224], [10, -253], [27, -267]], '#cbb99b', '#e6c59d66', 1.4);
    path(ctx, [[-27, -250], [3, -216], [17, -232], [2, -254]], '#a28c70', '#e6c59d66', 1.4);
    for (let i = 0; i < 5; i++) ellipse(ctx, 18 + i * 1.2, -214 + i * 15, 2.4, 2.4, '#cba079a6');
  } else line(ctx, [[0, -234], [-6, -175], [1, -112]], '#c0885d59', 2);
  path(ctx, [[-51, -238], [-63, -193], [-50, -172], [-32 + walk * 26, -145], [-22 + walk * 22, -151], [-36, -185], [-31, -220]], tone, edge, 1.2);
  path(ctx, [[43, -241], [58, -223], [54, -186], [34 - walk * 32, -151], [23 - walk * 30, -156], [30, -188], [27, -225]], tone, edge, 1.2);
  ellipse(ctx, -27 + walk * 22, -148, 8, 11, '#866653', '#e7b68b80', 1.2);
  ellipse(ctx, 28 - walk * 26, -151, 7, 11, '#8e674d', '#e7b68b70', 1);
  const hair = ctx.createLinearGradient(-49, -318, 42, -305);
  hair.addColorStop(0, '#261a1b');
  hair.addColorStop(.44, young ? '#78503a' : '#634b43');
  hair.addColorStop(1, '#292125');
  ctx.beginPath();
  ctx.moveTo(-40, -265);
  ctx.bezierCurveTo(-45, -283, -48, -311, -31, -326);
  ctx.bezierCurveTo(-14, -352, 35, -341, 40, -320);
  ctx.bezierCurveTo(43, -297, 57, -284, 41, -259);
  ctx.bezierCurveTo(23, -247, 11, -263, -1, -254);
  ctx.bezierCurveTo(-11, -247, -23, -262, -40, -265);
  ctx.fillStyle = hair;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  if (!back) {
    const face = ctx.createLinearGradient(-23, -294, 42, -304);
    face.addColorStop(0, '#4e3934');
    face.addColorStop(.62, '#a68160');
    face.addColorStop(1, '#dcb08a');
    const profile = side ? [[9,-328],[24,-319],[28,-305],[42,-290],[32,-286],[31,-276],[23,-268],[11,-265],[-3,-272],[-13,-286],[-9,-311]] : [[-29,-321],[-14,-329],[26,-324],[32,-303],[27,-283],[12,-268],[-11,-268],[-26,-284]];
    path(ctx, profile, face, '#ebbe9066', 1.2);
    line(ctx, side ? [[15,-304],[24,-305],[29,-302]] : [[-19,-302],[-11,-305],[-3,-303],[7,-303],[18,-306],[23,-303]], '#342222', 2);
    if (!side) line(ctx, [[2,-304],[1,-289],[8,-287]], '#614132', 1.7);
    line(ctx, side ? [[22,-280],[29,-281]] : [[-6,-279],[12,-280]], '#422b29', 2);
  }
  for (let n = 0; n < (back ? 17 : 10); n++) {
    const sx = -38 + n * (back ? 4.6 : 3.3);
    const swing = 5 + hash(801 + n) * 8;
    ctx.beginPath();
    ctx.moveTo(sx, -320 + (sx / 13) ** 2);
    ctx.bezierCurveTo(sx - swing, -303, sx + swing, -284, sx - 2, -265 + n % 3 * 2);
    ctx.strokeStyle = n % 3 === 0 ? '#dfab784e' : '#110d0f76';
    ctx.lineWidth = n % 3 === 0 ? 1.2 : 2;
    ctx.stroke();
  }
  if (hat) path(ctx, [[-67,-313],[-32,-329],[-9,-349],[20,-339],[30,-324],[66,-320],[51,-309],[-29,-305]], '#222023', edge, 1.8);
  ctx.restore();
}
export function candle(ctx, x, y, height, time) {
  const flame = Math.sin(time * 11.3) * 1.9 + Math.cos(time * 6.7) * 1.1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(height / 100, height / 100);
  ellipse(ctx, 0, 0, 32, 5.5, '#20151a', '#a8714680', 1.7);
  path(ctx, [[-24,-2],[-9,-9],[-8,-20],[8,-20],[10,-9],[24,-2]], '#4f3027', '#d68a526b', 1.5);
  const wax = ctx.createLinearGradient(-10, -20, 10, -20);
  wax.addColorStop(0, '#806049');
  wax.addColorStop(.53, '#b2986f');
  wax.addColorStop(1, '#ead0a4');
  ctx.fillStyle = wax;
  ctx.fillRect(-10, -82, 20, 65);
  line(ctx, [[-2,-82],[0,-92]], '#33231e', 2.5);
  light(ctx, 0, -97, 84, '255,163,73', .19);
  ctx.beginPath();
  ctx.moveTo(-5, -93);
  ctx.bezierCurveTo(-11, -100, flame - 2, -108, flame + 3, -117);
  ctx.bezierCurveTo(3, -108, 11, -100, 4, -93);
  ctx.fillStyle = '#ffdb99';
  ctx.fill();
  ellipse(ctx, 0, -97, 2.6, 5.2, '#fff2bb');
  ctx.restore();
}
