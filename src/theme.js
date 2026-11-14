// 设计系统：颜色、字体、节拍网格
// 参考片 DNA：深蓝黑底、细线、单强调色（金）、否定色（红）

export const W = 1920;
export const H = 1080;

// BGM = 117.45 BPM（与参考片同一首曲子）
export const BPM = 117.45;
export const BEAT = 60 / BPM;   // 0.5109s
export const BAR = BEAT * 4;    // 2.0434s

// 小节网格：所有镜头边界都写成 bar(n)，避免手算累积误差
export const bar = (n) => Math.round(BAR * n * 10000) / 10000;

export const C = {
  ink: '#F4F6F9',
  dim: '#8B95A7',
  faint: '#414B5E',
  sub: '#5F6B80',   // 26px 级副标题可读下限
  gold: '#E8B44A',
  goldDeep: '#B8842E',
  red: '#D93A3F',
  blue: '#3E6EA8',
  line: 'rgba(150,170,200,0.32)',
  lineDim: 'rgba(150,170,200,0.14)',
};

export const F = '"Noto Sans SC","Microsoft YaHei","PingFang SC",system-ui,sans-serif';
export const FM = '"JetBrains Mono",ui-monospace,Consolas,monospace';

// 通用字号
export const FS = {
  hero: 104,
  chapter: 92,
  big: 68,
  body: 40,
  cap: 26,
  micro: 20,
};
