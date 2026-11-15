// 背景：近黑底 + 极克制的暖光呼吸 + 体积光带 + 胶片颗粒 + 暗角
// 对标片 85–95% 画面是暗的，背景只负责"不是死黑"，绝不抢字
// 全部是 time 的纯函数

import { W, H } from './theme.js';
import { clamp, eInOut, rnd } from './kit.js';

const NOISE = 256;

function noiseTile() {
  const c = document.createElement('canvas');
  c.width = NOISE; c.height = NOISE;
  const x = c.getContext('2d');
  const img = x.createImageData(NOISE, NOISE);
  for (let i = 0; i < NOISE * NOISE; i++) {
    const v = Math.floor(rnd(i, 7) * 255);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

function glow(ctx, x, y, r, col, a) {
  if (a <= 0.002) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`);
  g.addColorStop(0.40, `rgba(${col},${a * 0.36})`);
  g.addColorStop(0.72, `rgba(${col},${a * 0.09})`);
  g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function createBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const tile = noiseTile();
  const pat = ctx.createPattern(tile, 'repeat');

  return function draw(time, shot, prevShot) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 底色：带极微蓝的近黑
    ctx.fillStyle = '#00000C';
    ctx.fillRect(0, 0, W, H);

    // 光晕：从上一镜头平滑过渡
    const g = shot?.glow || [0.5, 0.46, 0.60, 0.5];
    const pg = prevShot?.glow || g;
    const k = prevShot ? eInOut(clamp((time - shot.start) / 0.7)) : 1;
    const gx = (pg[0] + (g[0] - pg[0]) * k) * W;
    const gy = (pg[1] + (g[1] - pg[1]) * k) * H;
    const gr = (pg[2] + (g[2] - pg[2]) * k) * W;
    const ga = pg[3] + (g[3] - pg[3]) * k;

    // 极缓漂移：画面不静止，但没有可察觉的运动
    const dx = Math.sin(time * 0.27) * W * 0.014;
    const dy = Math.cos(time * 0.21) * H * 0.018;
    const br = 1 + Math.sin(time * 0.47) * 0.045;

    // ① 主暖光：极低强度，只给暗部一点色温
    glow(ctx, gx + dx, gy + dy, gr * 1.10 * br, '150,116,58', ga * 0.10);
    // ② 冷蓝补光：防止暖光发黄发脏
    glow(ctx, W * 0.5 - dx * 1.8, H * 0.52 - dy * 1.5, gr * 0.80 * br, '34,52,92', ga * 0.075);
    // ③ 顶部极淡光带：从上方打下来的柔光
    const tb = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    tb.addColorStop(0, `rgba(88,112,168,${0.030 * (0.85 + 0.15 * Math.sin(time * 0.38))})`);
    tb.addColorStop(0.5, 'rgba(56,74,116,0.010)');
    tb.addColorStop(1, 'rgba(24,34,58,0)');
    ctx.fillStyle = tb;
    ctx.fillRect(0, 0, W, H * 0.55);

    // ④ 斜向光扫：每 8 拍过一遍，非常淡
    const per = 4.1815;
    const sp = (time % per) / per;
    const sx = -W * 0.6 + sp * W * 2.4;
    const sw = ctx.createLinearGradient(sx - W * 0.30, 0, sx + W * 0.30, H * 0.5);
    sw.addColorStop(0, 'rgba(130,158,206,0)');
    sw.addColorStop(0.5, `rgba(130,158,206,${0.020 * Math.sin(sp * Math.PI)})`);
    sw.addColorStop(1, 'rgba(130,158,206,0)');
    ctx.fillStyle = sw;
    ctx.fillRect(0, 0, W, H);

    // ⑤ 暗角
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.47, H * 0.40, W * 0.5, H * 0.5, W * 0.80);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.58, 'rgba(0,0,8,0.22)');
    vg.addColorStop(1, 'rgba(0,0,8,0.66)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // ⑥ 颗粒：按帧偏移，消除渐变色带
    const f = Math.floor(time * 30);
    ctx.save();
    ctx.globalAlpha = 0.042;
    ctx.globalCompositeOperation = 'overlay';
    ctx.translate(-(f * 37) % NOISE, -(f * 53) % NOISE);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W + NOISE, H + NOISE);
    ctx.restore();
  };
}
