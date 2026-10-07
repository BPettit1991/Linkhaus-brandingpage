// Copies access-users.txt (repo root) into the Cloudflare Access policy that guards the portal: the
// policy for individual people on the Access application whose AUD tag is ACCESS_AUD (see pickPolicy).
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... ACCESS_AUD=... node portal/sync-access.mjs
// The token needs Account > Access: Apps and Policies > Edit.
// By default it only adds: anyone already allowed stays allowed (so the owner can't be locked
// out by a missing line). ACCESS_PRUNE=true also removes emails and domains not in the file.
// Add --dry-run to print the plan without changing anything.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const API = 'https://api.cloudflare.com/client/v4';
// Fields of a reusable policy that a PUT accepts; everything else in the GET result is read-only.
const WRITABLE = ['name', 'decision', 'include', 'exclude', 'require', 'session_duration', 'approval_required',
  'approval_groups', 'isolation_required', 'purpose_justification_required', 'purpose_justification_prompt',
  'connection_rules', 'mfa_config'];

export function parseUsers(text) {
  const emails = new Set(), domains = new Set();
  for (const raw of text.split('\n')) {
    const line = raw.trim().toLowerCase();
    if (!line || line.startsWith('#')) continue;
    if (/^@[a-z0-9.-]+\.[a-z]{2,}$/.test(line)) domains.add(line.slice(1));
    else if (/^[^\s@]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(line)) emails.add(line);
    else throw new Error(`access-users.txt: not an email address or @domain: "${raw.trim()}"`);
  }
  return { emails, domains };
}

// New include list for the policy. Rules other than email / email domain (groups, IP ranges...)
// are always kept. Returns the rules plus what changed, for the log.
export function planInclude(current, wanted, prune = false) {
  const has = { emails: new Set(), domains: new Set() };
  const other = [];
  for (const rule of current) {
    if (rule.email?.email) has.emails.add(rule.email.email.toLowerCase());
    else if (rule.email_domain?.domain) has.domains.add(rule.email_domain.domain.toLowerCase());
    else other.push(rule);
  }
  const keep = (set, want) => (prune ? [...want] : [...new Set([...set, ...want])]);
  const emails = keep(has.emails, wanted.emails).sort();
  const domains = keep(has.domains, wanted.domains).sort();
  const diff = (a, b) => [...a].filter((x) => !b.has(x));
  return {
    include: [...other, ...emails.map((email) => ({ email: { email } })), ...domains.map((domain) => ({ email_domain: { domain } }))],
    added: [...diff(wanted.emails, has.emails), ...diff(wanted.domains, has.domains).map((d) => '@' + d)],
    removed: prune ? [...diff(has.emails, wanted.emails), ...diff(has.domains, wanted.domains).map((d) => '@' + d)] : [],
    notInFile: prune ? [] : [...diff(has.emails, wanted.emails), ...diff(has.domains, wanted.domains).map((d) => '@' + d)],
  };
}

// "email ×2, email_domain ×1": the rule types in a policy's include list, for the log.
export function summarise(include = []) {
  const n = {};
  for (const rule of include) for (const type of Object.keys(rule)) n[type] = (n[type] || 0) + 1;
  return Object.entries(n).map(([t, c]) => `${t} ×${c}`).join(', ') || 'no rules';
}

// The policy on the portal's Access application that holds individual people. With a name,
// that policy (ignoring case and stray spaces). Without one, the only allow policy that is not
// purely "emails ending in" rules, since those domain policies are left for the dashboard.
export function pickPolicy(attached, name) {
  const norm = (s) => s.trim().toLowerCase();
  const allow = attached.filter((p) => p.decision === 'allow');
  if (name) {
    const p = allow.find((x) => norm(x.name) === norm(name));
    if (!p) throw new Error(`No allow policy named "${name}" on the portal's Access application. Found: ${allow.map((x) => `"${x.name.trim()}"`).join(', ') || 'none'}.`);
    return p;
  }
  const people = allow.filter((p) => !(p.include || []).length || !(p.include || []).every((r) => r.email_domain));
  if (people.length === 1) return people[0];
  throw new Error(people.length
    ? `Several policies could hold the list (${people.map((x) => `"${x.name.trim()}"`).join(', ')}): set the ACCESS_POLICY_NAME variable to one.`
    : 'The portal\'s Access application has no policy for individual people (only domain policies): add one, or set ACCESS_POLICY_NAME.');
}

export async function cf(path, init = {}) {
  const res = await fetch(`${API}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}${path}`, {
    ...init, headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const msg = (body.errors || []).map((e) => `${e.code}: ${e.message}`).join('; ') || res.statusText;
    const hint = res.status === 403 ? ' (add "Access: Apps and Policies: Edit" to the API token, see portal/README.md)' : '';
    throw new Error(`Cloudflare API ${init.method || 'GET'} ${path}: ${res.status} ${msg}${hint}`);
  }
  return body.result;
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const prune = process.env.ACCESS_PRUNE === 'true';
  const wanted = parseUsers(readFileSync(join(HERE, '..', 'access-users.txt'), 'utf8'));
  if (!wanted.emails.size && !wanted.domains.size) {
    if (prune) throw new Error('access-users.txt is empty: refusing to remove everyone.');
    console.log('access-users.txt lists nobody yet: nothing to add.');
    return;
  }
  if (!process.env.ACCESS_AUD) throw new Error('Set ACCESS_AUD so the portal\'s Access application can be found.');

  const apps = await cf('/access/apps?per_page=100');
  const aud = process.env.ACCESS_AUD.split(',')[0].trim(); // the first tag is the workers.dev application
  const app = apps.find((a) => a.aud === aud);
  if (!app) throw new Error('No Access application has the ACCESS_AUD tag. Check the ACCESS_AUD variable.');
  const all = await cf('/access/policies?per_page=100');
  const attached = (app.policies || []).map((ap) => all.find((p) => p.id === ap.id) || ap);
  const hosts = [...(app.self_hosted_domains || []), app.domain].filter(Boolean);
  console.log(`Access application "${app.name}"${hosts.length ? ` (${[...new Set(hosts)].join(', ')})` : ''} policies:`);
  attached.forEach((p) => console.log(`  "${p.name.trim()}": ${p.decision}, ${summarise(p.include)}`));
  if (attached.some((p) => p.decision === 'allow' && (p.include || []).some((r) => r.everyone))) {
    console.log('::warning::An allow policy on the portal includes Everyone: anyone who can receive an email can sign in.');
  }
  const policy = pickPolicy(attached, process.env.ACCESS_POLICY_NAME);
  const name = policy.name.trim();

  const plan = planInclude(policy.include || [], wanted, prune);
  console.log(`Access policy "${name}": ${plan.added.length} to add, ${plan.removed.length} to remove`);
  plan.added.forEach((x) => console.log('  +', x));
  plan.removed.forEach((x) => console.log('  -', x));
  if (plan.notInFile.length) console.log(`  kept (allowed now but not in access-users.txt; run with prune to remove): ${plan.notInFile.join(', ')}`);
  if (dry || (!plan.added.length && !plan.removed.length)) return;

  const next = Object.fromEntries(WRITABLE.filter((k) => policy[k] !== undefined).map((k) => [k, policy[k]]));
  next.include = plan.include;
  await cf(`/access/policies/${policy.id}`, { method: 'PUT', body: JSON.stringify(next) });
  console.log('Access policy updated.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
