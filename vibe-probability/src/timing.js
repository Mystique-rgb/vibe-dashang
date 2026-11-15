// 全片时间表：镜头表 + 关键事件表
// 这是画面与音效的唯一真源（sfx 脚本从 tools/dump_timing.mjs 导出的 JSON 读）
// 所有时间都落在 BGM 实测节拍网格上：beat 0.522686s / bar 2.090744s / phase 0.026s

import { beat, bar, BEAT, BAR, PHASE } from './theme.js';

// ───────────────────────── 镜头表
// exit = 出镜转场（参考片规则：段落内部靠揭示，硬切只给段落转折）
export const SHOTS = [
  // ── 第一幕：钩子（慢，8 个镜头）
  { id: 'a1', start: 0, end: bar(1), exit: 'whip', glow: [0.5, 0.46, 0.62, 0.55] },
  { id: 'a2', start: bar(1), end: bar(2), exit: 'prism', glow: [0.42, 0.50, 0.58, 0.5] },
  { id: 'a3', start: bar(2), end: bar(3), exit: 'scaleOut', glow: [0.52, 0.44, 0.60, 0.5] },
  { id: 'a4', start: bar(3), end: bar(4), exit: 'sweep', glow: [0.5, 0.48, 0.66, 0.6] },
  { id: 'a5', start: bar(4), end: bar(5), exit: 'flipY', glow: [0.5, 0.42, 0.58, 0.5] },
  { id: 'a6', start: bar(5), end: bar(6), exit: 'clock', glow: [0.46, 0.52, 0.62, 0.5] },
  { id: 'a7', start: bar(6), end: bar(7), exit: 'blinds', glow: [0.5, 0.46, 0.60, 0.45] },
  { id: 'a8', start: bar(7), end: bar(8), exit: 'zoomBlur', glow: [0.5, 0.50, 0.70, 0.6] },

  // ── 章卡
  { id: 'ch', start: bar(8), end: bar(9), exit: 'shutter', glow: [0.5, 0.44, 0.50, 0.3] },

  // ── 第二幕：规则（最慢，3 个镜头）
  { id: 'b1', start: bar(9), end: bar(10), exit: 'wipeL', glow: [0.34, 0.48, 0.52, 0.42] },
  { id: 'b2', start: bar(10), end: bar(11), exit: 'wipeR', glow: [0.66, 0.48, 0.52, 0.42] },
  { id: 'b3', start: bar(11), end: bar(12), exit: 'cut', glow: [0.5, 0.48, 0.56, 0.4] },

  // ── 第三幕：图表（中速，9 个镜头）
  { id: 'c1', start: bar(12), end: bar(13), exit: 'sweep', glow: [0.46, 0.46, 0.62, 0.42] },
  { id: 'c2', start: bar(13), end: bar(14), exit: 'sweep', glow: [0.46, 0.46, 0.62, 0.42] },
  { id: 'c3', start: bar(14), end: bar(15), exit: 'sweep', glow: [0.46, 0.46, 0.62, 0.42] },
  { id: 'c4', start: bar(15), end: bar(15.75), exit: 'blurOut', glow: [0.5, 0.44, 0.64, 0.45] },
  { id: 'c5', start: bar(15.75), end: bar(16.5), exit: 'irisPt', glow: [0.5, 0.46, 0.60, 0.5] },
  { id: 'c6', start: bar(16.5), end: bar(17.25), exit: 'wipeD', glow: [0.5, 0.46, 0.60, 0.5] },
  { id: 'c7', start: bar(17.25), end: bar(18), exit: 'wipeU', glow: [0.5, 0.46, 0.60, 0.5] },
  { id: 'c8', start: bar(18), end: bar(19), exit: 'prism', glow: [0.5, 0.44, 0.66, 0.55] },
  { id: 'c9', start: bar(19), end: bar(19.75), exit: 'cut', glow: [0.5, 0.40, 0.54, 0.5] },

  // ── 第四幕：对比 + 冲刺（最快）
  { id: 'd1', start: bar(19.75), end: bar(20.5), exit: 'wipeL', glow: [0.5, 0.48, 0.62, 0.45] },
  { id: 'd2', start: bar(20.5), end: bar(21.25), exit: 'whip', glow: [0.5, 0.48, 0.62, 0.5] },
  { id: 'd3', start: bar(21.25), end: bar(22), exit: 'zoomBlur', glow: [0.5, 0.44, 0.70, 0.6] },
  { id: 'd4', start: bar(22), end: bar(23), exit: 'flipY', glow: [0.5, 0.46, 0.58, 0.45] },

  // ── 第五幕：典故
  { id: 'e1', start: bar(23), end: bar(24), exit: 'sweep', glow: [0.44, 0.50, 0.60, 0.45] },
  { id: 'e2', start: bar(24), end: bar(25), exit: 'sweep', glow: [0.44, 0.50, 0.60, 0.45] },
  { id: 'e3', start: bar(25), end: bar(26), exit: 'wipeL', glow: [0.56, 0.50, 0.58, 0.45] },
  { id: 'e4', start: bar(26), end: bar(27), exit: 'clock', glow: [0.5, 0.42, 0.52, 0.35] },

  // ── 第六幕：公式
  { id: 'f1', start: bar(27), end: bar(28), exit: 'sweep', glow: [0.5, 0.44, 0.56, 0.4] },
  { id: 'f2', start: bar(28), end: bar(29), exit: 'prism', glow: [0.5, 0.44, 0.62, 0.5] },

  // ── 落版
  { id: 'g1', start: bar(29), end: bar(30), exit: 'fade', glow: [0.5, 0.48, 0.58, 0.4] },
  { id: 'g2', start: bar(30), end: 66.05, exit: 'cut', glow: [0.5, 0.50, 0.66, 0.45] },
];

