// 冲击类特效：全屏闪、镜头震动、放射速度线、曲线辉光、端点光爆、进度条光斑
// 全部是时间 t 的纯函数，任意 seek 结果一致

import { C } from './theme.js';
import { el, clamp, eOut, eOut4, eOut5, eIn2, lerp, rnd, svg, sEl, ST } from './kit.js';

// ───────────────────────────── 震动
// 多个触发点叠加：每次变化都抖一下，抖动量按 (1-u)² 衰减
export function makeShaker(triggers, o = {}) {
  const amp = o.amp ?? 20;
  const dur = o.dur ?? 0.34;
  const freq = o.freq ?? 21;
  const rot = o.rot ?? 0.42;

  return (t) => {
    let x = 0, y = 0, r = 0;
    for (const t0 of triggers) {
      const u = t - t0;
      if (u < 0 || u > dur) continue;
      const k = 1 - u / dur;
      const e = k * k; // 尾巴收得快，读起来是"被撞了一下"
      const ph = u * freq * Math.PI * 2;
      x += Math.sin(ph) * amp * e;
      y += Math.cos(ph * 1.37) * amp * 0.70 * e;
      r += Math.sin(ph * 0.81) * rot * e;
    }
    if (Math.abs(x) < 0.02 && Math.abs(y) < 0.02) return '';
    return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg)`;
  };
}

// ───────────────────────────── 全屏闪
// 独立一层，盖在所有镜头之上（scene.js 驱动）
export function flashEnvelope(t, t0, dur) {
  const u = (t - t0) / dur;
  if (u < 0 || u > 1) return 0;
  // 30% 处冲到峰值，然后指数衰减
  const rise = clamp(u / 0.16);
  const fall = Math.pow(1 - clamp((u - 0.16) / 0.84), 2.6);
  return rise * fall;
}

// ───────────────────────────── 放射速度线
// 只在"环带"里存在：从 r0 推到 r1，不横穿画面，也不会糊到字上
export function speedLines(l, o = {}) {
  const n = o.n ?? 24;
  const len = o.len ?? 260;     // 单根长度
  const r0 = o.r0 ?? 150;       // 起始半径
  const r1 = o.r1 ?? 520;       // 推到的最远半径
  const color = o.color ?? 'rgba(243,196,82,0.85)';
  const cx = o.x ?? 0.5;
  const cy = o.y ?? 0.5;
  const seed = o.seed ?? 5;
  const alpha = o.alpha ?? 0.7;

  const wrap = el('div', {
    position: 'absolute',
    left: `${cx * 100}%`, top: `${cy * 100}%`,
    width: '0', height: '0',
    pointerEvents: 'none',
  }, l);

  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 + rnd(i, seed) * 9;
    const w = 1.2 + rnd(i * 3.7, seed) * 2.0;
    const L = len * (0.6 + rnd(i * 7.1, seed) * 0.8);
    const node = el('div', {
      position: 'absolute', left: '0', top: '0',
      width: `${w.toFixed(1)}px`, height: `${L.toFixed(0)}px`,
      // 内端亮、外端消失，读成"从中心射出去"
      background: `linear-gradient(to bottom, ${color} 0%, rgba(243,196,82,0) 100%)`,
      transformOrigin: '50% 0%',
      opacity: '0',
      borderRadius: '2px',
      willChange: 'transform, opacity',
    }, wrap);
    lines.push({ node, a, lag: rnd(i * 11.3, seed) * 0.18, L });
  }

  // p: 0→1
  return (p) => {
    const q = clamp(p);
    if (q <= 0 || q >= 1) {
      for (const s of lines) s.node.style.opacity = '0';
      return;
    }
    for (const s of lines) {
      const u = clamp((q - s.lag) / (1 - s.lag));
      const e = eOut4(u);
      // 从 r0 推到 r1，越推越淡
      const rad = lerp(r0, r1, e);
      const sc = lerp(0.35, 1.15, e);
      s.node.style.transform =
        `rotate(${s.a.toFixed(2)}deg) translateY(${rad.toFixed(1)}px) scaleY(${sc.toFixed(3)})`;
      s.node.style.opacity = String(Math.sin(Math.PI * u) * alpha);
    }
  };
}

// ───────────────────────────── 冲击环（可指定位置与颜色）
// 位置支持两种：x/y 是 0–1 的画面比例；px/py 是父容器内的像素坐标
export function shockRing(l, o = {}) {
  const size = o.size ?? 420;
  const usePx = o.px !== undefined;
  const node = el('div', {
    position: 'absolute',
    left: usePx ? `${o.px}px` : `${(o.x ?? 0.5) * 100}%`,
    top: usePx ? `${o.py}px` : `${(o.y ?? 0.5) * 100}%`,
    width: `${size}px`, height: `${size}px`,
    marginLeft: `${-size / 2}px`, marginTop: `${-size / 2}px`,
    border: `${o.w ?? 2}px solid ${o.color ?? C.gold}`,
    borderRadius: '50%',
    opacity: '0',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  }, l);

  return (p, maxScale = 2.2) => {
    if (p <= 0 || p >= 1) { node.style.opacity = '0'; return; }
    const e = eOut(p);
    node.style.transform = `scale(${(0.10 + e * maxScale).toFixed(3)})`;
    node.style.opacity = String((1 - p) * 0.9);
  };
}

// ───────────────────────────── 发光光斑（数字/端点/条头共用）
export function glowSpot(parent, o = {}) {
  const size = o.size ?? 26;
  const color = o.color ?? C.gold;
  const node = el('div', {
    position: 'absolute',
    left: o.left ?? '0px', top: o.top ?? '0px',
    width: `${size}px`, height: `${size}px`,
    marginLeft: `${-size / 2}px`, marginTop: `${-size / 2}px`,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 ${size * 1.2}px ${size * 0.36}px ${o.halo ?? 'rgba(243,196,82,0.55)'}`,
    opacity: '0',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  }, parent);
  return node;
}

