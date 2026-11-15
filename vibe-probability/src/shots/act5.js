// 第六幕 · 公式（bar27 – bar29）与落版（bar29 – 63.795）
// 公式逐项显现：P = 1 − (1 − p)^n → 代入 → 1 − 1/e
// 落版回到开场的点阵，首尾闭环

import { C, F, FN, FM, FS, bar } from '../theme.js';
import { el, clamp, eOut, eOut4, eOut5, eInOut, eExpo, eBack, lerp, prog, svg, sEl, ST, rnd } from '../kit.js';
import { kick, kickR, capType, head, foot, g, r, d } from '../ui.js';
import { heroNumber, heroLabel, stamp, strike } from '../widgets.js';
import { disperse, motes, ring } from '../particles.js';
import { makeShaker, shockRing, speedLines, endpointBurst } from '../fx.js';
import { flipGrid } from '../widgets.js';
import { SUB } from '../timing.js';

const GRID = { cols: 10, size: 30, gap: 18 };
const WINNERS = [23, 71];

// ─────────────────────────────────────────── f1：P = 1 − (1 − p)^n
const f1 = {
  build(l) {
    const H = head(l, '把这件事写成公式', 'WRITE IT AS A FORMULA', { top: 132, size: 50, enSize: 21 });

    // 主公式：逐项显现。字号按 1080p 宽度算过，11 个字符 × ~0.62em 要在 1700px 内
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginTop: '-24px',
      font: `700 108px ${FN}`,
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
    }, l);

    const parts = [
      { s: 'P', c: C.gold, sup: false },
      { s: '=', c: C.dim, sup: false },
      { s: '1', c: C.ink, sup: false },
      { s: '−', c: C.dim, sup: false },
      { s: '(', c: C.ink, sup: false },
      { s: '1', c: C.ink, sup: false },
      { s: '−', c: C.dim, sup: false },
      { s: 'p', c: C.ink, sup: false },
      { s: ')', c: C.ink, sup: false },
      { s: 'n', c: C.gold, sup: true },
    ];

    const nodes = parts.map((pt, i) => {
      const n = el('span', {
        color: pt.c, opacity: '0',
        display: 'inline-block',
        willChange: 'transform, opacity, filter',
        marginRight: pt.s === 'P' ? '22px' : pt.s === 'n' ? '0px' : '4px',
        fontSize: pt.sup ? '0.54em' : '1em',
        verticalAlign: pt.sup ? 'super' : 'baseline',
        lineHeight: '1.1',
      }, wrap);
      n.textContent = pt.s;
      return n;
    });

    // 释义
    const gloss = el('div', {
      position: 'absolute', left: '0', right: '0', top: '690px',
      display: 'flex', justifyContent: 'center', gap: '64px',
      opacity: '0',
    }, l);
    const gl = (sym, txt, col) => {
      const it = el('div', { display: 'flex', alignItems: 'baseline', gap: '12px' }, gloss);
      const a = el('div', { font: `700 30px ${FN}`, color: col }, it);
      a.textContent = sym;
      const b = el('div', { font: `400 26px ${F}`, color: C.dim, letterSpacing: '0.04em' }, it);
      b.textContent = txt;
    };
    gl('P', '至少成一次的概率', C.gold);
    gl('p', '单次成功率', C.ink2);
    gl('n', '尝试次数', C.ink2);

    const cap = capType(l, SUB('f1').zh, SUB('f1').en, { bottom: 84 });

    // ── 标记 #13：强力进场特效 ────────────────────────────
    // 公式是"把话收成一行"的时刻，进场用双环 + 速度线 + 聚光 + 震动
    const rA = shockRing(l, { size: 820, x: 0.5, y: 0.47, color: 'rgba(243,196,82,0.85)', w: 2.4 });
    const rB = shockRing(l, { size: 1180, x: 0.5, y: 0.47, color: 'rgba(242,235,220,0.45)', w: 1.3 });
    const lines = speedLines(l, { n: 22, len: 230, r0: 300, r1: 720, alpha: 0.52, x: 0.5, y: 0.47, seed: 23 });
    const shake = makeShaker([0.0, 0.18], { amp: 14, dur: 0.30, freq: 22, rot: 0.18 });
    const spot = el('div', {
      position: 'absolute', inset: '0',
      background: 'radial-gradient(ellipse at 50% 47%, rgba(243,196,82,0.20) 0%, rgba(243,196,82,0.05) 36%, rgba(0,0,0,0) 68%)',
      opacity: '0', pointerEvents: 'none',
    }, l);

    return (t) => {
      // 0.06 – 0.96：逐项显现
      nodes.forEach((n, i) => {
        const p = clamp((t - 0.06 - i * 0.13) / 0.20);
        const e = eOut4(p);
        n.style.opacity = String(clamp(p * 3));
        n.style.transform = `translateY(${((1 - e) * 24).toFixed(1)}px) scale(${lerp(0.82, 1, e).toFixed(3)})`;
        n.style.filter = p < 1 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : '';
      });

      const br = 1 + Math.sin(t * 1.6) * 0.004;
      const sh = shake(t);
      wrap.style.transform = `scale(${br.toFixed(4)})${sh ? ' ' + sh : ''}`;

      rA(clamp(t / 0.56), 1.6);
      rB(clamp((t - 0.08) / 0.60), 1.4);
      lines(clamp(t / 0.50));
      const sp = clamp(t / 0.24);
      const sf = clamp((t - 0.50) / 0.60);
      spot.style.opacity = String(eOut(sp) * lerp(0.90, 0.36, eOut(sf)));

      const gp = clamp((t - 0.96) / 0.30);
      gloss.style.opacity = String(eOut(gp) * 0.9);
      gloss.style.transform = `translateY(${((1 - eOut4(gp)) * 14).toFixed(1)}px)`;

      cap.type(t, 0.30, 0.62);
    };
  },
};

