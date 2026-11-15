// 第二幕 · 三条规则（bar9 – bar12）
// 版式来自对标片：一屏三栏对照，只有这一种镜头允许分栏
// 图标全部用 SVG 手绘，不用字体符号

import { C, F, FN, FM, FS, bar } from '../theme.js';
import { el, clamp, eOut, eOut4, eOut5, eInOut, eExpo, eBack, lerp, prog, svg, sEl, ST, rnd } from '../kit.js';
import { kick, kickR, capType, head, g, r, d } from '../ui.js';
import { heroNumber, heroLabel, stamp } from '../widgets.js';
import { makeShaker, shockRing, speedLines, endpointBurst, glowSpot } from '../fx.js';
import { SUB } from '../timing.js';

// ─────────────────────────────────────────── b1：只有成或败
const b1 = {
  build(l) {
    const H = head(l, '每一次尝试', 'EVERY SINGLE TRY', { top: 150, size: 60, enSize: 24 });

    // 两个大圆：金勾 / 红叉
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '120px',
      marginTop: '40px',
    }, l);

    const mk = (color, kind) => {
      const cell = el('div', {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px',
        opacity: '0',
      }, wrap);
      const s = svg(220, 220, cell);
      sEl('circle', { cx: 110, cy: 110, r: 100, fill: color }, s);
      if (kind === 'win') {
        sEl('path', {
          d: 'M58,112 L96,150 L164,74',
          ...ST('#0A0A06', 15),
        }, s);
      } else {
        sEl('path', { d: 'M70,70 L150,150', ...ST('#0A0A06', 15) }, s);
        sEl('path', { d: 'M150,70 L70,150', ...ST('#0A0A06', 15) }, s);
      }
      const cap = el('div', {
        font: `600 36px ${F}`, color: C.ink2, letterSpacing: '0.08em',
      }, cell);
      cap.textContent = kind === 'win' ? '成' : '败';
      return cell;
    };

    const winCell = mk(C.gold, 'win');
    const loseCell = mk(C.red, 'lose');

    const line = el('div', {
      position: 'absolute', left: '50%', top: '50%',
      width: '2px', height: '0px',
      background: C.faint, transform: 'translate(-50%, -50%)',
    }, l);

    const cap = capType(l, SUB('b1').zh, SUB('b1').en, { bottom: 92 });

    // ── 标记 #4：整场加转场特效 ────────────────────────────
    // 进场用"双环 + 速度线 + 震动"，两个圆各自落位时再爆一次光
    const rA = shockRing(l, { size: 760, x: 0.5, y: 0.5, color: 'rgba(243,196,82,0.70)', w: 2.0 });
    const rB = shockRing(l, { size: 1100, x: 0.5, y: 0.5, color: 'rgba(242,235,220,0.45)', w: 1.3 });
    const lines = speedLines(l, { n: 20, len: 200, r0: 240, r1: 560, alpha: 0.46, x: 0.5, y: 0.5, seed: 13, color: 'rgba(243,196,82,0.60)' });
    const shake = makeShaker([0.0, 0.16], { amp: 14, dur: 0.28, freq: 24, rot: 0.18 });
    // 勾与叉落位时的光爆（位置按版式算：gap 120 + 220 直径）
    const boomWin = endpointBurst(l, { x: 0.5 - 0.085, y: 0.5 + 0.037, color: C.gold, size: 260, sparks: 12, seed: 21 });
    const boomLose = endpointBurst(l, { x: 0.5 + 0.085, y: 0.5 + 0.037, color: C.red, size: 260, sparks: 12, seed: 33 });
    const spot = el('div', {
      position: 'absolute', inset: '0',
      background: 'radial-gradient(ellipse at 50% 52%, rgba(243,196,82,0.18) 0%, rgba(0,0,0,0) 62%)',
      opacity: '0', pointerEvents: 'none',
    }, l);

    return (t) => {
      // 0 – 0.28：两个圆从中间分开（勾先、叉后）
      const p1 = clamp(t / 0.16);
      const p2 = clamp((t - 0.10) / 0.20);
      const sh = shake(t);
      [winCell, loseCell].forEach((c, k) => {
        const p = k === 0 ? p1 : p2;
        const e = eOut5(p);
        c.style.opacity = String(clamp(p * 3));
        c.style.transform = `scale(${lerp(0.55, 1, e).toFixed(3)})${sh ? ' ' + sh : ''}`;
        c.style.filter = p < 1 ? `blur(${((1 - p) * 12).toFixed(1)}px)` : '';
      });

      // 中缝虚线：0.18 起
      const lp = clamp((t - 0.18) / 0.26);
      line.style.height = `${(eOut4(lp) * 260).toFixed(1)}px`;
      line.style.background = 'repeating-linear-gradient(to bottom, rgba(242,235,220,0.22) 0 6px, transparent 6px 14px)';

      // 进场环 + 速度线
      rA(clamp(t / 0.52), 1.6);
      rB(clamp((t - 0.08) / 0.56), 1.4);
      lines(clamp(t / 0.44));
      // 勾 / 叉落位的光爆
      boomWin(clamp((t - 0.12) / 0.44), 0.9);
      boomLose(clamp((t - 0.20) / 0.44), 0.9);
      spot.style.opacity = String(eOut(clamp(t / 0.24)) * 0.75);

      cap.type(t, 0.38, 0.58);
    };
  },
};

