// 动画工具：缓动、DOM 构造、遮罩文字、SVG、确定性随机
// 全部是时间 t 的纯函数，任意 seek 结果一致（MotionHarness 硬约束）

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, start, dur) => clamp((t - start) / dur);
export const smooth = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export const eOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const eOut4 = (t) => 1 - Math.pow(1 - clamp(t), 4);
export const eOut5 = (t) => 1 - Math.pow(1 - clamp(t), 5);
export const eIn = (t) => Math.pow(clamp(t), 3);
export const eIn2 = (t) => Math.pow(clamp(t), 2);
export const eInOut = (t) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const eExpo = (t) => {
  const x = clamp(t);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
};
export const eBack = (t, s = 1.6) => {
  const x = clamp(t);
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
};
export const eSine = (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
// 弹性收敛：数值落位用，尾部有极轻微过冲
export const eElastic = (t, amp = 0.08) => {
  const x = clamp(t);
  if (x >= 1) return 1;
  return 1 - Math.pow(2, -9 * x) * Math.cos(x * Math.PI * 3.2) * amp - Math.pow(2, -9 * x) * 0;
};

// 确定性伪随机：同一个 i 永远得到同一个数
export const rnd = (i, seed = 0) => {
  const x = Math.sin(i * 127.1 + seed * 311.7 + 74.7) * 43758.5453;
  return x - Math.floor(x);
};

export function el(tag, css, parent) {
  const n = document.createElement(tag);
  if (css) Object.assign(n.style, css);
  if (parent) parent.appendChild(n);
  return n;
}

export function txt(str, css, parent) {
  const n = el('div', css, parent);
  n.textContent = str;
  return n;
}

// 遮罩文字：从下方推出，overflow 裁切
export function mask(str, css, parent) {
  const wrap = el('div', {
    overflow: 'hidden',
    display: 'block',
    lineHeight: 1.18,
    paddingBottom: '0.12em',
    paddingTop: '0.05em',
  }, parent);
  const inner = el('div', { display: 'block', willChange: 'transform', ...css }, wrap);
  inner.textContent = str;
  return {
    wrap,
    inner,
    set(p, dist = 112) {
      inner.style.transform = `translateY(${(1 - eExpo(p)) * dist}%)`;
    },
  };
}

// 允许内联标签（混合颜色）的遮罩文字
export function maskHTML(html, css, parent) {
  const m = mask('', css, parent);
  m.inner.innerHTML = html;
  return m;
}

export function svg(w, h, parent, style = {}) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('width', String(w));
  s.setAttribute('height', String(h));
  Object.assign(s.style, { overflow: 'visible', display: 'block' }, style);
  if (parent) parent.appendChild(s);
  return s;
}

export function sEl(tag, attrs, parent) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

export const ST = (col, w = 1.6, extra = {}) => ({
  fill: 'none',
  stroke: col,
  'stroke-width': String(w),
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  ...extra,
});

// 描边生长
export function drawOn(pathEl) {
  const len = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = String(len);
  pathEl.style.strokeDashoffset = String(len);
  return (p) => {
    pathEl.style.strokeDashoffset = String(len * (1 - clamp(p)));
  };
}

export const fmt = (v) => Math.round(v).toLocaleString('en-US');

// 百分比：一位或两位小数，去掉多余的 0
export function pct(v, d = 1) {
  const s = v.toFixed(d);
  return s.replace(/\.?0+$/, '') + '%';
}

// 数值滚动：把 t 映射成"离散跳变"的整数，避免连续插值出现字幕里没有的中间值
export function steps(t, t0, dur, from, to, count) {
  const p = prog(t, t0, dur);
  const i = Math.min(count, Math.floor(eOut(p) * count + 0.0001));
  return Math.round(from + ((to - from) * i) / count);
}
