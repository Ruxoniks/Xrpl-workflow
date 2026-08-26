/**
 * Shared settings. Kept in one place so record and verify can never drift
 * apart on the endpoint or on how a milestone memo is labelled.
 */

export const ENDPOINT = process.env.XRPL_ENDPOINT ?? 'wss://s.altnet.rippletest.net:51233/';

// MemoType and MemoFormat may only use URL-safe characters, per the XRPL
// common-fields reference. Both values below stay inside that set.
export const MEMO_TYPE = 'proobject/milestone';
export const MEMO_FORMAT = 'application/json';

export function explorerUrl(txHash) {
  return `https://testnet.xrpl.org/transactions/${txHash}`;
}
