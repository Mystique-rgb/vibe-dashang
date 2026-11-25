// ------------------------------------------------------------------- timeline
// 《传统七大自然奇观》 — 50s / 1920x1080 / 30fps
//
// This is the seven-sins skeleton, re-skinned: same 132 BPM grid, same cut
// rhythm, same drop placement. Only the content layer changes.
//
// Music: 霓虹兔 - Chaikovsky, measured 132 BPM, drop at 91.640s.
// Everest must land ON the drop:
//   video 41.818s  ==  music 91.640s   =>  offset = 49.8218
// Everest's "地球之巅" reveal starts a bar earlier, at 37.273s.

export const BPM = 132;
export const BEAT = 60 / BPM;          // 0.4545454...
export const BAR = BEAT * 4;           // 1.8181818...
export const DURATION = 50.0;

export const DROP_VIDEO = 41.818;      // Everest fully appears here
export const DROP_MUSIC = 91.640;
export const MUSIC_OFFSET = DROP_MUSIC - DROP_VIDEO;   // 49.822

// Snap a time to the nearest beat, so cuts never drift off the grid.
export const q = (t) => Math.round(t / BEAT) * BEAT;

// --- the seven wonders, in the order they appear (7 -> 1, Everest last) ------
// `scene` is the setup line on the first half, `quote` is the punch.
// `stat1`/`stat2` replace the old oppose/demon rows on the name card.
export const WONDERS = [
  {
    key: 'canyon', num: 'VII', zh: '科罗拉多大峡谷', la: 'PROFUNDITAS',
    accent: [232, 93, 44],
    where: '北美洲 · 美国 · 亚利桑那',
    scene: '一条河，把高原劈开了 446 公里',
    quote: '中间那 12 亿年的岩层，被整个抹掉了。',
    stat1: '446 KM 长 · 1,857 M 深',
    stat2: '最完整的 20 亿年岩层剖面',
  },
  {
    key: 'falls', num: 'VI', zh: '维多利亚瀑布', la: 'FRAGOR',
    accent: [46, 217, 195],
    where: '非洲 · 赞比亚 / 津巴布韦',
    scene: '1.7 公里宽的水，从 108 米高处一起砸下',
    quote: '本地人叫它「雷鸣之雾」，50 公里外能看见。',
    stat1: '1,708 M 宽 · 108 M 高',
    stat2: '世界最大的整幅下落水帘',
  },
  {
    key: 'cave', num: 'V', zh: '猛犸洞', la: 'LABYRINTHUS',
    accent: [224, 164, 75],
    where: '北美洲 · 美国 · 肯塔基',
    scene: '地下 686 公里，而且还在变长',
    quote: '名字跟猛犸象没关系，洞里从没挖出过一头。',
    stat1: '686 KM 已测绘通道',
    stat2: '世界最长洞穴系统',
  },
  {
    key: 'glacier', num: 'IV', zh: '冰河湾', la: 'GLACIES',
    accent: [111, 216, 245],
    where: '北美洲 · 美国 · 阿拉斯加',
    scene: '1750 年，这里根本没有湾',
    quote: '一条冰川，用 265 年退出了 105 公里。',
    stat1: '1,045 条冰川 · 7 条潮水冰川',
    stat2: '有记录以来最快的冰川退缩',
  },
  {
    key: 'baikal', num: 'III', zh: '贝加尔湖', la: 'ANTIQUITAS',
    accent: [47, 155, 255],
    where: '亚洲 · 俄罗斯 · 西伯利亚',
    scene: '一口湖，装着地球五分之一的淡水',
    quote: '它比整个北美五大湖加起来还多。',
    stat1: '1,642 M 深 · 23,615 KM³',
    stat2: '世界最深 · 最老 · 蓄水最多',
  },
  {
    key: 'yellowstone', num: 'II', zh: '黄石', la: 'FERVOR',
    accent: [242, 196, 14],
    where: '北美洲 · 美国 · 怀俄明',
    scene: '脚下 8 公里，是活的岩浆',
    quote: '全球一半的间歇泉，都挤在这一个园子里。',
    stat1: '10,000 个地热特征',
    stat2: '世界第一个国家公园',
  },
];

// Everest gets its own long build. Times are the beat-snapped anchors.
export const EVEREST = {
  key: 'everest', num: 'I', zh: '珠穆朗玛', la: 'CULMEN',
  accent: [255, 179, 71],
  where: '亚洲 · 中国 / 尼泊尔 · 喜马拉雅',
  // six facts, one per bar, escalating toward the reveal
  lines: [
    '8,848.86 米。含 3.5 米雪盖。',
    '岩面，只有 8,844.43 米。',
    '峰顶气压，是海平面的三分之一。',
    '峰顶的岩石，是 4 亿年前的海底石灰岩。',
    '里面嵌着三叶虫和海百合的碎片。',
    '你踩着的，是远古的海。',
  ],
  title: '地球之巅',
  stat1: '8,848.86 M 海拔',
  stat2: '地球海拔最高点',
};

// ------------------------------------------------------------------- the grid
// Beat indices are relative to video 0. Each wonder gets 8 beats (two bars):
// beats 0-3 the scene line, beat 4 the hard second hit, beats 4-7 the name card.
export const T = (() => {
  const t = {};
  // marker #2: the intro used to hold 8 beats and the user wants the cut at
  // ~1.97 s, so it now holds 4 beats and everything downstream moves up 4.
  t.intro = [0, q(1.818)];                    // 4 beats
  t.title = [q(1.818), q(3.636)];             // 4 beats: 自然奇观 chapter card
  // six wonders: 8 beats each, starting at 3.636
  t.sinStart = q(3.636);
  t.sinLen = BEAT * 8;                        // 3.636
  t.buildA = q(25.455);                       // Everest monologue build, 26 beats
  t.buildB = q(37.273);                       // 地球之巅 slams down, 10 beats
  t.buildC = DROP_VIDEO;                      // Everest fully appears, on the drop
  // marker #26: hold the Everest card longer before cutting to the outro
  // (was 6 beats -> now 10, taking 4 from the outro which had 12).
  t.outro = q(46.364);                        // closing card
  t.end = DURATION;
  return t;
})();

// where each wonder's window starts
export const wonderWindow = (i) => ({
  t0: T.sinStart + i * T.sinLen,
  t1: T.sinStart + (i + 1) * T.sinLen,
});

// second hit inside a wonder window (beat 4)
export const wonderHit = (i) => wonderWindow(i).t0 + BEAT * 4;

// kept for the audio builder's benefit: same names as before
export const sinWindow = wonderWindow;
export const sinHit = wonderHit;
export const SINS = WONDERS;
export const PRIDE = EVEREST;
