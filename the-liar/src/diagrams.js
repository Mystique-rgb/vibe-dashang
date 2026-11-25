import { TAU,GOLD,CREAM,RED,BLUE,MONO,SERIF,clamp,mix,out,smooth,hash,line,oval,polygon,text,card,glow } from './fx.js';
import { drawTitle } from './title.js';
import { roomFly,wrongVoteGlitch,clockTicks,taleEntrances,taleDepartures,seatArrivals,ruleTicks,ruleFailure,comparisonHit,verdictHits } from './marked-timing.js';
import { impactAmount,impactRing } from './impact-pulse.js';

const TABLE = {x:960,y:521,rx:570,ry:237};
function seat(i, radius = 1) {
  const a = -Math.PI / 2 + i*TAU/9;
  return [TABLE.x+Math.cos(a)*TABLE.rx*radius,TABLE.y+Math.sin(a)*TABLE.ry*radius];
}
function figure(c, x, y, r, {edge = GOLD, chosen = false, label = ''} = {}) {
  oval(c,x,y,r,r,chosen?'#702a25':'#1b292b',1,true);
  oval(c,x,y,r,r,edge,chosen?4:2);
  oval(c,x,y-r*.17,r*.24,r*.24,edge,1,true);
  c.fillStyle=edge; c.beginPath(); c.ellipse(x,y+r*.50,r*.47,r*.32,0,Math.PI,TAU); c.fill();
  if(label) text(c,label,x,y+r+27,25,{family:MONO,color:edge});
}
function arrow(c,x1,y1,x2,y2,color,width=3) {
  line(c,x1,y1,x2,y2,color,width);
  const a = Math.atan2(y2-y1,x2-x1);
  polygon(c,[[x2,y2],[x2-16*Math.cos(a-.45),y2-16*Math.sin(a-.45)],[x2-16*Math.cos(a+.45),y2-16*Math.sin(a+.45)]],color);
}
function table(c, f) {
  const {x,y,rx,ry}=TABLE;
  oval(c,x,y+24,rx,ry,'#060809',1,true);
  const g = c.createLinearGradient(x,y-ry,x,y+ry); g.addColorStop(0,'#263735'); g.addColorStop(1,'#101b20');
  oval(c,x,y,rx,ry,g,1,true); oval(c,x,y,rx,ry,'#bb8656',3); oval(c,x,y,rx-20,ry-17,'#d8bc826a',1.5);
  for(let i=0;i<9;i++) {
    const a=-Math.PI/2+i*TAU/9;
    line(c,x+Math.cos(a)*(rx-52),y+Math.sin(a)*(ry-32),x+Math.cos(a)*(rx-36),y+Math.sin(a)*(ry-20),'#d6ae7260',2);
  }
  const breath = 1 + f.pulse*.09;
  oval(c,x,y,145*breath,63*breath,'#ecbd762b',2);
}

function room(c,f) {
  const flying=clamp((f.time-roomFly.start)/(roomFly.land-roomFly.start));
  const drift=1420*(1-flying)**2.25;
  const after=Math.max(0,f.time-roomFly.land);
  const settle=-48*Math.sin(after*24)*Math.exp(-after*12);
  const enter=out(flying);
  c.save(); c.translate(960+drift+settle,521-(1-flying)*43); c.rotate((1-flying)*.11);
  c.scale(.88+.12*enter,.82+.18*enter); c.translate(-960,-521);
  if(flying<1) {
    c.save(); c.globalAlpha=(1-flying)*.61;
    for(let i=0;i<14;i++) {
      const y=320+hash(i+91)*396, x=1105+hash(i+4)*490;
      line(c,x,y,x+140+hash(i+13)*290,y-12,GOLD,1.3+2*hash(i));
    }
    c.restore();
  }
  table(c,f);
  let occupied=0;
  const focus=seatArrivals.findLastIndex(at=>f.time>=at);
  for(let i=0;i<9;i++) {
    const arrival=seatArrivals[i];
    const q=out((f.time-arrival+.10)/.22);
    const [x,y]=seat(i,1.02);
    const [xx,yy]=seat(i,.42);
    if(f.time>=arrival)occupied++;
    c.save(); c.globalAlpha=.34;
    oval(c,x,y,46,46,GOLD,2); c.restore();
    if(q<=0)continue;
    c.save(); c.globalAlpha=q;
    const newest=i===focus;
    const bounce=Math.sin(q*Math.PI);
    figure(c,mix(x+105*Math.sin(i*TAU/9),x,q),mix(y-108,y,q),46+bounce*11,
      {edge:newest?BLUE:GOLD});
    line(c,x,y,mix(x,xx,q),mix(y,yy,q),newest?'#8ee9d8ad':'#e2c17d32',newest?3:1.5);
    if(newest)impactRing(c,x,y,45,45,impactAmount(f.time,[arrival],.18),BLUE);
    c.restore();
  }
  text(c,String(occupied),960,509,183,{family:MONO,color:GOLD});
  text(c,'名参与者',960,634,40,{color:CREAM});
  c.restore();
}

