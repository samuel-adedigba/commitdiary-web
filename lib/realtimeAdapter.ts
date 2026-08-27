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
    // Future: SSE/WebSocket implementation polls or connects to `${API_URL}/v1/events?stream=commits`
    // For now, no-op (polling fallback handled in useApiResource).
    onStatus?.("polling");
    return () => {};
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
    return () => {};
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
