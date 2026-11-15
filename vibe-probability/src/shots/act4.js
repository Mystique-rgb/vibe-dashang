// 第五幕 · 三个真实场景（bar23 – bar27）
// 抽卡 / 投简历 / 出处 —— 把抽象概率钉到具体经验上
// 版式：左侧图形 + 右侧读数，与对标片的"左右对照"一致

import { C, F, FN, FM, FS, bar } from '../theme.js';
import { el, clamp, eOut, eOut4, eOut5, eInOut, eExpo, eBack, lerp, prog, svg, sEl, ST, rnd } from '../kit.js';
import { kick, kickR, capType, head, foot, g, r, d } from '../ui.js';
import { heroNumber, heroLabel, stamp, circleMark } from '../widgets.js';
import { disperse } from '../particles.js';
import { makeShaker, shockRing, speedLines, endpointBurst } from '../fx.js';
import { SUB } from '../timing.js';

const P = (n, p = 0.02) => (1 - Math.pow(1 - p, n)) * 100;

// ─────────────────────────────────────────── e1：抽卡 2%，50 连
const e1 = {
  build(l) {
    const H = head(l, '抽卡：2% 出货', 'A 2% DROP RATE', { top: 128, size: 50, enSize: 21 });

    // 左侧：5 行 × 10 列 = 50 张卡牌，其中 2 张金
    const CW = 62;   // 卡宽
    const CH = 62;   // 卡高
    const CGAP = 8;
    const left = el('div', {
      position: 'absolute', left: '200px', top: '300px',
      width: `${10 * CW + 9 * CGAP}px`,
      height: `${5 * CH + 4 * CGAP}px`,
    }, l);

    const cards = [];
    for (let i = 0; i < 50; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const c = el('div', {
        position: 'absolute',
        left: `${col * (CW + CGAP)}px`,
        top: `${row * (CH + CGAP)}px`,
        width: `${CW}px`, height: `${CH}px`,
        borderRadius: '3px',
        background: 'rgba(242,235,220,0.06)',
        border: '1px solid rgba(242,235,220,0.09)',
        opacity: '0',
        willChange: 'transform, opacity',
      }, left);
      cards.push(c);
    }

    // 右侧：读数
    const right = el('div', {
      position: 'absolute', right: '180px', top: '350px',
      textAlign: 'right',
    }, l);
    const rLab = el('div', {
      font: `500 26px ${FM}`, color: C.dim, letterSpacing: '0.18em',
      opacity: '0',
    }, right);
    rLab.textContent = '50 连至少出货一次';
    const rVal = el('div', {
      font: `700 148px ${FN}`, color: C.gold, lineHeight: '1.05',
      letterSpacing: '-0.02em', opacity: '0',
    }, right);
    rVal.textContent = '63.6%';

    // 左下：换算
    const note = el('div', {
      position: 'absolute', left: '200px', top: '790px',
      font: `400 30px ${F}`, color: C.dim, letterSpacing: '0.04em',
      opacity: '0',
    }, l);
    note.innerHTML = `0.98<sup style="font-size:0.7em">50</sup> = 0.364　→　失败率 36.4%`;

    const cap = capType(l, SUB('e1').zh, SUB('e1').en, { bottom: 84 });
    const burst = disperse(l, { n: 20, spread: 300, x: '72%', y: '44%', seed: 51 });

    return (t) => {
      // 卡牌：0.06 – 0.52 逐张翻开（横向扫）
      for (let i = 0; i < 50; i++) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const ord = row * 10 + col;
        const p = clamp((t - 0.06 - (ord / 49) * 0.42) / 0.12);
        const e = eOut4(p);
        const isWin = (i === 12 || i === 37);
        cards[i].style.opacity = String(e * 0.95);
        cards[i].style.transform = `translateY(${((1 - e) * 18).toFixed(1)}px) scale(${lerp(0.82, 1, e).toFixed(3)})`;
        if (isWin && p > 0.5) {
          cards[i].style.background = C.gold;
          cards[i].style.border = `1px solid ${C.gold}`;
          cards[i].style.boxShadow = '0 0 34px 8px rgba(243,196,82,0.38)';
        }
      }

      const p2 = clamp((t - 0.46) / 0.28);
      const e2 = eOut5(p2);
      rVal.style.opacity = String(clamp(p2 * 3));
      rVal.style.transform = `scale(${lerp(1.2, 1, e2).toFixed(3)})`;
      rLab.style.opacity = String(eOut(clamp((t - 0.50) / 0.24)) * 0.9);

      note.style.opacity = String(eOut(clamp((t - 0.68) / 0.28)) * 0.9);

      burst(clamp((t - 0.44) / 0.36));
      cap.type(t, 0.30, 0.56);
    };
  },
};

