import React, { useEffect, useRef, useState } from 'react';
import { Plus, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { hexToHsv, hsvToHex, wheelPoint } from './color-utils';
const presets = [
  ['Monochrome','#eeeeee'], ['Violet','#b980e8'], ['Sage','#b9d89c'],
  ['Ember','#f49a77'], ['Ice','#9bcddd'],
];
export function ColorPicker({kind='accent'}:{kind?:'accent'|'background'|'glyph'}) {
  const name=kind==='accent'?'Accent':kind==='background'?'Background':'Glyph';
  const compactControl=kind!=='accent';
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
    const sync=()=>{setDisabled(native.disabled);if(native.value!==lastEmitted.current){setHex(native.value);setDraft(native.value);setHsv(hexToHsv(native.value));setError(false);}};
    document.addEventListener('glyph-field:sync',sync);
    return ()=>document.removeEventListener('glyph-field:sync',sync);
  },[native]);
  function commit(next: ReturnType<typeof hexToHsv>) {
    const color=hsvToHex(next);setHsv(next);setHex(color);setDraft(color);setError(false);
    lastEmitted.current=color;native.value=color;native.dispatchEvent(new Event('change',{bubbles:true}));lastEmitted.current='';
  }
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
  const custom=!presets.some(([,color])=>color===hex);
  return <div className={`accent-control ${disabled?'color-control-disabled':''} ${compactControl?'compact-color-control':''}`}>
    <div className="accent-heading"><span>{name} color</span>{!compactControl&&<span className="color-code">{hex.toUpperCase()}</span>}</div>
    <div className="color-presets" role="group" aria-label={`${name} color controls`}>
      {!compactControl&&presets.map(([name,color])=><button key={name} type="button" className="color-swatch" aria-label={name} title={name} aria-pressed={hex===color} onClick={()=>commit(hexToHsv(color))}>
        <span style={{background:color}}>{hex===color&&<Check size={12} strokeWidth={2.5}/>}</span>
      </button>)}
      <Popover>
        <PopoverTrigger asChild><Button disabled={disabled} variant="outline" size="icon" className={`custom-color ${compactControl?'color-value-trigger':''}`} aria-label={compactControl?`Choose ${kind} color`:'Choose custom accent color'} title={`${name} color`} data-selected={custom}>{compactControl?<><span className="trigger-color" style={{background:hex}}/><span className="trigger-hex">{hex.toUpperCase()}</span><ChevronDown size={13}/></>:<Plus size={16}/>}</Button></PopoverTrigger>
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
