import { C, F, FM, FS, W, H, BEAT, BAR } from '../theme.js';
import { el, mask, maskHTML, prog, eOut, eExpo, eInOut, eBack, clamp, lerp, fmt } from '../kit.js';
import { center, kick, foot, goldRule, g, d, r } from '../ui.js';
import { disperse, motes } from '../particles.js';
import { typeOn, rgbSplit, slideIn, wobble, charOut } from '../text.js';

const SVG = (w, h, p) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('width', String(w));
  s.setAttribute('height', String(h));
  s.style.overflow = 'visible';
  s.style.display = 'block';
  if (p) p.appendChild(s);
  return s;
};
const E = (tag, a, p) => {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in a) n.setAttribute(k, a[k]);
  if (p) p.appendChild(n);
  return n;
};
const ST = (col = C.line, w = 1.5) => ({
  fill: 'none', stroke: col, 'stroke-width': w,
  'stroke-linecap': 'round', 'stroke-linejoin': 'round',
});

function grow(node) {
  const len = node.getTotalLength();
  node.style.strokeDasharray = String(len);
  node.style.strokeDashoffset = String(len);
  return (p) => { node.style.strokeDashoffset = String(len * (1 - clamp(p))); };
}

// ─────────────────────────────────────── 规则：想得起来才算学过
export const S_RULE = {
  id: 'rule',
  start: 16.3474,
  end: 18.3908,
  glow: [0.5, 0.5, 0.6, 0.58],
  exit: 'clock',
  build(l) {
    kick(l, '评审规则 · RULE');

    const wrap = center(l);
    const box = el('div', {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginTop: '-30px',
    }, wrap);

    const l1 = typeOn('它只认一件事', {
      font: `400 56px ${F}`, color: C.dim, letterSpacing: '0.05em',
    }, box, { y: 14, blur: 5 });

    const l2 = typeOn('想得起来，才算学过', {
      font: `700 96px ${F}`, color: C.ink, letterSpacing: '0.02em',
      marginTop: '22px',
    }, box, { y: 40, blur: 12, ease: 'back' });

    foot(l, '评委不接受任何形式的“我看过”');

    this._r = { box, l1, l2 };
  },
  update(t) {
    const { l1, l2 } = this._r;
    l1.set(t, 0.02, 0.55);
    l2.set(t, 0.34, 0.66);
    const p = prog(t, 1.2, 0.6);
    this._r.box.style.transform = `scale(${1 + eInOut(p) * 0.035})`;
  },
};

// ─────────────────────────────────────── 01 熬夜突击
export const S_N1 = {
  id: 'n1',
  start: 18.3908,
  end: 20.4342,
  glow: [0.34, 0.52, 0.52, 0.5],
  exit: 'wipeR',
  build(l) {
    kick(l, '提名 01 · 熬夜突击');

    // 时钟
    const cw = 340;
    const cbox = el('div', {
      position: 'absolute', left: '220px', top: '50%',
      transform: 'translateY(-50%)',
      width: `${cw}px`, height: `${cw}px`,
    }, l);
    const s = SVG(cw, cw, cbox);
    const R = cw / 2 - 8;
    const cx = cw / 2;
    E('circle', { cx, cy: cx, r: R, ...ST(C.line, 1.4) }, s);
    // 刻度
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const long = i % 5 === 0;
      const r1 = R - (long ? 14 : 7);
      E('line', {
        x1: cx + Math.cos(a) * r1, y1: cx + Math.sin(a) * r1,
        x2: cx + Math.cos(a) * (R - 2), y2: cx + Math.sin(a) * (R - 2),
        stroke: long ? 'rgba(150,170,200,0.55)' : 'rgba(150,170,200,0.2)',
        'stroke-width': long ? 1.6 : 1,
      }, s);
    }
    const handH = E('line', { x1: cx, y1: cx, x2: cx, y2: cx - R * 0.52, stroke: C.ink, 'stroke-width': 3.4, 'stroke-linecap': 'round' }, s);
    const handM = E('line', { x1: cx, y1: cx, x2: cx, y2: cx - R * 0.82, stroke: C.ink, 'stroke-width': 2, 'stroke-linecap': 'round' }, s);
    E('circle', { cx, cy: cx, r: 5, fill: C.gold }, s);

    const clockTxt = el('div', {
      position: 'absolute', left: '0', right: '0', bottom: '-58px',
      textAlign: 'center', font: `400 24px ${FM}`,
      color: C.gold, letterSpacing: '0.14em',
    }, cbox);
    clockTxt.textContent = '02:39';

    // 右侧文字
    const rb = el('div', {
      position: 'absolute', left: '760px', top: '50%',
      transform: 'translateY(-50%)',
    }, l);

    const a1 = typeOn('熬夜突击几个小时', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.04em',
    }, rb, { y: 12, blur: 5 });
    const a2 = typeOn('一进考场 ——', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.04em',
      marginTop: '10px',
    }, rb, { y: 12, blur: 5 });
    // 判决句：逐字砸下来 + 色差，参考片里这种转折句都这么处理
    const a3 = typeOn('全忘了', {
      font: `700 128px ${F}`, color: C.gold, letterSpacing: '0.06em',
      marginTop: '18px',
    }, rb, { y: 58, blur: 16, ease: 'back' });

    // 时钟被打散：时间一过，它就散了
    const dust = disperse(l, {
      x: '390px', y: '540px', n: 34, spread: 430, bias: -0.35,
    });

    this._r = { handH, handM, clockTxt, a1, a2, a3, s, cx, R, cbox, dust };
  },
  update(t) {
    const { handH, handM, clockTxt, a1, a2, a3, cbox, dust } = this._r;
    // 02:39 → 03:00：分针正向扫过（多转两圈），时针小幅推进
    const spin = eInOut(prog(t, 0.1, 1.5));
    const mAng = 234 + spin * 846;            // 39 分 → 0 分，正向绕两圈
    handM.setAttribute('transform', `rotate(${mAng} ${this._r.cx} ${this._r.cx})`);
    handH.setAttribute('transform', `rotate(${79.5 + spin * 10.5} ${this._r.cx} ${this._r.cx})`);

    // 时间从 02:39 走到 03:00
    const mins = 159 + spin * 21; // 2:39 = 159min
    const hh = Math.floor(mins / 60) % 24;
    const mm = Math.floor(mins % 60);
    clockTxt.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;

    a1.set(t, 0.06, 0.55);
    a2.set(t, 0.22, 0.55);
    a3.set(t, 1.02, 0.62);

    const pz = prog(t, 1.1, 0.55);
    cbox.style.opacity = String(1 - eInOut(pz) * 0.55);
    cbox.style.filter = `blur(${eInOut(pz) * 1.5}px)`;

    // 与「全忘了」同一拍：钟被吹散
    dust(prog(t, 1.02, 0.95));
  },
};

