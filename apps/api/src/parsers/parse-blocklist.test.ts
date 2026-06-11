import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMerchantName } from './parse-blocklist.service';

describe('parse-blocklist', () => {
  it('normalizes merchant names for comparison', () => {
    assert.equal(normalizeMerchantName('  Target  '), 'target');
    assert.equal(normalizeMerchantName('Best   Buy'), 'best buy');
    assert.equal(normalizeMerchantName(''), null);
    assert.equal(normalizeMerchantName(undefined), null);
  });
});
