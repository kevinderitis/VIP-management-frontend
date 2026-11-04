export type MessengerSendStatus = 'sent' | 'uncertain' | 'error'

export interface MessengerSendResult {
  success: boolean
  status: MessengerSendStatus
  chatId?: string
  messageId?: string
  error?: string
}

// Frontend always talks to localhost for Messenger, as requested.
// Configure via Vite env; token will be provided later by the user.
const MESSENGER_API_URL =
  import.meta.env.VITE_MESSENGER_API_URL ?? 'http://localhost:3000/api/messenger/send'

const getMessengerToken = () => import.meta.env.VITE_MESSENGER_API_TOKEN ?? ''

export const getMessengerChatId = () => import.meta.env.VITE_MESSENGER_CHAT_ID ?? ''

export const isMessengerConfigured = () => Boolean(getMessengerToken() && getMessengerChatId())

// Only the device where the Messenger bot is reachable should send. The
// admin PC runs the bot on localhost; cleaner phones fail this probe and stay
// quiet, while still receiving state updates for the UI.
export async function isMessengerReachable(timeoutMs = 1800): Promise<boolean> {
  let healthUrl: string
  try {
    healthUrl = `${new URL(MESSENGER_API_URL).origin}/health`
  } catch {
    return false
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(healthUrl, {
      signal: controller.signal,
      cache: 'no-store',
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

// Direct link to the Messenger cleaning group, opened from the cleaner app.
// VITE_MESSENGER_CHAT_URL can override it; otherwise it defaults to the group
// the team uses for cleaning updates.
const DEFAULT_MESSENGER_CHAT_URL = 'https://www.messenger.com/t/1674818464198016'

export const getMessengerChatUrl = () => {
  const configured = (import.meta.env.VITE_MESSENGER_CHAT_URL as string | undefined)?.trim()
  return configured || DEFAULT_MESSENGER_CHAT_URL
}

export async function sendMessengerMessage(message: string, chatId?: string): Promise<MessengerSendResult> {
  return enqueueMessengerSend(() => performMessengerSend(message, chatId))
}

let messengerSendQueue: Promise<void> = Promise.resolve()

const enqueueMessengerSend = <T>(task: () => Promise<T>): Promise<T> => {
  // The Messenger bot drives a single browser page, so sends must run one at
  // a time. Queueing also keeps the cleaning list ahead of the follow-up
  // "room is ready" message when both are triggered together.
  const result = messengerSendQueue.then(task, task)
  messengerSendQueue = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

async function performMessengerSend(message: string, chatId?: string): Promise<MessengerSendResult> {
  const targetChatId = chatId || getMessengerChatId()
  if (!targetChatId) throw new Error('Missing Messenger chat id. Set VITE_MESSENGER_CHAT_ID.')
  const token = getMessengerToken()
  if (!token) throw new Error('Missing MESSENGER_API_TOKEN. Set VITE_MESSENGER_API_TOKEN.')

  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    response = await fetch(MESSENGER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chatId: targetChatId, message }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Messenger send timed out after 15s.')
    }
    throw new Error('Could not reach the Messenger service at localhost:3000.')
  } finally {
    clearTimeout(timeout)
  }

  const result = (await response.json().catch(() => ({}))) as MessengerSendResult
  if (!response.ok || !result.success || result.status === 'error') {
    throw new Error(result.error || `Messenger send failed (HTTP ${response.status}).`)
  }
  return result
}

export { MESSENGER_API_URL }