export const SH = {};
for (const s of SHOTS) SH[s.id] = s;

// 镜头内相对时间 → 绝对时间
export const at = (id, t) => +(SH[id].start + t).toFixed(4);

// ───────────────────────── 事件表
// 规则（用户要求）：**只有标记位置才有音效，其余全静音**。
// 音色按对标视频实测重做：衰减 0.06–0.14s、能量集中 47–400Hz、高频层很轻。
// 音效时间 = 画面真正落点（不是标记的点击时间；用户是在画面停住后才点的）
// kind: hit 低频落点 / ping 中频点 / tick 极短计数 / knock 木质叩击 / glass 玻璃短音 / sweep 短扫频
const E = [];
const ev = (t, kind, gain = 1, note = '') => E.push({ t: +t.toFixed(4), kind, gain, note });

// ═══ #15 · a1 的 2% 落位（0.62s）═══
ev(at('a1', 0.62), 'hit', 1.05, '#15 2% 落位');
ev(at('a1', 0.62), 'ping', 0.55, '#15 2% 中频点');

// ═══ #16 · a2 的两个赢家点由灰变金（0.48s）═══
ev(at('a2', 0.48), 'glass', 1.00, '#16 金点变黄');
ev(at('a2', 0.52), 'knock', 1.45, '#16 光晕震动');

// ═══ #17 · a4 的 63.6% 落位（0.66s）═══
ev(at('a4', 0.66), 'hit', 1.00, '#17 63.6% 落位');
ev(at('a4', 0.66), 'ping', 0.52, '#17 63.6% 点');

// ═══ #18 · a5 的 63.6% 大字（0.04s）═══
ev(at('a5', 0.04), 'hit', 1.10, '#18 63.6% 大字落');
ev(at('a5', 0.04), 'thump', 0.80, '#18 大字低频');

// ═══ #19 · 章卡「重复实验」落位（0.06s）═══
ev(at('ch', 0.06), 'hit', 1.15, '#19 章卡落');
ev(at('ch', 0.06), 'knock', 0.90, '#19 章卡叩击');

// ═══ #20 · b1「成」金勾落位（0.00s）═══
ev(at('b1', 0.00), 'glass', 0.95, '#20 成（金勾）');
ev(at('b1', 0.00), 'ping', 0.55, '#20 成 中频');

// ═══ #21 · b1「败」红叉落位（0.10s）═══
ev(at('b1', 0.10), 'knock', 0.90, '#21 败（红叉）');
ev(at('b1', 0.10), 'hit', 0.55, '#21 败 低频');

// ═══ #22 · c1 曲线到端点（1.10s）═══
ev(at('c1', 1.10), 'hit', 1.00, '#22 曲线到端点');
ev(at('c1', 1.10), 'glass', 0.70, '#22 端点光');

// ═══ #23 · c6 曲线到端点（0.58s）═══
ev(at('c6', 0.58), 'hit', 0.90, '#23 c6 到端点');
ev(at('c6', 0.58), 'glass', 0.62, '#23 c6 端点光');

// ═══ #24 · c7 曲线到端点（0.58s）═══
ev(at('c7', 0.58), 'hit', 0.90, '#24 c7 到端点');
ev(at('c7', 0.58), 'glass', 0.62, '#24 c7 端点光');

