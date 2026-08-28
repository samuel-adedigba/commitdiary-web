import axios, { AxiosRequestConfig, AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios'

export type HttpRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
    body?: unknown
    headers?: HeadersInit
    responseType?: AxiosRequestConfig['responseType']
    timeout?: number
}

export interface HttpResponse<T = unknown> {
    ok: boolean
    status: number
    statusText: string
    headers: { get(name: string): string | null }
    json<TJson = T>(): Promise<TJson>
    text(): Promise<string>
    blob(): Promise<Blob>
}

export class HttpClientError extends Error {
    code?: string
    status?: number

    constructor(message: string, code?: string, status?: number) {
        super(message)
        this.name = 'HttpClientError'
        this.code = code
        this.status = status
    }
}

function headersToRecord(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {}
    if (headers instanceof Headers) return Object.fromEntries(headers.entries())
    if (Array.isArray(headers)) return Object.fromEntries(headers)
    return Object.fromEntries(Object.entries(headers))
}

function responseHeaderValue(headers: AxiosResponseHeaders | RawAxiosResponseHeaders, name: string): string | null {
    const target = name.toLowerCase()
    const key = Object.keys(headers).find((candidate) => candidate.toLowerCase() === target)
    if (!key) return null
    const value = headers[key]
    return Array.isArray(value) ? value.join(', ') : String(value)
}

function parseJson<T>(data: unknown): T {
    if (typeof data !== 'string') return data as T
    try {
        return JSON.parse(data) as T
    } catch {
        return data as T
    }
}

function toText(data: unknown): string {
    if (typeof data === 'string') return data
    if (data === undefined || data === null) return ''
    try {
        return JSON.stringify(data)
    } catch {
        return String(data)
    }
}

export async function httpRequest<T = unknown>(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const response = await axios<T>({
        url,
        method: options.method || 'GET',
        headers: headersToRecord(options.headers),
        data: options.body,
        timeout: options.timeout ?? 15_000,
        signal: options.signal,
        responseType: options.responseType,
        // The dashboard also runs this adapter from Next Edge middleware.
        // Select Axios' Web Fetch adapter explicitly so it never selects the
        // Node-only HTTP adapter in that runtime.
        adapter: 'fetch',
        // Keep same-origin HttpOnly sessions available by default. The auth
        // routes set/read the session cookie through this shared adapter.
        withCredentials: options.credentials !== 'omit',
        validateStatus: () => true,
    }).catch((error: unknown) => {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                throw new HttpClientError('The request timed out. Please try again.', 'TIMEOUT', status)
            }
            throw new HttpClientError('The network request failed. Check your connection and try again.', 'NETWORK_ERROR', status)
        }
        throw error
    })

    const data = response.data
    return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        headers: {
            get(name: string) {
                return responseHeaderValue(response.headers, name)
            },
        },
        json: async <TJson>() => parseJson<TJson>(data),
        text: async () => toText(data),
        blob: async () => {
            if (data instanceof Blob) return data
            return new Blob([toText(data)], { type: responseHeaderValue(response.headers, 'content-type') || 'application/octet-stream' })
        },
    }
}
