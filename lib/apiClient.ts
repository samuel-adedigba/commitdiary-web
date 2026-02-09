import { supabase } from '/lib/supabaseClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Cache user data to avoid repeated auth calls
let cachedUser: any = null
let lastUserFetch = 0
const USER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getCachedUser() {
    const now = Date.now()

    // Return cached user if still valid
    if (cachedUser && (now - lastUserFetch) < USER_CACHE_TTL) {
        return cachedUser
    }

    // Use getSession() instead of getUser() - it's faster and cached by Supabase
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
        cachedUser = session.user
        lastUserFetch = now
    }

    return cachedUser
}

// Clear cache on auth state changes
supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        cachedUser = null
        lastUserFetch = 0
    }
})

export interface Commit {
    id: string
    sha: string
    repo_name: string
    author_name: string
    author_email: string | null
    date: string
    message: string
    category: string
    files: string[]
    components: string[]
    context_tags: string[]
}

export interface Metrics {
    total_commits: number
    by_category: Array<{ category: string; count: number }>
    top_components?: Array<{ component: string; count: number }>
}

export interface ApiKey {
    id: string
    name: string
    key?: string
    created_at: string
    last_used_at?: string
    revoked_at?: string
}

export interface Repository {
    id: string
    name: string
    remote: string | null
    created_at: string
    updated_at: string
    commit_count?: number
    last_sync?: string
}

export interface UserProfile {
    id: string
    email: string
    created_at: string
}

async function getAuthToken(): Promise<string | null> {
    // Force token refresh if expired to avoid 401 errors
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (!session) {
        return null
    }
    
    // Check if token is expired or about to expire (within 60 seconds)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
    const now = Date.now()
    const isExpiringSoon = expiresAt - now < 60000 // Less than 60 seconds remaining
    
    if (isExpiringSoon) {
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError || !newSession) {
            return null
        }
        return newSession.access_token
    }
    
    return session.access_token
}

export async function getCommits(params?: {
    from?: string
    to?: string
    limit?: number
    offset?: number
    category?: string
}): Promise<{ commits: Commit[]; total: number; limit: number; offset: number }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const user = await getCachedUser()
    if (!user) throw new Error('User not found')

    const query = new URLSearchParams({
        limit: String(params?.limit || 50),
        offset: String(params?.offset || 0),
        ...(params?.from && { from: params.from }),
        ...(params?.to && { to: params.to }),
        ...(params?.category && { category: params.category })
    })

    const url = `${API_URL}/v1/users/${user.id}/commits?${query}`

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch commits: ${response.statusText}`)
    }

    const data = await response.json()

    return data
}

export async function getRepoMetrics(
    repoId: string,
    params?: { period?: 'week' | 'month' | 'year'; start?: string }
): Promise<Metrics> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const query = new URLSearchParams({
        ...(params?.period && { period: params.period }),
        ...(params?.start && { start: params.start })
    })

    const response = await fetch(`${API_URL}/v1/repos/${repoId}/metrics?${query}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
    }

    return response.json()
}

export async function fetchApiKeys(): Promise<ApiKey[]> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/users/api-keys`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch API keys: ${response.statusText}`)
    }

    const data = await response.json()
    return data.keys
}

export async function generateApiKey(name: string): Promise<ApiKey> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/users/api-keys`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    })

    if (!response.ok) {
        throw new Error(`Failed to generate API key: ${response.statusText}`)
    }

    return response.json()
}

export async function revokeApiKey(keyId: string): Promise<void> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/users/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to revoke API key: ${response.statusText}`)
    }
}

export async function getUserProfile(): Promise<UserProfile> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/users/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`)
    }

    return response.json()
}

export async function getRepositories(): Promise<Repository[]> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const user = await getCachedUser()
    if (!user) throw new Error('User not found')

    // Fetch repos directly from Supabase with commit counts
    const { data, error } = await supabase
        .from('repos')
        .select('*, commits(count)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch repositories: ${error.message}`)
    }

    return (data || []).map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        remote: repo.remote,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        commit_count: repo.commits?.[0]?.count || 0
    }))
}

