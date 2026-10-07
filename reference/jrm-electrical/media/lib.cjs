// Shared helpers for the media kit: logo parts, lockups, fonts, tokens and a
// Playwright renderer. Everything is built from the traced master SVGs in
// logos/svg/, so the mark is never redrawn, only recomposed.
const fs = require('fs');
const path = require('path');

const KIT = path.resolve(__dirname, '..', '..');
const rel = (...p) => path.join(KIT, ...p);

const C = {
  black: '#1B1A1B',
  ink: '#1B1A1B',
  ink2: '#201F20',
  panel: '#262425',
  line: '#3A3739',
  text: '#F2EFEC',
  muted: '#A7A3A1',
  muted2: '#7F7C7A',
  gold: '#A67939',
  goldLight: '#D4B274',
  goldDeep: '#7F5C2B',
  white: '#FFFFFF',
};

const BIZ = {
  name: 'JRM Electrical Contracting',
  tagline: 'Wired right.',
  phone: '0434 042 433',
  phoneIntl: '+61434042433',
  email: 'electrical@jrmcontracting.com.au',
  web: 'jrmcontracting.com.au',
  areas: ['Central Coast', 'Newcastle', 'Sydney'],
  services: ['Electrical', 'Air conditioning & refrigeration', 'Solar', 'Battery storage'],
  lic: 'Electrical Licence 375111c',
  saa: 'SAA Accreditation s5949175',
  arc: 'ARC Refrigeration Authorisation AU61554',
  abn: 'ABN 78 726 165 807',
};

// ---- Logo parts -----------------------------------------------------------
// Path indices in jrm-logo-full-dark-bg.svg (viewBox 0 0 2048 2048), found by
// bounding box: 1 left bracket, 0 right bracket, 18 bolt, 3 J, 19 R, 2 M,
// 4-17 the ELECTRICAL CONTRACTING subtitle.
const src = fs.readFileSync(rel('logos/svg/jrm-logo-full-dark-bg.svg'), 'utf8');
// Keep each path's fill-rule: three subtitle letters (O, A, R) need evenodd for their holes.
const paths = [...src.matchAll(/<path d="([^"]+)"[^>]*?(fill-rule="evenodd")?\/>/g)].map((m) => ({ d: m[1], evenodd: !!m[2] }));
if (paths.length !== 20) throw new Error(`Expected 20 logo paths, found ${paths.length}`);

const parts = {
  bracketL: [paths[1]],
  bracketR: [paths[0]],
  bolt: [paths[18]],
  J: [paths[3]],
  R: [paths[19]],
  M: [paths[2]],
  sub: paths.slice(4, 18),
};

// Bounding boxes in master units, used to build lockups.
const BOX = {
  icon: { x: 508, y: 17, w: 961, h: 1108 },
  word: { x: 10, y: 1221, w: 1957, h: 717 }, // JRM + subtitle
  jrm: { x: 62, y: 1221, w: 1854, h: 515 },
  full: { x: 10, y: 17, w: 1957, h: 1921 },
};

const p = (list, fill) => list.map((x) => `<path d="${x.d}" fill="${fill}"${x.evenodd ? ' fill-rule="evenodd"' : ''}/>`).join('');

// theme: 'dark' (white marks, for dark backgrounds) | 'light' (black marks) | 'mono-gold' | 'mono-white' | 'mono-black'
function fills(theme) {
  switch (theme) {
    case 'light': return { main: C.black, accent: C.gold };
    case 'mono-white': return { main: C.white, accent: C.white };
    case 'mono-black': return { main: C.black, accent: C.black };
    case 'mono-gold': return { main: C.gold, accent: C.gold };
    default: return { main: C.white, accent: C.gold };
  }
}

const iconInner = (theme) => {
  const f = fills(theme);
  return p(parts.bracketL, f.main) + p(parts.bracketR, f.main) + p(parts.bolt, f.accent);
};
const wordInner = (theme, { sub = true } = {}) => {
  const f = fills(theme);
  return p(parts.J, f.main) + p(parts.R, f.accent) + p(parts.M, f.main) + (sub ? p(parts.sub, f.main) : '');
};

const vb = (b, pad = 0) => `${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}`;

function svgIcon(theme = 'dark', { pad = 0, attrs = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(BOX.icon, pad)}" ${attrs}>${iconInner(theme)}</svg>`;
}
function svgStacked(theme = 'dark', { pad = 0, attrs = '' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(BOX.full, pad)}" ${attrs}>${iconInner(theme)}${wordInner(theme)}</svg>`;
}
function svgWordmark(theme = 'dark', { pad = 0, attrs = '', sub = true } = {}) {
  const b = sub ? BOX.word : BOX.jrm;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(b, pad)}" ${attrs}>${wordInner(theme, { sub })}</svg>`;
}
// Horizontal lockup: icon left, wordmark block right, vertically centred.
// Gap is 0.14 of the icon height; wordmark block is 0.66 of the icon height.
const H_GAP = 150;
const H_WS = (BOX.icon.h * 0.66) / BOX.word.h;
const H_W = BOX.icon.w + H_GAP + BOX.word.w * H_WS;
function svgHorizontal(theme = 'dark', { pad = 0, attrs = '' } = {}) {
  const wy = (BOX.icon.h - BOX.word.h * H_WS) / 2;
  const inner =
    `<g transform="translate(${-BOX.icon.x} ${-BOX.icon.y})">${iconInner(theme)}</g>` +
    `<g transform="translate(${BOX.icon.w + H_GAP} ${wy}) scale(${H_WS}) translate(${-BOX.word.x} ${-BOX.word.y})">${wordInner(theme)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${H_W + pad * 2} ${BOX.icon.h + pad * 2}" ${attrs}>${inner}</svg>`;
}
const RATIO = {
  icon: BOX.icon.w / BOX.icon.h,
  stacked: BOX.full.w / BOX.full.h,
  word: BOX.word.w / BOX.word.h,
  horizontal: H_W / BOX.icon.h,
};

