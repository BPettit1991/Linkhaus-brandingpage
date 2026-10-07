// Adds lockups the original kit lacked: horizontal, wordmark-only and
// single-colour versions (for vinyl cutting, embroidery, engraving, stamps).
const L = require('./lib.cjs');

const variants = [
  ['jrm-logo-horizontal-dark-bg', (t) => L.svgHorizontal(t, { pad: 40 }), 'dark', L.RATIO.horizontal],
  ['jrm-logo-horizontal-light-bg', (t) => L.svgHorizontal(t, { pad: 40 }), 'light', L.RATIO.horizontal],
  ['jrm-wordmark-dark-bg', (t) => L.svgWordmark(t, { pad: 20 }), 'dark', L.RATIO.word],
  ['jrm-wordmark-light-bg', (t) => L.svgWordmark(t, { pad: 20 }), 'light', L.RATIO.word],
];
const monos = [
  ['stacked', (t) => L.svgStacked(t, { pad: 20 }), L.RATIO.stacked],
  ['horizontal', (t) => L.svgHorizontal(t, { pad: 40 }), L.RATIO.horizontal],
  ['icon', (t) => L.svgIcon(t, { pad: 10 }), L.RATIO.icon],
];
for (const [name, fn, ratio] of monos) {
  for (const t of ['mono-white', 'mono-black', 'mono-gold']) variants.push([`jrm-${name}-${t}`, fn, t, ratio]);
}

(async () => {
  for (const [name, fn, theme, ratio] of variants) {
    const svg = fn(theme);
    L.write(L.rel('logos/svg', `${name}.svg`), svg + '\n');
    const w = ratio >= 1 ? 2000 : Math.round(2000 * ratio);
    const h = Math.round(w / ratio);
    const html = L.page(`<div style="width:${w}px;height:${h}px">${svg.replace('<svg ', `<svg width="${w}" height="${h}" `)}</div>`, { w, h });
    await L.png(html, L.rel('logos/png/extended', `${name}-${w}px.png`), { w, h });
  }
  await L.close();
})();
