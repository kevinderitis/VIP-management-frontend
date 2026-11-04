import { CleaningArea, CleaningPlaceStatus, CleaningRoom, Task } from '../types/models'

export interface BroadcastRoomInfo {
  code: string
  section: string
  roomType: CleaningRoom['roomType']
  label: string
}

export interface BroadcastPlaceInfo {
  name: string
}

export interface CleaningBroadcastBoard {
  rooms: BroadcastRoomInfo[]
  places: BroadcastPlaceInfo[]
}

const ACTIVE_CLEANING_TASK_STATUSES: Task['status'][] = ['assigned', 'available', 'scheduled']

export const normalizeCleaningLabel = (value?: string) => value?.trim().toLowerCase() ?? ''

export const isNeedsCleaningLabel = (value?: string) =>
  ['need cleaning', 'needs cleaning'].includes(normalizeCleaningLabel(value))

export const formatBroadcastDate = (date = new Date()) =>
  date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

// Mirrors the room board: a room belongs to the cleaning list when its room
// service status is "Needs cleaning" or it still has an unstarted cleaning
// task. Rooms with a started task are "In progress" and stay off the list.
export function collectRoomsNeedingCleaning(
  rooms: CleaningRoom[],
  statuses: CleaningPlaceStatus[],
  tasks: Task[],
  options?: { excludeRoomCodes?: string[] },
): BroadcastRoomInfo[] {
  const excluded = new Set(options?.excludeRoomCodes ?? [])

  return rooms
    .filter((room) => {
      if (!room.isActive || excluded.has(room.code)) return false

      const status = statuses.find(
        (entry) => entry.placeType === 'room' && entry.roomCode === room.code,
      )
      const activeTask = tasks.find(
        (task) =>
          task.audience === 'cleaning' &&
          task.cleaningLocationType === 'room' &&
          task.cleaningRoomCode === room.code &&
          ACTIVE_CLEANING_TASK_STATUSES.includes(task.status),
      )

      if (activeTask?.startedAt) return false

      return isNeedsCleaningLabel(status?.roomServiceLabel) || Boolean(activeTask)
    })
    .map((room) => ({
      code: room.code,
      section: room.section,
      roomType: room.roomType,
      label: room.label,
    }))
}

// Same rule as the custom-place cards: the saved custom status wins. When a
// place has no saved status, an unstarted cleaning task still puts it on the
// list.
export function collectPlacesNeedingCleaning(
  areas: CleaningArea[],
  statuses: CleaningPlaceStatus[],
  tasks: Task[],
  options?: { excludePlaceNames?: string[] },
): BroadcastPlaceInfo[] {
  const excluded = new Set(options?.excludePlaceNames ?? [])

  return areas
    .filter((area) => {
      if (!area.isActive || excluded.has(area.name)) return false

      const status = statuses.find(
        (entry) =>
          entry.placeType === 'custom' &&
          (entry.cleaningAreaId === area.id || entry.placeLabel === area.name),
      )
      const activeTask = tasks.find(
        (task) =>
          task.audience === 'cleaning' &&
          task.cleaningLocationType === 'custom' &&
          task.cleaningLocationLabel === area.name &&
          ACTIVE_CLEANING_TASK_STATUSES.includes(task.status),
      )

      if (activeTask?.startedAt) return false
      if (status) return isNeedsCleaningLabel(status.label)

      return Boolean(activeTask)
    })
    .map((area) => ({ name: area.name }))
}

export const cleaningBoardSignature = (board: CleaningBroadcastBoard) =>
  [
    ...board.rooms.map((room) => `room:${room.code}`),
    ...board.places.map((place) => `place:${place.name}`),
  ]
    .sort()
    .join('|')

export function buildCleaningBroadcastMessage(
  board: CleaningBroadcastBoard,
  statusLabel = 'Needs cleaning',
  date = new Date(),
): string {
  const rooms = [...board.rooms].sort(
    (a, b) => a.section.localeCompare(b.section) || a.code.localeCompare(b.code),
  )
  const places = [...board.places].sort((a, b) => a.name.localeCompare(b.name))
  const lines: string[] = []
  lines.push('🧹 CLEANING REQUEST')
  lines.push(`📅 ${formatBroadcastDate(date)} — Status: ${statusLabel}`)
  lines.push('')

  if (!rooms.length && !places.length) {
    lines.push('No rooms or places need cleaning right now. 🎉')
    return lines.join('\n')
  }

  if (rooms.length) {
    lines.push(`Rooms to clean (${rooms.length}):`)

    let currentSection = ''
    let counter = 0
    for (const room of rooms) {
      counter += 1
      if (room.section !== currentSection) {
        currentSection = room.section
        lines.push('')
        lines.push(`📍 ${currentSection}`)
      }
      const detail = room.roomType === 'shared' ? 'Shared dorm' : 'Private'
      lines.push(`${counter}. Room ${room.code} — ${detail}`)
    }
  }

  if (places.length) {
    if (rooms.length) lines.push('')
    lines.push(`Places to clean (${places.length}):`)
    places.forEach((place, index) => {
      lines.push(`${index + 1}. ${place.name}`)
    })
  }

  lines.push('')
  lines.push('Please confirm here when each room or place is done. Thank you! 🙏')
  return lines.join('\n')
}

export const buildRoomReadyMessage = (roomLabel: string) => `✅ ${roomLabel} is ready`
