// Pre-flight check before pushing: everything that would fail the build, break a deploy or look
// wrong in the portal. Offline; no Cloudflare access needed.
//   npm run check
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, REPO } from '../portal/config.mjs';
import { listKitFiles, classify } from '../portal/classify.mjs';
import { parseUsers } from '../portal/sync-access.mjs';

// WCAG relative luminance contrast ratio for two #rrggbb colours.
export function contrast(a, b) {
  const lum = (h) => {
    const [r, g, bl] = h.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function main() {
  const errors = [], warnings = [], ok = [];
  let C;
  try { C = loadConfig(); ok.push(`brand.config.json: ${C.brand.name}, Worker ${C.portal.workerName}, bucket ${C.portal.bucket}`); }
  catch (e) { console.error(`✗ ${e.message}`); process.exit(1); }

  if (!existsSync(C.kit)) { console.error(`✗ Kit folder ${C.portal.kitDir}/ does not exist.`); process.exit(1); }
  const files = listKitFiles(C);
  if (!files.length) errors.push(`No publishable files in ${C.portal.kitDir}/ (folders published: ${C.portal.publish.join(', ')}).`);
  else ok.push(`${files.length} files to publish`);

  const unlabelled = files.filter((p) => !classify(C, p).known);
  if (unlabelled.length) errors.push(`No category for: ${unlabelled.join(', ')}. Move them into a published folder or add a rule in brand.config.json.`);

  const demo = files.filter((p) => /(^|\/)example-/.test(p));
  if (demo.length && !/^example/i.test(C.brand.name)) warnings.push(`${demo.length} demo "example-" files are still in the kit. Delete them before going live.`);

  const svgs = files.filter((p) => p.startsWith('logos/') && p.endsWith('.svg'));
  for (const [k, v] of [['logo', C.portal.logo], ['icon', C.portal.icon]]) {
    if (v && !existsSync(join(C.kit, v))) errors.push(`portal.${k} "${v}" not found in the kit.`);
  }
  if (!C.portal.logo && !svgs.length) errors.push('No logo SVG in kit/logos/: the portal header needs one (or set portal.logo).');

  const colourFile = C.portal.colours || files.find((p) => p.startsWith('colors/') && p.endsWith('.json'));
  if (!colourFile) warnings.push('No colours JSON in kit/colors/: the Colours tab will have no swatches.');
  else {
    try {
      const raw = JSON.parse(readFileSync(join(C.kit, colourFile), 'utf8'));
      const cols = raw.colors || raw.colours || {};
      const bad = Object.entries(cols).filter(([, c]) => !/^#[0-9a-f]{6}$/i.test(c.hex || '')).map(([k]) => k);
      if (!Object.keys(cols).length) warnings.push(`${colourFile} has no "colors" entries.`);
      else if (bad.length) errors.push(`${colourFile}: colours without a valid #rrggbb hex: ${bad.join(', ')}`);
      else ok.push(`${Object.keys(cols).length} colours in ${colourFile}`);
    } catch (e) { errors.push(`${colourFile} is not valid JSON: ${e.message}`); }
  }

  for (const f of Object.values(C.theme.fonts).flat()) {
    if (f.file && !existsSync(join(C.kit, f.file))) warnings.push(`Theme font ${f.family} (${f.file}) not found: the portal falls back to system fonts.`);
  }
  const t = C.theme;
  const tc = contrast(t.text, t.ink), ac = contrast(t.accentLight, t.ink);
  if (tc < 4.5) errors.push(`Theme text on ink contrast is ${tc.toFixed(1)}:1; needs 4.5:1. Change theme.text or theme.ink.`);
  if (ac < 3) warnings.push(`Accent on ink contrast is ${ac.toFixed(1)}:1; links and highlights may be hard to see. Try a lighter accent.`);

  const noPreview = files.filter((p) => p.endsWith('.pdf') && !C.previews[p]
    && !['png', 'jpg'].some((x) => existsSync(join(C.kit, `${p.split('/')[0]}/previews/${basename(p, '.pdf')}.${x}`))));
  if (noPreview.length) warnings.push(`PDFs without a preview image (shows an icon instead): ${noPreview.join(', ')}. Add <folder>/previews/<same name>.png.`);
  const noPoster = files.filter((p) => /\.(mp4|mov|webm)$/i.test(p)
    && !['jpg', 'png'].some((x) => existsSync(join(C.kit, `video/posters/${basename(p, extname(p))}.${x}`))));
  if (noPoster.length) warnings.push(`Videos without a poster frame: ${noPoster.join(', ')}. Add video/posters/<same name>.jpg.`);
  const big = files.filter((p) => statSync(join(C.kit, p)).size > 300 * 1048576);
  if (big.length) errors.push(`Files over 300 MB (the upload limit): ${big.join(', ')}. Compress or split them.`);
  const total = files.reduce((s, p) => s + statSync(join(C.kit, p)).size, 0);
  if (total > 9 * 1073741824) warnings.push(`Kit is ${(total / 1073741824).toFixed(1)} GB; R2's free tier is 10 GB per account.`);

  const unsorted = join(C.kit, '_unsorted');
  if (existsSync(unsorted) && readdirSync(unsorted).length) warnings.push(`kit/_unsorted/ has ${readdirSync(unsorted).length} files waiting to be filed (not published).`);

  try {
    const u = parseUsers(readFileSync(join(REPO, 'access-users.txt'), 'utf8'));
    const n = u.emails.size + u.domains.size;
    if (n) ok.push(`access-users.txt: ${n} entr${n === 1 ? 'y' : 'ies'}`);
    else warnings.push('access-users.txt lists nobody. Fine if Cloudflare Access already allows people; otherwise add emails.');
  } catch (e) { errors.push(e.message); }

  for (const m of ok) console.log(`✓ ${m}`);
  for (const m of warnings) console.log(`! ${m}`);
  for (const m of errors) console.log(`✗ ${m}`);
  console.log(errors.length ? `\n${errors.length} problem(s) to fix before deploying.` : '\nReady to build and deploy.');
  process.exit(errors.length ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
