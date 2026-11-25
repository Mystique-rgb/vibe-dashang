import {box,clamp,glow,grad,line,oval,poly} from './palette.mjs';

// Forehead, chin, jaw, eye height/length, nose and hair contour are independent designs.
const types={
 ming:{brow:27,jaw:17,chin:-142,eye:5.5,nose:11,hair:'uneven',iris:'#776367',neck:9,head:.96},
 eri:{brow:25,jaw:12,chin:-139,eye:6.8,nose:8,hair:'long',iris:'#ae4756',neck:7,head:1.01},
 nono:{brow:26,jaw:15,chin:-142,eye:6.1,nose:10,hair:'tail',iris:'#bb604f',neck:8,head:.99},
 oldtang:{brow:27,jaw:23,chin:-144,eye:5.1,nose:15,hair:'crop',iris:'#847667',neck:12,head:1.01},
 ze:{brow:26,jaw:14,chin:-141,eye:6.1,nose:8,hair:'part',iris:'#a37760',neck:8,head:1.08},
 chu:{brow:28,jaw:19,chin:-137,eye:4.7,nose:16,hair:'part',iris:'#c68e3e',neck:11,head:.96},
 xia:{brow:24,jaw:13,chin:-146,eye:6.7,nose:8,hair:'bob',iris:'#824969',neck:7,head:1.04},
 herb:{brow:25,jaw:18,chin:-133,eye:4.3,nose:17,hair:'recede',iris:'#9b8a8f',neck:9,head:1.04},
 gen:{brow:29,jaw:20,chin:-136,eye:5.1,nose:14,hair:'part',iris:'#c38b4d',neck:11,head:1},
 guda:{brow:31,jaw:22,chin:-137,eye:4.8,nose:15,hair:'recede',iris:'#816c73',neck:12,head:1.03},
 caesar:{brow:29,jaw:23,chin:-138,eye:5.3,nose:14,hair:'slick',iris:'#83b9cb',neck:11,head:1},
 chen:{brow:24,jaw:14,chin:-141,eye:5.2,nose:8,hair:'bob',iris:'#775a68',neck:8,head:.98},
};
const fringes={
 uneven:[[-30,-186],[-33,-202],[-14,-223],[11,-225],[22,-219],[35,-204],[31,-184],[22,-199],[16,-188],[12,-202],[-1,-187],[-1,-197],[-14,-184],[-12,-192],[-24,-172]],
 sharp:[[-31,-181],[-29,-208],[-19,-222],[-11,-218],[4,-233],[13,-222],[30,-221],[38,-206],[31,-183],[20,-193],[15,-202],[9,-193],[6,-208],[-4,-200],[-9,-188],[-16,-194],[-27,-174]],
 long:[[-32,-169],[-35,-200],[-19,-224],[2,-229],[22,-223],[34,-209],[33,-176],[25,-192],[13,-184],[14,-196],[3,-187],[3,-191],[-8,-187],[-7,-198],[-22,-182],[-24,-172]],
 tail:[[-29,-176],[-34,-200],[-19,-222],[9,-224],[30,-208],[36,-194],[29,-180],[20,-197],[13,-191],[2,-201],[-7,-195],[-19,-178],[-26,-166]],
 bob:[[-34,-174],[-36,-197],[-24,-219],[-2,-226],[24,-218],[36,-205],[38,-177],[31,-157],[29,-171],[27,-191],[11,-192],[9,-201],[-7,-191],[-9,-197],[-19,-186],[-25,-151]],
 crop:[[-29,-181],[-32,-203],[-20,-216],[-3,-221],[13,-217],[28,-218],[37,-199],[31,-190],[20,-200],[11,-196],[0,-202],[-12,-191],[-13,-184],[-22,-177]],
 part:[[-30,-181],[-34,-202],[-23,-219],[-6,-224],[17,-225],[37,-208],[33,-189],[24,-191],[15,-202],[7,-213],[-1,-211],[-5,-200],[-19,-191],[-24,-174]],
 slick:[[-31,-179],[-34,-207],[-23,-221],[-7,-222],[14,-231],[28,-223],[41,-211],[35,-196],[21,-205],[10,-194],[1,-202],[-12,-189],[-19,-191],[-24,-175]],
 recede:[[-29,-173],[-31,-195],[-20,-212],[-4,-218],[16,-218],[29,-212],[34,-197],[30,-185],[26,-197],[21,-207],[10,-207],[-1,-205],[-12,-201],[-21,-193],[-24,-175]],
};
function shape(c,style,start,curves){c.fillStyle=style;c.beginPath();c.moveTo(...start);for(const x of curves)c.bezierCurveTo(...x);c.closePath();c.fill();}
function fall(c,s,d,name,view,t){
 const side=view==='side', back=view==='back', shift=Math.sin(t*1.7)*3.4;
 const color=grad(c,-35,-219,29,-91,d.edge,d.hair,'#261d31');
 if(s.hair==='long'){
  shape(c,color,[-24,-218],[[-56,-212,-44,-156,-48,-110],[-46,-89,-56+shift,-73,-49+shift,-59],[-37,-69,-18,-68,-12,-79],[-3,-70,15+shift,-64,32+shift,-63],[31,-79,48,-116,42,-161],[49,-194,36,-233,5,-226],[-12,-230,-20,-226,-24,-218]]);
  for(let j=0;j<6;j++)line(c,j%2?d.edge:'rgba(224,132,141,.32)',.8+j*.14,[[-25+j*10,-208],[-30+j*12,-165],[-28+j*12,-127],[-39+j*13+shift,-76-j*2]]);
 }else if(s.hair==='tail'){
  shape(c,color,[-21,-201],[[-47,-206,-62,-188,-51,-159],[-44,-141,-47+shift,-124,-75+shift,-105],[-48,-103,-24,-129,-23,-153],[-15,-170,-7,-189,-21,-201]]);
  line(c,'#db9188',1.4,[[-35,-195],[-49,-175],[-50,-145],[-64+shift,-119]]);
 }else if(s.hair==='bob'){
  shape(c,color,[-25,-211],[[-49,-194,-32,-157,-42,-139],[-24,-136,-19,-145,-11,-144],[0,-143,18,-128,41,-146],[35,-161,49,-189,34,-209],[25,-229,-10,-225,-25,-211]]);
 }
}
export function portrait(c,d,name,view,{p=0,t=0,variant}={}){
 const s=types[name]||types.ming,side=view==='side',back=view==='back',g=s.hair==='long'||s.hair==='bob'||s.hair==='tail';
 const {brow:b,jaw:j,chin,nose:n}=s;
 c.save();c.translate(0,-155);c.scale(s.head,s.head);c.translate(0,155);
 if(g)fall(c,s,d,name,view,t);
 const warm=variant==='ember';const rim=warm?'#edbf75':d.edge;
 box(c,grad(c,-s.neck,-164,s.neck+3,-139,d.dim,d.skin),-s.neck,-165,s.neck*2+4,27);
 if(!back){
  const skin=grad(c,-35,-199,29,-155,d.dim,d.skin,warm?'#ffe0a4':'#efcbb5');
  if(side){
   shape(c,skin,[-b,-196],[[-17,-218,26,-216,27,-193],[28,-189,23,-181,27,-176],[28,-172,28+n,-171,27+n,-166],[24+n,-163,25,-165,27,-159],[32,-154,24,-153,24,-149],[26,-145,j+2,chin,j-3,chin],[-4,chin-1,-20,-154,-b+4,-174],[-34,-185,-30,-191,-b,-196]]);
   poly(c,`rgba(${g?'142,74,89':'111,65,83'},.26)`,[[-25,-182],[-10,-172],[1,-161],[j+7,chin-9],[j-3,chin],[-14,-150],[-24,-165]]);
   line(c,'rgba(255,212,177,.55)',1,[[16,-188],[23,-180],[28+n,-168]]);
   oval(c,d.dim,-12,-168,6.5,8.5);line(c,'rgba(240,162,145,.58)',.95,[[-14,-173],[-10,-175],[-8,-169],[-13,-165]]);
   if(g)oval(c,'#eab492',-9,-161,1.8,2.2);
   line(c,name==='chu'?'#36282d':'#573a45',g?1.25:1.9,[[12,-186],[21,-188],[28,-185+(name==='chu'?2:0)]]);
   eye(c,21,-181,s.eye,warm?'#f1aa48':s.iris,p,g,.95);
   line(c,name==='oldtang'?'#75434d':'#9a6068',1.1,[[17,-155],[25,-156+(g?1:0)],[30,-155]]);
  }else{
   shape(c,skin,[-b,-194],[[-17,-220,22,-214,b,-196],[b+4,-192,b+3,-177,b,-172],[b-1,-157,j,-145,7,chin],[-6,chin-1,-j,-145,-b,-169],[-b-3,-180,-b-6,-190,-b,-194]]);
   poly(c,'rgba(103,53,83,.24)',[[-b,-192],[-10,-183],[-7,-163],[-10,chin-5],[6,chin],[-j,-147],[-b,-169]]);
   poly(c,'rgba(255,227,201,.24)',[[4,-182],[12,-177],[12,-163],[22,-158],[16,-153],[2,-160]]);
   for(const side of [-1,1]){const x=side*(s.eye+8);line(c,'#593d46',g?1.3:1.95,[[x-5,-188],[x+1,-189],[x+6,-187]]);eye(c,x,-182,s.eye,warm?'#ec9a34':s.iris,p,g,.99);}
   line(c,'rgba(141,80,89,.69)',1.1,[[2,-176],[4,-168],[1,-165]]);
   line(c,'#8e5962',1.3,[[-6,-154],[3,-153-(name==='chu'?1:0)],[8,-155]]);
  }
 }
 const hair=grad(c,-34,-219,34,-173,rim,d.hair,'#191a25');
 const edge=fringes[s.hair];
 if(back){shape(c,hair,[-31,-176],[[-44,-212,-20,-231,3,-228],[32,-231,44,-205,34,-169],[26,-146,8,-149,-8,-147],[-26,-149,-28,-160,-31,-176]]);}
 else poly(c,hair,edge.map(([x,y])=>[side?x:x*.91,y]));
 for(let i=0;i<6;i++){
  const k=i-2.5;
  const sweep=s.hair==='part'?10:s.hair==='sharp'?-9:s.hair==='long'?3:-2;
  line(c,`rgba(234,204,194,${i%2?.19:.10})`,.75+i*.11,[[k*7-9,-216+Math.abs(k)*2],[k*11-12,-210],[k*12+sweep,-201+Math.abs(k)*3],[k*13+sweep,-193+Math.abs(k)*1.7]]);
 }
 if(s.hair==='long'){
  const x=side?-23:-26;line(c,'#ed9e9a',1.35,[[x,-205],[x-4,-183],[x-3,-160],[x+2,-140]]);
  for(const dir of [-1,1]){const k=dir*(side?6:7);poly(c,grad(c,x+k,-185,x+k+7,-179,'#f7d5b4','#cc7275'),[[x+k,-189],[x+k+7,-188],[x+k+6,-185],[x+k-1,-185]]);}
 }
 if(s.hair==='tail'){oval(c,'#7a344d',-34,-182,6,8);line(c,'#ef987d',2.3,[[-36,-186],[-30,-187]]);}
 if(name==='herb'||name==='guda'){
  c.strokeStyle=name==='herb'?'#8c6775':'#aa9ca4';c.lineWidth=1.5;
  for(const x of (side?[23]:[-13,13])){c.beginPath();c.ellipse(x,-181,name==='herb'?7:9,name==='herb'?5.5:6.5,0,0,6.283);c.stroke();}
  if(!side)line(c,'#91828d',1.15,[[-5,-182],[0,-184],[5,-182]]);
  if(name==='herb'){line(c,'rgba(111,72,83,.63)',1,[[10,-171],[20,-170],[26,-170]]);line(c,'rgba(111,72,83,.48)',1,[[7,-162],[12,-156],[14,-151]]);}
 }
 if(warm&&!back){if(side)glow(c,'249,151,66',23,-181,19,.28);else for(const x of [-13,13])glow(c,'249,151,66',x,-181,17,.22);}
 c.restore();
}
function eye(c,x,y,r,iris,p,g,w){
 const blink=Math.abs(p-.71)<.043?clamp(Math.abs(p-.71)/.043,.16,1):1;
 const h=r*(g?.52:.43)*blink;
 shape(c,'#eecfc4',[x-r,y],[[x-r*.58,y-h,x+r*.48,y-h,x+r,y],[x+r*.53,y+h*.73,x-r*.6,y+h*.91,x-r,y]]);
 oval(c,iris,x+1.6,y-.17,r*.44,Math.max(1,h*.94));oval(c,'#362c36',x+2.1,y-.2,r*.20,Math.max(.65,h*.81));
 oval(c,'#ffefda',x+.55,y-h*.41,.82,Math.max(.48,h*.28));
 line(c,'#543541',g?1.24:.99,[[x-r,y],[x-r*.4,y-h*.82],[x+r*.44,y-h*.83],[x+r,y]]);
}
