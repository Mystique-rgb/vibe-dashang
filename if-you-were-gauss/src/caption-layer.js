import { textCues } from './text-cues.js';

const sans = '"Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const numerical = '"Georgia", "Microsoft YaHei UI", serif';
const paper = '#fff4e2';
const vermilion = '#ff9271';
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

function putText(ctx, label, x, y, fill, edge, edgeWidth) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = edge;
  ctx.lineWidth = edgeWidth;
  ctx.strokeText(label, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(label, x, y);
}

function spanText(text, phrase) {
  const at = phrase ? text.indexOf(phrase) : -1;
  if (at < 0) return [[text, paper]];
  return [[text.slice(0, at), paper], [phrase, vermilion], [text.slice(at + phrase.length), paper]];
}

function captionLines(text, accent, ctx, maxWidth) {
  // Prefer the existing punctuation to breaking a name or a short phrase in two.
  const parts = text.split('\n');
  const result = [];
  for (const item of parts) {
    const chars = Array.from(item);
    let start = 0;
    while (start < chars.length) {
      let stop = start + 1;
      while (stop < chars.length && ctx.measureText(chars.slice(start, stop + 1).join('')).width <= maxWidth) stop++;
      if (stop < chars.length) {
        for (let i = stop - 1; i >= start + 6; i--) {
          if ('，。；、？！'.includes(chars[i])) { stop = i + 1; break; }
        }
        if ('，。；、？！'.includes(chars[stop]) && stop > start + 7) stop++;
      }
      result.push(spanText(chars.slice(start, stop).join(''), accent));
      start = stop;
    }
  }
  return result;
}

const positions = new Map([
  [7, [112, 178]], [9, [112, 250]], [10, [112, 181]], [13, [112, 177]],
  [16, [112, 199]], [20, [112, 172]], [23, [112, 176]], [27, [112, 168]],
  [32, [112, 179]], [33, [112, 167]], [34, [112, 167]], [35, [112, 167]], [36, [112, 173]],
  [37, [112, 171]],
]);

function mainCaption(ctx, f, hasCard) {
  const lines = textCues[f.id] ?? [];
  if (!lines.length) return;
  const delay = f.id === 32 ? .833 : .055;
  const limit = f.id === 37 ? 2.94 : f.d - .04;
  if (f.a < delay || f.a >= limit) return;
  const slot = (limit - delay) / lines.length;
  const i = Math.min(lines.length - 1, Math.floor((f.a - delay) / slot));
  const cue = lines[i];
  const entry = f.a - (delay + i * slot);
  const exit = delay + (i + 1) * slot - f.a;
  const p = ease(entry / .18);
  const opacity = p * clamp(exit / .12);
  const [x, top] = positions.get(f.id) ?? [112, 160];
  const maxWidth = hasCard ? 1110 : 1220;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `800 69px ${sans}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const wrapped = captionLines(cue.text, cue.accent, ctx, maxWidth);
  const yOrigin = top - 17 * (1 - p);
  const width = Math.max(...wrapped.map(row => row.reduce((n, [word]) => n + ctx.measureText(word).width, 0)));
  const strip = ctx.createRadialGradient(x + width * .36, yOrigin + wrapped.length * 31, 24,
    x + width * .36, yOrigin + wrapped.length * 31, width * .7 + 205);
  strip.addColorStop(0, 'rgba(3,5,9,.49)');
  strip.addColorStop(.62, 'rgba(3,5,9,.23)');
  strip.addColorStop(1, 'rgba(3,5,9,0)');
  ctx.fillStyle = strip;
  ctx.fillRect(0, yOrigin - 88, Math.min(1440, x + width + 202), 178 + 81 * wrapped.length);
  for (let row = 0; row < wrapped.length; row++) {
    let left = x;
    for (const [segment, shade] of wrapped[row]) {
      if (segment) putText(ctx, segment, left, yOrigin + row * 85, shade, 'rgba(8,9,13,.9)', 4.4);
      left += ctx.measureText(segment).width;
    }
  }
  ctx.restore();
}

function eventCard(ctx, f, card) {
  const reveal = ease((f.a - .14) / .30);
  if (!reveal) return;
  const [title, detail] = card;
  const right = 1815 + (1 - reveal) * 27;
  const y = 83;
  ctx.save();
  ctx.globalAlpha = reveal * clamp((f.d - f.a) / .11);
  const gradient = ctx.createRadialGradient(right - 127, y + 46, 14, right - 127, y + 46, 360);
  gradient.addColorStop(0, 'rgba(4,8,12,.62)');
  gradient.addColorStop(.61, 'rgba(4,8,12,.31)');
  gradient.addColorStop(1, 'rgba(4,8,12,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(right - 544, 32, 614, 212);
  const rule = 73 * reveal;
  ctx.fillStyle = '#e8916c';
  ctx.fillRect(right - rule, y, rule, 3);
  ctx.fillRect(right - 2, y, 2, 66);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = `${/[\u3400-\u9fff]/.test(title) ? '800 43px ' + sans : '700 47px ' + numerical}`;
  putText(ctx, title, right - 13, y + 11, '#ffead1', '#120c10b8', 2.6);
  ctx.font = `600 26px ${sans}`;
  putText(ctx, detail, right - 15, y + 64, '#e4d8c8', '#100d11c9', 2.2);
  ctx.restore();
}

export function drawCaptions(ctx, frame) {
  const card = eventCards.get(frame.id);
  mainCaption(ctx, frame, Boolean(card));
  if (card) eventCard(ctx, frame, card);
}
