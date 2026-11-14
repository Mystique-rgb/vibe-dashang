import { C, F, FM } from '../theme.js';
import { el, mask, maskHTML, prog, eOut, eInOut, eExpo, clamp, lerp, fmt } from '../kit.js';
import { center, kick, foot, g, r, d } from '../ui.js';
import { typeOn, rgbSplit, slideIn, wobble, charOut } from '../text.js';
import { SVG, E, ST, grow } from '../svgkit.js';
import { createBucket } from '../bucket.js';

// ───────────────────────────── 图表几何
const CW = 1120, CH = 480;
const PL = 86, PR = 46, PT = 28, PB = 66;
const PX0 = PL, PX1 = CW - PR;
const PY0 = PT, PY1 = CH - PB;
const MAXD = 31;

const X = (day) => PX0 + (PX1 - PX0) * Math.pow(clamp(day / MAXD), 0.35);
const Y = (ret) => PY0 + (PY1 - PY0) * (1 - clamp(ret / 100));

function crPath(pts) {
  if (!pts.length) return '';
  let s = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i], p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    s += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return s;
}

// 坐标轴：逐笔画出，而不是瞬间出现
function axes(parent) {
  const s = SVG(CW, CH, parent);

  // 网格：先只画起点，靠 set() 向右扫开
  const rows = [];
  for (const v of [0, 25, 50, 75, 100]) {
    const n = E('line', {
      x1: PX0, y1: Y(v), x2: PX0, y2: Y(v),
      stroke: v === 0 ? 'rgba(150,170,200,0.34)' : 'rgba(150,170,200,0.1)',
      'stroke-width': 1, 'stroke-dasharray': v === 0 ? '' : '2 6',
      opacity: 0,
    }, s);
    rows.push(n);
  }
  // 纵轴：自下而上长出来
  const ax = E('line', {
    x1: PX0, y1: PY1, x2: PX0, y2: PY1,
    stroke: 'rgba(150,170,200,0.34)', 'stroke-width': 1, opacity: 0,
  }, s);

  const ylabs = [[100, '100%'], [50, '50%'], [0, '0']].map(([v, t]) => {
    const n = E('text', {
      x: PX0 - 18, y: Y(v) + 5, 'text-anchor': 'end',
      fill: '#5A6478', 'font-size': '17', 'font-family': 'JetBrains Mono, monospace',
      'letter-spacing': '1', opacity: 0,
    }, s);
    n.textContent = t;
    return n;
  });

  const xlabs = [[0, '0'], [1, '1天'], [3, '3天'], [7, '7天'], [16, '16天'], [31, '31天']]
    .map(([v, t]) => {
      const n = E('text', {
        x: X(v), y: PY1 + 34, 'text-anchor': 'middle',
        fill: '#5A6478', 'font-size': '17', 'font-family': 'JetBrains Mono, monospace',
        'letter-spacing': '1', opacity: 0,
      }, s);
      n.textContent = t;
      return n;
    });

  return {
    svg: s,
    // p: 0→1 整套坐标系的绘制进度
    set(p) {
      const pa = eOut(clamp(p / 0.42));
      ax.setAttribute('opacity', String(pa));
      ax.setAttribute('y1', String(lerp(PY1, PY0, pa)));

      rows.forEach((n, i) => {
        const pi = eOut(clamp((p - 0.04 - i * 0.045) / 0.5));
        n.setAttribute('opacity', String(pi));
        n.setAttribute('x2', String(lerp(PX0, PX1, pi)));
      });

      ylabs.forEach((n, i) => {
        n.setAttribute('opacity', String(eOut(clamp((p - 0.12 - i * 0.05) / 0.45)) * 0.95));
      });
      xlabs.forEach((n, i) => {
        n.setAttribute('opacity', String(eOut(clamp((p - 0.30 - i * 0.06) / 0.45)) * 0.95));
      });
    },
  };
}

