import { CleaningPlaceStatus, CleaningRoom, Task } from '../types/models'

export interface BroadcastRoomInfo {
  code: string
  section: string
  roomType: CleaningRoom['roomType']
  label: string
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

export const needsCleaningSignature = (rooms: BroadcastRoomInfo[]) =>
  rooms
    .map((room) => room.code)
    .sort()
    .join('|')

export function buildCleaningBroadcastMessage(
  rooms: BroadcastRoomInfo[],
  statusLabel = 'Needs cleaning',
  date = new Date(),
): string {
  const sorted = [...rooms].sort((a, b) =>
    a.section.localeCompare(b.section) || a.code.localeCompare(b.code),
  )
  const lines: string[] = []
  lines.push('🧹 CLEANING REQUEST')
  lines.push(`📅 ${formatBroadcastDate(date)} — Status: ${statusLabel}`)
  lines.push('')

  if (!sorted.length) {
    lines.push('No rooms need cleaning right now. 🎉')
    return lines.join('\n')
  }

  lines.push(`Rooms to clean (${sorted.length}):`)

  let currentSection = ''
  let counter = 0
  for (const room of sorted) {
    counter += 1
    if (room.section !== currentSection) {
      currentSection = room.section
      lines.push('')
      lines.push(`📍 ${currentSection}`)
    }
    const detail = room.roomType === 'shared' ? 'Shared dorm' : 'Private'
    lines.push(`${counter}. Room ${room.code} — ${detail}`)
  }

  lines.push('')
  lines.push('Please confirm here when each room is done. Thank you! 🙏')
  return lines.join('\n')
}

export const buildRoomReadyMessage = (roomLabel: string) => `✅ ${roomLabel} is ready`
