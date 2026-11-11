import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { readFile, writeFile, readdir } from 'node:fs/promises';
const root = fileURLToPath(new URL('../', import.meta.url));
const result=await build({metafile:true,entryPoints:[join(root,'src/studio-ui.tsx')],bundle:true,minify:true,format:'iife',target:['es2020'],outfile:join(root,'vendor/ui.js'),tsconfig:join(root,'tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
execFileSync(process.execPath,[join(root,'node_modules/@tailwindcss/cli/dist/index.mjs'),'-i',join(root,'src/ui.css'),'-o',join(root,'vendor/ui.css'),'--minify'],{cwd:root,stdio:'inherit'});
console.log('shadcn components and Lucide icons bundled locally.');

// Include the notices for packages actually present in the local UI bundle.
const packages=new Set();
for(const input of Object.keys(result.metafile.inputs)) {
  if(!input.includes('node_modules/')) continue;
  let dir=dirname(resolve(root,input));
  while(dir.startsWith(root)) {
    try { await readFile(join(dir,'package.json')); packages.add(dir); break; }
    catch { dir=dirname(dir); }
  }
}
const notices=[];
for(const dir of [...packages].sort()) {
  const meta=JSON.parse(await readFile(join(dir,'package.json'),'utf8'));
  for(const name of await readdir(dir)) if(/^licen[sc]e(?:\.|$)/i.test(name)) notices.push(meta.name+' '+meta.version+'\n'+await readFile(join(dir,name),'utf8'));
}
await writeFile(join(root,'vendor/ui-LICENSES.txt'),notices.join('\n\n----------------------------------------\n\n'));
