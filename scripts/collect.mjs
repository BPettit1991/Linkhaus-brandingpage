// Imports a folder of existing brand assets into kit/: sorts each file into the right folder by
// type and name, renames it consistently (<prefix><name>.<ext>, lowercase, hyphens), skips exact
// duplicates, and puts anything it can't place in kit/_unsorted/ (never published) for a human.
//
//   npm run collect -- /path/to/assets            (copies; the source is left untouched)
//   npm run collect -- /path/to/assets --dry-run  (shows the plan only)
import { readdirSync, statSync, mkdirSync, copyFileSync, readFileSync, existsSync } from 'node:fs';
import { join, extname, basename, dirname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../portal/config.mjs';
import { listKitFiles } from '../portal/classify.mjs';
import { slug } from './lib.mjs';

const IMG = /^(svg|png|jpe?g|webp|gif)$/, VID = /^(mp4|mov|webm|m4v)$/, AUD = /^(wav|mp3|m4a|aac)$/, FONT = /^(woff2?|ttf|otf)$/;

// Pure: a source file's relative path -> where it belongs in the kit (or null = unsorted).
export function targetFor(rel, prefix = '') {
  const ext = extname(rel).slice(1).toLowerCase();
  const words = rel.toLowerCase().replace(/\\/g, '/');
  const name = slug(basename(rel, extname(rel))) || 'file';
  const pre = prefix && !name.startsWith(slug(prefix)) ? prefix : '';
  const file = (dir, n = name) => `${dir}/${pre}${n}.${ext}`;
  const has = (re) => re.test(words);

  // Already organised like a kit (logos/…, print/…): keep the structure, tidy the names.
  const parts = words.split('/');
  const KIT_DIRS = ['logos', 'colors', 'colours', 'fonts', 'social', 'print', 'digital', 'video', 'guides'];
  const looseLogos = parts[0] === 'logos' && !['svg', 'png', 'badge'].includes(parts[1]);
  if (parts.length > 1 && KIT_DIRS.includes(parts[0]) && !looseLogos) {
    const top = parts[0] === 'colours' ? 'colors' : parts[0];
    const segs = rel.replace(/\\/g, '/').split('/').slice(1).map((x) => x.replace(/\s+/g, '-'));
    const leaf = segs.pop();
    const keep = top === 'fonts' || /^\d+px$/i.test(basename(leaf, extname(leaf)));
    const tidy = keep ? leaf : `${pre}${name}.${ext}`;
    return [top, ...segs.map((x) => x.toLowerCase()), tidy].join('/');
  }
  if (parts.length === 1 && /^(readme\.md|style-?guide\.html?)$/.test(parts[0])) return parts[0] === 'readme.md' ? 'README.md' : 'style-guide.html';
  if (IMG.test(ext) && has(/(^|\/)posters?\//)) return `video/posters/${name}.${ext}`;
  if (IMG.test(ext) && has(/(^|\/)previews?\//)) return `print/previews/${name}.${ext}`;
  if (FONT.test(ext)) return `fonts/${basename(rel).replace(/\s+/g, '-')}`;
  if (ext === 'txt' && has(/ofl|licen[cs]e|font/)) return `fonts/${basename(rel).replace(/\s+/g, '-')}`;
  if (/^(ase|aco|gpl)$/.test(ext) || ((ext === 'json' || ext === 'css') && has(/colou?r|palette|swatch/))) return file('colors');
  if (VID.test(ext) || AUD.test(ext)) return file('video');
  if (ext === 'html' && has(/signature/)) return file('digital');
  if (ext === 'pdf' && has(/guide|guidelines|brand-?book|style/)) return file('guides');
  if (ext === 'pdf' && has(/card|letterhead|flyer|brochure|sign|label|sticker|magnet|compliments|invoice|quote|poster|banner|menu|tag/)) return file('print');
  if (IMG.test(ext)) {
    if (has(/badge|seal|stamp/)) return file('logos/badge');
    if (has(/logo|icon|wordmark|monogram|favicon|lockup|symbol/)) return file(ext === 'svg' ? 'logos/svg' : 'logos/png');
    if (has(/profile|avatar|\bpfp\b|dp\b/)) return file('social/profile');
    if (has(/cover|banner|header/)) return file('social/covers');
    if (has(/story|stories|reel|9x16/)) return file('social/stories');
    if (has(/post|instagram|facebook|linkedin|tiktok|social|1080/)) return file('social/posts');
    if (has(/zoom|teams|background|og-?image|share|email/)) return file('digital');
    if (has(/card|letterhead|flyer|sign|magnet|label/)) return file('print/previews');
  }
  if (ext === 'pdf') return file('print');
  return null;
}

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const walk = (dir) => readdirSync(dir).flatMap((n) => {
  if (n.startsWith('.') || n === 'node_modules' || n === '__MACOSX') return [];
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

function main() {
  const args = process.argv.slice(2);
  const src = args.find((x) => !x.startsWith('--'));
  const dry = args.includes('--dry-run');
  if (!src || !existsSync(src)) { console.error('Usage: npm run collect -- /path/to/assets [--dry-run]'); process.exit(1); }
  const C = loadConfig();
  const known = new Map(listKitFiles(C).map((p) => [sha(join(C.kit, p)), p]));
  const plan = { copied: [], duplicate: [], unsorted: [] };
  for (const abs of walk(src)) {
    const rel = relative(src, abs);
    const hash = sha(abs);
    if (known.has(hash)) { plan.duplicate.push(`${rel}  (same as kit/${known.get(hash)})`); continue; }
    let dest = targetFor(rel, C.brand.filePrefix);
    const bucket = dest ? 'copied' : 'unsorted';
    if (!dest) dest = `_unsorted/${basename(rel).replace(/\s+/g, '-')}`;
    // Never overwrite: add -2, -3 … if the name is taken.
    let final = dest, n = 2;
    while (existsSync(join(C.kit, final))) final = dest.replace(/(\.[^.]+)$/, `-${n++}$1`);
    plan[bucket].push(`${rel}  ->  kit/${final}`);
    known.set(hash, final);
    if (!dry) { mkdirSync(dirname(join(C.kit, final)), { recursive: true }); copyFileSync(abs, join(C.kit, final)); }
  }
  const show = (title, list) => list.length && console.log(`\n${title} (${list.length}):\n  ${list.join('\n  ')}`);
  show(dry ? 'Would copy' : 'Copied', plan.copied);
  show('Skipped, already in the kit', plan.duplicate);
  show(dry ? 'Would put in kit/_unsorted (not published)' : 'Put in kit/_unsorted (not published): move these by hand', plan.unsorted);
  console.log(`\nNext: check names and folders, add print previews (print/previews/<same name>.png) and video posters (video/posters/<same name>.jpg), then npm run check.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
