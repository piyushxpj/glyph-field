import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = [
  ['dialkit/dist/vanilla/browser.global.js', 'dialkit.js'],
  ['dialkit/dist/vanilla/styles.css', 'dialkit.css'],
  ['dialkit/LICENSE', 'dialkit-LICENSE.txt'],
  ['motion/dist/motion.js', 'motion.js'],
  ['motion/LICENSE.md', 'motion-LICENSE.md'],
];
await mkdir(join(root, 'vendor'), { recursive: true });
for (const [source, target] of files) await copyFile(join(root, 'node_modules', source), join(root, 'vendor', target));
const versions = {};
for (const name of ['dialkit', 'motion']) versions[name] = JSON.parse(await readFile(join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
await writeFile(join(root, 'vendor/versions.json'), JSON.stringify(versions, null, 2) + '\n');
console.log('Offline browser bundles prepared:', versions);
