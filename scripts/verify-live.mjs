// Checks a deployed portal is locked: signed-out requests for the page, the file list and a file
// must all redirect to Cloudflare Access sign-in. Any 200 here is a security problem.
//   npm run verify -- brand.example.com [another-host.workers.dev]
// Runs from GitHub Actions too (the workflow calls it after deploying when PORTAL_DOMAIN is set).
import { fileURLToPath } from 'node:url';

export function judge(status, location) {
  if ([301, 302, 303, 307, 308].includes(status) && /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com\//i.test(location || '')) return { ok: true, why: 'redirects to Cloudflare Access sign-in' };
  if (status === 403 || status === 503) return { ok: true, why: `refused (${status}); Access may not be enabled on this hostname yet` };
  return { ok: false, why: `${status}${location ? ` -> ${location}` : ''}: NOT protected` };
}

async function main() {
  const hosts = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  if (!hosts.length && process.env.PORTAL_DOMAIN) hosts.push(process.env.PORTAL_DOMAIN);
  if (!hosts.length) { console.error('Usage: npm run verify -- brand.example.com'); process.exit(1); }
  let bad = 0;
  for (const host of hosts) {
    for (const path of ['/', '/manifest.json', '/files/README.md']) {
      // A new custom domain can take a few minutes to get its certificate: retry connection
      // errors for up to VERIFY_WAIT seconds (default 0). Wrong answers are never retried.
      let r, lastErr;
      const until = Date.now() + Number(process.env.VERIFY_WAIT || 0) * 1000;
      do {
        try { r = await fetch(`https://${host}${path}`, { redirect: 'manual' }); lastErr = null; }
        catch (e) { lastErr = e; await new Promise((res) => setTimeout(res, 10000)); }
      } while (lastErr && Date.now() < until);
      if (lastErr) { console.log(`? https://${host}${path}  could not connect (${lastErr.cause?.code || lastErr.message})`); bad++; continue; }
      const v = judge(r.status, r.headers.get('location'));
      console.log(`${v.ok ? '✓' : '✗'} https://${host}${path}  ${v.why}`);
      if (!v.ok) bad++;
    }
  }
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