function deal(c,f) {
  const selection=out((f.local-1.16)/.54);
  for(let i=0;i<9;i++) {
    const q=out((f.local-.08-i*.105)/.49);
    if(q<=0)continue;
    const focus=i===4;
    const arc=Math.sin(q*Math.PI);
    const x=mix(969,394+i*141,q);
    const y=mix(742,595+Math.sin(i*.65)*28,q)-114*arc+selection*29;
    const rot=(i-4)*.068*q+(1-q)*.72;
    const width=118+26*arc;
    if(q<.97) {
      c.save(); c.globalAlpha=arc*.47;
      line(c,x-106*arc*Math.sign(i-4),y+108*arc,x,y+55,GOLD,3);
      c.restore();
    }
    card(c,x,y,width,width*1.50,{rot,alpha:q*(focus?1:1-selection*.39),back:true});
  }
  if(selection<=0)return;
  const turn=smooth((f.local-1.34)/.74);
  const x=960+Math.sin(f.time*2.2)*13;
  const y=mix(630,516,selection)+Math.sin(f.local*5.1)*12;
  glow(c,x,y,295,turn>.5?'#f479495c':'#c69e5753');
  card(c,x,y,157+selection*151,222+selection*201,{rot:-.17*(1-selection)+Math.sin(f.time*2.3)*.06,
    face:turn>.51?'说谎者':'',pale:turn>.51,scaleX:Math.max(.035,Math.abs(Math.cos(turn*Math.PI))),red:turn>.51});
}

function vote(c,f) {
  const pop=out(f.local/.48);
  const write=smooth((f.local-.59)/1.05);
  const stamp=out((f.local-1.78)/.29);
  const marks=[[-8,-46],[10,-83],[48,-101],[101,-99],[146,-80],[169,-48],[167,-12],[146,15],[112,39],[85,61],[82,91]];
  const segment=Math.min(marks.length-2, Math.floor(write*(marks.length-1)));
  const u=write*(marks.length-1)-segment;
  const tipX=mix(marks[segment][0],marks[segment+1][0],u);
  const tipY=mix(marks[segment][1],marks[segment+1][1],u);
  c.save(); c.translate(960,532+122*(1-pop)); c.scale(.72+pop*.28,.72+pop*.28);
  c.rotate(mix(-.24,-.023,pop)+Math.sin(f.time*2)*.014);
  const grad=c.createLinearGradient(-420,-209,420,209); grad.addColorStop(0,'#e9d9b1'); grad.addColorStop(1,'#bb995f');
  polygon(c,[[-423,-194],[410,-194],[427,190],[-421,194]],grad,'#f4dcb2',3);
  for(let y=-121;y<190;y+=35) line(c,-380,y,377,y,'#56290024',1.2);
  text(c,'投票纸',-343,-105,37,{align:'left',color:'#472d1d'});
  text(c,'姓名',-344,35,61,{align:'left',family:SERIF,color:'#4a2718'});
  line(c,-169,126,347,126,'#87603c',3);
  c.beginPath(); c.moveTo(...marks[0]);
  for(let i=1;i<=segment;i++) c.lineTo(...marks[i]);
  c.lineTo(tipX,tipY); c.strokeStyle='#742c23'; c.lineWidth=13; c.lineJoin='round'; c.lineCap='round'; c.stroke();
  if(stamp>0) oval(c,82,113,8*stamp,8*stamp,'#742c23',1,true);
  const lift=out((f.local-1.61)/.65);
  c.translate(tipX+lift*209,tipY-lift*121); c.rotate(.88-lift*.52); c.translate(0,-139);
  polygon(c,[[-18,-116],[18,-116],[18,97],[0,139],[-18,97]],'#242025','#b7794e',2);
  line(c,-7,-103,-7,96,'#b48a5c',2);
  polygon(c,[[-8,117],[0,139],[8,117]],'#c99766'); c.restore();
}

