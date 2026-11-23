/* Glyph Field: deterministic, entirely local procedural typography. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = {mycelium:'Mycelium',islands:'Archipelago',ribbons:'Currents',contours:'Contours',cells:'Cellular',circles:'Circles',spiral:'Spiral',blob:'Organism',wave:'Drift',tendril:'Filament',cluster:'Colony',trace:'Traced image'};
  const descriptions={trace:'Rebuilt from your uploaded image',mycelium:'Branching networks',islands:'Scattered landforms',ribbons:'Winding channels',contours:'Nested elevations',cells:'Organic membranes',circles:'Repeating circular motifs',spiral:'Scattered dotted spirals',blob:'Single organic form',wave:'Flowing ribbon',tendril:'Confined branches',cluster:'Scattered fragments'};
  const {names:shapeNames,geometry:shapeGeometry,arrangements,circlePattern,spiralPoints}=GlyphShapes;
  const {profileNames,palettes:graphPalettes,draw:drawGraph}=GlyphGraph;
  const compositionName=s=>s.mode==='graph'?`Graph · ${profileNames[s.graphProfile]}`:s.form==='spiral'?'Spiral':s.form==='circles'?`Circles · ${arrangements[s.circleLayout||'grid']}`:s.shape&&s.shape!=='freeform'?`${shapeNames[s.shape]} · ${names[s.form]}`:names[s.form];
  const defaults = {form:'mycelium',spiralTurns:3.5,spiralArms:2,spiralScatter:55,spiralDotSize:8,spiralDensity:75,spiralAccent:35,spiralDirection:'clockwise',circleLayout:'grid',circleStyle:'rings',circleSize:60,circleSpacing:28,shape:'freeform',shapeFill:'pattern',seed:'781204',scale:50,density:48,detail:9,accent:35,color:'#eeeeee',background:'#181818',glyph:'#dbdbdb',transparent:false,ratio:'4:5',resolution:2048,
    mode:'field',graphStyle:'glyph',graphProfile:'peaks',graphLayout:'row',graphDither:'bayer',graphCell:'gapped',graphEdge:'glow',graphSeries:1,graphGap:30,graphHeight:55,graphRough:30,graphPixel:6,graphFade:35,graphStars:30,
    series1:'#dbdbdb',series2:'#9c9c9c',series3:'#ededed',series4:'#7c7c7c',traceStep:9,traceThreshold:14,traceSmooth:95,traceEdge:100};
  const TRACE_CONTROLS=[['step','traceStep',4,32],['threshold','traceThreshold',2,60],['smooth','traceSmooth',30,200],['edge','traceEdge',40,160]];
  let comparing=false;
  // The uploaded image lives only in memory; a saved "trace" form without it falls back to a pattern.
  let traced=null;
  const ratioOf=s=>s.form==='trace'&&traced&&s.mode!=='graph'?traced.ratio:s.ratio;
  const GRAPH_CONTROLS=[['series','graphSeries',1,4],['gap','graphGap',0,80],['height','graphHeight',20,90],['rough','graphRough',0,100],['pixel','graphPixel',3,14],['fade','graphFade',0,100],['stars','graphStars',0,100]];
  const GRAPH_SELECTS=[['graph-style','graphStyle',['glyph','pixel']],['graph-profile','graphProfile',Object.keys(profileNames)],['graph-layout','graphLayout',['row','stack']],['graph-dither','graphDither',['bayer','scatter','halftone']],['graph-cell','graphCell',['square','gapped','dot']],['graph-edge','graphEdge',['glow','solid','none']]];
  const SERIES=[1,2,3,4].map(i=>'series'+i);
  const SPIRAL_CONTROLS=[['turns','spiralTurns',1,7],['arms','spiralArms',1,5],['scatter','spiralScatter',0,100],['dot-size','spiralDotSize',2,14],['density','spiralDensity',20,100],['accent','spiralAccent',0,100]];
  let state = {...defaults}, revision = 0, exportFormat = 'png';
  const art = $('art');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const CONTROL_SPECS = [
    {key:'scale',path:'formScale',min:10,max:90},
    {key:'density',path:'coverage',min:20,max:80},
    {key:'detail',path:'glyphSize',min:6,max:16},
    {key:'accent',path:'letterMarks',min:0,max:100},
  ];
  let motionSettings={enabled:true,transition:{type:'spring',visualDuration:.18,bounce:0}};
  let dial, syncingDials=false, tuneFrame=0;
  const activeAnimations=new Map();
  const forms=document.querySelector('.forms');
  const selection=document.createElement('span');selection.className='structure-selection';selection.setAttribute('aria-hidden','true');forms.prepend(selection);
  let selectionReady=false, selectionPosition='';
  document.documentElement.dataset.input='pointer';
  document.addEventListener('pointerdown',()=>{document.documentElement.dataset.input='pointer';},true);
  document.addEventListener('keydown',()=>{document.documentElement.dataset.input='keyboard';settleMotion();},true);
  function motionOptions(){const t=motionSettings.transition;return {...t,type:t.type==='easing'?'tween':'spring'};}
  function stopAnimation(element){activeAnimations.get(element)?.stop();activeAnimations.delete(element);}
  function animateUI(element,keyframes,options=motionOptions()){
    stopAnimation(element);
    const animation=Motion.animate(element,keyframes,options);activeAnimations.set(element,animation);
    animation.then(()=>{if(activeAnimations.get(element)===animation)activeAnimations.delete(element);});
  }
  function motionAllowed(){return motionSettings.enabled&&!reducedMotion.matches&&document.documentElement.dataset.input!=='keyboard';}
  function previewFeedback(){
    if(!motionAllowed())return;
    animateUI(art,{opacity:[.88,1],scale:[.998,1]});
  }
  function positionSelection(animate=true){
    const button=forms.querySelector('.selected');if(!button||!button.offsetWidth)return;
    const x=button.offsetLeft,y=button.offsetTop;
    const position=[x,y,button.offsetWidth,button.offsetHeight].join(':');
    if(position===selectionPosition)return;
    const sameSize=selection.style.width===button.offsetWidth+'px'&&selection.style.height===button.offsetHeight+'px';
    selectionPosition=position;
    selection.style.width=button.offsetWidth+'px';selection.style.height=button.offsetHeight+'px';
    if(selectionReady&&sameSize&&animate&&motionAllowed())animateUI(selection,{x,y},{duration:.18,ease:[.23,1,.32,1]});
    else{stopAnimation(selection);Motion.animate(selection,{x,y},{duration:0});}
    selectionReady=true;
  }
  function settleMotion(){
    for(const animation of activeAnimations.values())animation.stop();activeAnimations.clear();
    art.style.opacity='1';art.style.transform='none';selectionPosition='';positionSelection(false);
  }
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)settleMotion();});
  new ResizeObserver(()=>positionSelection(false)).observe(forms);
  function mountDials(){
    const config=Object.fromEntries(CONTROL_SPECS.map(c=>[c.path,[state[c.key],c.min,c.max,1]]));
    config.previewMotion={_collapsed:true,enabled:motionSettings.enabled,transition:motionSettings.transition,replay:{type:'action',label:'Replay preview'}};
    dial=DialKit.createDialKit('Texture',config,{id:'glyph-field-controls',onAction:action=>{if(action==='previewMotion.replay')previewFeedback();}});
    DialKit.createDialRoot({target:$('dial-panel'),mode:'inline',theme:'dark',versions:'menu'});
    dial.subscribe(values=>{
      if(syncingDials)return;
      motionSettings={enabled:values.previewMotion.enabled,transition:{...values.previewMotion.transition}};
      if(!motionAllowed())settleMotion();
      let changed=false;
      for(const c of CONTROL_SPECS){const value=Math.max(c.min,Math.min(c.max,Math.round(values[c.path])));if(value!==state[c.key]){state[c.key]=value;changed=true;}}
      if(changed){
        if(!tuneFrame)tuneFrame=requestAnimationFrame(()=>{tuneFrame=0;draw();});
      }else persist();
    },false);
  }
  function hash(text) {
    let h = 2166136261;
    for (let i=0;i<text.length;i++) h = Math.imul(h ^ text.charCodeAt(i),16777619);
    return h >>> 0;
  }
  function random(seed) {
    let a=seed>>>0;
    return () => {a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};
  }
  function noiseFactory(seed) {
    function lattice(x,y){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^seed;h=Math.imul(h^h>>>13,1274126177);return ((h^h>>>16)>>>0)/4294967295*2-1;}
    return (x,y) => {const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*u*(u*(u*6-15)+10);v=v*v*v*(v*(v*6-15)+10);const a=lattice(ix,iy),b=lattice(ix+1,iy),c=lattice(ix,iy+1),d=lattice(ix+1,iy+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
  }
  function sizeFor(ratio,longest) {const [w,h]=ratio.split(':').map(Number);return w>=h?[longest,Math.round(longest*h/w)]:[Math.round(longest*w/h),longest];}
  function escapeXML(value) {return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
  function shade(color,factor){return '#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*factor).toString(16).padStart(2,'0')).join('');}
  function render(canvas,s,longest=1500,vector=false) {
    const start=performance.now();
    const trace=s.form==='trace'&&traced&&s.mode!=='graph'?traced:null;
    const [lw,lh]=sizeFor(ratioOf(s),1500),[w,h]=sizeFor(ratioOf(s),longest);
    const parts=[],number=n=>Number(n.toFixed(3));
    let ctx;
    if(!vector){canvas.width=w;canvas.height=h;ctx=canvas.getContext('2d');ctx.scale(w/lw,h/lh);}
    function rect(x,y,width,height,color){
      if(vector)parts.push(`<rect x="${number(x)}" y="${number(y)}" width="${number(width)}" height="${number(height)}" fill="${color}"/>`);
      else{ctx.fillStyle=color;ctx.fillRect(x,y,width,height);}
    }
    if(!s.transparent)rect(0,0,lw,lh,s.background);
    const seed=hash(s.seed),rnd=random(seed),noise=noiseFactory(seed),short=Math.min(lw,lh);
    const graph=s.mode==='graph';
    if(graph&&s.graphStyle==='pixel'){
      drawGraph(s,lw,lh,rnd,(x,y,size,color,round)=>{
        if(!round)return rect(x,y,size,size,color);
        const r=size/2;
        if(vector)parts.push(`<circle cx="${number(x+r)}" cy="${number(y+r)}" r="${number(r)}" fill="${color}"/>`);
        else{ctx.beginPath();ctx.arc(x+r,y+r,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
      });
      if(vector)return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${lw} ${lh}" overflow="hidden" shape-rendering="crispEdges"><title>${escapeXML(compositionName(s)+' — '+s.seed)}</title><desc>Seeded pixel-dithered chart. Editable vector cells.</desc><metadata>${escapeXML(JSON.stringify(s))}</metadata>${parts.join('')}</svg>`;
      return Math.round(performance.now()-start);
    }
    if(s.form==='spiral'&&!graph){
      const points=spiralPoints(s,lw,lh,rnd);
      for(const p of points){const color=p.accent?s.color:s.glyph;
        if(vector)parts.push(`<circle cx="${number(p.x)}" cy="${number(p.y)}" r="${number(p.r)}" fill="${color}"/>`);
        else{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
      }
      if(vector)return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${lw} ${lh}" overflow="hidden"><title>Spiral — ${escapeXML(s.seed)}</title><desc>Seeded dotted spiral trails. Editable vector circles.</desc><metadata>${escapeXML(JSON.stringify(s))}</metadata>${parts.join('')}</svg>`;
      return Math.round(performance.now()-start);
    }
    const shape=s.form==='circles'||graph?null:shapeGeometry(s.shape||'freeform',lw,lh);
    const circular=s.form==='circles'&&!graph?circlePattern(s,lw,lh,random(seed^0x517cc1b7)):null;
    if(shape&&!vector){ctx.save();ctx.clip(new Path2D(shape.path),'evenodd');}
    const freq=2.2+(90-s.scale)*.051,step=graph?s.graphPixel*1.08:trace?s.traceStep:s.detail*.72,cols=Math.ceil(lw/step)+2,rows=Math.ceil(lh/step)+2;
    const mask=new Uint8Array(cols*rows),values=new Float32Array(cols*rows),edges=[];
    const ox=rnd()*90,oy=rnd()*90,coverage=(s.density-48)/100;
    const isIsolated=['blob','wave','tendril','cluster'].includes(s.form);
    let isoP;
    if(s.form==='blob')isoP={cx:lw*.5+(rnd()-.5)*lw*.12,cy:lh*.5+(rnd()-.5)*lh*.12,r:short*(.28+coverage*.12)};
    else if(s.form==='wave'){const a=rnd()*Math.PI*.5-Math.PI*.25;isoP={cos:Math.cos(a),sin:Math.sin(a),w:short*(.08+coverage*.06)};}
    else if(s.form==='tendril')isoP={cx:lw*.5+(rnd()-.5)*lw*.1,cy:lh*.5+(rnd()-.5)*lh*.1,r:short*(.3+coverage*.12)};
    else if(s.form==='cluster'){const cc=[];for(let i=0,n=3+Math.floor(rnd()*5);i<n;i++)cc.push({x:lw*.15+rnd()*lw*.7,y:lh*.15+rnd()*lh*.7,r:short*(.06+rnd()*.08),ox:rnd()*100,oy:rnd()*100});isoP={cc};}
    const graphField=graph?GlyphGraph.mask(s,lw,lh,rnd,noise,step):null;
    function organicField(x,y){
      if(graphField)return graphField.field(x,y);
      if(trace)return trace.field(x,y,step*s.traceSmooth/100,s.traceThreshold/100);
      if(circular)return circular.field(x,y);
      if(s.form==='blob'){const dx=x-isoP.cx,dy=y-isoP.cy,dist=Math.sqrt(dx*dx+dy*dy)/isoP.r;return .6+noise(x/short*3+ox,y/short*3+oy)*.25+noise(x/short*5.5+5,y/short*5.5+11)*.1+coverage*.2-dist;}
      if(s.form==='wave'){const rwx=(x-lw*.5)*isoP.cos+(y-lh*.5)*isoP.sin,rwy=-(x-lw*.5)*isoP.sin+(y-lh*.5)*isoP.cos,spine=noise(rwx/short*1.8+ox,oy)*short*.22+noise(rwx/short*3.5+3,oy+7)*short*.08,wm=1+noise(rwx/short*2.5+50,oy+50)*.3,dist=Math.abs(rwy-spine)/(isoP.w*wm),ef=Math.pow(Math.abs(rwx)/(short*.5),4);return .5+coverage*.3-dist-Math.max(ef,0);}
      if(s.form==='cluster'){let best=-1;for(const c of isoP.cc){const dx=x-c.x,dy=y-c.y,dist=Math.sqrt(dx*dx+dy*dy)/c.r,v=.55+noise(x/short*4+c.ox,y/short*4+c.oy)*.25-dist;if(v>best)best=v;}return best+coverage*.15;}
      const nx=x/short*freq+ox,ny=y/short*freq+oy;
      const wx=nx+noise(nx*.7+12,ny*.7)*.7,wy=ny+noise(nx*.7,ny*.7+39)*.7;
      const n=noise(wx,wy)*.78+noise(wx*2.07+5,wy*2.07)*.19+noise(wx*5.1,wy*5.1)*.047+noise(wx*18.7,wy*18.7)*.017;
      if(s.form==='tendril'){const dx=x-isoP.cx,dy=y-isoP.cy,dist=Math.sqrt(dx*dx+dy*dy)/isoP.r,mask=.65+noise(x/short*2.5+ox+30,y/short*2.5+oy+30)*.15-dist;return Math.min(.175+coverage*.38-Math.abs(n+.055),mask);}
      if(s.form==='islands')return n-(.065-coverage*.85);
      if(s.form==='ribbons')return .19+coverage*.4-Math.abs(n+.16*Math.sin(wy*2.2));
      if(s.form==='contours')return .23+coverage*.55-Math.abs(Math.sin(n*13));
      if(s.form==='cells'){
        const px=wx*1.4,py=wy*1.4,ix=Math.floor(px),iy=Math.floor(py);let d1=9,d2=9;
        for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
          const gx=ix+i,gy=iy+j,dx=gx+.5+noise(gx+120,gy+30)*.46-px,dy=gy+.5+noise(gx+54,gy+73)*.46-py,d=dx*dx+dy*dy;
          if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;
        }
        return .15+coverage*.35-(Math.sqrt(d2)-Math.sqrt(d1));
      }
      return .175+coverage*.38-Math.abs(n+.055);
    }
    function field(x,y){
      if(!shape)return organicField(x,y);
      const distance=shape.distance(x,y);
      if(distance<=0)return distance/short;
      // A glyph rim keeps every silhouette recognizable, even with sparse patterns.
      return s.shapeFill==='solid'||distance<step*1.5?Math.max(.01,distance/short):organicField(x,y);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=y*cols+x,v=field((x-1)*step,(y-1)*step);values[i]=v;mask[i]=v>0?1:0;
    }
    // Atlas stamps keep thousands of small characters inexpensive to draw.
    const atlas=new Map();
    function stamp(ch,size,color){
      const key=ch+'|'+size+'|'+color;if(atlas.has(key))return atlas.get(key);
      const tile=document.createElement('canvas'),dpr=longest/1500;
      const box=Math.ceil(size*1.8);tile.width=tile.height=Math.ceil(box*dpr);
      const t=tile.getContext('2d');t.scale(dpr,dpr);t.font=`${size>step*1.3?600:500} ${size}px monospace`;t.textAlign='center';t.textBaseline='middle';t.fillStyle=color;t.fillText(ch,box/2,box/2+.25);
      const item={tile,box};atlas.set(key,item);return item;
    }
    function glyph(ch,x,y,size,color){
      if(vector){parts.push(`<text x="${number(x)}" y="${number(y+.25)}" font-size="${number(size)}" font-weight="${size>step*1.3?600:500}" fill="${color}">${escapeXML(ch)}</text>`);return;}
      const {tile,box}=stamp(ch,size,color);ctx.drawImage(tile,x-box/2,y-box/2,box,box);
    }
    const glyphSet=c=>[shade(c,194/219),shade(c,208/219),c,shade(c,215/219)];
    const markColor=shade(s.glyph,168/219),fieldGlyphs=glyphSet(s.glyph),seriesGlyphs=graph?SERIES.map(k=>glyphSet(s[k])):null;
    for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
      const i=y*cols+x;if(!mask[i])continue;
      const px=(x-1)*step,py=(y-1)*step;
      const set=seriesGlyphs?seriesGlyphs[graphField.owner(px,py)]:fieldGlyphs,edgeColor=set[3];
      // Graphs outline only the curve and upper sides; the base fades out through an ordered dither.
      const density=graphField?graphField.density(px,py):1;
      const edge=graphField?!mask[i-cols]||(density>.55&&(!mask[i-1]||!mask[i+1]||!mask[i-cols-1]||!mask[i-cols+1])):!mask[i-1]||!mask[i+1]||!mask[i-cols]||!mask[i+cols]||!mask[i-cols-1]||!mask[i+cols+1];
      if(graphField&&!edge&&Math.pow(density,.7)<=GlyphGraph.bayer(x,y))continue;
      const fade=graphField?.45+.55*Math.round(density*4)/4:1,shades=fade<1?set.map(c=>shade(c,fade)):set;
      const tf=circular||trace?freq:4,texture=noise(px/short*tf+15,py/short*tf+27)+(shape&&s.shapeFill==='solid'?organicField(px,py)*.7:0);
      if(edge){
        edges.push([px,py]);
        const ex=px+(rnd()-.5)*step*(circular?0:.5),ey=py+(rnd()-.5)*step*(circular?0:.5),es=trace?s.traceEdge/100:1;
        glyph('⊗',ex,ey,step*1.95*es,edgeColor);
        glyph('@',ex,ey,step*1.5*es,edgeColor);
      } else {
        const ch=texture>.27?'×':texture>.02?'+':texture>-.2?'⁙':'✣';
        if(rnd()>.025)glyph(ch,px,py,step*(ch==='×'?1.48:ch==='✣'?1.04:1.22),shades[Math.min(2,Math.max(0,Math.floor((texture+1)*1.5)))]);
      }
    }
    // Sparse registration marks sit in the negative space.
    for(let n=0;n<(graph?Math.round(s.graphStars*.5):circular?0:trace?14:isIsolated?8:40);n++){
      const x=20+rnd()*(lw-40),y=20+rnd()*(lh-40);
      if(field(x,y)>-.055)continue;
      if(n%3===0){
        if(vector)parts.push(`<path d="M${number(x-7)} ${number(y)}h14 M${number(x)} ${number(y-7)}v14" fill="none" stroke="${markColor}" stroke-width="1.2"/>`);
        else{ctx.strokeStyle=markColor;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-7,y);ctx.lineTo(x+7,y);ctx.moveTo(x,y-7);ctx.lineTo(x,y+7);ctx.stroke();}
      }
      else if(n%3===1){for(let j=0;j<4;j++)for(let i=0;i<4;i++){if(field(x+i*17,y+j*17)<-.05&&rnd()>.12)rect(x+i*17,y+j*17,2,2,shade(s.glyph,173/219));}}
    }
    // Oversized, repeated letter fragments make the occasional typographic glitch.
    const letters='ssttrreewwxxllkkaaoohh',cutouts=[],accentGlyphs=[];
    let transparentDefs='';
    for(let n=0;n<(graph?0:Math.round(s.accent*.68));n++){
      if(!edges.length)break;
      const [x,y]=edges[Math.floor(rnd()*edges.length)],size=step*(1.8+rnd()*.6),ch=letters[Math.floor(rnd()*letters.length)];
      const vertical=rnd()>.55,length=2+Math.floor(rnd()*4);
      for(let j=0;j<length;j++)for(let k=0;k<(vertical?2:1);k++){
        const gx=x+(vertical?k:j)*size*.67,gy=y+(vertical?j:k)*size*.95;
        if(gx>lw-10||gy>lh-10)continue;
        if(s.transparent){cutouts.push([gx-size*.33,gy-size*.5,size*.68,size]);accentGlyphs.push([ch,gx,gy,size]);}
        else{rect(gx-size*.33,gy-size*.5,size*.68,size,s.background);glyph(ch,gx,gy,size,s.color);}
      }
    }
    if(s.transparent){
      // Knock out the glyph field before drawing accents. No colored backplates.
      if(vector&&cutouts.length){
        const holes=cutouts.map(([x,y,w,h])=>`<rect x="${number(x)}" y="${number(y)}" width="${number(w)}" height="${number(h)}" fill="#000"/>`).join('');
        transparentDefs=`<defs><mask id="accent-cutouts" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="${lw}" height="${lh}" style="mask-type:luminance"><rect width="${lw}" height="${lh}" fill="#fff"/>${holes}</mask></defs>`;
        const field=parts.join('');parts.length=0;parts.push(`<g mask="url(#accent-cutouts)">${field}</g>`);
      }else if(!vector){for(const [x,y,w,h] of cutouts)ctx.clearRect(x,y,w,h);}
      for(const [ch,x,y,size] of accentGlyphs)glyph(ch,x,y,size,s.color);
    }
    if(shape){
      if(vector){const background=s.transparent?'':parts.shift();const content=parts.join('');parts.length=0;if(background)parts.push(background);parts.push(`<g clip-path="url(#artwork-shape)">${content}</g>`);}
      else ctx.restore();
    }
    const shapeDefs=shape?`<defs><clipPath id="artwork-shape"><path d="${shape.path}" clip-rule="evenodd"/></clipPath></defs>`:'';
    const svgDocument=defs=>`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${lw} ${lh}" overflow="hidden"><title>${escapeXML(compositionName(s)+' — '+s.seed)}</title><desc>Glyph Field artwork. Editable text and vector shapes; glyph appearance depends on the installed monospace font.</desc><metadata>${escapeXML(JSON.stringify(s))}</metadata>${shapeDefs}${defs}<g font-family="monospace" text-anchor="middle" dominant-baseline="central">${parts.join('')}</g></svg>`;
    // Full-surface grain/vignette would tint empty pixels, so omit them in alpha mode.
    if(s.transparent)return vector?svgDocument(transparentDefs):Math.round(performance.now()-start);
    // A low-opacity grain tile and a vignette soften the opaque background.
    if(vector){
      // Reuse the exact grain samples as vector paths in a repeating pattern.
      const grainPaths=Array.from({length:20},()=>[]);
      for(let y=0;y<160;y++)for(let x=0;x<160;x++){
        const light=rnd()>.5,alpha=Math.floor(rnd()*10);
        if(alpha)grainPaths[(light?10:0)+alpha].push(`M${x} ${y}h1v1h-1z`);
      }
      const grain=grainPaths.map((paths,i)=>paths.length?`<path fill="${i>=10?'#fff':'#000'}" fill-opacity="${number((i%10)/255)}" d="${paths.join('')}"/>`:'').join('');
      const defs=`<defs><pattern id="grain" width="160" height="160" patternUnits="userSpaceOnUse">${grain}</pattern><radialGradient id="vignette" gradientUnits="userSpaceOnUse" cx="${lw*.5}" cy="${lh*.5}" r="${Math.max(lw,lh)*.72}" fx="${lw*.5}" fy="${lh*.45}" fr="${short*.1}"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${37/255}"/></radialGradient></defs>`;
      parts.push(`<rect width="${lw}" height="${lh}" fill="url(#grain)"/><rect width="${lw}" height="${lh}" fill="url(#vignette)"/>`);
      return svgDocument(defs);
    }
    const grain=document.createElement('canvas');grain.width=grain.height=160;
    const gc=grain.getContext('2d'),pixels=gc.createImageData(160,160);
    for(let i=0;i<pixels.data.length;i+=4){const v=rnd()>.5?255:0;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;pixels.data[i+3]=Math.floor(rnd()*10);}
    gc.putImageData(pixels,0,0);ctx.fillStyle=ctx.createPattern(grain,'repeat');ctx.fillRect(0,0,lw,lh);
    const vignette=ctx.createRadialGradient(lw*.5,lh*.45,short*.1,lw*.5,lh*.5,Math.max(lw,lh)*.72);
    vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#00000025');ctx.fillStyle=vignette;ctx.fillRect(0,0,lw,lh);
    return Math.round(performance.now()-start);
  }
  function sync(){
    if(dial){syncingDials=true;try{dial.setValues(Object.fromEntries(CONTROL_SPECS.map(c=>[c.path,state[c.key]])));}finally{syncingDials=false;}}
    const graph=state.mode==='graph';
    $('field-controls').hidden=graph;$('graph-controls').hidden=!graph;$('graph-colors').hidden=!graph;$('glyph-picker').hidden=graph;
    $('palette').hidden=graph;$('graph-pixel-only').hidden=state.graphStyle!=='pixel';
    $('graph-pixel-name').textContent=state.graphStyle==='pixel'?'Pixel size':'Glyph size';$('graph-stars-name').textContent=state.graphStyle==='pixel'?'Sparkle':'Marks';    document.querySelectorAll('.mode-tab').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
    for(const [id,key] of GRAPH_CONTROLS){$('graph-'+id).value=state[key];$('graph-'+id+'-value').textContent=state[key];}
    for(const [id,key] of GRAPH_SELECTS)$(id).value=state[key];
    SERIES.forEach((key,i)=>{$(key+'-color').value=state[key];$(key+'-picker').hidden=i>=state.graphSeries;});
    document.querySelectorAll('.graph-palette').forEach(b=>b.setAttribute('aria-pressed',String(graphPalettes[b.dataset.palette].colors.every((c,i)=>c===state[SERIES[i]]))));
    $('graph-multi').hidden=state.graphSeries===1;$('series1-color').dataset.label=state.graphSeries===1?'Graph':'Series 1';$('graph-gap').disabled=state.graphLayout==='stack';
    $('graph-series-note').textContent=state.graphSeries===1?'One graph, one color. Add more to compare side by side or layer them.':state.graphLayout==='stack'?'Graphs overlap on one baseline, back to front.':'Graphs sit next to each other, each in its own color.';
    $('circle-controls').hidden=state.form!=='circles';$('shape-controls').hidden=['circles','spiral'].includes(state.form);$('spiral-controls').hidden=state.form!=='spiral';$('texture-controls').hidden=state.form==='spiral';
    $('spiral-direction').value=state.spiralDirection;
    for(const [id,key] of SPIRAL_CONTROLS){$('spiral-'+id).value=state[key];$('spiral-'+id+'-value').textContent=state[key];}
    $('circle-layout').value=state.circleLayout;$('circle-style').value=state.circleStyle;
    for(const [id,key] of [['circle-size','circleSize'],['circle-spacing','circleSpacing']]){$(id).value=state[key];$(id+'-value').textContent=state[key];}
    $('shape').value=state.shape;$('shape-fill').value=state.shapeFill;$('shape-fill-row').hidden=state.shape==='freeform';$('shape-description').textContent=state.shape==='freeform'?'Let the pattern extend to the canvas edges.':'A centered '+shapeNames[state.shape].toLowerCase()+', filled with glyphs.';
    $('seed').value=state.seed;$('ratio').value=state.ratio;$('resolution').value=state.resolution;
    document.querySelectorAll('.form').forEach(b=>{const on=b.dataset.form===state.form;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});
    positionSelection();
    $('accent-color').value=state.color;$('background-color').value=state.background;$('glyph-color').value=state.glyph;$('glyph-color').dataset.label=state.form==='spiral'?'Dot':'Glyph';
    $('transparent-background').checked=state.transparent;$('background-color').disabled=state.transparent;
    art.parentElement.classList.toggle('is-transparent',state.transparent);
    $('structure-description').textContent=descriptions[state.form];
    $('art-title').textContent=compositionName(state);$('seed-display').textContent=state.seed;
    $('dimensions').textContent=sizeFor(ratioOf(state),state.resolution).join(' × ');
    art.parentElement.style.setProperty('--art-ratio',ratioOf(state).replace(':',' / '));
    const tracing=state.form==='trace'&&!!traced;
    selection.style.display=tracing?'none':'';
    $('trace-loaded').hidden=!traced;$('trace-settings').hidden=!tracing;$('trace-use').hidden=!traced||tracing;
    $('trace-upload').textContent=traced?'Upload another image':'Upload image';
    if(traced){$('trace-thumb').src=traced.thumb;$('trace-name').textContent=traced.name;$('trace-meta').textContent=`${traced.width} × ${traced.height} · glyph size ${traced.step}`;}
    for(const [id,key] of TRACE_CONTROLS){$('trace-'+id).value=state[key];$('trace-'+id+'-value').textContent=state[key];}
    $('ratio').disabled=tracing;
    if(!tracing)comparing=false;
    const overlay=$('trace-overlay');overlay.hidden=!comparing;if(comparing&&overlay.src!==traced.src)overlay.src=traced.src;
    $('trace-compare').setAttribute('aria-pressed',String(comparing));$('trace-compare').textContent=comparing?'Hide original':'Compare with original';
    document.querySelectorAll('.circle-range').forEach(paintRange);
    document.dispatchEvent(new Event('glyph-field:sync'));
  }
  function persist(){try{localStorage.setItem('glyph-field-v1',JSON.stringify({state,exportFormat,motionSettings}));}catch{/* Private browsing can disable storage. */}}
  function paintRange(el){el.style.setProperty('--fill',((el.value-el.min)/(el.max-el.min)*100)+'%');}
  document.addEventListener('input',e=>{if(e.target.matches?.('.circle-range'))paintRange(e.target);});
  function fitChecker(){const ratio=art.width/art.height,width=Math.min(art.clientWidth,art.clientHeight*ratio);for(const id of ['transparency-grid','trace-overlay']){$(id).style.width=width+'px';$(id).style.height=width/ratio+'px';}}
  new ResizeObserver(fitChecker).observe(art);
  function draw(){
    if(tuneFrame){cancelAnimationFrame(tuneFrame);tuneFrame=0;}
    revision++;sync();const ms=render(art,state);fitChecker();$('render-status').textContent=`Rendered in ${ms} ms`;
    if(state.mode==='graph')art.setAttribute('aria-label',`${compositionName(state)}: ${state.graphStyle==='pixel'?'pixel-dithered':'ASCII glyph'} chart with ${state.graphSeries} series, seed ${state.seed}, on a ${state.transparent?'transparent':state.background} background.`);
    else art.setAttribute('aria-label',`${compositionName(state)}: ${state.form==='spiral'?'dotted spiral':'ASCII'} artwork, seed ${state.seed}, with ${state.glyph} ${state.form==='spiral'?'dots':'glyphs'}, ${state.color} accents, and a ${state.transparent?'transparent':state.background} background.`);
    persist();
  }
  function generate(){const a=new Uint32Array(1);crypto.getRandomValues(a);state.seed=String(a[0]%1000000).padStart(6,'0');draw();}
  document.querySelectorAll('.form').forEach(b=>b.addEventListener('click',()=>{state.form=b.dataset.form;draw();}));
  for(const [id,key] of [['accent-color','color'],['background-color','background'],['glyph-color','glyph']])$(id).addEventListener('change',()=>{state[key]=$(id).value;draw();});
  $('transparent-background').addEventListener('change',()=>{state.transparent=$('transparent-background').checked;draw();});
  for(const [id,key] of [['shape','shape'],['shape-fill','shapeFill'],['circle-layout','circleLayout'],['circle-style','circleStyle'],['spiral-direction','spiralDirection']])$(id).addEventListener('change',()=>{state[key]=$(id).value;draw();});
  for(const [id,key] of [['circle-size','circleSize'],['circle-spacing','circleSpacing']])$(id).addEventListener('input',()=>{state[key]=Number($(id).value);draw();});
  for(const [id,key] of SPIRAL_CONTROLS)$('spiral-'+id).addEventListener('input',()=>{state[key]=Number($('spiral-'+id).value);draw();});
  $('spiral-palette').addEventListener('click',()=>{state.background='#c8c8cb';state.glyph='#7771ca';state.color='#df77da';draw();});
  $('ratio').addEventListener('change',()=>{state.ratio=$('ratio').value;draw();});
  function applyTracePalette(){
    const p=traced.palette;state.background=p.background;state.glyph=p.glyph;state.transparent=false;
    if(p.accent){state.color=p.accent;if(!state.accent)state.accent=defaults.accent;}else state.accent=0;
  }
  async function loadTrace(file){
    if(!file||!/^image\//.test(file.type)){$('render-status').textContent='Choose a PNG, JPG, or WebP image.';return;}
    $('render-status').textContent='Reading image…';
    try{
      const next=await GlyphTrace.analyze(file,sizeFor);
      if(traced)URL.revokeObjectURL(traced.src);
      traced=next;
      Object.assign(state,{mode:'field',form:'trace',traceStep:traced.step,traceThreshold:defaults.traceThreshold,traceSmooth:defaults.traceSmooth,traceEdge:defaults.traceEdge,shape:'freeform'});
      applyTracePalette();draw();
    }catch(error){console.error(error);$('render-status').textContent=error.message.startsWith('No glyphs')?error.message:'Could not read this image.';}
  }
  $('trace-upload').addEventListener('click',()=>$('trace-file').click());
  $('trace-file').addEventListener('change',()=>{loadTrace($('trace-file').files[0]);$('trace-file').value='';});
  $('trace-use').addEventListener('click',()=>{state.mode='field';state.form='trace';draw();});
  $('trace-colors').addEventListener('click',()=>{applyTracePalette();draw();});
  $('trace-compare').addEventListener('click',()=>{comparing=!comparing;sync();fitChecker();});
  for(const [id,key] of TRACE_CONTROLS)$('trace-'+id).addEventListener('input',()=>{state[key]=Number($('trace-'+id).value);draw();});
  const stage=art.parentElement;
  stage.addEventListener('dragover',e=>{if([...e.dataTransfer.types].includes('Files')){e.preventDefault();stage.classList.add('is-dropping');}});
  stage.addEventListener('dragleave',()=>stage.classList.remove('is-dropping'));
  stage.addEventListener('drop',e=>{e.preventDefault();stage.classList.remove('is-dropping');loadTrace(e.dataTransfer.files[0]);});
  $('resolution').addEventListener('change',()=>{state.resolution=Number($('resolution').value);sync();persist();});
  $('export-format').addEventListener('change',()=>{exportFormat=$('export-format').value;persist();});
  function applySeed(){const value=$('seed').value.trim();state.seed=value||defaults.seed;draw();}
  $('apply-seed').addEventListener('click',applySeed);$('seed').addEventListener('keydown',e=>{if(e.key==='Enter')applySeed();});
  $('generate').addEventListener('click',generate);
  $('reset').addEventListener('click',()=>{for(const k of ['scale','density','detail','accent'])state[k]=defaults[k];draw();});
  $('reset-colors').addEventListener('click',()=>{for(const key of ['background','glyph','color','transparent',...SERIES])state[key]=defaults[key];draw();});
  $('graph-style').addEventListener('change',()=>{
    // Each style has a natural starting palette; only swap it while the user hasn't picked their own.
    const from=graphPalettes[state.graphStyle==='pixel'?'reference':'field'].colors,to=graphPalettes[state.graphStyle==='pixel'?'field':'reference'].colors;
    if(SERIES.every((k,i)=>state[k]===from[i]))SERIES.forEach((k,i)=>{state[k]=to[i];});
  });
  document.querySelectorAll('.mode-tab').forEach(b=>b.addEventListener('click',()=>{if(state.mode===b.dataset.mode)return;state.mode=b.dataset.mode;draw();}));
  for(const [id,key] of GRAPH_CONTROLS)$('graph-'+id).addEventListener('input',()=>{state[key]=Number($('graph-'+id).value);draw();});
  for(const [id,key] of GRAPH_SELECTS)$(id).addEventListener('change',()=>{state[key]=$(id).value;draw();});
  for(const key of SERIES)$(key+'-color').addEventListener('change',()=>{state[key]=$(key+'-color').value;draw();});
  for(const [id,palette] of Object.entries(graphPalettes)){
    const button=document.createElement('button');button.type='button';button.className='graph-palette';button.dataset.palette=id;
    const strip=document.createElement('span');strip.className='palette-strip';strip.setAttribute('aria-hidden','true');
    for(const color of palette.colors){const chip=document.createElement('i');chip.style.background=color;strip.append(chip);}
    const label=document.createElement('span');label.textContent=palette.name;button.append(strip,label);
    button.addEventListener('click',()=>{palette.colors.forEach((c,i)=>{state[SERIES[i]]=c;});draw();});
    $('graph-palettes').append(button);
  }
  $('reset-graph').addEventListener('click',()=>{for(const k of Object.keys(defaults))if(k.startsWith('graph'))state[k]=defaults[k];draw();});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.defaultPrevented&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!document.activeElement.closest('.dialkit-root,[contenteditable="true"],[role="listbox"],[role="menu"],[role="dialog"]')&&!['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(document.activeElement.tagName)){e.preventDefault();generate();}});
  let exportFeedbackTimer;
  $('download').addEventListener('click',async()=>{
    const button=$('download'),formatControl=$('export-format'),restoreFocus=document.activeElement===$('download');
    clearTimeout(exportFeedbackTimer);button.dataset.state='busy';button.setAttribute('aria-label','Preparing export');button.setAttribute('aria-busy','true');button.disabled=true;formatControl.disabled=true;
    const exportState={...state},exportRevision=revision,format=exportFormat;
    try{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      let blob;
      if(format==='svg')blob=new Blob([render(null,exportState,exportState.resolution,true)],{type:'image/svg+xml;charset=utf-8'});
      else{
        const canvas=document.createElement('canvas');render(canvas,exportState,exportState.resolution);
        blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG encoding failed');
      }
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=exportState.mode==='graph'?`glyph-field-graph-${exportState.graphProfile}-${exportState.seed.replace(/[^a-z0-9_-]/gi,'_')}-${exportState.resolution}${exportState.transparent?'-transparent':''}.${format}`:`glyph-field-${exportState.form}${exportState.form==='spiral'?'':exportState.form==='circles'?'-'+exportState.circleLayout+'-'+exportState.circleStyle:exportState.shape==='freeform'?'':'-'+exportState.shape}-${exportState.seed.replace(/[^a-z0-9_-]/gi,'_')}-${exportState.resolution}${exportState.transparent?'-transparent':''}.${format}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      button.dataset.state='done';button.setAttribute('aria-label','Exported artwork');
      if(revision===exportRevision)$('render-status').textContent=format.toUpperCase()+' exported · '+(exportState.transparent?'Transparent · ':'')+(format==='svg'?'Scalable vector':sizeFor(ratioOf(exportState),exportState.resolution).join(' × '));
    }catch(error){button.dataset.state='idle';$('render-status').textContent='Export failed. Please try again.';console.error(error);}
    finally{button.disabled=false;formatControl.disabled=false;button.removeAttribute('aria-busy');button.setAttribute('aria-label','Export artwork');if(restoreFocus&&document.activeElement===document.body)button.focus({preventScroll:true});exportFeedbackTimer=setTimeout(()=>{button.dataset.state='idle';},1600);}
  });
  function valid(s){return s&&Object.hasOwn(names,s.form)&&TRACE_CONTROLS.every(([,k,min,max])=>s[k]===undefined||(Number.isInteger(s[k])&&s[k]>=min&&s[k]<=max))&&(s.mode===undefined||['field','graph'].includes(s.mode))&&GRAPH_CONTROLS.every(([,k,min,max])=>s[k]===undefined||(Number.isInteger(s[k])&&s[k]>=min&&s[k]<=max))&&GRAPH_SELECTS.every(([,k,options])=>s[k]===undefined||options.includes(s[k]))&&SERIES.every(k=>s[k]===undefined||/^#[a-f0-9]{6}$/i.test(s[k]))&&SPIRAL_CONTROLS.every(([,k,min,max])=>s[k]===undefined||(Number.isFinite(s[k])&&s[k]>=min&&s[k]<=max))&&(s.spiralArms===undefined||Number.isInteger(s.spiralArms))&&(s.spiralDirection===undefined||['clockwise','counterclockwise'].includes(s.spiralDirection))&&(s.circleLayout===undefined||Object.hasOwn(arrangements,s.circleLayout))&&(s.circleStyle===undefined||['rings','discs','concentric'].includes(s.circleStyle))&&[['circleSize',20,100],['circleSpacing',0,80]].every(([k,min,max])=>s[k]===undefined||(Number.isFinite(s[k])&&s[k]>=min&&s[k]<=max))&&(s.shape===undefined||Object.hasOwn(shapeNames,s.shape))&&(s.shapeFill===undefined||['pattern','solid'].includes(s.shapeFill))&&typeof s.seed==='string'&&s.seed.length<=24&&['4:5','1:1','16:9','9:16'].includes(s.ratio)&&[2048,4096].includes(s.resolution)&&/^#[a-f0-9]{6}$/i.test(s.color)&&(s.transparent===undefined||typeof s.transparent==='boolean')&&['background','glyph'].every(key=>s[key]===undefined||/^#[a-f0-9]{6}$/i.test(s[key]))&&[['scale',10,90],['density',20,80],['detail',6,16],['accent',0,100]].every(([k,min,max])=>Number.isFinite(s[k])&&s[k]>=min&&s[k]<=max);}
  try{const saved=JSON.parse(localStorage.getItem('glyph-field-v1'));if(valid(saved?.state))state={...defaults,...saved.state};if(['png','svg'].includes(saved?.exportFormat))exportFormat=saved.exportFormat;
    const savedMotion=saved?.motionSettings,t=savedMotion?.transition;
    if(typeof savedMotion?.enabled==='boolean'&&t&&['spring','easing'].includes(t.type)){
      const numericKeys=['visualDuration','bounce','stiffness','damping','mass','duration'];
      if(numericKeys.every(k=>t[k]===undefined||Number.isFinite(t[k]))&&(t.type!=='easing'||(Number.isFinite(t.duration)&&Array.isArray(t.ease)&&t.ease.length===4&&t.ease.every(Number.isFinite))))motionSettings={enabled:savedMotion.enabled,transition:t};
    }
  }catch{/* Fresh state is always usable. */}
  if(state.form==='trace')state.form=defaults.form;
  $('export-format').value=exportFormat;
  mountDials();
  draw();
})();
