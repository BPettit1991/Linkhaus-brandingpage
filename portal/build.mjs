// Builds the brand portal into portal/dist from brand.config.json and the kit/ folder:
//   manifest.json   every published file with category, size, dimensions and usage notes
//   thumbs/         small WebP previews (images, video posters, print previews)
//   previews/       large WebP pictures of PDFs, so they preview on phones too
//   index.html, app.js, app.css, theme.css, fonts/, logo.svg, icon.svg   the portal UI
//   ../wrangler.generated.json   deploy config (Worker and bucket names from the config,
//                                custom domain from PORTAL_DOMAIN, Access settings from the environment)
//
//   node portal/build.mjs        (run from the repo root or portal/)
// Fails if any published file has no category, so nothing goes up unlabelled.
import { readFileSync, writeFileSync, mkdirSync, rmSync, statSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { loadConfig, PORTAL } from './config.mjs';
import { ASPECT } from './rules.mjs';
import { listKitFiles, classify } from './classify.mjs';

const C = loadConfig();
const KIT = C.kit;
const DIST = join(PORTAL, 'dist');
if (!existsSync(KIT)) throw new Error(`Kit folder not found: ${KIT}`);

const walk = (p) => {
  const abs = join(KIT, p);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [p];
  return readdirSync(abs).sort().flatMap((n) => walk(p ? `${p}/${n}` : n));
};
const files = listKitFiles(C);
const CATS = C.categories;
const kind = (ext) => ({ svg: 'image', png: 'image', jpg: 'image', jpeg: 'image', webp: 'image', gif: 'image', pdf: 'pdf', mp4: 'video', mov: 'video', webm: 'video', wav: 'audio', mp3: 'audio', m4a: 'audio', woff2: 'font', woff: 'font', ttf: 'font', otf: 'font', html: 'html', md: 'text', txt: 'text', json: 'data', css: 'data', ase: 'file' }[ext] || 'file');

// Thumbnail source: the file itself for images; a poster frame for videos
// (video/posters/<name>.jpg|png); a preview picture for PDFs (print/previews/<name>.png,
// or an explicit mapping in brand.config.json "previews").
function thumbSource(p) {
  if (/\.(png|jpe?g|svg|webp|gif)$/i.test(p)) return p;
  if (C.previews[p]) return C.previews[p];
  const name = basename(p, extname(p));
  const dir = p.split('/')[0];
  const candidates = /\.(mp4|mov|webm)$/i.test(p)
    ? [`video/posters/${name}.jpg`, `video/posters/${name}.png`]
    : [`${dir}/previews/${name}.png`, `${dir}/previews/${name}.jpg`];
  return candidates.find((c) => existsSync(join(KIT, c))) || null;
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'thumbs'), { recursive: true });

const items = [];
for (const p of files) {
  const abs = join(KIT, p);
  const ext = extname(p).slice(1).toLowerCase();
  const { cat, title, desc } = classify(C, p);
  const item = {
    path: p, title, cat, kind: kind(ext), ext,
    size: statSync(abs).size, desc,
    hash: createHash('sha256').update(readFileSync(abs)).digest('hex').slice(0, 16),
  };
  if (item.kind === 'image' && ext !== 'svg') {
    const m = await sharp(abs).metadata();
    item.dims = `${m.width}×${m.height} px`;
  } else if (ext === 'svg') {
    const vb = readFileSync(abs, 'utf8').match(/viewBox="([\d.\-\s,]+)"/);
    if (vb) { const [, , w, h] = vb[1].trim().split(/[\s,]+/).map(Number); item.dims = `Vector, ${Math.round(w)}:${Math.round(h)}`; }
  } else if (item.kind === 'video') {
    const a = Object.keys(ASPECT).find((k) => p.includes(`-${k}`));
    const dur = (p.match(/-(\d+)s[-.]/) || [])[1];
    if (a) { item.dims = `${ASPECT[a][0]}×${ASPECT[a][1]}${dur ? `, ${dur} s` : ''}`; item.desc = `${item.desc} ${ASPECT[a][2]}.`.trim(); }
  }
  const ts = thumbSource(p);
  if (ts && existsSync(join(KIT, ts))) {
    const out = join('thumbs', `${p.replace(/\//g, '__')}.webp`);
    await sharp(join(KIT, ts), { density: /\.svg$/i.test(ts) ? 150 : 72 })
      .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 }).toFile(join(DIST, out));
    item.thumb = out;
    if (ext === 'pdf') {
      const prev = join('previews', `${p.replace(/\//g, '__')}.webp`);
      mkdirSync(join(DIST, 'previews'), { recursive: true });
      await sharp(join(KIT, ts), { density: /\.svg$/i.test(ts) ? 200 : 72 })
        .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toFile(join(DIST, prev));
      item.preview = prev;
    }
  }
  items.push(item);
}

const catIndex = Object.fromEntries(CATS.map(([id], i) => [id, i]));
items.sort((a, b) => ((catIndex[a.cat] ?? 99) - (catIndex[b.cat] ?? 99)) || a.path.localeCompare(b.path));

// Colour swatches from the kit's colour file: { "colors": { key: { name?, hex, rgb?, cmyk?, usage? } } }
let colours = {};
const colourFile = C.portal.colours || walk('colors').find((p) => p.endsWith('.json'));
if (colourFile && existsSync(join(KIT, colourFile))) {
  const raw = JSON.parse(readFileSync(join(KIT, colourFile), 'utf8'));
  colours = raw.colors || raw.colours || {};
}