// ═══ #25 · c8 三条曲线各自到端点（0.72 / 0.77 / 0.82）═══
ev(at('c8', 0.72), 'tick', 1.55, '#25 灰线端点');
ev(at('c8', 0.77), 'knock', 1.35, '#25 白线端点');
ev(at('c8', 0.82), 'hit', 1.05, '#25 金线端点');
ev(at('c8', 0.82), 'glass', 0.75, '#25 三线收敛');

// ═══ #26 · c9 的 1−1/e 落位（0.06s）═══
ev(at('c9', 0.06), 'hit', 1.20, '#26 1−1/e 落');
ev(at('c9', 0.06), 'glass', 0.80, '#26 1−1/e 光');

// ═══ #27/#28/#29 · d1 三条对比条各自到端点（0.30 / 0.52 / 0.84）═══
ev(at('d1', 0.30), 'tick', 1.75, '#27 第一条到端点');
ev(at('d1', 0.52), 'knock', 2.30, '#28 第二条到端点');
ev(at('d1', 0.84), 'hit', 1.10, '#29 第三条到端点');
ev(at('d1', 0.84), 'glass', 0.72, '#29 第三条光');

// ═══ #30 · d2 的 114 落位（0.56s）═══
ev(at('d2', 0.56), 'hit', 1.05, '#30 114 落位');
ev(at('d2', 0.56), 'ping', 0.58, '#30 114 点');

// ═══ #31/#32/#33 · e2 三条进度条各自到端点（0.52 / 0.74 / 0.96）═══
ev(at('e2', 0.52), 'tick', 1.80, '#31 第一行到端点');
ev(at('e2', 0.74), 'knock', 1.55, '#32 第二行到端点');
ev(at('e2', 0.96), 'hit', 1.15, '#33 第三行到端点');
ev(at('e2', 0.96), 'glass', 0.78, '#33 99% 光');

export const EVENTS = E.sort((a, b) => a.t - b.t);

