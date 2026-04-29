import { act, renderHook } from '@testing-library/react'
import { useReportStatus } from '/hooks/useReportStatus'
import { getCommitReportStatus, triggerCommitReportGeneration } from '/lib/reports/reportApi'
import { useReportRealtime } from '/hooks/useReportRealtime'

vi.mock('/lib/reports/reportApi', () => ({
  getCommitReportStatus: vi.fn(),
  triggerCommitReportGeneration: vi.fn()
}))

vi.mock('/hooks/useReportRealtime', () => ({
  useReportRealtime: vi.fn()
}))

const mockedGetCommitReportStatus = vi.mocked(getCommitReportStatus)
const mockedTriggerCommitReportGeneration = vi.mocked(triggerCommitReportGeneration)
const mockedUseReportRealtime = vi.mocked(useReportRealtime)

describe('useReportStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockedUseReportRealtime.mockImplementation((_commitId, _onUpdate) => ({
      isConnected: false,
      status: 'error',
      reportsStatus: 'error',
      jobsStatus: 'error',
      lastUpdate: null,
      reportData: null,
      jobStatus: null,
      error: null
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stops polling after terminal completed report', async () => {
    mockedGetCommitReportStatus.mockResolvedValue({
      status: 'completed',
      report: { title: 'done' } as any
    })

    renderHook(() => useReportStatus(101, true))

    await act(async () => {
      await Promise.resolve()
    })
    expect(mockedGetCommitReportStatus).toHaveBeenCalledTimes(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(220000)
    })

    expect(mockedGetCommitReportStatus).toHaveBeenCalledTimes(1)
  })

  it('surfaces timeout after bounded attempts while still processing', async () => {
    mockedGetCommitReportStatus.mockResolvedValue({
      status: 'processing'
    })

    const { result } = renderHook(() => useReportStatus(202, true))

    await act(async () => {
      await Promise.resolve()
    })
    expect(mockedGetCommitReportStatus).toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(190000)
    })

    expect(result.current.timedOut).toBe(true)
  })

  it('maps realtime failed payload error_message to errorMessage', async () => {
    let realtimeHandler: any
    mockedUseReportRealtime.mockImplementation((_commitId, onUpdate) => {
      realtimeHandler = onUpdate
      return {
        isConnected: true,
        status: 'connected',
        reportsStatus: 'connected',
        jobsStatus: 'connected',
        lastUpdate: null,
        reportData: null,
        jobStatus: null,
        error: null
      }
    })

    mockedGetCommitReportStatus.mockResolvedValue({
      status: 'processing'
    })

    const { result } = renderHook(() => useReportStatus(303, true))

    await act(async () => {
      await Promise.resolve()
    })
    expect(mockedGetCommitReportStatus).toHaveBeenCalled()

    act(() => {
      realtimeHandler?.({
        type: 'report_failed',
        commitId: 303,
        data: { error_message: 'provider timeout' }
      })
    })

    expect(result.current.reportStatus?.status).toBe('failed')
    expect(result.current.reportStatus?.errorMessage).toBe('provider timeout')
  })

  it('triggers report generation and updates state', async () => {
    mockedGetCommitReportStatus.mockResolvedValue({ status: 'not_found' })
    mockedTriggerCommitReportGeneration.mockResolvedValue({ status: 'pending', jobId: 'job-1' })

    const { result } = renderHook(() => useReportStatus(404, true))

    await act(async () => {
      await Promise.resolve()
    })
    expect(mockedGetCommitReportStatus).toHaveBeenCalled()

    await act(async () => {
      await result.current.generate()
    })

    expect(mockedTriggerCommitReportGeneration).toHaveBeenCalledWith('404')
    expect(result.current.reportStatus?.status).toBe('pending')
  })

  it('clears polling setup when disabled (modal close path)', async () => {
    mockedGetCommitReportStatus.mockResolvedValue({
      status: 'processing'
    })

    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    const { rerender, unmount } = renderHook(
      ({ commitId, enabled }) => useReportStatus(commitId, enabled),
      { initialProps: { commitId: 505, enabled: true } }
    )

    await act(async () => {
      await Promise.resolve()
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })

    rerender({ commitId: 505, enabled: false })
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(clearIntervalSpy).toHaveBeenCalled()

    vi.useRealTimers()
  })
})
