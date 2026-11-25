import {BEAT, BUILD, CUTS, DROP, FPS, HERO_CARDS, HERO_STORIES, HOOK_BEATS, ITEMS, LENGTH, NAMES, OUTRO, SPRINT, STARTS, TITLE, TITLE_PULSES} from './timeline.js';
import {drawOutlined} from './outlined.js';
import {drawFireRing} from './flame-ring.js';

const W=1920, H=1080, TAU=2*Math.PI;
const sans='"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const serif='"SimSun", "Noto Serif CJK SC", serif';
const mono='"Bahnschrift", Consolas, monospace';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>1-(1-clamp(v))**3;
const tint=(hex,a)=>hex+Math.round(clamp(a)*255).toString(16).padStart(2,'0');
const fract=x=>x-Math.floor(x);
const seed=n=>fract(Math.sin(n*93.13+493.731)*18271.82);
const warm='#f7f1df', dim='#b5bdc5', gold='#f2cf93';
const shifts=Array.from({length:100},(_,i)=>[seed(i*4),seed(i*4+1),seed(i*4+2),seed(i*4+3)]);

function line(c,x,y,x2,y2,color,w=1){
  c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();
}
function arc(c,x,y,r,a,b,color,w=1){
  c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.arc(x,y,r,a,b);c.stroke();
}
function text(c,s,x,y,z,color,{weight=500,family=sans,align='left',max=Infinity}={}){
  c.font=`${weight} ${z}px ${family}`;
  if(c.measureText(s).width>max){c.font=`${weight} ${Math.floor(z*max/c.measureText(s).width)}px ${family}`;}
  c.textAlign=align;c.textBaseline='alphabetic';c.fillStyle=color;c.fillText(s,x,y);
}
function aura(c,x,y,r,color,amount){
  const g=c.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,tint(color,amount));g.addColorStop(.37,tint(color,amount*.64));g.addColorStop(1,tint(color,0));
  c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
}
function background(c,t,color,x=1440,intensity=.15){
  c.fillStyle='#040608';c.fillRect(0,0,W,H);
  aura(c,x,518,712,color,intensity);
  aura(c,x+170,775,520,color,intensity*.30);
  c.fillStyle='#c5ced407';
  for(let i=0;i<8;i++)c.fillRect(104+i*243,117,1,829);
  for(let i=0;i<5;i++)c.fillRect(108,117+i*208,1704,1);
  for(const [u,v,a,p] of shifts){
    const strength=(.07+.29*a)*(.65+.35*Math.sin(p*TAU+t*(.8+4*a)));
    c.fillStyle=tint(color,strength);
    c.fillRect(114+u*1690+8*Math.sin(t*.5+p*8),126+v*821-11*Math.sin(t*.67+u*TAU),1+a*2,1+a*2);
  }
}
function slashText(c,value,x,y,size,t,{color=warm,accent=gold,center=false,max=820,family=sans,condense=false}={}){
  const kick=Math.exp(-Math.max(t,0)*15),split=clamp(1-t/.108);
  c.save();c.translate(x-12*kick,y-28*kick);c.scale(1+.048*kick,1+.135*kick);
  c.font=`900 ${size}px ${family}`;
  if(condense)c.scale(Math.min(1,max/c.measureText(value).width),1);
  const opts={weight:900,family,align:center?'center':'left',max:condense?Infinity:max};
  if(split>0){
    text(c,value,12*split,1,size,tint('#68cfff',split*.77),opts);
    text(c,value,-12*split,3,size,tint('#e45d99',split*.68),opts);
  }
  const g=c.createLinearGradient(0,-size,0,9);
  g.addColorStop(0,'#ffffff');g.addColorStop(.50,color);g.addColorStop(1,accent);
  c.shadowColor=tint(accent,.55);c.shadowBlur=11+14*kick;
  text(c,value,0,0,size,g,opts);c.restore();
}
function scanned(c,value,x,y,size,color,time,weight=600){
  if(time<0)return;
  c.save();c.font=`${weight} ${size}px ${sans}`;
  const width=c.measureText(value).width, p=ease((time+.038)/.27);
  c.beginPath();c.rect(x-5,y-size-10,width*p+14,size+20);c.clip();
  text(c,value,x,y,size,color,{weight,max:785});c.restore();
}
function flame(c,item,x,y,size,time,reveal,hit,mode,clipLeft=960){
  c.save();c.beginPath();c.rect(clipLeft,90,W-clipLeft,H-180);c.clip();
  drawOutlined(c,item,{x,y,size,time,reveal,hit});
  c.restore();
}
const chapterCopy=[
  ['地底千年，火凝成莲','萧炎的第一簇异火'],
  ['深蓝火浪，形如水波','韩枫 → 慕骨老人'],
  ['塔底心火，形如火蟒','心火淬炼，日夜不息'],
  ['森白之火，冷热同生','药老传给萧炎'],
  ['紫黑星火，盘作巨龙','星辰之力，修复伤势'],
  ['妖火借情绪燃起','一入幻境，焚及灵魂'],
];
function chapter(c,t,index){
  const item=ITEMS[index],local=t-STARTS[index];
  const named=t>=NAMES[index],shotTime=named?t-NAMES[index]:local;
  const hit=Math.exp(-shotTime*9)*(named?1:.27);
  const x=1454-15*hit,y=533+5*Math.sin(local*3.4);
  background(c,t,item.color,1490,.105+.052*hit);
  drawFireRing(c,1457,540,338,t,item.color,item.light,.11+.89*clamp(local/1.46),hit);
  flame(c,item,x,y,819+33*hit,t,clamp((local+.026)/1.43),hit,'normal',971);
  if(named){
    const size=226;
    slashText(c,item.name,65,604,size,shotTime,{accent:item.light,max:891,condense:true});
    text(c,`异火榜第 ${item.rank} 名`,75,343,47,item.light,{weight:700});
  } else {
    const [first,second]=chapterCopy[index];
    scanned(c,first,77,536,75,warm,local-.10,740);
    if(local>=.93)scanned(c,second,80,662,56,item.light,local-.93,670);
  }
}