// 主字幕表（用于烧录字幕与 QA 核对）
export const SUBS = [
  { id: 'a1', t: at('a1', 0.66), d: 1.30, zh: '一件事，单次成功率只有 2%', en: 'One attempt. Two percent.' },
  { id: 'a2', t: at('a2', 0.52), d: 1.40, zh: '试一次，98% 是失败', en: 'Try once and you fail 98% of the time.' },
  { id: 'a3', t: at('a3', 0.62), d: 1.40, zh: '那就多试几次', en: 'So you try again. And again.' },
  { id: 'a4', t: at('a4', 0.40), d: 1.50, zh: '试到第 50 次，成了 63.6%', en: 'By try fifty, 63.6% have made it.' },
  { id: 'a5', t: at('a5', 0.52), d: 1.30, zh: '不是 100%，是 63.6%', en: 'Not 100%. 63.6%.' },
  { id: 'a6', t: at('a6', 0.60), d: 1.30, zh: '还有 36.4% 的人，没成', en: '36.4% still haven\u2019t.' },
  { id: 'a7', t: at('a7', 0.52), d: 1.30, zh: '「平均」从来不等于「保证」', en: 'An average is not a promise.' },
  { id: 'a8', t: at('a8', 0.60), d: 1.20, zh: '为什么偏偏停在 63%？', en: 'Why does it stop at 63%?' },
  { id: 'b1', t: at('b1', 0.34), d: 1.60, zh: '每一次尝试，只有成或败', en: 'Every try is a win or a loss.' },
  { id: 'b2', t: at('b2', 0.34), d: 1.60, zh: '这次的结果，不影响下一次', en: 'One result never moves the next.' },
  { id: 'b3', t: at('b3', 0.34), d: 1.60, zh: '概率不变，变的只是次数', en: 'The odds never change. The count does.' },
  { id: 'c1', t: at('c1', 0.30), d: 1.90, zh: '把次数拉长，成功率开始爬', en: 'Stretch the count and the curve climbs.' },
  { id: 'c2', t: at('c2', 0.30), d: 1.80, zh: '114 次，九成的人成了', en: 'At 114 tries, nine in ten are in.' },
  { id: 'c3', t: at('c3', 0.30), d: 1.80, zh: '229 次，99% 的人成了', en: 'At 229 tries, 99% are in.' },
  { id: 'c4', t: at('c4', 0.30), d: 1.00, zh: '但它永远碰不到 100%', en: 'It never quite touches 100.' },
  { id: 'c5', t: at('c5', 0.22), d: 1.40, zh: '第 50 次这里，正好 63.6%', en: 'At try fifty: 63.6%.' },
  { id: 'c6', t: at('c6', 0.22), d: 1.40, zh: '换成 1% 的难度，第 100 次', en: 'Make it 1%: try one hundred.' },
  { id: 'c7', t: at('c7', 0.22), d: 1.40, zh: '换成 0.5%，第 200 次', en: 'Make it 0.5%: try two hundred.' },
  { id: 'c8', t: at('c8', 0.30), d: 1.70, zh: '三次都停在 63% 上下', en: 'All three land near 63%.' },
  { id: 'c9', t: at('c9', 0.34), d: 1.40, zh: '这个数，和难度无关', en: 'That number ignores difficulty.' },
  { id: 'd1', t: at('d1', 0.30), d: 1.30, zh: '试 10 次 18.3%，试 229 次 99%', en: 'Ten tries: 18.3%. Two twenty-nine: 99%.' },
  { id: 'd2', t: at('d2', 0.26), d: 1.20, zh: '90% 在第 114 次', en: 'Ninety percent: try 114.' },
  { id: 'd3', t: at('d3', 0.24), d: 1.30, zh: '63.6 → 90 → 99', en: '63.6. 90. 99.' },
  { id: 'd4', t: at('d4', 0.30), d: 1.50, zh: '差的不是运气，是次数', en: 'The gap isn\u2019t luck. It\u2019s the count.' },
  { id: 'e1', t: at('e1', 0.30), d: 1.50, zh: '抽卡 2% 出货，50 连有 63.6%', en: 'A 2% drop, fifty pulls: 63.6%.' },
  { id: 'e2', t: at('e2', 0.30), d: 1.70, zh: '100 连 86.7%，229 连才 99%', en: 'A hundred pulls: 86.7%. It takes 229 for 99%.' },
  { id: 'e3', t: at('e3', 0.30), d: 1.70, zh: '投 50 家，约 32 家有回音', en: 'Fifty applications: about thirty-two replies.' },
  { id: 'e4', t: at('e4', 0.30), d: 1.70, zh: '伯努利，1713 年《推测术》', en: 'Jacob Bernoulli, Ars Conjectandi, 1713.' },
  { id: 'f1', t: at('f1', 0.30), d: 1.80, zh: '失败 n 次，是 0.98 的 n 次方', en: 'Fail n times: 0.98 to the n.' },
  { id: 'f2', t: at('f2', 0.30), d: 1.80, zh: 'n 取 50，就是 1 减 1/e', en: 'Set n to fifty and it becomes 1 minus 1/e.' },
  { id: 'g1', t: at('g1', 0.34), d: 1.60, zh: '平均值不是承诺，是概率', en: 'An average is a probability, not a promise.' },
  { id: 'g2', t: at('g2', 0.26), d: 2.40, zh: '别停，再试一次', en: 'Don\u2019t stop. Try once more.' },
];

// 按镜头 id 取字幕
export const SUBOF = {};
for (const s of SUBS) SUBOF[s.id] = s;
export const SUB = (id) => SUBOF[id];

