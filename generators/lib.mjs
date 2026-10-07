// Shared helpers for the kit generators: brand data from brand.config.json, logo masters,
// fonts, the background system, icon medallions, and a Playwright renderer (PNG, JPG, PDF).
// Everything brand-specific comes from the config, so the same generators build any brand.
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { createRequire } from 'node:module';
import { loadConfig, mix, REPO } from '../portal/config.mjs';
import { iconSvg } from './icons.mjs';

const require = createRequire(import.meta.url);

// ---- Brand data -------------------------------------------------------------
export const CFG = loadConfig();
const RAW = JSON.parse(readFileSync(process.env.BRAND_CONFIG || join(REPO, 'brand.config.json'), 'utf8'));
export const KIT = CFG.kit;
export const T = CFG.theme;
export const PREFIX = CFG.brand.filePrefix;

const b = RAW.business || {};
export const BIZ = {
  name: b.legalName || CFG.brand.name,
  short: CFG.brand.shortName,
  // A "\n" in the tagline sets where it breaks on the designs; elsewhere it reads as a space.
  tagline: (b.tagline || CFG.brand.specimen.headline || '').replace(/\s*\n\s*/g, ' '),
  tagLines: (b.tagline || CFG.brand.specimen.headline || '').split(/\s*\n\s*/).filter(Boolean),
  phone: b.phone || CFG.brand.phone || '',
  phoneIntl: b.phoneIntl || '',
  email: b.email || '',
  website: (b.website || '').replace(/^https?:\/\//, '').replace(/\/$/, ''),
  areas: b.areas || [],
  credentials: b.credentials || [],
  abn: b.abn || '',
  cta: b.cta || 'Free quotes',
  reviewUrl: b.reviewUrl || '',
  services: (b.services || []).map((s, i) => ({
    name: s.name,
    icon: s.icon || 'check',
    lines: s.lines || [s.name + '.'],
    blurb: s.blurb || '',
    image: s.image ? (existsSync(join(REPO, s.image)) ? join(REPO, s.image) : null) : null,
    slug: slugify(s.slug || s.name),
    n: String(i + 1).padStart(2, '0'),
  })),
  trust: b.trust || null, // { title: ["Licensed.", "Insured.", "Local."], label: "..." }
};
export const GEN = RAW.generate || {};
// False when the mark can't be shown in one colour (e.g. it sits on a background tile, which one
// colour would flood). Then the one-colour logos, watermarks and ghost marks are skipped.
export const ONE_COLOUR = GEN.mono !== false;

export function slugify(s) { return String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
export const credLine = (sep = ' · ') => BIZ.credentials.map((c) => `${c.label} ${c.value}`).join(sep);
export const areasLine = () => BIZ.areas.length > 1 ? `${BIZ.areas.slice(0, -1).join(', ')} and ${BIZ.areas.at(-1)}` : BIZ.areas.join('');

// Colours used by the generators. `paper` is the light surface, `onPaper` text on it.
export const C = {
  ink: T.ink, text: T.text, muted: T.muted, line: T.line, panel: T.panel,
  accent: T.accent, accentLight: T.accentLight, accentDeep: T.accentDeep, accentPale: T.accentPale,
  paper: RAW.theme?.paper || '#FFFFFF', onPaper: RAW.theme?.onPaper || T.ink,
  mutedOnPaper: mix(RAW.theme?.onPaper || T.ink, '#FFFFFF', 0.4),
};
const rgb = (h) => h.slice(1).match(/../g).map((x) => parseInt(x, 16)).join(',');
export const rgba = (h, a) => `rgba(${rgb(h)},${a})`;

// ---- Logos --------------------------------------------------------------------
// brand.config.json "logos": { icon|horizontal|stacked: { dark, light } } (paths inside kit/).
// Without it, masters are found in kit/logos/svg by name: icon / horizontal / stacked|primary|full,
// and dark-bg / light-bg. Missing ones fall back (stacked -> horizontal -> icon; light -> dark).
function findLogos() {
  const dir = join(KIT, 'logos/svg');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.svg') && !/mono-|one-colou?r/.test(f)) : [];
  const pick = (kind, bg) => {
    const k = { icon: /icon|symbol|mark/, horizontal: /horizontal|lockup/, stacked: /stacked|primary|full/ }[kind];
    const other = kind === 'icon' ? /horizontal|lockup|stacked|wordmark/ : kind === 'horizontal' ? /icon|stacked|wordmark/ : /icon|horizontal|wordmark/;
    const bgRe = bg === 'dark' ? /dark-bg|on-dark|reversed/ : /light-bg|on-light/;
    const f = files.find((x) => k.test(x) && !other.test(x) && bgRe.test(x));
    return f ? `logos/svg/${f}` : null;
  };
  const conf = RAW.logos || {};
  const out = {};
  for (const kind of ['icon', 'horizontal', 'stacked']) out[kind] = { dark: conf[kind]?.dark || pick(kind, 'dark'), light: conf[kind]?.light || pick(kind, 'light') };
  // A plain "logo-dark-bg.svg" counts as horizontal if nothing else matched.
  if (!out.horizontal.dark) out.horizontal.dark = files.find((x) => /logo/.test(x) && /dark-bg/.test(x)) ? `logos/svg/${files.find((x) => /logo/.test(x) && /dark-bg/.test(x))}` : null;
  if (!out.horizontal.light) out.horizontal.light = files.find((x) => /logo/.test(x) && /light-bg/.test(x)) ? `logos/svg/${files.find((x) => /logo/.test(x) && /light-bg/.test(x))}` : null;
  for (const bg of ['dark', 'light']) {
    out.stacked[bg] ||= out.horizontal[bg] || out.icon[bg];
    out.horizontal[bg] ||= out.stacked[bg] || out.icon[bg];
    out.icon[bg] ||= out.stacked[bg] || out.horizontal[bg];
  }
  for (const kind of Object.keys(out)) out[kind].light ||= out[kind].dark;
  if (!out.icon.dark) throw new Error('No logo SVGs found. Put the masters in kit/logos/svg (e.g. <prefix>logo-horizontal-dark-bg.svg, <prefix>icon-dark-bg.svg) or set "logos" in brand.config.json.');
  return out;
}
export const LOGOS = findLogos();

const svgCache = new Map();
export function logoSource(kind, bg = 'dark') {
  const p = LOGOS[kind][bg];
  if (!svgCache.has(p)) svgCache.set(p, readFileSync(join(KIT, p), 'utf8').replace(/<\?xml[^>]*>\s*/, '').replace(/<!DOCTYPE[^>]*>\s*/i, '').trim());
  return svgCache.get(p);
}
// Aspect ratio (w / h) of a master, from its viewBox or width/height.
export function logoRatio(kind, bg = 'dark') {
  const s = logoSource(kind, bg);
  const vb = s.match(/viewBox="([^"]+)"/);
  if (vb) { const [, , w, h] = vb[1].split(/[\s,]+/).map(Number); return w / h; }
  const w = parseFloat((s.match(/\bwidth="([\d.]+)/) || [])[1]), h = parseFloat((s.match(/\bheight="([\d.]+)/) || [])[1]);
  return w && h ? w / h : 1;
}
// Inline logo that fills its box's height (or width with fit:'width').
export function logo(kind, bg = 'dark', { fit = 'height', color } = {}) {
  let s = logoSource(kind, bg);
  if (color) s = recolour(s, color);
  const size = fit === 'height' ? 'height:100%;width:auto' : 'width:100%;height:auto';
  return s.replace(/<svg\b([^>]*)>/, (m, a) => `<svg${a.replace(/\s(width|height)="[^"]*"/g, '')} style="display:block;${size};max-width:100%;overflow:visible">`);
}
// One-colour version: every fill and stroke (except none) becomes `color`.
export function recolour(svg, color) {
  return svg
    .replace(/(fill|stroke)="(?!none)[^"]*"/g, `$1="${color}"`)
    .replace(/(fill|stroke):\s*(?!none)[^;"]+/g, `$1:${color}`)
    .replace(/<stop([^>]*?)stop-color="[^"]*"/g, `<stop$1stop-color="${color}"`);
}

// ---- Fonts and base CSS -----------------------------------------------------------
const F = T.fonts || {};
const b64 = (file) => readFileSync(join(KIT, file)).toString('base64');
const mime = (file) => ({ '.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype', '.otf': 'opentype' })[extname(file)] || 'woff2';
const face = (f) => (f && existsSync(join(KIT, f.file)) ? `@font-face{font-family:"${f.family}";font-weight:${f.weight || 400};${f.stretch ? `font-stretch:${f.stretch};` : ''}src:url(data:font/${mime(f.file)};base64,${b64(f.file)}) format("${mime(f.file)}");}` : '');
export const FONT_CSS = [F.display, ...(F.body || []), F.mono].filter(Boolean).map(face).join('\n');
// Single quotes so the stacks also work inside style="…" attributes.
const fam = (f, fb) => (f ? `'${f.family}',${fb}` : fb);
const ds = F.display?.style || {};
export const FAM = {
  display: fam(F.display, "'Arial Narrow',Arial,sans-serif"),
  body: fam(F.body?.[0], "'Segoe UI',Arial,sans-serif"),
  mono: fam(F.mono, 'ui-monospace,Menlo,monospace'),
};
export const BASE_CSS = `${FONT_CSS}
*{box-sizing:border-box;margin:0;padding:0}
.display{font-family:${FAM.display};font-weight:${ds.weight || 800};${ds.stretch ? `font-stretch:${ds.stretch};` : ''}line-height:.92;letter-spacing:-.005em;${ds.uppercase === false ? '' : 'text-transform:uppercase;'}}
.body{font-family:${FAM.body}}
.mono{font-family:${FAM.mono}}
.lbl{font-family:${FAM.mono};font-weight:500;text-transform:uppercase;letter-spacing:.2em;color:${C.accentLight}}
.muted{color:${C.muted}}
.accent-text{background:linear-gradient(135deg,${C.accentPale} 0%,${C.accentLight} 35%,${C.accent} 70%,${C.accentDeep} 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.light-text{background:linear-gradient(180deg,#FFFFFF 0%,${mix(C.text, '#888888', 0.15)} 55%,${mix(C.text, C.ink, 0.45)} 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.z{position:relative;z-index:2}
.fit{white-space:nowrap;max-width:100%}
/* Dark surface: fine grid, accent glow, vignette. --gx/--gy move the glow, --grid sets the step. */
.surface{position:absolute;inset:0;background:${C.ink};overflow:hidden}
.surface::before{content:"";position:absolute;inset:0;background:
 radial-gradient(ellipse at var(--gx,50%) var(--gy,42%),${rgba(C.accent, 0.24)},${rgba(C.accent, 0)} 58%),
 linear-gradient(${rgba(C.text, 0.04)} 1px,transparent 1px) 0 0/var(--grid,56px) var(--grid,56px),
 linear-gradient(90deg,${rgba(C.text, 0.04)} 1px,transparent 1px) 0 0/var(--grid,56px) var(--grid,56px)}
.surface::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 45%,rgba(0,0,0,.5) 100%)}
`;
export const rule = (css = '') => `<div style="height:2px;background:linear-gradient(90deg,${rgba(C.accent, 0)},${C.accentLight} 20%,${C.accentPale} 50%,${C.accentLight} 80%,${rgba(C.accent, 0)});${css}"></div>`;

// Icon in a ring medallion. size is any CSS length.
export function med(name, size, { light = false } = {}) {
  const ring = light ? C.accentDeep : C.accentLight;
  return `<span style="display:inline-grid;place-items:center;flex:none;width:${size};height:${size};border-radius:50%;border:calc(${size} * .045) solid ${ring};background:${light ? rgba(C.accent, 0.08) : `radial-gradient(circle at 35% 30%,${rgba(C.accentLight, 0.22)},${rgba(C.ink, 0.6)} 70%)`};box-shadow:${light ? 'none' : `0 0 calc(${size} * .3) ${rgba(C.accent, 0.35)}`}"><span style="width:56%;height:56%">${iconSvg(name, light ? C.accentDeep : C.accentPale)}</span></span>`;
}

export function imgData(file) {
  const ext = extname(file).slice(1).toLowerCase().replace('jpg', 'jpeg').replace('svg', 'svg+xml');
  return `data:image/${ext};base64,${readFileSync(file).toString('base64')}`;
}

// A pixel-sized page for screen assets.
export function page(body, { w, h, css = '', bg = C.ink }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:${bg}}${css}</style></head><body>${body}</body></html>`;
}
// A millimetre-sized document for print (one or more pages).
export function printDoc(pages, wmm, hmm, css = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
@page{size:${wmm}mm ${hmm}mm;margin:0}
html{text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased}
html,body{width:${wmm}mm;background:#fff}
.page{position:relative;width:${wmm}mm;height:${hmm}mm;overflow:hidden;break-after:page}
.page:last-child{break-after:auto}
${css}</style></head><body>${pages.map((p) => `<div class="page">${p}</div>`).join('')}</body></html>`;
}

// ---- Output -----------------------------------------------------------------------
export const out = (dir, name) => join(KIT, dir, `${PREFIX}${name}`);
const show = (p) => console.log('wrote', relative(REPO, p));
export function write(file, content) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); show(file); }

