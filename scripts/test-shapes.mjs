import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const ctx=vm.createContext({performance,console});
vm.runInContext(readFileSync(new URL('../shapes.js',import.meta.url),'utf8'),ctx);
vm.runInContext(`const names={mycelium:'Mycelium'};const shapeGeometry=GlyphShapes.geometry;const compositionName=s=>GlyphShapes.names[s.shape];`+source.slice(source.indexOf('  function hash('),source.indexOf('  function sync(){')),ctx);
const state={form:'mycelium',seed:'shape-test',scale:50,density:48,detail:12,accent:35,color:'#eeeeee',background:'#181818',glyph:'#dbdbdb',resolution:2048};
for(const [kind] of Object.entries(ctx.GlyphShapes.names)){
 for(const ratio of ['4:5','16:9','1:1','9:16']){
  const [a,b]=ratio.split(':').map(Number),w=a>=b?1500:1500*a/b,h=b>=a?1500:1500*b/a;
  const shape=ctx.GlyphShapes.geometry(kind,w,h);
  if(kind==='freeform'){assert.equal(shape,null);continue;}
  assert(shape.distance(0,0)<0,kind+' excludes corners');
  assert.equal(shape.distance(w/2,h/2)>0,kind!=='ring',kind+' center');
  for(const transparent of [false,true]){
   ctx.testState={...state,shape:kind,shapeFill:transparent?'solid':'pattern',ratio,transparent};
   const svg=vm.runInContext('render(null,testState,2048,true)',ctx);
   assert(svg.includes('clip-path="url(#artwork-shape)"'));
   assert(svg.includes('clip-rule="evenodd"'));
   assert(!svg.includes('NaN'));
   assert((svg.match(/<text /g)||[]).length>100,kind+' has glyphs');
   assert.equal(svg.includes('fill="#181818"'),!transparent);
   assert.equal(svg.includes('id="vignette"'),!transparent);
  }
 }
}
console.log('All shapes, four ratios, vector clipping, ring center, and transparent/opaque exports pass.');
