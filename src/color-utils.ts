export type HSV={h:number;s:number;v:number};
export function hexToHsv(hex:string):HSV {
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  let h=0;
  if(delta)h=max===r?((g-b)/delta)%6:max===g?(b-r)/delta+2:(r-g)/delta+4;
  return {h:(h*60+360)%360,s:max===0?0:delta/max*100,v:max*100};
}
export function hsvToHex({h,s,v}:HSV):string {
  const hue=((h%360)+360)%360/60,sat=Math.max(0,Math.min(100,s))/100,value=Math.max(0,Math.min(100,v))/100;
  const chroma=value*sat,x=chroma*(1-Math.abs(hue%2-1)),m=value-chroma;
  const rgb=hue<1?[chroma,x,0]:hue<2?[x,chroma,0]:hue<3?[0,chroma,x]:hue<4?[0,x,chroma]:hue<5?[x,0,chroma]:[chroma,0,x];
  return '#'+rgb.map(c=>Math.round((c+m)*255).toString(16).padStart(2,'0')).join('');
}
export function wheelPoint(x:number,y:number,width:number,height:number) {
  const dx=(x-width/2)/(width/2),dy=(y-height/2)/(height/2);
  return {h:(Math.atan2(dx,-dy)*180/Math.PI+360)%360,s:Math.min(100,Math.hypot(dx,dy)*100)};
}
