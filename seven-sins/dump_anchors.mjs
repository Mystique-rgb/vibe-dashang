import * as TL from './src/lib/timeline.js';
import * as FIG from './src/lib/figure.js';

const out = {
  BEAT: TL.BEAT,
  BAR: TL.BAR,
  DURATION: TL.DURATION,
  DROP_VIDEO: TL.DROP_VIDEO,
  DROP_MUSIC: TL.DROP_MUSIC,
  MUSIC_OFFSET: TL.MUSIC_OFFSET,
  T: TL.T,
  sinStarts: TL.SINS.map((_, i) => TL.sinWindow(i).t0),
  sinHits: TL.SINS.map((_, i) => TL.sinHit(i)),
  sinLen: TL.T.sinLen,
  nsins: TL.SINS.length,
  prideLines: TL.PRIDE.lines.length,
  HALO_EYES: FIG.HALO_EYES,
  prideTitleChars: Array.from(TL.PRIDE.title).length,
};
console.log(JSON.stringify(out, null, 2));