// ---- UI shell, theme, fonts and logo ---------------------------------------------
const T = C.theme;
const fontFaces = [];
const fontVars = {};
mkdirSync(join(DIST, 'fonts'), { recursive: true });
for (const [role, spec] of Object.entries(T.fonts)) {
  for (const f of [].concat(spec)) {
    if (!f.file || !existsSync(join(KIT, f.file))) { console.warn(`theme font "${role}" file not found: ${f.file}`); continue; }
    const out = basename(f.file);
    copyFileSync(join(KIT, f.file), join(DIST, 'fonts', out));
    fontFaces.push(`@font-face{font-family:"${f.family}";font-weight:${f.weight || '400'};${f.stretch ? `font-stretch:${f.stretch};` : ''}font-display:swap;src:url(fonts/${out})}`);
    fontVars[role] = f;
  }
}
const stack = { display: '"Arial Narrow",Arial,sans-serif', body: '"Segoe UI",Arial,sans-serif', mono: 'ui-monospace,Menlo,monospace' };
const fam = (role) => (fontVars[role] ? `"${fontVars[role].family}",${stack[role]}` : stack[role]);
const disp = [].concat(T.fonts.display || {})[0]?.style || {};
writeFileSync(join(DIST, 'theme.css'), `${fontFaces.join('\n')}
:root{
  --ink:${T.ink};--ink-2:${T.ink2};--panel:${T.panel};--panel-2:${T.panel2};--line:${T.line};--line-soft:${T.panel2};
  --text:${T.text};--muted:${T.muted};--muted-2:${T.muted2};
  --accent:${T.accent};--accent-light:${T.accentLight};--accent-pale:${T.accentPale};--accent-deep:${T.accentDeep};
  --thumb-bg:${T.thumbBg};--thumb-light:${T.thumbLight};
  --display:${fam('display')};--body:${fam('body')};--mono:${fam('mono')};
  --display-weight:${disp.weight || 800};--display-stretch:${disp.stretch || '100%'};--display-case:${disp.uppercase === false ? 'none' : 'uppercase'};
}
`);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const html = readFileSync(join(PORTAL, 'src', 'index.html'), 'utf8')
  .replaceAll('{{BRAND_NAME}}', esc(C.brand.name))
  .replaceAll('{{SHORT_NAME}}', esc(C.brand.shortName))
  .replaceAll('{{PORTAL_TITLE}}', esc(C.portal.title))
  .replaceAll('{{LOCALE}}', esc(C.brand.locale.split('-')[0]));
writeFileSync(join(DIST, 'index.html'), html);
for (const f of ['app.js', 'app.css']) copyFileSync(join(PORTAL, 'src', f), join(DIST, f));

const pickLogo = (want, ...patterns) => {
  if (want) return want;
  const svgs = walk('logos').filter((p) => p.endsWith('.svg'));
  for (const re of patterns) { const hit = svgs.find((p) => re.test(p)); if (hit) return hit; }
  return svgs[0];
};
const logo = pickLogo(C.portal.logo, /horizontal.*dark-bg/, /dark-bg/, /horizontal/);
const icon = pickLogo(C.portal.icon, /icon.*dark-bg/, /icon/, /favicon/);
if (!logo) throw new Error('No logo SVG found. Put one in kit/logos/ or set portal.logo in brand.config.json.');
copyFileSync(join(KIT, logo), join(DIST, 'logo.svg'));
copyFileSync(join(KIT, icon || logo), join(DIST, 'icon.svg'));

writeFileSync(join(DIST, 'manifest.json'), JSON.stringify({
  generated: new Date().toISOString(),
  brand: {
    name: C.brand.name, shortName: C.brand.shortName, locale: C.brand.locale, specimen: C.brand.specimen,
    lightBackground: C.portal.lightBackground.source,
    fonts: Object.values(T.fonts).flat().map((f) => ({ file: f.file, weight: f.weight, stretch: f.stretch, style: f.style })),
  },
  categories: CATS.map(([id, label]) => ({ id, label, count: items.filter((i) => i.cat === id).length })).filter((c) => c.count),
  colours,
  items,
}));

// ---- Deploy config ------------------------------------------------------------------
const gen = {
  name: C.portal.workerName,
  main: './worker.js',
  compatibility_date: C.portal.compatibilityDate,
  workers_dev: true,
  preview_urls: false,
  assets: { directory: './dist', binding: 'ASSETS', run_worker_first: true },
  r2_buckets: [{ binding: 'FILES', bucket_name: C.portal.bucket }],
  observability: { enabled: true },
  vars: { BRAND_NAME: C.brand.name },
};
if (process.env.PORTAL_DOMAIN) gen.routes = [{ pattern: process.env.PORTAL_DOMAIN, custom_domain: true }];
// ACCESS_TEAM_RESOLVED (resolve-access-team.mjs) is the team Cloudflare actually uses now.
const team = process.env.ACCESS_TEAM_RESOLVED || process.env.ACCESS_TEAM;
if (team) gen.vars.ACCESS_TEAM = team;
// ACCESS_AUDS (ensure-access-app.mjs) adds the custom domain's Access application.
const auds = process.env.ACCESS_AUDS || process.env.ACCESS_AUD;
if (auds) gen.vars.ACCESS_AUD = auds;
writeFileSync(join(PORTAL, 'wrangler.generated.json'), JSON.stringify(gen, null, 2) + '\n');

const total = items.reduce((s, i) => s + i.size, 0);
console.log(`${C.brand.name} portal: ${items.length} files (${(total / 1048576).toFixed(1)} MB), ${items.filter((i) => i.thumb).length} thumbnails`);
for (const [id, label] of CATS) { const n = items.filter((i) => i.cat === id).length; if (n) console.log(`  ${label}: ${n}`); }
const uncategorised = items.filter((i) => !CATS.some(([id]) => id === i.cat));
if (uncategorised.length) {
  console.error('Uncategorised files (add a folder from "publish", or a rule in brand.config.json):', uncategorised.map((i) => i.path));
  process.exit(1);
}
