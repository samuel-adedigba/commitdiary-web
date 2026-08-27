'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '/lib/auth-context'
import { subscribeToCommits } from '/lib/realtimeAdapter'

export interface CommitUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  commit: Record<string, unknown>
}

/**
 * Hook for real-time commit updates — via API-owned event adapter.
 * Realtime notifications trigger an authoritative API refetch; the hook
 * maintains a local optimistic view and degrades to polling when realtime
 * is unavailable. The adapter currently delegates to Supabase Realtime;
 * future providers (WebSocket/SSE + LISTEN/NOTIFY) require no consumer change.
 */
export function useRealtimeCommits(onUpdate?: (update: CommitUpdate) => void) {
  const [commits, setCommits] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const onUpdateRef = useRef(onUpdate)
  
  const { user } = useAuth()
  const userId = user?.id
  
  // Keep callback ref up to date
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!userId) return // Wait for user ID

    const unsubscribe = subscribeToCommits(
      userId,
      (event) => {
        const update: CommitUpdate = { type: event.type, commit: event.commit }
        setLastUpdate(new Date())

        // Update commits array based on event type (optimistic)
        if (event.type === 'INSERT' && event.commit) {
          setCommits(prev => [event.commit as any, ...prev])
        } else if (event.type === 'UPDATE' && event.commit) {
          setCommits(prev => prev.map(c => c.id === (event.commit as any).id ? event.commit as any : c))
        } else if (event.type === 'DELETE' && event.commit) {
          setCommits(prev => prev.filter(c => c.id !== (event.commit as any).id))
        }

        if (onUpdateRef.current) {
          onUpdateRef.current(update)
        }
      },
      (status) => {
        setIsConnected(status === 'SUBSCRIBED' || status === 'connected')
      },
    )

    return () => unsubscribe()
  }, [userId]) // Only depend on userId

  return { commits, isConnected, lastUpdate }
}