// ─────────────────────────────────────────── f2：代入 n = 1/p → 1 − 1/e
// 版式：绝对定位三行，不用 flex 堆叠
// （flex + 大字号上标会把总高撑爆，1−1/e 会被挤出画面）
const f2 = {
  build(l) {
    const H = head(l, '把 n 取成 1/p', 'SET N TO ONE OVER P', { top: 132, size: 50, enSize: 21 });

    // 第一行：代入式（y=290）
    const row1 = el('div', {
      position: 'absolute', left: '0', right: '0', top: '300px',
      textAlign: 'center',
      font: `600 72px ${FN}`, color: C.ink2,
      letterSpacing: '0.01em', opacity: '0', whiteSpace: 'nowrap',
    }, l);
    row1.innerHTML = `P = 1 − ( 1 − <span style="color:${C.gold}">1/n</span> )<sup style="font-size:0.52em;vertical-align:super">n</sup>`;

    // 箭头（y=430）
    const arrow = el('div', {
      position: 'absolute', left: '0', right: '0', top: '420px',
      textAlign: 'center',
      font: `300 48px ${FN}`, color: C.faint, opacity: '0',
    }, l);
    arrow.textContent = '↓';

    // 第二行：1 − 1/e（y=500 起，主体）
    const row2 = el('div', {
      position: 'absolute', left: '0', right: '0', top: '496px',
      textAlign: 'center',
      font: `700 150px ${FN}`, color: C.gold,
      letterSpacing: '-0.01em', opacity: '0', whiteSpace: 'nowrap',
      lineHeight: '1.05',
    }, l);
    row2.innerHTML = `1 − <span style="font-size:0.82em">1</span>/<span style="font-style:italic">e</span>`;

    // 第三行：数值（y=700）
    const row3 = el('div', {
      position: 'absolute', left: '0', right: '0', top: '700px',
      textAlign: 'center',
      font: `600 50px ${FN}`, color: C.ink, letterSpacing: '0.06em',
      opacity: '0',
    }, l);
    row3.innerHTML = `≈ 0.6321　<span style="color:${C.faint}">→</span>　<span style="color:${C.gold}">63.2%</span>`;

    // 说明：为什么和 p 无关
    const why = el('div', {
      position: 'absolute', left: '0', right: '0', top: '786px',
      textAlign: 'center',
      font: `400 27px ${F}`, color: C.dim, letterSpacing: '0.05em',
      opacity: '0',
    }, l);
    why.innerHTML = `p 越小，n 就要越大，但乘积 <span style="color:${C.ink2}">n·p = 1</span> 永远不变`;

    const burst = disperse(l, { n: 40, spread: 560, x: '50%', y: '58%', seed: 61 });
    const cap = capType(l, SUB('f2').zh, SUB('f2').en, { bottom: 84 });

    return (t) => {
      const p1 = clamp(t / 0.16);
      row1.style.opacity = String(clamp(p1 * 3));
      row1.style.transform = `translateY(${((1 - eOut4(p1)) * 16).toFixed(1)}px)`;

      const p2 = clamp((t - 0.24) / 0.20);
      arrow.style.opacity = String(eOut(p2) * 0.9);

      const p3 = clamp((t - 0.40) / 0.34);
      const e3 = eOut5(p3);
      row2.style.opacity = String(clamp(p3 * 3));
      row2.style.transform = `scale(${lerp(1.30, 1, e3).toFixed(3)})`;
      row2.style.filter = p3 < 1 ? `blur(${((1 - p3) * 20).toFixed(1)}px)` : '';

      const p4 = clamp((t - 0.72) / 0.26);
      row3.style.opacity = String(eOut(p4) * 0.95);
      row3.style.transform = `translateY(${((1 - eOut4(p4)) * 12).toFixed(1)}px)`;

      const p5 = clamp((t - 0.90) / 0.32);
      why.style.opacity = String(eOut(p5) * 0.9);

      burst(clamp((t - 0.40) / 0.44));
      cap.type(t, 0.30, 0.60);
    };
  },
};

