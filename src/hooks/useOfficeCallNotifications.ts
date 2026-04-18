import { useEffect, useMemo, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_BASE_URL } from '../lib/api'
import { useAppStore, useSessionUser } from '../store/app-store'
import { shouldUseWebPushOnly, showAppNotification } from '../utils/notifications'

const socketBaseUrl = API_BASE_URL.replace(/\/api$/, '')

export const useOfficeCallNotifications = () => {
  const user = useSessionUser()
  const accessToken = useAppStore((state) => state.accessToken)
  const officeCalls = useAppStore((state) => state.officeCalls)
  const refreshState = useAppStore((state) => state.refreshState)
  const seenCallIdsRef = useRef<string[]>([])

  const shouldConnect = useMemo(
    () => Boolean(accessToken && user?.role === 'volunteer'),
    [accessToken, user?.role],
  )

  useEffect(() => {
    if (!shouldConnect || !accessToken) return

    const socket: Socket = io(socketBaseUrl, {
      transports: ['websocket'],
      auth: { token: accessToken },
    })

    socket.on('office-call:new', () => {
      void refreshState()
    })

    return () => {
      socket.disconnect()
    }
  }, [accessToken, refreshState, shouldConnect])

  useEffect(() => {
    if (user?.role !== 'volunteer') {
      seenCallIdsRef.current = []
      return
    }
    if (shouldUseWebPushOnly()) return

    const newCalls = officeCalls.filter((call) => !seenCallIdsRef.current.includes(call.id))
    seenCallIdsRef.current = officeCalls.map((call) => call.id)

    newCalls.forEach((call) => {
      void showAppNotification('Come to the office', {
        body: call.message,
        tag: `office-call-${call.id}`,
      })
    })
  }, [officeCalls, user?.role])
}
