// Fancy title for the cover: same treatment as the video's place names -
// gradient fill, dark outline, accent glow, metal rim. Static (progress = 1).

import { clamp01, rgba, easeOutBack, easeOutExpo } from './gfx.js';

export function fancyTitle(c, text, x, y, o) {
  const font = o.font;
  const accent = o.accent || [255, 255, 255];
  const tracking = o.tracking || 0;
  const align = o.align || 'left';
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const glow = o.glow === undefined ? 1.6 : o.glow;

  c.save();
  c.font = font;
  const chars = Array.from(text);
  const n = chars.length;
  if (!n) { c.restore(); return 0; }
  const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
  const ws = chars.map((ch) => c.measureText(ch).width);
  let total = 0;
  for (let i = 0; i < n; i++) total += ws[i];
  total += tracking * (n - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;

  for (let i = 0; i < n; i++) {
    c.save();
    c.translate(cx + ws[i] / 2, y);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.globalAlpha = alpha;

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

    c.lineJoin = 'round';
    c.lineWidth = Math.max(2.0, size * 0.055);
    c.strokeStyle = 'rgba(6,4,12,0.85)';
    c.strokeText(chars[i], 0, 0);

    const g = c.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.42, 'rgba(255,250,245,1)');
    g.addColorStop(0.72, rgba(accent, 1));
    g.addColorStop(1, rgba(accent, 0.85));
    c.fillStyle = g;
    c.fillText(chars[i], 0, 0);

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
  return total;
}
