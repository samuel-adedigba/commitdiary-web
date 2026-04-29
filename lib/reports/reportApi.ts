import { apiClient } from '/lib/apiClient'
import { normalizeReportStatus } from '/lib/reports/normalizeReportStatus'
import type { ReportStatus } from '/lib/reports/types'

export async function getCommitReportStatus(commitId: string): Promise<ReportStatus> {
  const response = await apiClient.getCommitReport(commitId)
  return normalizeReportStatus(response)
}

export async function triggerCommitReportGeneration(commitId: string): Promise<ReportStatus> {
  const response = await apiClient.triggerCommitReport(commitId)
  return normalizeReportStatus(response)
}