// ─────────────────────────────────────────── e2：100 连 86.7%，229 连 99%
const e2 = {
  build(l) {
    const H = head(l, '连抽次数 × 出货概率', 'PULLS VERSUS ODDS', { top: 128, size: 50, enSize: 21 });

    // 三行横向条
    const rows = [
      { lab: '50 连', en: '50 PULLS', v: 63.58 },
      { lab: '100 连', en: '100 PULLS', v: 86.74 },
      { lab: '229 连', en: '229 PULLS', v: 99.02 },
    ].map((o, k) => {
      const wrap = el('div', {
        position: 'absolute', left: '260px', top: `${340 + k * 180}px`,
        width: '1400px',
      }, l);

      const lab = el('div', {
        position: 'absolute', left: '0', top: '-6px',
        display: 'flex', alignItems: 'baseline', gap: '16px',
      }, wrap);
      const a = el('div', { font: `600 44px ${F}`, color: C.ink }, lab);
      a.textContent = o.lab;
      const b = el('div', {
        font: `400 21px ${FN}`, color: C.dim, letterSpacing: '0.14em',
      }, lab);
      b.textContent = o.en;

      const track = el('div', {
        position: 'absolute', left: '0', top: '56px',
        width: '1000px', height: '54px',
        background: 'rgba(242,235,220,0.05)',
        overflow: 'hidden', borderRadius: '2px',
      }, wrap);
      const fill = el('div', {
        position: 'absolute', left: '0', top: '0', bottom: '0',
        width: '0%',
        background: k === 2 ? C.gold : `rgba(243,196,82,${0.62 + k * 0.14})`,
        borderRadius: '2px',
      }, track);

      const val = el('div', {
        position: 'absolute', right: '0', top: '42px',
        width: '300px', textAlign: 'right',
        font: `700 72px ${FN}`, letterSpacing: '-0.02em',
        color: k === 2 ? C.gold : C.ink,
        fontVariantNumeric: 'tabular-nums',
      }, wrap);
      val.textContent = '0%';

      return { wrap, lab, track, fill, val, v: o.v, k };
    });

    const cap = capType(l, SUB('e2').zh, SUB('e2').en, { bottom: 84 });

    // ── 标记 #12：三个进度条加光效，到达端点用动效 ──────────
    // 条内跑一个光斑；到达端点时按行爆一次（第三行最重）
    const heads = rows.map((row, k) => {
      const c = [C.gold, C.gold, C.gold][k];
      const head = el('div', {
        position: 'absolute', left: '0', top: '0', bottom: '0',
        width: '110px',
        background: `linear-gradient(to right, rgba(255,248,228,0) 0%, ${c} 60%, rgba(255,248,228,0.95) 100%)`,
        filter: 'blur(1.4px)', opacity: '0', pointerEvents: 'none',
        willChange: 'left, opacity',
      }, row.track);
      const bloom = el('div', {
        position: 'absolute', left: '0', top: '-16px', bottom: '-16px',
        width: '220px',
        background: `radial-gradient(ellipse at center, ${c} 0%, rgba(0,0,0,0) 70%)`,
        opacity: '0', pointerEvents: 'none',
        willChange: 'left, opacity',
      }, row.track);
      return { head, bloom };
    });
    // 端点坐标：left=260, track 宽 1000, top = 340 + k*180 + 56 + 27
    const booms = rows.map((row, k) => {
      const x = (260 + (row.v / 100) * 1000) / 1920;
      const y = (340 + k * 180 + 56 + 27) / 1080;
      return endpointBurst(l, {
        x, y, color: C.gold,
        size: k === 2 ? 260 : 170,
        sparks: k === 2 ? 15 : 8,
        seed: 71 + k * 6,
      });
    });
    const shake = makeShaker([0.52, 0.74, 0.96], { amp: 8, dur: 0.20, freq: 27, rot: 0.10 });

    // 每行自己的离散台阶：条可以连续长，数字只落在台阶上
    const STAGES = [
      [0, 15.9, 31.8, 47.7, 63.6],
      [0, 21.7, 43.4, 65.1, 86.7],
      [0, 24.8, 49.5, 74.3, 99.0],
    ];

    return (t) => {
      rows.forEach((row, k) => {
        const p = clamp((t - 0.08 - k * 0.22) / 0.44);
        const e = eOut4(p);
        row.fill.style.width = `${(row.v * e).toFixed(2)}%`;
        // 光斑跟条头走
        const x = (row.v / 100) * 1000 * e;
        const hd = heads[k];
        hd.head.style.left = `${(x - 110).toFixed(1)}px`;
        hd.bloom.style.left = `${(x - 110).toFixed(1)}px`;
        const run = Math.sin(Math.PI * clamp(p)) ** 1.4;
        hd.head.style.opacity = String(clamp(p * 6) * run * 1.05);
        hd.bloom.style.opacity = String(clamp(p * 6) * run * 0.60);
        // 数字必须和条长用同一个 e 分档：否则会出现
        // "条已经满格、数字还停在 49.5%" 这种自相矛盾
        const st = STAGES[k];
        const idx = Math.min(st.length - 1, Math.floor(e * (st.length - 1) + 0.0001));
        row.val.textContent = `${st[idx].toFixed(1)}%`;
        row.wrap.style.opacity = String(clamp(p * 4 + 0.35));
        if (k === 2 && p >= 0.999) row.val.style.color = C.gold;
      });

      // 三行到达端点各爆一次
      booms.forEach((fn, k) => fn(clamp((t - (0.52 + k * 0.22)) / (k === 2 ? 0.50 : 0.32)), k === 2 ? 1.0 : 0.65));
      // 轻微震动只加在数字列
      const sh = shake(t);
      if (sh) rows.forEach((row) => { row.val.style.transform = sh; });

      cap.type(t, 0.28, 0.54);
    };
  },
};

