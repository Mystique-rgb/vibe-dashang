// 《七大宗罪》 — 50s / 1920x1080 / 30fps
//
// Structure borrowed from V2 (d25e54...mp4): left-hand copy, right-hand figure,
// one sin every 8 beats, then a long pride build that lands on the drop.
// The figure is rebuilt from V1 (bcb265...mp4): bald profile, five-spike crown,
// collar with pendant, twelve feather-eyes on the halo ring.
//
// Music is 霓虹兔 - Chaikovsky, 132 BPM, drop at 91.640s. MUSIC_OFFSET puts that
// drop on video 41.818s, where pride appears.
//
// prepareFrame(time) is a pure function of time.

import {
  makeCanvas, clamp01, lerp, smoothstep, easeOutCubic, easeInCubic,
  easeInOutCubic, easeOutExpo, easeOutQuint, easeOutBack, rng, rgba,
} from './lib/gfx.js';
import {
  FONT_CN, FONT_SERIF, FONT_TECH, FONT_MONO,
  glowText, slamChars, measure, rule, hudBrackets, speedLines, makePost, glitch,
} from './lib/gfx2.js';
import { drawFigure, HALO_EYES, HALO_RADIUS, HALO_CY } from './lib/figure.js';
import {
  BEAT, BAR, DURATION, DROP_VIDEO, MUSIC_OFFSET, SINS, PRIDE, T,
  sinWindow, sinHit, q,
} from './lib/timeline.js';


// ------------------------------------------------------------------ fx layer
// Premium light effects. All deterministic in t.

// Volumetric god rays fanning out from a point.
function godRays(c, x, y, inner, outer, count, rot, color, alpha, t, seed) {
  if (alpha <= 0.002) return;
  const r = rng(seed || 4242);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(x, y);
  c.rotate(rot);
  for (let i = 0; i < count; i++) {
    const base = (i / count) * Math.PI * 2;
    const w = 0.012 + r() * 0.026;
    const len = outer * (0.62 + r() * 0.55);
    const a = alpha * (0.28 + r() * 0.72) * (0.55 + 0.45 * Math.sin(t * 1.1 + i * 0.7));
    const g = c.createLinearGradient(Math.cos(base) * inner, Math.sin(base) * inner,
                                     Math.cos(base) * len, Math.sin(base) * len);
    g.addColorStop(0, rgba(color, a));
    g.addColorStop(0.55, rgba(color, a * 0.35));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(Math.cos(base - w) * inner, Math.sin(base - w) * inner);
    c.lineTo(Math.cos(base - w * 0.35) * len, Math.sin(base - w * 0.35) * len);
    c.lineTo(Math.cos(base + w * 0.35) * len, Math.sin(base + w * 0.35) * len);
    c.lineTo(Math.cos(base + w) * inner, Math.sin(base + w) * inner);
    c.closePath();
    c.fill();
  }
  c.restore();
}

// Anamorphic horizontal streak, the "expensive lens" tell.
function anamorphic(c, x, y, w, h, color, alpha) {
  if (alpha <= 0.002) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(x - w, y, x + w, y);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.42, rgba(color, alpha * 0.30));
  g.addColorStop(0.5, rgba(color, alpha));
  g.addColorStop(0.58, rgba(color, alpha * 0.30));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// A small 4-point star flare.
function starFlare(c, x, y, r, color, alpha, rot) {
  if (alpha <= 0.002) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(x, y);
  c.rotate(rot || 0);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
  g.addColorStop(0.25, rgba(color, alpha * 0.75));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 4; i++) {
    c.rotate(Math.PI / 2);
    const lg = c.createLinearGradient(0, 0, r * 3.4, 0);
    lg.addColorStop(0, rgba(color, alpha * 0.85));
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(0, -r * 0.10);
    c.lineTo(r * 3.4, 0);
    c.lineTo(0, r * 0.10);
    c.closePath();
    c.fill();
  }
  c.restore();
}

// A light sweep that crosses the frame on a cut.
function lightSweep(c, p, color, alpha, W, H) {
  if (p <= 0 || p >= 1 || alpha <= 0.002) return;
  const x = -W * 0.35 + p * W * 1.7;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(x - W * 0.18, 0, x + W * 0.18, 0);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.5, rgba(color, alpha));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.save();
  c.translate(x, 0);
  c.rotate(-0.22);
  c.fillRect(-W * 0.10, -H * 0.5, W * 0.20, H * 2.0);
  c.restore();
  c.restore();
}

