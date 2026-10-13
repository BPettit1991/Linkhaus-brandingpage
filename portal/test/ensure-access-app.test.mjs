// Tests the custom-domain Access application helpers in ensure-access-app.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { covers, newAppBody } from '../ensure-access-app.mjs';

test('finds an application by domain, self-hosted domain or destination, ignoring case', () => {
  assert.ok(covers({ domain: 'Brand.Example.com' }, 'brand.example.com'));
  assert.ok(covers({ self_hosted_domains: ['x.com', 'brand.example.com/'] }, 'brand.example.com'));
  assert.ok(covers({ destinations: [{ type: 'public', uri: 'brand.example.com' }] }, 'brand.example.com'));
  assert.ok(!covers({ domain: 'www.example.com' }, 'brand.example.com'));
});
test('a new application copies the policies and session length of the workers.dev one', () => {
  const body = newAppBody({ session_duration: '168h', policies: [{ id: 'p1', precedence: 5 }, { id: 'p2' }, { id: 'p0', precedence: 2 }] }, 'brand.example.com');
  assert.equal(body.type, 'self_hosted');
  assert.equal(body.domain, 'brand.example.com');
  assert.equal(body.session_duration, '168h');
  assert.deepEqual(body.policies, [{ id: 'p0', precedence: 1 }, { id: 'p1', precedence: 2 }, { id: 'p2', precedence: 3 }]);
});
