# Off-chain / on-chain boundary

The ledger is public and permanent. Anything written there can be read by anyone
and can never be withdrawn. That single fact sets the boundary.

## What crosses to the ledger

| On-chain | Why it is safe to publish |
| --- | --- |
| Document fingerprint (SHA-256) | A one-way hash. It proves a file matches, and reveals nothing about its contents |
| Object and milestone identifier | Opaque codes. `OBJ-2026-0142` names nothing outside the system that issued it |
| Milestone status | A short enumerated value: completed, pending |
| Document version | An integer |
| Timestamp | The moment of recording |
| Transaction ID | Produced by the ledger itself |

## What never crosses

| Off-chain | Why it stays |
| --- | --- |
| The document itself, drawings, photos | Confidential, often large, and irretrievable once published |
| Personal data of any party | Publishing it would be irreversible and, in most jurisdictions, unlawful |
| Estimates, formulas, coefficients, commercial logic | The core of the product |
| Contracts and evidence of performance | Confidential between the parties |
| Keys, seeds, credentials | Never leave the machine — in this module they are never created to begin with |

## Why a hash is enough

Verification does not require the ledger to hold the document. It requires only
that two hashes be compared: the one recorded then, and the one computed from the
file now.

- identical hashes — the file is byte for byte the one that was recorded
- different hashes — the file is not that one, and no amount of argument changes it

A single altered character produces a completely different hash. The module
demonstrates this directly: `MATCH` becomes `MISMATCH`, and the process exits
with code 1.

## What the boundary does not give

The ledger attests to a **file**, not to a **fact about the world**.

A validated transaction proves that a document with this fingerprint existed in
this state at this time, and that it has not changed since. It does not prove
that the pipeline was actually replaced, that the weld passed inspection, or that
the act describes reality. Physical acceptance remains an engineering and human
process; the ledger only removes the argument about which version of the paper
was on the table.

## Identifier hygiene

Identifiers are the one place where confidential information can leak past the
boundary by accident. `OBJ-2026-0142` is safe. A customer name, a site address or
a contract number used as an object id would not be — it would be published
permanently, in clear text, without anyone intending it.

Identifiers on the ledger must stay opaque, and the mapping from an identifier to
a real object belongs in the private system.
