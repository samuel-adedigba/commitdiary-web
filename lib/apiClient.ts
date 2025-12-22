import { supabase } from '/lib/supabaseClient'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.commitdiary.com'

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
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not found')

    const query = new URLSearchParams({
        limit: String(params?.limit || 50),
        offset: String(params?.offset || 0),
        ...(params?.from && { from: params.from }),
        ...(params?.to && { to: params.to }),
        ...(params?.category && { category: params.category })
    })

    const url = `${API_URL}/v1/users/${user.id}/commits?${query}`
    console.log('[API Client] Fetching commits from:', url)
    console.log('[API Client] API_URL:', API_URL)
    console.log('[API Client] User ID:', user.id)

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })

    console.log('[API Client] Response status:', response.status)

    if (!response.ok) {
        const errorText = await response.text()
        console.error('[API Client] Error response:', errorText)
        throw new Error(`Failed to fetch commits: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[API Client] Received data:', data)
    
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

    const { data: { user } } = await supabase.auth.getUser()
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

    const { data: { user } } = await supabase.auth.getUser()
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

export async function getShares(): Promise<{ shares: Array<{
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
}> }> {
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
    exportShare
}
