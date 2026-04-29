import { renderHook } from '@testing-library/react'
import { useRealtimeReports } from '/hooks/useRealtimeReports'

const {
  removeChannelMock,
  subscribeMock,
  onMock,
  channelMock
} = vi.hoisted(() => {
  const subscribe = vi.fn((_cb?: (status: string) => void) => ({ id: 'channel' }))
  const on = vi.fn(function () {
    return { subscribe }
  })
  const channel = vi.fn(() => ({ on }))
  const removeChannel = vi.fn()

  return {
    removeChannelMock: removeChannel,
    subscribeMock: subscribe,
    onMock: on,
    channelMock: channel
  }
})

vi.mock('/lib/supabaseClient', () => ({
  supabase: {
    channel: channelMock,
    removeChannel: removeChannelMock
  }
}))

vi.mock('/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1' }
  })
}))

vi.mock('/lib/alerts/errorLogger', () => ({
  logError: vi.fn()
}))

describe('useRealtimeReports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates report and job channels and removes both on unmount', () => {
    const { unmount } = renderHook(() => useRealtimeReports(99))

    expect(channelMock).toHaveBeenCalledTimes(2)
    unmount()

    expect(removeChannelMock).toHaveBeenCalledTimes(2)
  })
})
