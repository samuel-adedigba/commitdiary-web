import type {
    CreateShareParams,
    CreateShareResponse,
    RevokeShareResponse,
    ShareExport,
    SharesResponse,
    ShareViewData,
} from '../src/types/share'
import { httpRequest } from './httpClient'
import type { HttpResponse } from './httpClient'

const API_URL = typeof window === 'undefined' ? (process.env.API_URL || '') : ''

// Cache user data to avoid repeated auth calls
let cachedUser: any = null
let lastUserFetch = 0
let inFlightUserFetch: Promise<any> | null = null
const USER_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const COMMITS_DEDUPE_WINDOW_MS = 5000
const REPOS_REPORTS_DEDUPE_WINDOW_MS = 5000
const SHARE_DEDUPE_WINDOW_MS = 2000
const inFlightCommitsRequests = new Map<string, Promise<{ commits: Commit[]; total: number; limit: number; offset: number }>>()
const recentCommitsResponses = new Map<string, { ts: number; data: { commits: Commit[]; total: number; limit: number; offset: number } }>()
let inFlightReposReportsRequest: Promise<RepositoryWithReports[]> | null = null
let recentReposReportsResponse: { ts: number; data: RepositoryWithReports[] } | null = null
const inFlightShareListRequests = new Map<string, Promise<SharesResponse>>()
const recentShareListResponses = new Map<string, { ts: number; data: SharesResponse }>()
const inFlightPublicShareRequests = new Map<string, Promise<ShareViewData>>()
const recentPublicShareResponses = new Map<string, { ts: number; data: ShareViewData }>()

export class ApiError extends Error {
    status: number
    code?: string

    constructor(message: string, status: number, code?: string) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.code = code
    }
}

async function getApiError(response: HttpResponse, fallback: string): Promise<ApiError> {
    const payload = await response.json<Record<string, unknown> | null>().catch(() => null)
    const message = typeof payload?.error === 'string'
        ? payload.error
        : typeof payload?.message === 'string'
            ? payload.message
            : fallback
    return new ApiError(message, response.status, payload?.code)
}

function clearCommitsCache() {
    recentCommitsResponses.clear()
}

function clearReposReportsCache() {
    recentReposReportsResponse = null
}

function clearShareListCache() {
    recentShareListResponses.clear()
}

async function getCachedUser() {
    const now = Date.now()

    // Return cached user if still valid
    if (cachedUser && (now - lastUserFetch) < USER_CACHE_TTL) {
        return cachedUser
    }

    if (inFlightUserFetch) return inFlightUserFetch

    inFlightUserFetch = (async () => {
        const response = await httpRequest('/api/auth/user', { cache: 'no-store' })
        if (response.ok) {
            const payload = await response.json<{ user?: unknown }>()
            cachedUser = payload.user ?? null
            lastUserFetch = Date.now()
        }
        return cachedUser
    })()

    try {
        return await inFlightUserFetch
    } finally {
        inFlightUserFetch = null
    }
}

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
    role: 'user' | 'admin'
    created_at: string
}

export interface AdminOverview {
    users: { total: number; admins: number; new_last_30_days: number }
    commits: { total: number }
    reports: { created_last_30_days: number }
    subscriptions: { active: number }
    payments: {
        transaction_count: number
        gross_amount_minor: string
        refunded_amount_minor: string
        disputed_amount_minor: string
    }
    generated_at: string
}

export interface AdminUser {
    id: string
    email: string
    username: string | null
    role: 'user' | 'admin'
    created_at: string
    counts: { repos: number; commits: number; reportJobs: number }
    subscription: {
        provider: string | null
        plan_code: string | null
        cadence: string
        status: string | null
        current_period_start: string | null
        current_period_end: string | null
        grace_period_end: string | null
        cancel_at_period_end: boolean | null
        provider_updated_at: string | null
    } | null
}

export interface AdminPayment {
    provider_transaction_id: string
    provider: string
    status: string
    currency_code: string
    amount_minor: string | null
    refunded_amount_minor: string
    disputed_amount_minor: string
    provider_created_at: string | null
    provider_updated_at: string | null
    created_at: string
    user: { id: string; email: string | null } | null
}

export interface AdminActivityItem {
    id: string
    source: string
    action: string
    occurred_at: string
    user: { id: string; email: string | null } | null
    actor: { id: string; email: string | null } | null
    details: Record<string, unknown> | null
}

