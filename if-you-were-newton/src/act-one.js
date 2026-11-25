import { clamp, lerp, ease, hash, path, line, ellipse, radial, light, beam,
  paper, label, figure, candle } from './visual.js';

const ink = '#2b1b1b';
const rim = '#ad7950';
const tau = Math.PI * 2;

function shade(ctx, x, y, ex, ey, ...colors) {
  const gradient = ctx.createLinearGradient(x, y, ex, ey);
  colors.forEach((color, i) => gradient.addColorStop(i / (colors.length - 1), color));
  return gradient;
}

function contour(ctx, commands, fill, stroke = null, width = 1) {
  ctx.beginPath();
  for (const [verb, ...args] of commands) ctx[verb](...args);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function arc(ctx, x, y, rx, ry, start, end, color, width) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function grain(ctx, x, y, w, h, count, seed, color) {
  for (let i = 0; i < count; i++) {
    const n = seed + i * 19;
    const px = x + hash(n) * w;
    const py = y + hash(n + 4) * h;
    line(ctx, [[px, py], [px + 4 + hash(n + 7) * 23, py - 2 + hash(n + 2) * 5]], color);
  }
}

function view(ctx, x, y, zoom, dx = 0, dy = 0, roll = 0) {
  ctx.translate(x + dx, y + dy);
  ctx.rotate(roll);
  ctx.scale(zoom, zoom);
  ctx.translate(-x, -y);
}

function plumb(ctx, x, y, size, hot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ellipse(ctx, 0, -87, 12, 16, '#6c3c2b', '#cd9866', 3);
  ellipse(ctx, 0, -88, 5, 7, '#261819');
  path(ctx, [[-13,-75],[13,-75],[39,-45],[35,-8],[0,58],[-35,-8],[-39,-45]],
    shade(ctx,-40,-20,42,-16,'#49231c','#a95b32','#e4aa67','#6d3225'), '#d39256',2);
  path(ctx, [[-13,-75],[3,-39],[0,58],[-35,-8],[-39,-45]], '#5b2a217c');
  path(ctx, [[3,-39],[18,-28],[0,58]], '#f6bb7794');
  line(ctx, [[-38,-44],[3,-39],[39,-45]], '#f2b7799e', 2);
  for (let i = 0; i < 11; i++) line(ctx, [[-32 + i * 4,-21],[ -28 + i * 4,-31]], '#f9bc7854');
  light(ctx, 0, 55, 52, '255,191,106', hot);
  ctx.restore();
}

function well(ctx, x, y, rx, ry) {
  ellipse(ctx, x + 18, y + 65, rx + 30, ry + 36, '#110d13ac');
  ellipse(ctx, x, y + 45, rx, ry, '#422921', '#261a1b', 7);
  ellipse(ctx, x, y, rx, ry, shade(ctx, x,y-ry,x,y+ry,'#644838','#ad8058','#55362b'), ink, 5);
  ellipse(ctx, x, y, rx * .77, ry * .73, radial(ctx, x - rx * .1, y + ry * .42, rx * .8,
    [[0,'#0b0a10'],[.57,'#100b10'],[1,'#503326']]), '#422923', 5);
  for (let i = 0; i < 24; i++) {
    const a = i * tau / 24;
    const next = a + .24;
    const point = (angle, scale) => [x + Math.cos(angle) * rx * scale, y + Math.sin(angle) * ry * scale];
    const outer = point(a, .985);
    line(ctx, [point(a-.018,.77),point(a,.87),outer], '#4a3029', 4);
    line(ctx, [point(a+.017,.79),point(a+.02,.87),point(a+.012,.97)], '#ddac7875', 2);
    line(ctx, [point(a+.035,.93),point(next,.93)], '#ecd19a45', 2);
    for (let j = 0; j < 6; j++) {
      const angle = a + .02 + .19 * hash(i * 31 + j * 7);
      const s = .81 + .16 * hash(i * 31 + j * 7 + 2);
      line(ctx, [point(angle,s),point(angle+.018,s+.009)], '#37272279');
    }
  }
  for (let i = 0; i < 3; i++) arc(ctx, x,y + i * 12,rx*.76,ry*.72,.04,Math.PI-.04,'#7b51424f',2);
}

function falling(ctx, f) {
  if (f.k === 2) {
    const v = ease(f.v);
    view(ctx, 967, 402, lerp(1.51,.88,v), -48 * v, 47 * v, .049 * (1-v));
    well(ctx, 980, 421, 674, 279);
    const x = 966;
    const y = 333 + 180 * f.v ** 1.6;
    const trace = shade(ctx,x,266,x,y+20,'#f0a65f00','#ecb275af','#f3bb7755');
    line(ctx, [[x,266],[x,y]], trace, 2.8);
    plumb(ctx, x, y, lerp(.46,.12,v), .4 * (1-v));
    light(ctx,x,y,67,'255,158,83',.27 * (1-v));
    return;
  }
  const releasing = f.k === 1;
  const v = ease(f.v);
  view(ctx, 971, 374, releasing ? 1.4 + .37 * ease(f.v * 2) : 1.12 + .08 * v,
    releasing ? 247 - 498 * v : 16 * v, releasing ? -112 * v : 0, releasing ? -.11 * (1-v) : 0);
  well(ctx, 1050, 822, 860, 274);
  const drop = releasing ? 253 * f.v ** 1.68 : 0;
  const tension = ease((f.a - .43) / .16);
  const x = 973 + (releasing ? -19 * f.v : (1-tension) * Math.sin(f.a * 7) * 8);
  contour(ctx,[['moveTo',960,36],['quadraticCurveTo',936+30*tension,220,x,281+drop*.25]],null,'#c0956b',2.8);
  if (releasing) line(ctx, [[x,298],[x,323+drop]], '#dea47b31', 2);
  ellipse(ctx,960,40,19,13,'#6f4939','#d69e68',2);
  ellipse(ctx,956,36,7,3,'#ebbd85');
  plumb(ctx,x,401+drop,1.24-.35*v*(releasing?1:0), .27+.68*Math.exp(-((f.a-.10)**2)/.004));
}

function roof(ctx, shift, y, scale) {
  ctx.save();
  ctx.translate(shift,y);
  ctx.scale(scale,scale);
  const edge = [[-210,133],[156,-40],[617,39],[1004,214],[1012,455],[-210,455]];
  path(ctx,edge,shade(ctx,240,-30,364,330,'#624d42','#382a2d','#18181f'),ink,5);
  ctx.save();
  ctx.beginPath();
  edge.forEach(([x,py], i) => i ? ctx.lineTo(x,py) : ctx.moveTo(x,py));
  ctx.clip();
  for (let row = 0; row < 11; row++) {
    const py = 16 + row * 26;
    line(ctx,[[-220,py-32],[1010,py+185]],'#aa806552',2);
    for (let i=0;i<24;i++) {
      const x = -183 + i*54 + (row%2)*26;
      line(ctx,[[x,py+x*.176-3],[x-7,py+x*.176+17]],'#1d151acd',3);
    }
  }
  ctx.restore();
  line(ctx,edge.slice(0,4),'#be927171',4);
  path(ctx,[[173,3],[175,-119],[231,-114],[244,17]],'#463533','#87604e',2);
  path(ctx,[[165,-127],[241,-119],[245,-106],[169,-110]],'#6b4f42','#9a725b',2);
  ctx.restore();
}

function moon(ctx, x, y, size) {
  light(ctx,x,y,size*3.6,'240,190,140',.26);
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(-.23);
  ctx.scale(size/100,size/100);
  const shape = [['moveTo',20,-98],['bezierCurveTo',-107,-111,-137,53,-39,91],
    ['bezierCurveTo',-6,104,37,96,60,63],['bezierCurveTo',-18,88,-75,40,-64,-22],
    ['bezierCurveTo',-56,-64,-20,-88,20,-98],['closePath']];
  contour(ctx,shape,shade(ctx,-100,-68,49,88,'#ffe2a6','#e4b37d','#a37f69'),'#ffe1b4',1.2);
  ctx.save();
  ctx.clip();
  for (let i=0;i<52;i++) {
    const n=i*17;
    ellipse(ctx,-104+hash(n)*171,-100+hash(n+2)*202,2+hash(n+3)*10,1+hash(n+5)*5,'#7e625232');
  }
  ctx.restore();
  ctx.restore();
}

function night(ctx, f) {
  const reveal = f.k === 0;
  const p = ease(f.v);
  const mx = reveal ? 1249 - 57*p : 1188 + 40*p;
  const my = reveal ? 318 - 66*p : 249 - 31*p;
  roof(ctx,reveal ? -187 - 176*p : -364 + 75*p,reveal ? 473+177*p : 652+31*p,reveal ? 1.51 : 1.47-.28*p);
  moon(ctx,mx,my,reveal ? 136+7*p : 143-26*p);
  for (let j=0;j<4;j++) {
    const x = 1015 + (reveal ? 68*p : 658*p) + j*107;
    const y = 344 + j*22 - 46*p;
    contour(ctx,[['moveTo',x-540,y+32],['bezierCurveTo',x-427,y-15,x-307,y+2,x-201,y-18],
      ['bezierCurveTo',x-91,y-29,x+115,y-13,x+326,y+10],['bezierCurveTo',x+85,y+20,x-183,y+36,x-540,y+32]],
    shade(ctx,x-540,y,x+326,y,'#75888800','#82908a2a','#ac9c881c','#75888800'));
  }
}

function palm(ctx,x,y,scale,rotate) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rotate);
  ctx.scale(scale,scale);
  contour(ctx,[['moveTo',-128,50],['quadraticCurveTo',-80,22,-64,3],['quadraticCurveTo',-42,-13,-14,-12],
    ['lineTo',24,-31],['quadraticCurveTo',42,-36,43,-25],['lineTo',12,-8],['lineTo',55,-18],
    ['quadraticCurveTo',73,-20,73,-10],['lineTo',28,8],['lineTo',60,1],['quadraticCurveTo',72,3,65,11],
    ['lineTo',21,27],['lineTo',46,26],['quadraticCurveTo',56,29,47,36],['lineTo',-18,52],
    ['quadraticCurveTo',-47,60,-66,48],['lineTo',-102,76],['closePath']],
  shade(ctx,-84,65,27,-25,'#59392e','#ae7350','#e0b087'), '#59382d',2.8);
  line(ctx,[[-48,10],[-37,23],[-15,28],[8,22]],'#794c3b',2);
  line(ctx,[[-59,38],[-42,43],[-12,41]],'#f2bf934d',2);
  path(ctx,[[-168,53],[-110,34],[-83,65],[-123,101]],'#3d2d30',rim,2);
  path(ctx,[[-112,36],[-100,31],[-77,59],[-87,68]],'#c7ae86','#6f5040',2);
  ctx.restore();
}