export async function getAllMetrics(timeRange: 'week' | 'month' | 'year' | 'all' = 'month'): Promise<{
    total_commits: number
    by_category: Array<{ category: string; count: number }>
    by_date: Array<{ date: string; count: number }>
    top_components: Array<{ component: string; count: number }>
    avg_commits_per_day: number
}> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const user = await getCachedUser()
    if (!user) throw new Error('User not found')

    // Calculate date range
    let startDate: Date
    const now = new Date()

    switch (timeRange) {
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
        case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
        case 'year':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
        default:
            startDate = new Date(0)
    }

    // Fetch all commits in range directly from Supabase
    const { data: commits, error } = await supabase
        .from('commits')
        .select('category, date, components')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false })

    if (error) {
        throw new Error(`Failed to fetch metrics: ${error.message}`)
    }

    const commitsList = commits || []

    // Calculate metrics
    const categoryMap: Record<string, number> = {}
    const dateMap: Record<string, number> = {}
    const componentMap: Record<string, number> = {}

    commitsList.forEach((commit: any) => {
        // Category stats
        const cat = commit.category || 'Other'
        categoryMap[cat] = (categoryMap[cat] || 0) + 1

        // Date stats (group by day)
        const dateKey = commit.date.split('T')[0]
        dateMap[dateKey] = (dateMap[dateKey] || 0) + 1

        // Component stats
        if (commit.components && Array.isArray(commit.components)) {
            commit.components.forEach((comp: string) => {
                componentMap[comp] = (componentMap[comp] || 0) + 1
            })
        }
    })

    const by_category = Object.entries(categoryMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)

    const by_date = Object.entries(dateMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

    const top_components = Object.entries(componentMap)
        .map(([component, count]) => ({ component, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

    // Calculate average commits per day
    const days = Object.keys(dateMap).length || 1
    const avg_commits_per_day = parseFloat((commitsList.length / days).toFixed(2))

    return {
        total_commits: commitsList.length,
        by_category,
        by_date,
        top_components,
        avg_commits_per_day
    }
}

export async function syncCommits(
    repoId: number,
    payload: any
): Promise<{ synced: number; last_synced_sha: string; server_timestamp: string }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/ingest/commits`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        throw new Error(`Failed to sync commits: ${response.statusText}`)
    }

    return response.json()
}

// ==================== SHARES API ====================

export async function createShare(params: {
    title: string
    description?: string
    repos?: string[]
    from?: string
    to?: string
    expires_in_days?: number
}): Promise<{
    id: string
    token: string
    url: string
    expires_at?: string
    total_commits: number
    total_repos: number
}> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/shares`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create share: ${response.statusText} - ${errorText}`)
    }

    return response.json()
}

export async function getShares(): Promise<{
    shares: Array<{
        id: string
        title: string
        description?: string
        scope: { repos?: string[]; from?: string; to?: string }
        token: string
        url: string
        expires_at?: string
        revoked: boolean
        created_at: string
        total_commits: number
        total_repos: number
    }>
}> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/shares`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch shares: ${response.statusText}`)
    }

    return response.json()
}

export async function revokeShare(shareId: string): Promise<{ message: string }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/shares/${shareId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to revoke share: ${response.statusText}`)
    }

    return response.json()
}

export async function getPublicShare(username: string, token: string, params?: {
    page?: number
    limit?: number
    repo?: string
}): Promise<{
    title: string
    description?: string
    username: string
    scope: { repos?: string[]; from?: string; to?: string }
    repos: Array<{
        repo_name: string
        repo_remote?: string
        commit_count: number
        total_commits?: number
        has_more?: boolean
        commits: Array<{
            sha: string
            message: string
            date: string
            category: string
            author_name: string
            files: Array<{ path: string; changeType?: string; additions?: number; deletions?: number }>
        }>
    }>
    total_commits: number
    total_repos: number
    page: number
    limit: number
}> {
    const query = new URLSearchParams({
        page: String(params?.page || 1),
        limit: String(params?.limit || 50),
        ...(params?.repo && { repo: params.repo })
    })

    const response = await fetch(`${API_URL}/s/${username}/${token}?${query}`)

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to fetch share: ${response.statusText}`)
    }

    return response.json()
}

export async function exportShare(shareId: string, format: 'md' | 'csv'): Promise<Blob> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/shares/${shareId}/export?format=${format}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to export share: ${response.statusText}`)
    }

    return response.blob()
}

// ==================== COMMIT REPORTS API ====================

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
    status: 'completed' | 'pending' | 'processing' | 'failed' | 'not_found'
    report?: CommitReport
    jobId?: string
    attempts?: number
    createdAt?: string
    errorMessage?: string
}

export interface RepositoryWithReports extends Repository {
    enable_reports: boolean
    backfill?: BackfillStatus | null
}

