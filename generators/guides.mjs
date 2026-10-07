// Colour files, the visual style guide and the kit README, from brand.config.json.
// Each is written only if it doesn't exist yet (they are often edited by hand afterwards);
// pass --force to regenerate them.
//   kit/colors/<prefix>colors.json + .css   (palette: "colours" in the config, else the theme)
//   kit/style-guide.html                     (logos, palette, type, usage rules; fonts embedded)
//   kit/README.md                            (specs, file index, platforms, printing, video)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { KIT, CFG, BIZ, C, PREFIX, LOGOS, FAM, FONT_CSS, logo, write, mix, REPO, areasLine } from './lib.mjs';
import { ASPECT } from '../portal/rules.mjs';

const RAW = JSON.parse(readFileSync(join(REPO, 'brand.config.json'), 'utf8'));
const H = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rgbOf = (h) => h.slice(1).match(/../g).map((x) => parseInt(x, 16));
// Naive RGB -> CMYK. Good enough as a starting point; ask the printer for a proof.
function cmykOf(h) {
  const [r, g, b] = rgbOf(h).map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return '0 / 0 / 0 / 100';
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map((v) => Math.round(v * 100)).join(' / ');
}

export function palette() {
  if (RAW.colours) return RAW.colours; // { key: { name, hex, usage } }
  const n = CFG.brand.shortName;
  return {
    ink: { name: `${n} Ink`, hex: C.ink, usage: 'Main background for dark layouts; text on light paper.' },
    accent: { name: `${n} Accent`, hex: C.accent, usage: 'Highlights, buttons, the accent in the logo. Use sparingly.' },
    accentLight: { name: 'Accent light', hex: C.accentLight, usage: 'Accent text and lines on dark backgrounds.' },
    accentDeep: { name: 'Accent deep', hex: C.accentDeep, usage: 'Accent text on white or light backgrounds.' },
    text: { name: 'Light', hex: C.text, usage: 'Text on dark backgrounds.' },
    paper: { name: 'Paper', hex: C.paper, usage: 'Light backgrounds for documents and print.' },
  };
}

export function colours({ force = false } = {}) {
  const json = join(KIT, 'colors', `${PREFIX}colors.json`);
  if (existsSync(json) && !force) return console.log('kept', relative(REPO, json), '(exists; --force to regenerate)');
  const pal = palette();
  const colors = Object.fromEntries(Object.entries(pal).map(([k, v]) => [k, { name: v.name, hex: v.hex.toUpperCase(), rgb: rgbOf(v.hex).join(', '), cmyk: v.cmyk || cmykOf(v.hex), usage: v.usage || '' }]));
  write(json, JSON.stringify({ brand: CFG.brand.name, colors }, null, 2) + '\n');
  const pre = PREFIX.replace(/-$/, '');
  write(join(KIT, 'colors', `${PREFIX}colors.css`), `/* ${CFG.brand.name} colours */\n:root{\n${Object.entries(colors).map(([k, v]) => `  --${pre}-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v.hex};`).join('\n')}\n}\n`);
}

