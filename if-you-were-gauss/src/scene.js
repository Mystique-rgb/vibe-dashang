import { drawActOne } from './act-one.js';
import { drawActTwo } from './act-two.js';
import { drawActThree } from './act-three.js';
import { findFrame, WIDTH, HEIGHT } from './timeline.js';
import { drawCaptions } from './caption-layer.js';
import { drawTransition } from './transitions.js';
import { drawOpeningAccents } from './opening-accents.js';

const emphasis = new Map([[2, [0, 0.34, 970, 524, '255,223,169']], [7, [0, 0.44, 850, 480, '255,194,111']], [11, [2, 0.40, 1000, 456, '255,225,167']], [23, [1, 0.37, 978, 467, '255,141,97']], [32, [0, 0.72, 865, 425, '252,242,203']], [36, [0, 0.22, 1364, 588, '211,229,243']]]);

function flare(ctx, f) {
  const setting = emphasis.get(f.id);
  if (!setting || f.k !== setting[0] || f.cutFrame >= 4) return;
  const [, power, x, y, rgb] = setting;
  const opacity = power * (1 - f.cutFrame / 4) ** 2;
  const radius = f.id === 32 ? 1460 : 950;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${rgb},${opacity})`);
  gradient.addColorStop(.34, `rgba(${rgb},${opacity * .44})`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.restore();
}

export default function createScene({ root, width, height }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  Object.assign(canvas.style, { width: '100%', height: '100%', display: 'block', background: '#050710' });
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: false });
  return {
    prepareFrame(seconds) {
      const f = findFrame(seconds);
      ctx.setTransform(width / WIDTH, 0, 0, height / HEIGHT, 0, 0);
      ctx.fillStyle = '#06090f';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.save();
      try {
        const draw = f.id <= 13 ? drawActOne : f.id <= 25 ? drawActTwo : drawActThree;
        draw(ctx, f);
      } finally {
        ctx.restore();
      }
      flare(ctx, f);
      drawTransition(ctx, f);
      drawOpeningAccents(ctx, f);
      drawCaptions(ctx, f);
    },
    dispose() { canvas.remove(); }
  };
}
