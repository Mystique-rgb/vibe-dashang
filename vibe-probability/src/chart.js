// 图表组件：坐标系 / 曲线生长 / 点阵 / 对比条
// 全部以时间 t 驱动，SVG 用 pathLength=1 做精确的描边生长

import { C, F, FN, FM, FS, W, H } from './theme.js';
import { el, svg, sEl, ST, clamp, eOut, eOut4, eExpo, lerp, prog, rnd } from './kit.js';

// 坐标轴：返回绘图区几何
export function axes(l, o = {}) {
  const {
    x0 = 190, y0 = 300, w = 1180, h = 520,
    xMax = 250, yMax = 100,
    xTicks = [0, 50, 100, 150, 200, 250],
    yTicks = [0, 25, 50, 75, 100],
    xLabel = (v) => `${v} 次`,
    yLabel = (v) => `${v}%`,
    pad = 46,
  } = o;

  const s = svg(w + pad * 2, h + pad * 2, l, {
    position: 'absolute', left: `${x0 - pad}px`, top: `${y0 - pad}px`,
  });

  const X = (v) => pad + (v / xMax) * w;
  const Y = (v) => pad + h - (v / yMax) * h;

  // 横向网格线（虚线，极暗）
  const grid = [];
  for (const v of yTicks) {
    if (v === 0) continue;
    const g = sEl('line', {
      x1: X(0), y1: Y(v), x2: X(xMax), y2: Y(v),
      stroke: C.lineDim, 'stroke-width': 1, 'stroke-dasharray': '2 7',
    }, s);
    grid.push(g);
  }

  // 轴线
  const ax = sEl('path', {
    d: `M${X(0)},${Y(0)} L${X(xMax)},${Y(0)}`,
    ...ST(C.line, 1.4),
  }, s);
  const ay = sEl('path', {
    d: `M${X(0)},${Y(0)} L${X(0)},${Y(yMax)}`,
    ...ST(C.line, 1.4),
  }, s);

  // 刻度标签
  const labels = [];
  for (const v of yTicks) {
    const t = sEl('text', {
      x: X(0) - 16, y: Y(v) + 7,
      'text-anchor': 'end',
      fill: C.dim,
      'font-family': FN, 'font-size': '24',
    }, s);
    t.textContent = yLabel(v);
    labels.push(t);
  }
  for (const v of xTicks) {
    const t = sEl('text', {
      x: X(v), y: Y(0) + 40,
      'text-anchor': 'middle',
      fill: C.dim,
      'font-family': FN, 'font-size': '24',
    }, s);
    t.textContent = xLabel(v);
    labels.push(t);
  }

  return { s, X, Y, grid, ax, ay, labels, w, h, pad, xMax, yMax };
}

// 曲线：给定 f(n)，画出 0..xMax 的折线
// pathLength=1 + dashoffset 保证生长进度精确
export function curve(A, f, o = {}) {
  const { color = C.gold, width = 3.2, xMax = A.xMax, steps = 120 } = o;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const n = (i / steps) * xMax;
    d += `${i === 0 ? 'M' : 'L'}${A.X(n).toFixed(2)},${A.Y(f(n)).toFixed(2)}`;
  }
  const p = sEl('path', {
    d,
    ...ST(color, width),
    pathLength: '1',
    'stroke-dasharray': '1',
    'stroke-dashoffset': '1',
    'stroke-linecap': 'round',
  }, A.s);
  return {
    node: p,
    set(t, t0, dur) {
      const v = clamp((t - t0) / dur);
      p.style.strokeDashoffset = String(1 - eOut4(v));
      return eOut4(v);
    },
  };
}

// 曲线头光点：跟随 f(n) 的参数位置
export function headDot(A, f, o = {}) {
  const { r = 7, color = C.gold } = o;
  const g = sEl('g', {}, A.s);
  const halo = sEl('circle', { r: r * 3.4, fill: color, opacity: '0.16' }, g);
  const dot = sEl('circle', { r, fill: color }, g);
  const core = sEl('circle', { r: r * 0.38, fill: '#fff', opacity: '0.9' }, g);

  return (n, visible = 1) => {
    const x = A.X(n);
    const y = A.Y(f(n));
    for (const e of [halo, dot, core]) {
      e.setAttribute('cx', x.toFixed(2));
      e.setAttribute('cy', y.toFixed(2));
    }
    g.setAttribute('opacity', String(visible));
  };
}

