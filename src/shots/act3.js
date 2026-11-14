import { C, F, FM } from '../theme.js';
import { el, mask, maskHTML, prog, eOut, eExpo, eInOut, clamp, lerp, fmt } from '../kit.js';
import { center, kick, foot, goldRule, g, r, d } from '../ui.js';
import { typeOn, rgbSplit, slideIn, wobble, charOut } from '../text.js';
import { SVG, E, ST, grow } from '../svgkit.js';

// ───────────────────────────── 获奖揭晓
export const S_AWARD = {
  id: 'award',
  start: 38.825,
  end: 42.9119,
  glow: [0.5, 0.46, 0.68, 0.6],
  exit: 'iris',
  build(l) {
    kick(l, '获奖 · WINNER');

    const wrap = center(l);
    const box = el('div', {
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginTop: '-16px',
    }, wrap);

    // 四角装饰
    const corners = [];
    const CZ = 34;
    const cfgs = [
      { top: '-46px', left: '-72px', bt: true, bl: true },
      { top: '-46px', right: '-72px', bt: true, br: true },
      { bottom: '-46px', left: '-72px', bb: true, bl: true },
      { bottom: '-46px', right: '-72px', bb: true, br: true },
    ];
    for (const cf of cfgs) {
      const c = el('div', {
        position: 'absolute',
        width: `${CZ}px`, height: `${CZ}px`,
        opacity: '0',
        ...(cf.top ? { top: cf.top } : {}),
        ...(cf.bottom ? { bottom: cf.bottom } : {}),
        ...(cf.left ? { left: cf.left } : {}),
        ...(cf.right ? { right: cf.right } : {}),
        borderTop: cf.bt ? `1px solid ${C.gold}` : 'none',
        borderBottom: cf.bb ? `1px solid ${C.gold}` : 'none',
        borderLeft: cf.bl ? `1px solid ${C.gold}` : 'none',
        borderRight: cf.br ? `1px solid ${C.gold}` : 'none',
      }, box);
      corners.push(c);
    }

    const pre = el('div', {
      font: `500 20px ${FM}`, color: C.gold, letterSpacing: '0.4em',
      paddingLeft: '0.4em', opacity: '0',
    }, box);
    pre.textContent = '2026 年度 · 最佳学习法';

    const l1 = typeOn('四位提名，全部落选', {
      font: `400 52px ${F}`, color: C.dim, letterSpacing: '0.06em',
      marginTop: '34px',
    }, box, { y: 18, blur: 7 });

    const l2 = typeOn('获奖的，是一个没人提名的动作', {
      font: `400 52px ${F}`, color: C.dim, letterSpacing: '0.06em',
      marginTop: '6px',
    }, box, { y: 18, blur: 7 });

    const l3 = typeOn('主动回忆', {
      font: `700 148px ${F}`, color: C.gold, letterSpacing: '0.09em',
      paddingLeft: '0.09em', marginTop: '20px',
    }, box, { y: 18, blur: 7 });

    const sub = el('div', {
      marginTop: '16px', font: `400 26px ${F}`, color: C.sub,
      letterSpacing: '0.1em', opacity: '0',
    }, box);
    sub.textContent = 'ACTIVE RECALL · 把答案从脑子里挖出来';

    this._r = { corners, pre, l1, l2, l3, sub, box };
  },
  update(t) {
    const { corners, pre, l1, l2, l3, sub, box } = this._r;

    pre.style.opacity = String(eOut(prog(t, 0.02, 0.4)));
    l1.set(t, 0.12, 0.55);
    l2.set(t, 0.7, 0.55);
    l3.set(t, 1.55, 0.78);
    sub.style.opacity = String(eOut(prog(t, 2.35, 0.5)));

    corners.forEach((c, i) => {
      const p = eExpo(prog(t, 1.9 + i * 0.07, 0.5));
      c.style.opacity = String(p * 0.95);
      c.style.transform = `translate(${(i % 2 === 0 ? -1 : 1) * (1 - p) * 22}px, ${(i < 2 ? -1 : 1) * (1 - p) * 22}px)`;
    });

    // 缓慢呼吸推近
    const pb = eInOut(prog(t, 2.2, 1.6));
    box.style.transform = `scale(${1 + pb * 0.028})`;
  },
};

// ───────────────────────────── 方法 01 主动回忆
const NODES = [
  { ang: -90, label: '问自己' },
  { ang: 30, label: '答出来' },
  { ang: 150, label: '对答案' },
];

