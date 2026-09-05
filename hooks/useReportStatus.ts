'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReportUpdate } from '/hooks/useRealtimeReports'
import { useReportRealtime } from '/hooks/useReportRealtime'
import type { ReportStatus } from '/lib/reports/types'
import {
  getCommitReportStatus,
  triggerCommitReportGeneration
} from '/lib/reports/reportApi'

type UseReportStatusState = {
  reportStatus: ReportStatus | null
  loading: boolean
  generating: boolean
  error: string | null
  timedOut: boolean
  realtimeStatus: 'connecting' | 'connected' | 'degraded' | 'error'
  refresh: () => Promise<void>
  generate: () => Promise<void>
}

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'not_found'])
const MAX_POLLING_MS = 3 * 60 * 1000
const REALTIME_GRACE_MS = 5000

function isTerminal(status?: string) {
  return status ? TERMINAL_STATUSES.has(status) : false
}

function normalizeRealtimeReport(update: ReportUpdate): ReportStatus | null {
  if (update.type === 'report_completed') {
    return {
      status: 'completed',
      report: update.data as any,
      errorMessage: undefined
    }
  }

  if (update.type === 'report_failed') {
    return {
      status: 'failed',
      errorMessage: (update.data as any)?.errorMessage ?? (update.data as any)?.error_message
    }
  }

  return null
}

export function useReportStatus(commitId?: number, enabled = false): UseReportStatusState {
  const [reportStatus, setReportStatus] = useState<ReportStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [openedAt, setOpenedAt] = useState<number | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCommitIdRef = useRef<number | undefined>(undefined)
  const requestSequenceRef = useRef(0)
  const requestInFlightRef = useRef(false)

  const handleRealtimeUpdate = useCallback((update: ReportUpdate) => {
    const normalized = normalizeRealtimeReport(update)
    if (!normalized) {
      return
    }

    // A terminal realtime event is newer than any outstanding poll response.
    requestSequenceRef.current += 1
    requestInFlightRef.current = false
    setReportStatus((prev) => ({
      ...(prev || {}),
      ...normalized
    }))
    setTimedOut(false)
  }, [])

  const { isConnected, status: realtimeStatus } = useReportRealtime(commitId, handleRealtimeUpdate)

  const fetchStatus = useCallback(async () => {
    if (!commitId || requestInFlightRef.current) {
      return
    }

    const requestSequence = ++requestSequenceRef.current
    requestInFlightRef.current = true
    setLoading(true)
    try {
      const status = await getCommitReportStatus(String(commitId))
      if (requestSequence !== requestSequenceRef.current) return
      setReportStatus(status)
      setError(null)
    } catch (err) {
      if (requestSequence !== requestSequenceRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to fetch report status')
    } finally {
      if (requestSequence === requestSequenceRef.current) {
        requestInFlightRef.current = false
        setLoading(false)
      }
    }
  }, [commitId])

  const generate = useCallback(async () => {
    if (!commitId) {
      return
    }

    setGenerating(true)
    try {
      const status = await triggerCommitReportGeneration(String(commitId))
      setReportStatus(status)
      setError(null)
      setTimedOut(false)
      setOpenedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }, [commitId])

  useEffect(() => {
    if (!enabled || !commitId) {
      requestSequenceRef.current += 1
      requestInFlightRef.current = false
      setReportStatus(null)
      setError(null)
      setTimedOut(false)
      setOpenedAt(null)
      return
    }

    if (lastCommitIdRef.current !== commitId) {
      requestSequenceRef.current += 1
      requestInFlightRef.current = false
      setReportStatus(null)
      setTimedOut(false)
      lastCommitIdRef.current = commitId
    }

    setOpenedAt(Date.now())
    fetchStatus()
  }, [enabled, commitId, fetchStatus])

  useEffect(() => {
    if (!enabled || !commitId || !openedAt) {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    if (isTerminal(reportStatus?.status)) {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
      return
    }

    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }

    let cancelled = false
    const schedulePoll = (delay: number) => {
      pollTimerRef.current = setTimeout(async () => {
        const age = Date.now() - openedAt
        if (age >= MAX_POLLING_MS) {
          pollTimerRef.current = null
          setTimedOut(true)
          return
        }
        await fetchStatus()
        if (!cancelled) schedulePoll(isConnected ? 30000 : 5000)
      }, delay)
    }
    schedulePoll(REALTIME_GRACE_MS)

    return () => {
      cancelled = true
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [enabled, commitId, openedAt, reportStatus?.status, isConnected, fetchStatus])

  return useMemo(() => ({
    reportStatus,
    loading,
    generating,
    error,
    timedOut,
    realtimeStatus,
    refresh: fetchStatus,
    generate
  }), [reportStatus, loading, generating, error, timedOut, realtimeStatus, fetchStatus, generate])
}