export function styleGuide({ force = false } = {}) {
  const file = join(KIT, 'style-guide.html');
  if (existsSync(file) && !force) return console.log('kept', relative(REPO, file), '(exists; --force to regenerate)');
  const pal = Object.values(palette());
  const F = CFG.theme.fonts || {};
  const marks = [['Primary', 'stacked'], ['Horizontal', 'horizontal'], ['Icon', 'icon']].filter(([, k], i, a) => a.findIndex(([, k2]) => LOGOS[k2].dark === LOGOS[k].dark) === i);
  const html = `<!doctype html><html lang="${CFG.brand.locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${H(CFG.brand.name)} style guide</title>
<style>${FONT_CSS}
*{box-sizing:border-box}body{margin:0;background:#fff;color:${C.onPaper};font:16px/1.6 ${FAM.body}}
main{max-width:1080px;margin:0 auto;padding:48px 20px 80px}
h1,h2{font-family:${FAM.display};${CFG.theme.fonts?.display?.style?.uppercase === false ? '' : 'text-transform:uppercase;'}line-height:1;margin:0}
h1{font-size:clamp(40px,8vw,84px)}h2{font-size:clamp(26px,4vw,40px);margin:64px 0 18px;padding-top:20px;border-top:3px solid ${C.accent}}
.lead{font-size:20px;max-width:720px;color:${mix(C.onPaper, '#FFFFFF', 0.2)}}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.tile{border-radius:12px;padding:28px;display:grid;place-items:center;min-height:200px}.tile>div{height:120px;max-width:100%;display:grid;place-items:center}
.dark{background:${C.ink}}.light{background:#F4F3F1}
.cap{font:500 12px ${FAM.mono};letter-spacing:.12em;text-transform:uppercase;color:#777;margin-top:8px}
.sw{border-radius:12px;overflow:hidden;border:1px solid #e6e4e1}.sw .c{height:110px}.sw .m{padding:12px 14px;font-size:13px}.sw b{display:block;font-size:15px}
.mono{font-family:${FAM.mono}}
.spec{padding:22px 0;border-bottom:1px solid #eee}.spec .s{font-size:clamp(28px,5vw,54px);line-height:1.1}
ul.rules li{margin:6px 0}
</style></head><body><main>
<div style="background:${C.ink};border-radius:16px;padding:48px 32px;margin-bottom:40px"><div style="height:110px;max-width:520px">${logo('horizontal', 'dark')}</div></div>
<h1>${H(CFG.brand.name)}</h1>
<p class="lead">${H(BIZ.tagline)}${BIZ.services.length ? `<br>${H(BIZ.services.map((s) => s.name).join(' · '))}` : ''}${BIZ.areas.length ? `<br>Serving ${H(areasLine())}.` : ''}</p>

<h2>Logo</h2>
<div class="grid">${marks.map(([label, k]) => `<div><div class="tile dark"><div>${logo(k, 'dark')}</div></div><div class="cap">${label}, dark background</div></div><div><div class="tile light"><div>${logo(k, 'light')}</div></div><div class="cap">${label}, light background</div></div>`).join('')}</div>
<ul class="rules">
<li><b>Clear space:</b> keep at least the height of the icon's widest stroke, times two, clear on every side.</li>
<li><b>Minimum size:</b> horizontal logo 30 mm wide in print, 160 px on screen. Below that, use the icon.</li>
<li><b>Don't</b> stretch, recolour outside the palette, add effects, or place it on busy photos without a dark panel.</li>
<li>Use the <b>dark-background</b> versions on ${H(C.ink)} or photos, the <b>light-background</b> versions on white or paper.</li>
</ul>

<h2>Colour</h2>
<div class="grid">${pal.map((p) => `<div class="sw"><div class="c" style="background:${p.hex}"></div><div class="m"><b>${H(p.name)}</b><span class="mono">${p.hex.toUpperCase()} · RGB ${rgbOf(p.hex).join(' ')} · CMYK ${p.cmyk || cmykOf(p.hex)}</span><br>${H(p.usage || '')}</div></div>`).join('')}</div>

<h2>Type</h2>
${F.display ? `<div class="spec"><div class="s" style="font-family:${FAM.display};font-weight:${F.display.style?.weight || 800};${F.display.style?.stretch ? `font-stretch:${F.display.style.stretch};` : ''}${F.display.style?.uppercase === false ? '' : 'text-transform:uppercase'}">${H(BIZ.tagline || CFG.brand.shortName)}</div><div class="cap">${H(F.display.family)}: headlines, social, signage, video</div></div>` : ''}
${(F.body || []).slice(0, 1).map((f) => `<div class="spec"><div style="font-size:22px;font-family:${FAM.body}">${H(CFG.brand.specimen.about)}</div><div class="cap">${H(f.family)}: body text, documents, web</div></div>`).join('')}
${F.mono ? `<div class="spec"><div class="mono" style="font-size:20px;letter-spacing:.12em;text-transform:uppercase">${H(BIZ.credentials.map((c) => `${c.label} ${c.value}`).join(' · ') || BIZ.phone)}</div><div class="cap">${H(F.mono.family)}: labels, codes, small print</div></div>` : ''}

<h2>Contact details</h2>
<p class="mono">${[BIZ.name, BIZ.phone, BIZ.email, BIZ.website, BIZ.abn].filter(Boolean).map(H).join('<br>')}</p>
</main></body></html>`;
  write(file, html);
}

