// Shared geometry for the live canvas and vector export. Distances are positive inside.
(function(root){
  const names={freeform:'Freeform',circle:'Circle',rounded:'Rounded box',square:'Square',diamond:'Diamond',hexagon:'Hexagon',triangle:'Triangle',ring:'Ring'};
  function geometry(kind,width,height){
    if(kind==='freeform'||!names[kind])return null;
    const cx=width/2,cy=height/2,r=Math.min(width,height)*.4;
    const n=v=>Number(v.toFixed(3));
    const circle=radius=>`M${n(cx+radius)} ${n(cy)}a${n(radius)} ${n(radius)} 0 1 0 ${n(-radius*2)} 0a${n(radius)} ${n(radius)} 0 1 0 ${n(radius*2)} 0Z`;
    if(kind==='circle'||kind==='ring')return {path:circle(r)+(kind==='ring'?circle(r*.55):''),distance:(x,y)=>{const d=Math.hypot(x-cx,y-cy);return kind==='ring'?Math.min(r-d,d-r*.55):r-d;}};
    if(kind==='rounded'||kind==='square'){
      const corner=kind==='rounded'?r*.25:0,left=cx-r,top=cy-r,right=cx+r,bottom=cy+r;
      const path=corner?`M${n(left+corner)} ${n(top)}H${n(right-corner)}A${n(corner)} ${n(corner)} 0 0 1 ${n(right)} ${n(top+corner)}V${n(bottom-corner)}A${n(corner)} ${n(corner)} 0 0 1 ${n(right-corner)} ${n(bottom)}H${n(left+corner)}A${n(corner)} ${n(corner)} 0 0 1 ${n(left)} ${n(bottom-corner)}V${n(top+corner)}A${n(corner)} ${n(corner)} 0 0 1 ${n(left+corner)} ${n(top)}Z`:`M${n(left)} ${n(top)}H${n(right)}V${n(bottom)}H${n(left)}Z`;
      return {path,distance:(x,y)=>{const qx=Math.abs(x-cx)-r+corner,qy=Math.abs(y-cy)-r+corner;return corner-Math.hypot(Math.max(qx,0),Math.max(qy,0))-Math.min(Math.max(qx,qy),0);}};
    }
    const count=kind==='triangle'?3:kind==='hexagon'?6:4;
    const points=Array.from({length:count},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/count;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];});
    return {path:points.map(([x,y],i)=>`${i?'L':'M'}${n(x)} ${n(y)}`).join('')+'Z',distance:(x,y)=>Math.min(...points.map(([ax,ay],i)=>{const [bx,by]=points[(i+1)%count];return ((bx-ax)*(y-ay)-(by-ay)*(x-ax))/Math.hypot(bx-ax,by-ay);} ))};
  }
  const arrangements={grid:'Symmetric grid',staggered:'Staggered rows',radial:'Radial symmetry',scatter:'Asymmetric scatter'};
  function circlePattern(s,width,height,rnd){
    const short=Math.min(width,height),radius=short*(.025+(s.circleSize??60)*.00075),gap=short*(s.circleSpacing??28)*.001;
    const pitch=radius*2+gap,margin=short*.045,circles=[];
    if(s.circleLayout==='radial'){
      const orbit=short*.34,count=Math.max(6,Math.min(18,Math.floor(Math.PI*2*orbit/pitch)));
      circles.push({x:width/2,y:height/2,r:radius});
      for(let i=0;i<count;i++){const a=-Math.PI/2+i*Math.PI*2/count;circles.push({x:width/2+Math.cos(a)*orbit,y:height/2+Math.sin(a)*orbit,r:radius});}
    }else{
      const stagger=s.circleLayout==='staggered',scatter=s.circleLayout==='scatter';
      const rowPitch=pitch*(stagger?.866:1);
      const cols=Math.max(2,Math.floor((width-2*margin)/pitch)),rows=Math.max(2,Math.floor((height-2*margin)/rowPitch));
      for(let j=0;j<rows;j++){
        const count=cols-(stagger&&j%2?1:0);
        for(let i=0;i<count;i++){
          let x=width/2+(i-(count-1)/2)*pitch,y=height/2+(j-(rows-1)/2)*rowPitch,r=radius;
          if(scatter){x+=(rnd()-.5)*pitch*.65;y+=(rnd()-.5)*rowPitch*.65;r*=.55+rnd()*.6;x=Math.max(margin+r,Math.min(width-margin-r,x));y=Math.max(margin+r,Math.min(height-margin-r,y));}
          circles.push({x,y,r});
        }
      }
    }
    const style=s.circleStyle||'rings',weight=.09+(s.density-20)/60*.22;
    return {circles,field(x,y){let value=-Infinity;
      for(const c of circles){const dx=x-c.x,dy=y-c.y;if(Math.abs(dx)>c.r*1.2||Math.abs(dy)>c.r*1.2)continue;const d=Math.hypot(dx,dy);let v;
        if(style==='discs')v=c.r-d;
        else if(style==='concentric')v=c.r*weight*.4-Math.min(Math.abs(d-c.r*.4),Math.abs(d-c.r*.7),Math.abs(d-c.r));
        else v=c.r*weight*.5-Math.abs(d-c.r*(1-weight*.5));
        value=Math.max(value,v);
      }
      return Number.isFinite(value)?value/short:-1;
    }};
  }
  root.GlyphShapes={names,geometry,arrangements,circlePattern};
})(globalThis);