// ─────────────────────────────────────── 02 划重点
export const S_N2 = {
  id: 'n2',
  start: 20.4342,
  end: 22.4777,
  glow: [0.42, 0.5, 0.54, 0.5],
  exit: 'flipY',
  build(l) {
    kick(l, '提名 02 · 划重点');

    // 一页被划满荧光笔的纸
    const pw = 400, ph = 520;
    const paper = el('div', {
      position: 'absolute', left: '210px', top: '50%',
      transform: 'translateY(-50%)',
      width: `${pw}px`, height: `${ph}px`,
      border: `1px solid ${C.line}`,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.006))',
      boxSizing: 'border-box',
      padding: '34px 30px',
    }, l);

    // 一页真实的手写笔记：先有字，才有笔迹
    const LINES = [
      '第一章 · 记忆的三个环节',
      '编码 —— 存储 —— 提取',
      '短时记忆容量：7 ± 2 个组块',
      '重复阅读 ≠ 学习',
      '提取练习，才是真正的学习',
      '间隔：1 天 / 3 天 / 7 天 / 16 天',
      '遗忘曲线：20 分钟忘掉 42%',
      '主动回忆 = 合上书，自己讲一遍',
      '交错练习 优于 集中练习',
      '睡前复习，睡眠参与巩固',
      '第二章 · 待续',
    ];

    const marks = [];
    const contentW = pw - 60;
    LINES.forEach((line, i) => {
      const row = el('div', {
        position: 'relative', height: '38px',
        display: 'flex', alignItems: 'center',
      }, paper);

      // 荧光笔：半透明宽带，压在字下面
      const hl = el('div', {
        position: 'absolute', left: '-7px', top: '5px', height: '26px',
        width: '0%', background: 'rgba(255,206,86,0.34)',
        borderRadius: '2px',
      }, row);

      // 字在笔迹之上
      const tx = el('div', {
        position: 'relative', font: `400 16px ${F}`,
        color: 'rgba(186,198,214,0.34)', letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }, row);
      tx.textContent = line;

      // 笔迹宽度跟随这行的字数
      const pct = Math.min(100, ((line.length * 16 + 14) / contentW) * 100);
      marks.push({ hl, tx, pct });
    });

    const rb = el('div', {
      position: 'absolute', left: '750px', top: '50%',
      transform: 'translateY(-50%)',
    }, l);

    const a1 = typeOn('划了重点，读了三遍', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.04em',
    }, rb, { y: 12, blur: 5 });
    const a2 = typeOn('感觉，都会了', {
      font: `400 44px ${F}`, color: C.dim, letterSpacing: '0.04em',
      marginTop: '10px',
    }, rb, { y: 12, blur: 5 });

    const numWrap = el('div', { marginTop: '34px', display: 'flex', alignItems: 'flex-end', gap: '14px' }, rb);
    const big = el('div', {
      font: `700 150px ${F}`, color: C.gold, lineHeight: '1',
      letterSpacing: '-0.02em', opacity: '0',
    }, numWrap);
    big.textContent = '0';
    const pct = el('div', {
      font: `700 60px ${F}`, color: C.gold, lineHeight: '1',
      opacity: '0', marginBottom: '20px',
    }, numWrap);
    pct.textContent = '%';

    const sub = el('div', {
      marginTop: '12px', font: `400 26px ${F}`, color: C.sub,
      letterSpacing: '0.06em', opacity: '0',
    }, rb);
    sub.innerHTML = `一周后还记得的：${r('不到一成')}`;

    this._r = { marks, a1, a2, big, pct, sub, paper };
  },
  update(t) {
    const { marks, a1, a2, big, pct, sub } = this._r;

    a1.set(t, 0.04, 0.5);
    a2.set(t, 0.18, 0.5);

    // 荧光笔逐行划过（比字行多出一点，像真笔划过）
    marks.forEach((m, i) => {
      const p = eOut(prog(t, 0.12 + i * 0.062, 0.26));
      m.hl.style.width = `${p * m.pct}%`;
      // 划过的行，字被提亮
      m.tx.style.color = `rgba(226,234,246,${0.34 + p * 0.58})`;
    });

    const pn = prog(t, 0.94, 0.5);
    big.style.opacity = String(eOut(pn));
    pct.style.opacity = String(eOut(prog(t, 1.06, 0.4)));
    big.textContent = String(Math.round(eOut(pn) * 10));
    big.style.transform = `translateY(${(1 - eExpo(pn)) * 16}px)`;
    sub.style.opacity = String(eOut(prog(t, 1.24, 0.45)));
  },
};

