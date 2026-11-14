import { C, F, FM, BEAT } from '../theme.js';
import { el, mask, maskHTML, prog, eOut, eExpo, eInOut, eBack, clamp, lerp } from '../kit.js';
import { center, kick, foot, goldRule, g, r, d } from '../ui.js';
import { typeOn, rgbSplit, slideIn, wobble, charOut } from '../text.js';
import { SVG, E, ST, grow } from '../svgkit.js';
import { disperse } from '../particles.js';

// ───────────────────────────── 回到考场：同一张卷子，同一道题
// 这是全片的回环 —— 开头写不下去的那一行，现在写满了
const ANSWER = '浩浩汤汤，横无际涯；朝晖夕阴，气象万千。';

export const S_ECHO = {
  id: 'echo',
  start: 58.2375,
  end: 61.3027,
  glow: [0.4, 0.44, 0.74, 0.66],
  exit: 'fade',
  build(l) {
    // 与开头同一位置：让到纸面之上
    const k = kick(l, '考场 · 同一道第 07 题');
    k.style.left = '152px';
    k.style.top = '36px';

    // 桌面（与开头同一套景）
    el('div', {
      position: 'absolute', left: '0', right: '0', bottom: '0', height: '150px',
      background: 'linear-gradient(180deg, rgba(58,78,112,0) 0%, rgba(58,78,112,0.16) 62%, rgba(20,28,44,0.30) 100%)',
    }, l);
    el('div', {
      position: 'absolute', left: '0', right: '0', bottom: '150px', height: '1px',
      background: 'linear-gradient(90deg, rgba(150,170,200,0) 0%, rgba(150,170,200,0.22) 22%, rgba(150,170,200,0.22) 78%, rgba(150,170,200,0) 100%)',
    }, l);

    // 试卷：与开头完全相同的尺寸与倾角
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
    // 纸面柔光：比开头更亮一点，暗示"这一次是顺的"
    el('div', {
      position: 'absolute', pointerEvents: 'none',
      left: '-10%', top: '-14%', width: '96%', height: '76%',
      background: 'radial-gradient(ellipse at 34% 22%, rgba(255,252,242,0.16), rgba(255,250,238,0.045) 46%, rgba(255,250,238,0) 72%)',
    }, paper);

    // 页眉
    const hd = el('div', {
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      font: `400 19px ${F}`, color: C.sub, letterSpacing: '0.12em',
    }, paper);
    const hdL = el('span', {}, hd); hdL.textContent = '期中测验 · 语文';
    const hdR = el('span', { font: `400 16px ${FM}`, color: '#3D4658', letterSpacing: '0.1em' }, hd);
    hdR.textContent = '第 2 页 / 共 4 页';

    el('div', { height: '1px', background: 'rgba(150,170,200,0.20)', margin: '18px 0 30px' }, paper);

    // 题号 + 题干
    const noWrap = el('div', { display: 'flex', alignItems: 'baseline', gap: '18px' }, paper);
    const no = el('div', {
      font: `500 17px ${FM}`, color: C.gold, letterSpacing: '0.22em',
    }, noWrap);
    no.textContent = '07';
    el('div', { flex: '1', height: '1px', background: 'rgba(232,180,74,0.22)', marginBottom: '6px' }, noWrap);
    // 打勾：这一题拿下了
    const tickWrap = el('div', {
      position: 'absolute', left: '16px', top: '-6px',
      width: '30px', height: '30px', opacity: '0',
    }, noWrap);
    tickWrap.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30" style="display:block;overflow:visible">
      <path d="M6 16 L12 22 L24 6" fill="none" stroke="#E8B44A" stroke-width="2.6"
            stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const q = el('div', {
      marginTop: '20px', font: `400 27px ${F}`, color: '#B9C4D4',
      letterSpacing: '0.02em', lineHeight: '1.66',
    }, paper);
    q.textContent = '默写《岳阳楼记》中描写洞庭湖景色的句子。';

    // 答题区
    const linesBox = el('div', {
      position: 'relative', marginTop: '34px',
      display: 'flex', flexDirection: 'column', gap: '54px',
    }, paper);
    const rlines = [];
    for (let i = 0; i < 7; i++) {
      rlines.push(el('div', {
        height: '1px', background: 'rgba(150,170,200,0.13)', width: '100%',
      }, linesBox));
    }

    // 答案：逐字写出来
    const answer = el('div', {
      position: 'absolute', left: '0', top: '-40px',
      font: `400 27px ${F}`, color: 'rgba(224,232,244,0.95)',
      letterSpacing: '0.06em', whiteSpace: 'nowrap',
    }, linesBox);
    const chars = [...ANSWER].map((ch) => {
      const sp = el('span', { opacity: '0' }, answer);
      sp.textContent = ch;
      return sp;
    });

    // 笔尖光标：跟着写字位置走
    const caret = el('div', {
      position: 'absolute', left: '0px', top: '-46px',
      width: '2px', height: '38px', background: C.gold,
      boxShadow: '0 0 20px rgba(232,180,74,0.8)', opacity: '0',
    }, linesBox);

    // 墨迹：结尾的一点加重，像落笔收住
    const dot = el('div', {
      position: 'absolute', left: '0px', top: '-8px',
      width: '0px', height: '0px', borderRadius: '50%',
      background: 'rgba(232,180,74,0.75)', filter: 'blur(1px)', opacity: '0',
    }, linesBox);

    // 右侧
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
    rk.textContent = 'SAME QUESTION';

    const r1 = typeOn('同一道题', {
      font: `400 46px ${F}`, color: C.dim, letterSpacing: '0.06em',
      marginTop: '20px',
    }, right, { y: 18, blur: 7 });

    const r2 = maskHTML('这次，' + g('写出来了'), {
      font: `700 74px ${F}`, color: C.ink, letterSpacing: '0.02em',
      marginTop: '6px',
    }, right);

    const rule = el('div', {
      width: '0px', height: '1px', marginTop: '30px',
      background: 'linear-gradient(90deg, rgba(232,180,74,0), rgba(232,180,74,0.6))',
    }, right);

    const r3 = el('div', {
      marginTop: '24px', font: `400 22px ${F}`, color: C.sub,
      letterSpacing: '0.08em', lineHeight: '1.85', opacity: '0',
    }, right);
    r3.innerHTML = '考前一周，他把它<br>想起来了三次。';

    // 四种努力，一并划掉
    const kills = el('div', {
      display: 'flex', gap: '18px', marginTop: '34px', opacity: '0',
    }, right);
    const dusts = [];
    const kills4 = ['熬夜突击', '划重点', '收藏夹', '倍速刷课'].map((tx, i) => {
      const w = el('div', {
        position: 'relative',
        font: `400 19px ${F}`, color: '#4E5870', letterSpacing: '0.06em',
      }, kills);
      w.textContent = tx;
      const st = el('div', {
        position: 'absolute', left: '-3px', right: '-3px', top: '56%',
        height: '1.2px', background: C.red, width: '0%',
        transformOrigin: 'left center',
      }, w);
      // 划掉的一瞬间，字散成灰
      dusts.push(disperse(w, {
        x: '50%', y: '50%', n: 12, spread: 74, bias: 1.2,
        colors: ['rgba(217,58,63,0.85)', 'rgba(217,58,63,0.45)',
                 'rgba(150,170,200,0.5)', 'rgba(224,232,244,0.6)'],
      }));
      return st;
    });

    this._r = { paper, chars, caret, dot, tickWrap, rk, r1, r2, rule, r3, kills, kills4, rlines, dusts };
  },
  update(t) {
    const { paper, chars, caret, dot, tickWrap, rk, r1, r2, rule, r3, kills, kills4, rlines, dusts } = this._r;

    // 纸面缓推（与开头同一个方向）
    paper.style.transform = `rotate(-1.4deg) scale(${1 + eInOut(prog(t, 0, 3.1)) * 0.02})`;

    rlines.forEach((n, i) => {
      n.style.opacity = String(eOut(prog(t, 0.02 + i * 0.03, 0.35)));
    });

    // 逐字写出：前 6 个字很快（"记得的"），后面匀速
    const N = chars.length;
    const t0 = 0.34, t1 = 1.92;
    let lastX = 0;
    let writeHead = 0;
    chars.forEach((sp, i) => {
      const isHead = i < 6;
      const st = isHead
        ? t0 + (i / 6) * 0.30
        : t0 + 0.30 + ((i - 6) / (N - 6)) * (t1 - t0 - 0.30);
      const p = prog(t, st, 0.055);
      sp.style.opacity = String(eOut(p));
      // 一个字一个轻微的"按下去"
      sp.style.transform = `translateY(${(1 - eOut(p)) * 3}px)`;
      if (p > 0) writeHead = i;
    });

    // 光标位置：按已写出的字数估算（每字约 31px）
    const CHAR_W = 31.2;
    const caretOn = prog(t, t0 - 0.1, 0.2) * (1 - prog(t, t1 + 0.15, 0.35));
    caret.style.opacity = String(caretOn * (Math.floor(t / 0.28) % 2 ? 0.35 : 1));
    caret.style.left = `${writeHead * CHAR_W + 2}px`;

    // 收笔加重
    const pd = prog(t, t1 + 0.02, 0.35);
    dot.style.opacity = String(eOut(pd) * 0.9);
    dot.style.width = `${eOut(pd) * 13}px`;
    dot.style.height = `${eOut(pd) * 13}px`;
    dot.style.left = `${(N - 1) * CHAR_W + 14}px`;

    // 打勾
    const pt = prog(t, t1 + 0.18, 0.42);
    tickWrap.style.opacity = String(eOut(pt));
    tickWrap.style.transform = `scale(${lerp(0.6, 1, eBack(pt))})`;

    // 右侧文案
    rk.style.opacity = String(eOut(prog(t, 0.5, 0.4)));
    r1.set(t, 0.62, 0.55);
    r2.set(prog(t, 0.86, 0.62), 112);
    rule.style.width = `${eOut(prog(t, 1.4, 0.55)) * 240}px`;
    r3.style.opacity = String(eOut(prog(t, 1.62, 0.5)));

    kills.style.opacity = String(eOut(prog(t, 1.95, 0.4)));
    kills4.forEach((st, i) => {
      const st0 = 2.14 + i * 0.07;
      st.style.width = `${eInOut(prog(t, st0, 0.26)) * 106}%`;
      // 线划过去的同时，字碎掉
      dusts[i](prog(t, st0 + 0.06, 0.62));
    });
  },
};

