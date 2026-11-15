// 确定性粒子：飞散 / 浮尘 / 爆点 / 光点拖尾
// 全部是 p 或 t 的纯函数

import { el, rnd, clamp, eOut } from './kit.js';
import { C } from './theme.js';

// 碎散：从一点向外飞散并淡出
export function disperse(parent, opts = {}) {
  const n = opts.n ?? 30;
  const spread = opts.spread ?? 380;
  const colors = opts.colors ?? [
    C.gold,
    'rgba(243,196,82,0.55)',
    'rgba(242,235,220,0.72)',
    'rgba(150,144,128,0.45)',
  ];
  const bias = opts.bias ?? 0;
  const seed = opts.seed ?? 0;

  const wrap = el('div', {
    position: 'absolute',
    left: pos(opts.x, '50%'),
    top: pos(opts.y, '50%'),
    width: '0', height: '0',
    pointerEvents: 'none',
  }, parent);

  const ps = [];
  for (let i = 0; i < n; i++) {
    const a = rnd(i * 3.1, seed) * Math.PI * 2 + bias;
    const dist = 0.28 + rnd(i * 7.7, seed) * 0.72;
    const sz = 1.8 + rnd(i * 11.3, seed) * 5.0;
    const node = el('div', {
      position: 'absolute', left: '0', top: '0',
      width: `${sz.toFixed(1)}px`,
      height: `${(sz * (0.5 + rnd(i * 5.5, seed) * 0.9)).toFixed(1)}px`,
      background: colors[i % colors.length],
      borderRadius: rnd(i * 2.2, seed) > 0.5 ? '50%' : '1px',
      opacity: '0',
      willChange: 'transform, opacity',
    }, wrap);
    ps.push({
      node,
      cos: Math.cos(a), sin: Math.sin(a), dist,
      rot: rnd(i * 13.1, seed) * 360,
      spin: (rnd(i * 17.3, seed) - 0.5) * 320,
      lag: rnd(i * 19.7, seed) * 0.20,
    });
  }

  return (p) => {
    if (p <= 0) {
      for (const q of ps) q.node.style.opacity = '0';
      return;
    }
    for (const q of ps) {
      const u = clamp((p - q.lag) / (1 - q.lag));
      const e = 1 - Math.pow(1 - u, 2.6);
      const r = spread * q.dist * e;
      const x = q.cos * r;
      const y = q.sin * r + 30 * e * e;
      q.node.style.transform =
        `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(q.rot + q.spin * u).toFixed(1)}deg) scale(${(1 - u * 0.5).toFixed(2)})`;
      q.node.style.opacity = String(clamp(u * 5) * (1 - u) * 1.05);
    }
  };
}

// 浮尘：缓缓飘起的微粒，给静态画面一点空气
export function motes(parent, opts = {}) {
  const n = opts.n ?? 24;
  const w = opts.w ?? 1100;
  const h = opts.h ?? 720;
  const colors = opts.colors ?? [
    'rgba(243,196,82,0.7)',
    'rgba(243,196,82,0.35)',
    'rgba(242,235,220,0.42)',
  ];
  const seed = opts.seed ?? 3;

  const wrap = el('div', {
    position: 'absolute',
    left: opts.x ?? '50%', top: opts.y ?? '50%',
    width: `${w}px`, height: `${h}px`,
    marginLeft: `${-w / 2}px`, marginTop: `${-h / 2}px`,
    pointerEvents: 'none',
  }, parent);

  const ps = [];
  for (let i = 0; i < n; i++) {
    const sz = 1.4 + rnd(i * 4.4, seed) * 3.2;
    const node = el('div', {
      position: 'absolute',
      left: `${(rnd(i * 9.1, seed) * 100).toFixed(2)}%`,
      top: `${(rnd(i * 6.3, seed) * 100).toFixed(2)}%`,
      width: `${sz.toFixed(1)}px`, height: `${sz.toFixed(1)}px`,
      borderRadius: '50%',
      background: colors[i % colors.length],
      opacity: '0',
      willChange: 'transform, opacity',
    }, wrap);
    ps.push({
      node,
      amp: 7 + rnd(i * 21.1, seed) * 22,
      speed: 0.09 + rnd(i * 23.9, seed) * 0.22,
      phase: rnd(i * 27.3, seed) * Math.PI * 2,
      rise: 34 + rnd(i * 31.7, seed) * 110,
      base: 0.22 + rnd(i * 33.1, seed) * 0.7,
    });
  }

  return (t, gain = 1) => {
    for (const q of ps) {
      const y = -q.rise * (t * q.speed) + Math.sin(t * 0.7 + q.phase) * q.amp;
      const x = Math.sin(t * 0.5 + q.phase * 1.7) * q.amp * 0.7;
      const tw = 0.55 + 0.45 * Math.sin(t * 2.1 + q.phase * 3.1);
      q.node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      q.node.style.opacity = String(q.base * tw * gain);
    }
  };
}

// 环形冲击波：金色圆环从中心扩散
// x/y 接受 0..1 的比例或 CSS 长度字符串
const pos = (v, fb) => (v === undefined ? fb : typeof v === 'number' ? `${v * 100}%` : v);

export function ring(parent, opts = {}) {
  const size = opts.size ?? 900;
  const node = el('div', {
    position: 'absolute',
    left: pos(opts.x, '50%'),
    top: pos(opts.y, '50%'),
    width: `${size}px`, height: `${size}px`,
    marginLeft: `${-size / 2}px`, marginTop: `${-size / 2}px`,
    border: `1.5px solid ${opts.color ?? C.gold}`,
    borderRadius: '50%',
    opacity: '0',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  }, parent);

  // p: 0→1
  return (p, maxScale = 1.6) => {
    if (p <= 0 || p >= 1) { node.style.opacity = '0'; return; }
    const e = eOut(p);
    node.style.transform = `scale(${(0.18 + e * maxScale).toFixed(3)})`;
    node.style.opacity = String((1 - p) * 0.75);
  };
}