// ---- Fonts ----------------------------------------------------------------
const f64 = (f) => fs.readFileSync(rel('fonts', f)).toString('base64');
const face = (fam, file, w, extra = '') =>
  `@font-face{font-family:"${fam}";font-weight:${w};${extra}src:url(data:font/woff2;base64,${f64(file)}) format("woff2");}`;
const FONT_CSS = [
  face('Archivo', 'Archivo-Variable-wdth.woff2', '100 900', 'font-stretch:62% 125%;'),
  face('Poppins', 'Poppins-Regular.woff2', 400),
  face('Poppins', 'Poppins-Medium.woff2', 500),
  face('Poppins', 'Poppins-SemiBold.woff2', 600),
  face('Poppins', 'Poppins-Bold.woff2', 700),
  face('Poppins', 'Poppins-Black.woff2', 900),
  face('IBM Plex Mono', 'IBMPlexMono-Regular.woff2', 400),
  face('IBM Plex Mono', 'IBMPlexMono-Medium.woff2', 500),
].join('\n');

const BASE_CSS = `${FONT_CSS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent}
.display{font-family:Archivo,"Arial Narrow",Arial,sans-serif;font-weight:900;font-stretch:72%;line-height:.88;letter-spacing:-.01em;text-transform:uppercase}
.label{font-family:Archivo,Arial,sans-serif;font-weight:600;font-stretch:115%;text-transform:uppercase;letter-spacing:.18em}
.body{font-family:Poppins,"Segoe UI",Arial,sans-serif}
.mono{font-family:"IBM Plex Mono",ui-monospace,monospace}
.gold-text{background:linear-gradient(135deg,${C.goldLight} 0%,${C.gold} 55%,${C.goldDeep} 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.steel-text{background:linear-gradient(180deg,#FFFFFF 0%,#D9D9DB 45%,#8E8D90 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.rule{height:3px;background:linear-gradient(90deg,${C.goldLight},${C.gold} 60%,${C.goldDeep})}
`;

// Engineering-grid background used across dark assets (matches the site).
function gridBg(w, h, { step = 48, alpha = 0.06, glow = true } = {}) {
  return `background-color:${C.ink};background-image:${glow ? `radial-gradient(ellipse at 50% 40%, rgba(166,121,57,.16), rgba(0,0,0,0) 60%),` : ''}linear-gradient(rgba(255,255,255,${alpha}) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,${alpha}) 1px,transparent 1px);background-size:100% 100%,${step}px ${step}px,${step}px ${step}px;`;
}

function imgData(file) {
  const ext = path.extname(file).slice(1).replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
}

function page(body, { w, h, css = '', bg = 'transparent' }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:${bg}}${css}</style></head><body>${body}</body></html>`;
}

// ---- Renderer -------------------------------------------------------------
let _browser;
async function browser() {
  if (!_browser) {
    const { chromium } = require('playwright');
    _browser = await chromium.launch();
  }
  return _browser;
}
async function close() { if (_browser) await _browser.close(); _browser = null; }

// Render an HTML string to PNG/JPG at exact pixel size (scale = device pixel ratio).
async function png(html, out, { w, h, scale = 1, type = 'png', omitBackground = true, quality } = {}) {
  const b = await browser();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const pg = await ctx.newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await pg.screenshot({ path: out, type, omitBackground: type === 'png' && omitBackground, quality, clip: { x: 0, y: 0, width: w, height: h } });
  await ctx.close();
  console.log('wrote', path.relative(KIT, out));
}
// Render to a vector PDF at a physical size in millimetres.
async function pdf(html, out, { wmm, hmm }) {
  const b = await browser();
  const pg = await b.newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await pg.pdf({ path: out, width: `${wmm}mm`, height: `${hmm}mm`, printBackground: true, preferCSSPageSize: false, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await pg.close();
  console.log('wrote', path.relative(KIT, out));
}

function write(out, content) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, content);
  console.log('wrote', path.relative(KIT, out));
}

module.exports = {
  KIT, rel, C, BIZ, parts, BOX, fills, iconInner, wordInner,
  svgIcon, svgStacked, svgWordmark, svgHorizontal, RATIO,
  FONT_CSS, BASE_CSS, gridBg, imgData, page, png, pdf, write, close,
};
