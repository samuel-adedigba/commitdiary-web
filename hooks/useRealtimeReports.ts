'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '/lib/supabaseClient'
import { useAuth } from '/lib/auth-context'
import type { RealtimeChannel } from '@supabase/supabase-js'
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
    
    let reportsChannel: RealtimeChannel | null = null
    let jobsChannel: RealtimeChannel | null = null

    async function setupRealtimeSubscriptions() {
      try {
        // Subscribe to commit_reports table (INSERTs only - when report completes)
        reportsChannel = supabase
          .channel(`report-updates-${userId}-${commitId || 'all'}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'commit_reports',
              filter: commitId ? `commit_id=eq.${commitId}` : `user_id=eq.${userId}`
            },
            (payload) => {
              const update: ReportUpdate = {
                type: 'report_completed',
                commitId: (payload.new as any).commit_id,
                data: payload.new
              }

              setLastUpdate(new Date())
              setReportData(payload.new)
              
              if (onUpdateRef.current) {
                onUpdateRef.current(update)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsConnected(true)
              setStatus('connected')
              setReportsStatus('connected')
              setError(null)
              return
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setIsConnected(false)
              setStatus('error')
              setReportsStatus('error')
              const nextError = `Report channel subscription failed (${status})`
              setError(nextError)
              logError({
                title: 'Realtime Reports Subscription Error',
                message: nextError,
                severity: 'warning',
                metadata: { userId, commitId, channel: 'commit_reports', status }
              })
              return
            }

            setStatus('connecting')
            setReportsStatus('connecting')
          })

        // Subscribe to report_jobs table (UPDATEs - for status changes like failed)
        jobsChannel = supabase
          .channel(`job-updates-${userId}-${commitId || 'all'}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'report_jobs',
              filter: commitId ? `commit_id=eq.${commitId}` : `user_id=eq.${userId}`
            },
            (payload) => {
              const update: ReportUpdate = {
                type: payload.new?.status === 'failed' ? 'report_failed' : 'job_status_change',
                commitId: (payload.new as any).commit_id,
                data: payload.new
              }

              setLastUpdate(new Date())
              setJobStatus(payload.new)
              
              if (onUpdateRef.current) {
                onUpdateRef.current(update)
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setJobsStatus('connected')
              return
            }

            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              setStatus('degraded')
              setJobsStatus('error')
              const nextError = `Job status channel degraded (${status})`
              setError((prev) => prev ?? nextError)
              logError({
                title: 'Realtime Job Status Subscription Error',
                message: nextError,
                severity: 'warning',
                metadata: { userId, commitId, channel: 'report_jobs', status }
              })
            }
          })

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
          metadata: { userId, commitId }
        })
      }
    }

    setupRealtimeSubscriptions()

    // Cleanup subscriptions on unmount
    return () => {
      if (reportsChannel) {
        supabase.removeChannel(reportsChannel)
      }
      if (jobsChannel) {
        supabase.removeChannel(jobsChannel)
      }
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
