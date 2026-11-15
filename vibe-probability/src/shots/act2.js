// 第三幕 · 曲线（bar12 – bar19.75）
// 真实数学：P(n) = 1 − 0.98^n，p = 2%
// 63.6% 在 n=50 / 86.7% 在 n=100 / 90.0% 在 n=114 / 99.0% 在 n=229

import { C, F, FN, FM, FS, bar } from '../theme.js';
import { el, clamp, eOut, eOut4, eOut5, eInOut, eExpo, eBack, lerp, prog, svg, sEl, ST, rnd } from '../kit.js';
import { kick, kickR, capType, head, g, r, d } from '../ui.js';
import { heroNumber, heroLabel, circleMark, stamp } from '../widgets.js';
import { axes, curve, headDot, vMarker } from '../chart.js';
import { disperse, motes } from '../particles.js';
import { bloomCurve, endpointBurst, shockRing, glowSpot, speedLines, makeShaker } from '../fx.js';
import { SUB } from '../timing.js';

// p = 2% 的累计成功率
export const P = (n, p = 0.02) => (1 - Math.pow(1 - p, n)) * 100;

// 图表坐标 → 画面比例（给 fx 定位端点用）
const chart_xy = (x0, y0, w, h, xmax, ymax, n, v) =>
  [(x0 + (n / xmax) * w) / 1920, (y0 + h - (v / ymax) * h) / 1080];

// ─────────────────────────────────────────── c1：曲线开始爬
const c1 = {
  build(l) {
    const A = axes(l, {
      x0: 210, y0: 292, w: 1080, h: 440,
      xMax: 250, yMax: 100,
      xTicks: [0, 50, 100, 150, 200, 250],
      yTicks: [0, 25, 50, 75, 100],
      xLabel: (v) => `${v}`,
      yLabel: (v) => `${v}%`,
    });

    const ttl = el('div', {
      position: 'absolute', left: '210px', top: '204px',
      font: `600 34px ${F}`, color: C.ink, letterSpacing: '0.02em',
      opacity: '0',
    }, l);
    ttl.innerHTML = `至少成功一次的累计概率　<span style="color:${C.dim};font:400 22px ${FN};letter-spacing:0.12em">CUMULATIVE CHANCE</span>`;

    const xAxis = el('div', {
      position: 'absolute', left: '0', right: '0', top: '800px',
      textAlign: 'center',
      font: `400 24px ${FN}`, color: C.dim, letterSpacing: '0.12em',
      opacity: '0',
    }, l);
    xAxis.textContent = '尝试次数';

    // 侧边读数：随曲线头部移动
    const readWrap = el('div', {
      position: 'absolute', right: '150px', top: '330px',
      textAlign: 'right', opacity: '0',
    }, l);
    const readVal = el('div', {
      font: `700 96px ${FN}`, color: C.gold, letterSpacing: '-0.02em',
      fontVariantNumeric: 'tabular-nums', lineHeight: '1',
    }, readWrap);
    readVal.textContent = '0%';
    const readLab = el('div', {
      font: `500 22px ${FM}`, color: C.dim, letterSpacing: '0.20em',
      marginTop: '12px',
    }, readWrap);
    readLab.textContent = 'TRIES';

    const cv = curve(A, (n) => P(n), { color: C.gold, width: 3.6 });
    const dot = headDot(A, (n) => P(n), { r: 7 });
    // ── 标记 #5：曲线加光效，到达端点加音效 ────────────────
    const bl = bloomCurve(A, (n) => P(n), { xMax: 250 });
    const boom = endpointBurst(l, {
      x: (210 + 1080) / 1920, y: (292 + 440 - (P(250) / 100) * 440) / 1080,
      color: C.gold, size: 320, sparks: 18, seed: 41,
    });

    const cap = capType(l, SUB('c1').zh, SUB('c1').en, { bottom: 92 });

    return (t) => {
      // 坐标轴：0 – 0.30
      const ap = clamp(t / 0.16);
      A.ax.style.opacity = String(eOut(ap));
      A.ay.style.opacity = String(eOut(ap));
      A.grid.forEach((gd, k) => { gd.style.opacity = String(eOut(clamp((ap - k * 0.05) / 0.7)) * 0.9); });
      A.labels.forEach((lb, k) => { lb.style.opacity = String(eOut(clamp((ap - 0.3) / 0.7)) * 0.85); });
      ttl.style.opacity = String(eOut(clamp(t / 0.14)) * 0.95);
      xAxis.style.opacity = String(eOut(clamp((t - 0.10) / 0.20)) * 0.9);

      // 曲线：0.14 – 1.14 生长到 n=250
      const cp = clamp((t - 0.14) / 1.00);
      const ce = cv.set(t, 0.14, 1.00);
      const nNow = ce * 250;
      dot(nNow, cp > 0 ? 1 : 0);
      bl.setGrowth(ce);
      bl.setLight(clamp((t - 0.14) / 1.30), 1);
      // 端点：曲线长满后爆一次
      boom(clamp((t - 1.10) / 0.52), 0.95);

      // 侧边读数：直接从曲线进度推，保证数字和曲线头部永远一致
      // 只取离散档位，避免出现字幕里没有的中间值
      readWrap.style.opacity = String(eOut(clamp((t - 0.14) / 0.20)));
      const vals = [0, 10, 50, 100, 150, 200, 250];
      let nv = 0;
      for (const v of vals) if (nNow >= v - 0.5) nv = v;
      readVal.textContent = nv === 0 ? '0%' : `${P(nv).toFixed(1)}%`;
      readLab.textContent = nv === 0 ? '起点' : `第 ${nv} 次`;

      cap.type(t, 0.30, 0.66);
    };
  },
};

