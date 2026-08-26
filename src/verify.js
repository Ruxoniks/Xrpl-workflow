import { Client, convertHexToString } from 'xrpl';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';
import { fileFingerprint } from './hash.js';
import { ENDPOINT, MEMO_TYPE, explorerUrl } from './config.js';

/**
 * Compares the fingerprint recorded on the ledger with the fingerprint of the
 * file as it exists now. Pure: no network, no filesystem, so the rule at the
 * heart of the module is testable on its own.
 */
export function compareFingerprint(event, actualHash) {
  return {
    match: event.documentHash === actualHash,
    expected: event.documentHash,
    actual: actualHash
  };
}

/**
 * Reads a milestone event back out of a validated transaction.
 *
 * Note the tx_json fallback: xrpl 4.6 returns the transaction nested under
 * result.tx_json, while older API versions put its fields directly on result.
 * Without the fallback the Memos lookup silently finds nothing.
 */
export async function readMilestoneMemo(client, txHash) {
  const response = await client.request({ command: 'tx', transaction: txHash });
  const transaction = response.result.tx_json ?? response.result;

  const memo = (transaction.Memos ?? [])
    .map((entry) => entry.Memo)
    .find((entry) => entry?.MemoType && convertHexToString(entry.MemoType) === MEMO_TYPE);

  if (!memo) {
    throw new Error(`Transaction ${txHash} carries no "${MEMO_TYPE}" memo`);
  }

  return {
    event: JSON.parse(convertHexToString(memo.MemoData)),
    validated: response.result.validated === true,
    account: transaction.Account
  };
}

async function main() {
  const [txHash, path] = argv.slice(2);

  if (!txHash || !path) {
    console.error('Usage: node src/verify.js <txHash> <file>');
    process.exit(2);
  }

  const client = new Client(ENDPOINT);

  try {
    await client.connect();

    const { event, validated, account } = await readMilestoneMemo(client, txHash);
    const actualHash = await fileFingerprint(path);
    const result = compareFingerprint(event, actualHash);

    console.log('Transaction: ', txHash);
    console.log('Explorer:    ', explorerUrl(txHash));
    console.log('Validated:   ', validated);
    console.log('Recorded by: ', account);
    console.log('');
    console.log('Object:      ', `${event.objectId} / ${event.milestoneId} / ${event.status}`);
    console.log('Version:     ', event.version);
    console.log('Recorded at: ', event.timestamp);
    console.log('');
    console.log('File:        ', path);
    console.log('On ledger:   ', result.expected);
    console.log('On disk:     ', result.actual);
    console.log('');

    if (!validated) {
      console.log('INCONCLUSIVE - the transaction is not in a validated ledger yet.');
      process.exitCode = 1;
      return;
    }

    if (result.match) {
      console.log('MATCH - the file is byte for byte the one recorded on the ledger.');
    } else {
      console.log('MISMATCH - this file is not the one recorded on the ledger.');
      process.exitCode = 1;
    }
  } finally {
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
}

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  main().catch((error) => {
    console.error('');
    console.error('Failed:', error.message);
    process.exit(2);
  });
}
