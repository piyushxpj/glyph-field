/* Glyph Field: deterministic, entirely local procedural typography. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = {mycelium:'Mycelium',islands:'Archipelago',ribbons:'Currents',contours:'Contours',cells:'Cellular',circles:'Circles',spiral:'Spiral'};
  const descriptions={mycelium:'Branching networks',islands:'Scattered landforms',ribbons:'Winding channels',contours:'Nested elevations',cells:'Organic membranes',circles:'Repeating circular motifs',spiral:'Scattered dotted spirals'};
  const {names:shapeNames,geometry:shapeGeometry,arrangements,circlePattern,spiralPoints}=GlyphShapes;
  const compositionName=s=>s.form==='spiral'?'Spiral':s.form==='circles'?`Circles · ${arrangements[s.circleLayout||'grid']}`:s.shape&&s.shape!=='freeform'?`${shapeNames[s.shape]} · ${names[s.form]}`:names[s.form];
  const defaults = {form:'mycelium',spiralTurns:3.5,spiralArms:2,spiralScatter:55,spiralDotSize:8,spiralDensity:75,spiralAccent:35,spiralDirection:'clockwise',circleLayout:'grid',circleStyle:'rings',circleSize:60,circleSpacing:28,shape:'freeform',shapeFill:'pattern',seed:'781204',scale:50,density:48,detail:9,accent:35,color:'#eeeeee',background:'#181818',glyph:'#dbdbdb',transparent:false,ratio:'4:5',resolution:2048};
  const SPIRAL_CONTROLS=[['turns','spiralTurns',1,7],['arms','spiralArms',1,5],['scatter','spiralScatter',0,100],['dot-size','spiralDotSize',2,14],['density','spiralDensity',20,100],['accent','spiralAccent',0,100]];
  let state = {...defaults}, history = [], timer, revision = 0, exportFormat = 'png';
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
        if(!tuneFrame)tuneFrame=requestAnimationFrame(()=>{tuneFrame=0;draw(false);});
        clearTimeout(timer);timer=setTimeout(remember,350);
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
    const [lw,lh]=sizeFor(s.ratio,1500),[w,h]=sizeFor(s.ratio,longest);
    const parts=[],number=n=>Number(n.toFixed(3));
    let ctx;
    if(!vector){canvas.width=w;canvas.height=h;ctx=canvas.getContext('2d');ctx.scale(w/lw,h/lh);}
    function rect(x,y,width,height,color){
      if(vector)parts.push(`<rect x="${number(x)}" y="${number(y)}" width="${number(width)}" height="${number(height)}" fill="${color}"/>`);
      else{ctx.fillStyle=color;ctx.fillRect(x,y,width,height);}
    }
    if(!s.transparent)rect(0,0,lw,lh,s.background);
    const seed=hash(s.seed),rnd=random(seed),noise=noiseFactory(seed),short=Math.min(lw,lh);
    if(s.form==='spiral'){
      const points=spiralPoints(s,lw,lh,rnd);
      for(const p of points){const color=p.accent?s.color:s.glyph;
        if(vector)parts.push(`<circle cx="${number(p.x)}" cy="${number(p.y)}" r="${number(p.r)}" fill="${color}"/>`);
        else{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
      }
      if(vector)return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${lw} ${lh}" overflow="hidden"><title>Spiral — ${escapeXML(s.seed)}</title><desc>Seeded dotted spiral trails. Editable vector circles.</desc><metadata>${escapeXML(JSON.stringify(s))}</metadata>${parts.join('')}</svg>`;
      return Math.round(performance.now()-start);
    }
    const shape=s.form==='circles'?null:shapeGeometry(s.shape||'freeform',lw,lh);
    const circular=s.form==='circles'?circlePattern(s,lw,lh,random(seed^0x517cc1b7)):null;
    if(shape&&!vector){ctx.save();ctx.clip(new Path2D(shape.path),'evenodd');}
    const freq=2.2+(90-s.scale)*.051,step=s.detail*.72,cols=Math.ceil(lw/step)+2,rows=Math.ceil(lh/step)+2;
    const mask=new Uint8Array(cols*rows),values=new Float32Array(cols*rows),edges=[];
    const ox=rnd()*90,oy=rnd()*90,coverage=(s.density-48)/100;
    function organicField(x,y){
      if(circular)return circular.field(x,y);
      const nx=x/short*freq+ox,ny=y/short*freq+oy;
      const wx=nx+noise(nx*.7+12,ny*.7)*.7,wy=ny+noise(nx*.7,ny*.7+39)*.7;
      const n=noise(wx,wy)*.78+noise(wx*2.07+5,wy*2.07)*.19+noise(wx*5.1,wy*5.1)*.047+noise(wx*18.7,wy*18.7)*.017;
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
    const shades=[shade(s.glyph,194/219),shade(s.glyph,208/219),s.glyph],edgeColor=shade(s.glyph,215/219),markColor=shade(s.glyph,168/219);
    for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
      const i=y*cols+x;if(!mask[i])continue;
      const px=(x-1)*step,py=(y-1)*step;
      const edge=!mask[i-1]||!mask[i+1]||!mask[i-cols]||!mask[i+cols]||!mask[i-cols-1]||!mask[i+cols+1];
      const texture=noise(px/short*(circular?freq:4)+15,py/short*(circular?freq:4)+27)+(shape&&s.shapeFill==='solid'?organicField(px,py)*.7:0);
      if(edge){
        edges.push([px,py]);
        const ex=px+(rnd()-.5)*step*(circular?0:.5),ey=py+(rnd()-.5)*step*(circular?0:.5);
        glyph('⊗',ex,ey,step*1.95,edgeColor);
        glyph('@',ex,ey,step*1.5,edgeColor);
      } else {
        const ch=texture>.27?'×':texture>.02?'+':texture>-.2?'⁙':'✣';
        if(rnd()>.025)glyph(ch,px,py,step*(ch==='×'?1.48:ch==='✣'?1.04:1.22),shades[Math.min(2,Math.max(0,Math.floor((texture+1)*1.5)))]);
      }
    }
    // Sparse registration marks sit in the negative space.
    for(let n=0;n<(circular?0:40);n++){
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
    for(let n=0;n<Math.round(s.accent*.68);n++){
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
    $('dimensions').textContent=sizeFor(state.ratio,state.resolution).join(' × ');
    art.parentElement.style.setProperty('--art-ratio',state.ratio.replace(':',' / '));
    document.dispatchEvent(new Event('glyph-field:sync'));
  }
  function persist(){try{localStorage.setItem('glyph-field-v1',JSON.stringify({state,exportFormat,motionSettings,history:history.map(e=>e.state)}));}catch{/* Private browsing can disable storage. */}}
  function key(s){const {resolution,...visual}=s;return JSON.stringify(visual);}
  function fitChecker(){const ratio=art.width/art.height,width=Math.min(art.clientWidth,art.clientHeight*ratio);$('transparency-grid').style.width=width+'px';$('transparency-grid').style.height=width/ratio+'px';}
  new ResizeObserver(fitChecker).observe(art);
  function thumbnail(transparent=state.transparent){const c=document.createElement('canvas');c.width=144;c.height=Math.round(144*art.height/art.width);c.getContext('2d').drawImage(art,0,0,c.width,c.height);return transparent?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.72);}
  const historyButtons=new Map();
  function showHistory(){
    const container=$('history'),visible=new Set(history.map(entry=>key(entry.state)));
    for(const [id,button] of historyButtons){if(!visible.has(id)){button.remove();historyButtons.delete(id);}}
    $('history-count').textContent=String(history.length).padStart(2,'0');
    history.forEach((entry,index)=>{
      const id=key(entry.state);let button=historyButtons.get(id);
      if(!button){
        button=document.createElement('button');button.className='history-item';button.dataset.transparent=String(!!entry.state.transparent);
        button.title=`${compositionName(entry.state)} · ${entry.state.seed}`;
        button.setAttribute('aria-label',`Restore ${compositionName(entry.state)} seed ${entry.state.seed}`);
        const img=document.createElement('img');img.src=entry.image;img.alt='';
        const label=document.createElement('span');label.className='history-caption';
        const name=document.createElement('strong');name.textContent=compositionName(entry.state);
        const seed=document.createElement('small');seed.textContent=entry.state.seed;label.append(name,seed);button.append(img,label);
        button.addEventListener('click',()=>{clearTimeout(timer);state={...entry.state,resolution:state.resolution};draw(false);});
        historyButtons.set(id,button);
      }
      const current=id===key(state);button.classList.toggle('current',current);button.setAttribute('aria-pressed',String(current));
      // Keep existing nodes in place so keyboard focus survives every render.
      if(container.children[index]!==button)container.insertBefore(button,container.children[index]||null);
    });
  }
  function remember(){const k=key(state);const existing=history.find(e=>key(e.state)===k);if(!existing)history.unshift({state:{...state},image:thumbnail()});history=history.slice(0,8);showHistory();persist();}
  function draw(save=true){
    if(tuneFrame){cancelAnimationFrame(tuneFrame);tuneFrame=0;}
    revision++;sync();const ms=render(art,state);fitChecker();$('render-status').textContent=`Rendered in ${ms} ms`;
    art.setAttribute('aria-label',`${compositionName(state)}: ${state.form==='spiral'?'dotted spiral':'ASCII'} artwork, seed ${state.seed}, with ${state.glyph} ${state.form==='spiral'?'dots':'glyphs'}, ${state.color} accents, and a ${state.transparent?'transparent':state.background} background.`);
    if(save)remember();else{showHistory();persist();}
  }
  function generate(){clearTimeout(timer);const a=new Uint32Array(1);crypto.getRandomValues(a);state.seed=String(a[0]%1000000).padStart(6,'0');draw();}
  document.querySelectorAll('.form').forEach(b=>b.addEventListener('click',()=>{clearTimeout(timer);state.form=b.dataset.form;draw();}));
  for(const [id,key] of [['accent-color','color'],['background-color','background'],['glyph-color','glyph']])$(id).addEventListener('change',()=>{state[key]=$(id).value;draw(false);clearTimeout(timer);timer=setTimeout(remember,350);});
  $('transparent-background').addEventListener('change',()=>{clearTimeout(timer);state.transparent=$('transparent-background').checked;draw();});
  for(const [id,key] of [['shape','shape'],['shape-fill','shapeFill'],['circle-layout','circleLayout'],['circle-style','circleStyle'],['spiral-direction','spiralDirection']])$(id).addEventListener('change',()=>{clearTimeout(timer);state[key]=$(id).value;draw();});
  for(const [id,key] of [['circle-size','circleSize'],['circle-spacing','circleSpacing']])$(id).addEventListener('input',()=>{state[key]=Number($(id).value);draw(false);clearTimeout(timer);timer=setTimeout(remember,350);});
  for(const [id,key] of SPIRAL_CONTROLS)$('spiral-'+id).addEventListener('input',()=>{state[key]=Number($('spiral-'+id).value);draw(false);clearTimeout(timer);timer=setTimeout(remember,350);});
  $('spiral-palette').addEventListener('click',()=>{clearTimeout(timer);state.background='#c8c8cb';state.glyph='#7771ca';state.color='#df77da';draw();});
  $('ratio').addEventListener('change',()=>{state.ratio=$('ratio').value;draw();});
  $('resolution').addEventListener('change',()=>{state.resolution=Number($('resolution').value);sync();persist();});
  $('export-format').addEventListener('change',()=>{exportFormat=$('export-format').value;persist();});
  function applySeed(){const value=$('seed').value.trim();state.seed=value||defaults.seed;draw();}
  $('apply-seed').addEventListener('click',applySeed);$('seed').addEventListener('keydown',e=>{if(e.key==='Enter')applySeed();});
  $('generate').addEventListener('click',generate);
  $('generate-quick').addEventListener('click',generate);
  $('reset').addEventListener('click',()=>{clearTimeout(timer);for(const k of ['scale','density','detail','accent'])state[k]=defaults[k];draw();});
  $('reset-colors').addEventListener('click',()=>{clearTimeout(timer);for(const key of ['background','glyph','color','transparent'])state[key]=defaults[key];draw();});
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
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`glyph-field-${exportState.form}${exportState.form==='spiral'?'':exportState.form==='circles'?'-'+exportState.circleLayout+'-'+exportState.circleStyle:exportState.shape==='freeform'?'':'-'+exportState.shape}-${exportState.seed.replace(/[^a-z0-9_-]/gi,'_')}-${exportState.resolution}${exportState.transparent?'-transparent':''}.${format}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      button.dataset.state='done';button.setAttribute('aria-label','Exported artwork');
      if(revision===exportRevision)$('render-status').textContent=format.toUpperCase()+' exported · '+(exportState.transparent?'Transparent · ':'')+(format==='svg'?'Scalable vector':sizeFor(exportState.ratio,exportState.resolution).join(' × '));
    }catch(error){button.dataset.state='idle';$('render-status').textContent='Export failed. Please try again.';console.error(error);}
    finally{button.disabled=false;formatControl.disabled=false;button.removeAttribute('aria-busy');button.setAttribute('aria-label','Export artwork');if(restoreFocus&&document.activeElement===document.body)button.focus({preventScroll:true});exportFeedbackTimer=setTimeout(()=>{button.dataset.state='idle';},1600);}
  });
  function valid(s){return s&&Object.hasOwn(names,s.form)&&SPIRAL_CONTROLS.every(([,k,min,max])=>s[k]===undefined||(Number.isFinite(s[k])&&s[k]>=min&&s[k]<=max))&&(s.spiralArms===undefined||Number.isInteger(s.spiralArms))&&(s.spiralDirection===undefined||['clockwise','counterclockwise'].includes(s.spiralDirection))&&(s.circleLayout===undefined||Object.hasOwn(arrangements,s.circleLayout))&&(s.circleStyle===undefined||['rings','discs','concentric'].includes(s.circleStyle))&&[['circleSize',20,100],['circleSpacing',0,80]].every(([k,min,max])=>s[k]===undefined||(Number.isFinite(s[k])&&s[k]>=min&&s[k]<=max))&&(s.shape===undefined||Object.hasOwn(shapeNames,s.shape))&&(s.shapeFill===undefined||['pattern','solid'].includes(s.shapeFill))&&typeof s.seed==='string'&&s.seed.length<=24&&['4:5','1:1','16:9','9:16'].includes(s.ratio)&&[2048,4096].includes(s.resolution)&&/^#[a-f0-9]{6}$/i.test(s.color)&&(s.transparent===undefined||typeof s.transparent==='boolean')&&['background','glyph'].every(key=>s[key]===undefined||/^#[a-f0-9]{6}$/i.test(s[key]))&&[['scale',10,90],['density',20,80],['detail',6,16],['accent',0,100]].every(([k,min,max])=>Number.isFinite(s[k])&&s[k]>=min&&s[k]<=max);}
  try{const saved=JSON.parse(localStorage.getItem('glyph-field-v1'));if(valid(saved?.state))state={...defaults,...saved.state};if(['png','svg'].includes(saved?.exportFormat))exportFormat=saved.exportFormat;
    const savedMotion=saved?.motionSettings,t=savedMotion?.transition;
    if(typeof savedMotion?.enabled==='boolean'&&t&&['spring','easing'].includes(t.type)){
      const numericKeys=['visualDuration','bounce','stiffness','damping','mass','duration'];
      if(numericKeys.every(k=>t[k]===undefined||Number.isFinite(t[k]))&&(t.type!=='easing'||(Number.isFinite(t.duration)&&Array.isArray(t.ease)&&t.ease.length===4&&t.ease.every(Number.isFinite))))motionSettings={enabled:savedMotion.enabled,transition:t};
    }
    if(Array.isArray(saved?.history)){for(const s of saved.history.slice(0,8)){if(!valid(s))continue;const restored={...defaults,...s};if(history.some(entry=>key(entry.state)===key(restored)))continue;render(art,restored,300);history.push({state:restored,image:thumbnail(restored.transparent)});}}
  }catch{/* Fresh state is always usable. */}
  $('export-format').value=exportFormat;
  mountDials();
  draw();
})();
