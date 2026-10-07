// Tests the access-users.txt parser and the Access policy merge in sync-access.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUsers, planInclude, pickPolicy, summarise } from '../sync-access.mjs';

const users = (t) => parseUsers(t);

test('parses emails, domains and comments', () => {
  const u = users('# people\nA@Example.com\n\n@jrm.com.au\n');
  assert.deepEqual([...u.emails], ['a@example.com']);
  assert.deepEqual([...u.domains], ['jrm.com.au']);
});
test('rejects lines that are not addresses', () => {
  assert.throws(() => users('ben at example.com'), /not an email/);
  assert.throws(() => users('ben@localhost'), /not an email/);
});
test('adds without removing by default', () => {
  const cur = [{ email: { email: 'owner@x.com' } }, { group: { id: 'g1' } }];
  const p = planInclude(cur, users('new@y.com'));
  assert.deepEqual(p.added, ['new@y.com']);
  assert.deepEqual(p.removed, []);
  assert.deepEqual(p.notInFile, ['owner@x.com']);
  assert.deepEqual(p.include, [{ group: { id: 'g1' } }, { email: { email: 'new@y.com' } }, { email: { email: 'owner@x.com' } }]);
});
test('prune removes people not in the file but keeps other rule types', () => {
  const cur = [{ email: { email: 'old@x.com' } }, { email_domain: { domain: 'x.com' } }, { ip: { ip: '1.2.3.4/32' } }];
  const p = planInclude(cur, users('new@y.com'), true);
  assert.deepEqual(p.removed, ['old@x.com', '@x.com']);
  assert.deepEqual(p.include, [{ ip: { ip: '1.2.3.4/32' } }, { email: { email: 'new@y.com' } }]);
});
test('matches existing emails case-insensitively', () => {
  const p = planInclude([{ email: { email: 'Hello@LinkHaus.com.au' } }], users('hello@linkhaus.com.au'));
  assert.deepEqual(p.added, []);
});
test('the real access-users.txt parses', async () => {
  const { readFileSync } = await import('node:fs');
  // Parses without error; an empty list (comments only) is allowed.
  users(readFileSync(new URL('../../access-users.txt', import.meta.url), 'utf8'));
});

const pol = (name, include, decision = 'allow') => ({ id: name, name, decision, include });
const dom = (d) => ({ email_domain: { domain: d } });
const em = (e) => ({ email: { email: e } });

test('picks the one people policy, skipping domain-only policies', () => {
  const p = pickPolicy([pol('Email domain: a.com', [dom('a.com')]), pol('Viewing ', [em('x@y.com')]), pol('Email domain: b.com', [dom('b.com')])]);
  assert.equal(p.name, 'Viewing ');
});
test('picks by name, ignoring case and stray spaces', () => {
  const p = pickPolicy([pol('Viewing ', [em('x@y.com')]), pol('Staff', [em('z@y.com')])], 'viewing');
  assert.equal(p.name, 'Viewing ');
});
test('refuses to guess between several people policies, or when there are none', () => {
  assert.throws(() => pickPolicy([pol('A', [em('a@x.com')]), pol('B', [em('b@x.com')])]), /Several policies/);
  assert.throws(() => pickPolicy([pol('D', [dom('x.com')])]), /no policy for individual people/);
  assert.throws(() => pickPolicy([pol('Block', [em('a@x.com')], 'deny')]), /no policy for individual people/);
});
test('summarises rule types', () => {
  assert.equal(summarise([em('a@x.com'), em('b@x.com'), dom('x.com')]), 'email ×2, email_domain ×1');
});
