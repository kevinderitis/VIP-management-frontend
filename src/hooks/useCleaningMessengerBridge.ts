import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_BASE_URL } from '../lib/api'
import {
  buildCleaningBroadcastMessage,
  buildRoomReadyMessage,
  CleaningBroadcastBoard,
  cleaningBoardSignature,
  collectPlacesNeedingCleaning,
  collectRoomsNeedingCleaning,
} from '../lib/cleaning-broadcast'
import {
  isMessengerConfigured,
  isMessengerReachable,
  sendMessengerMessage,
} from '../lib/messenger'
import { addToast, useAppStore, useSessionUser } from '../store/app-store'
import { Task } from '../types/models'

type CleaningTaskSnapshot = {
  id: string
  status: Task['status']
  roomCode?: string
  placeName?: string
  label: string
}

const SEND_DEBOUNCE_MS = 700

const MESSENGER_CONFIGURED = isMessengerConfigured()

const taskLabel = (task: Task) =>
  task.cleaningRoomCode
    ? `Room ${task.cleaningRoomCode}`
    : (task.cleaningLocationLabel ?? task.title)

const pushToast = (
  title: string,
  message: string,
  tone: 'success' | 'info' | 'warning' = 'success',
) => {
  useAppStore.setState((state) => ({
    toasts: addToast(state.toasts, title, message, tone),
  }))
}

const sendBoardUpdate = async (
  board: CleaningBroadcastBoard,
  completedTasks: CleaningTaskSnapshot[],
) => {
  // Never send an empty cleaning list. When the last room/place leaves the
  // board the group only needs the ready confirmation, and a bulk action that
  // clears everything should not announce "no rooms to clean".
  const hasPendingItems = board.rooms.length > 0 || board.places.length > 0
  const shouldSendList = hasPendingItems

  let listSent = false
  if (shouldSendList) {
    try {
      await sendMessengerMessage(buildCleaningBroadcastMessage(board, 'Needs cleaning'))
      listSent = true
      pushToast(
        'Cleaning list sent',
        'The Messenger group received the updated cleaning list.',
      )
    } catch (error) {
      pushToast(
        'Messenger message failed',
        error instanceof Error ? error.message : 'The Messenger group could not be notified.',
        'warning',
      )
    }
  }

  let readyFailed = false
  let readySent = 0
  for (const task of completedTasks) {
    try {
      await sendMessengerMessage(buildRoomReadyMessage(task.label))
      readySent += 1
    } catch (error) {
      readyFailed = true
      console.warn('Messenger ready message skipped:', error)
    }
  }

  if (readyFailed) {
    pushToast(
      'Ready message failed',
      listSent
        ? 'The updated list was sent, but one or more ready confirmations did not go through.'
        : 'The room ready confirmation could not be sent to the Messenger group.',
      'warning',
    )
  } else if (!shouldSendList && readySent > 0) {
    // The list was skipped because it would be empty; confirm that the ready
    // message did reach the group.
    pushToast(
      'Room ready sent',
      'The Messenger group received the ready confirmation.',
    )
  }
}

