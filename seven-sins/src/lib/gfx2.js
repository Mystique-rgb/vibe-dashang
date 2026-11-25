// Extra drawing helpers that build on gfx.js.

import { clamp01, easeOutCubic, easeOutExpo, easeInCubic, easeOutQuint, rgba, makeCanvas, rng } from './gfx.js';

export const FONT_CN = '"Noto Sans SC","Microsoft YaHei","PingFang SC","Source Han Sans SC",sans-serif';
export const FONT_SERIF = '"Noto Serif SC","Songti SC","SimSun",serif';
export const FONT_TECH = '"Bahnschrift","Arial Narrow",sans-serif';
export const FONT_MONO = 'Consolas,"Courier New",monospace';

// Text with a real glow, drawn as stacked offsets rather than shadowBlur
// (shadowBlur desaturates the glyphs badly at 1080p).
export function glowText(ctx, text, x, y, o) {
  const font = o.font;
  const color = o.color || [255, 255, 255];
  const glowColor = o.glowColor || color;
  const glow = o.glow === undefined ? 1 : o.glow;
  const align = o.align || 'center';
  const baseline = o.baseline || 'middle';
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const spread = o.spread === undefined ? 1 : o.spread;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (glow > 0) {
    // The halo must sit OUTSIDE the glyph. Stacking offset copies of the glyph
    // fills the counters and produces stripe artifacts at large sizes, so draw
    // one blurred copy first and let the solid glyph land on top of it.
    ctx.save();
    const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
    const blur = Math.max(2, size * 0.055 * spread);
    if (typeof ctx.filter === 'string') {
      ctx.filter = 'blur(' + blur.toFixed(1) + 'px)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(glowColor, 0.55 * glow * alpha);
      ctx.fillText(text, x, y);
      ctx.filter = 'none';
    } else {
      // fallback: a tight ring of copies, low alpha
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(glowColor, 0.06 * glow * alpha);
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        ctx.fillText(text, x + Math.cos(a) * blur, y + Math.sin(a) * blur);
      }
    }
    ctx.restore();
  }

  ctx.fillStyle = rgba(color, alpha);
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Reveal text char by char, optionally slamming each glyph down from a scale.
export function slamChars(ctx, text, x, y, o) {
  const font = o.font;
  const color = o.color || [255, 255, 255];
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const progress = clamp01(o.progress === undefined ? 1 : o.progress);
  const stagger = o.stagger === undefined ? 0.10 : o.stagger;
  const tracking = o.tracking || 0;
  const drop = o.drop === undefined ? 1.0 : o.drop;
  const glow = o.glow === undefined ? 1 : o.glow;
  const glowColor = o.glowColor || color;
  const align = o.align || 'center';

  ctx.save();
  ctx.font = font;
  const chars = Array.from(text);
  const n = chars.length;
  if (!n) { ctx.restore(); return 0; }
  const ws = chars.map((c) => ctx.measureText(c).width);
  let total = 0;
  for (let i = 0; i < n; i++) total += ws[i];
  total += tracking * (n - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;

  const span = stagger * (n - 1) + 0.30;
  for (let i = 0; i < n; i++) {
    const local = clamp01((progress * span - i * stagger) / 0.30);
    if (local > 0) {
      const k = easeOutExpo(local);
      const sc = 1 + (1 - k) * drop;
      const dy = (1 - k) * -0.20 * parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
      ctx.save();
      ctx.translate(cx + ws[i] / 2, y + dy);
      ctx.scale(sc, sc);
      glowText(ctx, chars[i], 0, 0, {
        font, color, glowColor, glow: glow * (1 - k * 0.4), alpha: alpha * Math.min(1, local * 2.2),
        align: 'center', baseline: 'middle',
      });
      ctx.restore();
    }
    cx += ws[i] + tracking;
  }
  ctx.restore();
  return total;
}

export function measure(ctx, text, font, tracking) {
  ctx.save();
  ctx.font = font;
  const chars = Array.from(text);
  let total = 0;
  for (const c of chars) total += ctx.measureText(c).width;
  ctx.restore();
  return total + (tracking || 0) * Math.max(0, chars.length - 1);
}

// A thin horizontal rule that draws itself outward from the centre.
export function rule(ctx, x, y, w, p, color, alpha, lw) {
  const e = easeOutCubic(clamp01(p));
  const half = (w / 2) * e;
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw || 1.5;
  ctx.beginPath();
  ctx.moveTo(x - half, y);
  ctx.lineTo(x + half, y);
  ctx.stroke();
  ctx.restore();
}

// Brackets around a box, useful for the technical HUD feel.
export function hudBrackets(ctx, x, y, w, h, len, color, alpha, lw) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw || 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
  ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
  ctx.stroke();
  ctx.restore();
}

