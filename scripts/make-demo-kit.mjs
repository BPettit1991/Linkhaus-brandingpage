// Generates the demo "Example Co" kit in kit/ so a fresh copy of this template builds, previews
// and deploys before any real brand files exist. Replace it with a real kit (npm run collect,
// or copy files in) and delete what you don't need.
//   npm i -D playwright sharp   (once; uses the Chromium Playwright provides)
//   node scripts/make-demo-kit.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { chromium } = require('playwright');

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..', 'kit');
const w = (p, data) => { mkdirSync(dirname(join(KIT, p)), { recursive: true }); writeFileSync(join(KIT, p), data); };

const C = { ink: '#0F1416', teal: '#2F9E8F', mint: '#8FD8CC', paper: '#F5F3EE' };
const icon = (fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="26" fill="${bg}"/><path d="M38 30h46v14H54v9h26v14H54v9h30v14H38z" fill="${fg}"/><circle cx="92" cy="92" r="7" fill="${C.teal}"/></svg>`;
const horizontal = (word, sub, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120"><g><rect width="120" height="120" rx="26" fill="${C.teal}"/><path d="M38 30h46v14H54v9h26v14H54v9h30v14H38z" fill="${C.ink}"/></g><text x="146" y="70" font-family="Archivo, Arial Narrow, Arial, sans-serif" font-weight="800" font-size="52" letter-spacing="1" fill="${word}">EXAMPLE CO</text><text x="148" y="100" font-family="Poppins, Arial, sans-serif" font-size="17" letter-spacing="4" fill="${sub}">DESIGN · BUILD · CARE</text>${bg ? '' : ''}</svg>`;

w('logos/svg/example-logo-horizontal-dark-bg.svg', horizontal('#FFFFFF', C.mint));
w('logos/svg/example-logo-horizontal-light-bg.svg', horizontal(C.ink, C.teal));
w('logos/svg/example-icon-dark-bg.svg', icon(C.ink, C.teal));
w('logos/svg/example-icon-light-bg.svg', icon('#FFFFFF', C.ink));
for (const [name, svg, bg] of [['logo-horizontal-dark-bg', horizontal('#FFFFFF', C.mint), C.ink], ['icon-dark-bg', icon(C.ink, C.teal), null]]) {
  for (const size of [400, 800]) {
    let img = sharp(Buffer.from(svg), { density: 300 }).resize(size);
    if (bg && name.includes('dark-bg') && name.startsWith('logo')) img = img.flatten({ background: bg }).extend({ top: 0, bottom: 0, left: 0, right: 0 });
    w(`logos/png/example-${name}/${size}px.png`, await img.png().toBuffer());
  }
}

w('colors/example-colors.json', JSON.stringify({
  colors: {
    ink: { name: 'Example Ink', hex: C.ink, cmyk: '70 / 50 / 45 / 85', usage: 'Backgrounds, body text on light paper.' },
    teal: { name: 'Example Teal', hex: C.teal, cmyk: '75 / 5 / 50 / 0', usage: 'The icon, buttons and highlights.' },
    mint: { name: 'Mint', hex: C.mint, cmyk: '40 / 0 / 22 / 0', usage: 'Secondary text on dark backgrounds.' },
    paper: { name: 'Paper', hex: C.paper, cmyk: '3 / 3 / 6 / 0', usage: 'Light backgrounds for documents and print.' },
  },
}, null, 2) + '\n');
w('colors/example-colors.css', `:root{\n  --example-ink:${C.ink};\n  --example-teal:${C.teal};\n  --example-mint:${C.mint};\n  --example-paper:${C.paper};\n}\n`);

// Profile picture, business card (PDF + preview), email signature, style guide.
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ deviceScaleFactor: 4 });
const fontCss = `@font-face{font-family:Archivo;font-weight:100 900;font-stretch:62% 125%;src:url(file://${KIT}/fonts/Archivo-Variable-wdth.woff2)}@font-face{font-family:Poppins;font-weight:400;src:url(file://${KIT}/fonts/Poppins-Regular.woff2)}@font-face{font-family:Poppins;font-weight:600;src:url(file://${KIT}/fonts/Poppins-SemiBold.woff2)}`;

await page.setViewportSize({ width: 1080, height: 1080 });
await page.setContent(`<style>${fontCss}body{margin:0;width:1080px;height:1080px;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#173033,${C.ink} 70%)}</style>${icon(C.ink, C.teal).replace('<svg ', '<svg width="560" height="560" ')}`);
w('social/profile/example-profile-1080.png', await page.screenshot({ scale: 'css' }));

