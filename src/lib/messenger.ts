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

export async function sendMessengerMessage(message: string, chatId?: string): Promise<MessengerSendResult> {
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
