// 动画工具：缓动、DOM 构造、遮罩文字、SVG
// 所有函数都是时间 t 的纯函数，保证任意 seek 结果一致

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, start, dur) => clamp((t - start) / dur);

export const eOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const eOut4 = (t) => 1 - Math.pow(1 - clamp(t), 4);
export const eIn = (t) => Math.pow(clamp(t), 3);
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

// 每拍衰减脉冲，用于轻微呼吸
export const pulse = (t, beat, decay = 0.16) => Math.exp(-((t % beat) / decay));

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
    lineHeight: 1.16,
    paddingBottom: '0.1em',
    paddingTop: '0.04em',
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

export function svg(w, h, parent) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('width', String(w));
  s.setAttribute('height', String(h));
  s.style.overflow = 'visible';
  if (parent) parent.appendChild(s);
  return s;
}

export function sEl(tag, attrs, parent) {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

// 描边生长：返回设置进度的函数
export function drawOn(pathEl) {
  const len = pathEl.getTotalLength();
  pathEl.style.strokeDasharray = String(len);
  pathEl.style.strokeDashoffset = String(len);
  return (p) => {
    pathEl.style.strokeDashoffset = String(len * (1 - clamp(p)));
  };
}

export const fmt = (v) => Math.round(v).toLocaleString('en-US');

// 数字滚动
export function roll(node, value) {
  node.textContent = fmt(value);
}
