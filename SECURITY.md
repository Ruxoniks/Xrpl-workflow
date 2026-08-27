# Security policy

## What this repository contains

A public-safe technical proof running against XRPL **Testnet**, built entirely on
synthetic data. Nothing here is production software.

## What is never published here

The following are excluded from this repository by policy, not by accident:

- **Real documents.** No customer act, drawing, BOQ, defect report, contract or
  photograph. Every file under `examples/` is invented.
- **Personal data.** No names, contacts, addresses, passport or company details of
  any real person or organisation.
- **Keys and credentials.** No seed phrase, private key, API key, token, password
  or `.env` file. None exist in this project to begin with: every run requests a
  disposable wallet from the Testnet faucet and discards it on exit.
- **Commercial logic.** No calculation engine, estimate formulas, coefficients,
  prompts, matching or scoring logic, and no case database. These belong to the
  ProObject product and are not part of this proof.
- **Real funds.** Testnet only. No token is issued and no value is transferred.

## What reaches the ledger

Only a SHA-256 fingerprint, opaque object and milestone identifiers, a status, a
version number and a timestamp. Never a document, never personal data, never a
sum. The reasoning is set out in [`docs/boundary.md`](docs/boundary.md), and what
the module does and does not defend against in
[`docs/threat-model.md`](docs/threat-model.md).

A ledger record is permanent and public. Identifiers written to it must stay
opaque: `OBJ-2026-0142` is safe, a customer name or site address used as an
object id would be published irreversibly.

## How this is enforced

- `.gitignore` excludes `.env`, `*.pem`, `*.key` and dependency directories
- `.env.example` contains an endpoint and no credential of any kind
- CI fails the build if a file matching a secret pattern is ever tracked
- The test suite is offline: no test carries a token or reaches a private service

## Before publishing anything from here

- [ ] `npm test` passes
- [ ] `git status` shows no key material, real document or personal data
- [ ] `proof.json` points at a Testnet transaction, never at Mainnet
- [ ] no screen recording shows a seed, token, password or private inbox

## Reporting a problem

If you find a secret, a real document or personal data in this repository, or a
flaw in how the boundary above is enforced, please report it privately by email
rather than opening a public issue:

**vitalijtolkov487@gmail.com**

Please do not include the sensitive material itself in the message — a file path
and a short description are enough to act on.

## Scope of this policy

This policy covers this repository only. It is a proof of concept and carries no
security guarantee, no service-level commitment and no warranty. Production
deployment would require a separate design covering key management, an identity
and authorization model, data retention and erasure, and legal review.
