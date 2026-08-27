/**
 * Realtime / event adapter — API-owned event contract.
 * Today delegates to Supabase Realtime (postgres_changes) behind a stable interface;
 * a VPS implementation can later use API-managed WebSocket/SSE + LISTEN/NOTIFY + polling
 * fallback without changing consumer code.
 *
 * Contract: realtime messages are notifications, not source of truth.
 * Consumers must refetch authoritative API data after receiving an event.
 */
"use client";

import { supabase } from "./supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";
export type RealtimeProvider = "supabase" | "polling" | "sse" | "websocket";

export type CommitEvent = { type: RealtimeEventType; commit: Record<string, unknown> };
export type ReportEvent = {
  type: "report_completed" | "report_failed" | "job_status_change";
  commitId?: number | string;
  report?: Record<string, unknown>;
  jobStatus?: Record<string, unknown>;
};

function getRealtimeProvider(): RealtimeProvider {
  const p = (process.env.NEXT_PUBLIC_REALTIME_PROVIDER || "supabase").toLowerCase();
  if (p === "polling" || p === "sse" || p === "websocket") return p as RealtimeProvider;
  return "supabase";
}

export function getRealtimeConfig() {
  return { provider: getRealtimeProvider() };
}

/**
 * Subscribe to commit changes for a user.
 * Returns unsubscribe function.
 */
export function subscribeToCommits(
  userId: string,
  onEvent: (event: CommitEvent) => void,
  onStatus?: (status: string) => void,
): () => void {
  const provider = getRealtimeProvider();
  if (provider !== "supabase") {
    // Polling fallback — authoritative refetch via API, not raw postgres_changes
    // Polls /v1/users/:userId/commits?limit=5 and diffs by id to emit INSERT/UPDATE
    onStatus?.("polling");
    let lastIds = new Set<string | number>();
    let initialized = false;
    const poll = async () => {
      try {
        const res = await fetch(`/v1/users/${encodeURIComponent(userId)}/commits?limit=5&offset=0`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const commits: any[] = data?.commits || [];
        if (!initialized) {
          commits.forEach((c) => lastIds.add(c.id));
          initialized = true;
          return;
        }
        for (const c of commits) {
          if (!lastIds.has(c.id)) {
            lastIds.add(c.id);
            onEvent({ type: "INSERT", commit: c });
          }
        }
        // Simple LRU cap
        if (lastIds.size > 100) {
          const arr = Array.from(lastIds);
          lastIds = new Set(arr.slice(-100));
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 15000);
    // Also poll on visibility change (user returns to tab)
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisible);
    };
  }

  let channel: RealtimeChannel | null = null;
  try {
    channel = supabase
      .channel("commits-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commits", filter: `user_id=eq.${userId}` },
        (payload) => {
          const event: CommitEvent = {
            type: payload.eventType as RealtimeEventType,
            commit: (payload.new || payload.old) as Record<string, unknown>,
          };
          onEvent(event);
        },
      )
      .subscribe((status) => onStatus?.(status));
  } catch {}

  return () => {
    if (channel) supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to report/job changes.
 */
export function subscribeToReports(
  userId: string,
  commitId: string | number | null,
  onEvent: (event: ReportEvent) => void,
  onStatus?: (status: string) => void,
): () => void {
  const provider = getRealtimeProvider();
  if (provider !== "supabase") {
    onStatus?.("polling");
    // Polling fallback: poll report/job endpoints and emit when status changes
    // For single commitId: poll /v1/commits/:id/report; for all: poll /v1/jobs/recovery or per-commit
    let lastReportId: string | number | null = null;
    let lastJobStatus: string | null = null;
    const poll = async () => {
      try {
        if (commitId) {
          const res = await fetch(`/v1/commits/${encodeURIComponent(String(commitId))}/report`, { cache: "no-store" });
          if (!res.ok) return;
          const data = await res.json().catch(() => null);
          // Report completed: data.report or data.id indicates report exists
          const report = data?.report || data;
          if (report?.id && report.id !== lastReportId) {
            lastReportId = report.id;
            onEvent({ type: "report_completed", commitId, report });
          }
          // Job status: data.job or data.status
          const job = data?.job;
          if (job?.status && job.status !== lastJobStatus) {
            lastJobStatus = job.status;
            if (job.status === "failed") onEvent({ type: "report_failed", commitId, jobStatus: job });
            else onEvent({ type: "job_status_change", commitId, jobStatus: job });
          }
        } else {
          // For "all" — poll recent jobs via /v1/repos/reports or similar; lightweight no-op if not available
          // Fallback: no polling for all when commitId is null to avoid excessive requests
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 15000);
    const onVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") poll();
    };
    if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisible);
    };
  }

  let reportChannel: RealtimeChannel | null = null;
  let jobChannel: RealtimeChannel | null = null;

  try {
    const filter = commitId ? `commit_id=eq.${commitId}` : `user_id=eq.${userId}`;
    reportChannel = supabase
      .channel(`report-updates-${userId}-${commitId || "all"}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "commit_reports", filter }, (payload) => {
        onEvent({ type: "report_completed", commitId: (payload.new as any)?.commit_id, report: payload.new as Record<string, unknown> });
      })
      .subscribe((s) => onStatus?.(s));

    jobChannel = supabase
      .channel(`job-updates-${userId}-${commitId || "all"}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "report_jobs", filter: `user_id=eq.${userId}` }, (payload) => {
        const next = payload.new as any;
        const prev = payload.old as any;
        if (next?.status === "failed") onEvent({ type: "report_failed", commitId: next?.commit_id, jobStatus: next });
        else if (prev?.status !== next?.status) onEvent({ type: "job_status_change", commitId: next?.commit_id, jobStatus: next });
      })
      .subscribe((s) => onStatus?.(s));
  } catch {}

  return () => {
    if (reportChannel) supabase.removeChannel(reportChannel);
    if (jobChannel) supabase.removeChannel(jobChannel);
  };
}