// ─────────────────────────────────────────── c2：114 次 = 90%
const c2 = {
  build(l) {
    const A = axes(l, {
      x0: 210, y0: 300, w: 1080, h: 470,
      xMax: 250, yMax: 100,
      // 去掉 114 刻度：它和 100 只差 16px，两个标签会挤在一起
      xTicks: [0, 50, 100, 150, 200, 250],
      yTicks: [0, 25, 50, 75, 90, 100],
      xLabel: (v) => `${v}`,
      yLabel: (v) => `${v}%`,
    });

    const cv = curve(A, (n) => P(n), { color: C.gold, width: 3.6 });
    const dot = headDot(A, (n) => P(n), { r: 7 });
    const vm = vMarker(A, { color: 'rgba(243,196,82,0.55)' });

    // 90% 横参考线
    const s90 = sEl('line', {
      x1: A.X(0), y1: A.Y(90), x2: A.X(250), y2: A.Y(90),
      stroke: 'rgba(243,196,82,0.28)', 'stroke-width': 1.2, 'stroke-dasharray': '3 8',
      opacity: '0',
    }, A.s);

    // 标注气泡：放在绘图区右侧，不压曲线与网格
    const tag = el('div', {
      position: 'absolute', right: '120px', top: '420px',
      display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end',
      opacity: '0',
    }, l);
    const tagVal = el('div', {
      font: `700 76px ${FN}`, color: C.gold, lineHeight: '1', letterSpacing: '-0.02em',
    }, tag);
    tagVal.textContent = '90.0%';
    const tagLab = el('div', {
      font: `500 24px ${FM}`, color: C.dim, letterSpacing: '0.16em',
    }, tag);
    tagLab.textContent = '第 114 次 / TRY 114';

    const cap = capType(l, SUB('c2').zh, SUB('c2').en, { bottom: 92 });

    return (t) => {
      const ap = clamp(t / 0.14);
      A.ax.style.opacity = String(eOut(ap));
      A.ay.style.opacity = String(eOut(ap));
      A.grid.forEach((gd) => { gd.style.opacity = String(eOut(ap) * 0.9); });
      A.labels.forEach((lb) => { lb.style.opacity = String(eOut(ap) * 0.85); });

      // 曲线已长好（承接上一镜的终态）
      const cp = clamp(t / 0.20);
      cv.set(t, -1, 0.2);
      dot(250, 1);

      // 90% 参考线
      s90.style.opacity = String(eOut(clamp((t - 0.14) / 0.24)) * 0.9);

      // 竖线：0.30 – 0.56 生长到 90%
      const vp = clamp((t - 0.28) / 0.30);
      vm.set(114, lerp(0, 90, eOut4(vp)), vp > 0 ? 1 : 0);

      // 端点标记
      const mp = clamp((t - 0.52) / 0.26);
      const me = eOut4(mp);
      tag.style.opacity = String(clamp(mp * 3));
      tag.style.transform = `translate(${((1 - me) * 16).toFixed(1)}px, ${((1 - me) * 10).toFixed(1)}px)`;

      cap.type(t, 0.34, 0.60);
    };
  },
};

