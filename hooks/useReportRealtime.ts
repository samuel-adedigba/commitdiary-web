'use client'

import { useCallback, useMemo } from 'react'
import { useRealtimeReports, type ReportUpdate } from '/hooks/useRealtimeReports'

export function useReportRealtime(commitId?: number, onUpdate?: (update: ReportUpdate) => void) {
  const handleUpdate = useCallback((update: ReportUpdate) => {
    onUpdate?.(update)
  }, [onUpdate])

  const realtime = useRealtimeReports(commitId, handleUpdate)

  return useMemo(() => ({
    ...realtime
  }), [realtime])
}

