// 版式：三层文字固定站位（中文主字幕 / 英文副字幕 / 角标）
// 英文副字幕永远紧贴中文正下方，是全片"系列感"的来源

import { C, F, FN, FM, FS, W, H } from './theme.js';
import { el, eOut, eExpo, clamp } from './kit.js';

export function layer(root) {
  return el('div', {
    position: 'absolute',
    inset: '0',
    willChange: 'transform, opacity, clip-path, filter',
    backfaceVisibility: 'hidden',
    contain: 'layout style',
  }, root);
}

export function center(l) {
  return el('div', {
    position: 'absolute', inset: '0',
    display: 'grid', placeItems: 'center',
  }, l);
}

// 绝对定位盒
export function box(l, css) {
  return el('div', { position: 'absolute', ...css }, l);
}

// 左上角角标：篇章编号
export function kick(parent, text, color = C.faint) {
  const d = el('div', {
    position: 'absolute', left: '96px', top: '78px',
    font: `500 ${FS.micro}px ${FM}`,
    letterSpacing: '0.28em',
    color,
    textTransform: 'uppercase',
  }, parent);
  d.textContent = text;
  return d;
}

// 右上角角标
export function kickR(parent, text, color = C.faint) {
  const d = el('div', {
    position: 'absolute', right: '96px', top: '78px',
    font: `500 ${FS.micro}px ${FM}`,
    letterSpacing: '0.28em',
    color,
    textTransform: 'uppercase',
  }, parent);
  d.textContent = text;
  return d;
}

// 底部居中脚注
export function foot(parent, text, bottom = 56) {
  const d = el('div', {
    position: 'absolute', left: '0', right: '0', bottom: `${bottom}px`,
    textAlign: 'center',
    font: `400 22px ${F}`,
    letterSpacing: '0.10em',
    color: '#57523F',
  }, parent);
  d.textContent = text;
  return d;
}

// 金色细线（可生长）
export function goldRule(parent, css = {}) {
  return el('div', {
    height: '1px',
    background: `linear-gradient(90deg, rgba(243,196,82,0) 0%, ${C.gold} 22%, ${C.gold} 78%, rgba(243,196,82,0) 100%)`,
    width: '0px',
    ...css,
  }, parent);
}

// 双语句块：中文主字幕 + 英文副字幕，固定站位
// 中文 baseline ≈ 0.85h，英文 ≈ 0.90h
export function caption(l, zh, en, opts = {}) {
  const { bottom = 92, zhSize = FS.body, enSize = FS.sub, align = 'center' } = opts;
  const wrap = el('div', {
    position: 'absolute',
    left: '0', right: '0', bottom: `${bottom}px`,
    display: 'flex', flexDirection: 'column',
    alignItems: align === 'center' ? 'center' : 'flex-start',
    gap: '10px',
    paddingLeft: align === 'center' ? '0' : '96px',
    pointerEvents: 'none',
  }, l);

  const zhNode = el('div', {
    font: `700 ${zhSize}px ${F}`,
    color: C.ink,
    letterSpacing: '0.012em',
    lineHeight: '1.2',
    textAlign: align,
  }, wrap);

  const enNode = el('div', {
    font: `400 ${enSize}px ${FN}`,
    color: C.dim,
    letterSpacing: '0.10em',
    lineHeight: '1.2',
    textAlign: align,
  }, wrap);

  enNode.textContent = en;
  zhNode.innerHTML = zh;

  return { wrap, zh: zhNode, en: enNode };
}

// 段落小标题：中文 + 英文副标（章节卡与图表标题共用）
export function head(l, zh, en, opts = {}) {
  const { top = 150, size = 56, enSize = 24 } = opts;
  const wrap = el('div', {
    position: 'absolute',
    left: '0', right: '0', top: `${top}px`,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
  }, l);
  const a = el('div', {
    font: `700 ${size}px ${F}`,
    color: C.ink,
    letterSpacing: '0.02em',
  }, wrap);
  a.innerHTML = zh;
  const b = el('div', {
    font: `400 ${enSize}px ${FN}`,
    color: C.dim,
    letterSpacing: '0.20em',
    textTransform: 'uppercase',
  }, wrap);
  b.textContent = en;
  return { wrap, zh: a, en: b };
}

