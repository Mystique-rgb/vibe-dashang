// 《七宗罪》卡片 · 傲慢 — 3.2s / 1920x1080 / 30fps
//
// 复刻自 QQ 收到的 5.2s 七宗罪卡片轮播视频（1920x1080/30fps），
// 单独抽出「傲慢」这张卡做成完整动效版本。
//
// 版式实测（从参照帧量出来的，不是目测）：
//   标题「傲慢」      x 14.9-42.4%   y 36.0-58.8%   字高 22.8%H
//   序号 01/07       x 25.2-31.8%   y 28.7-30.9%
//   拉丁 SUPERVIA     x 19.8-38.2%   y 62.3-65.3%
//   人物剪影          x 60.4-91.9%   y  8.0-77.9%   （96 点轮廓，IoU 0.996）
//   光环圆心          (0.715, 0.350)  半径 0.148W
//
// prepareFrame(time) 是时间的纯函数。

import { clamp01, lerp, smoothstep, easeOutCubic, easeOutQuint, rng, rgba, makeCanvas } from './lib/gfx.js';
import { FIGURE } from './lib/figure-data.js';

const TAU = Math.PI * 2;

// ------------------------------------------------------------------ 调色板
const PAL = {
  bgCore:  [11, 7, 17],
  bgMid:   [38, 30, 58],
  bgOuter: [26, 20, 38],
  ring:    [150, 120, 255],
  ringHot: [210, 190, 255],
  text:    [218, 207, 255],
  textDim: [140, 124, 190],
  gold:    [232, 196, 120],
  black:   [6, 4, 10],
};

const LAYOUT = {
  index: { x: 0.252, y: 0.309, size: 0.021 },
  title: { x: 0.149, y: 0.588, size: 0.300 },
  latin: { x: 0.198, y: 0.653, size: 0.030 },
};

const RING = { cx: 0.715, cy: 0.350, r: 0.148 };

const T = {
  bgIn:    [0.00, 0.22],
  ringIn:  [0.04, 0.80],
  figIn:   [0.16, 1.05],
  indexIn: [0.50, 0.82],
  titleIn: [0.62, 1.28],
  latinIn: [1.05, 1.38],
};

const p = (t, span) => clamp01((t - span[0]) / (span[1] - span[0]));

// ------------------------------------------------------------------ 背景
function drawBackground(c, W, H) {
  const g = c.createRadialGradient(RING.cx * W, RING.cy * H, 0,
                                   RING.cx * W, RING.cy * H, W * 0.62);
  g.addColorStop(0.00, rgba(PAL.bgCore, 1));
  g.addColorStop(0.28, rgba(PAL.bgMid, 1));
  g.addColorStop(0.62, rgba(PAL.bgOuter, 1));
  g.addColorStop(1.00, 'rgba(2,1,4,1)');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);

  const vg = c.createRadialGradient(W * 0.5, H * 0.5, W * 0.25, W * 0.5, H * 0.5, W * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.86)');
  c.fillStyle = vg;
  c.fillRect(0, 0, W, H);
}

function drawStars(c, W, H, t, alpha) {
  if (alpha <= 0.001) return;
  const r = rng(90210);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 55; i++) {
    const bx = r(), by = r(), bz = r();
    const x = ((bx + t * 0.006 * (0.3 + bz)) % 1) * W;
    const y = by * H;
    const tw = 0.45 + 0.55 * Math.sin(t * 1.7 + i * 2.1);
    const a = alpha * (0.10 + bz * 0.30) * tw;
    c.fillStyle = rgba(PAL.ringHot, a);
    c.beginPath();
    c.arc(x, y, 0.8 + bz * 2.0, 0, TAU);
    c.fill();
  }
  c.restore();
}

