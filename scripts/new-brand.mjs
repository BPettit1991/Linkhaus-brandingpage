// Sets this copy of the template up for a brand: writes brand.config.json and access-users.txt,
// optionally clears the demo kit, and prints the exact next steps for that brand.
//
//   npm run new-brand                                   (asks for anything missing)
//   npm run new-brand -- --name "Acme Plumbing" --short Acme --domain acmeplumbing.com.au \
//        --phone "0400 000 000" --accent "#1E6FD9" --people "me@acme.com,@acme.com" --clear-demo
//   npm run new-brand -- --from brief.json              (same keys as the flags, camelCase)
//
// Flags: --name (required) --short --domain --portal (default brand.<domain>) --phone
//        --accent --ink --text --locale --prefix --people --headline --about
//        --tagline --email --website (default the domain) --abn --review-url
//        --clear-demo (delete the Example Co files from kit/, keeping fonts/) --yes (no prompts)
// A brief file can also carry the lists the kit generators use: areas, credentials, services
// (see brief.example.json and "business" in brand.config.schema.json).
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { slug, isHex, tokenUrl } from './lib.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

// Pure: answers + the current config -> the new config. Keeps theme fonts and categories,
// replaces everything brand-specific.
export function makeConfig(a, current = {}) {
  if (!a.name) throw new Error('A brand name is required (--name).');
  for (const k of ['accent', 'ink', 'text']) if (a[k] && !isHex(a[k])) throw new Error(`--${k} must be a #rrggbb colour, got ${a[k]}`);
  const short = a.short || a.name;
  const s = slug(short);
  const prefix = a.prefix ?? `${s}-`;
  const theme = { ...(current.theme || {}) };
  for (const k of ['accent', 'ink', 'text']) if (a[k]) theme[k] = a[k].toUpperCase();
  for (const k of ['ink2', 'panel', 'panel2', 'line', 'muted', 'muted2', 'accentLight', 'accentPale', 'accentDeep']) if (a.accent || a.ink) delete theme[k];
  const cfg = {
    $schema: './brand.config.schema.json',
    brand: {
      name: a.name,
      shortName: short,
      filePrefix: prefix,
      phone: a.phone || '',
      locale: a.locale || current.brand?.locale || 'en-AU',
      specimen: {
        headline: a.headline || `${short}.`,
        line: a.phone || '0123456789',
        about: a.about || `${a.name} brand typography.`,
      },
    },
    portal: {
      title: 'Brand portal',
      workerName: `${s}-brand-portal`,
      bucket: `${s}-brand-files`,
      kitDir: current.portal?.kitDir || 'kit',
    },
    business: makeBusiness(a),
    theme,
  };
  if (current.categories) cfg.categories = current.categories;
  const fontRules = (current.rules || []).filter((r) => /^\^fonts\//.test(r.match));
  if (fontRules.length) cfg.rules = fontRules;
  return cfg;
}

// Pure: answers -> the "business" block the kit generators read. Empty fields are left out.
export function makeBusiness(a) {
  const list = (v) => (Array.isArray(v) ? v : String(v || '').split(/\s*[;,]\s*/)).filter(Boolean);
  const b = {
    tagline: a.tagline || a.headline,
    phone: a.phone,
    phoneIntl: a.phoneIntl,
    email: a.email,
    website: a.website || a.domain,
    areas: list(a.areas),
    credentials: Array.isArray(a.credentials) ? a.credentials : [],
    abn: a.abn,
    cta: a.cta,
    reviewUrl: a.reviewUrl,
    services: Array.isArray(a.services) ? a.services : list(a.services).map((name) => ({ name, icon: 'check' })),
  };
  return Object.fromEntries(Object.entries(b).filter(([, v]) => (Array.isArray(v) ? v.length : v)));
}

export function peopleLines(people) {
  return String(people || '').split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean)
    .map((x) => (x.includes('@') ? x.toLowerCase() : null)).filter(Boolean);
}

function clearDemo(kit) {
  for (const entry of readdirSync(kit)) {
    if (entry === 'fonts') continue;
    rmSync(join(kit, entry), { recursive: true, force: true });
  }
}

async function main() {
  let a = parseArgs(process.argv.slice(2));
  if (a.from) a = { ...JSON.parse(readFileSync(a.from, 'utf8')), ...a };
  if (a.domain) a.domain = String(a.domain).replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();

  if (!a.yes && process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (k, q, def) => { if (a[k] === undefined) { const v = (await rl.question(`${q}${def ? ` [${def}]` : ''}: `)).trim(); a[k] = v || def; } };
    await ask('name', 'Business name', null);
    await ask('short', 'Short name (titles, file prefix)', a.name);
    await ask('domain', 'Website domain (e.g. acme.com.au)', null);
    await ask('phone', 'Phone, as it should appear', '');
    await ask('accent', 'Accent colour #rrggbb', '#A67939');
    await ask('people', 'Emails or @domains allowed in (comma separated)', '');
    if (a.clearDemo === undefined) a.clearDemo = /^y/i.test((await rl.question('Delete the Example Co demo files from kit/? [y/N]: ')).trim());
    rl.close();
  }

  const cfgPath = join(REPO, 'brand.config.json');
  const current = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, 'utf8')) : {};
  const cfg = makeConfig(a, current);
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

  const usersPath = join(REPO, 'access-users.txt');
  const header = readFileSync(usersPath, 'utf8').split('\n').filter((l) => l.startsWith('#')).join('\n');
  const people = peopleLines(a.people);
  writeFileSync(usersPath, `${header}\n${people.join('\n')}${people.length ? '\n' : ''}`);

  if (a.clearDemo === true || a.clearDemo === 'true') clearDemo(join(REPO, cfg.portal.kitDir));

  const portalDomain = a.portal || (a.domain ? `brand.${a.domain}` : '');
  console.log(`\nSet up for ${cfg.brand.name}.
  brand.config.json   Worker ${cfg.portal.workerName}, bucket ${cfg.portal.bucket}, accent ${cfg.theme.accent || 'default'}
  access-users.txt    ${people.length ? people.join(', ') : 'nobody yet (add emails, or rely on an @domain policy in Cloudflare)'}
  kit/                ${a.clearDemo === true || a.clearDemo === 'true' ? 'demo files removed (fonts kept)' : 'demo files still there: replace them (npm run collect -- <folder>)'}

Next:
  1. Put the brand's files in kit/ (npm run collect -- /path/to/assets). Logo masters go in kit/logos/svg
     (npm run trace -- <logo.png> --colors ... if there is no vector). Then build the rest of the kit:
     npm run generate (add -- --video for the films), and: npm run check
  2. Create the Cloudflare token (account that holds ${a.domain || 'the domain'}):
     ${tokenUrl(`${cfg.brand.shortName} brand portal (GitHub)`)}
  3. GitHub repo > Settings > Secrets and variables > Actions:
     secret   CLOUDFLARE_API_TOKEN = <the token>
     variable CLOUDFLARE_ACCOUNT_ID = <Cloudflare account ID, on the account home page>
     variable PORTAL_DOMAIN = ${portalDomain || '<e.g. brand.yourdomain.com>'}
  4. Push. The first run deploys the portal locked. Then: Workers & Pages > ${cfg.portal.workerName} > Domains >
     Enable Cloudflare Access on the workers.dev row, add the approved emails, copy the AUD tag into the
     GitHub variable ACCESS_AUD, and re-run the workflow. Full steps: docs/SETUP.md
`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
