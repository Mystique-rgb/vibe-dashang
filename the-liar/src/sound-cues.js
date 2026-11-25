import { CUTS,FPS } from './timeline.js';
import { roomFly,wrongVoteGlitch,clockTicks,taleEntrances,taleDepartures,seatArrivals,ruleTicks,ruleFailure,comparisonHit,verdictHits } from './marked-timing.js';

const cut=index=>CUTS[index]/FPS;
export const titleCues={stamp:cut(1), sweep:5.76, carry:6.97};
export const accents=[
  {time:titleCues.stamp,voice:'page-turn',gain:.72,pan:0},
  {time:titleCues.sweep,voice:'foil',gain:.82,pan:.12},
  {time:roomFly.land,voice:'table-land',gain:.82,pan:0},
  {time:cut(5)+1.08,voice:'rule-tick',gain:.93,pan:.16},
  {time:wrongVoteGlitch,voice:'glitch',gain:.82,pan:.19},
  {time:comparisonHit,voice:'comparison-hit',gain:1,pan:.16,postGain:3},
  {time:cut(9),voice:'seal',gain:.86,pan:0},
  {time:cut(10)+.39,voice:'foil',gain:.65,pan:.20},
  {time:verdictHits.at(-1),voice:'seal',gain:1,pan:0},
  {time:cut(12),voice:'release',gain:.78,pan:0},
];

const groups=[
  [3, [.08,.29,.50,.71,.92], 'card', .61],
  [3, [1.61], 'foil', .72, 'reveal'],
  [4, [.11], 'card', .63, 'paper'],
  [4, [.61,.89,1.17,1.53], 'write', .43],
  [9, [.55,1.25,1.92], 'card', .80, 'flip'],
];
const movement=[
  {time:roomFly.start+1/FPS,voice:'table-flight',gain:.87,pan:.78,panEnd:-.08},
  {time:ruleFailure,voice:'rule-failure',gain:1,pan:.27},
  ...seatArrivals.map((time,variation)=>({time,variation,voice:'seat',gain:.97,pan:Math.sin(variation*Math.PI*2/9)*.46})),
  ...ruleTicks.map((time,variation)=>({time,variation,voice:'rule-tick',gain:.88,pan:-.24,postGain:variation>=3?1.58:1})),
  ...verdictHits.slice(0,-1).map((time,variation)=>({time,variation,voice:'click',material:'count',gain:.69,pan:Math.sin(variation*Math.PI*2/9)*.30})),
  ...clockTicks.map((time,variation)=>({time,variation,voice:'clock',gain:.80,pan:.32,postGain:5.16})),
  ...taleEntrances.map((time,variation)=>({time,variation,voice:'count-reuse',pan:0, countSource:variation===1?2:0})),
  ...taleDepartures.map((time,variation)=>({time,variation,voice:'count-reuse',pan:0})),
];
export const soundCues=accents.concat(movement,groups.flatMap(([scene,times,voice,gain,material])=>times.map((local,index)=>({
  time:cut(scene)+local,voice,gain,material,variation:index,pan:times.length===1?0:(index/(times.length-1)-.5)*.42,
})))).sort((a,b)=>a.time-b.time);
