// 转场：出镜镜头在上层"让开"，露出下层已经就位的下一镜头
// 这样每个入场都是"揭示"而不是"淡入"，看起来更高级

import { clamp, eExpo, eInOut, eOut } from './kit.js';

export const TRANS = {
  cut: { dur: 0 },
  fade: { dur: 0.42 },
  wipeL: { dur: 0.46 },
  wipeR: { dur: 0.46 },
  wipeU: { dur: 0.46 },
  wipeD: { dur: 0.46 },
  iris: { dur: 0.52 },
  irisPt: { dur: 0.52 },
  blinds: { dur: 0.44 },
  slices: { dur: 0.46 },
  sweep: { dur: 0.50 },
  scaleOut: { dur: 0.44 },
  blurOut: { dur: 0.40 },
  dissolve: { dur: 0.5 },
  // 体积感更强的四种
  zoomBlur: { dur: 0.50 },   // 撞出去：急推 + 径向虚化
  flipY: { dur: 0.52 },      // 3D 翻面
  swipeSkew: { dur: 0.50 },  // 斜切抽走
  clock: { dur: 0.56 },      // 表针式旋扫
  whip: { dur: 0.44 },       // 甩镜：带方向感的横向甩出
  prism: { dur: 0.54 },      // 色散撕裂：红青分离 + 中缝张开
};