// ───────────────────────────── 漏桶
export const S_LEAK = {
  id: 'leak',
  start: 26.5645,
  end: 30.6513,
  glow: [0.36, 0.52, 0.56, 0.54],
  exit: 'wipeL',
  build(l) {
    kick(l, '机制 01 · 漏桶');

    const bbox = el('div', {
      position: 'absolute', left: '250px', top: '50%',
      transform: 'translateY(-50%)',
      width: '520px', height: '600px',
      marginTop: '10px',
    }, l);
    this._bucket = createBucket(bbox);

    // 右上角注水标注
    const pourLbl = el('div', {
      position: 'absolute', left: '250px', top: '92px', width: '520px',
      textAlign: 'center', font: `400 19px ${FM}`, color: C.blue,
      letterSpacing: '0.22em', opacity: '0',
    }, l);
    pourLbl.textContent = 'IN · 100%';

    const leakLbl = el('div', {
      position: 'absolute', left: '250px', top: '742px', width: '520px',
      textAlign: 'center', font: `400 19px ${FM}`, color: C.red,
      letterSpacing: '0.22em', opacity: '0',
    }, l);
    leakLbl.textContent = 'OUT · 每天漏一点';

    const rb = el('div', {
      position: 'absolute', left: '900px', top: '50%',
      transform: 'translateY(-50%)',
    }, l);

    const a1 = typeOn('刚学完，装满了', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.05em',
    }, rb, { y: 18, blur: 7 });
    const a2 = typeOn('第二天再看 ——', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.05em',
      marginTop: '12px',
    }, rb, { y: 18, blur: 7 });

    const numWrap = el('div', {
      display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '26px',
    }, rb);
    const num = el('div', {
      font: `700 168px ${F}`, color: C.gold, lineHeight: '0.94',
      letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', opacity: '0',
    }, numWrap);
    num.textContent = '100';
    const pct = el('div', {
      font: `700 62px ${F}`, color: C.gold, lineHeight: '1',
      marginBottom: '22px', opacity: '0',
    }, numWrap);
    pct.textContent = '%';

    const sub = el('div', {
      marginTop: '16px', font: `400 26px ${F}`, color: C.sub,
      letterSpacing: '0.06em', opacity: '0',
    }, rb);
    sub.innerHTML = `而${r('复习')}，是唯一能堵住桶底的动作`;

    this._r = { a1, a2, num, pct, sub, pourLbl, leakLbl };
  },
  update(t) {
    const { a1, a2, num, pct, sub, pourLbl, leakLbl } = this._r;

    const pour = eOut(prog(t, 0.05, 0.55));
    const leak = eOut(prog(t, 1.05, 0.7));

    // 水位：先灌到 0.94，再被漏掉
    const fill = eExpo(prog(t, 0.08, 1.15));
    const drain = eInOut(prog(t, 1.5, 2.0));
    const level = clamp(fill * 0.94 - drain * 0.63);

    this._bucket.draw(t, level, pour * (1 - drain * 0.35), leak);

    pourLbl.style.opacity = String(pour * 0.9);
    leakLbl.style.opacity = String(leak * 0.85);

    a1.set(t, 0.05, 0.58);
    a2.set(t, 0.9, 0.58);

    const pn = prog(t, 1.12, 0.42);
    num.style.opacity = String(eOut(pn));
    pct.style.opacity = String(eOut(prog(t, 1.24, 0.36)));
    const val = lerp(100, 34, eInOut(prog(t, 1.6, 1.9)));
    num.textContent = String(Math.round(val));
    num.style.transform = `translateY(${(1 - eExpo(pn)) * 18}px)`;

    sub.style.opacity = String(eOut(prog(t, 2.9, 0.5)));
  },
};