// ───────────────────────────── 曲线辉光
// 在曲线下面垫一条宽的模糊描边，再叠一条沿曲线跑的高光
export function bloomCurve(A, f, o = {}) {
  const { xMax = A.xMax, steps = 120, color = C.gold } = o;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const n = (i / steps) * xMax;
    d += `${i === 0 ? 'M' : 'L'}${A.X(n).toFixed(2)},${A.Y(f(n)).toFixed(2)}`;
  }

  // 底层：宽、淡、模糊 —— 这是"光"
  const bloom = sEl('path', {
    d,
    ...ST(color, 15),
    opacity: '0',
    filter: 'blur(9px)',
    'stroke-linecap': 'round',
  }, A.s);

  // 中层：中等宽度低透明度，给边缘一圈暖边
  const halo = sEl('path', {
    d,
    ...ST(color, 5.5),
    opacity: '0',
    filter: 'blur(2.5px)',
    'stroke-linecap': 'round',
  }, A.s);

  // 高光：短亮段沿曲线跑
  const light = sEl('path', {
    d,
    ...ST('#FFF6DC', 3.0),
    pathLength: '1',
    'stroke-dasharray': '0.10 0.90',
    'stroke-dashoffset': '0.10',
    opacity: '0',
    'stroke-linecap': 'round',
  }, A.s);

  return {
    bloom, halo, light,
    // 生长进度 p：辉光跟着曲线一起长出来
    setGrowth(p) {
      const q = clamp(p);
      bloom.style.opacity = String(q * 0.30);
      halo.style.opacity = String(q * 0.42);
      bloom.style.strokeDasharray = 'none';
      halo.style.strokeDasharray = 'none';
      // 用 clip 宽度模拟"跟着长"：靠主曲线的 dashoffset 已经切了，这里只调透明度
      return q;
    },
    // 高光跑一趟：p 0→1，offset 从 +0.10 走到 -1.0
    setLight(p, on = 1) {
      const q = clamp(p);
      light.style.strokeDashoffset = String(0.10 - q * 1.12);
      light.style.opacity = String(on * Math.sin(Math.PI * clamp(q * 1.05)) * 0.95);
    },
  };
}

