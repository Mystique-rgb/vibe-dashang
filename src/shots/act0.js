import { C, F, FM, FS, W, H, BEAT, BAR } from '../theme.js';
import { el, mask, maskHTML, prog, eOut, eExpo, eInOut, eBack, eSine, clamp, lerp } from '../kit.js';
import { center, kick, foot, goldRule, g, d, r } from '../ui.js';
import { typeOn, rgbSplit, slideIn, wobble, charOut } from '../text.js';

const GLYPH = (w, h, parent) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', `0 0 ${w} ${h}`);
  s.setAttribute('width', String(w));
  s.setAttribute('height', String(h));
  s.style.overflow = 'visible';
  s.style.display = 'block';
  if (parent) parent.appendChild(s);
  return s;
};
const P = (tag, a, parent) => {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in a) n.setAttribute(k, a[k]);
  if (parent) parent.appendChild(n);
  return n;
};

const CARD_W = 306;
const CARD_H = 408;
const GAP = 46;

// 纸面上的柔光：把"实景"从纯平面拉出来
function paperLight(parent, css = {}) {
  const n = el('div', {
    position: 'absolute', pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 34% 22%, rgba(255,252,242,0.10), rgba(255,250,238,0.028) 46%, rgba(255,250,238,0) 72%)',
    ...css,
  }, parent);
  return n;
}

