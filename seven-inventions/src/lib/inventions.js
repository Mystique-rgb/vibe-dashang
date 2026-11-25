const clamp = value => Math.max(0, Math.min(1, value));
const repeat = (count, draw) => Array.from({ length: count }, (_, i) => draw(i));
const oval = (x, y, rx, ry) => `M${x - rx},${y}a${rx},${ry} 0 1 0 ${2 * rx},0a${rx},${ry} 0 1 0 ${-2 * rx},0`;
const pointLine = points => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('');
const wave = (x, y, direction) => pointLine(repeat(41, i => [
  x + direction * i * 1.12,
  y + Math.sin(i * .72) * (3 + 13 * Math.sin(Math.PI * i / 40) ** 2),
]));

// Each beat sets the start and span of its paths in normalized drawing time.
function beat(start, span, paths, weight = 1, metal) {
  return { start, span, paths, weight, metal };
}

const camera = {
  fills: [
    [.22, '#2a1b16', 'M-139,-45L-78,-87 49,-86 106,-57V65L53,99 -139,69Z'],
    [.38, '#42291b', 'M-139,-45L-54,-44V78L-139,69Z'],
    [.53, '#503920', oval(-126, 9, 26, 35)],
  ],
  beats: [
    beat(0, .42, [
      'M-139,-45L-78,-87 49,-86 106,-57V65L53,99 -139,69Z',
      'M-139,-45L-54,-44 5,-82M-54,-44V78M-54,-44L53,-25 106,-57M53,-25V99',
      'M-147,79L52,110 117,70M-147,79V91L52,121 117,81V70',
    ], 0),
    beat(.18, .46, [
      'M-47,-32L42,-15V81L-47,67ZM42,-15L89,-45V58L42,81',
      'M57,-29L83,-47V53L57,69ZM106,-57L114,-55V62L106,65',
      'M93,-8l8,-4v27l-8,5ZM66,74l15,-8v8l-15,9Z',
      'M-72,-81L26,-80 76,-62M-100,-69L-18,-68M-134,54l70,10M-133,60l65,9',
      ...repeat(5, i => `M${-38 + 15 * i},${-28 + 3 * i}V${69 + 2.4 * i}`),
    ]),
    beat(.33, .44, [
      'M-124,-26L-90,-30C-75,-30 -69,-12 -69,5S-76,32 -90,34L-124,44',
      oval(-126, 9, 26, 35), oval(-126, 9, 19, 27), oval(-126, 9, 11, 18),
      'M-105,-22Q-88,7 -106,38M-99,-25Q-82,5 -100,36M-93,-27Q-76,4 -94,34',
      'M-131,-5Q-139,3 -134,15',
    ], 0, '#e6b367'),
    beat(.65, .19, [
      ...[[-128,-35],[-65,-34],[-126,60],[-65,68],[96,-43],[96,55]].map(([x,y]) => oval(x,y,2.4,2.4)),
      'M-45,92l24,4m14,3 17,2M28,106l14,2',
    ], 2),
  ],
};

const telephone = {
  fills: [
    [.22, '#222732', 'M-91,-37Q-72,-32 -51,-6L-27,-1V15L-54,20Q-75,43 -91,46Z'],
    [.28, '#292429', 'M53,1Q74,-7 92,-27V31Q74,24 53,19L28,19V1Z'],
    [.39, '#2e211b', 'M-115,66L89,66 116,82 116,96H-115Z'],
  ],
  beats: [
    beat(0, .41, [
      oval(-91, 4, 19, 42), 'M-91,-38Q-73,-35 -60,-18L-49,-6 -27,-2V15L-53,20Q-70,41 -91,46',
      'M29,1H52Q72,-5 92,-27M29,19H52Q73,23 92,31', oval(92, 2, 15, 29),
      'M-115,66H89L116,82V96H-115ZM-115,82H116',
    ], 0),
    beat(.2, .44, [
      oval(-93, 4, 12, 32), oval(92, 2, 8, 19), oval(92, 2, 3, 8),
      'M-31,-3Q-19,-2 -19,7T-31,16M31,1Q20,8 31,19M-54,20V66H-69V31M49,19V65H62V22',
      'M-20,8C-1,8 -10,49 12,49S47,37 35,28M-100,88H95',
      'M-10,66V59Q0,51 10,59V66M-5,59V48M8,58V49',
    ]),
    beat(.43, .43, [wave(-104,-57,-1), wave(103,-51,1), 'M-118,-24Q-128,-8 -123,17M118,-19Q128,1 117,23'], 0),
    beat(.63, .22, ['M-85,72H-58M45,72H70', oval(-103,89,3,2), oval(103,89,3,2)], 2),
  ],
};