// ───────────────────────────── 端点光爆
// 到达曲线/条端点时：环 + 粒子 + 亮核
export function endpointBurst(l, o = {}) {
  const x = o.x ?? 0.5;
  const y = o.y ?? 0.5;
  const color = o.color ?? C.gold;
  const size = o.size ?? 300;

  const wrap = el('div', {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    width: '0', height: '0',
    pointerEvents: 'none',
  }, l);

  const core = el('div', {
    position: 'absolute', left: '0', top: '0',
    width: '18px', height: '18px',
    marginLeft: '-9px', marginTop: '-9px',
    borderRadius: '50%',
    background: '#FFF8E4',
    boxShadow: `0 0 26px 10px ${color}, 0 0 70px 26px rgba(243,196,82,0.35)`,
    opacity: '0',
  }, wrap);

  const ring1 = el('div', {
    position: 'absolute', left: '0', top: '0',
    width: `${size}px`, height: `${size}px`,
    marginLeft: `${-size / 2}px`, marginTop: `${-size / 2}px`,
    border: `2px solid ${color}`,
    borderRadius: '50%',
    opacity: '0',
  }, wrap);

  const ring2 = el('div', {
    position: 'absolute', left: '0', top: '0',
    width: `${size * 0.62}px`, height: `${size * 0.62}px`,
    marginLeft: `${-size * 0.31}px`, marginTop: `${-size * 0.31}px`,
    border: `1.5px solid rgba(242,235,220,0.7)`,
    borderRadius: '50%',
    opacity: '0',
  }, wrap);

  // 火花
  const sparks = [];
  const N = o.sparks ?? 16;
  for (let i = 0; i < N; i++) {
    const a = rnd(i * 4.7, o.seed ?? 9) * Math.PI * 2;
    const sz = 2.2 + rnd(i * 8.3, o.seed ?? 9) * 3.4;
    const node = el('div', {
      position: 'absolute', left: '0', top: '0',
      width: `${sz.toFixed(1)}px`, height: `${sz.toFixed(1)}px`,
      marginLeft: `${-sz / 2}px`, marginTop: `${-sz / 2}px`,
      borderRadius: '50%',
      background: i % 3 === 0 ? '#FFF8E4' : color,
      opacity: '0',
    }, wrap);
    sparks.push({ node, cos: Math.cos(a), sin: Math.sin(a), d: 0.35 + rnd(i * 6.1, o.seed ?? 9) * 0.65 });
  }

  // p: 0→1
  return (p, strength = 1) => {
    const q = clamp(p);
    if (q <= 0 || q >= 1) {
      core.style.opacity = '0';
      ring1.style.opacity = '0';
      ring2.style.opacity = '0';
      for (const s of sparks) s.node.style.opacity = '0';
      return;
    }
    // 核：先亮后灭
    core.style.opacity = String(Math.sin(Math.PI * Math.pow(q, 0.45)) * strength);
    const cs = 0.7 + eOut4(clamp(q / 0.4)) * 1.5;
    core.style.transform = `scale(${cs.toFixed(3)})`;

    const e = eOut(q);
    ring1.style.transform = `scale(${(0.12 + e * 1.5).toFixed(3)})`;
    ring1.style.opacity = String((1 - q) * 0.85 * strength);

    const e2 = eOut(clamp((q - 0.12) / 0.88));
    ring2.style.transform = `scale(${(0.10 + e2 * 1.7).toFixed(3)})`;
    ring2.style.opacity = String((1 - q) * 0.55 * strength);

    for (const s of sparks) {
      const u = clamp((q - 0.08) / 0.92);
      const dist = 90 * s.d * eOut4(u);
      s.node.style.transform = `translate(${(s.cos * dist).toFixed(1)}px, ${(s.sin * dist).toFixed(1)}px)`;
      s.node.style.opacity = String(Math.sin(Math.PI * u) * 0.95 * strength);
    }
  };
}

// ───────────────────────────── 进度条光斑
// 条头一个亮斑 + 拖尾，随填充宽度移动；到达端点时脉冲
export function barHead(track, o = {}) {
  const color = o.color ?? C.gold;
  const h = o.h ?? 54;
  const node = el('div', {
    position: 'absolute',
    left: '0px', top: `${-6}px`,
    width: `${o.w ?? 18}px`, height: `${h + 12}px`,
    marginLeft: `${-(o.w ?? 18) / 2}px`,
    background: `linear-gradient(to right, rgba(255,248,228,0) 0%, #FFF8E4 55%, rgba(255,248,228,0) 100%)`,
    borderRadius: '50%',
    filter: 'blur(1.2px)',
    opacity: '0',
    pointerEvents: 'none',
    willChange: 'left, opacity',
  }, track);

  const halo = el('div', {
    position: 'absolute',
    left: '0px', top: `${-18}px`,
    width: `${o.halo ?? 90}px`, height: `${h + 36}px`,
    marginLeft: `${-(o.halo ?? 90) / 2}px`,
    background: `radial-gradient(ellipse at center, ${color} 0%, rgba(243,196,82,0) 70%)`,
    opacity: '0',
    pointerEvents: 'none',
    willChange: 'left, opacity',
  }, track);

  return {
    node, halo,
    // p: 0→1 填充进度；arrive: 0→1 到达后的脉冲
    set(p, arrive = 0) {
      const q = clamp(p);
      const w = o.trackW ?? 1000;
      const x = q * w;
      node.style.left = `${x.toFixed(1)}px`;
      halo.style.left = `${x.toFixed(1)}px`;
      // 运动中亮，停稳后收一点，到达时再爆一下
      const moving = Math.sin(Math.PI * clamp(q)) * 0.55;
      const base = q > 0.002 ? 0.55 : 0;
      const a = clamp((1 - clamp(arrive)) * 0);
      const pulse = arrive > 0 ? Math.sin(Math.PI * clamp(arrive)) * 0.9 : 0;
      node.style.opacity = String(clamp(base + moving + pulse));
      halo.style.opacity = String(clamp(base * 0.55 + moving * 0.7 + pulse * 0.8));
    },
  };
}