// ───────────────────────────────────────────── 00 考场实景
export const S_EXAM = {
  id: 'exam',
  start: 0.0,
  end: 2.0434,
  glow: [0.4, 0.44, 0.74, 0.62],
  exit: 'scaleOut',
  build(l) {
    // 边注让到纸面之上：纸从 top:72 起，标签压在纸上会糊成一团
    const k = kick(l, '考场 · 第 07 题');
    k.style.left = '152px';
    k.style.top = '36px';

    // 桌面：下方一条极淡的台面反光
    const desk = el('div', {
      position: 'absolute', left: '0', right: '0', bottom: '0', height: '150px',
      background: 'linear-gradient(180deg, rgba(58,78,112,0) 0%, rgba(58,78,112,0.16) 62%, rgba(20,28,44,0.30) 100%)',
    }, l);
    const deskEdge = el('div', {
      position: 'absolute', left: '0', right: '0', bottom: '150px', height: '1px',
      background: 'linear-gradient(90deg, rgba(150,170,200,0) 0%, rgba(150,170,200,0.22) 22%, rgba(150,170,200,0.22) 78%, rgba(150,170,200,0) 100%)',
    }, l);

    // 试卷
    const PW = 748, PH = 928;
    const paper = el('div', {
      position: 'absolute', left: '150px', top: '72px',
      width: `${PW}px`, height: `${PH}px`,
      boxSizing: 'border-box',
      padding: '54px 56px',
      border: '1px solid rgba(150,170,200,0.26)',
      background: 'linear-gradient(168deg, rgba(248,248,242,0.055) 0%, rgba(226,230,238,0.020) 42%, rgba(255,255,255,0.008) 100%)',
      transform: 'rotate(-1.4deg)',
      boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
    }, l);
    paperLight(paper, { left: '-10%', top: '-14%', width: '90%', height: '70%' });

    // 页眉
    const hd = el('div', {
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      font: `400 19px ${F}`, color: C.sub, letterSpacing: '0.12em',
    }, paper);
    const hdL = el('span', {}, hd); hdL.textContent = '期中测验 · 语文';
    const hdR = el('span', { font: `400 16px ${FM}`, color: '#3D4658', letterSpacing: '0.1em' }, hd);
    hdR.textContent = '第 2 页 / 共 4 页';

    const hr1 = el('div', {
      height: '1px', background: 'rgba(150,170,200,0.20)', margin: '18px 0 30px',
    }, paper);

    // 题号 + 题干
    const noWrap = el('div', { display: 'flex', alignItems: 'baseline', gap: '18px' }, paper);
    const no = el('div', {
      font: `500 17px ${FM}`, color: C.gold, letterSpacing: '0.22em',
    }, noWrap);
    no.textContent = '07';
    const noLine = el('div', {
      flex: '1', height: '1px', background: 'rgba(232,180,74,0.22)', marginBottom: '6px',
    }, noWrap);

    const q = el('div', {
      marginTop: '20px', font: `400 27px ${F}`, color: '#B9C4D4',
      letterSpacing: '0.02em', lineHeight: '1.66',
    }, paper);
    q.textContent = '默写《岳阳楼记》中描写洞庭湖景色的句子。';

    // 答题横线
    const linesBox = el('div', {
      position: 'relative', marginTop: '34px',
      display: 'flex', flexDirection: 'column', gap: '54px',
    }, paper);
    const rlines = [];
    for (let i = 0; i < 7; i++) {
      rlines.push(el('div', {
        height: '1px', background: 'rgba(150,170,200,0.13)',
        width: '100%',
      }, linesBox));
    }

    // 写了一半就断掉的答案
    const written = el('div', {
      position: 'absolute', left: '0', top: '-40px',
      font: `400 27px ${F}`, color: 'rgba(214,222,234,0.82)',
      letterSpacing: '0.06em', whiteSpace: 'nowrap',
    }, linesBox);
    const wA = el('span', {}, written); wA.textContent = '浩浩汤汤，横无';
    const wB = el('span', { color: 'rgba(214,222,234,0.20)' }, written); wB.textContent = '际';
    const wC = el('span', { color: 'rgba(214,222,234,0.06)' }, written); wC.textContent = '涯';

    // 笔尖断掉处的一点墨
    const blot = el('div', {
      position: 'absolute', left: '300px', top: '-33px',
      width: '0px', height: '9px', borderRadius: '50%',
      background: 'rgba(24,32,48,0.55)',
      filter: 'blur(0.4px)',
    }, linesBox);

    // 笔
    const pen = el('div', {
      position: 'absolute', left: '486px', top: '628px',
      width: '300px', height: '11px',
      transform: 'rotate(38deg)', transformOrigin: 'left center',
      background: 'linear-gradient(90deg, #232B3A 0%, #3B4658 62%, #6E7A8E 100%)',
      borderRadius: '1px',
      boxShadow: '0 14px 26px rgba(0,0,0,0.45)',
    }, l);
    const nib = el('div', {
      position: 'absolute', left: '-26px', top: '1px',
      width: '0', height: '0',
      borderTop: '4.5px solid transparent',
      borderBottom: '4.5px solid transparent',
      borderRight: '26px solid #C6CEDA',
    }, pen);

    // 右侧：剩余时间
    const clockBox = el('div', {
      position: 'absolute', right: '150px', top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    }, l);

    const cLab = el('div', {
      font: `500 17px ${FM}`, color: C.gold, letterSpacing: '0.3em',
      paddingRight: '0.3em', opacity: '0',
    }, clockBox);
    cLab.textContent = '剩余时间';

    const cNum = el('div', {
      marginTop: '10px', font: `700 96px ${FM}`, color: C.ink,
      letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums',
      lineHeight: '1', opacity: '0',
    }, clockBox);
    cNum.textContent = '02:47';

    const cRule = el('div', {
      width: '0px', height: '1px', marginTop: '22px',
      background: 'linear-gradient(90deg, rgba(232,180,74,0), rgba(232,180,74,0.6))',
    }, clockBox);

    const cSub = el('div', {
      marginTop: '18px', font: `400 21px ${F}`, color: C.sub,
      letterSpacing: '0.1em', opacity: '0', textAlign: 'right', lineHeight: '1.9',
    }, clockBox);
    cSub.innerHTML = '考场里，<br>时间比知识走得快。';

    this._r = { paper, pen, nib, clockBox, cLab, cNum, cRule, cSub, written, wB, wC, blot, desk, deskEdge, rlines };
  },
  update(t) {
    const { paper, pen, clockBox, cLab, cNum, cRule, cSub, wB, wC, blot, rlines } = this._r;

    // 纸面缓推
    const pp = eInOut(prog(t, 0, 2.05));
    paper.style.transform = `rotate(-1.4deg) scale(${1 + pp * 0.022})`;

    // 笔落位
    const ppen = eExpo(prog(t, 0.28, 0.62));
    pen.style.opacity = String(eOut(prog(t, 0.2, 0.35)));
    pen.style.transform = `rotate(38deg) translateX(${(1 - ppen) * -70}px)`;

    // 字写到一半断掉
    const pw = prog(t, 0.62, 0.42);
    this._r.written.style.opacity = String(eOut(pw));
    wB.style.opacity = String(1 - eOut(prog(t, 1.06, 0.3)) * 0.7);
    wC.style.opacity = String(1 - eOut(prog(t, 1.1, 0.3)));
    blot.style.width = `${eOut(prog(t, 1.12, 0.4)) * 22}px`;
    blot.style.opacity = String(eOut(prog(t, 1.12, 0.4)) * 0.9);

    rlines.forEach((n, i) => {
      n.style.opacity = String(eOut(prog(t, 0.3 + i * 0.05, 0.4)) * 0.9);
    });

    // 时钟
    cLab.style.opacity = String(eOut(prog(t, 0.1, 0.5)));
    cNum.style.opacity = String(eOut(prog(t, 0.16, 0.55)));
    cNum.style.transform = `translateY(${(1 - eExpo(prog(t, 0.16, 0.6))) * 14}px)`;
    cRule.style.width = `${eOut(prog(t, 0.4, 0.5)) * 260}px`;
    cSub.style.opacity = String(eOut(prog(t, 0.62, 0.55)));

    // 整组轻微呼吸，避免死板
    clockBox.style.transform = `translateY(-50%) translateX(${Math.sin(t * 0.9) * 1.2}px)`;
  },
};

