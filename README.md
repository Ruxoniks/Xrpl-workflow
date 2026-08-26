# ProObject — XRPL proof module

Records the fingerprint of a construction document and the status of a project
milestone on the XRP Ledger Testnet, then verifies a file against that record.

> This proof module records a synthetic document fingerprint and milestone status
> on XRPL Testnet. It does not calculate estimates, verify construction quality,
> store confidential files, issue tokens or manage real funds.

## Why XRPL

A construction deal produces documents that change: an act is reissued, a drawing
gets a new revision, a defect list is corrected. Later, when parties disagree,
the question is which version was actually agreed at the time.

Putting the documents themselves on a ledger would be wrong — they are
confidential and often large. Putting a **fingerprint** there is enough: a
64-character hash proves that a specific file existed in a specific state at a
specific moment, without revealing anything about its contents. XRPL gives that
record a validated timestamp and a public transaction the other side can check
independently.

## What it does

1. Reads a synthetic object passport and picks one milestone from it
2. Computes the SHA-256 fingerprint of a synthetic document
3. Builds a compact milestone event: object, milestone, status, fingerprint, version, timestamp
4. Writes the event into the `Memos` field of an XRPL Testnet transaction
5. Waits for the transaction to be validated, then saves the proof to `proof.json`
6. Verifies any file against a recorded transaction and reports match or mismatch

## Requirements

- Node.js 18 or later (developed on 24)
- Network access to XRPL Testnet

No account, no funding and no key material are needed: the Testnet faucet issues
a fresh funded wallet on every run.

## Running it

```
npm install
npm test
```

Nineteen tests, no network involved.

```
npm run fingerprint
```

Prints the SHA-256 of `examples/sample-document.txt`.

```
npm run record
```

Connects to Testnet, records the milestone event, prints the transaction hash and
an explorer link, and writes `proof.json`.

```
node src/verify.js <txHash> <file>
```

Fetches the transaction, decodes the memo and compares the recorded fingerprint
with the file on disk. Exit code `0` on match, `1` on mismatch, `2` on error — so
it can be used from a script, not only read on screen.

### Expected result

The latest recorded proof, including the document fingerprint, is stored in
`proof.json`.

See `proof.json` for the latest recorded proof.

Change a single character in `examples/sample-document.txt` and run the same
command again: the fingerprints diverge and the verdict becomes `MISMATCH`. That
is the whole point of the module in one command.

## A recorded proof

| | |
| --- | --- |
| Transaction | [`31A2004D…73248F`](https://testnet.xrpl.org/transactions/31A2004D7A08F4D6A7F875522A2E54C0C4E6C43232BF4ECAC8410A94AE73248F) |
| Network | XRPL Testnet |
| Recorded | 2026-08-19 |
| Status | validated, `tesSUCCESS` |

See [`proof.json`](proof.json) for the latest recorded proof. The transaction
below is kept as a concrete example; the current proof details are recorded in
`proof.json`. The transaction stays on the Testnet ledger and can be checked by
anyone, at any time, without this repository.

## What stays off the ledger

| Off-chain | On-chain |
| --- | --- |
| The document itself, photos, personal data | Document fingerprint (SHA-256) |
| Estimates, formulas, commercial logic | Object and milestone identifier |
| Contracts and evidence of performance | Milestone status and timestamp |
| Keys and credentials | Transaction ID |

## Limitations

- **Testnet only.** No real funds are involved and no token is issued.
- **Synthetic data only.** Every example in this repository is invented. No real
  object, customer, contractor, address or amount is represented.
- **A fingerprint proves a file, not a fact.** The ledger can show that a document
  existed unchanged at a point in time. It cannot show that the work described in
  it was actually performed, or performed well. Physical acceptance stays a human
  and engineering process.
- **A proof of concept, not settlement infrastructure.** Production use would need
  key management, an identity model, a retention policy and legal review, none of
  which are in scope here.

## Documentation

- [Architecture](docs/architecture.md) — how the pieces fit and why the transaction is an `AccountSet`
- [Off-chain / on-chain boundary](docs/boundary.md) — what crosses to the ledger and what never does
- [Threat model](docs/threat-model.md) — what this protects against, what it does not
- [Disclosure](docs/disclosure.md) — the claims this module does and does not support

## Scope

This repository is a public-safe technical proof. It is deliberately separate
from the ProObject product: the calculation engine, estimate logic, prompt
library and case database are not here and are not published.

Product page: <https://pro-object-workflow.vercel.app/>
