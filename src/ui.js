// 版式工具：与参考片一致的留白、边注、脚注
import { C, F, FM, FS, W, H } from './theme.js';
import { el } from './kit.js';

export function layer(root) {
  const d = el('div', {
    position: 'absolute',
    inset: '0',
    willChange: 'transform,opacity,clip-path,filter',
    backfaceVisibility: 'hidden',
  }, root);
  return d;
}

export function center(l) {
  return el('div', {
    position: 'absolute', inset: '0',
    display: 'grid', placeItems: 'center',
  }, l);
}

// 左上角小字：篇章编号 / 分类
export function kick(parent, text, color = C.faint) {
  const d = el('div', {
    position: 'absolute', left: '120px', top: '92px',
    font: `500 ${FS.micro}px ${FM}`,
    letterSpacing: '0.26em',
    color,
  }, parent);
  d.textContent = text;
  return d;
}

// 底部居中脚注：克制的小注，参考片常用
export function foot(parent, text) {
  const d = el('div', {
    position: 'absolute', left: '0', right: '0', bottom: '68px',
    textAlign: 'center',
    font: `400 21px ${F}`,
    letterSpacing: '0.08em',
    color: '#4E5870',
  }, parent);
  d.textContent = text;
  return d;
}

// 金色细线
export function goldRule(parent, css = {}) {
  return el('div', {
    height: '1px',
    background: `linear-gradient(90deg, ${C.gold}, rgba(232,180,74,0.15))`,
    width: '0px',
    ...css,
  }, parent);
}

// 强调色 span
export const g = (s) => `<span style="color:${C.gold}">${s}</span>`;
export const r = (s) => `<span style="color:${C.red}">${s}</span>`;
export const d = (s) => `<span style="color:${C.dim}">${s}</span>`;
