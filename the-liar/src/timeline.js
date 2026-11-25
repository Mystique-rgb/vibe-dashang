// The first cut is aligned to the spoken “说” at 4.73 s, and later cuts follow the music.
export const FPS = 30;
export const CUTS = [0, 142, 222, 295, 368, 440, 537, 622, 719, 840, 937, 1034, 1130, 1203];
export const DURATION = CUTS.at(-1) / FPS;
const shots = [
  ['intro', '人羊', '', ''],
  ['title', '说谎者', '十日终焉 · 人羊游戏', ''],
  ['room', '九人围桌', '九个人，要找出唯一的说谎者。', ''],
  ['deal', '抽到就得撒谎', '九人各抽一张牌，再轮流讲自己的故事。', '身份牌'],
  ['vote', '写一个名字', '故事讲完，每个人都要写下一个名字。', '投票'],
  ['threat', '一票错，全盘输', '八人全投对，说谎者出局。错一票，其余人出局。', '人羊宣布的规则'],
  ['tales', '谁在说谎？', '九个陌生人，光听故事，谁也没法核对。', ''],
  ['clue', '48 立方米', '齐夏用座钟和地砖，估算密室里的空气。', '密室线索'],
  ['clue', '空气不够', '可九个人都没缺氧。齐夏推断，他们早已死去。', '按九人算，至少需 49.14 立方米'],
  ['flip', '九张都是说谎者', '九个人都隐瞒了自己故事的结局。', ''],
  ['host', '人羊也讲了故事', '他自称把众人聚到这里，是为了造一个「神」。', '只要求写一个名字，主持人也能被投'],
  ['verdict', '九票，全投人羊', '人羊宣布九人存活，并对自己执行了制裁。', ''],
  ['end', '你会投谁？', '如果你坐在桌边，会想到把票投给主持人吗？', ''],
];

const introCaptions = [
  [1.24, 2.55, '我是人羊。'],
  [3.30, 5.67, '本次游戏名为「说谎者」。'],
];

// The analyzer detected 74.255 BPM in half time. The dense edits use its double-time pulse.
const mainBeats = [1.3048, 2.1133, 2.9219, 3.7304, 4.5389, 5.3475, 6.1563, 6.9651, 7.7739,
  8.5826, 9.3913, 10.2000, 11.0086, 11.8171, 12.6256, 13.4340, 14.2423, 15.0505,
  15.8587, 16.6668, 17.4749, 18.2830, 19.0910, 19.8990, 20.7070, 21.5150, 22.3231,
  23.1311, 23.9392, 24.7473, 25.5554, 26.3636, 27.1718, 27.9799, 28.7881, 29.5963,
  30.4045, 31.2127, 32.0209, 32.8291, 33.6372, 34.4454, 35.2535, 36.0617, 36.8698,
  37.6780, 38.4861, 39.2942, 40.1022, 40.9103];
const beats = [0.095, 0.500, 0.900];
for (let i = 0; i < mainBeats.length - 1; i++) {
  beats.push(mainBeats[i], (mainBeats[i] + mainBeats[i + 1]) / 2);
}
beats.push(mainBeats.at(-1));

export function getFrame(time) {
  const frame = Math.max(0, Math.min(CUTS.at(-1) - 1, Math.floor(time * FPS + 0.000001)));
  const id = CUTS.findIndex(mark => mark > frame) - 1;
  const start = CUTS[id] / FPS;
  const end = CUTS[id + 1] / FPS;
  const local = Math.max(0, time - start);
  const [kind, headline, caption, kicker] = shots[id];
  const beatIndex = Math.max(0, beats.findIndex(mark => mark > time) - 1);
  const period = beats[beatIndex + 1] - beats[beatIndex];
  const beat = Math.max(0, (time - beats[beatIndex]) / period);
  const pulse = Math.exp(-beat * 8.5);
  const spoken = introCaptions.find(([a, b]) => time >= a && time < b);
  return { time, id, kind, start, end, local, progress: Math.min(1, local / (end - start)),
    beat, pulse, beatIndex, period, headline, caption: id === 0 ? spoken?.[2] ?? '' : caption, kicker };
}
