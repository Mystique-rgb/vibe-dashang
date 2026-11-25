import {W,H,box,glow,grad,label,line,oval,poly,random} from './palette.mjs';

const palettes={room:['#030915','#20394b','#060e17','131,207,255'],interview:['#09151b','#344c59','#050b12','161,209,224'],cinema:['#050811','#283248','#090a16','184,211,255'],school:['#0c1628','#405671','#091323','211,216,247'],rail:['#020914','#2c4666','#0a1222','172,210,255'],water:['#041522','#1c5361','#02101f','115,239,238'],chamber:['#160e13','#55412d','#1a1418','252,173,87'],station:['#06131b','#446360','#101c26','185,241,222'],tunnel:['#0a1020','#1e3249','#08101b','114,193,239'],tokyo:['#0e1126','#4c3452','#0e1020','235,130,191'],tower:['#070d1a','#29445a','#080e1b','103,213,255'],hall:['#110b1b','#46374c','#0e101d','207,152,191'],hotel:['#170f1c','#664148','#171724','255,175,138'],river:['#1e273a','#656784','#222d3b','248,185,183'],shop:['#10242a','#526160','#1a2730','217,229,183'],car:['#100b1d','#462945','#151521','246,108,151'],redwell:['#150b16','#462231','#120916','243,72,77'],corridor:['#100b18','#452234','#140b1c','236,82,97'],exit:['#090e1d','#3f3f59','#151e31','163,189,239'],dawn:['#33425d','#b18b86','#343c4b','255,223,169']};
const horizon=622;
function floor(c,y=650,color='#8ba8b8',t=0){
  poly(c,grad(c,0,y,0,H,'rgba(1,9,17,0.25)','#080d18'),[[0,y],[W,y],[W,H],[0,H]]);
  c.save();c.globalAlpha=.19;
  for(let i=-9;i<11;i++)line(c,color,1.4,[[W/2+i*31,y],[W/2+i*267,H]]);
  for(let i=1;i<10;i++){const z=(i/9)**2;const Y=y+(H-y)*z;line(c,color,1.2,[[0,Y],[W,Y]]);}
  c.globalAlpha=.06;
  for(let i=0;i<25;i++){const x=random(i*11+3)*W,y2=y+random(i*7+4)*(H-y);box(c,color,x+t*2%34,y2,35+random(i)*92,1+random(i+1)*2);}
  c.restore();
}
function towers(c,y,depth,t,layers=3){
  for(let layer=0;layer<layers;layer++){
    const height=104+layer*79;
    for(let i=0;i<20;i++){
      const q=i+layer*41,x=i*105-151+random(q+8)*70-Math.sin(t*.28)*(9+layer*17),w=62+random(q+3)*76,h=height*(.36+random(q)*.78);
      box(c,['#3f4b64','#273348','#141b31'][layer],x,y-h,w,h+40);
      if (random(q)>.7)line(c,'#506781',1.3,[[x+w*.69,y-h],[x+w*.69,y-h-25]]);
      for(let b=0;b<Math.round(h/24);b++)for(let a=0;a<3;a++)if(random(q*100+b*5+a)>.54){const v=(.09+random(q*30+b*3+a)*.32)*depth;box(c,`rgba(${(q+a)%4===0?'244,157,131':'166,210,255'},${v})`,x+9+a*w*.25,y-h+14+b*19,w*.12,2+layer);}
    }
  }
}
function arch(c,x,y,w,h,color,edge){c.fillStyle=color;c.strokeStyle=edge;c.lineWidth=3;c.beginPath();c.moveTo(x-w/2,y);c.lineTo(x-w/2,y-h*.58);c.quadraticCurveTo(x-w*.47,y-h*.93,x,y-h);c.quadraticCurveTo(x+w*.47,y-h*.93,x+w/2,y-h*.58);c.lineTo(x+w/2,y);c.closePath();c.fill();c.stroke();}
function beams(c,t,x,y,color){c.save();c.globalCompositeOperation='screen';for(let n=0;n<3;n++){const s=Math.sin(t*.8+n)*100;poly(c,grad(c,x,y,x,y+640,`rgba(${color},.19)`,`rgba(${color},0)`),[[x-11+n*8,y],[x+36+n*12,y+12],[x+380+s+n*89,y+661],[x-117+s+n*89,y+661]]);}c.restore();}
function hall(c,key,t,y=710){
  floor(c,y,key==='redwell'||key==='corridor'?'#bc6476':'#7b95a9',t);
  const warm=key==='redwell'||key==='corridor';
  const near=warm?'#321d2c':'#252f45',far=warm?'#0e0812':'#10182a',edge=warm?'#643445':'#465572';
  for(let i=7;i>=0;i--){const d=1/(1+i*.37);const sy=y-(1-d)*102;arch(c,960,sy,1560*d,802*d,near,edge);arch(c,960,sy+2,1446*d,744*d,far,edge);}
  for(let i=0;i<7;i++){const x=i*326-182;poly(c,grad(c,x,0,x+54,0,near,far),[[x,0],[x+70,0],[x+60,y+86],[x-14,y+96]]);line(c,edge,2,[[x+9,0],[x-3,y+83]]);}
  const rgb=warm?'252,69,80':'167,194,236';
  for(const x of [168,482,1437,1755]){glow(c,rgb,x,318,119,.16);box(c,warm?'#ea6471':'#9ab7e6',x-3,294,6,37);}
}
function interior(c,key,t){
  const isRoom=key==='room', isHotel=key==='hotel', isInterview=key==='interview', main=isRoom?'#1b2a37':isHotel?'#704a52':'#334453';
  floor(c,760,isHotel?'#af868c':'#8394ad',t);
  poly(c,grad(c,0,75,1250,790,'#0b101b',main,'#111b29'),[[0,0],[1475,0],[1480,715],[0,860]]);
  poly(c,'#101620',[[1475,0],[W,0],[W,819],[1480,715]]);
  const wx=isRoom?1030:isHotel?565:1100,wy=isHotel?147:116;
  box(c,'#0d1423',wx-14,wy-13,548,428);box(c,grad(c,0,wy,0,wy+400,isHotel?'#2a415a':'#222e47',isHotel?'#8e6274':'#3b5c71'),wx,wy,520,400);
  c.save();c.beginPath();c.rect(wx,wy,520,400);c.clip();c.translate(wx-50,wy-75);c.scale(.36,.65);towers(c,705,.83,t,3);c.restore();
  for(let j=0;j<3;j++)box(c,'#141c2a',wx+130*j,wy,7,400);box(c,'#191d2b',wx,wy+206,520,8);
  for(let i=0;i<9;i++)line(c,'rgba(220,186,182,.09)',1,[[0,295+i*52],[wx-29,290+i*52]]);
  if (isRoom||isInterview){poly(c,grad(c,0,655,0,945,'#465663','#131d29'),[[0,748],[1490,695],[W,878],[0,980]]);line(c,'#8497ab',2,[[0,748],[1490,695],[W,878]]);}
  if(isRoom){glow(c,'97,199,229',875,515,403,.27);poly(c,'#263f52',[[599,331],[1058,331],[1118,630],[581,641]]);poly(c,grad(c,0,340,0,623,'#315d75','#0f2133'),[[625,360],[1032,358],[1074,596],[612,604]]);line(c,'#638ea2',3,[[621,362],[1034,360],[1076,597]]);for(let j=0;j<19;j++)box(c,'rgba(130,215,240,.11)',638,379+j*10,373,1.4);}
  if(isHotel){poly(c,'#392a34',[[1164,610],[1511,609],[1715,826],[1024,814]]);poly(c,'#73535c',[[1180,581],[1513,580],[1681,776],[1070,759]]);for(let j=0;j<5;j++)line(c,'#a17779',1.4,[[1148-j*13,624+j*24],[1548+j*21,624+j*24]]);}
}
function city(c,key,t){
  const dawn=key==='dawn', river=key==='river'||dawn;
  glow(c,dawn?'255,191,119':'224,106,183',dawn?1500:1340,dawn?480:252,dawn?950:760,dawn?.47:.24);
  if(dawn){glow(c,'255,229,157',1485,458,260,.68);oval(c,'#ffe2aa',1485,458,31,30);}
  for(let i=0;i<6;i++){const y=145+i*60;line(c,dawn?'rgba(248,194,171,.19)':'rgba(200,160,200,.15)',3+i/4,[[130+i*99,y],[480+i*141,y-11],[1090+i*90,y+12],[W,y+9]]);}
  towers(c,river?560:679,dawn?.44:1,t);
  if(river){
    box(c,grad(c,0,560,0,939,dawn?'#666678':'#39465f',dawn?'#94716a':'#222d46','#111e2c'),0,557,W,397);
    for(let j=0;j<50;j++){const x=random(j*31+5)*W, y=566+random(j*31+3)*298;const d=(y-550)/300;const v=t*(12+d*45);line(c,`rgba(${dawn?'250,197,147':'207,179,221'},${.05+random(j*31)*.25})`,1+d*3,[[x-v%65,y],[x+28+d*132-v%65,y]]);}
    poly(c,grad(c,0,772,0,1075,dawn?'#625c5c':'#293947','#151f2c'),[[0,782],[1920,651],[1920,1080],[0,1080]]);
    line(c,dawn?'#dec9ad':'#727991',4,[[0,751],[W,643]]);line(c,dawn?'#837b71':'#4a5969',9,[[0,784],[W,672]]);
    for(let j=0;j<31;j++){const x=j*73+Math.sin(t*.4)*24;line(c,dawn?'#8d796d':'#576072',4,[[x,755-x*.057],[x,799-x*.057]]);}
  }else{
    floor(c,689,key==='car'?'#a35375':'#956790',t);
    for(let i=0;i<6;i++){const x=i*333-21;const col=i%2?'#e699ad':'#80abc5';line(c,'#252137',11,[[x,794],[x,435],[x+48,426]]);box(c,col,x+40,419,22,5);glow(c,i%2?'253,129,169':'104,185,239',x+50,426,117,.22);}
    for(let i=0;i<5;i++){
      const x=((t*(36+i*13)+i*414)%2130)-75;const y=728+i*33;
      poly(c,i%2?'#594155':'#151b31',[[x,y],[x+35,y-28],[x+118,y-29],[x+157,y],[x+160,y+35],[x-12,y+35]]);box(c,i%2?'#f68999':'#c5d8ed',x+125,y+10,28,8);glow(c,i%2?'255,94,117':'176,210,255',x+140,y+14,105,.18);
    }
  }
}
function submerged(c,t,fire){
  const rgb=fire?'253,170,82':'112,208,219', glowBase=fire?'#654834':'#264c55';
  floor(c,779,fire?'#b3865c':'#4c828b',t);
  for(let i=0;i<6;i++){
    const depth=(i+1)/6, x=960+(i%2?1:-1)*i*89+Math.sin(t*.4)*20*depth, y=619+i*39;
    arch(c,x,y,396+212*i,303+152*i,i===0?(fire?'#120d15':'#101c2b'):glowBase,fire?'#806143':'#36626b');
    arch(c,x,y+2,314+179*i,259+143*i,i===0?'#101822':fire?'#211822':'#102735',fire?'#a48154':'#4b7a80');
  }
  for(let i=0;i<7;i++){
    const x=(i*337-95); poly(c,grad(c,x,0,x+142,0,fire?'#1a171e':'#0b202c',fire?'#77523b':'#2b5c62',fire?'#282029':'#102d3c'),[[x,0],[x+125,0],[x+152,820],[x-28,864]]);
    for(let j=0;j<4;j++)line(c,fire?'#9a7049':'#487e80',2,[[x+6,199+j*112],[x+108,192+j*112],[x+116,215+j*112]]);
  }
  const light=760+Math.sin(t*.59)*260;
  light===light&&glow(c,rgb,light,252,623,.22);beams(c,t,light-210,-20,rgb);
  c.save();c.globalAlpha=.24;
  for(let i=0;i<25;i++){const x=random(i*19+4)*W,y=170+random(i*5+14)*640;line(c,fire?'#df9a5c':'#83ccc8',1,[[x,y],[x+Math.sin(t*.7+i)*33+44,y-7],[x+69,y+4]]);}
  c.restore();
}
function station(c,key,t){
  const school=key==='school', cinema=key==='cinema', rtl=key==='rail'||key==='tunnel';
  hall(c,key,t,school?783:708);
  if(school){for(let i=0;i<9;i++){const x=i*237-49;line(c,'#52677d',4,[[x,195],[x,698]]);if(i%2)arch(c,x+101,633,127,282,'#496077','#a5adbb');}glow(c,'186,212,244',964,409,475,.23);}
  else if(cinema){poly(c,grad(c,565,310,1340,483,'#587185','#b6c8df','#6e80a6'),[[470,220],[1480,268],[1426,655],[500,628]]);for(let j=0;j<5;j++)for(let i=0;i<16;i++){const x=i*(84+j*4)+195-j*53,y=699+j*57;oval(c,'#141624',x,y,31+j*2,26+j*3);box(c,'#242534',x-25-j*2,y+9,51+j*4,38);}}
  else {
    for(const d of [-1,1]){line(c,'#6f8899',4,[[960+d*63,675],[960+d*636,1080]]);line(c,'#2a465e',17,[[960+d*68,695],[960+d*665,1080]]);}
    for(let j=1;j<13;j++){const a=(j/13)**2;const y=698+382*a;line(c,'#486177',2,[[960-580*a,y],[960+580*a,y]]);}
    if(!rtl){const off=Math.sin(t*.75)*69;poly(c,grad(c,0,293,0,765,'#93a5a0','#334b56'),[[100+off,319],[818+off,445],[818+off,676],[100+off,875]]);for(let j=0;j<5;j++){const x=121+j*137+off;poly(c,'#132831',[[x,417+j*19],[x+95,436+j*18],[x+95,537+j*5],[x,545+j*6]]);}}
  }
}
export function drawWorld(c,key,o){
  const {t,id,p}=o;const [a,b,d,rgb]=palettes[key]||palettes.hall;
  box(c,grad(c,0,0,0,H,a,b,d),0,0,W,H);glow(c,rgb,989,542,1000,.15);
  if(['room','hotel','interview','shop'].includes(key))interior(c,key,t);
  else if(['tokyo','car','river','dawn'].includes(key))city(c,key,t);
  else if(['water','chamber'].includes(key))submerged(c,t,key==='chamber');
  else if(['cinema','school','station','rail','tunnel'].includes(key))station(c,key,t);
  else hall(c,key,t);
  if(key==='tower'){poly(c,grad(c,570,0,700,H,'#17273e','#2b495c','#0c1729'),[[385,H],[588,0],[1261,0],[1550,H]]);for(let i=0;i<14;i++)line(c,'#40728a',2,[[420+i*40,H],[592+i*48,0]]);for(let i=1;i<19;i++)line(c,'#416071',2,[[770-i*21,i*i*3.1],[1120+i*19,i*i*3.1]]);}
  if(key==='redwell'){
    const x=1050,y=717;glow(c,'232,52,65',x,538,383,.28);
    poly(c,'#261b2a',[[601,y+29],[1467,y-83],[1619,y+78],[757,y+204]]);
    poly(c,grad(c,0,y-82,0,y+88,'#606071','#31253b'),[[623,y],[1476,y-94],[1617,y+54],[748,y+150]]);
    line(c,'#8d5361',3,[[623,y],[1476,y-94],[1617,y+54],[748,y+150],[623,y]]);
    for(let j=0;j<8;j++)line(c,'#703e4b',2,[[748+j*100,y+142-j*12],[721+j*99,y+204-j*10]]);
    if(id>=63&&id<=73)glow(c,'178,217,255',468,286,680,.34);
  }
  if(key==='corridor'||key==='exit'){
    const x=id===53?960:1010,close=id===53?.32+.45*p:id===61?.57+.22*p:.35;
    box(c,'#181320',x-510,64,1020,68);box(c,'#683a4a',x-507,131,1014,13);
    const edge=241+close*720; const g=grad(c,x,0,x,edge,'#2b263c','#482d43','#1e1728');
    box(c,g,x-491,141,982,edge-141);for(let j=0;j<12;j++){const y=145+j*(edge-146)/12;line(c,'#654152',2,[[x-491,y],[x+490,y]]);}
    glow(c,key==='exit'?'178,208,255':'228,56,67',x,edge,327,.2);line(c,key==='exit'?'#a1b8d0':'#9e3d55',4,[[x-490,edge],[x+490,edge]]);
  }
}
export function drawAtmosphere(c,key,{t,id}){
  const water=key==='water', rain=['tokyo','car','river','exit'].includes(key), dawn=key==='dawn';
  if(water||rain||dawn||key==='chamber'||key==='redwell'){
    c.save();
    const rgb=water?'160,237,231':dawn?'255,228,193':rain?'187,213,245':'255,144,98';
    for(let i=0;i<(rain?85:48);i++){
      const w=random(i*29+39),h=random(i*3+45),x=(w*W+t*(dawn?15:-27+h*57)+W*3)%W,y=(h*H+t*(rain?420+w*125:-41-w*36)+H*82)%H;
      if(rain)line(c,`rgba(${rgb},${.07+w*.23})`,.6+w*1.1,[[x,y],[x-10-w*9,y+36+w*20]]);
      else if(water&&i%7===0){c.strokeStyle=`rgba(${rgb},.27)`;c.lineWidth=1.2;c.beginPath();c.arc(x,y,2.5+w*5,0,6.283);c.stroke();}
      else oval(c,`rgba(${rgb},${.07+w*.22})`,x,y,1+w*2,1+w*2);
    }
    c.restore();
  }
}
