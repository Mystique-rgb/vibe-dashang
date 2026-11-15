// 第一幕 · 钩子（0 – bar8 / 0 – 16.75s）
// 版式规则（来自对标片）：左图右数，两栏，绝不重叠
// 开场必须 NB：100 个点从暗处点亮 → 只有 2 个是金 → 98 个翻成红 X

import { C, F, FN, FM, FS, bar } from '../theme.js';
import { el, clamp, eOut, eOut4, eOut5, eInOut, eExpo, eBack, lerp, prog, rnd, svg, sEl, ST, fmt } from '../kit.js';
import { kick, kickR, capType, foot, box, head, g, r, d, w } from '../ui.js';
import { heroNumber, heroLabel, stamp, strike, circleMark, flipGrid } from '../widgets.js';
import { disperse, motes, ring } from '../particles.js';
import { makeShaker, speedLines, shockRing, endpointBurst, glowSpot } from '../fx.js';
import { SUB } from '../timing.js';

// 100 个点的基准网格
const GS = 34;   // 点直径
const GG = 22;   // 间距
const GC = 10;   // 列
const CELL = GS + GG;
const BW = GC * CELL - GG;

// 左栏中心 / 右栏中心
const LX = 0.265;
const RX = 0.695;
const CY = 0.47;

// 2% 的两位赢家（固定，全片一致）
const WINNERS = [23, 71];

