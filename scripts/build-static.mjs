import './sync-vendor.mjs';
import './build-ui.mjs';
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
await cp(join(root, 'vendor'), join(output, 'vendor'), { recursive: true });
await mkdir(join(output, 'examples'), { recursive: true });
await copyFile(join(root, 'examples/mycelium-978573.svg'), join(output, 'examples/mycelium-978573.svg'));
console.log('Static site ready in dist/.');
