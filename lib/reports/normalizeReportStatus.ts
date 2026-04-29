import type { ReportStatus } from '/lib/reports/types'

export function normalizeReportStatus(payload: any): ReportStatus {
  return {
    ...payload,
    errorMessage: payload?.errorMessage ?? payload?.error_message ?? undefined
  }
}

