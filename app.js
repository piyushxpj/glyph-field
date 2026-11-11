/* Glyph Field: deterministic, entirely local procedural typography. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const names = {mycelium:'Mycelium',islands:'Archipelago',ribbons:'Currents',contours:'Contours',cells:'Cellular'};
  const defaults = {form:'mycelium',seed:'781204',scale:50,density:48,detail:9,accent:35,color:'#b980e8',ratio:'4:5',resolution:2048};
  let state = {...defaults}, history = [], timer, revision = 0, exportFormat = 'png';
  const art = $('art');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const CONTROL_SPECS = [
    {key:'scale',path:'formScale',min:10,max:90},
    {key:'density',path:'coverage',min:20,max:80},
    {key:'detail',path:'glyphSize',min:6,max:16},
    {key:'accent',path:'accentMarks',min:0,max:100},
  ];
  let motionSettings={enabled:true,transition:{type:'spring',visualDuration:.24,bounce:.08}};
  let dial, syncingDials=false, tuneFrame=0;
  const activeAnimations=new Map();
  const forms=document.querySelector('.forms');
  const selection=document.createElement('span');selection.className='structure-selection';selection.setAttribute('aria-hidden','true');forms.prepend(selection);
  let selectionReady=false;
  function motionOptions(){const t=motionSettings.transition;return {...t,type:t.type==='easing'?'tween':'spring'};}
  function stopAnimation(element){activeAnimations.get(element)?.stop();activeAnimations.delete(element);}
  function animateUI(element,keyframes,options=motionOptions()){
    stopAnimation(element);
    const animation=Motion.animate(element,keyframes,options);activeAnimations.set(element,animation);
    animation.then(()=>{if(activeAnimations.get(element)===animation)activeAnimations.delete(element);});
  }
  function motionAllowed(){return motionSettings.enabled&&!reducedMotion.matches;}
  function previewFeedback(){
    if(!motionAllowed())return;
    animateUI(art,{opacity:[.62,1],scale:[.996,1]});
  }
  function positionSelection(animate=true){
    const button=forms.querySelector('.selected');if(!button)return;
    const x=button.offsetLeft,y=button.offsetTop;
    selection.style.width=button.offsetWidth+'px';selection.style.height=button.offsetHeight+'px';
    if(selectionReady&&animate&&motionAllowed())animateUI(selection,{x,y});
    else{stopAnimation(selection);Motion.animate(selection,{x,y},{duration:0});}
    selectionReady=true;
  }
  function settleMotion(){
    for(const animation of activeAnimations.values())animation.stop();activeAnimations.clear();
    art.style.opacity='1';art.style.transform='none';positionSelection(false);
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
    rect(0,0,lw,lh,'#181918');
    const seed=hash(s.seed),rnd=random(seed),noise=noiseFactory(seed),short=Math.min(lw,lh);
    const freq=2.2+(90-s.scale)*.051,step=s.detail*.72,cols=Math.ceil(lw/step)+2,rows=Math.ceil(lh/step)+2;
    const mask=new Uint8Array(cols*rows),values=new Float32Array(cols*rows),edges=[];
    const ox=rnd()*90,oy=rnd()*90,coverage=(s.density-48)/100;
    function field(x,y){
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
    const shades=['#c3c7bc','#d2d5ca','#ddded6'];
    for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
      const i=y*cols+x;if(!mask[i])continue;
      const px=(x-1)*step,py=(y-1)*step;
      const edge=!mask[i-1]||!mask[i+1]||!mask[i-cols]||!mask[i+cols]||!mask[i-cols-1]||!mask[i+cols+1];
      const texture=noise(px/short*4+15,py/short*4+27);
      if(edge){
        edges.push([px,py]);
        const ex=px+(rnd()-.5)*step*.5,ey=py+(rnd()-.5)*step*.5;
        glyph('⊗',ex,ey,step*1.95,'#d9dad2');
        glyph('@',ex,ey,step*1.5,'#d9dad2');
      } else {
        const ch=texture>.27?'×':texture>.02?'+':texture>-.2?'⁙':'✣';
        if(rnd()>.025)glyph(ch,px,py,step*(ch==='×'?1.48:ch==='✣'?1.04:1.22),shades[Math.min(2,Math.max(0,Math.floor((texture+1)*1.5)))]);
      }
    }
    // Sparse registration marks sit in the negative space.
    for(let n=0;n<40;n++){
      const x=20+rnd()*(lw-40),y=20+rnd()*(lh-40);
      if(field(x,y)>-.055)continue;
      if(n%3===0){
        if(vector)parts.push(`<path d="M${number(x-7)} ${number(y)}h14 M${number(x)} ${number(y-7)}v14" fill="none" stroke="#a7ada3" stroke-width="1.2"/>`);
        else{ctx.strokeStyle='#a7ada3';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-7,y);ctx.lineTo(x+7,y);ctx.moveTo(x,y-7);ctx.lineTo(x,y+7);ctx.stroke();}
      }
      else if(n%3===1){for(let j=0;j<4;j++)for(let i=0;i<4;i++){if(field(x+i*17,y+j*17)<-.05&&rnd()>.12)rect(x+i*17,y+j*17,2,2,'#acb2a8');}}
    }
    // Oversized, repeated letter fragments make the occasional violet glitch.
    const letters='ssttrreewwxxllkkaaoohh';
    for(let n=0;n<Math.round(s.accent*.68);n++){
      if(!edges.length)break;
      const [x,y]=edges[Math.floor(rnd()*edges.length)],size=step*(1.8+rnd()*.6),ch=letters[Math.floor(rnd()*letters.length)];
      const vertical=rnd()>.55,length=2+Math.floor(rnd()*4);
      for(let j=0;j<length;j++)for(let k=0;k<(vertical?2:1);k++){
        const gx=x+(vertical?k:j)*size*.67,gy=y+(vertical?j:k)*size*.95;
        if(gx>lw-10||gy>lh-10)continue;
        rect(gx-size*.33,gy-size*.5,size*.68,size,'#181918');
        glyph(ch,gx,gy,size,s.color);
      }
    }
    // A low-opacity grain tile and a vignette soften the digital grid.
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
      return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${lw} ${lh}" overflow="hidden"><title>${escapeXML(names[s.form]+' — '+s.seed)}</title><desc>Glyph Field artwork. Editable text and vector shapes; glyph appearance depends on the installed monospace font.</desc><metadata>${escapeXML(JSON.stringify(s))}</metadata>${defs}<g font-family="monospace" text-anchor="middle" dominant-baseline="central">${parts.join('')}</g></svg>`;
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
    $('seed').value=state.seed;$('ratio').value=state.ratio;$('resolution').value=state.resolution;
    document.querySelectorAll('.form').forEach(b=>{const on=b.dataset.form===state.form;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',on);});
    positionSelection();
    document.querySelectorAll('.swatch').forEach(b=>{const on=b.dataset.color===state.color;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on);});
    $('art-title').textContent=names[state.form];$('seed-display').textContent=state.seed;
    $('dimensions').textContent=sizeFor(state.ratio,state.resolution).join(' × ');
    art.parentElement.style.setProperty('--art-ratio',state.ratio.replace(':',' / '));
  }
  function persist(){try{localStorage.setItem('glyph-field-v1',JSON.stringify({state,exportFormat,motionSettings,history:history.map(e=>e.state)}));}catch{/* Private browsing can disable storage. */}}
  function key(s){const {resolution,...visual}=s;return JSON.stringify(visual);}
  function thumbnail(){const c=document.createElement('canvas');c.width=144;c.height=Math.round(144*art.height/art.width);c.getContext('2d').drawImage(art,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.72);}
  function showHistory(){
    $('history').replaceChildren();$('history-count').textContent=String(history.length).padStart(2,'0');
    history.forEach((entry,i)=>{
      const button=document.createElement('button');button.className='history-item'+(key(entry.state)===key(state)?' current':'');button.title=`${names[entry.state.form]} · ${entry.state.seed}`;button.setAttribute('aria-label',`Restore ${names[entry.state.form]} seed ${entry.state.seed}`);
      const img=document.createElement('img');img.src=entry.image;img.alt='';const label=document.createElement('span');label.textContent=entry.state.seed;button.append(img,label);
      button.addEventListener('click',()=>{clearTimeout(timer);state={...entry.state,resolution:state.resolution};draw(false,true);});$('history').append(button);
    });
  }
  function remember(){const k=key(state);const existing=history.find(e=>key(e.state)===k);if(!existing)history.unshift({state:{...state},image:thumbnail()});history=history.slice(0,8);showHistory();persist();if(!existing&&motionAllowed())animateUI($('history').firstElementChild,{opacity:[.4,1],y:[5,0]});}
  function draw(save=true,feedback=false){
    if(tuneFrame){cancelAnimationFrame(tuneFrame);tuneFrame=0;}
    revision++;sync();const ms=render(art,state);$('render-status').textContent=`Rendered in ${ms} ms`;
    art.setAttribute('aria-label',`${names[state.form]}: organic ASCII artwork, seed ${state.seed}, with pale glyphs and ${state.color} accents on charcoal.`);
    if(save)remember();else{showHistory();persist();}
    if(feedback)previewFeedback();
  }
  function generate(){clearTimeout(timer);const a=new Uint32Array(1);crypto.getRandomValues(a);state.seed=String(a[0]%1000000).padStart(6,'0');draw(true,true);}
  document.querySelectorAll('.form').forEach(b=>b.addEventListener('click',()=>{clearTimeout(timer);state.form=b.dataset.form;draw(true,true);}));
  document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{clearTimeout(timer);state.color=b.dataset.color;draw();}));
  $('ratio').addEventListener('change',()=>{state.ratio=$('ratio').value;draw();});
  $('resolution').addEventListener('change',()=>{state.resolution=Number($('resolution').value);sync();persist();});
  $('export-format').addEventListener('change',()=>{exportFormat=$('export-format').value;persist();});
  function applySeed(){const value=$('seed').value.trim();state.seed=value||defaults.seed;draw();}
  $('apply-seed').addEventListener('click',applySeed);$('seed').addEventListener('keydown',e=>{if(e.key==='Enter')applySeed();});
  $('generate').addEventListener('click',generate);
  $('generate-quick').addEventListener('click',generate);
  $('reset').addEventListener('click',()=>{clearTimeout(timer);for(const k of ['scale','density','detail','accent','color'])state[k]=defaults[k];draw();});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.defaultPrevented&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!document.activeElement.closest('.dialkit-root,[contenteditable="true"]')&&!['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(document.activeElement.tagName)){e.preventDefault();generate();}});
  $('download').addEventListener('click',async()=>{
    const button=$('download'),formatControl=$('export-format');button.disabled=true;formatControl.disabled=true;button.textContent='Exporting…';
    const exportState={...state},exportRevision=revision,format=exportFormat;
    try{
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      let blob;
      if(format==='svg')blob=new Blob([render(null,exportState,exportState.resolution,true)],{type:'image/svg+xml;charset=utf-8'});
      else{
        const canvas=document.createElement('canvas');render(canvas,exportState,exportState.resolution);
        blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG encoding failed');
      }
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`glyph-field-${exportState.form}-${exportState.seed.replace(/[^a-z0-9_-]/gi,'_')}-${exportState.resolution}.${format}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      if(revision===exportRevision)$('render-status').textContent=format.toUpperCase()+' exported · '+(format==='svg'?'Scalable vector':sizeFor(exportState.ratio,exportState.resolution).join(' × '));
    }catch(error){$('render-status').textContent='Export failed. Please try again.';console.error(error);}
    finally{button.disabled=false;formatControl.disabled=false;button.innerHTML='Export <span aria-hidden="true">↗</span>';}
  });
  function valid(s){return s&&names[s.form]&&typeof s.seed==='string'&&s.seed.length<=24&&['4:5','1:1','16:9','9:16'].includes(s.ratio)&&[2048,4096].includes(s.resolution)&&/^#[a-f0-9]{6}$/i.test(s.color)&&[['scale',10,90],['density',20,80],['detail',6,16],['accent',0,100]].every(([k,min,max])=>Number.isFinite(s[k])&&s[k]>=min&&s[k]<=max);}
  try{const saved=JSON.parse(localStorage.getItem('glyph-field-v1'));if(valid(saved?.state))state={...saved.state};if(['png','svg'].includes(saved?.exportFormat))exportFormat=saved.exportFormat;
    const savedMotion=saved?.motionSettings,t=savedMotion?.transition;
    if(typeof savedMotion?.enabled==='boolean'&&t&&['spring','easing'].includes(t.type)){
      const numericKeys=['visualDuration','bounce','stiffness','damping','mass','duration'];
      if(numericKeys.every(k=>t[k]===undefined||Number.isFinite(t[k]))&&(t.type!=='easing'||(Number.isFinite(t.duration)&&Array.isArray(t.ease)&&t.ease.length===4&&t.ease.every(Number.isFinite))))motionSettings={enabled:savedMotion.enabled,transition:t};
    }
    if(Array.isArray(saved?.history)){for(const s of saved.history.slice(0,8)){if(!valid(s))continue;render(art,s,300);history.push({state:s,image:thumbnail()});}}
  }catch{/* Fresh state is always usable. */}
  $('export-format').value=exportFormat;
  mountDials();
  draw();
})();
