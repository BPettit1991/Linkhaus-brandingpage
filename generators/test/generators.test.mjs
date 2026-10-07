// Fast checks for the kit generators that need no browser: timelines, recolouring, the soundtrack,
// the palette and the logo masters the demo brand resolves to.
import test from 'node:test';
import assert from 'node:assert/strict';
import { timeline } from '../film.mjs';
import { recolour, LOGOS, BIZ, logo } from '../lib.mjs';
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
  for (const s of BIZ.services) assert.ok(ICONS[s.icon], `unknown icon ${s.icon}`);
  for (const p of Object.values(palette())) assert.match(p.hex, /^#[0-9a-f]{6}$/i);
});
