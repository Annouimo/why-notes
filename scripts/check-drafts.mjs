import { readdir, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
for (const entry of await readdir(resolve(root, 'src/content/notes'), { withFileTypes:true })) {
  if (!entry.isDirectory()) continue;
  const source = await readFile(resolve(root, 'src/content/notes', entry.name, 'index.mdx'), 'utf8');
  const metadata = source.split('---')[1] || '';
  if (!/^draft:\s*true\s*$/m.test(metadata)) continue;
  const output = resolve(root, 'dist/notes', entry.name, 'index.html');
  try { await access(output); throw new Error(`Draft leaked into production: ${entry.name}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
console.log('Production draft exclusion verified.');