export interface AdminPage<T> {
    items: T[]
    pagination: { total?: number; limit: number; offset: number; has_more: boolean }
}

export interface AdminListParams {
    limit?: number
    offset?: number
    user_id?: string
    search?: string
    status?: string
    role?: 'user' | 'admin'
    from?: string
    to?: string
}

async function getAdminResource<T>(path: string): Promise<T> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')
    const response = await httpRequest(`${API_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
    })
    if (!response.ok) throw await getApiError(response, 'Could not load admin data')
    return response.json<T>()
}

function adminQuery(params?: AdminListParams): string {
    const query = new URLSearchParams()
    if (params?.limit !== undefined) query.set('limit', String(params.limit))
    if (params?.offset !== undefined) query.set('offset', String(params.offset))
    for (const key of ['user_id', 'search', 'status', 'role', 'from', 'to'] as const) {
        const value = params?.[key]
        if (value) query.set(key, value)
    }
    const serialized = query.toString()
    return serialized ? `?${serialized}` : ''
}

export const getAdminOverview = (): Promise<AdminOverview> => getAdminResource('/v1/admin/overview')
export const getAdminUsers = (params?: AdminListParams): Promise<AdminPage<AdminUser>> => getAdminResource(`/v1/admin/users${adminQuery(params)}`)
export const getAdminPayments = (params?: AdminListParams): Promise<AdminPage<AdminPayment>> => getAdminResource(`/v1/admin/payments${adminQuery(params)}`)
export const getAdminActivity = (params?: AdminListParams): Promise<AdminPage<AdminActivityItem>> => getAdminResource(`/v1/admin/activity${adminQuery(params)}`)

async function getAuthToken(): Promise<string | null> {
    const user = await getCachedUser()
    return user ? 'cookie-authenticated' : null
}

export async function getCommits(params?: {
    from?: string
    to?: string
    limit?: number
    offset?: number
    category?: string
    search?: string
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
        ...(params?.category && { category: params.category }),
        ...(params?.search && { search: params.search })
    })

    const url = `${API_URL}/v1/users/${user.id}/commits?${query}`
    const requestKey = `${user.id}:${query.toString()}`
    const now = Date.now()
    const recent = recentCommitsResponses.get(requestKey)

    if (recent && (now - recent.ts) < COMMITS_DEDUPE_WINDOW_MS) {
        return recent.data
    }

    const inFlight = inFlightCommitsRequests.get(requestKey)
    if (inFlight) {
        return inFlight
    }

    const requestPromise = (async () => {
        const response = await httpRequest(url, {
            cache: 'no-store',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch commits: ${response.statusText}`)
        }

        const data = await response.json<{ commits?: Commit[]; total?: number; limit?: number; offset?: number }>()
        const normalized = {
            commits: data?.commits || [],
            total: data?.total || 0,
            limit: data?.limit || Number(params?.limit || 50),
            offset: data?.offset || Number(params?.offset || 0),
        }
        recentCommitsResponses.set(requestKey, { ts: Date.now(), data: normalized })
        return normalized
    })()

    inFlightCommitsRequests.set(requestKey, requestPromise)
    try {
        return await requestPromise
    } finally {
        inFlightCommitsRequests.delete(requestKey)
    }
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

    const response = await httpRequest(`${API_URL}/v1/repos/${repoId}/metrics?${query}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
    }

    return response.json<Metrics>()
}

export async function fetchApiKeys(): Promise<ApiKey[]> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/users/api-keys`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch API keys: ${response.statusText}`)
    }

    const data = await response.json<{ keys?: ApiKey[] }>()
    return data.keys
}

export async function generateApiKey(name: string): Promise<ApiKey> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/users/api-keys`, {
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

    return response.json<ApiKey>()
}

export async function revokeApiKey(keyId: string): Promise<void> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/users/api-keys/${keyId}`, {
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

    const response = await httpRequest(`${API_URL}/v1/users/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`)
    }

    return response.json<UserProfile>()
}

export async function getRepositories(): Promise<Repository[]> {
    const repos = await getReposWithReportSettings()
    return repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        remote: repo.remote,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        commit_count: repo.commit_count || 0
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

    const response = await httpRequest(`${API_URL}/v1/users/${user.id}/commits?${new URLSearchParams({
        from: startDate.toISOString(),
        limit: '500',
        offset: '0',
    })}`, {
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
    }

    const payload = await response.json<{ commits?: Array<{ category?: string; date: string; components?: string[] }> }>()
    const commitsList = payload.commits || []

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

    const response = await httpRequest(`${API_URL}/v1/ingest/commits`, {
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

    return response.json<{ synced: number; last_synced_sha: string; server_timestamp: string }>()
}

// ==================== SHARES API ====================

export async function createShare(params: CreateShareParams): Promise<CreateShareResponse> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/shares`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })

    if (!response.ok) {
        throw await getApiError(response, 'We could not create the share. Try again.')
    }

    const result = await response.json<CreateShareResponse>()
    clearShareListCache()
    return result
}

