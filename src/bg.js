// 背景：深蓝黑底 + 漂移冷光 + 暖光呼吸 + 体积光带 + 颗粒 + 柔和暗角
// 全部是 time 的纯函数，任意 seek 结果一致

import { W, H } from './theme.js';
import { clamp, eInOut } from './kit.js';

const NOISE = 256;

function noiseTile() {
  const c = document.createElement('canvas');
  c.width = NOISE; c.height = NOISE;
  const x = c.getContext('2d');
  const img = x.createImageData(NOISE, NOISE);
  let s = 1337;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < NOISE * NOISE; i++) {
    const v = Math.floor(rnd() * 255);
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

// 柔和径向光：用来堆叠层次，比单纯提亮底色自然
function glow(ctx, x, y, r, col, a) {
  if (a <= 0.001) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`);
  g.addColorStop(0.42, `rgba(${col},${a * 0.42})`);
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

    // 底色：比纯黑高一点，给暗部留信息
    ctx.fillStyle = '#070A12';
    ctx.fillRect(0, 0, W, H);

    // 光晕参数：从上一镜头平滑过渡到当前镜头
    const g = shot?.glow || [0.5, 0.44, 0.62, 0.55];
    const pg = prevShot?.glow || g;
    const k = prevShot ? eInOut(clamp((time - shot.start) / 0.55)) : 1;
    const gx = (pg[0] + (g[0] - pg[0]) * k) * W;
    const gy = (pg[1] + (g[1] - pg[1]) * k) * H;
    const gr = (pg[2] + (g[2] - pg[2]) * k) * W;
    const ga = pg[3] + (g[3] - pg[3]) * k;

    // 呼吸：极缓慢的漂移，保持画面"活"
    const dx = Math.sin(time * 0.31) * W * 0.018;
    const dy = Math.cos(time * 0.23) * H * 0.022;
    const breathe = 1 + Math.sin(time * 0.55) * 0.05;

    // ① 主冷光：整体提亮，范围更大
    glow(ctx, gx + dx, gy + dy, gr * 1.06 * breathe, '58,86,132', ga * 0.92);

    // ② 第二层冷光：错位，形成双光源的体积感
    glow(
      ctx,
      W * 0.5 - dx * 1.6 + W * 0.14,
      H * 0.5 - dy * 1.4 + H * 0.10,
      gr * 0.72 * breathe,
      '40,66,110',
      ga * 0.5,
    );

    // ③ 暖光：给金色落点，也把整体色温从"发灰"拉回"有光"
    glow(ctx, W * 0.5 + dx * 0.6, H * 0.52, W * 0.46, '146,110,56', 0.115);

    // ④ 顶部体积光带：模拟从上方打下来的柔光，是"提亮"最有效的一层
    const tb = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    tb.addColorStop(0, `rgba(96,132,186,${0.085 * (0.85 + 0.15 * Math.sin(time * 0.42))})`);
    tb.addColorStop(0.45, 'rgba(64,96,148,0.028)');
    tb.addColorStop(1, 'rgba(30,44,72,0)');
    ctx.fillStyle = tb;
    ctx.fillRect(0, 0, W, H * 0.62);

    // ⑤ 斜向光扫：每 4 拍过一遍，很淡，但让静态画面有"摄影感"
    const sweepPeriod = 8.1736;
    const sp = ((time % sweepPeriod) / sweepPeriod);
    const sx = -W * 0.5 + sp * W * 2.2;
    const sw = ctx.createLinearGradient(sx - W * 0.34, 0, sx + W * 0.34, H * 0.55);
    sw.addColorStop(0, 'rgba(120,158,214,0)');
    sw.addColorStop(0.5, `rgba(120,158,214,${0.042 * Math.sin(sp * Math.PI)})`);
    sw.addColorStop(1, 'rgba(120,158,214,0)');
    ctx.fillStyle = sw;
    ctx.fillRect(0, 0, W, H);

    // ⑥ 地平线微光：中下方一条极淡的冷光，托住主体
    const hl = ctx.createLinearGradient(0, H * 0.56, 0, H * 0.78);
    hl.addColorStop(0, 'rgba(70,104,158,0)');
    hl.addColorStop(0.5, 'rgba(70,104,158,0.055)');
    hl.addColorStop(1, 'rgba(70,104,158,0)');
    ctx.fillStyle = hl;
    ctx.fillRect(0, H * 0.56, W, H * 0.22);

    // ⑦ 暗角：收边但不过黑
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.48, H * 0.46, W * 0.5, H * 0.5, W * 0.82);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.62, 'rgba(2,4,10,0.20)');
    vg.addColorStop(1, 'rgba(2,4,10,0.58)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // ⑧ 颗粒：按帧偏移，消除渐变色带
    const f = Math.floor(time * 30);
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.globalCompositeOperation = 'overlay';
    ctx.translate(-(f * 37) % NOISE, -(f * 53) % NOISE);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W + NOISE, H + NOISE);
    ctx.restore();
  };
}
