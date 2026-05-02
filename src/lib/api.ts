const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '')

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string
  body?: unknown
  responseType?: 'json' | 'blob'
  headers?: Record<string, string>
}

const buildHeaders = (token?: string, body?: unknown, customHeaders?: Record<string, string>) => {
  const headers: Record<string, string> = { ...(customHeaders ?? {}) }

  if (!(body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      method: options.method ?? 'GET',
      headers: buildHeaders(options.token, options.body, options.headers),
      body:
        options.body instanceof FormData
          ? options.body
          : options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,
    })
  } catch {
    throw new ApiError('Could not reach the server. Please check your connection and try again.')
  }

  if (!response.ok) {
    let message = 'Request failed'

    try {
      const payload = await response.json()
      if (payload?.message === 'Validation failed' && payload?.errors?.fieldErrors) {
        const fieldMessages = Object.entries(payload.errors.fieldErrors as Record<string, string[]>)
          .flatMap(([, errors]) => errors ?? [])
          .filter(Boolean)
        if (fieldMessages.length) {
          message = fieldMessages.join(' ')
        } else {
          message = payload.message ?? payload.error ?? message
        }
      } else {
        message = payload.message ?? payload.error ?? message
      }
    } catch {
      message = response.statusText || message
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (options.responseType === 'blob') {
    return response.blob() as Promise<T>
  }

  return response.json() as Promise<T>
}

export { API_BASE_URL }
