// Loads brand.config.json (repo root), fills in defaults and checks it. Every brand-specific
// value the portal uses comes from here, so a new brand is a new config plus a kit/ folder.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PORTAL = dirname(fileURLToPath(import.meta.url));
export const REPO = join(PORTAL, '..');

const DEFAULT_CATEGORIES = [
  ['logos', 'Logos'], ['badge', 'Badge'], ['social', 'Social'], ['print', 'Print'], ['video', 'Video'],
  ['digital', 'Digital'], ['colours', 'Colours'], ['fonts', 'Fonts'], ['guides', 'Guides'],
];

const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// #rrggbb helpers for deriving the portal's dark theme from a few brand colours.
const hex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h).trim()); if (!m) throw new Error(`Not a #rrggbb colour: ${h}`); return m[1].match(/../g).map((x) => parseInt(x, 16)); };
const toHex = (c) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
export const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));

export function deriveTheme(t = {}) {
  const ink = t.ink || '#0E0D0E', text = t.text || '#F2EFEC', accent = t.accent || '#A67939';
  return {
    ink, text, accent,
    ink2: t.ink2 || mix(ink, text, 0.04), panel: t.panel || mix(ink, text, 0.07), panel2: t.panel2 || mix(ink, text, 0.11),
    line: t.line || mix(ink, text, 0.16), muted: t.muted || mix(ink, text, 0.66), muted2: t.muted2 || mix(ink, text, 0.53),
    accentLight: t.accentLight || mix(accent, '#FFFFFF', 0.32), accentPale: t.accentPale || mix(accent, '#FFFFFF', 0.62),
    accentDeep: t.accentDeep || mix(accent, '#000000', 0.24),
    thumbBg: t.thumbBg || mix(ink, '#000000', 0.3), thumbLight: t.thumbLight || '#F4F2EF',
    fonts: t.fonts || {},
  };
}

export function loadConfig(file = process.env.BRAND_CONFIG || join(REPO, 'brand.config.json')) {
  if (!existsSync(file)) throw new Error(`No brand config at ${file}. Run: npm run new-brand`);
  const raw = JSON.parse(readFileSync(file, 'utf8'));
  const b = raw.brand || {};
  if (!b.name) throw new Error('brand.config.json: brand.name is required.');
  const short = slug(b.shortName || b.name);
  const p = raw.portal || {};
  const cfg = {
    brand: {
      name: b.name,
      shortName: b.shortName || b.name,
      filePrefix: b.filePrefix ?? `${short}-`,
      phone: b.phone || '',
      locale: b.locale || 'en-AU',
      specimen: { headline: 'Brand type', line: b.phone || '0123456789', about: `${b.name} brand typography.`, ...(b.specimen || {}) },
    },
    portal: {
      title: p.title || 'Brand portal',
      workerName: p.workerName || `${short}-brand-portal`,
      bucket: p.bucket || `${short}-brand-files`,
      kitDir: p.kitDir || 'kit',
      logo: p.logo || null,
      icon: p.icon || null,
      colours: p.colours || null,
      publish: p.publish || ['README.md', 'style-guide.html', 'guides', 'logos', 'colors', 'fonts', 'social', 'print', 'digital', 'video'],
      exclude: (p.exclude || ['^print/previews/', '^video/posters/']).map((s) => new RegExp(s)),
      lightBackground: new RegExp(p.lightBackground || 'light-bg|on-light|mono-black|apple-touch|favicon', 'i'),
      compatibilityDate: p.compatibilityDate || '2026-09-01',
    },
    theme: deriveTheme(raw.theme),
    categories: raw.categories || DEFAULT_CATEGORIES,
    rules: (raw.rules || []).map((r) => {
      if (!r.match || !r.cat) throw new Error(`brand.config.json: every rule needs "match" and "cat": ${JSON.stringify(r)}`);
      return [new RegExp(r.match, 'i'), r.cat, r.title || null, r.desc || ''];
    }),
    previews: raw.previews || {},
  };
  const catIds = new Set(cfg.categories.map(([id]) => id));
  for (const [, cat] of cfg.rules) if (!catIds.has(cat)) throw new Error(`brand.config.json: rule category "${cat}" is not in categories.`);
  if (!/^[a-z0-9-]{1,63}$/.test(cfg.portal.workerName)) throw new Error(`portal.workerName "${cfg.portal.workerName}" must be lowercase letters, digits and hyphens.`);
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(cfg.portal.bucket)) throw new Error(`portal.bucket "${cfg.portal.bucket}" must be 3-63 lowercase letters, digits and hyphens.`);
  cfg.kit = join(REPO, cfg.portal.kitDir);
  return cfg;
}