export async function getShares(params?: { page?: number; limit?: number }): Promise<SharesResponse> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const query = new URLSearchParams({
        page: String(params?.page ?? 1),
        limit: String(params?.limit ?? 10),
    })
    const requestKey = query.toString()
    const recent = recentShareListResponses.get(requestKey)
    if (recent && Date.now() - recent.ts < SHARE_DEDUPE_WINDOW_MS) return recent.data
    const inFlight = inFlightShareListRequests.get(requestKey)
    if (inFlight) return inFlight

    const requestPromise = (async () => {
        const response = await httpRequest(`${API_URL}/v1/shares?${query}`, {
            cache: 'no-store',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        if (!response.ok) {
            throw await getApiError(response, 'We could not load your shares. Try again.')
        }

        const data = await response.json<SharesResponse>()
        recentShareListResponses.set(requestKey, { ts: Date.now(), data })
        return data
    })()

    inFlightShareListRequests.set(requestKey, requestPromise)
    try {
        return await requestPromise
    } finally {
        inFlightShareListRequests.delete(requestKey)
    }
}

export async function revokeShare(shareId: string): Promise<RevokeShareResponse> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/shares/${encodeURIComponent(shareId)}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw await getApiError(response, 'We could not revoke the share. Try again.')
    }

    const result = await response.json<RevokeShareResponse>()
    clearShareListCache()
    return result
}

export async function getPublicShare(username: string, token: string, params?: {
    page?: number
    limit?: number
    repo?: string
    includeAllRepos?: boolean
}): Promise<ShareViewData> {
    const query = new URLSearchParams({
        page: String(params?.page ?? 1),
        limit: String(params?.limit ?? 20),
        ...(params?.repo && { repo: params.repo }),
        ...(params?.includeAllRepos && { include_all_repos: '1' })
    })
    const requestKey = `${username}:${token}:${query}`
    const recent = recentPublicShareResponses.get(requestKey)
    if (recent && Date.now() - recent.ts < SHARE_DEDUPE_WINDOW_MS) return recent.data
    const inFlight = inFlightPublicShareRequests.get(requestKey)
    if (inFlight) return inFlight

    const requestPromise = (async () => {
        const response = await httpRequest(
            `${API_URL}/v1/public/shares/${encodeURIComponent(username)}/${encodeURIComponent(token)}?${query}`,
            { cache: 'no-store' },
        )

        if (!response.ok) {
            throw await getApiError(response, 'We could not load this share. Try again.')
        }

        const data = await response.json<ShareViewData>()
        recentPublicShareResponses.set(requestKey, { ts: Date.now(), data })
        return data
    })()

    inFlightPublicShareRequests.set(requestKey, requestPromise)
    try {
        return await requestPromise
    } finally {
        inFlightPublicShareRequests.delete(requestKey)
    }
}

export async function exportShare(shareId: string, format: 'md' | 'csv'): Promise<ShareExport> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/shares/${encodeURIComponent(shareId)}/export?format=${format}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        responseType: 'blob',
    })

    if (!response.ok) {
        throw await getApiError(response, 'We could not export the share. Try again.')
    }

    const disposition = response.headers.get('Content-Disposition')
    const filename = disposition?.match(/filename="([^"]+)"/i)?.[1]
    return {
        blob: await response.blob(),
        message: response.headers.get('X-CommitDiary-Message') || 'Export downloaded successfully.',
        ...(filename ? { filename } : {}),
    }
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

function normalizeReportStatus(payload: any): ReportStatus {
    return {
        ...payload,
        errorMessage: payload?.errorMessage ?? payload?.error_message ?? undefined
    }
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
    discord_webhook_url?: string
    enabled?: boolean
    events?: string[]
}

