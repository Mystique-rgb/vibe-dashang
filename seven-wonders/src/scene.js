import { WONDERS, PYRAMID, polyLength, bounds } from './lib/shapes.js';
import {
  makeCanvas, clamp, clamp01, lerp, smoothstep, easeOutCubic, easeInCubic,
  easeInOutCubic, easeOutExpo, easeOutQuint, easeOutBack, rng, rgba,
  strokePartial, drawChars, measureTracked, brackets,
} from './lib/gfx.js';
import { createBackground } from './lib/bg.js';

// ------------------------------------------------------------------ timeline
// Music is offset so that the song's 91.60s drop lands on video 40.00s.
export const MUSIC_OFFSET = 51.6;
const DROP = 40.0;
const BEAT = 0.4555;

const SHOTS = [
  { kind: 'intro', t0: 0.0, t1: 2.6 },
  { kind: 'wonder', i: 0, t0: 2.6, t1: 5.4 },
  { kind: 'wonder', i: 1, t0: 5.4, t1: 8.2 },
  { kind: 'wonder', i: 2, t0: 8.2, t1: 11.0 },
  { kind: 'wonder', i: 3, t0: 11.0, t1: 13.8 },
  { kind: 'wonder', i: 4, t0: 13.8, t1: 16.6 },
  { kind: 'wonder', i: 5, t0: 16.6, t1: 19.4 },
  { kind: 'purge', t0: 19.4, t1: 23.0 },
  { kind: 'count', t0: 23.0, t1: 33.4 },
  { kind: 'last', t0: 33.4, t1: DROP },
  { kind: 'pyramid', t0: DROP, t1: 46.6 },
  { kind: 'outro', t0: 46.6, t1: 50.0 },
];

const CUTS = SHOTS.slice(1).map((s) => s.t0);

function shotAt(t) {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].t0) return SHOTS[i];
  return SHOTS[0];
}

// glitch impulse around a cut
function glitchAt(t) {
  let g = 0;
  for (const c of CUTS) {
    const d = t - c;
    if (d < 0) continue;
    if (d < 0.16) g = Math.max(g, (1 - d / 0.16) * 0.9);
    else if (d < 0.30) g = Math.max(g, (1 - (d - 0.16) / 0.14) * 0.35);
  }
  // extra hit right on the drop
  const dd = t - DROP;
  if (dd >= 0 && dd < 0.5) g = Math.max(g, (1 - dd / 0.5) * 1.0);
  return g;
}

function shakeAt(t) {
  let s = 0;
  for (const c of CUTS) {
    const d = t - c;
    if (d >= 0 && d < 0.32) s = Math.max(s, (1 - d / 0.32) * 5.5);
  }
  const dd = t - DROP;
  if (dd >= 0 && dd < 1.0) s = Math.max(s, (1 - dd / 1.0) * 26);
  if (dd >= 0 && dd < 2.2) s = Math.max(s, (1 - dd / 2.2) * 7);
  return s;
}

