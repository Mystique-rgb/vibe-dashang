// 《传统七大自然奇观》 — 50s / 1920x1080 / 30fps
//
// The seven-sins skeleton, re-skinned. Same 132 BPM grid, same cut rhythm,
// same drop placement, same light effects; only the content layer is new.
//
// Structure: intro (reused from the seven-wonders opener) -> chapter card ->
// six wonders, 8 beats each with a second hit on beat 4 -> Everest build ->
// "地球之巅" slammed char by char -> DROP (Everest in full) -> outro.
//
// Music is 霓虹兔 - Chaikovsky, 132 BPM, drop at 91.640s. MUSIC_OFFSET puts that
// drop on video 41.818s, where Everest appears.
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
import { drawWonder, WONDER_POINTS } from './lib/wonders.js';
import {
  BEAT, BAR, DURATION, DROP_VIDEO, MUSIC_OFFSET, WONDERS, EVEREST, T,
  wonderWindow, wonderHit, q,
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

// A light sweep crossing the frame on a cut.
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



// --------------------------------------------------------------- fancy title
// marker #4: place names were flat white. This draws each character with a
// vertical gradient (white-hot top -> accent bottom), a dark outline so it
// reads over any art, and a per-character slam with overshoot.
function fancyTitle(c, text, x, y, o) {
  const font = o.font;
  const accent = o.accent || [255, 255, 255];
  const progress = clamp01(o.progress === undefined ? 1 : o.progress);
  const stagger = o.stagger === undefined ? 0.085 : o.stagger;
  const tracking = o.tracking || 0;
  const align = o.align || 'left';
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const glow = o.glow === undefined ? 1.6 : o.glow;

  c.save();
  c.font = font;
  const chars = Array.from(text);
  const n = chars.length;
  if (!n) { c.restore(); return; }
  const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
  const ws = chars.map((ch) => c.measureText(ch).width);
  let total = 0;
  for (let i = 0; i < n; i++) total += ws[i];
  total += tracking * (n - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;

  const span = stagger * (n - 1) + 0.26;
  for (let i = 0; i < n; i++) {
    const local = clamp01((progress * span - i * stagger) / 0.26);
    if (local <= 0) { cx += ws[i] + tracking; continue; }
    const k = easeOutBack(local, 2.4);          // overshoot: the glyph pops
    const sc = 0.55 + k * 0.45;
    const dy = (1 - easeOutExpo(local)) * -size * 0.55;

    c.save();
    c.translate(cx + ws[i] / 2, y + dy);
    c.scale(sc, sc);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.globalAlpha = alpha * Math.min(1, local * 2.0);

    // outer glow (blurred copy, never stacked offsets)
    if (glow > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      if (typeof c.filter === 'string') {
        c.filter = 'blur(' + (size * 0.075).toFixed(1) + 'px)';
        c.fillStyle = rgba(accent, 0.55 * glow);
        c.fillText(chars[i], 0, 0);
        c.filter = 'none';
      }
      c.restore();
    }

    // dark outline so the glyph survives over bright art
    c.lineJoin = 'round';
    c.lineWidth = Math.max(2.0, size * 0.055);
    c.strokeStyle = 'rgba(6,4,12,0.85)';
    c.strokeText(chars[i], 0, 0);

    // gradient fill: white-hot at the top, accent at the bottom
    const g = c.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.42, rgba([255, 250, 245], 1));
    g.addColorStop(0.72, rgba(accent, 1));
    g.addColorStop(1, rgba(accent, 0.85));
    c.fillStyle = g;
    c.fillText(chars[i], 0, 0);

    // a thin bright rim on the top edge, sells the "metal" read
    c.save();
    c.beginPath();
    c.rect(-ws[i], -size * 0.55, ws[i] * 2, size * 0.30);
    c.clip();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillText(chars[i], 0, 0);
    c.restore();

    c.restore();
    cx += ws[i] + tracking;
  }
  c.restore();
}

// ---------------------------------------------------------- transition impact
// A hard radial burst on the cut: concentric shock rings plus radial streaks.
// This is what makes a cut read as an event instead of a slide change.
function burstRings(c, x, y, r0, color, p, alpha, t, seed, H) {
  if (p <= 0 || p >= 1 || alpha <= 0.002) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const rr = rng(seed || 88);
  for (let k = 0; k < 3; k++) {
    const kk = clamp01((p - k * 0.09) / 0.85);
    if (kk <= 0 || kk >= 1) continue;
    const rad = r0 * (0.20 + kk * 1.55);
    const a = alpha * (1 - kk) * (0.85 - k * 0.18);
    c.strokeStyle = rgba(color, a);
    c.lineWidth = Math.max(1.6, (5.5 - k * 1.4) * (1 - kk) * (H / 1080));
    c.beginPath();
    c.arc(x, y, rad, 0, Math.PI * 2);
    c.stroke();
  }
  // radial streaks, uneven lengths so it does not read as a starburst clip-art
  const N = 30;
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + rr() * 0.12;
    const len = r0 * (0.5 + rr() * 0.85) * (0.35 + p * 1.5);
    const a = alpha * (1 - p) * (0.30 + rr() * 0.55);
    if (a <= 0.01) continue;
    const lg = c.createLinearGradient(
      x + Math.cos(ang) * r0 * 0.30, y + Math.sin(ang) * r0 * 0.30,
      x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    lg.addColorStop(0, rgba(color, a));
    lg.addColorStop(1, 'rgba(0,0,0,0)');
    c.strokeStyle = lg;
    c.lineWidth = (1.0 + rr() * 2.4) * (H / 1080);
    c.beginPath();
    c.moveTo(x + Math.cos(ang) * r0 * 0.30, y + Math.sin(ang) * r0 * 0.30);
    c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    c.stroke();
  }
  c.restore();
}

// Horizontal slice displacement: the frame tears sideways for a few frames.
// Cheap, and it is the single most effective "this cut hit hard" cue.
function sliceTear(c, canvasEl, amount, t, seed) {
  if (amount <= 0.004) return;
  const W = canvasEl.width;
  const H = canvasEl.height;
  const r = rng(Math.floor(t * 90) + (seed || 3));
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const y = Math.floor(r() * H);
    const h = Math.max(2, Math.floor((0.006 + r() * 0.035) * H));
    const dx = (r() - 0.5) * amount * W * 0.09;
    if (Math.abs(dx) < 0.5) continue;
    try {
      c.drawImage(canvasEl, 0, y, W, h, dx, y, W, h);
    } catch (e) { /* ignore */ }
  }
}

