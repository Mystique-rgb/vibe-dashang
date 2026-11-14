import { C, F, FM } from '../theme.js';
import { el, mask, maskHTML, prog, eOut, eExpo, eInOut, clamp, lerp } from '../kit.js';
import { center, kick, g } from '../ui.js';
import { typeOn, rgbSplit, slideIn, wobble, charOut } from '../text.js';

// ─────────────────────────────────────── 第二章：机制
export const S_CHAPTER = {
  id: 'ch2',
  start: 14.304,
  end: 16.3474,
  glow: [0.5, 0.5, 0.62, 0.55],
  exit: 'slices',
  build(l) {
    kick(l, '第二章 · 机制');

    const wrap = center(l);

    // 细环
    const ring = el('div', {
      position: 'absolute', width: '760px', height: '760px',
      border: `1px solid ${C.lineDim}`, borderRadius: '50%',
      transform: 'scale(0.86)', opacity: '0',
    }, wrap);
    const ring2 = el('div', {
      position: 'absolute', width: '1040px', height: '1040px',
      border: `1px solid rgba(150,170,200,0.07)`, borderRadius: '50%',
      transform: 'scale(0.9)', opacity: '0',
    }, wrap);

    const box = el('div', {
      position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }, wrap);

    const l1 = typeOn('大脑不是硬盘', {
      font: `400 58px ${F}`, color: C.dim, letterSpacing: '0.09em',
    }, box, { y: 18, blur: 7 });

    const l2 = maskHTML('它是' + g('漏的'), {
      font: `700 124px ${F}`, color: C.ink, letterSpacing: '0.04em',
      marginTop: '10px',
    }, box);

    // 排水刻度
    const ticks = el('div', {
      display: 'flex', gap: '14px', marginTop: '54px', alignItems: 'flex-end',
      height: '40px',
    }, box);
    const tickEls = [];
    for (let i = 0; i < 26; i++) {
      tickEls.push(el('div', {
        width: '2px', height: `${8 + (i % 5 === 0 ? 22 : 10)}px`,
        background: C.line, opacity: '0',
      }, ticks));
    }

    this._r = { ring, ring2, l1, l2, tickEls };
  },
  update(t) {
    const { ring, ring2, l1, l2, tickEls } = this._r;

    const pr = prog(t, 0.02, 0.95);
    ring.style.opacity = String(eOut(pr) * 0.9);
    ring.style.transform = `scale(${lerp(0.86, 1, eExpo(pr))})`;
    const pr2 = prog(t, 0.14, 1.1);
    ring2.style.opacity = String(eOut(pr2) * 0.8);
    ring2.style.transform = `scale(${lerp(0.9, 1, eExpo(pr2))})`;

    l1.set(t, 0.05, 0.62);
    l2.set(prog(t, 0.3, 0.72), 122);

    // 刻度依次亮起，又依次漏掉
    tickEls.forEach((n, i) => {
      const pin = eOut(prog(t, 0.5 + i * 0.024, 0.3));
      const pout = eInOut(prog(t, 1.35 + i * 0.026, 0.45));
      n.style.opacity = String(pin * (1 - pout * 0.88));
    });
  },
};

export const CH2 = [S_CHAPTER];
