import { textCues } from './text-cues.js';

const sans = '"Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const numerical = '"Georgia", "Microsoft YaHei UI", serif';
const paper = '#fff4e2';
const vermilion = '#ff9271';
const ink = '#30232b';
const darkVermilion = '#a23826';
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => 1 - (1 - clamp(value)) ** 3;

// One event card per historical moment. Quiet shots let the place stand on its own.
const eventCards = new Map([
  [1, ['1801', '天体观测 · 巴勒莫']],
  [3, ['布伦瑞克', '高斯的故乡']],
  [4, ['童年轶事', '1 至 100 求和']],
  [8, ['1792', '布伦瑞克 · 求学']],
  [9, ['1795', '哥廷根大学']],
  [11, ['1796', '正十七边形 · 尺规作图']],
  [12, ['1796.03.30', '高斯数学日记']],
  [13, ['1801', '《算术研究》出版']],
  [14, ['1801.01.01', '巴勒莫 · 皮亚齐']],
  [16, ['观测中断', '目标接近太阳的视方向']],
  [17, ['约 9°', '已有观测所覆盖的范围']],
  [20, ['计算示意', '从观测点推断轨道']],
  [21, ['三次观测', '用记录的位置估算轨道']],
  [22, ['轨道预测', '从短弧推算整条轨道']],
  [27, ['约 1801 年末', '哥达 · 冯·扎赫']],
  [33, ['1807', '哥廷根天文台']],
  [34, ['1833', '高斯与韦伯 · 电磁电报']],
  [35, ['1855', '哥廷根']],
  [36, ['2015', '黎明号抵达谷神星']],
]);

// Layouts are in 1920 × 1080 scene coordinates. An array follows the shot order.
const left = (x, y, options) => ({ x, y, ...options });
const right = (x, y, options) => ({ x, y, align: 'right', ...options });
const center = (x, y, options) => ({ x, y, align: 'center', ...options });
const openingCaption = left(112, 160, { rows: ['1801年，天上丢了一颗星。', '全欧洲的望远镜都找不到它。'], size: 63 });
const topLeft = left(112, 144);
const lowerLeft = left(112, 933);
const lowerRight = right(1808, 933);
const bottomCenter = center(960, 933);
const layouts = {
  4: bottomCenter,
  5: bottomCenter,
  6: [left(112, 102), center(960, 955)],
  7: [right(1808, 130), left(112, 116)],
  8: [lowerRight, lowerLeft],
  9: [lowerLeft, left(112, 175, { rows: ['你来到哥廷根', '求学。'], size: 64 })],
  10: [right(1632, 235, { dark: true, size: 55, columns: ['怎么在圆里画出', '正十七边形？'] }),
    left(216, 818, { dark: true, size: 62 })],
  11: [left(112, 124, { rows: ['18岁的你发现，', '只用直尺和圆规就能画。'], size: 60 }),
    left(112, 115), left(213, 755, { dark: true, size: 60, width: 640 })],
  12: [topLeft, left(215, 702, { dark: true, width: 575, size: 62 })],
  13: [left(112, 979, { size: 62 }), bottomCenter],
  14: topLeft,
  15: topLeft,
  16: [left(112, 909, { size: 62 }),
    right(1850, 598, { dark: true, rows: ['它在天上', '靠近太阳，', '淹没在日光里。'], size: 51 })],
  17: [topLeft, left(225, 738, { dark: true, size: 60 })],
  18: [left(112, 92), left(230, 737, { dark: true, size: 60 })],
  19: [right(1808, 125), left(112, 98)],
  20: topLeft,
  21: [left(112, 112), left(112, 91)],
  22: [left(112, 100, { size: 62 }), left(112, 94, { size: 62 })],
  23: [left(112, 87), lowerRight],
  24: left(112, 92),
  25: topLeft,
  26: topLeft,
  27: topLeft,
  30: [right(1680, 650, { dark: true, size: 64 }), right(1740, 554, { dark: true, size: 64 }),
    left(125, 716, { dark: true, size: 64 }), right(1740, 694, { dark: true, size: 64 })],
  32: left(112, 118),
  33: [left(112, 112), left(112, 145, { rows: ['1807年，', '你出任哥廷根天文台台长。'], size: 60 })],
  34: [left(112, 105), lowerRight],
  35: [left(112, 108, { rows: ['1855年，', '你在哥廷根离世。'], size: 62 }), topLeft],
  36: [right(1808, 820, { rows: ['2015年，', '黎明号进入谷神星轨道。'], size: 63 }),
    right(1808, 212, { rows: ['2015年，', '黎明号进入谷神星轨道。'], size: 63 })],
  37: right(1808, 95),
};

const standardCard = right(1815, 83);
const cardLayouts = {
  12: [standardCard, right(1670, 768, { dark: true })],
  16: [standardCard, right(1815, 83, { dark: true })],
  17: [standardCard, right(1660, 735, { dark: true })],
  36: [left(112, 83), left(112, 918)],
};

function shotLayout(layout, shot, fallback) {
  return (Array.isArray(layout) ? layout[shot] : layout) ?? fallback;
}

const punctuation = '，。；、？！';
const verticalPunctuation = { '，': '︐', '。': '︒', '？': '︖' };