// ─────────────────────────────────────────── b2：彼此不影响
const b2 = {
  build(l) {
    const H = head(l, '这次不影响下一次', 'TRIES ARE INDEPENDENT', { top: 150, size: 58, enSize: 23 });

    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '54px',
      marginTop: '30px',
    }, l);

    // 两个圆环数字 1 / 2，中间一个"独立"符号
    const ring = (n) => {
      const cell = el('div', { opacity: '0', position: 'relative' }, wrap);
      const s = svg(200, 200, cell);
      sEl('circle', {
        cx: 100, cy: 100, r: 88,
        ...ST(C.ink2, 2.4),
      }, s);
      const t = sEl('text', {
        x: 100, y: 100, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: C.ink, 'font-family': FN, 'font-size': '96', 'font-weight': '600',
      }, s);
      t.textContent = String(n);
      return cell;
    };

    const r1 = ring(1);
    const r2 = ring(2);

    // 中间的断开符号：三条短竖线，表示"没有传递"
    // 顺序必须是 1 → 断口 → 2，所以断口要插在两个圆之间
    const gap = el('div', {
      display: 'flex', alignItems: 'center', gap: '10px',
      opacity: '0',
    }, wrap);
    for (let k = 0; k < 3; k++) {
      el('div', {
        width: '3px', height: '76px',
        background: 'rgba(242,235,220,0.28)',
        borderRadius: '2px',
      }, gap);
    }
    wrap.insertBefore(gap, r2);

    // 下方的"结果"独立：两条小进度条，各自独立跑
    const bars = el('div', {
      position: 'absolute', left: '50%', bottom: '300px',
      transform: 'translateX(-50%)',
      display: 'flex', gap: '26px',
    }, l);
    const b1n = el('div', {
      width: '300px', height: '8px', background: 'rgba(242,235,220,0.07)',
      position: 'relative', overflow: 'hidden', borderRadius: '2px',
    }, bars);
    const b1f = el('div', {
      position: 'absolute', inset: '0', width: '0%', background: C.gold, borderRadius: '2px',
    }, b1n);
    const b2n = el('div', {
      width: '300px', height: '8px', background: 'rgba(242,235,220,0.07)',
      position: 'relative', overflow: 'hidden', borderRadius: '2px',
    }, bars);
    const b2f = el('div', {
      position: 'absolute', inset: '0', width: '0%', background: 'rgba(242,235,220,0.4)', borderRadius: '2px',
    }, b2n);

    const cap = capType(l, SUB('b2').zh, SUB('b2').en, { bottom: 92 });

    return (t) => {
      const p1 = clamp(t / 0.16);
      const p2 = clamp((t - 0.09) / 0.19);
      [r1, r2].forEach((c, k) => {
        const p = k === 0 ? p1 : p2;
        const e = eOut5(p);
        c.style.opacity = String(clamp(p * 3));
        c.style.transform = `scale(${lerp(1.5, 1, e).toFixed(3)})`;
        c.style.filter = p < 1 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : '';
      });

      const p3 = clamp((t - 0.16) / 0.22);
      gap.style.opacity = String(eOut(p3) * 0.9);
      gap.style.transform = `scaleY(${lerp(0.4, 1, eOut4(p3)).toFixed(3)})`;

      // 两条条各自跑：一条到 2%（单次），一条到 4%（第二次仍只有 2%）
      const pb = clamp((t - 0.50) / 0.42);
      b1f.style.width = `${(eOut4(pb) * 2).toFixed(2)}%`;
      b2f.style.width = `${(eOut4(clamp((pb - 0.12) / 0.88)) * 2).toFixed(2)}%`;

      cap.type(t, 0.36, 0.58);
    };
  },
};

