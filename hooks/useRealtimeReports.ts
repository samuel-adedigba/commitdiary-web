'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '/lib/supabaseClient'
import { useAuth } from '/lib/auth-context'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface ReportUpdate {
  type: 'report_completed' | 'report_failed' | 'job_status_change'
  commitId: number
  data: any
}

/**
 * Hook for real-time report updates via Supabase subscriptions
 * Subscribes to:
 * - commit_reports table (INSERT) - when reports are generated
 * - report_jobs table (UPDATE) - when job status changes (pending -> failed)
 */
export function useRealtimeReports(commitId?: number, onUpdate?: (update: ReportUpdate) => void) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [jobStatus, setJobStatus] = useState<any>(null)
  const onUpdateRef = useRef(onUpdate)
  
  const { user } = useAuth()
  const userId = user?.id
  
  // Keep callback ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!userId) return // Wait for user ID
    
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
            setIsConnected(status === 'SUBSCRIBED')
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
          })

      } catch (error) {
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
    lastUpdate, 
    reportData, 
    jobStatus 
  }
}
