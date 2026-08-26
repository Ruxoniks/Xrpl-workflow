import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileFingerprint } from '../src/hash.js';

// Resolved from this file, not from the working directory, so the suite passes
// no matter where it is started from.
const DOCUMENT = join(import.meta.dirname, '..', 'examples', 'sample-document.txt');

test('the same document always produces the same fingerprint', async () => {
  const first = await fileFingerprint(DOCUMENT);
  const second = await fileFingerprint(DOCUMENT);

  assert.match(first, /^[0-9a-f]{64}$/, 'a fingerprint is 64 lowercase hex characters');
  assert.equal(first, second);
});

test('changing a single character breaks the match', async () => {
  const original = readFileSync(DOCUMENT, 'utf8');
  const tampered = original.replace('42 running metres', '43 running metres');

  assert.notEqual(tampered, original, 'the test document must contain the text being altered');

  const copy = join(tmpdir(), `proobject-tampered-${process.pid}.txt`);

  try {
    writeFileSync(copy, tampered);
    assert.notEqual(await fileFingerprint(copy), await fileFingerprint(DOCUMENT));
  } finally {
    rmSync(copy, { force: true });
  }
});

test('an empty file still hashes, and differs from the document', async () => {
  const empty = join(tmpdir(), `proobject-empty-${process.pid}.txt`);

  try {
    writeFileSync(empty, '');
    const fingerprint = await fileFingerprint(empty);

    assert.match(fingerprint, /^[0-9a-f]{64}$/);
    assert.notEqual(fingerprint, await fileFingerprint(DOCUMENT));
  } finally {
    rmSync(empty, { force: true });
  }
});

test('a missing file is reported, not silently hashed', async () => {
  await assert.rejects(
    () => fileFingerprint(join(tmpdir(), 'proobject-does-not-exist.txt')),
    { code: 'ENOENT' }
  );
});