function drawRing(c, W, H, t, prog, glow) {
  if (prog <= 0) return;
  const cx = RING.cx * W, cy = RING.cy * H;
  const R = RING.r * W;
  const sweep = easeOutCubic(prog) * TAU;

  c.save();
  c.globalCompositeOperation = 'lighter';

  const ringGrad = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  ringGrad.addColorStop(0.00, rgba(PAL.ring, 0.35));
  ringGrad.addColorStop(0.45, rgba(PAL.ringHot, 0.95));
  ringGrad.addColorStop(1.00, rgba(PAL.ring, 0.30));

  c.filter = 'blur(' + (10 + glow * 8) + 'px)';
  c.strokeStyle = rgba(PAL.ring, 0.55);
  c.lineWidth = 9;
  c.beginPath();
  c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + sweep);
  c.stroke();
  c.filter = 'none';

  c.strokeStyle = ringGrad;
  c.lineWidth = 3.2;
  c.beginPath();
  c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + sweep);
  c.stroke();

  c.strokeStyle = rgba(PAL.ring, 0.42 * prog);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(cx, cy, R * 0.86, Math.PI / 2 - sweep * 0.8, Math.PI / 2);
  c.stroke();

  const tickAlpha = smoothstep(0.55, 1.0, prog);
  if (tickAlpha > 0.01) {
    c.strokeStyle = rgba(PAL.ringHot, 0.42 * tickAlpha);
    c.lineWidth = 1.4;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * TAU - Math.PI / 2;
      const long = i % 3 === 0;
      const r0 = R * (long ? 1.035 : 1.055);
      const r1 = R * (long ? 1.10 : 1.085);
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      c.stroke();
    }
  }

  if (prog > 0.7) {
    const flow = (t * 0.30) % 1;
    const fa = -Math.PI / 2 + flow * TAU;
    const fx = cx + Math.cos(fa) * R;
    const fy = cy + Math.sin(fa) * R;
    const fg = c.createRadialGradient(fx, fy, 0, fx, fy, 26);
    fg.addColorStop(0, rgba(PAL.ringHot, 0.85));
    fg.addColorStop(0.4, rgba(PAL.ring, 0.35));
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = fg;
    c.beginPath();
    c.arc(fx, fy, 26, 0, TAU);
    c.fill();
  }

  c.restore();
}

function drawRays(c, W, H, t, alpha) {
  if (alpha <= 0.002) return;
  const cx = RING.cx * W, cy = RING.cy * H;
  const R = RING.r * W;
  const r = rng(31337);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const base = (i / 26) * TAU + r() * 0.06;
    const w = 0.006 + r() * 0.016;
    const len = R * (1.25 + r() * 0.85);
    const a = alpha * (0.05 + r() * 0.16) * (0.6 + 0.4 * Math.sin(t * 0.9 + i));
    const g = c.createLinearGradient(cx + Math.cos(base) * R * 1.02, cy + Math.sin(base) * R * 1.02,
                                     cx + Math.cos(base) * len, cy + Math.sin(base) * len);
    g.addColorStop(0, rgba(PAL.ring, a));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(cx + Math.cos(base - w) * R * 1.02, cy + Math.sin(base - w) * R * 1.02);
    c.lineTo(cx + Math.cos(base - w * 0.3) * len, cy + Math.sin(base - w * 0.3) * len);
    c.lineTo(cx + Math.cos(base + w * 0.3) * len, cy + Math.sin(base + w * 0.3) * len);
    c.lineTo(cx + Math.cos(base + w) * R * 1.02, cy + Math.sin(base + w) * R * 1.02);
    c.closePath();
    c.fill();
  }
  c.restore();
}

// 把折线点转成平滑闭合曲线：用二次贝塞尔在相邻点中点处连接
function traceSmooth(c, pts, W, H) {
  const n = pts.length;
  const px = (i) => pts[((i % n) + n) % n][0] * W;
  const py = (i) => pts[((i % n) + n) % n][1] * H;
  c.beginPath();
  c.moveTo((px(0) + px(n - 1)) / 2, (py(0) + py(n - 1)) / 2);
  for (let i = 0; i < n; i++) {
    const cx = px(i), cy = py(i);
    const mx = (px(i) + px(i + 1)) / 2;
    const my = (py(i) + py(i + 1)) / 2;
    c.quadraticCurveTo(cx, cy, mx, my);
  }
  c.closePath();
}

function drawFigure(c, W, H, t, prog, glow) {
  if (prog <= 0) return;
  const pts = FIGURE;
  const reveal = easeOutCubic(prog);

  c.save();
  traceSmooth(c, pts, W, H);

  c.fillStyle = rgba(PAL.black, 0.96 * reveal);
  c.fill();

  // 边缘光：先模糊铺一层体积感，再压一道细亮芯
  c.globalCompositeOperation = 'lighter';
  c.filter = 'blur(' + (10 + glow * 8) + 'px)';
  c.strokeStyle = rgba(PAL.ring, 0.62 * prog);
  c.lineWidth = 12;
  c.stroke();
  c.filter = 'none';

  c.strokeStyle = rgba(PAL.ringHot, 0.80 * prog);
  c.lineWidth = 1.6;
  c.stroke();

  c.restore();
}