// ───────────────────────────── 落版
export const S_END = {
  id: 'end',
  start: 61.3027,
  end: 66.0026,
  glow: [0.5, 0.48, 0.78, 0.54],
  exit: 'fade',
  build(l) {
    kick(l, '2026 年度 · VIBE 知识大赏');

    const wrap = center(l);
    const box = el('div', {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginTop: '-16px',
    }, wrap);

    // 光环
    const halo = el('div', {
      position: 'absolute', width: '1000px', height: '1000px',
      borderRadius: '50%', opacity: '0',
      background: 'radial-gradient(circle, rgba(232,180,74,0.12) 0%, rgba(232,180,74,0) 62%)',
    }, box);

    const rule = goldRule(box, { width: '0px', marginBottom: '34px' });

    const l1 = typeOn('学过的，只有想得起来的', {
      font: `700 88px ${F}`, color: C.ink, letterSpacing: '0.05em',
    }, box, { y: 18, blur: 7 });

    const l2 = maskHTML(g('其余的都是漏掉的'), {
      font: `700 88px ${F}`, color: C.gold, letterSpacing: '0.05em',
      marginTop: '12px',
    }, box);

    const sub = el('div', {
      marginTop: '46px', font: `400 23px ${F}`, color: '#5B6678',
      letterSpacing: '0.16em', opacity: '0',
    }, box);
    sub.textContent = 'VIBE 知识大赏 · 2026';

    this._r = { halo, rule, l1, l2, sub, box };
  },
  update(t) {
    const { halo, rule, l1, l2, sub, box } = this._r;

    const ph = prog(t, 0.05, 1.2);
    halo.style.opacity = String(eOut(ph) * 0.9);
    halo.style.transform = `scale(${lerp(0.86, 1.02, eExpo(ph))})`;

    rule.style.width = `${eOut(prog(t, 0.15, 0.7)) * 300}px`;
    // 两行必须接续：l1 逐字写到 1.12 才结束，l2 从它收尾处才开始
    l1.set(t, 0.42, 0.7);
    l2.set(prog(t, 1.14, 0.72), 116);
    sub.style.opacity = String(eOut(prog(t, 1.9, 0.6)));

    // 极慢推近，收尾不静止
    const pz = eInOut(prog(t, 1.2, 3.9));
    box.style.transform = `scale(${1 + pz * 0.02})`;
  },
};

export const ACT4 = [S_ECHO, S_END];
