import {drawFlame} from './flames.js';
import {ITEMS} from './timeline.js';
import {drawFireRing} from './flame-ring.js';

const W=1080, H=1440;
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
    drawFireRing(c,540,654,304,42.8,hero.color,hero.light,1,.33);
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