let _browser;
export async function browser() {
  if (!_browser) {
    const { chromium } = require('playwright');
    _browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  }
  return _browser;
}
export async function close() { if (_browser) await _browser.close(); _browser = null; }

// Shrinks each .fit element (text set on fixed lines, e.g. a tagline with "\n") until its widest
// line fits its box, so a set line break never turns into a wrap. Runs in the page.
function fitText() {
  for (const el of document.querySelectorAll('.fit')) {
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && size > 8) { size *= 0.97; el.style.fontSize = `${size}px`; }
  }
}
// Class for a tagline block: set lines fit their box; a plain tagline wraps as before.
export const tagClass = () => (BIZ.tagLines.length > 1 ? 'display light-text fit' : 'display light-text');

// HTML -> PNG/JPG at an exact pixel size (scale = device pixel ratio).
export async function png(html, file, { w, h, scale = 1, type = 'png', transparent = false, quality } = {}) {
  const ctx = await (await browser()).newContext({ viewport: { width: Math.round(w), height: Math.round(h) }, deviceScaleFactor: scale });
  const pg = await ctx.newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(fitText);
  mkdirSync(dirname(file), { recursive: true });
  await pg.screenshot({ path: file, type, omitBackground: type === 'png' && transparent, quality, clip: { x: 0, y: 0, width: Math.round(w), height: Math.round(h) } });
  await ctx.close();
  show(file);
}
// HTML -> vector PDF at a physical size in millimetres.
export async function pdf(html, file, { wmm, hmm }) {
  const pg = await (await browser()).newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.evaluate(fitText);
  mkdirSync(dirname(file), { recursive: true });
  await pg.pdf({ path: file, width: `${wmm}mm`, height: `${hmm}mm`, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await pg.close();
  show(file);
}
// Print preview PNG for a one-page print document (mm -> px at 96 dpi * scale).
// The long edge comes out at about 2000 px whatever the physical size.
export async function preview(html, file, { wmm, hmm }) {
  const w = (wmm / 25.4) * 96, h = (hmm / 25.4) * 96;
  const scale = Math.min(4, 2000 / Math.max(w, h));
  const fixed = html.replace(`html,body{width:${wmm}mm;background:#fff}`, `html,body{width:${wmm}mm;height:${hmm}mm;overflow:hidden}`);
  await png(fixed, file, { w, h, scale });
}

export { REPO, mix };