const glass = 'M-37,61C-39,42 -66,35 -78,10C-107,-48 -66,-137 0,-142C66,-137 107,-48 78,10C66,35 39,42 37,61Z';
const lamp = {
  fills: [[.35, '#122430', glass], [.48, '#37291d', 'M-37,61H37V113L22,129H-22L-37,113Z']],
  beats: [
    beat(0, .46, [glass, 'M-37,61H37V113L22,129H-22L-37,113Z', oval(0,132,15,6)], 0),
    beat(.19, .44, [
      'M-23,72V46L-15,29V-3M23,72V46L15,29V-3M-12,61V32Q0,23 12,32V61',
      'M-27,60Q-29,40 -52,25M-65,11C-84,-16 -79,-65 -57,-91M-50,-100l9,-9',
      'M17,-123Q49,-115 64,-86M71,-73l4,13',
      ...repeat(5, i => `M-37,${71 + 9 * i}Q0,${77 + 9 * i} 37,${66 + 9 * i}`),
    ]),
    beat(.37, .41, [
      'M-15,-3C-22,-18 -37,-41 -31,-62C-28,-76 -14,-87 0,-87C14,-87 28,-76 31,-62C37,-41 22,-18 15,-3',
      'M-16,-12C-24,-25 -33,-45 -28,-62Q-20,-82 0,-83Q20,-82 28,-62C33,-45 24,-25 16,-12',
      oval(-15,-3,3,3), oval(15,-3,3,3),
    ], 0, '#ffc477'),
    beat(.65, .19, ['M-26,116Q0,123 26,116', 'M0,32V17', 'M-7,-142l2,-8h10l2,8'], 2),
  ],
};

const upperWing = 'M-154,-62Q-51,-101 81,-88L147,-64 88,-49Q-52,-54 -149,-50Z';
const lowerWing = 'M-153,35Q-54,3 68,9L148,31 82,52Q-39,45 -146,49Z';
const propeller = (x, y) => `M${x},${y}q-17,-15 -9,-32q10,-6 13,31q17,15 9,32q-10,6 -13,-31Z`;
const airplane = {
  fills: [[.25, '#292e34', upperWing], [.32, '#2f3334', lowerWing]],
  beats: [
    beat(0, .43, [upperWing, lowerWing, 'M-154,-62Q-36,-77 88,-49M-153,35Q-42,20 82,52'], 0),
    beat(.18, .47, [
      'M-126,-53l10,94M-70,-63l8,91M-7,-66l6,93M54,-62l6,103M111,-54l10,89',
      'M-125,-53l63,81 -8,-91 69,90 -6,-93 67,107 -6,-103 67,97M-116,41l46,-104 69,90 55,-89 67,97',
      'M-42,32l-73,46 14,10 146,-3 59,-24M-117,78l-13,-15 14,-4 19,13M45,85l10,-11 43,-11',
      'M-131,63l-23,-10 42,-6M98,64l35,-14 14,6 -22,12 -29,2Z',
      'M-22,26l16,-14h27l13,15M-32,39l21,15 46,1 25,-18',
    ]),
    beat(.37, .38, [
      propeller(-44,-12), oval(-44,-12,4,4), propeller(77,-14), oval(77,-14,4,4),
      'M-44,-12l26,26M77,-14L29,14M-61,-34q-12,18 -4,36M94,4q11,-18 3,-35',
    ], 0, '#d4c19b'),
    beat(.57, .28, [
      ...repeat(10, i => `M${-125 + i * 23},${-69 - 13 * Math.sin(i * .34)}l20,${12 + i * .8}`),
      ...repeat(9, i => `M${-125 + i * 24},${29 - 14 * Math.sin(i * .36)}l20,${12 + i * .6}`),
    ], 2),
  ],
};

