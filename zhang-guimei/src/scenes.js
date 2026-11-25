import { W,H,clamp,ease,mix,cream,gold,red,ink,serif,rect,poly,line,ellipse,round,text,vertical,glow,windowLight,mountains,corridor,school,room } from './art.js';
import { person,book,desk,writing } from './figures.js';

function crop(c,dx,dy,scale,paint) {
  c.save(); c.translate(dx,dy); c.scale(scale,scale); paint(); c.restore();
}

function lampSwitch(c,t) {
  const on=ease((t-.24)/.38);
  corridor(c,t,on*.85);
  rect(c,654,40,236,439,'#333a3d36');
  vertical(c,672,40,212,445,'#524f48','#8d7860');
  const x=782,y=261;
  round(c,x-20,y-23,42,46,5,'#a59d89');
  round(c,x-8,y-12,17,22,3,on>.4?'#f3d49a':'#8d8e82');
  const travel=ease(t*4);
  person(c,626+travel*57,466,1.39,t,{pose:'switch'});
  glow(c,x,151,352,'#ffc46f',on*.48);
}

function map(c,t) {
  vertical(c,0,0,W,H,'#52584e','#292f32');
  poly(c,[[146,203],[197,165],[249,165],[272,122],[315,143],[373,104],[419,133],[489,118],[554,143],[606,127],[657,113],[649,80],[705,66],[763,126],[757,160],[694,193],[709,231],[657,269],[650,311],[618,361],[562,374],[525,418],[455,398],[426,359],[387,359],[349,388],[319,368],[306,326],[270,297],[218,290],[192,245],[167,246]],'#869083');
  poly(c,[[292,220],[370,197],[433,228],[534,205],[633,221],[649,268],[618,315],[530,320],[481,373],[442,351],[409,299],[343,290]],'#718377');
  const route=[[700,113],[669,156],[610,215],[542,253],[488,296],[438,354]];
  const shown=ease((t-.04)/1.7)*(route.length-1);
  const stop=Math.min(route.length-2,Math.floor(shown));
  const k=shown-stop;
  const a=route[stop],b=route[stop+1];
  const head=[mix(a[0],b[0],k),mix(a[1],b[1],k)];
  line(c,[...route.slice(0,stop+1),head],'#a75548',8);
  line(c,[...route.slice(0,stop+1),head],gold,3);
  ellipse(c,...route[0],7,7,cream); ellipse(c,...head,7,7,gold);
  text(c,'黑龙江',728,110,26,{outline:3});
  if(shown>4.6)text(c,'云南',397,386,26,{outline:3});
}

function visits(c,t,close=false) {
  mountains(c,t,{road:true});
  rect(c,0,374,W,H-374,'#8a795e');
  poly(c,[[19,182],[337,143],[416,196],[21,225]],'#6b5244');
  rect(c,27,214,352,211,'#9b8064');
  rect(c,145,230,77,195,'#63513f');
  for(let i=0;i<5;i++)line(c,[[42,232+i*25],[124,232+i*25]],'#8b7059',2);
  if(close){
    c.save(); c.translate(-424,-315); c.scale(1.72,1.72);
    person(c,532,414,1.05,t,{seated:true,pose:'offer'});
    person(c,675,419,1,t,{kind:'family',seated:true,pose:'offer',facing:-1,index:1});
    c.restore();
  } else {
    person(c,491,429,1.12,t,{seated:true,pose:'offer'});
    person(c,634,431,1.03,t,{kind:'family',seated:true,pose:'offer',facing:-1,index:1});
    person(c,739,431,.86,t,{kind:'student',seated:true,pose:'read',facing:-1,index:2});
  }
}

function paper(c,x,y,w,h,angle,paint) {
  c.save(); c.translate(x,y); c.rotate(angle);
  round(c,8,10,w,h,5,'#25262755');
  round(c,0,0,w,h,3,'#ddd0ab');
  for(let i=0;i<7;i++)line(c,[[32,95+i*20],[w-38,95+i*20]],'#7a705135',1.4);
  paint(); c.restore();
}

function headline(c,t,kind) {
  room(c,t,'office');
  if(kind==='idea'||kind==='funds'){
    person(c,648,464,1.44,t,{pose:'write',seated:true});
    poly(c,[[339,385],[789,374],[882,430],[306,452]],'#72573e');
    book(c,600,379,121,44,-.1);
    glow(c,557,183,196,'#ffd084',.44);
    poly(c,[[535,143],[579,143],[602,195],[506,195]],'#d5b774');
    if(kind==='funds')text(c,'1 万元',291,265,87,{font:serif,weight:700,color:gold,outline:7,align:'center'});
    return;
  }
  const u=ease(t/.46);
  paper(c,238,102+(1-u)*25,524,286,-.075+u*.055,()=>{
    text(c,'2007 年 10 月',32,45,20,{color:'#72664e'});
    line(c,[[32,57],[493,57]],'#8e795a',1.4);
    rect(c,30,111,kind==='news'?400*ease((t-.25)/.75):412,46,'#d8ad527c');
    text(c,'我有一个梦想',32,150,49,{font:serif,color:'#2f332f',weight:700});
    text(c,'张桂梅代表采访 · 报道标题排字',34,206,20,{color:'#544f41'});
    text(c,'据新华社记者手记',34,246,16,{color:'#655a47'});
  });
}

