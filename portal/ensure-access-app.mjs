// Makes sure the custom domain (PORTAL_DOMAIN) has its own Cloudflare Access application, with the
// same policies as the workers.dev application (the first tag in ACCESS_AUD), and prints the
// combined tag list the Worker should accept. Creates the application if it is missing; never
// changes or deletes an existing one.
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... ACCESS_AUD=... PORTAL_DOMAIN=... node ensure-access-app.mjs
// In GitHub Actions it also writes ACCESS_AUDS=<list> to $GITHUB_ENV; build.mjs prefers it to ACCESS_AUD.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cf } from './sync-access.mjs';
import { loadConfig } from './config.mjs';

const norm = (h) => String(h || '').trim().toLowerCase().replace(/\/+$/, '');
export const covers = (app, host) => [app.domain, ...(app.self_hosted_domains || []), ...(app.destinations || []).map((d) => d.uri)]
  .some((d) => norm(d) === norm(host));

export function newAppBody(base, host, brandName = 'Brand') {
  return {
    name: `${brandName} brand portal (${host})`,
    type: 'self_hosted',
    domain: host,
    session_duration: base.session_duration || '24h',
    app_launcher_visible: false,
    // Same order as the workers.dev app, renumbered 1..n so no two share a precedence.
    policies: [...(base.policies || [])].sort((a, b) => (a.precedence ?? 1e9) - (b.precedence ?? 1e9)).map((p, i) => ({ id: p.id, precedence: i + 1 })),
  };
}

async function main() {
  const host = norm(process.env.PORTAL_DOMAIN);
  const auds = (process.env.ACCESS_AUD || '').split(',').map((a) => a.trim()).filter(Boolean);
  if (!host) { console.log('PORTAL_DOMAIN not set: workers.dev only.'); return; }
  if (!auds.length) throw new Error('Set ACCESS_AUD (the workers.dev Access application tag) first.');

  const apps = await cf('/access/apps?per_page=100');
  const base = apps.find((a) => a.aud === auds[0]);
  if (!base) throw new Error('No Access application has the first ACCESS_AUD tag.');
  let app = apps.find((a) => covers(a, host));
  if (app) {
    console.log(`Access application for ${host} exists: "${app.name}".`);
    const missing = (base.policies || []).filter((p) => !(app.policies || []).some((q) => q.id === p.id));
    if (missing.length) console.log(`::warning::"${app.name}" lacks policies the workers.dev app has: ${missing.map((p) => `"${p.name.trim()}"`).join(', ')}. People on those may be refused at ${host}.`);
  } else {
    app = await cf('/access/apps', { method: 'POST', body: JSON.stringify(newAppBody(base, host, loadConfig().brand.shortName)) });
    console.log(`Created Access application "${app.name}" for ${host} with ${(base.policies || []).length} policies from "${base.name}".`);
  }
  const list = [...new Set([...auds, app.aud])].join(',');
  if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `ACCESS_AUDS=${list}\n`);
  console.log(`Worker will accept ${list.split(',').length} Access application tags.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
