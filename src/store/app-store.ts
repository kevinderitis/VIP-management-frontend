import { useMemo } from 'react'
import { create } from 'zustand'
import { apiRequest } from '../lib/api'
import {
  ActivityItem,
  BulkBedTaskSelection,
  CleanerDraftInput,
  BedConflict,
  CleaningArea,
  OfficeCall,
  CleaningPlaceStatus,
  CleaningPlaceStatusDraftInput,
  CleaningRoom,
  CleaningTaskDraftInput,
  PackAssignment,
  Redemption,
  Reward,
  RewardDraftInput,
  RoutineTaskAssignment,
  RoutineTaskDraftInput,
  RoutineTaskTemplate,
  Task,
  TaskCompletionRecord,
  TaskDraftInput,
  TaskGroup,
  TaskGroupDraftInput,
  TaskGroupTemplate,
  ToastItem,
  User,
  VolunteerDraftInput,
} from '../types/models'

type ServerState = {
  users: User[]
  tasks: Task[]
  groups: TaskGroup[]
  packAssignments: PackAssignment[]
  routineTasks: RoutineTaskTemplate[]
  routineAssignments: RoutineTaskAssignment[]
  taskHistory: TaskCompletionRecord[]
  cleaningAreas: CleaningArea[]
  cleaningPlaceStatuses: CleaningPlaceStatus[]
  cleaningRooms: CleaningRoom[]
  rewards: Reward[]
  redemptions: Redemption[]
  activities: ActivityItem[]
  officeCalls: OfficeCall[]
  bedConflicts: BedConflict[]
}

type AppState = ServerState & {
  toasts: ToastItem[]
  sessionUserId?: string
  accessToken?: string
  isReady: boolean
  isBootstrapping: boolean
  initializeApp: () => Promise<void>
  refreshState: () => Promise<void>
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
  createTask: (input: TaskDraftInput) => Promise<void>
  updateTask: (taskId: string, input: TaskDraftInput) => Promise<void>
  publishTask: (taskId: string) => Promise<void>
  toggleTaskCancelled: (taskId: string) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  assignTask: (taskId: string, volunteerId: string) => Promise<void>
  unassignTask: (taskId: string) => Promise<void>
  takeTask: (taskId: string, volunteerId: string) => Promise<void>
  releaseTask: (taskId: string, volunteerId: string) => Promise<void>
  completeTask: (taskId: string, volunteerId: string, resultingBedState?: 'READY' | 'OCCUPIED') => Promise<void>
  createVolunteer: (input: VolunteerDraftInput) => Promise<void>
  updateVolunteer: (userId: string, input: VolunteerDraftInput) => Promise<void>
  toggleVolunteer: (userId: string) => Promise<void>
  deleteVolunteer: (userId: string) => Promise<void>
  createCleaner: (input: CleanerDraftInput) => Promise<void>
  updateCleaner: (userId: string, input: CleanerDraftInput) => Promise<void>
  toggleCleaner: (userId: string) => Promise<void>
  deleteCleaner: (userId: string) => Promise<void>
  createCleaningArea: (name: string) => Promise<void>
  updateCleaningArea: (areaId: string, name: string) => Promise<void>
  toggleCleaningArea: (areaId: string) => Promise<void>
  deleteCleaningArea: (areaId: string) => Promise<void>
  createCleaningRoom: (input: { code: string; section: string; roomType: 'private' | 'shared'; bedCount: number }) => Promise<void>
  upsertCleaningPlaceStatus: (input: CleaningPlaceStatusDraftInput) => Promise<void>
  bulkCreateBedTasks: (input: {
    selections: BulkBedTaskSelection[]
    assignVolunteerId?: string
    label: string
    color: string
  }) => Promise<void>
  resolveBedConflict: (conflictId: string) => Promise<void>
  createCleaningTask: (input: CleaningTaskDraftInput) => Promise<void>
  updateCleaningTask: (taskId: string, input: CleaningTaskDraftInput) => Promise<void>
  publishCleaningTask: (taskId: string) => Promise<void>
  toggleCleaningTaskCancelled: (taskId: string) => Promise<void>
  deleteCleaningTask: (taskId: string) => Promise<void>
  assignCleaningTask: (taskId: string, cleanerId: string) => Promise<void>
  takeCleaningTask: (taskId: string) => Promise<void>
  releaseCleaningTask: (taskId: string) => Promise<void>
  completeCleaningTask: (taskId: string) => Promise<void>
  createReward: (input: RewardDraftInput) => Promise<void>
  updateReward: (rewardId: string, input: RewardDraftInput) => Promise<void>
  toggleReward: (rewardId: string) => Promise<void>
  deleteReward: (rewardId: string) => Promise<void>
  redeemReward: (rewardId: string, volunteerId: string) => Promise<void>
  createGroup: (input: TaskGroupDraftInput) => Promise<void>
  updateGroup: (groupId: string, input: TaskGroupDraftInput) => Promise<void>
  toggleGroup: (groupId: string) => Promise<void>
  deleteGroup: (groupId: string) => Promise<void>
  assignGroup: (groupId: string, volunteerId: string, startDate: string, durationDays?: number) => Promise<void>
  createRoutineTask: (input: RoutineTaskDraftInput) => Promise<void>
  updateRoutineTask: (routineTaskId: string, input: RoutineTaskDraftInput) => Promise<void>
  toggleRoutineTask: (routineTaskId: string) => Promise<void>
  deleteRoutineTask: (routineTaskId: string) => Promise<void>
  deleteRoutineAssignment: (assignmentId: string) => Promise<void>
  reassignRoutineAssignment: (assignmentId: string, volunteerId: string) => Promise<void>
  assignRoutineTask: (
    routineTaskId: string,
    volunteerId: string,
    startsOn: string,
    endsOn: string,
    weekdays: string[],
    startTime: string,
    endTime: string,
  ) => Promise<void>
  callVolunteersToOffice: (volunteerIds: string[]) => Promise<void>
  acknowledgeOfficeCall: (callId: string) => Promise<void>
  runScheduler: () => Promise<void>
  dismissToast: (toastId: string) => void
}