// ─────────────────────────────────────────── e3：投 50 家，约 32 家有回音
const e3 = {
  build(l) {
    const H = head(l, '投 50 份简历', 'FIFTY APPLICATIONS', { top: 128, size: 50, enSize: 21 });

    // 左：50 个小方块代表 50 家公司，32 个亮（有回音）
    const SS = 52;
    const SG = 12;
    const grid = el('div', {
      position: 'absolute', left: '200px', top: '310px',
      width: `${10 * SS + 9 * SG}px`,
      height: `${5 * SS + 4 * SG}px`,
    }, l);

    const cells = [];
    for (let i = 0; i < 50; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const c = el('div', {
        position: 'absolute',
        left: `${col * (SS + SG)}px`,
        top: `${row * (SS + SG)}px`,
        width: `${SS}px`, height: `${SS}px`,
        borderRadius: '2px',
        background: 'rgba(242,235,220,0.06)',
        border: '1px solid rgba(242,235,220,0.09)',
        opacity: '0',
        willChange: 'transform, opacity',
      }, grid);
      cells.push(c);
    }

    const right = el('div', {
      position: 'absolute', right: '170px', top: '350px',
      textAlign: 'right',
    }, l);
    const rLab = el('div', {
      font: `500 26px ${FM}`, color: C.dim, letterSpacing: '0.18em', opacity: '0',
    }, right);
    rLab.textContent = '至少一家有回音';
    const rVal = el('div', {
      font: `700 156px ${FN}`, color: C.gold, lineHeight: '1.05',
      letterSpacing: '-0.02em', opacity: '0',
    }, right);
    rVal.textContent = '63.6%';

    const note = el('div', {
      position: 'absolute', left: '200px', top: '800px',
      font: `400 30px ${F}`, color: C.dim, opacity: '0',
    }, l);
    note.innerHTML = `≈ 32 家会回你　<span style="color:${C.faint}">（50 × 63.6% ≈ 31.8）</span>`;

    const cap = capType(l, SUB('e3').zh, SUB('e3').en, { bottom: 84 });

    return (t) => {
      // 网格必须尽快起来：前一镜是"差的不是运气"，切进来时不能空屏
      const lit = clamp(t / 0.46);
      for (let i = 0; i < 50; i++) {
        const p = clamp((lit - (i / 49) * 0.62) / 0.30);
        const e = eOut4(p);
        cells[i].style.opacity = String(e * 0.95);
        cells[i].style.transform = `scale(${lerp(0.55, 1, e).toFixed(3)})`;
        if (i < 32 && p > 0.4) {
          cells[i].style.background = `rgba(243,196,82,${0.28 + (i / 32) * 0.6})`;
          cells[i].style.border = `1px solid rgba(243,196,82,0.55)`;
        }
      }

      const p2 = clamp((t - 0.56) / 0.30);
      const e2 = eOut5(p2);
      rVal.style.opacity = String(clamp(p2 * 3));
      rVal.style.transform = `scale(${lerp(1.16, 1, e2).toFixed(3)})`;
      rLab.style.opacity = String(eOut(clamp((t - 0.60) / 0.24)) * 0.9);
      note.style.opacity = String(eOut(clamp((t - 0.84) / 0.28)) * 0.9);

      cap.type(t, 0.30, 0.58);
    };
  },
};