// ─────────────────────────────────────────── c3：229 次 = 99%
const c3 = {
  build(l) {
    const A = axes(l, {
      x0: 210, y0: 300, w: 1080, h: 470,
      xMax: 250, yMax: 100,
      xTicks: [0, 50, 100, 150, 200, 229, 250],
      yTicks: [0, 25, 50, 75, 100],
      xLabel: (v) => `${v}`,
      yLabel: (v) => `${v}%`,
    });

    const cv = curve(A, (n) => P(n), { color: C.gold, width: 3.6 });
    // 曲线头光点放在 229 这个真实数据点上，和竖线对齐；
    // 之前放在 250 会让虚线指着 229、光点却在 250，读起来是指错了点
    const dot = headDot(A, (n) => P(n), { r: 7 });
    const vm = vMarker(A, { color: 'rgba(243,196,82,0.55)' });

    // 99% 参考线
    const s99 = sEl('line', {
      x1: A.X(0), y1: A.Y(99), x2: A.X(250), y2: A.Y(99),
      stroke: 'rgba(221,47,45,0.40)', 'stroke-width': 1.2, 'stroke-dasharray': '3 8',
      opacity: '0',
    }, A.s);

    const tag = el('div', {
      position: 'absolute', right: '110px', top: '330px',
      display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end',
      opacity: '0',
    }, l);
    const tagVal = el('div', {
      font: `700 76px ${FN}`, color: C.gold, lineHeight: '1', letterSpacing: '-0.02em',
    }, tag);
    tagVal.textContent = '99.0%';
    const tagLab = el('div', {
      font: `500 24px ${FM}`, color: C.dim, letterSpacing: '0.16em',
    }, tag);
    tagLab.textContent = '第 229 次 / TRY 229';

    const cap = capType(l, SUB('c3').zh, SUB('c3').en, { bottom: 92 });

    return (t) => {
      const ap = clamp(t / 0.14);
      A.ax.style.opacity = String(eOut(ap));
      A.ay.style.opacity = String(eOut(ap));
      A.grid.forEach((gd) => { gd.style.opacity = String(eOut(ap) * 0.9); });
      A.labels.forEach((lb) => { lb.style.opacity = String(eOut(ap) * 0.85); });

      cv.set(t, -1, 0.2);
      dot(229, 1);

      s99.style.opacity = String(eOut(clamp((t - 0.14) / 0.24)) * 0.9);

      const vp = clamp((t - 0.26) / 0.32);
      vm.set(229, lerp(0, 99, eOut4(vp)), vp > 0 ? 1 : 0);

      const mp = clamp((t - 0.52) / 0.26);
      const me = eOut4(mp);
      tag.style.opacity = String(clamp(mp * 3));
      tag.style.transform = `translate(${((1 - me) * 18).toFixed(1)}px, 0)`;

      cap.type(t, 0.32, 0.60);
    };
  },
};

// ─────────────────────────────────────────── c4：永远碰不到 100%
const c4 = {
  build(l) {
    const A = axes(l, {
      x0: 210, y0: 300, w: 1080, h: 470,
      xMax: 250, yMax: 100,
      xTicks: [0, 50, 100, 150, 200, 250],
      yTicks: [0, 25, 50, 75, 100],
      xLabel: (v) => `${v}`,
      yLabel: (v) => `${v}%`,
    });

    const cv = curve(A, (n) => P(n), { color: C.gold, width: 3.6 });
    const dot = headDot(A, (n) => P(n), { r: 7 });

    // 100% 线：单独上提，与曲线头保留稳定间隙
    const top = sEl('line', {
      x1: A.X(0), y1: A.Y(100) - 26, x2: A.X(250), y2: A.Y(100) - 26,
      stroke: 'rgba(221,47,45,0.55)', 'stroke-width': 1.6, 'stroke-dasharray': '5 7',
      opacity: '0',
    }, A.s);
    const topTxt = sEl('text', {
      x: A.X(250) + 14, y: A.Y(100) - 20,
      fill: 'rgba(221,47,45,0.85)', 'font-family': FN, 'font-size': '24',
      opacity: '0',
    }, A.s);
    topTxt.textContent = '100%';

    // 间隙标注：两条短竖线 + "永远差一点"
    const gapLine = el('div', {
      position: 'absolute', left: '1290px', top: '300px',
      width: '1px', height: '0px',
      background: 'rgba(242,235,220,0.22)',
      opacity: '0',
    }, l);

    const note = el('div', {
      position: 'absolute', right: '150px', top: '420px',
      textAlign: 'right', opacity: '0',
    }, l);
    const noteVal = el('div', {
      font: `700 88px ${FN}`, color: C.ink, lineHeight: '1', letterSpacing: '-0.02em',
    }, note);
    noteVal.innerHTML = `<span style="color:${C.red}">∞</span> → 100%`;
    const noteLab = el('div', {
      font: `400 24px ${F}`, color: C.dim, marginTop: '14px', letterSpacing: '0.06em',
    }, note);
    noteLab.textContent = '但永远到不了';

    const cap = capType(l, SUB('c4').zh, SUB('c4').en, { bottom: 92 });

    return (t) => {
      const ap = clamp(t / 0.14);
      A.ax.style.opacity = String(eOut(ap));
      A.ay.style.opacity = String(eOut(ap));
      A.grid.forEach((gd) => { gd.style.opacity = String(eOut(ap) * 0.9); });
      A.labels.forEach((lb) => { lb.style.opacity = String(eOut(ap) * 0.85); });

      cv.set(t, -1, 0.2);
      dot(250, 1);

      const tp = clamp((t - 0.16) / 0.34);
      top.style.opacity = String(eOut(tp) * 0.95);
      // 用 dashoffset 做"从左往右划开"，不要用 dasharray 长度（会变成断线）
      top.style.strokeDasharray = '1500';
      top.style.strokeDashoffset = String((1 - eOut4(tp)) * 1500);
      topTxt.style.opacity = String(eOut(clamp((tp - 0.5) / 0.5)));

      const np = clamp((t - 0.40) / 0.30);
      const ne = eOut4(np);
      note.style.opacity = String(clamp(np * 3));
      note.style.transform = `translateX(${((1 - ne) * 18).toFixed(1)}px)`;

      cap.type(t, 0.32, 0.52);
    };
  },
};

