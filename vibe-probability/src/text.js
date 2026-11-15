// 文字动效：逐字控制
// 对标片的文字几乎都是逐字出现的；整行遮罩推出会显得"太整"
// 所有函数都是时间 t 的纯函数

import { el, clamp, eOut, eOut4, eBack, eExpo, eInOut, lerp, prog } from './kit.js';

// 把字符串拆成字符 span
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
      whiteSpace: ch === ' ' ? 'pre' : 'normal',
    }, wrap);
    s.textContent = ch;
    return s;
  });
  return { wrap, spans };
}

// 逐字淡入 + 轻微上浮（主字幕默认走这个）
export function typeOn(str, css, parent, opts = {}) {
  const { y = 26, blur = 8, scale = 1, ease = 'out' } = opts;
  const { wrap, spans } = splitChars(str, css, parent);
  const n = spans.length;

  return {
    wrap,
    spans,
    set(t, t0, dur) {
      const step = dur / Math.max(1, n);
      spans.forEach((s, i) => {
        const p = clamp((t - (t0 + i * step)) / Math.max(0.001, step * 2.4));
        const e = ease === 'back' ? eBack(p, 1.5) : eOut(p);
        s.style.opacity = String(clamp(p * 3.2));
        s.style.transform = `translateY(${((1 - e) * y).toFixed(2)}px) scale(${lerp(scale, 1, e).toFixed(3)})`;
        s.style.filter = p < 1 ? `blur(${((1 - p) * blur).toFixed(2)}px)` : '';
      });
    },
  };
}

// 逐字从两侧挤入（数字和关键词用）
export function slideIn(str, css, parent, opts = {}) {
  const { dist = 46, blur = 6 } = opts;
  const { wrap, spans } = splitChars(str, css, parent);

  return {
    wrap,
    spans,
    set(t, t0, dur) {
      const n = spans.length;
      const step = (dur * 0.66) / Math.max(1, n);
      spans.forEach((s, i) => {
        const p = clamp((t - (t0 + i * step)) / Math.max(0.001, dur * 0.42));
        const e = eOut4(p);
        const dir = i % 2 === 0 ? -1 : 1;
        s.style.opacity = String(clamp(p * 3.5));
        s.style.transform = `translateX(${((1 - e) * dist * dir).toFixed(2)}px)`;
        s.style.filter = p < 1 ? `blur(${((1 - p) * blur).toFixed(2)}px)` : '';
      });
    },
  };
}

// 色差抖动：转折句切入用
export function rgbSplit(str, css, parent, opts = {}) {
  const { max = 14 } = opts;
  const { wrap, spans } = splitChars(str, css, parent);

  return {
    wrap,
    spans,
    set(p) {
      const q = 1 - eOut(clamp(p));
      const d = q * max;
      wrap.style.filter = d > 0.05
        ? `drop-shadow(${d.toFixed(2)}px 0 0 rgba(255,58,66,0.8)) drop-shadow(${(-d).toFixed(2)}px 0 0 rgba(58,190,255,0.8))`
        : '';
      spans.forEach((s, i) => {
        const k = ((i * 37) % 7) / 7 - 0.5;
        s.style.transform = `translateX(${(k * d * 0.5).toFixed(2)}px)`;
      });
    },
  };
}

// 逐字飞散：离场
export function charOut(spans, t, t0, dur, opts = {}) {
  const { dist = 30, rot = 16 } = opts;
  const n = spans.length;
  const step = (dur * 0.55) / Math.max(1, n);
  spans.forEach((s, i) => {
    const p = clamp((t - (t0 + i * step)) / Math.max(0.001, dur * 0.5));
    const dir = i % 2 === 0 ? -1 : 1;
    s.style.opacity = String(1 - p);
    s.style.transform = `translate(${dir * p * dist}px, ${-p * dist * 0.6}px) rotate(${dir * p * rot}deg)`;
    s.style.filter = p > 0 ? `blur(${(p * 6).toFixed(1)}px)` : '';
  });
}

// ─────────────────────────────────────────── 老虎机数字

// 一列数字滚轮：条带是 0-9 重复，translateY 定位
// 每列可独立控制"起始数字 → 结束数字 + 额外圈数"
export function wheel(str, css, parent, opts = {}) {
  const { loops = 2, digitH = null, lineH = 1.0 } = opts;
  const fs = parseFloat(css.fontSize) || 200;
  const dh = digitH ?? fs * lineH;

  const wrap = el('div', {
    display: 'inline-flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    ...css,
  }, parent);

  const cols = [];
  for (const ch of str) {
    if (ch >= '0' && ch <= '9') {
      const box = el('div', {
        display: 'inline-block',
        height: `${dh}px`,
        overflow: 'hidden',
        width: `${fs * 0.62}px`,
        position: 'relative',
        willChange: 'transform, filter',
      }, wrap);
      const strip = el('div', {
        display: 'block',
        willChange: 'transform',
      }, box);
      const total = 10 * (loops + 1);
      for (let i = 0; i < total; i++) {
        const d = el('div', {
          height: `${dh}px`,
          lineHeight: `${dh}px`,
          textAlign: 'center',
        }, strip);
        d.textContent = String(i % 10);
      }
      cols.push({ box, strip, from: Number(ch), to: Number(ch), isDigit: true });
    } else {
      const s = el('div', {
        display: 'inline-block',
        height: `${dh}px`,
        lineHeight: `${dh}px`,
      }, wrap);
      s.textContent = ch;
      cols.push({ box: s, isDigit: false });
    }
  }

  return {
    wrap,
    cols,
    // 设定目标数字串（同长度），用于计算每列的落点
    target(numStr) {
      const digs = [...numStr].filter((c) => c >= '0' && c <= '9');
      let k = 0;
      for (const c of cols) {
        if (c.isDigit) { c.to = Number(digs[k] ?? '0'); k++; }
      }
      return this;
    },
    // p: 0→1 滚动进度；blurMax: 最大运动模糊
    set(p, blurMax = 22) {
      const q = clamp(p);
      const e = eOut4(q);
      for (const c of cols) {
        if (!c.isDigit) continue;
        const travel = (c.to - c.from + 10 * loops);
        const y = -(c.from + travel * e) * dh;
        const vel = (1 - q) * (1 - q) * blurMax;
        c.strip.style.transform = `translateY(${y.toFixed(2)}px)`;
        c.box.style.filter = vel > 0.4 ? `blur(${vel.toFixed(1)}px)` : '';
      }
    },
  };
}

// 纯数字计数（缓动决定可信度）：只用于允许连续滚动的场合
export function counter(node, t, t0, dur, from, to, fmtFn = (v) => v.toFixed(1)) {
  const p = prog(t, t0, dur);
  const e = eOut4(p);
  node.textContent = fmtFn(from + (to - from) * e);
}

// 离散跳变：只取给定的台阶值，绝不出现字幕里没有的中间值
// steps: [1, 10, 23, 33, 76, 100, 152]
export function stepValue(t, t0, dur, steps) {
  const p = prog(t, t0, dur);
  const i = Math.min(steps.length - 1, Math.floor(eOut4(p) * steps.length * 0.999));
  return steps[i];
}
