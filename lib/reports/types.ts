export type ReportLifecycleStatus =
  | 'completed'
  | 'pending'
  | 'processing'
  | 'failed'
  | 'not_found'

export interface CommitReport {
  id: number
  commit_id: number
  title: string
  summary: string
  changes: string[]
  rationale: string
  impact_and_tests: string
  next_steps: string[]
  tags: string
  provider_used: string
  generation_time_ms: number
  created_at: string
}

export interface ReportStatus {
  status: ReportLifecycleStatus
  report?: CommitReport
  jobId?: string
  attempts?: number
  createdAt?: string
  errorMessage?: string
}

