import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * SHA-256 fingerprint of a file, as a lowercase hex string.
 *
 * The file itself never leaves the machine. Only this 64-character string is
 * ever written to the ledger, which is what keeps confidential documents
 * off-chain while still making a later substitution detectable.
 *
 * Read as a stream rather than all at once: the documents this is meant for
 * are drawings, photos and BOQs, which do not belong in memory in one piece.
 */
export async function fileFingerprint(path) {
  const hash = createHash('sha256');

  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}

// Run directly: print the fingerprint of the file given as an argument.
if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  const path = argv[2];

  if (!path) {
    console.error('Usage: node src/hash.js <file>');
    process.exit(1);
  }

  try {
    console.log(await fileFingerprint(path));
  } catch (error) {
    console.error(`Cannot read ${path}: ${error.code ?? error.message}`);
    process.exit(1);
  }
}
