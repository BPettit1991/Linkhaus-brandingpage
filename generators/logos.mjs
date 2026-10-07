// Logo system from the SVG masters in kit/logos/svg:
//   - one-colour SVGs (white, black, accent) of each master, for vinyl, embroidery and stamps;
//   - transparent PNGs of every SVG at 180/400/800/1600/3000 px (long edge);
//   - app icons and favicons.
// "generate": { "mono": false } in brand.config.json skips the one-colour versions (use it when the
// mark has a background tile, which one-colour would flood).
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { KIT, LOGOS, C, GEN, ONE_COLOUR, PREFIX, logoSource, logo, recolour, page, png, write, close } from './lib.mjs';

const SIZES = GEN.logoSizes || [180, 400, 800, 1600, 3000];

export async function logos() {
  // One-colour versions, once per distinct master.
  if (ONE_COLOUR) {
    const seen = new Set();
    for (const kind of ['stacked', 'horizontal', 'icon']) {
      const src = LOGOS[kind].dark;
      if (seen.has(src)) continue;
      seen.add(src);
      const name = kind === 'icon' ? 'icon' : `logo-${kind}`;
      for (const [label, color] of [['white', '#FFFFFF'], ['black', '#000000'], ['accent', C.accent]]) {
        write(join(KIT, 'logos/svg', `${PREFIX}${name}-mono-${label}.svg`), recolour(logoSource(kind, 'dark'), color) + '\n');
      }
    }
  }

  // PNG sizes of every SVG master.
  const dir = join(KIT, 'logos/svg');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.svg')).sort()) {
    const svg = readFileSync(join(dir, f), 'utf8');
    const vb = svg.match(/viewBox="([^"]+)"/);
    const [vw, vh] = vb ? vb[1].split(/[\s,]+/).slice(2).map(Number) : [1, 1];
    for (const size of SIZES) {
      const w = vw >= vh ? size : Math.round((size * vw) / vh), h = vw >= vh ? Math.round((size * vh) / vw) : size;
      const inner = svg.replace(/<\?xml[^>]*>\s*/, '').replace(/<svg\b([^>]*)>/, (m, a) => `<svg${a.replace(/\s(width|height)="[^"]*"/g, '')} width="${w}" height="${h}" style="display:block">`);
      await png(page(inner, { w, h, bg: 'transparent' }), join(KIT, 'logos/png', basename(f, '.svg'), `${size}px.png`), { w, h, transparent: true });
    }
  }

  // App icons: the icon on the brand's dark surface, with safe padding.
  const tile = (px, pad, radius = 0) => page(`<div style="position:absolute;inset:0;background:${C.ink};border-radius:${radius}px"></div>
    <div style="position:absolute;inset:${pad}px;display:grid;place-items:center"><div style="width:100%;height:100%;display:grid;place-items:center">${logo('icon', 'dark', { fit: 'height' })}</div></div>`, { w: px, h: px, bg: 'transparent' });
  for (const [name, px, pad, radius] of [['favicon-32', 32, 3, 6], ['favicon-48', 48, 4, 9], ['apple-touch-icon-180', 180, 26, 0], ['app-icon-192', 192, 26, 0], ['app-icon-512', 512, 70, 0]]) {
    await png(tile(px, pad, radius), join(KIT, 'logos/app-icons', `${PREFIX}${name}.png`), { w: px, h: px, transparent: radius > 0 });
  }
  write(join(KIT, 'logos/app-icons', `${PREFIX}favicon.svg`), logoSource('icon', 'dark') + '\n');
}

if (import.meta.url === `file://${process.argv[1]}`) { await logos(); await close(); }