export interface BackfillCommitDetail {
    commitId: number
    sha: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    jobId: string | null
    error: string | null
}

export interface BackfillStatus {
    id?: number
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
    totalCommits: number
    completedCommits: number
    failedCommits: number
    commitDetails: BackfillCommitDetail[]
    errorMessage?: string | null
    createdAt?: string
    updatedAt?: string
}

export interface WebhookSettings {
    configured: boolean
    enabled?: boolean
    discord_webhook_url?: string
    webhook_secret?: string
    events?: string[]
    stats?: {
        last_delivery_at?: string
        last_success_at?: string
        last_failure_at?: string
        failure_count?: number
        total_deliveries?: number
    }
    created_at?: string
    updated_at?: string
}

export interface WebhookLog {
    id: number
    event_type: string
    success: boolean
    status_code?: number
    error_message?: string
    attempt: number
    created_at: string
}

export interface WebhookUpdatePayload {
    discord_webhook_url: string
    enabled?: boolean
    events?: string[]
}

/**
 * Get repositories with their report settings
 */
export async function getReposWithReportSettings(): Promise<RepositoryWithReports[]> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/repos/reports`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch repos: ${response.statusText}`)
    }

    const data = await response.json()
    return data.repos || []
}

/**
 * Toggle auto-report generation for a repository
 */
export async function toggleRepoReports(repoId: string, enabled: boolean): Promise<{ message: string; enabled: boolean; backfill?: BackfillStatus | null }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/repos/${repoId}/reports/toggle`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to toggle reports: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get backfill status for a repository
 */
export async function getBackfillStatus(repoId: string): Promise<{ backfill: BackfillStatus | null }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/repos/${repoId}/reports/backfill`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch backfill status: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Retry failed backfill commits
 */
export async function retryBackfill(repoId: string): Promise<{ message: string; backfill: BackfillStatus }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/repos/${repoId}/reports/backfill/retry`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to retry backfill: ${response.statusText}`)
    }

    return response.json()
}

/**
 * Get report for a specific commit
 */
export async function getCommitReport(commitId: string): Promise<ReportStatus> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/commits/${commitId}/report`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`)
    }

    const data = await response.json()
    
    return data
}

/**
 * Trigger report generation for a commit
 */
export async function triggerCommitReport(commitId: string): Promise<ReportStatus> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/commits/${commitId}/report`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to trigger report: ${response.statusText}`)
    }

    return response.json()
}

// Export API client
export const apiClient = {
    getUserProfile,
    getRepositories,
    getAllMetrics,
    getCommits,
    fetchApiKeys,
    generateApiKey,
    revokeApiKey,
    syncCommits,
    createShare,
    getShares,
    revokeShare,
    getPublicShare,
    exportShare,
    // Report APIs
    getReposWithReportSettings,
    toggleRepoReports,
    getCommitReport,
    triggerCommitReport,
    // Backfill APIs
    getBackfillStatus,
    retryBackfill,
    // Webhook APIs
    fetchWebhookSettings,
    updateWebhookSettings,
    testWebhook,
    deleteWebhookSettings,
    fetchWebhookLogs
}

/**
 * Get user's webhook settings
 */
export async function fetchWebhookSettings(): Promise<WebhookSettings> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/settings/webhooks`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch webhook settings')
    }

    return response.json()
}

/**
 * Update or create webhook settings
 */
export async function updateWebhookSettings(payload: WebhookUpdatePayload): Promise<{ message: string, settings: WebhookSettings }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/settings/webhooks`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update webhook settings')
    }

    return response.json()
}

/**
 * Test webhook delivery
 */
export async function testWebhook(): Promise<{ success: boolean, message?: string, error?: string, statusCode?: number }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/settings/webhooks/test`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok && response.status !== 500) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to test webhook')
    }

    return response.json()
}

/**
 * Delete webhook settings
 */
export async function deleteWebhookSettings(): Promise<{ message: string }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await fetch(`${API_URL}/v1/settings/webhooks`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete webhook settings')
    }

    return response.json()
}

/**
 * Fetch webhook delivery logs
 */
export async function fetchWebhookLogs(options?: { limit?: number, offset?: number }): Promise<{ logs: WebhookLog[], pagination: any }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())

    const response = await fetch(`${API_URL}/v1/settings/webhooks/logs?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch webhook logs')
    }

    return response.json()
}
