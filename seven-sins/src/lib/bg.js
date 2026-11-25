import { makeCanvas, rng, clamp01, easeOutCubic, rgba } from './gfx.js';

export function createBackground(W, H) {
  // deterministic star field
  const r = rng(20261116);
  const stars = [];
  for (let i = 0; i < 220; i++) {
    stars.push({
      x: r(),
      y: r(),
      z: 0.25 + r() * 0.75,
      sp: 0.004 + r() * 0.02,
      ph: r() * 6.283,
      tw: 0.6 + r() * 2.2,
    });
  }
  const dust = [];
  for (let i = 0; i < 70; i++) {
    dust.push({ x: r(), y: r(), s: 0.4 + r() * 2.6, sp: 0.01 + r() * 0.045, ph: r() * 6.283 });
  }

  // noise tile
  const nz = makeCanvas(160, 160);
  const nctx = nz.getContext('2d');
  const img = nctx.createImageData(160, 160);
  const nr = rng(99173);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + nr() * 145;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  const noisePattern = nctx.createPattern(nz, 'repeat');

  // scanline tile
  const sc = makeCanvas(4, 4);
  const sctx = sc.getContext('2d');
  sctx.fillStyle = 'rgba(0,0,0,0.55)';
  sctx.fillRect(0, 3, 4, 1);
  const scanPattern = sctx.createPattern(sc, 'repeat');

  // vignette
  const vg = makeCanvas(W, H);
  const vctx = vg.getContext('2d');
  const grd = vctx.createRadialGradient(W / 2, H / 2, H * 0.24, W / 2, H / 2, H * 0.95);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(0.62, 'rgba(0,0,0,0.34)');
  grd.addColorStop(1, 'rgba(0,0,0,0.94)');
  vctx.fillStyle = grd;
  vctx.fillRect(0, 0, W, H);

  function draw(ctx, t, o) {
    const accent = (o && o.accent) || [150, 210, 255];
    const energy = o && o.energy !== undefined ? o.energy : 1;
    const cx = W / 2;
    const cy = H * 0.56;

    // base wash
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.92);
    bg.addColorStop(0, rgba(accent, 0.052 * energy));
    bg.addColorStop(0.45, rgba(accent, 0.016 * energy));
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // concentric rings, slowly counter-rotating
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < 5; i++) {
      const rad = H * (0.30 + i * 0.135);
      const a = (0.030 + i * 0.004) * energy;
      ctx.strokeStyle = rgba(accent, a);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
    // tick ring
    const rot = t * 0.055;
    ctx.rotate(rot);
    ctx.strokeStyle = rgba(accent, 0.11 * energy);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const long = i % 8 === 0;
      const r0 = H * 0.60;
      const r1 = r0 + (long ? 16 : 6);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
    ctx.rotate(-rot * 2.1);
    ctx.strokeStyle = rgba(accent, 0.07 * energy);
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const r0 = H * 0.40;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * (r0 + 10), Math.sin(a) * (r0 + 10));
      ctx.stroke();
    }
    ctx.restore();

    // faint perspective floor grid
    ctx.save();
    ctx.strokeStyle = rgba(accent, 0.055 * energy);
    ctx.lineWidth = 1;
    const hor = H * 0.70;
    for (let i = -9; i <= 9; i++) {
      const x0 = cx + i * (W * 0.055);
      ctx.beginPath();
      ctx.moveTo(x0, hor);
      ctx.lineTo(cx + i * (W * 0.26), H * 1.12);
      ctx.stroke();
    }
    const gridOff = (t * 0.28) % 1;
    for (let i = 0; i < 14; i++) {
      const p = (i + gridOff) / 14;
      const y = hor + Math.pow(p, 2.4) * H * 0.45;
      if (y > H) continue;
      ctx.globalAlpha = clamp01(1 - p) * 0.7;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // stars
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const y = ((s.y - t * s.sp * 0.12) % 1 + 1) % 1;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * s.tw + s.ph));
      const a = (0.16 + s.z * 0.5) * tw * (0.5 + 0.5 * energy);
      ctx.fillStyle = rgba(accent, a * 0.85);
      const sz = s.z * 2.1;
      ctx.fillRect(s.x * W, y * H, sz, sz);
    }
    // dust motes with parallax
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      const y = ((d.y - t * d.sp) % 1 + 1) % 1;
      const x = d.x * W + Math.sin(t * 0.5 + d.ph) * 16;
      ctx.globalAlpha = 0.30 * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.6 + d.ph)));
      ctx.fillStyle = rgba(accent, 0.7);
      ctx.beginPath();
      ctx.arc(x, y * H, d.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function post(ctx, t, o) {
    const accent = (o && o.accent) || [150, 210, 255];
    // noise
    const fr = Math.floor(t * 30);
    const nx = ((fr * 37) % 160);
    const ny = ((fr * 91) % 160);
    ctx.save();
    ctx.globalAlpha = (o && o.noise !== undefined ? o.noise : 0.045);
    ctx.translate(-nx, -ny);
    ctx.fillStyle = noisePattern;
    ctx.fillRect(0, 0, W + 160, H + 160);
    ctx.restore();

    // scanlines
    ctx.save();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = scanPattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // vignette
    ctx.drawImage(vg, 0, 0);

    // top/bottom letterbox hairlines
    ctx.fillStyle = rgba(accent, 0.16);
    ctx.fillRect(0, 0, W, 2);
    ctx.fillRect(0, H - 2, W, 2);
  }

  return { draw, post };
}