function rays(c,x,y,age,color,power=1){
  const p=clamp(age/.53);
  if(p>=1)return;
  c.save();c.globalCompositeOperation='lighter';
  for(let i=0;i<21;i++){
    const a=i*TAU/21+.14,r=185+247*ease(p)+56*seed(i+87);
    const length=(32+80*seed(i+260))*(1-p);
    line(c,x+r*Math.cos(a),y+r*Math.sin(a),x+(r+length)*Math.cos(a),y+(r+length)*Math.sin(a),
      tint(color,power*.73*(1-p)**2),i%4===0?2.8:1.2);
  }
  c.restore();
}
function sequence(c,t,round,fade=1){
  const t0=round?OUTRO:TITLE, local=t-t0;
  const slam=Math.exp(-local*14);
  let strength=Math.exp(-local*6);
  if(!round)for(const pulse of TITLE_PULSES){
    const age=t-pulse;
    if(age>=0&&age<.6)strength=Math.max(strength,.74*Math.exp(-age*6));
  }
  background(c,t,gold,960,.102+.072*strength);
  drawFireRing(c,960,534,315,t,gold,'#fff0c4',round?1:clamp(.48+local*2),strength);
  for(let i=0;i<3;i++){
    const a=local*(i===1?-1.24:1.52)+i*TAU/3+.1,r=400+i*19;
    for(let j=0;j<14;j++){
      const opacity=(.23+.61*strength)*(j/14)**1.8;
      const head=a+(i===1?1:-1)*(.84-j*.06);
      arc(c,960,534,r,head,head+.069,tint('#ffdf9d',opacity),2+i*.65);
    }
    aura(c,960+r*Math.cos(a),534+r*Math.sin(a),31+14*strength,gold,.41+.27*strength);
  }
  rays(c,960,534,local,gold,1.14);
  if(!round)for(const pulse of TITLE_PULSES)if(t>=pulse)rays(c,960,534,t-pulse,gold,.77);

  c.save();c.translate(960,606-82*slam);c.scale(1+.09*slam,1+.16*slam);
  text(c,'七大异火',0,0,168,'#fff1d5',{align:'center',family:serif,weight:700});
  c.restore();
  text(c,round?'你最想拥有哪一簇？':'斗破苍穹 · VIBE 知识大赏',960,732,50,warm,{align:'center',weight:650});
  if(!round){
    line(c,796,766,1124,766,tint(gold,.22),2);
    line(c,796,766,796+328*clamp(local/(STARTS[0]-TITLE)),766,gold,2);
  }
  if(fade<1){c.fillStyle=tint('#040608',1-fade);c.fillRect(0,0,W,H);}
}
function hook(c,t){
  const i=Math.max(0,HOOK_BEATS.findLastIndex(at=>at<=t+1e-8));
  const age=t-HOOK_BEATS[i],phase=clamp(age/.227),slam=Math.exp(-age*13);
  const item=ITEMS[i],x=1071,y=526;
  background(c,t,item.color,x,.13);
  drawFireRing(c,x,y,297,t,item.color,item.light,1,slam*.75);
  drawOutlined(c,item,{x,y,size:499+28*slam,time:t,reveal:.54+phase*.46,hit:slam});
  rays(c,x,y,age,item.color,1.35);
  arc(c,x,y,281+127*ease(phase),-.4,4.4,tint(item.light,.63*(1-phase)),3);
  const scanY=288+phase*462;
  line(c,659,scanY,1490,scanY,tint(item.light,.58*(1-phase)),2);
  if(t<1.47){
    c.save();c.translate(127,537+24*slam);c.scale(1+.075*slam,1+.12*slam);
    text(c,String(i+1).padStart(2,'0'),0,5,224,warm,{family:mono,weight:700});c.restore();
    text(c,'/ 07',430,549,62,item.color,{family:mono,weight:700});
    line(c,134,587,134+386*ease(phase),587,tint(item.color,.83),3);
  } else {
    text(c,'七大异火',106,298,91,warm,{family:serif,weight:700});
  }

}
const clues=[
  ['离榜首只差一位','它生于一片虚无'],
  ['火焰也能被吞掉','万物都能成为它的食粮'],
  ['无形无相','却拥有极高灵智'],
  ['魂族的底牌','它曾帮助魂族延续血脉'],
  ['真正的黑焰','先看见消失的光'],
  ['异火榜第二','越靠近，越暗'],
];
function eclipse(c,t,x,y,p,color,strip){
  const core=132+84*p;
  aura(c,x,y,415,color,.19+.16*p);
  const slice=strip?4+strip*2:0;
  if(slice){c.save();c.beginPath();c.rect(x-370,y-29-slice*2,740,58+slice*4);c.clip();}
  for(let k=0;k<6;k++){
    const rr=core+15+13*k;
    arc(c,x,y,rr,t*(.8+k*.14)+k,t*(.8+k*.14)+k+3.4,tint(color,.73-k*.093),1.5+2*(1-k/6));
  }
  for(let i=0;i<51;i++){
    const a=seed(i+500)*TAU+t*(.34+.55*seed(i+876));
    const v=fract(seed(i+99)-t*(.14+.12*p));
    const r=core+20+v*196;
    const x0=x+r*Math.cos(a),y0=y+r*Math.sin(a);
    const r2=r+10+35*seed(i+99);
    line(c,x0,y0,x+r2*Math.cos(a-.10),y+r2*Math.sin(a-.10),tint(color,(1-v)*.84),1+2*seed(i+10));
  }
  c.fillStyle='#010104';c.beginPath();c.arc(x,y,core,0,TAU);c.fill();
  arc(c,x,y,core+1,t*.65,t*.65+1.17,tint('#e5caff',.66),2);
  if(slice)c.restore();
}
function buildup(c,t){
  const i=Math.max(0,BUILD.findLastIndex(at=>at<=t+1e-8));
  const k=SPRINT.findLastIndex(at=>at<=t+1e-8),hold=t>=onBeforeDrop;
  const p=clamp((t-BUILD[0])/(DROP-BUILD[0])), color=ITEMS[6].color;
  const mx=1438+(k>=0?(k%2?18:-26):0),my=542+(k>=0?(k%3-1)*56:0);
  const shotLocal=t-(k>=0?SPRINT[k]:BUILD[i]);
  background(c,t,color,mx,hold?.03:.08+.1*p);
  drawFireRing(c,mx,my,311+5*(k+1),t,color,ITEMS[6].light,.22+.54*p,Math.exp(-shotLocal*10)*.55);
  eclipse(c,t,mx,my,p,color,k>=0&&k%2===0?k+1:0);
  if(k<0){
    slashText(c,clues[i][0],112,519,108,shotLocal,{accent:'#e0c9ff',max:802});
    scanned(c,clues[i][1],115,627,45,dim,shotLocal-.13,610);
  } else {
    const word=['光','向内','坍缩','异火','榜首之下','第 02 名'][k];
    slashText(c,word,109,559,149,shotLocal,{accent:'#dfbcff',max:802});
    line(c,114,648,114+722*(k+1)/SPRINT.length,648,tint(color,.66),3);
  }
  if(hold){
    c.fillStyle=tint('#020105',.54*ease((t-onBeforeDrop)/.25));c.fillRect(0,0,W,H);
  }
}
const onBeforeDrop=DROP-BEAT;
function fallingWords(c,value,t,color){
  const p=clamp(t/.105),snap=1-clamp((t-.105)/.145);
  const y=610-352*(1-p*p*p)+26*snap*Math.sin(p*Math.PI*.9);
  c.save();c.translate(73,y);
  const impact=Math.exp(-Math.max(t-.105,0)*19)*p;
  c.scale(1+.055*impact,1-.16*impact);
  c.shadowColor='#b276ff';c.shadowBlur=19+12*impact;
  text(c,value,0,0,196,color,{max:839,weight:900});
  c.restore();
}
function finale(c,t){
  const item=ITEMS[6],local=t-DROP;
  const k=HERO_STORIES.findLastIndex(at=>at<=t+1e-8);
  const age=k<0?local:t-HERO_STORIES[k];
  const hit=Math.exp(-age*(k<0?5:10));
  const x=1446+9*Math.sin(t*2.1)+hit*(k%2?-18:20),y=526+7*Math.sin(local*1.7);
  background(c,t,item.color,1450,.165+.085*hit);
  drawFireRing(c,1446,543,360,t,item.color,item.light,.57+.43*clamp(local/.42),hit);
  flame(c,item,x,y,888+hit*57,t,clamp(.18+local/.65),hit,'hero',966);
  if(k<0){
    slashText(c,item.name,62,613,230,local,{color:'#fff0ff',accent:'#d6acff',max:925});
    text(c,'异火榜第 2 名',73,324,47,item.light,{weight:700});
  } else {
    fallingWords(c,HERO_CARDS[k],age,'#f3e5ff');
    text(c,item.name,77,754,48,item.light,{weight:680});
    rays(c,1439,535,age+.015,item.color,.84);
  }
}
function flash(c,canvas,t){
  const last=CUTS.findLast(mark=>mark.at<=t+1e-8);
  if(!last)return;
  const frame=Math.round((t-last.at)*FPS);
  if(frame>3)return;
  const power=last.strength;
  if(power>=.43&&frame<=2){
    const amount=(1-frame/3)*power;
    for(let k=0;k<7;k++){
      const y=142+((k*127)%786),h=6+11*seed(k+30),dx=(k%2?1:-1)*(12+23*seed(k))*amount;
      c.drawImage(canvas,0,Math.floor(y*canvas.height/H),canvas.width,Math.max(1,Math.round(h*canvas.height/H)),dx,y,W,h);
      c.fillStyle=tint('#c5ddff',amount*.35);c.fillRect(k%2?108:1120,y,500+seed(k)*260,2);
    }
  }
  const a=[.60,.22,.022,0][frame]*power;
  if(a>0){c.fillStyle=tint('#f8eeff',a);c.fillRect(0,0,W,H);}
}

export default function({root,width,height}){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  Object.assign(canvas.style,{display:'block',width:'100%',height:'100%'});root.appendChild(canvas);
  const c=canvas.getContext('2d',{alpha:false});
  return {
    prepareFrame(time){
      const t=clamp(time,0,LENGTH);
      c.setTransform(width/W,0,0,height/H,0,0);
      if(t>=OUTRO)sequence(c,t,true,1-.95*ease((t-(LENGTH-.43))/.43));
      else if(t>=DROP)finale(c,t);
      else if(t>=BUILD[0])buildup(c,t);
      else if(t>=STARTS[0])chapter(c,t,STARTS.findLastIndex(s=>s<=t));
      else if(t>=TITLE)sequence(c,t,false);
      else hook(c,t);
      flash(c,canvas,t);
    },
    dispose(){canvas.remove();}
  };
}
