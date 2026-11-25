import { storyboard } from './storyboard.js';

export const FPS = 30;
export const FRAME_COUNT = 3616;
export const DURATION = FRAME_COUNT / FPS;
export const cuts = storyboard.flatMap(scene => scene.frames);
export const shots = storyboard.flatMap((scene, index) => {
  const end = storyboard[index + 1]?.frames[0] ?? FRAME_COUNT;
  return scene.frames.map((start, k) => ({
    ...scene, k, start, end: scene.frames[k + 1] ?? end,
    sceneStart: scene.frames[0], sceneEnd: end,
  }));
});
const shotByFrame = [];
for (const shot of shots) {
  for (let frame = shot.start; frame < shot.end; frame++) shotByFrame[frame] = shot;
}

export function getFrame(seconds) {
  const frame = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(seconds * FPS)));
  const shot = shotByFrame[frame];
  const cutFrame = frame - shot.start;
  const sceneFrame = frame - shot.sceneStart;
  return {
    ...shot, frame, cutFrame, sceneFrame,
    t: frame / FPS, a: sceneFrame / FPS,
    d: (shot.sceneEnd - shot.sceneStart) / FPS,
    u: sceneFrame / (shot.sceneEnd - shot.sceneStart),
    v: cutFrame / (shot.end - shot.start),
  };
}
