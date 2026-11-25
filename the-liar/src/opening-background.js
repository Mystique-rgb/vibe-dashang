import { W,GOLD,BLUE,hash,line,oval,polygon,glow } from './fx.js';

const PAN_SPEED = 5.28;

export const panOffsets=time=>[78*time,165*time,258*time].map(distance=>distance*PAN_SPEED);

function arch(c,x,floor,width,height,color,edge) {
  const spring=floor-height+width*.61;
  c.beginPath();
  c.moveTo(x-width*.5,floor); c.lineTo(x-width*.5,spring);
  c.bezierCurveTo(x-width*.5,spring-width*.62,x+width*.5,spring-width*.62,x+width*.5,spring);
  c.lineTo(x+width*.5,floor);
  if(color) { c.fillStyle=color; c.fill(); }
  c.strokeStyle=edge; c.lineWidth=2; c.stroke();
}

export function panOpeningBackground(c,f) {
  const [distance,middle,near]=panOffsets(f.time);
  c.save();
  // Continuous travel with repeating architecture drawn well beyond the frame edges.
  for(let i=Math.floor((-distance-410)/344);i<=Math.ceil((W-distance+410)/344);i++) {
    const x=i*344+distance+140, y=746+hash(i+50)*36;
    arch(c,x,y,264,627,'#0b191e99','#5c7c782e');
    arch(c,x,y-5,218,600,null,'#c8a37322');
    const g=c.createLinearGradient(x,155,x,665);
    g.addColorStop(0,'#65b2a75b'); g.addColorStop(.50,'#37696420'); g.addColorStop(1,'#37696400');
    oval(c,x,322,80,176,g,1,true);
    for(let j=-1;j<=1;j++)line(c,x+j*35,216,x+j*35,570,'#9ba79734',2);
    line(c,x-104,428,x+104,428,'#ab8a6941',2);
  }
  for(let i=Math.floor((-middle-320)/402);i<=Math.ceil((W-middle+320)/402);i++) {
    const x=i*402+middle+72;
    const column=c.createLinearGradient(x-25,0,x+39,0);
    column.addColorStop(0,'#080e15b0'); column.addColorStop(.28,'#273438b8'); column.addColorStop(.79,'#101c23c4'); column.addColorStop(1,'#07121a79');
    polygon(c,[[x-23,87],[x+27,87],[x+35,770],[x-25,822]],column,'#a6885b38',1.7);
    line(c,x-29,111,x+33,111,'#c2a16f56',2);
    line(c,x-21,717,x+31,717,'#95a4a342',2);
    const wickY=365+Math.sin(i*2.5)*80;
    glow(c,x+69,wickY,115,i%2?'#e8913841':'#6ac3be38');
    oval(c,x+69,wickY,7,22,i%2?'#d79c5ec7':'#81c9b6a5',1,true);
  }
  c.globalCompositeOperation='screen';
  for(let i=Math.floor((-near-420)/485);i<=Math.ceil((W-near+180)/485);i++) {
    const x=i*485+near;
    const beam=c.createLinearGradient(x-83,131,x+250,727);
    beam.addColorStop(0,i%2?'#d397644d':'#57b6bb49'); beam.addColorStop(1,'#00000000');
    polygon(c,[[x-92,0],[x-42,0],[x+404,798],[x+283,798]],beam);
  }
  for(let i=0;i<64;i++) {
    const seed=hash(i+31), rate=32+seed*74;
    const x=(hash(i+201)*(W+220)+f.time*rate*PAN_SPEED)%(W+220)-110;
    const y=165+hash(i+118)*672+Math.sin(f.time*1.9+i)*15;
    c.globalAlpha=(.24+seed*.44)*(.64+.36*Math.sin(f.time*3+i));
    line(c,x-8*seed,y,x+3+seed*5,y-.7,i%6===0?BLUE:GOLD,.9+seed*1.6);
  }
  c.restore();
}