export const S_M1 = {
  id: 'm1',
  start: 42.9119,
  end: 46.9987,
  glow: [0.36, 0.5, 0.56, 0.52],
  exit: 'dissolve',
  build(l) {
    kick(l, '方法 01 · 主动回忆');

    const DS = 420;
    const dbox = el('div', {
      position: 'absolute', left: '170px', top: '50%',
      transform: 'translateY(-50%)',
      width: `${DS}px`, height: `${DS}px`,
    }, l);

    const s = SVG(DS, DS, dbox);
    const cx = DS / 2, cy = DS / 2;
    const R = 138;

    // 环
    E('circle', { cx, cy, r: R, ...ST('rgba(150,170,200,0.16)', 1.2), 'stroke-dasharray': '3 7' }, s);

    // 三段弧 + 箭头（留出节点缺口）
    const arcs = [];
    for (let i = 0; i < 3; i++) {
      const a0 = NODES[i].ang + 15;
      const a1 = NODES[(i + 1) % 3].ang - 15 + (i === 2 ? 360 : 0);
      const p0 = [cx + Math.cos((a0 * Math.PI) / 180) * R, cy + Math.sin((a0 * Math.PI) / 180) * R];
      const p1 = [cx + Math.cos((a1 * Math.PI) / 180) * R, cy + Math.sin((a1 * Math.PI) / 180) * R];
      const path = E('path', {
        d: `M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${R},${R} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`,
        ...ST('rgba(232,180,74,0.6)', 1.7),
      }, s);
      arcs.push(path);
    }

    // 节点
    const nodes = NODES.map((nd) => {
      const rad = (nd.ang * Math.PI) / 180;
      const x = cx + Math.cos(rad) * R;
      const y = cy + Math.sin(rad) * R;
      const gg = E('g', { opacity: 0 }, s);
      E('circle', { cx: x, cy: y, r: 26, fill: '#080B12', stroke: C.gold, 'stroke-width': 1.5 }, gg);
      E('circle', { cx: x, cy: y, r: 5, fill: C.gold }, gg);
      // 标签沿半径外推，避开节点
      const lx = cx + Math.cos(rad) * (R + 66);
      const ly = cy + Math.sin(rad) * (R + 66) + 8;
      const tx = E('text', {
        x: lx, y: ly, 'text-anchor': 'middle',
        fill: '#D3DBE8', 'font-size': '23', 'font-family': 'Noto Sans SC, sans-serif',
        'letter-spacing': '2',
      }, s);
      tx.textContent = nd.label;
      return gg;
    });

    // 中心计数
    const cnum = E('text', {
      x: cx, y: cy + 4, 'text-anchor': 'middle', fill: C.gold,
      'font-size': '62', 'font-weight': '700',
      'font-family': 'Noto Sans SC, sans-serif', opacity: 0,
    }, s);
    cnum.textContent = '×1';
    const clab = E('text', {
      x: cx, y: cy + 34, 'text-anchor': 'middle', fill: '#5A6478',
      'font-size': '15', 'font-family': 'JetBrains Mono, monospace',
      'letter-spacing': '2', opacity: 0,
    }, s);
    clab.textContent = 'ROUND';

    const rb = el('div', {
      position: 'absolute', left: '700px', top: '50%',
      transform: 'translateY(-50%)',
    }, l);

    const a1 = typeOn('合上书，把答案', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.05em',
    }, rb, { y: 18, blur: 7 });
    const a2 = typeOn('从脑子里挖出来', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.05em',
      marginTop: '10px',
    }, rb, { y: 18, blur: 7 });

    const numWrap = el('div', {
      display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '28px',
    }, rb);
    const big = el('div', {
      font: `700 156px ${F}`, color: C.gold, lineHeight: '0.92',
      letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', opacity: '0',
    }, numWrap);
    big.textContent = '0';
    const pct = el('div', {
      font: `700 60px ${F}`, color: C.gold, lineHeight: '1',
      marginBottom: '20px', opacity: '0',
    }, numWrap);
    pct.textContent = '%';

    const sub = el('div', {
      marginTop: '14px', font: `400 26px ${F}`, color: '#5F6B80',
      letterSpacing: '0.06em', opacity: '0',
    }, rb);
    sub.innerHTML = `一周后还记得的 —— 是${r('划重点')}的六倍`;

    this._r = { arcs, nodes, cnum, clab, a1, a2, big, pct, sub };
  },
  update(t) {
    const { arcs, nodes, cnum, clab, a1, a2, big, pct, sub } = this._r;

    arcs.forEach((p, i) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len * (1 - clamp(prog(t, 0.12 + i * 0.28, 0.5))));
    });

    nodes.forEach((n, i) => {
      const p = eOut(prog(t, 0.1 + i * 0.28, 0.4));
      n.setAttribute('opacity', String(p));
      const sc = lerp(0.72, 1, eExpo(prog(t, 0.1 + i * 0.28, 0.45)));
      n.setAttribute('transform', `translate(${(1 - sc) * 0} 0)`);
    });

    const pn = prog(t, 1.15, 0.45);
    cnum.setAttribute('opacity', String(eOut(pn)));
    clab.setAttribute('opacity', String(eOut(prog(t, 1.28, 0.4))));

    a1.set(t, 0.04, 0.55);
    a2.set(t, 0.2, 0.55);

    big.style.opacity = String(eOut(prog(t, 1.4, 0.45)));
    pct.style.opacity = String(eOut(prog(t, 1.55, 0.35)));
    big.textContent = String(Math.round(eOut(prog(t, 1.4, 0.8)) * 60));
    sub.style.opacity = String(eOut(prog(t, 2.1, 0.5)));
  },
};

