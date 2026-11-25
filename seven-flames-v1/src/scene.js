import {BEAT, BUILD, CUTS, DROP, FPS, HERO_STORIES, HOOK_BEATS, ITEMS, LENGTH, NAMES, OUTRO, SPRINT, STARTS, TITLE} from './timeline.js';
import {drawFlame} from './flames.js';

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
function frame(c,t,item,index){
  const color=item?.color||gold;
  line(c,105,110,1815,110,tint(color,.32));line(c,105,969,1815,969,tint(color,.29));
  text(c,'VIBE',105,85,28,warm,{family:mono,weight:700});
  text(c,'知识大赏',184,85,23,dim,{weight:650});
  text(c,'斗破苍穹  /  异火榜',1815,84,25,dim,{align:'right'});
  for(let i=0;i<ITEMS.length;i++){
    const x=1367+i*66, active=i===index;
    line(c,x,985,x+39,985,active?color:tint(color,i<index?.45:.18),active?3:1);
    text(c,String(ITEMS[i].rank).padStart(2,'0'),x,1019,19,active?warm:dim,{family:mono});
  }
  if(item)text(c,`异火榜  /  第 ${item.rank} 名`,105,1015,24,dim);
  else text(c,'19  /  15  /  14  /  11  /  09  /  03  /  02',105,1015,22,dim,{family:mono});
}
function ring(c,x,y,r,t,color,hit=0){
  arc(c,x,y,r,0,TAU,tint(color,.18));arc(c,x,y,r-24,0,TAU,tint(color,.12));
  arc(c,x,y,r+21,t*.41,t*.41+.53,tint(color,.65),2.5);
  arc(c,x,y,r-7,-t*.37+3,-t*.37+4.18,tint(color,.45),2);
  arc(c,x,y,r+21,t*.41+2.6,t*.41+3.52,tint(color,.35),1.5);
  c.strokeStyle=tint(color,.27);c.lineWidth=1;c.beginPath();
  for(let i=0;i<72;i++){
    const a=i*TAU/72,s=Math.sin(a),k=Math.cos(a),l=i%6===0?14:5;
    c.moveTo(x+(r+3)*k,y+(r+3)*s);c.lineTo(x+(r+l)*k,y+(r+l)*s);
  }
  c.stroke();
  if(hit>.01){
    arc(c,x,y,r+27+58*(1-hit),0,TAU,tint(color,hit*.53),3);
    for(let i=0;i<22;i++){
      const a=i*TAU/22+seed(i+3)*.08,s=Math.sin(a),k=Math.cos(a),d=r+22+70*(1-hit);
      line(c,x+d*k,y+d*s,x+(d+12+36*seed(i))*k,y+(d+12+36*seed(i))*s,tint(color,hit*.53),1.4);
    }
  }
}
function stamp(c,label,x,y,color,align='left'){
  c.save();c.font=`650 25px ${sans}`;
  const w=c.measureText(label).width+39;
  if(align==='center')x-=w/2;
  c.fillStyle=tint(color,.10);c.fillRect(x,y-36,w,48);
  c.strokeStyle=tint(color,.51);c.lineWidth=1.5;c.strokeRect(x,y-36,w,48);
  text(c,label,x+19,y-2,25,color,{weight:650});c.restore();
}
function slashText(c,value,x,y,size,t,{color=warm,accent=gold,center=false,max=820,family=sans}={}){
  const kick=Math.exp(-Math.max(t,0)*15),split=clamp(1-t/.108);
  c.save();c.translate(x-12*kick,y-28*kick);c.scale(1+.048*kick,1+.135*kick);
  const opts={weight:900,family,align:center?'center':'left',max};
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
  c.save();c.beginPath();c.rect(clipLeft,122,W-clipLeft,H-243);c.clip();
  drawFlame(c,item,{x,y,size,time,reveal,hit,mode});
  c.restore();
}
function chapter(c,t,index){
  const item=ITEMS[index],start=STARTS[index],local=t-start;
  const second=t>=NAMES[index],shotTime=second?t-NAMES[index]:local;
  const hit=Math.exp(-Math.max(shotTime,0)*8);
  const pull=clamp((local-(NAMES[index]-start-.15))/.15)*Number(!second);
  const x=1432+(second?-1:1)*18*hit+13*pull,y=526+7*Math.sin(local*3.4)-11*pull;
  background(c,t,item.color,x,.115);
  ring(c,1433,542,second?367:344,t,item.color,hit);
  flame(c,item,x,y,(second?704:665)+22*hit+28*pull,t,ease((local+.06)/.61),hit,second?'close':'normal');
  frame(c,t,item,index);
  text(c,'异火榜',113,299,31,item.light,{weight:750});
  text(c,String(item.rank).padStart(2,'0'),237,303,57,item.color,{weight:700,family:mono});
  line(c,112,328,829,328,tint(item.color,.37));
  slashText(c,item.name,108,526,item.name.length===5?151:174,shotTime,{accent:item.light,max:814});
  if(second){
    scanned(c,item.stories[0],114,624,45,warm,shotTime+.02,720);
    scanned(c,item.stories[1],114,687,39,dim,shotTime-.13,580);
  } else {
    scanned(c,item.key,114,624,48,warm,shotTime-.11,740);
    scanned(c,item.origin,114,689,32,dim,shotTime-.21,590);
  }
  const stroke=clamp(shotTime/.45);
  line(c,114,739,114+637*stroke,739,tint(item.color,.37),1.5);
}

