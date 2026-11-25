// 封面 1080x1440 (3:4) — 《传统七大自然奇观》
//
// Built to match the current video: gold accent, Everest as the hero, the same
// gradient/outline/glow title treatment, and the same bloom layer over the art.

import { makeCanvas, clamp01, rng, rgba, easeOutCubic } from './lib/gfx.js';
import { glowText, slamChars, rule, makePost, FONT_CN, FONT_TECH } from './lib/gfx2.js';
import { drawWonder } from './lib/wonders.js';
import { fancyTitle } from './lib/fancy.js';

const GOLD = [255, 179, 71];

export default function ({ root, width, height, pixelRatio }) {
  const W = width;
  const H = height;
  const DPR = Math.max(1, Math.min(2, pixelRatio || 1));
  const U = H / 1080;

  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  root.appendChild(canvas);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';

  const post = makePost(W, H);

  function render(t) {
    const c = ctx;
    c.save();

    // ---- base
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);

    const bg = c.createRadialGradient(W * 0.5, H * 0.36, 0, W * 0.5, H * 0.36, H * 0.95);
    bg.addColorStop(0, rgba(GOLD, 0.095));
    bg.addColorStop(0.45, rgba(GOLD, 0.028));
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    // ---- stars
    const sr = rng(20261118);
    for (let i = 0; i < 230; i++) {
      const x = sr() * W;
      const y = sr() * H * 0.80;
      const a = 0.10 + sr() * 0.48;
      c.fillStyle = rgba(GOLD, a);
      const s = (0.8 + sr() * 1.8) * U;
      c.fillRect(x, y, s, s);
    }

    // ---- concentric rings behind the summit
    c.save();
    c.translate(W * 0.5, H * 0.335);
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = rgba(GOLD, 0.030 + i * 0.005);
      c.lineWidth = 1.3 * U;
      c.beginPath();
      c.arc(0, 0, H * (0.22 + i * 0.088), 0, Math.PI * 2);
      c.stroke();
    }
    // tick marks on the outer ring
    c.rotate(t * 0.12);
    c.strokeStyle = rgba(GOLD, 0.14);
    c.lineWidth = 1.2 * U;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const long = i % 6 === 0;
      const r0 = H * 0.585;
      const r1 = r0 + H * (long ? 0.016 : 0.007);
      c.beginPath();
      c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();

    // ---- god rays
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(W * 0.5, H * 0.32);
    const rr = rng(913);
    for (let i = 0; i < 32; i++) {
      const base = (i / 32) * Math.PI * 2;
      const w = 0.010 + rr() * 0.026;
      const len = H * (0.30 + rr() * 0.34);
      const a = 0.032 + rr() * 0.062;
      const g = c.createLinearGradient(0, 0, Math.cos(base) * len, Math.sin(base) * len);
      g.addColorStop(0, rgba(GOLD, a));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(base - w) * len, Math.sin(base - w) * len);
      c.lineTo(Math.cos(base + w) * len, Math.sin(base + w) * len);
      c.closePath();
      c.fill();
    }
    c.restore();

    // ---- the mountain, centred and large
    const mx = W * 0.5;
    const my = H * 0.375;
    const ms = W * 1.02;
    c.save();
    c.translate(mx, my);
    drawWonder(c, {
      key: 'everest', scale: ms, accent: GOLD,
      alpha: 1, glow: 1.45, time: t, reveal: 1, detail: 1,
    });
    // bloom: wide halo + tight core, same as the video's marker #7 treatment
    c.save();
    c.globalCompositeOperation = 'lighter';
    if (typeof c.filter === 'string') {
      c.filter = 'blur(' + (H * 0.030).toFixed(1) + 'px)';
    }
    c.globalAlpha = 1.25;
    drawWonder(c, { key: 'everest', scale: ms, accent: GOLD, alpha: 1, glow: 0, time: t, reveal: 1, detail: 1 });
    c.filter = 'none';
    c.restore();
    c.save();
    c.globalCompositeOperation = 'lighter';
    if (typeof c.filter === 'string') {
      c.filter = 'blur(' + (H * 0.007).toFixed(1) + 'px)';
    }
    c.globalAlpha = 0.95;
    drawWonder(c, { key: 'everest', scale: ms, accent: GOLD, alpha: 1, glow: 0, time: t, reveal: 1, detail: 1 });
    c.filter = 'none';
    c.restore();
    c.restore();

    // a breathing flare at the summit
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const fg = c.createRadialGradient(mx, my - H * 0.155, 0, mx, my - H * 0.155, W * 0.40);
    fg.addColorStop(0, rgba(GOLD, 0.26 * (0.6 + 0.4 * pulse)));
    fg.addColorStop(0.5, rgba(GOLD, 0.08));
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = fg;
    c.beginPath();
    c.arc(mx, my - H * 0.155, W * 0.40, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // ---- scrim so the type reads over the art
    const sc = c.createLinearGradient(0, H * 0.50, 0, H);
    sc.addColorStop(0, 'rgba(0,0,0,0)');
    sc.addColorStop(0.30, 'rgba(0,0,0,0.78)');
    sc.addColorStop(1, 'rgba(0,0,0,0.97)');
    c.fillStyle = sc;
    c.fillRect(0, H * 0.50, W, H * 0.50);

    const cx = W * 0.5;

    // ---- type block
    glowText(c, '世 界 七 大 自 然 奇 观', cx, H * 0.615, {
      font: '500 ' + Math.round(H * 0.0215) + 'px ' + FONT_CN,
      color: GOLD, alpha: 0.94, glow: 0.55, spread: 0.9,
    });

    fancyTitle(c, '地球之巅', cx, H * 0.652, {
      font: '900 ' + Math.round(H * 0.0980) + 'px ' + FONT_CN,
      accent: GOLD, glow: 2.2, tracking: H * 0.008, align: 'center',
    });

    glowText(c, '8,848.86 M', cx, H * 0.742, {
      font: '700 ' + Math.round(H * 0.0580) + 'px ' + FONT_TECH,
      color: [255, 255, 255], alpha: 1, glow: 0.85, spread: 1.0,
    });

    glowText(c, 'THE  SEVEN  NATURAL  WONDERS', cx, H * 0.792, {
      font: '400 ' + Math.round(H * 0.0160) + 'px ' + FONT_TECH,
      color: GOLD, alpha: 0.86, glow: 0.32, spread: 0.8,
    });

    rule(c, cx, H * 0.822, W * 0.30, 1, GOLD, 0.52, 2.0 * U);

    glowText(c, '珠峰 · 贝加尔湖 · 黄石 · 冰河湾 · 猛犸洞 · 维多利亚瀑布 · 科罗拉多大峡谷',
             cx, H * 0.852, {
      font: '400 ' + Math.round(H * 0.0126) + 'px ' + FONT_CN,
      color: [214, 210, 228], alpha: 0.66, glow: 0.12, spread: 0.5,
    });


    c.restore();

    post(c, t, { accent: GOLD, noise: 0.030 });
  }

  return {
    prepareFrame(time) { render(Math.max(0, time)); },
    dispose() { canvas.remove(); },
  };
}
