import { W, clamp, ease } from './visual.js';

const splitPoints = new Map([
  [12, 1360], [17, 1787], [21, 2250], [22, 2385], [23, 2540],
  [24, 2693], [25, 2878], [27, 2976], [28, 3078], [30, 3295],
  [31, 3411], [32, 3496],
]);
const coldScenes = new Set([2, 8, 9, 16, 25, 26, 27, 28]);
const quietTags = new Map([[14, '苹果轶事 · 据牛顿晚年回忆'], [31, '思想实验 · 《世界体系论》1728 年出版']]);
const highlightByScene = new Map([
  [1, '落下'], [2, '从不坠地'], [6,'1661 年'], [8,'1665 年'], [9,'伍尔索普'],
  [12,'颜色保持不变'], [18,'1672 年'], [19,'霍克'], [20,'哈雷'], [22,'椭圆'],
  [27,'一直错过地面'], [29,'1687 年'], [31,'绕地球运行'],
]);
const subtitleFont = '"Microsoft YaHei", "Noto Sans SC", sans-serif';
const displayFont = '"Songti SC", "SimSun", "Noto Serif SC", serif';

function centered(ctx, text, y, font, main, mark, accent, maxWidth = 1660) {
  const index = mark ? text.indexOf(mark) : -1;
  const spans = index < 0 ? [[text, main]] : [[text.slice(0, index), main], [mark, accent], [text.slice(index + mark.length), main]];
  ctx.save();
  ctx.font = font;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const width = spans.reduce((sum, [part]) => sum + ctx.measureText(part).width, 0);
  const scale = Math.min(1, maxWidth / Math.max(width, 1));
  ctx.translate(W / 2, y);
  ctx.scale(scale, 1);
  let x = -width / 2;
  for (const [part, color] of spans) {
    ctx.fillStyle = color;
    ctx.fillText(part, x, 0);
    x += ctx.measureText(part).width;
  }
  ctx.restore();
}

export function drawCaption(ctx, f) {
  if (f.id === 33) {
    const progress = ease((f.frame - 3565) / 11);
    if (progress === 0) return;
    ctx.save(); ctx.globalAlpha = progress;
    centered(ctx, '艾萨克·牛顿', 887 + 9 * (1 - progress), `600 77px ${displayFont}`, '#ffedcf', '', '#ffca86');
    centered(ctx, '1643–1727', 946, '500 40px Georgia, serif', '#e8b77e', '', '#e8b77e');
    ctx.restore();
    return;
  }
  const words = f.caption.replace('†', '').split('／');
  if (!words[0]) return;
  const showSecond = words.length > 1 && f.frame >= splitPoints.get(f.id);
  const startFrame = showSecond ? splitPoints.get(f.id) : f.sceneStart;
  const since = f.frame - startFrame;
  const title = f.id === 3;
  const question = f.id < 3;
  const tag = f.id === 14;
  const progress = ease(clamp((since + 1) / (title ? 12 : 6)));
  const size = title ? 112 : question ? 68 : tag ? 27 : 53;
  const baseline = title ? 836 : question ? 897 : tag ? 965 : 921;
  const main = coldScenes.has(f.id) ? '#fff7e9' : '#fff1d8';
  const gold = coldScenes.has(f.id) ? '#ffcc8b' : '#ffc077';
  ctx.save();
  ctx.globalAlpha = progress;
  centered(ctx, tag ? quietTags.get(f.id) : words[showSecond ? 1 : 0], baseline + 10 * (1 - progress),
    `${title || question ? 650 : 600} ${size}px ${title || question ? displayFont : subtitleFont}`, main, highlightByScene.get(f.id), gold);
  if (f.id === 31) centered(ctx, quietTags.get(31), 969, `500 26px ${subtitleFont}`, '#e9c69a', '', gold);
  ctx.restore();
}
