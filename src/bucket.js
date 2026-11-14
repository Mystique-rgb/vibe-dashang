// 漏桶：细线桶身 + 液面波动 + 滴漏
// 完全由 time 驱动，任意 seek 一致

import { C } from './theme.js';
import { clamp, eOut, eInOut, lerp } from './kit.js';
import { SVG, E, ST } from './svgkit.js';

const VW = 520;
const VH = 600;
const TOP_Y = 120;
const BOT_Y = 470;
const TOP_HW = 198;
const BOT_HW = 146;
const CX = VW / 2;

export function createBucket(parent, opts = {}) {
  const waterColor = opts.water || 'rgba(62,110,168,0.55)';
  const lineColor = opts.line || C.line;

  const s = SVG(VW, VH, parent);

  // 桶内裁切
  const defs = E('defs', {}, s);
  const cp = E('clipPath', { id: `bclip-${Math.random().toString(36).slice(2, 8)}` }, defs);
  const inner = `M${CX - TOP_HW + 6},${TOP_Y + 6} L${CX - BOT_HW + 6},${BOT_Y - 4} L${CX + BOT_HW - 6},${BOT_Y - 4} L${CX + TOP_HW - 6},${TOP_Y + 6} Z`;
  E('path', { d: inner }, cp);

  // 水
  const waterG = E('g', { 'clip-path': `url(#${cp.id})` }, s);
  const water = E('path', { d: '', fill: waterColor }, waterG);
  const waterTop = E('path', { d: '', fill: 'none', stroke: 'rgba(150,200,255,0.55)', 'stroke-width': 1.6 }, waterG);

  // 桶身
  const body = E('path', {
    d: `M${CX - TOP_HW},${TOP_Y} L${CX - BOT_HW},${BOT_Y} L${CX + BOT_HW},${BOT_Y} L${CX + TOP_HW},${TOP_Y}`,
    ...ST(lineColor, 1.6),
  }, s);
  const rim = E('ellipse', {
    cx: CX, cy: TOP_Y, rx: TOP_HW, ry: 19,
    ...ST(lineColor, 1.4),
  }, s);
  const bot = E('ellipse', {
    cx: CX, cy: BOT_Y, rx: BOT_HW, ry: 13,
    ...ST('rgba(150,170,200,0.2)', 1.2),
  }, s);

  // 滴漏
  const drops = [];
  for (let i = 0; i < 7; i++) {
    drops.push(E('circle', { cx: CX, cy: BOT_Y, r: 2.6, fill: 'rgba(120,170,235,0.75)', opacity: 0 }, s));
  }

  // 注水柱
  const stream = E('path', { d: '', fill: 'none', stroke: 'rgba(120,170,235,0.6)', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0 }, s);

  // 水位 0..1
  const surfY = (level) => lerp(BOT_Y - 8, TOP_Y + 16, level);
  // 桶壁在该高度的半宽（锥形收口）
  const halfW = (y) => {
    const u = clamp((BOT_Y - y) / (BOT_Y - TOP_Y));
    return lerp(BOT_HW - 7, TOP_HW - 7, u);
  };
  const waveY = (x, top, time, amp) =>
    top + Math.sin(x * 0.035 + time * 3.1) * amp + Math.sin(x * 0.017 - time * 2.2) * amp * 0.6;

  function wavePath(level, time, amp = 4.5) {
    const top = surfY(level);
    const hw = halfW(top);
    const l = CX - hw;
    const r = CX + hw;
    let d = `M${l.toFixed(1)},${waveY(l, top, time, amp).toFixed(1)}`;
    for (let x = l + 10; x <= r; x += 10) {
      d += ` L${x.toFixed(1)},${waveY(x, top, time, amp).toFixed(1)}`;
    }
    d += ` L${r.toFixed(1)},${waveY(r, top, time, amp).toFixed(1)}`;
    d += ` L${r.toFixed(1)},${BOT_Y + 10} L${l.toFixed(1)},${BOT_Y + 10} Z`;
    return d;
  }

  function waveLine(level, time, amp = 4.5) {
    const top = surfY(level);
    const hw = halfW(top);
    const l = CX - hw;
    const r = CX + hw;
    let d = `M${l.toFixed(1)},${waveY(l, top, time, amp).toFixed(1)}`;
    for (let x = l + 10; x <= r; x += 10) {
      d += ` L${x.toFixed(1)},${waveY(x, top, time, amp).toFixed(1)}`;
    }
    d += ` L${r.toFixed(1)},${waveY(r, top, time, amp).toFixed(1)}`;
    return d;
  }

  return {
    svg: s,
    // level: 0..1, pour: 注水强度 0..1, leak: 漏水强度 0..1
    draw(time, level, pour = 0, leak = 0) {
      water.setAttribute('d', wavePath(level, time));
      waterTop.setAttribute('d', waveLine(level, time));

      // 注水柱：从上方落入液面
      if (pour > 0.01) {
        const topY = TOP_Y - 150;
        const sy = surfY(level);
        let d = `M${CX},${topY}`;
        for (let y = topY; y <= sy; y += 14) {
          const x = CX + Math.sin(y * 0.09 + time * 9) * 3.2;
          d += ` L${x.toFixed(1)},${y}`;
        }
        stream.setAttribute('d', d);
        stream.setAttribute('opacity', String(pour * 0.85));
      } else {
        stream.setAttribute('opacity', '0');
      }

      // 水滴
      const cyc = 0.62;
      drops.forEach((d, i) => {
        if (leak <= 0.01) { d.setAttribute('opacity', '0'); return; }
        const ph = ((time + (i * cyc) / drops.length) % cyc) / cyc;
        const y = BOT_Y + 14 + ph * 190;
        const x = CX + (i - 3) * 3.6;
        d.setAttribute('cx', String(x));
        d.setAttribute('cy', String(y));
        d.setAttribute('r', String(2.2 + ph * 0.9));
        d.setAttribute('opacity', String((1 - ph) * leak * 0.9));
      });
    },
  };
}