const card = `<style>${fontCss}@page{size:96mm 61mm;margin:0}html,body{margin:0}body{width:96mm;height:61mm;background:${C.ink};color:#fff;font-family:Poppins,sans-serif;position:relative;overflow:hidden}
.i{position:absolute;left:9mm;top:9mm;width:16mm}.n{position:absolute;left:9mm;top:30mm;font:800 7mm/1 Archivo,sans-serif;font-stretch:80%;letter-spacing:.02em}
.s{position:absolute;left:9mm;top:38.5mm;font-size:2.6mm;letter-spacing:.3em;color:${C.mint}}.c{position:absolute;left:9mm;bottom:8mm;font-size:2.8mm;line-height:1.5}
.bar{position:absolute;right:0;top:0;bottom:0;width:6mm;background:${C.teal}}</style>
<div class="bar"></div><div class="i">${icon(C.ink, C.teal)}</div><div class="n">EXAMPLE CO</div><div class="s">DESIGN · BUILD · CARE</div><div class="c">0400 000 000 · hello@example.com<br>example.com</div>`;
await page.setContent(card);
w('print/example-business-card-90x55mm-3mm-bleed.pdf', await page.pdf({ width: '96mm', height: '61mm', printBackground: true }));
await page.setViewportSize({ width: 363, height: 231 });
await page.setContent(card.replace(/(\d+(?:\.\d+)?)mm/g, (m, v) => `${(v * 3.78).toFixed(2)}px`));
w('print/previews/example-business-card-90x55mm-3mm-bleed.png', await page.screenshot({ scale: 'device' }));
await browser.close();

w('digital/example-email-signature.html', `<!doctype html><meta charset="utf-8"><title>Example Co email signature</title>
<table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;color:${C.ink}"><tr>
<td style="padding-right:14px;border-right:3px solid ${C.teal}"><strong style="font-size:16px">YOUR NAME</strong><br><span style="font-size:13px;color:#555">Role · Example Co</span></td>
<td style="padding-left:14px;font-size:13px;line-height:1.6">0400 000 000<br><a href="mailto:hello@example.com" style="color:${C.teal}">hello@example.com</a><br><a href="https://example.com" style="color:${C.teal}">example.com</a></td>
</tr></table>
`);

w('style-guide.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Example Co style guide</title>
<style>body{margin:0;font-family:Arial,sans-serif;background:${C.paper};color:${C.ink}}main{max-width:860px;margin:auto;padding:40px 20px}h1{font-size:40px;margin:0 0 4px}.sw{display:flex;gap:12px;flex-wrap:wrap}.sw div{width:150px;border-radius:10px;overflow:hidden;background:#fff;font-size:13px}.sw i{display:block;height:80px}.sw p{margin:8px}</style>
<main><h1>Example Co</h1><p>Demo style guide shipped with the brand-portal template. Replace this file with the real brand's guide.</p>
<h2>Colours</h2><div class="sw">${Object.entries({ Ink: C.ink, Teal: C.teal, Mint: C.mint, Paper: C.paper }).map(([n, h]) => `<div><i style="background:${h}"></i><p><b>${n}</b><br>${h}</p></div>`).join('')}</div>
<h2>Logo</h2><p>Use the horizontal logo where there is room; the icon on its own for small spaces. Keep clear space equal to the icon's corner radius.</p></main></html>
`);

w('README.md', `# Example Co brand kit (demo)

This is the demo kit that ships with the brand-portal template, so a fresh copy builds and deploys
before any real files exist. Replace everything in \`kit/\` with the real brand's files.

| Folder | What goes in it |
|---|---|
| logos/ | SVG masters in \`logos/svg/\`, PNG sizes in \`logos/png/<variant>/<size>px.png\` |
| colors/ | \`<brand>-colors.json\` (name, hex, cmyk, usage per colour) and a CSS variables file |
| fonts/ | WOFF2/TTF files with their licence (OFL.txt) |
| social/ | \`profile/\`, \`covers/\`, \`posts/\`, \`stories/\` |
| print/ | Print-ready PDFs; a same-named PNG in \`print/previews/\` becomes the preview |
| digital/ | Email signature, video-call background, share images |
| video/ | MP4s named \`…-30s-16x9.mp4\`; a same-named JPG in \`video/posters/\` becomes the poster |
`);
console.log('Demo kit written to', KIT);
