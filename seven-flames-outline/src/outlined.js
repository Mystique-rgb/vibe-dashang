const clamp = x => Math.max(0, Math.min(1, x));
const TAU = 2 * Math.PI;
const tint = (s,a) => s + Math.round(clamp(a)*255).toString(16).padStart(2,'0');
const mix = (a,b,t) => a+(b-a)*t;

// Closed silhouettes in a square coordinate space. Open paths add fins, scales and flames.
const lotus = (petal,spread,rise,base) => Array.from({length:petal},(_,i)=>{
  const u=(2*i/(petal-1))-1, x=u*spread, y=base-rise*(1-.72*Math.abs(u)**1.4);
  const w=.075+.035*Math.abs(u);
  return [[u*.065,base],[x*.56-w,base-.115],[x-w,y+.076],[x,y],[x+w,y+.086],[x*.60+w,base-.064]];
});
const paths = {
  19:{body:[...lotus(7,.462,.31,.28),[[-.21,.26],[-.11,.19],[-.06,.05],[.09,-.13],[.14,-.37],[.20,-.20],[.18,-.02],[.06,.20],[.19,.27]]],
    veins:[[[-.42,.29],[-.22,.32],[0,.34],[.25,.31],[.40,.28]], [[-.02,.14],[.02,.03],[.096,-.06],[.107,-.18]]]},
  15:{body:[[[-.015,.42],[-.225,.28],[-.327,.09],[-.290,-.13],[-.11,-.28],[-.184,-.13],[-.165,-.021],[-.078,-.111],[.056,-.29],[.093,-.47],[.206,-.29],[.13,-.101],[.24,-.162],[.322,-.264],[.317,-.055],[.373,.12],[.289,.29],[.11,.382]]],
    veins:Array.from({length:5},(_,i)=>Array.from({length:32},(_,j)=>{const a=j/31;const x=(.028+.28*a)*Math.cos(a*TAU*1.02+i*1.24);const y=(.023+.245*a)*Math.sin(a*TAU*1.02+i*1.24);return [x,y+.09-a*.03];}))},
  11:{body:[[[-.02,.43],[-.19,.31],[-.31,.29],[-.355,.085],[-.30,-.114],[-.225,.043],[-.176,-.064],[-.21,-.31],[-.065,-.203],[.031,-.075],[.103,-.20],[.118,-.474],[.227,-.304],[.214,-.126],[.275,-.03],[.344,-.234],[.357,.036],[.29,.247],[.151,.328]]],
    veins:Array.from({length:10},(_,i)=>{const z=i%2?1:-1,j=Math.floor(i/2);return [[0,.291-j*.086],[z*(.10+j*.014),.227-j*.086],[z*(.22+j*.016),.259-j*.108],[z*(.23+j*.018),.132-j*.087]];})},
  3:{body:[...lotus(9,.485,.49,.306),[[-.21,.18],[-.215,.011],[-.089,-.104],[-.141,-.279],[.012,-.198],[.104,-.475],[.184,-.326],[.155,-.182],[.258,-.257],[.244,-.045],[.09,.154],[.21,.239],[.017,.313]]],
    veins:[[[0,.28],[-.115,.129],[-.124,.006],[-.052,-.053],[.076,-.016],[.121,.109],[0,.28]]]},
};

function sample(points,closed=true){
  const out=[], n=points.length;
  const get=i=>points[closed?(i+n)%n:Math.max(0,Math.min(n-1,i))];
  const edges=closed?n:n-1;
  // Subdividing by chord length gives steady pen speed on long and short curves.
  for(let i=0;i<edges;i++){
    const a=get(i-1),b=get(i),c=get(i+1),d=get(i+2);
    const count=Math.max(3,Math.ceil(Math.hypot(c[0]-b[0],c[1]-b[1])*80));
    for(let j=0;j<count;j++){
      const t=j/count;
      out.push(b.map((v,k)=>.5*((2*v)+(-a[k]+c[k])*t+(2*a[k]-5*v+4*c[k]-d[k])*t*t+(-a[k]+3*v-3*c[k]+d[k])*t*t*t)));
    }
  }
  out.push(closed?out[0]:points.at(-1));
  return out;
}

