// ---------------------------------------------------------------- dispatcher
// One entry point for all seven landscapes, so the scene code stays generic.

import { clamp01 } from './gfx.js';
import { canyon, falls } from './w_canyon_falls.js';
import { cave, glacier } from './w_cave_glacier.js';
import { baikal, yellowstone, everest } from './w_baikal_ys_everest.js';

export { WONDER_POINTS } from './wcore.js';

const DRAW = { canyon, falls, cave, glacier, baikal, yellowstone, everest };

export function drawWonder(c, o) {
  const s = o.scale;
  if (!s) return;
  const k = {
    U: 1 / s,
    accent: o.accent,
    A: o.alpha === undefined ? 1 : o.alpha,
    G: o.glow === undefined ? 0 : o.glow,
    t: o.time || 0,
    rev: o.reveal === undefined ? 1 : clamp01(o.reveal),
    det: o.detail === undefined ? 1 : clamp01(o.detail),
  };
  const fn = DRAW[o.key];
  if (!fn) return;
  c.save();
  c.scale(s, s);
  fn(c, k);
  c.restore();
}

// The unit box is 1.0 wide, so a scale of H gives a landscape H px across.
// Landscapes are drawn to fill roughly 0.95 of the box width.
export const BOX = 1.0;