// Chromatic bloom ring on a big hit.
function shockRing(c, x, y, r, color, alpha, lw) {
  if (alpha <= 0.002) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = rgba(color, alpha);
  c.lineWidth = lw;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ constants
const RED = [255, 74, 66];

// marker #21: the small 成语 that pop on the beat after the drop
const IDIOMS = ['唯我独尊', '目中无人', '自命不凡', '高高在上', '不可一世'];

// every cut point, used for glitch + shake
const CUTS = (() => {
  const out = [T.title[0]];
  for (let i = 0; i < SINS.length; i++) {
    out.push(sinWindow(i).t0);
    out.push(sinHit(i));
  }
  out.push(T.prideA, T.prideB, T.prideC, T.desire);
  return out.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
})();

function glitchAt(t) {
  let g = 0;
  for (const c of CUTS) {
    const d = t - c;
    if (d < 0) continue;
    if (d < 0.13) g = Math.max(g, (1 - d / 0.13) * 0.85);
    else if (d < 0.26) g = Math.max(g, (1 - (d - 0.13) / 0.13) * 0.30);
  }
  // the drop gets the heaviest hit, but never so much the word breaks apart
  const dd = t - DROP_VIDEO;
  if (dd >= 0 && dd < 0.55) g = Math.max(g, (1 - dd / 0.55) * 0.55);
  return g;
}

function shakeAt(t) {
  let s = 0;
  for (const c of CUTS) {
    const d = t - c;
    if (d >= 0 && d < 0.30) s = Math.max(s, (1 - d / 0.30) * 4.5);
  }
  const dd = t - DROP_VIDEO;
  if (dd >= 0 && dd < 0.9) s = Math.max(s, (1 - dd / 0.9) * 22);
  if (dd >= 0 && dd < 2.0) s = Math.max(s, (1 - dd / 2.0) * 6);
  return s;
}

// a 1-2 frame white flash right on a cut
function flashAt(t, strength) {
  let f = 0;
  for (const c of CUTS) {
    const d = t - c;
    if (d >= 0 && d < 0.045) f = Math.max(f, (1 - d / 0.045) * (strength || 0.20));
  }
  const dd = t - DROP_VIDEO;
  if (dd >= 0 && dd < 0.10) f = Math.max(f, (1 - dd / 0.10) * 0.42);
  return f;
}

// which sin is on screen at t (null outside the six-sin block)
function sinAt(t) {
  for (let i = 0; i < SINS.length; i++) {
    const w = sinWindow(i);
    if (t >= w.t0 && t < w.t1) return { i, ...w, sin: SINS[i] };
  }
  return null;
}

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

  const post = makePost(canvas.width, canvas.height);
  const U = canvas.height / 1080;   // design unit -> device px

  // ---------------------------------------------------------------- background
  // Static star field + drifting dust, drawn into its own canvas each frame.
  const starR = rng(20261117);
  const STARS = [];
  for (let i = 0; i < 260; i++) {
    STARS.push({
      x: starR(), y: starR(), z: 0.2 + starR() * 0.8,
      tw: 0.5 + starR() * 2.4, ph: starR() * 6.283,
    });
  }
  const DUST = [];
  for (let i = 0; i < 90; i++) {
    DUST.push({
      x: starR(), y: starR(), r: 0.5 + starR() * 2.2,
      sp: 0.006 + starR() * 0.026, ph: starR() * 6.283,
    });
  }

  function drawBackground(c, t, accent, energy) {
    c.fillStyle = '#04030a';
    c.fillRect(0, 0, canvas.width, canvas.height);

    // accent wash, brightest behind the figure
    const cx = canvas.width * 0.70;
    const cy = canvas.height * 0.52;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, canvas.height * 1.05);
    g.addColorStop(0, rgba(accent, 0.075 * energy));
    g.addColorStop(0.42, rgba(accent, 0.026 * energy));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, canvas.width, canvas.height);

    // faint concentric rings behind the figure
    c.save();
    c.translate(cx, cy);
    for (let i = 0; i < 4; i++) {
      c.strokeStyle = rgba(accent, (0.020 + i * 0.003) * energy);
      c.lineWidth = 1 * U;
      c.beginPath();
      c.arc(0, 0, canvas.height * (0.42 + i * 0.20), 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();

    // stars
    for (const s of STARS) {
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * s.tw + s.ph));
      c.fillStyle = rgba(accent, (0.10 + s.z * 0.34) * tw * energy);
      const sz = s.z * 2.0 * U;
      c.fillRect(s.x * canvas.width, s.y * canvas.height, sz, sz);
    }
    // dust
    c.save();
    for (const d of DUST) {
      const y = ((d.y - t * d.sp) % 1 + 1) % 1;
      const x = d.x * canvas.width + Math.sin(t * 0.4 + d.ph) * 14 * U;
      c.globalAlpha = 0.26 * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + d.ph)));
      c.fillStyle = rgba(accent, 0.75);
      c.beginPath();
      c.arc(x, y * canvas.height, d.r * U, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // -------------------------------------------------------------------- intro
  // Reused from the seven-wonders opener: a ring that assembles, seven light
  // points igniting one by one with an electric pulse, then the big title.
  // "刻在骨子里" small, "七种人性" big.
  const INTRO_POINTS = 7;

  function drawIntro(c, lt, accent) {
    const dur = T.intro[1] - T.intro[0];
    const exit = clamp01((lt - (dur - 0.30)) / 0.30);
    const fade = 1 - exit;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;

    // ---- ring assembly
    const ra = easeOutCubic(clamp01(lt / 0.85));
    c.save();
    c.translate(cx + Math.sin(lt * 0.5) * canvas.width * 0.003,
                cy + Math.cos(lt * 0.42) * canvas.height * 0.003);
    c.scale(1 + Math.sin(lt * 1.1) * 0.006, 1 + Math.sin(lt * 1.1) * 0.006);

    const R = canvas.height * 0.345;
    c.strokeStyle = rgba(accent, 0.36 * ra * fade);
    c.lineWidth = 2.0 * U;
    c.beginPath();
    c.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ra);
    c.stroke();
    c.strokeStyle = rgba(accent, 0.15 * ra * fade);
    c.lineWidth = 1.2 * U;
    c.beginPath();
    c.arc(0, 0, R * 0.885, 0, Math.PI * 2);
    c.stroke();

    // ---- seven light points, each one ignites with a sound (see sfx track)
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < INTRO_POINTS; i++) {
      const ang = -Math.PI / 2 + (i / INTRO_POINTS) * Math.PI * 2;
      const t0 = 0.50 + i * 0.105;
      const lit = clamp01((lt - t0) / 0.24);
      const on = lit > 0;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const r0 = R;
      const r1 = R * 1.085;
      const x0 = ca * r0;
      const y0 = sa * r0;
      const x1 = ca * r1;
      const y1 = sa * r1;

      // halo bloom
      if (on) {
        const breath = 0.55 + 0.45 * Math.sin(lt * 2.4 + i * 1.1);
        const mx = ca * (r0 + r1) * 0.5;
        const my = sa * (r0 + r1) * 0.5;
        const hg = c.createRadialGradient(mx, my, 0, mx, my, canvas.height * 0.034);
        hg.addColorStop(0, rgba(accent, 0.60 * breath * lit * fade));
        hg.addColorStop(0.42, rgba(accent, 0.20 * breath * lit * fade));
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = hg;
        c.beginPath();
        c.arc(mx, my, canvas.height * 0.034, 0, Math.PI * 2);
        c.fill();
      }

      // the tick
      c.lineCap = 'round';
      c.strokeStyle = rgba(accent, (on ? 0.30 : 0.06) * (on ? lit : 1) * fade);
      c.lineWidth = on ? canvas.height * 0.015 : 1.2 * U;
      c.beginPath();
      c.moveTo(x0, y0); c.lineTo(x1, y1);
      c.stroke();
      c.strokeStyle = rgba(accent, (on ? 0.96 : 0.16) * (on ? lit : 1) * fade);
      c.lineWidth = on ? Math.max(2.2, canvas.height * 0.0036) : 1.2 * U;
      c.beginPath();
      c.moveTo(x0, y0); c.lineTo(x1, y1);
      c.stroke();

      // ignition flash + shock ring
      if (lit > 0 && lit < 1) {
        const f = 1 - lit;
        c.strokeStyle = 'rgba(255,255,255,' + 0.88 * f * fade + ')';
        c.lineWidth = Math.max(2.2, canvas.height * 0.005) * (1 + f);
        c.beginPath();
        c.moveTo(x0, y0); c.lineTo(x1, y1);
        c.stroke();
        const rr = canvas.height * 0.010 + f * canvas.height * 0.058;
        c.strokeStyle = rgba(accent, 0.62 * f * fade);
        c.lineWidth = Math.max(1.2, canvas.height * 0.0024);
        c.beginPath();
        c.arc(x1, y1, rr, 0, Math.PI * 2);
        c.stroke();
      }

      // standing spark running outward
      if (on && lit >= 1) {
        const sp = (lt * 1.5 + i * 0.37) % 1;
        const sx = x0 + (x1 - x0) * sp;
        const sy = y0 + (y1 - y0) * sp;
        const shg = c.createRadialGradient(sx, sy, 0, sx, sy, canvas.height * 0.024);
        shg.addColorStop(0, 'rgba(255,255,255,' + 0.96 * fade + ')');
        shg.addColorStop(0.30, rgba(accent, 0.68 * fade));
        shg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = shg;
        c.beginPath();
        c.arc(sx, sy, canvas.height * 0.024, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,' + fade + ')';
        c.beginPath();
        c.arc(sx, sy, Math.max(2.2, canvas.height * 0.0044), 0, Math.PI * 2);
        c.fill();
        const tp = Math.max(0, sp - 0.55);
        c.strokeStyle = rgba(accent, 0.85 * fade);
        c.lineWidth = Math.max(2.0, canvas.height * 0.0034);
        c.beginPath();
        c.moveTo(x0 + (x1 - x0) * tp, y0 + (y1 - y0) * tp);
        c.lineTo(sx, sy);
        c.stroke();
      }

      // standing pulse dot at the tip
      if (on && lit >= 1) {
        const dp = 0.55 + 0.45 * Math.sin(lt * 3.4 + i * 1.7);
        const dg = c.createRadialGradient(x1, y1, 0, x1, y1, canvas.height * 0.017);
        dg.addColorStop(0, 'rgba(255,255,255,' + 0.92 * dp * fade + ')');
        dg.addColorStop(0.35, rgba(accent, 0.58 * dp * fade));
        dg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = dg;
        c.beginPath();
        c.arc(x1, y1, canvas.height * 0.017, 0, Math.PI * 2);
        c.fill();
      }

      // energy arcs hopping to the next point
      if (on && lit >= 1) {
        const nang = -Math.PI / 2 + ((i + 1) / INTRO_POINTS) * Math.PI * 2;
        const nOn = lt > 0.50 + ((i + 1) % INTRO_POINTS) * 0.105;
        if (nOn) {
          const pulse = Math.pow(0.5 + 0.5 * Math.sin(lt * 3.1 + i * 2.0), 3.0);
          if (pulse > 0.10) {
            const ax = ca * r1;
            const ay = sa * r1;
            const bx = Math.cos(nang) * r1;
            const by = Math.sin(nang) * r1;
            const midA = (ang + nang) / 2;
            const bulge = canvas.height * 0.032;
            const j1 = Math.sin(lt * 9 + i) * canvas.height * 0.009;
            c.strokeStyle = rgba(accent, 0.55 * pulse * fade);
            c.lineWidth = Math.max(3, canvas.height * 0.0062);
            c.beginPath();
            c.moveTo(ax, ay);
            c.quadraticCurveTo(Math.cos(midA) * (r1 + bulge + j1), Math.sin(midA) * (r1 + bulge + j1), bx, by);
            c.stroke();
            c.strokeStyle = 'rgba(255,255,255,' + 0.82 * pulse * fade + ')';
            c.lineWidth = Math.max(1.4, canvas.height * 0.0024);
            c.beginPath();
            c.moveTo(ax, ay);
            c.quadraticCurveTo(Math.cos(midA) * (r1 + bulge + j1), Math.sin(midA) * (r1 + bulge + j1), bx, by);
            c.stroke();
          }
        }
      }
    }
    // ---- after ignition: a rotating outer tick ring + orbiting sparks keep
    // the frame alive instead of freezing on a static title.
    const spin = lt * 0.32;
    c.save();
    c.translate(0, 0);
    c.rotate(spin);
    c.strokeStyle = rgba(accent, 0.16 * fade);
    c.lineWidth = 1.2 * U;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const long = i % 6 === 0;
      const r0 = R * 1.19;
      const r1 = r0 + (long ? canvas.height * 0.020 : canvas.height * 0.009);
      c.beginPath();
      c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();

    // two sparks orbiting in opposite directions
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 2; k++) {
      const dir = k === 0 ? 1 : -1;
      const a = dir * lt * 1.15 + k * Math.PI;
      const rad = R * (k === 0 ? 1.055 : 1.115);
      const sx = cx + Math.cos(a) * rad;
      const sy = cy + Math.sin(a) * rad;
      const gg = c.createRadialGradient(sx, sy, 0, sx, sy, canvas.height * 0.030);
      gg.addColorStop(0, 'rgba(255,255,255,' + 0.85 * fade + ')');
      gg.addColorStop(0.30, rgba(accent, 0.55 * fade));
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gg;
      c.beginPath();
      c.arc(sx, sy, canvas.height * 0.030, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,' + 0.95 * fade + ')';
      c.beginPath();
      c.arc(sx, sy, Math.max(2.0, canvas.height * 0.0040), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    c.restore();
    c.restore();

    // ---- the seven big numerals behind, ghosted
    c.save();
    c.globalAlpha = 0.055 * clamp01(lt / 0.6) * fade;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '700 ' + Math.round(canvas.height * 0.235) + 'px ' + FONT_TECH;
    c.fillStyle = '#ffffff';
    c.fillText('VII', cx, cy - canvas.height * 0.005);
    c.restore();

    // ---- title: small line above, big word below
    c.save();
    c.globalAlpha = fade;
    // "刻在骨子里" — small
    glowText(c, '刻在骨子里', cx, cy - canvas.height * 0.125, {
      font: '400 ' + Math.round(canvas.height * 0.036) + 'px ' + FONT_CN,
      color: [255, 255, 255], alpha: 0.80,
      glow: 0.35, spread: 0.8,
    });
    // "七种人性" — big, slammed in char by char
    slamChars(c, '七种人性', cx, cy + canvas.height * 0.005, {
      font: '900 ' + Math.round(canvas.height * 0.160) + 'px ' + FONT_CN,
      color: [255, 255, 255],
      progress: clamp01((lt - 0.28) / 0.95),
      stagger: 0.115, tracking: canvas.height * 0.010, drop: 0.55, glow: 1.0,
    });
    // rule under it
    rule(c, cx, cy + canvas.height * 0.125, canvas.width * 0.20,
         (lt - 0.85) / 0.6, accent, 0.72 * fade, 2.4 * U);
    // english subline
    glowText(c, 'SEVEN  DEADLY  SINS', cx, cy + canvas.height * 0.178, {
      font: '400 ' + Math.round(canvas.height * 0.0215) + 'px ' + FONT_TECH,
      color: accent, alpha: 0.90 * clamp01((lt - 0.95) / 0.5),
      glow: 0.30, spread: 0.7,
    });
    c.restore();
  }

  // ---------------------------------------------------------------- title card
  function drawTitleCard(c, lt, accent) {
    const dur = T.title[1] - T.title[0];
    const exit = clamp01((lt - (dur - 0.24)) / 0.24);
    const fade = 1 - exit;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;

    // red ring, like V2's chapter card
    const R = canvas.height * 0.215;
    const ra = easeOutCubic(clamp01(lt / 0.5));
    c.save();
    c.globalAlpha = fade;
    const rg = c.createRadialGradient(cx, cy, R * 0.80, cx, cy, R * 1.10);
    rg.addColorStop(0, rgba(RED, 0.00));
    rg.addColorStop(0.5, rgba(RED, 0.20 * ra));
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = rg;
    c.beginPath();
    c.arc(cx, cy, R * 1.10, 0, Math.PI * 2);
    c.fill();

    c.strokeStyle = rgba(RED, 0.92 * ra);
    c.lineWidth = Math.max(3.0, canvas.height * 0.0055);
    c.beginPath();
    c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ra);
    c.stroke();
    c.strokeStyle = 'rgba(255,220,215,' + 0.55 * ra + ')';
    c.lineWidth = Math.max(1.2, canvas.height * 0.0016);
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // knock the ring back behind the word with a soft black plate
    c.save();
    c.globalAlpha = fade;
    const plate = c.createRadialGradient(cx, cy, 0, cx, cy, R * 0.95);
    plate.addColorStop(0, 'rgba(4,3,10,0.86)');
    plate.addColorStop(0.72, 'rgba(4,3,10,0.55)');
    plate.addColorStop(1, 'rgba(4,3,10,0)');
    c.fillStyle = plate;
    c.beginPath();
    c.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // a slow counter-rotating inner ring + breathing glow keeps it alive
    c.save();
    c.globalAlpha = fade;
    c.translate(cx, cy);
    c.rotate(-lt * 0.55);
    c.strokeStyle = rgba(RED, 0.30);
    c.lineWidth = 1.2 * U;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const r0 = R * 0.865;
      const r1 = r0 + canvas.height * (i % 4 === 0 ? 0.022 : 0.010);
      c.beginPath();
      c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();

    // pulsing halo behind the word
    c.save();
    c.globalCompositeOperation = 'lighter';
    const pulse = 0.55 + 0.45 * Math.sin(lt * 3.2);
    const pg = c.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
    pg.addColorStop(0, rgba(RED, 0.10 * pulse * fade));
    pg.addColorStop(0.55, rgba(RED, 0.05 * pulse * fade));
    pg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = pg;
    c.beginPath();
    c.arc(cx, cy, R * 1.25, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // 七宗罪
    c.save();
    c.globalAlpha = fade;
    slamChars(c, '七宗罪', cx, cy - canvas.height * 0.010, {
      font: '900 ' + Math.round(canvas.height * 0.165) + 'px ' + FONT_SERIF,
      color: [255, 246, 240],
      progress: clamp01((lt - 0.10) / 0.70),
      stagger: 0.10, tracking: canvas.height * 0.012, drop: 0.45, glow: 0.85,
    });
    glowText(c, 'Septem  Peccata  Mortalia', cx, cy + canvas.height * 0.100, {
      font: '400 ' + Math.round(canvas.height * 0.0335) + 'px ' + FONT_SERIF,
      color: [235, 225, 220], alpha: 0.88 * clamp01((lt - 0.42) / 0.4),
      glow: 0.20, spread: 0.6,
    });
    c.restore();
  }

  // ------------------------------------------------------------------ sin shot
  // Two halves: scene line (beats 0-3), then the name card (beat 4 onwards).
  // Every light point on the halo gets exactly one sound in the sfx track, and
  // the halo ignition here is driven by the same schedule.
  function drawSin(c, t, lt, dur, sin, accent) {
    const half = dur * 0.5;
    const second = lt >= half;
    const p2 = second ? (lt - half) : 0;      // time since the second hit
    const exit = clamp01((lt - (dur - 0.13)) / 0.13);
    const fade = 1 - exit;

    // ---- figure, right side
    // Reference figure fills ~87% of frame height and ~47% of the width.
    // headR is the half head height, so the bust (crown -1 .. chest 3.7) is
    // 4.7 * headR tall: 0.185 * 1080 * 4.7 = 0.94 H before framing.
    const headR = canvas.height * 0.185;
    const fx = canvas.width * 0.700;
    const fy = canvas.height * 0.330;

    // the halo ignites across the whole shot, one eye per ~0.10s from the hit
    const haloProgress = clamp01((p2 - 0.02) / (HALO_EYES * 0.062));
    const glow = second ? 1.0 : 0.35 + 0.25 * clamp01(lt / half);
    // eyes snap open on the second hit: fast lift, small overshoot, settle
    const eyeOpen = second
      ? easeOutBack(clamp01((p2 - 0.04) / 0.22), 1.9)
      : 0;

    c.save();
    c.translate(fx, fy);
    // a slow breathing scale, plus a jolt when the name card lands
    const jolt = second ? 1 + (1 - easeOutExpo(clamp01(p2 / 0.20))) * 0.055 : 1;
    const br = (1 + Math.sin(t * 1.35) * 0.008) * jolt;
    c.scale(br, br);
    // entering slide: comes in from the right on the first half
    const enter = easeOutCubic(clamp01(lt / 0.45));
    c.translate((1 - enter) * canvas.width * 0.06, 0);
    drawFigure(c, {
      scale: headR, accent, sin: sin.key, alpha: fade * (second ? 1 : 0.88),
      glow: glow, time: t, haloProgress, haloRot: t * 0.03,
      eyeOpen: clamp01(eyeOpen), bodyProgress: 1,
      detailAlpha: second ? 1 : 0.55,
    });
    c.restore();

    // god rays fanning out from behind the halo, slowly rotating
    godRays(c, fx, fy, headR * 0.9, headR * 5.2, 22, t * 0.055,
            accent, 0.11 * fade * (0.55 + 0.45 * glow), t, 911);

    // anamorphic streak right on the second hit
    if (second) {
      const ka = clamp01(1 - p2 / 0.55);
      anamorphic(c, fx, fy - headR * 0.10, canvas.width * 0.34, canvas.height * 0.0075,
                 accent, 0.55 * ka * fade);
      starFlare(c, fx, fy - headR * 0.10, canvas.height * 0.030, accent,
                0.85 * ka * fade, t * 0.6);
      shockRing(c, fx, fy, headR * (2.4 + p2 * 3.2), accent, 0.32 * ka * fade,
                Math.max(1.5, canvas.height * 0.0032));
    }

    // light sweep crossing the frame on entry
    lightSweep(c, clamp01(lt / 0.42), accent, 0.16 * fade, canvas.width, canvas.height);

    // orbiting sparks around the halo: continuous motion between ignitions
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const dir = k % 2 === 0 ? 1 : -1;
      const a = dir * t * (0.85 + k * 0.25) + k * 2.1;
      const rad = headR * (HALO_RADIUS + 0.12 + k * 0.10);
      const sx = fx + Math.cos(a) * rad;
      const sy = fy + Math.sin(a) * rad;
      const gg = c.createRadialGradient(sx, sy, 0, sx, sy, canvas.height * 0.026);
      gg.addColorStop(0, 'rgba(255,255,255,' + 0.80 * fade + ')');
      gg.addColorStop(0.32, rgba(accent, 0.55 * fade));
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gg;
      c.beginPath();
      c.arc(sx, sy, canvas.height * 0.026, 0, Math.PI * 2);
      c.fill();
    }
    // rising motes on the left half
    const mr = rng(3307 + Math.floor(t));
    for (let i = 0; i < 26; i++) {
      const seed = mr();
      const y = ((seed - t * (0.09 + mr() * 0.10)) % 1 + 1) % 1;
      const x = mr() * canvas.width * 0.62 + Math.sin(t * 1.1 + i) * 20 * U;
      const a = 0.16 + 0.30 * Math.abs(Math.sin(t * 1.9 + i));
      c.fillStyle = rgba(accent, a * fade);
      c.beginPath();
      c.arc(x, y * canvas.height, (1.0 + mr() * 2.0) * U, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // ---- left copy
    const lx = canvas.width * 0.075;
    const lyScene = canvas.height * 0.440;
    const lyName = canvas.height * 0.400;

    if (!second) {
      // scene line, fades in early and holds
      const a = clamp01(lt / 0.30) * fade;
      c.save();
      c.globalAlpha = a;
      glowText(c, sin.scene, lx, lyScene, {
        font: '500 ' + Math.round(canvas.height * 0.0470) + 'px ' + FONT_CN,
        color: [255, 254, 255], alpha: 1, glow: 0.45, spread: 0.8, align: 'left',
      });
      // quote below, slightly dimmer, arrives a beat later
      glowText(c, sin.quote, lx, lyScene + canvas.height * 0.088, {
        font: '400 ' + Math.round(canvas.height * 0.0400) + 'px ' + FONT_CN,
        color: accent, alpha: 1.0 * clamp01((lt - 0.16) / 0.30),
        glow: 0.85, spread: 1.0, align: 'left',
      });
      c.restore();
      // thin vertical accent bar
      c.save();
      c.globalAlpha = a;
      c.fillStyle = rgba(accent, 0.75);
      c.fillRect(lx - canvas.width * 0.022, lyScene - canvas.height * 0.055,
                 2.4 * U, canvas.height * 0.165 * easeOutCubic(clamp01(lt / 0.4)));
      c.restore();
    } else {
      // ---- name card: numeral, big name, latin, then the oppose/demon rows
      const a = fade;
      c.save();
      c.globalAlpha = a;

      // "七宗罪之X，它的名字叫"
      glowText(c, '七宗罪之' + numCN(sin.num) + '，它的名字叫', lx, lyName - canvas.height * 0.105, {
        font: '500 ' + Math.round(canvas.height * 0.0360) + 'px ' + FONT_CN,
        color: [252, 250, 255], alpha: 1.0 * clamp01(p2 / 0.20),
        glow: 0.35, spread: 0.7, align: 'left',
      });

      // the big name, slammed in from a slight offset so the cut reads visually
      const slide = (1 - easeOutExpo(clamp01(p2 / 0.26))) * canvas.width * 0.035;
      slamChars(c, sin.zh, lx + slide, lyName + canvas.height * 0.005, {
        font: '900 ' + Math.round(canvas.height * 0.162) + 'px ' + FONT_CN,
        color: [255, 255, 255], alpha: 1,
        progress: clamp01(p2 / 0.42), stagger: 0.075,
        tracking: canvas.height * 0.008, drop: 0.62, glow: 2.1, align: 'left',
      });

      // latin
      glowText(c, sin.la, lx + canvas.height * 0.004, lyName + canvas.height * 0.100, {
        font: '400 ' + Math.round(canvas.height * 0.0275) + 'px ' + FONT_TECH,
        color: accent, alpha: 1.0 * clamp01((p2 - 0.14) / 0.26),
        glow: 0.90, spread: 1.0, align: 'left',
      });

      // oppose / demon rows
      const rowA = clamp01((p2 - 0.22) / 0.28);
      const rowY = lyName + canvas.height * 0.170;
      glowText(c, '对立  ' + sin.oppose + '  ' + sin.opposeLa, lx, rowY, {
        font: '400 ' + Math.round(canvas.height * 0.0260) + 'px ' + FONT_CN,
        color: [225, 222, 240], alpha: 0.82 * rowA, glow: 0.16, spread: 0.6, align: 'left',
      });
      glowText(c, '代表  ' + sin.demon, lx, rowY + canvas.height * 0.048, {
        font: '400 ' + Math.round(canvas.height * 0.0250) + 'px ' + FONT_CN,
        color: accent, alpha: 0.88 * rowA, glow: 0.30, spread: 0.6, align: 'left',
      });

      // accent rule above the numeral
      rule(c, lx + canvas.width * 0.075, lyName - canvas.height * 0.155,
           canvas.width * 0.135, p2 / 0.4, accent, 0.85 * a, 2.6 * U);
      c.restore();
    }
  }

  const numCN = (num) => ({ VII: '七', VI: '六', V: '五', IV: '四', III: '三', II: '二', I: '一' }[num] || '');

  // --------------------------------------------------------------- pride build
  // A: the build. Figure dark on the right, six monologue lines ticking in on
  // the left, and the pressure rising the whole way: the halo starts to leak,
  // the accent wash swells, the figure creeps closer, and a rumble builds.
  function drawPrideA(c, t, lt, accent) {
    const dur = T.prideB - T.prideA;
    const p = clamp01(lt / dur);

    // slow push-in across the whole build: the frame is never fully static
    c.save();
    const zoom = 1 + 0.045 * easeOutCubic(p);
    c.translate(canvas.width * 0.5, canvas.height * 0.5);
    c.scale(zoom, zoom);
    c.translate(-canvas.width * 0.5, -canvas.height * 0.5);

    // the figure creeps toward the camera and its halo starts leaking light
    const headR = canvas.height * (0.170 + 0.026 * p);
    const fx = canvas.width * (0.700 - 0.010 * p);
    const fy = canvas.height * 0.335;

    // halo eyes light up one by one through the build, slow and wrong
    const haloProgress = clamp01((p - 0.15) / 0.85) * 0.75;

    c.save();
    c.translate(fx, fy);
    // the marker asks for this: the figure must NOT pop in whole. Its halo ring
    // is drawn on like a pen stroke, the bust grows out from the collar, and the
    // engraving fades up last. Each of the six monologue lines advances it.
    drawFigure(c, {
      scale: headR, accent, sin: 'pride',
      // marker #18: the head outline is traced in too, not present up front
      alpha: clamp01((p - 0.02) / 0.30) * (0.38 + 0.30 * p),
      glow: 0.08 + 0.60 * p * p,
      time: t,
      haloProgress,
      haloDraw: clamp01((p - 0.05) / 0.55),
      haloRot: t * 0.02,
      haloAlpha: 0.20 + 0.64 * p,
      bodyProgress: clamp01((p - 0.10) / 0.50),
      detailAlpha: clamp01((p - 0.55) / 0.45) * 0.85,
      eyeOpen: 0,
    });
    c.restore();

    // a rising ring behind the figure, closing in
    c.save();
    c.globalCompositeOperation = 'lighter';
    const rr = canvas.height * (1.05 - 0.55 * p);
    c.strokeStyle = rgba(accent, 0.10 + 0.20 * p);
    c.lineWidth = Math.max(1.5, canvas.height * 0.0030 * (1 + p));
    c.beginPath();
    c.arc(fx, fy, rr, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // six lines, one per slot. Each one lands harder than the last: bigger,
    // brighter, and it shoves the earlier lines back.
    const SLOT = dur / 6;
    const lx = canvas.width * 0.085;
    const baseY = canvas.height * 0.330;
    const gap = canvas.height * 0.088;
    for (let i = 0; i < PRIDE.lines.length; i++) {
      const t0 = i * SLOT;
      if (lt < t0) continue;
      const local = clamp01((lt - t0) / 0.26);
      const age = (lt - t0) / SLOT;
      const fadeIn = easeOutExpo(local);
      // earlier lines dim and drift back, the newest is the brightest
      const dim = 1 - clamp01((age - 0.30) / 1.4) * 0.72;
      const weight = 1 + i * 0.10;
      const slide = (1 - fadeIn) * -canvas.width * 0.045;

      c.save();
      c.globalAlpha = fadeIn * dim;
      glowText(c, PRIDE.lines[i], lx + slide, baseY + i * gap, {
        font: '400 ' + Math.round(canvas.height * 0.0470 * weight) + 'px ' + FONT_CN,
        color: [252, 250, 255], alpha: 1,
        glow: 0.30 + 0.14 * i, spread: 0.8, align: 'left',
      });
      // a short accent tick to the left of the newest line
      if (i === PRIDE.lines.length - 1 || age < 0.4) {
        c.fillStyle = rgba(accent, 0.85 * (1 - clamp01(age / 0.5)));
        c.fillRect(lx - canvas.width * 0.020, baseY + i * gap - canvas.height * 0.018,
                   canvas.width * 0.010 * easeOutCubic(clamp01(local)), 2.4 * U);
      }
      c.restore();
    }

    // drifting embers rising on the right, so the gap between lines is never dead
    c.save();
    c.globalCompositeOperation = 'lighter';
    const emR = rng(5511);
    for (let i = 0; i < 60; i++) {
      const seed = emR();
      const speed = 0.09 + emR() * 0.13;
      const y = ((seed - lt * speed) % 1 + 1) % 1;
      const x = (emR() * 0.55 + 0.42) * canvas.width + Math.sin(lt * 1.0 + i) * 30 * U;
      const a = 0.28 + 0.50 * Math.abs(Math.sin(lt * 2.0 + i * 0.7));
      const sz = (1.4 + emR() * 3.0) * U;
      const g = c.createRadialGradient(x, y * canvas.height, 0, x, y * canvas.height, sz * 2.4);
      g.addColorStop(0, 'rgba(240,230,255,' + (0.80 * a * (0.4 + 0.6 * p)) + ')');
      g.addColorStop(0.35, rgba(accent, a * (0.35 + 0.65 * p)));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y * canvas.height, sz * 2.4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // a slow horizontal scan line sweeping down, keeps the frame alive
    const scanY = ((lt * 0.30) % 1) * canvas.height;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const sg = c.createLinearGradient(0, scanY - canvas.height * 0.06, 0, scanY + canvas.height * 0.06);
    sg.addColorStop(0, 'rgba(0,0,0,0)');
    sg.addColorStop(0.5, rgba(accent, 0.055));
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg;
    c.fillRect(0, scanY - canvas.height * 0.06, canvas.width, canvas.height * 0.12);
    c.restore();

    // caption, plus a pressure meter that fills as the build runs out
    c.save();
    c.globalAlpha = 0.62 * clamp01((lt - 0.4) / 0.9);
    glowText(c, 'SUPERBIA', canvas.width * 0.085, canvas.height * 0.862, {
      font: '400 ' + Math.round(canvas.height * 0.0210) + 'px ' + FONT_TECH,
      color: accent, alpha: 0.85, glow: 0.30, spread: 0.8, align: 'left',
    });
    c.restore();

    c.save();
    const mw = canvas.width * 0.26;
    const mx = canvas.width * 0.085;
    const my = canvas.height * 0.900;
    c.fillStyle = rgba(accent, 0.18);
    c.fillRect(mx, my, mw, 2.2 * U);
    c.fillStyle = rgba(accent, 0.95);
    c.fillRect(mx, my, mw * p * p, 2.2 * U);
    c.restore();

    c.restore();   // close the build's push-in transform
  }

  // B: "七宗罪之首" slams down character by character, each one heavier.
  function drawPrideB(c, t, lt, accent) {
    const dur = T.prideC - T.prideB;
    const headR = canvas.height * 0.188;
    const fx = canvas.width * 0.700;
    const fy = canvas.height * 0.330;

    // figure starts to gain light
    const gain = clamp01(lt / dur);
    c.save();
    c.translate(fx, fy);
    drawFigure(c, {
      scale: headR, accent, sin: 'pride', alpha: 0.50 + 0.40 * gain,
      glow: 0.10 + 0.50 * gain, time: t,
      haloProgress: clamp01((lt - dur * 0.55) / (dur * 0.45)),
      haloDraw: 1,
      haloRot: t * 0.03, haloAlpha: 0.30 + 0.55 * gain,
      bodyProgress: 1,
      detailAlpha: 0.85,
      // the eye starts to open on the last character, right before the drop
      eyeOpen: clamp01((lt - dur * 0.78) / (dur * 0.22)) * 0.55,
    });
    c.restore();

    // the five characters, each slamming in on its own beat
    const text = PRIDE.title;
    const chars = Array.from(text);
    const n = chars.length;
    // one character every two beats: the last one lands ~0.9s before the drop,
    // leaving room for its shockwave to run into it.
    const step = Math.min(BEAT * 2, dur / (n + 0.9));
    const baseY = canvas.height * 0.470;
    const cx = canvas.width * 0.300;
    const size = canvas.height * 0.135;
    const font = '900 ' + Math.round(size) + 'px ' + FONT_CN;

    c.save();
    c.font = font;
    const ws = chars.map((ch) => c.measureText(ch).width);
    const track = canvas.height * 0.012;
    let total = 0;
    for (let i = 0; i < n; i++) total += ws[i];
    total += track * (n - 1);
    c.restore();

    let x = cx - total / 2;
    for (let i = 0; i < n; i++) {
      const t0 = i * step;
      const local = clamp01((lt - t0) / 0.34);
      if (local > 0) {
        const k = easeOutExpo(local);
        // every character hits harder than the last
        const weight = 0.45 + (i / Math.max(1, n - 1)) * 0.85;
        const sc = 1 + (1 - k) * 1.25;
        c.save();
        c.translate(x + ws[i] / 2, baseY + (1 - k) * -size * 0.5);
        c.scale(sc, sc);
        glowText(c, chars[i], 0, 0, {
          font, color: [255, 255, 255],
          alpha: Math.min(1, local * 2.4),
          glow: 1.1 * weight, spread: 1.0,
        });
        // expanding ring on impact
        if (local > 0 && local < 1) {
          const f = 1 - local;
          c.strokeStyle = rgba(accent, 0.55 * f * weight);
          c.lineWidth = Math.max(2.0, canvas.height * 0.0032);
          c.beginPath();
          c.arc(0, 0, size * (0.30 + 0.75 * (1 - f)), 0, Math.PI * 2);
          c.stroke();
        }
        c.restore();
      }
      x += ws[i] + track;
    }

    // the last character triggers a shockwave across the whole frame
    const lastT0 = (n - 1) * step;
    const shock = clamp01((lt - lastT0) / 0.85);
    if (shock > 0 && shock < 1) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const rr = canvas.height * (0.10 + shock * 0.95);
      c.strokeStyle = rgba(accent, 0.42 * (1 - shock));
      c.lineWidth = Math.max(2.0, canvas.height * 0.0045 * (1 - shock));
      c.beginPath();
      c.arc(cx, baseY, rr, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  }

  // C: the drop. Pride appears in full, biggest hit of the piece.
  function drawPrideC(c, t, lt, accent) {
    const dur = T.desire - T.prideC;
    const exit = clamp01((lt - (dur - 0.22)) / 0.22);
    const fade = 1 - exit;

    const headR = canvas.height * 0.200;
    const fx = canvas.width * 0.695;
    const fy = canvas.height * 0.325;

    // figure punches in slightly oversized, then settles
    const punch = 1 + (1 - easeOutExpo(clamp01(lt / 0.36))) * 0.16;
    c.save();
    c.translate(fx, fy);
    c.scale(punch, punch);
    drawFigure(c, {
      scale: headR, accent, sin: 'pride', alpha: fade, glow: 1.0,
      time: t, haloProgress: 1, haloDraw: 1, haloRot: t * 0.04, haloAlpha: 1,
      bodyProgress: 1, detailAlpha: 1,
      // eyes blown wide open on the drop
      eyeOpen: 1,
    });
    c.restore();

    // speed lines radiating out on the hit
    speedLines(c, fx, fy, canvas.height * 0.30, canvas.height * 0.95, 56,
               clamp01(lt / 0.85), accent, 0.32 * (1 - clamp01(lt / 1.2)), t, 771);

    // the drop gets the full lens package
    const dropA = clamp01(1 - lt / 1.5);
    godRays(c, fx, fy, headR * 0.8, headR * 6.4, 30, -t * 0.08,
            accent, 0.20 * dropA * fade, t, 3131);
    anamorphic(c, fx, fy - headR * 0.08, canvas.width * 0.46, canvas.height * 0.0090,
               [255, 214, 150], 0.80 * dropA * fade);
    starFlare(c, fx, fy - headR * 0.08, canvas.height * 0.045, [255, 226, 170],
              0.95 * dropA * fade, t * 0.5);
    for (let k = 0; k < 3; k++) {
      const kk = clamp01((lt - k * 0.10) / 0.95);
      if (kk > 0 && kk < 1) {
        shockRing(c, fx, fy, headR * (2.0 + kk * 5.0), accent,
                  0.42 * (1 - kk) * fade, Math.max(2.0, canvas.height * 0.0040 * (1 - kk)));
      }
    }

    // ---- left: 傲慢 + 七宗罪之首 + latin + rows
    const lx = canvas.width * 0.075;
    const cy = canvas.height * 0.440;

    // marker #19: this block reads gold, not the sin's accent colour
    const GOLD = [255, 196, 92];
    c.save();
    c.globalAlpha = fade;
    glowText(c, '七宗罪之首', lx, cy - canvas.height * 0.150, {
      font: '500 ' + Math.round(canvas.height * 0.0360) + 'px ' + FONT_CN,
      color: GOLD, alpha: 0.98, glow: 0.55, spread: 0.9, align: 'left',
    });
    slamChars(c, '傲慢', lx, cy, {
      font: '900 ' + Math.round(canvas.height * 0.185) + 'px ' + FONT_CN,
      color: [255, 236, 176],
      progress: clamp01((lt - 0.05) / 0.34), stagger: 0.09,
      tracking: canvas.height * 0.010, drop: 0.55, glow: 2.0, align: 'left',
      glowColor: GOLD,
    });
    glowText(c, 'SUPERBIA', lx + canvas.height * 0.005, cy + canvas.height * 0.130, {
      font: '400 ' + Math.round(canvas.height * 0.0300) + 'px ' + FONT_TECH,
      color: GOLD, alpha: 0.98 * clamp01((lt - 0.16) / 0.30),
      glow: 0.60, spread: 1.0, align: 'left',
    });
    const rowA = clamp01((lt - 0.24) / 0.34);
    glowText(c, '对立  谦逊  HUMILITAS', lx, cy + canvas.height * 0.205, {
      font: '400 ' + Math.round(canvas.height * 0.0260) + 'px ' + FONT_CN,
      color: [228, 224, 244], alpha: 0.84 * rowA, glow: 0.16, spread: 0.6, align: 'left',
    });
    glowText(c, '代表  路西法  LUCIFER', lx, cy + canvas.height * 0.253, {
      font: '400 ' + Math.round(canvas.height * 0.0250) + 'px ' + FONT_CN,
      color: GOLD, alpha: 0.94 * rowA, glow: 0.42, spread: 0.7, align: 'left',
    });
    c.restore();

    // marker #21 (revised): a handful of 成语 popping on the beat after the
    // drop. They used to sit in one small corner; now they are big and scattered
    // across the whole frame, so the drop reads as an eruption of words.
    const idiomStart = 0.28;
    const beatLen = BEAT * 1.0;
    // hand-placed anchors: (x, y) as fractions, plus a size multiplier and a
    // tilt, so they never line up and never overlap the big type on the left.
    // Five non-overlapping slots. Each later one must sit clear of the earlier
    // ones while they are still fading, so they are spread far apart: two above
    // the figure, one mid-left, one bottom-centre, one far right.
    // The figure occupies x 0.50-0.92 / y 0.05-1.0, so anything at x<0.46 or
    // y<0.10 is clear of it.
    // Left column (x<0.45, y 0.28-0.86) holds the copy, so idioms stay clear of
    // it: two along the top strip, one bottom strip, two on the right of the
    // figure. Verified with a vision pass - the earlier slots overlapped the
    // 对立/代表 rows.
    const IDIOM_PLACES = [
      { x: 0.330, y: 0.105, sz: 1.25, rot: -0.06 },  // top strip, left
      { x: 0.700, y: 0.070, sz: 1.10, rot: 0.05 },   // top strip, right
      { x: 0.500, y: 0.945, sz: 1.20, rot: -0.04 },  // bottom strip, centre
      { x: 0.930, y: 0.620, sz: 1.15, rot: 0.07 },   // right of the figure, low
      { x: 0.930, y: 0.180, sz: 1.05, rot: -0.05 },  // right of the figure, high
    ];
    for (let i = 0; i < IDIOMS.length; i++) {
      const t0 = idiomStart + i * beatLen;
      const local = lt - t0;
      if (local < 0) continue;
      const life = 0.92;
      if (local > life) continue;
      const pin = clamp01(local / 0.14);
      const pout = clamp01((local - (life - 0.40)) / 0.40);
      const a = easeOutExpo(pin) * (1 - pout) * fade;
      const sc = 1 + (1 - easeOutExpo(pin)) * 0.75;
      const pl = IDIOM_PLACES[i % IDIOM_PLACES.length];
      const px = canvas.width * pl.x;
      const py = canvas.height * pl.y - pout * canvas.height * 0.035;
      const size = Math.round(canvas.height * 0.098 * pl.sz);
      c.save();
      c.globalAlpha = a;
      c.translate(px, py);
      c.rotate(pl.rot);
      c.scale(sc, sc);
      // soft dark plate behind, so big type stays readable over the figure
      const plate = c.createRadialGradient(0, 0, 0, 0, 0, size * 2.4);
      plate.addColorStop(0, 'rgba(4,3,10,0.62)');
      plate.addColorStop(0.65, 'rgba(4,3,10,0.28)');
      plate.addColorStop(1, 'rgba(4,3,10,0)');
      c.fillStyle = plate;
      c.beginPath();
      c.arc(0, 0, size * 2.4, 0, Math.PI * 2);
      c.fill();
      glowText(c, IDIOMS[i], 0, 0, {
        font: '900 ' + size + 'px ' + FONT_CN,
        color: [255, 232, 168], alpha: 1, glow: 1.15, spread: 1.0,
        glowColor: [255, 190, 84],
      });
      c.restore();
    }
  }

  // -------------------------------------------------------------- desire outro
  function drawDesire(c, t, lt, accent) {
    const dur = DURATION - T.desire;
    const exit = clamp01((lt - (dur - 0.55)) / 0.55);
    const fade = 1 - exit;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.460;

    // closing ring
    const ra = easeOutCubic(clamp01(lt / 0.6));
    c.save();
    c.globalAlpha = fade;
    const R = canvas.height * 0.255;

    // tick ring, rotating
    c.save();
    c.translate(cx, cy);
    c.rotate(lt * 0.62);
    c.strokeStyle = rgba([255, 130, 180], 0.26 * ra);
    c.lineWidth = 1.2 * U;
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const long = i % 8 === 0;
      const r0 = R * 1.10;
      const r1 = r0 + canvas.height * (long ? 0.021 : 0.009);
      c.beginPath();
      c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();

    // embers rising through the outro
    c.save();
    c.globalCompositeOperation = 'lighter';
    const er = rng(9911);
    for (let i = 0; i < 90; i++) {
      const seed = er();
      const speed = 0.20 + er() * 0.26;
      const y = ((seed - lt * speed) % 1 + 1) % 1;
      const x = er() * canvas.width + Math.sin(lt * 1.6 + i) * 44 * U;
      const a = 0.42 + 0.58 * Math.abs(Math.sin(lt * 2.8 + i * 0.8));
      const rad = (2.0 + er() * 4.0) * U;
      // soft halo + hot core so they read at 1080p
      const g = c.createRadialGradient(x, y * canvas.height, 0, x, y * canvas.height, rad * 2.6);
      g.addColorStop(0, 'rgba(255,235,245,' + (0.85 * a * fade) + ')');
      g.addColorStop(0.35, rgba([255, 150, 195], a * fade));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y * canvas.height, rad * 2.6, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    c.strokeStyle = rgba([255, 120, 170], 0.70 * ra);
    c.lineWidth = Math.max(2.4, canvas.height * 0.0040);
    c.beginPath();
    c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ra);
    c.stroke();
    c.strokeStyle = 'rgba(255,235,245,' + 0.40 * ra + ')';
    c.lineWidth = Math.max(1.0, canvas.height * 0.0014);
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    c.save();
    c.globalAlpha = fade;
    const breathe = 1 + Math.sin(lt * 1.25) * 0.018;
    c.translate(cx, cy);
    c.scale(breathe, breathe);
    c.translate(-cx, -cy);
    glowText(c, '第八种', cx, cy - canvas.height * 0.105, {
      font: '400 ' + Math.round(canvas.height * 0.0330) + 'px ' + FONT_CN,
      color: [255, 210, 228], alpha: 0.86 * clamp01(lt / 0.4),
      glow: 0.30, spread: 0.7,
    });
    slamChars(c, '欲望', cx, cy + canvas.height * 0.020, {
      font: '900 ' + Math.round(canvas.height * 0.170) + 'px ' + FONT_CN,
      color: [255, 255, 255],
      progress: clamp01((lt - 0.10) / 0.45), stagger: 0.10,
      tracking: canvas.height * 0.012, drop: 0.5, glow: 1.0,
    });
    glowText(c, 'CUPIDITY', cx, cy + canvas.height * 0.135, {
      font: '400 ' + Math.round(canvas.height * 0.0280) + 'px ' + FONT_TECH,
      color: [255, 150, 190], alpha: 0.92 * clamp01((lt - 0.28) / 0.30),
      glow: 0.40, spread: 0.8,
    });
    glowText(c, '七种，都写在你身上', cx, cy + canvas.height * 0.215, {
      font: '400 ' + Math.round(canvas.height * 0.0250) + 'px ' + FONT_CN,
      color: [240, 235, 250], alpha: 0.70 * clamp01((lt - 0.50) / 0.35),
      glow: 0.20, spread: 0.6,
    });
    c.restore();
  }

  // ------------------------------------------------------------------- compose
  function render(t) {
    const c = ctx;
    c.save();

    // which shot are we in?
    let accent = PRIDE.accent;
    let energy = 1;
    const sin = sinAt(t);
    if (sin) accent = sin.sin.accent;
    if (t >= T.prideA) accent = PRIDE.accent;
    if (t >= T.desire) accent = [255, 130, 180];

    // camera shake
    const sh = shakeAt(t);
    if (sh > 0.01) {
      const sr = rng(Math.floor(t * 1000) + 7);
      c.translate((sr() - 0.5) * sh * U * 2, (sr() - 0.5) * sh * U * 2);
    }

    drawBackground(c, t, accent, energy);

    // ---- shot dispatch
    if (t < T.title[0]) {
      drawIntro(c, t - T.intro[0], PRIDE.accent);
    } else if (t < T.sinStart) {
      drawTitleCard(c, t - T.title[0], PRIDE.accent);
    } else if (sin) {
      drawSin(c, t, t - sin.t0, sin.t1 - sin.t0, sin.sin, accent);
    } else if (t < T.prideB) {
      drawPrideA(c, t, t - T.prideA, PRIDE.accent);
    } else if (t < T.prideC) {
      drawPrideB(c, t, t - T.prideB, PRIDE.accent);
    } else if (t < T.desire) {
      drawPrideC(c, t, t - T.prideC, PRIDE.accent);
    } else {
      drawDesire(c, t, t - T.desire, [255, 130, 180]);
    }

    c.restore();

    // ---- post: grain, scanlines, vignette, then flash and glitch
    post(c, t, { accent, noise: 0.038 });

    const fl = flashAt(t);
    if (fl > 0.004) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,255,255,' + fl + ')';
      c.fillRect(0, 0, canvas.width, canvas.height);
      c.restore();
    }

    const gl = glitchAt(t);
    if (gl > 0.004) glitch(c, canvas, gl, t, 13);
  }

  return {
    prepareFrame(time) {
      render(Math.max(0, Math.min(DURATION, time)));
    },
    dispose() {
      canvas.remove();
    },
  };
}

// The audio track in mh.json is generated from these anchors, so the two stay
// in sync: every HALO_EYES ignition and every cut gets one sound.
export const AUDIO_ANCHORS = {
  musicOffset: MUSIC_OFFSET,
  haloEyes: HALO_EYES,
  cuts: CUTS,
  drop: DROP_VIDEO,
  sinHits: SINS.map((_, i) => sinHit(i)),
  sinStarts: SINS.map((_, i) => sinWindow(i).t0),
  prideA: T.prideA,
  prideB: T.prideB,
  prideC: T.prideC,
  desire: T.desire,
};