// Radial speed lines, used on the drops.
export function speedLines(ctx, cx, cy, R0, R1, n, p, color, alpha, t, seed) {
  if (p <= 0) return;
  const r = rng(seed || 991);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.05 + t * 0.02;
    const jitter = 0.7 + r() * 0.6;
    const inner = R0 * (0.9 + r() * 0.5);
    const outer = inner + (R1 - R0) * jitter * easeOutQuint(clamp01(p));
    ctx.lineWidth = Math.max(1.0, 3.2 * jitter);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

// Vignette + grain + scanlines, cached per size.
export function makePost(W, H) {
  const vg = makeCanvas(W, H);
  const vctx = vg.getContext('2d');
  const g = vctx.createRadialGradient(W / 2, H / 2, H * 0.26, W / 2, H / 2, H * 0.98);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.58, 'rgba(0,0,0,0.30)');
  g.addColorStop(1, 'rgba(0,0,0,0.93)');
  vctx.fillStyle = g;
  vctx.fillRect(0, 0, W, H);

  const nz = makeCanvas(180, 180);
  const nctx = nz.getContext('2d');
  const img = nctx.createImageData(180, 180);
  const r = rng(4417);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 100 + r() * 155;
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  const noise = nctx.createPattern(nz, 'repeat');

  const sc = makeCanvas(4, 4);
  const sctx = sc.getContext('2d');
  sctx.fillStyle = 'rgba(0,0,0,0.60)';
  sctx.fillRect(0, 3, 4, 1);
  const scan = sctx.createPattern(sc, 'repeat');

  return function post(ctx, t, o) {
    const accent = (o && o.accent) || [200, 200, 200];
    ctx.save();
    ctx.globalAlpha = o && o.noise !== undefined ? o.noise : 0.040;
    const fr = Math.floor(t * 30);
    ctx.translate(-((fr * 37) % 180), -((fr * 91) % 180));
    ctx.fillStyle = noise;
    ctx.fillRect(0, 0, W + 180, H + 180);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.085;
    ctx.fillStyle = scan;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.drawImage(vg, 0, 0);

    ctx.fillStyle = rgba(accent, 0.14);
    ctx.fillRect(0, 0, W, 2);
    ctx.fillRect(0, H - 2, W, 2);
  };
}

// Glitch: RGB split + horizontal slice displacement. Deterministic in t.
export function glitch(ctx, canvas, amount, t, seed) {
  if (amount <= 0.001) return;
  const w = canvas.width;
  const h = canvas.height;
  const r = rng(Math.floor(t * 60) + (seed || 0));
  const slices = Math.round(3 + amount * 7);
  const tmp = glitch._tmp || (glitch._tmp = {});
  const key = w + 'x' + h;
  if (!tmp[key]) tmp[key] = makeCanvas(w, h);
  const buf = tmp[key];
  const bctx = buf.getContext('2d');
  bctx.clearRect(0, 0, w, h);
  bctx.drawImage(canvas, 0, 0);

  for (let i = 0; i < slices; i++) {
    const sy = r() * h;
    const sh = (0.01 + r() * 0.09) * h;
    const dx = (r() - 0.5) * amount * w * 0.055;
    ctx.drawImage(buf, 0, sy, w, sh, dx, sy, w, sh);
  }
  // chroma split on the whole frame
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = amount * 0.30;
  ctx.drawImage(buf, amount * 7, 0);
  ctx.globalAlpha = amount * 0.22;
  ctx.drawImage(buf, -amount * 7, 0);
  ctx.restore();
}

export { clamp01, easeOutCubic, easeOutExpo, easeInCubic, easeOutQuint, rgba };