function sequence(c,t,round,fade=1){
  const t0=round?OUTRO:TITLE, local=t-t0;
  background(c,t,gold,960,.10);
  for(let i=0;i<7;i++){
    const a=i*TAU/7-t*.12;
    const radius=337+12*Math.sin(t*2);
    const x=960+Math.sin(a)*radius,y=539-Math.cos(a)*radius;
    arc(c,x,y,7,0,TAU,tint(ITEMS[i].color,.67),2);
    aura(c,x,y,47,ITEMS[i].color,.30);
  }
  ring(c,960,540,320,t,gold,Math.exp(-local*6));
  frame(c,t,null,-1);
  text(c,round?'斗破苍穹  /  异火榜':'斗破苍穹',960,390,39,gold,{align:'center',weight:700});
  slashText(c,'七大异火',960,593,190,local,{color:warm,accent:gold,center:true,max:1050,family:serif});
  text(c,round?'你最想拥有哪一簇？':'从第 19 名，到第 2 名',960,695,37,warm,{align:'center',weight:620});
  if(fade<1){c.fillStyle=tint('#040608',1-fade);c.fillRect(0,0,W,H);}
}
function hook(c,t){
  const i=Math.max(0,HOOK_BEATS.findLastIndex(at=>at<=t+1e-8)),hit=Math.exp(-(t-HOOK_BEATS[i])*8);
  const colors=['#36e1b4','#438efc','#955dff'];
  background(c,t,colors[i],960,.078);
  frame(c,t,null,-1);
  ring(c,960,521,319,t,colors[i],hit);
  text(c,'斗破苍穹',960,348,38,dim,{align:'center',weight:700});
  slashText(c,'有些火，',960,518,135,t,{color:warm,accent:'#e6eaf1',center:true,max:1050});
  if(i>=1)slashText(c,'能吞掉别的火',960,676,131,t-HOOK_BEATS[1],{color:warm,accent:'#d2b6fc',center:true,max:1200});
  if(i>=2)line(c,676,742,1244,742,tint(colors[i],.67),2);
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
  ring(c,mx,my,353+7*(k+1),t,color,Math.exp(-shotLocal*10));
  eclipse(c,t,mx,my,p,color,k>=0&&k%2===0?k+1:0);
  frame(c,t,null,-1);
  if(k<0){
    stamp(c,'压轴  /  异火榜',115,325,'#d8c8f3');
    slashText(c,clues[i][0],112,519,108,shotLocal,{accent:'#e0c9ff',max:802});
    scanned(c,clues[i][1],115,627,45,dim,shotLocal-.13,610);
  } else {
    text(c,'异火榜',114,334,39,dim,{weight:700});
    const word=['光','向内','坍缩','异火','榜首之下','第 02 名'][k];
    slashText(c,word,109,559,149,shotLocal,{accent:'#dfbcff',max:802});
    line(c,114,648,114+722*(k+1)/SPRINT.length,648,tint(color,.66),3);
  }
  if(hold){
    c.fillStyle=tint('#020105',.54*ease((t-onBeforeDrop)/.25));c.fillRect(0,0,W,H);
  }
}
const onBeforeDrop=DROP-BEAT;
function finale(c,t){
  const item=ITEMS[6],local=t-DROP;
  const k=HERO_STORIES.findLastIndex(at=>at<=t+1e-8);
  const cut=[DROP,...HERO_STORIES][k+1],cutTime=t-cut;
  const hit=Math.exp(-cutTime*(k<0?6:10));
  const x=1400+10*Math.sin(t*2.1)+hit*(k%2?-22:22),y=532+9*Math.sin(local*1.7);
  background(c,t,item.color,x,.128+hit*.078);
  ring(c,1422,543,375,t,item.color,hit);
  flame(c,item,x,y,718+hit*45+(k%2?16:0),t,1,hit,'hero',925);
  frame(c,t,item,6);
  stamp(c,'异火榜  /  第二',114,340,'#dfcaff');
  slashText(c,item.name,109,552,201,local,{color:'#f2e3ff',accent:'#cea3ff',max:825});
  const scanProgress=clamp(local/.38);
  line(c,114,582,114+789*scanProgress,582,tint('#d3a4ff',.63),2.5);
  if(k>=0){
    scanned(c,item.stories[k],114,663,54,warm,cutTime+.10,730);
    scanned(c,['黑焰  /  源自虚无','魂族  /  幕后底牌','归位  /  共凝异火恒古尺'][k],116,734,34,dim,cutTime-.22,620);
  } else {
    scanned(c,item.key,114,663,58,warm,local+.03,750);
    scanned(c,item.origin,116,734,34,dim,local-.18,620);
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