// ─────────────────────────────────────────── c5：n=50 竖线 → 63.6%
const c5 = {
  build(l) {
    const A = axes(l, {
      x0: 210, y0: 300, w: 1080, h: 470,
      xMax: 250, yMax: 100,
      xTicks: [0, 25, 50, 75, 100, 150, 200, 250],
      yTicks: [0, 25, 50, 63.6, 75, 100],
      xLabel: (v) => `${v}`,
      yLabel: (v) => (v === 63.6 ? '63.6%' : `${v}%`),
    });

    const cv = curve(A, (n) => P(n), { color: C.gold, width: 3.6 });
    const dot = headDot(A, (n) => P(n), { r: 7 });
    const vm = vMarker(A, { color: C.gold });

    // 交点强调：金色实心点
    const hit = sEl('g', { opacity: '0' }, A.s);
    const hitHalo = sEl('circle', { cx: A.X(50), cy: A.Y(P(50)), r: 26, fill: C.gold, opacity: '0.16' }, hit);
    const hitDot = sEl('circle', { cx: A.X(50), cy: A.Y(P(50)), r: 8.5, fill: C.gold }, hit);

    // 横向虚线到右侧读数
    const hz = sEl('line', {
      x1: A.X(50), y1: A.Y(P(50)), x2: A.X(250), y2: A.Y(P(50)),
      stroke: 'rgba(243,196,82,0.35)', 'stroke-width': 1.2, 'stroke-dasharray': '3 7',
      opacity: '0',
    }, A.s);

    const tag = el('div', {
      position: 'absolute', right: '150px', top: '470px',
      textAlign: 'right', opacity: '0',
    }, l);
    const tagVal = el('div', {
      font: `700 92px ${FN}`, color: C.gold, lineHeight: '1', letterSpacing: '-0.02em',
    }, tag);
    tagVal.textContent = '63.6%';
    const tagLab = el('div', {
      font: `500 24px ${FM}`, color: C.dim, letterSpacing: '0.16em', marginTop: '12px',
    }, tag);
    tagLab.textContent = '第 50 次 / TRY 50';

    const cap = capType(l, SUB('c5').zh, SUB('c5').en, { bottom: 92 });

    return (t) => {
      const ap = clamp(t / 0.14);
      A.ax.style.opacity = String(eOut(ap));
      A.ay.style.opacity = String(eOut(ap));
      A.grid.forEach((gd) => { gd.style.opacity = String(eOut(ap) * 0.9); });
      A.labels.forEach((lb) => { lb.style.opacity = String(eOut(ap) * 0.85); });

      cv.set(t, -1, 0.2);
      dot(250, 1);

      // 竖线从底部生长到曲线
      const vp = clamp((t - 0.04) / 0.30);
      vm.set(50, lerp(0, P(50), eOut4(vp)), vp > 0 ? 1 : 0);

      // 交点
      const hp = clamp((t - 0.36) / 0.22);
      hit.setAttribute('opacity', String(eOut(hp)));
      const pulse = 1 + Math.sin(t * 3.4) * 0.10;
      hitHalo.setAttribute('r', String(26 * pulse * eOut4(hp)));

      const zp = clamp((t - 0.40) / 0.26);
      hz.style.opacity = String(eOut(zp) * 0.9);

      const tp = clamp((t - 0.46) / 0.26);
      const te = eOut4(tp);
      tag.style.opacity = String(clamp(tp * 3));
      tag.style.transform = `translateX(${((1 - te) * 18).toFixed(1)}px)`;

      cap.type(t, 0.24, 0.50);
    };
  },
};

