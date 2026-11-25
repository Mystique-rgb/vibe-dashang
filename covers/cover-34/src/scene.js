import { PYRAMID, WONDERS, bounds, polyLength } from './lib/shapes.js';
import {
  makeCanvas, clamp, clamp01, lerp, easeOutCubic, easeOutExpo, easeInOutCubic,
  rng, rgba, strokePartial, drawChars,
} from './lib/gfx.js';
import { createBackground } from './lib/bg.js';

const FONT_CN = '"Noto Sans SC","Microsoft YaHei","PingFang SC",sans-serif';
const FONT_TECH = '"Bahnschrift","Arial Narrow",sans-serif';
const FONT_MONO = 'Consolas,"Courier New",monospace';

const GOLD = [255, 196, 72];
const RED = [255, 86, 70];

export default function ({ root, width, height, pixelRatio }) {
  const W = width;
  const H = height;
  const DPR = Math.max(1, Math.min(2, pixelRatio || 1));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.cssText = 'width:100%;height:100%;display:block;';
  root.style.cssText += ';margin:0;padding:0;background:#000;overflow:hidden;';
  root.append(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });

  const layer = makeCanvas(canvas.width, canvas.height);
  const lctx = layer.getContext('2d', { alpha: false });
  const bg = createBackground(canvas.width, canvas.height);

  // fit the pyramid into the vertical frame
  const fit = (lines, cx, cy, bw, bh) => {
    const b = bounds(lines);
    const s = Math.min(bw / Math.max(1e-6, b.w), bh / Math.max(1e-6, b.h));
    const ox = cx - ((b.x0 + b.x1) / 2) * s;
    const oy = cy + ((b.y0 + b.y1) / 2) * s;
    const out = lines.map((pl) => pl.map(([x, y]) => [ox + x * s, oy - y * s]));
    return { lines: out, lens: out.map(polyLength) };
  };

  const PYR = fit(PYRAMID.lines, W * 0.5, H * 0.520, W * 0.68, H * 0.285);

  // the six lost wonders, tiny, in a row near the bottom
  const MINI = WONDERS.map((w) => fit(w.lines, 0, 0, W * 0.115, H * 0.055));

  function drawWire(g, accent, alpha, glow, lw) {
    const base = lw || Math.max(1.4, H / 900);
    if (glow > 0.01) {
      lctx.save();
      lctx.globalCompositeOperation = 'lighter';
      lctx.shadowColor = rgba(accent, 0.95);
      lctx.shadowBlur = H * 0.030 * glow;
      lctx.strokeStyle = rgba(accent, 0.30 * alpha * glow);
      lctx.lineWidth = base * 2.6;
      lctx.lineJoin = 'round';
      lctx.lineCap = 'round';
      for (const pl of g.lines) strokePartial(lctx, pl, 1);
      lctx.restore();
    }
    lctx.save();
    lctx.strokeStyle = rgba(accent, alpha);
    lctx.lineWidth = base;
    lctx.lineJoin = 'round';
    lctx.lineCap = 'round';
    for (const pl of g.lines) strokePartial(lctx, pl, 1);
    lctx.restore();
  }

  function prepareFrame(time) {
    const t = clamp(time, 0, 3);
    const c = lctx;
    c.setTransform(1, 0, 0, 1, 0, 0);

    // ---------------------------------------------------------------- backdrop
    bg.draw(c, t, { accent: GOLD, energy: 1.15 });

    // a warm column of light behind the pyramid
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cg = c.createLinearGradient(0, H * 0.72, 0, H * 0.22);
    cg.addColorStop(0, rgba(GOLD, 0.16));
    cg.addColorStop(0.55, rgba(GOLD, 0.06));
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = cg;
    c.fillRect(W * 0.18, H * 0.22, W * 0.64, H * 0.50);
    c.restore();

    // ------------------------------------------------------------------ header
    const hy = H * 0.055;
    c.save();
    c.globalAlpha = 0.72;
    c.font = '600 ' + Math.round(H * 0.0135) + 'px ' + FONT_TECH;
    c.fillStyle = rgba(GOLD, 0.95);
    c.textAlign = 'center';
    c.fillText('VII  \u00B7  MIRACULA MUNDI', W * 0.5, hy);
    c.restore();

    // hairline rules flanking the header
    c.save();
    c.strokeStyle = rgba(GOLD, 0.35);
    c.lineWidth = 1.2;
    const ruleY = hy - H * 0.0042;
    c.beginPath();
    c.moveTo(W * 0.10, ruleY); c.lineTo(W * 0.32, ruleY);
    c.moveTo(W * 0.68, ruleY); c.lineTo(W * 0.90, ruleY);
    c.stroke();
    c.restore();

    // ------------------------------------------------------------------- title
    // \u4E03\u5927\u5947\u8FF9 \u2014 huge, centred, sits above the pyramid
    const titleY = H * 0.185;
    c.save();
    c.shadowColor = 'rgba(255,255,255,0.30)';
    c.shadowBlur = H * 0.010;
    drawChars(c, '\u4E03\u5927\u5947\u8FF9', W * 0.5, titleY, {
      font: '900 ' + Math.round(H * 0.088) + 'px ' + FONT_CN,
      color: '#ffffff', align: 'center',
      progress: 1, stagger: 0.0, rise: 0,
      tracking: H * 0.008,
    });
    c.restore();

    // English subtitle under the title
    c.save();
    c.globalAlpha = 0.92;
    c.font = '600 ' + Math.round(H * 0.0155) + 'px ' + FONT_TECH;
    c.fillStyle = rgba(GOLD, 1.0);
    c.textAlign = 'center';
    c.fillText('SEVEN WONDERS OF THE ANCIENT WORLD', W * 0.5, H * 0.228);
    c.restore();

    // ---------------------------------------------------------------- pyramid
    c.save();
    const breathe = Math.sin(t * 1.1) * 0.006;
    c.translate(W * 0.5, H * 0.520);
    c.scale(1 + breathe, 1 + breathe);
    c.translate(-W * 0.5, -H * 0.520);
    drawWire(PYR, GOLD, 1, 1.5, Math.max(2.0, H / 620));
    c.restore();

    // orbit rings around the pyramid
    c.save();
    c.translate(W * 0.5, H * 0.520);
    c.strokeStyle = rgba(GOLD, 0.30);
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(0, H * 0.155, W * 0.36, H * 0.045, 0, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = rgba(GOLD, 0.16);
    c.lineWidth = 1.1;
    c.beginPath();
    c.ellipse(0, H * 0.155, W * 0.44, H * 0.062, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // ---------------------------------------------------------- the big claim
    const claimY = H * 0.742;

    // solid dark plate: guarantees the red claim never fights the wireframe
    c.save();
    const bandH = H * 0.070;
    const grd = c.createLinearGradient(0, claimY - bandH * 1.0, 0, claimY + bandH * 0.72);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.26, 'rgba(8,4,2,0.90)');
    grd.addColorStop(0.74, 'rgba(8,4,2,0.90)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grd;
    c.fillRect(0, claimY - bandH * 1.0, W, bandH * 1.72);
    c.restore();

    c.save();
    c.shadowColor = rgba(RED, 0.55);
    c.shadowBlur = H * 0.014;
    drawChars(c, '\u516D\u4E2A\u90FD\u6CA1\u4E86', W * 0.5, claimY, {
      font: '900 ' + Math.round(H * 0.062) + 'px ' + FONT_CN,
      color: '#ff4a3a', align: 'center',
      progress: 1, stagger: 0.0, rise: 0,
      tracking: H * 0.004,
    });
    c.restore();

    // ---------------------------------------------------------- the one left
    c.save();
    drawChars(c, '\u53EA\u6709\u5B83\uFF0C\u8FD8\u7AD9\u7740', W * 0.5, H * 0.832, {
      font: '700 ' + Math.round(H * 0.040) + 'px ' + FONT_CN,
      color: '#ffffff', align: 'center',
      progress: 1, stagger: 0.0, rise: 0,
      tracking: H * 0.003,
    });
    c.restore();

    // ------------------------------------------------------- six lost + one
    // a row of the six lost wonders, struck through, then the survivor
    const rowY = H * 0.905;
    const gap = W * 0.128;
    const x0 = W * 0.5 - (gap * 6) / 2;
    for (let i = 0; i < 6; i++) {
      const bx = x0 + i * gap;
      c.save();
      c.translate(bx, rowY);
      c.strokeStyle = rgba([214, 148, 96], 0.95);
      c.lineWidth = 1.7;
      for (const pl of MINI[i].lines) strokePartial(c, pl, 1);
      // strike
      c.strokeStyle = 'rgba(255,88,72,0.95)';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(bx - W * 0.030, rowY - H * 0.030);
      c.lineTo(bx + W * 0.030, rowY + H * 0.030);
      c.stroke();
      c.restore();
    }
    // survivor marker
    const sx = x0 + 6 * gap + gap * 0.15;
    c.save();
    c.translate(sx, rowY);
    c.strokeStyle = rgba(GOLD, 1);
    c.lineWidth = 2.4;
    c.shadowColor = rgba(GOLD, 0.9);
    c.shadowBlur = H * 0.020;
    for (const pl of MINI[6 - 1].lines) strokePartial(c, pl, 1);
    c.restore();
    // actually draw the pyramid mini for the survivor
    c.save();
    c.translate(sx, rowY);
    const miniPyr = fit(PYRAMID.lines, 0, 0, W * 0.115, H * 0.055);
    c.strokeStyle = rgba(GOLD, 1);
    c.lineWidth = 2.4;
    c.shadowColor = rgba(GOLD, 0.95);
    c.shadowBlur = H * 0.022;
    for (const pl of miniPyr.lines) strokePartial(c, pl, 1);
    c.restore();

    // ------------------------------------------------------------- stat strip
    c.save();
    c.font = '600 ' + Math.round(H * 0.0210) + 'px ' + FONT_MONO;
    c.fillStyle = rgba(GOLD, 0.92);
    c.textAlign = 'center';
    c.shadowColor = rgba(GOLD, 0.55);
    c.shadowBlur = H * 0.012;
    c.fillText('146.6 M  \u00B7  2,300,000 BLOCKS  \u00B7  4,500 YEARS', W * 0.5, H * 0.958);
    c.restore();

    // --------------------------------------------------------------- composite
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layer, 0, 0);

    // post: noise + scanlines + vignette
    bg.post(ctx, t, { accent: GOLD, noise: 0.045 });

    // extra bottom vignette so the stat line stays legible
    ctx.save();
    const vg = ctx.createLinearGradient(0, H * 0.86, 0, H);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, H * 0.86, W, H * 0.14);
    ctx.restore();

    // frame border
    ctx.save();
    ctx.strokeStyle = rgba(GOLD, 0.20);
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.028, H * 0.021, W * 0.944, H * 0.958);
    ctx.restore();
  }

  return { prepareFrame, dispose() { canvas.remove(); } };
}