function threat(c,f) {
  const fail=out((f.local-1.08)/.26);
  for(let i=0;i<2;i++) {
    const p=out((f.local-i*.15)/.44);
    if(p<=0)continue;
    const x=(i?1300:620)+(i?1:-1)*(1-p)*170;
    const color=i?RED:BLUE;
    c.save(); c.globalAlpha=p;
    const stage=c.createLinearGradient(x,297,x,744); stage.addColorStop(0,i?'#3d1e24':'#162f31'); stage.addColorStop(1,'#0e151a');
    polygon(c,[[x-287,278],[x+261,278],[x+288,307],[x+288,754],[x-286,754]],stage,color,2.5);
    text(c,i?'错一票':'八票全对',x,409,73,{color});
    for(let n=0;n<8;n++) {
      const q=out((f.local-.26-i*.24-n*.065)/.23);
      const px=x+(n-3.5)*63, miss=i&&n===7&&fail>0;
      const wave=i?out((f.local-1.24-(7-n)*.072)/.26):0;
      const py=541+(1-q)*31;
      c.save(); c.globalAlpha*=q;
      oval(c,px,py,24*q+(miss?5*fail:0),24*q+(miss?5*fail:0),miss?'#c23d32':wave>.18?'#4f2d31':'#523c32',1,true);
      text(c,miss?'×':'✓',px,py,miss?40:29,{color:miss?CREAM:wave>.18?RED:GOLD});
      if(wave>0&&wave<1)oval(c,px,py,25+27*wave,25+27*wave,'#fc7057',1.5);
      c.restore();
    }
    const result=out((f.local-(i?1.61:.77))/.39);
    c.globalAlpha=result;
    text(c,i?'其余人出局':'说谎者出局',x,651+(1-result)*19,48,{color:i?'#ff9b83':CREAM});
    if(i)impactRing(c,x+221,541,33,33,impactAmount(f.time,[ruleFailure],.29),RED);
    else impactRing(c,x,541,249,37,impactAmount(f.time,ruleTicks,.17),BLUE);
    const upset=f.time-wrongVoteGlitch;
    if(i&&upset>=0&&upset<.19) {
      c.globalAlpha=.55*(1-upset/.19);
      for(let band=0;band<8;band++) {
        const jitter=hash(band+Math.floor(upset*80)*13);
        const y=308+hash(band+45)*428;
        c.fillStyle=band%3===0?'#4ee3cf':'#ff503f';
        c.fillRect(x-296+jitter*79,y,118+jitter*414,2+jitter*8);
      }
      text(c,'错一票',x+19*(1-upset/.19),409,73,{color:'#ff3f5a'});
    }
    c.restore();
  }
  line(c,944,309,974,734,'#e1b879a8',3);
}