function classScene(c,t,kind) {
  room(c,t);
  if(kind==='empty'){
    desk(c,248,331,.75,t);
    desk(c,483,285,1,t);
    desk(c,728,325,1.24,t);
    glow(c,659,200,260,'#f7d297',.22);
    return;
  }
  if(kind==='math'||kind==='pass'){
    const chalk=ease((t-.5)/.9);
    if(kind==='math'){
      line(c,[[399,229],[399,150]],'#d7d7bd',2);
      line(c,[[381,210],[522,210]],'#d7d7bd',2);
      line(c,[[404,208],[mix(405,487,chalk),mix(208,159,chalk)]],'#e4dcb5',3);
      text(c,'y = kx + b',484,193,24,{font:serif,color:'#e5dfbd'});
      person(c,350,402,1.14,t,{kind:'graduate',pose:'chalk'});
    } else person(c,563,422,1.28,t,{kind:'graduate',pose:'read'});
  } else person(c,619,387,1.2,t,{pose:'read',facing:-1});
  const occupied=kind!=='empty';
  [248,451,656,827].forEach((x,i)=>desk(c,x,343+i%2*41,.91+i*.057,t,occupied,i));
}

function schoolGroup(c,t,kind) {
  school(c,t,{gate:kind==='gate'});
  if(kind==='school'){
    person(c,374+35*ease(t*.64),454,1.23,t,{pose:'walk'});
  } else if(kind==='gate'){
    [398,481,564].forEach((x,i)=>person(c,x+i*t*7,457+i*6,.58+i*.06,t,{kind:'student',pose:'walk',index:i}));
  } else {
    [298,404,510,616,732].forEach((x,i)=>person(c,x+8*Math.sin(t+i*.5),459+(i%2)*16,.91+(i%2)*.07,t,{kind:'student',pose:kind==='depart'?'walk':'read',index:i}));
  }
  if(kind==='first')text(c,'100',480,176,105,{align:'center',font:serif,color:gold,weight:700,outline:8});
}

function trail(c,t,kind) {
  mountains(c,t,{night:kind==='miles',road:true});
  person(c,550-t*36,417+ Math.min(t,3)*18,.72+t*.14,t,{pose:'walk',facing:-1});
  if(kind==='miles'){
    line(c,[[749,317],[791,271],[852,280],[899,227]],'#e4b87980',2);
    text(c,'11 万公里',748,210,76,{color:gold,align:'center',font:serif,weight:700,outline:7});
  }
}

function stairs(c,t) {
  vertical(c,0,0,W,H,'#495258','#776e59');
  for(let i=0;i<9;i++)rect(c,405+i*38,474-i*28,566-i*38,86+i*28,i%2?'#625e54':'#8a8169');
  windowLight(c,667,80,125,125,true);
  person(c,437+t*73,457-t*43,1.35,t,{pose:'walk'});
  for(let i=0;i<8;i++)line(c,[[370+72*i,498-51*i],[370+72*i,566-51*i]],'#443e36',6);
  line(c,[[317,530],[946,86]],'#766959',13);
}

function books(c,t,closed=false) {
  room(c,t,'office');
  poly(c,[[295,290],[667,269],[891,457],[180,489]],'#98704e');
  book(c,630,306,119,131,.17,true);
  c.save(); c.translate(349,300); c.rotate(-.14);
  book(c,0,0,208,141,0,closed&&t>.36);
  if(closed&&t<.36){
    const step=ease(t/.36);
    poly(c,[[104,2],[105-90*step,31],[105-89*step,124],[104,139]],'#e2cda0');
  }
  c.restore();
  if(!closed)round(c,748,361,54,70,6,red);
}

function graduate(c,t,kind) {
  if(kind!=='doctor'){
    school(c,t,{gate:false});
    person(c,538+t*17,465,1.45,t,{kind:'graduate',pose:'carry'});
    return;
  }
  vertical(c,0,0,W,H,'#768581','#a8af95');
  windowLight(c,672,106,166,132,true);
  rect(c,0,386,W,154,'#767e6f');
  round(c,139,135,114,116,4,'#d0ceb0');
  rect(c,193,148,10,83,'#9f655d'); rect(c,156,183,83,10,'#9f655d');
  person(c,523,455,1.48,t,{kind:'doctor',pose:'read'});
  round(c,607,344,196,95,8,'#85806d');
  book(c,650,346,82,31,-.1,true);
}

