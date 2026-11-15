// 版面控件：超大数值 / 印章 / 划线 / 圆环标记 / 翻牌点阵
// 每个控件都暴露 set()，由镜头在 update(t) 里按时间驱动

import { C, F, FN, FM, FS, W, H } from './theme.js';
import { el, svg, sEl, ST, clamp, eOut, eOut4, eOut5, eExpo, eBack, eInOut, lerp, prog, rnd } from './kit.js';

// ───────────────────────────────── 超大数值
// 支持：整串替换（老虎机滚动用）+ 模糊 + 缩放 + 字距
export function heroNumber(l, o = {}) {
  const {
    size = FS.hero, x = 0.5, y = 0.5, color = C.ink,
    weight = 700, family = FN, spacing = '-0.02em',
    anchor = 'center',
  } = o;

  const node = el('div', {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    transform: 'translate(-50%, -50%)',
    font: `${weight} ${size}px ${family}`,
    color,
    letterSpacing: spacing,
    lineHeight: '0.92',
    whiteSpace: 'nowrap',
    willChange: 'transform, opacity, filter',
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  }, l);

  return {
    node,
    set(str, o2 = {}) {
      const { blur = 0, scale = 1, opacity = 1, color: c = null, dy = 0 } = o2;
      if (node.textContent !== str) node.textContent = str;
      if (c) node.style.color = c;
      node.style.filter = blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : '';
      node.style.opacity = String(opacity);
      node.style.transform = `translate(-50%, calc(-50% + ${dy.toFixed(2)}px)) scale(${scale.toFixed(4)})`;
    },
  };
}

// 单位标签：紧跟数字的小字（成功率 / SUCCESS RATE）
export function heroLabel(l, zh, en, o = {}) {
  const { x = 0.5, y = 0.5, zhSize = 44, enSize = 22 } = o;
  const wrap = el('div', {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    transform: 'translate(-50%, -50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    willChange: 'opacity, transform',
  }, l);
  const a = el('div', { font: `600 ${zhSize}px ${F}`, color: C.ink, letterSpacing: '0.04em' }, wrap);
  a.textContent = zh;
  const b = el('div', {
    font: `400 ${enSize}px ${FN}`, color: C.dim,
    letterSpacing: '0.24em', textTransform: 'uppercase',
  }, wrap);
  b.textContent = en;
  return {
    wrap, zh: a, en: b,
    set(p, dy = 12) {
      const e = eOut(p);
      wrap.style.opacity = String(clamp(p * 2.6));
      wrap.style.transform = `translate(-50%, calc(-50% + ${((1 - e) * dy).toFixed(2)}px))`;
    },
  };
}

// ───────────────────────────────── 印章：×50 / ×1 / ×229
export function stamp(l, text, o = {}) {
  const {
    x = 0.5, y = 0.5, size = 96, color = C.gold, rotate = -9,
  } = o;
  const wrap = el('div', {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    transform: 'translate(-50%, -50%)',
    willChange: 'transform, opacity',
  }, l);
  const inner = el('div', {
    border: `3px solid ${color}`,
    borderRadius: '6px',
    padding: `${size * 0.10}px ${size * 0.24}px`,
    font: `800 ${size}px ${FN}`,
    color,
    letterSpacing: '0.02em',
    lineHeight: '1',
    opacity: '0.9',
    whiteSpace: 'nowrap',
  }, wrap);
  inner.textContent = text;

  return {
    wrap, inner,
    // p: 0→1，砸下来的动作（从大到小 + 过冲 + 旋转归位）
    set(p) {
      const q = clamp(p);
      const e = eOut4(q);
      const s = lerp(2.1, 1, e) * (1 + Math.sin(q * Math.PI) * 0.06);
      const r = lerp(rotate * 3.2, rotate, e);
      wrap.style.opacity = String(clamp(q * 4));
      wrap.style.transform = `translate(-50%, -50%) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`;
      wrap.style.filter = q < 1 ? `blur(${((1 - q) * 9).toFixed(2)}px)` : '';
    },
  };
}

// ───────────────────────────────── 划线（手绘感，两段）
export function strike(l, o = {}) {
  const {
    x = 0.5, y = 0.5, w = 620, color = C.gold, thick = 5, rotate = -1.6,
  } = o;
  const s = svg(w + 60, 80, l, {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
    willChange: 'transform',
  });
  const p1 = sEl('path', {
    d: `M6,46 C${w * 0.22},30 ${w * 0.42},26 ${w * 0.62},32`,
    ...ST(color, thick),
    pathLength: '1', 'stroke-dasharray': '1', 'stroke-dashoffset': '1',
  }, s);
  const p2 = sEl('path', {
    d: `M${w * 0.56},34 C${w * 0.74},36 ${w * 0.9},42 ${w - 6},54`,
    ...ST(color, thick * 0.92),
    pathLength: '1', 'stroke-dasharray': '1', 'stroke-dashoffset': '1',
  }, s);

  return {
    s,
    set(p) {
      const q = clamp(p);
      const a = clamp(q / 0.62);
      const b = clamp((q - 0.5) / 0.5);
      p1.style.strokeDashoffset = String(1 - eOut(a));
      p2.style.strokeDashoffset = String(1 - eOut(b));
      s.style.opacity = q > 0 ? '1' : '0';
    },
  };
}

