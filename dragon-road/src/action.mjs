import {actor,prop} from './cast.mjs';
import {box,clamp,glow,grad,line,mix,oval,poly,random,smooth} from './palette.mjs';

function burst(c,x,y,t,rgb='255,179,96',scale=1){
 if(t<0||t>.48)return;
 const p=t/.48,en=(1-p)**2;
 glow(c,rgb,x,y,(243+125*p)*scale,.65*en);
 for(let i=0;i<42;i++){
  const a=random(i*7+2)*6.283,speed=38+random(i*9)*575;
  const d=(.11+p*1.1)*speed*scale,dx=Math.cos(a)*d,dy=Math.sin(a)*d*.61+120*p*p;
  line(c,`rgba(${rgb},${(.34+random(i)*.62)*en})`,(1+random(i*5)*3)*scale,[[x+dx,y+dy],[x+dx+Math.cos(a)*(32+14*en)*scale,y+dy+Math.sin(a)*32*scale]]);
 }
 c.strokeStyle=`rgba(${rgb},${.5*en})`;c.lineWidth=4*scale;c.beginPath();c.ellipse(x,y,(37+328*p)*scale,(18+107*p)*scale,-.22,0,6.283);c.stroke();
}
function stoneDragon(c,x,y,t,p){
 c.save();c.translate(x,y);
 const upper=[[315,220],[206,146],[125,103],[54,43],[-31,36],[-84,-5],[-155,-12],[-225,10],[-310,60],[-257,92],[-186,91],[-127,121],[-49,116],[22,153],[56,214],[152,259],[266,298]];
 const swing=8*Math.sin(t*3.1),pts=upper.map(([x,y],i)=>[x,y+swing*Math.sin(i*.62)]);
 c.scale(1.15+.12*p,1.15+.12*p);
 poly(c,grad(c,-220,-40,300,273,'#839395','#405169','#1c2638'),pts);
 poly(c,grad(c,-120,-131,220,170,'#515e73','#2f3550','#1a2638'),[[50,111],[126,26],[156,-138],[228,-40],[302,-92],[361,-38],[318,104],[291,223],[161,163]]);
 for(let i=0;i<5;i++)poly(c,'#516274',[[39+i*40,41+i*16],[39+i*40,-32+i*10],[90+i*35,55+i*15]]);
 line(c,'#bec0ab',3,[[-280,65],[-231,25],[-172,14],[-101,18],[-67,38],[-12,52],[42,59]]);
 line(c,'#9a9b99',3,[[-269,74],[-219,72],[-170,59],[-99,72]]);
 for(let i=0;i<7;i++)poly(c,i%2?'#859895':'#637b81',[[-239+i*15,76-i*1.6],[-232+i*15,94-i*1.3],[-221+i*15,73-i*1.7]]);
 for(let i=0;i<33;i++){const a=random(i*4+1),b=random(i*8+6),x=-144+a*352,y=50+b*67+(x+144)*.41;line(c,'rgba(198,193,159,.32)',1.6,[[x-10,y+9],[x,y],[x+13,y+1]]);}
 glow(c,'255,202,99',-127,39,54,.73);oval(c,'#f8c07b',-127,39,12,5);oval(c,'#60354a',-123,38,2.4,5);
 c.restore();
}
export function fenrir(c,{id,t,p}){
 c.save();
 if(id===25){stoneDragon(c,1315,359,t,p);actor(c,'ming',534,929,531,{pose:'stand',view:'back',variant:'school',t,p});}
 else{
  const hit=clamp((p-.23)/.45),drift=smooth(hit);
  stoneDragon(c,1394+185*drift,284+214*drift,t,p);
  actor(c,'ming',681+129*smooth(p),976-112*Math.sin(p*Math.PI),670,{pose:'strike',variant:'ember',t,p});
  prop(c,'sword',830+251*smooth(p),606-102*Math.sin(p*Math.PI),454,{angle:mix(-.68,.66,smooth(hit))});
  burst(c,1094,568,t-37.60,'255,197,99',1.25);
  if(p>.19&&p<.53){const q=1-(p-.19)/.34;poly(c,`rgba(223,220,183,${.28*q})`,[[657,720],[968,477],[1299,367],[992,550]]);}
 }
 c.restore();
}

const fighter=(c,name,x,y,size,pose,facing,t,p,variant,extra={})=>actor(c,name,x,y,size,{pose,facing,t,p,variant,view:'side',...extra});
const pulse=(t,h)=>t<h?smooth((t-h+.22)/.22):1-smooth((t-h)/.22);
const impact=(t,hits)=>Math.max(...hits.map(h=>pulse(t,h)));
function streak(c,x,y,e){if(e<.27)return;const a=e*.72;for(let j=0;j<5;j++)line(c,`rgba(255,198,138,${a*(.45-j*.07)})`,4-j*.5,[[x-205-j*36,y-18+j*9],[x+60+j*20,y-48+j*13]]);}
const timing={64:[89.59],65:[90.93,91.50],66:[93.00],67:[93.86]};
export function redwellFight(c,{id,t,p}){
 c.save();
 if(id===64){
  const q=smooth(p);fighter(c,'herb',1289-85*q,973,655,'reach',-1,t,p);fighter(c,'ming',488+244*q,942,613,'run',1,t,p,'ember');
  prop(c,'lock',1201-109*q,565+49*q,201,{angle:-.29+q*.16,light:'red'});
 }else if(id===65){
  const e=impact(t,timing[id]);
  fighter(c,'ming',732+175*smooth(p)+58*e,959,705,'strike',1,t,p,'ember',{force:e});
  fighter(c,'herb',1135+245*smooth(p)+32*e,984-42*Math.sin(p*Math.PI),674,'recoil',-1,t,e*.80);
  streak(c,1091+186*p,590,e);
  const q=smooth((p-.18)*2);prop(c,'lock',1151+440*q,646-245*Math.sin(q*Math.PI)+289*q,229,{angle:q*6.5,light:'red'});
 }else if(id===66){
  const e=impact(t,timing[id]);
  fighter(c,'ming',737+140*smooth(p)+68*e,976,635,'strike',1,t,p,'ember',{force:e,tilt:-.08*e});
  fighter(c,'herb',1155+178*smooth(p)+44*e,923+47*p,605,'recoil',-1,t,.4+e*.58);
  streak(c,1099+141*p,637,e);
  const q=smooth(p),x=1210+411*q,y=773+84*q;prop(c,'medkit',x,y,212,{angle:-.21+p*2.8});
  for(let i=0;i<8;i++){const a=random(i*57),k=random(i*73);box(c,`rgba(225,159,117,${.43*(1-p)})`,1170+q*620*a,744+q*154*k,3+a*13,3);}
 }else if(id===67){
  fighter(c,'herb',1396+34*smooth(p),847,430,'fallen',-1,t,p);
  fighter(c,'ming',865-150*smooth(p),939,573,'reach',-1,t,p*.62,'ember');
  fighter(c,'eri',612,1011,614,'reach',1,t,p,'casual');
 }
 for(const cue of timing[id]||[])burst(c,id===64?1083:id===65?1132:1270,id===67?739:609,t-cue,id===67?'238,127,109':'255,175,105',id===65?1.31:1.04);
 c.restore();
}