// ─────────────────────────────────────── 03 收藏夹
export const S_N3 = {
  id: 'n3',
  start: 22.4777,
  end: 24.5211,
  glow: [0.5, 0.46, 0.56, 0.52],
  exit: 'wipeR',
  build(l) {
    kick(l, '提名 03 · 收藏夹');

    const wrap = center(l);
    const box = el('div', {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginTop: '-40px',
    }, wrap);

    // 计数器
    const cnt = el('div', {
      font: `700 176px ${F}`, color: C.ink, lineHeight: '1',
      letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
    }, box);

    const unit = el('div', {
      marginTop: '6px', font: `400 28px ${F}`, color: C.dim,
      letterSpacing: '0.24em', paddingLeft: '0.24em',
    }, box);
    unit.textContent = '篇文章已收藏';

    // 分隔
    const hr = el('div', {
      width: '2px', height: '0px', background: `linear-gradient(180deg, ${C.line}, transparent)`,
      margin: '40px 0 36px',
    }, box);

    const verdict = maskHTML('打开过的：' + r('0') + ' 篇', {
      font: `700 84px ${F}`, color: C.ink, letterSpacing: '0.02em',
    }, box);

    const sub = el('div', {
      marginTop: '18px', font: `400 26px ${F}`, color: C.sub,
      letterSpacing: '0.08em', opacity: '0',
    }, box);
    sub.textContent = '收藏是一种“我已经学了”的错觉';

    // 收藏的数量感：一层巨大残影压在计数器后面
    const ghost = el('div', {
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      font: `700 520px ${F}`, color: 'rgba(232,180,74,0.045)',
      letterSpacing: '-0.06em', lineHeight: '1',
      whiteSpace: 'nowrap', pointerEvents: 'none',
      opacity: '0',
    }, wrap);
    ghost.textContent = '999';

    // 空气：极淡的微粒上浮，让大片留白不显得死
    const air = motes(wrap, { n: 18, w: 1400, h: 760 });

    this._r = { cnt, hr, verdict, sub, unit, box, ghost, air };
  },
  update(t) {
    const { cnt, hr, verdict, sub, unit, box, ghost, air } = this._r;

    air(t, 0.5);
    const p = eExpo(prog(t, 0.05, 1.05));
    cnt.textContent = fmt(999 * p);
    cnt.style.opacity = String(eOut(prog(t, 0.02, 0.4)));
    unit.style.opacity = String(eOut(prog(t, 0.3, 0.5)));

    // 残影：慢半拍浮起来，然后被压回去
    const pg = prog(t, 0.12, 1.0);
    ghost.style.opacity = String(eOut(pg) * (1 - eInOut(prog(t, 1.02, 0.7)) * 0.85));
    ghost.style.transform =
      `translate(-50%, -50%) scale(${lerp(0.94, 1.05, eOut(pg))})`;

    hr.style.height = `${eOut(prog(t, 0.95, 0.45)) * 78}px`;
    verdict.set(prog(t, 1.06, 0.6), 110);
    sub.style.opacity = String(eOut(prog(t, 1.4, 0.5)));
  },
};

