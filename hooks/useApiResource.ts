import { useSyncExternalStore } from 'react'

type ResourceStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error'

export type ApiResourceSnapshot<T> = {
  data: T | null
  error: Error | null
  status: ResourceStatus
}

type Resource<T> = {
  getSnapshot: () => ApiResourceSnapshot<T>
  getServerSnapshot: () => ApiResourceSnapshot<T>
  subscribe: (listener: () => void) => () => void
  refresh: () => Promise<T>
}

const MAX_RESOURCES = 100
const resources = new Map<string, Resource<unknown>>()

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('The request failed. Try again.')
}

function createResource<T>(fetcher: () => Promise<T>): Resource<T> {
  const listeners = new Set<() => void>()
  const serverSnapshot: ApiResourceSnapshot<T> = {
    data: null,
    error: null,
    status: 'idle',
  }
  let snapshot = serverSnapshot
  let inFlight: Promise<T> | null = null

  const notify = () => listeners.forEach((listener) => listener())

  const load = async (force = false): Promise<T> => {
    if (inFlight) return inFlight
    if (!force && snapshot.status === 'success' && snapshot.data !== null) {
      return snapshot.data
    }

    snapshot = {
      data: snapshot.data,
      error: null,
      status: snapshot.data === null ? 'loading' : 'refreshing',
    }
    notify()

    inFlight = fetcher()
      .then((data) => {
        snapshot = { data, error: null, status: 'success' }
        notify()
        return data
      })
      .catch((error: unknown) => {
        const normalizedError = toError(error)
        snapshot = { data: snapshot.data, error: normalizedError, status: 'error' }
        notify()
        throw normalizedError
      })
      .finally(() => {
        inFlight = null
      })

    return inFlight
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      void load().catch(() => undefined)
      return () => listeners.delete(listener)
    },
    refresh: () => load(true),
  }
}

function getResource<T>(key: string, fetcher: () => Promise<T>): Resource<T> {
  const existing = resources.get(key) as Resource<T> | undefined
  if (existing) return existing

  if (resources.size >= MAX_RESOURCES) {
    const oldestKey = resources.keys().next().value
    if (oldestKey) resources.delete(oldestKey)
  }

  const resource = createResource(fetcher)
  resources.set(key, resource as Resource<unknown>)
  return resource
}

export function useApiResource<T>(key: string, fetcher: () => Promise<T>) {
  const resource = getResource<T>(key, fetcher)
  const snapshot = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getServerSnapshot,
  )

  return {
    ...snapshot,
    isLoading: snapshot.status === 'idle' || snapshot.status === 'loading',
    isRefreshing: snapshot.status === 'refreshing',
    refresh: resource.refresh,
  }
}

export function clearApiResourceCache(keyPrefix?: string) {
  if (!keyPrefix) {
    resources.clear()
    return
  }
  for (const key of Array.from(resources.keys())) {
    if (key.startsWith(keyPrefix)) resources.delete(key)
  }
}