const SESSION_TOKEN_KEY = 'vip-management.access-token'
const SESSION_USER_KEY = 'vip-management.session-user'

const emptyServerState: ServerState = {
  users: [],
  tasks: [],
  groups: [],
  packAssignments: [],
  routineTasks: [],
  routineAssignments: [],
  taskHistory: [],
  cleaningAreas: [],
  cleaningPlaceStatuses: [],
  cleaningRooms: [],
  rewards: [],
  redemptions: [],
  activities: [],
  officeCalls: [],
  bedConflicts: [],
}

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`
const toApiEnum = (value?: string) => value?.replaceAll('-', '_').toUpperCase()

const readStoredSession = () => ({
  accessToken: window.localStorage.getItem(SESSION_TOKEN_KEY) ?? undefined,
  sessionUserId: window.localStorage.getItem(SESSION_USER_KEY) ?? undefined,
})

const persistSession = (accessToken?: string, sessionUserId?: string) => {
  if (accessToken) {
    window.localStorage.setItem(SESSION_TOKEN_KEY, accessToken)
  } else {
    window.localStorage.removeItem(SESSION_TOKEN_KEY)
  }

  if (sessionUserId) {
    window.localStorage.setItem(SESSION_USER_KEY, sessionUserId)
  } else {
    window.localStorage.removeItem(SESSION_USER_KEY)
  }
}

const addToast = (
  toasts: ToastItem[],
  title: string,
  message: string,
  tone: ToastItem['tone'] = 'success',
) => [...toasts, { id: uid('toast'), title, message, tone }]

const buildUserIndex = (tasks: Task[]) =>
  tasks.reduce<Record<string, string[]>>((accumulator, task) => {
    if (task.assignedTo && ['assigned', 'scheduled'].includes(task.status)) {
      accumulator[task.assignedTo] = [...(accumulator[task.assignedTo] ?? []), task.id]
    }

    return accumulator
  }, {})

const normalizeServerState = (payload: ServerState): ServerState => {
  const userTaskIndex = buildUserIndex(payload.tasks)

  return {
    ...payload,
    packAssignments: payload.packAssignments.map((assignment) => ({
      ...assignment,
      groupId:
        assignment.groupId ??
        (assignment as PackAssignment & { packId?: string }).packId ??
        '',
    })),
    users: payload.users.map((user) => ({
      ...user,
      password: user.password ?? '',
      activeTaskIds: userTaskIndex[user.id] ?? [],
    })),
  }
}

const mapTaskInput = (input: TaskDraftInput) => ({
  title: input.title,
  description: input.description,
  category: toApiEnum(input.category),
  priority: toApiEnum(input.priority),
  points: input.points,
  volunteerSlots: input.volunteerSlots ?? 1,
  notes: input.notes || undefined,
  publishAt: input.publishAt || undefined,
  startsAt: input.scheduledAt || undefined,
  endsAt: input.endsAt || undefined,
})

const mapVolunteerInput = (input: VolunteerDraftInput) => ({
  ...input,
  offDay: toApiEnum(input.offDay),
  badge: input.badge || undefined,
})

const mapCleanerInput = (input: CleanerDraftInput) => ({
  ...input,
  email: input.email || undefined,
})

const mapCleaningTaskInput = (input: CleaningTaskDraftInput) => ({
  title: input.title,
  description: input.description,
  category: toApiEnum(input.category),
  priority: toApiEnum(input.priority),
  notes: input.notes || undefined,
  publishAt: input.publishAt || undefined,
  startsAt: input.scheduledAt || undefined,
  endsAt: input.endsAt || undefined,
  cleaningLocationType: toApiEnum(input.cleaningLocationType),
  cleaningLocationLabel: input.cleaningLocationLabel,
  cleaningRoomNumber: input.cleaningRoomNumber || undefined,
  cleaningRoomCode: input.cleaningRoomCode || undefined,
  cleaningRoomSection: input.cleaningRoomSection || undefined,
})

const mapCleaningPlaceStatusInput = (input: CleaningPlaceStatusDraftInput) => ({
  placeType: toApiEnum(input.placeType),
  roomNumber: input.roomNumber || undefined,
  roomCode: input.roomCode || undefined,
  roomSection: input.roomSection || undefined,
  roomType: toApiEnum(input.roomType),
  cleaningAreaId: input.cleaningAreaId || undefined,
  placeLabel: input.placeLabel,
  label: input.label,
  color: input.color,
  beds: input.beds?.map((bed) => ({
    bedNumber: bed.bedNumber,
    label: bed.label,
    color: bed.color,
  })),
  assignCleanerId: input.assignCleanerId || undefined,
  assignVolunteerId: input.assignVolunteerId || undefined,
  applyVolunteerAssignment: input.applyVolunteerAssignment || undefined,
})

const mapGroupInput = (input: TaskGroupDraftInput) => ({
  ...input,
  templates: input.templates.map((template) => ({
    ...template,
    category: toApiEnum(template.category),
    priority: toApiEnum(template.priority),
  })),
})

const mapRoutineTaskInput = (input: RoutineTaskDraftInput) => ({
  ...input,
  category: toApiEnum(input.category),
  priority: toApiEnum(input.priority),
  notes: input.notes || undefined,
})

let initializePromise: Promise<void> | null = null

export const useAppStore = create<AppState>((set, get) => ({
  ...emptyServerState,
  toasts: [],
  ...readStoredSession(),
  isReady: false,
  isBootstrapping: false,

  initializeApp: async () => {
    if (initializePromise) {
      return initializePromise
    }

    initializePromise = (async () => {
      set({ isBootstrapping: true })

      try {
        if (get().accessToken) {
          await get().refreshState()
        }
      } catch (error) {
        set((state) => ({
          toasts: addToast(
            state.toasts,
            'Backend unavailable',
            error instanceof Error ? error.message : 'Could not connect to the API.',
            'warning',
          ),
        }))
      } finally {
        set({ isReady: true, isBootstrapping: false })
        initializePromise = null
      }
    })()

    return initializePromise
  },

  refreshState: async () => {
    const token = get().accessToken
    if (!token) return

    try {
      const payload = await apiRequest<ServerState>('/app-state', { token })
      set((state) => ({
        ...state,
        ...normalizeServerState(payload),
      }))
    } catch (error) {
      persistSession(undefined, undefined)
      set((state) => ({
        ...emptyServerState,
        accessToken: undefined,
        sessionUserId: undefined,
        toasts: addToast(
          state.toasts,
          'Session expired',
          error instanceof Error ? error.message : 'Please sign in again.',
          'warning',
        ),
      }))
    }
  },

  login: async (identifier, password) => {
    const payload = await apiRequest<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    })

    persistSession(payload.accessToken, payload.user.id)
    set({
      accessToken: payload.accessToken,
      sessionUserId: payload.user.id,
    })

    await get().refreshState()

    set((state) => ({
      toasts: addToast(state.toasts, 'Welcome back', `Signed in as ${payload.user.name}.`),
    }))
  },

  logout: () => {
    persistSession(undefined, undefined)
    set({
      ...emptyServerState,
      accessToken: undefined,
      sessionUserId: undefined,
    })
  },

  createTask: async (input) => {
    try {
      await apiRequest('/tasks', {
        method: 'POST',
        token: get().accessToken,
        body: mapTaskInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(
          state.toasts,
          'Task saved',
          input.publishAt
            ? 'The task will be published automatically at the selected time.'
            : 'The task is already visible to volunteers.',
        ),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not create task', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  updateTask: async (taskId, input) => {
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: 'PUT',
        token: get().accessToken,
        body: mapTaskInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Task updated', 'Changes were saved successfully.', 'info'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not update task', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  publishTask: async (taskId) => {
    await apiRequest(`/tasks/${taskId}/publish`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Task published', 'The dashboard updated in real time.'),
    }))
  },

  toggleTaskCancelled: async (taskId) => {
    await apiRequest(`/tasks/${taskId}/toggle-cancelled`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Status updated', 'The task availability changed.', 'warning'),
    }))
  },

  deleteTask: async (taskId) => {
    await apiRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Task deleted', 'The task was removed permanently.', 'warning'),
    }))
  },

  assignTask: async (taskId, volunteerId) => {
    await apiRequest(`/tasks/${taskId}/assign`, {
      method: 'POST',
      token: get().accessToken,
      body: { volunteerId },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Task assigned', 'The task was assigned to the selected volunteer.', 'info'),
    }))
  },

  unassignTask: async (taskId) => {
    await apiRequest(`/tasks/${taskId}/unassign`, {
      method: 'POST',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Assignment removed', 'The task was returned to the shared volunteer board.', 'info'),
    }))
  },

  takeTask: async (taskId) => {
    await apiRequest(`/tasks/${taskId}/claim`, {
      method: 'POST',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Task claimed', 'The task moved into My Tasks.'),
    }))
  },

  releaseTask: async (taskId) => {
    await apiRequest(`/tasks/${taskId}/release`, {
      method: 'POST',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Task released', 'This assignment is back on the shared board for another volunteer.', 'info'),
    }))
  },

  completeTask: async (taskId, _volunteerId, resultingBedState) => {
    await apiRequest(`/tasks/${taskId}/complete`, {
      method: 'POST',
      token: get().accessToken,
      body: resultingBedState ? { resultingBedState } : {},
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Task completed', 'Your points were credited successfully.'),
    }))
  },

  createVolunteer: async (input) => {
    try {
      await apiRequest('/volunteers', {
        method: 'POST',
        token: get().accessToken,
        body: mapVolunteerInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Volunteer created', 'The user now appears in the panel.'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not create volunteer', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
      throw error
    }
  },

  updateVolunteer: async (userId, input) => {
    try {
      await apiRequest(`/volunteers/${userId}`, {
        method: 'PUT',
        token: get().accessToken,
        body: mapVolunteerInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Volunteer updated', 'Changes were saved successfully.', 'info'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not update volunteer', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
      throw error
    }
  },

  toggleVolunteer: async (userId) => {
    await apiRequest(`/volunteers/${userId}/toggle-active`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Status updated', 'The volunteer status changed.', 'warning'),
    }))
  },

  deleteVolunteer: async (userId) => {
    await apiRequest(`/volunteers/${userId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Volunteer deleted', 'The volunteer and related admin records were removed.', 'warning'),
    }))
  },

  createCleaner: async (input) => {
    try {
      await apiRequest('/cleaners', {
        method: 'POST',
        token: get().accessToken,
        body: mapCleanerInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Cleaning staff created', 'The cleaner can now sign in with these credentials.'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not create cleaner', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  updateCleaner: async (userId, input) => {
    try {
      await apiRequest(`/cleaners/${userId}`, {
        method: 'PUT',
        token: get().accessToken,
        body: mapCleanerInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Cleaner updated', 'The cleaning staff profile is up to date.', 'info'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not update cleaner', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  toggleCleaner: async (userId) => {
    await apiRequest(`/cleaners/${userId}/toggle-active`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaner status updated', 'The cleaning staff availability changed.', 'warning'),
    }))
  },

  deleteCleaner: async (userId) => {
    await apiRequest(`/cleaners/${userId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaner deleted', 'The cleaner and related admin records were removed.', 'warning'),
    }))
  },

  createCleaningArea: async (name) => {
    await apiRequest('/cleaning-areas', {
      method: 'POST',
      token: get().accessToken,
      body: { name },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Location saved', 'The custom cleaning location is ready to use.'),
    }))
  },

  updateCleaningArea: async (areaId, name) => {
    await apiRequest(`/cleaning-areas/${areaId}`, {
      method: 'PUT',
      token: get().accessToken,
      body: { name },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Location updated', 'The cleaning location label was updated.', 'info'),
    }))
  },

  toggleCleaningArea: async (areaId) => {
    await apiRequest(`/cleaning-areas/${areaId}/toggle-active`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Location status updated', 'Its availability changed for future cleaning tasks.', 'warning'),
    }))
  },

  deleteCleaningArea: async (areaId) => {
    await apiRequest(`/cleaning-areas/${areaId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Location deleted', 'The custom place was removed.', 'warning'),
    }))
  },

  createCleaningRoom: async (input) => {
    await apiRequest('/cleaning-rooms', {
      method: 'POST',
      token: get().accessToken,
      body: {
        code: input.code,
        section: input.section,
        roomType: toApiEnum(input.roomType),
        bedCount: input.bedCount,
      },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Room added', 'The room now appears on the cleaning board.'),
    }))
  },

  upsertCleaningPlaceStatus: async (input) => {
    try {
      await apiRequest('/cleaning-place-statuses/upsert', {
        method: 'POST',
        token: get().accessToken,
        body: mapCleaningPlaceStatusInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Place status updated', 'The cleaning map reflects the new status color immediately.', 'info'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(
          state.toasts,
          'Could not update place status',
          error instanceof Error ? error.message : 'The room board update failed.',
          'warning',
        ),
      }))
    }
  },

  bulkCreateBedTasks: async (input) => {
    try {
      await apiRequest('/cleaning-place-statuses/bulk-bed-tasks', {
        method: 'POST',
        token: get().accessToken,
        body: {
          selections: input.selections.map((selection) => ({
            roomCode: selection.roomCode,
            roomSection: selection.roomSection,
            roomType: toApiEnum(selection.roomType),
            placeLabel: selection.placeLabel,
            bedNumbers: selection.bedNumbers,
          })),
          assignVolunteerId: input.assignVolunteerId || undefined,
          label: input.label,
          color: input.color,
        },
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(
          state.toasts,
          'Bed tasks created',
          input.assignVolunteerId
            ? 'The selected beds were assigned and split into individual volunteer tasks.'
            : 'The selected beds are now available as individual volunteer tasks.',
        ),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(
          state.toasts,
          'Could not create bed tasks',
          error instanceof Error ? error.message : 'The room board action failed.',
          'warning',
        ),
      }))
    }
  },

  resolveBedConflict: async (conflictId) => {
    await apiRequest(`/bed-conflicts/${conflictId}/resolve`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Conflict resolved', 'The bed conflict was removed from the active report.', 'info'),
    }))
  },

  createCleaningTask: async (input) => {
    try {
      await apiRequest('/cleaning-tasks', {
        method: 'POST',
        token: get().accessToken,
        body: mapCleaningTaskInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(
          state.toasts,
          'Cleaning task saved',
          input.publishAt
            ? 'The cleaning task will appear automatically at the selected time.'
            : 'The cleaning task is already visible to the cleaning team.',
        ),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not create cleaning task', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  updateCleaningTask: async (taskId, input) => {
    try {
      await apiRequest(`/cleaning-tasks/${taskId}`, {
        method: 'PUT',
        token: get().accessToken,
        body: mapCleaningTaskInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Cleaning task updated', 'Changes were saved successfully.', 'info'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not update cleaning task', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  publishCleaningTask: async (taskId) => {
    await apiRequest(`/cleaning-tasks/${taskId}/publish`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaning task published', 'The cleaning board updated in real time.'),
    }))
  },

  toggleCleaningTaskCancelled: async (taskId) => {
    await apiRequest(`/cleaning-tasks/${taskId}/toggle-cancelled`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaning task status updated', 'Task availability changed.', 'warning'),
    }))
  },

  deleteCleaningTask: async (taskId) => {
    await apiRequest(`/cleaning-tasks/${taskId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaning task deleted', 'The cleaning task was removed permanently.', 'warning'),
    }))
  },

  assignCleaningTask: async (taskId, cleanerId) => {
    await apiRequest(`/cleaning-tasks/${taskId}/assign`, {
      method: 'POST',
      token: get().accessToken,
      body: { cleanerId },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaning task assigned', 'The task was assigned to the selected cleaner.', 'info'),
    }))
  },

  takeCleaningTask: async (taskId) => {
    await apiRequest(`/cleaning-tasks/${taskId}/claim`, {
      method: 'POST',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaning task claimed', 'The task moved into today’s cleaning queue.'),
    }))
  },

  releaseCleaningTask: async (taskId) => {
    await apiRequest(`/cleaning-tasks/${taskId}/release`, {
      method: 'POST',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaning task released', 'The slot is back on the shared cleaning board.', 'info'),
    }))
  },

  completeCleaningTask: async (taskId) => {
    await apiRequest(`/cleaning-tasks/${taskId}/complete`, {
      method: 'POST',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Cleaning task completed', 'The completion was recorded in the cleaning history.'),
    }))
  },

  createReward: async (input) => {
    await apiRequest('/rewards', {
      method: 'POST',
      token: get().accessToken,
      body: input,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Reward created', 'It now appears in the catalog.'),
    }))
  },

  updateReward: async (rewardId, input) => {
    await apiRequest(`/rewards/${rewardId}`, {
      method: 'PUT',
      token: get().accessToken,
      body: input,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Reward updated', 'The catalog already reflects the changes.', 'info'),
    }))
  },

  toggleReward: async (rewardId) => {
    await apiRequest(`/rewards/${rewardId}/toggle-active`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Reward status', 'Its availability was updated.', 'warning'),
    }))
  },

  deleteReward: async (rewardId) => {
    await apiRequest(`/rewards/${rewardId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Reward deleted', 'The reward was removed from the catalog.', 'warning'),
    }))
  },

  redeemReward: async (rewardId) => {
    await apiRequest(`/rewards/${rewardId}/redeem`, {
      method: 'POST',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Reward redeemed', 'The reward was taken instantly and the stock was updated.'),
    }))
  },

  createGroup: async (input) => {
    try {
      await apiRequest('/packs', {
        method: 'POST',
        token: get().accessToken,
        body: mapGroupInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Pack created', 'This pack can now be reused for future seasons.'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not create pack', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  updateGroup: async (groupId, input) => {
    try {
      await apiRequest(`/packs/${groupId}`, {
        method: 'PUT',
        token: get().accessToken,
        body: mapGroupInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Pack updated', 'The template is now up to date.', 'info'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not update pack', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  toggleGroup: async (groupId) => {
    await apiRequest(`/packs/${groupId}/toggle-active`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Pack status', 'The pack availability changed.', 'warning'),
    }))
  },

  deleteGroup: async (groupId) => {
    await apiRequest(`/packs/${groupId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Pack deleted', 'The pack and its generated assignments were removed.', 'warning'),
    }))
  },

  assignGroup: async (groupId, volunteerId, startDate, durationDays) => {
    await apiRequest(`/packs/${groupId}/assign`, {
      method: 'POST',
      token: get().accessToken,
      body: {
        volunteerId,
        startDate,
        durationDays: durationDays || undefined,
      },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Pack assigned', 'The volunteer schedule was updated instantly.'),
    }))
  },

  createRoutineTask: async (input) => {
    try {
      await apiRequest('/routine-tasks', {
        method: 'POST',
        token: get().accessToken,
        body: mapRoutineTaskInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Standard task saved', 'It is now available for weekly assignment.'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not create standard task', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  updateRoutineTask: async (routineTaskId, input) => {
    try {
      await apiRequest(`/routine-tasks/${routineTaskId}`, {
        method: 'PUT',
        token: get().accessToken,
        body: mapRoutineTaskInput(input),
      })
      await get().refreshState()
      set((state) => ({
        toasts: addToast(state.toasts, 'Standard task updated', 'The recurring task library is up to date.', 'info'),
      }))
    } catch (error) {
      set((state) => ({
        toasts: addToast(state.toasts, 'Could not update standard task', error instanceof Error ? error.message : 'Validation failed.', 'warning'),
      }))
    }
  },

  toggleRoutineTask: async (routineTaskId) => {
    await apiRequest(`/routine-tasks/${routineTaskId}/toggle-active`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Standard task status', 'Its weekly availability changed.', 'warning'),
    }))
  },

  deleteRoutineTask: async (routineTaskId) => {
    await apiRequest(`/routine-tasks/${routineTaskId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Recurring task deleted', 'The recurring template and its generated entries were removed.', 'warning'),
    }))
  },

  deleteRoutineAssignment: async (assignmentId) => {
    await apiRequest(`/routine-tasks/assignments/${assignmentId}`, {
      method: 'DELETE',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Recurring assignment removed', 'The assignment and its generated task slots were deleted.', 'warning'),
    }))
  },

  reassignRoutineAssignment: async (assignmentId, volunteerId) => {
    await apiRequest(`/routine-tasks/assignments/${assignmentId}/reassign`, {
      method: 'PATCH',
      token: get().accessToken,
      body: { volunteerId },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Recurring assignment reassigned', 'The recurring schedule now belongs to the selected volunteer.', 'info'),
    }))
  },

  assignRoutineTask: async (routineTaskId, volunteerId, startsOn, endsOn, weekdays, startTime, endTime) => {
    await apiRequest(`/routine-tasks/${routineTaskId}/assign`, {
      method: 'POST',
      token: get().accessToken,
      body: {
        volunteerId,
        startsOn,
        endsOn,
        weekdays: weekdays.map((weekday) => toApiEnum(weekday)),
        startTime,
        endTime,
      },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Recurring task assigned', 'The volunteer schedule now includes the selected recurring dates.'),
    }))
  },

  callVolunteersToOffice: async (volunteerIds) => {
    await apiRequest('/office-calls', {
      method: 'POST',
      token: get().accessToken,
      body: { volunteerIds },
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(
        state.toasts,
        'Office call sent',
        volunteerIds.length === 1
          ? 'The volunteer received the office call.'
          : 'The selected volunteers received the office call.',
        'info',
      ),
    }))
  },

  acknowledgeOfficeCall: async (callId) => {
    await apiRequest(`/office-calls/${callId}/acknowledge`, {
      method: 'PATCH',
      token: get().accessToken,
    })
    await get().refreshState()
    set((state) => ({
      toasts: addToast(state.toasts, 'Office call acknowledged', 'The office notice was cleared.', 'info'),
    }))
  },

  runScheduler: async () => {
    if (!get().accessToken) return
    await get().refreshState()
  },

  dismissToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    })),
}))