// ───────────────────────────── 遗忘曲线
export const S_CURVE = {
  id: 'curve',
  start: 30.6513,
  end: 34.7382,
  glow: [0.46, 0.46, 0.58, 0.5],
  exit: 'wipeU',
  build(l) {
    kick(l, '机制 02 · 遗忘曲线');

    const cbox = el('div', {
      position: 'absolute', left: '50%', top: '236px',
      transform: 'translateX(-50%)', width: `${CW}px`, height: `${CH}px`,
    }, l);

    const ax = axes(cbox);
    const s = ax.svg;

    const anchors = [[0, 100], [0.02, 58], [0.05, 44], [1, 33], [2, 28], [6, 25], [31, 21]];
    const pts = anchors.map(([dd, rr]) => [X(dd), Y(rr)]);

    const path = E('path', {
      d: crPath(pts), ...ST(C.ink, 2.2),
    }, s);
    const setDraw = grow(path);

    // 端点
    const dot = E('circle', { cx: X(31), cy: Y(21), r: 5, fill: C.red, opacity: 0 }, s);

    // 关键点标注
    const marks = [[1, 33, '1天 33%'], [7, 25, '7天 25%'], [31, 21, '31天 21%']];
    const markEls = marks.map(([dd, rr, tx]) => {
      const cx = X(dd), cy = Y(rr);
      const c = E('circle', { cx, cy, r: 4.5, fill: '#05070C', stroke: C.red, 'stroke-width': 1.8, opacity: 0 }, s);
      const t = E('text', {
        x: cx + 16, y: cy - 14, fill: '#B8565A', 'font-size': '19',
        'font-family': 'JetBrains Mono, monospace', 'letter-spacing': '0.5', opacity: 0,
      }, s);
      t.textContent = tx;
      return { c, t };
    });

    const below = el('div', {
      position: 'absolute', left: '0', right: '0', top: '784px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, l);

    const t1 = maskHTML('不复习的话，一个月后只剩' + r('两成'), {
      font: `400 48px ${F}`, color: C.dim, letterSpacing: '0.05em',
    }, below);

    this._r = { ax, setDraw, dot, markEls, t1 };
  },
  update(t) {
    const { ax, setDraw, dot, markEls, t1 } = this._r;
    ax.set(prog(t, 0, 1.15));
    setDraw(eInOut(prog(t, 0.08, 1.5)));
    dot.setAttribute('opacity', String(eOut(prog(t, 1.5, 0.3))));

    markEls.forEach((m, i) => {
      const p = prog(t, 0.85 + i * 0.26, 0.4);
      m.c.setAttribute('opacity', String(eOut(p)));
      m.t.setAttribute('opacity', String(eOut(p) * 0.95));
    });

    t1.set(prog(t, 1.75, 0.6), 104);
  },
};

// ───────────────────────────── 复习：把曲线抬起来
export const S_REVIEW = {
  id: 'review',
  start: 34.7382,
  end: 38.825,
  glow: [0.5, 0.5, 0.6, 0.56],
  exit: 'sweep',
  build(l) {
    kick(l, '机制 03 · 复习');

    const cbox = el('div', {
      position: 'absolute', left: '50%', top: '236px',
      transform: 'translateX(-50%)', width: `${CW}px`, height: `${CH}px`,
    }, l);

    const ax = axes(cbox);
    const s = ax.svg;

    // 参考：不复习
    const refPts = [[0, 100], [0.02, 58], [0.05, 44], [1, 33], [2, 28], [6, 25], [31, 21]]
      .map(([dd, rr]) => [X(dd), Y(rr)]);
    // 参考线保持虚线质感，靠透明度浮出来（grow 会覆盖 dasharray）
    const refPath = E('path', {
      d: crPath(refPts), ...ST('rgba(150,170,200,0.22)', 1.6),
      'stroke-dasharray': '5 7', opacity: 0,
    }, s);

    // 复习后的锯齿
    const segs = [
      { from: 0, to: 1, r0: 100, r1: 33, lift: 92 },
      { from: 1, to: 3, r0: 92, r1: 55, lift: 95 },
      { from: 3, to: 7, r0: 95, r1: 72, lift: 97 },
      { from: 7, to: 16, r0: 97, r1: 85, lift: 98 },
      { from: 16, to: 31, r0: 98, r1: 90, lift: null },
    ];

    let dpath = '';
    segs.forEach((sg) => {
      const pts = [];
      const N = 26;
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const dd = sg.from + (sg.to - sg.from) * u;
        const rr = sg.r1 + (sg.r0 - sg.r1) * Math.pow(1 - u, 2.1);
        pts.push([X(dd), Y(rr)]);
      }
      dpath += (dpath ? ' L' : 'M') + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
      if (sg.lift != null) dpath += ` L${X(sg.to).toFixed(1)},${Y(sg.lift).toFixed(1)}`;
    });

    const path = E('path', { d: dpath, ...ST(C.gold, 2.4) }, s);
    const setDraw = grow(path);

    // 复习点
    const dots = [[1, 92], [3, 95], [7, 97], [16, 98]].map(([dd, rr]) => {
      const cx = X(dd), cy = Y(rr);
      const g2 = E('g', { opacity: 0 }, s);
      E('circle', { cx, cy, r: 12, fill: 'rgba(232,180,74,0.16)' }, g2);
      E('circle', { cx, cy, r: 4.5, fill: C.gold }, g2);
      const t = E('text', {
        x: cx, y: cy - 26, 'text-anchor': 'middle', fill: C.gold,
        'font-size': '18', 'font-family': 'JetBrains Mono, monospace', 'letter-spacing': '1',
      }, g2);
      t.textContent = '复习';
      return g2;
    });

    const below = el('div', {
      position: 'absolute', left: '0', right: '0', top: '784px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, l);

    const t1 = maskHTML('每复习一次，' + g('把曲线抬高一截'), {
      font: `400 48px ${F}`, color: C.dim, letterSpacing: '0.05em',
    }, below);

    const t2 = el('div', {
      marginTop: '14px', font: `400 24px ${F}`, color: C.sub,
      letterSpacing: '0.1em', opacity: '0',
    }, below);
    t2.textContent = '间隔重复：不是学得更多，是忘得更慢';

    this._r = { ax, setDraw, dots, t1, t2, refPath };
  },
  update(t) {
    const { ax, setDraw, dots, t1, t2, refPath } = this._r;
    ax.set(prog(t, 0, 1.15));
    refPath.setAttribute('opacity', String(eOut(prog(t, 0.10, 0.7)) * 0.85));
    setDraw(eInOut(prog(t, 0.05, 1.85)));
    dots.forEach((n, i) => {
      n.setAttribute('opacity', String(eOut(prog(t, 0.5 + i * 0.4, 0.35))));
    });
    t1.set(prog(t, 1.9, 0.6), 104);
    t2.style.opacity = String(eOut(prog(t, 2.5, 0.5)));
  },
};

export const ACT2 = [S_LEAK, S_CURVE, S_REVIEW];