// 在网格 wrap 内按格坐标放一个光斑
function addGlow(grid, idx, color = C.gold, size = GS) {
  const c = idx % GC;
  const r = Math.floor(idx / GC);
  return el('div', {
    position: 'absolute',
    left: `${c * CELL}px`, top: `${r * CELL}px`,
    width: `${size}px`, height: `${size}px`,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 ${size * 1.1}px ${size * 0.34}px rgba(243,196,82,0.55), 0 0 ${size * 3}px ${size * 1.1}px rgba(243,196,82,0.18)`,
    opacity: '0',
    pointerEvents: 'none',
  }, grid.wrap);
}

// ─────────────────────────────────────────── a1：100 个点 / 只有 2 个金色
const a1 = {
  build(l) {
    const grid = flipGrid(l, {
      n: 100, cols: GC, size: GS, gap: GG,
      x: 0.5, y: CY,
      dotColor: 'rgba(242,235,220,0.30)',
      goldColor: C.gold,
    });

    const glows = WINNERS.map((i) => addGlow(grid, i));

    // 右栏：2%
    const hero = heroNumber(l, { size: 288, x: RX, y: CY + 0.02, color: C.gold });
    const lab = heroLabel(l, '单次成功率', 'SUCCESS RATE', { x: RX, y: CY - 0.185, zhSize: 38, enSize: 20 });

    const cap = capType(l, SUB('a1').zh, SUB('a1').en);

    const r1 = ring(l, { size: 520, x: 0.5, y: CY, color: 'rgba(243,196,82,0.75)' });
    const burst = disperse(l, {
      n: 48, spread: 700, x: '50%', y: `${CY * 100}%`, seed: 11,
      colors: [C.gold, 'rgba(243,196,82,0.6)', 'rgba(242,235,220,0.75)', 'rgba(140,136,124,0.35)'],
    });

    // ── 标记 #1：2% 的强力进场 ──────────────────────────────
    // 三层叠加：放射速度线（瞬间）+ 双冲击环（错峰）+ 数字落点震动
    const lines = speedLines(l, {
      n: 22, len: 230, r0: 230, r1: 620, alpha: 0.62,
      x: RX, y: CY + 0.02, seed: 7,
      color: 'rgba(243,196,82,0.85)',
    });
    const ringA = shockRing(l, { size: 560, x: RX, y: CY + 0.02, color: 'rgba(243,196,82,0.95)', w: 2.6 });
    const ringB = shockRing(l, { size: 380, x: RX, y: CY + 0.02, color: 'rgba(255,248,228,0.85)', w: 1.8 });
    // 数字背后的聚光：让 2% 出现时像被灯打亮
    const spot = el('div', {
      position: 'absolute',
      left: `${RX * 100}%`, top: `${(CY + 0.02) * 100}%`,
      width: '860px', height: '620px',
      marginLeft: '-430px', marginTop: '-310px',
      background: 'radial-gradient(ellipse at center, rgba(243,196,82,0.30) 0%, rgba(243,196,82,0.10) 38%, rgba(243,196,82,0) 72%)',
      opacity: '0',
      pointerEvents: 'none',
      willChange: 'opacity, transform',
    }, l);
    const shake = makeShaker([0.46, 0.60], { amp: 22, dur: 0.30, freq: 23, rot: 0.30 });
    const group = [grid.wrap, hero.node, lab.wrap];

    return (t) => {
      // 0 – 0.52：点阵从中心逐圈点亮（半径波），整体从 1.5 倍收到 1 倍
      const lit = clamp((t - 0.04) / 0.56);
      for (let i = 0; i < 100; i++) {
        const c = i % GC;
        const r = Math.floor(i / GC);
        const dx = c - 4.5;
        const dy = r - 4.5;
        const rad = Math.sqrt(dx * dx + dy * dy) / 6.36;
        const p = clamp((lit - rad * 0.55) / 0.42);
        const e = eOut4(p);
        if (WINNERS.includes(i)) grid.paint(i, 'win', lerp(0.25, 1, e));
        else grid.paint(i, 'live', lerp(0.25, 1, e));
      }

      // 网格从居中放大态 → 移到左栏
      const gp = clamp((t - 0.30) / 0.42);
      const ge = eOut4(gp);
      const gx = lerp(0, (LX - 0.5) * 1920, ge);
      const gy = lerp(0, 0, ge);
      const gs = lerp(1.28, 1, ge);
      const sh = shake(t);
      grid.wrap.style.transform = `translate(${(gx).toFixed(1)}px, ${(gy).toFixed(1)}px) scale(${gs.toFixed(3)}) ${sh}`;

      // 光斑
      glows.forEach((n, k) => {
        const p = clamp((t - (0.42 + k * 0.10)) / 0.26);
        const e = eOut(p);
        n.style.opacity = String(e * 0.95);
        n.style.transform = `scale(${lerp(0.4, 1, e).toFixed(3)})`;
      });

      // 大字 2%：0.44 起，从 1.7 倍砸到 1 倍
      const hp = clamp((t - 0.44) / 0.32);
      const he = eOut5(hp);
      hero.set('2%', {
        scale: lerp(1.7, 1, he),
        blur: (1 - hp) * 26,
        opacity: clamp(hp * 3),
      });
      lab.set(clamp((t - 0.52) / 0.26), 14);

      // 速度线：0.42 – 0.92，只冲一下
      lines(clamp((t - 0.42) / 0.50));
      // 冲击环：主环 0.44 起，内环延后 0.06s
      ringA(clamp((t - 0.44) / 0.56), 2.0);
      ringB(clamp((t - 0.50) / 0.48), 2.4);
      // 聚光：0.42 亮起，0.92 后收到 0.35 常驻
      const sp = clamp((t - 0.42) / 0.30);
      const sFall = clamp((t - 0.72) / 0.50);
      spot.style.opacity = String(eOut(sp) * lerp(0.95, 0.32, eOut(sFall)));
      spot.style.transform = `scale(${lerp(0.72, 1, eOut4(sp)).toFixed(3)})`;

      r1(clamp((t - 0.30) / 0.62), 2.6);
      burst(clamp(t / 0.50));

      cap.type(t, 0.74, 0.60);
    };
  },
};

// ─────────────────────────────────────────── a2：98 个点翻成红 X
const a2 = {
  build(l) {
    const grid = flipGrid(l, {
      n: 100, cols: GC, size: GS, gap: GG,
      x: LX, y: CY,
      dotColor: 'rgba(242,235,220,0.30)',
      goldColor: C.gold,
    });
    const glows = WINNERS.map((i) => addGlow(grid, i, C.gold, GS * 0.85));

    const hero = heroNumber(l, { size: 288, x: RX, y: CY + 0.02, color: C.red });
    const lab = heroLabel(l, '失败率', 'FAIL RATE', { x: RX, y: CY - 0.185, zhSize: 38, enSize: 20 });
    const cap = capType(l, SUB('a2').zh, SUB('a2').en);

    // ── 标记 #16：两个赢家点"由灰变黄 + 光晕震动" ──────────
    // 它们在 a1 里是金色，但这一镜从灰开始 —— 98 个红叉压过来时，
    // 这两个点才亮起来，观众才会注意到"只有这两个活下来"
    const winGlow = WINNERS.map((i) => {
      const c = i % GC;
      const r = Math.floor(i / GC);
      return el('div', {
        position: 'absolute',
        left: `${c * CELL}px`, top: `${r * CELL}px`,
        width: `${GS}px`, height: `${GS}px`,
        borderRadius: '50%',
        background: C.gold,
        boxShadow: `0 0 40px 14px rgba(243,196,82,0.62), 0 0 110px 40px rgba(243,196,82,0.26)`,
        opacity: '0',
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }, grid.wrap);
    });
    const winShake = makeShaker([0.50, 0.62], { amp: 9, dur: 0.22, freq: 30, rot: 0.10 });
    const winRing = WINNERS.map((i) => {
      const c = i % GC;
      const r = Math.floor(i / GC);
      return shockRing(grid.wrap, {
        size: 90, color: 'rgba(243,196,82,0.9)', w: 2.0,
        px: c * CELL + GS / 2, py: r * CELL + GS / 2,
      });
    });

    // 翻牌顺序：从中心向外
    const order = [];
    for (let i = 0; i < 100; i++) {
      if (WINNERS.includes(i)) continue;
      const c = i % GC;
      const r = Math.floor(i / GC);
      const dx = c - 4.5;
      const dy = r - 4.5;
      order.push({ i, rad: Math.sqrt(dx * dx + dy * dy) });
    }
    order.sort((a, b) => a.rad - b.rad);
    const rank = new Map(order.map((o, k) => [o.i, k / (order.length - 1)]));

    return (t) => {
      // 赢家点：0.44 之前是灰的，0.50 起由灰变金
      const wp = clamp((t - 0.46) / 0.30);
      const we = eOut4(wp);
      for (let i = 0; i < 100; i++) {
        if (WINNERS.includes(i)) {
          // 'live' 是灰点，'win' 是金点；在 wp 里插值就是"由灰变黄"
          grid.paint(i, wp > 0.42 ? 'win' : 'live', lerp(0.92, 1.12, we));
          continue;
        }
        const rk = rank.get(i);
        const p = clamp((t - 0.04 - rk * 0.52) / 0.22);
        if (p <= 0) grid.paint(i, 'live', 1);
        else grid.flip(i, p, 'fail');
      }

      // 光晕：变黄瞬间亮起，带一次震动
      const sh = winShake(t);
      winGlow.forEach((n, k) => {
        const p = clamp((t - (0.48 + k * 0.04)) / 0.26);
        const e = eOut(p);
        n.style.opacity = String(e * 0.95);
        n.style.transform = `scale(${lerp(0.45, 1, e).toFixed(3)})${sh ? ' ' + sh : ''}`;
      });
      winRing.forEach((fn, k) => fn(clamp((t - (0.48 + k * 0.04)) / 0.46), 1.9));
      glows.forEach((n) => { n.style.opacity = '0'; });

      const hp = clamp((t - 0.52) / 0.28);
      const he = eOut5(hp);
      hero.set('98%', {
        scale: lerp(1.55, 1, he),
        blur: (1 - hp) * 22,
        opacity: clamp(hp * 3.2),
      });
      lab.set(clamp((t - 0.58) / 0.24), 12);
      cap.type(t, 0.54, 0.56);
    };
  },
};

// ─────────────────────────────────────────── a3：点阵重排成 "50"
const a3 = {
  build(l) {
    const grid = flipGrid(l, {
      n: 100, cols: GC, size: GS, gap: GG,
      x: 0.5, y: CY,
      dotColor: 'rgba(242,235,220,0.45)',
      goldColor: C.gold,
    });

    // "50" 字形掩码（10 行 × 11 列）
    const shape = [
      '.1111..1111',
      '.11....1..1',
      '.11....1..1',
      '.1111..1..1',
      '....1..1..1',
      '....1..1..1',
      '....1..1..1',
      '.1111..1111',
    ];
    const mask = [];
    for (let row = 0; row < shape.length; row++) {
      for (let c = 0; c < shape[row].length; c++) {
        if (shape[row][c] === '1') mask.push({ row, col: c });
      }
    }
    // 把 100 个点分到掩码槽位：第一轮占满字形，第二轮略外扩形成"粗体"
    const slots = [];
    for (let i = 0; i < 100; i++) {
      const m = mask[i % mask.length];
      const layer = Math.floor(i / mask.length);
      slots.push({
        x: (m.col - 5) * CELL + layer * 7,
        y: (m.row - 3.5) * CELL + layer * 7,
      });
    }

    const cap = capType(l, SUB('a3').zh, SUB('a3').en);
    const note = el('div', {
      position: 'absolute', left: '0', right: '0', top: '190px',
      textAlign: 'center',
      font: `500 26px ${FM}`, color: C.faint, letterSpacing: '0.30em',
      opacity: '0',
    }, l);
    note.textContent = '那就把次数加上去';

    return (t) => {
      const mp = clamp((t - 0.10) / 0.82);
      const me = eOut4(mp);

      for (let i = 0; i < 100; i++) {
        const c = i % GC;
        const r = Math.floor(i / GC);
        const fromX = (c - 4.5) * CELL;
        const fromY = (r - 4.5) * CELL;
        const s = slots[i];

        const stag = clamp((mp - rnd(i, 5) * 0.26) / 0.74);
        const se = eOut4(stag);
        // place() 是相对格位的偏移，所以要减去原点
        const dx = (s.x - fromX) * se;
        const dy = (s.y - fromY) * se;
        const rot = (1 - se) * (rnd(i, 9) - 0.5) * 46;

        // X 在中途收回成米白点
        if (se < 0.38) grid.paint(i, 'fail', 1);
        else grid.paint(i, 'live', 1);
        grid.place(i, dx, dy, lerp(1, 0.90, se), rot, 1);
      }

      note.style.opacity = String(eOut(clamp((t - 0.86) / 0.26)) * 0.9);
      cap.type(t, 0.66, 0.60);
    };
  },
};

// ─────────────────────────────────────────── a4：第 50 次点亮（63.6%）
const a4 = {
  build(l) {
    const grid = flipGrid(l, {
      n: 100, cols: GC, size: GS, gap: GG,
      x: LX, y: CY,
      dotColor: 'rgba(242,235,220,0.13)',
      goldColor: C.gold,
    });

    // 计数器只用中号字：这是"次数"，不是主视觉数字，
    // 大字号会让 "第 50 次" 四个字符横向溢出压到左侧点阵
    const hero = heroNumber(l, { size: 148, x: RX, y: CY + 0.02, color: C.ink });
    const lab = heroLabel(l, '50 次内至少成一次', 'AT LEAST ONE IN FIFTY', { x: RX, y: CY - 0.145, zhSize: 32, enSize: 18 });
    const cap = capType(l, SUB('a4').zh, SUB('a4').en);

    // 计数器只取离散档位：1 / 10 / 25 / 50 —— 都是"次数"，不是概率
    const marks = [1, 10, 25, 50];
    const marksAt = [0.10, 0.28, 0.44, 0.60];

    // ── 标记 #2：数字每次变化都震动 ────────────────────────
    // 震动触发点 = 每一次档位跳变 + 换成 63.6% 的那一下
    const shakeAt = [...marksAt, 0.66];
    const shake = makeShaker(shakeAt, { amp: 13, dur: 0.24, freq: 26, rot: 0.18 });
    // 每次跳变时数字后方爆一个小环，让"变"这个动作有实体
    const pops = shakeAt.map((t0, k) => ({
      t0,
      fn: shockRing(l, {
        size: 300, x: RX, y: CY + 0.02,
        color: k === shakeAt.length - 1 ? 'rgba(243,196,82,0.95)' : 'rgba(242,235,220,0.55)',
        w: k === shakeAt.length - 1 ? 2.6 : 1.4,
      }),
    }));
    const spot = el('div', {
      position: 'absolute',
      left: `${RX * 100}%`, top: `${(CY + 0.02) * 100}%`,
      width: '720px', height: '520px',
      marginLeft: '-360px', marginTop: '-260px',
      background: 'radial-gradient(ellipse at center, rgba(243,196,82,0.26) 0%, rgba(243,196,82,0) 70%)',
      opacity: '0',
      pointerEvents: 'none',
    }, l);

    return (t) => {
      // 点按"一个一个试过来"的顺序点亮，前 63 个变金
      const lit = clamp((t - 0.08) / 0.52);
      for (let i = 0; i < 100; i++) {
        const c = i % GC;
        const r = Math.floor(i / GC);
        const ord = r * GC + c;
        const p = clamp((lit - (ord / 99) * 0.86) / 0.14);
        if (p <= 0) {
          grid.paint(i, 'dead', 1);
        } else if (ord < 63) {
          grid.paint(i, 'win', lerp(0.45, 1, eOut4(p)));
        } else {
          grid.paint(i, 'dead', 1);
        }
      }

      // 阶段一：次数计数器（离散跳变）
      // 阶段二：换成 63.6%
      if (t < 0.66) {
        let k = 0;
        for (let i = 0; i < marksAt.length; i++) if (t >= marksAt[i]) k = i;
        const local = clamp((t - marksAt[k]) / 0.16);
        hero.set(`第 ${marks[k]} 次`, {
          scale: lerp(1.14, 1, eOut4(local)),
          blur: (1 - local) * 12,
          opacity: 1,
          color: C.ink,
        });
        lab.set(clamp((t - 0.14) / 0.24), 12);
      } else {
        const hp = clamp((t - 0.66) / 0.26);
        const he = eOut5(hp);
        hero.set('63.6%', {
          scale: lerp(1.42, 1, he),
          blur: (1 - hp) * 18,
          opacity: 1,
          color: C.gold,
        });
        lab.set(1, 0);
      }

      // 数字层叠上震动（hero.set 已经写过 transform，这里再叠一层）
      const sh = shake(t);
      if (sh) hero.node.style.transform += ` ${sh}`;
      // 每次跳变的爆环
      pops.forEach(({ t0, fn }, k) => {
        fn(clamp((t - t0) / (k === pops.length - 1 ? 0.46 : 0.30)), k === pops.length - 1 ? 2.0 : 1.5);
      });
      // 聚光：换成 63.6% 时亮起
      const gp = clamp((t - 0.66) / 0.30);
      spot.style.opacity = String(eOut(gp) * 0.85);

      cap.type(t, 0.44, 0.56);
    };
  },
};

// ─────────────────────────────────────────── a5：63.6% 大字（不是 100%）
const a5 = {
  build(l) {
    const hero = heroNumber(l, { size: 320, x: 0.5, y: 0.435, color: C.gold });
    const lab = heroLabel(l, '第 50 次', 'TRY FIFTY', { x: 0.5, y: 0.205, zhSize: 42, enSize: 21 });
    const cap = capType(l, SUB('a5').zh, SUB('a5').en);

    // 100% 幽灵参照线
    const s = svg(1500, 80, l, {
      position: 'absolute', left: '50%', top: '262px',
      transform: 'translateX(-50%)',
    });
    const line = sEl('line', {
      x1: 30, y1: 40, x2: 1470, y2: 40,
      stroke: 'rgba(242,235,220,0.15)', 'stroke-width': 1.4, 'stroke-dasharray': '3 10',
    }, s);
    const lt = sEl('text', {
      x: 1470, y: 26, 'text-anchor': 'end',
      fill: 'rgba(242,235,220,0.26)', 'font-family': FM, 'font-size': '21',
    }, s);
    lt.textContent = '100%';

    const burst = disperse(l, { n: 26, spread: 440, x: '50%', y: '43.5%', seed: 21 });

    return (t) => {
      const hp = clamp((t - 0.02) / 0.34);
      const he = eOut5(hp);
      hero.set('63.6%', {
        scale: lerp(1.68, 1, he),
        blur: (1 - hp) * 26,
        opacity: clamp(hp * 3),
      });
      lab.set(clamp((t - 0.10) / 0.24), 12);

      const lp = clamp((t - 0.48) / 0.36);
      s.style.opacity = String(eOut(lp) * 0.9);
      s.style.transform = `translateX(-50%) translateY(${((1 - eOut(lp)) * 14).toFixed(1)}px)`;

      burst(clamp(t / 0.46));
      cap.type(t, 0.52, 0.56);
    };
  },
};

// ─────────────────────────────────────────── a6：36.4% 还在失败
const a6 = {
  build(l) {
    const grid = flipGrid(l, {
      n: 100, cols: GC, size: GS, gap: GG,
      x: LX, y: CY,
      dotColor: 'rgba(242,235,220,0.13)',
      goldColor: C.gold,
    });

    const hero = heroNumber(l, { size: 268, x: RX, y: CY + 0.02, color: C.red });
    const lab = heroLabel(l, '还是没成的人', 'STILL FAILED', { x: RX, y: CY - 0.185, zhSize: 34, enSize: 18 });
    const cap = capType(l, SUB('a6').zh, SUB('a6').en);

    return (t) => {
      // 从右下往左上翻 36 个 X
      const fp = clamp((t - 0.04) / 0.80);
      for (let i = 0; i < 100; i++) {
        const c = i % GC;
        const r = Math.floor(i / GC);
        const ord = (9 - r) * GC + (9 - c);
        const p = clamp((fp - (ord / 99) * 0.82) / 0.14);
        if (p <= 0) grid.paint(i, 'win', 1);
        else if (ord < 36) grid.flip(i, p, 'fail');
        else grid.paint(i, 'win', 1);
      }

      const hp = clamp((t - 0.54) / 0.28);
      hero.set('36.4%', {
        scale: lerp(1.5, 1, eOut5(hp)),
        blur: (1 - hp) * 20,
        opacity: clamp(hp * 3),
      });
      lab.set(clamp((t - 0.60) / 0.24), 12);
      cap.type(t, 0.58, 0.58);
    };
  },
};

// ─────────────────────────────────────────── a7：「平均」不等于「保证」
const a7 = {
  build(l) {
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '44px',
      marginTop: '-30px',
    }, l);

    const top = el('div', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.10em',
      opacity: '0',
    }, wrap);
    top.innerHTML = `平均 <span style="color:${C.ink2}">50</span> 次就能成`;

    const mainWrap = el('div', {
      position: 'relative', opacity: '0',
    }, wrap);
    const main = el('div', {
      font: `700 148px ${F}`, color: C.ink, letterSpacing: '0.01em',
      display: 'flex', alignItems: 'baseline', gap: '22px',
    }, mainWrap);
    const g1 = el('span', { color: C.gold }, main);
    g1.textContent = '63.6%';
    const ne = el('span', { color: C.dim }, main);
    ne.textContent = '≠';
    const hu = el('span', { color: C.ink }, main);
    hu.textContent = '100%';

    // 红线盖在 "100%" 上
    const strikeNode = el('div', {
      position: 'absolute', right: '-6px', top: '52%',
      width: '300px', height: '9px',
      background: C.red, opacity: '0',
      transformOrigin: 'left center', borderRadius: '2px',
    }, mainWrap);

    const cap = capType(l, SUB('a7').zh, SUB('a7').en);
    const burst = disperse(l, { n: 22, spread: 320, x: '66%', y: '50%', seed: 33, colors: [C.red, 'rgba(221,47,45,0.5)'] });

    return (t) => {
      const p1 = clamp(t / 0.28);
      top.style.opacity = String(eOut(p1) * 0.9);
      top.style.transform = `translateY(${((1 - eOut(p1)) * 16).toFixed(1)}px)`;

      const p2 = clamp((t - 0.16) / 0.32);
      mainWrap.style.opacity = String(clamp(p2 * 3));
      mainWrap.style.transform = `scale(${lerp(1.28, 1, eOut5(p2)).toFixed(3)})`;
      mainWrap.style.filter = p2 < 1 ? `blur(${((1 - p2) * 18).toFixed(1)}px)` : '';

      const p3 = clamp((t - 0.46) / 0.26);
      const e3 = eOut4(p3);
      strikeNode.style.opacity = p3 > 0 ? '1' : '0';
      strikeNode.style.transform = `scaleX(${e3.toFixed(3)}) rotate(-2.4deg)`;
      burst(clamp((t - 0.46) / 0.40));

      cap.type(t, 0.56, 0.56);
    };
  },
};

// ─────────────────────────────────────────── a8：提出真问题
const a8 = {
  build(l) {
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '36px',
      marginTop: '-40px',
    }, l);

    const q1 = el('div', {
      font: `700 118px ${F}`, color: C.ink, letterSpacing: '0.01em',
      opacity: '0', whiteSpace: 'nowrap',
    }, wrap);
    q1.innerHTML = `为什么偏偏停在 <span style="color:${C.gold}">63%</span>？`;

    const q2 = el('div', {
      font: `400 32px ${FN}`, color: C.dim,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      opacity: '0',
    }, wrap);
    q2.textContent = 'Why does it stop at 63?';

    // 三条淡曲线：暗示"不同难度会撞在同一个点"
    const s = svg(1300, 380, l, {
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%) translateY(160px)',
    });
    const paths = [0, 1, 2].map((k) => sEl('path', {
      d: `M20,340 C280,${250 - k * 8} ${470},${120 + k * 22} ${680},${80 + k * 9} C880,${64 + k * 7} 1080,${58 + k * 5} 1280,${56 + k * 4}`,
      ...ST(['rgba(243,196,82,0.28)', 'rgba(242,235,220,0.18)', 'rgba(221,47,45,0.20)'][k], 2.0),
      pathLength: '1', 'stroke-dasharray': '1', 'stroke-dashoffset': '1',
    }, s));

    const cap = capType(l, SUB('a8').zh, SUB('a8').en);
    // 主标题就是这句问句，字幕再写一遍会读成重复
    cap.wrap.style.display = 'none';

    return (t) => {
      const p1 = clamp(t / 0.34);
      q1.style.opacity = String(clamp(p1 * 3));
      q1.style.transform = `translateY(${((1 - eOut4(p1)) * 22).toFixed(1)}px)`;
      q1.style.filter = p1 < 1 ? `blur(${((1 - p1) * 14).toFixed(1)}px)` : '';

      const p2 = clamp((t - 0.26) / 0.30);
      q2.style.opacity = String(eOut(p2) * 0.85);

      paths.forEach((p, k) => {
        const pp = clamp((t - (0.36 + k * 0.06)) / 0.60);
        p.style.strokeDashoffset = String(1 - eOut4(pp));
      });

      cap.type(t, 0.60, 0.52);
    };
  },
};

export const ACT0 = [a1, a2, a3, a4, a5, a6, a7, a8];
