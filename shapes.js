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
  root.GlyphShapes={names,geometry};
})(globalThis);
