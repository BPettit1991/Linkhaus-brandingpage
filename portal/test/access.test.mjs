// Tests the Worker's Cloudflare Access gate without a network: a throwaway RSA key stands in
// for the Access signing key, and fetch() to the team's certs endpoint is stubbed.
//   node --test portal/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

const TEAM = 'jrm-test', AUD = 'aud-123';
const { privateKey, publicKey } = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const jwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
const { privateKey: otherKey } = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);

globalThis.fetch = async (url) => {
  assert.equal(String(url), `https://${TEAM}.cloudflareaccess.com/cdn-cgi/access/certs`);
  return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'content-type': 'application/json' } });
};

const b64u = (buf) => Buffer.from(buf).toString('base64url');
async function jwt(claims, key = privateKey, kid = 'k1') {
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
  const p = b64u(JSON.stringify({ aud: [AUD], iss: `https://${TEAM}.cloudflareaccess.com`, iat: now, exp: now + 600, email: 'ben@example.com', ...claims }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64u(sig)}`;
}

const env = (extra = {}) => ({
  ACCESS_TEAM: TEAM, ACCESS_AUD: AUD,
  ASSETS: { fetch: async () => new Response('<h1>portal</h1>', { headers: { 'content-type': 'text/html' } }) },
  FILES: { get: async () => null },
  ...extra,
});
const req = (token) => new Request('https://brand.example/', { headers: token ? { 'cf-access-jwt-assertion': token } : {} });

test('locked when Access is not configured', async () => {
  const r = await worker.fetch(req(), env({ ACCESS_TEAM: undefined, ACCESS_AUD: undefined }));
  assert.equal(r.status, 503);
});
test('refuses requests without an Access token', async () => {
  assert.equal((await worker.fetch(req(), env())).status, 403);
});
test('accepts a valid Access token', async () => {
  const r = await worker.fetch(req(await jwt({})), env());
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '<h1>portal</h1>');
  assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
});
test('rejects a token signed by another key', async () => {
  assert.equal((await worker.fetch(req(await jwt({}, otherKey)), env())).status, 403);
});
test('rejects a token for another application', async () => {
  assert.equal((await worker.fetch(req(await jwt({ aud: ['someone-else'] })), env())).status, 403);
});
test('rejects an expired token', async () => {
  assert.equal((await worker.fetch(req(await jwt({ exp: Math.floor(Date.now() / 1000) - 5 })), env())).status, 403);
});
test('rejects a token from another Access team', async () => {
  assert.equal((await worker.fetch(req(await jwt({ iss: 'https://evil.cloudflareaccess.com' })), env())).status, 403);
});
test('rejects a tampered payload', async () => {
  const [h, , s] = (await jwt({})).split('.');
  const forged = b64u(JSON.stringify({ aud: [AUD], iss: `https://${TEAM}.cloudflareaccess.com`, exp: 9999999999 }));
  assert.equal((await worker.fetch(req(`${h}.${forged}.${s}`), env())).status, 403);
});
test('rejects garbage', async () => {
  assert.equal((await worker.fetch(req('not.a.jwt'), env())).status, 403);
  assert.equal((await worker.fetch(req('x'), env())).status, 403);
});
test('ACCESS_DISABLED only bypasses when exactly "true"', async () => {
  assert.equal((await worker.fetch(req(), env({ ACCESS_DISABLED: 'true' }))).status, 200);
  assert.equal((await worker.fetch(req(), env({ ACCESS_DISABLED: '1' }))).status, 403);
});
test('accepts any of several comma-separated application tags, and only those', async () => {
  const two = env({ ACCESS_AUD: `other-app, ${AUD}` });
  assert.equal((await worker.fetch(req(await jwt({})), two)).status, 200);
  assert.equal((await worker.fetch(req(await jwt({ aud: ['third-app'] })), two)).status, 403);
  assert.equal((await worker.fetch(req(await jwt({ aud: [''] })), env({ ACCESS_AUD: `${AUD},` }))).status, 403);
});

test('kit HTML and SVG are served in a sandbox; other files are not', async () => {
  const stored = (key) => ({ size: 4, httpEtag: '"e"', range: undefined, body: 'abcd', writeHttpMetadata() {} });
  const e = env({ FILES: { get: async (key) => stored(key) } });
  const get = (p) => worker.fetch(new Request(`https://brand.example/files/${p}`, { headers: { 'cf-access-jwt-assertion': token } }), e);
  const token = await jwt({});
  assert.equal((await get('guides/style-guide.html')).headers.get('content-security-policy'), 'sandbox');
  assert.equal((await get('logos/svg/logo.svg')).headers.get('content-security-policy'), 'sandbox');
  assert.equal((await get('print/card.pdf')).headers.get('content-security-policy'), null);
});
