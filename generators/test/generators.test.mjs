// Fast checks for the kit generators that need no browser: timelines, recolouring, the soundtrack,
// the palette and the logo masters the demo brand resolves to.
import test from 'node:test';
import assert from 'node:assert/strict';
import { timeline } from '../film.mjs';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { recolour, LOGOS, BIZ, logo, FONTS, serviceIcon, isIconFile } from '../lib.mjs';
import { REPO } from '../../portal/config.mjs';
import { synth } from '../soundtrack.mjs';
import { palette } from '../guides.mjs';
import { ICONS } from '../icons.mjs';

for (const cut of ['sting', 'film15', 'film30']) {
  test(`${cut}: scenes are contiguous and the logo holds at least 6 s at the end`, () => {
    const tl = timeline(cut);
    assert.ok(tl.scenes.length >= 1);
    for (let i = 1; i < tl.scenes.length; i++) assert.ok(Math.abs(tl.scenes[i][1] - tl.scenes[i - 1][2]) < 1e-9, `gap before scene ${i}`);
    const last = tl.scenes.at(-1);
    assert.equal(last[0], 'logo');
    assert.equal(last[2], tl.duration);
    assert.ok(tl.duration - last[1] >= 6 - 1e-9);
  });
}

test('recolour turns every fill and stroke into one colour but keeps none', () => {
  const out = recolour('<svg><path fill="#123456" stroke="red"/><path fill="none"/><g style="fill:#fff;stroke:none"/></svg>', '#000000');
  assert.match(out, /fill="#000000" stroke="#000000"/);
  assert.match(out, /fill="none"/);
  assert.match(out, /fill:#000000;stroke:none/);
});

test('soundtrack has the right length, two channels and no NaN', () => {
  const { L, R } = synth({ duration: 2, cuts: [1], cues: [1.2] });
  assert.equal(L.length, 96000);
  assert.equal(R.length, 96000);
  assert.ok(L.every(Number.isFinite) && R.every(Number.isFinite));
});

test('demo brand resolves logo masters and inlines them sized to the box', () => {
  for (const kind of ['icon', 'horizontal', 'stacked']) assert.ok(LOGOS[kind].dark && LOGOS[kind].light, kind);
  assert.match(logo('icon'), /^<svg[^>]*style="display:block;height:100%/);
});

test('every service icon exists and the palette has hex colours', () => {
  for (const s of BIZ.services) assert.ok(ICONS[s.icon] || isIconFile(s.icon), `unknown icon ${s.icon}`);
  for (const p of Object.values(palette())) assert.match(p.hex, /^#[0-9a-f]{6}$/i);
});

test('a brand SVG icon keeps its stroke style and takes the medallion colours', () => {
  const file = join(mkdtempSync(join(tmpdir(), 'icon-')), 'mark.svg');
  writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2" stroke-linecap="butt"><path d="M4 4h16"/><rect x="10" y="10" width="3" height="3" fill="#446732" stroke="none"/></svg>');
  const svg = serviceIcon(relative(REPO, file), '#FFFFFF', '#93BF7D');
  assert.match(svg, /stroke-width="2"/);
  assert.match(svg, /stroke-linecap="butt"/);
  assert.match(svg, /fill="#93BF7D"/);
  assert.doesNotMatch(svg, /#111111|#446732/);
  assert.match(svg, /stroke="none"/);
  assert.ok(isIconFile('source/icons/a.svg') && !isIconFile('bolt'));
  assert.match(serviceIcon('bolt', '#FFFFFF'), /stroke="#FFFFFF"/);
});

test('fonts accept one font or a list for each role', () => {
  assert.ok(Array.isArray(FONTS.body));
  assert.ok(!FONTS.display || !Array.isArray(FONTS.display));
  assert.ok(!FONTS.mono || !Array.isArray(FONTS.mono));
});

test('the SVG favicon puts the icon on an ink tile so it shows in light browser tabs', async () => {
  const { faviconSvg } = await import('../logos.mjs');
  const svg = faviconSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="10 0 48 54"><path d="M1 1" stroke="#FFFFFF"/></svg>', '#16171A');
  assert.match(svg, /<rect width="32" height="32" rx="6" fill="#16171A"\/>/);
  assert.match(svg, /viewBox="10 0 48 54"/);
  assert.match(svg, /stroke="#FFFFFF"/);
  assert.equal((svg.match(/<\/svg>/g) || []).length, 2);
});
