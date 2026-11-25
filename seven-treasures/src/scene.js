import { items, starts, nameHits, storyHits, introHits, heroWords, title, titleHit, titlePulses, beatMotion, heroLeadHits, heroLeadLines, heroTease, build, buildHits, out, outroHit, DROP, LENGTH, drawLengths, cuts } from './timeline.js';
import { drawArtifact } from './lib/artifacts.js';

const TAU = Math.PI*2;
const clamp = x => Math.max(0,Math.min(1,x));
const ease = x => 1-(1-clamp(x))**3;
const tint = (hex,alpha) => hex+Math.round(clamp(alpha)*255).toString(16).padStart(2,'0');
const alpha = (c,value,fn) => {c.save();c.globalAlpha*=clamp(value);fn();c.restore();};
const mono = '"Bahnschrift", Consolas, monospace';
const sans = '"Microsoft YaHei UI", "Microsoft YaHei", sans-serif';
const serif = '"SimSun", "Songti SC", serif';
const numbers = ['01','02','03','04','05','06','07'];

function text(c,value,x,y,size,color,{family=sans,weight=500,align='left'}={}) {
  c.fillStyle=color;
  c.textAlign=align;
  c.textBaseline='alphabetic';
  c.font=`${weight} ${size}px ${family}`;
  c.fillText(value,x,y);
}
function rule(c,x,y,x1,y1,color,width=1) {
  c.strokeStyle=color;
  c.lineWidth=width;
  c.beginPath();
  c.moveTo(x,y);
  c.lineTo(x1,y1);
  c.stroke();
}
function arc(c,x,y,r,a,b,color,width=1) {
  c.strokeStyle=color;
  c.lineWidth=width;
  c.beginPath();
  c.arc(x,y,r,a,b);
  c.stroke();
}
function glow(c,x,y,r,color,level) {
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,tint(color,level));
  g.addColorStop(.38,tint(color,level*.45));
  g.addColorStop(1,tint(color,0));
  c.fillStyle=g;
  c.fillRect(x-r,y-r,r*2,r*2);
}
function seeded(i) {return (Math.sin(i*78.233+93.17)*43758.5453)%1+1;}
const motes = Array.from({length:147},(_,i)=>{
  const a=seeded(i*9)%1,b=seeded(i*9+1)%1,d=seeded(i*9+2)%1;
  return {x:160+a*1590,y:100+b*870,z:d,phase:(seeded(i*9+3)%1)*6.28};
});
function background(c,t,color,cx=1290,level=.14) {
  c.fillStyle='#030508';
  c.fillRect(0,0,1920,1080);
  glow(c,cx,504,740,color,level);
  glow(c,420,905,660,color,.045);
  for(const m of motes) {
    const strength=(.1+m.z*.3)*(.75+.25*Math.sin(t*2.4+m.phase));
    c.fillStyle=tint(color,strength);
    c.fillRect(m.x,m.y+15*Math.sin(t*.49+m.phase),.7+1.5*m.z,.7+1.5*m.z);
  }
  const grid='#a8bac013';
  for(let i=0;i<8;i++) rule(c,145+i*232,99,145+i*232,974,grid);
  for(let i=0;i<5;i++) rule(c,100,105+i*218,1817,105+i*218,grid);
}
function frame(c,t,color,index) {
  rule(c,105,107,1815,107,tint(color,.24));
  rule(c,105,970,1815,970,tint(color,.24));
  const font={family:mono,weight:600};
  text(c,'ZHONGGUO    /    MUSEUM ARCHIVE',106,87,21,'#b4c1c4',font);
  text(c,'中华珍藏  ·  七件国宝',1814,86,23,'#c6cac3',{align:'right'});
  text(c,'COLLECTION    /    2026',106,1009,20,'#a5adaa',font);
  for(let i=0;i<7;i++) {
    const x=1437+i*57;
    const on=i===index;
    rule(c,x,988,x+36,988,on?color:tint(color,i<index?.48:.19),on?3:1);
    text(c,numbers[i],x,1014,15,on?'#fff5dc':'#a5adaa',{family:mono});
  }
}
function instrument(c,x,y,r,t,color,strong=false) {
  arc(c,x,y,r,0,TAU,tint(color,.14));
  arc(c,x,y,r-24,0,TAU,tint(color,.12));
  arc(c,x,y,r+14,t*.66,t*.66+.37,tint(color,.45),2);
  arc(c,x,y,r+14,t*.66+2.8,t*.66+3.35,tint(color,.25));
  arc(c,x,y,r-11,-t*.4,-t*.4+.43,tint(color,.32),2);
  for(let i=0;i<72;i++) {
    const a=i*TAU/72, k=i%6===0?15:5;
    const a2 = Math.cos(a), b2 = Math.sin(a);
    rule(c,x+a2*(r+2),y+b2*(r+2),x+a2*(r+k),y+b2*(r+k),tint(color,i%6===0?.42:.14));
  }
  if(strong) arc(c,x,y,r+36,-t*.77,-t*.77+1.12,tint(color,.57),3);
}
function shock(c,x,y,elapsed,color,power=1) {
  if(elapsed<0||elapsed>.65) return;
  const p=elapsed/.65;
  const radius=96+515*ease(p);
  arc(c,x,y,radius,0,TAU,tint(color,power*(1-p)**3*.63),2+power*2);
  arc(c,x,y,radius*.72,-1.5,.9,tint(color,power*(1-p)**2*.44),3);
  c.save();
  c.globalCompositeOperation='lighter';
  glow(c,x,y,340,color,(1-p)**5*.37*power);
  for(let i=0;i<28;i++) {
    const a=TAU*i/28+(seeded(i+51)%1)*.22;
    const r=106+p*(200+(seeded(i+10)%1)*470);
    const l=(18+(seeded(i+91)%1)*61)*(1-p);
    rule(c,x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+l),y+Math.sin(a)*(r+l),tint(color,.48*(1-p)**1.9*power),1.4);
  }
  c.restore();
}
const gold='#efba68';
function intro(c,t) {
  background(c,t,gold,975,.16);
  const step=Math.max(0,introHits.findLastIndex(s=>t+1e-8>=s));
  const dt=Math.max(0,t-introHits[step]);
  const phase=clamp(dt/.227);
  const slam=Math.exp(-dt*13);
  const color=items[step].color;
  const x=1060,y=526;
  instrument(c,x,y,303,t*2.5,gold,true);
  instrument(c,x,y,347,-t*1.7,gold);
  drawArtifact(c,step,x,y,470+70*slam,.17+phase*.35,{duration:.53,color,time:t,boost:1.2+.38*slam});
  shock(c,x,y,dt,color,1.5);
  streaks(c,x,y,dt,color,1.26);
  streaks(c,415,468,dt,color,.78);
  arc(c,x,y,280+145*ease(phase),-.4,4.4,tint(color,.68*(1-phase)),3);
  const scanY=280+phase*480;
  rule(c,641,scanY,1285,scanY,tint(color,.70*(1-phase)),2);
  if(t<1.47) {
    text(c,'文 物 扫 描',136,305,31,'#e9d1a9',{weight:700});
    c.save();
    c.translate(132,537+24*slam);
    c.scale(1+.075*slam,1+.12*slam);
    text(c,numbers[step],-8,5,224,'#fff5dd',{family:mono,weight:700});
    c.restore();
    text(c,'/ 07',440,550,62,color,{family:mono,weight:700});
    rule(c,134,585,134+395*ease(phase),585,tint(color,.8),3);
    text(c,'谁会在最后亮相？',105,899,37,'#eee0c9',{weight:600});
  } else {
    text(c,'七件国宝',106,293,97,'#fff0db',{family:serif,weight:700});
    text(c,'谁会在最后亮相？',105,899,37,'#eee0c9',{weight:600});
  }
  frame(c,t,color,step);
}
function goldTitle(c,value,x,y,size,color,local,align='left') {
  if(local<0 || !value) return;
  const slam=Math.exp(-Math.max(0,local)*12);
  const reveal=ease((local+.035)/.23);
  c.save();
  c.translate(x+Math.sin(local*57)*11*slam,y+(1-reveal)*32);
  c.scale(1+.065*slam,1+.17*slam);
  c.font=`700 ${size}px "STKaiti", KaiTi, ${serif}`;
  c.textAlign=align;
  c.textBaseline='alphabetic';
  const width=c.measureText(value).width;
  const edge=align==='center'?-width*.5:0;
  c.beginPath();
  c.rect(edge-32,-size*1.4,(width+67)*reveal,size*1.8);
  c.clip();
  const foil=c.createLinearGradient(0,-size,0,18);
  foil.addColorStop(0,'#fff8e7'); foil.addColorStop(.4,'#fff5d6');
  foil.addColorStop(.64,'#ffd696'); foil.addColorStop(1,color);
  c.lineWidth=1.3;
  c.strokeStyle='#fff0bc';
  c.shadowColor=color;
  c.shadowBlur=10+27*slam;
  c.fillStyle=foil;
  c.strokeText(value,0,0);
  c.fillText(value,0,0);
  c.restore();
}
function streaks(c,x,y,local,color,power=1) {
  if(local<0 || local>.6) return;
  const p=local/.6;
  c.save();
  c.globalCompositeOperation='lighter';
  for(let i=0;i<16;i++) {
    const a=i/16*TAU+.25;
    const r=66+380*ease(p)+(seeded(i+400)%1)*78;
    const len=(36+(seeded(i+630)%1)*120)*(1-p);
    rule(c,x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+len),y+Math.sin(a)*(r+len),tint(color,.64*power*(1-p)**2),i%4===0?3:1.5);
  }
  const stripe=c.createLinearGradient(x-260,y,x+330,y);
  stripe.addColorStop(0,tint(color,0));stripe.addColorStop(.5,tint(color,.63*power*(1-p)**3));stripe.addColorStop(1,tint(color,0));
  c.fillStyle=stripe;
  c.fillRect(x-260,y+ease(p)*82,590,2+4*(1-p));
  c.restore();
}
function storyLine(c,value,x,y,size,color,local,width=560) {
  if(local<0) return;
  const p=ease((local+.026)/.24);
  const glint=Math.max(0,1-local/.24);
  c.save();
  c.beginPath();
  c.rect(x-14,y-size-12,width*p+18,size+29);
  c.clip();
  c.globalAlpha=.35+.65*p;
  text(c,value,x+16*(1-p),y,size,color,{weight:650});
  if(glint>0) rule(c,x,y+10,x+(width-25)*p,y+10,tint(color,.58*glint),2);
  c.restore();
}
function cover(c,t,ending=false) {
  const local=t-(ending?out:title);
  const impact=t-(ending?outroHit:titleHit);
  const active=impact>=0;
  const burst=active?Math.exp(-impact*9):0;
  background(c,t,gold,960,.17+burst*.095);
  instrument(c,960,526,345+burst*38,local*.9,gold,true);
  instrument(c,960,526,385+burst*54,-local*.52,gold,true);
  for(let i=0;i<4;i++){
    const a=local*(.88-i*.13)+i*Math.PI/2;
    arc(c,960,526,318+i*34,a,a+.48+burst*.61,tint(gold,.53+burst*.34),i===1?3:2);
  }
  shock(c,960,526,local,gold,.93);
  shock(c,960,526,impact,gold,ending?1.36:2.12);
  if(!ending) for(const pulse of titlePulses) {
    const dt=t-pulse;
    if(dt<0 || dt>.57) continue;
    const phase=dt/.57;
    arc(c,960,526,167+558*ease(phase),0,TAU,tint(gold,.80*(1-phase)**2),2+4*(1-phase));
    streaks(c,960,526,dt,gold,.9);
  }
  streaks(c,960,526,impact,gold,1.25);
  const header=ending?'七件国宝 · 展陈结束':'中 华 珍 藏';
  text(c,header,960,398,37,'#ffe5ab',{align:'center',weight:700});
  if(ending) {
    if(active) goldTitle(c,'哪一件让你印象最深？',960,602,99,gold,impact,'center');
    else text(c,'哪一件让你印象最深？',960,602,99,'#fff4dd',{align:'center',family:serif,weight:700});
  } else {
    const slam = Math.exp(-Math.max(impact, 0) * 15);
    c.save();
    c.translate(960, 606 - 82 * slam);
    c.scale(1 + .09 * slam, 1 + .16 * slam);
    text(c, '七大国宝', 0, 0, 160, '#fff1d5', {family:serif, align:'center', weight:700});
    c.restore();
    streaks(c, 960, 566, impact, gold, 1.4);
    storyLine(c,'从青铜铭文，到汴河市井',755,729,32,'#e8cd9d',impact-.21);
    const p=clamp(local/(starts[0]-title));
    rule(c,796,764,1124,764,tint(gold,.22),2);
    rule(c,796,764,796+328*p,764,gold,2);
  }
  frame(c,t,gold,ending?6:-1);
}
function exhibitBackdrop(c,t,color,cx=1495,level=.15) {
  c.fillStyle='#050608';
  c.fillRect(0,0,1920,1080);
  glow(c,cx,528,760,color,level);
  glow(c,457,520,820,'#65736f',.13);
  const vignette=c.createRadialGradient(1010,517,300,1010,517,1120);
  vignette.addColorStop(0,'#00000000');
  vignette.addColorStop(1,'#000000c8');
  c.fillStyle=vignette;
  c.fillRect(0,0,1920,1080);
}
function exhibitRing(c,x,y,t,color,lit,punch=0) {
  const r=385+19*punch;
  glow(c,x,y,r+102,color,lit?.23:.10);
  const n=94;
  const phase=t*.105;
  c.save();
  for(let j=0;j<n;j++) {
    const a=TAU*j/n+phase;
    const v=seeded(j+524)%1;
    const length=(j%4===0?44:10)+v*53+36*punch;
    const dx=Math.cos(a),dy=Math.sin(a);
    rule(c,x+dx*(r-8),y+dy*(r-8),x+dx*(r+length),y+dy*(r+length),tint(color,(lit?.18:.056)*(v+.27)),j%4===0?1.5:1);
  }
  for(let tier=0;tier<2;tier++) {
    const count=tier?25:35;
    const rr=r-(tier?91:61);
    c.fillStyle=tint(color,lit?.27:.115);
    c.beginPath();
    for(let j=0;j<count;j++) {
      const a=TAU*j/count+(tier?-phase:phase);
      const dx=x+Math.cos(a)*rr,dy=y+Math.sin(a)*rr;
      const size=tier?4.45:6.15;
      c.moveTo(dx+size,dy);
      c.arc(dx,dy,size,0,TAU);
    }
    c.fill();
  }
  c.shadowColor=color;
  c.shadowBlur=lit?29:10;
  arc(c,x,y,r,0,TAU,tint(color,lit?.76:.29),lit?3:1.4);
  c.shadowBlur=0;
  arc(c,x,y,r-10,0,TAU,tint(color,lit?.43:.16),1.25);
  arc(c,x,y,r+9,phase,phase+1.65,tint(color,lit?.65:.20),1.3);
  c.restore();
}
function exhibitQuote(c,eyebrow,rows,elapsed,color) {
  const p=ease(elapsed/.26);
  text(c,eyebrow,115,427,29,tint(color,.62*p),{weight:600});
  rows.forEach((row,i)=>{
    const fade=ease((elapsed-i*.15)/.29);
    const x=113+(1-fade)*15;
    const displayed=i===0?'“'+row:row+'”';
    c.save();
    c.font=`700 56px ${serif}`;
    const size=Math.min(56,Math.floor(795*56/Math.max(1,c.measureText(displayed).width)));
    c.restore();
    alpha(c,fade,()=>text(c,displayed,x,506+i*74,size,'#f3eee3',{family:serif,weight:700}));
  });
}
function nameSweep(c,x,y,w,h,elapsed,color) {
  if(elapsed<0 || elapsed>.36) return;
  const p=elapsed/.36;
  const cx=x-46+ease(p)*(w+92);
  c.save();
  c.beginPath();
  c.rect(x-26,y-10,w+52,h+20);
  c.clip();
  c.globalCompositeOperation='lighter';
  const g=c.createLinearGradient(cx-96,0,cx+96,0);
  g.addColorStop(0,tint(color,0));
  g.addColorStop(.5,tint(color,.46*(1-p)**1.3));
  g.addColorStop(1,tint(color,0));
  c.fillStyle=g;
  c.fillRect(cx-96,y-10,192,h+20);
  c.restore();
  rule(c,cx,y-8,cx,y+h+8,tint(color,.5*(1-p)**2),2);
}
function exhibitName(c,item,index,elapsed,hero) {
  const x=112;
  const y=hero?616:542;
  const size=hero?232:Math.min(125, Math.floor(800/item.name.length));
  const meta=hero?{roman:696,rule:730,era:766,badge:804,line:470}:{roman:620,rule:658,era:704,badge:750,line:384};
  const p=ease((elapsed+.035)/.23);
  const hit=Math.max(0,1-elapsed/.115);
  c.save();
  c.font=`900 ${size}px ${sans}`;
  const nameWidth=c.measureText(item.name).width;
  c.restore();
  const sealX=x+nameWidth+27;
  text(c,hero?'青铜铭文里的西周':`中华珍藏   ·   第 ${['柒','陆','伍','肆','叁','贰'][index]} 件`,x,hero?398:411,30,tint(item.color,.82),{weight:700});
  const adv=nameWidth/Math.max(1,item.name.length);
  const mid=y-size*.34;
  if(!hero) {
    c.save();
    c.translate((1-p)*-21,0);
    const font={family:sans,weight:900};
    if(hit>0) {
      text(c,item.name,x-14*hit,y+3,size,tint('#ef6376',hit*.68),font);
      text(c,item.name,x+14*hit,y-2,size,tint('#67e6df',hit*.65),font);
    }
    c.shadowColor=item.color;
    c.shadowBlur=17+26*hit;
    text(c,item.name,x,y,size,'#fff1d9',font);
    c.restore();
  } else {
    c.save();
    for(let i=0;i<item.name.length;i++) {
      const dt=elapsed-i*.075;
      if(dt<0) continue;
      const slam=Math.exp(-dt*15);
      c.save();
      c.translate(x+adv*(i+.5),mid);
      c.scale(1+.055*slam,1+.13*slam);
      c.globalAlpha*=Math.min(1,dt/.055);
      if(hit>0) {
        text(c,item.name[i],-14*hit,size*.34+3,size,tint('#ef6376',hit*.68),{family:sans,weight:900,align:'center'});
        text(c,item.name[i],14*hit,size*.34-2,size,tint('#67e6df',hit*.65),{family:sans,weight:900,align:'center'});
      }
      c.shadowColor=item.color;
      c.shadowBlur=17+30*slam;
      text(c,item.name[i],0,size*.34,size,'#f9d996',{family:sans,weight:900,align:'center'});
      c.restore();
    }
    c.restore();
    nameSweep(c,x,mid-size*.5,nameWidth,size,elapsed,item.color);
    rule(c,x,y+46,x+(nameWidth+8)*ease(elapsed/.30),y+46,tint(item.color,.5),2);
  }
  if(!hero || elapsed>=.15) {
    c.save();
    c.translate(sealX+25,y-34);
    if(hero) {
      const sp=Math.exp(-Math.max(0,elapsed-.15)*14);
      c.globalAlpha*=clamp((elapsed-.15)/.05);
      c.rotate(-.13-hit*.12);
      c.scale(1+.34*sp,1+.34*sp);
    } else c.rotate(-.13-hit*.12);
    c.fillStyle='#b42623'; c.fillRect(-23,-29,46,58);
    c.strokeStyle='#ffab84'; c.lineWidth=1.3; c.strokeRect(-20,-26,40,52);
    text(c,'珍',0,-3,20,'#fff1df',{family:serif,weight:700,align:'center'});
    text(c,'藏',0,20,20,'#fff1df',{family:serif,weight:700,align:'center'});
    c.restore();
  }
  alpha(c,ease((elapsed-.12)/.30),()=>{
    c.save();
    c.font='italic 600 28px Georgia, "Times New Roman", serif';
    c.fillStyle=tint(item.color,.74);
    let letterX=x+3;
    for(const letter of item.roman) {
      c.fillText(letter,letterX,meta.roman);
      letterX+=c.measureText(letter).width+6;
    }
    c.restore();
    rule(c,x+2,meta.rule,x+meta.line,meta.rule,tint(item.color,.23),1.2);
    text(c,`${item.era}  ·  ${item.kind}`,x+3,meta.era,hero?29:27,'#dbcfbc',{weight:650});
    text(c,item.badge,x+3,meta.badge,hero?27:25,'#bfb6a2',{weight:550});
  });
}
function chapter(c,t,i) {
  const item=items[i];
  const color=item.color;
  const elapsed=Math.max(0,t-starts[i]);
  const reveal=t-nameHits[i];
  const lit=reveal>=-1e-8;
  const hero=i===6;
  const impact=lit?Math.exp(-Math.max(0,reveal)*12):0;
  const x=1490,y=540;
  exhibitBackdrop(c,t,color,x,lit?(hero?.24:.15):.09);
  exhibitRing(c,x,y,t,color,lit,impact);
  if(lit) {
    shock(c,x,y,Math.max(0,reveal),color,hero?2.7:1.42);
    streaks(c,x,y,Math.max(0,reveal),color,hero?1.66:1.06);
    exhibitName(c,item,i,Math.max(0,reveal),hero);
  } else {
    exhibitQuote(c,`${item.era}  ·  ${item.kind}`,item.lines,elapsed,color);
  }
  const size=Math.min(item.size,hero?835:829)*(lit?1.035+.031*impact:.968);
  const trace=hero?drawLengths[i]:elapsed;
  alpha(c,lit?1:.51+.27*ease(elapsed/1.2),()=>drawArtifact(c,i,x,y,size,trace,{color,duration:drawLengths[i],hero,time:t,boost:lit?(hero?1.62:1.22):.79}));
  if(hero) for(const {time,label,x:tx,y:ty,angle,size:fontSize} of heroWords) {
    const dt=t-time;
    if(dt<0) continue;
    const slam=Math.exp(-dt*18);
    c.save();
    c.translate(tx,ty-47*slam);
    c.rotate(angle);
    c.scale(1+.14*slam,1+.14*slam);
    c.font=`700 ${fontSize}px "Microsoft YaHei", sans-serif`;
    c.textAlign='center';
    c.lineJoin='round';
    c.lineWidth=7;
    c.strokeStyle='#180d0a';
    c.strokeText(label,0,0);
    c.fillStyle='#ffe7a6';
    c.fillText(label,0,0);
    c.restore();
    streaks(c,tx,ty,dt,gold,.75);
  }
}
function buildup(c,t) {
  const item=items[6];
  const color=item.color;
  const x=1490,y=540;
  const local=t-build;
  const progress=clamp(local/(DROP-build));
  exhibitBackdrop(c,t,color,x,.067+progress*.05);
  const traceProgress=ease(progress*.87);
  alpha(c,.14+progress*.36,()=>drawArtifact(c,6,x,y,782,traceProgress*2.4,{color,duration:2.4,time:t,hero:true,boost:.87}));
  if(t<heroTease[0]) {
    const k=Math.max(0,heroLeadHits.findLastIndex(mark=>mark<=t+1e-8));
    exhibitQuote(c,`${item.era}   ·   青铜礼器`,heroLeadLines[k],t-heroLeadHits[k],color);
    return;
  }
  const count=heroTease.filter(mark=>mark<=t+1e-8).length;
  const headline='一鼎铭刻西周'.slice(0,count);
  c.save();
  c.font=`900 103px ${sans}`;
  c.textBaseline='alphabetic';
  c.shadowColor=color;
  c.shadowBlur=14;
  c.strokeStyle='#ffd68e';
  c.lineWidth=2.5;
  c.strokeText(headline,112,538);
  c.restore();
  rule(c,112,614,112+Math.min(count,6)*99,614,tint(color,.40),2);
}
function cutFlash(c,t) {
  const prev=cuts.findLast(s=>s<=t);
  const local=t-prev;
  if(!(local>=0&&local<.117)) return;
  const major=nameHits.includes(prev)||prev===titleHit||prev===outroHit;
  const power=prev===DROP?1.65:major?1.18:starts.includes(prev)?.82:.42;
  c.save();
  c.globalCompositeOperation='lighter';
  const strength=(1-local/.117)**2*power;
  const g=c.createLinearGradient(0,0,1920,0);
  g.addColorStop(0,tint('#ffdfb5',0));
  g.addColorStop(.5,tint('#ffdfb5',strength*.2));
  g.addColorStop(1,tint('#ffdfb5',0));
  c.fillStyle=g;
  c.fillRect(0,0,1920,1080);
  for(let i=0;i<(major?9:5);i++) {
    const y=142+(seeded(i*4+4)%1)*795;
    c.fillStyle=tint('#e8bd8d',strength*.14);
    const offset=(1-local/.117)*(i%2===0?1:-1)*135;
    c.fillRect(100+offset,y,1720,2+i%2*4);
  }
  c.restore();
}

export default function ({root,width,height}) {
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  Object.assign(canvas.style,{width:'100%',height:'100%',display:'block'});
  root.appendChild(canvas);
  const ctx=canvas.getContext('2d',{alpha:false});
  return {
    prepareFrame(time) {
      const t=Math.max(0,Math.min(LENGTH,time));
      ctx.setTransform(width/1920,0,0,height/1080,0,0);
      if(t+1e-8>=out) cover(ctx,t,true);
      else if(t+1e-8>=DROP) chapter(ctx,t,6);
      else if(t+1e-8>=build) buildup(ctx,t);
      else if(t+1e-8>=starts[0]) chapter(ctx,t,starts.findLastIndex(s=>t+1e-8>=s));
      else if(t+1e-8>=title) cover(ctx,t);
      else intro(ctx,t);
      cutFlash(ctx,t+1e-8);
    },
    dispose(){canvas.remove();},
  };
}
