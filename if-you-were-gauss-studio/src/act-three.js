const W = 1920;
const H = 1080;
const TAU = Math.PI * 2;
const sin = Math.sin;
const cos = Math.cos;
const mix = (a, b, x) => a + (b - a) * x;
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => 1 - (1 - clamp(x)) ** 3;

function random(seed) {
  let value = seed;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function rect(c, x, y, w, h, fill) {
  c.fillStyle = fill;
  c.fillRect(x, y, w, h);
}

function poly(c, fill, ...xy) {
  c.beginPath();
  c.moveTo(xy[0], xy[1]);
  for (let i = 2; i < xy.length; i += 2) c.lineTo(xy[i], xy[i + 1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function line(c, color, width, ...xy) {
  c.beginPath();
  c.moveTo(xy[0], xy[1]);
  for (let i = 2; i < xy.length; i += 2) c.lineTo(xy[i], xy[i + 1]);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function oval(c, x, y, rx, ry, fill, stroke, width = 1, angle = 0) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, angle, 0, TAU);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}

function wash(c, x, y, X, Y, ...colors) {
  const g = c.createLinearGradient(x, y, X, Y);
  colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
  return g;
}

function glow(c, x, y, radius, color, edge = '#0000') {
  const g = c.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, edge);
  return g;
}

function camera(c, x, y, scale) {
  c.translate(W / 2, 500);
  c.scale(scale, scale);
  c.translate(-x, -y);
}

function vignette(c, color = '#03050acc', x = 960, y = 470) {
  const g = c.createRadialGradient(x, y, 300, x, y, 1170);
  g.addColorStop(0, '#0000');
  g.addColorStop(1, color);
  rect(c, 0, 0, W, H, g);
}

function dust(c, seed, t, x, y, w, h, n, color = '#ffeab3') {
  const rnd = random(seed);
  c.save();
  for (let i = 0; i < n; ++i) {
    const px = x + (rnd() * w + t * (4 + rnd() * 27)) % w;
    const py = y + (rnd() * h + t * 7) % h;
    c.globalAlpha = rnd() ** 2 * .46;
    oval(c, px, py, .4 + rnd() * 2, .4 + rnd() * 1.5, color);
  }
  c.restore();
}

function label(c, text, x = 108, y = 132, color = '#e4d4b0') {
  line(c, color, 2, x, y + 17, x + 44, y + 17);
  c.fillStyle = color;
  c.font = '500 32px "Microsoft YaHei", sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText(text, x + 65, y + 11);
}

function starfield(c, seed, dx = 0, dy = 0, count = 340) {
  const rnd = random(seed);
  for (let i = 0; i < count; ++i) {
    const x = ((rnd() * 2500 + dx) % 2500 + 2500) % 2500 - 290;
    const y = ((rnd() * 1300 + dy) % 1300 + 1300) % 1300 - 110;
    const magnitude = rnd() ** 4;
    const r = .45 + magnitude * 2.3;
    const strength = 35 + Math.round(magnitude * 150);
    oval(c, x, y, r, r, `rgba(${145 + i % 95},${180 + i % 70},255,${strength / 255})`);
  }
}

function coat(c, x, y, scale, options = {}) {
  const { lean = 0, gait = 0, reach = 0, old = false, back = false, face = 1, rim = '#ae825c', hat = false, arm = true } = options;
  c.save();
  c.translate(x, y);
  c.scale(scale * face, scale);
  c.rotate(lean);
  const cloth = wash(c, -75, 0, 85, 25, '#080a12', '#161320', '#3c302e');
  const swing = sin(gait);
  line(c, '#080910', 29, -23, 126, -28 + swing * 34, 189, -35 + swing * 42, 257 - Math.max(0, swing) * 17);
  line(c, '#14121b', 27, 18, 123, 25 - swing * 33, 190, 20 - swing * 39, 257 - Math.max(0, -swing) * 19);
  poly(c, cloth, -38,-30, 16,-38, 57,-10, 40,48, 35,96, 66,150, -46,162, -60,115, -54,45, -60,4);
  poly(c, '#0c0c13', -24,-70, 24,-70, 25,-30, -27,-18);
  c.beginPath();
  c.moveTo(-43,-81);
  c.bezierCurveTo(-60,-132, -13,-163, 25,-141);
  c.bezierCurveTo(43,-134, 39,-113, 42,-102);
  if (!back) {
    c.lineTo(56,-91);
    c.lineTo(45,-85);
    c.lineTo(43,-70);
    c.quadraticCurveTo(39,-62, 19,-61);
  } else c.quadraticCurveTo(38,-58, 12,-57);
  c.quadraticCurveTo(-23,-50,-43,-81);
  c.fillStyle = '#13111a';
  c.fill();
  c.strokeStyle = rim;
  c.lineWidth = 1.9;
  c.stroke();
  if (old) line(c, '#a6a3a6', 4, -36,-122, -43,-105, -36,-83, -24,-75);
  if (hat) {
    poly(c, '#0e111b', -65,-130, 58,-126, 59,-136, 31,-141, 26,-170, -28,-175, -43,-144);
    line(c, rim, 2, -52,-142, -35,-147, -23,-174, 27,-167);
  }
  line(c, rim, 2, -25,-36, -48,-21, -61,10, -55,69, -62,118);
  if (!back) poly(c, '#c9ad85', 8,-35, 30,-42, 39,-22, 21,14, 14,-9);
  if (arm) {
    line(c, '#11111a', 25, -33,-4, -18 + reach * 32, 59 - reach * 55, 17 + reach * 82, 88 - reach * 113);
    oval(c, 20 + reach * 82, 88 - reach * 113, 13, 9, '#49362e', rim, 1.1, -.35);
  }
  c.restore();
}

function paper(c, x, y, w, h, angle, kind = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.shadowColor = '#1c0816a8';
  c.shadowBlur = 14;
  c.shadowOffsetY = 12;
  poly(c, wash(c, -w / 2, -h / 2, w / 2, h / 2, kind ? '#ead4a0' : '#9b677c', kind ? '#c39168' : '#523148'), -w/2,-h/2, w*.49,-h*.48, w/2,h*.45, w*.41,h/2, -w*.49,h*.47);
  c.shadowColor = '#0000';
  const rnd = random(52 + kind);
  for (let i = 0; i < 33; ++i) {
    const px = (rnd() - .5) * w * .86;
    const py = (rnd() - .5) * h * .86;
    line(c, '#46253645', .7, px, py, px + 7 + rnd() * 22, py + 1);
  }
  for (let row = 0; row < 9; ++row) {
    const yy = h * (-.33 + row * .078);
    for (let column = 0; column < (kind ? 3 : 2); ++column) {
      const xx = -w * .38 + w * column * .245;
      line(c, '#432a3869', 2, xx, yy, xx + w * (.05 + rnd() * .125), yy - 1);
    }
  }
  if (kind) {
    oval(c, w*.23, h*.25, 24, 18, null, '#8d292b', 2);
    line(c, '#8d292b', 2, w*.19,h*.25, w*.27,h*.25);
    line(c, '#8d292b', 2, w*.23,h*.19, w*.23,h*.31);
  }
  c.restore();
}

function predictionDrop(c, f) {
  rect(c, 0, 0, W, H, wash(c, 0, 0, 1400, 930, '#42132e', '#ad4668', '#291528'));
  c.save();
  const crash = ease(f.v * 4.8);
  camera(c, 960 + 155 * ease(f.v), 510, 1 + .29 * ease(f.v) + .013 * sin(f.a * 37) * (1 - f.v));
  rect(c, -600, 130, 3200, 1000, glow(c, 1350, 475, 960, '#f1969444'));
  for (let i = 0; i < 30; ++i) line(c, '#2d112d4d', 2, -700, 170+i*34, 2800, 235+i*34);
  paper(c, 365, 372, 630, 375, -.18);
  paper(c, 580, 610, 750, 400, .15);
  paper(c, 290, 688, 400, 270, -.25);
  paper(c, mix(290, 1320, crash), mix(-500, 488, crash) + 12 * sin(crash * Math.PI), 570, 425, mix(-.52, -.055, crash), 1);
  c.restore();
  rect(c, 0, 0, W, H, `rgba(14,6,22,${.32 * ease((f.v - .55) * 2.2)})`);
  vignette(c, '#110919ba');
}

function observatory(c, x, y, scale, light = '#576b7e') {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  poly(c, '#182330', -209,46, -162,8, -130,9, -130,-23, 122,-22, 124,18, 184,18, 208,49, 190,151, -209,151);
  poly(c, '#273441', -202,47, -126,9, -117,136, -205,148);
  poly(c, '#111c28', -151,-21, -119,-43, 119,-43, 146,-21);
  c.beginPath();
  c.ellipse(0, -60, 78, 56, 0, Math.PI, TAU);
  c.lineTo(78,-41);
  c.lineTo(-78,-41);
  c.closePath();
  c.fillStyle = '#17222e';
  c.fill();
  line(c, light, 2, -201,46, -162,8, -129,8, -129,-22, -119,-42, -76,-43);
  line(c, light, 1.5, -70,-78, -49,-102, -17,-114, 19,-114, 54,-99);
  line(c, '#0d1721', 13, 2,-114, 12,-55);
  for (let i = 0; i < 6; ++i) {
    rect(c, -105+i*38, 30, 13, 29, i === 3 ? '#cf996a' : '#0e1823');
    rect(c, -105+i*38, 85, 13, 26, '#101923');
  }
  c.restore();
}

function climb(c, f) {
  const high = f.k === 1;
  rect(c, 0, 0, W, H, wash(c, 0,0,0,1050,'#152131','#65778b','#b1a5a3','#424758'));
  const x = high ? 1365 : 1290;
  rect(c, 0, 0, W, H, glow(c, x, 365, 900, '#e3c6ac76'));
  poly(c, '#45576b', 0,515, 160,442, 344,493, 523,381, 736,494, 970,438, 1235,344, 1453,390, 1920,490, 1920,1080, 0,1080);
  const rise = f.v * 36;
  observatory(c, x - f.v * 17, (high ? 305 : 396) + rise, high ? 1.25 : .66);
  poly(c, '#8091a0', 0,836, 330,765, 660,696, 935,668, 1305,490+rise, 1400,466+rise, 1920,619, 1920,1080, 0,1080);
  poly(c, '#313e52', 0,960, 398,863, 723,754, 1008,695, 1315,505+rise, 1423,477+rise, 1920,644, 1920,1080, 0,1080);
  for (let i = 0; i < 15; ++i) {
    const depth = (i / 15) ** 1.65;
    const xx = mix(1350, high ? 420 : 140, depth);
    const yy = mix(510+rise, 1040, depth);
    const w = mix(23, 350, depth);
    poly(c, i%2 ? '#8d9aa6' : '#748698', xx-w,yy, xx+w,yy-w*.23, xx+w*1.04,yy-w*.13, xx-w,yy+w*.09);
  }
  const px = (high ? 610 : 700) + f.v * (high ? 75 : 196);
  const py = (high ? 680 : 691) - f.v * 53 + sin(f.a * 14) * 7;
  const s = high ? 1.68 : .97;
  const lx = px + (high ? 141 : 93);
  const ly = py - (high ? 40 + f.v*79 : 18);
  rect(c,lx-250,ly-250,500,500,glow(c,lx,ly,250,'#ffad5860'));
  coat(c,px,py,s,{back:high,gait:f.a*17,lean:.19,reach:.83,rim:'#93a8b3',hat:true});
  line(c,'#1e1b25',5,px+s*92,py-s*7,lx,ly-12);
  rect(c,lx-11,ly-15,22,31,'#362534');
  rect(c,lx-6,ly-10,12,19,'#ffd78b');
  oval(c,lx,ly,51,51,glow(c,lx,ly,51,'#ffc77798'));
  dust(c,37,f.a,0,65,W,850,124,'#e6f4ff');
  vignette(c,'#0a121f95');
}

function clock(c,f) {
  const close = f.k === 1;
  rect(c,0,0,W,H,wash(c,0,0,1640,930,'#465744','#293936','#0d181b'));
  c.save();
  camera(c,close ? 995+36*f.v : 930-24*f.v,close ? 546+11*f.v : 500,close ? 1.85+.13*f.v : 1+.035*f.v);
  rect(c,290,115,113,535,'#090f12');
  rect(c,311,138,70,480,wash(c,311,138,391,615,'#e1dec0','#b0cbb4','#5c7e70'));
  for (let i=0;i<5;++i) rect(c,303,211+i*86,88,7,'#546959');
  poly(c,wash(c,315,100,1290,720,'#e9edb23b','#bbd9ac07'),367,144,391,167,1670+145*f.v,669,1662+145*f.v,863,367,607);
  rect(c,811,120,391,852,'#12191a');
  rect(c,832,145,348,804,wash(c,830,145,1180,910,'#524b37','#1c2420','#111719'));
  rect(c,854,493,305,418,wash(c,854,493,1159,911,'#101917','#354236','#162023'));
  line(c,'#8a7f4b',3,846,888,846,184,1158,184);
  c.save();
  c.translate(1004,499);
  c.rotate(sin(f.a*3.4)*.23);
  rect(c,-3,0,6,329,wash(c,-3,0,3,0,'#f0d593','#564128'));
  oval(c,0,290,62,48,wash(c,-72,254,69,334,'#382c1e','#c39148','#ffda88','#684a28'),'#d3b16a',2);
  oval(c,0,290,48,37,null,'#76532f',2);
  oval(c,0,290,34,28,null,'#f5ca7180');
  c.restore();
  const dx=1006, dy=342, dr=139;
  oval(c,dx,dy,dr,dr,wash(c,dx-90,dy-110,dx+90,dy+110,'#c3af7c','#978564','#594c38'),'#5f553b',6);
  for (let i=0;i<60;++i) {
    const q=i*TAU/60, r=dr-(i%5 ? 13 : 24);
    line(c,'#332a21',i%5 ? 1 : 2,dx+cos(q)*r,dy+sin(q)*r,dx+cos(q)*(dr-7),dy+sin(q)*(dr-7));
  }
  const hand=-1.65+.105*ease((f.v-.42)*8)*Number(close);
  line(c,'#251d17',4,dx,dy,dx+cos(hand)*dr*.86,dy+sin(hand)*dr*.86);
  oval(c,dx,dy,6,6,'#e8c07b');
  dust(c,49,f.a,388,220,850,530,96);
  c.restore();
  vignette(c,'#0a1514ad');
}

function telescope(c,x,y,angle,scale) {
  c.save();
  c.translate(x,y);
  c.rotate(angle);
  c.scale(scale,scale);
  const metal=wash(c,0,-57,0,59,'#edc687','#906239','#423025','#141521','#906342');
  poly(c,metal,-280,-23,272,-58,272,58,-280,22);
  for (const [xx,r,w] of [[-270,26,24],[-90,39,25],[98,51,28],[254,62,36]]) {
    rect(c,xx-w/2,-r,w,r*2,wash(c,0,-r,0,r,'#a67d4d','#f2cf88','#493224','#221c23'));
    line(c,'#f7d497',2,xx+w*.37,-r,xx+w*.37,r);
  }
  rect(c,-324,-15,53,30,metal);
  oval(c,273,0,17,58,'#211b22','#eac287',4);
  oval(c,278,0,10,47,wash(c,272,-40,289,38,'#14383b','#586570','#101525'));
  line(c,'#ffe7a474',2,-245,-19,232,-47);
  c.restore();
}

function gear(c,x,y,r,angle) {
  c.save();
  c.translate(x,y);
  c.rotate(angle);
  for (let i=0;i<28;++i) {
    c.rotate(TAU/28);
    rect(c,r-7,-r*.085,12,r*.17,'#98663b');
  }
  oval(c,0,0,r,r,wash(c,-r,-r,r,r,'#ffe29b','#9d6738','#262029'),'#c08852',2);
  oval(c,0,0,r*.72,r*.72,null,'#382925',3);
  for (let i=0;i<6;++i) {
    c.rotate(TAU/6);
    line(c,'#543927',r*.08,r*.22,0,r*.69,0);
  }
  oval(c,0,0,r*.21,r*.21,'#d3a35e','#f5d199',2);
  c.restore();
}

function instrumentRoom(c,f) {
  const [x,y,z]=[[909,505,1.04],[1035,503,1.2],[1137,603,2.66],[897,474,1.31]][f.k];
  rect(c,0,0,W,H,wash(c,0,150,0,1080,'#2c2028','#513531','#1a1924'));
  c.save();
  camera(c,x+f.v*28,y-f.v*12,z+f.v*.065);
  rect(c,-500,-400,3100,1800,glow(c,1350,330,1060,'#c8794a85'));
  poly(c,'#432f2e',-500,980,0,711,1460,700,2450,990,2450,1350,-500,1350);
  for (let i=0;i<11;++i) line(c,'#7f55443d',2,900,698,-560+i*292,1080);
  rect(c,1260,158,360,432,'#201c25');
  rect(c,1280,174,317,398,wash(c,1290,180,1600,570,'#ffd78d','#b36c48','#553238'));
  line(c,'#36292b',12,1437,168,1437,578);
  line(c,'#36292b',10,1274,344,1606,344);
  poly(c,'#ffc58018',1287,219,1598,375,457,964,-450,964);
  const move=ease(f.v);
  const angle=[-.25,-.22+.26*move,.035,.032-.087*move][f.k];
  const tx=f.k===3 ? 1118-move*96 : 1116;
  const ty=f.k===3 ? 490-move*24 : 468;
  if (f.k<2) coat(c,f.k ? 676 : 623+move*43,548,f.k ? 1.34 : 1.18,{reach:.62+move*.62,lean:.08+.11*move,rim:'#cf9863',hat:f.k===1});
  line(c,'#16151e',32,tx,ty+76,tx-129,915);
  line(c,'#191821',32,tx,ty+75,tx+132,901);
  line(c,'#be84565c',4,tx-12,ty+99,tx-145,910);
  telescope(c,tx,ty,angle,f.k===3 ? 1.46 : 1.08);
  gear(c,tx+17,ty+111,f.k===2 ? 72 : 47,.5+f.a*.79);
  if (f.k===2) {
    const grip=17*sin(f.v*Math.PI);
    poly(c,'#13131e',557,813,640,648,891,599,1004,626,968,755,681,861);
    poly(c,wash(c,930,596,1198,707,'#bd805d','#5b3737','#2f2231'),954,612,1019,599,1088,560-grip,1149,552-grip,1168,567-grip,1149,584-grip,1096,591,1125,606,1171,601+grip,1177,620+grip,1101,641,1022,673,969,683);
    line(c,'#f4b578',2,1020,600,1088,560-grip,1148,552-grip,1168,567-grip);
  }
  if (f.k===3) coat(c,415+move*31,600,2.02,{back:true,lean:.18+move*.04,reach:1.45,rim:'#b17b53'});
  dust(c,36,f.a,600,220,1020,620,110);
  c.restore();
  vignette(c,'#130d17c7');
}

function predictionChart(c,f) {
  const [x,y,z]=[[835,494,1],[675,681,1.85],[990,491,1.43],[1180,516,2.05]][f.k];
  rect(c,0,0,W,H,'#10131c');
  c.save();
  camera(c,x+f.v*95,y,z+.09*f.v);
  rect(c,-800,-500,3500,2100,wash(c,360,110,1580,1000,'#38313b','#674a4f','#231824'));
  c.translate(960,500);
  c.rotate(f.k===2 ? -.11*(1-ease(f.v)) : -.105);
  poly(c,wash(c,-730,-335,750,400,'#ad9075','#eadabc','#ab8b71'),-795,-388,800,-386,789,367,714,421,-795,398);
  const rnd=random(503);
  for (let i=0;i<330;++i) {
    const xx=(rnd()-.5)*1515, yy=(rnd()-.5)*731;
    line(c,i%2 ? '#631a2319' : '#fff0cd45',.8,xx,yy,xx+1+rnd()*13,yy+rnd()*3);
  }
  for (let i=-10;i<=10;++i) {
    const xx=i*69;
    line(c,'#47344264',i%5===0 ? 2 : 1,xx,-284,xx,274);
    for (const yy of [-284,274]) line(c,'#4c354b',2,xx,yy,xx,yy+12);
  }
  for (let i=-4;i<=4;++i) line(c,'#47344264',1,-690,i*68,690,i*68);
  for (let i=0;i<62;++i) oval(c,(rnd()-.5)*1344,(rnd()-.5)*527,.7+rnd()*2,1.35,'#423543aa');
  c.font='23px Georgia, serif';
  c.fillStyle='#64464c';
  c.textAlign='left';
  for (let i=0;i<8;++i) c.fillText(`${14+i}°`,-690+i*193,322);
  c.beginPath();
  c.moveTo(-645,203);
  c.bezierCurveTo(-235,140,-62,-57,484,-201);
  c.strokeStyle='#76545c';
  c.lineWidth=2;
  c.stroke();
  const px=103, py=-32;
  oval(c,px,py,10,10,'#a53038');
  oval(c,px,py,23,23,null,'#9a3038',2);
  line(c,'#9a3038',2,px+24,py-14,px+145,py-91,px+315,py-91);
  c.font='600 27px "Microsoft YaHei", sans-serif';
  c.fillStyle='#8f2931';
  c.fillText('预测位置',px+160,py-104);
  c.restore();
  vignette(c,'#130a16bb');
}

function reticle(c,x,y,r,color) {
  for (const side of [-1,1]) {
    line(c,color,1.3,x+side*r,y,x+side*9,y);
    line(c,color,1.3,x,y+side*r,x,y+side*9);
    for (let i=1;i<r/29;++i) {
      const d=i*29*side;
      line(c,color,1,x+d,y-4,x+d,y+4);
      line(c,color,1,x-4,y+d,x+4,y+d);
    }
  }
}

function eyepiece(c,f) {
  const shot=f.k;
  const x=[918,966,952,967,960,960][shot];
  const y=[496,490,502,491,500,489][shot];
  const r=[432,385,328,279,223,163][shot]-f.v*[13,15,13,16,15,6][shot];
  const flat=[1,.98,.91,.86,.80,.75][shot];
  const pan=[451,389,237,140,-164,-489][shot]-f.v*[110,121,94,195,188,8][shot];
  rect(c,0,0,W,H,'#020308');
  oval(c,x,y,r+39,r*flat+31,glow(c,x,y,r+47,'#2a3046','#05070b'));
  oval(c,x,y,r+8,r*flat+8,'#04070d','#27314a',1.2);
  c.save();
  c.beginPath();
  c.ellipse(x,y,r,r*flat,0,0,TAU);
  c.clip();
  rect(c,x-r,y-r,2*r,2*r,glow(c,x+55,y-75,r*1.12,'#233c57','#060c19'));
  starfield(c,393,pan,shot*9,shot===5 ? 194 : 330);
  for (let i=0;i<2;++i) {
    const sx=x+pan+(i ? 314 : 38), sy=y+(i ? 39 : -21);
    oval(c,sx,sy,18,18,glow(c,sx,sy,18,i ? '#8ca6ff91' : '#eff7e49e'));
    oval(c,sx,sy,i ? 3.1 : 4.4,i ? 3.1 : 4.4,'#e0e9fa');
  }
  if (shot>=2) reticle(c,x+sin(f.a*8)*(shot===5 ? .5 : 5),y+1,r*.93,'#c0cce296');
  const shadow=c.createRadialGradient(x,y,r*.39,x,y,r);
  shadow.addColorStop(0,'#0000');
  shadow.addColorStop(.69,'#01030958');
  shadow.addColorStop(1,'#010309f8');
  rect(c,x-r,y-r,r*2,r*2,shadow);
  c.restore();
}

function discovery(c,f) {
  const wide=f.k===1;
  const pull=wide ? ease(f.v) : f.v;
  const x=wide ? mix(868,700,pull) : 865-f.v*19;
  const y=wide ? mix(435,469,pull) : 425+f.v*10;
  const burst=wide ? .08 : (1-f.v)**3;
  rect(c,0,0,W,H,wash(c,0,0,1710,1080,'#10233b','#294665','#121d35','#070d1b'));
  rect(c,0,0,W,H,glow(c,x,y,1080,`rgba(93,151,207,${.57+burst*.22})`));
  starfield(c,393,-382-f.v*(wide?145:30),27,600);
  const rnd=random(62);
  for (let i=0;i<64;++i) {
    const sx=160+rnd()*1570, sy=160+rnd()*610;
    const rr=3+rnd()*16;
    oval(c,sx,sy,rr,rr,glow(c,sx,sy,rr,'#a4c9f315'));
  }
  const radius=wide ? 480+125*pull : 530;
  c.save();
  c.translate(x,y);
  c.rotate(-.14-pull*.04);
  for (let i=1;i<=5;++i) oval(c,0,0,radius*i/4,radius*i*.13,null,`rgba(142,192,229,${(wide?.32:.15)-i*.018})`,1.4);
  const map=[[-568,-80],[-450,-147],[-286,-82],[-168,-183],[-69,-123],[0,0],[133,-68],[214,21],[345,82],[512,-13]];
  if (wide) {
    c.save();
    c.scale(.83+.17*pull,.81+.19*pull);
    line(c,'#c0d7ea8e',1.7,...map.flat());
    for (const [a,b] of map) oval(c,a,b,3.3,3.3,'#c3e4f7');
    c.restore();
  }
  c.restore();
  if (!wide) reticle(c,x-11,y+8,301,'#c4d9f188');
  rect(c,0,0,W,H,glow(c,x,y,wide ? 305 : 710,`rgba(255,229,162,${.23+.45*burst})`));
  const diameter=75+185*burst;
  oval(c,x,y,diameter,diameter,glow(c,x,y,diameter,'#fff1beea'));
  const flare=wide ? 30 : 59+83*burst;
  poly(c,'#ffefd299',x-flare,y,x-5,y-4,x,y-flare*.51,x+5,y-4,x+flare,y,x+5,y+4,x,y+flare*.51,x-5,y+4);
  oval(c,x,y,wide?7:9+burst*4,wide?7:9+burst*4,'#fff9e4');
  vignette(c,'#020813a3',x,y);
  if (wide) {
    const titleX=1133+(1-ease(f.v*3.5))*160;
    const titleY=549+16*sin(16*f.v)*(1-ease(f.v*2));
    c.fillStyle='#efeedf';
    c.shadowColor='#060e22';
    c.shadowBlur=24;
    c.font='800 139px "Microsoft YaHei", sans-serif';
    c.textAlign='left';
    c.fillText('谷神星',titleX,titleY);
    c.shadowBlur=0;
    label(c,'约1801年末',titleX+7,titleY+74,'#c1d9ed');
  }
}

function morning(c,f) {
  if (f.k===0) {
    rect(c,0,0,W,H,wash(c,0,0,0,967,'#425165','#85909d','#dad1be','#4d5865'));
    rect(c,0,0,W,H,glow(c,1360,378,860,'#fff2d4a6'));
    for (let depth=0;depth<3;++depth) {
      const rnd=random(401+depth);
      const base=[593,715,890][depth];
      const fill=['#566577','#343e50','#1b2433'][depth];
      for (let i=0;i<20;++i) {
        const xx=-180+i*127-f.v*(28+depth*49)+(rnd()-.5)*50;
        const height=38+rnd()*(105+depth*57);
        const width=96+rnd()*63;
        const peak=base-height-30-rnd()*50;
        poly(c,fill,xx,base,xx,base-height,xx+width*.37,peak,xx+width,base-height+4,xx+width,base+150,xx,base+150);
        line(c,'#bab9b156',1.4,xx,base-height,xx+width*.37,peak,xx+width,base-height+4);
        if (i%4===depth) {
          rect(c,xx+width*.65,peak-30,18,60,fill);
          for(let j=0;j<3;++j) rect(c,xx+23+29*j,base-height+26,11,17,'#b9a49165');
        }
      }
      if (depth===0) poly(c,fill,1040,601,1040,401,1022,400,1070,330,1081,258,1091,330,1135,400,1115,401,1115,601);
    }
    rect(c,0,893,W,187,'#1b2433');
    vignette(c,'#1318268f');
    return;
  }
  rect(c,0,0,W,H,wash(c,0,0,1780,910,'#232a35','#4a4d50','#242933'));
  c.save();
  camera(c,960+f.v*60,489,1.03+.06*f.v);
  rect(c,1020,137,550,607,'#101725');
  rect(c,1041,151,510,576,wash(c,1041,151,1551,727,'#ffefd3','#d5d2c3','#637788'));
  for (let i=1;i<4;++i) rect(c,1040+i*127,151,12,576,'#4c5359');
  rect(c,1041,435,510,13,'#5d5c5c');
  poly(c,wash(c,1150,785,958,1110,'#4b4b4d','#202735'),-350,840,2100,754,2340,1190,-400,1190);
  for (let i=0;i<11;++i) line(c,'#d5bd9629',2,1390+i*61,773,-560+i*375,1180);
  poly(c,wash(c,1200,450,690,940,'#faefcf48','#edc39814'),1040,199,1549,562,894,1060,-185,1060);
  const px=840+f.v*284, py=578+10*sin(f.a*10);
  oval(c,px+33,py+348,150,16,glow(c,px+33,py+348,142,'#09111ca0'),null,1,-.05);
  coat(c,px,py,1.38,{gait:f.a*13,reach:.26,lean:.07,rim:'#e0bb86'});
  oval(c,px+61,py+135,10,10,null,'#d9b778',3);
  line(c,'#d9b778',3,px+63,py+143,px+70+sin(f.a*17)*6,py+166);
  line(c,'#bba27a',15,px-52,py+100,px+13,py+127);
  dust(c,534,f.a,400,245,1000,590,110);
  c.restore();
  vignette(c,'#07101ca8');
}

function telegraph(c,f) {
  const close=f.k===1;
  rect(c,0,0,W,H,wash(c,0,0,1680,944,'#402a27','#8a5540','#211b26'));
  c.save();
  camera(c,close ? 1113+47*f.v : 920+41*f.v,close ? 591 : 506,close ? 2.95+.15*f.v : 1+.045*f.v);
  rect(c,-600,-500,3300,2100,glow(c,930,331,900,'#ffc5848d'));
  for (let i=0;i<6;++i) rect(c,69+i*361,70,14,674,'#201a2480');
  if (!close) {
    coat(c,510+f.v*29,519,1.37,{reach:.9+f.v*.26,rim:'#eaac6c'});
    coat(c,1455-f.v*17,505,1.44,{face:-1,lean:.13,reach:.68+f.v*.39,rim:'#e0ac79'});
  }
  poly(c,wash(c,917,674,1015,804,'#7f5237','#302528'),172,710,1700,710,1865,820,62,820);
  rect(c,60,819,1810,200,'#1a1922');
  line(c,'#bf83547d',3,79,817,1854,817);
  poly(c,'#211d29',688,652,1281,652,1351,706,617,706);
  rect(c,618,705,732,30,wash(c,620,705,620,735,'#694632','#221d27'));
  oval(c,782,590,55,70,'#39272b','#ddae6d',2);
  rect(c,782,520,141,140,wash(c,782,520,782,660,'#3d2d26','#dc8f50','#5b372c'));
  for(let i=0;i<36;++i) {
    const xx=785+i*3.94;
    line(c,i%3 ? '#8a4b32' : '#f8b36d',1.4,xx,522+(i%3),xx+2,657);
  }
  oval(c,924,590,30,71,wash(c,899,529,939,653,'#f5ce85','#815534','#241f26'),'#e6b46f',3);
  oval(c,931,587,14,34,'#241c22');
  c.beginPath();
  c.moveTo(939,604);
  c.bezierCurveTo(984,647,995,706,1085,662);
  c.strokeStyle='#bd7950';
  c.lineWidth=4;
  c.stroke();
  oval(c,1136,571,107,92,wash(c,1040,504,1220,650,'#ead4a4','#b69d72','#71523a'),'#a37b4e',7);
  for(let i=0;i<26;++i) {
    const q=3.32+i*.104;
    line(c,'#574039',i%5===0 ? 2 : 1,1136+cos(q)*89,577+sin(q)*73,1136+cos(q)*(i%5 ? 79 : 70),577+sin(q)*65);
  }
  const tick=close ? ease((f.v-.29)*6) : 0;
  const q=-1.94+tick*.81+.035*sin(f.a*35)*tick*(1-f.v);
  line(c,'#6e272f',3,1136,607,1136+cos(q)*91,607+sin(q)*91);
  oval(c,1136,607,7,7,'#553b33','#ddbc83');
  dust(c,745,f.a,337,170,1220,551,100);
  c.restore();
  vignette(c,'#120c16ac');
}

function lastRoom(c,f) {
  if (f.k===1) {
    rect(c,0,0,W,H,wash(c,0,0,1550,1000,'#2f3c51','#535e70','#171f30'));
    const x=1170+f.v*27, y=530+f.v*22;
    poly(c,'#151d2d',-280,905,709,379,1670,433,2250,807,2250,1080,-280,1080);
    poly(c,wash(c,590,441,1100,1040,'#394353','#1c2534','#111925'),317,799,782,400,1760,453,1959,1020,1100,1080,334,1080);
    for (let i=0;i<17;++i) line(c,'#6472833e',2,781-i*30,405+i*34,1758+i*11,454+i*36);
    poly(c,'#121c2a',x-161,y+106,x-161,y-55,x+3,y-180,x+158,y-56,x+149,y+106);
    line(c,'#82909b',3,x-169,y-52,x+3,y-181,x+165,y-53);
    const light=1-ease((f.v-.31)*2.1);
    oval(c,x,y,238,238,glow(c,x,y,238,`rgba(255,178,104,${light*.27})`));
    rect(c,x-65,y-40,130,148,'#0f1725');
    rect(c,x-49,y-29,99,120,wash(c,x-49,y-29,x+45,y+91,`rgba(255,214,135,${light*.96})`,`rgba(178,86,56,${light*.65})`));
    line(c,'#302635',5,x,y-36,x,y+98);
    line(c,'#302635',5,x-53,y+27,x+55,y+27);
    dust(c,735,f.a,0,40,W,960,83,'#d1dfeb');
    vignette(c,'#091322cf');
    return;
  }
  rect(c,0,0,W,H,wash(c,0,0,1400,1200,'#202634','#58697c','#181c2a'));
  rect(c,0,0,W,H,glow(c,1061,349,710,'#b7c6cb79'));
  c.save();
  camera(c,952+f.v*29,501,1+.07*f.v);
  rect(c,805,138,495,516,'#1e2635');
  rect(c,824,159,458,475,wash(c,824,159,1282,634,'#c7ccce','#899cae','#425267'));
  line(c,'#374450',11,1049,158,1049,642);
  line(c,'#394752',11,821,406,1288,406);
  poly(c,'#293442',412,713,1412,681,1662,899,184,937);
  poly(c,'#171e2b',184,937,1662,899,1650,1134,183,1134);
  paper(c,1118,775,277,122,-.12,1);
  rect(c,1374,483,270,349,glow(c,1494,630,240,'#ffb26476'));
  line(c,'#47353b',9,1494,629,1494,770);
  oval(c,1494,770,38,8,'#2c2631');
  poly(c,'#c48b58',1459,620,1524,620,1550,665,1434,665);
  const retract=ease(f.v*1.16);
  coat(c,753-retract*14,596,1.62,{back:true,old:true,lean:.28-.07*retract,arm:false,rim:'#c0ad99'});
  const handX=1073-retract*123, handY=757-retract*30;
  line(c,'#20202c',37,837,680,931-retract*42,738,handX-15,handY);
  oval(c,handX,handY,18,8,'#56413c','#a48e81',1.6,.12);
  dust(c,752,f.a,749,150,660,651,91,'#d5e6ef');
  c.restore();
  vignette(c,'#0d1320c5');
}

function solarPanel(c,side) {
  poly(c,'#1f2b47',side*98,-32,side*149,-49,side*173,-55,side*173,54,side*98,34);
  const x=side>0 ? 165 : -682;
  rect(c,x-4,-81,521,162,'#8f99aa');
  rect(c,x,-77,513,154,wash(c,x,-77,x+385,77,'#1e4679','#0e1e38','#31506d'));
  for (let col=0;col<40;++col) {
    const cell=Math.floor(col/8);
    for(let row=0;row<8;++row) {
      const sx=x+4+cell*102.5+(col%8)*12, sy=-74+row*19;
      rect(c,sx,sy,10,17,`rgba(${44+col%9*4},${81+row%4*7},${134+col%6*7},.68)`);
      line(c,'#a3c0e153',.7,sx+2,sy+1,sx+9,sy+1);
    }
  }
  for (let i=0;i<=5;++i) {
    const edge=x+i*102.5;
    rect(c,edge-2,-78,4,155,'#b2b5b6');
    rect(c,edge-5,-78,10,8,'#e3e0d0');
    rect(c,edge-5,69,10,8,'#77879b');
  }
  line(c,'#d4e2e8',2,x-4,-82,x+517,-82);
  line(c,'#9cb4d477',1.4,x+3,0,x+512,0);
}

function spacecraft(c,x,y,s,q) {
  c.save();
  c.translate(x,y);
  c.rotate(q);
  c.scale(s,s);
  c.transform(1,-.061,.23,.77,0,0);
  solarPanel(c,-1);
  solarPanel(c,1);
  const foil=wash(c,-115,-113,117,109,'#f1e1b0','#8c775b','#d2ab6e','#292b35');
  poly(c,foil,-99,-104,80,-120,128,-64,126,71,51,104,-92,82,-129,-42);
  poly(c,'#796b56',-99,-104,-48,-69,120,-61,80,-120);
  poly(c,'#262939',-48,-69,120,-61,126,71,51,104,-60,77);
  const rng=random(238);
  for (let i=0;i<62;++i) {
    const xx=-105+rng()*49, yy=-76+rng()*138;
    line(c,i%2 ? '#f9dba767' : '#493d396d',.8,xx,yy,xx-4+rng()*18,yy+12*rng());
  }
  for (let i=0;i<9;++i) rect(c,-27+i*13,-28,11,57,i%2 ? '#6a7180' : '#434758');
  line(c,'#ead8b6',3,-128,-43,-99,-103,80,-119,126,-65);
  line(c,'#ad9271',6,-25,24,12,-47,29,-113);
  oval(c,42,-133,89,42,wash(c,-33,-173,93,-99,'#dfe0d6','#a0a7ac','#515978'),'#ebeddf',2,-.14);
  oval(c,36,-141,70,25,wash(c,0,-171,60,-120,'#f2f0d7','#687282'),'#cdd2cb',1,-.14);
  line(c,'#e1c99a',2,-29,-134,28,-116,95,-144,34,-158,-29,-134);
  line(c,'#b6b1a1',4,32,-145,33,-185);
  oval(c,34,-184,6,6,'#d6cab0');
  for (const dx of [-51,6,54]) oval(c,dx,77,14,9,'#1a1e29','#858b93',2);
  c.restore();
}

function dawn(c,f) {
  const wide=f.k===1;
  rect(c,0,0,W,H,wash(c,0,0,1460,980,'#060b17','#0a1423','#02040c'));
  starfield(c,641,-f.v*(wide?56:90),f.v*20,460);
  if (wide) {
    const x=1390+f.v*53, y=1580-f.v*115, r=1140;
    oval(c,x,y,r,r*.99,wash(c,x-450,y-r,x+180,y-r+650,'#a3a0a0','#55596a','#252b3b'),'#e0ccae',3);
    c.save();
    c.beginPath();
    c.ellipse(x,y,r-2,r*.99-2,0,0,TAU);
    c.clip();
    const rnd=random(559);
    for (let i=0;i<300;++i) {
      const xx=x+(rnd()-.5)*r*2, yy=y-r+5+rnd()*630, rr=1+rnd()**3*43;
      oval(c,xx,yy,rr,rr*.28,'#33384a64','#d2bfb64c',1.15,-.11);
    }
    c.restore();
  }
  rect(c,0,0,W,H,glow(c,1471,401,695,wide ? '#8a91ab22' : '#d5c1aa54'));
  const x=wide ? 582-f.v*154 : 1288-f.v*492;
  const y=wide ? 396-f.v*83 : 545-f.v*47;
  const scale=wide ? .62-.24*f.v : 1.72-.64*f.v;
  spacecraft(c,x,y,scale,wide ? -.17-.18*f.v : -.58+.52*f.v);
  vignette(c,'#0307116b');
}

const craterMap=(() => {
  const rnd=random(7102);
  const features=[];
  for (let i=0;i<113;++i) {
    const x=(rnd()-.5)*3600, y=(rnd()-.5)*2570, r=9+rnd()**3.7*160;
    if (Math.hypot(x,y*1.18)>377+r) features.push([x,y,r,r*(.64+rnd()*.31),rnd()*3,41+rnd()*60]);
  }
  return features.sort((a,b)=>b[2]-a[2]);
})();

function rimPath(c,rx,ry,phase,begin=0,end=TAU) {
  const points=64;
  c.beginPath();
  for (let i=0;i<=points;++i) {
    const q=mix(begin,end,i/points);
    const radius=1+.026*sin(q*5+phase)+.018*cos(q*9-phase)+.013*sin(q*17+phase);
    const x=cos(q)*rx*radius;
    const y=sin(q)*ry*radius;
    if (i===0) c.moveTo(x,y);
    else c.lineTo(x,y);
  }
  if (end-begin>=TAU) c.closePath();
}

function crater(c,x,y,rx,ry,angle,tone) {
  c.save();
  c.translate(x,y);
  c.rotate(angle);
  if (rx>220) {
    rimPath(c,rx*1.16,ry*1.15,tone);
    c.fillStyle=glow(c,-rx*.22,-ry*.31,rx*1.44,'#8e858066','#4e515800');
    c.fill();
  }
  rimPath(c,rx,ry,tone);
  c.save();
  c.clip();
  rect(c,-rx*1.1,-ry*1.1,rx*2.2,ry*2.2,wash(c,-rx*.52,-ry*.83,rx*.42,ry*.79,`rgb(${tone+47},${tone+40},${tone+33})`,`rgb(${tone+11},${tone+13},${tone+23})`,`rgb(${tone-16},${tone-14},${tone-3})`));
  c.save();
  c.translate(-rx*.028,ry*.047);
  rimPath(c,rx*.86,ry*.82,tone+.54);
  c.fillStyle=wash(c,0,-ry*.71,-rx*.12,ry*.86,'#141923','#3f414b','#747174');
  c.fill();
  c.restore();
  oval(c,-rx*.11,ry*.17,rx*.59,ry*.53,glow(c,-rx*.16,ry*.16,rx*.72,'#52535b','#33394500'));
  const rnd=random(Math.floor(tone*882));
  for (let i=0;i<(rx>220 ? 95 : 12);++i) {
    const a=3.26+rnd()*2.1, depth=.84+rnd()*.18;
    const xx=cos(a)*rx*depth, yy=sin(a)*ry*depth;
    const size=rx*(.005+rnd()*.042);
    poly(c,i%3 ? '#e2c9a74d' : '#171e2b74',xx-size,yy,xx+size*.48,yy-size*.47,xx+size,yy+size*.58,xx,yy+size*.13);
  }
  c.restore();
  rimPath(c,rx*.96,ry*.96,tone,3.41,5.25);
  c.strokeStyle='#e6cda350';
  c.lineWidth=Math.max(.75,rx*.015);
  c.stroke();
  c.restore();
}

let surfaceGrain;
function terrainTexture(c) {
  if (surfaceGrain) return surfaceGrain;
  const tile=c.canvas.ownerDocument?.createElement('canvas') ?? new OffscreenCanvas(1152,704);
  tile.width=1152;
  tile.height=704;
  const painter=tile.getContext('2d');
  const image=painter.createImageData(tile.width,tile.height);
  const rnd=random(1682);
  const fields=[3,11,31,79].map(size=>({size, values:Float32Array.from({length:(size+2)**2},rnd)}));
  function sample(field,x,y) {
    const sx=x*field.size, sy=y*field.size, col=Math.floor(sx), row=Math.floor(sy);
    const stride=field.size+2, offset=row*stride+col;
    const dx=sx-col, dy=sy-row;
    const tx=dx*dx*(3-2*dx), ty=dy*dy*(3-2*dy);
    return mix(mix(field.values[offset],field.values[offset+1],tx),mix(field.values[offset+stride],field.values[offset+stride+1],tx),ty);
  }
  for (let y=0;y<tile.height;++y) {
    for (let x=0;x<tile.width;++x) {
      const xx=x/tile.width, yy=y/tile.height;
      const vary=(sample(fields[0],xx,yy)-.5)*49+(sample(fields[1],xx,yy)-.5)*34+(sample(fields[2],xx,yy)-.5)*24;
      const fleck=(sample(fields[3],xx,yy)-.5)*34+(rnd()-.5)*12;
      const value=vary+fleck;
      const p=4*(y*tile.width+x);
      image.data[p]=value>0 ? 222 : 15;
      image.data[p+1]=value>0 ? 205 : 24;
      image.data[p+2]=value>0 ? 179 : 40;
      image.data[p+3]=Math.min(65,Math.abs(value)*1.48);
    }
  }
  painter.putImageData(image,0,0);
  surfaceGrain=tile;
  return tile;
}

function surface(c,f) {
  const wide=f.k===1;
  rect(c,0,0,W,H,wash(c,0,0,1615,1050,'#76737b','#464950','#262b39'));
  c.save();
  camera(c,wide ? -64+f.v*93 : -446+f.v*535,wide ? 6-f.v*42 : -76+f.v*91,wide ? 1.1-.19*f.v : 2.31-.54*f.v);
  c.rotate(wide ? -.075+f.v*.023 : -.22+f.v*.066);
  for (const item of craterMap) crater(c,...item);
  crater(c,0,0,425,302,-.12,85);
  c.drawImage(terrainTexture(c),-1875,-1180,3750,2360);
  const grain=random(427);
  for (let i=0;i<1270;++i) {
    const x=(grain()-.5)*3180, y=(grain()-.5)*1770, r=.6+grain()**3*6.9;
    const lim=grain();
    oval(c,x,y,r,r*.45,lim>.5 ? '#c1b4a625' : '#151b294e',null,1,-.2);
  }
  const facets=random(9534);
  oval(c,-38,25,111,76,glow(c,-47,25,122,'#d3c4ae49'));
  for (let i=0;i<106;++i) {
    const q=facets()*TAU, r=facets()**1.4, w=2+facets()**2*8;
    const x=(i%4===0?68:-38)+r*cos(q)*(i%4===0?54:72);
    const y=(i%4===0?10:29)+r*sin(q)*31;
    poly(c,i%5===0 ? '#e8d5ac' : i%3===0 ? '#cbc1a9' : '#9b9692',x-w,y,x-w*.28,y-w*.58,x+w,y-w*.25,x+w*.45,y+w*.71);
  }
  c.restore();
  vignette(c,'#080d18d3',wide ? 971 : 1096,438);
  if (wide) {
    c.save();
    c.globalAlpha=ease((f.v-.20)*1.55);
    rect(c,0,706,W,374,wash(c,0,706,0,1080,'#080b1400','#080b1480','#080b14a0'));
    c.fillStyle='#f1e7d4';
    c.font='600 58px "Microsoft YaHei", sans-serif';
    c.textAlign='center';
    c.textBaseline='middle';
    c.shadowColor='#060b16';
    c.shadowBlur=16;
    c.fillText('你把天空里缺的那一笔，算了出来。',960,839);
    c.restore();
  }
}

const scenes=[predictionDrop,climb,clock,instrumentRoom,predictionChart,eyepiece,discovery,morning,telegraph,lastRoom,dawn,surface];

export function drawActThree(ctx,f) {
  const draw=scenes[f.id-26];
  if (!draw) return;
  ctx.save();
  try {
    if (f.id===30 && f.k===3 && f.v>=.78) {
      rect(ctx,0,0,W,H,'#000');
      return;
    }
    draw(ctx,f);
    const subtitleShade=ctx.createLinearGradient(0,915,0,H);
    subtitleShade.addColorStop(0,'#070a1100');
    subtitleShade.addColorStop(1,'#070a11a1');
    rect(ctx,0,915,W,H-915,subtitleShade);
  } finally {
    ctx.restore();
  }
}
