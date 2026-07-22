// Types for Share feature
export interface ShareScope {
  repos?: string[]
  from?: string
  to?: string
  live?: boolean
}

export interface Share {
  id: string
  title: string
  description?: string
  scope: ShareScope
  token: string
  url: string
  expires_at?: string
  revoked: boolean
  created_at: string
  total_commits: number
  total_repos: number
}

export interface ShareCommit {
  sha: string
  message: string
  date: string
  category: string
  author_name: string
  files: Array<string | { path: string; changeType?: string; additions?: number; deletions?: number }>
}

export interface ShareRepo {
  repo_name: string
  commit_count: number
  total_commits: number
  has_more: boolean
  commits: ShareCommit[]
}

export interface ShareRepositorySummary {
  repo_name: string
  commit_count: number
  total_commits: number
}

export interface SharePagination {
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface ShareViewData {
  title: string
  description?: string
  username: string
  scope: ShareScope
  repositories: ShareRepositorySummary[]
  selected_repo: string | null
  repos: ShareRepo[]
  total_commits: number
  total_repos: number
  page: number
  limit: number
  pagination: SharePagination
}

export interface CreateShareParams {
  title: string
  description?: string
  repos?: string[]
  from?: string
  to?: string
  expires_in_days?: number
  live?: boolean
}

export interface CreateShareResponse {
  message: string
  id: string
  token: string
  url: string
  expires_at?: string
  total_commits: number
  total_repos: number
}

export interface SharesResponse {
  shares: Share[]
  pagination: SharePagination
}

export interface RevokeShareResponse {
  message: string
}

export interface ShareExport {
  blob: Blob
  message: string
  filename?: string
}
