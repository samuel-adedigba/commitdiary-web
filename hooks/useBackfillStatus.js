"use client";

import { useEffect, useRef } from "react";
import { apiClient } from "/lib/apiClient";
import { isStalledBackfill } from "/lib/reports/backfillStatus";

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
  const terminalReposRef = useRef(new Set());
  const pollInFlightRef = useRef(false);

  useEffect(() => {
    if (!enabled || !repoIds || repoIds.length === 0) {
      if (!enabled) terminalReposRef.current.clear();
      return;
    }

    const poll = async () => {
      for (const repoId of repoIds) {
        if (terminalReposRef.current.has(repoId)) continue;
        const attempts = attemptsRef.current.get(repoId) || 0;
        if (attempts >= MAX_ATTEMPTS) {
          attemptsRef.current.delete(repoId);
          errorAttemptsRef.current.delete(repoId);
          terminalReposRef.current.add(repoId);
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
            isStalledBackfill(result.backfill) ||
            status === "completed" ||
            status === "failed" ||
            status === "partial"
          ) {
            attemptsRef.current.delete(repoId);
            errorAttemptsRef.current.delete(repoId);
            terminalReposRef.current.add(repoId);
            onTerminalState?.(repoId, { status });
          }
        } catch (_error) {
          const errorAttempts = (errorAttemptsRef.current.get(repoId) || 0) + 1;
          errorAttemptsRef.current.set(repoId, errorAttempts);
          if (errorAttempts >= MAX_ERROR_ATTEMPTS) {
            attemptsRef.current.delete(repoId);
            errorAttemptsRef.current.delete(repoId);
            terminalReposRef.current.add(repoId);
            onTerminalState?.(repoId, { reason: "error_attempts" });
          }
        }
      }

    };

    const interval = setInterval(() => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      void poll().finally(() => {
        pollInFlightRef.current = false;
      });
    }, intervalMs);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, intervalMs, onBackfillUpdate, onTerminalState, repoIds]);
}
