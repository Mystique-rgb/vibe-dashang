import { CUTS,FPS } from './timeline.js';

export const roomFly={ start:CUTS[2]/FPS, land:(CUTS[2]+15)/FPS };
export const wrongVoteGlitch=526/FPS;
// Start on the scene cut, then follow the half-beat grid to the next scene.
export const clockTicks=[CUTS[7],634,646,658,670,682,694,706].map(frame=>frame/FPS);
export const seatArrivals=[17,23,29,35,41,47,53,59,62].map(frame=>(CUTS[2]+frame)/FPS);
export const ruleTicks=[449,456,463,487,496].map(frame=>frame/FPS);
export const ruleFailure=509/FPS;
export const comparisonHit=801/FPS;
export const verdictHits=[14,21,28,35,42,49,56,63,70].map(frame=>(CUTS[11]+frame)/FPS);
export const taleEntrances=[0,14,23,32,41,50,59,68,77].map(frames=>(CUTS[6]+frames)/FPS);
export const taleDepartures=[11,20,29,38,47,56,65,74,83].map(frames=>(CUTS[6]+frames)/FPS);
