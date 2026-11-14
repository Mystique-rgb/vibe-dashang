// SVG 小工具
export const NS = 'http://www.w3.org/2000/svg';

export function SVG(w, h, parent, style = {}) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('width', String(w));
  s.setAttribute('height', String(h));
  Object.assign(s.style, { overflow: 'visible', display: 'block' }, style);
  if (parent) parent.appendChild(s);
  return s;
}

export function E(tag, a, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in a) n.setAttribute(k, a[k]);
  if (parent) parent.appendChild(n);
  return n;
}

export const ST = (col, w = 1.5) => ({
  fill: 'none', stroke: col, 'stroke-width': w,
  'stroke-linecap': 'round', 'stroke-linejoin': 'round',
});

// 描边生长
export function grow(node) {
  const len = node.getTotalLength();
  node.style.strokeDasharray = String(len);
  node.style.strokeDashoffset = String(len);
  return (p) => {
    const v = p < 0 ? 0 : p > 1 ? 1 : p;
    node.style.strokeDashoffset = String(len * (1 - v));
  };
}
