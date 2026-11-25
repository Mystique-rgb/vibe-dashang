const WIDTH = 1920;
const HEIGHT = 1080;
const easeOut = p => 1 - (1 - p) ** 2;
const fade = p => 1 - p * p * (3 - 2 * p);

function gradient(ctx, x0, y0, x1, y1, stops) {
  const fill = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, color] of stops) fill.addColorStop(at, color);
  return fill;
}

function polygon(ctx, fill, ...points) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// The incoming paper catches a thin band of light on its lower edge.
function paperGlint(ctx, p) {
  ctx.translate(550 + 180 * easeOut(p), 814 - 24 * p);
  ctx.rotate(-.13);
  ctx.globalAlpha *= .55 * fade(p);
  ctx.fillStyle = gradient(ctx, 0, -54, 0, 7, [
    [0, '#ffe5c400'], [.63, '#ffe5c427'], [.94, '#ffedc5b0'], [1, '#ffedc500'],
  ]);
  ctx.fillRect(0, -54, 665, 61);
  ctx.globalAlpha *= .5;
  ctx.fillStyle = '#e2c6a9';
  ctx.fillRect(23, 4, 592, 2);
  ctx.fillRect(56, 10, 580, 1);
}

// Carry the diary's turning leaf out past the left edge of the print shop.
function pageTurn(ctx, p) {
  const edge = 765 - 1000 * easeOut(p);
  const curl = 84 + 99 * Math.sin(Math.PI * p);
  ctx.globalAlpha *= .84 * fade(p);
  const paper = gradient(ctx, edge - curl, 0, edge + 138, 0, [
    [0, '#63453a'], [.42, '#ad805e'], [.79, '#f2d6a7'], [1, '#856149'],
  ]);
  ctx.beginPath();
  ctx.moveTo(-360, -25);
  ctx.lineTo(edge - 116, -25);
  ctx.bezierCurveTo(edge + 95, 306, edge - curl, 647, edge + 134, HEIGHT + 30);
  ctx.lineTo(-360, HEIGHT + 30);
  ctx.closePath();
  ctx.fillStyle = paper;
  ctx.fill();
  ctx.strokeStyle = '#f5dcb580';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(edge - 116, -25);
  ctx.bezierCurveTo(edge + 95, 306, edge - curl, 647, edge + 134, HEIGHT + 30);
  ctx.stroke();
}

function recedingDaylight(ctx, p) {
  const edge = 1180 + 780 * easeOut(p);
  ctx.globalAlpha *= .60 * fade(p);
  ctx.globalCompositeOperation = 'screen';
  const light = gradient(ctx, edge, 620, edge + 420, 510, [
    [0, '#fff5d500'], [.40, '#ffdfa95d'], [.76, '#fff2cef0'], [1, '#fffaec'],
  ]);
  ctx.fillStyle = light;
  ctx.fillRect(edge - 160, 0, WIDTH - edge + 160, HEIGHT);
}

function crossPulse(ctx, p) {
  const x = 978;
  const y = 467;
  const gap = 33 + 136 * easeOut(p);
  const length = 143 - 36 * p;
  ctx.globalAlpha *= .76 * fade(p);
  const verticalLength = length * .65;
  for (const side of [-1, 1]) {
    const armX = x + side * gap;
    const endX = armX + side * length;
    ctx.fillStyle = gradient(ctx, armX, y, endX, y, [
      [0, '#fff2d0'], [.36, '#ffbd9e9e'], [1, '#ff9d8300'],
    ]);
    ctx.fillRect(Math.min(armX, endX), y - 2, length, 4);

    const armY = y + side * gap;
    const endY = armY + side * verticalLength;
    ctx.fillStyle = gradient(ctx, x, armY, x, endY, [
      [0, '#fff2d0'], [.40, '#ffbd9e85'], [1, '#ff9d8300'],
    ]);
    ctx.fillRect(x - 1.5, Math.min(armY, endY), 3, verticalLength);
  }
}

// Fixed flecks from the winter road, carried along the bottom of the new shot.
const snow = Array.from({ length: 42 }, (_, i) => {
  const seed = i + 1;
  return {
    x: (seed * 487) % 2050 - 180,
    y: 713 + (seed * 131) % 365,
    speed: 175 + (seed * 97) % 270,
    size: 2 + (seed * 29) % 11,
    opacity: .16 + ((seed * 13) % 17) / 36,
  };
});

function driftingSnow(ctx, p) {
  const opacity = ctx.globalAlpha * fade(p);
  const rise = easeOut(p);
  ctx.fillStyle = gradient(ctx, 0, 680, 0, HEIGHT, [
    [0, '#b8d4e500'], [.53, '#b8d4e51d'], [1, '#dcebf64b'],
  ]);
  ctx.globalAlpha = opacity;
  ctx.fillRect(0, 680, WIDTH, HEIGHT - 680);
  for (const flake of snow) {
    const x = flake.x + flake.speed * p;
    const y = flake.y - (flake.size * 3 + 13) * rise;
    ctx.globalAlpha = opacity * flake.opacity;
    polygon(ctx, '#e1edf3', x, y, x + flake.size * 2.5, y - 5,
      x + flake.size * 2.5 - 2, y - 2, x + 1, y + 2);
  }
}

function starAfterglow(ctx, p, f) {
  const x = 865 - f.v * 19;
  const y = 425 + f.v * 10;
  const radius = 140 + 240 * easeOut(p);
  ctx.globalAlpha *= .48 * fade(p);
  ctx.globalCompositeOperation = 'screen';
  const corona = ctx.createRadialGradient(x, y, 0, x, y, radius);
  corona.addColorStop(0, '#ffe9b800');
  corona.addColorStop(.14, '#ffe9b800');
  corona.addColorStop(.31, '#ffdb9b55');
  corona.addColorStop(.59, '#ffd29c24');
  corona.addColorStop(1, '#ffd29c00');
  ctx.fillStyle = corona;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

// An oblique window jamb slides off frame as the spacecraft comes forward.
function windowWipe(ctx, p) {
  const x = 655 - 955 * easeOut(p);
  ctx.globalAlpha *= .87 * fade(p);
  polygon(ctx, '#111824', -320, -20, x + 88, -20, x - 98, HEIGHT + 20, -320, HEIGHT + 20);
  polygon(ctx, '#435062', x + 72, -20, x + 91, -20, x - 95, HEIGHT + 20, x - 113, HEIGHT + 20);
  polygon(ctx, '#667285', -320, 509, x - 4, 544, x - 9, 565, -320, 533);
}

// Scene/shot pairs follow the storyboard. Durations are in 30 fps project frames.
const cues = {
  2: { shot: 0, frames: 8, draw: paperGlint },       // 2.59
  13: { shot: 0, frames: 11, draw: pageTurn },       // 38.49
  17: { shot: 0, frames: 9, draw: recedingDaylight }, // 52.16
  23: { shot: 1, frames: 8, draw: crossPulse },       // 74.38
  26: { shot: 0, frames: 11, draw: driftingSnow },    // 82.93
  32: { shot: 0, frames: 10, draw: starAfterglow },   // 98.32
  36: { shot: 0, frames: 10, draw: windowWipe },       // 110.28
};

export function drawTransition(ctx, f) {
  const cue = cues[f.id];
  if (!cue || cue.shot !== f.k || f.cutFrame < 0 || f.cutFrame >= cue.frames) return;

  ctx.save();
  try {
    cue.draw(ctx, f.cutFrame / cue.frames, f);
  } finally {
    ctx.restore();
  }
}
