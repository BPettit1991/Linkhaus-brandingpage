// Works out the Cloudflare Zero Trust team name the Worker must trust, so a renamed team cannot
// silently break every sign-in (the Worker checks that sign-in tokens come from
// https://<team>.cloudflareaccess.com). Candidates, in order:
//   1. the account's Access organisation (API; skipped if the token may not read it)
//   2. the team the portal's own sign-in redirect points to (custom domain, then workers.dev)
//   3. the ACCESS_TEAM variable
// The first candidate whose signing keys exist wins. Fails if none does.
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... ACCESS_TEAM=... [PORTAL_DOMAIN=...] node resolve-access-team.mjs
// In GitHub Actions it writes ACCESS_TEAM_RESOLVED=<team> to $GITHUB_ENV; build.mjs prefers it.
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cf } from './sync-access.mjs';
import { loadConfig } from './config.mjs';

// "https://acme.cloudflareaccess.com/cdn-cgi/access/login/..." -> "acme"
export function teamFromUrl(url) {
  try {
    const m = new URL(url).hostname.toLowerCase().match(/^([a-z0-9-]+)\.cloudflareaccess\.com$/);
    return m ? m[1] : null;
  } catch { return null; }
}

async function hasKeys(team) {
  try {
    const res = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
    return res.ok && ((await res.json()).keys || []).length > 0;
  } catch { return false; }
}

async function redirectTeam(host) {
  try {
    const res = await fetch(`https://${host}/`, { redirect: 'manual' });
    return teamFromUrl(res.headers.get('location') || '');
  } catch { return null; }
}

async function main() {
  const candidates = [];
  try {
    const org = await cf('/access/organizations');
    candidates.push(['Access organisation', teamFromUrl(`https://${org.auth_domain}`)]);
  } catch (e) { console.log(`Access organisation not readable (${e.message.split(':')[0]}); using the sign-in redirect instead.`); }
  const hosts = [];
  if (process.env.PORTAL_DOMAIN) hosts.push(process.env.PORTAL_DOMAIN.trim());
  try {
    const { subdomain } = await cf('/workers/subdomain');
    if (subdomain) hosts.push(`${loadConfig().portal.workerName}.${subdomain}.workers.dev`);
  } catch { /* workers.dev lookup is optional */ }
  for (const h of hosts) candidates.push([`sign-in redirect of ${h}`, await redirectTeam(h)]);
  candidates.push(['ACCESS_TEAM variable', (process.env.ACCESS_TEAM || '').trim().toLowerCase() || null]);

  for (const [source, team] of candidates) {
    if (team && await hasKeys(team)) {
      console.log(`Zero Trust team: ${team} (from ${source}).`);
      if (process.env.ACCESS_TEAM && process.env.ACCESS_TEAM.trim().toLowerCase() !== team) {
        console.log(`::warning::The ACCESS_TEAM variable says "${process.env.ACCESS_TEAM}", but the team is now "${team}". Using "${team}"; update the variable to match.`);
      }
      if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `ACCESS_TEAM_RESOLVED=${team}\n`);
      return;
    }
    if (team) console.log(`  ${source}: "${team}" has no signing keys, skipped.`);
  }
  throw new Error('Could not find a Zero Trust team with signing keys. Check ACCESS_TEAM (Zero Trust > Settings > Team domain).');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