/**
 * Get repositories with their report settings
 */
export async function getReposWithReportSettings(): Promise<RepositoryWithReports[]> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const now = Date.now()
    if (recentReposReportsResponse && (now - recentReposReportsResponse.ts) < REPOS_REPORTS_DEDUPE_WINDOW_MS) {
        return recentReposReportsResponse.data
    }

    if (inFlightReposReportsRequest) {
        return inFlightReposReportsRequest
    }

    inFlightReposReportsRequest = (async () => {
        const response = await httpRequest(`${API_URL}/v1/repos/reports`, {
            cache: 'no-store',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        if (!response.ok) {
            throw await getApiError(response, 'We could not load your repositories. Try again.')
        }

        const data = await response.json<{ repos?: RepositoryWithReports[] }>()
        const repos = data.repos || []
        recentReposReportsResponse = { ts: Date.now(), data: repos }
        return repos
    })()

    try {
        return await inFlightReposReportsRequest
    } finally {
        inFlightReposReportsRequest = null
    }
}

/**
 * Toggle auto-report generation for a repository
 */
export async function toggleRepoReports(repoId: string, enabled: boolean): Promise<{ message: string; enabled: boolean; backfill?: BackfillStatus | null }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/repos/${repoId}/reports/toggle`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
    })

    if (!response.ok) {
        const errorData = await response.json<{ error?: string }>().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to toggle reports: ${response.statusText}`)
    }

    clearReposReportsCache()
    return response.json<{ message: string; enabled: boolean; backfill?: BackfillStatus | null }>()
}

/**
 * Get pending jobs count for a repository
 */
export async function getPendingJobsCount(repoId: string): Promise<{ pendingCount: number; failedCount: number; totalJobs: number }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/repos/${repoId}/jobs/pending`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to get pending jobs: ${response.statusText}`)
    }

    return response.json<{ pendingCount: number; failedCount: number; totalJobs: number }>()
}

/**
 * Trigger manual job recovery
 */
export async function recoverJobs(): Promise<{ success: boolean; results: { recovered: number; failed: number; errors: string[] } }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/jobs/recover`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to recover jobs: ${response.statusText}`)
    }

    clearReposReportsCache()
    return response.json<{ success: boolean; results: { recovered: number; failed: number; errors: string[] } }>()
}

/**
 * Get system health and job statistics
 */
export async function getSystemHealth(): Promise<{ status: string; timestamp: string; statistics: { pendingJobs: number; failedJobs: number; activeBackfills: number } }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/system/health`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to get system health: ${response.statusText}`)
    }

    return response.json<{ status: string; timestamp: string; statistics: { pendingJobs: number; failedJobs: number; activeBackfills: number } }>()
}
export async function getBackfillStatus(repoId: string): Promise<{ backfill: BackfillStatus | null }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/repos/${repoId}/reports/backfill`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch backfill status: ${response.statusText}`)
    }

    return response.json<{ backfill: BackfillStatus | null }>()
}

/**
 * Retry failed backfill commits
 */
export async function retryBackfill(repoId: string): Promise<{ message: string; backfill: BackfillStatus }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/repos/${repoId}/reports/backfill/retry`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const errorData = await response.json<{ error?: string }>().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to retry backfill: ${response.statusText}`)
    }

    clearReposReportsCache()
    return response.json<{ message: string; backfill: BackfillStatus }>()
}

/**
 * Get report for a specific commit
 */
export async function getCommitReport(commitId: string): Promise<ReportStatus> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/commits/${commitId}/report`, {
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`)
    }

    const data = await response.json<ReportStatus>()
    if (data?.status === 'completed') {
        clearCommitsCache()
    }

    return normalizeReportStatus(data)
}

/**
 * Trigger report generation for a commit
 */
export async function triggerCommitReport(commitId: string): Promise<ReportStatus> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/commits/${commitId}/report`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const errorData = await response.json<{ error?: string }>().catch(() => ({ error: response.statusText }))
        throw new Error(errorData.error || `Failed to trigger report: ${response.statusText}`)
    }

    const data = await response.json<ReportStatus>()
    clearCommitsCache()
    return normalizeReportStatus(data)
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
    // Job management APIs
    getPendingJobsCount,
    recoverJobs,
    getSystemHealth,
    // Webhook APIs
    fetchWebhookSettings,
    updateWebhookSettings,
    testWebhook,
    deleteWebhookSettings,
    fetchWebhookLogs,
    getAdminOverview,
    getAdminUsers,
    getAdminPayments,
    getAdminActivity,
}

/**
 * Get user's webhook settings
 */
export async function fetchWebhookSettings(): Promise<WebhookSettings> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/settings/webhooks`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch webhook settings')
    }

    return response.json<WebhookSettings>()
}