export const useSessionUser = () => {
  const users = useAppStore((state) => state.users)
  const sessionUserId = useAppStore((state) => state.sessionUserId)

  return useMemo(() => users.find((user) => user.id === sessionUserId), [sessionUserId, users])
}

export const useVolunteerUsers = () => {
  const users = useAppStore((state) => state.users)

  return useMemo(() => users.filter((user) => user.role === 'volunteer'), [users])
}

export const useCleanerUsers = () => {
  const users = useAppStore((state) => state.users)

  return useMemo(() => users.filter((user) => user.role === 'cleaner'), [users])
}

export const useRoutineTaskTemplates = () => {
  const routineTasks = useAppStore((state) => state.routineTasks)

  return useMemo(() => routineTasks, [routineTasks])
}

export const useTaskTemplates = () => {
  const groups = useAppStore((state) => state.groups)

  return useMemo(
    () =>
      groups.flatMap((group) =>
        group.templates.map((template) => ({
          ...template,
          groupName: group.name,
        })),
      ),
    [groups],
  )
}

export const emptyTemplateTask = (): TaskGroupTemplate => ({
  id: uid('tpl'),
  title: '',
  description: '',
  category: 'housekeeping',
  startTime: '08:00',
  endTime: '10:00',
  dayOffset: 1,
  points: 10,
  priority: 'medium',
})
