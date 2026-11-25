const TAU = Math.PI * 2;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const t = clamp(value);
  return t*t*(3-2*t);
};
const lerp = (a,b,t) => a+(b-a)*t;
const stage = Symbol('stroke reveal stage');

export function strokeStage(ctx, start, finish, stagger=0) {
  ctx[stage]?.(start,finish,stagger);
}

// Draw prefixes of the same paths already used by the artwork. Geometry and stroke styles are preserved.
export function revealStrokes(ctx, amount) {
  let path = [], start = .06, finish = .74, stagger = 0, order = -1;
  let extent = 1;
  let flattened;
  const setStage = (from,to,spread) => { start=from; finish=to; stagger=spread; order=-1; };
  const methods = {
    beginPath() {
      ctx.beginPath(); path=[];flattened=undefined;
      const offset = (++order % 9)/8*stagger;
      extent=clamp((amount-start-offset)/(finish-start));
    },
    moveTo(x,y) { ctx.moveTo(x,y); path.push(['M',x,y]); },
    lineTo(x,y) { ctx.lineTo(x,y); path.push(['L',x,y]); },
    bezierCurveTo(...points) { ctx.bezierCurveTo(...points); path.push(['C',...points]); },
    ellipse(...args) { ctx.ellipse(...args); path.push(['E',...args]); },
    closePath() { ctx.closePath(); path.push(['Z']); },
    stroke() {
      if(extent>=1)ctx.stroke();
      else if(extent>0){
        flattened??=flatten(path);
        prefix(ctx,flattened,extent);ctx.stroke();
      }
    },
    fill() {
      const opacity=ease((extent-.72)/.28);
      if(opacity<=0)return;
      ctx.save();ctx.globalAlpha*=opacity;ctx.fill();ctx.restore();
    },
    fillRect(...box) {
      const from=Math.max(.18,start);
      const opacity=ease((amount-from)/Math.min(.52,.99-from));
      if(opacity<=0)return;
      ctx.save();ctx.globalAlpha*=opacity;ctx.fillRect(...box);ctx.restore();
    },
  };
  return new Proxy(ctx,{
    get(target,key){
      if(key===stage)return setStage;
      if(Object.hasOwn(methods,key))return methods[key];
      const value=target[key];
      return typeof value==='function'?value.bind(target):value;
    },
    set(target,key,value){target[key]=value;return true;},
  });
}

function flatten(path){
  const points=[];
  let head, first;
  const push=(x,y,move=false)=>{
    head=[x,y];if(move)first=head;
    points.push({x,y,move});
  };
  for(const [op,...v] of path){
    if(op==='M')push(...v,true);
    else if(op==='L')push(...v,!head);
    else if(op==='C'){
      const [a,b]=head, [c,d,e,f,g,h]=v;
      for(let i=1;i<=24;i++){
        const p=i/24,q=1-p;
        push(q**3*a+3*q*q*p*c+3*q*p*p*e+p**3*g,q**3*b+3*q*q*p*d+3*q*p*p*f+p**3*h);
      }
    } else if(op==='E'){
      const [x,y,rx,ry,turn,start,stop]=v;
      const span=Math.min(TAU,((stop-start)%TAU+TAU)%TAU||(stop===start?0:TAU));
      const steps=Math.max(2,Math.ceil(span*12));
      for(let i=0;i<=steps;i++){
        const a=start+span*i/steps,px=rx*Math.cos(a),py=ry*Math.sin(a);
        push(x+px*Math.cos(turn)-py*Math.sin(turn),y+px*Math.sin(turn)+py*Math.cos(turn),!head);
      }
    } else if(first)push(...first);
  }
  let total=0;
  for(let i=0;i<points.length;i++){
    const p=points[i],prev=points[i-1];
    const length=!prev||p.move?0:Math.hypot(p.x-prev.x,p.y-prev.y);
    total+=length;p.end=total;p.length=length;
  }
  return {points,total};
}
function prefix(ctx,{points,total},extent){
  const limit=total*extent;
  ctx.beginPath();
  for(let i=0;i<points.length;i++){
    const {x,y,move,end,length}=points[i];
    if(move)ctx.moveTo(x,y);
    else if(end<=limit)ctx.lineTo(x,y);
    else {
      if(length>0){
        const a=points[i-1],p=clamp((limit-end+length)/length);
        ctx.lineTo(lerp(a.x,x,p),lerp(a.y,y,p));
      }
      break;
    }
  }
}
