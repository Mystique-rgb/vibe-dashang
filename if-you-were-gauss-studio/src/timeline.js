import { storyboard } from './storyboard.js';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const FRAME_COUNT = Math.round(storyboard.at(-1).stamps.at(-1) * FPS);
export const DURATION = FRAME_COUNT / FPS;
const sceneByFrame = [];
const clamp = x => Math.max(0, Math.min(1, x));

for (const { id, stamps, line } of storyboard) {
  const frames = stamps.map(t => Math.round(t * FPS));
  const first = frames[0];
  const end = frames.at(-1);
  for (let shot = 0; shot < frames.length - 1; shot++) {
    for (let i = frames[shot]; i < frames[shot + 1]; i++) {
      sceneByFrame[i] = { id, line, t: i / FPS, k: shot, a: (i - first) / FPS,
        d: (end - first) / FPS, u: clamp((i - first) / (end - first)),
        v: clamp((i - frames[shot]) / (frames[shot + 1] - frames[shot])),
        cutFrame: i - frames[shot], sceneFrame: i - first };
    }
  }
}

export function findFrame(seconds) {
  const index = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(seconds * FPS)));
  return sceneByFrame[index];
}

export const cuts = storyboard.flatMap(({ stamps }) => stamps.slice(0, -1)).map(seconds => Math.round(seconds * FPS));