const box = 'M-151,-30L-103,-63 149,-26V60L103,96 -151,59Z';
const container = {
  fills: [[.24, '#2b3339', box], [.39, '#171e26', 'M103,7L149,-26V60L103,96Z']],
  beats: [
    beat(0, .43, [box, 'M-151,-30L103,7 149,-26M103,7V96M-143,-21L95,13V87L-143,52Z', 'M-143,52L95,87M110,12l32,-23v67l-32,26Z'], 0),
    beat(.2, .46, [
      ...repeat(16, i => {
        const x = -139 + i * 14.6;
        const y = -16 + i * 2.13;
        return `M${x},${y}v65l4,3v-65Z`;
      }),
      ...repeat(6, i => `M${-133 + i * 39},${-33 + i * 5.7}l32,-22`),
      'M126,0v70M119,6v69M135,-6v70M112,52l9,-6M130,39l10,-7',
    ]),
    beat(.32, .47, [
      'M2,-134v15q0,9 9,9q7,0 7,-8M11,-110L-111,-69 121,-35Z',
      'M11,-110L-143,-39 101,-3ZM-111,-69l-1,6M121,-35v5M101,-3V7M-143,-39v9',
      'M-144,-36l33,-25 235,34 -24,19Z',
    ], 1, '#bdcee0'),
    beat(.62, .25, [
      ...[[-151,-30],[94,6],[-151,51],[94,84]].map(([x,y]) => `M${x},${y}l9,1.3v8l-9,-1.3ZM${x+3},${y+4}l3,.4`),
      'M143,-22l6,-4v8l-6,4ZM143,55l6,-4v9l-6,4Z',
    ], 0),
  ],
};

const satellite = {
  fills: [
    [.23, '#1a3045', 'M-154,-68L-65,-60 -56,-30 -145,-38ZM45,-55L134,-48 148,-17 60,-24Z'],
    [.31, '#37342a', 'M-62,-55L-19,-87 43,-79 57,-16 14,17 -48,7Z'],
  ],
  beats: [
    beat(0, .43, [
      'M-62,-55L-19,-87 43,-79 57,-16 14,17 -48,7ZM-62,-55L0,-47 43,-79M0,-47L14,17',
      'M-154,-68L-65,-60 -56,-30 -145,-38ZM45,-55L134,-48 148,-17 60,-24Z',
      'M-63,-47l-17,-2m21,13 -18,-2M49,-42l13,1M52,-32l14,1',
      'M-49,16Q-20,29 19,22Q53,16 66,-1Q64,26 45,43Q17,61 -10,53Q-39,44 -49,16Z',
    ], 0),
    beat(.21, .43, [
      'M-48,18Q3,57 65,1M7,34l-3,15M7,34l-30,7M7,34l28,-8',
      'M-50,-49l41,6 11,46 -42,-6ZM9,-44l28,-23 11,43 -28,23Z',
      ...repeat(5, i => `M${-142 + i * 15},${-67 + i * 1.4}l9,30M${59 + i * 14},${-54 + i * 1.1}l14,31`),
      'M-151,-58l89,8M-148,-48l89,8M49,-45l94,7M54,-35l94,7',
      'M-19,-87l-7,-23m-5,2 11,-4M43,-79l12,-15',
    ]),
    beat(.39, .27, ['M-6,64Q17,78 43,63'], 0, '#a9d9ff'),
    beat(.48, .27, ['M-24,78Q16,105 61,77'], 0, '#a9d9ff'),
    beat(.57, .27, ['M-44,94Q15,134 82,91', 'M9,71L14,128M5,121l9,7 8,-8'], 0, '#a9d9ff'),
    beat(.72, .21, ['M-84,132Q17,100 122,132M-28,120l6,14m39,-16v16m43,-14 -5,14', oval(14,128,10,3)], 2),
  ],
};

