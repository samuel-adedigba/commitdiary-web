'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '/lib/auth-context'
import { subscribeToReports } from '/lib/realtimeAdapter'
import { logError } from '/lib/alerts/errorLogger'

export interface ReportUpdate {
  type: 'report_completed' | 'report_failed' | 'job_status_change'
  commitId: number
  data: Record<string, unknown>
}

export type RealtimeConnectionState = 'connecting' | 'connected' | 'degraded' | 'error'

export interface RealtimeReportsState {
  isConnected: boolean
  status: RealtimeConnectionState
  reportsStatus: RealtimeConnectionState
  jobsStatus: RealtimeConnectionState
  lastUpdate: Date | null
  reportData: Record<string, unknown> | null
  jobStatus: Record<string, unknown> | null
  error: string | null
}

/**
 * Hook for real-time report updates via Supabase subscriptions
 * Subscribes to:
 * - commit_reports table (INSERT) - when reports are generated
 * - report_jobs table (UPDATE) - when job status changes (pending -> failed)
 */
export function useRealtimeReports(commitId?: number, onUpdate?: (update: ReportUpdate) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState<RealtimeConnectionState>('connecting')
  const [reportsStatus, setReportsStatus] = useState<RealtimeConnectionState>('connecting')
  const [jobsStatus, setJobsStatus] = useState<RealtimeConnectionState>('connecting')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)
  const [jobStatus, setJobStatus] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const onUpdateRef = useRef(onUpdate)
  
  const { user } = useAuth()
  const userId = user?.id
  
  // Keep callback ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!userId) return // Wait for user ID

    setStatus('connecting')
    setReportsStatus('connecting')
    setJobsStatus('connecting')
    setError(null)

    let unsubscribe: (() => void) | null = null

    try {
      unsubscribe = subscribeToReports(
        userId,
        commitId ?? null,
        (event) => {
          const update: ReportUpdate = {
            type: event.type,
            commitId: (event.commitId as number) ?? commitId ?? 0,
            data: (event.report || event.jobStatus || {}) as Record<string, unknown>,
          }
          setLastUpdate(new Date())
          if (event.type === 'report_completed') setReportData(event.report || null)
          else setJobStatus(event.jobStatus || null)

          if (onUpdateRef.current) {
            onUpdateRef.current(update)
          }
        },
        (channelStatus) => {
          // Adapter funnels both channels; map to per-channel states
          if (channelStatus === 'SUBSCRIBED' || channelStatus === 'connected') {
            setIsConnected(true)
            setStatus('connected')
            setReportsStatus('connected')
            setJobsStatus('connected')
            setError(null)
          } else if (channelStatus === 'polling') {
            setIsConnected(false)
            setStatus('degraded')
            setReportsStatus('degraded')
            setJobsStatus('degraded')
          } else if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT') {
            setIsConnected(false)
            setStatus('error')
            setError(`Realtime degraded (${channelStatus}) — falling back to polling`)
            logError({
              title: 'Realtime Reports Subscription Error',
              message: `Realtime degraded (${channelStatus})`,
              severity: 'warning',
              metadata: { userId, commitId, channelStatus },
            })
          }
        },
      )
    } catch (error) {
      setIsConnected(false)
      setStatus('error')
      setReportsStatus('error')
      setJobsStatus('error')
      const nextError = error instanceof Error ? error.message : 'Failed to setup realtime subscriptions'
      setError(nextError)
      logError({
        title: 'Realtime Setup Error',
        message: nextError,
        severity: 'warning',
        metadata: { userId, commitId },
      })
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [userId, commitId]) // Only depend on userId and commitId

  return { 
    isConnected, 
    status,
    reportsStatus,
    jobsStatus,
    lastUpdate, 
    reportData, 
    jobStatus,
    error
  } satisfies RealtimeReportsState
}
