export const formatDateTime = (value?: string) => {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export const formatTime = (value?: string) => {
  if (!value) return 'No time'

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
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
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export const toDateTimeLocal = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}
