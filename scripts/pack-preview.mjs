// A small, self-contained reviewer preview for upload through Cloudflare's API.
// Production should serve the untouched dist directory with Workers Static Assets.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const assets = {};
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    const extension = extname(path);
    // The preview targets modern browsers. Keep WOFF2; omit unused fallback formats.
    if (extension === '.woff' || extension === '.ttf') continue;
    const key = '/' + relative(dist, path).replaceAll('\\', '/');
    const binary = !['.html','.css','.js','.svg','.txt','.json'].includes(extension);
    let content = await readFile(path, binary ? 'base64' : 'utf8');
    if (extension === '.css') content = content.replace(/,url\([^)]*\.(?:woff|ttf)\)\s*format\([^)]*\)/g, '');
    const mime = ({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.json':'application/json'})[extension] || 'application/octet-stream';
    assets[key] = { content, binary, mime };
  }
}
await walk(dist);
if (!assets['/notes/uniform-continuity/index.html']?.content.includes('noindex')) throw new Error('Build the draft preview first: npm run build:preview');
const handler = `
export default {
  fetch(request) {
    const url = new URL(request.url);
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed', {status:405,headers:{Allow:'GET, HEAD'}});
    let path;
    try { path = decodeURIComponent(url.pathname); } catch { return new Response('Bad request', {status:400}); }
    if (!path.endsWith('/') && assets[path+'/index.html']) {
      url.pathname += '/'; return Response.redirect(url.toString(), 308);
    }
    const asset = assets[path.endsWith('/') ? path+'index.html' : path];
    const headers = {'X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'};
    if (!asset) return new Response(request.method==='HEAD'?null:'Page not found', {status:404,headers});
    headers['Content-Type'] = asset.mime;
    headers['Cache-Control'] = asset.mime.startsWith('text/html') ? 'no-store' : 'public, max-age=3600';
    const body = request.method==='HEAD' ? null : asset.binary ? Uint8Array.from(atob(asset.content), c=>c.charCodeAt(0)) : asset.content;
    return new Response(body, {headers});
  }
};
`;
await mkdir(resolve(root, '.cloudflare'), { recursive:true });
await writeFile(resolve(root, '.cloudflare/preview-worker.mjs'), 'const assets = '+JSON.stringify(assets)+';\n'+handler);
console.log(`Packed ${Object.keys(assets).length} preview assets into .cloudflare/preview-worker.mjs`);
