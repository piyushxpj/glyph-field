import React, { useEffect, useRef, useState } from 'react';
import { Plus, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { hexToHsv, hsvToHex, wheelPoint } from './color-utils';
const PRESETS: Record<string, [string, string][]> = {
  background: [['Aubergine','#201527'], ['Forest','#062916'], ['Midnight','#000011'], ['Burnt Ochre','#9a581f']],
  glyph: [['Lilac','#b182c2'], ['Leaf','#65cc5c'], ['Copper','#c0752f'], ['Moss','#1d8414'], ['Silver','#adadad']],
  accent: [['White','#ffffff'], ['Electric Violet','#8320c5'], ['Botanical Green','#3ca42c'], ['Burnt Ochre','#9a581f']],
};
// A check mark has to stay visible on both the dark and the light presets.
const checkColor=(hex:string)=>{const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));return r*.299+g*.587+b*.114>150?'#111':'#fff';};
export function ColorPicker({kind='accent',label}:{kind?:string;label?:string}) {
  const defaultName=label??(kind==='accent'?'Accent':kind==='background'?'Background':'Glyph');
  const [name,setName]=useState(defaultName);
  const presets=PRESETS[kind]??[];
  const compactControl=!presets.length;
  const inputId=`${kind}-color`;
  const hexId=`${kind}-hex`;
  const [compact,setCompact]=useState(matchMedia('(max-width:700px)').matches);
  useEffect(()=>{const query=matchMedia('(max-width:700px)');const sync=()=>setCompact(query.matches);query.addEventListener('change',sync);return ()=>query.removeEventListener('change',sync);},[]);
  const native = document.getElementById(inputId) as HTMLInputElement;
  const [disabled,setDisabled]=useState(native.disabled);
  const [hex,setHex] = useState(native.value);
  const [draft,setDraft] = useState(native.value);
  const [hsv,setHsv] = useState(hexToHsv(native.value));
  const [error,setError] = useState(false);
  const lastEmitted = useRef('');
  useEffect(()=>{
    const sync=()=>{setName(native.dataset.label||defaultName);setDisabled(native.disabled);if(native.value!==lastEmitted.current){setHex(native.value);setDraft(native.value);setHsv(hexToHsv(native.value));setError(false);}};
    document.addEventListener('glyph-field:sync',sync);
    return ()=>document.removeEventListener('glyph-field:sync',sync);
  },[native,defaultName]);
  function commit(next: ReturnType<typeof hexToHsv>) {
    const color=hsvToHex(next);setHsv(next);setHex(color);setDraft(color);setError(false);
    emit(color);
  }
  function emit(color:string){lastEmitted.current=color;native.value=color;native.dispatchEvent(new Event('change',{bubbles:true}));lastEmitted.current='';}
  // Presets are applied as their exact hex, without the HSV round trip.
  function choosePreset(color:string){setHsv(hexToHsv(color));setHex(color);setDraft(color);setError(false);emit(color);}
  function applyHex() {
    const candidate=draft.startsWith('#')?draft:'#'+draft;
    if(!/^#[0-9a-f]{6}$/i.test(candidate)){setError(true);return;}
    commit(hexToHsv(candidate));
  }
  function point(event: React.PointerEvent<HTMLDivElement>) {
    const box=event.currentTarget.getBoundingClientRect();
    const next=wheelPoint(event.clientX-box.left,event.clientY-box.top,box.width,box.height);
    commit({...hsv,...next});
  }
  const angle=hsv.h*Math.PI/180;
  const same=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
  const custom=!presets.some(([,color])=>same(color,hex));
  return <div className={`accent-control ${disabled?'color-control-disabled':''} ${compactControl?'compact-color-control':''}`}>
    <div className="accent-heading"><span>{name} color</span>{!compactControl&&<span className="color-code">{hex.toUpperCase()}</span>}</div>
    <div className="color-presets" role="group" aria-label={`${name} color controls`}>
      {presets.map(([swatch,color])=><button key={color} type="button" disabled={disabled} className="color-swatch" aria-label={`${swatch} ${color.toUpperCase()}`} title={`${swatch} · ${color.toUpperCase()}`} aria-pressed={same(hex,color)} onClick={()=>choosePreset(color)}>
        <span style={{background:color,color:checkColor(color)}}>{same(hex,color)&&<Check size={12} strokeWidth={2.5}/>}</span>
      </button>)}
      <Popover>
        <PopoverTrigger asChild><Button disabled={disabled} variant="outline" size="icon" className={`custom-color ${compactControl?'color-value-trigger':''}`} aria-label={compactControl?`Choose ${name.toLowerCase()} color`:`Choose custom ${name.toLowerCase()} color`} title={`${name} color`} data-selected={custom}>{compactControl?<><span className="trigger-color" style={{background:hex}}/><span className="trigger-hex">{hex.toUpperCase()}</span><ChevronDown size={13}/></>:<Plus size={16}/>}</Button></PopoverTrigger>
        <PopoverContent aria-label={`${name} color picker`} side={compact?'top':'right'} align={compact?'end':'center'} sideOffset={12} collisionPadding={12} className="color-popover">
          <div className="color-popover-heading"><span>{name} color</span><span className="color-preview" style={{background:hex}}/></div>
          <div className="color-wheel" role="group" tabIndex={0}
            aria-label={`Color wheel. Hue ${Math.round(hsv.h)} degrees, saturation ${Math.round(hsv.s)} percent. Left and right change hue; up and down change saturation.`}
            onKeyDown={event=>{
              const step=event.shiftKey?10:1;
              if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
                event.preventDefault();
                commit({...hsv,h:(hsv.h+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0)+360)%360,s:Math.max(0,Math.min(100,event.key==='Home'?0:event.key==='End'?100:hsv.s+(event.key==='ArrowUp'?step:event.key==='ArrowDown'?-step:0)))});
              }
            }}
            onPointerDown={event=>{if(!event.isPrimary||event.button!==0)return;event.currentTarget.setPointerCapture(event.pointerId);point(event);}}
            onPointerMove={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))point(event);}}
            onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}>
            <div className="wheel-shade" style={{opacity:1-hsv.v/100}}/>
            <span className="wheel-handle" style={{left:`${50+Math.sin(angle)*hsv.s/2}%`,top:`${50-Math.cos(angle)*hsv.s/2}%`,background:hex}}/>
          </div>
          <div className="color-sliders">
            {([['h','Hue',360,'°'],['s','Saturation',100,'%'],['v','Brightness',100,'%']] as const).map(([key,label,max,unit])=><div className="color-slider-row" key={key}>
              <div><label id={`${kind}-${key}-label`}>{label}</label><output>{Math.round(hsv[key])}{unit}</output></div>
              <Slider aria-labelledby={`${kind}-${key}-label`} value={[hsv[key]]} min={0} max={max} step={1} onValueChange={values=>commit({...hsv,[key]:values[0]})}/>
            </div>)}
          </div>
          <form className="hex-row" onSubmit={event=>{event.preventDefault();applyHex();}}>
            <label htmlFor={hexId}>Hex</label>
            <input id={hexId} value={draft} maxLength={7} spellCheck={false} autoComplete="off" aria-invalid={error} aria-describedby={error?`${kind}-color-error`:undefined} onChange={event=>{setDraft(event.target.value);setError(false);}}/>
            <Button type="button" onClick={applyHex} variant="secondary" size="icon" aria-label="Apply hex color"><Check size={16}/></Button>
          </form>
          {error&&<p id={`${kind}-color-error`} role="alert" className="color-error">Enter six hex digits, such as #B980E8.</p>}
        </PopoverContent>
      </Popover>
    </div>
  </div>;
}