function drawTitle(c, W, H, t, prog) {
  if (prog <= 0) return;
  const size = LAYOUT.title.size * H;
  const chars = ['傲', '慢'];
  const x0 = LAYOUT.title.x * W;
  const y = LAYOUT.title.y * H;
  const font = '900 ' + size + 'px "Noto Sans SC","Microsoft YaHei",system-ui,sans-serif';

  c.save();
  c.font = font;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  const ws = chars.map(ch => c.measureText(ch).width);
  const gap = size * 0.06;

  let cx = x0;
  for (let i = 0; i < chars.length; i++) {
    const local = clamp01((prog * 2.0 - i * 0.55) / 0.9);
    if (local > 0) {
      const dy = (1 - easeOutQuint(local)) * size * 0.35;
      const sc = lerp(1.18, 1.0, easeOutCubic(local));
      c.save();
      c.globalAlpha = local;
      c.translate(cx + ws[i] / 2, y + dy);
      c.scale(sc, sc);
      c.translate(-ws[i] / 2, 0);

      c.globalCompositeOperation = 'lighter';
      c.filter = 'blur(' + (size * 0.09) + 'px)';
      c.fillStyle = rgba(PAL.ring, 0.75 * local);
      c.fillText(chars[i], 0, 0);
      c.filter = 'none';

      c.globalCompositeOperation = 'source-over';
      const tg = c.createLinearGradient(0, -size * 0.78, 0, 0);
      tg.addColorStop(0, '#FFFFFF');
      tg.addColorStop(0.42, '#E8DEFF');
      tg.addColorStop(1, '#B9A6F0');
      c.fillStyle = tg;
      c.fillText(chars[i], 0, 0);
      c.restore();
    }
    cx += ws[i] + gap;
  }
  c.restore();
}

function drawIndex(c, W, H, t, prog) {
  if (prog <= 0) return;
  const size = LAYOUT.index.size * H;
  c.save();
  c.globalAlpha = prog;
  c.font = '600 ' + size + 'px "Inter","Helvetica Neue",system-ui,sans-serif';
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const x = LAYOUT.index.x * W;
  const y = LAYOUT.index.y * H;

  c.fillStyle = rgba(PAL.textDim, 0.95);
  c.fillText('01', x, y);
  const w1 = c.measureText('01').width;
  c.fillStyle = rgba(PAL.textDim, 0.55);
  c.fillText(' / ', x + w1, y);
  const w2 = c.measureText(' / ').width;
  c.fillStyle = rgba(PAL.ringHot, 0.95);
  c.fillText('07', x + w1 + w2, y);

  const lw = (w1 + w2 + c.measureText('07').width) * prog;
  c.strokeStyle = rgba(PAL.ring, 0.5);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x, y + size * 0.42);
  c.lineTo(x + lw, y + size * 0.42);
  c.stroke();
  c.restore();
}

function drawLatin(c, W, H, t, prog) {
  if (prog <= 0) return;
  const size = LAYOUT.latin.size * H;
  const text = 'SUPERVIA';
  const track = size * 0.42;
  c.save();
  c.font = '500 ' + size + 'px "Inter","Helvetica Neue",system-ui,sans-serif';
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const chars = Array.from(text);
  const ws = chars.map(ch => c.measureText(ch).width);
  let total = 0;
  for (const w of ws) total += w;
  total += track * (chars.length - 1);
  let cx = LAYOUT.latin.x * W;
  const y = LAYOUT.latin.y * H;
  for (let i = 0; i < chars.length; i++) {
    const local = clamp01((prog * 3.2 - i * 0.16) / 0.7);
    if (local > 0) {
      c.globalAlpha = local * 0.92;
      c.fillStyle = rgba(PAL.textDim, 1);
      c.fillText(chars[i], cx, y);
    }
    cx += ws[i] + track;
  }
  c.globalAlpha = prog * 0.6;
  c.strokeStyle = rgba(PAL.ring, 0.55);
  c.lineWidth = 1.2;
  const ly = y - size * 0.32;
  const pad = size * 0.7;
  const lp = easeOutCubic(clamp01((prog - 0.3) / 0.7));
  c.beginPath();
  c.moveTo(LAYOUT.latin.x * W - pad * lp, ly);
  c.lineTo(LAYOUT.latin.x * W - pad * lp + size * 0.55 * lp, ly);
  c.moveTo(LAYOUT.latin.x * W + total + pad * lp, ly);
  c.lineTo(LAYOUT.latin.x * W + total + pad * lp - size * 0.55 * lp, ly);
  c.stroke();
  c.restore();
}

// 上升余烬：从人物底部往上飘的紫色光点
function drawEmbers(c, W, H, t, alpha) {
  if (alpha <= 0.002) return;
  const r = rng(77001);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 44; i++) {
    const bx = r(), by = r(), bs = r(), bph = r();
    const speed = 0.045 + bs * 0.075;
    const life = ((t * speed + by) % 1);
    const y = H * (1.02 - life * 0.92);
    const drift = Math.sin(t * 1.1 + bph * 6.28) * W * 0.012;
    const x = bx * W + drift;
    const fade = Math.sin(life * Math.PI);
    const a = alpha * fade * (0.16 + bs * 0.44);
    const rad = (0.9 + bs * 2.4) * (1 + life * 0.6);
    c.fillStyle = rgba(bs > 0.72 ? PAL.ringHot : PAL.ring, a);
    c.beginPath();
    c.arc(x, y, rad, 0, TAU);
    c.fill();
  }
  c.restore();
}

