import { CleaningRoom } from '../types/models'

export interface BroadcastRoomInfo {
  code: string
  section: string
  roomType: CleaningRoom['roomType']
  label: string
}

export const formatBroadcastDate = (date = new Date()) =>
  date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

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
