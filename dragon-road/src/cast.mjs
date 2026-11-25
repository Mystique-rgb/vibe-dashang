import {box,grad,glow,line,oval,poly,label,clamp,mix} from './palette.mjs';
import {portrait} from './portraits.mjs';

const designs={
 ming:{hair:'#101c2d',edge:'#7691a4',base:'#273950',light:'#6d8da9',skin:'#d1a694',dim:'#8f6d71',extra:'#a9bccb'},
 eri:{hair:'#642638',edge:'#cf7e86',base:'#a44758',light:'#f0bdaf',skin:'#f5c5b0',dim:'#c28483',extra:'#e8d7c8'},
 nono:{hair:'#772c41',edge:'#e39585',base:'#40303c',light:'#8c6e86',skin:'#e6b1a1',dim:'#a37778',extra:'#bf6c78'},
 oldtang:{hair:'#191e22',edge:'#c6a170',base:'#473a39',light:'#917463',skin:'#cc9a80',dim:'#88616a',extra:'#a68462'},
 ze:{hair:'#252b38',edge:'#b7a1ae',base:'#1e223a',light:'#63758d',skin:'#e3ae9d',dim:'#936c7b',extra:'#e1bd83'},
 chu:{hair:'#101a25',edge:'#809bb3',base:'#222f45',light:'#4c5e75',skin:'#cca399',dim:'#8d6973',extra:'#a5c0cd'},
 xia:{hair:'#322837',edge:'#b496af',base:'#4e6279',light:'#ad7d8e',skin:'#ecc0a9',dim:'#b48389',extra:'#e9bec1'},
 herb:{hair:'#7b777c',edge:'#b7a4a9',base:'#30263d',light:'#603e56',skin:'#bba1a3',dim:'#826974',extra:'#a38e99'},
 gen:{hair:'#151b2b',edge:'#9d7887',base:'#282b3c',light:'#62647d',skin:'#deb5a6',dim:'#936c78',extra:'#9a818d'},
 caesar:{hair:'#98714a',edge:'#e2bd85',base:'#858da0',light:'#dae1e0',skin:'#ecc1ad',dim:'#a87b7d',extra:'#e7be86'},
 chen:{hair:'#242335',edge:'#aa8b9e',base:'#54435d',light:'#a98190',skin:'#e7b6a4',dim:'#9c7484',extra:'#ca9ba5'},
 guda:{hair:'#b4a49b',edge:'#cdb5a9',base:'#535564',light:'#827783',skin:'#d4ab97',dim:'#977d7e',extra:'#ddc0a7'},
};
function curve(c,color,start,controls){c.fillStyle=color;c.beginPath();c.moveTo(...start);for(const s of controls)c.bezierCurveTo(...s);c.closePath();c.fill();}
function limb(c,a,b,d,w,color,shine){
 c.lineCap='round'; c.lineJoin='round';
 line(c,'#172131',w+5,[a,b,d]);line(c,color,w,[a,b,d]);
 line(c,shine,Math.max(1,w*.12),[[a[0]-w*.23,a[1]],[b[0]-w*.17,b[1]],[d[0]-w*.2,d[1]-w*.1]]);
}
export function actor(c,name,x,y,size,o={}){
 const {facing=1,pose='stand',view='side',t=0,p=0,variant,force,tilt=0}=o,d0=designs[name]||designs.ming;
 const d={...d0};
 if(name==='eri'){if(variant==='casual'){d.base='#95828c';d.light='#e1c6a9';}else{d.base='#cab4ac';d.light='#f3ded0';}}
 if(variant==='ember'){d.base='#293941';d.light='#887772';d.edge='#dabb89';}
 if(variant==='school'){d.base='#2d3a51';d.light='#748799';}if(variant==='dive'){d.base='#213b49';d.light='#53828a';}
 const builds={ming:.86,eri:.73,nono:.79,oldtang:.99,ze:.71,chu:.91,xia:.74,herb:.87,gen:.91,guda:.98,caesar:1.02,chen:.75};
 const s=size/226,build=builds[name]??.9,walking=pose==='walk'||pose==='run',run=pose==='run', swim=pose==='swim', sit=pose==='sit',kneel=pose==='kneel';
 const phase=t*(run?15:8),swing=Math.sin(phase)*(run?24:walking?14:swim?12:0), bounce=walking?-Math.abs(Math.cos(phase))*(run?5:2):0;
 c.save();c.translate(x,y);c.scale(s*facing*build,s);c.translate(0,bounce);
 c.rotate(tilt);
 if(pose==='fallen'){c.translate(0,-20);c.rotate(-1.39);c.translate(-41,0);}else if(swim){c.translate(0,-20);c.rotate(.63);}else if(run)c.rotate(.13);
 const bodyY=sit?40:kneel?24:0, torsoX=view==='side'?-2:0, back=view==='back';
 if(!swim&&pose!=='fallen')oval(c,'rgba(4,8,14,.32)',5,3,43,7);
 const legA=sit?[[0,-69+bodyY],[44,-47],[49,-4]]:kneel?[[0,-67+bodyY],[38,-17],[7,-6]]:[[0,-85],[11-swing*.64,-43],[-8-swing, -3]];
 const legB=sit?[[11,-62+bodyY],[57,-46],[62,-5]]:kneel?[[13,-67+bodyY],[47,-9],[31,-3]]:[[11,-82],[17+swing*.72,-42],[12+swing,-3]];
 const skirt=name==='eri'&&variant!=='casual';
 limb(c,...legA,skirt?28:16,'#283145','#4b5267');limb(c,...legB,skirt?28:17,'#354154',d.edge);
 for(const l of [legA,legB]){const [lx,ly]=l[2];poly(c,'#141d2a',[[lx-10,ly-5],[lx+7,ly-5],[lx+17,ly+4],[lx-11,ly+4]]);line(c,d.edge,.7,[[lx-4,ly+2],[lx+13,ly+2]]);}
 if(skirt){poly(c,grad(c,-33,-98,42,-33,'#58283e','#a24153','#6c304a'),[[-25,-105],[25,-105],[44+swing*.2,-25],[-36-swing*.33,-26]]);for(let i=0;i<5;i++)line(c,'#c46974',1.4,[[-21+i*10,-104],[-30+i*17,-29]]);}
 c.translate(torsoX,bodyY);
 const arm=Math.sin(phase)*(run?32:walking?19:0);
 const attack=pose==='strike', recoil=pose==='recoil', reach=pose==='reach'||attack, q=attack?(force??Math.sin(Math.PI*clamp(p*1.27))):clamp(p*2), aa=reach?37+(attack?56:23)*q:run?19:7;
 if(attack)c.rotate(.06+.12*q);if(recoil)c.rotate(-.11-p*.46);
 limb(c,[-21,-139],[-26-arm*.19,-108],[-22-arm*.7,-80],12,d.base,d.edge);
 const coat=grad(c,-36,-134,38,-86,'#182538',d.base,d.light);
 curve(c,coat,[-33,-142],[[-23,-154,-12,-154,-6,-148],[3,-140,14,-151,23,-150],[34,-146,34,-127,27,-110],[25,-97,32,-78,37,-70],[9,-64,-21,-68,-37,-79],[-30,-98,-31,-117,-33,-142]]);
 line(c,d.edge,1.4,[[-31,-141],[-22,-146],[-15,-145],[4,-134],[19,-147],[27,-143]]);
 if(skirt){poly(c,'#ecd2c7',[[-26,-141],[-12,-147],[5,-123],[19,-148],[29,-138],[9,-105],[-12,-120]]);line(c,'#923d52',6,[[-27,-99],[24,-99]]);}
 else if(!back){poly(c,'#b0aaa8',[[-13,-144],[0,-125],[15,-148],[16,-120],[3,-106],[-10,-125]]);line(c,d.extra,1.3,[[4,-127],[3,-91],[-1,-73]]);line(c,'rgba(185,204,222,.43)',1,[[-23,-93],[-12,-94]]);}
 else {line(c,d.edge,2,[[-17,-143],[-13,-127],[-4,-122],[6,-122],[17,-141]]);line(c,'rgba(178,201,224,.35)',1,[[-15,-103],[-10,-83],[19,-80]]);}
 const cloth=skirt?'rgba(150,101,119,.40)':'rgba(195,211,218,.29)';
 line(c,cloth,1.2,[[-26,-133],[-24,-115],[-30,-81]]);line(c,cloth,.85,[[17,-132],[12,-107],[22,-86]]);
 for(let k=0;k<4;k++)line(c,cloth,.67,[[-14+k*5,-76],[-10+k*6,-79-k*.66]]);
 const a=[21,-137], b=[attack?23+49*q:reach?48:30+arm*.3,attack?-107-30*q:reach?-127:-111-(run?7:0)], hand=[reach?aa+16:31+arm*.81,reach?-137+9*q:-82-(run?19:0)];
 limb(c,a,b,hand,skirt?20:14,d.base,d.edge);oval(c,d.skin,hand[0]+3,hand[1]+3,attack?8:4.8,attack?6.7:7);
 if(attack&&q>.44)line(c,d.dim,1.1,[[hand[0],hand[1]],[hand[0]+6,hand[1]-1]]);
 if(!back&&name==='chu'){poly(c,'#3a4b5d',[[-20,-145],[-6,-130],[12,-146],[19,-136],[7,-120],[-6,-121]]);line(c,'#a0b6bc',1,[[-17,-142],[-4,-128],[12,-141]]);}
 if(!back&&name==='herb'){poly(c,'#564153',[[-29,-145],[-16,-151],[1,-133],[19,-151],[33,-143],[25,-109],[7,-123],[-6,-115]]);line(c,'#a3879b',1,[[-27,-143],[-14,-146],[-1,-134],[18,-147]]);}
 if(name==='gen'){line(c,'#d2b391',3,[[-37,-142],[28,-78]]);}
 if(name==='caesar'){line(c,'#e1b67b',1.8,[[-31,-137],[-22,-146],[10,-144],[27,-136]]);oval(c,'#d7a570',-18,-124,3,3);}
 if(name==='xia'&&!back){line(c,'#c5939e',5,[[-13,-137],[10,-132],[18,-142]]);}
 portrait(c,d,name,view,{p,t,variant});
 c.restore();
}
function palm(c,flip,x,y,shade,contact){
 c.save();c.translate(x,y);c.scale(flip,1);
 const sleeve=flip===1?'#31475c':'#a76a79', trim=flip===1?'#7196ac':'#eac6bd';
 poly(c,grad(c,-188,-35,-56,37,'#131c31',sleeve,trim),[[-212,-68],[-115,-48],[-59,-21],[-52,24],[-125,50],[-212,62]]);
 line(c,trim,1.5,[[-169,-46],[-145,-37],[-119,-35],[-61,-14]]);
 poly(c,flip===1?'#567185':'#edcdca',[[-80,-25],[-56,-30],[-44,18],[-68,27]]);
 const skin=grad(c,-57,-23,48,24,shade,'#d3a599',shade);
 curve(c,skin,[-53,-24],[[-31,-23,-30,-25,-10,-21],[0,-17,14,-21,28,-14],[45,-15,61,-10,58,-2],[55,4,41,3,28,5],[32,7,48,8,47,14],[44,23,26,13,20,14],[26,19,35,22,30,28],[25,33,7,21,0,22],[-3,28,-15,27,-27,21],[-38,17,-47,19,-53,19],[-58,10,-56,-13,-53,-24]]);
 curve(c,grad(c,14,-8,27,22,'#e7ba9f','#aa7980'),[-24,-2],[[-11,-9,8,-11,13,-7],[23,-1,16,6,11,9],[0,14,-6,8,-14,13],[-23,11,-28,6,-24,-2]]);
 line(c,'rgba(112,71,79,.73)',1,[[28,5],[21,6],[13,6]]);line(c,'rgba(255,210,185,.30)',.85,[[-36,-18],[-17,-17],[0,-14],[16,-15]]);line(c,'#976474',1,[[25,16],[17,15],[11,13]]);if(!contact){line(c,'rgba(248,218,190,.45)',1,[[39,-9],[47,-8],[51,-6]]);line(c,'rgba(111,72,79,.32)',1,[[-20,11],[-6,16],[5,17]]);}
 if(contact){for(let i=0;i<3;i++){const yy=6+i*8;curve(c,grad(c,9,yy-2,48,yy+7,'#af817d','#deb4a2'),[5+i*4,yy],[[10,yy-6,28,yy-5,42-i*5,yy-3],[51-i*7,yy-2,51-i*7,yy+4,41-i*5,yy+5],[26,yy+5,10,yy+6,5+i*4,yy]]);}}
 c.restore();
}
export function hands(c,x,y,size,{variant='open',p=0,light='warm'}={}){
 c.save();c.translate(x,y);c.scale(size/410,size/410);
 const contact=variant==='clasp', spread=variant==='release'?mix(23,119,p):contact?mix(41,19,clamp(p*3+.38)):variant==='miss'?mix(49,105,p):mix(112,63,p);
 if(light==='warm')glow(c,'255,191,136',3,8,145,.34);else glow(c,'249,79,105',0,0,154,.23);
 palm(c,1,-spread,variant==='miss'?-12:9,'#b68387',contact);
 palm(c,-1,spread,variant==='miss'?30:-9,'#c78e8f',contact);
 c.restore();
}
export function prop(c,key,x,y,size,o={}){
 const {p=0,text='', angle=0,light}=o;
 c.save();c.translate(x,y);c.rotate(angle);c.scale(size/200,size/200);
 const g=grad(c,-100,-60,94,72,'#ad9aa0','#e3d0b8','#b7a0a0');
 if(key==='letter'||key==='notebook'||key==='card'){
  const book=key==='notebook';const w=book?160:199,h=book?132:97;
  box(c,'#251f30',-w/2-5,-h/2-4,w+10,h+13);box(c,g,-w/2,-h/2,w,h);
  if(book){box(c,'#623f50',-w/2-5,-h/2-5,15,h+12);for(let i=0;i<8;i++)line(c,'rgba(100,77,82,.25)',.8,[[-w/2+22,-h/2+18+i*14],[w/2-12,-h/2+18+i*14]]);}
  else if(key==='letter'){line(c,'#ac8683',2,[[-100,-45],[0,14],[99,-45]]);line(c,'rgba(105,80,84,.35)',1,[[-99,42],[-35,-6]]);}
  if(text){const chars=text.length;label(c,text.slice(0,Math.ceil(chars*(.40+.60*clamp(p*1.7)))),book?5:0,book?3:5,Math.min(key==='card'?46:22,133/Math.max(3,chars*.79)),book?'#57424d':'#55303b');}
 }else if(key==='keyboard'||key==='handheld'){
  const hh=key==='handheld';box(c,'#151e2b',-101,-hh*19-31,203,hh?100:67);box(c,'#566478',-99,-hh*19-31,200,3);
  if(hh){box(c,'#395e72',-59,-34,122,62);box(c,'#8eb3b5',-55,-32,115,1);for(let i=0;i<21;i++)box(c,`rgba(182,232,211,${i%4===0?.44:.12})`,-48+(i%9)*11,-18+Math.floor(i/9)*13,5,3);oval(c,'#aa6072',80,-1,6,6);oval(c,'#8495ab',-83,4,6,6);}
  else for(let j=0;j<4;j++)for(let i=0;i<15;i++){box(c,i===7&&j===2?'#c39391':'#586071',-94+i*12.8,-27+j*14,10.5,10);box(c,'#8392a1',-94+i*12.8,-28+j*14,10,1);}
 }else if(key==='cup'){
  poly(c,grad(c,-28,0,28,0,'#583e54','#c98f84','#795763'),[[-35,-46],[34,-46],[24,44],[-23,44]]);oval(c,'#b78e84',0,-46,35,10);oval(c,'#533445',0,-45,29,6);for(let i=0;i<3;i++)line(c,'rgba(251,206,188,.29)',1,[[i*11-13,-57],[i*9-17+Math.sin(p*5+i)*10,-71],[i*11-23,-84]]);
 }else if(key==='medkit'){
  box(c,'#bba8ae',-94,-58,187,123);box(c,'#314056',-94,30,187,35);box(c,'#5f6c7b',-33,-76,69,16);box(c,'#ac4a63',-6,-34,14,48);box(c,'#ac4a63',-25,-17,52,14);
 }else if(key==='sword'||key==='pen'){
  line(c,key==='sword'?'#bac7d7':'#60536a',key==='sword'?7:5,[[-87,39],[92,-49]]);line(c,'#eed7dc',1.4,[[-81,36],[94,-51]]);line(c,'#443e58',8,[[-98,44],[-65,29]]);
 }else if(key==='lamp'||key==='lock'||key==='ring'){
  const rgb=light==='red'?'239,75,101':'147,234,242';if(key==='lamp')glow(c,rgb,46,2,147,.48);box(c,'#343647',-68,-26,137,56);box(c,'#687285',-66,-23,132,6);line(c,key==='lamp'?'#bcecf0':'#d18e94',7,[[53,-24],[53,24]]);oval(c,'#202838',-35,1,13,12);
 }else if(key==='bubble'){
  c.strokeStyle='#a7dce4';c.lineWidth=2;c.beginPath();c.ellipse(0,0,55,49,.27,0,6.283);c.stroke();glow(c,'147,233,240',-16,-27,49,.3);
 }
 c.restore();
}
