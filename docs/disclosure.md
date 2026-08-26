# Disclosure

## What this module is

A public-safe technical proof, built on synthetic data, that a construction
document fingerprint and a milestone status can be recorded on XRPL Testnet and
verified again later.

> This proof module records a synthetic document fingerprint and milestone status
> on XRPL Testnet. It does not calculate estimates, verify construction quality,
> store confidential files, issue tokens or manage real funds.

## What it does not do

- **No estimates.** It performs no calculation of cost, scope, labour or duration.
- **No quality assurance.** It cannot confirm that any work was performed, or
  performed correctly. A fingerprint attests to a file, not to physical reality.
- **No file storage.** Documents never leave the local machine. Only a hash is
  published.
- **No token.** Nothing is issued, minted or offered.
- **No funds.** Testnet only. No real value is transferred, held or managed, and
  the transaction type used moves no value at all.
- **No settlement or escrow.** Payment logic is not implemented and not designed here.
- **No identity.** There is no account model, no signing identity, no authorization.
  The wallet is disposable.

## Relationship to the ProObject product

This repository is deliberately separate from the product. The calculation
engine, estimate logic, prompt library, matching and scoring logic, the case
database and the commercial codebase are not present here and are not published.

Nothing in this repository should be read as a description of how the product
computes anything.

## Stage of the work

This is a proof of concept demonstrating one mechanism end to end. It is not
production software and has not been designed, reviewed or hardened for
production use. Moving it there would require, at minimum: key management and a
signing identity, an account and authorization model, a data retention and
erasure policy, an operational plan for network availability, and legal review of
what a ledger record means in a contractual dispute.

Those questions are open, and this module exists partly to make them concrete.

## Data

Every example in this repository is invented. No real object, customer,
contractor, address, amount, contract or document is represented, and no personal
data is present.

## Verification by a third party

The proof does not depend on trusting this repository. The recorded transaction
is public: it can be opened in any XRPL Testnet explorer, and its memo decoded,
without running this code. The verification script only automates a comparison
anyone can perform by hand.