function portrait(ctx, x, y, gaze) {
  ctx.save();
  ctx.translate(x,y);
  contour(ctx,[['moveTo',-383,497],['quadraticCurveTo',-374,293,-233,237],['lineTo',-118,193],
    ['lineTo',98,198],['quadraticCurveTo',293,239,340,492],['closePath']],
  shade(ctx,-331,262,269,410,'#684334','#352729','#17141a'), '#825638',3);
  for (let i=0;i<22;i++) {
    const x=-335+i*31;
    contour(ctx,[['moveTo',x,472],['quadraticCurveTo',x*.86,355,x*.58,248+Math.abs(x)*.10]],null,i%3?'#b880543b':'#21171b',i%3?2:6);
  }
  path(ctx,[[-116,170],[-131,230],[-51,308],[-19,265],[9,289],[98,234],[63,167]],
    shade(ctx,-109,202,104,264,'#dbc39e','#aa9072','#694b3c'),'#7f6046',2);
  ctx.save();
  ctx.rotate(-.044*gaze);
  ctx.translate(0,-14*gaze);
  contour(ctx,[['moveTo',-171,77],['bezierCurveTo',-231,-37,-180,-178,-51,-184],
    ['bezierCurveTo',43,-224,148,-151,155,-61],['bezierCurveTo',163,48,214,113,155,199],
    ['bezierCurveTo',110,242,73,206,27,226],['bezierCurveTo',-21,207,-44,253,-82,221],
    ['bezierCurveTo',-166,250,-207,173,-171,77],['closePath']],
  shade(ctx,-183,-112,167,124,'#352326','#8b593d','#4e3029','#20171d'),'#805337',3);
  for (let i=0;i<43;i++) {
    const side=i<24 ? -1 : 1;
    const n=i*19;
    const x=side*(39+hash(n)*116);
    const y=-178+Math.abs(x)*.45+hash(n+2)*35;
    const end=156+hash(n+3)*63;
    contour(ctx,[['moveTo',x,y],['bezierCurveTo',x+side*65,y+39,x-side*22,19,x+side*26,88],
      ['bezierCurveTo',x+side*55,130,x-side*28,end-26,x,end]],null,
    i%3===0?'#d88d5475':i%3===1?'#1f141766':'#9b614753',i%3===1?5:2.2);
  }
  contour(ctx,[['moveTo',-71,-107],['bezierCurveTo',-35,-158,76,-133,95,-76],
    ['quadraticCurveTo',108,-42,108,-16],['quadraticCurveTo',114,5,139,34],
    ['quadraticCurveTo',138,44,116,48],['quadraticCurveTo',117,70,107,82],
    ['quadraticCurveTo',107,121,64,147],['quadraticCurveTo',42,158,22,155],
    ['quadraticCurveTo',-29,153,-59,115],['quadraticCurveTo',-90,68,-95,24],
    ['quadraticCurveTo',-112,-40,-71,-107],['closePath']],
  shade(ctx,-103,-6,132,28,'#af7352','#dca374','#966448','#4c3330'),'#773e2e',2.7);
  contour(ctx,[['moveTo',-64,11],['quadraticCurveTo',-20,-9,30,23],['quadraticCurveTo',31,54,78,94],
    ['quadraticCurveTo',15,121,-34,97],['quadraticCurveTo',-70,66,-64,11]],'#c6825a55');
  contour(ctx,[['moveTo',-17,-28],['quadraticCurveTo',17,-49,55,-31],['moveTo',81,-31],['quadraticCurveTo',98,-39,107,-29]],null,'#59362c',6);
  contour(ctx,[['moveTo',-11,-15],['quadraticCurveTo',16,-30,50,-13],['quadraticCurveTo',22,-7,-11,-15],
    ['moveTo',83,-15],['quadraticCurveTo',96,-23,108,-16]],'#d7b190','#5a382e',2.8);
  ellipse(ctx,24+9*gaze,-15-4*gaze,6,6-2*(1-gaze),'#3b2d2b');
  ellipse(ctx,26+9*gaze,-17-4*gaze,1.9,1.7,'#ffe3b1');
  line(ctx,[[88,-17],[84,15],[100,36],[114,35]],'#81513a',2.4);
  contour(ctx,[['moveTo',54,83],['quadraticCurveTo',76,74,105,77],['quadraticCurveTo',84,86,60,86]],null,'#633e36',3);
  line(ctx,[[62,99],[81,100],[95,95]],'#e0a57d89',2);
  for (let i=0;i<14;i++) line(ctx,[[-64+i*3,30+i*5],[-59+i*3,44+i*5]],'#71473455',1.5);
  ctx.restore();
  ctx.restore();
}

