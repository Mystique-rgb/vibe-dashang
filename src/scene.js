import { W, H } from './theme.js';
import { clamp, eInOut } from './kit.js';
import { createBackground } from './bg.js';
import { layer } from './ui.js';
import { TRANS, applyExit } from './transitions.js';
import { ACT0 } from './shots/act0.js';
import { CH2 } from './shots/chapter.js';
import { ACT1 } from './shots/act1.js';
import { ACT2 } from './shots/act2.js';
import { ACT3 } from './shots/act3.js';
import { ACT4 } from './shots/act4.js';
import { ACT5 } from './shots/act5.js';

const SHOTS = [...ACT0, ...CH2, ...ACT1, ...ACT2, ...ACT3, ...ACT5, ...ACT4]
  .sort((a, b) => a.start - b.start);

export default function ({ root, pixelRatio }) {
  root.style.cssText += `
    position:relative;overflow:hidden;background:#05070C;
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

  const mounted = SHOTS.map((s) => {
    const l = layer(root);
    s._l = l;
    s.build(l);
    return { shot: s, el: l };
  });

  function shotAt(time) {
    let cur = null;
    for (const s of SHOTS) if (time >= s.start - 1e-6) cur = s;
    return cur || SHOTS[0];
  }

  function prepareFrame(time) {
    const cur = shotAt(time);
    const idx = SHOTS.indexOf(cur);
    const prev = idx > 0 ? SHOTS[idx - 1] : null;

    drawBg(time, cur, prev);

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
        node.style.background = '';
        node.style.backdropFilter = '';
        node.style.webkitBackdropFilter = '';
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
    },
  };
}
