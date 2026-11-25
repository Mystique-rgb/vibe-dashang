const WIDTH = 1920;
const HEIGHT = 1080;
const markedCuts = [{frame:58,x:1150,y:431,color:'255,177,137'},
  {frame:78,x:966,y:534,color:'255,228,199'}];

function streaks(ctx, x, y, age, color, power) {
  ctx.lineCap = 'round';
  const length = 645;
  for (let i = 0; i < 25; i++) {
    const angle = i * 2.39996;
    const r = 39 + (i % 7) * 31 + 590 * age;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const end = r + length * (.32 + (i % 9) / 15) * power;
    ctx.strokeStyle = `rgba(${color},${power * (i % 3 === 0 ? .52 : .24)})`;
    ctx.lineWidth = (i % 4 === 0 ? 3.3 : 1.1) * (1 - age * .65);
    ctx.beginPath();
    ctx.moveTo(x + dx * r, y + dy * r);
    ctx.lineTo(x + dx * end, y + dy * end);
    ctx.stroke();
  }
}

export function drawMarkedTransitions(ctx, frame) {
  const cut = markedCuts.find(({frame: beat}) => frame >= beat && frame < beat + 8);
  if (!cut) return;
  const delta = frame - cut.frame;
  const age = delta / 8;
  const power = (1 - age) ** 2;
  const { x, y, color } = cut;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const halo = ctx.createRadialGradient(x,y,5,x,y,1300);
  halo.addColorStop(0,`rgba(255,241,210,${power * .84})`);
  halo.addColorStop(.29,`rgba(${color},${power * .49})`);
  halo.addColorStop(1,`rgba(${color},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0,0,WIDTH,HEIGHT);
  streaks(ctx,x,y,age,color,power);
  if (cut.frame === 58 && delta < 2) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(255,251,245,${delta === 0 ? .57 : .47})`;
    ctx.fillRect(0,0,WIDTH,HEIGHT);
  }
  ctx.restore();
}

export function markedCameraImpulse(frame) {
  const cut = markedCuts.find(({frame: beat}) => frame >= beat && frame < beat + 8);
  if (!cut) return null;
  const f = frame - cut.frame;
  const strength = (1-f/8) ** 2;
  return { x: Math.cos(f * 1.88) * strength * 74,
    y: Math.cos(f * 2.13) * strength * 19,
    zoom: 1 + strength * .17 };
}
