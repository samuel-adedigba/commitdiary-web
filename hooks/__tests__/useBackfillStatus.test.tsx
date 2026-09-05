import { act, renderHook } from '@testing-library/react'
import { useBackfillStatus } from '/hooks/useBackfillStatus'
import { apiClient } from '/lib/apiClient'

vi.mock('/lib/apiClient', () => ({
  apiClient: {
    getBackfillStatus: vi.fn()
  }
}))

const mockedGetBackfillStatus = vi.mocked(apiClient.getBackfillStatus)

describe('useBackfillStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps attempts across repo set changes and terminal-fails after error threshold', async () => {
    mockedGetBackfillStatus.mockRejectedValue(new Error('network'))
    const onTerminalState = vi.fn()
    const onBackfillUpdate = vi.fn()

    const { rerender } = renderHook(
      ({ repoIds }) =>
        useBackfillStatus({
          repoIds,
          enabled: true,
          intervalMs: 10,
          onBackfillUpdate,
          onTerminalState
        }),
      { initialProps: { repoIds: ['repo-1'] } }
    )

    // Settle one tick at a time: the hook skips interval ticks while a
    // poll is in flight, so bulk time advances would collapse polls. Each
    // act block fully drains the microtask queue before the next tick.
    for (let i = 0; i < 8; i++) {
      await act(async () => {
        vi.advanceTimersByTime(10)
      })
    }

    rerender({ repoIds: ['repo-1', 'repo-2'] })

    for (let i = 0; i < 4; i++) {
      await act(async () => {
        vi.advanceTimersByTime(10)
      })
    }

    expect(onBackfillUpdate).not.toHaveBeenCalled()
    expect(onTerminalState).toHaveBeenCalledWith('repo-1', { reason: 'error_attempts' })
  })

  it('reports terminal completion from server without inventing status', async () => {
    mockedGetBackfillStatus.mockResolvedValue({
      backfill: {
        status: 'completed',
        totalCommits: 2,
        completedCommits: 2,
        failedCommits: 0
      }
    } as any)

    const onTerminalState = vi.fn()
    const onBackfillUpdate = vi.fn()

    renderHook(() =>
      useBackfillStatus({
        repoIds: ['repo-3'],
        enabled: true,
        intervalMs: 10,
        onBackfillUpdate,
        onTerminalState
      })
    )

    await act(async () => {
      vi.advanceTimersByTime(20)
    })

    expect(onBackfillUpdate).toHaveBeenCalledWith(
      'repo-3',
      expect.objectContaining({ status: 'completed' })
    )
    expect(onTerminalState).toHaveBeenCalledWith('repo-3', { status: 'completed' })
  })

  it('does not overlap polling cycles while a request is in flight', async () => {
    let resolveRequest: ((value: unknown) => void) | undefined
    mockedGetBackfillStatus.mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve
    }) as any)

    renderHook(() => useBackfillStatus({ repoIds: ['repo-4'], enabled: true, intervalMs: 10 }))

    await act(async () => {
      vi.advanceTimersByTime(50)
    })
    expect(mockedGetBackfillStatus).toHaveBeenCalledTimes(1)

    // Settle the in-flight poll (multiple microtask hops) before the next
    // tick, otherwise the overlap guard correctly skips it.
    await act(async () => {
      resolveRequest?.({ backfill: { status: 'processing' } })
    })
    await act(async () => {
      vi.advanceTimersByTime(10)
    })
    expect(mockedGetBackfillStatus).toHaveBeenCalledTimes(2)
  })
})
