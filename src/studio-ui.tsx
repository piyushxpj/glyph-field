import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Shuffle, Download, Check, RotateCcw, CornerDownLeft, GitBranch, Waves, Layers, CircleDot, Hexagon, Scan, ArrowUpRight } from 'lucide-react';
import { ColorPicker } from './color-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// The renderer remains the single source of truth. Native selects retain their
// values and change events; these small React roots provide the accessible UI.
function StudioSelect({ target, label, className = '' }: {target: string; label: string; className?: string}) {
  const native = document.getElementById(target) as HTMLSelectElement;
  const [value, setValue] = useState(native.value);
  const [disabled, setDisabled] = useState(native.disabled);
  useEffect(() => {
    const sync = () => { setValue(native.value); setDisabled(native.disabled); };
    const observer = new MutationObserver(sync);
    observer.observe(native, { attributes: true, attributeFilter: ['disabled'] });
    document.addEventListener('glyph-field:sync', sync);
    native.addEventListener('change', sync);
    return () => { observer.disconnect(); document.removeEventListener('glyph-field:sync', sync); native.removeEventListener('change', sync); };
  }, [native]);
  return <Select value={value} disabled={disabled} onValueChange={next => {
    native.value = next; setValue(next); native.dispatchEvent(new Event('change', {bubbles:true}));
  }}>
    <SelectTrigger aria-label={label} className={`studio-select ${className}`}><SelectValue /></SelectTrigger>
    <SelectContent position="popper" sideOffset={6} className="studio-select-menu">
      {Array.from(native.options).map(option => <SelectItem key={option.value} value={option.value}>{option.textContent}</SelectItem>)}
    </SelectContent>
  </Select>;
}
function Toolbar() {
  return <>
    <Button id="generate" variant="outline" className="generate"><Shuffle aria-hidden="true"/>New composition<kbd>Space</kbd></Button>
    <Button id="generate-quick" variant="outline" className="quick-generate" aria-label="Generate new image"><Shuffle aria-hidden="true"/><span>New</span></Button>
    <div className="export-controls">
      <StudioSelect target="export-format" label="Export format" className="format-select" />
      <Button id="download" className="export" data-state="idle" aria-label="Export artwork">
        <span className="export-face export-idle" aria-hidden="true"><Download/>Export</span>
        <span className="export-face export-busy" aria-hidden="true">Preparing</span>
        <span className="export-face export-done" aria-hidden="true"><Check/>Exported</span>
      </Button>
    </div>
  </>;
}
function mount(id: string, element: React.ReactNode) {
  const target = document.getElementById(id);
  if (target) flushSync(() => createRoot(target).render(element));
}
mount('toolbar', <Toolbar/>);
mount('palette', <ColorPicker/>);
mount('background-picker', <ColorPicker kind="background"/>);
mount('glyph-picker', <ColorPicker kind="glyph"/>);
mount('reset-colors-control', <Button id="reset-colors" variant="ghost" size="sm" className="texture-reset"><RotateCcw aria-hidden="true"/>Reset colors</Button>);
mount('ratio-select', <StudioSelect target="ratio" label="Canvas ratio"/>);
mount('resolution-select', <StudioSelect target="resolution" label="Export size"/>);
mount('reset-control', <Button id="reset" variant="ghost" size="sm" className="texture-reset"><RotateCcw aria-hidden="true"/>Reset texture</Button>);
mount('seed-apply', <Button id="apply-seed" variant="ghost" size="icon" aria-label="Apply seed"><CornerDownLeft aria-hidden="true"/></Button>);
const icons = { GitBranch, Waves, Layers, CircleDot, Hexagon, Scan, ArrowUpRight };
for (const element of document.querySelectorAll<HTMLElement>('[data-icon]')) {
  const Icon = icons[element.dataset.icon as keyof typeof icons];
  if (Icon) flushSync(() => createRoot(element).render(<Icon aria-hidden="true" size={18} strokeWidth={1.5}/>));
}