// ─────────────────────────────────────────── c6：换成 1%，第 100 次
const c6 = {
  build(l) {
    const A = axes(l, {
      x0: 210, y0: 300, w: 1080, h: 470,
      xMax: 400, yMax: 100,
      xTicks: [0, 100, 200, 300, 400],
      yTicks: [0, 25, 50, 63.4, 75, 100],
      xLabel: (v) => `${v}`,
      yLabel: (v) => (v === 63.4 ? '63.4%' : `${v}%`),
    });

    const cv = curve(A, (n) => P(n, 0.01), { color: C.gold, width: 3.6, xMax: 400 });
    const dot = headDot(A, (n) => P(n, 0.01), { r: 7 });
    const vm = vMarker(A, { color: C.gold });
    // ── 标记 #6：曲线光效 + 端点音效 ──────────────────────
    const bl = bloomCurve(A, (n) => P(n, 0.01), { xMax: 400 });
    const ex = chart_xy(210, 300, 1080, 470, 400, 100, 400, P(400, 0.01));
    const boom = endpointBurst(l, { x: ex[0], y: ex[1], color: C.gold, size: 300, sparks: 16, seed: 43 });

    // 左下角：p = 1% 标签
    const pl = el('div', {
      position: 'absolute', left: '210px', top: '212px',
      font: `600 34px ${F}`, color: C.ink, letterSpacing: '0.02em', opacity: '0',
    }, l);
    pl.innerHTML = `单次成功率 <span style="color:${C.gold}">1%</span>　<span style="color:${C.dim};font:400 22px ${FN};letter-spacing:0.12em">p = 0.01</span>`;

    const hit = sEl('g', { opacity: '0' }, A.s);
    sEl('circle', { cx: A.X(100), cy: A.Y(P(100, 0.01)), r: 24, fill: C.gold, opacity: '0.16' }, hit);
    sEl('circle', { cx: A.X(100), cy: A.Y(P(100, 0.01)), r: 8, fill: C.gold }, hit);

    const tag = el('div', {
      position: 'absolute', right: '150px', top: '470px',
      textAlign: 'right', opacity: '0',
    }, l);
    const tagVal = el('div', {
      font: `700 92px ${FN}`, color: C.gold, lineHeight: '1', letterSpacing: '-0.02em',
    }, tag);
    tagVal.textContent = '63.4%';
    const tagLab = el('div', {
      font: `500 24px ${FM}`, color: C.dim, letterSpacing: '0.16em', marginTop: '12px',
    }, tag);
    tagLab.textContent = '第 100 次 / TRY 100';

    const cap = capType(l, SUB('c6').zh, SUB('c6').en, { bottom: 92 });

    return (t) => {
      const ap = clamp(t / 0.14);
      A.ax.style.opacity = String(eOut(ap));
      A.ay.style.opacity = String(eOut(ap));
      A.grid.forEach((gd) => { gd.style.opacity = String(eOut(ap) * 0.9); });
      A.labels.forEach((lb) => { lb.style.opacity = String(eOut(ap) * 0.85); });
      pl.style.opacity = String(eOut(clamp((t - 0.06) / 0.24)) * 0.95);

      const ce = cv.set(t, 0.12, 0.52);
      const nNow = ce * 400;
      dot(nNow, 1);
      bl.setGrowth(ce);
      bl.setLight(clamp((t - 0.12) / 0.70), 1);
      boom(clamp((t - 0.58) / 0.46), 0.95);

      const vp = clamp((t - 0.34) / 0.26);
      vm.set(100, lerp(0, P(100, 0.01), eOut4(vp)), vp > 0 ? 1 : 0);

      const hp = clamp((t - 0.54) / 0.20);
      hit.setAttribute('opacity', String(eOut(hp)));

      const tp = clamp((t - 0.58) / 0.26);
      tag.style.opacity = String(clamp(tp * 3));
      tag.style.transform = `translateX(${((1 - eOut4(tp)) * 16).toFixed(1)}px)`;

      cap.type(t, 0.24, 0.50);
    };
  },
};

