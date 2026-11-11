import './sync-vendor.mjs';
import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const name of ['index.html', 'style.css', 'app.js']) {
  await copyFile(join(root, name), join(output, name));
}
// An extracted offline package does not contain another copy of itself.
await copyFile(join(root, 'glyph-field-offline.zip'), join(output, 'glyph-field-offline.zip')).catch(error => {
  if (error.code !== 'ENOENT') throw error;
});
for (const name of ['vendor', 'examples']) {
  await cp(join(root, name), join(output, name), { recursive: true });
}
console.log('Static site ready in dist/.');