// ─────────────────────────────────────── 04 倍速刷课
export const S_N4 = {
  id: 'n4',
  start: 24.5211,
  end: 26.5645,
  glow: [0.46, 0.54, 0.58, 0.5],
  exit: 'whip',
  build(l) {
    kick(l, '提名 04 · 倍速刷课');

    const wrap = center(l);
    const box = el('div', {
      width: '1040px',
      display: 'flex', flexDirection: 'column',
    }, wrap);

    // 顶部：2.0x 与课程名
    const head = el('div', {
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: '26px',
    }, box);

    const course = el('div', {
      font: `400 30px ${F}`, color: C.dim, letterSpacing: '0.04em',
    }, head);
    course.textContent = '《三小时学会任何东西》';

    const spd = el('div', {
      font: `700 40px ${FM}`, color: C.gold, letterSpacing: '0.04em',
    }, head);
    spd.textContent = '2.0×';

    // 进度条
    const track = el('div', {
      height: '3px', width: '100%', background: 'rgba(150,170,200,0.18)',
      position: 'relative',
    }, box);
    const fill = el('div', {
      position: 'absolute', left: '0', top: '0', bottom: '0', width: '0%',
      background: C.gold,
    }, track);
    const knob = el('div', {
      position: 'absolute', top: '50%', left: '0%',
      width: '13px', height: '13px', marginTop: '-6.5px', marginLeft: '-6.5px',
      background: C.gold, borderRadius: '50%',
      boxShadow: `0 0 18px rgba(232,180,74,0.8)`,
    }, track);

    // 播放头拖尾：比金色填充更亮的一段白热，压在填充之上才看得见
    const trail = el('div', {
      position: 'absolute', top: '50%', left: '0%',
      width: '0px', height: '5px', marginTop: '-2.5px',
      background: 'linear-gradient(90deg, rgba(255,246,224,0) 0%, rgba(255,246,224,0.55) 62%, rgba(255,252,240,0.95) 100%)',
      borderRadius: '3px',
      filter: 'blur(1px)',
      mixBlendMode: 'screen',
    }, track);

    // 进度数字
    const nums = el('div', {
      display: 'flex', justifyContent: 'space-between',
      marginTop: '16px', font: `400 20px ${FM}`, color: C.sub,
      letterSpacing: '0.1em',
    }, box);
    const numL = el('span', {}, nums);
    // 右侧是倒计时，和左侧不重复；播放器习惯的写法
    const numR = el('span', { color: '#414B5E' }, nums);
    numR.textContent = '-3:00:00';

    // 结论
    const res = el('div', {
      marginTop: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, box);

    const t1 = typeOn('看完了，进度条满了', {
      font: `400 46px ${F}`, color: C.dim, letterSpacing: '0.04em',
    }, res, { y: 12, blur: 5 });

    const t2 = typeOn('脑子里一点没动', {
      font: `700 104px ${F}`, color: C.ink, letterSpacing: '0.03em',
      marginTop: '14px',
    }, res, { y: 46, blur: 13, ease: 'back' });

    this._r = { fill, knob, trail, numL, numR, t1, t2, track };
  },
  update(t) {
    const { fill, knob, trail, numL, numR, t1, t2 } = this._r;
    const p = eInOut(prog(t, 0.06, 1.0));
    fill.style.width = `${p * 100}%`;
    knob.style.left = `${p * 100}%`;

    // 拖尾：一小段残影挂在播放头后面，暗示"在飞速掠过"
    const TW = 1040;
    const tail = Math.min(96, p * TW * 0.42);
    trail.style.left = `${Math.max(0, p * TW - tail)}px`;
    trail.style.width = `${tail}px`;

    // 时间码随进度推进：左侧 0:00:00 → 3:00:00，右侧同步倒数到 -0:00:00
    const tc = (v) => {
      const hh = Math.floor(v / 3600);
      const mm = Math.floor((v % 3600) / 60);
      const ss = Math.floor(v % 60);
      return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };
    numL.textContent = tc(p * 10800);
    numR.textContent = '-' + tc((1 - p) * 10800);

    t1.set(t, 0.98, 0.5);
    t2.set(t, 1.14, 0.6);
  },
};

export const ACT1 = [S_RULE, S_N1, S_N2, S_N3, S_N4];