// ───────────────────────────────────────────── 01 笔尖悬停 / 一片空白
export const S_BLANK = {
  id: 'blank',
  start: 2.0434,
  end: 4.0868,
  glow: [0.5, 0.5, 0.64, 0.58],
  exit: 'zoomBlur',
  build(l) {
    kick(l, '02:41 · 卡住了');

    // 特写：一条答题线占满画面
    const stage = el('div', {
      position: 'absolute', left: '0', right: '0', top: '50%',
      transform: 'translateY(-50%)', height: '520px',
    }, l);

    const lightPool = paperLight(stage, {
      left: '16%', top: '-40%', width: '68%', height: '170%',
    });

    const line = el('div', {
      position: 'absolute', left: '180px', right: '180px', top: '50%',
      height: '1px', background: 'rgba(150,170,200,0.22)',
    }, stage);

    const line2 = el('div', {
      position: 'absolute', left: '180px', right: '180px', top: 'calc(50% + 76px)',
      height: '1px', background: 'rgba(150,170,200,0.10)',
    }, stage);

    // 光标：在拍子上闪
    const caret = el('div', {
      position: 'absolute', left: '196px', top: 'calc(50% - 30px)',
      width: '3px', height: '52px',
      background: C.gold,
      boxShadow: '0 0 22px rgba(232,180,74,0.75)',
    }, stage);

    // 笔尖
    const nibWrap = el('div', {
      position: 'absolute', left: '196px', top: 'calc(50% - 132px)',
      width: '0', height: '0',
    }, stage);
    const nib = el('div', {
      position: 'absolute', left: '-13px', top: '0',
      width: '0', height: '0',
      borderLeft: '13px solid transparent',
      borderRight: '13px solid transparent',
      borderTop: '30px solid #C6CEDA',
      filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.6))',
    }, nibWrap);
    const barrel = el('div', {
      position: 'absolute', left: '-4.5px', top: '-150px',
      width: '9px', height: '150px',
      background: 'linear-gradient(180deg, #2A3344, #4A5568)',
      borderRadius: '2px',
    }, nibWrap);

    // 文字
    const rb = el('div', {
      position: 'absolute', left: '0', right: '0', bottom: '150px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, l);

    const l1 = mask('上周刚背过', {
      font: `400 46px ${F}`, color: C.dim, letterSpacing: '0.08em',
    }, rb);

    const l2 = maskHTML('一个字都' + d('想不起来'), {
      font: `700 92px ${F}`, color: C.ink, letterSpacing: '0.04em',
      marginTop: '14px',
    }, rb);

    this._r = { stage, lightPool, line, line2, caret, nibWrap, nib, barrel, l1, l2 };
  },
  update(t) {
    const { stage, lightPool, line, line2, caret, nibWrap, l1, l2 } = this._r;

    // 缓慢推近
    const pz = eInOut(prog(t, 0, 2.05));
    stage.style.transform = `translateY(-50%) scale(${1 + pz * 0.06})`;

    const pl = eOut(prog(t, 0.02, 0.5));
    line.style.opacity = String(pl);
    line2.style.opacity = String(eOut(prog(t, 0.12, 0.5)));

    // 笔尖悬停：轻微抖动
    const hov = eOut(prog(t, 0.05, 0.6));
    nibWrap.style.opacity = String(hov);
    const jit = Math.sin(t * 11.0) * 1.6 + Math.sin(t * 5.3) * 2.4;
    nibWrap.style.transform = `translate(${jit}px, ${(1 - hov) * -26 + Math.sin(t * 3.1) * 2.2}px)`;

    // 光标按拍闪
    const beatPhase = (t / BEAT) % 1;
    const blink = beatPhase < 0.5 ? 1 : 0.12;
    caret.style.opacity = String(eOut(prog(t, 0.18, 0.4)) * blink);
    caret.style.transform = `scaleY(${0.86 + 0.14 * blink})`;

    l1.set(prog(t, 0.1, 0.58), 104);
    l2.set(prog(t, 0.62, 0.66), 110);
  },
};

