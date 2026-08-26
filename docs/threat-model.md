# Threat model

Scope: this repository and the Testnet demonstration it performs. Production
deployment of ProObject is a different system with a different model.

## What this protects against

**Silent substitution of a document.** Someone reissues an act, a drawing or a
defect list and presents it as the version that was agreed. The recorded
fingerprint settles it: the file either matches the ledger or it does not.

**Backdating.** A validated transaction carries the ledger's own timestamp. A
record cannot be created retroactively, and the module never supplies the
timestamp used for validation.

**Disputes over which copy is authoritative.** Both sides can verify against the
same public transaction without trusting each other's storage, and without this
repository being available.

## What it does not protect against

**A false document recorded honestly.** If the document was wrong when it was
fingerprinted, the ledger faithfully preserves a wrong document. The record
attests to the file, never to the truth of its contents.

**Physical reality.** No blockchain confirms that work was performed or performed
to standard. That is inspection, testing and acceptance.

**A dispute over which record counts.** Nothing stops anyone from recording many
fingerprints of many versions. Deciding which record is the agreed one is a
process and contract question, not a ledger question.

**Compromise of the machine that computes the hash.** If the file is altered
before hashing, the fingerprint is of the altered file.

## Handling of secrets

There are none, by construction.

Every run requests a fresh funded wallet from the Testnet faucet and discards it
when the process exits. No seed, private key or credential is created, stored,
written to disk or read from the environment. `.env.example` documents only the
endpoint and says so explicitly.

This removes the largest category of accident in a demonstration project: a key
committed to a repository, or shown on screen during a recording.

## Data in this repository

Everything in `examples/` is invented. No real object, customer, contractor,
address, amount or document is represented. `examples/sample-document.txt` says so
in its own text, so it cannot be mistaken for a real act if it is read out of
context.

## Reviewer checklist

Before this repository is shown to anyone outside the team:

- [ ] `npm test` passes and no test needs the network
- [ ] no `.env` file is present; `.env.example` contains no values
- [ ] `git status` shows no key material, no real document, no personal data
- [ ] every file under `examples/` is synthetic and marked as such
- [ ] `proof.json` points at a Testnet transaction, never at Mainnet
- [ ] no screen recording shows a seed, a token, a password or a private inbox
- [ ] the README claims nothing the code does not do

## Known limitations of the demonstration

- The Testnet faucet is a shared free service and can time out. `record.js` retries
  three times and then reports it as an availability problem rather than a defect.
- Testnet ledgers carry no guarantee of permanence comparable to Mainnet. This is
  a proof of concept, and the choice of Testnet is deliberate: no real funds.
- Each run records from a different address, since the wallet is not persisted.
