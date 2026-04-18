const SYSTEM_TIMEZONE = 'Asia/Bangkok'
const THAILAND_OFFSET_MINUTES = 7 * 60

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: SYSTEM_TIMEZONE,
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: SYSTEM_TIMEZONE,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: SYSTEM_TIMEZONE,
})

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: SYSTEM_TIMEZONE,
})

const dateTimePartsFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: SYSTEM_TIMEZONE,
})

const getDateTimeParts = (value: string | Date) => {
  const parts = dateTimePartsFormatter.formatToParts(new Date(value))
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: lookup.year ?? '0000',
    month: lookup.month ?? '01',
    day: lookup.day ?? '01',
    hour: lookup.hour ?? '00',
    minute: lookup.minute ?? '00',
  }
}

export const formatDateTime = (value?: string) => {
  if (!value) return 'Not set'
  return dateTimeFormatter.format(new Date(value))
}

export const formatTime = (value?: string) => {
  if (!value) return 'No time'
  return timeFormatter.format(new Date(value))
}

export const formatTimeRange = (start?: string, end?: string) => {
  if (!start) return 'No time'
  if (!end) return formatTime(start)
  return `${formatTime(start)} - ${formatTime(end)}`
}

export const formatDate = (value?: string) => {
  if (!value) return 'No date'
  return dateFormatter.format(new Date(value))
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

export const toLocalDateKey = (value: string | Date = new Date()) => dateKeyFormatter.format(new Date(value))

export const toDateTimeLocal = (value?: string) => {
  if (!value) return ''
  const { year, month, day, hour, minute } = getDateTimeParts(value)
  return `${year}-${month}-${day}T${hour}:${minute}`
}

export const fromDateTimeLocal = (value?: string) => {
  if (!value) return undefined
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) return undefined

  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)

  if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) {
    return undefined
  }

  const utcMs = Date.UTC(year, month - 1, day, hours, minutes) - THAILAND_OFFSET_MINUTES * 60 * 1000
  return new Date(utcMs).toISOString()
}