// ─────────────────────────────────────────── c7：换成 0.5%，第 200 次
const c7 = {
  build(l) {
    const A = axes(l, {
      x0: 210, y0: 300, w: 1080, h: 470,
      xMax: 800, yMax: 100,
      xTicks: [0, 200, 400, 600, 800],
      yTicks: [0, 25, 50, 63.3, 75, 100],
      xLabel: (v) => `${v}`,
      yLabel: (v) => (v === 63.3 ? '63.3%' : `${v}%`),
    });

    const cv = curve(A, (n) => P(n, 0.005), { color: C.gold, width: 3.6, xMax: 800 });
    const dot = headDot(A, (n) => P(n, 0.005), { r: 7 });
    const vm = vMarker(A, { color: C.gold });
    // ── 标记 #7：曲线光效 + 端点音效 ──────────────────────
    const bl = bloomCurve(A, (n) => P(n, 0.005), { xMax: 800 });
    const ex = chart_xy(210, 300, 1080, 470, 800, 100, 800, P(800, 0.005));
    const boom = endpointBurst(l, { x: ex[0], y: ex[1], color: C.gold, size: 300, sparks: 16, seed: 47 });

    const pl = el('div', {
      position: 'absolute', left: '210px', top: '212px',
      font: `600 34px ${F}`, color: C.ink, letterSpacing: '0.02em', opacity: '0',
    }, l);
    pl.innerHTML = `单次成功率 <span style="color:${C.gold}">0.5%</span>　<span style="color:${C.dim};font:400 22px ${FN};letter-spacing:0.12em">p = 0.005</span>`;

    const hit = sEl('g', { opacity: '0' }, A.s);
    sEl('circle', { cx: A.X(200), cy: A.Y(P(200, 0.005)), r: 24, fill: C.gold, opacity: '0.16' }, hit);
    sEl('circle', { cx: A.X(200), cy: A.Y(P(200, 0.005)), r: 8, fill: C.gold }, hit);

    const tag = el('div', {
      position: 'absolute', right: '150px', top: '470px',
      textAlign: 'right', opacity: '0',
    }, l);
    const tagVal = el('div', {
      font: `700 92px ${FN}`, color: C.gold, lineHeight: '1', letterSpacing: '-0.02em',
    }, tag);
    tagVal.textContent = '63.3%';
    const tagLab = el('div', {
      font: `500 24px ${FM}`, color: C.dim, letterSpacing: '0.16em', marginTop: '12px',
    }, tag);
    tagLab.textContent = '第 200 次 / TRY 200';

    const cap = capType(l, SUB('c7').zh, SUB('c7').en, { bottom: 92 });

    return (t) => {
      const ap = clamp(t / 0.14);
      A.ax.style.opacity = String(eOut(ap));
      A.ay.style.opacity = String(eOut(ap));
      A.grid.forEach((gd) => { gd.style.opacity = String(eOut(ap) * 0.9); });
      A.labels.forEach((lb) => { lb.style.opacity = String(eOut(ap) * 0.85); });
      pl.style.opacity = String(eOut(clamp((t - 0.06) / 0.24)) * 0.95);

      const ce = cv.set(t, 0.12, 0.52);
      const nNow = ce * 800;
      dot(nNow, 1);
      bl.setGrowth(ce);
      bl.setLight(clamp((t - 0.12) / 0.70), 1);
      boom(clamp((t - 0.58) / 0.46), 0.95);

      const vp = clamp((t - 0.34) / 0.26);
      vm.set(200, lerp(0, P(200, 0.005), eOut4(vp)), vp > 0 ? 1 : 0);

      const hp = clamp((t - 0.54) / 0.20);
      hit.setAttribute('opacity', String(eOut(hp)));

      const tp = clamp((t - 0.58) / 0.26);
      tag.style.opacity = String(clamp(tp * 3));
      tag.style.transform = `translateX(${((1 - eOut4(tp)) * 16).toFixed(1)}px)`;

      cap.type(t, 0.24, 0.50);
    };
  },
};

