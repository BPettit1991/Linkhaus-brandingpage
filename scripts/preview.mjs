// Local preview of the portal: serves portal/dist and the kit files at /files/… with no
// Cloudflare and no sign-in. For checking a brand's portal before deploying. Local use only.
//   npm run build && npm run preview          then open http://localhost:8788
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { loadConfig, PORTAL } from '../portal/config.mjs';

const C = loadConfig();
const DIST = join(PORTAL, 'dist');
const PORT = Number(process.env.PORT || 8788);
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', pdf: 'application/pdf', mp4: 'video/mp4', wav: 'audio/wav', woff2: 'font/woff2', ttf: 'font/ttf', md: 'text/plain; charset=utf-8', txt: 'text/plain; charset=utf-8' };
if (!existsSync(join(DIST, 'manifest.json'))) { console.error('Run npm run build first.'); process.exit(1); }

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname);
  const isFile = path.startsWith('/files/');
  const base = isFile ? C.kit : DIST;
  path = isFile ? path.slice(7) : (path === '/' ? 'index.html' : path.slice(1));
  const abs = normalize(join(base, path));
  if (!abs.startsWith(base) || !existsSync(abs) || statSync(abs).isDirectory()) { res.writeHead(404).end('Not found'); return; }
  const headers = { 'content-type': TYPES[extname(abs).slice(1)] || 'application/octet-stream' };
  if (url.searchParams.has('download')) headers['content-disposition'] = `attachment; filename="${path.split('/').pop()}"`;
  res.writeHead(200, headers);
  createReadStream(abs).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`${C.brand.name} portal preview: http://localhost:${PORT}  (local only, no sign-in)`));
