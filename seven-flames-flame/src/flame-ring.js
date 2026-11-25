const TAU = Math.PI * 2;
const clamp = x => Math.min(1, Math.max(0, x));
const hash = x => {
  const value = Math.sin(x * 128.632 + 18.761) * 46257.37;
  return value - Math.floor(value);
};
const tint = (hex, amount) => hex + Math.round(clamp(amount) * 255).toString(16).padStart(2, '0');

function flare(c, angle, extent, width, curl, pulse, color, light) {
  c.save();
  c.rotate(angle);
  c.translate(1, 0);
  const fill = c.createLinearGradient(-.058, 0, extent, curl);
  fill.addColorStop(0, tint(color, 0));
  fill.addColorStop(.27, tint(color, .32 * pulse));
  fill.addColorStop(.52, tint(light, .56 * pulse));
  fill.addColorStop(.81, tint(color, .32 * pulse));
  fill.addColorStop(1, tint(color, 0));
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(-.038, -width);
  c.bezierCurveTo(.06, -.68 * width, extent * .49, -.26 * width + curl * .67, extent, curl);
  c.bezierCurveTo(extent * .49, curl * .77 + width * .84, .019, width * 1.1, -.055, width * .77);
  c.closePath();
  c.fill();
  c.strokeStyle = fill;
  c.lineWidth = .003;
  c.stroke();
  c.restore();
}

export function drawFireRing(c, x, y, radius, t, color, light, grow=1, hit=0) {
  if (grow <= 0) return;
  c.save();
  c.translate(x, y);
  c.scale(radius, radius);
  c.globalCompositeOperation = 'lighter';
  const start = Math.PI / 2;
  const halo = c.createRadialGradient(0, 0, .77, 0, 0, 1.28);
  halo.addColorStop(0,tint(color,0));
  halo.addColorStop(.35,tint(color,.11+.12*hit));
  halo.addColorStop(.53,tint(color,.14+.14*hit));
  halo.addColorStop(1,tint(color,0));
  c.fillStyle=halo;
  c.beginPath();c.moveTo(0,0);
  c.arc(0,0,1.29,start-Math.PI*grow,start+Math.PI*grow);
  c.closePath();c.fill();
  for (let band = 0; band < 5; band++) {
    c.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = start + (i/60-1) * Math.PI * grow;
      const phase = a*(9+band)+band*1.8-t*(2.3+band*.41);
      const r = .954 + band*.017 + .012*Math.sin(phase) + .009*Math.sin(a*17+t*3.1+band);
      const xx = r*Math.cos(a), yy=r*Math.sin(a);
      if (i===0) c.moveTo(xx,yy);
      else c.lineTo(xx,yy);
    }
    c.strokeStyle=tint(band===2?light:color,(band===2?.46:.23)+.24*hit);
    c.lineWidth=band===2?.006:.009;
    c.stroke();
  }
  for (let i = 0; i < 48; i++) {
    const q = (i + hash(i+5)*.84)/48;
    const lit = clamp((grow-Math.abs(q-.5)*2)*8);
    if (!lit) continue;
    const angle = start+(q-.5)*TAU+.034*Math.sin(t*1.4+i*5);
    const sway = Math.sin(t*(4+hash(i+45)*3)+i*1.9);
    const length = (.051+.158*hash(i*4+70))*(.77+.23*sway)+.048*hit;
    flare(c,angle,length*(.42+.58*lit),.026+.031*hash(i+2),.06+.065*sway,
      lit*(.61+.23*sway+.27*hit),color,light);
  }
  for (let i=0;i<35;i++) {
    const q=hash(i+351), lit=clamp((grow-Math.abs(q-.5)*2)*8);
    if(!lit) continue;
    const speed=.27+.14*hash(i+92), p=(t*speed+hash(i+301))%1;
    const a=start+(q-.5)*TAU+p*.13;
    const rr=1.03+p*(.19+.11*hit);
    const size=.002+hash(i+19)*.006;
    c.fillStyle=tint(i%4===0?light:color,lit*Math.sin(Math.PI*p)*(.52+.24*hit));
    c.fillRect(rr*Math.cos(a),rr*Math.sin(a),size,size);
  }
  c.restore();
}
