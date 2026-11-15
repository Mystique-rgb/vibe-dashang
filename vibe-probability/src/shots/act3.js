// 第四幕 · 对比与冲刺（bar19.75 – bar23）
// 全片最快的段落：平均镜头长 1.1s，硬数字连闪

import { C, F, FN, FM, FS, bar } from '../theme.js';
import { el, clamp, eOut, eOut4, eOut5, eInOut, eExpo, eBack, lerp, prog, svg, sEl, ST, rnd } from '../kit.js';
import { kick, kickR, capType, head, g, r, d } from '../ui.js';
import { heroNumber, heroLabel, stamp } from '../widgets.js';
import { compareRow } from '../chart.js';
import { disperse, motes, ring } from '../particles.js';
import { makeShaker, shockRing, speedLines, endpointBurst } from '../fx.js';
import { SUB } from '../timing.js';

// ─────────────────────────────────────────── d1：试 10 次 vs 试 229 次
const d1 = {
  build(l) {
    const H = head(l, '试几次，差别有多大', 'HOW FAR DOES IT GO', { top: 138, size: 52, enSize: 22 });

    const row1 = compareRow(l, {
      label: '试 10 次', en: 'QUIT AT 10', value: 18.29,
      top: 318, left: 250, width: 1420, height: 58,
      color: 'rgba(221,47,45,0.82)', valueColor: C.red,
    });
    // 中间一行用暖白：大面积金色铺在近黑上会读成橄榄褐，
    // 金色只留给"最终答案"那一行
    const row2 = compareRow(l, {
      label: '试 50 次', en: 'AT 50', value: 63.58,
      top: 498, left: 250, width: 1420, height: 58,
      color: 'rgba(242,235,220,0.34)', valueColor: C.ink,
    });
    const row3 = compareRow(l, {
      label: '试 229 次', en: 'KEEP GOING', value: 99.02,
      top: 678, left: 250, width: 1420, height: 58,
      color: C.gold, valueColor: C.gold,
    });

    const cap = capType(l, SUB('d1').zh, SUB('d1').en, { bottom: 84 });

    // ── 标记 #10：三条线每次到达端点加音效，运动过程加光效 ──
    // 每条条内部塞一个随宽度移动的光斑（贴在 track 里，跟 fill 同宽）
    const heads = [row1, row2, row3].map((row, k) => {
      const c = [C.red, '#CFC6B4', C.gold][k];
      const head = el('div', {
        position: 'absolute', left: '0', top: '0', bottom: '0',
        width: '120px',
        background: `linear-gradient(to right, rgba(255,248,228,0) 0%, ${c} 62%, rgba(255,248,228,0.95) 100%)`,
        filter: 'blur(1.5px)',
        opacity: '0',
        pointerEvents: 'none',
        willChange: 'left, opacity',
      }, row.track);
      const bloom = el('div', {
        position: 'absolute', left: '0', top: '-14px', bottom: '-14px',
        width: '240px',
        background: `radial-gradient(ellipse at center, ${c} 0%, rgba(0,0,0,0) 70%)`,
        opacity: '0',
        pointerEvents: 'none',
        willChange: 'left, opacity',
      }, row.track);
      return { head, bloom, c };
    });
    // 三条条到达端点的光爆：坐标必须落在真实端点
    // left=250, track 宽 = 1420-300, top = 行顶 + 48 + 高度/2
    const booms = [
      { t0: 0.30, fn: endpointBurst(l, { x: 0.23690, y: 0.36574, color: C.red, size: 190, sparks: 8, seed: 61 }) },
      { t0: 0.52, fn: endpointBurst(l, { x: 0.50109, y: 0.53241, color: '#CFC6B4', size: 210, sparks: 10, seed: 63 }) },
      { t0: 0.84, fn: endpointBurst(l, { x: 0.70782, y: 0.69907, color: C.gold, size: 175, sparks: 11, seed: 67 }) },
    ];

    return (t) => {
      // 每条条独立起跑；数字只在 8 个台阶上跳，最后精确落在终值
      // 台阶的最后一项必须等于该行的真实终值，
      // 否则会出现"条已经满格、数字还停在 54.9%"这种自相矛盾
      const stages = [
        [0, 6.1, 12.2, 18.3],
        [0, 21.2, 42.4, 63.6],
        [0, 33.0, 66.0, 99.0],
      ];
      [row1, row2, row3].forEach((row, k) => {
        const t0 = [0.06, 0.26, 0.50][k];
        const p = clamp((t - t0) / [0.26, 0.28, 0.34][k]);
        const e = eOut4(p);
        row.set(e, false);
        // 光斑跟着填充头部走（track 宽 = width - 300）
        const tw = 1420 - 300;
        const x = (row.value / 100) * tw * e;
        const hd = heads[k];
        hd.head.style.left = `${(x - 120).toFixed(1)}px`;
        hd.bloom.style.left = `${(x - 120).toFixed(1)}px`;
        // 光斑只在"跑"的时候亮；停稳后收掉，否则会一直挂在条尾像残影
        const run = Math.sin(Math.PI * clamp(p)) ** 1.4;
        hd.head.style.opacity = String(clamp(p * 6) * run * 1.05);
        hd.bloom.style.opacity = String(clamp(p * 6) * run * 0.62);
        // 数字离散化：台阶值 + 终值
        const st = stages[k];
        const idx = Math.min(st.length - 1, Math.floor(e * (st.length - 1) + 0.0001));
        row.num.textContent = `${st[idx].toFixed(1)}%`;
        if (p >= 0.999) row.num.textContent = `${row.value.toFixed(1)}%`;
      });

      // 第三行落位时给一个强调
      const bump = clamp((t - 0.80) / 0.14);
      if (bump > 0 && bump < 1) {
        const s = 1 + Math.sin(bump * Math.PI) * 0.10;
        row3.num.style.transform = `scale(${s.toFixed(3)})`;
        row3.num.style.transformOrigin = 'right center';
      } else if (bump >= 1) {
        row3.num.style.transform = 'scale(1)';
      }

      booms.forEach(({ t0, fn }, k) => fn(clamp((t - t0) / (k === 2 ? 0.50 : 0.34)), k === 2 ? 1.0 : 0.7));

      cap.type(t, 0.30, 0.50);
    };
  },
};