export function readme({ force = false } = {}) {
  const file = join(KIT, 'README.md');
  if (existsSync(file) && !force) return console.log('kept', relative(REPO, file), '(exists; --force to regenerate)');
  const pal = Object.values(palette());
  const F = CFG.theme.fonts || {};
  const count = (dir) => { const d = join(KIT, dir); if (!existsSync(d)) return 0; const w = (p) => statSync(p).isDirectory() ? readdirSync(p).reduce((n, x) => n + w(join(p, x)), 0) : 1; return w(d); };
  const md = `# ${CFG.brand.name} brand kit

${BIZ.tagline}

Everything here is a master file. Use the versions in this kit rather than copies from emails or screenshots.

## Colours
| Name | HEX | RGB | CMYK | Use |
|---|---|---|---|---|
${pal.map((p) => `| ${p.name} | \`${p.hex.toUpperCase()}\` | ${rgbOf(p.hex).join(' ')} | ${p.cmyk || cmykOf(p.hex)} | ${p.usage || ''} |`).join('\n')}

CMYK values are a starting point. Ask the printer for a hard proof before a large run.

## Type
${[F.display && `- **${F.display.family}**: headlines, social, signage and video.`, F.body?.[0] && `- **${F.body[0].family}**: body text, documents and the web.`, F.mono && `- **${F.mono.family}**: labels, licence numbers and small print.`].filter(Boolean).join('\n')}

All fonts are open-licence; the licence files are in \`fonts/\`.

## What's in the kit
| Folder | Files | Notes |
|---|---|---|
| \`logos/svg\` | ${count('logos/svg')} | Masters. SVG scales to any size. |
| \`logos/png\` | ${count('logos/png')} | Transparent PNGs, 180 to 3000 px wide. |
| \`logos/app-icons\` | ${count('logos/app-icons')} | Favicons and phone home-screen icons. |
| \`colors\` | ${count('colors')} | JSON and CSS. |
| \`social\` | ${count('social')} | Profile pictures, covers, posts and stories. |
| \`print\` | ${count('print')} | Print-ready PDFs at true size with bleed. |
| \`digital\` | ${count('digital')} | Email signature, video-call background, share image. |
| \`video\` | ${count('video')} | Films, logo sting and soundtrack masters. |

## Platforms
| Use | File | Size |
|---|---|---|
| Profile picture (all platforms) | \`social/profile/${PREFIX}profile-dark-1080.png\` | 1080×1080, circle-safe |
| Facebook cover | \`social/covers/${PREFIX}facebook-cover-1640x624.png\` | 1640×624 |
| LinkedIn banner | \`social/covers/${PREFIX}linkedin-banner-1584x396.png\` | 1584×396 |
| YouTube banner | \`social/covers/${PREFIX}youtube-banner-2560x1440.png\` | 2560×1440 |
| X header | \`social/covers/${PREFIX}x-header-1500x500.png\` | 1500×500 |
| Google Business cover | \`social/covers/${PREFIX}google-business-cover-1080x608.png\` | 1080×608 |
| Posts | \`social/posts/\` | 1080×1350 (4:5) |
| Stories and Reels | \`social/stories/\` | 1080×1920, 250 px clear top and bottom |

## Printing
- PDFs are at true size with bleed (3 mm; 2 mm on labels). The trim size is in each file name.
- Business cards: 90×55 mm, 350 gsm or heavier, matt laminate.
- Site sign: 900×600 mm corflute or ACM. Vehicle magnet: 600×400 mm, 0.8 mm magnetic vinyl.
- Check phone numbers and licence numbers on the proof before approving.

## Video
${Object.entries(ASPECT).filter(([k]) => k !== '4x5').map(([k, [w, h, use]]) => `- **${k.replace('x', ':')}** (${w}×${h}): ${use}.`).join('\n')}
- H.264, 30 fps, about -14 LUFS: the level social platforms play at. Poster frames are in \`video/posters/\`.
- The soundtracks were synthesised for this brand; they are royalty free.

## Contact
${[BIZ.name, BIZ.phone, BIZ.email, BIZ.website, BIZ.abn].filter(Boolean).join('  \n')}
`;
  write(file, md);
}

export function guidesAll(opts) { colours(opts); styleGuide(opts); readme(opts); }

if (import.meta.url === `file://${process.argv[1]}`) guidesAll({ force: process.argv.includes('--force') });
