// 场景入口：装载所有镜头，按时间决定谁在上层
// 出镜镜头在上层（z-index 3）用 clip-path/mask/scale/blur "让开"，
// 露出下层已经就位的下一镜头 —— 每个入场都是揭示，不是淡入

import { W, H } from './theme.js';
import { clamp, eOut } from './kit.js';
import { createBackground } from './bg.js';
import { layer } from './ui.js';
import { TRANS, applyExit } from './transitions.js';
import { SHOTS, FLASHES } from './timing.js';
import { flashEnvelope } from './fx.js';
import { ACT0 } from './shots/act0.js';
import { CH } from './shots/chapter.js';
import { ACT1 } from './shots/act1.js';
import { ACT2 } from './shots/act2.js';
import { ACT3 } from './shots/act3.js';
import { ACT4 } from './shots/act4.js';
import { ACT5 } from './shots/act5.js';

const BUILT = {
  a1: ACT0[0], a2: ACT0[1], a3: ACT0[2], a4: ACT0[3],
  a5: ACT0[4], a6: ACT0[5], a7: ACT0[6], a8: ACT0[7],
  ...CH, ...ACT1, ...ACT2, ...ACT3, ...ACT4, ...ACT5,
};

// 按 timing.js 的 SHOTS 顺序装配
const MOUNTS = SHOTS.map((meta) => {
  const shot = BUILT[meta.id];
  if (!shot) throw new Error(`missing shot: ${meta.id}`);
  return { ...meta, ...shot };
});

export default function ({ root, pixelRatio }) {
  root.style.cssText += `
    position:relative;overflow:hidden;background:#00000C;
    font-family:"Noto Sans SC","Microsoft YaHei",sans-serif;
    -webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;
  `;

  const cv = document.createElement('canvas');
  cv.width = W * pixelRatio;
  cv.height = H * pixelRatio;
  Object.assign(cv.style, {
    position: 'absolute', left: '0', top: '0',
    width: `${W}px`, height: `${H}px`,
  });
  cv.getContext('2d').scale(pixelRatio, pixelRatio);
  root.appendChild(cv);
  const drawBg = createBackground(cv);

  // 全屏闪：盖在所有镜头之上，由 FLASHES 时间表驱动
  // 用 mix-blend-mode: screen，只在黑底上提亮，不会把金色洗白
  const flash = document.createElement('div');
  Object.assign(flash.style, {
    position: 'absolute', inset: '0', zIndex: '9',
    pointerEvents: 'none', opacity: '0',
    mixBlendMode: 'screen',
    willChange: 'opacity',
  });
  root.appendChild(flash);

  // 暗角闪（负向闪光）：给"否定"落点用，压暗而不是提亮
  const dark = document.createElement('div');
  Object.assign(dark.style, {
    position: 'absolute', inset: '0', zIndex: '8',
    pointerEvents: 'none', opacity: '0',
    background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)',
    willChange: 'opacity',
  });
  root.appendChild(dark);

  const mounted = MOUNTS.map((s) => {
    const l = layer(root);
    s._l = l;
    s.update = s.build(l) || (() => {});
    return { shot: s, el: l };
  });

  function shotAt(time) {
    let cur = null;
    for (const s of MOUNTS) if (time >= s.start - 1e-6) cur = s;
    return cur || MOUNTS[0];
  }

  function prepareFrame(time) {
    const cur = shotAt(time);
    const idx = MOUNTS.indexOf(cur);
    const prev = idx > 0 ? MOUNTS[idx - 1] : null;

    drawBg(time, cur, prev);

    // 全屏闪：取所有仍在衰减中的闪光，叠加后取最大值
    let fa = 0;
    let fcol = 'rgba(255,246,220,';
    let da = 0;
    for (const f of FLASHES) {
      const v = flashEnvelope(time, f.t, f.dur);
      if (v > 0) {
        if (f.kind === 'dark') da = Math.max(da, v * f.gain);
        else if (v * f.gain > fa) { fa = v * f.gain; fcol = f.color; }
      }
    }
    flash.style.opacity = String(Math.min(0.92, fa));
    flash.style.background = fa > 0
      ? `radial-gradient(ellipse at 50% 46%, ${fcol}0.95) 0%, ${fcol}0.45) 42%, ${fcol}0) 78%)`
      : 'transparent';
    dark.style.opacity = String(Math.min(0.9, da));

    for (const { shot, el: node } of mounted) {
      if (shot === cur) {
        node.style.display = 'block';
        node.style.zIndex = '2';
        node.style.visibility = 'visible';
        node.style.clipPath = '';
        node.style.maskImage = '';
        node.style.webkitMaskImage = '';
        node.style.transform = '';
        node.style.opacity = '1';
        node.style.filter = '';
        node.style.transformOrigin = 'center';
        shot.update(time - shot.start);
      } else if (prev && shot === prev) {
        const tr = TRANS[prev.exit] || TRANS.cut;
        const p = tr.dur > 0 ? clamp((time - cur.start) / tr.dur) : 1;
        node.style.display = 'block';
        node.style.zIndex = '3';
        node.style.visibility = 'visible';
        node.style.transformOrigin = 'center';
        applyExit(node, prev.exit, p, prev.exitOpts);
        if (p >= 1) node.style.visibility = 'hidden';
      } else {
        node.style.display = 'none';
      }
    }
  }

  return {
    prepareFrame,
    dispose() {
      mounted.forEach(({ shot, el }) => {
        if (shot.dispose) shot.dispose();
        el.remove();
      });
      cv.remove();
      flash.remove();
      dark.remove();
    },
  };
}
