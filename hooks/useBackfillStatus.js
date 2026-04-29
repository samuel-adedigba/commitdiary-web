"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "/lib/apiClient";

const MAX_ATTEMPTS = 120;
const MAX_ERROR_ATTEMPTS = 10;

export function useBackfillStatus({
  repoIds,
  enabled = true,
  intervalMs = 5000,
  onBackfillUpdate,
  onTerminalState,
}) {
  const attemptsRef = useRef(new Map());
  const errorAttemptsRef = useRef(new Map());

  useEffect(() => {
    if (!enabled || !repoIds || repoIds.length === 0) {
      return;
    }

    const interval = setInterval(async () => {
      for (const repoId of repoIds) {
        const attempts = attemptsRef.current.get(repoId) || 0;
        if (attempts >= MAX_ATTEMPTS) {
          attemptsRef.current.delete(repoId);
          errorAttemptsRef.current.delete(repoId);
          onTerminalState?.(repoId, { reason: "max_attempts" });
          continue;
        }

        attemptsRef.current.set(repoId, attempts + 1);

        try {
          const result = await apiClient.getBackfillStatus(repoId);
          errorAttemptsRef.current.delete(repoId);
          onBackfillUpdate?.(repoId, result.backfill);

          const status = result.backfill?.status;
          if (
            !result.backfill ||
            status === "completed" ||
            status === "failed" ||
            status === "partial"
          ) {
            attemptsRef.current.delete(repoId);
            errorAttemptsRef.current.delete(repoId);
            onTerminalState?.(repoId, { status });
          }
        } catch (_error) {
          const errorAttempts = (errorAttemptsRef.current.get(repoId) || 0) + 1;
          errorAttemptsRef.current.set(repoId, errorAttempts);
          if (errorAttempts >= MAX_ERROR_ATTEMPTS) {
            attemptsRef.current.delete(repoId);
            errorAttemptsRef.current.delete(repoId);
            onTerminalState?.(repoId, { reason: "error_attempts" });
          }
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMs, onBackfillUpdate, onTerminalState, repoIds]);
}

