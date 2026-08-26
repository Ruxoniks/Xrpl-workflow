# Architecture

## Shape of the module

Five source files, one dependency (`xrpl`), no framework. Everything that can be
tested without a network is separated from everything that cannot.

```
examples/object-passport.json   synthetic object record with a milestone list
examples/sample-document.txt    synthetic document to fingerprint

src/config.js                   endpoint, memo labels, explorer link
src/hash.js                     SHA-256 of a file, streamed
src/milestone.js                builds and validates the event; selects a milestone
src/record.js                   writes the event to the ledger
src/verify.js                   reads it back and compares

tests/                          19 tests, none of which touch the network
proof.json                      the last recorded proof
```

## Flow

```
object passport ─┐
                 ├─> milestone event ─> Memos ─> XRPL Testnet ─> validated tx
document ─ hash ─┘                                                    │
                                                                      v
                              file on disk ─ hash ─> compare <─── memo decoded
                                                        │
                                                  MATCH / MISMATCH
```

Recording and verification are deliberately independent. Verification takes a
transaction hash and a file and needs nothing else — not `proof.json`, not the
passport, not the machine that made the record. That is what makes it a proof
rather than a self-check: the previously recorded transaction
`28942AA0…C1DC0` was written by an earlier version of this code, from a
different wallet, and verification still resolves it correctly.

## Why the transaction is an `AccountSet`

The event has to travel in a transaction, and the choice of transaction type is
the difference between "we recorded something" and "we moved money".

`AccountSet` with no field set changes nothing about the account. It is a valid,
validated, fee-paying transaction that exists purely to carry its `Memos`. That
matches the claim the module makes: an event is fixed on the ledger, no value
moves.

A `Payment` was not an option in any case. XRPL rejects a payment whose
destination equals its sender with `temREDUNDANT`, so paying oneself to carry a
memo does not work. Paying a second wallet would work technically but would put
a value transfer at the centre of a module that is explicitly not about transfers.

## The memo

```json
{
  "objectId": "OBJ-2026-0142",
  "milestoneId": "M03",
  "status": "completed",
  "documentHash": "c9e00155…b1d691",
  "version": 2,
  "timestamp": "2026-08-19T14:38:59.873Z"
}
```

Carried as three hex-encoded fields:

| Field | Value |
| --- | --- |
| `MemoType` | `proobject/milestone` |
| `MemoFormat` | `application/json` |
| `MemoData` | the JSON above |

`MemoType` is what makes the record findable and unambiguous: verification looks
for a memo of exactly this type and refuses a transaction that carries someone
else's memo rather than guessing.

The XRPL common-fields reference caps the `Memos` field at 1 KB when serialized
in binary form, and restricts `MemoType` and `MemoFormat` to URL-safe characters.
`src/milestone.js` enforces a 400-byte budget on the event — far below the
ceiling, because an event that outgrows it is a design mistake, not a reason to
raise the limit. A test asserts the label character set directly.

## Status comes from the passport

`selectMilestone` looks the milestone up in the passport and takes its status
from there. The script does not accept a status as an argument.

This is not a style preference. If the caller could pass a status, the ledger
would record what someone typed rather than what the object record says, and the
proof would attest to nothing.

## Reading the transaction back

`xrpl` 4.6 returns the transaction nested under `result.tx_json`; older API
versions place its fields directly on `result`. `readMilestoneMemo` handles both.
Without that fallback the memo lookup finds nothing and fails in a way that looks
like a missing record rather than a shape mismatch — both shapes are covered by
tests.

## Key material

There is none. Every run asks the Testnet faucet for a fresh funded wallet, which
is discarded when the process exits. Nothing needs to be stored, so nothing can
leak through a commit or a screen recording. `.env.example` documents only the
endpoint.

The trade-off is that each run uses a different account. Two records of the same
document therefore come from two different addresses — correct for a proof of
concept, and something a production design would replace with a managed identity.