function velvet(ctx, edge) {
  contour(ctx,[['moveTo',-500,-340],['lineTo',edge+64,-340],['bezierCurveTo',edge+120,-26,edge-77,222,edge+28,468],
    ['quadraticCurveTo',edge+103,681,edge+67,982],['lineTo',-500,982],['closePath']],
  shade(ctx,-100,0,edge+130,100,'#140e19','#57272d','#2b1523'),'#9c5c4e',3);
  for (let i=0;i<19;i++) {
    const x=edge-18-i*48;
    contour(ctx,[['moveTo',x+114,-210],['bezierCurveTo',x+44,34,x-74,219,x+9,462],
      ['quadraticCurveTo',x+77,676,x-18,952]],null,i%2?'#9b52423b':'#170e1a8c',i%2?4:17);
  }
}

function titlePortrait(ctx, f) {
  const close=f.k===1;
  const p=ease(f.v);
  view(ctx,1135,370,close?1.37+.096*p:1+.055*p,close?-83+40*p:0,close?68:0,close?.018:0);
  contour(ctx,[['moveTo',765,820],['lineTo',787,239],['quadraticCurveTo',804,60,1179,45],
    ['quadraticCurveTo',1455,72,1483,278],['lineTo',1518,824],['closePath']], '#23171b','#754932',7);
  contour(ctx,[['moveTo',822,671],['lineTo',841,253],['quadraticCurveTo',899,97,1196,103],
    ['quadraticCurveTo',1375,109,1428,250],['lineTo',1464,725]],null,'#a675494c',4);
  portrait(ctx,1129,340,close?ease(f.v*2.45):0);
  candle(ctx,555,699,245,f.t);
  light(ctx,659,380,440,'255,163,82',.23);
  velvet(ctx,close?365:lerp(1125,449,ease(f.v*1.44)));
  if (!close) palm(ctx,lerp(1131,425,p),320-52*p,1.26,2.96);
}

function farmhouse(ctx,x,y,s) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(s,s);
  path(ctx,[[0,0],[168,-16],[231,9],[224,97],[3,103]],shade(ctx,0,0,218,92,'#b7936f','#735241','#47352f'),ink,2);
  path(ctx,[[-21,6],[42,-70],[178,-71],[245,14],[164,-1]],shade(ctx,0,-67,41,30,'#7e6255','#402d2d'),ink,3);
  path(ctx,[[156,-56],[155,-101],[173,-100],[174,-50]],'#67463a',rim,2);
  for (let i=0;i<6;i++) line(ctx,[[36-i*7,-61+i*10],[183+i*7,-57+i*11]],'#bd98726a',1.3);
  for (let i=0;i<4;i++) {
    const wx=24+i*38;
    path(ctx,[[wx,22],[wx+19,21],[wx+19,46],[wx,47]],'#382b2a','#a27c5b',2);
    line(ctx,[[wx+9,22],[wx+9,46]],'#b28f69',1.3);
  }
  path(ctx,[[188,89],[188,40],[210,41],[212,90]],'#362928',rim,1.4);
  grain(ctx,11,52,154,46,46,920,'#48332d6e');
  ctx.restore();
}

function wall(ctx,x,y,w,h,seed) {
  ctx.save();
  ctx.translate(x,y);
  for (let row=0;row<4;row++) {
    for (let i=-1;i<17;i++) {
      const n=seed+row*181+i*13;
      const px=(i+row%2*.47)*w/16;
      const py=row*h*.225+Math.sin(px*.006)*h*.11;
      const sw=w/16, sh=h*.25;
      const stone=[[px,py+hash(n)*12],[px+sw*.79,py-4],[px+sw*.99,py+sh*.62],
        [px+sw*.88,py+sh],[px+sw*.1,py+sh],[px-4,py+sh*.53]];
      path(ctx,stone,shade(ctx,px,py,px,py+sh,row===0?'#a18666':'#6a584d','#362b2b'),ink,2.5);
      line(ctx,stone.slice(0,2),'#e8bd8475',2);
      grain(ctx,px+7,py+9,sw*.74,sh*.56,5,n,'#231b2084');
    }
  }
  ctx.restore();
}

function hillside(ctx, f, close) {
  const travel=close?46*ease(f.v):128*ease(f.v);
  const near=close?travel*1.8:travel;
  light(ctx,1460-travel*.35,294,559,'255,196,125',.39);
  contour(ctx,[['moveTo',-180,638],['bezierCurveTo',292,428,650,433,901,485],['bezierCurveTo',1296,546,1659,240,2070,350],
    ['lineTo',2070,1080],['lineTo',-180,1080],['closePath']],shade(ctx,1111,394,1140,770,'#9f8060','#6f634b','#35322f'));
  farmhouse(ctx,1371-travel*.61,close?432:395,close?1.03:1.31);
  contour(ctx,[['moveTo',-180,728],['bezierCurveTo',439,484,703,658,1115,601],['quadraticCurveTo',1661,512,2080,555],
    ['lineTo',2080,1080],['lineTo',-180,1080],['closePath']],shade(ctx,676,562,747,969,'#8b7650','#554635','#211d23'));
  for (let i=0;i<165;i++) {
    const n=i*19;
    const x=(hash(n)*2150-near+2150)%2150-90;
    const y=607+hash(n+7)*171+Math.sin(x*.004)*20;
    line(ctx,[[x,y],[x+4,y-5-hash(n+4)*13],[x+11,y-7]],i%4?'#c6a26b55':'#342f29ac',1.4);
  }
}

function folded(ctx,x,y,size,angle) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(angle);
  ctx.scale(size,size);
  path(ctx,[[-59,-49],[50,-61],[66,40],[-40,57]],shade(ctx,-65,-60,55,60,'#e3c39b','#b28e65','#846047'),'#5e4335',2.2);
  path(ctx,[[-58,-48],[7,3],[61,-10],[50,-61]],'#e6cda287','#aa8057',1.5);
  line(ctx,[[7,3],[10,49]],'#765139',2);
  grain(ctx,-40,11,87,24,22,91,'#74563d49');
  ctx.restore();
}

function country(ctx,f) {
  const close=f.k===1;
  const p=ease(f.v);
  if (close) view(ctx,950,655,1.10+.15*p,14*p,16*p,-.022);
  hillside(ctx,f,close);
  if (close) {
    figure(ctx,850,967,687,{young:true,tone:'#69504a',time:f.t});
    folded(ctx,976,648,1.42,-.18+.09*p);
    palm(ctx,951,682,.85,-.44+.1*p);
    wall(ctx,-92,724-49*p,2124,240,250);
    light(ctx,1002,628,235,'255,186,103',.23);
    return;
  }
  const x=601+248*p;
  const hem=Math.sin(f.t*10)*13;
  path(ctx,[[x-54,553],[x-111-hem,636],[x-77,631],[x-39,613]],'#60443b','#a9784e',2);
  figure(ctx,x,747,402,{young:true,tone:'#694d44',time:f.t,walk:true});
  wall(ctx,1078-85*p,662,1010,143,170);
}

function boards(ctx, y, slope, count = 7) {
  for (let i=0;i<count;i++) {
    const top=y+i*110;
    path(ctx,[[-450,top],[2350,top+slope],[2350,top+slope+112],[-450,top+112]],
      shade(ctx,0,top,0,top+120,i%2?'#51352b':'#634533','#261b20'),ink,3);
    for (let j=0;j<19;j++) {
      const n=i*313+j*7;
      const x=-150+hash(n)*2220;
      const py=top+16+hash(n+2)*74+(x+450)*slope/2800;
      contour(ctx,[['moveTo',x,py],['quadraticCurveTo',x+90,py-7,x+193,py+slope*.07]],null,
        j%3===0?'#c7915e42':'#22191b9c',j%3===0?1.6:2.7);
    }
  }
}

