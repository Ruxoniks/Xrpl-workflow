import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildMilestoneEvent, selectMilestone, MAX_EVENT_BYTES } from '../src/milestone.js';
import { MEMO_TYPE, MEMO_FORMAT } from '../src/config.js';

const PASSPORT = join(import.meta.dirname, '..', 'examples', 'object-passport.json');

const VALID_HASH = 'c'.repeat(64);

const validFields = () => ({
  objectId: 'OBJ-2026-0142',
  milestoneId: 'M03',
  status: 'completed',
  documentHash: VALID_HASH,
  version: 2
});

test('a complete event keeps its fields and gets a timestamp', () => {
  const event = buildMilestoneEvent(validFields());

  assert.equal(event.objectId, 'OBJ-2026-0142');
  assert.equal(event.documentHash, VALID_HASH);
  assert.ok(!Number.isNaN(Date.parse(event.timestamp)), 'timestamp must be a real date');
});

test('a supplied timestamp is kept, so a record can be rebuilt exactly', () => {
  const event = buildMilestoneEvent({ ...validFields(), timestamp: '2026-08-19T11:30:50.420Z' });

  assert.equal(event.timestamp, '2026-08-19T11:30:50.420Z');
});

test('a missing field is named in the error', () => {
  const { status, ...withoutStatus } = validFields();

  assert.throws(() => buildMilestoneEvent(withoutStatus), /missing: status/);
});

test('a malformed fingerprint is rejected', () => {
  for (const bad of ['', 'not-a-hash', 'C'.repeat(64), 'a'.repeat(63), 'a'.repeat(65)]) {
    assert.throws(
      () => buildMilestoneEvent({ ...validFields(), documentHash: bad }),
      /64-character lowercase SHA-256/,
      `expected "${bad.slice(0, 12)}" to be rejected`
    );
  }
});

test('an oversized event is refused before it reaches the network', () => {
  const event = { ...validFields(), objectId: 'X'.repeat(MAX_EVENT_BYTES) };

  assert.throws(() => buildMilestoneEvent(event), /over the \d+-byte limit/);
});

test('the example event is well inside the size budget', () => {
  const size = Buffer.byteLength(JSON.stringify(buildMilestoneEvent(validFields())), 'utf8');

  assert.ok(size < MAX_EVENT_BYTES, `event is ${size} bytes, budget is ${MAX_EVENT_BYTES}`);
});

test('memo labels use only the characters XRPL allows', () => {
  // From the XRPL common-fields reference: MemoType and MemoFormat are limited
  // to URL-safe characters.
  const allowed = /^[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/;

  assert.match(MEMO_TYPE, allowed);
  assert.match(MEMO_FORMAT, allowed);
});

test('a milestone is taken from the passport, with its own status', () => {
  const passport = JSON.parse(readFileSync(PASSPORT, 'utf8'));
  const milestone = selectMilestone(passport, 'M03');

  assert.equal(milestone.milestoneId, 'M03');
  assert.equal(milestone.status, 'completed');
});

test('an unknown milestone lists the ones that exist', () => {
  const passport = JSON.parse(readFileSync(PASSPORT, 'utf8'));

  assert.throws(() => selectMilestone(passport, 'M99'), /Known milestones: M01, M02, M03, M04/);
});
