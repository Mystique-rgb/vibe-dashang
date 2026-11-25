// ---------------------------------------------------------------- graphics kit
// Everything here is pure: same time in -> same pixels out.

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = (t) => Math.pow(clamp01(t), 3);
export const easeInOutCubic = (t) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const easeOutQuint = (t) => 1 - Math.pow(1 - clamp01(t), 5);
export const easeOutBack = (t, s) => {
  t = clamp01(t);
  const c = (s === undefined ? 1.7 : s) + 1;
  return 1 + c * Math.pow(t - 1, 3) + (s === undefined ? 1.7 : s) * Math.pow(t - 1, 2);
};

export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const rgba = (c, a) =>
  'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')';

// Draw a polyline progressively, as if traced by a light pen.
export function strokePartial(ctx, pts, p) {
  if (p <= 0 || pts.length < 2) return;
  if (p >= 1) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    return;
  }
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d);
    total += d;
  }
  if (total <= 0) return;
  let budget = total * p;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    if (budget <= 0) break;
    const d = seg[i - 1];
    if (budget >= d) {
      ctx.lineTo(pts[i][0], pts[i][1]);
      budget -= d;
    } else {
      const t = budget / d;
      ctx.lineTo(
        pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t,
        pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t
      );
      budget = 0;
    }
  }
  ctx.stroke();
}

// Reveal text character by character with a soft rise.
export function drawChars(ctx, text, x, y, o) {
  const font = o.font;
  const color = o.color || '#fff';
  const align = o.align || 'left';
  const tracking = o.tracking || 0;
  const progress = o.progress === undefined ? 1 : clamp01(o.progress);
  const stagger = o.stagger === undefined ? 0.05 : o.stagger;
  const rise = o.rise === undefined ? 16 : o.rise;
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const chars = Array.from(text);
  const n = chars.length;
  if (!n) return 0;
  const ws = chars.map((c) => ctx.measureText(c).width);
  let total = 0;
  for (let i = 0; i < n; i++) total += ws[i];
  total += tracking * (n - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const span = stagger * (n - 1) + 0.34;
  for (let i = 0; i < n; i++) {
    const local = clamp01((progress * span - i * stagger) / 0.34);
    if (local > 0) {
      ctx.globalAlpha = local;
      const dy = (1 - easeOutCubic(local)) * rise;
      ctx.fillStyle = color;
      ctx.fillText(chars[i], cx, y + dy);
      ctx.globalAlpha = 1;
    }
    cx += ws[i] + tracking;
  }
  return total;
}

export function measureTracked(ctx, text, font, tracking) {
  ctx.font = font;
  const chars = Array.from(text);
  let total = 0;
  for (let i = 0; i < chars.length; i++) total += ctx.measureText(chars[i]).width;
  return total + (tracking || 0) * Math.max(0, chars.length - 1);
}

// Thin technical frame + tick marks around a box.
export function brackets(ctx, x, y, w, h, len, color, lw) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw || 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
  ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
  ctx.stroke();
}