// ───────────────────────── 全屏闪光表（scene.js 驱动，盖在所有镜头之上）
// 只给"强力进场"和关键落点用；kind: flash 提亮 / dark 压暗
export const FLASHES = [
  // ① 开场首拍
  { t: 0.026, dur: 0.52, gain: 0.62, kind: 'flash', color: 'rgba(243,196,82,' },
  // ① a1 的 2% 砸落 —— 标记 #1「2%加一个强有力的进场特效」
  { t: at('a1', 0.46), dur: 0.46, gain: 0.55, kind: 'flash', color: 'rgba(243,196,82,' },
  // a2 98% 红字落点：压暗 + 一点红
  { t: at('a2', 0.54), dur: 0.34, gain: 0.30, kind: 'dark' },
  // a3 重排完成
  { t: at('a3', 0.92), dur: 0.30, gain: 0.26, kind: 'flash', color: 'rgba(242,235,220,' },
  // a4 63.6% 落位
  { t: at('a4', 0.70), dur: 0.36, gain: 0.34, kind: 'flash', color: 'rgba(243,196,82,' },
  // a5 63.6% 大字
  { t: at('a5', 0.04), dur: 0.44, gain: 0.44, kind: 'flash', color: 'rgba(243,196,82,' },
  // a6 36.4% 红字：压暗
  { t: at('a6', 0.54), dur: 0.34, gain: 0.34, kind: 'dark' },
  // a7 划线
  { t: at('a7', 0.46), dur: 0.26, gain: 0.22, kind: 'dark' },
  // a8 问句
  { t: at('a8', 0.02), dur: 0.42, gain: 0.30, kind: 'flash', color: 'rgba(242,235,220,' },
  // ③ 章卡 —— 标记 #3「强有力的进场音效」
  { t: at('ch', 0.02), dur: 0.62, gain: 0.58, kind: 'flash', color: 'rgba(243,196,82,' },
  // ④ 规则卡 b1 —— 标记 #4「整个场景加转场特效」
  { t: at('b1', 0.02), dur: 0.38, gain: 0.30, kind: 'flash', color: 'rgba(242,235,220,' },
  { t: at('b2', 0.02), dur: 0.34, gain: 0.24, kind: 'flash', color: 'rgba(242,235,220,' },
  { t: at('b3', 0.02), dur: 0.34, gain: 0.24, kind: 'flash', color: 'rgba(242,235,220,' },
  // 图表段每次换轨给一点微光
  { t: at('c1', 0.02), dur: 0.30, gain: 0.20, kind: 'flash', color: 'rgba(242,235,220,' },
  // ⑤ c1 曲线到端点 —— 标记 #5
  { t: at('c1', 1.14), dur: 0.44, gain: 0.40, kind: 'flash', color: 'rgba(243,196,82,' },
  { t: at('c2', 0.52), dur: 0.36, gain: 0.30, kind: 'flash', color: 'rgba(243,196,82,' },
  { t: at('c3', 0.52), dur: 0.36, gain: 0.34, kind: 'flash', color: 'rgba(243,196,82,' },
  // ⑥ c6 端点 —— 标记 #6
  { t: at('c6', 0.54), dur: 0.36, gain: 0.32, kind: 'flash', color: 'rgba(243,196,82,' },
  // ⑦ c7 端点 —— 标记 #7
  { t: at('c7', 0.54), dur: 0.36, gain: 0.32, kind: 'flash', color: 'rgba(243,196,82,' },
  // ⑧ c8 三条收敛 —— 标记 #8
  { t: at('c8', 0.86), dur: 0.40, gain: 0.38, kind: 'flash', color: 'rgba(243,196,82,' },
  // ⑨ c9 1−1/e —— 标记 #9「强有力的进场动效」
  { t: at('c9', 0.06), dur: 0.56, gain: 0.62, kind: 'flash', color: 'rgba(243,196,82,' },
  // ⑩ d1 三条对比条到达端点 —— 标记 #10
  { t: at('d1', 0.32), dur: 0.26, gain: 0.20, kind: 'flash', color: 'rgba(243,196,82,' },
  { t: at('d1', 0.54), dur: 0.26, gain: 0.22, kind: 'flash', color: 'rgba(243,196,82,' },
  { t: at('d1', 0.84), dur: 0.40, gain: 0.42, kind: 'flash', color: 'rgba(243,196,82,' },
  // ⑪ d2 114 连闪 —— 标记 #11
  { t: at('d2', 0.30), dur: 0.20, gain: 0.20, kind: 'flash', color: 'rgba(242,235,220,' },
  { t: at('d2', 0.56), dur: 0.44, gain: 0.46, kind: 'flash', color: 'rgba(243,196,82,' },
  // d3 三个数字
  { t: at('d3', 0.24), dur: 0.22, gain: 0.18, kind: 'flash', color: 'rgba(242,235,220,' },
  { t: at('d3', 0.48), dur: 0.22, gain: 0.18, kind: 'flash', color: 'rgba(242,235,220,' },
  // d4 结句
  { t: at('d4', 0.02), dur: 0.40, gain: 0.34, kind: 'flash', color: 'rgba(243,196,82,' },
  // ⑫ e2 三个进度条 —— 标记 #12
  { t: at('e2', 0.52), dur: 0.28, gain: 0.22, kind: 'flash', color: 'rgba(243,196,82,' },
  { t: at('e2', 0.74), dur: 0.28, gain: 0.24, kind: 'flash', color: 'rgba(243,196,82,' },
  { t: at('e2', 0.96), dur: 0.42, gain: 0.46, kind: 'flash', color: 'rgba(243,196,82,' },
  // ⑬ f1 公式 —— 标记 #13「强有力的进场特效」
  { t: at('f1', 0.02), dur: 0.54, gain: 0.58, kind: 'flash', color: 'rgba(243,196,82,' },
  // f2 代入
  { t: at('f2', 0.40), dur: 0.46, gain: 0.50, kind: 'flash', color: 'rgba(243,196,82,' },
  // 落版
  { t: at('g2', 0.02), dur: 0.48, gain: 0.34, kind: 'flash', color: 'rgba(243,196,82,' },
];