// ───────────────────────────────────────────── 02 复习到凌晨
export const S_REALIZE = {
  id: 'realize',
  start: 4.0868,
  end: 6.1303,
  glow: [0.46, 0.48, 0.7, 0.6],
  exit: 'sweep',
  build(l) {
    kick(l, '回放 · 昨天晚上');

    // 背景：残留的答题线，像还没散掉的画面
    const ghost = el('div', {
      position: 'absolute', left: '0', right: '0', top: '0', bottom: '0',
      background: 'repeating-linear-gradient(180deg, rgba(150,170,200,0.055) 0px, rgba(150,170,200,0.055) 1px, transparent 1px, transparent 92px)',
      opacity: '0',
    }, l);

    const wrap = center(l);
    const box = el('div', {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginTop: '-24px',
    }, wrap);

    const l1 = typeOn('复习到凌晨一点', {
      font: `400 58px ${F}`, color: C.dim, letterSpacing: '0.06em',
    }, box, { y: 16, blur: 6 });

    const l2 = typeOn('每一个字，都划了三遍', {
      font: `400 58px ${F}`, color: C.dim, letterSpacing: '0.06em',
      marginTop: '8px',
    }, box, { y: 16, blur: 6 });

    const rule = goldRule(box, { width: '0px', margin: '38px 0 40px' });

    const l3 = maskHTML('现在，' + d('一个字都想不起来'), {
      font: `700 100px ${F}`, color: C.ink, letterSpacing: '0.03em',
    }, box);

    this._r = { ghost, l1, l2, rule, l3, box };
  },
  update(t) {
    const { ghost, l1, l2, rule, l3, box } = this._r;

    ghost.style.opacity = String(eOut(prog(t, 0.02, 0.7)) * 0.9);

    l1.set(t, 0.04, 0.52);
    l2.set(t, 0.24, 0.52);
    rule.style.width = `${eExpo(prog(t, 0.62, 0.55)) * 300}px`;
    l3.set(prog(t, 0.78, 0.7), 112);

    const pb = eInOut(prog(t, 1.5, 0.6));
    box.style.transform = `scale(${1 + pb * 0.03})`;
  },
};

