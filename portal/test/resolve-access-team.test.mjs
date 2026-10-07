// Tests reading the Zero Trust team name from an Access URL (resolve-access-team.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { teamFromUrl } from '../resolve-access-team.mjs';

test('reads the team from an Access sign-in URL', () => {
  assert.equal(teamFromUrl('https://jrmcontracting.cloudflareaccess.com/cdn-cgi/access/login/x?kid=1'), 'jrmcontracting');
  assert.equal(teamFromUrl('https://Frosty-Disk-06a8.cloudflareaccess.com'), 'frosty-disk-06a8');
});
test('ignores anything that is not a cloudflareaccess.com team host', () => {
  assert.equal(teamFromUrl('https://evil.cloudflareaccess.com.attacker.net/'), null);
  assert.equal(teamFromUrl('https://a.b.cloudflareaccess.com/'), null);
  assert.equal(teamFromUrl('https://example.com/'), null);
  assert.equal(teamFromUrl(''), null);
  assert.equal(teamFromUrl('not a url'), null);
});
