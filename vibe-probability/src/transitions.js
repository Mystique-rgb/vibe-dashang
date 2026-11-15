// 转场：出镜镜头在上层"让开"，露出下层已经就位的下一镜头
// 规则来自对标片：段落内部全靠揭示（reveal），硬切只留给段落转折
//
// 关键约束：图层是透明的，两镜的文字常在同一位置。
// 所以每个转场必须保证 —— 任一像素上只有一层"可读"的内容。
// 条纹类蒙版（blinds/slices/clock/prism）在中途总会留一半内容，
// 光靠切割会让两层文字打架，因此这些一律叠加散焦 + 透明度，
// 让残留读成"被抹掉的动态模糊"，而不是另一行字。

import { clamp, eExpo, eInOut, eOut, eOut4, eIn2 } from './kit.js';

export const TRANS = {
  cut: { dur: 0 },
  fade: { dur: 0.30 },
  wipeL: { dur: 0.38 },
  wipeR: { dur: 0.38 },
  wipeU: { dur: 0.38 },
  wipeD: { dur: 0.38 },
  iris: { dur: 0.42 },
  irisPt: { dur: 0.42 },
  blinds: { dur: 0.36 },
  slices: { dur: 0.36 },
  sweep: { dur: 0.40 },
  scaleOut: { dur: 0.34 },
  blurOut: { dur: 0.30 },
  dissolve: { dur: 0.38 },
  zoomBlur: { dur: 0.40 }, // 撞出去：急推 + 径向虚化
  flipY: { dur: 0.44 },    // 3D 翻面
  swipeSkew: { dur: 0.40 },// 斜切抽走
  clock: { dur: 0.46 },    // 表针式旋扫
  whip: { dur: 0.34 },     // 甩镜
  prism: { dur: 0.44 },    // 色散撕裂
  shutter: { dur: 0.38 },  // 快门帘：上下两片合拢
  fold: { dur: 0.42 },     // 折叠：纵向压扁
  pushUp: { dur: 0.38 },   // 向上推出
  slideOff: { dur: 0.38 }, // 整层滑走
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

  // 条纹类转场共用的"抹掉"曲线：过了 30% 就开始散焦并退场
  const smear = (delay = 0.24) => eOut(clamp((p - delay) / (1 - delay)));

  switch (kind) {
    case 'fade':
      op = 1 - ei;
      break;

    case 'wipeL':
      clip = `inset(0 0 0 ${(e * 100).toFixed(2)}%)`;
      break;

    case 'wipeR':
      clip = `inset(0 ${(e * 100).toFixed(2)}% 0 0)`;
      break;

    case 'wipeU':
      clip = `inset(0 0 ${(e * 100).toFixed(2)}% 0)`;
      break;

    case 'wipeD':
      clip = `inset(${(e * 100).toFixed(2)}% 0 0 0)`;
      break;

    case 'iris':
      clip = `circle(${((1 - e) * 78).toFixed(2)}% at 50% 50%)`;
      break;

    case 'irisPt': {
      const x = opts.x ?? 50;
      const y = opts.y ?? 50;
      clip = `circle(${((1 - e) * 92).toFixed(2)}% at ${x}% ${y}%)`;
      break;
    }

    case 'blinds': {
      // 横条收拢 + 散焦：条纹永远只留"影"
      const s = Math.max(0.001, (1 - e) * 22);
      mask = `repeating-linear-gradient(to bottom, #000 0 ${s.toFixed(2)}%, rgba(0,0,0,0) ${s.toFixed(2)}% ${(s * 2).toFixed(2)}%)`;
      const sm = smear(0.18);
      fil = `blur(${(sm * 13).toFixed(2)}px)`;
      op = 1 - sm * 0.85;
      break;
    }

    case 'slices': {
      const s = Math.max(0.001, (1 - e) * 16);
      mask = `repeating-linear-gradient(104deg, #000 0 ${s.toFixed(2)}%, rgba(0,0,0,0) ${s.toFixed(2)}% ${(s * 2).toFixed(2)}%)`;
      const sm = smear(0.18);
      fil = `blur(${(sm * 12).toFixed(2)}px)`;
      op = 1 - sm * 0.85;
      break;
    }

    case 'sweep': {
      // 柔边斜切：前缘带一点散焦，切过的地方不留字
      const b = 138 - e * 178;
      mask = `linear-gradient(102deg, #000 ${(b - 20).toFixed(1)}%, rgba(0,0,0,0) ${b.toFixed(1)}%)`;
      const sm = smear(0.30);
      fil = `blur(${(sm * 7).toFixed(2)}px)`;
      op = 1 - sm * 0.55;
      break;
    }

    case 'scaleOut':
      tf = `scale(${(1 + e * 0.16).toFixed(3)})`;
      op = 1 - e;
      fil = `blur(${(e * 7).toFixed(2)}px)`;
      break;

    case 'blurOut':
      op = 1 - e;
      fil = `blur(${(e * 16).toFixed(2)}px)`;
      break;

    case 'dissolve':
      op = 1 - ei;
      fil = `blur(${(e * 6).toFixed(2)}px)`;
      break;

    case 'zoomBlur':
      tf = `scale(${(1 + eq * 0.62).toFixed(3)})`;
      op = 1 - Math.pow(clamp(p), 1.7);
      fil = `blur(${(eq * 18).toFixed(2)}px)`;
      break;

    case 'flipY': {
      // 立牌翻面：绕竖轴转 + 羽化边界逐列切走
      const q = eInOut(p);
      const cut = eOut(p) * 100;
      const f = 7;
      mask = `linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${Math.max(0, cut - f).toFixed(1)}%, #000 ${Math.min(100, cut).toFixed(1)}%, #000 100%)`;
      tf = `perspective(1700px) rotateY(${(-q * 74).toFixed(2)}deg) scale(${(1 - q * 0.07).toFixed(3)})`;
      fil = `blur(${(eOut(clamp(p / 0.45)) * 11).toFixed(2)}px)`;
      op = 1 - eOut(clamp(p / 0.62)) * 0.42;
      break;
    }

    case 'swipeSkew': {
      const b = 100 - e * 118;
      clip = `polygon(0 0, ${b.toFixed(1)}% 0, ${(b + 18).toFixed(1)}% 100%, 0 100%)`;
      break;
    }

    case 'clock': {
      // 表针旋扫：扇形扩开的同时整层退后散焦
      const q = eInOut(p);
      const deg = q * 360;
      const f = 14;
      const a = (clamp((deg - f) / 360) * 100).toFixed(1);
      const b = (clamp((deg + f) / 360) * 100).toFixed(1);
      mask = `conic-gradient(from -90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) ${a}%, #000 ${b}%, #000 100%)`;
      const s = eOut(clamp(p / 0.5));
      tf = `rotate(${(q * 4).toFixed(2)}deg) scale(${(1 + s * 0.05).toFixed(3)})`;
      op = 1 - s * 0.78;
      fil = `blur(${(s * 14).toFixed(2)}px)`;
      break;
    }

    case 'whip': {
      const q = eOut(p);
      tf = `translateX(${(-q * 116).toFixed(2)}%) scale(${(1 + q * 0.14).toFixed(3)})`;
      op = 1 - eOut(clamp((p - 0.14) / 0.6));
      fil = `blur(${(q * 16).toFixed(2)}px)`;
      break;
    }

    case 'prism': {
      // 色散撕裂：中缝张开 + 整层向两侧退开 + 红青色散
      const q = eOut(p);
      const g0 = q * 24;
      mask = `linear-gradient(90deg, #000 0%, #000 ${(50 - g0 - 1).toFixed(1)}%, rgba(0,0,0,0) ${(50 - g0 + 2).toFixed(1)}%, rgba(0,0,0,0) ${(50 + g0 - 2).toFixed(1)}%, #000 ${(50 + g0 + 1).toFixed(1)}%, #000 100%)`;
      tf = `scale(${(1 + q * 0.13).toFixed(3)})`;
      op = 1 - eOut(clamp((p - 0.20) / 0.62));
      fil = `blur(${(q * 8).toFixed(2)}px) drop-shadow(${(q * 16).toFixed(1)}px 0 0 rgba(255,64,72,0.55)) drop-shadow(${(-q * 16).toFixed(1)}px 0 0 rgba(64,196,255,0.55))`;
      break;
    }

    case 'shutter': {
      // 快门帘：上下两片黑帘合拢，合拢瞬间切走
      const h = eIn2(p) * 50.5;
      mask = `linear-gradient(to bottom, rgba(0,0,0,0) ${(50 - h).toFixed(2)}%, #000 ${(50 - h).toFixed(2)}%, #000 ${(50 + h).toFixed(2)}%, rgba(0,0,0,0) ${(50 + h).toFixed(2)}%)`;
      break;
    }

    case 'fold': {
      const q = eOut(p);
      tf = `perspective(1400px) scaleY(${(1 - q * 0.94).toFixed(3)})`;
      op = 1 - eOut(clamp((p - 0.42) / 0.58));
      fil = `blur(${(q * 8).toFixed(2)}px)`;
      break;
    }

    case 'pushUp': {
      const q = eOut4(p);
      tf = `translateY(${(-q * 108).toFixed(2)}%)`;
      op = 1 - eOut(clamp((p - 0.3) / 0.7)) * 0.9;
      fil = `blur(${(q * 5).toFixed(2)}px)`;
      break;
    }

    case 'slideOff': {
      const q = eOut(p);
      tf = `translateX(${(q * 104).toFixed(2)}%)`;
      fil = `blur(${(q * 9).toFixed(2)}px)`;
      break;
    }

    default:
      break;
  }

  node.style.maskImage = mask;
  node.style.webkitMaskImage = mask;
  node.style.clipPath = clip;
  node.style.transform = tf;
  node.style.opacity = String(op);
  node.style.filter = fil;
}
