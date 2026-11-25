import { W,TAU,GOLD,CREAM,RED,BLUE,SERIF,clamp,out,mix,hash,line,oval,text,card,glow } from './fx.js';
import { titleCues } from './sound-cues.js';

function flashAt(time,at,falloff) {
  const after=time-at;
  return after<0?0:Math.exp(-after/falloff);
}

function drawCards(c,f,closer,beat) {
  for(let i=0;i<11;i++) {
    const a=f.local*1.20+i*TAU/11;
    const depth=Math.sin(a);
    if((depth>0)!==closer)continue;
    const z=1/(1-depth*.30);
    const x=960+Math.cos(a)*(562+beat*47)*z;
    const y=503+(Math.cos(a)*62+depth*239)*z;
    const roll=f.local*2.45+i*1.13;
    const flip=Math.cos(roll);
    const width=(83+hash(i)*58)*z;
    const alpha=(.31+depth*.18+.12*beat)*(closer?1.3:1);
    c.save(); c.globalAlpha=alpha;
    if(closer) {
      const tail=20+52*beat;
      line(c,x,y,x+Math.sin(a)*tail,y-Math.cos(a)*tail*.46,'#ffab71',2*z);
    }
    card(c,x,y,width,width*1.47,{rot:a*.48+.31*Math.sin(roll),scaleX:Math.max(.047,Math.abs(flip)),pale:flip<-.3&&closer,red:i%4===0});
    c.restore();
  }
}

function litStamp(c,f,beat) {
  const arrival=out(f.local/.38), lean=.026*Math.sin(f.local*2.85);
  const move=Math.sin(f.local*2.4)*28;
  const scan=clamp((f.time-titleCues.sweep)/.78);
  const sweep=Math.sin(scan*Math.PI)**.8;
  const finale=clamp((f.time-titleCues.carry)/.46);
  const flare=Math.sin(finale*Math.PI);
  const scale=.94+arrival*.06+Math.sin(f.local*2.31)*.023+beat*.039;
  c.save(); c.translate(960+move,474+(1-arrival)*108+Math.sin(f.local*3)*12+beat*5); c.rotate(lean); c.scale(scale,scale);
  c.globalAlpha=arrival;
  const shaft=c.createLinearGradient(0,-170,0,191);
  shaft.addColorStop(0,'#fff4d3'); shaft.addColorStop(.38,'#f9dba2'); shaft.addColorStop(.72,'#efb66f'); shaft.addColorStop(1,'#975035');
  for(let i=9;i>0;i--)text(c,f.headline,1.15*i,4.1*i,289,{family:SERIF,color:i>5?'#431e22':'#97522d',max:1280});
  text(c,f.headline,0,0,289,{family:SERIF,color:shaft,max:1280,stroke:4});
  if(sweep>0.003 || flare>0.004) {
    const edge=sweep>0.003?sweep:flare*.82;
    const dx=mix(-650,650,sweep>0.003?scan:finale);
    const specular=c.createLinearGradient(dx-140,-86,dx+140,86);
    specular.addColorStop(0,'#fff0c500'); specular.addColorStop(.28,'#ffeea500');
    specular.addColorStop(.47,'#fff0b8cc'); specular.addColorStop(.52,'#fffbdc');
    specular.addColorStop(.72,'#ffe9ae00'); specular.addColorStop(1,'#ffe9ae00');
    c.globalCompositeOperation='screen'; c.globalAlpha=edge*.9;
    text(c,f.headline,0,0,289,{family:SERIF,color:specular,max:1280});
  }
  c.restore();
}

export function drawTitle(c,f) {
  const attack=flashAt(f.time,titleCues.stamp,.21);
  const carry=flashAt(f.time,titleCues.carry,.22);
  const beat=Math.max(attack,carry);
  glow(c,940,498,685,'#9f342da0');
  glow(c,1250+Math.sin(f.local*2.75)*390,634+Math.cos(f.local*3)*64,480,'#ef8a483a');
  for(let i=0;i<4;i++) {
    const p=(f.local*.66+i*.25)%1;
    c.save(); c.globalAlpha=Math.sin(p*Math.PI)*(.35+beat*.42);
    oval(c,960,520,310+p*534,122+p*172,i%3===0?RED:GOLD,i===0?2.6:1.25); c.restore();
  }
  drawCards(c,f,false,beat);
  for(let i=0;i<66;i++) {
    const d=hash(i+14), theta=i*TAU/66+f.local*.28;
    const p=(f.local*(.76+d*.59)+hash(241+i))%1;
    const r=mix(308,908,p);
    const x=960+Math.cos(theta)*r, y=522+Math.sin(theta)*r*.36;
    const trail=(16+d*50)*(1+.76*carry);
    c.save(); c.globalAlpha=Math.sin(p*Math.PI)*(.55+d*.35);
    line(c,x,y,x+Math.cos(theta)*trail,y+Math.sin(theta)*trail*.34,i%11===0?BLUE:i%4===0?RED:GOLD,1+d*2);
    c.restore();
  }
  litStamp(c,f,beat);
  drawCards(c,f,true,beat);
  line(c,316,698,W-316,698,'#e7b37178',1.5);
  c.save(); c.globalAlpha=Math.max(.25,out(f.local/.3));
  text(c,f.caption,960,772,57,{color:CREAM,weight:700,stroke:4}); c.restore();
}
