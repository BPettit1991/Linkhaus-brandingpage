// node media/preview.cjs film 1920 1080 3.5 7.5 ...  -> scratch PNGs of single frames
const { filmHtml } = require('./film-page.cjs');
const { chromium } = require('playwright');
const [mode, w, h, ...ts] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: +w, height: +h } });
  pg.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await pg.setContent(filmHtml(mode, +w, +h)); await pg.evaluate(() => document.fonts.ready);
  for (const t of ts) { await pg.evaluate(([t]) => render(t, Math.round(t * 30)), [+t]); await pg.screenshot({ path: `${process.env.OUT}/${mode}-${w}x${h}-${t}.jpg`, quality: 80 }); }
  await b.close();
})();
