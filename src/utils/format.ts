const SYSTEM_TIMEZONE = 'UTC'

export const formatDateTime = (value?: string) => {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SYSTEM_TIMEZONE,
  }).format(new Date(value))
}

export const formatTime = (value?: string) => {
  if (!value) return 'No time'

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: SYSTEM_TIMEZONE,
  }).format(new Date(value))
}

export const formatTimeRange = (start?: string, end?: string) => {
  if (!start) return 'No time'
  if (!end) return formatTime(start)
  return `${formatTime(start)} - ${formatTime(end)}`
}

export const formatDate = (value?: string) => {
  if (!value) return 'No date'

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: SYSTEM_TIMEZONE,
  }).format(new Date(value))
}

export const relativeLabel = (value: string) => {
  const diffMs = new Date(value).getTime() - Date.now()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))

  if (diffHours === 0) return 'Now'
  if (diffHours > 0) return `In ${diffHours}h`
  return `${Math.abs(diffHours)}h ago`
}

export const formatPoints = (value: number) => `${value.toLocaleString('en-US')} pts`

export const formatWeekday = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1)

export const toLocalDateKey = (value: string | Date = new Date()) => {
  const date = new Date(value)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const toDateTimeLocal = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  const hours = `${date.getUTCHours()}`.padStart(2, '0')
  const minutes = `${date.getUTCMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export const fromDateTimeLocal = (value?: string) => {
  if (!value) return undefined
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return undefined
  const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart
  return `${datePart}T${normalizedTime}.000Z`
}
