// 设计令牌：配色、字体、节拍网格
// 视觉 DNA 来自对标片实测取色：#00000C 近黑底 / #F2EBDC 米白 / 单强调金 / 否定红
// 节拍网格来自 BGM 实测：114.79 BPM，beat 0.5227s，网格相位 0.026s
// 所有镜头边界都写成 bar(n) / beat(n)，不手算时间，避免累积误差

export const W = 1920;
export const H = 1080;

export const BPM = 114.79;
export const BEAT = 60 / BPM; // 0.522686 s
export const BAR = BEAT * 4; // 2.090744 s
export const PHASE = 0.026; // 实测网格起点

// 整片时长：BGM 是 66.06s，落版镜头从 bar(30)=62.75 一直铺到音乐尾
export const DURATION = 66.05;

export const beat = (n) => +(PHASE + BEAT * n).toFixed(4);
export const bar = (n) => +(PHASE + BAR * n).toFixed(4);

// 每拍衰减脉冲：用来给背景/描边加"呼吸"，不用实时动画
export const pulseAt = (t, decay = 0.17) => Math.exp(-((t % BEAT) / decay));

export const C = {
  ink: '#F2EBDC', // 主文字：米白，不是纯白
  ink2: '#CFC6B4', // 次级文字
  dim: '#8A8578', // 英文字幕 / 轴标签
  faint: '#4A463C', // 极暗结构线
  gold: '#F3C452', // 唯一强调色，每屏最多一处
  goldSoft: 'rgba(243,196,82,0.55)',
  goldGhost: 'rgba(243,196,82,0.16)',
  red: '#DD2F2D', // 失败 / 负向
  redSoft: 'rgba(221,47,45,0.6)',
  bg: '#00000C', // 带极微蓝的近黑
  line: 'rgba(242,235,220,0.16)',
  lineDim: 'rgba(242,235,220,0.07)',
};

// 中文：思源黑体族（本机有 Noto Sans SC）
export const F = '"Noto Sans SC","Source Han Sans SC","Microsoft YaHei","PingFang SC",sans-serif';
// 拉丁数字：等宽感、紧字距，滚动时不抖
export const FN = '"Segoe UI","Helvetica Neue",Arial,"Noto Sans SC",sans-serif';
export const FM = 'ui-monospace,"Consolas","Source Code Pro",monospace';

export const FS = {
  hero: 372, // 超大数值（主视觉）
  hero2: 268,
  chapter: 112, // 章节标题
  big: 104, // 次大数字
  mid: 84,
  body: 72, // 主字幕中文
  small: 52,
  sub: 31, // 英文副字幕
  cap: 27, // 轴标签
  micro: 21, // 角标
};

// 版式锚点
export const L = {
  safe: 96, // 左右安全边距
  subBottom: 110, // 字幕块底边
  capTop: 84, // 角标顶边
};
