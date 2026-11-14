// 粒子：碎散 / 上浮
// 全部是 p 的纯函数，任意 seek 结果一致

import { el } from './kit.js';

// 确定性伪随机：同一个 i 永远得到同一个数
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// 碎散：从一点向外飞散并淡出
// 用于"东西没了"的节拍——钟被时间吃掉、数字归零
export function disperse(parent, opts = {}) {
  const n = opts.n ?? 28;
  const spread = opts.spread ?? 360;
  const colors = opts.colors ?? [
    '#E8B44A',
    'rgba(232,180,74,0.55)',
    'rgba(224,232,244,0.72)',
    'rgba(150,170,200,0.5)',
  ];
  const bias = opts.bias ?? 0; // 整体飘移方向（弧度）

  const wrap = el('div', {
    position: 'absolute',
    left: opts.x ?? '50%',
    top: opts.y ?? '50%',
    width: '0', height: '0',
    pointerEvents: 'none',
  }, parent);

  const ps = [];
  for (let i = 0; i < n; i++) {
    const a = rnd(i * 3.1) * Math.PI * 2 + bias;
    const dist = 0.30 + rnd(i * 7.7) * 0.70;
    const sz = 2 + rnd(i * 11.3) * 5.5;
    const node = el('div', {
      position: 'absolute', left: '0', top: '0',
      width: `${sz}px`, height: `${sz * (0.45 + rnd(i * 5.5) * 0.9)}px`,
      background: colors[i % colors.length],
      borderRadius: rnd(i * 2.2) > 0.55 ? '50%' : '0',
      opacity: '0',
      willChange: 'transform,opacity',
    }, wrap);
    ps.push({
      node,
      cos: Math.cos(a),
      sin: Math.sin(a),
      dist,
      rot: rnd(i * 13.1) * 360,
      spin: (rnd(i * 17.3) - 0.5) * 300,
      lag: rnd(i * 19.7) * 0.22,
    });
  }

  // p: 0→1
  return (p) => {
    if (p <= 0) {
      ps.forEach((q) => { q.node.style.opacity = '0'; });
      return;
    }
    ps.forEach((q) => {
      const u = Math.max(0, Math.min(1, (p - q.lag) / (1 - q.lag)));
      const e = 1 - Math.pow(1 - u, 2.4);
      const r = spread * q.dist * e;
      const x = q.cos * r;
      const y = q.sin * r + 26 * e * e; // 轻微下坠，像被重力收走
      const sc = 1 - u * 0.45;
      q.node.style.transform =
        `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(q.rot + q.spin * u).toFixed(1)}deg) scale(${sc.toFixed(2)})`;
      // 先亮起来再灭
      q.node.style.opacity = String(Math.min(1, u * 5) * (1 - u) * 1.05);
    });
  };
}

// 上浮：金色微粒缓缓飘起，给静态画面一点空气
export function motes(parent, opts = {}) {
  const n = opts.n ?? 22;
  const w = opts.w ?? 900;
  const h = opts.h ?? 620;
  const colors = opts.colors ?? [
    'rgba(232,180,74,0.75)',
    'rgba(232,180,74,0.4)',
    'rgba(224,232,244,0.45)',
  ];

  const wrap = el('div', {
    position: 'absolute',
    left: opts.x ?? '50%', top: opts.y ?? '50%',
    width: `${w}px`, height: `${h}px`,
    marginLeft: `${-w / 2}px`, marginTop: `${-h / 2}px`,
    pointerEvents: 'none',
  }, parent);

  const ps = [];
  for (let i = 0; i < n; i++) {
    const sz = 1.5 + rnd(i * 4.4) * 3.5;
    const node = el('div', {
      position: 'absolute',
      left: `${rnd(i * 9.1) * 100}%`,
      top: `${rnd(i * 6.3) * 100}%`,
      width: `${sz}px`, height: `${sz}px`,
      borderRadius: '50%',
      background: colors[i % colors.length],
      opacity: '0',
      willChange: 'transform,opacity',
    }, wrap);
    ps.push({
      node,
      amp: 8 + rnd(i * 21.1) * 26,
      speed: 0.10 + rnd(i * 23.9) * 0.26,
      phase: rnd(i * 27.3) * Math.PI * 2,
      rise: 40 + rnd(i * 31.7) * 120,
      base: 0.25 + rnd(i * 33.1) * 0.75,
    });
  }

  // t: 镜头内秒数，gain: 整体强度
  return (t, gain = 1) => {
    ps.forEach((q) => {
      const y = -q.rise * (t * q.speed) + Math.sin(t * 0.7 + q.phase) * q.amp;
      const x = Math.sin(t * 0.5 + q.phase * 1.7) * q.amp * 0.7;
      const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + q.phase * 3.1);
      q.node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      q.node.style.opacity = String(q.base * tw * gain);
    });
  };
}