function quill(ctx,x,y,angle,s) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(angle);
  ctx.scale(s,s);
  contour(ctx,[['moveTo',0,-15],['bezierCurveTo',-24,-88,-8,-176,26,-237],
    ['bezierCurveTo',56,-217,61,-135,26,-75],['quadraticCurveTo',20,-32,0,-15]],
    shade(ctx,-17,-140,48,-180,'#675044','#b99871','#dbc49c','#82614d'),'#644637',2);
  line(ctx,[[0,0],[4,-57],[19,-129],[26,-213]],'#dfc19b',2.5);
  for(let i=0;i<22;i++) {
    const py=-50-i*7.2;
    const px=4+i*.84;
    line(ctx,[[px-16,py-23],[px,py],[px+24,py-20]],'#6145356d',1.35);
  }
  line(ctx,[[0,0],[4,-26]],'#342326',3);
  ctx.restore();
}

function sundial(ctx,x,y,s,v) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(s,s);
  ellipse(ctx,0,21,256,102,'#3b2825','#281b1f',5);
  ellipse(ctx,0,0,256,101,shade(ctx,-110,-88,85,93,'#c89d69','#a07851','#694632'),ink,4);
  arc(ctx,0,0,225,82,0,tau,'#e4b684a8',2);
  arc(ctx,0,0,203,71,0,tau,'#614432',2);
  for (let i=0;i<=32;i++) {
    const a=.15 + i*(Math.PI-.3)/32;
    const outer=[Math.cos(a)*224, Math.sin(a)*83];
    const r=i%4===0?.82:.91;
    line(ctx,[outer,[outer[0]*r,outer[1]*r]],'#55382d',i%4===0?2.5:1.2);
  }
  grain(ctx,-170,-35,335,66,60,24,'#5e412e4e');
  path(ctx,[[-31,34],[35,-14],[lerp(209,146,v),lerp(31,64,v)],[lerp(181,118,v),lerp(41,74,v)]],'#2a1f25aa');
  path(ctx,[[-30,34],[15,-161],[57,-7]],shade(ctx,-20,-31,54,6,'#b6804e','#5e3c30'),ink,3);
  line(ctx,[[-24,21],[16,-152]],'#f2d09a',3);
  ctx.restore();
}

function windowFrame(ctx,x,y,w,h,glass) {
  if (glass) path(ctx,[[x,y],[x+w,y+12],[x+w,y+h],[x,y+h+9]],
    shade(ctx,x,y,x+w,y+h,'#e3c292','#9c8a68','#61635b'));
  for (let i=0;i<5;i++) {
    const px=x+w*i/4;
    line(ctx,[[px,y+12*i/4],[px,y+h+9-9*i/4]],'#432b26',i%2===0?19:7);
    line(ctx,[[px-5,y+9],[px-5,y+h]],'#c0996580',2);
  }
  for (let i=0;i<4;i++) {
    const py=y+h*i/3;
    line(ctx,[[x,py],[x+w,py+7]],'#46312c',i%3===0?21:8);
    line(ctx,[[x,py-4],[x+w,py+3]],'#d6a97455',2);
  }
}

function school(ctx,f) {
  const p=ease(f.v);
  if (f.k===0) {
    view(ctx,894,420,1+.084*p,-60*p,0,-.07);
    boards(ctx,58,-32,9);
    paper(ctx,500,144,805,583,689);
    for (let i=0;i<11;i++) {
      const y=227+i*35;
      line(ctx,[[573,y],[1216,y+2]],'#7b564237');
    }
    line(ctx,[[580,573],[1188,573]],'#61412e',2.7);
    const tip=682+474*p;
    line(ctx,[[682,573],[tip,402+(1-p)*171]],'#52372c',3.3);
    quill(ctx,tip,402+(1-p)*171,.58,1.55);
    palm(ctx,tip+94,492+(1-p)*171,1.56,2.85);
    light(ctx,730,241,400,'255,200,126',.19);
    return;
  }
  if (f.k===1) {
    view(ctx,948,431,1.03+.073*p,-37*p,0,.027);
    windowFrame(ctx,1238,43,472,482,true);
    figure(ctx,714,843,712,{young:true,tone:'#634438',time:f.t});
    boards(ctx,645,-70,5);
    sundial(ctx,1134,657,1.03,p);
    path(ctx,[[683,364],[747,402],[796,292],[832,223-19*p],[797,203-19*p],[738,288]],
      shade(ctx,691,363,802,226,'#3d2a2a','#76543f','#493330'),rim,2);
    line(ctx,[[740,379],[771,302],[800,246-19*p]],'#b181565f',2.2);
    palm(ctx,834+12*p,205-19*p,.94,-.58-.11*p);
    beam(ctx,[[1639,91],[1708,121],[1070,695],[641,676]],'255,203,113',.29);
    light(ctx,1135,650,285,'255,211,151',.21);
    return;
  }
  view(ctx,945,426,1+1.12*p,-62*p,-29*p);
  path(ctx,[[-200,614],[951,417],[2150,536],[2150,1000],[-200,1000]],shade(ctx,931,441,950,848,'#92745d','#453839','#241f27'));
  for(let i=0;i<5;i++) farmhouse(ctx,328+i*233,338-i*8,.92-i*.084);
  const shadow=538+731*p;
  path(ctx,[[shadow,441],[shadow+124,446],[shadow+544,790],[shadow+257,824]],'#282530a8');
  for(let i=0;i<15;i++) {
    const y=491+i*19;
    line(ctx,[[220,y+45],[1653,y-29]],'#c7977047',1.6);
  }
  windowFrame(ctx,297-291*p,20-159*p,1248+593*p,728+403*p,false);
  line(ctx,[[-230,786-p*215],[2060,774-p*215]],'#251a1e',49);
}

function book(ctx,x,y,s,rotation) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(rotation);
  ctx.scale(s,s);
  path(ctx,[[0,11],[147,-7],[172,8],[159,126],[-1,145]],'#432523',ink,3);
  path(ctx,[[9,21],[158,3],[158,111],[10,132]],shade(ctx,9,35,98,120,'#d8bc8b','#8f6b50'),'#674b35',2);
  for(let i=0;i<11;i++) line(ctx,[[12,33+i*8],[155,14+i*8]],'#72503967');
  path(ctx,[[-5,8],[145,-10],[154,99],[0,125]],shade(ctx,-4,5,143,107,'#8b5740','#62402f','#37272b'),'#392526',3);
  path(ctx,[[11,20],[131,5],[139,88],[14,107]],null,'#bd96645d',2);
  line(ctx,[[5,15],[11,117]],'#d49c6355',3);
  ctx.restore();
}

function paving(ctx,focus,crest,end) {
  path(ctx,[[focus-51,crest],[focus+51,crest],[2190,end],[-275,end]],
    shade(ctx,focus,crest,focus,end,'#a28b70','#68615a','#30272d'),'#382e2d',3);
  for(let i=0;i<16;i++) {
    const y=i*i/225;
    const next=(i+1)**2/225;
    const width=51+1170*y;
    line(ctx,[[focus-width,lerp(crest,end,y)],[focus+width,lerp(crest,end,y)]],'#392d31a4',2);
    for(let j=0;j<12;j++) {
      const proportion=(j+.5*(i%2))/6-1;
      const x=focus+width*proportion;
      const py=lerp(crest,end,y);
      line(ctx,[[x,py],[focus+(51+1170*next)*proportion,lerp(crest,end,next)]],'#55433b9c',1.6);
      line(ctx,[[x+3,py+3],[x+8+width/32,py+1]],'#d0a87960',1.6);
    }
  }
}