// ─────────────────────────────────────────── c8：三条曲线叠在一起，同一点
const c8 = {
  build(l) {
    // 正确的画法：横轴归一化为 n / n*（n* = 1/p 是"平均该成功的次数"）
    // 三条曲线在 x = 1 处全部落在 63.2% —— 这才是"和难度无关"的证明
    const A = axes(l, {
      x0: 210, y0: 300, w: 1060, h: 410,
      xMax: 3, yMax: 100,
      xTicks: [0, 0.5, 1, 1.5, 2, 2.5, 3],
      yTicks: [0, 25, 50, 63.2, 75, 100],
      xLabel: (v) => (v === 0 ? '0' : v === 1 ? '1×' : `${v}×`),
      yLabel: (v) => (v === 63.2 ? '63.2%' : `${v}%`),
    });

    // P(x) = 1 − (1 − p)^(x·n*)，n* = 1/p
    const Pn = (x, p) => (1 - Math.pow(1 - p, x / p)) * 100;

    const cv2 = curve(A, (n) => Pn(n, 0.02), { color: 'rgba(242,235,220,0.28)', width: 2.2, xMax: 3, steps: 90 });
    const cv1 = curve(A, (n) => Pn(n, 0.01), { color: 'rgba(242,235,220,0.46)', width: 2.2, xMax: 3, steps: 90 });
    const cv05 = curve(A, (n) => Pn(n, 0.005), { color: C.gold, width: 3.4, xMax: 3, steps: 90 });

    // ── 标记 #8：三条曲线各自加光效，到达端点各爆一次 ──────
    // 只有金色那条给完整辉光；另外两条给淡光，避免三条光互相打架
    const bl05 = bloomCurve(A, (n) => Pn(n, 0.005), { xMax: 3, steps: 90, color: C.gold });
    const bl1 = bloomCurve(A, (n) => Pn(n, 0.01), { xMax: 3, steps: 90, color: '#CFC6B4' });
    const bl2 = bloomCurve(A, (n) => Pn(n, 0.02), { xMax: 3, steps: 90, color: '#8A8578' });
    // 三条曲线的右端点（x = 3 处）
    const e2 = endpointBurst(l, { x: A.X(3) / 1920, y: A.Y(Pn(3, 0.02)) / 1080, color: '#8A8578', size: 200, sparks: 9, seed: 51 });
    const e1 = endpointBurst(l, { x: A.X(3) / 1920, y: A.Y(Pn(3, 0.01)) / 1080, color: '#CFC6B4', size: 220, sparks: 10, seed: 53 });
    const e05 = endpointBurst(l, { x: A.X(3) / 1920, y: A.Y(Pn(3, 0.005)) / 1080, color: C.gold, size: 320, sparks: 18, seed: 57 });

    // 三条的交点：x = 1, y = 63.2
    const y63 = A.Y(63.21);
    const hit = sEl('g', { opacity: '0' }, A.s);
    sEl('circle', { cx: A.X(1), cy: y63, r: 30, fill: C.gold, opacity: '0.15' }, hit);
    sEl('circle', { cx: A.X(1), cy: y63, r: 8.5, fill: C.gold }, hit);

    // 横轴说明：放在绘图区正下方居中，不与字幕抢位
    const xNote = el('div', {
      position: 'absolute', left: '0', right: '0', top: '800px',
      textAlign: 'center',
      font: `400 23px ${F}`, color: C.dim, letterSpacing: '0.05em',
      opacity: '0',
    }, l);
    xNote.innerHTML = `横轴 = 次数 ÷ 平均所需次数　<span style="color:${C.ink2}">n* = 1/p</span>`;

    // 图例：放在标题右侧，避开刻度。字号要够手机端读
    const legend = el('div', {
      position: 'absolute', right: '140px', top: '238px',
      display: 'flex', flexDirection: 'column', gap: '22px', alignItems: 'flex-start',
      opacity: '0',
    }, l);
    const lg = (col, txt, w = 34) => {
      const it = el('div', { display: 'flex', alignItems: 'center', gap: '16px' }, legend);
      el('div', { width: `${w}px`, height: '3px', background: col, flexShrink: '0' }, it);
      const t = el('div', {
        font: `500 27px ${FN}`, color: C.ink2, letterSpacing: '0.04em', whiteSpace: 'nowrap',
      }, it);
      t.textContent = txt;
    };
    lg('rgba(242,235,220,0.42)', 'p = 2%　n* = 50');
    lg('rgba(242,235,220,0.62)', 'p = 1%　n* = 100');
    lg(C.gold, 'p = 0.5%　n* = 200');

    const tag = el('div', {
      position: 'absolute', right: '150px', top: '500px',
      textAlign: 'right', opacity: '0',
    }, l);
    const tagVal = el('div', {
      font: `700 88px ${FN}`, color: C.gold, lineHeight: '1', letterSpacing: '-0.02em',
    }, tag);
    tagVal.textContent = '63.2%';
    const tagLab = el('div', {
      font: `500 23px ${FM}`, color: C.dim, letterSpacing: '0.14em', marginTop: '12px',
    }, tag);
    tagLab.textContent = '三条都停在这';

    const cap = capType(l, SUB('c8').zh, SUB('c8').en, { bottom: 92 });

    return (t) => {
      const ap = clamp(t / 0.12);
      A.ax.style.opacity = String(eOut(ap));
      A.ay.style.opacity = String(eOut(ap));
      A.grid.forEach((gd) => { gd.style.opacity = String(eOut(ap) * 0.9); });
      A.labels.forEach((lb) => { lb.style.opacity = String(eOut(ap) * 0.85); });

      const g2 = cv2.set(t, 0.06, 0.70);
      const g1 = cv1.set(t, 0.16, 0.70);
      const g05 = cv05.set(t, 0.26, 0.70);
      bl2.setGrowth(g2 * 0.55); bl2.setLight(clamp((t - 0.06) / 0.86), 0.45);
      bl1.setGrowth(g1 * 0.70); bl1.setLight(clamp((t - 0.16) / 0.86), 0.60);
      bl05.setGrowth(g05); bl05.setLight(clamp((t - 0.26) / 0.86), 1);
      // 三条到端点各爆一次（错峰 0.05s，听起来是"哒-哒-咚"）
      e2(clamp((t - 0.72) / 0.40), 0.60);
      e1(clamp((t - 0.77) / 0.42), 0.70);
      e05(clamp((t - 0.82) / 0.48), 1.0);

      const hp = clamp((t - 0.86) / 0.24);
      hit.setAttribute('opacity', String(eOut(hp)));

      legend.style.opacity = String(eOut(clamp((t - 0.24) / 0.40)) * 0.92);
      xNote.style.opacity = String(eOut(clamp((t - 0.40) / 0.36)) * 0.85);

      const tp = clamp((t - 0.92) / 0.24);
      tag.style.opacity = String(clamp(tp * 3));
      tag.style.transform = `translateX(${((1 - eOut4(tp)) * 16).toFixed(1)}px)`;

      cap.type(t, 0.30, 0.62);
    };
  },
};

