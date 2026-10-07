// Builds the brand kit into kit/ from brand.config.json and the logo masters in kit/logos/svg.
//   npm run generate                        colours, logos, social, digital, print, style guide, README
//   npm run generate -- --video             the same plus the films and logo sting (a few minutes)
//   npm run generate -- --only print,social one or more of: colours logos social digital print guides video
//   npm run generate -- --force             also regenerate colours, style guide and README if they exist
// Re-run it after changing the config; generated files are overwritten, your other files are not.
// Loaded dynamically so a config or logo problem prints one clear line instead of a stack trace.
let mods;
try {
  mods = await Promise.all(['./lib.mjs', './logos.mjs', './static.mjs', './guides.mjs', './video.mjs'].map((m) => import(m)));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const [{ close }, { logos }, { social, digital, print }, { colours, styleGuide, readme }, { video }] = mods;

const args = process.argv.slice(2);
const oi = args.indexOf('--only');
const only = oi >= 0 ? new Set(args[oi + 1].split(',')) : null;
const want = (k) => (only ? only.has(k) : k !== 'video' || args.includes('--video'));
const force = args.includes('--force');

const t0 = Date.now();
try {
  if (want('colours')) colours({ force });
  if (want('logos')) await logos();
  if (want('social')) await social();
  if (want('digital')) await digital();
  if (want('print')) await print();
  if (want('video')) await video();
  if (want('guides')) { styleGuide({ force }); readme({ force }); }
} finally {
  await close();
}
console.log(`\nDone in ${Math.round((Date.now() - t0) / 1000)} s. Next: npm run check, then npm run build && npm run preview.`);