// ─────────────────────────────────────────── e4：出处
const e4 = {
  build(l) {
    const wrap = el('div', {
      position: 'absolute', inset: '0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '24px',
    }, l);

    const q = el('div', {
      font: `400 46px ${F}`, color: C.ink2, letterSpacing: '0.06em',
      opacity: '0', textAlign: 'center', lineHeight: '1.7',
    }, wrap);
    q.innerHTML = '「把不确定的事，重复足够多次，<br>结果会收敛到一个可算的数。」';

    const rule = el('div', {
      width: '0px', height: '1px',
      background: C.gold, opacity: '0.6',
      marginTop: '10px',
    }, wrap);

    const who = el('div', {
      font: `600 38px ${F}`, color: C.gold, letterSpacing: '0.06em',
      opacity: '0',
    }, wrap);
    who.textContent = '雅各布·伯努利';

    const src = el('div', {
      font: `400 26px ${FN}`, color: C.dim, letterSpacing: '0.14em',
      opacity: '0',
    }, wrap);
    src.textContent = 'JACOB BERNOULLI · ARS CONJECTANDI · 1713';

    // 出处卡片本身就是字幕，再叠一条会重复说"伯努利 1713"
    const cap = capType(l, SUB('e4').zh, SUB('e4').en, { bottom: 84 });
    cap.wrap.style.display = 'none';

    return (t) => {
      const p1 = clamp(t / 0.26);
      q.style.opacity = String(clamp(p1 * 2.6));
      q.style.transform = `translateY(${((1 - eOut4(p1)) * 20).toFixed(1)}px)`;

      const p2 = clamp((t - 0.40) / 0.30);
      rule.style.width = `${(eOut4(p2) * 380).toFixed(1)}px`;
      rule.style.opacity = String(eOut(p2) * 0.6);

      const p3 = clamp((t - 0.52) / 0.28);
      who.style.opacity = String(clamp(p3 * 3));
      who.style.transform = `translateY(${((1 - eOut4(p3)) * 12).toFixed(1)}px)`;

      const p4 = clamp((t - 0.68) / 0.30);
      src.style.opacity = String(eOut(p4) * 0.85);

    };
  },
};

export const ACT4 = { e1, e2, e3, e4 };