// ───────────────────────────────────────────── 03 抛出问题
export const S_QUESTION = {
  id: 'question',
  start: 6.1303,
  end: 8.1737,
  glow: [0.5, 0.46, 0.8, 0.64],
  exit: 'irisPt',
  exitOpts: { x: 50, y: 50 },
  build(l) {
    kick(l, 'THE QUESTION');

    const wrap = center(l);

    // 涟漪：一圈圈推开，把问题"打"出去
    const ripples = [];
    for (let i = 0; i < 3; i++) {
      ripples.push(el('div', {
        position: 'absolute', left: '50%', top: '50%',
        width: '620px', height: '620px',
        marginLeft: '-310px', marginTop: '-310px',
        border: '1px solid rgba(232,180,74,0.24)',
        borderRadius: '50%',
        opacity: '0',
      }, wrap));
    }

    const box = el('div', {
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, wrap);

    const l1 = typeOn('为什么复习过的', {
      font: `400 62px ${F}`, color: C.dim, letterSpacing: '0.08em',
    }, box, { y: 14, blur: 6 });

    const row = el('div', {
      display: 'flex', alignItems: 'baseline', marginTop: '16px',
    }, box);

    // 最大的那句：逐字从下方顶上来，每个字带一点旋转
    const l2 = typeOn('还是会忘', {
      font: `700 152px ${F}`, color: C.ink, letterSpacing: '0.04em',
    }, row, { y: 44, blur: 12, ease: 'back' });

    const qm = el('div', {
      font: `700 152px ${F}`, color: C.gold, lineHeight: '1',
      marginLeft: '10px', opacity: '0',
      textShadow: '0 0 46px rgba(232,180,74,0.55)',
      transformOrigin: 'center 62%',
    }, row);
    qm.textContent = '？';
    // 问号一直在轻轻晃——参考片里的「≠」就是这样保持画面活着的
    const qmWobble = wobble(qm, 4.5, 1.75, 0.4);

    const sub = el('div', {
      marginTop: '34px', font: `400 25px ${F}`, color: C.sub,
      letterSpacing: '0.14em', opacity: '0',
    }, box);
    sub.textContent = '记忆不是存进去，就一直在那里';

    this._r = { ripples, l1, l2, qm, qmWobble, sub, box };
  },
  update(t) {
    const { ripples, l1, l2, qm, qmWobble, sub, box } = this._r;

    ripples.forEach((n, i) => {
      const p = prog(t, 0.5 + i * 0.42, 1.35);
      n.style.opacity = String(Math.sin(clamp(p) * Math.PI) * 0.75);
      n.style.transform = `scale(${lerp(0.55, 1.5, eOut(p))})`;
    });

    l1.set(t, 0.03, 0.55);
    l2.set(t, 0.26, 0.62);

    const pq = prog(t, 0.92, 0.55);
    qm.style.opacity = String(eOut(pq));
    // 缩放作为基准变换传进去，摆动会叠在它上面，不会互相覆盖
    const sq = lerp(0.6, 1, eBack(pq));
    qmWobble(t, eOut(pq), `scale(${sq.toFixed(3)})`);

    sub.style.opacity = String(eOut(prog(t, 1.22, 0.55)));

    const pb = eInOut(prog(t, 1.1, 0.9));
    box.style.transform = `scale(${1 + pb * 0.035})`;
  },
};

// ───────────────────────────────────────────── 04 四种努力
export const S_NOMINATE = {
  id: 'nominate',
  start: 8.1737,
  end: 10.2171,
  glow: [0.46, 0.5, 0.66, 0.56],
  exit: 'swipeSkew',
  build(l) {
    kick(l, '你试过的办法 · ATTEMPTS');

    const box = el('div', {
      position: 'absolute', left: '180px', top: '50%',
      transform: 'translateY(-50%)',
    }, l);

    const l1 = mask('于是我们试了', {
      font: `400 54px ${F}`, color: C.dim, letterSpacing: '0.03em',
    }, box);

    const l2 = maskHTML('四种' + g('努力'), {
      font: `700 92px ${F}`, color: C.ink, letterSpacing: '0.02em',
      marginTop: '18px',
    }, box);

    const rule = goldRule(box, { marginTop: '34px', width: '0px' });

    // 右侧四个刻度，逐拍亮起
    const ticks = el('div', {
      position: 'absolute', right: '250px', top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex', gap: '34px', alignItems: 'flex-end',
    }, l);
    const bars = [];
    const nums = [];
    for (let i = 0; i < 4; i++) {
      const col = el('div', {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
      }, ticks);
      bars.push(el('div', {
        width: '2px', height: `${92 + i * 32}px`,
        background: '#2E3648',
      }, col));
      const n = el('div', {
        font: `500 16px ${FM}`, color: '#2E3648', letterSpacing: '0.12em',
      }, col);
      n.textContent = `0${i + 1}`;
      nums.push(n);
    }

    this._r = { box, l1, l2, rule, bars, nums };
  },
  update(t) {
    const { l1, l2, rule, bars, nums } = this._r;
    l1.set(prog(t, 0.03, 0.6), 108);
    l2.set(prog(t, 0.20, 0.66), 112);
    rule.style.width = `${eExpo(prog(t, 0.75, 0.55)) * 300}px`;

    bars.forEach((b, i) => {
      const p = eOut(prog(t, 0.9 + i * BEAT * 0.5, 0.32));
      b.style.background = p > 0.4 ? C.gold : '#2E3648';
      b.style.transform = `scaleY(${0.55 + p * 0.45})`;
      b.style.transformOrigin = 'bottom';
      nums[i].style.color = p > 0.4 ? '#7C879C' : '#2E3648';
    });
  },
};

// ───────────────────────────────────────────── 05 四张提名卡
const NOMS = [
  { no: '01', name: '熬夜突击', sub: '考前 12 小时' },
  { no: '02', name: '划重点', sub: '荧光笔三支' },
  { no: '03', name: '收藏夹', sub: '存了 999 篇' },
  { no: '04', name: '倍速刷课', sub: '2.0x 一天一门' },
];

function nomIcon(i, parent) {
  const s = GLYPH(64, 64, parent);
  const st = { fill: 'none', stroke: C.dim, 'stroke-width': 1.4, 'stroke-linecap': 'round' };
  if (i === 0) {
    P('circle', { cx: 32, cy: 32, r: 21, ...st }, s);
    P('path', { d: 'M32 18 L32 33 L43 39', ...st }, s);
  } else if (i === 1) {
    P('path', { d: 'M20 52 L46 16 L54 22 L28 58 Z', ...st }, s);
    P('path', { d: 'M42 22 L50 28', ...st }, s);
  } else if (i === 2) {
    P('path', { d: 'M22 14 L46 14 L46 54 L34 44 L22 54 Z', ...st }, s);
    P('path', { d: 'M29 26 L39 26', ...st }, s);
  } else {
    P('path', { d: 'M16 20 L30 32 L16 44 Z', ...st }, s);
    P('path', { d: 'M32 20 L46 32 L32 44 Z', ...st }, s);
    P('path', { d: 'M48 26 L54 32 L48 38', ...st }, s);
  }
}

export const S_CARDS = {
  id: 'cards',
  start: 10.2171,
  end: 12.2605,
  glow: [0.5, 0.5, 0.78, 0.58],
  exit: 'wipeU',
  build(l) {
    kick(l, '四种努力 · FOUR ATTEMPTS');

    const row = el('div', {
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%,-50%)',
      display: 'flex', gap: `${GAP}px`,
    }, l);

    const cards = NOMS.map((n, i) => {
      const c = el('div', {
        width: `${CARD_W}px`, height: `${CARD_H}px`,
        border: `1px solid ${C.line}`,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        padding: '30px 30px 34px',
        boxSizing: 'border-box',
        opacity: '0',
      }, row);

      const bar = el('div', {
        position: 'absolute', left: '0', top: '0', height: '2px', width: '0%',
        background: C.gold,
      }, c);

      const no = el('div', {
        font: `500 18px ${FM}`, color: C.gold, letterSpacing: '0.22em', opacity: '0.9',
      }, c);
      no.textContent = n.no;

      const ico = el('div', {
        position: 'absolute', left: '0', right: '0', top: '128px',
        display: 'grid', placeItems: 'center',
      }, c);
      nomIcon(i, ico);

      const nm = el('div', {
        position: 'absolute', left: '30px', bottom: '78px',
        font: `700 38px ${F}`, color: C.ink, letterSpacing: '0.02em',
      }, c);
      nm.textContent = n.name;

      const sb = el('div', {
        position: 'absolute', left: '30px', bottom: '44px',
        font: `400 20px ${F}`, color: C.sub, letterSpacing: '0.04em',
      }, c);
      sb.textContent = n.sub;

      return { c, bar, no, ico, nm, sb };
    });

    this._r = { cards };
  },
  update(t) {
    this._r.cards.forEach((k, i) => {
      const st = 0.06 + i * 0.105;
      const p = prog(t, st, 0.62);
      const e = eExpo(p);
      k.c.style.opacity = String(clamp(p * 2.2));
      k.c.style.transform = `translateY(${(1 - e) * 54}px)`;
      k.bar.style.width = `${eOut(prog(t, st + 0.18, 0.5)) * 100}%`;
      k.no.style.opacity = String(eOut(prog(t, st + 0.2, 0.4)) * 0.9);
      k.ico.style.opacity = String(eOut(prog(t, st + 0.22, 0.45)));
      k.ico.style.transform = `scale(${0.86 + eBack(prog(t, st + 0.22, 0.5)) * 0.14})`;
      k.nm.style.opacity = String(eOut(prog(t, st + 0.26, 0.45)));
      k.sb.style.opacity = String(eOut(prog(t, st + 0.34, 0.45)));
    });
  },
};

