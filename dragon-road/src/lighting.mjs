import {W,H,box,grad,glow,line,oval,poly,random,clamp} from './palette.mjs';

// Coordinates describe physical lights in the scene, independent of the camera.
const layouts={
 room:[[862,490,'91,199,245',270],[1430,280,'153,156,244',410],[371,625,'255,160,83',250]],
 interview:[[1210,275,'142,214,243',540],[280,590,'255,180,103',470]],
 hall:[[320,276,'179,151,249',360],[1560,340,'252,182,98',470]],
 cinema:[[960,380,'133,186,249',530],[220,660,'245,135,128',260]],
 school:[[978,324,'145,199,255',445],[1430,442,'252,185,102',360]],
 rail:[[959,592,'160,211,255',438],[1710,392,'224,177,136',270]],
 water:[[418,220,'83,242,216',560],[1468,320,'98,159,249',560],[984,795,'252,206,114',430]],
 chamber:[[807,658,'255,143,54',640],[1483,224,'195,118,241',430],[200,535,'220,102,75',460]],
 station:[[363,386,'135,244,220',450],[1408,257,'255,205,121',420]],
 tunnel:[[949,559,'167,225,226',470],[412,219,'142,141,255',310],[1540,563,'255,185,96',480]],
 tokyo:[[303,388,'112,209,255',490],[1357,367,'245,79,162',540],[1598,662,'251,162,78',370]],
 tower:[[1114,382,'120,226,246',525],[361,619,'180,147,250',420]],
 hotel:[[528,367,'131,199,246',420],[1443,367,'254,161,102',502]],
 river:[[343,499,'161,194,245',510],[1539,466,'255,175,136',605]],
 shop:[[1210,276,'249,225,155',615],[519,483,'103,206,195',415]],
 car:[[500,549,'111,193,255',430],[1397,475,'247,88,128',545]],
 redwell:[[342,367,'90,166,230',490],[1486,344,'254,65,72',632],[1014,765,'250,144,83',540]],
 corridor:[[304,353,'112,180,251',460],[1391,479,'251,68,93',652]],
 exit:[[1041,367,'150,219,250',641],[349,589,'245,111,112',424]],
 dawn:[[1485,458,'255,198,113',758],[471,516,'199,181,236',470]],
};
const wet=new Set(['rail','car','tokyo','station','tunnel','water','redwell','corridor','exit','river','dawn']);
const beams=new Set(['hall','school','cinema','tower','water','chamber','tunnel','redwell','corridor','exit']);
export function lightScene(c,key,{id,t,p},front=false){
 const lights=layouts[key]||layouts.hall;
 c.save();c.globalCompositeOperation=front?'screen':'lighter';
 for(let i=0;i<lights.length;i++){
  const [x,y,rgb,r]=lights[i];const offset=Math.sin(t*.75+i*3)*28;
  const flash=key==='redwell'&&id>=63?.11*Math.exp(-p*8):0;
  const flicker=.9+.1*Math.sin(t*(i+1)*2.6+id*.31);
  glow(c,rgb,x+offset,y,r,(front?.086:.215)*flicker+flash);
  if(front)continue;
  if(wet.has(key)){
   const floorY=['river','dawn'].includes(key)?590:741;
   for(let j=0;j<7;j++){
    const a=random(j*26+i*31), xx=x+offset+(a-.5)*190, yy=floorY+j*j*5+Math.sin(j*7+t*1.6)*12;
    line(c,`rgba(${rgb},${.15-j*.012})`,1+a*3,[[xx-(16+j*12),yy],[xx+(15+j*12),yy]]);
   }
  }
  if(beams.has(key)&&i===0){
   const span=155+Math.sin(t*.53)*28;
   poly(c,grad(c,x,y-100,x+350,y+670,`rgba(${rgb},.22)`,`rgba(${rgb},.06)`,`rgba(${rgb},0)`),[[x-8,y-234],[x+35,y-235],[x+span+524,y+679],[x-212,y+679]]);
   line(c,`rgba(${rgb},.32)`,2,[[x-7,y-42],[x+46,y-42]]);
  }
 }
 if(front){
  const color=lights.at(-1)[2];
  for(let i=0;i<23;i++){
   const a=random(i*57+id*77),b=random(i*19+22),dir=key==='dawn'?3:1;
   const x=(a*W+t*(13+b*20)*dir)%W,y=(b*H-t*(7+a*33)+H*50)%H;
   oval(c,`rgba(${color},${.08+b*.22})`,x,y,1+a*3,.75+a*1.7);
  }
 }
 c.restore();
}
