/**
 * A milestone record is the only thing this module puts on the ledger:
 * which object, which stage, what state it is in, and the fingerprint of the
 * document that evidences it. Never the document, never a party, never a sum.
 */

// The XRPL common-fields reference caps the Memos field at 1 KB when serialized
// in binary form. This limit is deliberately far below that: the event carries
// identifiers and one hash, and anything that outgrows this budget is a design
// mistake rather than a reason to raise the ceiling.
export const MAX_EVENT_BYTES = 400;

const REQUIRED = ['objectId', 'milestoneId', 'status', 'documentHash', 'version'];

export function buildMilestoneEvent(fields) {
  const missing = REQUIRED.filter((key) => fields[key] === undefined);

  if (missing.length > 0) {
    throw new Error(`Milestone event is missing: ${missing.join(', ')}`);
  }

  if (!/^[0-9a-f]{64}$/.test(fields.documentHash)) {
    throw new Error('documentHash must be a 64-character lowercase SHA-256 hex string');
  }

  const event = {
    objectId: fields.objectId,
    milestoneId: fields.milestoneId,
    status: fields.status,
    documentHash: fields.documentHash,
    version: fields.version,
    timestamp: fields.timestamp ?? new Date().toISOString()
  };

  const size = Buffer.byteLength(JSON.stringify(event), 'utf8');

  if (size > MAX_EVENT_BYTES) {
    throw new Error(
      `Milestone event is ${size} bytes, over the ${MAX_EVENT_BYTES}-byte limit. ` +
        'Shorten the identifiers rather than raising the limit.'
    );
  }

  return event;
}

/**
 * Picks one milestone out of an object passport.
 *
 * The status comes from the passport rather than from the caller: the ledger
 * should record what the object record actually says, not what the script was
 * told to say.
 */
export function selectMilestone(passport, milestoneId) {
  const milestones = passport.milestones ?? [];
  const milestone = milestones.find((entry) => entry.milestoneId === milestoneId);

  if (!milestone) {
    const known = milestones.map((entry) => entry.milestoneId).join(', ') || 'none';
    throw new Error(`Milestone ${milestoneId} is not in the passport. Known milestones: ${known}`);
  }

  return milestone;
}