function pillar(ctx,x,y,w,h) {
  path(ctx,[[x,y],[x+w,y-6],[x+w*.92,y+h],[x-w*.09,y+h+3]],
    shade(ctx,x-w*.1,y,x+w,y,'#4b3b37','#ae9575','#77624e','#352b30'),ink,4);
  for(let i=0;i<10;i++) {
    const py=y+i*h/10;
    line(ctx,[[x,py+4],[x+w*.89,py]],'#46382b8f',2);
    grain(ctx,x+7,py+9,w*.75,h*.07,11,185+i*43,'#382c285a');
  }
  for(const py of [y,y+h]) path(ctx,[[x-w*.14,py-16],[x+w*1.1,py-18],[x+w*1.13,py+13],[x-w*.2,py+18]],
    shade(ctx,x,py-18,x,py+20,'#ae9170','#524037'),ink,3);
}

function gothic(ctx,x,y,w,h) {
  const outer=[['moveTo',x-w,y+h],['lineTo',x-w,y+h*.38],['quadraticCurveTo',x-w*.92,y+h*.16,x,y],
    ['quadraticCurveTo',x+w*.87,y+h*.15,x+w,y+h*.38],['lineTo',x+w,y+h]];
  contour(ctx,outer,null,'#31272c',116);
  contour(ctx,outer,null,'#725b48',87);
  contour(ctx,outer,null,'#b69771',49);
  contour(ctx,outer,null,'#6d5748',28);
  contour(ctx,outer,null,'#d4b28a82',7);
  for(let i=0;i<11;i++) {
    const r=(i+.4)/11;
    const px=w*r;
    const py=h*(.33*r+.052*r*r);
    for(const side of [-1,1]) line(ctx,[[x+side*(px-24),y+py+24],[x+side*(px+30),y+py-24]],'#3b302e92',3);
  }
}

function cambridge(ctx,f) {
  const p=ease(f.v);
  if(f.k===0) {
    view(ctx,961,515, .96+.142*p,0,-31*p,.013);
    const opening=[['moveTo',494,811],['lineTo',494,412],['quadraticCurveTo',544,197,961,87],
      ['quadraticCurveTo',1362,182,1428,412],['lineTo',1428,811],['closePath']];
    contour(ctx,opening,shade(ctx,961,94,961,827,'#5d4c46','#766955','#29252d'));
    light(ctx,975,349,324,'255,206,146',.25);
    paving(ctx,960,590,934);
    path(ctx,[[-160,-150],[987,-150],[963,87],[518,425],[494,963],[-160,960]],
      shade(ctx,115,85,559,692,'#7d634b','#4a3a34','#2a2228'),ink,4);
    path(ctx,[[955,-150],[2140,-150],[2090,960],[1440,960],[1428,409],[963,87]],
      shade(ctx,1694,84,1314,781,'#9f8262','#534238','#30272d'),ink,4);
    for(let i=0;i<10;i++) {
      const y=85+i*68;
      line(ctx,[[-150,y+24],[Math.max(450,821-i*87),y]],'#28224a40',4);
      line(ctx,[[Math.min(1499,1139+i*89),y+2],[2100,y+40]],'#392e2e78',4);
    }
    gothic(ctx,961,88,468,707);
    figure(ctx,1001-72*p,778-37*p,329-29*p,{pose:'back',facing:-1,time:f.t,walk:true,tone:'#463737'});
    book(ctx,1040-72*p,642-27*p,.43,-.27);
    return;
  }
  view(ctx,968,407,1.02+.05*p,-59*p,0,-.038);
  paving(ctx,1553,492,970);
  for(let i=4;i>=0;i--) {
    const size=1-i*.14;
    const x=269+i*301-43*p*size;
    gothic(ctx,x+172*size,32+i*79,165*size,678*size);
    pillar(ctx,x,126+i*75,105*size,602*size);
  }
  const x=676+338*p;
  figure(ctx,x,779,493,{young:true,time:f.t,walk:true,tone:'#543e35'});
  book(ctx,x+48,555,.78,-.23);
  pillar(ctx,644-120*p,38,145,782);
  light(ctx,x+56,423,280,'255,191,112',.15);
}

function geometryBook(ctx) {
  path(ctx,[[339,137],[1500,128],[1542,735],[359,770]],'#482726','#25171c',9);
  paper(ctx,369,118,577,600,730);
  paper(ctx,944,110,554,604,932);
  path(ctx,[[904,135],[946,111],[985,137],[977,705],[946,727],[916,708]],
    shade(ctx,905,124,982,124,'#9f775139','#62422fb0','#9f775100'));
  label(ctx,'ELEMENTA',479,205,35,'#513529');
  label(ctx,'LIBER PRIMVS',1040,191,28,'#60422e');
  for(let j=0;j<2;j++) {
    const x=478+j*562;
    const y=232+j*174;
    for(let i=0;i<9;i++) {
      const end= x+310+hash(65+j*70+i*11)*66;
      for(let k=x;k<end;k+=37) line(ctx,[[k,y+i*24],[k+14+hash(k+i*34)*18,y+i*24+hash(k)*3]],'#60412e76',1.9);
    }
  }
  path(ctx,[[546,612],[786,596],[663,494]],null,'#6b4b36a9',2);
  arc(ctx,665,596,109,94,Math.PI*1.16,Math.PI*1.8,'#6b4b3688',1.7);
}

function compass(ctx,x,y,s) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(s,s);
  for(const dir of [-1,1]) {
    path(ctx,[[dir*4,-230],[dir*22,-184],[dir*34,-120],[dir*101,-15],[dir*104,4],
      [dir*83,-13],[dir*16,-107],[-dir*6,-194]],
    shade(ctx,dir*-4,-230,dir*92,-9,'#b99b69','#6f4e36','#d9b67c','#42302b'),ink,3);
    line(ctx,[[dir*9,-211],[dir*25,-123],[dir*89,-21]],'#f8d6a28c',2);
    line(ctx,[[dir*97,-10],[dir*107,11]],'#342928',3.4);
  }
  ellipse(ctx,0,-223,22,24,'#97724c','#382729',3);
  ellipse(ctx,0,-225,9,10,'#654935','#d7b67c',2);
  path(ctx,[[-9,-245],[-8,-275],[7,-277],[10,-245]],'#9b7b53',ink,2);
  arc(ctx,0,-226,15,16,3.35,5.52,'#f6d097',2);
  ctx.restore();
}

function mathematics(ctx,f) {
  const p=ease(f.v);
  const side=f.k===1;
  if(side) {
    view(ctx,1125,456,1.13+.13*p,-128*p,16*p,.088);
    ctx.transform(1,.035,-.29,.65,155,242);
  } else view(ctx,1000,389,1+.075*p,-28*p,0,-.014);
  boards(ctx,-180,-71,12);
  geometryBook(ctx);
  path(ctx,[[430,690],[1321,646],[1331,696],[422,747]],
    shade(ctx,445,695,451,745,'#b68b59','#80603f','#4d342b'),ink,3);
  for(let i=0;i<50;i++) {
    const x=445+i*17.3;
    const y=692-i*.86;
    line(ctx,[[x,y],[x+1,y+(i%5===0?26:13)]],'#51372c',1.6);
  }
  const left=1060, right=1325, y=480;
  const extent=side?1:ease((f.v-.20)/.7);
  line(ctx,[[left,y],[lerp(left,right,side?1:ease(f.v*4)),y]],'#5a3629',3);
  if(extent>0) {
    arc(ctx,left,y,193,179,-1.75,-1.75+2.37*extent,'#674234',3);
    const second=ease((extent-.12)/.88);
    if(second>0) arc(ctx,right,y,193,179,-3.76,-3.76+2.37*second,'#805039',3);
  }
  for(const x of [left,right]) ellipse(ctx,x,y,4,4,'#664035');
  if(side) {
    const settle=ease(f.v*2.4);
    const height=96*(1-settle);
    ellipse(ctx,left,y+1,3.5*settle,2.7*settle,'#392629');
    compass(ctx,left+104,469-height,1);
    palm(ctx,left+99,226-height,1.55,.2);
    light(ctx,left,474,185,'255,207,150',.22);
  }
}

