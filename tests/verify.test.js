import test from 'node:test';
import assert from 'node:assert/strict';
import { compareFingerprint, readMilestoneMemo } from '../src/verify.js';
import { MEMO_TYPE, MEMO_FORMAT } from '../src/config.js';

const RECORDED = 'c9e00155ec01d175070ab97b7c06ab10e6cb93c6ebc201bdc861f2d461b1d691';
const OTHER = 'f5ca58c520a9b3e8a2e1c4855da2b8767873cf17619cbccff6fc7003ae6a3b05';

const event = { objectId: 'OBJ-2026-0142', milestoneId: 'M03', documentHash: RECORDED };

const toHex = (value) => Buffer.from(value, 'utf8').toString('hex').toUpperCase();

// A stand-in for the XRPL client: readMilestoneMemo only ever calls .request,
// so the decoding logic can be exercised without touching the network.
const clientReturning = (result) => ({
  request: async () => ({ result })
});

test('an unchanged file matches what the ledger recorded', () => {
  const result = compareFingerprint(event, RECORDED);

  assert.equal(result.match, true);
  assert.equal(result.expected, RECORDED);
  assert.equal(result.actual, RECORDED);
});

test('a changed file does not match, and both hashes are reported', () => {
  const result = compareFingerprint(event, OTHER);

  assert.equal(result.match, false);
  assert.equal(result.expected, RECORDED);
  assert.equal(result.actual, OTHER);
});

test('the memo is decoded out of the tx_json shape returned by xrpl 4.x', async () => {
  const client = clientReturning({
    validated: true,
    tx_json: {
      Account: 'rfJgSQdJbSHh1VtoYgdHeWTzN6im5bhFD8',
      Memos: [
        {
          Memo: {
            MemoType: toHex(MEMO_TYPE),
            MemoFormat: toHex(MEMO_FORMAT),
            MemoData: toHex(JSON.stringify(event))
          }
        }
      ]
    }
  });

  const read = await readMilestoneMemo(client, 'ABC');

  assert.equal(read.validated, true);
  assert.equal(read.account, 'rfJgSQdJbSHh1VtoYgdHeWTzN6im5bhFD8');
  assert.deepEqual(read.event, event);
});

test('the memo is also found in the flat shape used by older API versions', async () => {
  const client = clientReturning({
    validated: true,
    Account: 'rfJgSQdJbSHh1VtoYgdHeWTzN6im5bhFD8',
    Memos: [{ Memo: { MemoType: toHex(MEMO_TYPE), MemoData: toHex(JSON.stringify(event)) } }]
  });

  const read = await readMilestoneMemo(client, 'ABC');

  assert.deepEqual(read.event, event);
});

test('a transaction carrying someone elses memo is refused, not misread', async () => {
  const client = clientReturning({
    validated: true,
    tx_json: {
      Memos: [{ Memo: { MemoType: toHex('something/else'), MemoData: toHex('{}') } }]
    }
  });

  await assert.rejects(() => readMilestoneMemo(client, 'ABC'), /carries no "proobject\/milestone" memo/);
});

test('a transaction with no memo at all is refused', async () => {
  const client = clientReturning({ validated: true, tx_json: {} });

  await assert.rejects(() => readMilestoneMemo(client, 'ABC'), /carries no/);
});