// ─────────────────────────────────────────── d2：90% 在第 114 次
const d2 = {
  build(l) {
    // 单数字冲击：三个档位快速替换，最后停在 114
    const hero = heroNumber(l, { size: 300, x: 0.5, y: 0.42, color: C.ink });
    const lab = heroLabel(l, '九成的人，在第 114 次之前成了', 'NINETY PERCENT BY TRY 114', { x: 0.5, y: 0.205, zhSize: 36, enSize: 19 });

    const cap = capType(l, SUB('d2').zh, SUB('d2').en, { bottom: 92 });
    const burst = disperse(l, { n: 24, spread: 400, x: '50%', y: '42%', seed: 41 });

    // ── 标记 #11：变化的时候加震动效果 ────────────────────
    const marks0 = [0.0, 0.30, 0.56];
    const shake = makeShaker(marks0, { amp: 15, dur: 0.26, freq: 25, rot: 0.20 });
    // 每次变化一个小环（不是大爆，避免抢"114"的落点）
    const pops = marks0.map((t0, k) => ({
      t0,
      fn: shockRing(l, {
        size: 260, x: 0.5, y: 0.42,
        color: k === 2 ? 'rgba(243,196,82,0.9)' : 'rgba(242,235,220,0.5)',
        w: k === 2 ? 2.4 : 1.2,
      }),
    }));

    return (t) => {
      // 离散连闪：10 → 50 → 114
      let txt = '10';
      let col = C.ink;
      if (t > 0.30) { txt = '50'; }
      if (t > 0.56) { txt = '114'; col = C.gold; }

      // 每次替换给一次砸落
      const marks = [0.0, 0.30, 0.56];
      let local = 1;
      for (const m of marks) {
        if (t >= m) local = clamp((t - m) / 0.18);
      }
      const e = eOut5(local);
      hero.set(txt, {
        scale: lerp(1.42, 1, e),
        blur: (1 - local) * 18,
        opacity: 1,
        color: col,
      });
      const sh = shake(t);
      if (sh) hero.node.style.transform += ` ${sh}`;
      pops.forEach(({ t0, fn }, k) => fn(clamp((t - t0) / (k === 2 ? 0.42 : 0.28)), k === 2 ? 1.7 : 1.1));
      lab.set(clamp((t - 0.60) / 0.24), 12);
      burst(clamp((t - 0.56) / 0.36));
      cap.type(t, 0.28, 0.50);
    };
  },
};

