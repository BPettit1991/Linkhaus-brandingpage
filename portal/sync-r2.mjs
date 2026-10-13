// Uploads the master files listed in dist/manifest.json to the R2 bucket, and removes files
// that are no longer in the kit. Only changed files are uploaded: the previous run's content
// hashes are kept in the bucket at _meta/hashes.json.
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node portal/sync-r2.mjs
// Add --dry-run to print the plan without uploading.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadConfig } from './config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry-run');
const CFG = loadConfig();
const BUCKET = CFG.portal.bucket;
const TYPES = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  pdf: 'application/pdf', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', wav: 'audio/wav', mp3: 'audio/mpeg', m4a: 'audio/mp4',
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json', md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', ase: 'application/octet-stream', zip: 'application/zip',
};

const wrangler = (args, opts = {}) => execFileSync('npx', ['wrangler', ...args], { cwd: HERE, stdio: opts.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8' });
const { items } = JSON.parse(readFileSync(join(HERE, 'dist/manifest.json'), 'utf8'));
const next = Object.fromEntries(items.map((i) => [i.path, i.hash]));

// Create the bucket on first run (needs R2 enabled on the account, a one-off dashboard step).
if (!DRY) {
  try {
    wrangler(['r2', 'bucket', 'info', BUCKET], { capture: true });
  } catch {
    console.log(`Creating R2 bucket ${BUCKET}`);
    wrangler(['r2', 'bucket', 'create', BUCKET]);
  }
}

let prev = {};
const tmp = mkdtempSync(join(tmpdir(), 'brand-r2-'));
try {
  wrangler(['r2', 'object', 'get', `${BUCKET}/_meta/hashes.json`, '--remote', '--file', join(tmp, 'hashes.json')], { capture: true });
  prev = JSON.parse(readFileSync(join(tmp, 'hashes.json'), 'utf8'));
} catch {
  console.log('No previous upload record: uploading everything.');
}

const upload = items.filter((i) => prev[i.path] !== i.hash);
const remove = Object.keys(prev).filter((p) => !(p in next));
console.log(`R2 ${BUCKET}: ${upload.length} to upload, ${remove.length} to delete, ${items.length - upload.length} unchanged`);
if (DRY) { upload.forEach((i) => console.log('  +', i.path)); remove.forEach((p) => console.log('  -', p)); process.exit(0); }

for (const i of upload) {
  console.log(`  + ${i.path}`);
  wrangler(['r2', 'object', 'put', `${BUCKET}/${i.path}`, '--remote', '--file', join(CFG.kit, i.path), '--content-type', TYPES[i.ext] || 'application/octet-stream']);
}
for (const p of remove) {
  console.log(`  - ${p}`);
  wrangler(['r2', 'object', 'delete', `${BUCKET}/${p}`, '--remote']);
}
writeFileSync(join(tmp, 'hashes.json'), JSON.stringify(next));
wrangler(['r2', 'object', 'put', `${BUCKET}/_meta/hashes.json`, '--remote', '--file', join(tmp, 'hashes.json'), '--content-type', 'application/json']);
console.log('R2 sync complete.');
