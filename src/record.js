import { Client, convertStringToHex } from 'xrpl';
import { readFileSync, writeFileSync } from 'node:fs';
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';
import { fileFingerprint } from './hash.js';
import { buildMilestoneEvent, selectMilestone } from './milestone.js';
import { ENDPOINT, MEMO_TYPE, MEMO_FORMAT, explorerUrl } from './config.js';

const DEFAULT_DOCUMENT = 'examples/sample-document.txt';
const DEFAULT_PASSPORT = 'examples/object-passport.json';
const DEFAULT_MILESTONE = 'M03';
const DEFAULT_VERSION = 2;
const PROOF_FILE = 'proof.json';

const FAUCET_ATTEMPTS = 3;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The Testnet faucet is a shared free service and times out under load. A
 * failure here is not a defect in the module, so it is worth retrying before
 * reporting a blocker.
 */
async function fundWalletWithRetry(client) {
  for (let attempt = 1; attempt <= FAUCET_ATTEMPTS; attempt += 1) {
    try {
      const { wallet } = await client.fundWallet();
      return wallet;
    } catch (error) {
      if (attempt === FAUCET_ATTEMPTS) {
        throw new Error(
          `The Testnet faucet did not respond after ${FAUCET_ATTEMPTS} attempts (${error.message}). ` +
            'This is a Testnet availability problem, not a problem with the module. Try again later.'
        );
      }

      const pause = attempt * 3000;
      console.log(`  faucet attempt ${attempt} failed, retrying in ${pause / 1000}s...`);
      await wait(pause);
    }
  }
}

/**
 * Records one milestone event on XRPL Testnet and writes the proof to disk.
 *
 * No real funds are involved. The transaction is an AccountSet that changes
 * no account setting - it exists purely to carry the memo. A Payment to
 * oneself is not an option either: the ledger rejects it as temREDUNDANT.
 */
async function main() {
  const [documentPath = DEFAULT_DOCUMENT, passportPath = DEFAULT_PASSPORT, milestoneId = DEFAULT_MILESTONE] =
    argv.slice(2);

  const passport = JSON.parse(readFileSync(passportPath, 'utf8'));
  const milestone = selectMilestone(passport, milestoneId);
  const documentHash = await fileFingerprint(documentPath);

  const event = buildMilestoneEvent({
    objectId: passport.objectId,
    milestoneId: milestone.milestoneId,
    status: milestone.status,
    documentHash,
    version: DEFAULT_VERSION
  });

  console.log('Passport:    ', passportPath);
  console.log('Milestone:   ', `${milestone.milestoneId} - ${milestone.title} (${milestone.status})`);
  console.log('Document:    ', documentPath);
  console.log('Fingerprint: ', documentHash);
  console.log('Event:       ', JSON.stringify(event));
  console.log('');

  const client = new Client(ENDPOINT);

  try {
    console.log('Connecting to', ENDPOINT);
    await client.connect();

    // The faucet issues a fresh funded Testnet wallet on every run, so there is
    // no seed to store anywhere and nothing that could leak through the repo.
    console.log('Requesting a funded Testnet wallet from the faucet...');
    const wallet = await fundWalletWithRetry(client);
    console.log('Wallet:      ', wallet.address);
    console.log('');

    console.log('Submitting and waiting for validation...');
    const response = await client.submitAndWait(
      {
        TransactionType: 'AccountSet',
        Account: wallet.address,
        Memos: [
          {
            Memo: {
              MemoType: convertStringToHex(MEMO_TYPE),
              MemoFormat: convertStringToHex(MEMO_FORMAT),
              MemoData: convertStringToHex(JSON.stringify(event))
            }
          }
        ]
      },
      { wallet }
    );

    const { hash, validated, meta } = response.result;
    const outcome = typeof meta === 'object' ? meta.TransactionResult : meta;

    console.log('');
    console.log('validated:   ', validated);
    console.log('result:      ', outcome);
    console.log('tx hash:     ', hash);
    console.log('explorer:    ', explorerUrl(hash));

    if (!validated || outcome !== 'tesSUCCESS') {
      throw new Error(`Transaction did not succeed: validated=${validated}, result=${outcome}`);
    }

    // Written to disk because terminal scrollback is not evidence: this file is
    // what gets shown, linked and checked later.
    const proof = {
      txHash: hash,
      explorer: explorerUrl(hash),
      network: 'xrpl-testnet',
      endpoint: ENDPOINT,
      account: wallet.address,
      document: documentPath,
      event,
      recordedAt: new Date().toISOString()
    };

    writeFileSync(PROOF_FILE, `${JSON.stringify(proof, null, 2)}\n`);

    console.log('');
    console.log(`Recorded. Proof written to ${PROOF_FILE}.`);
    console.log('The document stays off-chain; only its fingerprint is on the ledger.');
    console.log('');
    console.log(`Verify with: node src/verify.js ${hash} ${documentPath}`);
  } finally {
    // Without this the open websocket keeps the process alive.
    if (client.isConnected()) {
      await client.disconnect();
    }
  }
}

if (argv[1] && fileURLToPath(import.meta.url) === argv[1]) {
  main().catch((error) => {
    console.error('');
    console.error('Failed:', error.message);
    process.exit(1);
  });
}
