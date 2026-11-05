import { CleaningArea, CleaningPlaceStatus, CleaningRoom, Task } from '../types/models'

// Beyond the room identity, the broadcast board tracks the cleaning-relevant
// details (service status, cleaner and task state). They are not printed in
// the message, but they make the board signature change whenever a room or
// place that is on the list gets updated, so the full list is sent again.
export interface BroadcastRoomInfo {
  code: string
  section: string
  roomType: CleaningRoom['roomType']
  label: string
  bedCount: number
  statusLabel?: string
  assigneeId?: string
  assigneeName?: string
  taskStatus?: Task['status']
  bedStates: string
  trashRequested?: boolean
}

export interface BroadcastPlaceInfo {
  name: string
  statusLabel?: string
  assigneeId?: string
  assigneeName?: string
  taskStatus?: Task['status']
  bedStates: string
  trashRequested?: boolean
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

// Compact, order-stable description of the bed states. It feeds the board
// signature so a bed update on a room that is still on the list also triggers
// a fresh broadcast.
const bedStateSignature = (beds: CleaningPlaceStatus['beds'] = []) =>
  [...beds]
    .sort((a, b) => a.bedNumber - b.bedNumber)
    .map((bed) => `${bed.bedNumber}:${normalizeCleaningLabel(bed.label)}`)
    .join('|')

// Mirrors the room board: a room belongs to the cleaning list when its room
// service status is "Needs cleaning" or it still has an unstarted cleaning
// task. Rooms with a started task are "In progress" and stay off the list.
export function collectRoomsNeedingCleaning(
  rooms: CleaningRoom[],
  statuses: CleaningPlaceStatus[],
  tasks: Task[],
  options?: { excludeRoomCodes?: string[]; cleanerNames?: Map<string, string> },
): BroadcastRoomInfo[] {
  const excluded = new Set(options?.excludeRoomCodes ?? [])
  const result: BroadcastRoomInfo[] = []

  for (const room of rooms) {
    if (!room.isActive || excluded.has(room.code)) continue

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

    if (activeTask?.startedAt) continue
    if (!isNeedsCleaningLabel(status?.roomServiceLabel) && !activeTask) continue

    result.push({
      code: room.code,
      section: room.section,
      roomType: room.roomType,
      label: room.label,
      bedCount: room.bedCount,
      statusLabel: status?.roomServiceLabel ?? status?.label,
      assigneeId: activeTask?.assignedTo,
      assigneeName: activeTask?.assignedTo ? options?.cleanerNames?.get(activeTask.assignedTo) : undefined,
      taskStatus: activeTask?.status,
      bedStates: bedStateSignature(status?.beds),
      trashRequested: status?.trashRequested,
    })
  }

  return result
}

// Same rule as the custom-place cards: the saved custom status wins. When a
// place has no saved status, an unstarted cleaning task still puts it on the
// list.
export function collectPlacesNeedingCleaning(
  areas: CleaningArea[],
  statuses: CleaningPlaceStatus[],
  tasks: Task[],
  options?: { excludePlaceNames?: string[]; cleanerNames?: Map<string, string> },
): BroadcastPlaceInfo[] {
  const excluded = new Set(options?.excludePlaceNames ?? [])
  const result: BroadcastPlaceInfo[] = []

  for (const area of areas) {
    if (!area.isActive || excluded.has(area.name)) continue

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

    if (activeTask?.startedAt) continue
    if (status ? !isNeedsCleaningLabel(status.label) : !activeTask) continue

    result.push({
      name: area.name,
      statusLabel: status?.label,
      assigneeId: activeTask?.assignedTo,
      assigneeName: activeTask?.assignedTo ? options?.cleanerNames?.get(activeTask.assignedTo) : undefined,
      taskStatus: activeTask?.status,
      bedStates: bedStateSignature(status?.beds),
      trashRequested: status?.trashRequested,
    })
  }

  return result
}

// The signature covers every detail the broadcast reacts to. When a room or
// place that is still on the needs-cleaning list changes (service status,
// assigned cleaner, task state, room metadata), the signature changes and the
// full list is sent again. Unrelated state refreshes keep the same signature.
export const cleaningBoardSignature = (board: CleaningBroadcastBoard) =>
  JSON.stringify({
    rooms: [...board.rooms]
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((room) => [
        room.code,
        room.section,
        room.roomType,
        room.label,
        room.bedCount,
        room.statusLabel ?? '',
        room.assigneeId ?? '',
        room.assigneeName ?? '',
        room.taskStatus ?? '',
        room.bedStates,
        room.trashRequested ? '1' : '0',
      ]),
    places: [...board.places]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((place) => [
        place.name,
        place.statusLabel ?? '',
        place.assigneeId ?? '',
        place.assigneeName ?? '',
        place.taskStatus ?? '',
        place.bedStates,
        place.trashRequested ? '1' : '0',
      ]),
  })

const assignmentLabel = (place: { assigneeName?: string; assigneeId?: string }) => {
  if (place.assigneeName) return `Assigned to ${place.assigneeName}`
  if (place.assigneeId) return 'Assigned to a cleaner'
  return ''
}

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
      const assignment = assignmentLabel(room)
      const detail = assignment || (room.roomType === 'shared' ? 'Shared dorm' : 'Private')
      lines.push(`${counter}. Room ${room.code} — ${detail}`)
    }
  }

  if (places.length) {
    if (rooms.length) lines.push('')
    lines.push(`Places to clean (${places.length}):`)
    places.forEach((place, index) => {
      const assignment = assignmentLabel(place)
      lines.push(`${index + 1}. ${place.name}${assignment ? ` — ${assignment}` : ''}`)
    })
  }

  lines.push('')
  lines.push('Please confirm here when each room or place is done. Thank you! 🙏')
  return lines.join('\n')
}

export const buildRoomReadyMessage = (roomLabel: string) => `✅ ${roomLabel} is ready`
