// Tests the setup scripts' pure parts: token link, new-brand config, collect sorting, contrast, live check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenUrl, slug } from '../lib.mjs';
import { makeConfig, makeBusiness, parseArgs, peopleLines } from '../new-brand.mjs';
import { targetFor } from '../collect.mjs';
import { contrast } from '../check.mjs';
import { judge } from '../verify-live.mjs';

test('token link carries all four permissions, encoded', () => {
  const u = new URL(tokenUrl('Acme brand portal (GitHub)'));
  assert.equal(u.searchParams.get('name'), 'Acme brand portal (GitHub)');
  const perms = JSON.parse(u.searchParams.get('permissionGroupKeys')).map((p) => `${p.key}:${p.type}`);
  assert.deepEqual(perms, ['workers_scripts:edit', 'workers_r2:edit', 'workers_routes:edit', 'access:edit']);
});

test('new-brand builds names from the short name and keeps fonts', () => {
  const current = { theme: { fonts: { body: { family: 'X', file: 'fonts/x.woff2' } }, accentLight: '#000000' }, rules: [{ match: '^fonts/X', cat: 'fonts' }, { match: 'other', cat: 'print' }] };
  const c = makeConfig({ name: 'Acme Plumbing Pty Ltd', short: 'Acme & Sons', accent: '#1e6fd9', phone: '0400 111 222' }, current);
  assert.equal(c.portal.workerName, 'acme-and-sons-brand-portal');
  assert.equal(c.portal.bucket, 'acme-and-sons-brand-files');
  assert.equal(c.brand.filePrefix, 'acme-and-sons-');
  assert.equal(c.theme.accent, '#1E6FD9');
  assert.equal(c.theme.accentLight, undefined, 'derived shades are recomputed when the accent changes');
  assert.deepEqual(c.theme.fonts, current.theme.fonts);
  assert.deepEqual(c.rules, [{ match: '^fonts/X', cat: 'fonts' }]);
  assert.throws(() => makeConfig({ name: 'X', accent: 'blue' }), /#rrggbb/);
  assert.throws(() => makeConfig({}), /name is required/);
});

test('flags and people lists parse', () => {
  assert.deepEqual(parseArgs(['--name', 'Acme Co', '--clear-demo', '--accent', '#123456']), { name: 'Acme Co', clearDemo: true, accent: '#123456' });
  assert.deepEqual(peopleLines('A@x.com, @x.com;  junk  b@y.com'), ['a@x.com', '@x.com', 'b@y.com']);
});

test('collect sorts files by type and name', () => {
  const t = (p) => targetFor(p, 'acme-');
  assert.equal(t('Logos/Acme Logo Final.svg'), 'logos/svg/acme-acme-logo-final.svg'.replace('acme-acme', 'acme'));
  assert.equal(t('stuff/icon.png'), 'logos/png/acme-icon.png');
  assert.equal(t('Brand Guidelines 2024.pdf'), 'guides/acme-brand-guidelines-2024.pdf');
  assert.equal(t('print/Business Card.pdf'), 'print/acme-business-card.pdf');
  assert.equal(t('FB cover.jpg'), 'social/covers/acme-fb-cover.jpg');
  assert.equal(t('Montserrat-Bold.ttf'), 'fonts/Montserrat-Bold.ttf');
  assert.equal(t('fonts/OFL.txt'), 'fonts/OFL.txt');
  assert.equal(t('promo.mp4'), 'video/acme-promo.mp4');
  assert.equal(t('palette.json'), 'colors/acme-palette.json');
  assert.equal(t('team-photo.jpg'), null, 'unknown images go to _unsorted for a human');
  assert.equal(t('notes.docx'), null);
  assert.equal(t('logos/png/acme badge/800px.png'), 'logos/png/acme-badge/800px.png', 'kit-shaped folders keep their structure');
  assert.equal(t('Colours/acme.json'), 'colors/acme.json');
  assert.equal(t('README.md'), 'README.md');
  assert.equal(t('Style Guide.html'.replace(' ', '-')), 'style-guide.html');
  assert.equal(t('exports/posters/promo-16x9.jpg'), 'video/posters/promo-16x9.jpg');
  assert.equal(t('exports/previews/card.png'), 'print/previews/card.png');
});

test('contrast ratio matches WCAG', () => {
  assert.equal(Math.round(contrast('#FFFFFF', '#000000')), 21);
  assert.ok(contrast('#777777', '#FFFFFF') < 4.5);
});

test('live check only passes redirects to Access or refusals', () => {
  assert.ok(judge(302, 'https://acme.cloudflareaccess.com/cdn-cgi/access/login/x').ok);
  assert.ok(judge(403).ok);
  assert.ok(!judge(200).ok);
  assert.ok(!judge(302, 'https://evil.example/cloudflareaccess.com/').ok);
  assert.ok(!judge(302, 'https://acme.cloudflareaccess.com.evil.net/').ok);
});

test('slug', () => assert.equal(slug('  JRM Électrical & Co! '), 'jrm-lectrical-and-co'));

test('makeBusiness keeps filled fields, splits lists and defaults the website to the domain', () => {
  const b = makeBusiness({ phone: '0400 111 222', domain: 'acme.com.au', areas: 'Sydney, Newcastle', services: 'Drains; Hot water', email: '' });
  assert.deepEqual(b, { phone: '0400 111 222', website: 'acme.com.au', areas: ['Sydney', 'Newcastle'], services: [{ name: 'Drains', icon: 'check' }, { name: 'Hot water', icon: 'check' }] });
});
