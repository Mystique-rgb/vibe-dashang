import { GOLD,oval,glow } from './fx.js';

export function impactAmount(time, hits, decay=.24) {
  const hit=hits.findLast(at=>at<=time);
  if(hit===undefined)return 0;
  const age=time-hit;
  if(age>=decay)return 0;
  return (1-age/decay)**2 * (.5+.5*Math.sin(Math.min(1,age/.059)*Math.PI*.5));
}

export function impactRing(c,x,y,rx,ry,amount,color=GOLD) {
  if(amount<=0)return;
  c.save(); c.globalCompositeOperation='screen';
  const spread=1+amount*.33;
  c.globalAlpha=amount*.47;
  oval(c,x,y,rx*spread,ry*spread,color,10);
  c.globalAlpha=amount*.95;
  oval(c,x,y,rx*spread,ry*spread,color,2.8);
  c.globalAlpha=amount*.58;
  oval(c,x,y,rx*(spread+.10),ry*(spread+.10),color,1.6);
  glow(c,x,y,rx*1.49,`${color}24`);
  c.restore();
}