// 强调色 span
export const g = (s) => `<span style="color:${C.gold}">${s}</span>`;
export const r = (s) => `<span style="color:${C.red}">${s}</span>`;
export const d = (s) => `<span style="color:${C.dim}">${s}</span>`;
export const w = (s) => `<span style="color:${C.ink}">${s}</span>`;

// 双语字幕块 + 逐字动画
// 中文逐字出现，英文延后 0.12s 整体淡入（英文是排版资产，不需要逐字）
export function capType(l, zh, en, opts = {}) {
  const { bottom = 92, zhSize = FS.body, enSize = FS.sub, enLag = 0.12 } = opts;
  const wrap = el('div', {
    position: 'absolute',
    left: '0', right: '0', bottom: `${bottom}px`,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '10px',
    pointerEvents: 'none',
  }, l);

  const zhNode = el('div', {
    font: `700 ${zhSize}px ${F}`,
    color: C.ink,
    letterSpacing: '0.012em',
    lineHeight: '1.22',
    textAlign: 'center',
  }, wrap);
  zhNode.innerHTML = zh;

  const enNode = el('div', {
    font: `400 ${enSize}px ${FN}`,
    color: C.dim,
    letterSpacing: '0.10em',
    lineHeight: '1.2',
    textAlign: 'center',
    opacity: '0',
  }, wrap);
  enNode.textContent = en;

  // 逐字：用独立的字符 span 包裹，避免 typeOn 需要重排 HTML
  const spans = [];
  const frag = document.createDocumentFragment();
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const s = child.textContent;
        for (const ch of s) {
          const sp = document.createElement('span');
          sp.textContent = ch;
          sp.style.display = 'inline-block';
          sp.style.whiteSpace = ch === ' ' ? 'pre' : 'normal';
          sp.style.willChange = 'transform, opacity, filter';
          sp.style.opacity = '0';
          spans.push(sp);
          frag.appendChild(sp);
        }
      } else {
        // 颜色 span：整体当一个单位处理，保留内部样式
        const sp = document.createElement('span');
        sp.style.display = 'inline-block';
        sp.style.willChange = 'transform, opacity, filter';
        sp.style.opacity = '0';
        sp.style.color = child.style.color;
        sp.textContent = child.textContent;
        spans.push(sp);
        frag.appendChild(sp);
      }
    }
  };
  walk(zhNode);
  zhNode.innerHTML = '';
  zhNode.appendChild(frag);

  return {
    wrap,
    spans,
    // t0: 第一个字开始；dur: 整串走完
    type(t, t0, dur) {
      const n = spans.length;
      const step = dur / Math.max(1, n);
      spans.forEach((s, i) => {
        const p = clamp((t - (t0 + i * step)) / Math.max(0.001, step * 2.6));
        const e = eOut(p);
        s.style.opacity = String(clamp(p * 3.4));
        s.style.transform = `translateY(${((1 - e) * 24).toFixed(2)}px)`;
        s.style.filter = p < 1 ? `blur(${((1 - p) * 8).toFixed(2)}px)` : '';
      });
      const pe = clamp((t - (t0 + enLag)) / 0.34);
      enNode.style.opacity = String(eOut(pe));
      enNode.style.transform = `translateY(${((1 - eOut(pe)) * 10).toFixed(2)}px)`;
    },
  };
}

// 整层入场：轻微上浮 + 透明度（只用于非文字层，避免和逐字动画打架）
export function riseIn(node, p, dist = 26) {
  const e = eExpo(clamp(p));
  node.style.opacity = String(clamp(p * 2.2));
  node.style.transform = `translateY(${((1 - e) * dist).toFixed(2)}px)`;
}
