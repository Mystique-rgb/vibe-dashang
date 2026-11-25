import { clamp, cream, ellipse, glow, ink, line, poly, rect, red, round, text, vertical } from './art.js';

const skin='#dfab83';
const skinShade='#c68d69';
const green='#5e7469';

function limb(c,points,color,thickness) {
  line(c,points,'#282c2e',thickness+3);
  line(c,points,color,thickness);
}

export function person(c,x,y,s,t,options={}) {
  const { kind='teacher', pose='stand', facing=1, seated=false, index=0 }=options;
  const young=kind==='young';
  const teacher=kind==='teacher';
  const student=kind==='student';
  const body=teacher?green:young?'#916450':student?red:kind==='doctor'?'#dddacf':kind==='family'?'#82664f':'#54717a';
  const hair=teacher?'#474748':young||student?'#363035':'#443b37';
  const walk=pose==='walk'?Math.sin(t*8+index)*15:0;
  const bob=Math.sin(t*(pose==='walk'?16:2.1)+index)*(pose==='walk'?3:1.4);
  c.save(); c.translate(x,y); c.scale(s*facing,s);
  ellipse(c,0,0,48,9,'#21272845');
  c.translate(0,bob);
  if(seated){
    limb(c,[[-17,-61],[17,-43],[17,-3]],'#42474a',16);
    limb(c,[[10,-63],[37,-46],[38,-1]],'#53565a',17);
  } else {
    limb(c,[[-17,-90],[-16+walk*.47,-43],[-21+walk,-3]],'#454a4d',19);
    limb(c,[[15,-90],[19-walk*.45,-43],[20-walk,-3]],'#565b5b',20);
  }
  round(c,-35+walk,-7,29,9,4,'#313331');
  round(c,9-walk,-7,26,9,4,'#3a3835');
  c.translate(0,seated?21:0);
  round(c,-17,-157,30,37,9,skinShade);
  poly(c,[[-27,-143],[30,-143],[39,-122],[33,-72],[-30,-72],[-39,-120]],'#323635');
  poly(c,[[-27,-139],[27,-139],[35,-122],[29,-76],[-27,-76],[-35,-120]],body);
  poly(c,[[-29,-129],[-7,-142],[7,-125],[15,-142],[28,-135],[22,-113],[5,-119],[-12,-113]],teacher?'#a2a697':student?'#e8c7a9':'#d5b28b');
  line(c,[[4,-118],[4,-79]],teacher?'#384f50':'#5b4a43',2);
  if(teacher){
    line(c,[[-24,-106],[-10,-104]],'#a2a897',2);
    line(c,[[13,-105],[27,-106]],'#a2a897',2);
  }
  const hands={
    stand:[[40,-97],[42,-76]],
    walk:[[41+walk*.5,-97],[42+walk,-74]],
    switch:[[49,-118],[68+5*Math.sin(t*2),-139]],
    write:[[48,-94],[70+Math.sin(t*8)*3,-88]],
    offer:[[50,-102],[71,-101]],
    speaker:[[46,-119],[47,-158]],
    chalk:[[47,-121],[66+t*7,-154+Math.sin(t*4)*3]],
    read:[[45,-105],[48,-119]],
    carry:[[48,-107],[55,-94]],
  };
  const [elbow,hand]=hands[pose]??hands.stand;
  limb(c,[[-30,-126],[-41-walk*.45,-102],[-34-walk,-83]],body,14);
  ellipse(c,-34-walk,-81,7,9,skin);
  limb(c,[[30,-128],elbow,hand],body,15);
  ellipse(c,...hand,8,7,skin);
  if(teacher&&['write','switch','offer','chalk'].includes(pose)){
    round(c,hand[0]-4,hand[1]-6,6,12,2,'#e6dcca');
  }
  if(pose==='speaker'){
    round(c,hand[0]-11,hand[1]-8,25,16,5,'#42605c');
    poly(c,[[hand[0]+8,hand[1]-8],[hand[0]+34,hand[1]-18],[hand[0]+34,hand[1]+18],[hand[0]+8,hand[1]+7]],'#c2c4a8');
    ellipse(c,hand[0]+34,hand[1],5,17,'#66726e');
  }
  if(pose==='read') book(c,hand[0]-26,hand[1]-23,53,32,-.2);
  if(pose==='carry') round(c,hand[0]-12,hand[1]+4,47,48,5,'#7c5846');
  if(pose==='chalk') line(c,[hand,[hand[0]+10,hand[1]-4]],'#f1e5ca',4);
  if(student||young)ellipse(c,-24,-160,12,26,hair,-.31);
  ellipse(c,-3,-178,40,43,hair,-.08);
  ellipse(c,0,-175,31,34,skin,-.09);
  ellipse(c,-29,-174,7,10,skinShade);
  poly(c,[[-35,-169],[-39,-186],[-31,-207],[-12,-218],[14,-215],[34,-202],[39,-185],[27,-187],[14,-184],[11,-197],[6,-184],[-11,-188],[-20,-178],[-25,-160]],hair);
  if(teacher){
    line(c,[[-29,-197],[-19,-204],[-4,-209]],'#8f8c83',2.4);
    line(c,[[-23,-193],[-13,-198],[-2,-202]],'#a4a095',1.6);
  }
  const blink=Math.sin(t*2.27+index*1.3)>.986;
  const eyes=[-9,16];
  if(teacher){
    for(const eye of eyes){
      c.strokeStyle=ink; c.lineWidth=2.3;
      c.beginPath(); c.roundRect(eye-10,-180,20,13,4); c.stroke();
    }
    line(c,[[1,-176],[6,-176]],ink,2);
  }
  for(const eye of eyes)ellipse(c,eye+2,-174,2.1,blink?.55:2.7,ink);
  line(c,[[5,-173],[8,-165],[5,-164]],skinShade,1.5);
  line(c,[[0,-156],[8,-154],[14,-157]],'#9a5b58',1.7);
  c.restore();
}