// p: 0→1 出镜进度
export function applyExit(node, kind, p, opts = {}) {
  const e = eExpo(p);
  const ei = eInOut(p);
  const eq = e * e;
  let clip = '';
  let tf = '';
  let op = 1;
  let fil = '';
  let mask = '';
  let msize = '';
  let bg = '';
  let bdf = '';

  switch (kind) {
    case 'fade':
      op = 1 - ei;
      break;

    case 'wipeL': // 从右侧抽走，向左退场
      clip = `inset(0 0 0 ${e * 100}%)`;
      break;

    case 'wipeR':
      clip = `inset(0 ${e * 100}% 0 0)`;
      break;

    case 'wipeU': // 向上抽走
      clip = `inset(0 0 ${e * 100}% 0)`;
      break;

    case 'wipeD':
      clip = `inset(${e * 100}% 0 0 0)`;
      break;

    case 'iris':
      clip = `circle(${(1 - e) * 78}% at 50% 50%)`;
      break;

    case 'irisPt': {
      const x = opts.x ?? 50;
      const y = opts.y ?? 50;
      clip = `circle(${(1 - e) * 92}% at ${x}% ${y}%)`;
      break;
    }

    case 'blinds': {
      // 条纹向上收拢：黑条越来越窄
      const s = (1 - e) * 26;
      clip = `polygon(0 0, 100% 0, 100% 100%, 0 100%)`;
      mask = `repeating-linear-gradient(to bottom, #000 0 ${s}%, rgba(0,0,0,0) ${s}% ${s * 2}%)`;
      break;
    }

    case 'slices': {
      const s = (1 - e) * 20;
      mask = `repeating-linear-gradient(108deg, #000 0 ${s}%, rgba(0,0,0,0) ${s}% ${s * 2}%)`;
      break;
    }

    case 'sweep': {
      // 柔边斜切：一条模糊的斜线扫过，比硬切干净
      const b = 130 - e * 162;
      mask = `linear-gradient(102deg, #000 ${(b - 26).toFixed(1)}%, rgba(0,0,0,0) ${b.toFixed(1)}%)`;
      break;
    }

    case 'scaleOut':
      tf = `scale(${1 + e * 0.18})`;
      op = 1 - e;
      fil = `blur(${e * 6}px)`;
      break;

    case 'blurOut':
      op = 1 - e;
      fil = `blur(${e * 14}px)`;
      break;

    case 'dissolve':
      op = 1 - ei;
      fil = `blur(${e * 5}px)`;
      break;

    case 'zoomBlur': {
      // 观众被"推"进下一镜：画面急速放大并散焦
      tf = `scale(${1 + eq * 0.66})`;
      op = 1 - Math.pow(clamp(p), 1.8);
      fil = `blur(${eq * 17}px)`;
      break;
    }

    case 'flipY': {
      // 立牌翻面：卡片绕竖轴转，同时被一条羽化边界从左侧吃掉
      // 关键不是"淡出"——出镜和下一镜的字占了同一块画面，
      // 只要两层同时存在就会叠。用边界把出镜层逐列切走，
      // 每个像素上永远只有一层，旋转负责给这个切法加立体感
      const q = eInOut(p);
      const r = -q * 74;
      const cut = eOut(p) * 100;
      const f = 7;
      mask = `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${Math.max(0, cut - f).toFixed(1)}%, #000 ${Math.min(100, cut).toFixed(1)}%, #000 100%)`;
      tf = `perspective(1700px) rotateY(${r.toFixed(2)}deg) scale(${(1 - q * 0.07).toFixed(3)})`;
      // 这两镜的内容都压在画面中央，光靠切割救不了重叠——
      // 让残留的那半迅速糊成一片，读起来是"被抹掉"而不是"另一行字"
      fil = `blur(${(eOut(clamp(p / 0.45)) * 11).toFixed(2)}px)`;
      op = 1 - eOut(clamp(p / 0.62)) * 0.42;
      break;
    }

    case 'swipeSkew': {
      // 斜切抽走：前缘是斜的，像一张纸被拽走
      const b = 100 - e * 118;
      clip = `polygon(0 0, ${b.toFixed(1)}% 0, ${(b + 18).toFixed(1)}% 100%, 0 100%)`;
      break;
    }

    case 'clock': {
      // 表针式旋扫：透明扇形从 12 点方向顺时针扩开
      // 角度用匀速的 eInOut——eExpo 在 p=0.5 就走完 97%，扇形只剩一条窄缝
      const q = eInOut(p);
      const deg = q * 360;
      const f = 14;
      const a = (clamp((deg - f) / 360) * 100).toFixed(1);
      const b = (clamp((deg + f) / 360) * 100).toFixed(1);
      mask = `conic-gradient(from -90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${a}%, #000 ${b}%, #000 100%)`;
      // 两段都是居中大字，斜切会切过两边的字。所以让出镜层一边被卷走一边
      // 快速散焦退后——被切开的笔画变成柔影，不再是和下一镜抢读的字
      const s = eOut(clamp(p / 0.55));
      tf = `rotate(${(q * 5).toFixed(2)}deg) scale(${(1 + s * 0.06).toFixed(3)})`;
      op = 1 - s * 0.72;
      fil = `blur(${(s * 13).toFixed(2)}px)`;
      break;
    }

    case 'whip': {
      // 甩镜：整层被甩向一侧，拖出很长的横向残影
      // 位移要比别的转场大得多才像"甩"，普通 20% 只会看着像滑走
      const q = eOut(p);
      tf = `translateX(${(-q * 118).toFixed(2)}%) scale(${(1 + q * 0.16).toFixed(3)})`;
      op = 1 - eOut(clamp((p - 0.16) / 0.6));
      fil = `blur(${(q * 15).toFixed(2)}px)`;
      break;
    }

    case 'prism': {
      // 色散撕裂：画面被一条中缝扯开，同时整层向两侧退开
      // 只开中缝不够——两镜的内容都在画面中部，中缝之外仍会叠。
      // 让两半各自向外滑走（左半往左、右半往右），
      // 加上红青色散，读起来是一层膜被撕开卷走
      const q = eOut(p);
      const g0 = q * 22;
      mask = `linear-gradient(90deg, #000 0%, #000 ${(50 - g0 - 1).toFixed(1)}%, rgba(0,0,0,0) ${(50 - g0 + 2).toFixed(1)}%, rgba(0,0,0,0) ${(50 + g0 - 2).toFixed(1)}%, #000 ${(50 + g0 + 1).toFixed(1)}%, #000 100%)`;
      // 轻微放大让撕裂有纵深，不靠位移（位移会和蒙版打架）
      tf = `scale(${(1 + q * 0.14).toFixed(3)})`;
      op = 1 - eOut(clamp((p - 0.24) / 0.62));
      fil = `blur(${(q * 6).toFixed(2)}px) drop-shadow(${(q * 18).toFixed(1)}px 0 0 rgba(255,64,72,0.6)) drop-shadow(${(-q * 18).toFixed(1)}px 0 0 rgba(64,196,255,0.6))`;
      break;
    }

    default:
      break;
  }

  node.style.maskImage = mask;
  node.style.webkitMaskImage = mask;
  node.style.maskSize = msize;
  node.style.webkitMaskSize = msize;
  node.style.background = bg;
  node.style.backdropFilter = bdf;
  node.style.webkitBackdropFilter = bdf;
  node.style.clipPath = clip;
  node.style.transform = tf;
  node.style.opacity = String(op);
  node.style.filter = fil;
}