// ───────────────────────────── 方法 02 间隔重复
const GAPS = [1, 3, 7, 16, 31];
const RATE = [33, 55, 72, 85, 91];

export const S_M2 = {
  id: 'm2',
  start: 46.9987,
  end: 51.0856,
  glow: [0.5, 0.5, 0.6, 0.54],
  exit: 'prism',
  build(l) {
    kick(l, '方法 02 · 间隔重复');

    const TW = 1320, TH = 300;
    const tbox = el('div', {
      position: 'absolute', left: '50%', top: '318px',
      transform: 'translateX(-50%)', width: `${TW}px`, height: `${TH}px`,
    }, l);

    const s = SVG(TW, TH, tbox);
    const axisY = 236;
    const X0 = 60, X1 = TW - 60;
    const step = (X1 - X0) / (GAPS.length - 1);
    const topY = (i) => axisY - 190 * (RATE[i] / 100);

    // 主轴
    const axis = E('line', { x1: X0, y1: axisY, x2: X1, y2: axisY, stroke: 'rgba(150,170,200,0.3)', 'stroke-width': 1 }, s);
    const setAxis = grow(axis);

    // 连线：细，压在柱后
    const linkPts = GAPS.map((dd, i) => `${(X0 + step * i).toFixed(1)},${topY(i).toFixed(1)}`);
    const link = E('path', {
      d: `M${linkPts.join(' L')}`, fill: 'none',
      stroke: 'rgba(232,180,74,0.34)', 'stroke-width': 1.2, 'stroke-dasharray': '4 6',
    }, s);
    const setLink = grow(link);

    const cols = GAPS.map((dd, i) => {
      const x = X0 + step * i;
      const ty = topY(i);
      // 细柱
      const bar = E('line', {
        x1: x, y1: axisY, x2: x, y2: axisY,
        stroke: i === GAPS.length - 1 ? C.gold : 'rgba(232,180,74,0.5)',
        'stroke-width': i === GAPS.length - 1 ? 2.4 : 1.8,
        'stroke-linecap': 'round',
      }, s);
      // 顶端光点
      const dot = E('circle', {
        cx: x, cy: axisY, r: i === GAPS.length - 1 ? 6 : 4,
        fill: i === GAPS.length - 1 ? C.gold : '#05070C',
        stroke: C.gold, 'stroke-width': 1.6, opacity: 0,
      }, s);
      // 天数
      const dl = E('text', {
        x, y: axisY + 40, 'text-anchor': 'middle', fill: '#7C879C',
        'font-size': '21', 'font-family': 'JetBrains Mono, monospace', 'letter-spacing': '1',
      }, s);
      dl.textContent = `${dd}天`;
      // 比率
      const rl = E('text', {
        x, y: ty - 26, 'text-anchor': 'middle',
        fill: i === GAPS.length - 1 ? C.gold : '#C9A65E',
        'font-size': '22', 'font-family': 'JetBrains Mono, monospace', 'font-weight': '700',
      }, s);
      rl.textContent = `${RATE[i]}%`;
      return { bar, dot, dl, rl, x, ty };
    });

    const below = el('div', {
      position: 'absolute', left: '0', right: '0', top: '700px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, l);

    const t1 = typeOn('不是学得更久', {
      font: `400 50px ${F}`, color: C.dim, letterSpacing: '0.06em',
    }, below, { y: 18, blur: 7 });

    const t2 = maskHTML('是' + g('复习得更巧'), {
      font: `700 96px ${F}`, color: C.ink, letterSpacing: '0.04em',
      marginTop: '8px',
    }, below);

    const t3 = el('div', {
      marginTop: '26px', font: `400 24px ${F}`, color: C.sub,
      letterSpacing: '0.1em', opacity: '0',
    }, below);
    t3.textContent = '在快要忘记的时候，复习一次';

    this._r = { setAxis, setLink, cols, t1, t2, t3 };
  },
  update(t) {
    const { setAxis, setLink, cols, t1, t2, t3 } = this._r;

    setAxis(eInOut(prog(t, 0.05, 0.6)));
    setLink(eInOut(prog(t, 0.7, 1.1)));

    cols.forEach((c, i) => {
      const p = eExpo(prog(t, 0.3 + i * 0.22, 0.5));
      const y = lerp(236, c.ty, p);
      c.bar.setAttribute('y2', String(y));
      c.bar.setAttribute('opacity', String(clamp(p * 3)));
      c.dot.setAttribute('cy', String(y));
      c.dot.setAttribute('opacity', String(eOut(prog(t, 0.45 + i * 0.22, 0.3))));
      c.dl.setAttribute('opacity', String(eOut(prog(t, 0.34 + i * 0.22, 0.3))));
      c.rl.setAttribute('opacity', String(eOut(prog(t, 0.62 + i * 0.22, 0.35))));
    });

    t1.set(t, 1.5, 0.55);
    t2.set(prog(t, 1.68, 0.62), 112);
    t3.style.opacity = String(eOut(prog(t, 2.4, 0.5)));
  },
};

export const ACT3 = [S_AWARD, S_M1, S_M2];
