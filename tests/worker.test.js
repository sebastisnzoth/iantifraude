import test from 'node:test';
import assert from 'node:assert/strict';
import { grantsAccess, advanceQuota, validateModel } from '../worker/index.mjs';

test('remote access requires an allowed real Play transaction with current access', () => {
  const now = Date.now();
  const record = { store: 'play_store', is_sandbox: false };
  const account = {
    entitlements: { antigolpe_pro: { product_identifier: 'annual', expires_date: new Date(now + 1000).toISOString() } },
    subscriptions: { annual: record },
  };
  assert.equal(grantsAccess(account, ['annual'], now), true);
  assert.equal(grantsAccess(account, [], now), false);
  assert.equal(grantsAccess(account, ['annual'], now + 2000), false);
  record.is_sandbox = true;
  assert.equal(grantsAccess(account, ['annual'], now), false);
  record.is_sandbox = false;
  record.refunded_at = new Date(now).toISOString();
  assert.equal(grantsAccess(account, ['annual'], now), false);
});

test('quotas reject replay, cap usage, and reset on the next UTC day', () => {
  let state = advanceQuota(null, 'customer', 'a', 0);
  assert.equal(advanceQuota(state, 'customer', 'a', 0), null);
  for (const nonce of ['b','c','d']) state = advanceQuota(state, 'customer', nonce, 0);
  assert.equal(advanceQuota(state, 'customer', 'e', 0), null);
  assert.equal(advanceQuota(state, 'customer', 'e', 86400000).count, 1);
});

test('model output must cite the original text and a recognized tactic', () => {
  const input = JSON.stringify({signals:[{tactic:'urgency', quote:'now'}]});
  assert.deepEqual(validateModel(input, 'pay now'), [{tactic:'urgency', quote:'now'}]);
  assert.throws(() => validateModel(input, 'tomorrow'));
});