function shutters(ctx,x,y,w,h) {
  path(ctx,[[x,y],[x+w,y-10],[x+w,y+h],[x,y+h+9]],'#342d30','#694e41',4);
  line(ctx,[[x+w*.5,y],[x+w*.5,y+h]],'#785a49',3);
  for(let i=0;i<13;i++) {
    const py=y+15+i*(h-22)/13;
    line(ctx,[[x+6,py],[x+w-5,py-8]],'#746353',2.3);
    line(ctx,[[x+6,py+4],[x+w-5,py-4]],'#23232a',3);
  }
}

function shuttingDoor(ctx,x,y,w,h,closed) {
  const t=clamp(closed);
  path(ctx,[[x,y],[x+w,y-13],[x+w,y+h-9],[x,y+h]],'#191b24','#715744',7);
  const front=x+w*(.37+.63*t);
  const lift=(1-t)*32;
  path(ctx,[[x,y],[front,y-13+lift],[front,y+h-9-lift],[x,y+h]],
    shade(ctx,x,y,front,y,'#6b5142','#473538','#29282f'),'#7d5d48',3);
  for(let i=1;i<8;i++) {
    const px=lerp(x,front,i/8);
    line(ctx,[[px,lerp(y,y-13+lift,i/8)],[px,lerp(y+h,y+h-9-lift,i/8)]],'#25232a',2.5);
    line(ctx,[[px+3,y+11],[px+3,y+h-15]],'#ae866449',1.5);
  }
  for(const bar of [.27,.73]) {
    const py=y+h*bar;
    path(ctx,[[x+3,py],[front-4,py+lift*.33-6],[front-4,py+lift*.33+9],[x+3,py+17]],'#433435','#815e4a',1.6);
  }
  ellipse(ctx,front-19,y+h*.54,9,10,'#26262d','#af8461',2);
}

function plague(ctx,f) {
  const p=ease(f.v);
  if(f.k===1) {
    view(ctx,1036,389,1+.19*p,-23*p,0,.025);
    path(ctx,[[-200,-120],[2110,-120],[2110,952],[-200,952]],
      shade(ctx,800,10,1177,848,'#626161','#444448','#292731'));
    for(let i=0;i<16;i++) {
      const y=i*57;
      line(ctx,[[-60,y],[2050,y-33]],'#2828318c',3);
      grain(ctx,708,y+8,1299,32,26,513+i*17,'#aca08e35');
    }
    shuttingDoor(ctx,97,20,551,909,1);
    shutters(ctx,1485,127,291,425);
    ctx.save();
    ctx.translate(1040,386);
    ctx.rotate(-.079);
    paper(ctx,-302,-237,604,490,54);
    path(ctx,[[-263,-202],[262,-201],[258,200],[-265,200]],null,'#73523b85',2);
    ellipse(ctx,0,-225,5,5,'#352728','#bc976a',2);
    label(ctx,'COLLEGIUM',0,-111,53,'#4c342c','center');
    label(ctx,'CLAUSUM',0,-48,76,'#522e2b','center');
    line(ctx,[[-181,-15],[181,-15]],'#77523c',3);
    for(let i=0;i<5;i++) for(let j=0;j<8;j++) {
      const x=-177+j*49;
      const y=24+i*27;
      line(ctx,[[x,y],[x+13+hash(i*61+j*5)*27,y-2]],'#68493686',2.5);
    }
    ctx.restore();
    light(ctx,971,257,350,'201,191,158',.14);
    return;
  }
  view(ctx,1009,493,1.17-.22*p,-58*p,0,-.034);
  paving(ctx,1088,512,954);
  for(const side of [-1,1]) {
    for(let i=4;i>=0;i--) {
      const s=.72**i;
      const x=1088+side*(205+587*s);
      const y=557-610*s;
      const w=480*s;
      const h=785*s;
      path(ctx,[[x-w*.57,y+43*s],[x+w*.61,y],[x+w*.65,y+h],[x-w*.6,y+h]],
        shade(ctx,x,y,x+w,y+h,'#676465','#4e4c51','#2b2a33'),'#343138',3);
      for(let j=0;j<10;j++) line(ctx,[[x-w*.56,y+j*h*.1+21*s],[x+w*.6,y+j*h*.1-3*s]],'#9989763a',1.4);
      shutters(ctx,x-120*s,y+109*s,235*s,239*s);
      shuttingDoor(ctx,x-107*s,y+408*s,218*s,366*s,ease((f.v-(i*.10+(side===1?.18:0)))*4.4));
    }
  }
  ctx.save();
  ctx.globalAlpha=1-.85*p;
  for(let i=0;i<3;i++) figure(ctx,1051+i*33+19*p,592-i*8,97-i*12-34*p,{pose:'back',young:true,time:f.t,walk:true,tone:'#435053'});
  ctx.restore();
  ctx.fillStyle=radial(ctx,1090,477,488,[[0,'#a9b6b34f'],[.52,'#87989c26'],[1,'#6b7f8200']]);
  ctx.fillRect(592,180,996,648);
}

function satchel(ctx,x,y,s,angle) {
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(angle);
  ctx.scale(s,s);
  ellipse(ctx,4,55,138,24,'#17131884');
  contour(ctx,[['moveTo',-112,29],['quadraticCurveTo',-147,-8,-110,-91],['quadraticCurveTo',-33,-124,91,-99],
    ['quadraticCurveTo',135,-53,118,45],['quadraticCurveTo',34,80,-112,29],['closePath']],
    shade(ctx,-93,-105,107,55,'#96714e','#644536','#422b29'),ink,3);
  contour(ctx,[['moveTo',-116,-87],['quadraticCurveTo',-24,-116,90,-98],['lineTo',111,-38],
    ['quadraticCurveTo',28,3,-113,-41],['closePath']],shade(ctx,-92,-97,73,-25,'#b38b60','#76533d'),'#4e332a',3);
  contour(ctx,[['moveTo',-61,-105],['quadraticCurveTo',-56,-171,23,-154],['quadraticCurveTo',65,-150,61,-103]],null,'#392828',13);
  contour(ctx,[['moveTo',-59,-109],['quadraticCurveTo',-48,-163,25,-149],['quadraticCurveTo',54,-140,58,-107]],null,'#b38256',3);
  for(const strap of [-66,65]) {
    path(ctx,[[strap-8,-96],[strap+8,-97],[strap+18,36],[strap-1,49]],'#58382e','#c5905a',1.5);
    path(ctx,[[strap-9,-29],[strap+12,-31],[strap+16,-5],[strap-6,-4]],null,'#c6a16c',4);
  }
  for(let i=0;i<25;i++) {
    const x=-100+i*8;
    line(ctx,[[x,-36+Math.sin(i*.15)*17],[x+3,-35+Math.sin(i*.15)*17]],'#e4bb8276',1.4);
  }
  ctx.restore();
}

function wheel(ctx,x,y,r,turn) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(.82,1);
  ctx.rotate(turn);
  ellipse(ctx,0,0,r,r,'#1e202338','#241a1d',23);
  arc(ctx,0,0,r,r,0,tau,'#504848',12);
  arc(ctx,0,0,r-11,r-11,0,tau,'#a2805e',9);
  arc(ctx,0,0,r-17,r-17,0,tau,'#684a3b',15);
  for(let i=0;i<12;i++) {
    const a=i*tau/12;
    const x=Math.cos(a), y=Math.sin(a);
    line(ctx,[[x*r*.09,y*r*.09],[x*(r-19),y*(r-19)]],'#46332f',r*.067);
    line(ctx,[[x*r*.14+y*4,y*r*.14-x*4],[x*(r-23)+y*4,y*(r-23)-x*4]],'#ac815c7d',2.4);
    arc(ctx,0,0,r+1,r+1,a,a+.3,'#b99c7961',2.3);
  }
  ellipse(ctx,0,0,r*.16,r*.16,'#875f44','#4a3230',5);
  ellipse(ctx,0,0,r*.068,r*.068,'#42353a','#bc945d',3.2);
  ctx.restore();
}