// ─────────────────────────────────────────── g1：平均值不是承诺
const g1 = {
  build(l) {
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '26px', marginTop: '-30px',
    }, l);

    const line = el('div', {
      font: `700 128px ${F}`, color: C.ink, letterSpacing: '0.01em',
      opacity: '0', textAlign: 'center', lineHeight: '1.24',
    }, wrap);
    line.innerHTML = `平均值不是承诺，<br><span style="color:${C.gold}">是概率</span>`;

    const en = el('div', {
      font: `400 30px ${FN}`, color: C.dim,
      letterSpacing: '0.16em', textTransform: 'uppercase', opacity: '0',
    }, wrap);
    en.textContent = 'An average is a probability, not a promise.';

    const cap = capType(l, SUB('g1').zh, SUB('g1').en, { bottom: 92 });
    // 主标题已经就是这句话，再叠一条字幕会读成"同一句说两遍"
    cap.wrap.style.display = 'none';

    return (t) => {
      const p1 = clamp(t / 0.24);
      const e1 = eOut5(p1);
      line.style.opacity = String(clamp(p1 * 2.8));
      line.style.transform = `translateY(${((1 - e1) * 26).toFixed(1)}px)`;
      line.style.filter = p1 < 1 ? `blur(${((1 - p1) * 15).toFixed(1)}px)` : '';

      const p2 = clamp((t - 0.44) / 0.34);
      en.style.opacity = String(eOut(p2) * 0.85);
    };
  },
};