// The Messenger bot runs on the admin PC. This hook turns that browser into
// the sender: it watches the state the admin already receives, detects any
// update to a room or custom place that is on the needs-cleaning list (status,
// cleaner, task or bed state), and sends the full list again. Cleaner DONE
// transitions additionally send the ready confirmation. Phones receive the
// same state updates but fail the reachability probe, so they never send.
export const useCleaningMessengerBridge = () => {
  const user = useSessionUser()
  const userId = user?.id
  const userRole = user?.role
  const isReady = useAppStore((state) => state.isReady)
  const accessToken = useAppStore((state) => state.accessToken)
  const cleaningRooms = useAppStore((state) => state.cleaningRooms)
  const cleaningAreas = useAppStore((state) => state.cleaningAreas)
  const cleaningPlaceStatuses = useAppStore((state) => state.cleaningPlaceStatuses)
  const tasks = useAppStore((state) => state.tasks)
  const refreshState = useAppStore((state) => state.refreshState)

  const [reachable, setReachable] = useState(false)
  const shouldProbe = Boolean(
    MESSENGER_CONFIGURED && isReady && accessToken && userRole === 'admin',
  )
  const bridgeEnabled = shouldProbe && reachable

  useEffect(() => {
    if (!shouldProbe) return

    let cancelled = false
    let timer: number | undefined

    const probe = async () => {
      const isReachable = await isMessengerReachable()
      if (cancelled) return
      setReachable(isReachable)
      timer = window.setTimeout(() => void probe(), isReachable ? 30000 : 10000)
    }

    void probe()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [shouldProbe])

  useEffect(() => {
    if (!bridgeEnabled || !accessToken) return

    // The admin panel already polls every 12s, but the bridge should react as
    // soon as the backend reports a room or cleaning-task change, especially
    // when a cleaner sends DONE from a phone.
    const socket = io(API_BASE_URL.replace(/\/api$/, ''), {
      transports: ['websocket'],
      auth: { token: accessToken },
    })

    socket.on('tasks:updated', () => {
      void refreshState()
    })

    return () => {
      socket.disconnect()
    }
  }, [accessToken, bridgeEnabled, refreshState])

  const roomsNeeding = useMemo(
    () => collectRoomsNeedingCleaning(cleaningRooms, cleaningPlaceStatuses, tasks),
    [cleaningPlaceStatuses, cleaningRooms, tasks],
  )
  const placesNeeding = useMemo(
    () => collectPlacesNeedingCleaning(cleaningAreas, cleaningPlaceStatuses, tasks),
    [cleaningAreas, cleaningPlaceStatuses, tasks],
  )
  const board = useMemo<CleaningBroadcastBoard>(
    () => ({ rooms: roomsNeeding, places: placesNeeding }),
    [placesNeeding, roomsNeeding],
  )
  const boardSignature = useMemo(() => cleaningBoardSignature(board), [board])

  const taskSnapshot = useMemo(() => {
    const snapshot = new Map<string, CleaningTaskSnapshot>()
    for (const task of tasks) {
      if (task.audience !== 'cleaning') continue
      snapshot.set(task.id, {
        id: task.id,
        status: task.status,
        roomCode: task.cleaningRoomCode,
        placeName:
          task.cleaningLocationType === 'custom'
            ? task.cleaningLocationLabel
            : undefined,
        label: taskLabel(task),
      })
    }
    return snapshot
  }, [tasks])

  const previousUserRef = useRef<string | null>(null)
  const previousBoardRef = useRef<{ signature: string } | null>(null)
  const previousTasksRef = useRef<Map<string, CleaningTaskSnapshot> | null>(null)
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve())
  const pendingSendRef = useRef<{
    board: CleaningBroadcastBoard
    completedTasks: CleaningTaskSnapshot[]
  } | null>(null)
  const sendTimerRef = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      if (sendTimerRef.current) window.clearTimeout(sendTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (!isReady || userRole !== 'admin') {
      previousUserRef.current = null
      previousBoardRef.current = null
      previousTasksRef.current = null
      pendingSendRef.current = null
      if (sendTimerRef.current) {
        window.clearTimeout(sendTimerRef.current)
        sendTimerRef.current = undefined
      }
      return
    }

    // Keep the last known snapshot while the bot is temporarily unreachable.
    // When it comes back, the next effect run compares against it and sends
    // the current list, so changes made during the outage are not lost.
    if (!bridgeEnabled) {
      pendingSendRef.current = null
      if (sendTimerRef.current) {
        window.clearTimeout(sendTimerRef.current)
        sendTimerRef.current = undefined
      }
      return
    }

    if (previousUserRef.current !== userId) {
      previousUserRef.current = userId ?? null
      previousBoardRef.current = { signature: boardSignature }
      previousTasksRef.current = taskSnapshot
      return
    }

    const previousBoard = previousBoardRef.current
    const previousTasks = previousTasksRef.current
    previousBoardRef.current = { signature: boardSignature }
    previousTasksRef.current = taskSnapshot
    if (!previousBoard || !previousTasks) return

    const completedTasks = [...taskSnapshot.entries()]
      .filter(
        ([taskId, current]) =>
          current.status === 'completed' &&
          previousTasks.get(taskId)?.status !== 'completed',
      )
      .map(([, current]) => current)

    const listChanged = previousBoard.signature !== boardSignature
    if (!listChanged && completedTasks.length === 0) return

    // A single admin action can produce several state updates (optimistic
    // update, server refresh, socket refresh). Debounce briefly and always
    // send the latest board so the group gets one message per change.
    const mergedCompleted = [
      ...(pendingSendRef.current?.completedTasks ?? []),
      ...completedTasks,
    ]
    const uniqueCompleted = [
      ...new Map(mergedCompleted.map((task) => [task.id, task])).values(),
    ]

    const completedRoomCodes = uniqueCompleted
      .map((task) => task.roomCode)
      .filter((code): code is string => Boolean(code))
    const completedPlaceNames = uniqueCompleted
      .map((task) => task.placeName)
      .filter((name): name is string => Boolean(name))

    const nextBoard: CleaningBroadcastBoard = {
      rooms: board.rooms.filter((room) => !completedRoomCodes.includes(room.code)),
      places: board.places.filter((place) => !completedPlaceNames.includes(place.name)),
    }

    pendingSendRef.current = { board: nextBoard, completedTasks: uniqueCompleted }

    if (sendTimerRef.current) window.clearTimeout(sendTimerRef.current)
    sendTimerRef.current = window.setTimeout(() => {
      const payload = pendingSendRef.current
      pendingSendRef.current = null
      sendTimerRef.current = undefined
      if (!payload) return

      // The queue keeps the list ahead of the ready confirmations, even when
      // two changes arrive close together.
      sendQueueRef.current = sendQueueRef.current
        .then(() => sendBoardUpdate(payload.board, payload.completedTasks))
        .catch((error) => console.warn('Cleaning Messenger bridge failed:', error))
    }, SEND_DEBOUNCE_MS)
  }, [
    board,
    boardSignature,
    bridgeEnabled,
    isReady,
    taskSnapshot,
    userId,
    userRole,
  ])
}