function bareTree(ctx,x,y,s) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(s,s);
  path(ctx,[[-15,0],[-7,-64],[-12,-147],[-4,-251],[2,-165],[9,-92],[16,0]],'#3d3335','#8f6e51',1.2);
  for(let i=0;i<8;i++) {
    const n=155+i*31;
    const side=i%2===0?1:-1;
    const y=-55-i*21;
    const x=(53+hash(n)*68)*side;
    line(ctx,[[0,y],[x*.44,y-54],[x,y-88]],'#51413d',Math.max(1,8-i*.8));
    line(ctx,[[x*.42,y-51],[x*.48,y-95],[x*.42,y-104]],'#53433f',2);
    line(ctx,[[x*.65,y-72],[x*.86,y-106],[x*1.05,y-114]],'#594a44',1.7);
  }
  ctx.restore();
}

function journey(ctx,f) {
  const p=ease(f.v);
  if(f.k===0) {
    view(ctx,930,454,1.05+.075*p,-66*p,0,-.043+ .018*p);
    path(ctx,[[-190,636],[2000,559],[2030,1120],[-150,1120]],shade(ctx,865,532,900,951,'#696058','#494449','#26232c'));
    for(let i=0;i<7;i++) bareTree(ctx,164+i*304-103*p,625-i*6,1.4-i*.13);
    ellipse(ctx,1031,744,530,94,shade(ctx,1040,654,1071,808,'#63595a','#636e71','#2d333b'),'#8b8172',2);
    for(let i=0;i<12;i++) line(ctx,[[640+i*43,728+i*4],[821+i*31,721+i*4]],'#af9e8754',1.7);
    figure(ctx,527-132*p,624,627,{pose:'back',facing:-1,young:true,tone:'#514038',time:f.t});
    path(ctx,[[505-91*p,405],[1493-93*p,388],[1611-93*p,520],[535-91*p,554]],
      shade(ctx,790,391,780,553,'#79543c','#543a32','#2d242b'),ink,5);
    line(ctx,[[565-91*p,480],[1574-93*p,446]],'#ad855c',5);
    wheel(ctx,1249-452*p,578,191,-f.v*3.8);
    const impact=ease((f.v-.38)*5);
    if(impact>0) {
      ctx.save();
      ctx.globalAlpha=(1-impact)*.83;
      for(let i=0;i<15;i++) {
        const dx=(i-7)*26*impact;
        const height=(16+hash(i*17)*153)*Math.sin(Math.PI*impact);
        line(ctx,[[1050+dx,746-height],[1058+dx,757-height]],'#d2bb9d',2.2);
      }
      for(let i=0;i<4;i++) arc(ctx,1050,749,25+i*42+103*impact,6+i*5,0,tau,'#cbb7a0',2);
      ctx.restore();
    }
    return;
  }
  view(ctx,1012,400,1.05-.055*p,27*p,4*p);
  contour(ctx,[['moveTo',-230,612],['bezierCurveTo',251,549,494,508,790,517],['quadraticCurveTo',1412,299,2150,491],
    ['lineTo',2150,1060],['lineTo',-230,1060],['closePath']],shade(ctx,970,412,948,946,'#7b7866','#5d6057','#292c33'));
  contour(ctx,[['moveTo',1750,495],['bezierCurveTo',1289,521,1196,613,1363,677],['quadraticCurveTo',1608,749,2135,792],
    ['lineTo',1040,847],['quadraticCurveTo',816,750,988,670],['quadraticCurveTo',1260,534,1750,495]],
    shade(ctx,1760,510,1330,788,'#a59a7d','#7e7565','#4b474a'));
  for(let i=0;i<9;i++) bareTree(ctx,185+i*169,624-i*15,1.5-i*.147);
  const x=1139+856*p;
  const y=638-143*p;
  const s=1-.78*p;
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(s,s);
  ellipse(ctx,37,31,247,29,'#27242b63');
  figure(ctx,0,8,277,{young:true,facing:1,tone:'#614638',time:f.t});
  satchel(ctx,38-10*p,-105+6*p,.67,-.12);
  palm(ctx,71-10*p,-117,.47,2.54);
  path(ctx,[[-219,-93],[217,-116],[173,-21],[-166,-7]],shade(ctx,0,-117,10,-19,'#866348','#493435'),ink,3);
  wheel(ctx,-135,-25,64,f.v*4);
  wheel(ctx,135,-36,59,f.v*4);
  ctx.restore();
}

function atticBeams(ctx, side) {
  const beams=side?[
    [[-170,85],[1478,-99],[1604,13],[-170,181]],
    [[60,-152],[170,12],[160,868],[47,960]],
    [[1616,-112],[1733,-158],[1837,979],[1706,938]],
  ]:[
    [[-330,69],[1355,-200],[1588,-119],[-212,216]],
    [[-218,165],[45,109],[897,508],[748,559]],
    [[1638,-150],[1849,-185],[1426,970],[1250,998]],
  ];
  for(let i=0;i<beams.length;i++) {
    const b=beams[i];
    path(ctx,b,shade(ctx,...b[0],...b[3],'#74503a','#442b25','#1c151b'),ink,5);
    for(let j=0;j<12;j++) {
      const k=(j+1)/15;
      line(ctx,[[lerp(b[0][0],b[3][0],k),lerp(b[0][1],b[3][1],k)],
        [lerp(b[1][0],b[2][0],k+.06),lerp(b[1][1],b[2][1],k+.06)]],j%2?'#af764348':'#271a1e91',j%2?1.7:3.2);
    }
  }
}

function table(ctx,x,y,w) {
  path(ctx,[[x+48,y+48],[x+119,y+59],[x+92,y+275],[x+44,y+265]],'#3b2627','#79523a',4);
  path(ctx,[[x+w-119,y+53],[x+w-65,y+23],[x+w-76,y+271],[x+w-120,y+274]],'#412c2a','#815740',4);
  path(ctx,[[x,y],[x+w,y-18],[x+w-12,y+54],[x+10,y+80]],shade(ctx,x,y,x,y+80,'#997044','#593a2d','#412727'),ink,4);
  path(ctx,[[x-12,y-2],[x+127,y-113],[x+w-96,y-136],[x+w+43,y-25],[x+w,y+2],[x+16,y+26]],
    shade(ctx,x+147,y-105,x+224,y+25,'#b48958','#795737','#5a3b2d'),ink,4);
  for(let i=0;i<13;i++) {
    const px=x+35+i*(w-90)/13;
    line(ctx,[[px,y+13],[px+124-(i*15),y-107-i*1.6]],'#50382c85',2.2);
  }
  line(ctx,[[x+12,y+26],[x+w-6,y+3]],'#d6a46b94',3);
}

function cover(ctx,x,y,p) {
  ctx.save();
  ctx.translate(x-366*p,y-133*Math.sin(p*Math.PI*.53));
  ctx.rotate(-.46*p);
  const tip=535-108*p;
  const bottom=127-44*p;
  contour(ctx,[['moveTo',-354,-78],['quadraticCurveTo',-125,-146,68,-112],['quadraticCurveTo',198,-155,tip,-86],
    ['bezierCurveTo',tip+42,-12,tip-42,53,tip-23,bottom],['quadraticCurveTo',281,bottom-59,148,bottom+2],
    ['quadraticCurveTo',-60,bottom-35,-108,bottom+58],['quadraticCurveTo',-259,bottom-13,-381,bottom+16],['closePath']],
  shade(ctx,-100,-112,101,bottom,'#b9a081','#917254','#5b433b','#473032'),'#76543c',3);
  for(let i=0;i<21;i++) {
    const x=-333+i*37;
    contour(ctx,[['moveTo',x+43,-77],['bezierCurveTo',x+153,-25,x-20,22,x-14,bottom-14]],null,
      i%3?'#ddbb8750':'#47352e80',i%3?1.7:5.2);
  }
  ctx.restore();
}