// ───────────────────────────────────────────── 06 评委只有一位
export const S_JUDGE = {
  id: 'judge',
  start: 12.2605,
  end: 14.304,
  glow: [0.5, 0.44, 0.5, 0.66],
  exit: 'blurOut',
  build(l) {
    const wrap = center(l);
    const box = el('div', {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, wrap);

    const l1 = mask('但评委只有一位', {
      font: `400 58px ${F}`, color: C.dim, letterSpacing: '0.05em',
    }, box);

    const l2 = mask('你的大脑', {
      font: `700 118px ${F}`, color: C.gold, letterSpacing: '0.06em',
      marginTop: '26px',
    }, box);

    // 收拢的细环
    const ring = el('div', {
      position: 'absolute', left: '50%', top: '50%',
      width: '560px', height: '560px',
      marginLeft: '-280px', marginTop: '-280px',
      border: `1px solid rgba(232,180,74,0.34)`,
      borderRadius: '50%',
      opacity: '0',
    }, l);

    const ring2 = el('div', {
      position: 'absolute', left: '50%', top: '50%',
      width: '760px', height: '760px',
      marginLeft: '-380px', marginTop: '-380px',
      border: `1px solid rgba(232,180,74,0.12)`,
      borderRadius: '50%',
      opacity: '0',
    }, l);

    this._r = { l1, l2, ring, ring2 };
  },
  update(t) {
    const { l1, l2, ring, ring2 } = this._r;
    l1.set(prog(t, 0.02, 0.62), 108);
    l2.set(prog(t, 0.44, 0.7), 118);

    const p1 = prog(t, 0.7, 0.85);
    ring.style.opacity = String(eOut(p1) * 0.85);
    ring.style.transform = `scale(${1.42 - eExpo(p1) * 0.42})`;

    const p2 = prog(t, 0.82, 0.9);
    ring2.style.opacity = String(eOut(p2) * 0.5);
    ring2.style.transform = `scale(${1.3 - eExpo(p2) * 0.3})`;
  },
};

export const ACT0 = [S_EXAM, S_BLANK, S_REALIZE, S_QUESTION, S_NOMINATE, S_CARDS, S_JUDGE];