// ─────────────────────────────────────────── d3：63.6 → 90 → 99 连闪
const d3 = {
  build(l) {
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '50px', marginTop: '-20px',
    }, l);

    // 三个大数字 + 箭头
    const mk = (val, sub, col) => {
      const cell = el('div', {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        opacity: '0',
      }, wrap);
      const v = el('div', {
        font: `700 168px ${FN}`, color: col, lineHeight: '1', letterSpacing: '-0.02em',
      }, cell);
      v.textContent = val;
      const s = el('div', {
        font: `500 24px ${FM}`, color: C.dim, letterSpacing: '0.16em',
      }, cell);
      s.textContent = sub;
      return cell;
    };

    const c1 = mk('63.6%', 'TRY 50', C.ink2);
    const a1 = el('div', { font: `300 72px ${FN}`, color: C.faint, opacity: '0' }, wrap);
    a1.textContent = '→';
    const c2 = mk('90.0%', 'TRY 114', C.ink2);
    const a2 = el('div', { font: `300 72px ${FN}`, color: C.faint, opacity: '0' }, wrap);
    a2.textContent = '→';
    const c3 = mk('99.0%', 'TRY 229', C.gold);

    const cap = capType(l, SUB('d3').zh, SUB('d3').en, { bottom: 92 });

    return (t) => {
      // 三档依次点亮，每档 0.26s
      const p1 = clamp(t / 0.15);
      const p2 = clamp((t - 0.24) / 0.22);
      const p3 = clamp((t - 0.48) / 0.22);

      [c1, c2, c3].forEach((c, k) => {
        const p = [p1, p2, p3][k];
        const e = eOut5(p);
        c.style.opacity = String(clamp(p * 3));
        c.style.transform = `scale(${lerp(1.28, 1, e).toFixed(3)})`;
        c.style.filter = p < 1 ? `blur(${((1 - p) * 14).toFixed(1)}px)` : '';
      });

      [a1, a2].forEach((a, k) => {
        const p = [p1, p2][k];
        a.style.opacity = String(eOut(clamp((p - 0.5) / 0.5)) * 0.8);
      });

      cap.type(t, 0.30, 0.44);
    };
  },
};

// ─────────────────────────────────────────── d4：差的不是运气，是次数
const d4 = {
  build(l) {
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '30px',
      marginTop: '-40px',
    }, l);

    const line = el('div', {
      font: `700 152px ${F}`, color: C.ink, letterSpacing: '0.01em',
      opacity: '0', textAlign: 'center',
    }, wrap);
    line.innerHTML = `差的不是运气，<br><span style="color:${C.gold}">是次数</span>`;

    const en = el('div', {
      font: `400 32px ${FN}`, color: C.dim,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      opacity: '0',
    }, wrap);
    en.textContent = 'The gap isn’t luck. It’s the count.';

    const cap = capType(l, SUB('d4').zh, SUB('d4').en, { bottom: 92 });

    return (t) => {
      const p1 = clamp(t / 0.22);
      const e1 = eOut5(p1);
      line.style.opacity = String(clamp(p1 * 3));
      line.style.transform = `translateY(${((1 - e1) * 30).toFixed(1)}px)`;
      line.style.filter = p1 < 1 ? `blur(${((1 - p1) * 16).toFixed(1)}px)` : '';

      const p2 = clamp((t - 0.34) / 0.30);
      en.style.opacity = String(eOut(p2) * 0.9);

      cap.type(t, 0.36, 0.50);
    };
  },
};

export const ACT3 = { d1, d2, d3, d4 };