function attic(ctx,f) {
  const p=ease(f.v);
  if(f.k===0) {
    view(ctx,1060,515,.91+.27*p,-30*p,-62*p,.07-.039*p);
    path(ctx,[[-220,458],[1328,190],[2190,556],[2190,1000],[-220,1000]],shade(ctx,1148,286,913,827,'#856444','#51352c','#2a1e25'));
    boards(ctx,669,-126,5);
    for(let i=0;i<5;i++) {
      const x=84+i*105;
      const y=605-i*45;
      path(ctx,[[x-178,y],[x+231,y-22],[x+270,y-1],[x-163,y+43]],'#795137','#402a26',3);
      line(ctx,[[x-175,y+4],[x+245,y-18]],'#c08c56',2);
    }
    windowFrame(ctx,1373,160,249,297,true);
    light(ctx,1463,377,390,'255,195,114',.16);
    figure(ctx,895,753,481,{young:true,tone:'#564039',time:f.t});
    table(ctx,827,678,652);
    const lower=ease((f.v-.06)/.57);
    satchel(ctx,1041+33*lower,459+132*lower,.62,-.27+.29*lower);
    if(f.v<.65) palm(ctx,1025+33*lower,434+132*lower,.57,-.28);
    atticBeams(ctx,false);
    return;
  }
  view(ctx,1136,443,1+.087*p,-26*p,0,-.018);
  boards(ctx,10,22,9);
  windowFrame(ctx,1275,88,416,462,true);
  figure(ctx,714,795,564,{young:true,tone:'#655047',time:f.t});
  table(ctx,739,662,855);
  satchel(ctx,605,666,.41,.22);
  const lift=ease((f.v-.07)/.60);
  beam(ctx,[[1523,230],[1665,207],[1263,742],[798,749]],'255,222,163',.58*lift);
  cover(ctx,1066,600,lift);
  palm(ctx,1179-387*lift,518-155*Math.sin(lift*1.66),.94,.35-1.18*lift);
  light(ctx,1092,557,482,'255,190,111',.29*lift);
  atticBeams(ctx,true);
}

function prism(ctx,x,y,s) {
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(s,s);
  const a=[-5,-128], b=[-103,77], c=[104,54], d=[53,-149], e=[162,36];
  path(ctx,[a,d,e,c],shade(ctx,-7,-124,150,50,'#87b5ac5a','#98c0b271','#466d757d'),'#dbd5a8',2.6);
  path(ctx,[b,c,e,[ -46,61]],shade(ctx,-40,72,134,40,'#373c49','#9ac0af92'),'#819e98',2.4);
  path(ctx,[a,b,c],shade(ctx,-32,-93,53,73,'#cce3bd90','#648d9099','#acd2b699','#5b777885'),'#d9dfbd',3);
  line(ctx,[d,a,b],'#fff1bb',3.3);
  line(ctx,[[5,-111],[-76,57]],'#e5e7ba88',3.8);
  line(ctx,[[53,-132],[143,29]],'#e5dfb272',2.2);
  line(ctx,[[-81,68],[91,50],[149,33]],'#deceb78f',1.7);
  light(ctx,8,-7,128,'218,231,177',.23);
  ctx.restore();
}

function aperture(ctx,x,y) {
  path(ctx,[[x-352,y-479],[x+80,y-585],[x+155,y+512],[x-418,y+580]],
    shade(ctx,x-358,y,x+109,y,'#251a22','#3c292d','#211923'),ink,6);
  for(let i=0;i<11;i++) {
    const px=x-379+i*48;
    line(ctx,[[px+38,y-519],[px,y+510]],'#7e514144',2);
  }
  line(ctx,[[x+80,y-585],[x+155,y+512]],'#98634e',3);
  ellipse(ctx,x,y,20,16,'#77553d','#523332',2);
  ellipse(ctx,x,y,9,7,'#fff3c5','#f1d6a0',2);
  light(ctx,x,y,151,'255,220,158',.53);
}

const spectrum=[
  ['212,70,48','#df6651'],['232,123,52','#e89753'],['253,194,83','#f0c46e'],
  ['139,167,84','#a6b86c'],['73,154,161','#71b6b7'],['70,109,171','#6e99c8'],['126,89,153','#9877ac'],
];

function firstLight(ctx,f) {
  const p=ease(f.v);
  if(f.k===0) {
    view(ctx,937,426,1+.21*p,-139*p,-7*p,.022*(1-p));
    boards(ctx,672,-41,5);
    aperture(ctx,692,361);
    const align=ease(f.v*1.39);
    const x=1082-131*align;
    const y=513-137*align;
    path(ctx,[[697,358],[x+38,382],[x+38,410],[697,365]],
      shade(ctx,697,361,x+38,394,'#fff0baee','#f4e5b052','#e9dba42c'));
    palm(ctx,x+157,y+106,1.16,2.9);
    prism(ctx,x,y,1.29);
    line(ctx,[[x-47,y+13],[x+42,y+30]],`rgba(255,238,186,${.8*align})`,4);
    beam(ctx,[[x+41,y+24],[x+51,y+32],[x+596,y+156],[x+428,y+139]],'248,210,160',.23*align);
    return;
  }
  view(ctx,1263,401,1.02+.105*p,21*p,0,-.023);
  const edge=[[760,53],[1804,-71],[1836,718],[812,813]];
  path(ctx,edge,shade(ctx,815,153,1571,679,'#856952','#a08362','#60463c','#3d2c31'),ink,5);
  ctx.save();
  ctx.clip();
  for(let i=0;i<12;i++) {
    const y=71+i*63;
    line(ctx,[[771,y+35],[1832,y-53]],'#58423930',2);
    grain(ctx,804,y+10,997,34,31,i*317+711,'#503a3050');
  }
  const reveal=ease(f.v*1.53);
  for(let i=0;i<spectrum.length;i++) {
    const [rgb,color]=spectrum[i];
    const growth=ease((reveal-i*.079)*2.4);
    const x=1167+i*51;
    const y=271+i*40;
    ctx.save();
    ctx.globalAlpha=growth;
    light(ctx,x+20,y+10,121,rgb,.51);
    path(ctx,[[x-37,y-14],[x+46,y-12],[x+110,y+35],[x+17,y+40]],
      shade(ctx,x-45,y-14,x+100,y+40,`rgba(${rgb},0)`,color,`rgba(${rgb},0)`));
    ctx.restore();
  }
  ctx.restore();
  for(let i=0;i<spectrum.length;i++) {
    const growth=ease((reveal-i*.079)*2.4);
    beam(ctx,[[372,454],[382,463],[1197+i*52,278+i*40],[1162+i*51,268+i*40]],spectrum[i][0],.22*growth);
  }
  prism(ctx,322,457,.97);
  beam(ctx,[[-210,374],[-209,391],[316,458],[327,443]],'255,229,179',.34);
}

const scenes=[falling, night, titlePortrait, country, school, cambridge,
  mathematics, plague, journey, attic, firstLight];

export function drawActOne(ctx, f) {
  const draw=scenes[f.id-1];
  if (!draw) return;
  ctx.save();
  try {
    ctx.lineJoin='round';
    ctx.lineCap='round';
    draw(ctx, f);
  } finally {
    ctx.restore();
  }
}
