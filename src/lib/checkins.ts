import { apiRequest } from './api'
import { CheckinGuest, CheckinRecord } from '../types/models'

export type MrzScanResponse = {
  detected: boolean
  guest: CheckinGuest | null
  mrzScore: number
  warnings: string[]
  mrzLines?: {
    line1: string
    line2: string
  }
}

export type CheckinDraftResponse = {
  stayId: string
  status: CheckinRecord['status']
  checkInDate: string
  checkOutDate: string
  phoneNo?: string
  mrzScore: number
  roomCode?: string
  roomSection?: string
  roomLabel?: string
  roomType?: CheckinRecord['roomType']
  bedNumber?: number
  guest: CheckinGuest | null
  warnings: string[]
}

export const checkinsApi = {
  scanMrz: (token: string, data: FormData) =>
    apiRequest<MrzScanResponse>('/checkins/mrz/scan', {
      method: 'POST',
      token,
      body: data,
    }),

  createDraftFromScan: (token: string, data: FormData) =>
    apiRequest<CheckinDraftResponse>('/checkins', {
      method: 'POST',
      token,
      body: data,
    }),

  createManual: (
    token: string,
    data: {
      guest: CheckinGuest
      checkInDate: string
      checkOutDate: string
      phoneNo?: string
      status: CheckinRecord['status']
      roomCode?: string
      bedNumber?: number
    },
  ) =>
    apiRequest<CheckinDraftResponse>('/checkins/manual', {
      method: 'POST',
      token,
      body: data,
    }),

  list: (token: string, date: string) =>
    apiRequest<{ date: string; stays: CheckinRecord[] }>(`/checkins?date=${encodeURIComponent(date)}`, {
      token,
    }),

  update: (
    token: string,
    stayId: string,
    data: {
      guest?: Partial<CheckinGuest>
      checkInDate?: string
      checkOutDate?: string
      phoneNo?: string
      status?: CheckinRecord['status']
      roomCode?: string
      bedNumber?: number
    },
  ) =>
    apiRequest<CheckinRecord>(`/checkins/${stayId}`, {
      method: 'PATCH',
      token,
      body: data,
    }),

  move: (
    token: string,
    stayId: string,
    data: {
      roomCode: string
      bedNumber?: number
    },
  ) =>
    apiRequest<CheckinRecord>(`/checkins/${stayId}/move`, {
      method: 'POST',
      token,
      body: data,
    }),

  clearRoom: (token: string, stayId: string) =>
    apiRequest<CheckinRecord>(`/checkins/${stayId}/clear-room`, {
      method: 'POST',
      token,
    }),

  remove: (token: string, stayId: string) =>
    apiRequest<{ ok: true }>(`/checkins/${stayId}`, {
      method: 'DELETE',
      token,
    }),

  exportTm30: (token: string, date: string) =>
    apiRequest<Blob>(`/tm30/export?date=${encodeURIComponent(date)}`, {
      token,
      responseType: 'blob',
    }),
}