function coil(points,width){
  const spine=sample(points,false), left=[],right=[];
  for(let i=0;i<spine.length;i++){
    const [x,y]=spine[i], a=spine[Math.max(0,i-1)], b=spine[Math.min(spine.length-1,i+1)];
    const vx=b[0]-a[0],vy=b[1]-a[1],d=Math.hypot(vx,vy)||1;
    const r=width*(.08+.92*(i/(spine.length-1))**.64);
    left.push([x-vy/d*r,y+vx/d*r]);right.push([x+vy/d*r,y-vx/d*r]);
  }
  return {spine, body:[...left,...right.reverse()]};
}
const snake=coil([[.04,.425],[.242,.346],[.258,.229],[.071,.182],[-.238,.161],[-.339,.051],[-.263,-.082],[-.043,-.05],[.226,-.02],[.313,-.15],[.242,-.275],[.104,-.288],[-.02,-.238]],.085);
paths[14]={body:[snake.body,[[.10,-.313],[.041,-.355],[-.072,-.338],[-.166,-.293],[-.197,-.248],[-.171,-.206],[-.092,-.211],[.021,-.24]]],
  veins:[snake.spine, [[-.194,-.247],[-.109,-.256],[-.048,-.246]], [[-.178,-.254],[-.162,-.285],[-.114,-.278]]],
  cut:[[[.019,-.305],[-.026,-.300],[-.076,-.284],[-.025,-.278]]], pupils:[[-.028,-.288]]};

const dragon=coil([[.422,-.345],[.222,-.392],[.059,-.352],[-.146,-.283],[-.309,-.176],[-.334,-.017],[-.253,.148],[-.092,.17],[.061,.103]],.102);
paths[9]={body:[dragon.body,
  [[-.234,-.308],[-.265,-.402],[-.139,-.312],[-.073,-.433],[-.06,-.248],[.019,-.134],[.077,-.186],[.155,-.115],[.322,-.374],[.339,-.438],[.361,-.306],[.312,-.133],[.261,-.047],[.303,-.041],[.413,-.088],[.317,.053],[.366,.084],[.272,.152],[.244,.273],[.143,.375],[.072,.467],[-.017,.406],[-.064,.31],[-.148,.301],[-.234,.218],[-.296,.185],[-.231,.127],[-.327,.021],[-.245,.029],[-.341,-.151],[-.202,-.063],[-.137,-.129]],
  [[-.305,.108],[-.406,.146],[-.414,.254],[-.31,.263],[-.235,.226],[-.167,.213],[-.218,.282],[-.349,.323],[-.448,.269],[-.451,.173]],
  [[.263,.127],[.378,.111],[.434,.159],[.423,.243],[.38,.26],[.415,.173],[.368,.162],[.282,.207]]],
  veins:[dragon.spine, [[-.252,-.019],[-.137,.057],[-.116,.133],[-.023,.179],[.022,.286],[.075,.305],[.228,.275]],[[.304,-.255],[.221,-.043],[.144,.025],[.122,.143],[.051,.185]],[[.093,.389],[.074,.351],[.197,.244]], [[-.193,.217],[-.095,.235],[-.016,.289],[.06,.296],[.14,.247]]],
  cut:[[[-.226,.093],[-.127,.089],[-.049,.16],[-.139,.148]],[[.083,.149],[.168,.071],[.242,.053],[.178,.139]], [[-.029,.309],[.069,.309],[.173,.265],[.111,.338],[.043,.360]]],pupils:[[-.125,.122],[.164,.111]]};

paths[2]={body:[
  [[-.042,.476],[-.146,.396],[-.221,.226],[-.325,.159],[-.411,.006],[-.313,.054],[-.378,-.202],[-.331,-.442],[-.259,-.254],[-.177,-.137],[-.188,-.327],[-.103,-.178],[0,-.077],[.112,-.25],[.127,-.4],[.204,-.219],[.213,-.072],[.294,-.184],[.369,-.463],[.419,-.238],[.386,-.057],[.464,-.142],[.381,.061],[.27,.207],[.208,.347],[.087,.449]],
  [[-.32,.127],[-.436,.03],[-.48,-.092],[-.42,-.045],[-.368,.052]],
  [[.273,.182],[.381,.109],[.468,-.048],[.448,.125],[.344,.243]]],
  veins:[[[0,-.109],[-.028,.023],[.026,.135],[-.044,.226],[.01,.257],[.079,.213],[.061,.131],[.113,.034]], [[-.36,-.212],[-.257,-.009],[-.213,.085],[-.109,.169],[-.174,.242],[-.143,.337]],[[.341,-.242],[.291,-.063],[.214,.016],[.164,.156],[.225,.171],[.172,.301]], [[-.102,.356],[-.024,.404],[.061,.402],[.132,.362]]],
  cut:[[[-.284,.065],[-.185,.085],[-.064,.173],[-.141,.192],[-.222,.137]], [[.273,.031],[.181,.080],[.073,.173],[.165,.156],[.236,.10]], [[-.163,.229],[-.104,.291],[-.084,.267],[-.027,.317],[.017,.283],[.047,.324],[.102,.266],[.126,.295],[.185,.215],[.155,.325],[.077,.367],[-.055,.376],[-.137,.327]]],pupils:[[-.156,.128],[.160,.118]]};

