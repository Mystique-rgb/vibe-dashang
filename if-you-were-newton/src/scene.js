import { W, H } from './visual.js';
import { getFrame } from './timeline.js';
import { drawActOne } from './act-one.js';
import { drawActTwo } from './act-two.js';
import { drawActThree } from './act-three.js';
import { drawBackground, drawAtmosphere, accent } from './atmosphere.js';
import { drawCaption } from './captions.js';

export function paint(ctx, width, height, time) {
  const f = getFrame(time);
  ctx.setTransform(width / W, 0, 0, height / H, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  drawBackground(ctx, f);
  ctx.save();
  try {
    if (f.id <= 11) drawActOne(ctx, f);
    else if (f.id <= 22) drawActTwo(ctx, f);
    else drawActThree(ctx, f);
  } finally {
    ctx.restore();
  }
  drawAtmosphere(ctx, f);
  accent(ctx, f);
  drawCaption(ctx, f);
}

export default function createScene({ root, width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  return {
    prepareFrame(time) { paint(ctx, width, height, time); },
    dispose() { canvas.remove(); },
  };
}
