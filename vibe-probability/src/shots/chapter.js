// 章卡：低频冲击 + 残响，全片唯一的"静止"镜头
// 对标片的章卡只有一行中文 + 一行英文，没有任何装饰
// 标记 #3 要求"强有力的进场音效" —— 画面同步加了三环错峰 + 速度线 + 震动

import { C, F, FN, FM, FS } from '../theme.js';
import { el, clamp, eOut, eOut4, eOut5, eExpo, svg, sEl, ST, lerp } from '../kit.js';
import { kick, kickR, foot } from '../ui.js';
import { makeShaker, shockRing, speedLines } from '../fx.js';

const ch = {
  build(l) {
    // 聚光：进场时把画面中心打亮，随后收到常驻值
    const spot = el('div', {
      position: 'absolute', inset: '0',
      background: 'radial-gradient(ellipse at 50% 50%, rgba(243,196,82,0.24) 0%, rgba(243,196,82,0.07) 34%, rgba(0,0,0,0) 66%)',
      opacity: '0', pointerEvents: 'none',
    }, l);

    // 三环错峰 + 放射速度线
    const rA = shockRing(l, { size: 900, x: 0.5, y: 0.5, color: 'rgba(243,196,82,0.85)', w: 2.4 });
    const rB = shockRing(l, { size: 600, x: 0.5, y: 0.5, color: 'rgba(255,248,228,0.70)', w: 1.6 });
    const rC = shockRing(l, { size: 1300, x: 0.5, y: 0.5, color: 'rgba(243,196,82,0.40)', w: 1.2 });
    const lines = speedLines(l, { n: 20, len: 220, r0: 280, r1: 700, alpha: 0.50, x: 0.5, y: 0.5, seed: 3, color: 'rgba(243,196,82,0.70)' });

    // 中轴细线：从中心向上向下同时生长
    const s = svg(4, 560, l, {
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    });
    const up = sEl('line', {
      x1: 2, y1: 280, x2: 2, y2: 280,
      ...ST(C.goldSoft, 1.4),
      pathLength: '1', 'stroke-dasharray': '1', 'stroke-dashoffset': '1',
    }, s);
    const dn = sEl('line', {
      x1: 2, y1: 280, x2: 2, y2: 280,
      ...ST(C.goldSoft, 1.4),
      pathLength: '1', 'stroke-dasharray': '1', 'stroke-dashoffset': '1',
    }, s);

    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '20px',
    }, l);

    const zh = el('div', {
      font: `700 132px ${F}`, color: C.ink, letterSpacing: '0.04em',
      opacity: '0',
    }, wrap);
    zh.textContent = '重复实验';

    const en = el('div', {
      font: `400 26px ${FN}`, color: C.dim,
      letterSpacing: '0.34em', textTransform: 'uppercase',
      opacity: '0',
    }, wrap);
    en.textContent = 'Repeat the Experiment';

    // 上方章节号
    const num = el('div', {
      position: 'absolute', left: '0', right: '0', top: '240px',
      textAlign: 'center',
      font: `500 22px ${FM}`, color: C.faint, letterSpacing: '0.4em',
      opacity: '0',
    }, l);
    num.textContent = 'CHAPTER 01';

    const shake = makeShaker([0.02, 0.20], { amp: 15, dur: 0.34, freq: 20, rot: 0.20 });

    return (t) => {
      // 震动只加在文字层，不抖竖线与环（否则会看出"图层分离"）
      const sh = shake(t);
      wrap.style.transform = sh || '';

      // 竖线：0 – 0.34 向两端生长
      const lp = clamp(t / 0.34);
      const e = eOut4(lp);
      up.setAttribute('y1', String(280 - e * 250));
      dn.setAttribute('y2', String(280 + e * 250));
      up.style.strokeDashoffset = String(1 - e);
      dn.style.strokeDashoffset = String(1 - e);

      // 中文：0.06 起上浮
      const p = clamp((t - 0.06) / 0.30);
      const pe = eOut5(p);
      zh.style.opacity = String(clamp(p * 3));
      zh.style.transform = `translateY(${((1 - pe) * 26).toFixed(1)}px)`;
      zh.style.filter = p < 1 ? `blur(${((1 - p) * 14).toFixed(1)}px)` : '';

      const p2 = clamp((t - 0.26) / 0.26);
      en.style.opacity = String(eOut(p2) * 0.9);
      en.style.transform = `translateY(${((1 - eOut(p2)) * 10).toFixed(1)}px)`;
      en.style.letterSpacing = `${(0.34 + (1 - eOut(p2)) * 0.16).toFixed(3)}em`;

      num.style.opacity = String(eOut(clamp(t / 0.24)) * 0.9);

      // 三环错峰 + 速度线
      rA(clamp((t - 0.02) / 0.72), 1.5);
      rB(clamp((t - 0.10) / 0.62), 2.0);
      rC(clamp((t - 0.18) / 0.86), 1.3);
      lines(clamp((t - 0.02) / 0.62));

      // 聚光：进场亮 → 收到 0.42 常驻
      const sp = clamp(t / 0.26);
      const sf = clamp((t - 0.40) / 0.55);
      spot.style.opacity = String(eOut(sp) * lerp(0.92, 0.42, eOut(sf)));
    };
  },
};

export const CH = { ch };
