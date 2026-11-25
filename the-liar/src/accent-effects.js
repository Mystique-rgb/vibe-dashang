import { GOLD,RED,TAU,mix,out,line,oval,glow } from './fx.js';
import { accents, titleCues } from './sound-cues.js';

// Each burst starts at the diagram's point of action, using the same cue as the sound.
const placements = {
  room: {x:960,y:516,rx:485,ry:188,color:GOLD},
  threat: {x:1520,y:537,rx:56,ry:51,color:RED},
  clue: {x:1454,y:580,rx:55,ry:44,color:RED},
  flip: {x:960,y:518,rx:495,ry:214,color:RED},
  host: {x:1417,y:514,rx:270,ry:165,color:GOLD},
  verdict: {x:960,y:537,rx:155,ry:117,color:RED},
  end: {x:960,y:550,rx:181,ry:109,color:GOLD},
};

export function drawCueEffects(c,f) {
  if(f.kind==='title') {
    const elapsed=f.time-titleCues.carry;
    if(elapsed>=0&&elapsed<.37) {
      const p=out(elapsed/.37);
      c.save(); c.globalAlpha=(1-p)*.49;
      c.globalCompositeOperation='screen';
      glow(c,mix(570,994,p),672,408,'#f49b625a');
      c.restore();
    }
    return;
  }
  const target=placements[f.kind];
  if(!target)return;
  const cue=accents.find(a=>a.time>=f.start-.0001 && f.time>=a.time && f.time-a.time<.47);
  if(!cue)return;
  const {x,y,rx,ry,color}=target; 
  const elapsed=f.time-cue.time;
  const p=out(elapsed/.47);
  c.save(); c.globalCompositeOperation='screen'; c.globalAlpha=(1-p)*.69;
  for(let n=0;n<2;n++) oval(c,x,y,rx+148*p+n*24,ry+93*p+n*13,color,n===0?3:1.5);
  for(let i=0;i<16;i++){
    const a=i*TAU/16+.08;
    const vx=Math.cos(a),vy=Math.sin(a);
    line(c,x+vx*(rx+150*p),y+vy*(ry+100*p),x+vx*(rx+48+163*p),y+vy*(ry+30+108*p),color,i%4===0?3.2:1.45);
  }
  c.restore();
}