// ─────────────────────────────────────────── g2：落版（回到点阵，首尾闭环）
const g2 = {
  build(l) {
    // 点阵：100 个点，2 个金（与开场完全一致）
    const grid = flipGrid(l, {
      n: 100, cols: 10, size: 26, gap: 16,
      x: 0.5, y: 0.355,
      dotColor: 'rgba(242,235,220,0.20)',
    });

    // 两颗金色点的高亮（与开场同位置）
    const GS2 = 26;
    const GGAP = 16;
    const CELL2 = GS2 + GGAP;
    const glows = WINNERS.map((i) => {
      const c = i % 10;
      const rr = Math.floor(i / 10);
      return el('div', {
        position: 'absolute',
        left: `${c * CELL2}px`, top: `${rr * CELL2}px`,
        width: `${GS2}px`, height: `${GS2}px`,
        borderRadius: '50%',
        background: C.gold,
        boxShadow: '0 0 30px 10px rgba(243,196,82,0.45), 0 0 80px 30px rgba(243,196,82,0.18)',
        opacity: '0',
      }, grid.wrap);
    });

    const wrap = el('div', {
      position: 'absolute', left: '0', right: '0', bottom: '196px',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: '24px',
    }, l);

    const main = el('div', {
      font: `700 140px ${F}`, color: C.ink, letterSpacing: '0.04em',
      opacity: '0', textAlign: 'center',
    }, wrap);
    main.innerHTML = `别停，<span style="color:${C.gold}">再试一次</span>`;

    const en = el('div', {
      font: `400 30px ${FN}`, color: C.dim,
      letterSpacing: '0.22em', textTransform: 'uppercase', opacity: '0',
    }, wrap);
    en.textContent = 'Don’t stop. Try once more.';

    // 落版字幕就是主标题，所以不再叠字幕块
    const cap = capType(l, SUB('g2').zh, SUB('g2').en, { bottom: 92 });
    cap.wrap.style.display = 'none';

    // 底部签名：给结尾一个"出品方"的收束
    const sign = el('div', {
      position: 'absolute', left: '0', right: '0', bottom: '120px',
      textAlign: 'center',
      font: `500 22px ${FM}`, color: C.faint, letterSpacing: '0.34em',
      opacity: '0',
    }, l);
    sign.textContent = 'VIBE 知识大赏';

    const r1 = ring(l, { size: 720, x: 0.5, y: 0.40, color: 'rgba(243,196,82,0.6)' });
    const mt = motes(l, { n: 26, w: 1300, h: 700, x: '50%', y: '42%', seed: 71 });

    return (t) => {
      // 点阵：0 – 0.50 逐个淡入（从中心向外）
      const lp = clamp(t / 0.38);
      for (let i = 0; i < 100; i++) {
        const c = i % 10;
        const rr = Math.floor(i / 10);
        const dx = c - 4.5;
        const dy = rr - 4.5;
        const rad = Math.sqrt(dx * dx + dy * dy) / 6.36;
        const p = clamp((lp - rad * 0.42) / 0.50);
        const e = eOut4(p);
        if (WINNERS.includes(i)) grid.paint(i, 'win', lerp(0.3, 1, e));
        else grid.paint(i, 'live', lerp(0.3, 1, e));
        grid.place(i, 0, 0, lerp(0.3, 1, e), 0, e * 0.9);
      }

      glows.forEach((n, k) => {
        const p = clamp((t - (0.46 + k * 0.10)) / 0.26);
        const e = eOut(p);
        n.style.opacity = String(e);
        n.style.transform = `scale(${lerp(0.5, 1, e).toFixed(3)})`;
      });

      const p1 = clamp((t - 0.20) / 0.40);
      const e1 = eOut5(p1);
      main.style.opacity = String(clamp(p1 * 3));
      main.style.transform = `translateY(${((1 - e1) * 26).toFixed(1)}px)`;
      main.style.filter = p1 < 1 ? `blur(${((1 - p1) * 16).toFixed(1)}px)` : '';

      const p2 = clamp((t - 0.60) / 0.34);
      en.style.opacity = String(eOut(p2) * 0.85);

      const p3 = clamp((t - 1.10) / 0.40);
      sign.style.opacity = String(eOut(p3) * 0.9);
      sign.style.letterSpacing = `${(0.34 + (1 - eOut(p3)) * 0.22).toFixed(3)}em`;

      r1(clamp((t - 0.10) / 0.72), 1.9);
      mt(t, 1);
    };
  },
};

export const ACT5 = { f1, f2, g1, g2 };
