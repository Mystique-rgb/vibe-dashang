const TAU = 2 * Math.PI;
const ellipse = (x,y,rx,ry) => `M${x-rx},${y}a${rx},${ry} 0 1 0 ${2*rx},0a${rx},${ry} 0 1 0 ${-2*rx},0`;
const repeat = (count, fn) => Array.from({length:count}, (_, i) => fn(i));
const poly = (points, closed=false) => points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('')+(closed?'Z':'');
const polar = (r,a) => [r*Math.cos(a),r*Math.sin(a)];
const spiral = (x,y,r) => poly(repeat(32,i=>{
  const a=i*.22, s=r*(1-i/36);
  return [x+s*Math.cos(a),y+s*Math.sin(a)];
}));
const lozenge = (x,y,w,h) => `M${x},${y-h}l${w},${h} ${-w},${h} ${-w},${-h}Z`;
const band = (y,r) => repeat(10,i=>lozenge((i-4.5)*r/5,y,r*.085,4));

const zun = [
  [ellipse(0,-132,96,17),'M-96,-132Q-90,-84 -66,-59Q-66,-41 -86,-20Q-100,12 -82,58L-64,84Q-69,108 -90,119L-88,132Q0,151 88,132L90,119Q69,108 64,84L82,58Q100,12 86,-20Q66,-41 66,-59Q90,-84 96,-132',ellipse(0,125,89,13)],
  [ellipse(0,-133,84,10),'M-90,-115Q0,-95 90,-115M-78,-91Q0,-73 78,-91M-67,-60Q0,-44 67,-60M-80,-24Q0,-6 80,-24M-89,19Q0,40 89,19M-81,58Q0,78 81,58M-65,84Q0,100 65,84','M0,-112V112M-80,-10V52M80,-10V52'],
  [...band(-96,72),...band(108,72),...repeat(6,i=>spiral(-65+i*26,-8+i%2*12,10)),...repeat(5,i=>spiral(-57+i*28.5,45,10)), 'M-61,-42L-48,-54 -31,-48 -36,-35 -49,-31 -62,-36ZM61,-42L48,-54 31,-48 36,-35 49,-31 62,-36Z'],
];
const sword = [
  ['M0,-158Q-19,-128 -24,-88L-24,53Q-31,63 -40,67L-40,75 -12,74 -11,114Q-24,118 -21,132Q0,146 21,132Q24,118 11,114L12,74 40,75 40,67Q31,63 24,53L24,-88Q19,-128 0,-158Z','M0,-155L-4,-83 -4,55M0,-155L4,-83 4,55','M-32,65Q0,58 32,65M-32,71H32'],
  [...repeat(8,i=>lozenge(i%2?9:-9,-96+i*20,8,10)),...repeat(11,i=>`M-10,${78+i*3.1}Q0,${82+i*3.1} 10,${78+i*3.1}`),ellipse(0,126,20,8),ellipse(0,126,14,5),ellipse(0,126,7,3)],
  ['M-18,18h9m-8,7 7,-6m-7,13 7,-5m-6,12 6,-3M9,18h8m-7,7 6,-6m-6,13 6,-4m-6,11 6,-2'],
];
const flask = [
  ['M-64,-97Q-10,-115 29,-93L36,-86Q59,-107 76,-96Q89,-84 70,-61L70,-49Q117,-21 121,30Q124,87 51,113Q-24,138 -87,103Q-122,84 -120,31Q-118,-12 -86,-40L-87,-70Q-87,-88 -64,-97Z','M37,-86Q50,-59 70,-49M-86,-40Q-63,-57 -51,-84M-67,-89Q-19,-106 25,-89L33,-77Q-8,-71 -58,-74Z','M-100,98Q-20,120 64,104M-40,118l-3,11h77l4,-12'],
  ['M-71,29Q-60,9 -29,4L11,12Q31,-7 40,-26L61,-31 72,-20 63,-11 48,-9 43,16Q31,38 9,42L-27,39 -45,63 -69,72 -71,64 -52,52 -54,35Z','M-29,6Q-53,0 -66,-9Q-79,-17 -83,-7Q-85,2 -70,9L-57,17','M-20,39L-19,57 -43,82 -35,87 -4,66 8,43M27,38L45,47 62,39 70,43 47,59 20,48','M43,-27l4,-14 6,10m4,-3 8,-9 0,13','M62,-7l23,-7 -2,10q-10,10 -19,3Z'],
  [ellipse(56,-22,2.5,2.1),...repeat(14,i=>`M${-95+i*12},${82+9*Math.sin(i*.23)}l5,-4 4,4`),...repeat(9,i=>`M${-79+i*9},${-41+i%2*3}q7,-7 14,0`)],
];
const scroll = [
  ['M-139,-69H138Q145,-69 145,-59V67H-139Z','M-140,68Q-154,73 -153,59V-59Q-153,-75 -139,-69ZM145,-69Q155,-75 155,-60V58Q155,74 145,67Z','M-137,37Q-105,32 -69,39Q-28,49 13,15Q40,-8 67,0Q103,10 140,-6M-137,55Q-100,54 -77,57Q-21,64 20,38Q59,14 83,20Q112,26 141,11','M-91,35Q-66,-8 -21,-12Q12,-14 43,21M-88,39Q-48,4 -19,3Q13,3 43,21'],
  [...repeat(12,i=>{const x=-91+i*12,y=.0048*(x+21)**2-12;return `M${x},${y-4}v-10m0,10v9`;}),'M63,37q26,-9 56,0l-10,7H73ZM83,35V15h21q-2,9 -12,20','M-128,21l15,-4 17,5 -6,5h-20Z',...repeat(6,i=>{const x=52+i*14,y=-47+4*(i%3);return `M${x-10},${y}l10,-9 11,9Z M${x-7},${y}v13h15v-13m-10,12v-6h5v5`;})],
  [...repeat(8,i=>{const x=-127+i*13,y=-33+7*(i%3);return `M${x},${y}v24m0,-20q-12,-9 -12,0q1,6 12,4m0,-4q10,-12 12,-4q3,7 -12,8`; }),...repeat(9,i=>{const x=-83+i*14,y=.0048*(x+21)**2-23;return `${ellipse(x,y,1.5,2)}M${x},${y+3}v6m0,-2l3,4`;})],
];
const bird = 'M52,-45 Q49,-63 67,-78 Q84,-93 103,-91 L92,-82 Q102,-80 109,-81 L98,-75 Q91,-70 77,-70 Q67,-66 62,-60 L74,-58 88,-62 85,-56 79,-50 Q68,-43 52,-45Z';
const sun = [
  [ellipse(0,0,124,124),ellipse(0,0,117,117),poly(repeat(240,i=>{const a=i*TAU/240,p=(i%20)/20;return polar(p<.82?34+29*(p/.82)**1.3:63-29*(p-.82)/.18,a);}),true),ellipse(0,0,25,25)],
  repeat(4,i=>rotateBird(i*Math.PI/2)),
  [...repeat(12,i=>{const a=i*TAU/12;return poly([polar(128,a),polar(137,a)]);}),ellipse(0,0,108,108)],
];
function rotateBird(angle) {
  return bird.replace(/(-?\d+),(-?\d+)/g,(_,x,y)=>`${(+x*Math.cos(angle)-+y*Math.sin(angle)).toFixed(1)},${(+x*Math.sin(angle)+ +y*Math.cos(angle)).toFixed(1)}`);
}
const vessel = [
  [ellipse(0,-104,99,20),'M-96,-102Q-82,-79 -49,-70Q-27,-51 -30,-33Q-68,-20 -54,13Q-44,37 -28,41L-38,59Q0,71 38,59L28,41Q44,37 54,13Q68,-20 30,-33Q27,-51 49,-70Q82,-79 96,-102','M-142,68Q-133,112 -92,125Q0,150 92,125Q133,112 142,68M-93,125l-9,12q19,12 38,0m128,0q19,12 38,0l-9,-12',ellipse(0,70,143,20)],
  [ellipse(0,-105,74,11),ellipse(0,-93,83,14),ellipse(0,71,119,12),'M-131,94Q0,124 131,94M-122,110Q0,138 122,110M-42,-6Q0,3 42,-6M-48,14Q0,24 48,14M-39,35Q0,45 39,35',...repeat(13,i=>spiral(-87+i*14.5,-96+9*Math.sin(i/12*Math.PI),8))],
  [...repeat(14,i=>spiral(-122+i*18.5,97+13*Math.sin(i/13*Math.PI),8)),...repeat(15,i=>spiral(-90+i*13,-81+13*Math.sin(i/14*Math.PI),6)),...band(21,45)],
];
const ding = [
  ['M-130,-70Q-120,-21 -98,23Q-82,62 0,74Q82,62 98,23Q120,-21 130,-70',ellipse(0,-70,130,29),'M-98,-90L-99,-136Q-83,-150 -64,-137L-63,-96M-85,-89l-2,-38q7,-5 13,0l2,29M63,-96L64,-137Q83,-150 99,-136L98,-90M72,-97l2,-30q6,-5 13,0l-2,38','M-82,49Q-85,77 -97,113Q-93,127 -73,125Q-59,113 -53,65M82,49Q85,77 97,113Q93,127 73,125Q59,113 53,65M-16,73l1,61q14,13 29,1l2,-62'],
  [ellipse(0,-72,116,20),'M-121,-43Q-112,-2 -79,35Q-53,61 0,67Q53,61 79,35Q112,-2 121,-43','M-121,-46Q0,-1 121,-46M-112,-26Q0,18 112,-26M-102,-10Q0,32 102,-10','M-89,62L-87,100M89,62L87,100M-6,84v40M7,84v40',...repeat(5,i=>ellipse(0,24+i*6,67-i*7,13-i*1.4))],
  [...repeat(10,i=>spiral(-102+i*22.65,-30+18*Math.sin(i/9*Math.PI),7)),...repeat(7,i=>lozenge(-71+i*24,26+16*Math.sin(i/6*Math.PI),8,5)),'M-76,93q6,8 11,5M76,93q-6,8 -11,5'],
];

