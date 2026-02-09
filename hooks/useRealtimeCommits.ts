'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '/lib/supabaseClient'
import { useAuth } from '/lib/auth-context'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface CommitUpdate {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  commit: Record<string, unknown>
}

/**
 * Hook for real-time commit updates via Supabase subscriptions
 * Automatically subscribes to commit changes for the authenticated user
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
    
    let channel: RealtimeChannel | null = null

    async function setupRealtimeSubscription() {
      try {
        // Create channel for commits table
        channel = supabase
          .channel('commits-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'commits',
              filter: `user_id=eq.${userId}` // Only subscribe to current user's commits
            },
            (payload) => {
              const update: CommitUpdate = {
                type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                commit: payload.new || payload.old
              }

              setLastUpdate(new Date())
              
              // Update commits array based on event type
              if (payload.eventType === 'INSERT' && payload.new) {
                setCommits(prev => [payload.new as any, ...prev])
              } else if (payload.eventType === 'UPDATE' && payload.new) {
                setCommits(prev => prev.map(c => c.id === (payload.new as any).id ? payload.new as any : c))
              } else if (payload.eventType === 'DELETE' && payload.old) {
                setCommits(prev => prev.filter(c => c.id !== (payload.old as any).id))
              }
              
              // Call the callback if provided
              if (onUpdateRef.current) {
                onUpdateRef.current(update)
              }
            }
          )
          .subscribe((status) => {
            setIsConnected(status === 'SUBSCRIBED')
          })

      } catch (error) {
      }
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId]) // Only depend on userId

  return { commits, isConnected, lastUpdate }
}
