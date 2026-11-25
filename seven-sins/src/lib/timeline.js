// ------------------------------------------------------------------- timeline
// Music: 霓虹兔 - Chaikovsky, measured 132 BPM with the drop at 91.640s.
// Everything below is snapped to that beat grid (beat = 0.454545s, bar = 4 beats).
//
// The video is 50s. Pride must land ON the drop, so:
//   video 41.818s  ==  music 91.640s   =>  offset = 49.8218
// Pride's "seven sins' first" reveal starts a bar earlier, at 40.000s.

export const BPM = 132;
export const BEAT = 60 / BPM;          // 0.4545454...
export const BAR = BEAT * 4;           // 1.8181818...
export const DURATION = 50.0;

export const DROP_VIDEO = 41.818;      // pride fully appears here
export const DROP_MUSIC = 91.640;
export const MUSIC_OFFSET = DROP_MUSIC - DROP_VIDEO;   // 49.822

// Snap a time to the nearest beat, so cuts never drift off the grid.
export const q = (t) => Math.round(t / BEAT) * BEAT;

// --- the seven sins, in the order they appear (7 -> 1, so pride is last) -----
// `t0`/`t1` are the sin's own window; the second half is the name card.
export const SINS = [
  {
    key: 'lust', num: 'VII', zh: '色欲', la: 'LUXURIA',
    oppose: '贞洁', opposeLa: 'CASTITAS', demon: '阿斯莫德 ASMODEUS',
    accent: [255, 126, 186],
    scene: '凌晨两点，手机还贴在脸上',
    quote: '就再看一条，看完就睡。',
  },
  {
    key: 'gluttony', num: 'VI', zh: '暴食', la: 'GULA',
    oppose: '节制', opposeLa: 'TEMPERANTIA', demon: '别西卜 BEELZEBUB',
    accent: [255, 168, 92],
    scene: '胃已经在求饶，筷子还没停',
    quote: '这一口，真的是最后一口。',
  },
  {
    key: 'greed', num: 'V', zh: '贪婪', la: 'AVARITIA',
    oppose: '慷慨', opposeLa: 'LIBERALITAS', demon: '玛门 MAMMON',
    accent: [255, 214, 118],
    scene: '购物车满了，心还是空的',
    quote: '再多一点，就一点点。',
  },
  {
    key: 'sloth', num: 'IV', zh: '懒惰', la: 'ACEDIA',
    oppose: '勤勉', opposeLa: 'DILIGENTIA', demon: '贝尔芬格 BELPHEGOR',
    accent: [128, 200, 255],
    scene: '闹钟响了第五遍，人还在原地',
    quote: '明天吧，明天一定开始。',
  },
  {
    key: 'anger', num: 'III', zh: '愤怒', la: 'IRA',
    oppose: '耐心', opposeLa: 'PATIENTIA', demon: '撒旦 SATAN',
    accent: [255, 104, 86],
    scene: '一句话没说完，火已经烧到嗓子',
    quote: '忍？凭什么要我忍。',
  },
  {
    key: 'envy', num: 'II', zh: '嫉妒', la: 'INVIDIA',
    oppose: '仁慈', opposeLa: 'HUMANITAS', demon: '利维坦 LEVIATHAN',
    accent: [116, 244, 158],
    scene: '看到他的好消息，你先笑了一下',
    quote: '凭什么，好事总轮到他。',
  },
];

// Pride gets its own long build. Times are the beat-snapped anchors.
export const PRIDE = {
  key: 'pride', num: 'I', zh: '傲慢', la: 'SUPERBIA',
  oppose: '谦逊', opposeLa: 'HUMILITAS', demon: '路西法 LUCIFER',
  accent: [176, 140, 234],
  // six inner monologue lines, one per bar
  lines: [
    '「我从不认错。」',
    '「你的建议？我不需要。」',
    '「他们，也配和我比？」',
    '「规则是给普通人定的。」',
    '「我站的地方，就是标准。」',
    '「低头？我不会。」',
  ],
  title: '七宗罪之首',
};

// ------------------------------------------------------------------- the grid
// Beat indices are relative to video 0. Each sin gets 8 beats (two bars):
// beats 0-3 the scene line, beat 4 the hard second hit, beats 4-7 the name card.
export const T = (() => {
  const t = {};
  t.intro = [0, q(3.636)];                    // 8 beats
  t.title = [q(3.636), q(5.455)];             // 4 beats: 七宗罪 title page
  // six sins: 8 beats each, starting at 5.455
  t.sinStart = q(5.455);
  t.sinLen = BEAT * 8;                        // 3.636
  t.prideA = q(27.273);                       // monologue build, 22 beats
  t.prideB = q(37.273);                       // 七宗罪之首 slams down, 10 beats
  t.prideC = DROP_VIDEO;                      // pride fully appears, on the drop
  t.desire = q(44.545);                       // 欲望 outro
  t.end = DURATION;
  return t;
})();

// where each sin's window starts
export const sinWindow = (i) => ({
  t0: T.sinStart + i * T.sinLen,
  t1: T.sinStart + (i + 1) * T.sinLen,
});

// second hit inside a sin window (beat 4)
export const sinHit = (i) => sinWindow(i).t0 + BEAT * 4;