function tales(c,f) {
  for(let i=0;i<9;i++) {
    const a=i*TAU/9-.7;
    const x=960+Math.cos(a)*570,y=528+Math.sin(a)*218;
    const bx=960+Math.cos(a)*185,by=528+Math.sin(a)*92;
    const entry=taleEntrances[i], exit=taleDepartures[i];
    const age=f.time-entry, leave=f.time-exit;
    const active=age>=0&&leave<.15;
    const arrival=out(age/.19);
    const fade=1-smooth(leave/.15);
    const level=active?arrival*fade:0;
    line(c,x,y,bx,by,level>.10?RED:'#e5b86d50',2+level*2.8);
    figure(c,x,y,41+level*6,{edge:level>.32?RED:GOLD,chosen:level>.43});
    if(!active)continue;
    const travel=out(age/.24);
    const tail=out(leave/.15);
    const px=mix(x,bx,travel)+Math.cos(a)*tail*76;
    const py=mix(y,by,travel)-13*tail;
    c.save(); c.globalAlpha=level;
    glow(c,px,py,58+tail*56,'#fa775c73');
    text(c,'？',px,py-21,54+arrival*11,{color:CREAM});
    if(leave>=0)oval(c,px,py,27+tail*40,19+tail*32,'#ef9167',1.4);
    c.restore();
  }
  const beat=Math.max(impactAmount(f.time,taleEntrances,.23),.65*impactAmount(f.time,taleDepartures,.15));
  const scale=1+beat*.22;
  oval(c,960,525,166*scale,110*scale,'#0a151a',1,true);
  oval(c,960,525,166*scale,110*scale,'#d8a86a',2+beat*2);
  text(c,'无从核对',960,525,58*scale,{family:SERIF,color:CREAM});
  impactRing(c,960,525,172,116,beat,GOLD);
}

function gloss(c,x,y,xx,yy,color) {
  line(c,x,y,xx,yy,`${color}5c`,8);
  line(c,x,y,xx,yy,color,2);
}

function clue(c,f) {
  const diff=f.headline==='空气不够';
  const q=out(f.local/.6), drift=Math.sin(f.time*1.6)*10;
  const turn=Math.sin(f.local*1.69);
  const x=diff?635:876,y=544,side=(diff?350:468)*(1+.055*turn);
  const A=[x-side*.63,y-side*.34], B=[x+side*.40,y-side*.34];
  const depth=.26+.083*turn;
  const C=[B[0]+side*depth,y-side*.58], D=[A[0]+side*depth,y-side*.58];
  const E=[A[0],A[1]+side*.71], F=[B[0],B[1]+side*.71], G=[C[0],C[1]+side*.71];
  c.save(); c.translate(0,drift*(1-q*.4)); c.globalAlpha=.45+.55*q;
  polygon(c,[A,B,C,D],'#839c9b37',BLUE,2.2);
  polygon(c,[A,B,F,E],'#2842439d',BLUE,2.2);
  polygon(c,[B,C,G,F],'#4674675c',BLUE,2.2);
  for(let i=1;i<4;i++) {
    const s=i/4;
    line(c,mix(A[0],B[0],s),A[1],mix(E[0],F[0],s),E[1],'#8fe9d861',1.2);
    line(c,A[0],mix(A[1],E[1],s),B[0],mix(B[1],F[1],s),'#8fe9d861',1.2);
    line(c,mix(A[0],B[0],s),A[1],mix(D[0],C[0],s),D[1],'#8fe9d861',1.2);
  }
  const scan=mix(A[1],E[1],(f.local*.52)%1);
  const width=B[0]-A[0];
  const scanGradient=c.createLinearGradient(0,scan-55,0,scan);
  scanGradient.addColorStop(0,'#74ffe300'); scanGradient.addColorStop(1,'#74ffe34f');
  c.save(); c.beginPath(); c.rect(A[0],A[1],width,E[1]-A[1]); c.clip();
  c.fillStyle=scanGradient; c.fillRect(A[0],scan-55,width,55);
  gloss(c,A[0],scan,B[0],scan,'#9dffe8');
  for(let i=0;i<25;i++) {
    const a=hash(i+324), b=hash(i+74);
    const sx=A[0]+width*((a+f.time*.09)%1);
    const sy=A[1]+(E[1]-A[1])*((b+f.time*(.12+a*.11))%1);
    c.fillStyle=i%4===0?'#a3f6d990':'#a6edce4e';
    c.fillRect(sx,sy,2+a*5,2+a*3);
  }
  c.restore();
  const reading=Math.round(48*out((f.local-.23)/1.01));
  text(c,String(diff?48:reading),mix(A[0],B[0],.5),mix(A[1],E[1],.56),side*.27,{family:MONO,color:CREAM,stroke:5});
  c.restore();
  if(diff) {
    const bg = '#162932';
    const gx=1122,gw=360;
    text(c,'房间容量',gx,371,35,{align:'left',color:BLUE});
    text(c,'九人估算用量',gx,528,35,{align:'left',color:RED});
    for(const [yy,value,col,delay] of [[424,48,BLUE,.19],[582,49.14,RED,.75]]) {
      const n=out((f.local-delay)/1.16);
      const edge=gx+gw*(value/52)*n;
      c.fillStyle=bg; c.fillRect(gx,yy,gw,28);
      if(n>0) {
        glow(c,edge,yy+14,57,`${col}63`);
        c.fillStyle=col; c.fillRect(gx,yy,edge-gx,28);
        const shown=value===48?Math.round(value*n):((value*n).toFixed(2));
        text(c,`${shown} m³`,1520,yy+12,37,{family:MONO,align:'left',color:col});
      }
    }
    const threshold=out((f.local-1.47)/.57);
    if(threshold>0) {
      const xx=gx+gw*48/52;
      gloss(c,xx,406,xx,406+229*threshold,'#ffd591');
      const strike=out((f.local-2.04)/.40);
      if(strike>0)text(c,'容量上限',xx-13,678,34,{align:'right',color:GOLD});
    }
    impactRing(c,1454,581,53,43,impactAmount(f.time,[comparisonHit],.36),RED);
  } else {
    const xx=1410,yy=485;
    oval(c,xx,yy,99,99,'#111d20',1,true); oval(c,xx,yy,99,99,GOLD,3.2);
    for(let i=0;i<12;i++) { const a=i*TAU/12; line(c,xx+75*Math.cos(a),yy+75*Math.sin(a),xx+87*Math.cos(a),yy+87*Math.sin(a),GOLD,3); }
    const tickCount=clockTicks.reduce((total,at)=>total+out((f.time-at)/.094),0);
    const latest=clockTicks.findLast(at=>at<=f.time);
    const impulse=latest===undefined?0:1-out((f.time-latest)/.25);
    const tick=-2.32+.73*tickCount;
    if(impulse>0) {
      c.save(); c.globalAlpha=impulse*.81;
      oval(c,xx,yy,104+22*(1-impulse),104+22*(1-impulse),GOLD,2.3); c.restore();
    }
    line(c,xx,yy,xx+67*Math.cos(tick),yy+67*Math.sin(tick),RED,4);
    line(c,xx,yy,xx+47*Math.cos(-1.6+tick/12),yy+47*Math.sin(-1.6+tick/12),CREAM,5);
    text(c,'座钟',xx,650,38,{color:GOLD});
    text(c,'地砖格线',511,685,38,{color:BLUE});
  }
}