function trace(c,points,fraction=1){
  const count=(points.length-1)*clamp(fraction),end=Math.floor(count);
  c.beginPath();c.moveTo(...points[0]);
  for(let i=1;i<=end;i++)c.lineTo(...points[i]);
  if(end<points.length-1){
    const a=points[end],b=points[end+1];
    c.lineTo(mix(a[0],b[0],count-end),mix(a[1],b[1],count-end));
  }
}
for(const shape of Object.values(paths)){
  shape.body=shape.body.map(points=>points.length>55?[...points,points[0]]:sample(points));
  shape.veins=shape.veins.map(points=>sample(points,false));
  shape.cut=shape.cut?.map(points=>sample(points));
}
const shades={19:'#074938',15:'#092a8c',14:'#705227',11:'#283a59',9:'#231158',3:'#9e356c',2:'#1a104e'};
function eye(c,x,y,light,age){
  const glow=c.createRadialGradient(x,y,0,x,y,.071);
  glow.addColorStop(0,tint(light,.89*age));glow.addColorStop(1,tint(light,0));
  c.fillStyle=glow;c.fillRect(x-.071,y-.071,.142,.142);
  c.fillStyle=tint(light,age);c.beginPath();c.ellipse(x,y,.011,.014,.38,0,TAU);c.fill();
}
export function drawOutlined(c,item,{x,y,size,time,reveal,hit}){
  const g=clamp(reveal), shape=paths[item.rank];
  if(g<=0)return;
  c.save();c.translate(x,y);c.scale(size,size);c.rotate(.017*Math.sin(time*2.8)*(1+.5*hit));
  c.lineJoin='round';c.lineCap='round';
  const dark=shades[item.rank];
  const fill=c.createLinearGradient(-.34,-.34,.26,.34);
  fill.addColorStop(0,tint(item.color,.81));fill.addColorStop(.36,dark);
  fill.addColorStop(.66,item.rank===2?'#241956':tint(item.color,.84));fill.addColorStop(1,tint(item.light,.81));
  const pool=c.createRadialGradient(0,.05,.03,0,.05,.59);
  const mass=clamp((g-.25)/.46);
  pool.addColorStop(0,tint(item.color,mass*(.18+.08*hit)));pool.addColorStop(1,tint(item.color,0));
  c.fillStyle=pool;c.fillRect(-.64,-.53,1.28,1.12);
  for(let i=0;i<shape.body.length;i++){
    const outline=shape.body[i];
    const lag=i*.24/Math.max(1,shape.body.length-1);
    const progress=clamp((g-lag)/(.77-lag*.40));
    if(progress<=0)continue;
    const colored=clamp((progress-.17)/.68)*mass;
    if(colored>0){
      trace(c,outline,clamp(progress+.06));
      if(progress<.94){const a=outline[0], b=outline[Math.floor(outline.length*.55)];c.lineTo((a[0]+b[0])/2,(a[1]+b[1])/2);}
      c.closePath();c.fillStyle=fill;
      c.save();c.globalAlpha=colored*.98;c.fill();c.restore();
    }
    trace(c,outline,progress);
    c.strokeStyle=tint(item.color,.19+.13*hit);c.lineWidth=.026;c.stroke();
    c.strokeStyle=tint(item.color,.55+.22*hit);c.lineWidth=.010;c.stroke();
    c.strokeStyle=tint(item.light,.61+.24*(1-mass)+.12*hit);c.lineWidth=.0039;c.stroke();
    if(progress<1){
      const [px,py]=outline[Math.floor(progress*(outline.length-1))];
      eye(c,px,py,item.light,.72);
    }
  }
  for(let i=0;i<shape.veins.length;i++){
    const progress=clamp((g-.30-i*.028)/.44);
    if(progress<=0)continue;
    trace(c,shape.veins[i],progress);
    c.strokeStyle=tint(item.light,(.22+.37*mass)*(i%3===0?1:.72));
    c.lineWidth=i%3===0?.0058:.0038;c.stroke();
  }
  const eyes=clamp((g-.57)/.29);
  if(eyes>0){
    for(let i=0;i<(shape.cut?.length||0);i++){
      const hole=shape.cut[i];trace(c,hole);c.closePath();
      c.fillStyle=tint(item.rank===2?'#070619':'#100b1d',eyes*.96);c.fill();
      c.strokeStyle=tint(item.light,eyes*(i===2?.58:.82));c.lineWidth=i===2?.005:.007;c.stroke();
    }
    for(const [ex,ey] of shape.pupils||[])eye(c,ex,ey,item.rank===2?'#c2e7ff':item.light,eyes);
  }
  for(let i=0;i<39;i++){
    const t=(time*(.34+(i%11)*.025)+i*.618)%1;
    const a=i*2.39996+t*.52,r=.28+t*(.18+(i%9)*.021);
    const sx=Math.cos(a)*r, sy=Math.sin(a)*r;
    c.fillStyle=tint(i%4===0?item.light:item.color,clamp(g*2-i*.028)*Math.sin(t*Math.PI)*(.36+.33*hit));
    c.fillRect(sx,sy,.0028+(i%4)*.0013,.004+(i%4)*.0017);
  }
  c.restore();
}
