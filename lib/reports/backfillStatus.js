const ACTIVE_BACKFILL_STATUSES = new Set(["processing", "pending"]);
const STALLED_BACKFILL_ESTIMATES = new Set(["queued", "recovery_due"]);

export function isActiveBackfill(backfill) {
  if (!backfill || !ACTIVE_BACKFILL_STATUSES.has(backfill.status)) {
    return false;
  }

  return !STALLED_BACKFILL_ESTIMATES.has(backfill.estimatedState);
}

export function isStalledBackfill(backfill) {
  return (
    backfill &&
    ACTIVE_BACKFILL_STATUSES.has(backfill.status) &&
    STALLED_BACKFILL_ESTIMATES.has(backfill.estimatedState)
  );
}