// ───────────────────────────────── 圆环标记（圈住某个点）
export function circleMark(l, o = {}) {
  const { x = 0.5, y = 0.5, r = 90, color = C.gold, thick = 2.4 } = o;
  const size = r * 2 + 24;
  const s = svg(size, size, l, {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    transform: 'translate(-50%, -50%)',
  });
  const c = sEl('circle', {
    cx: size / 2, cy: size / 2, r,
    ...ST(color, thick),
    pathLength: '1', 'stroke-dasharray': '1', 'stroke-dashoffset': '1',
    transform: `rotate(-96 ${size / 2} ${size / 2})`,
  }, s);

  return {
    s,
    set(p) {
      c.style.strokeDashoffset = String(1 - eOut4(clamp(p)));
      s.style.opacity = p > 0 ? '1' : '0';
    },
  };
}

// ───────────────────────────────── 翻牌点阵
// 每格同时有点和 X，通过状态切换 + 翻转动画
// 100 格 = 100 个人；翻成 X 就是"没成"
export function flipGrid(l, o = {}) {
  const {
    n = 100, cols = 10, size = 26, gap = 16,
    x = 0.5, y = 0.5,
    dotColor = C.ink, deadColor = 'rgba(242,235,220,0.13)',
    xColor = C.red, goldColor = C.gold,
  } = o;

  const rows = Math.ceil(n / cols);
  const cw = size + gap;
  const bw = cols * cw - gap;
  const bh = rows * cw - gap;

  const wrap = el('div', {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    width: `${bw}px`, height: `${bh}px`,
    marginLeft: `${-bw / 2}px`, marginTop: `${-bh / 2}px`,
    willChange: 'transform',
  }, l);

  const cells = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const cell = el('div', {
      position: 'absolute',
      left: `${c * cw}px`, top: `${r * cw}px`,
      width: `${size}px`, height: `${size}px`,
      willChange: 'transform, opacity',
      transformStyle: 'preserve-3d',
    }, wrap);

    const dot = el('div', {
      position: 'absolute', inset: '0',
      borderRadius: '50%',
      background: dotColor,
      willChange: 'opacity, background',
    }, cell);

    // X 用两条线画，笔画比点细，密度上更"轻"
    const xs = svg(size, size, cell, { position: 'absolute', inset: '0', opacity: '0' });
    const w = size * 0.15;
    sEl('line', {
      x1: size * 0.24, y1: size * 0.24, x2: size * 0.76, y2: size * 0.76,
      ...ST(xColor, Math.max(2.6, w * 1.5)),
    }, xs);
    sEl('line', {
      x1: size * 0.76, y1: size * 0.24, x2: size * 0.24, y2: size * 0.76,
      ...ST(xColor, Math.max(2.6, w * 1.5)),
    }, xs);

    cells.push({ cell, dot, x: xs });
  }

  return {
    wrap, cells, bw, bh,
    // state: 'live' 米白点 / 'dead' 暗点 / 'fail' 红 X / 'win' 金点 / 'winX' 金点带环
    paint(i, state, scale = 1, rot = 0) {
      const c = cells[i];
      if (!c) return;
      c.cell.style.transform = `scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
      switch (state) {
        case 'fail':
          c.dot.style.opacity = '0';
          c.x.style.opacity = '1';
          break;
        case 'win':
          c.dot.style.opacity = '1';
          c.dot.style.background = goldColor;
          c.x.style.opacity = '0';
          break;
        case 'dead':
          c.dot.style.opacity = '1';
          c.dot.style.background = deadColor;
          c.x.style.opacity = '0';
          break;
        default:
          c.dot.style.opacity = '1';
          c.dot.style.background = dotColor;
          c.x.style.opacity = '0';
      }
    },
    // 翻转：p 0→1，前 50% 点缩小消失，后 50% X 放大出现
    flip(i, p, state) {
      const c = cells[i];
      if (!c) return;
      const q = clamp(p);
      const s = Math.abs(Math.cos(q * Math.PI)); // 1→0→1，像牌子翻面
      c.cell.style.transform = `scale(${Math.max(0.02, s).toFixed(3)})`;
      if (q < 0.5) {
        c.dot.style.opacity = '1';
        c.dot.style.background = dotColor;
        c.x.style.opacity = '0';
      } else {
        c.dot.style.opacity = state === 'win' ? '1' : '0';
        if (state === 'win') c.dot.style.background = goldColor;
        c.x.style.opacity = state === 'win' ? '0' : '1';
      }
    },
    // 自由摆放：聚合/重排用
    place(i, dx, dy, scale = 1, rot = 0, opacity = 1) {
      const c = cells[i];
      if (!c) return;
      c.cell.style.transform =
        `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
      c.cell.style.opacity = String(opacity);
    },
  };
}

// ───────────────────────────────── 递增计数（只用于允许连续滚动的场合）
export function countUp(node, t, t0, dur, from, to, fmtFn) {
  const p = prog(t, t0, dur);
  const e = eOut4(p);
  node.textContent = fmtFn(from + (to - from) * e);
  return e;
}