// 竖直参考线 + 端点标注
export function vMarker(A, o = {}) {
  const { color = C.gold, dash = '4 6' } = o;
  const line = sEl('line', {
    x1: 0, y1: A.Y(0), x2: 0, y2: A.Y(0),
    stroke: color, 'stroke-width': 1.6, 'stroke-dasharray': dash,
  }, A.s);
  return {
    node: line,
    set(n, topVal, visible = 1) {
      const x = A.X(n);
      line.setAttribute('x1', x.toFixed(2));
      line.setAttribute('x2', x.toFixed(2));
      line.setAttribute('y2', A.Y(topVal).toFixed(2));
      line.setAttribute('opacity', String(visible));
    },
  };
}

// 点阵：n 个点，返回逐点控制的能力
// 排成 cols 列，行内从左到右
export function dotGrid(l, o = {}) {
  const {
    n = 100, cols = 10, size = 26, gap = 16,
    x = 0.5, y = 0.5, colorOn = C.gold, colorOff = 'rgba(242,235,220,0.30)',
    radius = '50%',
  } = o;

  const rows = Math.ceil(n / cols);
  const cellW = size + gap;
  const cellH = size + gap;
  const bw = cols * cellW - gap;
  const bh = rows * cellH - gap;

  const wrap = el('div', {
    position: 'absolute',
    left: `${x * 100}%`, top: `${y * 100}%`,
    width: `${bw}px`, height: `${bh}px`,
    marginLeft: `${-bw / 2}px`, marginTop: `${-bh / 2}px`,
  }, l);

  const dots = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const node = el('div', {
      position: 'absolute',
      left: `${c * cellW}px`, top: `${r * cellH}px`,
      width: `${size}px`, height: `${size}px`,
      borderRadius: radius,
      background: colorOff,
      willChange: 'opacity, transform, background',
    }, wrap);
    dots.push({ node, col: c, row: r });
  }

  return {
    wrap, dots, bw, bh,
    // 给第 i 个点设定：亮(gold) / 灭(dim) / 隐藏
    paint(i, kind, scale = 1) {
      const d = dots[i];
      if (!d) return;
      if (kind === 'on') {
        d.node.style.background = colorOn;
        d.node.style.opacity = '1';
      } else if (kind === 'off') {
        d.node.style.background = colorOff;
        d.node.style.opacity = '1';
      } else if (kind === 'dead') {
        d.node.style.background = 'rgba(242,235,220,0.10)';
        d.node.style.opacity = '1';
      } else {
        d.node.style.opacity = '0';
      }
      d.node.style.transform = `scale(${scale.toFixed(3)})`;
    },
  };
}

// 对比条：一行 = 一个次数档位
export function compareRow(l, o = {}) {
  const {
    label = '', en = '', value = 0, max = 100,
    top = 0, left = 190, width = 1180, height = 62,
    color = C.gold, valueColor = null,
  } = o;

  const wrap = el('div', {
    position: 'absolute', left: `${left}px`, top: `${top}px`, width: `${width}px`,
  }, l);

  const lab = el('div', {
    position: 'absolute', left: '0', top: '-4px',
    font: `600 40px ${F}`, color: C.ink, letterSpacing: '0.01em',
    display: 'flex', alignItems: 'baseline', gap: '14px',
  }, wrap);
  const labZh = el('span', {}, lab);
  labZh.textContent = label;
  const labEn = el('span', {
    font: `400 22px ${FN}`, color: C.dim, letterSpacing: '0.12em', textTransform: 'uppercase',
  }, lab);
  labEn.textContent = en;

  const track = el('div', {
    position: 'absolute', left: '0', top: '48px',
    width: `${width - 300}px`, height: `${height}px`,
    background: 'rgba(242,235,220,0.055)',
    borderRadius: '2px',
    overflow: 'hidden',
  }, wrap);

  const fill = el('div', {
    position: 'absolute', left: '0', top: '0', bottom: '0',
    width: '0%', background: color, borderRadius: '2px',
    willChange: 'width',
  }, track);

  const num = el('div', {
    position: 'absolute', right: '0', top: `${48 + height / 2 - 30}px`,
    width: '270px', textAlign: 'right',
    font: `700 62px ${FN}`, color: valueColor || C.ink,
    letterSpacing: '-0.01em',
  }, wrap);
  num.textContent = '0%';

  return {
    wrap, lab, track, fill, num, value,
    // numOnly=false 时只长条，数字由调用方按离散台阶写（避免中间值）
    set(p, writeNum = true) {
      const e = eOut4(clamp(p));
      fill.style.width = `${((value / max) * 100 * e).toFixed(2)}%`;
      if (writeNum) num.textContent = `${(value * e).toFixed(1)}%`;
      return e;
    },
  };
}
