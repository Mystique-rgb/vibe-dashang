// Melody and vocal attacks in the supplied track, snapped to the closest 30 fps frame.
const openingBeats = [
  { frame: 3, x: 1180, y: 456, kind: 'star', gain: .90 },
  { frame: 13, x: 1180, y: 456, kind: 'ring', gain: .95 },
  { frame: 19, x: 1050, y: 530, kind: 'trace', gain: .38 },
  { frame: 26, x: 1153, y: 433, kind: 'mark', gain: 1 },
  { frame: 32, x: 1153, y: 432, kind: 'ring', gain: .83 },
  { frame: 45, x: 1153, y: 436, kind: 'trace', gain: .62 },
  { frame: 58, x: 1164, y: 435, kind: 'last', gain: .88 },
];

function core(ctx, x, y, scale, power, amber) {
  const tint = amber ? '255,180,141' : '173,221,255';
  const radius = 58 + scale * 61;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, radius);
  halo.addColorStop(0, `rgba(255,246,222,${power})`);
  halo.addColorStop(.11, `rgba(${tint},${power * .76})`);
  halo.addColorStop(.35, `rgba(${tint},${power * .22})`);
  halo.addColorStop(1, `rgba(${tint},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export function drawOpeningAccents(ctx, f) {
  if (f.id !== 1) return;
  const beat = openingBeats.findLast(cue => f.sceneFrame >= cue.frame);
  if (!beat) return;
  const since = f.sceneFrame - beat.frame;
  const p = since / (beat.kind === 'last' ? 11 : 9);
  const power = beat.gain * Math.max(0, 1 - p) ** 1.4;
  const { x, y, kind } = beat;
  const red = f.sceneFrame >= 26;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  if (!red || kind === 'last') {
    const persistent = red ? Math.max(0, 1 - p) * .35 : .25;
    core(ctx, x, y, p, Math.max(power, persistent), red);
  }
  if (p < 1) {
    ctx.globalAlpha = power;
    ctx.lineWidth = kind === 'mark' ? 2.8 : 1.75;
    ctx.strokeStyle = red ? '#ffae8d' : '#d3efff';
    if (kind === 'ring' || kind === 'last' || kind === 'star') {
      ctx.beginPath();
      ctx.arc(x, y, (kind === 'star' ? 10 : 31) + Math.sqrt(p) * 100, -.68, 2 * Math.PI - .68);
      ctx.stroke();
    }
    if (kind === 'trace' || kind === 'mark' || kind === 'last') {
      const offset = 19 + 51 * p;
      ctx.beginPath();
      ctx.moveTo(x - offset - 31, y); ctx.lineTo(x - offset, y);
      ctx.moveTo(x + offset, y); ctx.lineTo(x + offset + 31, y);
      ctx.moveTo(x, y - offset - 27); ctx.lineTo(x, y - offset);
      ctx.moveTo(x, y + offset); ctx.lineTo(x, y + offset + 27);
      ctx.stroke();
    }
    if (kind === 'mark') core(ctx, x, y, p, power * .47, true);
  }
  ctx.restore();
}