// ─────────────────────────────────────────── b3：概率不变
const b3 = {
  build(l) {
    const H = head(l, '概率不改变', 'SAME ODDS EVERY TIME', { top: 150, size: 60, enSize: 24 });

    // 三个 2% 徽章：横向排列，数字恒定
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '64px',
      marginTop: '20px',
    }, l);

    const badges = [];
    for (let k = 0; k < 3; k++) {
      const cell = el('div', {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
        opacity: '0',
      }, wrap);
      const s = svg(180, 180, cell);
      sEl('circle', {
        cx: 90, cy: 90, r: 80,
        ...ST(k === 1 ? C.gold : C.ink2, k === 1 ? 2.8 : 2.0),
      }, s);
      const t = sEl('text', {
        x: 90, y: 90, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        fill: k === 1 ? C.gold : C.ink, 'font-family': FN,
        'font-size': '52', 'font-weight': '600',
      }, s);
      t.textContent = '2%';
      const lbl = el('div', {
        font: `500 24px ${FM}`, color: C.faint, letterSpacing: '0.24em',
      }, cell);
      lbl.textContent = `TRY ${k + 1}`;
      badges.push(cell);
    }

    // 底部一条 100% 长轴上只有 2% 的一小段亮：说明"刻度没变"
    const axis = el('div', {
      position: 'absolute', left: '50%', bottom: '268px',
      transform: 'translateX(-50%)',
      width: '1100px', height: '2px',
      background: 'rgba(242,235,220,0.12)',
    }, l);
    const seg = el('div', {
      position: 'absolute', left: '0', top: '-3px',
      width: '0%', height: '8px', background: C.gold, borderRadius: '2px',
    }, axis);
    const axisEnd = el('div', {
      position: 'absolute', right: '-46px', top: '-18px',
      font: `400 22px ${FN}`, color: C.dim, letterSpacing: '0.08em',
    }, axis);
    axisEnd.textContent = '100%';

    const cap = capType(l, SUB('b3').zh, SUB('b3').en, { bottom: 92 });

    return (t) => {
      badges.forEach((c, k) => {
        const p = clamp((t - k * 0.11) / 0.20);
        const e = eOut5(p);
        c.style.opacity = String(clamp(p * 3));
        c.style.transform = `translateY(${((1 - e) * 30).toFixed(1)}px) scale(${lerp(0.8, 1, e).toFixed(3)})`;
        c.style.filter = p < 1 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : '';
      });

      const pa = clamp((t - 0.58) / 0.34);
      seg.style.width = `${(eOut4(pa) * 2).toFixed(2)}%`;

      cap.type(t, 0.34, 0.58);
    };
  },
};

export const ACT1 = { b1, b2, b3 };