function paperPhoto(c,image,x,y,w,h,angle,t) {
  c.save(); c.translate(x,y); c.rotate(angle);
  round(c,9,13,w,h,4,'#0c111b80');
  round(c,0,0,w,h,4,'#d8c9aa');
  const px=12,py=12,pw=w-24,ph=h-37;
  c.save(); c.beginPath(); c.rect(px,py,pw,ph); c.clip();
  const scale=Math.max(pw/image.width,ph/image.height)*(1.001+ease(t*.29)*.04);
  const iw=image.width*scale,ih=image.height*scale;
  c.drawImage(image,px+(pw-iw)/2,py+(ph-ih)/2,iw,ih);
  c.restore(); c.restore();
}

function archival(c,t,images) {
  corridor(c,t,.92);
  rect(c,0,0,W,H,'#22202264');
  glow(c,672,250,418,'#dcbc85',.3);
  const k=ease(t/.5);
  if(images.reading)paperPhoto(c,images.reading,372,62+(1-k)*14,471,345,.025,t);
  else classScene(c,t,'classroom');
  if(images.group&&t>1.45){
    const j=ease((t-1.45)/.32);
    c.save(); c.globalAlpha=j;
    paperPhoto(c,images.group,124,123+(1-j)*23,407,297,-.063,t-1.45);
    c.restore();
  }
  text(c,'张桂梅与华坪女高学生 · 新华社资料照片',482,478,18,{outline:3,align:'center'});
}

export const scenes = {
  writing: (c,t)=>writing(c,t),
  switch: lampSwitch,
  young(c,t){
    mountains(c,t);
    glow(c,615,220,275,'#edcc9a',.55);
    person(c,605,465,1.67,t,{kind:'young',pose:'carry'});
    text(c,'1974',217,298,115,{font:serif,color:'#eee0bf',weight:700,outline:4});
  },
  map,
  school: (c,t)=>schoolGroup(c,t,'school'),
  empty: (c,t)=>classScene(c,t,'empty'),
  visit: (c,t)=>visits(c,t),
  hands: (c,t)=>visits(c,t,true),
  idea: (c,t)=>headline(c,t,'idea'),
  funds: (c,t)=>headline(c,t,'funds'),
  news: (c,t)=>headline(c,t,'news'),
  turn(c,t){
    if(t<1.05){ headline(c,t+.8,'news'); return; }
    school(c,t);
    glow(c,497,287,300,'#fbd29c',.28);
  },
  gate: (c,t)=>schoolGroup(c,t,'gate'),
  classroom: (c,t)=>classScene(c,t,'classroom'),
  first: (c,t)=>schoolGroup(c,t,'first'),
  books: (c,t)=>books(c,t),
  trail: (c,t)=>trail(c,t,'trail'),
  miles: (c,t)=>trail(c,t,'miles'),
  speaker(c,t){
    corridor(c,t,.62);
    person(c,564+11*ease(t),480,1.65,t,{pose:'speaker'});
    person(c,743,383,.58,t,{kind:'student',pose:'read',index:2});
  },
  stairs(c,t){
    if(t<1.65){ stairs(c,t); return; }
    writing(c,t-.65);
  },
  exam(c,t){
    if(t<1.27){ writing(c,t,{exam:true}); return; }
    crop(c,-30,-17,1.055,()=>classScene(c,t,'classroom'));
  },
  closeBook: (c,t)=>books(c,t,true),
  depart: (c,t)=>schoolGroup(c,t,'depart'),
  count(c,t){
    schoolGroup(c,t,'depart');
    glow(c,498,144,258,'#8e6c4f',.42);
    text(c,'2000 多名',483,183,88,{color:gold,align:'center',font:serif,weight:700,outline:7});
  },
  graduate: (c,t)=>graduate(c,t,'graduate'),
  math: (c,t)=>classScene(c,t,'math'),
  doctor: (c,t)=>graduate(c,t,'doctor'),
  pass: (c,t)=>classScene(c,t,'pass'),
  girls(c,t){
    corridor(c,t,.88);
    person(c,410,469,1.42,t,{pose:'offer'});
    person(c,606,454,1.22,t,{kind:'student',pose:'read',facing:-1,index:2});
    person(c,739,453,1.14,t,{kind:'student',pose:'read',facing:-1,index:3});
  },
  lights(c,t){
    corridor(c,t,ease((t-.2)/1.46)*.9);
    person(c,697+t*18,428,1.12-t*.1,t,{pose:'walk'});
  },
  archive: archival,
  title(c,t){ corridor(c,t,.92); rect(c,0,0,W,H,'#19202b6b'); },
  credit(c,t){ corridor(c,t+3.5,.91); rect(c,0,0,W,H,'#19202b72'); },
};