function flip(c,f) {
  let open=0;
  for(let i=0;i<9;i++) {
    const col=i%5, row=i<5?0:1;
    const enter=out((f.local-i*.042)/.38);
    const delay=.30+Math.floor(i/3)*.68+(i%3)*.145;
    const turn=smooth((f.local-delay)/.53);
    const show=turn>.5;
    if(show)open++;
    if(enter<=0)continue;
    const x=mix(960,(row?615:500)+col*230,enter);
    const b=Math.sin(turn*Math.PI);
    const y=mix(780,row?655:385,enter)-b*59+Math.sin(f.time*2+i*.57)*(7+4*f.pulse);
    const width=Math.max(.043,Math.abs(Math.cos(turn*Math.PI)));
    if(b>.1)glow(c,x,y,163,`rgba(246,106,67,${b*.37})`);
    card(c,x,y,168+29*b,239+39*b,{scaleX:width,face:show?'说谎者':'',red:show,
      rot:(col-2)*.037+(1-enter)*.42+b*.085,alpha:enter});
  }
  const t=out((f.local-.42)/.25);
  if(t<=0)return;
  c.save(); c.globalAlpha=t;
  text(c,`${open} / 9`,1595,559,117,{family:MONO,color:open===9?'#ff9777':GOLD});
  text(c,open===9?'全是说谎者':'已翻牌',1595,655,42,{color:CREAM}); c.restore();
}

