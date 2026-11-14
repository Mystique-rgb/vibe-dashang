// 文字动效：逐字拆开做动画
// 参考片的文字几乎都是逐字出现的，整行遮罩推出会显得"太整"
// 所有函数都是时间 t 的纯函数

import { el, clamp, eOut, eBack, lerp } from './kit.js';

// 把字符串拆成字符 span，保留原有字体样式
// 注意：letter-spacing 会作用在每个 span 之后，中文场景下这样正好
function splitChars(str, css, parent) {
  const wrap = el('div', {
    display: 'block',
    whiteSpace: 'nowrap',
    ...css,
  }, parent);
  const spans = [...str].map((ch) => {
    const s = el('span', {
      display: 'inline-block',
      willChange: 'transform, opacity, filter',
      // 空格也要占位
      whiteSpace: ch === ' ' ? 'pre' : 'normal',
    }, wrap);
    s.textContent = ch;
    return s;
  });
  return { wrap, spans };
}

// 逐字淡入 + 轻微上浮
// set(t, t0, dur)  t0 是第一个字的时间，dur 是整串走完的时长
export function typeOn(str, css, parent, opts = {}) {
  const {
    y = 22,          // 上浮距离
    blur = 7,        // 起始模糊
    scale = 1,       // 起始缩放
    stagger = 1,     // 每个字的延迟比例（1 = 均匀铺满 dur）
    ease = 'out',    // out | back
  } = opts;

  const { wrap, spans } = splitChars(str, css, parent);
  const n = spans.length;
  const span = Math.max(0.001, (n - 1) / Math.max(1, n));

  return {
    wrap,
    spans,
    set(t, t0, dur) {
      const step = (dur * stagger) / Math.max(1, n);
      spans.forEach((s, i) => {
        const p = clamp((t - (t0 + i * step)) / Math.max(0.001, dur - (n - 1) * step));
        const e = ease === 'back' ? eBack(p, 1.5) : eOut(p);
        s.style.opacity = String(clamp(p * 4));
        s.style.transform = `translateY(${(1 - e) * y}px) scale(${lerp(scale, 1, e)})`;
        s.style.filter = p < 1 ? `blur(${(1 - p) * blur}px)` : '';
      });
    },
  };
}

// 色差抖动：文字带红青分离，快速收敛
// 参考片用它做转折句的切入
export function rgbSplit(str, css, parent, opts = {}) {
  const { max = 12 } = opts;
  const { wrap, spans } = splitChars(str, css, parent);

  return {
    wrap,
    spans,
    // p: 0 → 1，抖动强度从 max 收敛到 0
    set(p) {
      const q = 1 - eOut(clamp(p));
      const d = q * max;
      wrap.style.filter = d > 0.05
        ? `drop-shadow(${d.toFixed(2)}px 0 0 rgba(255,58,66,0.85)) drop-shadow(${(-d).toFixed(2)}px 0 0 rgba(58,190,255,0.85))`
        : '';
      // 字本身也轻微错位，读起来是"信号不稳"
      spans.forEach((s, i) => {
        const k = ((i * 37) % 7) / 7 - 0.5;
        s.style.transform = `translateX(${(k * d * 0.55).toFixed(2)}px)`;
      });
    },
  };
}

// 逐字从两侧挤入（参考片里数字和关键词的常用手法）
export function slideIn(str, css, parent, opts = {}) {
  const { dist = 40, blur = 5 } = opts;
  const { wrap, spans } = splitChars(str, css, parent);

  return {
    wrap,
    spans,
    set(t, t0, dur) {
      const n = spans.length;
      const step = (dur * 0.72) / Math.max(1, n);
      spans.forEach((s, i) => {
        const p = clamp((t - (t0 + i * step)) / Math.max(0.001, dur * 0.42));
        const e = eOut(p);
        // 奇偶交替左右挤入
        const dir = i % 2 === 0 ? -1 : 1;
        s.style.opacity = String(clamp(p * 4));
        s.style.transform = `translateX(${(1 - e) * dist * dir}px)`;
        s.style.filter = p < 1 ? `blur(${(1 - p) * blur}px)` : '';
      });
    },
  };
}

// 持续的呼吸：让关键词在入场后仍然活着
// 返回一个只做微小缩放的 setter，画面不会完全静止
export function breathe(node, amount = 0.012, period = 2.4) {
  return (t, gain = 1) => {
    const s = 1 + Math.sin((t / period) * Math.PI * 2) * amount * gain;
    node.style.transform = `scale(${s.toFixed(4)})`;
  };
}

// 符号摆动：参考片里的「≠」一直在轻轻晃
// base 是一个可选的额外变换（比如缩放），会和摆动合并成一个 transform
export function wobble(node, amount = 3.2, period = 1.9, phase = 0) {
  return (t, gain = 1, base = null) => {
    const a = Math.sin((t / period) * Math.PI * 2 + phase) * amount * gain;
    const parts = [];
    if (base) parts.push(base);
    parts.push(`rotate(${a.toFixed(2)}deg)`);
    node.style.transform = parts.join(' ');
  };
}

// 逐字飞散：离场用
export function charOut(spans, t, t0, dur, opts = {}) {
  const { dist = 26, rot = 14 } = opts;
  const n = spans.length;
  const step = (dur * 0.6) / Math.max(1, n);
  spans.forEach((s, i) => {
    const p = clamp((t - (t0 + i * step)) / Math.max(0.001, dur * 0.5));
    const dir = i % 2 === 0 ? -1 : 1;
    s.style.opacity = String(1 - p);
    s.style.transform = `translate(${dir * p * dist}px, ${-p * dist * 0.5}px) rotate(${dir * p * rot}deg)`;
    s.style.filter = p > 0 ? `blur(${p * 5}px)` : '';
  });
}