function cueGlyphs({ text, accent }, dark) {
  const start = accent ? text.indexOf(accent) : -1;
  let index = 0;
  return Array.from(text, glyph => {
    const highlighted = start >= 0 && index >= start && index < start + accent.length;
    index += glyph.length;
    return [glyph, highlighted ? (dark ? darkVermilion : vermilion) : (dark ? ink : paper)];
  });
}

function captionLines(glyphs, ctx, maxWidth, rows) {
  if (rows) {
    let start = 0;
    return rows.map(row => {
      const end = start + Array.from(row).length;
      const line = glyphs.slice(start, end);
      start = end;
      return line;
    });
  }
  const result = [];
  let start = 0;
  while (start < glyphs.length) {
    let stop = start + 1;
    while (stop < glyphs.length && ctx.measureText(glyphs.slice(start, stop + 1).map(([glyph]) => glyph).join('')).width <= maxWidth) stop++;
    if (stop < glyphs.length) {
      for (let i = stop - 1; i >= start + 6; i--) {
        if (punctuation.includes(glyphs[i][0])) {
          stop = i + 1;
          break;
        }
      }
      if (punctuation.includes(glyphs[stop][0]) && stop > start + 7) stop++;
    }
    result.push(glyphs.slice(start, stop));
    start = stop;
  }
  return result;
}

function colorRuns(glyphs) {
  const runs = [];
  for (const [glyph, color] of glyphs) {
    const last = runs.at(-1);
    if (last?.color === color) last.text += glyph;
    else runs.push({ text: glyph, color });
  }
  return runs;
}

function drawCaptionText(ctx, glyphs, layout, y, size, maxWidth) {
  if (layout.columns) {
    const step = size * 1.12;
    const columns = captionLines(glyphs, ctx, maxWidth, layout.columns);
    ctx.textAlign = 'center';
    columns.forEach((column, col) => {
      column.forEach(([glyph, color], row) => {
        ctx.fillStyle = color;
        ctx.fillText(verticalPunctuation[glyph] ?? glyph, layout.x - col * step * 1.24, y + row * step);
      });
    });
    return;
  }

  ctx.textAlign = 'left';
  captionLines(glyphs, ctx, maxWidth, layout.rows).forEach((line, row) => {
    const runs = colorRuns(line);
    const width = runs.reduce((sum, run) => sum + ctx.measureText(run.text).width, 0);
    let x = layout.x - (layout.align === 'right' ? width : layout.align === 'center' ? width / 2 : 0);
    for (const { text, color } of runs) {
      ctx.fillStyle = color;
      ctx.fillText(text, x, y + row * size * 1.23);
      x += ctx.measureText(text).width;
    }
  });
}

function mainCaption(ctx, f, hasCard) {
  const lines = textCues[f.id] ?? [];
  if (!lines.length) return;
  const delay = f.id === 32 ? .833 : .055;
  const limit = f.id === 37 ? 2.94 : f.d - .04;
  if (f.a < delay || f.a >= limit) return;
  const slot = (limit - delay) / lines.length;
  const i = Math.min(lines.length - 1, Math.floor((f.a - delay) / slot));
  const entry = f.a - (delay + i * slot);
  const exit = delay + (i + 1) * slot - f.a;
  const p = ease(entry / .18);
  const layout = shotLayout(layouts[f.id], f.k, openingCaption);
  const size = layout.size ?? 69;
  const maxWidth = layout.width ?? (f.id <= 3 && hasCard ? 1110 : 1480);
  ctx.save();
  ctx.globalAlpha = p * clamp(exit / .12);
  ctx.font = `800 ${size}px ${sans}`;
  ctx.textBaseline = 'top';
  drawCaptionText(ctx, cueGlyphs(lines[i], layout.dark), layout, layout.y - 17 * (1 - p), size, maxWidth);
  ctx.restore();
}

function eventCard(ctx, f, card) {
  const reveal = ease((f.a - .14) / .30);
  if (!reveal) return;
  const [title, detail] = card;
  const layout = shotLayout(cardLayouts[f.id], f.k, standardCard);
  const leftAligned = layout.align !== 'right';
  const direction = leftAligned ? -1 : 1;
  const edge = layout.x + direction * (1 - reveal) * 27;
  ctx.save();
  ctx.globalAlpha = reveal * clamp((f.d - f.a) / .11);
  ctx.textAlign = leftAligned ? 'left' : 'right';
  ctx.textBaseline = 'top';
  ctx.font = /[㐀-鿿]/.test(title) ? `800 43px ${sans}` : `700 47px ${numerical}`;
  ctx.fillStyle = layout.dark ? ink : '#ffead1';
  ctx.fillText(title, edge - direction * 13, layout.y + 11);
  ctx.font = `600 26px ${sans}`;
  ctx.fillStyle = layout.dark ? '#483339' : '#e4d8c8';
  ctx.fillText(detail, edge - direction * 15, layout.y + 64);
  ctx.restore();
}

export function drawCaptions(ctx, frame) {
  const card = eventCards.get(frame.id);
  mainCaption(ctx, frame, Boolean(card));
  if (card) eventCard(ctx, frame, card);
}