const drawings = [zun,sword,flask,scroll,sun,vessel,ding];
let prepared;
function prepare() {
  const ns = 'http://www.w3.org/2000/svg';
  prepared = drawings.map((drawing,index) => drawing.map((layer,kind) => {
    const paths = layer.map((d,i) => {
      const svg = document.createElementNS(ns,'path');
      svg.setAttribute('d',d);
      const length = svg.getTotalLength();
      return {svg,len:length,path:new Path2D(d),delay:i/Math.max(layer.length,1)*.20};
    });
    return { paths, kind, index };
  }));
}
const clamp = p => Math.max(0,Math.min(1,p));

export function drawArtifact(ctx,index,cx,cy,size,elapsed,{color='#f5c878',duration=1.35,hero=false,time=elapsed,ghost=false,boost=1}={}) {
  if(!prepared) prepare();
  const scale = size / 330;
  const phase = Math.max(0,elapsed/duration);
  const opacity = ctx.globalAlpha;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.scale(scale,scale);
  if(index===1) ctx.rotate(.62);
  else if(index===2) ctx.rotate(-.10);
  ctx.lineCap='round';
  ctx.lineJoin='round';
  const tips=[];
  for(const {paths,kind} of prepared[index]) {
    const begin=[0,.23,.48][kind];
    const span=[.50,.45,.32][kind];
    for(const data of paths) {
      if(data.len===0) continue;
      const first=kind===0&&data===paths[0];
      const p=ghost?1:clamp((phase-begin-data.delay)/span+(first?.025:0));
      if(p<=0) continue;
      ctx.setLineDash(p<1?[data.len*p,data.len+3]:[]);
      // The soft halo and white-hot core use the same moving stroke geometry.
      if(!ghost){
        ctx.lineWidth=(kind===0?8.5:5.2)*boost;
        ctx.globalAlpha=opacity*(kind===0?.13:.075)*boost;
        ctx.strokeStyle=color;
        ctx.stroke(data.path);
        ctx.lineWidth=(kind===0?3.6:2.35)*boost;
        ctx.globalAlpha=opacity*Math.min(1,(kind===0?.53:.39)*boost);
        ctx.stroke(data.path);
      }
      ctx.strokeStyle=ghost?color:(kind<2?'#fff9e9':'#fff1cf');
      ctx.globalAlpha=opacity*(ghost?(kind===0?.49:.18):kind===0?(.96+.04*Math.cos(time*3)):kind===1?Math.min(1,.82*boost):Math.min(1,.64*boost));
      ctx.lineWidth=ghost?.85:(kind===0?1.59:kind===1?1.13:.89)*boost;
      ctx.stroke(data.path);
      if(p<.99 && (kind===0||tips.length<8)) tips.push(data.svg.getPointAtLength(data.len*p));
    }
  }
  ctx.setLineDash([]);
  if(!ghost){
    for(const {x,y} of tips){
      const radius = hero?13.2:6.8;
      const shine=ctx.createRadialGradient(x,y,0,x,y,radius);
      shine.addColorStop(0,'#fffced');
      shine.addColorStop(.22,color);
      shine.addColorStop(1,'transparent');
      ctx.globalAlpha=opacity*.9;
      ctx.fillStyle=shine;
      ctx.fillRect(x-radius,y-radius,2*radius,2*radius);
    }
  }
  ctx.restore();
}
