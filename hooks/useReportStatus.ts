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
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCommitIdRef = useRef<number | undefined>(undefined)

  const handleRealtimeUpdate = useCallback((update: ReportUpdate) => {
    const normalized = normalizeRealtimeReport(update)
    if (!normalized) {
      return
    }

    setReportStatus((prev) => ({
      ...(prev || {}),
      ...normalized
    }))
    setTimedOut(false)
  }, [])

  const { isConnected, status: realtimeStatus } = useReportRealtime(commitId, handleRealtimeUpdate)

  const fetchStatus = useCallback(async () => {
    if (!commitId) {
      return
    }

    setLoading(true)
    try {
      const status = await getCommitReportStatus(String(commitId))
      setReportStatus(status)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch report status')
    } finally {
      setLoading(false)
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
      setReportStatus(null)
      setError(null)
      setTimedOut(false)
      setOpenedAt(null)
      return
    }

    if (lastCommitIdRef.current !== commitId) {
      setReportStatus(null)
      setTimedOut(false)
      lastCommitIdRef.current = commitId
    }

    setOpenedAt(Date.now())
    fetchStatus()
  }, [enabled, commitId, fetchStatus])

  useEffect(() => {
    if (!enabled || !commitId || !openedAt) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    if (isTerminal(reportStatus?.status)) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    const graceTimer = setTimeout(() => {
      pollIntervalRef.current = setInterval(() => {
        const age = Date.now() - openedAt
        if (age >= MAX_POLLING_MS) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          setTimedOut(true)
          return
        }
        fetchStatus()
      }, isConnected ? 30000 : 5000)
    }, REALTIME_GRACE_MS)

    return () => {
      clearTimeout(graceTimer)
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
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
