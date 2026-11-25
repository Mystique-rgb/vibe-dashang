// Shared drawing primitives for the landscape layer.
// Unit box: x in [-0.5, 0.5], y in [-0.5, 0.5], y down.
// The caller scales the context, so line widths arrive in screen px.

import { clamp01, rgba, strokePartial } from './gfx.js';

export const TAU = Math.PI * 2;

// Each wonder ignites exactly this many detail elements on its second beat.
// The audio builder reads it and puts one sound on each.
export const WONDER_POINTS = 12;

export function trace(c, pts, close) {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (close) c.closePath();
}

export function fillPoly(c, pts, style) {
  trace(c, pts, true);
  c.fillStyle = style;
  c.fill();
}

export function vgrad(c, y0, y1, accent, a0, a1) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgba(accent, a0));
  g.addColorStop(1, rgba(accent, a1));
  return g;
}

// A polyline with a bloom pass under a crisp core.
export function line(c, pts, accent, lw, alpha, glow, close) {
  if (alpha <= 0.004) return;
  if (glow > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(accent, alpha * 0.24 * glow);
    c.lineWidth = lw * 3.6;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    trace(c, pts, close);
    c.stroke();
    c.restore();
  }
  c.save();
  c.strokeStyle = rgba(accent, alpha);
  c.lineWidth = lw;
  c.lineJoin = 'miter';
  c.miterLimit = 2.6;
  c.lineCap = 'round';
  trace(c, pts, close);
  c.stroke();
  c.restore();
}

// Reveal a set of polylines progressively, as if traced by a light pen.
export function traceSet(c, polys, p, accent, lw, alpha, glow) {
  const n = polys.length;
  if (n === 0 || p <= 0) return;
  const step = Math.min(0.14, 0.55 / n);
  const span = Math.min(0.62, 1 - step * (n - 1));
  if (glow > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(accent, alpha * 0.30 * glow);
    c.lineWidth = lw * 3.2;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const st = clamp01((p - i * step) / span);
      if (st > 0) strokePartial(c, polys[i], st);
    }
    c.restore();
  }
  c.save();
  c.strokeStyle = rgba(accent, alpha);
  c.lineWidth = lw;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const st = clamp01((p - i * step) / span);
    if (st > 0) strokePartial(c, polys[i], st);
  }
  c.restore();
}

// Per-element reveal: element i fades in as the detail sweep passes i/n.
export function dstep(det, i, n) {
  return clamp01(det * n - i);
}

// A wavy line between two points, tapered at both ends.
export function wavy(x0, y0, x1, y1, amp, freq, phase, n) {
  const pts = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const nl = Math.hypot(dx, dy) || 1;
  const nx = -dy / nl;
  const ny = dx / nl;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const w = Math.sin(u * freq * TAU + phase) * amp * Math.sin(u * Math.PI);
    pts.push([x0 + dx * u + nx * w, y0 + dy * u + ny * w]);
  }
  return pts;
}

// Radial bloom helper.
export function bloom(c, x, y, r, inner, outer, alpha) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, rgba(outer, alpha * 0.45));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fill();
}