// ─────────────────────────────────────────── c9：这个数和难度无关
const c9 = {
  build(l) {
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '22px',
      marginTop: '-70px',
    }, l);

    // 1 − 1/e 大字（"=" 是连接符，不是装饰）
    const big = el('div', {
      font: `700 168px ${FN}`, color: C.gold,
      letterSpacing: '-0.01em', lineHeight: '1.1',
      opacity: '0', display: 'flex', alignItems: 'baseline', gap: '30px',
      whiteSpace: 'nowrap',
    }, wrap);
    const frac = el('span', {
      font: `700 168px ${FN}`, color: C.gold,
    }, big);
    frac.innerHTML = '1 − <span style="font-size:0.84em">1</span>/<span style="font-style:italic">e</span>';

    // 数值
    const val = el('div', {
      font: `600 56px ${FN}`, color: C.ink, letterSpacing: '0.06em',
      opacity: '0',
    }, wrap);
    val.innerHTML = `≈ 0.6321　<span style="color:${C.faint}">→</span>　<span style="color:${C.gold}">63.2%</span>`;

    const cap = capType(l, SUB('c9').zh, SUB('c9').en, { bottom: 92 });

    // ── 标记 #9：强力进场动效 ─────────────────────────────
    // 1−1/e 是全片的"答案"，进场要最重：三环 + 速度线 + 震动 + 常驻辉光
    const rA = shockRing(l, { size: 880, x: 0.5, y: 0.44, color: 'rgba(243,196,82,0.9)', w: 2.8 });
    const rB = shockRing(l, { size: 620, x: 0.5, y: 0.44, color: 'rgba(255,248,228,0.75)', w: 1.8 });
    const rC = shockRing(l, { size: 1280, x: 0.5, y: 0.44, color: 'rgba(243,196,82,0.42)', w: 1.3 });
    const lines = speedLines(l, { n: 24, len: 240, r0: 250, r1: 660, alpha: 0.60, x: 0.5, y: 0.44, seed: 19 });
    const shake = makeShaker([0.06, 0.26], { amp: 20, dur: 0.36, freq: 21, rot: 0.26 });
    const spot = el('div', {
      position: 'absolute', inset: '0',
      background: 'radial-gradient(ellipse at 50% 44%, rgba(243,196,82,0.26) 0%, rgba(243,196,82,0.07) 36%, rgba(0,0,0,0) 68%)',
      opacity: '0', pointerEvents: 'none',
    }, l);

    return (t) => {
      const p1 = clamp((t - 0.06) / 0.34);
      const e1 = eOut5(p1);
      const sh = shake(t);
      big.style.opacity = String(clamp(p1 * 3));
      big.style.transform = `scale(${lerp(1.30, 1, e1).toFixed(3)})${sh ? ' ' + sh : ''}`;
      big.style.filter = p1 < 1 ? `blur(${((1 - p1) * 20).toFixed(1)}px)` : '';

      const p2 = clamp((t - 0.44) / 0.30);
      val.style.opacity = String(eOut(p2) * 0.95);
      val.style.transform = `translateY(${((1 - eOut4(p2)) * 14).toFixed(1)}px)`;

      rA(clamp((t - 0.04) / 0.74), 1.6);
      rB(clamp((t - 0.12) / 0.64), 2.1);
      rC(clamp((t - 0.20) / 0.90), 1.3);
      lines(clamp((t - 0.04) / 0.64));
      const sp = clamp((t - 0.04) / 0.26);
      const sf = clamp((t - 0.50) / 0.60);
      spot.style.opacity = String(eOut(sp) * lerp(0.95, 0.40, eOut(sf)));

      cap.type(t, 0.30, 0.54);
    };
  },
};

export const ACT2 = { c1, c2, c3, c4, c5, c6, c7, c8, c9 };