const cube = 'M-147,-25L-99,-58 -1,-45V68L-48,104 -147,86Z';
const monitor = 'M35,-110H121Q133,-110 136,-97L146,-25Q145,-13 133,-10H26Q15,-10 16,-23L20,-94Q21,-108 35,-110Z';
const webserver = {
  opening: cube,
  fills: [
    [.12, '#0a1017', cube], [.13, '#171e28', 'M-147,-25L-99,-58 -1,-45 -48,-10Z'],
    [.14, '#101722', 'M-48,-10L-1,-45V68L-48,104Z'],
    [.29, '#544032', 'M-131,-6L-95,0 -97,37 -133,30Z'],
    [.44, '#202831', monitor], [.52, '#10242c', 'M39,-96H116L126,-33H34Z'],
  ],
  beats: [
    beat(.04, .39, [
      'M-147,-25L-48,-10 -1,-45M-48,-10V104M-139,79L-57,94V-2L-139,-15Z',
      'M-122,-28l27,-18 72,9M-37,79l28,-21M-76,69l11,2v10l-11,-2Z',
      ...repeat(7, i => `M${-131 + i * 9},${56 + i * 1.5}v10`),
    ], 0),
    beat(.21, .4, [
      'M-131,-6L-95,0 -97,37 -133,30ZM-130,-2l33,5',
      'M-126,9l3,6 3,-5 3,6 3,-5M-113,11v6l5,1m-5,-4 4,1m-4,-4 5,1M-106,12v7l4,1 2,-2 -2,-2 -4,-1m4,1 2,-2 -2,-1Z',
      'M-126,22l19,3m-19,1 13,2',
    ], 1, '#f0bc78'),
    beat(.33, .46, [
      monitor, 'M39,-96H116L126,-33H34ZM29,-24H96M68,-10v17H48L38,15h75L105,7H89V-10',
      'M127,-106l16,13 6,60 -3,8M-4,47C24,52 30,21 57,20',
    ], 0),
    beat(.53, .29, [
      'M37,-82H118M43,-89h4m4,0h4m4,0h4M44,-73h45M44,-68h24M46,-56h29M46,-53h29M46,-43h44M46,-40h44',
      'M83,-56h17m-17,3h17',
    ], 1, '#a3d9ff'),
    beat(.64, .27, [
      'M76,-53C83,-11 107,24 122,33M89,-41C89,-1 83,37 71,65M86,68L116,48M96,79l21,9',
      'M123,33h25v15h-25ZM63,65h33v15H63ZM117,85h31v16h-31Z',
      'M128,39h14m-77,33h21m34,20h18',
    ], 1, '#a3d9ff'),
  ],
};

const drawings = new Map(Object.entries({ camera, telephone, lamp, airplane, container, satellite, webserver }));
const ids = [...drawings.keys()];
const prepared = new WeakMap();

function geometry(d) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svg.setAttribute('d', d);
  return { svg, length: svg.getTotalLength(), path: new Path2D(d) };
}

function prepare(drawing) {
  if (prepared.has(drawing)) return prepared.get(drawing);
  const result = {
    opening: drawing.opening && geometry(drawing.opening),
    fills: drawing.fills.map(([start, color, d]) => ({ start, color, path: new Path2D(d) })),
    beats: drawing.beats.map(({ start, span, paths, weight, metal }) => {
      // Separate absolute subpaths so disconnected marks get their own reveal.
      const strokes = paths.flatMap(d => d.match(/M[^M]+/g)).map(geometry).filter(stroke => stroke.length > 0);
      const total = strokes.reduce((sum, stroke) => sum + stroke.length, 0);
      let cursor = 0;
      return strokes.map(stroke => {
        const offset = cursor / total;
        const share = stroke.length / total;
        cursor += stroke.length;
        return { ...stroke, weight, metal, start: start + span * .70 * offset, span: span * (.30 + .70 * share) };
      });
    }),
  };
  prepared.set(drawing, result);
  return result;
}

