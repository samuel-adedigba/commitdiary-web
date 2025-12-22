// Types for Share feature
export interface ShareScope {
  repos?: string[]
  from?: string
  to?: string
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
  files: Array<{ path: string; changeType?: string; additions?: number; deletions?: number }>
}

export interface ShareRepo {
  repo_name: string
  repo_remote?: string
  commit_count: number
  total_commits?: number
  has_more?: boolean
  commits: ShareCommit[]
}

export interface ShareViewData {
  title: string
  description?: string
  username: string
  scope: ShareScope
  repos: ShareRepo[]
  total_commits: number
  total_repos: number
  page: number
  limit: number
}

export interface CreateShareParams {
  title: string
  description?: string
  repos?: string[]
  from?: string
  to?: string
  expires_in_days?: number
}

export interface CreateShareResponse {
  id: string
  token: string
  url: string
  expires_at?: string
  total_commits: number
  total_repos: number
}
