import { C, F, FM, BAR } from '../theme.js';
import { el, mask, maskHTML, prog, eOut, eExpo, eInOut, eBack, clamp, lerp } from '../kit.js';
import { center, kick, foot, goldRule, g, d, r } from '../ui.js';
import { typeOn, rgbSplit, slideIn, wobble, charOut } from '../text.js';
import { SVG, E, ST, grow } from '../svgkit.js';

// ───────────────────────────── 融入日常：一天的三个时间点
// 把"主动回忆 + 间隔重复"翻译成真实生活里的三个动作
const SLOTS = [
  { t: '早上 8:40', place: '地铁上', act: '合上书，回想昨天学的三件事', note: '想不起来的，记下来', icon: 0 },
  { t: '午休 12:30', place: '工位', act: '把记下的那几条，再看一遍', note: '只看没想起来的', icon: 1 },
  { t: '睡前 23:10', place: '床上', act: '用一句话讲给家人听', note: '讲得出，才是真会了', icon: 2 },
];

function slotIcon(i, parent) {
  const s = SVG(48, 48, parent);
  const st = { fill: 'none', stroke: C.gold, 'stroke-width': 1.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (i === 0) {
    // 地铁 / 通勤
    E('rect', { x: 11, y: 10, width: 26, height: 24, rx: 5, ...st }, s);
    E('path', { d: 'M18 34 L14 40 M30 34 L34 40', ...st }, s);
    E('path', { d: 'M17 18 L31 18', ...st }, s);
    E('circle', { cx: 18, cy: 27, r: 1.8, fill: C.gold }, s);
    E('circle', { cx: 30, cy: 27, r: 1.8, fill: C.gold }, s);
  } else if (i === 1) {
    // 工位 / 桌面
    E('rect', { x: 10, y: 13, width: 28, height: 17, rx: 2, ...st }, s);
    E('path', { d: 'M8 34 L40 34', ...st }, s);
    E('path', { d: 'M24 30 L24 34', ...st }, s);
  } else {
    // 睡前 / 说话
    E('path', { d: 'M12 15 H36 V30 H24 L18 36 V30 H12 Z', ...st }, s);
    E('path', { d: 'M18 21 H30 M18 25 H26', ...st }, s);
  }
}

export const S_DAILY = {
  id: 'daily',
  start: 51.0856,
  end: 55.1724,
  glow: [0.5, 0.5, 0.66, 0.58],
  exit: 'wipeU',
  build(l) {
    kick(l, '融入日常 · IN REAL LIFE');

    // 左：一天的三个时间点
    const left = el('div', {
      position: 'absolute', left: '150px', top: '50%',
      transform: 'translateY(-50%)',
      width: '900px',
      display: 'flex', flexDirection: 'column',
    }, l);

    // 竖向时间线
    const spine = el('div', {
      position: 'absolute', left: '23px', top: '40px',
      width: '1px', height: '0px',
      background: 'linear-gradient(180deg, rgba(232,180,74,0.55), rgba(232,180,74,0.18) 60%, rgba(232,180,74,0))',
    }, left);

    const rows = SLOTS.map((s, i) => {
      const row = el('div', {
        position: 'relative',
        display: 'flex', alignItems: 'flex-start', gap: '30px',
        paddingBottom: i < 2 ? '56px' : '0px',
        opacity: '0',
      }, left);

      const dotWrap = el('div', {
        position: 'relative', width: '48px', height: '48px', flex: '0 0 48px',
        display: 'grid', placeItems: 'center',
      }, row);

      const dotBg = el('div', {
        position: 'absolute', inset: '0',
        borderRadius: '50%',
        background: 'rgba(232,180,74,0.10)',
        border: '1px solid rgba(232,180,74,0.34)',
        transform: 'scale(0.4)',
      }, dotWrap);
      slotIcon(s.icon, dotWrap);

      const body = el('div', {
        display: 'flex', flexDirection: 'column', paddingTop: '1px',
      }, row);

      const head = el('div', {
        display: 'flex', alignItems: 'baseline', gap: '16px',
      }, body);

      const tm = el('div', {
        font: `500 19px ${FM}`, color: C.gold, letterSpacing: '0.14em',
      }, head);
      tm.textContent = s.t;

      const pl = el('div', {
        font: `400 18px ${F}`, color: '#5B6678', letterSpacing: '0.12em',
      }, head);
      pl.textContent = s.place;

      const act = el('div', {
        marginTop: '12px', font: `700 42px ${F}`, color: C.ink,
        letterSpacing: '0.02em', lineHeight: '1.32',
      }, body);
      act.textContent = s.act;

      const note = el('div', {
        marginTop: '8px', font: `400 22px ${F}`, color: C.sub,
        letterSpacing: '0.06em', opacity: '0',
      }, body);
      note.textContent = s.note;

      return { row, dotBg, note };
    });

    // 右侧：一句话总结
    const right = el('div', {
      position: 'absolute', right: '150px', top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      textAlign: 'right',
    }, l);

    const rk = el('div', {
      font: `500 17px ${FM}`, color: C.gold, letterSpacing: '0.34em',
      paddingRight: '0.34em', opacity: '0',
    }, right);
    rk.textContent = 'THE POINT';

    const r1 = el('div', {
      marginTop: '18px', font: `400 30px ${F}`, color: C.dim,
      letterSpacing: '0.06em', lineHeight: '1.7', opacity: '0',
    }, right);
    r1.innerHTML = '不用多花时间，<br>只要换个动作。';

    const r2 = maskHTML('学完，' + g('立刻想一遍'), {
      font: `700 62px ${F}`, color: C.ink, letterSpacing: '0.03em',
      marginTop: '22px',
    }, right);

    this._r = { rows, spine, rk, r1, r2 };
  },
  update(t) {
    const { rows, spine, rk, r1, r2 } = this._r;

    spine.style.height = `${eOut(prog(t, 0.1, 1.0)) * 330}px`;

    rows.forEach((rw, i) => {
      const st = 0.12 + i * 0.26;
      const p = prog(t, st, 0.6);
      rw.row.style.opacity = String(eOut(p));
      rw.row.style.transform = `translateX(${(1 - eExpo(p)) * -26}px)`;
      rw.dotBg.style.transform = `scale(${0.4 + eBack(prog(t, st + 0.1, 0.55)) * 0.6})`;
      rw.note.style.opacity = String(eOut(prog(t, st + 0.42, 0.5)));
    });

    rk.style.opacity = String(eOut(prog(t, 1.02, 0.45)));
    r1.style.opacity = String(eOut(prog(t, 1.14, 0.5)));
    r2.set(prog(t, 1.34, 0.7), 108);
  },
};

// ───────────────────────────── 复习节拍：1 / 3 / 7 / 16 天
// m2 给的是曲线，这里给的是"你日历上要标的四天"
const DAYS = [
  { d: 1, label: '第 1 天', note: '当天晚上' },
  { d: 3, label: '第 3 天', note: '两天后' },
  { d: 7, label: '第 7 天', note: '一周后' },
  { d: 16, label: '第 16 天', note: '半个月后' },
];

export const S_CALENDAR = {
  id: 'calendar',
  start: 55.1724,
  end: 58.2375,
  glow: [0.46, 0.52, 0.62, 0.58],
  exit: 'wipeL',
  build(l) {
    kick(l, '复习节拍 · 1 / 3 / 7 / 16');

    const N = 16;
    const CW2 = 62, GAP2 = 12;
    const totalW = N * CW2 + (N - 1) * GAP2;

    const track = el('div', {
      position: 'absolute', left: '50%', top: '300px',
      transform: 'translateX(-50%)',
      display: 'flex', gap: `${GAP2}px`,
    }, l);

    const cells = [];
    for (let i = 0; i < N; i++) {
      const cell = el('div', {
        width: `${CW2}px`, height: `${CW2}px`,
        border: '1px solid rgba(150,170,200,0.16)',
        borderRadius: '3px',
        background: 'rgba(255,255,255,0.012)',
        position: 'relative',
        display: 'grid', placeItems: 'center',
        boxSizing: 'border-box',
      }, track);
      const dn = el('div', {
        font: `400 15px ${FM}`, color: '#3E4759', letterSpacing: '0.04em',
      }, cell);
      dn.textContent = String(i + 1);

      const mark = el('div', {
        position: 'absolute', inset: '0',
        borderRadius: '3px',
        background: 'rgba(232,180,74,0.16)',
        border: `1px solid ${C.gold}`,
        opacity: '0',
      }, cell);

      const check = el('div', {
        position: 'absolute', left: '50%', top: '50%',
        width: '22px', height: '22px', opacity: '0',
        transform: 'translate(-50%,-50%)',
      }, cell);
      check.innerHTML = `<svg width="22" height="22" viewBox="0 0 22 22" style="display:block">
        <path d="M4 11.5 L9 16.5 L18 5.5" fill="none" stroke="#E8B44A" stroke-width="2.2"
              stroke-linecap="round" stroke-linejoin="round"/></svg>`;

      cells.push({ cell, dn, mark, check });
    }

    // 复习日标注
    const labels = el('div', {
      position: 'absolute', left: '50%', top: '386px',
      transform: 'translateX(-50%)',
      width: `${totalW}px`, height: '80px',
    }, l);

    const labs = DAYS.map((dd) => {
      const x = (dd.d - 1) * (CW2 + GAP2) + CW2 / 2;
      const box = el('div', {
        position: 'absolute', left: `${x}px`, top: '0',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: '0',
      }, labels);
      el('div', { width: '1px', height: '22px', background: 'rgba(232,180,74,0.4)' }, box);
      const tt = el('div', {
        marginTop: '12px', font: `500 18px ${F}`, color: C.gold,
        letterSpacing: '0.08em', whiteSpace: 'nowrap',
      }, box);
      tt.textContent = dd.label;
      const nt = el('div', {
        marginTop: '6px', font: `400 17px ${F}`, color: '#5B6678',
        letterSpacing: '0.06em', whiteSpace: 'nowrap',
      }, box);
      nt.textContent = dd.note;
      return box;
    });

    // 文案
    const below = el('div', {
      position: 'absolute', left: '0', right: '0', top: '540px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, l);

    const t1 = typeOn('不用天天复习', {
      font: `400 50px ${F}`, color: C.dim, letterSpacing: '0.06em',
    }, below, { y: 18, blur: 7 });

    const t2 = maskHTML('只要在' + g('快忘的时候') + '，回来一次', {
      font: `700 84px ${F}`, color: C.ink, letterSpacing: '0.03em',
      marginTop: '10px',
    }, below);

    const t3 = el('div', {
      marginTop: '24px', font: `400 23px ${F}`, color: C.sub,
      letterSpacing: '0.1em', opacity: '0',
    }, below);
    t3.textContent = '四次之后，它就留在你脑子里了';

    this._r = { cells, labs, t1, t2, t3 };
  },
  update(t) {
    const { cells, labs, t1, t2, t3 } = this._r;

    const hits = DAYS.map((dd) => dd.d - 1);

    cells.forEach((c, i) => {
      const pin = eOut(prog(t, 0.03 + i * 0.03, 0.4));
      c.cell.style.opacity = String(pin);
      c.cell.style.transform = `translateY(${(1 - pin) * 14}px)`;

      const hi = hits.indexOf(i);
      if (hi >= 0) {
        const ph = prog(t, 0.6 + hi * 0.19, 0.45);
        c.mark.style.opacity = String(clamp(ph * 1.6));
        c.mark.style.transform = `scale(${0.7 + eBack(ph) * 0.3})`;
        c.check.style.opacity = String(eOut(prog(t, 0.76 + hi * 0.19, 0.4)));
        c.dn.style.color = ph > 0.3 ? C.gold : '#3E4759';
      }
    });

    labs.forEach((b, i) => {
      const p = eOut(prog(t, 0.78 + i * 0.19, 0.45));
      b.style.opacity = String(p);
      b.style.transform = `translateX(-50%) translateY(${(1 - p) * -10}px)`;
    });

    t1.set(t, 1.58, 0.5);
    t2.set(prog(t, 1.74, 0.58), 112);
    t3.style.opacity = String(eOut(prog(t, 2.34, 0.45)));
  },
};

export const ACT5 = [S_DAILY, S_CALENDAR];