export function book(c,x,y,w,h,angle=0,closed=false) {
  c.save(); c.translate(x,y); c.rotate(angle);
  round(c,-2,2,w+4,h+3,3,closed?'#776047':'#86684e');
  round(c,0,0,w,h,2,closed?'#983f39':'#ddd0aa');
  if(closed){
    rect(c,w*.13,0,3,h,'#c9816a');
    line(c,[[w*.31,h*.32],[w*.79,h*.32]],'#e7c58b',2);
  } else {
    for(let i=0;i<3;i++){
      const cy=h*(.26+i*.19);
      line(c,[[w*.1,cy],[w*.41,cy+2]],'#a69476',1);
      line(c,[[w*.58,cy+2],[w*.9,cy]],'#a69476',1);
    }
    line(c,[[w*.5,2],[w*.5,h-1]],'#ad9875',1.2);
  }
  c.restore();
}

export function desk(c,x,y,s,t,occupied=false,index=0) {
  c.save(); c.translate(x,y); c.scale(s,s);
  if(occupied)person(c,0,39,.69,t,{kind:'student',pose:'read',seated:true,index});
  else {
    rect(c,-19,-35,80,43,'#6c5242');
    rect(c,-14,8,9,65,'#594b3b'); rect(c,49,8,9,65,'#594b3b');
  }
  rect(c,-81,32,151,39,'#684d3c');
  rect(c,-75,65,11,57,'#533e35'); rect(c,50,65,11,57,'#533e35');
  poly(c,[[-102,33],[-77,1],[56,1],[91,33]],'#a67b53');
  line(c,[[-101,34],[91,34]],'#c69a68',3);
  if(occupied)book(c,-25,6,63,23,-.06);
  c.restore();
}

export function writing(c,t,{exam=false}={}) {
  vertical(c,0,0,960,540,exam?'#a08c6c':'#4d4740',exam?'#7d6048':'#59473a');
  glow(c,525,222,440,exam?'#eac28a':'#f2bf79',.55);
  c.save(); c.translate(464,232); c.rotate(-.127);
  round(c,-228,-160,441,325,9,'#4b392c50');
  round(c,-231,-170,445,326,8,exam?'#ede0bb':'#cabb99');
  for(let i=0;i<11;i++)line(c,[[-187,-112+i*23],[168,-112+i*23]],'#8c88716b',1);
  c.restore();
  const motion=Math.sin(t*8)*12+Math.sin(t*3)*8;
  c.save(); c.translate(motion,Math.sin(t*6)*2);
  poly(c,[[960,371],[960,560],[667,560],[537,386],[615,308]],exam?red:'#69776a');
  round(c,580,319,76,98,18,exam?'#dfd2ae':'#46594f');
  ellipse(c,547,342,119,64,skin,.24);
  ellipse(c,537,317,79,46,skinShade,-.2);
  [0,1,2,3].forEach(i=>{
    ellipse(c,487+i*19,323+i*8,38,13,skin,.24);
    if(!exam)round(c,483+i*19,314+i*8,14,20,3,cream);
  });
  line(c,[[438,377],[518,280]],'#393b3d',10);
  line(c,[[438,377],[433,384]],'#202629',3);
  c.restore();
}
