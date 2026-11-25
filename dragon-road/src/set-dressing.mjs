import {W,H,box,grad,glow,label,line,oval,poly,random} from './palette.mjs';

function shelf(c,x,y,w,h,type){
 box(c,grad(c,x,y,x+w,y+h,'#171e30','#4b465e','#26283b'),x,y,w,h);
 for(let k=0;k<3;k++){
  const top=y+11+k*h/3;box(c,'#181e2d',x+10,top,w-20,h/3-13);
  let dx=13;
  for(let j=0;j<17&&dx<w-22;j++){
   const n=k*39+j+Math.floor(x)%36, a=random(n*18),b=random(n*25), bw=8+a*19,bh=h/3*(.37+b*.38);
   const sw=type==='shop'?['#c89260','#719f8f','#e4c5a1','#9f839d','#a1bbc9']:['#574463','#5c8296','#8a6465','#9e826d','#4d6578'];
   box(c,sw[(j+k*3)%sw.length],x+dx,top+h/3-14-bh,bw,bh);box(c,'rgba(227,203,176,.46)',x+dx+2,top+h/3-17-bh*.7,bw-4,2);dx+=bw+5;
  }
  line(c,'rgba(220,193,172,.38)',1.7,[[x,top+h/3-9],[x+w,top+h/3-9]]);
 }
}
function standingLamp(c,x,y,h,blue){
 const rgb=blue?'122,205,239':'249,178,112';
 poly(c,grad(c,x,y,x,y+h*.54,`rgba(${rgb},.22)`,`rgba(${rgb},0)`),[[x-62,y+36],[x+69,y+37],[x+251,y+h*.66],[x-218,y+h*.66]]);
 line(c,'#4e5367',6,[[x,y+32],[x,y+h]]);oval(c,'#363a4a',x,y+h,48,10);
 poly(c,grad(c,x-76,y,x+62,y+39,'#536b81',blue?'#89bace':'#c1906d','#695266'),[[x-32,y],[x+36,y],[x+73,y+54],[x-65,y+54]]);
 line(c,`rgba(${rgb},.82)`,4,[[x-64,y+55],[x+71,y+55]]);glow(c,rgb,x,y+56,147,.35);
}
function desktop(c,t){
 shelf(c,142,268,272,324,'books');standingLamp(c,1390,567,275,false);
 for(let i=0;i<7;i++){const x=260+i*102,y=776-i*3;box(c,i%2?'#926d78':'#45667b',x,y,71+i*5,12);line(c,'#b59c9e',1,[[x+6,y+7],[x+52,y+7]]);}
 poly(c,'#445062',[[1221,756],[1329,745],[1356,812],[1215,820]]);line(c,'#96a5a5',2,[[1222,761],[1330,750],[1355,809]]);
 oval(c,'#788190',1470,731,27,12);poly(c,'#576474',[[1445,727],[1496,727],[1490,779],[1453,784]]);oval(c,'#342c39',1471,729,20,8);
}
function wetStreet(c,key,t){
 const front=key==='tokyo', dawn=key==='dawn';
 if(front){
  for(let i=0;i<7;i++){
   const x=i*282-22,y=588+random(i*73)*115,w=172+random(i*31)*50;
   if(i===3)continue;
   const rgb=['233,138,191','127,218,236','240,174,117'][i%3];
   box(c,'#20263b',x,y,w,140);box(c,`rgba(${rgb},.12)`,x+12,y+16,w-24,109);
   for(let j=0;j<5;j++){box(c,`rgba(${rgb},.38)`,x+11+j*(w-22)/5,y+22,2,103);box(c,'rgba(13,14,23,.56)',x+18+j*(w-22)/5,y+65,14,45);}
   line(c,`rgba(${rgb},.67)`,2,[[x,y+2],[x+w,y+2]]);glow(c,rgb,x+w/2,y+49,157,.25);
  }
  for(let i=0;i<7;i++){const x=380+i*163;poly(c,'rgba(178,162,191,.22)',[[x,923],[x+112,892],[x+206,946],[x+67,977]]);}
 }else{
  const y=dawn?540:546, dy=dawn?30:12;
  poly(c,dawn?'#746076':'#4b5475',[[86,y],[805,y+dy],[864,y+22+dy],[65,y+22]]);
  for(let i=0;i<8;i++){const x=i*93+112;box(c,dawn?'#7a657b':'#4d5e7a',x,y+16,13,94);line(c,dawn?'#b88485':'#77849c',2,[[x,y+21],[x+25,y-9]]);}
  for(let i=0;i<3;i++){const x=1650+i*119,y0=707-i*41;line(c,dawn?'#ad9290':'#5e6984',5,[[x,y0],[x-2,y0-264],[x-43,y0-281]]);glow(c,dawn?'255,207,163':'251,188,180',x-46,y0-279,90,.22);}
 }
}
function industrial(c,key,t){
 const red=key!=='water'&&key!=='chamber';const color=red?'#935978':'#54979b',hi=red?'#ff7680':'#96e4df';
 for(const side of [-1,1]){
  const x=960+side*700;
  line(c,red?'#24172e':'#152e3e',22,[[x+side*243,114],[x,114],[x,603],[x-side*73,667]]);
  line(c,color,3,[[x+side*243,111],[x,111],[x,604],[x-side*73,667]]);
  for(let j=0;j<4;j++)box(c,color,x-17,205+j*108,34,6);
  box(c,grad(c,x-135,636,x+140,755,red?'#231e33':'#26394c',red?'#57404d':'#4f7378'),x-106,665,198,108);
  for(let i=0;i<5;i++){const xx=x-84+i*35;box(c,'#262837',xx,677,24,72);line(c,color,1,[[xx+3,684],[xx+17,684]]);if(i%2===0)box(c,hi,xx+3,695,13,2+2*Math.sin(t*4+i)**2);}
  for(let j=0;j<4;j++){box(c,red?'#765066':'#4b8188',x-144+j*19,765,11,3);}
 }
 if(key==='redwell'){
  for(let i=0;i<5;i++){const x=678+i*151,y=541+i*20;line(c,'#453044',3,[[x,133],[x+19,370],[x-12,y]]);oval(c,'#82485d',x-12,y,6,6);}
  for(let i=0;i<9;i++)line(c,'rgba(255,155,107,.31)',2,[[614+i*41,813+i*15],[639+i*41,803+i*15]]);
 }
}
function campus(c,key){
 if(key==='school'||key==='hall'){
  for(const x of [254,1585]){
   line(c,'#856f83',3,[[x,135],[x,351]]);poly(c,grad(c,x-37,0,x+60,0,'#695576','#934c66','#3b304a'),[[x-49,187],[x+50,187],[x+49,417],[x,379],[x-49,417]]);line(c,'#b9926f',2,[[x-35,199],[x-35,392],[x,363],[x+35,392],[x+35,199]]);oval(c,'#b8876a',x,275,15,20);
  }
 }else{
  for(const x of [356,1550]){box(c,'#273c52',x-97,485,194,126);box(c,'#7389a2',x-91,490,182,4);label(c,key==='cinema'?'放映厅':key==='station'?'PLATFORM':'站 台',x,531,24,'#aac6cc');for(let i=0;i<3;i++)line(c,'rgba(167,201,203,.47)',1.6,[[x-62,559+i*12],[x+59,559+i*12]]);}
 }
}
function foreground(c,key,t){
 if(['tokyo','car','river','dawn'].includes(key)){
  const bank=key==='river'||key==='dawn';if(bank){
   for(let i=0;i<27;i++){
    const a=random(i*4+12),x=i<13?30+a*340:W-348+a*348,y=1050-random(i*67+19)*118,dx=Math.sin(t*1.9+i*.2)*18;
    line(c,key==='dawn'?'#4f5a62':'#313f54',1.8+a*2,[[x,y+53],[x+dx*.3,y-6],[x+dx+9,y-34-a*39]]);
   }
  }else{
   const x=113+Math.sin(t*.21)*19;box(c,'rgba(29,30,49,.74)',x,624,9,334);box(c,'#50516a',x-34,653,79,38);line(c,'#b77c8b',1.5,[[x-33,653],[x+45,653]]);
  }
 }
}
export function dressScene(c,key,{t,id},front=false){
 c.save();
 if(front)foreground(c,key,t);
 else if(key==='room')desktop(c,t);
 else if(key==='hotel'||key==='shop'||key==='interview'){
  shelf(c,key==='shop'?1435:138,key==='shop'?350:371,key==='shop'?377:275,356,key);
  standingLamp(c,key==='hotel'?1426:537,514,324,key==='shop');
  if(key==='hotel'){box(c,'#3a3345',292,704,243,71);line(c,'#826075',2,[[302,706],[525,706]]);}
 }
 else if(['tokyo','car','river','dawn'].includes(key))wetStreet(c,key,t);
 else if(['water','chamber','redwell','corridor','exit'].includes(key))industrial(c,key,t);
 else campus(c,key);
 c.restore();
}