const lineStyles = [
  { halo: 8.5, haloAlpha: .14, rim: 3.6, rimAlpha: .53, core: 1.58, coreAlpha: 1, white: '#fffdf6', ghostAlpha: .49 },
  { halo: 6, haloAlpha: .10, rim: 2.65, rimAlpha: .42, core: 1.17, coreAlpha: .83, white: '#fcfaff', ghostAlpha: .25 },
  { halo: 4.5, haloAlpha: .067, rim: 1.92, rimAlpha: .32, core: .87, coreAlpha: .67, white: '#e9eff5', ghostAlpha: .18 },
];

function trace(ctx, stroke, p, color, opacity, boost, ghost) {
  const { length, path, weight = 0, metal } = stroke;
  const style = lineStyles[weight];
  ctx.setLineDash(p < 1 ? [length * p, length + 3] : []);
  if (!ghost) {
    ctx.strokeStyle = metal || color;
    ctx.globalAlpha = opacity * Math.min(.32, style.haloAlpha * boost);
    ctx.lineWidth = style.halo * boost;
    ctx.stroke(path);
    ctx.globalAlpha = opacity * Math.min(1, style.rimAlpha * boost);
    ctx.lineWidth = style.rim * boost;
    ctx.stroke(path);
  }
  ctx.strokeStyle = ghost ? color : style.white;
  ctx.globalAlpha = opacity * (ghost ? style.ghostAlpha : Math.min(1, style.coreAlpha * boost));
  ctx.lineWidth = ghost ? .85 : style.core * boost;
  ctx.stroke(path);
}

export function drawArtifact(ctx, index, cx, cy, size, elapsed, {
  color = '#f5c878', duration = 1.35, hero = false, time = elapsed, ghost = false, boost = 1,
} = {}) {
  const drawing = drawings.get(typeof index === 'number' ? ids[index] : index);
  if (!drawing) return;
  const { opening, fills, beats } = prepare(drawing);
  const phase = duration > 0 ? clamp(elapsed / duration) : 1;
  const opacity = ctx.globalAlpha;
  const scale = size / 330;
  const tips = [];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (!ghost) {
    for (const fill of fills) {
      const p = clamp((phase - fill.start) / .19);
      if (p === 0) continue;
      ctx.globalAlpha = opacity * p * .86;
      ctx.fillStyle = fill.color;
      ctx.fill(fill.path);
    }
  }
  if (opening) {
    const openingOpacity = ghost ? opacity : opacity * (.76 + .24 * phase);
    trace(ctx, opening, 1, color, openingOpacity, boost, ghost);
  }
  for (const [group, strokes] of beats.entries()) {
    for (const stroke of strokes) {
      const lead = !opening && group === 0 && stroke === strokes[0] ? .028 : 0;
      const p = ghost ? 1 : clamp((phase - stroke.start) / stroke.span + lead);
      if (p === 0) continue;
      trace(ctx, stroke, p, color, opacity, boost, ghost);
      if (!ghost && p < .995 && stroke.weight < 2 && tips.length < 8) {
        tips.push({ point: stroke.svg.getPointAtLength(stroke.length * p), color: stroke.metal || color });
      }
    }
  }
  ctx.setLineDash([]);
  for (const { point: { x, y }, color: tipColor } of tips) {
    const radius = hero ? 12 : 6.8;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(.24, tipColor);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = opacity * (.78 + .10 * Math.cos(time * 3));
    ctx.fillStyle = glow;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  ctx.restore();
}