// 横向光扫：一道细长的斜向高光掠过人物
function drawSweep(c, W, H, t, alpha) {
  if (alpha <= 0.002) return;
  const cycle = 2.6;
  const ph = ((t - 1.3) % cycle) / cycle;
  if (ph < 0 || ph > 1) return;
  const fade = Math.sin(ph * Math.PI);
  if (fade <= 0.01) return;

  const x = -W * 0.35 + ph * W * 1.7;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(x, H * 0.46);
  c.rotate(-0.30);
  const g = c.createLinearGradient(-W * 0.10, 0, W * 0.10, 0);
  g.addColorStop(0.00, 'rgba(0,0,0,0)');
  g.addColorStop(0.46, rgba(PAL.ringHot, 0.075 * alpha * fade));
  g.addColorStop(0.52, rgba(PAL.ringHot, 0.16 * alpha * fade));
  g.addColorStop(0.58, rgba(PAL.ringHot, 0.075 * alpha * fade));
  g.addColorStop(1.00, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(-W * 0.10, -H * 0.75, W * 0.20, H * 1.5);
  c.restore();
}

function drawGold(c, W, H, t, prog) {
  if (prog <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const gx = 0.723 * W, gy = 0.185 * H;
  const s = W * 0.030;
  c.globalAlpha = prog * (0.75 + 0.25 * Math.sin(t * 2.2));

  c.fillStyle = rgba(PAL.gold, 0.9);
  c.beginPath();
  c.moveTo(gx - s, gy + s * 0.55);
  c.lineTo(gx - s * 0.62, gy - s * 0.42);
  c.lineTo(gx - s * 0.22, gy + s * 0.12);
  c.lineTo(gx, gy - s * 0.72);
  c.lineTo(gx + s * 0.22, gy + s * 0.12);
  c.lineTo(gx + s * 0.62, gy - s * 0.42);
  c.lineTo(gx + s, gy + s * 0.55);
  c.closePath();
  c.fill();

  const nx = 0.702 * W, ny = 0.545 * H;
  const ns = W * 0.011;
  c.fillStyle = rgba(PAL.gold, 0.85);
  c.beginPath();
  c.moveTo(nx, ny - ns);
  c.lineTo(nx + ns * 0.66, ny);
  c.lineTo(nx, ny + ns);
  c.lineTo(nx - ns * 0.66, ny);
  c.closePath();
  c.fill();

  c.restore();
}

// ------------------------------------------------------------------ 场景
export default function ({ root }) {
  root.style.cssText += ';margin:0;overflow:hidden;background:#000';

  const cv = makeCanvas(1920, 1080);
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  root.append(cv);
  const c = cv.getContext('2d');

  return {
    prepareFrame(time) {
      const W = cv.width, H = cv.height;
      const t = time;

      const bgA = p(t, T.bgIn);
      c.save();
      c.globalAlpha = bgA;
      drawBackground(c, W, H);
      c.restore();

      drawStars(c, W, H, t, p(t, [0.15, 0.90]));
      drawRays(c, W, H, t, p(t, [0.75, 1.60]) * 0.85);

      const ringP = p(t, T.ringIn);
      const glow = 0.5 + 0.5 * Math.sin(t * 1.4);
      drawRing(c, W, H, t, ringP, glow);
      // 光扫在人物之前画，剪影会遮住它，避免光穿过人物
      const live0 = p(t, [1.30, 1.70]);
      if (live0 > 0) drawSweep(c, W, H, t, live0);
      drawFigure(c, W, H, t, p(t, T.figIn), glow);
      drawGold(c, W, H, t, p(t, [1.10, 1.55]));

      drawIndex(c, W, H, t, p(t, T.indexIn));
      drawTitle(c, W, H, t, p(t, T.titleIn));
      drawLatin(c, W, H, t, p(t, T.latinIn));

      // 持续动效：上升余烬 + 微呼吸
      const live = p(t, [1.30, 1.70]);
      if (live > 0) {
        drawEmbers(c, W, H, t, live);
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = rgba(PAL.ring, 0.014 * live * (0.6 + 0.4 * Math.sin(t * 1.9)));
        c.fillRect(0, 0, W, H);
        c.restore();
      }
    },
    dispose() { cv.remove(); },
  };
}