const FONT_CN = '"Noto Sans SC","Microsoft YaHei","PingFang SC",sans-serif';
const FONT_TECH = '"Bahnschrift","Arial Narrow",sans-serif';
const FONT_MONO = 'Consolas,"Courier New",monospace';

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

  const chanR = makeCanvas(canvas.width, canvas.height);
  const chanC = makeCanvas(canvas.width, canvas.height);
  const rctx = chanR.getContext('2d');
  const cctx = chanC.getContext('2d');

  const bg = createBackground(canvas.width, canvas.height);

  // particle pool for dissolves and the drop burst
  const pr = rng(773311);
  const particles = [];
  for (let i = 0; i < 460; i++) {
    particles.push({
      a: pr() * Math.PI * 2,
      r: pr(),
      sp: 0.35 + pr() * 1.5,
      sz: 0.7 + pr() * 2.6,
      life: 0.5 + pr() * 0.9,
      spin: (pr() - 0.5) * 3,
    });
  }

  // precompute geometry in pixel space per wonder (fit to a box)
  const fit = (lines, cx, cy, bw, bh) => {
    const b = bounds(lines);
    const s = Math.min(bw / Math.max(0.001, b.w), bh / Math.max(0.001, b.h));
    const ox = cx - (b.x0 + b.x1) / 2 * s;
    const oy = cy + (b.y0 + b.y1) / 2 * s;
    const out = lines.map((pl) => pl.map(([x, y]) => [ox + x * s, oy - y * s]));
    return { lines: out, scale: s, box: b };
  };

  const GEO = WONDERS.map((w) => {
    const g = fit(w.lines, W * 0.535, H * 0.470, W * 0.40, H * 0.62);
    const lens = g.lines.map(polyLength);
    const total = lens.reduce((a, b) => a + b, 0);
    return { ...g, lens, total };
  });
  const PYR = (() => {
    const g = fit(PYRAMID.lines, W * 0.5, H * 0.565, W * 0.46, H * 0.575);
    const lens = g.lines.map(polyLength);
    return { ...g, lens, total: lens.reduce((a, b) => a + b, 0) };
  })();

  // ------------------------------------------------------------------ pieces
  function drawWire(g, o) {
    const { accent, reveal, alpha, glow, sweep, lw } = o;
    const { ctx: c } = o;
    const base = lw || Math.max(1.4, H / 620);
    // Stagger the reveal across however many polylines this shape has, so
    // dense shapes still finish drawing while reveal goes 0 to 1.
    const cnt = g.lines.length;
    const step = cnt > 0 ? Math.min(0.010, 0.52 / cnt) : 0;
    const span = Math.min(0.62, 1 - step * (cnt - 1));

    // wide soft glow pass
    if (glow > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.shadowColor = rgba(accent, 0.95);
      c.shadowBlur = H * 0.055 * glow;
      c.strokeStyle = rgba(accent, 0.30 * alpha * glow);
      c.lineWidth = base * 2.4;
      c.lineJoin = 'round';
      c.lineCap = 'round';
      for (let i = 0; i < cnt; i++) {
        const st = clamp01((reveal - i * step) / span);
        if (st <= 0) continue;
        strokePartial(c, g.lines[i], st);
      }
      c.restore();
    }

    // crisp pass
    c.save();
    c.strokeStyle = rgba(accent, alpha);
    c.lineWidth = base;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    for (let i = 0; i < cnt; i++) {
      const st = clamp01((reveal - i * step) / span);
      if (st <= 0) continue;
      strokePartial(c, g.lines[i], st);
    }
    c.restore();

    // travelling highlight along the traced path
    if (sweep > 0 && sweep < 1) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(255,255,255,' + (0.85 * alpha) + ')';
      c.lineWidth = base * 1.5;
      c.shadowColor = 'rgba(255,255,255,0.9)';
      c.shadowBlur = H * 0.02;
      c.lineCap = 'round';
      const band = 0.055;
      for (let i = 0; i < cnt; i++) {
        const off = i * step;
        const local = (sweep - off) / span;
        if (local < 0 || local > 1) continue;
        const a = clamp01((local - band) / 0.02);
        const b = clamp01(local);
        if (b <= a) continue;
        const pl = g.lines[i];
        let tot = g.lens[i];
        let budget = tot * a;
        c.beginPath();
        let started = false;
        for (let k = 1; k < pl.length; k++) {
          const d = Math.hypot(pl[k][0] - pl[k - 1][0], pl[k][1] - pl[k - 1][1]);
          const segStart = budget;
          budget -= d;
          if (segStart <= 0) break;
          const frac = segStart >= d ? 1 : segStart / d;
          if (!started) { c.moveTo(pl[k - 1][0], pl[k - 1][1]); started = true; }
          c.lineTo(
            pl[k - 1][0] + (pl[k][0] - pl[k - 1][0]) * frac,
            pl[k - 1][1] + (pl[k][1] - pl[k - 1][1]) * frac
          );
        }
        c.stroke();
      }
      c.restore();
    }
  }

  function hudCorners(c, accent, a, inset) {
    const m = inset === undefined ? W * 0.038 : inset;
    brackets(c, m, m, W - m * 2, H - m * 2, W * 0.032, rgba(accent, 0.34 * a), 1.6);
  }

  function ringHud(c, accent, a, t, lit, total) {
    // seven markers on a ring: how many wonders still stand
    const cx = W * 0.5;
    const cy = H * 0.5;
    const R = H * 0.415;
    const n = total;
    c.save();
    c.translate(cx, cy);
    c.rotate(-Math.PI / 2 + t * 0.06);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const x = Math.cos(ang) * R;
      const y = Math.sin(ang) * R;
      const on = i < lit;
      c.beginPath();
      c.arc(x, y, on ? 4.2 : 2.4, 0, Math.PI * 2);
      c.fillStyle = rgba(accent, (on ? 0.95 : 0.20) * a);
      c.fill();
      if (on) {
        c.beginPath();
        c.arc(x, y, 9, 0, Math.PI * 2);
        c.strokeStyle = rgba(accent, 0.30 * a);
        c.lineWidth = 1;
        c.stroke();
      }
    }
    c.restore();
  }

  function topLabel(c, accent, t, left, right) {
    const a = 0.62;
    c.save();
    c.font = '400 ' + Math.round(H * 0.0195) + 'px ' + FONT_TECH;
    c.fillStyle = rgba(accent, a);
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(left, W * 0.052, H * 0.052);
    c.textAlign = 'right';
    c.fillStyle = 'rgba(255,255,255,0.42)';
    c.fillText(right, W * 0.948, H * 0.052);
    c.restore();
  }

  function drawShotWonder(c, idx, lt, dur, accent, t) {
    const g = GEO[idx];
    const w = WONDERS[idx];
    const p = clamp01(lt / dur);
    const reveal = clamp01(lt / Math.min(0.95, dur * 0.62));
    const exit = clamp01((lt - (dur - 0.28)) / 0.28);

    // zoom punch in, slow drift, punch out
    const zin = easeOutCubic(clamp01(lt / 0.30));
    const zoom = lerp(1.17, 1.0, zin) * lerp(1.0, 1.075, easeInOutCubic(p)) + exit * 0.14;

    c.save();
    c.translate(W * 0.5 + Math.sin(t * 0.62) * W * 0.012, H * 0.5 + Math.cos(t * 0.47) * H * 0.010);
    c.scale(zoom, zoom);
    c.translate(-W * 0.5, -H * 0.5);

    // faint parallax ghost of the same shape behind
    c.save();
    c.translate(Math.sin(t * 0.7) * 7, Math.cos(t * 0.55) * 5);
    drawWire(g, {
      ctx: c, accent, reveal: reveal * 0.9, alpha: 0.10,
      glow: 0.35, sweep: -1, lw: Math.max(1, H / 900),
    });
    c.restore();

    drawWire(g, {
      ctx: c, accent,
      reveal,
      alpha: lerp(1, 0.15, exit),
      glow: lerp(1.0, 0.2, exit),
      sweep: clamp01((lt - 0.55) / 0.7),
    });

    // sweeping scan band across the wireframe
    const scanP = ((lt / dur) * 2.6) % 1;
    if (scanP < 1 && exit < 0.5) {
      const sy2 = H * (0.10 + scanP * 0.80);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const sg = c.createLinearGradient(0, sy2 - H * 0.06, 0, sy2 + H * 0.06);
      sg.addColorStop(0, rgba(accent, 0));
      sg.addColorStop(0.5, rgba(accent, 0.10 * (1 - exit)));
      sg.addColorStop(1, rgba(accent, 0));
      c.fillStyle = sg;
      c.fillRect(0, sy2 - H * 0.06, W, H * 0.12);
      c.strokeStyle = rgba(accent, 0.34 * (1 - exit));
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(0, sy2);
      c.lineTo(W, sy2);
      c.stroke();
      c.restore();
    }

    // base line + reflection ticks
    c.save();
    c.strokeStyle = rgba(accent, 0.30 * (1 - exit));
    c.lineWidth = 1.4;
    const by = H * 0.845;
    const bw = W * 0.30 * easeOutCubic(clamp01(lt / 0.6));
    c.beginPath();
    c.moveTo(W * 0.5 - bw, by);
    c.lineTo(W * 0.5 + bw, by);
    c.stroke();
    for (let i = -6; i <= 6; i++) {
      const x = W * 0.5 + (i / 6) * bw;
      c.globalAlpha = 0.5 * (1 - exit);
      c.beginPath();
      c.moveTo(x, by);
      c.lineTo(x, by + (i % 2 === 0 ? 9 : 5));
      c.stroke();
    }
    c.restore();
    c.restore();

    // ------------------------------------------------------------- typography
    const tx = W * 0.095;
    const ty = H * 0.648;
    const a = 1 - exit;

    // scrim so the text always sits on clean black
    c.save();
    c.globalAlpha = a * clamp01((lt - 0.10) / 0.5);
    const txtGrad = c.createLinearGradient(0, H * 0.50, 0, H);
    txtGrad.addColorStop(0, 'rgba(0,0,0,0)');
    txtGrad.addColorStop(0.30, 'rgba(0,0,0,0.70)');
    txtGrad.addColorStop(1, 'rgba(0,0,0,0.95)');
    c.fillStyle = txtGrad;
    c.fillRect(0, H * 0.40, W * 0.66, H * 0.60);
    c.restore();

    // accent rule: makes the block read as one deliberate unit
    c.save();
    c.globalAlpha = a * clamp01((lt - 0.12) / 0.5);
    const ruleH = H * 0.250 * easeOutCubic(clamp01((lt - 0.15) / 0.7));
    c.fillStyle = rgba(accent, 0.85);
    c.fillRect(tx - H * 0.030, ty - H * 0.112, Math.max(2, H * 0.0045), ruleH);
    c.restore();

    // index marker
    c.save();
    c.globalAlpha = a;
    c.font = '400 ' + Math.round(H * 0.0205) + 'px ' + FONT_MONO;
    c.fillStyle = rgba(accent, 0.95);
    c.textAlign = 'left';
    c.fillText('0' + (idx + 1) + ' / 07', tx, ty - H * 0.112);
    c.restore();

    c.save();
    c.globalAlpha = a;
    drawChars(c, w.name, tx, ty, {
      font: '900 ' + Math.round(H * 0.086) + 'px ' + FONT_CN,
      color: '#ffffff',
      progress: clamp01((lt - 0.16) / 0.85),
      stagger: 0.055,
      rise: H * 0.022,
    });
    c.save();
    c.shadowColor = rgba(accent, 1.0);
    c.shadowBlur = H * 0.030;
    drawChars(c, w.en, tx, ty + H * 0.056, {
      font: '700 ' + Math.round(H * 0.0295) + 'px ' + FONT_TECH,
      color: '#ffffff',
      progress: clamp01((lt - 0.34) / 0.9),
      stagger: 0.010,
      rise: H * 0.010,
      tracking: H * 0.009,
    });
    c.restore();
    c.restore();

    // years line with a leading dash
    c.save();
    c.globalAlpha = a * clamp01((lt - 0.5) / 0.4);
    c.font = '700 ' + Math.round(H * 0.0425) + 'px ' + FONT_CN;
    c.fillStyle = '#ffffff';
    c.textAlign = 'left';
    c.shadowColor = 'rgba(0,0,0,0.9)';
    c.shadowBlur = H * 0.012;
    c.fillText(w.years, tx + H * 0.046, ty + H * 0.140);
    c.shadowBlur = 0;
    c.strokeStyle = rgba(accent, 1.0);
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(tx, ty + H * 0.128);
    c.lineTo(tx + H * 0.032, ty + H * 0.128);
    c.stroke();
    c.restore();

    // notes stacked
    for (let i = 0; i < w.notes.length; i++) {
      c.save();
      c.globalAlpha = a * clamp01((lt - 0.72 - i * 0.13) / 0.36);
      c.font = '500 ' + Math.round(H * 0.0405) + 'px ' + FONT_CN;
      c.fillStyle = 'rgba(255,255,255,0.99)';
      c.textAlign = 'left';
      c.shadowColor = 'rgba(0,0,0,0.95)';
      c.shadowBlur = H * 0.020;
      c.fillText(w.notes[i], tx + H * 0.046, ty + H * 0.200 + i * H * 0.052);
      c.restore();
    }

    // ------------------------------------------------------------- stat block
    const sx = W * 0.855;
    const sy = H * 0.30;
    const sp = clamp01((lt - 0.42) / 0.75);
    c.save();
    c.globalAlpha = a * clamp01(sp * 1.4);
    const numT = easeOutExpo(sp);
    const numVal = (parseFloat(w.stat) * numT).toFixed(w.stat.indexOf('.') >= 0 ? 1 : 0);
    c.font = '700 ' + Math.round(H * 0.105) + 'px ' + FONT_TECH;
    c.fillStyle = rgba(accent, 0.98);
    c.textAlign = 'right';
    c.textBaseline = 'alphabetic';
    c.shadowColor = rgba(accent, 0.6);
    c.shadowBlur = H * 0.05;
    c.fillText(numVal, sx, sy);
    c.shadowBlur = 0;
    c.font = '400 ' + Math.round(H * 0.017) + 'px ' + FONT_MONO;
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillText(w.statLabel, sx, sy - H * 0.115);
    c.font = '400 ' + Math.round(H * 0.021) + 'px ' + FONT_CN;
    c.fillStyle = 'rgba(255,255,255,0.62)';
    c.fillText(w.statUnit, sx, sy + H * 0.038);
    c.restore();

    // accent hairline under the number
    c.save();
    c.globalAlpha = a * sp;
    c.strokeStyle = rgba(accent, 0.55);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(sx - W * 0.092 * easeOutCubic(sp), sy + H * 0.062);
    c.lineTo(sx, sy + H * 0.062);
    c.stroke();
    c.restore();

    // fate stamp
    const fs = clamp01((lt - 1.05) / 0.4);
    if (fs > 0) {
      c.save();
      c.globalAlpha = a * fs;
      c.translate(W * 0.845, H * 0.665);
      const sc = lerp(1.35, 1, easeOutBack(fs, 2.2));
      c.scale(sc, sc);
      const bw2 = W * 0.105;
      const bh2 = H * 0.062;
      c.strokeStyle = rgba(accent, 0.75);
      c.lineWidth = 1.6;
      c.strokeRect(-bw2, -bh2 / 2, bw2 * 2, bh2);
      c.font = '600 ' + Math.round(H * 0.024) + 'px ' + FONT_CN;
      c.fillStyle = rgba(accent, 0.95);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(w.fate, 0, -bh2 * 0.06);
      c.font = '400 ' + Math.round(H * 0.0145) + 'px ' + FONT_MONO;
      c.fillStyle = 'rgba(255,255,255,0.5)';
      c.fillText(w.fateYear, 0, bh2 * 0.34);
      c.restore();
    }
  }

  function drawIntro(c, lt, dur, accent, t) {
    const p = clamp01(lt / dur);
    const exit = clamp01((lt - (dur - 0.26)) / 0.26);

    // ring assembly
    const ra = easeOutCubic(clamp01(lt / 0.9));
    c.save();
    c.translate(W * 0.5 + Math.sin(t * 0.5) * W * 0.004, H * 0.5 + Math.cos(t * 0.42) * H * 0.004);
    c.scale(1 + Math.sin(lt * 1.1) * 0.006, 1 + Math.sin(lt * 1.1) * 0.006);
    c.rotate(t * 0.09);
    c.strokeStyle = rgba(accent, 0.34 * ra * (1 - exit));
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(0, 0, H * 0.335, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ra);
    c.stroke();
    c.strokeStyle = rgba(accent, 0.16 * ra * (1 - exit));
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, 0, H * 0.30, 0, Math.PI * 2);
    c.stroke();
    // 7 ticks: each one lights up with an electric pulse, then keeps a
    // travelling spark and a breathing halo so they read as live indicators.
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * Math.PI * 2;
      const t0 = 0.55 + i * 0.10;
      const lit = clamp01((lt - t0) / 0.26);
      const on = lit > 0;
      const fade = 1 - exit;
      const r0 = H * 0.335;
      const r1 = H * 0.365;
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      const x0 = ca * r0;
      const y0 = sa * r0;
      const x1 = ca * r1;
      const y1 = sa * r1;

      // ---- halo bloom around the tick, breathing
      const breath = 0.55 + 0.45 * Math.sin(t * 2.4 + i * 1.1);
      if (on) {
        const hg = c.createRadialGradient(
          ca * (r0 + r1) * 0.5, sa * (r0 + r1) * 0.5, 0,
          ca * (r0 + r1) * 0.5, sa * (r0 + r1) * 0.5, H * 0.030
        );
        hg.addColorStop(0, rgba(accent, 0.55 * breath * lit * fade));
        hg.addColorStop(0.45, rgba(accent, 0.18 * breath * lit * fade));
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = hg;
        c.beginPath();
        c.arc(ca * (r0 + r1) * 0.5, sa * (r0 + r1) * 0.5, H * 0.030, 0, Math.PI * 2);
        c.fill();
      }

      // ---- the tick itself: wide soft glow pass + hot core
      c.lineCap = 'round';
      c.strokeStyle = rgba(accent, (on ? 0.30 : 0.06) * lit * fade + (on ? 0 : 0.10 * fade));
      c.lineWidth = on ? H * 0.014 : 1;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();

      c.strokeStyle = rgba(accent, (on ? 0.95 : 0.18) * (on ? lit : 1) * fade);
      c.lineWidth = on ? Math.max(2, H * 0.0034) : 1;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();

      // ---- ignition flash right when it switches on
      if (lit > 0 && lit < 1) {
        const f = 1 - lit;
        c.strokeStyle = 'rgba(255,255,255,' + (0.85 * f * fade) + ')';
        c.lineWidth = Math.max(2, H * 0.005) * (1 + f);
        c.beginPath();
        c.moveTo(x0, y0);
        c.lineTo(x1, y1);
        c.stroke();
        // shock ring at the tick tip
        const rr = H * 0.010 + f * H * 0.055;
        c.strokeStyle = rgba(accent, 0.60 * f * fade);
        c.lineWidth = Math.max(1, H * 0.0022);
        c.beginPath();
        c.arc(x1, y1, rr, 0, Math.PI * 2);
        c.stroke();
      }

      // ---- a spark running outward along the lit tick, looping
      if (on && lit >= 1) {
        const sp = (t * 1.5 + i * 0.37) % 1;
        const sx = x0 + (x1 - x0) * sp;
        const sy = y0 + (y1 - y0) * sp;
        // halo around the spark
        const shg = c.createRadialGradient(sx, sy, 0, sx, sy, H * 0.022);
        shg.addColorStop(0, 'rgba(255,255,255,' + (0.95 * fade) + ')');
        shg.addColorStop(0.30, rgba(accent, 0.65 * fade));
        shg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = shg;
        c.beginPath();
        c.arc(sx, sy, H * 0.022, 0, Math.PI * 2);
        c.fill();
        // bright core
        c.fillStyle = 'rgba(255,255,255,' + fade + ')';
        c.beginPath();
        c.arc(sx, sy, Math.max(2.0, H * 0.0042), 0, Math.PI * 2);
        c.fill();
        // comet trail behind the spark
        const tp = Math.max(0, sp - 0.55);
        c.strokeStyle = rgba(accent, 0.85 * fade);
        c.lineWidth = Math.max(1.8, H * 0.0032);
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(x0 + (x1 - x0) * tp, y0 + (y1 - y0) * tp);
        c.lineTo(sx, sy);
        c.stroke();
      }

      // ---- a standing pulse dot at the tick tip
      if (on && lit >= 1) {
        const dp = 0.55 + 0.45 * Math.sin(t * 3.4 + i * 1.7);
        const dg = c.createRadialGradient(x1, y1, 0, x1, y1, H * 0.016);
        dg.addColorStop(0, 'rgba(255,255,255,' + (0.9 * dp * fade) + ')');
        dg.addColorStop(0.35, rgba(accent, 0.55 * dp * fade));
        dg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = dg;
        c.beginPath();
        c.arc(x1, y1, H * 0.016, 0, Math.PI * 2);
        c.fill();
      }

      // ---- energy arcs hopping between neighbouring ticks
      if (on && lit >= 1) {
        const nang = ((i + 1) / 7) * Math.PI * 2;
        const nOn = lt > 0.55 + ((i + 1) % 7) * 0.10;
        if (nOn) {
          const pulse = Math.pow(0.5 + 0.5 * Math.sin(t * 3.1 + i * 2.0), 3.0);
          if (pulse > 0.12) {
            const ax = ca * r1;
            const ay = sa * r1;
            const bx = Math.cos(nang) * r1;
            const by = Math.sin(nang) * r1;
            const midA = (ang + nang) / 2;
            const bulge = H * 0.030;
            // outer glow of the arc
            c.strokeStyle = rgba(accent, 0.55 * pulse * fade);
            c.lineWidth = Math.max(3, H * 0.0060);
            c.beginPath();
            c.moveTo(ax, ay);
            const j1 = Math.sin(t * 9 + i) * H * 0.008;
            c.quadraticCurveTo(
              Math.cos(midA) * (r1 + bulge + j1),
              Math.sin(midA) * (r1 + bulge + j1),
              bx, by
            );
            c.stroke();
            // white-hot core of the arc
            c.strokeStyle = 'rgba(255,255,255,' + (0.80 * pulse * fade) + ')';
            c.lineWidth = Math.max(1.2, H * 0.0022);
            c.beginPath();
            c.moveTo(ax, ay);
            c.quadraticCurveTo(
              Math.cos(midA) * (r1 + bulge + j1),
              Math.sin(midA) * (r1 + bulge + j1),
              bx, by
            );
            c.stroke();
          }
        }
      }
    }
    c.restore();
    c.restore();

    // big number 7 counting in
    c.save();
    c.globalAlpha = (1 - exit);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const sevenA = clamp01(lt / 0.5);
    c.font = '700 ' + Math.round(H * 0.30) + 'px ' + FONT_TECH;
    c.fillStyle = 'rgba(255,255,255,' + (0.06 * sevenA) + ')';
    c.fillText('VII', W * 0.5, H * 0.50);
    c.restore();

    // title
    c.save();
    c.globalAlpha = 1 - exit;
    drawChars(c, '\u4E03\u5927\u5947\u8FF9', W * 0.5, H * 0.485, {
      font: '900 ' + Math.round(H * 0.135) + 'px ' + FONT_CN,
      color: '#ffffff',
      align: 'center',
      progress: clamp01((lt - 0.30) / 1.0),
      stagger: 0.10,
      rise: H * 0.035,
    });
    drawChars(c, 'SEVEN WONDERS OF THE ANCIENT WORLD', W * 0.5, H * 0.575, {
      font: '400 ' + Math.round(H * 0.0215) + 'px ' + FONT_TECH,
      color: rgba(accent, 0.95),
      align: 'center',
      progress: clamp01((lt - 0.85) / 1.0),
      stagger: 0.014,
      rise: H * 0.012,
      tracking: H * 0.007,
    });
    c.restore();

    // sub line
    c.save();
    c.globalAlpha = (1 - exit) * clamp01((lt - 1.25) / 0.5);
    c.font = '300 ' + Math.round(H * 0.023) + 'px ' + FONT_CN;
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.textAlign = 'center';
    c.fillText('\u516C\u5143\u524D\u4E09\u4E16\u7EAA\uFF0C\u4E00\u4EFD\u6D41\u4F20\u4E0B\u6765\u7684\u540D\u5355', W * 0.5, H * 0.655);
    c.restore();

    // counter line bottom
    c.save();
    c.globalAlpha = (1 - exit) * clamp01((lt - 1.6) / 0.5);
    c.font = '400 ' + Math.round(H * 0.0165) + 'px ' + FONT_MONO;
    c.fillStyle = 'rgba(255,255,255,0.34)';
    c.textAlign = 'center';
    c.fillText('07 STRUCTURES  \u00B7  1 SURVIVES', W * 0.5, H * 0.86);
    c.restore();
  }

  function drawPurge(c, lt, dur, accent, t) {
    // Six icons are struck out one by one. Dead ones stay visible as dim
    // embers so the frame never goes empty.
    const cx = W * 0.5;
    const cy = H * 0.455;
    const cols = 6;
    const gapX = W * 0.118;
    const x0 = cx - (gapX * (cols - 1)) / 2;

    // slow push keeps the whole section from sitting still
    const pz = 1.0 + lt * 0.012;
    c.save();
    c.translate(cx, cy);
    c.scale(pz, pz);
    c.translate(-cx, -cy);

    // sweeping scanner bar that crosses the row, forever
    const scanX = ((t * 0.55) % 1.35 - 0.17) * W;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const sg = c.createLinearGradient(scanX - W * 0.10, 0, scanX + W * 0.10, 0);
    sg.addColorStop(0, rgba(accent, 0));
    sg.addColorStop(0.5, rgba(accent, 0.14));
    sg.addColorStop(1, rgba(accent, 0));
    c.fillStyle = sg;
    c.fillRect(scanX - W * 0.10, 0, W * 0.20, H);
    c.restore();

    for (let i = 0; i < cols; i++) {
      const g = GEO[i];
      const w = WONDERS[i];
      const kill = 19.4 + 0.34 + i * 0.30;
      const kt = t - kill;
      const sc = 0.150;
      const bx = x0 + i * gapX;
      const by = cy + Math.sin(t * 1.3 + i * 0.9) * 5;

      const dead = kt >= 0;
      // dead icons keep a low ember glow instead of vanishing
      const ghost = dead ? 0.30 + 0.10 * Math.sin(t * 3.0 + i) : 1;
      const jolt = dead ? Math.max(0, 1 - kt / 0.22) : 0;

      c.save();
      c.translate(bx, by);
      c.scale(sc * (1 + jolt * 0.16), sc * (1 + jolt * 0.16));
      c.translate(-W * 0.5, -H * 0.5);
      drawWire(g, {
        ctx: c, accent: dead ? [255, 96, 84] : w.accent,
        reveal: 1,
        alpha: (dead ? 0.42 : 0.88) * ghost,
        glow: dead ? 0.55 : 0.7,
        sweep: -1,
        lw: H / 700 / sc * 0.5,
      });
      c.restore();

      // strike-through
      if (dead) {
        const st = clamp01(kt / 0.14);
        c.save();
        c.strokeStyle = 'rgba(255,80,70,' + (0.95 * Math.max(0.35, 1 - kt / 1.2)) + ')';
        c.lineWidth = 3.0;
        c.beginPath();
        c.moveTo(bx - W * 0.044, by - H * 0.058);
        c.lineTo(bx - W * 0.044 + W * 0.088 * st, by - H * 0.058 + H * 0.116 * st);
        c.stroke();
        c.restore();

        // debris falling away from the struck icon
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 9; k++) {
          const d = kt - k * 0.03;
          if (d < 0 || d > 1.1) continue;
          const u = d / 1.1;
          const dx = (k - 4) * W * 0.008 + Math.sin(k * 2.1 + i) * W * 0.006;
          const dy = -u * H * 0.02 + u * u * H * 0.16;
          c.fillStyle = 'rgba(255,110,90,' + (0.75 * (1 - u)) + ')';
          c.fillRect(bx + dx, by + dy, 2.4 * (1 - u * 0.6), 2.4 * (1 - u * 0.6));
        }
        c.restore();
      }

      // label
      c.save();
      c.globalAlpha = dead ? 0.34 : 0.55;
      c.font = '300 ' + Math.round(H * 0.019) + 'px ' + FONT_CN;
      c.fillStyle = dead ? 'rgba(255,120,105,0.9)' : '#fff';
      c.textAlign = 'center';
      c.fillText(w.name, bx, by + H * 0.118);
      c.restore();
    }

    c.restore();

    // headline
    const ha = clamp01((lt - 0.15) / 0.6);
    c.save();
    c.globalAlpha = ha;
    drawChars(c, '它们都不在了', W * 0.5, H * 0.245, {
      font: '700 ' + Math.round(H * 0.064) + 'px ' + FONT_CN,
      color: '#ffffff', align: 'center',
      progress: clamp01((lt - 0.2) / 0.8), stagger: 0.07, rise: H * 0.02,
    });
    c.restore();
    c.save();
    c.globalAlpha = ha * 0.85;
    c.font = '400 ' + Math.round(H * 0.018) + 'px ' + FONT_TECH;
    c.fillStyle = rgba(accent, 0.95);
    c.textAlign = 'center';
    c.fillText('SIX OF SEVEN · GONE', W * 0.5, H * 0.298);
    c.restore();

    // bright animated tally, the visual anchor of this section
    const deadN = Math.round(clamp01((t - 19.7) / 1.9) * 6);
    const pop = deadN > 0 ? Math.max(0, 1 - ((t - 19.7) % 0.32) / 0.32) : 0;
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.font = '700 ' + Math.round(H * 0.10) + 'px ' + FONT_TECH;
    c.fillStyle = 'rgba(255,132,116,' + (0.88 + 0.12 * pop) + ')';
    c.shadowColor = 'rgba(255,80,66,0.95)';
    c.shadowBlur = H * (0.02 + pop * 0.05);
    c.fillText(String(deadN), W * 0.5 - W * 0.035, H * 0.775);
    c.font = '300 ' + Math.round(H * 0.034) + 'px ' + FONT_TECH;
    c.fillStyle = 'rgba(255,255,255,0.66)';
    c.shadowBlur = 0;
    c.fillText('/ 6', W * 0.5 + W * 0.048, H * 0.775);
    c.restore();

    // caption under the tally
    c.save();
    c.globalAlpha = ha * 0.7;
    c.font = '300 ' + Math.round(H * 0.021) + 'px ' + FONT_CN;
    c.fillStyle = 'rgba(255,255,255,0.6)';
    c.textAlign = 'center';
    c.fillText('一座一座，被时间抹掉', W * 0.5, H * 0.828);
    c.restore();
  }

  // accelerating number sequence, each step landing on a musical beat
  const COUNT_STEPS = [
    { n: '6', at: 1.5, len: 1.1 },
    { n: '5', at: 2.6, len: 0.9 },
    { n: '4', at: 3.5, len: 0.75 },
    { n: '3', at: 4.25, len: 0.6 },
    { n: '2', at: 4.85, len: 0.5 },
    { n: '1', at: 5.35, len: 0.45 },
    { n: '1', at: 5.8, len: 0.45 },
    { n: '0', at: 6.25, len: 0.4 },
    { n: '0', at: 6.65, len: 0.4 },
    { n: '0', at: 7.05, len: 0.4 },
  ];

  // Fast-rotating radial spokes + drifting bars: keeps the frame alive
  // through the low-information countdown and warning shots.
  function tensionField(c, accent, t, k, cx, cy) {
    const inten = 0.35 + k * 0.65;
    c.save();
    c.translate(cx, cy);
    c.globalCompositeOperation = 'lighter';

    // counter-rotating spoke fans
    for (let layer = 0; layer < 2; layer++) {
      const dir = layer === 0 ? 1 : -1;
      const rate = (layer === 0 ? 0.55 : 1.35) + k * 3.4;
      c.save();
      c.rotate(dir * t * rate);
      const nS = layer === 0 ? 24 : 12;
      for (let i = 0; i < nS; i++) {
        const a = (i / nS) * Math.PI * 2;
        const r0 = H * (layer === 0 ? 0.20 : 0.34);
        const r1 = r0 + H * (layer === 0 ? 0.055 : 0.10) * (1 + 0.4 * Math.sin(t * 3 + i));
        c.strokeStyle = rgba(accent, (layer === 0 ? 0.17 : 0.12) * inten);
        c.lineWidth = layer === 0 ? 1.6 : 2.4;
        c.beginPath();
        c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        c.stroke();
      }
      c.restore();
    }

    // wide horizontal bars sweeping up the frame
    for (let i = 0; i < 3; i++) {
      const ph = ((t * (0.22 + i * 0.09) + i * 0.33) % 1);
      const y = H * (1.05 - ph * 1.15);
      const gg = c.createLinearGradient(0, y - H * 0.02, 0, y + H * 0.02);
      gg.addColorStop(0, rgba(accent, 0));
      gg.addColorStop(0.5, rgba(accent, 0.15 * inten));
      gg.addColorStop(1, rgba(accent, 0));
      c.fillStyle = gg;
      c.fillRect(-cx, y, W, H * 0.04);
    }

    // pulsing core
    const pulse = Math.pow(0.5 + 0.5 * Math.sin(t * (2.4 + k * 16)), 2.2);
    const cg = c.createRadialGradient(0, 0, 0, 0, 0, H * 0.40);
    cg.addColorStop(0, rgba(accent, 0.15 * pulse * inten));
    cg.addColorStop(0.5, rgba(accent, 0.03 * pulse * inten));
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = cg;
    c.beginPath();
    c.arc(0, 0, H * 0.40, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawCount(c, lt, dur, accent, t) {
    const cx = W * 0.5;
    const cy = H * 0.47;
    const k = clamp01(lt / dur);

    tensionField(c, accent, t, k, cx, cy);

    // ---- phase A: "one remains" beat, 0 -> 2.0s
    if (lt < 1.62) {
      const a = clamp01(lt / 0.35) * clamp01((1.62 - lt) / 0.3 + 0.2);
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, H * 0.30);
      g.addColorStop(0, rgba(accent, 0.22 * a));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      c.restore();

      // six empty slots collapsing into one
      c.save();
      c.globalAlpha = a * 0.55;
      for (let i = 0; i < 6; i++) {
        const ang = -Math.PI / 2 + (i / 6) * Math.PI * 2;
        const rr = H * (0.30 - 0.055 * clamp01(lt / 1.5));
        c.strokeStyle = 'rgba(255,255,255,0.30)';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 6, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();

      // star trails orbiting the last light
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const rr = 34 + i * 17 + pulse * 6;
        const a0 = t * (0.5 + i * 0.22) + i * 2.1;
        c.strokeStyle = rgba(accent, (0.30 - i * 0.07) * a);
        c.lineWidth = 1.6 - i * 0.3;
        c.beginPath();
        c.arc(cx, cy, rr, a0, a0 + 1.15 - i * 0.2);
        c.stroke();
      }
      c.restore();

      c.save();
      c.globalAlpha = a;
      // layered halo so the single point reads as precious
      c.globalCompositeOperation = 'lighter';
      const hg = c.createRadialGradient(cx, cy, 0, cx, cy, 120 + pulse * 30);
      hg.addColorStop(0, rgba(accent, 0.55));
      hg.addColorStop(0.22, rgba(accent, 0.18));
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = hg;
      c.beginPath();
      c.arc(cx, cy, 130 + pulse * 30, 0, Math.PI * 2);
      c.fill();
      c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(cx, cy, 6.5 + pulse * 2.4, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = rgba(accent, 0.55);
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(cx, cy, 24 + pulse * 10, 0, Math.PI * 2);
      c.stroke();
      // four-point sparkle
      c.strokeStyle = rgba(accent, 0.5);
      c.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + t * 0.4;
        const r0 = 14 + pulse * 4;
        const r1 = 40 + pulse * 16;
        c.beginPath();
        c.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
        c.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
        c.stroke();
      }
      c.restore();

      c.save();
      c.globalAlpha = a;
      drawChars(c, '还剩一座', cx, H * 0.655, {
        font: '900 ' + Math.round(H * 0.086) + 'px ' + FONT_CN,
        color: '#ffffff', align: 'center',
        progress: clamp01((lt - 0.1) / 0.7), stagger: 0.09, rise: H * 0.020,
      });
      c.restore();
      c.save();
      c.globalAlpha = a * 0.8;
      c.font = '400 ' + Math.round(H * 0.021) + 'px ' + FONT_TECH;
      c.fillStyle = rgba(accent, 0.95);
      c.textAlign = 'center';
      c.fillText('ONE REMAINS', cx, H * 0.708);
      c.restore();
    }

    // ---- phase B: accelerating countdown
    if (lt >= 1.5) {
      const cl = lt - 1.5;

      // camera keeps pushing in through the whole countdown
      const push = 1.0 + Math.pow(clamp01(cl / 8.5), 2.2) * 0.30;

      // radial light bars firing outward, faster and faster
      c.save();
      c.translate(cx, cy);
      c.globalCompositeOperation = 'lighter';
      const barRate = 1.2 + clamp01(cl / 9.5) * 6.0;
      for (let i = 0; i < 12; i++) {
        const ph = ((t * barRate + i * 0.083) % 1);
        const a = (i / 12) * Math.PI * 2 + t * 0.3;
        const r0 = H * 0.16;
        const r1 = r0 + H * 0.30 * easeOutCubic(ph);
        c.strokeStyle = rgba(accent, 0.28 * (1 - ph));
        c.lineWidth = 2.2 * (1 - ph) + 0.6;
        c.beginPath();
        c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
        c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
        c.stroke();
      }
      c.restore();

      // spinning reticle that tightens and speeds up
      c.save();
      c.translate(cx, cy);
      c.scale(push, push);
      const R = H * (0.33 - 0.13 * easeInCubic(clamp01(cl / 9.5)));
      c.rotate(t * (0.9 + clamp01(cl / 9.5) * 14.0));
      c.strokeStyle = rgba(accent, 0.34 + 0.50 * clamp01(cl / 9.5));
      c.lineWidth = 2.0;
      for (let i = 0; i < 3; i++) {
        const a0 = (i / 3) * Math.PI * 2;
        c.beginPath();
        c.arc(0, 0, R, a0, a0 + 0.58);
        c.stroke();
      }
      c.restore();

      // rings imploding, faster as we approach the drop
      const ringRate = 0.9 + clamp01(cl / 9.5) * 5.0;
      for (let i = 0; i < 6; i++) {
        const ph = ((t * ringRate + i * 0.166) % 1);
        const r = H * 0.46 * (1 - ph);
        c.save();
        c.strokeStyle = rgba(accent, 0.34 * (1 - ph) * (0.45 + clamp01(cl / 9.5)));
        c.lineWidth = 1.4;
        c.beginPath();
        c.arc(cx, cy, r * push, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      }

      // the number
      let step = null;
      for (const s of COUNT_STEPS) {
        if (cl >= s.at) step = s;
      }
      if (step) {
        const localT = cl - step.at;
        const nfade = clamp01(localT / 0.05) * clamp01((step.len - localT) / 0.07 + 0.2);
        const nsc = lerp(1.6, 1.0, easeOutExpo(clamp01(localT / 0.18)));
        const slam = 1 - clamp01(localT / 0.10);
        c.save();
        c.globalAlpha = Math.min(1, nfade + slam * 0.5);
        c.translate(cx, cy);
        c.scale(nsc * push, nsc * push);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = '700 ' + Math.round(H * 0.27) + 'px ' + FONT_TECH;
        // metal sheen across the glyph
        const sheen = c.createLinearGradient(0, -H * 0.14, 0, H * 0.14);
        sheen.addColorStop(0, 'rgba(255,255,255,' + (0.98 * (0.9 + 0.1 * slam)) + ')');
        sheen.addColorStop(0.42, rgba(accent, 0.95));
        sheen.addColorStop(0.55, 'rgba(255,255,255,1)');
        sheen.addColorStop(1, 'rgba(200,225,255,0.85)');
        c.fillStyle = sheen;
        c.shadowColor = rgba(accent, 0.95);
        c.shadowBlur = H * (0.05 + 0.09 * clamp01(cl / 9.5));
        c.fillText(step.n, 0, 0);
        c.restore();

        // particles shedding off the glyph edges
        c.save();
        c.globalCompositeOperation = 'lighter';
        const shed = clamp01(1 - localT / 0.55);
        for (let i = 0; i < 26; i++) {
          const ang = (i / 26) * Math.PI * 2 + i * 0.7;
          const rr = H * 0.10 + (1 - shed) * H * 0.20 + ((i * 13) % 17) / 40 * H * 0.05;
          c.fillStyle = rgba(accent, 0.55 * shed);
          const sz = 1.4 + ((i * 7) % 5) * 0.5;
          c.fillRect(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.75, sz, sz);
        }
        c.restore();

        // a horizontal light bar snapping out on each number
        if (localT < 0.30) {
          const q = localT / 0.30;
          c.save();
          c.globalCompositeOperation = 'lighter';
          const bw = W * 0.5 * easeOutExpo(q);
          c.strokeStyle = rgba(accent, 0.7 * (1 - q));
          c.lineWidth = 3 * (1 - q) + 1;
          c.beginPath();
          c.moveTo(cx - bw, cy);
          c.lineTo(cx + bw, cy);
          c.stroke();
          c.restore();
        }
      }

      // caption
      c.save();
      c.globalAlpha = clamp01((cl - 0.2) / 0.5);
      c.font = '400 ' + Math.round(H * 0.018) + 'px ' + FONT_TECH;
      c.fillStyle = rgba(accent, 0.85);
      c.textAlign = 'center';
      c.fillText('LAST CHANCE TO LOOK', cx, H * 0.745 - (push - 1) * H * 0.16);
      c.restore();
    }
  }

  function drawLast(c, lt, dur, accent, t) {
    const cx = W * 0.5;
    const cy = H * 0.52;
    const k = clamp01(lt / dur);

    tensionField(c, accent, t, k, cx, cy);

    // accelerating strobe: the closer to the drop, the faster it fires
    const rate = 2.0 + Math.pow(k, 2.4) * 34.0;
    const phase = (t * rate) % 1;
    const strobe = Math.pow(1 - phase, 3);

    // the pyramid: a continuous push-in that accelerates toward the drop
    c.save();
    c.translate(cx + Math.sin(lt * 0.9) * W * 0.004, cy + Math.cos(lt * 0.7) * H * 0.004);
    const zs = 0.86 + Math.pow(k, 1.35) * 0.30 + Math.sin(lt * 1.4) * 0.008;
    c.scale(zs, zs);
    c.rotate(Math.sin(lt * 0.5) * 0.012);
    c.translate(-cx, -cy);
    drawWire(PYR, {
      ctx: c, accent,
      reveal: clamp01(lt / 2.2) * 0.92,
      alpha: 0.46 + 0.42 * k + strobe * 0.30,
      glow: 0.95 + 0.9 * k + strobe * 0.8,
      // a light travelling the frame over and over, faster as tension builds
      sweep: ((lt * (0.5 + k * 1.8)) % 1.35),
      lw: Math.max(1.2, H / 720),
    });
    c.restore();

    // a rising energy column under the apex, pulsing on the beat
    const colPulse = Math.pow(0.5 + 0.5 * Math.sin(t * (3.0 + k * 22.0)), 2.0);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cg = c.createLinearGradient(0, H * 0.92, 0, H * 0.34);
    cg.addColorStop(0, rgba(accent, (0.16 + 0.20 * colPulse) * (0.6 + k)));
    cg.addColorStop(0.55, rgba(accent, (0.07 + 0.10 * colPulse) * (0.6 + k)));
    cg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = cg;
    const cw = W * (0.055 + 0.020 * colPulse);
    c.fillRect(cx - cw / 2, H * 0.34, cw, H * 0.60);
    c.restore();

    // sparks spiralling up around the pyramid
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 34; i++) {
      const ph = ((t * (0.55 + (i % 5) * 0.16) + i * 0.211) % 1);
      const ang = ph * 7.0 + i * 0.9;
      const rr = H * (0.10 + ph * 0.30);
      const x = cx + Math.cos(ang) * rr * 1.05;
      const y = H * 0.86 - ph * H * 0.52;
      c.fillStyle = rgba(accent, 0.80 * (1 - ph) * (0.55 + k));
      c.fillRect(x, y, 2.2, 2.2);
    }
    c.restore();

    // rising dust, denser as tension builds
    c.save();
    c.globalCompositeOperation = 'lighter';
    const nD = 70 + Math.round(k * 90);
    for (let i = 0; i < nD; i++) {
      const ph = ((t * (0.18 + (i % 7) * 0.05) + i * 0.137) % 1);
      const x = ((i * 0.618) % 1) * W;
      const y = H * (1 - ph * 0.92);
      c.fillStyle = rgba(accent, 0.30 * ph * (0.35 + k * 0.9));
      c.fillRect(x, y, 1.8, 1.8);
    }
    c.restore();

    // tightening rings around the apex, one per beat, getting faster
    const beatRate = 1.6 + k * 5.0;
    for (let i = 0; i < 4; i++) {
      const ph = ((t * beatRate + i * 0.25) % 1);
      const r = H * 0.44 * (1 - ph);
      c.save();
      c.strokeStyle = rgba(accent, 0.36 * (1 - ph) * (0.4 + k));
      c.lineWidth = 1.3;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    // strobe flash
    if (strobe > 0.55) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(accent, (strobe - 0.55) * 0.11);
      c.fillRect(0, 0, W, H);
      c.restore();
    }

    // warning text flickering faster
    const flick = 0.55 + 0.45 * Math.sin(t * (5 + k * 26));
    c.save();
    c.globalAlpha = clamp01((lt - 0.25) / 0.7) * (0.55 + flick * 0.45);
    drawChars(c, '最后一个名字', cx, H * 0.845, {
      font: '300 ' + Math.round(H * 0.032) + 'px ' + FONT_CN,
      color: 'rgba(255,255,255,0.78)', align: 'center',
      progress: clamp01((lt - 0.25) / 1.1), stagger: 0.07, rise: H * 0.012,
    });
    c.restore();

    // accelerating ticker
    c.save();
    c.globalAlpha = 0.45 + flick * 0.3;
    c.font = '400 ' + Math.round(H * 0.0145) + 'px ' + FONT_MONO;
    c.fillStyle = rgba(accent, 0.9);
    c.textAlign = 'center';
    const tick = Math.floor(t * (8 + k * 60));
    c.fillText('T-' + String(tick).padStart(3, '0') + '  //  ' + (Math.max(0, dur - lt)).toFixed(2) + 's', cx, H * 0.895);
    c.restore();
  }

  function drawPyramid(c, lt, dur, accent, t) {
    const cx = W * 0.5;
    const cy = H * 0.50;
    const p = clamp01(lt / dur);

    // impact: white flash + shockwave + burst particles
    if (lt < 0.34) {
      const f = clamp01(1 - lt / 0.34);
      c.save();
      c.globalCompositeOperation = 'lighter';
      // a hot core that fades fast, not a full white frame
      const fg = c.createRadialGradient(cx, cy, 0, cx, cy, H * 0.62);
      fg.addColorStop(0, 'rgba(255,250,238,' + (f * f * 0.92) + ')');
      fg.addColorStop(0.35, 'rgba(255,226,170,' + (f * f * 0.42) + ')');
      fg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = fg;
      c.fillRect(0, 0, W, H);
      c.restore();
    }
    for (let i = 0; i < 3; i++) {
      const d = lt - i * 0.09;
      if (d < 0 || d > 1.5) continue;
      const q = d / 1.5;
      const r = H * 0.10 + q * H * 1.0;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(accent, 0.85 * (1 - q) * (1 - q));
      c.lineWidth = 22 * (1 - q) + 2;
      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
    // radial burst
    if (lt < 1.3) {
      const q = clamp01(lt / 1.3);
      c.save();
      c.translate(cx, cy);
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(accent, 0.80 * (1 - q));
      for (let i = 0; i < 48; i++) {
        const ang = (i / 48) * Math.PI * 2 + 0.1;
        const r0 = H * 0.14 + q * H * 0.58;
        const r1 = r0 + H * (0.14 + 0.20 * (1 - q)) * (i % 3 === 0 ? 1.6 : 0.7);
        c.lineWidth = i % 3 === 0 ? 4.2 : 1.8;
        c.beginPath();
        c.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
        c.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
        c.stroke();
      }
      c.restore();
    }

    // the pyramid itself: a continuous crane move, never static
    const zin = easeOutExpo(clamp01(lt / 0.55));
    // slow pull-back + rise across the whole shot
    const crane = easeInOutCubic(clamp01(lt / 6.4));
    const breathe = Math.sin(lt * 1.05) * 0.010;
    const zoom = lerp(1.24, 1.0, zin) * (1.0 - crane * 0.10) + breathe;
    const driftX = Math.sin(lt * 0.55) * W * 0.006;
    const driftY = Math.cos(lt * 0.42) * H * 0.005 + crane * H * 0.045;
    // a slow orbit that gives the wireframe real depth
    const orbit = Math.sin(lt * 0.32) * 0.035;
    c.save();
    c.translate(cx + driftX, cy + driftY);
    c.scale(zoom, zoom);
    c.rotate(orbit);
    c.translate(-cx, -cy);

    // a light that keeps travelling along the wireframe, looping
    const cyc = (lt * 0.62) % 1.5;
    const sw = cyc <= 1 ? cyc : -1;
    drawWire(PYR, {
      ctx: c, accent,
      reveal: clamp01(lt / 0.85),
      alpha: 1,
      glow: 1.9 + Math.sin(lt * 2.1) * 0.25,
      sweep: sw,
      lw: Math.max(2.2, H / 400),
    });
    c.restore();

    // orbiting rings
    c.save();
    c.translate(cx, cy);
    c.rotate(t * 0.32);
    c.strokeStyle = rgba(accent, 0.34);
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(0, H * 0.075, W * 0.29, H * 0.052, 0, 0, Math.PI * 2);
    c.stroke();
    c.rotate(-t * 0.7);
    c.strokeStyle = rgba(accent, 0.20);
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(0, H * 0.075, W * 0.36, H * 0.068, 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // a scan line sweeping down the frame, forever
    const scanY = H * (((lt * 0.34) % 1.0) * 1.05 - 0.02);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const slg = c.createLinearGradient(0, scanY - H * 0.05, 0, scanY + H * 0.05);
    slg.addColorStop(0, rgba(accent, 0));
    slg.addColorStop(0.5, rgba(accent, 0.085));
    slg.addColorStop(1, rgba(accent, 0));
    c.fillStyle = slg;
    c.fillRect(0, scanY - H * 0.05, W, H * 0.10);
    c.strokeStyle = rgba(accent, 0.24);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, scanY);
    c.lineTo(W, scanY);
    c.stroke();
    c.restore();

    // drifting motes rising through the whole shot
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 48; i++) {
      const ph = ((t * (0.13 + (i % 6) * 0.035) + i * 0.181) % 1);
      const x = ((i * 0.734) % 1) * W + Math.sin(t * 0.7 + i) * 14;
      const y = H * (1.02 - ph * 1.05);
      c.fillStyle = rgba(accent, 0.26 * Math.sin(ph * Math.PI));
      c.fillRect(x, y, 2, 2);
    }
    c.restore();

    // ground glow
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(cx, H * 0.80, 0, cx, H * 0.80, W * 0.30);
    gg.addColorStop(0, rgba(accent, 0.16));
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gg;
    c.fillRect(0, 0, W, H);
    c.restore();

    // --------------------------------------------------------------- headline
    const ha = 1 - clamp01((lt - 2.6) / 0.6);
    c.save();
    c.globalAlpha = ha;
    const scrim = c.createLinearGradient(0, 0, 0, H * 0.30);
    scrim.addColorStop(0, 'rgba(0,0,0,0.90)');
    scrim.addColorStop(0.62, 'rgba(0,0,0,0.66)');
    scrim.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = scrim;
    c.fillRect(0, 0, W, H * 0.30);
    c.restore();

    c.save();
    c.globalAlpha = ha;
    drawChars(c, PYRAMID.name, W * 0.5, H * 0.132, {
      font: '900 ' + Math.round(H * 0.098) + 'px ' + FONT_CN,
      color: '#ffffff', align: 'center',
      progress: clamp01((lt - 0.22) / 0.75), stagger: 0.075, rise: H * 0.026,
    });
    drawChars(c, PYRAMID.en, W * 0.5, H * 0.183, {
      font: '400 ' + Math.round(H * 0.0215) + 'px ' + FONT_TECH,
      color: rgba(accent, 0.95), align: 'center',
      progress: clamp01((lt - 0.36) / 0.9), stagger: 0.010, rise: H * 0.010,
      tracking: H * 0.007,
    });
    c.restore();

    // ------------------------------------------------------------ stat ladder
    const stats = [
      { v: 146.6, d: 1, label: '\u7C73 \u00B7 \u539F\u9AD8', note: 'ORIGINAL HEIGHT', at: 0.55 },
      { v: 230, d: 0, label: '\u4E07\u5757 \u00B7 \u5DE8\u77F3', note: 'LIMESTONE BLOCKS', at: 1.05 },
      { v: 4500, d: 0, label: '\u5E74 \u00B7 \u5C79\u7ACB\u81F3\u4ECA', note: 'YEARS STANDING', at: 1.55 },
      { v: 3800, d: 0, label: '\u5E74 \u00B7 \u4E16\u754C\u6700\u9AD8', note: 'TALLEST ON EARTH', at: 2.05 },
    ];
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const lp = clamp01((lt - s.at) / 0.55);
      if (lp <= 0) continue;
      const fade = clamp01((lt - s.at) / 0.25) * ha;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = W * (col === 0 ? 0.078 : 0.560);
      const by = H * (0.686 + row * 0.122);

      c.save();
      c.globalAlpha = fade;
      // value
      const val = (s.v * easeOutExpo(lp)).toFixed(s.d);
      // subtle breathing glow so the block keeps moving
      const pulse2 = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.3);
      c.font = '700 ' + Math.round(H * 0.070) + 'px ' + FONT_TECH;
      c.fillStyle = rgba(accent, 0.98);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.shadowColor = rgba(accent, 0.55);
      c.shadowBlur = H * (0.024 + pulse2 * 0.022);
      c.fillText(val, bx, by);
      c.shadowBlur = 0;
      // unit
      c.font = '300 ' + Math.round(H * 0.0235) + 'px ' + FONT_CN;
      c.fillStyle = 'rgba(255,255,255,0.86)';
      c.fillText(s.label, bx + W * 0.112, by - H * 0.006);
      // note
      c.font = '400 ' + Math.round(H * 0.0145) + 'px ' + FONT_MONO;
      c.fillStyle = 'rgba(255,255,255,0.52)';
      c.fillText(s.note, bx, by + H * 0.024);
      // hairline
      c.strokeStyle = rgba(accent, 0.28);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(bx, by + H * 0.038);
      c.lineTo(bx + W * 0.148 * easeOutCubic(lp), by + H * 0.038);
      c.stroke();
      c.restore();
    }
  }

  function drawOutro(c, lt, dur, accent, t) {
    const cx = W * 0.5;
    const p = clamp01(lt / dur);

    // the pyramid recedes into the dark: a real pull-back, not a freeze
    c.save();
    const pull = easeInOutCubic(p);
    c.translate(cx, H * 0.46 + pull * H * 0.11);
    const os = 0.98 - pull * 0.34;
    c.scale(os, os);
    c.rotate(Math.sin(p * 2.2) * 0.02);
    c.translate(-cx, -H * 0.50);
    drawWire(PYR, {
      ctx: c, accent,
      reveal: 1,
      alpha: 0.90 - p * 0.48,
      glow: 1.15 - p * 0.55,
      sweep: -1,
      lw: Math.max(1.6, H / 560),
    });
    c.restore();

    const a = clamp01(lt / 0.5) * clamp01((dur - lt) / 0.8 + 0.35);
    c.save();
    c.globalAlpha = a;
    drawChars(c, '\u53EA\u6709\u5B83\uFF0C\u8FD8\u7AD9\u7740', cx, H * 0.755, {
      font: '900 ' + Math.round(H * 0.082) + 'px ' + FONT_CN,
      color: '#ffffff', align: 'center',
      progress: clamp01((lt - 0.15) / 0.9), stagger: 0.075, rise: H * 0.024,
    });
    c.restore();
    c.save();
    c.globalAlpha = a * 0.85;
    c.font = '400 ' + Math.round(H * 0.0185) + 'px ' + FONT_TECH;
    c.fillStyle = rgba(accent, 0.9);
    c.textAlign = 'center';
    c.fillText('THE ONLY ONE STILL STANDING', cx, H * 0.808);
    c.restore();

    // final tally
    const fa = clamp01((lt - 0.9) / 0.6) * clamp01((dur - lt) / 0.6 + 0.3);
    c.save();
    c.globalAlpha = fa * 0.7;
    c.font = '400 ' + Math.round(H * 0.0165) + 'px ' + FONT_MONO;
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.textAlign = 'center';
    c.fillText('6 LOST  \u00B7  1 REMAINS  \u00B7  4,500 YEARS', cx, H * 0.875);
    c.restore();
  }

  // ---------------------------------------------------------------- particles
  function drawBurst(c, lt, accent) {
    if (lt < 0 || lt > 2.0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const d = lt - (i % 13) * 0.012;
      if (d < 0) continue;
      const life = q.life;
      if (d > life) continue;
      const u = d / life;
      const sp = q.sp * H * 0.55;
      const dist = sp * easeOutCubic(u) * 1.6;
      const ang = q.a;
      const x = W * 0.5 + Math.cos(ang) * dist;
      const y = H * 0.5 + Math.sin(ang) * dist * 0.72 + u * u * H * 0.12;
      const al = (1 - u) * (1 - u);
      c.fillStyle = rgba(accent, al * 0.9);
      c.fillRect(x, y, q.sz * (1 - u * 0.5), q.sz * (1 - u * 0.5));
    }
    c.restore();
  }

  // ------------------------------------------------------------------- render
  const shakeRng = rng(4242);

  function prepareFrame(time) {
    const t = clamp(time, 0, 50);
    const shot = shotAt(t);
    const lt = t - shot.t0;
    const dur = shot.t1 - shot.t0;

    const accent =
      shot.kind === 'wonder' ? WONDERS[shot.i].accent :
      shot.kind === 'pyramid' || shot.kind === 'last' || shot.kind === 'outro' ? PYRAMID.accent :
      shot.kind === 'purge' ? [255, 92, 84] :
      [148, 214, 255];

    const c = lctx;
    c.setTransform(1, 0, 0, 1, 0, 0);

    // background energy follows the section
    let energy = 1.0;
    if (shot.kind === 'count') energy = 0.62 + clamp01(lt / dur) * 0.7;
    if (shot.kind === 'last') energy = 0.4 + clamp01(lt / dur) * 0.9;
    if (shot.kind === 'pyramid' || shot.kind === 'outro') energy = 1.35;

    bg.draw(c, t, { accent, energy });

    // ---- content
    if (shot.kind === 'intro') drawIntro(c, lt, dur, accent, t);
    else if (shot.kind === 'wonder') drawShotWonder(c, shot.i, lt, dur, accent, t);
    else if (shot.kind === 'purge') drawPurge(c, lt, dur, accent, t);
    else if (shot.kind === 'count') drawCount(c, lt, dur, accent, t);
    else if (shot.kind === 'last') drawLast(c, lt, dur, accent, t);
    else if (shot.kind === 'pyramid') drawPyramid(c, lt, dur, accent, t);
    else if (shot.kind === 'outro') drawOutro(c, lt, dur, accent, t);

    // burst on the drop
    drawBurst(c, t - DROP, accent);

    // ---- persistent HUD
    const hudA = shot.kind === 'last' ? 0.55 : 1;
    hudCorners(c, accent, hudA, W * 0.038);

    // seven-marker ring: how many are still standing
    let lit = 7;
    if (t >= 20.4) lit = 7 - Math.round(clamp01((t - 20.7) / 1.9) * 6);
    if (shot.kind === 'pyramid' || shot.kind === 'outro') lit = 1;
    if (shot.kind !== 'intro') {
      c.save();
      c.globalAlpha = 0.55;
      ringHud(c, accent, 1, t, lit, 7);
      c.restore();
    }

    // top labels
    const sectionNames = {
      intro: 'PROLOGUE', wonder: 'MIRACULUM', purge: 'THE VANISHED',
      count: 'COUNTDOWN', last: 'THE LAST',
      pyramid: 'KHUFU', outro: 'EPILOGUE',
    };
    topLabel(
      c, accent, t,
      'VII \u00B7 MIRACULA MUNDI',
      sectionNames[shot.kind] + '   ' + String(Math.floor(t * 30)).padStart(4, '0')
    );

    // ---- post
    bg.post(c, t, { accent, noise: 0.05 });

    // ---- composite with shake / chromatic glitch
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sh = shakeAt(t) * DPR;
    const sx = (shakeRng() - 0.5) * 2 * sh;
    const sy = (shakeRng() - 0.5) * 2 * sh;
    const g = glitchAt(t);

    ctx.save();
    ctx.translate(sx, sy);
    if (g > 0.04) {
      // channel split: red left, cyan right, screen-blended
      const off = g * 16 * DPR;
      rctx.setTransform(1, 0, 0, 1, 0, 0);
      rctx.globalCompositeOperation = 'source-over';
      rctx.drawImage(layer, 0, 0);
      rctx.globalCompositeOperation = 'multiply';
      rctx.fillStyle = '#ff0000';
      rctx.fillRect(0, 0, chanR.width, chanR.height);

      cctx.setTransform(1, 0, 0, 1, 0, 0);
      cctx.globalCompositeOperation = 'source-over';
      cctx.drawImage(layer, 0, 0);
      cctx.globalCompositeOperation = 'multiply';
      cctx.fillStyle = '#00ffff';
      cctx.fillRect(0, 0, chanC.width, chanC.height);

      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(layer, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, g * 1.1);
      ctx.drawImage(chanR, -off, 0);
      ctx.drawImage(chanC, off, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // slice displacement
      const bands = 5;
      const br = rng(Math.floor(t * 60) + 11);
      for (let i = 0; i < bands; i++) {
        const y = br() * canvas.height;
        const h = (0.01 + br() * 0.05) * canvas.height;
        const dx = (br() - 0.5) * 90 * DPR * g;
        ctx.drawImage(
          layer,
          0, Math.floor(y), canvas.width, Math.floor(h),
          dx, Math.floor(y), canvas.width, Math.floor(h)
        );
      }
    } else {
      ctx.drawImage(layer, 0, 0);
    }
    ctx.restore();

  }

  return {
    prepareFrame,
    dispose() {
      canvas.remove();
    },
  };
}
