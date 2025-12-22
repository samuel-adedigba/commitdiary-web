'use client'

import { useEffect, useState } from 'react'
import { supabase } from '/lib/supabaseClient'
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

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    async function setupRealtimeSubscription() {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          console.log('[Realtime] No user authenticated, skipping subscription')
          return
        }

        console.log('[Realtime] Setting up subscription for user:', user.id)

        // Create channel for commits table
        channel = supabase
          .channel('commits-changes')
          .on(
            'postgres_changes',
            {
              event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
              schema: 'public',
              table: 'commits',
              filter: `user_id=eq.${user.id}` // Only subscribe to current user's commits
            },
            (payload) => {
              console.log('[Realtime] Commit change detected:', payload.eventType, payload.new)
              
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
              if (onUpdate) {
                onUpdate(update)
              }
            }
          )
          .subscribe((status) => {
            console.log('[Realtime] Subscription status:', status)
            setIsConnected(status === 'SUBSCRIBED')
          })

      } catch (error) {
        console.error('[Realtime] Error setting up subscription:', error)
      }
    }

    setupRealtimeSubscription()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        console.log('[Realtime] Cleaning up subscription')
        supabase.removeChannel(channel)
      }
    }
  }, [onUpdate])

  return { commits, isConnected, lastUpdate }
}
