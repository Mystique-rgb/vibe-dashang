// 封面 1080x1440 (3:4) — 《中华七大国宝》
// 主视觉：大盂鼎（压轴件），沿用视频里的金色线框 + 发光排版。

import { makeCanvas, clamp01, rng, rgba } from './lib/gfx.js';
import { glowText, rule, makePost, FONT_CN, FONT_TECH } from './lib/gfx2.js';
import { drawArtifact } from './lib/artifacts.js';
import { fancyTitle } from './lib/fancy.js';

const GOLD = [255, 181, 88];

export default function ({ root, width, height, pixelRatio }) {
  const W = width;
  const H = height;
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

    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);

    const bg = c.createRadialGradient(W * 0.5, H * 0.34, 0, W * 0.5, H * 0.34, H * 0.86);
    bg.addColorStop(0, rgba(GOLD, 0.115));
    bg.addColorStop(0.42, rgba(GOLD, 0.032));
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    // ---- dust motes
    const sr = rng(20261118);
    for (let i = 0; i < 260; i++) {
      const x = sr() * W;
      const y = sr() * H * 0.74;
      const a = 0.09 + sr() * 0.44;
      c.fillStyle = rgba(GOLD, a);
      const s = (0.8 + sr() * 1.9) * U;
      c.fillRect(x, y, s, s);
    }

    // ---- concentric rings behind the vessel
    c.save();
    c.translate(W * 0.5, H * 0.335);
    for (let i = 0; i < 5; i++) {
      c.strokeStyle = rgba(GOLD, 0.034 + i * 0.006);
      c.lineWidth = 1.4 * U;
      c.beginPath();
      c.arc(0, 0, H * (0.155 + i * 0.062), 0, Math.PI * 2);
      c.stroke();
    }
    c.rotate(t * 0.10);
    c.strokeStyle = rgba(GOLD, 0.15);
    c.lineWidth = 1.2 * U;
    for (let i = 0; i < 84; i++) {
      const a = (i / 84) * Math.PI * 2;
      const long = i % 7 === 0;
      const r0 = H * 0.428;
      const r1 = r0 + H * (long ? 0.015 : 0.0065);
      c.beginPath();
      c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();

    // ---- god rays
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.translate(W * 0.5, H * 0.31);
    const rr = rng(917);
    for (let i = 0; i < 30; i++) {
      const base = (i / 30) * Math.PI * 2;
      const w = 0.010 + rr() * 0.024;
      const len = H * (0.26 + rr() * 0.30);
      const a = 0.030 + rr() * 0.055;
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

    // ---- 大盂鼎 as the hero
    const mx = W * 0.5;
    const my = H * 0.352;
    const ms = W * 0.80;
    const art = { color: '#ffb558', duration: 1, hero: true, time: t, reveal: 1, detail: 1, boost: 1.12 };
    c.save();
    c.translate(mx, my);
    drawArtifact(c, 6, 0, 0, ms, 1, art);
    // bloom: wide halo then tight core, same as the video's hero treatment
    c.save();
    c.globalCompositeOperation = 'lighter';
    if (typeof c.filter === 'string') c.filter = 'blur(' + (H * 0.028).toFixed(1) + 'px)';
    c.globalAlpha = 1.15;
    drawArtifact(c, 6, 0, 0, ms, 1, { ...art, ghost: true });
    c.filter = 'none';
    c.restore();
    c.save();
    c.globalCompositeOperation = 'lighter';
    if (typeof c.filter === 'string') c.filter = 'blur(' + (H * 0.006).toFixed(1) + 'px)';
    c.globalAlpha = 0.85;
    drawArtifact(c, 6, 0, 0, ms, 1, { ...art, ghost: true });
    c.filter = 'none';
    c.restore();
    c.restore();

    // ---- breathing flare on the mouth of the ding
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.1);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const fx = mx;
    const fy = my - H * 0.088;
    const fg = c.createRadialGradient(fx, fy, 0, fx, fy, W * 0.42);
    fg.addColorStop(0, rgba(GOLD, 0.24 * (0.62 + 0.38 * pulse)));
    fg.addColorStop(0.46, rgba(GOLD, 0.07));
    fg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = fg;
    c.beginPath();
    c.arc(fx, fy, W * 0.42, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // ---- scrim
    const sc = c.createLinearGradient(0, H * 0.47, 0, H);
    sc.addColorStop(0, 'rgba(0,0,0,0)');
    sc.addColorStop(0.28, 'rgba(0,0,0,0.80)');
    sc.addColorStop(1, 'rgba(0,0,0,0.97)');
    c.fillStyle = sc;
    c.fillRect(0, H * 0.47, W, H * 0.53);

    const cx = W * 0.5;

    // ---- top label
    glowText(c, '中 华 珍 藏', cx, H * 0.078, {
      font: '600 ' + Math.round(H * 0.0205) + 'px ' + FONT_CN,
      color: GOLD, alpha: 0.86, glow: 0.45, spread: 0.9,
    });
    glowText(c, 'N A T I O N A L   T R E A S U R E S', cx, H * 0.112, {
      font: '400 ' + Math.round(H * 0.0118) + 'px ' + FONT_TECH,
      color: [230, 214, 186], alpha: 0.58, glow: 0.16, spread: 0.7,
    });

    // ---- type block
    fancyTitle(c, '七大国宝', cx, H * 0.622, {
      font: '900 ' + Math.round(H * 0.1180) + 'px ' + FONT_CN,
      accent: GOLD, glow: 2.2, tracking: H * 0.006, align: 'center',
    });

    glowText(c, '从青铜铭文，到汴河市井', cx, H * 0.700, {
      font: '400 ' + Math.round(H * 0.0215) + 'px ' + FONT_CN,
      color: [236, 219, 190], alpha: 0.80, glow: 0.20, spread: 0.7,
    });

    glowText(c, '19 行 · 291 字', cx, H * 0.762, {
      font: '700 ' + Math.round(H * 0.0430) + 'px ' + FONT_TECH,
      color: [255, 255, 255], alpha: 0.97, glow: 0.80, spread: 1.0,
    });

    rule(c, cx, H * 0.800, W * 0.28, 1, GOLD, 0.50, 2.0 * U);

    glowText(c, '何尊 · 越王勾践剑 · 鎏金舞马衔杯纹银壶 · 清明上河图', cx, H * 0.836, {
      font: '400 ' + Math.round(H * 0.0140) + 'px ' + FONT_CN,
      color: [216, 210, 200], alpha: 0.72, glow: 0.12, spread: 0.5,
    });
    glowText(c, '太阳神鸟金饰 · 曾侯乙尊盘 · 大盂鼎', cx, H * 0.866, {
      font: '400 ' + Math.round(H * 0.0140) + 'px ' + FONT_CN,
      color: [216, 210, 200], alpha: 0.72, glow: 0.12, spread: 0.5,
    });

    glowText(c, 'THE  SEVEN  CHINESE  TREASURES', cx, H * 0.922, {
      font: '400 ' + Math.round(H * 0.0122) + 'px ' + FONT_TECH,
      color: GOLD, alpha: 0.72, glow: 0.26, spread: 0.7,
    });

    c.restore();

    post(c, t, { accent: GOLD, noise: 0.028 });
  }

  return {
    prepareFrame(time) { render(Math.max(0, time)); },
    dispose() { canvas.remove(); },
  };
}
