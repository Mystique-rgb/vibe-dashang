import * as TL from './src/lib/timeline.js';
import * as W from './src/lib/wonders.js';

const out = {
  BEAT: TL.BEAT,
  BAR: TL.BAR,
  DURATION: TL.DURATION,
  DROP_VIDEO: TL.DROP_VIDEO,
  DROP_MUSIC: TL.DROP_MUSIC,
  MUSIC_OFFSET: TL.MUSIC_OFFSET,
  T: TL.T,
  wonderStarts: TL.WONDERS.map((_, i) => TL.wonderWindow(i).t0),
  wonderHits: TL.WONDERS.map((_, i) => TL.wonderHit(i)),
  wonderLen: TL.T.sinLen,
  nwonders: TL.WONDERS.length,
  buildLines: TL.EVEREST.lines.length,
  WONDER_POINTS: W.WONDER_POINTS,
  titleChars: Array.from(TL.EVEREST.title).length,
};
console.log(JSON.stringify(out, null, 2));