// Chromatic split: red and cyan ghosts pulled apart. Only on the hardest cuts.
function chromaSplit(c, canvasEl, amount, t) {
  if (amount <= 0.004) return;
  const W = canvasEl.width;
  const H = canvasEl.height;
  const d = amount * W * 0.006;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.26 * amount;
  try {
    c.drawImage(canvasEl, -d, 0, W, H);
    c.globalAlpha = 0.20 * amount;
    c.drawImage(canvasEl, d, 0, W, H);
  } catch (e) { /* ignore */ }
  c.restore();
}

// ------------------------------------------------------------------ constants
const RED = [255, 74, 66];

// every cut point, used for glitch + shake
const CUTS = (() => {
  const out = [T.title[0]];
  for (let i = 0; i < WONDERS.length; i++) {
    out.push(wonderWindow(i).t0);
    out.push(wonderHit(i));
  }
  out.push(T.buildA, T.buildB, T.buildC, T.outro);
  return out.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
})();

function glitchAt(t) {
  let g = 0;
  for (const c of CUTS) {
    const d = t - c;
    if (d < 0) continue;
    if (d < 0.10) g = Math.max(g, (1 - d / 0.10) * 1.00);
    else if (d < 0.30) g = Math.max(g, (1 - (d - 0.10) / 0.20) * 0.42);
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

// which wonder is on screen at t (null outside the six-wonder block)
function wonderAt(t) {
  for (let i = 0; i < WONDERS.length; i++) {
    const w = wonderWindow(i);
    if (t >= w.t0 && t < w.t1) return { i, ...w, wonder: WONDERS[i] };
  }
  return null;
}

export default function ({ root, width, height, pixelRatio }) {
  const W = width;
  const H = height;
  const DPR = Math.max(1, Math.min(2, pixelRatio || 1));

  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext('2d');
  root.appendChild(canvas);
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';

  const U = H / 1080;              // scale unit, 1 at 1080p
  const post = makePost(W, H);

  // deterministic star field
  const STARS = (() => {
    const r = rng(20261117);
    const out = [];
    for (let i = 0; i < 170; i++) {
      out.push({ x: r(), y: r() * 0.72, z: 0.3 + r() * 0.7,
                 tw: 0.5 + r() * 2.0, ph: r() * 6.283 });
    }
    return out;
  })();

  const DUST = (() => {
    const r = rng(771);
    const out = [];
    for (let i = 0; i < 60; i++) {
      out.push({ x: r(), y: r(), r: 0.6 + r() * 2.2,
                 sp: 0.008 + r() * 0.030, ph: r() * 6.283 });
    }
    return out;
  })();

  // ---------------------------------------------------------------- background
  function drawBackground(c, t, accent, energy) {
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.52;

    c.fillStyle = '#000';
    c.fillRect(0, 0, canvas.width, canvas.height);

    const bg = c.createRadialGradient(cx, cy, 0, cx, cy, canvas.height * 0.95);
    bg.addColorStop(0, rgba(accent, 0.055 * energy));
    bg.addColorStop(0.45, rgba(accent, 0.017 * energy));
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = bg;
    c.fillRect(0, 0, canvas.width, canvas.height);

    // faint concentric rings behind the subject
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
  // Small line "刻在地球上", big word "七大奇观".
  const INTRO_POINTS = 7;

  function drawIntro(c, lt, accent) {
    const dur = T.intro[1] - T.intro[0];
    const exit = clamp01((lt - (dur - 0.22)) / 0.22);
    const fade = 1 - exit;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;

    const ra = easeOutCubic(clamp01(lt / 0.26));
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

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < INTRO_POINTS; i++) {
      const ang = -Math.PI / 2 + (i / INTRO_POINTS) * Math.PI * 2;
      const t0 = 0.14 + i * 0.045;
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

      if (on && lit >= 1) {
        const nang = -Math.PI / 2 + ((i + 1) / INTRO_POINTS) * Math.PI * 2;
        const nOn = lt > 0.14 + ((i + 1) % INTRO_POINTS) * 0.045;
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

    const spin = lt * 0.95;
    c.save();
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

    c.save();
    c.globalAlpha = 0.055 * clamp01(lt / 0.6) * fade;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '700 ' + Math.round(canvas.height * 0.235) + 'px ' + FONT_TECH;
    c.fillStyle = '#ffffff';
    c.fillText('VII', cx, cy - canvas.height * 0.005);
    c.restore();

    c.save();
    c.globalAlpha = fade;
    glowText(c, '刻在地球上', cx, cy - canvas.height * 0.125, {
      font: '400 ' + Math.round(canvas.height * 0.036) + 'px ' + FONT_CN,
      color: [255, 255, 255], alpha: 0.80,
      glow: 0.35, spread: 0.8,
    });
    slamChars(c, '七大奇观', cx, cy + canvas.height * 0.005, {
      font: '900 ' + Math.round(canvas.height * 0.160) + 'px ' + FONT_CN,
      color: [255, 255, 255],
      progress: clamp01((lt - 0.12) / 0.42),
      stagger: 0.115, tracking: canvas.height * 0.010, drop: 0.55, glow: 1.0,
    });
    rule(c, cx, cy + canvas.height * 0.125, canvas.width * 0.20,
         (lt - 0.44) / 0.28, accent, 0.72 * fade, 2.4 * U);
    glowText(c, 'SEVEN  NATURAL  WONDERS', cx, cy + canvas.height * 0.178, {
      font: '400 ' + Math.round(canvas.height * 0.0215) + 'px ' + FONT_TECH,
      color: accent, alpha: 0.90 * clamp01((lt - 0.50) / 0.26),
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

    // The title is four characters wide, so the ring has to clear it: the glyph
    // box is ~0.115H per char x4 = 0.46H wide, i.e. 0.23H half-width, plus the
    // glow. 0.285H leaves a readable margin instead of the ring cutting the type.
    const R = canvas.height * 0.285;
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
    c.lineWidth = Math.max(1.0, canvas.height * 0.0014);
    c.beginPath();
    c.arc(cx, cy, R * 1.045, 0, Math.PI * 2);
    c.stroke();

    // tick ring, counter-rotating against a second ring so the hold is never still
    c.save();
    c.translate(cx, cy);
    c.rotate(lt * 0.85);
    c.strokeStyle = rgba(RED, 0.34 * ra);
    c.lineWidth = 1.2 * U;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const long = i % 5 === 0;
      const r0 = R * 1.075;
      const r1 = r0 + canvas.height * (long ? 0.019 : 0.008);
      c.beginPath();
      c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();

    // inner tick ring, spinning the other way
    c.save();
    c.translate(cx, cy);
    c.rotate(-lt * 0.52);
    c.strokeStyle = rgba(RED, 0.20 * ra);
    c.lineWidth = 1.0 * U;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r0 = R * 0.88;
      const r1 = r0 + canvas.height * 0.011;
      c.beginPath();
      c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      c.stroke();
    }
    c.restore();

    // two sparks orbiting the ring: continuous motion through the hold
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 2; k++) {
      const dir = k === 0 ? 1 : -1;
      const a = dir * lt * 1.35 + k * Math.PI;
      const rad = R * (k === 0 ? 1.045 : 1.095);
      const sx = cx + Math.cos(a) * rad;
      const sy = cy + Math.sin(a) * rad;
      const gg = c.createRadialGradient(sx, sy, 0, sx, sy, canvas.height * 0.028);
      gg.addColorStop(0, 'rgba(255,240,235,' + 0.80 * fade + ')');
      gg.addColorStop(0.32, rgba(RED, 0.52 * fade));
      gg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gg;
      c.beginPath();
      c.arc(sx, sy, canvas.height * 0.028, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // the ring itself breathes slightly
    c.save();
    c.translate(cx, cy);
    const brR = 1 + Math.sin(lt * 1.9) * 0.012;
    c.scale(brR, brR);
    c.strokeStyle = rgba(RED, 0.30 * ra);
    c.lineWidth = Math.max(2.0, canvas.height * 0.0022);
    c.beginPath();
    c.arc(0, 0, R * 1.030, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // No ghosted numeral behind the title: at any visible alpha it reads as a
    // smudge under the glyphs. The ring's own tick marks carry the HUD feel.

    // title, centred inside the ring
    glowText(c, '自然奇观', cx, cy - canvas.height * 0.010, {
      font: '900 ' + Math.round(canvas.height * 0.100) + 'px ' + FONT_CN,
      color: [255, 255, 255],
      alpha: 1.0 * clamp01(lt / 0.22),
      glow: 1.2, spread: 1.0,
    });
    glowText(c, 'NATURAL  WONDERS', cx, cy + canvas.height * 0.084, {
      font: '500 ' + Math.round(canvas.height * 0.0225) + 'px ' + FONT_TECH,
      color: [255, 158, 148], alpha: 1.0 * clamp01((lt - 0.14) / 0.24),
      glow: 0.55, spread: 0.9,
    });
    rule(c, cx, cy - canvas.height * 0.080, canvas.width * 0.105,
         (lt - 0.10) / 0.5, RED, 0.55 * fade, 2.0 * U);
    c.restore();
  }

  // --------------------------------------------------------------- wonder shot
  // Two halves: the scene line (beats 0-3), then the name card (beat 4 on).
  // The landscape is traced in on the first half, then its detail elements
  // ignite one by one on the second hit, each with one sound.
  function drawWonderShot(c, t, lt, dur, w, accent) {
    const half = dur * 0.5;
    const second = lt >= half;
    const p2 = second ? (lt - half) : 0;
    const exit = clamp01((lt - (dur - 0.13)) / 0.13);
    const fade = 1 - exit;

    // landscape sits right of centre; text keeps clear of it on the left
    const ls = canvas.height * 0.96;
    const fx = canvas.width * 0.735;
    const fy = canvas.height * 0.500;

    // reveal: traced in over the first half, full detail by the second hit
    const rev = easeOutCubic(clamp01(lt / (half * 0.85)));
    const det = second ? clamp01((p2 - 0.02) / (WONDER_POINTS * 0.058)) : 0;
    const glow = second ? 1.45 : 0.34 + 0.34 * clamp01(lt / half);

    // entering slide + a jolt when the name card lands
    const enter = easeOutCubic(clamp01(lt / 0.42));
    const jolt = second ? 1 + (1 - easeOutExpo(clamp01(p2 / 0.20))) * 0.030 : 1;
    // the art is static line work, so the camera has to carry the motion:
    // a slow breathing scale plus a drift, or the shot reads as a freeze.
    const br = (1 + Math.sin(t * 0.95) * 0.016 + Math.sin(t * 0.37) * 0.010) * jolt;
    const driftX = Math.sin(t * 0.42) * canvas.width * 0.006;
    const driftY = Math.sin(t * 0.31 + 1.1) * canvas.height * 0.005;

    c.save();
    c.translate(fx + (1 - enter) * canvas.width * 0.055 + driftX, fy + driftY);
    c.scale(br, br);
    drawWonder(c, {
      key: w.key, scale: ls, accent, alpha: fade * (second ? 1 : 0.90),
      glow, time: t, reveal: rev, detail: det,
    });
    // marker #7: "光效不够亮，要那种全身发光的"
    // Two additive emission passes on top of the crisp art:
    //   wide  - big blur, low alpha: the halo around the whole object
    //   tight - small blur, high alpha: the hot core along every line
    // Both scale with the detail sweep so they ignite as elements light up.
    if (second && det > 0.02) {
      const bloomA = clamp01(det * 1.8);
      // wide halo
      c.save();
      c.globalCompositeOperation = 'lighter';
      if (typeof c.filter === 'string') {
        c.filter = 'blur(' + (canvas.height * 0.038).toFixed(1) + 'px)';
      }
      c.globalAlpha = 1.55 * fade * bloomA;
      drawWonder(c, {
        key: w.key, scale: ls, accent, alpha: 1,
        glow: 0, time: t, reveal: 1, detail: det,
      });
      c.filter = 'none';
      c.restore();
      // tight hot core
      c.save();
      c.globalCompositeOperation = 'lighter';
      if (typeof c.filter === 'string') {
        c.filter = 'blur(' + (canvas.height * 0.009).toFixed(1) + 'px)';
      }
      c.globalAlpha = 1.15 * fade * bloomA;
      drawWonder(c, {
        key: w.key, scale: ls, accent, alpha: 1,
        glow: 0, time: t, reveal: 1, detail: det,
      });
      c.filter = 'none';
      c.restore();
      // a slow breathing flare at the visual centre, so the object pulses
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      const rg = c.createRadialGradient(fx, fy, 0, fx, fy, ls * 0.55);
      rg.addColorStop(0, rgba(accent, 0.30 * fade * bloomA * (0.6 + 0.4 * pulse)));
      rg.addColorStop(0.55, rgba(accent, 0.12 * fade * bloomA));
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rg;
      c.beginPath();
      c.arc(fx, fy, ls * 0.55, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.restore();

    // god rays behind the landscape, slowly rotating
    godRays(c, fx, fy, ls * 0.30, ls * 0.90, 20, t * 0.05,
            accent, 0.085 * fade * (0.55 + 0.45 * glow), t, 913);

    // anamorphic streak + full impact package on the second hit
    if (second) {
      const ka = clamp01(1 - p2 / 0.55);
      anamorphic(c, fx, fy - ls * 0.20, canvas.width * 0.34, canvas.height * 0.0080,
                 accent, 0.62 * ka * fade);
      starFlare(c, fx, fy - ls * 0.20, canvas.height * 0.032, accent,
                0.92 * ka * fade, t * 0.6);
      // radial burst from the centre of the landscape: the cut now reads as an
      // event, not a slide change
      burstRings(c, fx, fy, ls * 0.52, accent, clamp01(p2 / 0.85), 0.85 * fade, t,
                 4200 + w.key.length, canvas.height);
      // a second, tighter ring right at the impact
      shockRing(c, fx, fy, ls * (0.42 + p2 * 1.4), accent, 0.34 * ka * fade,
                Math.max(1.5, canvas.height * 0.0034));
    }

    lightSweep(c, clamp01(lt / 0.42), accent, 0.14 * fade, canvas.width, canvas.height);

    // thin bracket frame around the landscape, technical HUD feel
    c.save();
    c.globalAlpha = 0.30 * fade * clamp01(lt / 0.5);
    hudBrackets(c, fx - ls * 0.50, fy - ls * 0.50, ls, ls,
                canvas.height * 0.030, accent, 0.5, 1.4 * U);
    c.restore();

    // rising motes on the left half
    c.save();
    c.globalCompositeOperation = 'lighter';
    const mr = rng(3307 + Math.floor(t));
    for (let i = 0; i < 24; i++) {
      const seed = mr();
      const y = ((seed - t * (0.09 + mr() * 0.10)) % 1 + 1) % 1;
      const x = mr() * canvas.width * 0.56 + Math.sin(t * 1.1 + i) * 18 * U;
      const a = 0.14 + 0.28 * Math.abs(Math.sin(t * 1.9 + i));
      c.fillStyle = rgba(accent, a * fade);
      c.beginPath();
      c.arc(x, y * canvas.height, (1.0 + mr() * 2.0) * U, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // ---- left copy
    const lx = canvas.width * 0.068;
    const lyScene = canvas.height * 0.430;

    if (!second) {
      const a = clamp01(lt / 0.30) * fade;
      c.save();
      c.globalAlpha = a;
      glowText(c, w.scene, lx, lyScene, {
        font: '500 ' + Math.round(canvas.height * 0.0450) + 'px ' + FONT_CN,
        color: [255, 254, 255], alpha: 1, glow: 0.45, spread: 0.8, align: 'left',
      });
      glowText(c, w.quote, lx, lyScene + canvas.height * 0.086, {
        font: '400 ' + Math.round(canvas.height * 0.0385) + 'px ' + FONT_CN,
        color: accent, alpha: 1.0 * clamp01((lt - 0.16) / 0.30),
        glow: 0.85, spread: 1.0, align: 'left',
      });
      c.restore();
      c.save();
      c.globalAlpha = a;
      c.fillStyle = rgba(accent, 0.75);
      c.fillRect(lx - canvas.width * 0.020, lyScene - canvas.height * 0.055,
                 2.4 * U, canvas.height * 0.160 * easeOutCubic(clamp01(lt / 0.4)));
      c.restore();
    } else {
      const a = fade;
      c.save();
      c.globalAlpha = a;

      const numCN = { VII: '七', VI: '六', V: '五', IV: '四', III: '三', II: '二', I: '一' }[w.num] || '';

      glowText(c, '世界七大自然奇观 · ' + numCN, lx, canvas.height * 0.268, {
        font: '500 ' + Math.round(canvas.height * 0.0330) + 'px ' + FONT_CN,
        color: [252, 250, 255], alpha: 1.0 * clamp01(p2 / 0.20),
        glow: 0.35, spread: 0.7, align: 'left',
      });

      // the big name, auto-fitted so seven-character names still clear the art
      // long names need more width and a tighter stagger, or the tail
      // characters are still arriving when the shot cuts
      const chars = Array.from(w.zh).length;
      const nameW = canvas.width * (chars >= 5 ? 0.60 : 0.475);
      const size = Math.min(
        canvas.height * (chars >= 5 ? 0.112 : 0.150),
        nameW / Math.max(1, chars) * (chars >= 5 ? 0.98 : 1)
      );
      const nameStagger = chars >= 5 ? 0.042 : 0.070;
      // marker #4: gradient fill + outline + accent glow, slammed in per char
      fancyTitle(c, w.zh, lx, canvas.height * 0.400, {
        font: '900 ' + Math.round(size) + 'px ' + FONT_CN,
        accent, alpha: 1,
        progress: clamp01(p2 / 0.36), stagger: nameStagger,
        tracking: canvas.height * 0.006, glow: 1.9, align: 'left',
      });
      // a light streak sweeping across the name as it lands
      const swP = clamp01((p2 - 0.05) / 0.55);
      if (swP > 0 && swP < 1) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const sx = lx + nameW * (swP * 1.5 - 0.25);
        const sg = c.createLinearGradient(sx - canvas.width * 0.05, 0, sx + canvas.width * 0.05, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)');
        sg.addColorStop(0.5, rgba(accent, 0.42 * (1 - swP)));
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = sg;
        c.fillRect(lx - canvas.width * 0.02, canvas.height * 0.330,
                   nameW + canvas.width * 0.04, canvas.height * 0.115);
        c.restore();
      }

      glowText(c, w.la, lx + canvas.height * 0.004, canvas.height * 0.478, {
        font: '400 ' + Math.round(canvas.height * 0.0275) + 'px ' + FONT_TECH,
        color: accent, alpha: 1.0 * clamp01((p2 - 0.14) / 0.26),
        glow: 0.90, spread: 1.0, align: 'left',
      });

      const rowA = clamp01((p2 - 0.22) / 0.28);
      glowText(c, w.stat1, lx, canvas.height * 0.560, {
        font: '500 ' + Math.round(canvas.height * 0.0270) + 'px ' + FONT_CN,
        color: [232, 230, 246], alpha: 0.86 * rowA, glow: 0.16, spread: 0.6, align: 'left',
      });
      glowText(c, w.stat2, lx, canvas.height * 0.610, {
        font: '400 ' + Math.round(canvas.height * 0.0255) + 'px ' + FONT_CN,
        color: accent, alpha: 0.90 * rowA, glow: 0.30, spread: 0.6, align: 'left',
      });
      glowText(c, w.where, lx, canvas.height * 0.672, {
        font: '400 ' + Math.round(canvas.height * 0.0220) + 'px ' + FONT_TECH,
        color: [210, 208, 226], alpha: 0.62 * rowA, glow: 0.10, spread: 0.5, align: 'left',
      });

      rule(c, lx + canvas.width * 0.070, canvas.height * 0.218,
           canvas.width * 0.130, p2 / 0.4, accent, 0.85 * a, 2.6 * U);
      c.restore();
    }
  }

  // --------------------------------------------------------------- everest build
  // A: the build. Everest faint on the right, six facts ticking in on the left,
  // and the pressure rising the whole way.
  function drawBuildA(c, t, lt, accent) {
    const dur = T.buildB - T.buildA;
    const p = clamp01(lt / dur);

    // slow push-in: the frame is never fully static
    c.save();
    const zoom = 1 + 0.045 * easeOutCubic(p);
    c.translate(canvas.width * 0.5, canvas.height * 0.5);
    c.scale(zoom, zoom);
    c.translate(-canvas.width * 0.5, -canvas.height * 0.5);

    const ls = canvas.height * (0.90 + 0.10 * p + Math.sin(t * 0.55) * 0.010);
    const fx = canvas.width * (0.735 - 0.012 * p) + Math.sin(t * 0.40) * canvas.width * 0.005;
    const fy = canvas.height * 0.500 + Math.sin(t * 0.33 + 0.8) * canvas.height * 0.005;

    // the mountain traces itself in as the facts land, one band at a time
    c.save();
    c.translate(fx, fy);
    drawWonder(c, {
      key: 'everest', scale: ls, accent,
      alpha: clamp01((p - 0.02) / 0.30) * (0.34 + 0.34 * p),
      glow: 0.08 + 0.60 * p * p,
      time: t,
      reveal: clamp01((p - 0.04) / 0.55),
      detail: clamp01((p - 0.30) / 0.70) * 0.80,
    });
    c.restore();

    // a rising ring behind the mountain, closing in
    c.save();
    c.globalCompositeOperation = 'lighter';
    const rr = canvas.height * (1.00 - 0.50 * p);
    c.strokeStyle = rgba(accent, 0.10 + 0.20 * p);
    c.lineWidth = Math.max(1.5, canvas.height * 0.0030 * (1 + p));
    c.beginPath();
    c.arc(fx, fy, rr, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // six facts, one per slot, each one bigger and brighter than the last
    const SLOT = dur / 6;
    const lx = canvas.width * 0.075;
    const baseY = canvas.height * 0.300;
    const gap = canvas.height * 0.090;
    for (let i = 0; i < EVEREST.lines.length; i++) {
      const t0 = i * SLOT;
      if (lt < t0) continue;
      const local = clamp01((lt - t0) / 0.26);
      const age = (lt - t0) / SLOT;
      const fadeIn = easeOutExpo(local);
      const dim = 1 - clamp01((age - 0.30) / 1.4) * 0.70;
      const weight = 1 + i * 0.055;
      const slide = (1 - fadeIn) * -canvas.width * 0.042;

      c.save();
      c.globalAlpha = fadeIn * dim;
      glowText(c, EVEREST.lines[i], lx + slide, baseY + i * gap, {
        font: '400 ' + Math.round(canvas.height * 0.0430 * weight) + 'px ' + FONT_CN,
        color: [252, 250, 255], alpha: 1,
        glow: 0.30 + 0.12 * i, spread: 0.8, align: 'left',
      });
      if (i === EVEREST.lines.length - 1 || age < 0.4) {
        c.fillStyle = rgba(accent, 0.85 * (1 - clamp01(age / 0.5)));
        c.fillRect(lx - canvas.width * 0.018, baseY + i * gap - canvas.height * 0.016,
                   canvas.width * 0.009 * easeOutCubic(clamp01(local)), 2.4 * U);
      }
      c.restore();
    }

    // embers rising on the right, so the gap between lines is never dead
    c.save();
    c.globalCompositeOperation = 'lighter';
    const emR = rng(5511);
    for (let i = 0; i < 56; i++) {
      const seed = emR();
      const speed = 0.09 + emR() * 0.13;
      const y = ((seed - lt * speed) % 1 + 1) % 1;
      const x = (emR() * 0.52 + 0.44) * canvas.width + Math.sin(lt * 1.0 + i) * 28 * U;
      const a = 0.26 + 0.48 * Math.abs(Math.sin(lt * 2.0 + i * 0.7));
      const sz = (1.4 + emR() * 2.8) * U;
      const g = c.createRadialGradient(x, y * canvas.height, 0, x, y * canvas.height, sz * 2.4);
      g.addColorStop(0, 'rgba(255,240,220,' + (0.78 * a * (0.4 + 0.6 * p)) + ')');
      g.addColorStop(0.35, rgba(accent, a * (0.35 + 0.65 * p)));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y * canvas.height, sz * 2.4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // a slow scan line sweeping down
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

    // caption + a pressure meter filling as the build runs out
    c.save();
    c.globalAlpha = 0.62 * clamp01((lt - 0.4) / 0.9);
    glowText(c, 'CULMEN · 8,848.86 M', canvas.width * 0.075, canvas.height * 0.862, {
      font: '400 ' + Math.round(canvas.height * 0.0210) + 'px ' + FONT_TECH,
      color: accent, alpha: 0.85, glow: 0.30, spread: 0.8, align: 'left',
    });
    c.restore();

    c.save();
    const mw = canvas.width * 0.26;
    const mx = canvas.width * 0.075;
    const my = canvas.height * 0.900;
    c.fillStyle = rgba(accent, 0.18);
    c.fillRect(mx, my, mw, 2.2 * U);
    c.fillStyle = rgba(accent, 0.95);
    c.fillRect(mx, my, mw * p * p, 2.2 * U);
    c.restore();

    c.restore();
  }

  // B: "地球之巅" slams down character by character, each one heavier.
  function drawBuildB(c, t, lt, accent) {
    const dur = T.buildC - T.buildB;
    const ls = canvas.height * (0.96 + Math.sin(t * 0.62) * 0.012);
    const fx = canvas.width * 0.720 + Math.sin(t * 0.44) * canvas.width * 0.005;
    const fy = canvas.height * 0.500 + Math.sin(t * 0.35 + 1.4) * canvas.height * 0.005;

    const gain = clamp01(lt / dur);
    c.save();
    c.translate(fx, fy);
    drawWonder(c, {
      key: 'everest', scale: ls, accent, alpha: 0.48 + 0.42 * gain,
      glow: 0.10 + 0.50 * gain, time: t,
      reveal: 1,
      detail: 0.55 + 0.45 * clamp01((lt - dur * 0.45) / (dur * 0.55)),
    });
    c.restore();

    // light keeps working behind the mountain: rays + rising embers, so the
    // frame never freezes once the last character has landed.
    const gainA = 0.10 + 0.34 * gain;
    godRays(c, fx, fy, ls * 0.26, ls * 0.95, 22, t * 0.05,
            accent, gainA, t, 4113);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const emR2 = rng(7717);
    for (let i = 0; i < 48; i++) {
      const seed = emR2();
      const speed = 0.10 + emR2() * 0.14;
      const y = ((seed - lt * speed) % 1 + 1) % 1;
      const x = (emR2() * 0.50 + 0.46) * canvas.width + Math.sin(lt * 1.1 + i) * 26 * U;
      const a = 0.22 + 0.46 * Math.abs(Math.sin(lt * 2.1 + i * 0.7));
      const sz = (1.3 + emR2() * 2.6) * U;
      const g = c.createRadialGradient(x, y * canvas.height, 0, x, y * canvas.height, sz * 2.4);
      g.addColorStop(0, 'rgba(255,240,215,' + (0.72 * a * (0.3 + 0.7 * gain)) + ')');
      g.addColorStop(0.35, rgba(accent, a * (0.3 + 0.7 * gain)));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y * canvas.height, sz * 2.4, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // the four characters, each slamming in on its own beat
    const text = EVEREST.title;
    const chars = Array.from(text);
    const n = chars.length;
    const step = Math.min(BEAT * 2, dur / (n + 0.9));
    const baseY = canvas.height * 0.470;
    const cx = canvas.width * 0.285;
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

    // the last character throws a shockwave across the frame
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

  // C: the drop. Everest in full, the biggest hit of the piece.
  function drawBuildC(c, t, lt, accent) {
    const dur = T.outro - T.buildC;
    const exit = clamp01((lt - (dur - 0.22)) / 0.22);
    const fade = 1 - exit;

    const ls = canvas.height * 1.02;
    const fx = canvas.width * 0.712;
    const fy = canvas.height * 0.500;

    const punch = 1 + (1 - easeOutExpo(clamp01(lt / 0.36))) * 0.13;
    c.save();
    c.translate(fx, fy);
    c.scale(punch, punch);
    drawWonder(c, {
      key: 'everest', scale: ls, accent, alpha: fade, glow: 1.0,
      time: t, reveal: 1, detail: 1,
    });
    c.restore();

    speedLines(c, fx, fy, canvas.height * 0.26, canvas.height * 0.95, 52,
               clamp01(lt / 0.85), accent, 0.30 * (1 - clamp01(lt / 1.2)), t, 773);

    const dropA = clamp01(1 - lt / 1.5);
    godRays(c, fx, fy, ls * 0.28, ls * 1.10, 28, -t * 0.08,
            accent, 0.18 * dropA * fade, t, 3133);
    anamorphic(c, fx, fy - ls * 0.16, canvas.width * 0.42, canvas.height * 0.0090,
               [255, 226, 170], 0.75 * dropA * fade);
    starFlare(c, fx, fy - ls * 0.16, canvas.height * 0.042, [255, 232, 180],
              0.90 * dropA * fade, t * 0.5);
    for (let k = 0; k < 3; k++) {
      const kk = clamp01((lt - k * 0.10) / 0.95);
      if (kk > 0 && kk < 1) {
        shockRing(c, fx, fy, ls * (0.35 + kk * 1.4), accent,
                  0.40 * (1 - kk) * fade, Math.max(2.0, canvas.height * 0.0040 * (1 - kk)));
      }
    }

    // ---- left: 珠穆朗玛 + 地球之巅 + latin + rows, all gold
    const GOLD = [255, 196, 92];
    const lx = canvas.width * 0.072;
    c.save();
    c.globalAlpha = fade;

    glowText(c, '世界七大自然奇观 · 一', lx, canvas.height * 0.258, {
      font: '500 ' + Math.round(canvas.height * 0.0330) + 'px ' + FONT_CN,
      color: GOLD, alpha: 0.96, glow: 0.55, spread: 0.9, align: 'left',
    });
    slamChars(c, '珠穆朗玛', lx, canvas.height * 0.395, {
      font: '900 ' + Math.round(canvas.height * 0.150) + 'px ' + FONT_CN,
      color: [255, 236, 176],
      progress: clamp01((lt - 0.05) / 0.34), stagger: 0.09,
      tracking: canvas.height * 0.008, drop: 0.55, glow: 2.0, align: 'left',
      glowColor: GOLD,
    });
    glowText(c, 'CULMEN · SAGARMATHA', lx + canvas.height * 0.004, canvas.height * 0.470, {
      font: '400 ' + Math.round(canvas.height * 0.0270) + 'px ' + FONT_TECH,
      color: GOLD, alpha: 0.96 * clamp01((lt - 0.16) / 0.30),
      glow: 0.60, spread: 1.0, align: 'left',
    });
    const rowA = clamp01((lt - 0.24) / 0.34);
    glowText(c, EVEREST.stat1, lx, canvas.height * 0.552, {
      font: '500 ' + Math.round(canvas.height * 0.0270) + 'px ' + FONT_CN,
      color: [232, 226, 244], alpha: 0.88 * rowA, glow: 0.16, spread: 0.6, align: 'left',
    });
    glowText(c, EVEREST.stat2, lx, canvas.height * 0.602, {
      font: '400 ' + Math.round(canvas.height * 0.0255) + 'px ' + FONT_CN,
      color: GOLD, alpha: 0.94 * rowA, glow: 0.42, spread: 0.7, align: 'left',
    });
    glowText(c, EVEREST.where, lx, canvas.height * 0.664, {
      font: '400 ' + Math.round(canvas.height * 0.0220) + 'px ' + FONT_TECH,
      color: [214, 210, 228], alpha: 0.64 * rowA, glow: 0.10, spread: 0.5, align: 'left',
    });
    c.restore();

    // five short phrases popping on the beat after the drop
    const PHRASES = ['世界之巅', '万山之巅', '一步登天', '云上之国', '最高处'];
    const PLACES = [
      { x: 0.310, y: 0.108, sz: 1.20, rot: -0.05 },
      { x: 0.660, y: 0.072, sz: 1.05, rot: 0.05 },
      { x: 0.480, y: 0.940, sz: 1.15, rot: -0.04 },
      { x: 0.930, y: 0.600, sz: 1.10, rot: 0.06 },
      { x: 0.930, y: 0.170, sz: 1.00, rot: -0.05 },
    ];
    const idiomStart = 0.28;
    for (let i = 0; i < PHRASES.length; i++) {
      const local = lt - (idiomStart + i * BEAT);
      if (local < 0) continue;
      const life = 0.92;
      if (local > life) continue;
      const pin = clamp01(local / 0.14);
      const pout = clamp01((local - (life - 0.40)) / 0.40);
      const a = easeOutExpo(pin) * (1 - pout) * fade;
      const sc = 1 + (1 - easeOutExpo(pin)) * 0.75;
      const pl = PLACES[i % PLACES.length];
      const px = canvas.width * pl.x;
      const py = canvas.height * pl.y - pout * canvas.height * 0.035;
      const size = Math.round(canvas.height * 0.096 * pl.sz);
      c.save();
      c.globalAlpha = a;
      c.translate(px, py);
      c.rotate(pl.rot);
      c.scale(sc, sc);
      const plate = c.createRadialGradient(0, 0, 0, 0, 0, size * 2.4);
      plate.addColorStop(0, 'rgba(4,3,10,0.62)');
      plate.addColorStop(0.65, 'rgba(4,3,10,0.28)');
      plate.addColorStop(1, 'rgba(4,3,10,0)');
      c.fillStyle = plate;
      c.beginPath();
      c.arc(0, 0, size * 2.4, 0, Math.PI * 2);
      c.fill();
      glowText(c, PHRASES[i], 0, 0, {
        font: '900 ' + size + 'px ' + FONT_CN,
        color: [255, 232, 168], alpha: 1, glow: 1.15, spread: 1.0,
        glowColor: [255, 190, 84],
      });
      c.restore();
    }
  }

  // -------------------------------------------------------------------- outro
  function drawOutro(c, t, lt, accent) {
    const dur = DURATION - T.outro;
    const exit = clamp01((lt - (dur - 0.55)) / 0.55);
    const fade = 1 - exit;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.460;

    const ra = easeOutCubic(clamp01(lt / 0.6));
    c.save();
    c.globalAlpha = fade;
    const R = canvas.height * 0.255;

    // tick ring, rotating
    c.save();
    c.translate(cx, cy);
    c.rotate(lt * 0.62);
    c.strokeStyle = rgba([255, 200, 120], 0.26 * ra);
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
    for (let i = 0; i < 84; i++) {
      const seed = er();
      const speed = 0.20 + er() * 0.26;
      const y = ((seed - lt * speed) % 1 + 1) % 1;
      const x = er() * canvas.width + Math.sin(lt * 1.6 + i) * 42 * U;
      const a = 0.40 + 0.56 * Math.abs(Math.sin(lt * 2.8 + i * 0.8));
      const rad = (2.0 + er() * 3.8) * U;
      const g = c.createRadialGradient(x, y * canvas.height, 0, x, y * canvas.height, rad * 2.6);
      g.addColorStop(0, 'rgba(255,240,215,' + (0.82 * a * fade) + ')');
      g.addColorStop(0.35, rgba([255, 190, 120], a * fade));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y * canvas.height, rad * 2.6, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    c.strokeStyle = rgba([255, 190, 110], 0.70 * ra);
    c.lineWidth = Math.max(2.4, canvas.height * 0.0040);
    c.beginPath();
    c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ra);
    c.stroke();
    c.strokeStyle = 'rgba(255,240,220,' + 0.40 * ra + ')';
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

    glowText(c, '七个地方，一种尺度', cx, cy - canvas.height * 0.108, {
      font: '400 ' + Math.round(canvas.height * 0.0320) + 'px ' + FONT_CN,
      color: [255, 226, 196], alpha: 0.86 * clamp01(lt / 0.4),
      glow: 0.30, spread: 0.7,
    });
    slamChars(c, '地球', cx, cy + canvas.height * 0.018, {
      font: '900 ' + Math.round(canvas.height * 0.170) + 'px ' + FONT_CN,
      color: [255, 255, 255],
      progress: clamp01((lt - 0.10) / 0.45), stagger: 0.10,
      tracking: canvas.height * 0.012, drop: 0.5, glow: 1.0,
    });
    glowText(c, 'THE  PLANET', cx, cy + canvas.height * 0.135, {
      font: '400 ' + Math.round(canvas.height * 0.0280) + 'px ' + FONT_TECH,
      color: [255, 190, 120], alpha: 0.92 * clamp01((lt - 0.28) / 0.30),
      glow: 0.40, spread: 0.8,
    });
    glowText(c, '我们只是，刚好住在上面', cx, cy + canvas.height * 0.215, {
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
    let accent = EVEREST.accent;
    let energy = 1;
    const shot = wonderAt(t);
    if (shot) accent = shot.wonder.accent;
    if (t >= T.buildA) accent = EVEREST.accent;
    if (t >= T.outro) accent = [255, 190, 110];

    const sh = shakeAt(t);
    if (sh > 0.01) {
      const sr = rng(Math.floor(t * 1000) + 7);
      c.translate((sr() - 0.5) * sh * U * 2, (sr() - 0.5) * sh * U * 2);
    }

    drawBackground(c, t, accent, energy);

    if (t < T.title[0]) {
      drawIntro(c, t - T.intro[0], [150, 210, 255]);
    } else if (t < T.sinStart) {
      drawTitleCard(c, t - T.title[0], RED);
    } else if (shot) {
      drawWonderShot(c, t, t - shot.t0, shot.t1 - shot.t0, shot.wonder, accent);
    } else if (t < T.buildB) {
      drawBuildA(c, t, t - T.buildA, EVEREST.accent);
    } else if (t < T.buildC) {
      drawBuildB(c, t, t - T.buildB, EVEREST.accent);
    } else if (t < T.outro) {
      drawBuildC(c, t, t - T.buildC, EVEREST.accent);
    } else {
      drawOutro(c, t, t - T.outro, [255, 190, 110]);
    }

    c.restore();

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

    // horizontal tearing for a few frames after every cut. Driven by the same
    // envelope as the glitch so it lands exactly on the beat.
    if (gl > 0.10) {
      sliceTear(c, canvas, gl * 1.35, t, 21);
      chromaSplit(c, canvas, Math.max(0, gl - 0.30), t);
    }
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

// The audio track is generated from these anchors, so the two stay in sync:
// every WONDER_POINTS ignition and every cut gets one sound.
export const AUDIO_ANCHORS = {
  musicOffset: MUSIC_OFFSET,
  wonderPoints: WONDER_POINTS,
  cuts: CUTS,
  drop: DROP_VIDEO,
  wonderHits: WONDERS.map((_, i) => wonderHit(i)),
  wonderStarts: WONDERS.map((_, i) => wonderWindow(i).t0),
  buildA: T.buildA,
  buildB: T.buildB,
  buildC: T.buildC,
  outro: T.outro,
};
