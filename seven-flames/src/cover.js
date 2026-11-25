import {drawFlame} from './flames.js';
import {ITEMS} from './timeline.js';

const W=1080, H=1440, TAU=2*Math.PI;
const hero=ITEMS.at(-1);
const sans='"Microsoft YaHei", sans-serif';
const serif='"SimSun", serif';

function label(c,value,y,size,color,{family=sans,weight=600,spacing='0px'}={}){
  c.font=`${weight} ${size}px ${family}`;
  c.letterSpacing=spacing;
  c.fillStyle=color;
  c.textAlign='center';
  c.fillText(value,W/2,y,940);
  c.letterSpacing='0px';
}
function gear(c,x,y,r){
  const aura=c.createRadialGradient(x,y,r*.63,x,y,r*1.3);
  aura.addColorStop(0,'#6336eb00');aura.addColorStop(.54,'#8e58f74d');aura.addColorStop(1,'#6336eb00');
  c.fillStyle=aura;c.fillRect(x-r*1.3,y-r*1.3,2.6*r,2.6*r);
  c.beginPath();
  for(let i=0;i<42;i++){
    for(const [step,z] of [[0,.938],[.24,.938],[.35,1],[.67,1],[.79,.938]]){
      const a=(i+step)*TAU/42-.19;
      if(i===0&&step===0)c.moveTo(x+z*r*Math.cos(a),y+z*r*Math.sin(a));
      else c.lineTo(x+z*r*Math.cos(a),y+z*r*Math.sin(a));
    }
  }
  c.closePath();
  const sweep=c.createConicGradient(-.8,x,y);
  sweep.addColorStop(0,'#b7a1f5');sweep.addColorStop(.22,'#6631a7');
  sweep.addColorStop(.58,'#41266e');sweep.addColorStop(.83,'#8255d0');sweep.addColorStop(1,'#b7a1f5');
  c.strokeStyle='#8962ee28';c.lineWidth=13;c.stroke();
  c.strokeStyle=sweep;c.lineWidth=3;c.stroke();
  c.beginPath();c.arc(x,y,r*.886,0,TAU);c.lineWidth=1.2;c.strokeStyle='#cba2ff80';c.stroke();
  c.beginPath();c.arc(x,y,r*.853,0,TAU);c.strokeStyle='#cba2ff34';c.stroke();
  c.beginPath();c.arc(x,y,r*.886,-3.05,-2.52);c.strokeStyle='#faddff';c.lineWidth=3;c.stroke();
  for(let i=0;i<92;i++){
    const angle=i*TAU/92;
    const r0=r*1.027, r1=r0+(i%4===0?14:5);
    c.strokeStyle=i%4===0?'#be97f07a':'#ad89e83c';
    c.lineWidth=1;c.beginPath();
    c.moveTo(x+r0*Math.cos(angle),y+r0*Math.sin(angle));
    c.lineTo(x+r1*Math.cos(angle),y+r1*Math.sin(angle));c.stroke();
  }
}

export default function({root,width,height}){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  Object.assign(canvas.style,{display:'block',width:'100%',height:'100%'});root.appendChild(canvas);
  const c=canvas.getContext('2d',{alpha:false});
  return {prepareFrame(){
    c.setTransform(width/W,0,0,height/H,0,0);
    c.fillStyle='#05060c';c.fillRect(0,0,W,H);
    const bg=c.createRadialGradient(540,600,75,540,600,667);
    bg.addColorStop(0,'#281643');bg.addColorStop(.45,'#120c24');bg.addColorStop(1,'#05060c');
    c.fillStyle=bg;c.fillRect(0,0,W,H);
    c.fillStyle='#aeb1e009';
    for(let i=0;i<6;i++)c.fillRect(70+188*i,133,1,1174);
    for(let i=0;i<8;i++)c.fillRect(72,132+168*i,936,1);
    c.strokeStyle='#a888c351';c.lineWidth=1;c.strokeRect(67,64,946,1310);
    label(c,'VIBE  知识大赏',124,29,'#cec2e1',{spacing:'5px'});
    label(c,'斗破苍穹',246,56,'#e1ccf1',{spacing:'15px',family:serif,weight:700});
    gear(c,540,673,339);
    drawFlame(c,hero,{x:540,y:661,size:775,time:42.8,reveal:1,hit:.35,mode:'hero'});
    label(c,'异火榜第 02 名  /  虚无吞炎',1050,36,'#d5bdff',{spacing:'3px'});
    const foil=c.createLinearGradient(0,1095,0,1255);
    foil.addColorStop(0,'#faf3ff');foil.addColorStop(.58,'#f5dcff');foil.addColorStop(1,'#b47deb');
    c.shadowColor='#a44df6aa';c.shadowBlur=20;
    label(c,'七大异火',1237,174,foil,{family:serif,weight:900,spacing:'5px'});
    c.shadowBlur=0;
    c.fillStyle='#b18cde84';c.fillRect(284,1287,512,1);
    label(c,'19  /  15  /  14  /  11  /  09  /  03  /  02',1332,25,'#c4addd',{weight:600,spacing:'3px'});
  },dispose(){canvas.remove();}};
}