/**
 * Update or create webhook settings
 */
export async function updateWebhookSettings(payload: WebhookUpdatePayload): Promise<{ message: string, settings: WebhookSettings }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/settings/webhooks`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const error = await response.json<{ error?: string }>()
        throw new Error(error.error || 'Failed to update webhook settings')
    }

    return response.json<{ message: string; settings: WebhookSettings }>()
}

/**
 * Test webhook delivery
 */
export async function testWebhook(): Promise<{ success: boolean, message?: string, error?: string, statusCode?: number }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/settings/webhooks/test`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok && response.status !== 500) {
        const error = await response.json<{ error?: string }>()
        throw new Error(error.error || 'Failed to test webhook')
    }

    return response.json<{ success: boolean; message?: string; error?: string; statusCode?: number }>()
}

/**
 * Delete webhook settings
 */
export async function deleteWebhookSettings(): Promise<{ message: string }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')

    const response = await httpRequest(`${API_URL}/v1/settings/webhooks`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        const error = await response.json<{ error?: string }>()
        throw new Error(error.error || 'Failed to delete webhook settings')
    }

    return response.json<{ message: string }>()
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

    const response = await httpRequest(`${API_URL}/v1/settings/webhooks/logs?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    if (!response.ok) {
        throw new Error('Failed to fetch webhook logs')
    }

    return response.json<{ logs: WebhookLog[]; pagination: unknown }>()
}

export interface Entitlements {
    plan: string
    plan_name: string
    cadence: string | null
    status: string
    access_active: boolean
    features: string[]
    limits: { repositories: number; ai_reports: number; discord_webhooks: number; hosted_history_days: number | null }
    usage: { ai_reports_reserved: number; ai_reports_completed: number; discord_deliveries: number; synced_commits: number }
    usage_period_start: string
    current_period_end: string | null
    grace_period_end: string | null
    cancel_at_period_end: boolean
}

export interface BillingCatalogPrice {
    price_id: string
    name: string | null
    description: string | null
    cadence: 'monthly' | 'annual'
    amount_minor: string
    currency_code: string | null
    formatted_total: string | null
}

export interface BillingCatalogPlan {
    code: string
    name: string
    description: string
    marketing_label: string
    cta_label: string
    featured: boolean
    display_features: string[]
    limits: { repositories: number; ai_reports: number; discord_webhooks: number; hosted_history_days: number | null }
    prices: { monthly: BillingCatalogPrice | null; annual: BillingCatalogPrice | null }
}

export interface BillingCatalog {
    provider: string
    plans: BillingCatalogPlan[]
}

export async function getBillingCatalog(): Promise<BillingCatalog> {
    const response = await httpRequest(`${API_URL}/v1/billing/catalog`, { cache: 'no-store' })
    if (!response.ok) throw await getApiError(response, 'Could not load pricing')
    return response.json<BillingCatalog>()
}

export async function getEntitlements(): Promise<Entitlements> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')
    const response = await httpRequest(`${API_URL}/v1/billing/entitlements`, { headers: { 'Authorization': `Bearer ${token}` }, cache: 'no-store' })
    if (!response.ok) throw await getApiError(response, 'Could not load billing status')
    return response.json<Entitlements>()
}

export async function createCheckout(plan_code: string, cadence: 'monthly' | 'annual' = 'monthly', idempotencyKey = globalThis.crypto.randomUUID()): Promise<{ url: string }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')
    const response = await httpRequest(`${API_URL}/v1/billing/checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ plan_code, cadence })
    })
    if (!response.ok) throw await getApiError(response, 'Could not start checkout')
    return response.json<{ url: string }>()
}

export async function createBillingPortal(): Promise<{ url: string }> {
    const token = await getAuthToken()
    if (!token) throw new Error('Not authenticated')
    const response = await httpRequest(`${API_URL}/v1/billing/portal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw await getApiError(response, 'Billing portal unavailable')
    return response.json<{ url: string }>()
}