function host(c,f,image) {
  const q=out(f.local/.50), x=486+(1-q)*77+Math.sin(f.local*2.37)*18;
  c.save(); c.globalAlpha=q;
  glow(c,x+80,525,390,'#775638a0');
  oval(c,x+110,532,294,294,GOLD,2.3);
  for(let i=0;i<4;i++) {
    const at=f.local*1.3+i*TAU/4;
    c.beginPath(); c.arc(x+110,532,305+i*12,at,at+.55);
    c.lineWidth=i===0?4:2; c.strokeStyle=i%2?BLUE:GOLD; c.stroke();
  }
  c.save(); c.beginPath(); c.arc(x+110,530,286,0,TAU); c.clip();
  const w=650+37*f.progress,h=w*image.height/image.width;
  c.drawImage(image,x-w*.44,252,w,h); c.restore();
  text(c,'主持人',x+110,816,43,{color:GOLD,stroke:5});
  c.restore();
  const t=out((f.local-.25)/.65);
  if(t>0) {
    arrow(c,876,528,876+220*t,528,RED,4);
    c.save(); c.globalAlpha=t;
    const g=c.createLinearGradient(1085,326,1735,710); g.addColorStop(0,'#4c2d27'); g.addColorStop(1,'#1a181d');
    polygon(c,[[1130,332],[1695,332],[1718,356],[1718,696],[1130,696]],g,GOLD,2.4);
    text(c,'「造神」',1426,515,126,{family:SERIF,color:CREAM});
    c.restore();
  }
}

function verdict(c,f) {
  let count=0;
  for(let i=0;i<9;i++) {
    const a=i*TAU/9-.3;
    const x=960+Math.cos(a)*588, y=537+Math.sin(a)*234;
    const stopX=960+Math.cos(a)*157, stopY=537+Math.sin(a)*127;
    const launch=.25+i*.235;
    const k=out((f.local-launch)/.68);
    const arc=Math.sin(k*Math.PI);
    const px=mix(x,stopX,k),py=mix(y,stopY,k)-arc*66;
    const counted=f.time>=verdictHits[i];
    if(counted)count++;
    if(k>0)arrow(c,x,y,mix(x,stopX,k),mix(y,stopY,k),'#ef926f9c',1+k*2);
    if(k<.996)card(c,px,py,88-31*k,124-53*k,{pale:true,face:k>.20?'人羊':'',rot:(i-4)*.085+arc*.35,alpha:.93-k*.78});
    oval(c,x,y,42,42,counted?'#a84638':'#20292a',1,true);
    oval(c,x,y,42,42,counted?'#ff9873':'#bf955e',2.4);
    text(c,counted?'✓':String(i+1).padStart(2,'0'),x,y,36,{family:MONO,color:counted?CREAM:GOLD});
  }
  const punch=impactAmount(f.time,verdictHits,.22);
  glow(c,960,537,307+punch*55,'#a74a36a8');
  oval(c,960,537,151+punch*34,115+punch*26,'#742d28',1,true);
  oval(c,960,537,151+punch*34,115+punch*26,GOLD,3);
  text(c,count===9?'人羊':`${count} / 9`,960,539,(count===9?103:88)*(1+punch*.12),{family:count===9?SERIF:MONO,color:CREAM,stroke:4});
  impactRing(c,960,537,157,122,punch,GOLD);
}

function end(c,f) {
  const q=out(f.local/.62);
  const a=1-q;
  for(let i=0;i<7;i++) {
    const side=i-3;
    if(i===3) continue;
    const wave=Math.sin(f.local*3.5-i*.63);
    const x=960+side*(132+q*64+wave*19);
    card(c,x,601+side*side*12+wave*42,138,226,{rot:side*.12+wave*.077,alpha:.70-Math.abs(side)*.10,red:i%2===0});
  }
  glow(c,960,560,420,'#567a7270');
  card(c,960,548+Math.sin(f.time*1.7)*12+50*a,244,343,
    {rot:Math.sin(f.local*2.4)*.113,face:'？',pale:true,scaleX:.82+Math.cos(f.local*2.06)*.18});
}

const DIAGRAMS={title:drawTitle,room,deal,vote,threat,tales,clue,flip,host,verdict,end};
export function drawDiagram(c,f,image) {
  DIAGRAMS[f.kind](c,f,image);
}
