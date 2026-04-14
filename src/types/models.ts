export type UserRole = 'admin' | 'volunteer' | 'cleaner'

export type TaskStatus =
  | 'draft'
  | 'scheduled'
  | 'available'
  | 'assigned'
  | 'completed'
  | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskCategory =
  | 'housekeeping'
  | 'reception'
  | 'kitchen'
  | 'maintenance'
  | 'events'
  | 'guest-care'
export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'
export type TaskAudience = 'volunteer' | 'cleaning'
export type CleaningLocationType = 'room' | 'custom'
export type RoomType = 'private' | 'shared'
export type BedState = 'ready' | 'needs-making' | 'check' | 'occupied'

export interface BedStatus {
  bedNumber: number
  label: string
  color: string
}

export interface User {
  id: string
  role: UserRole
  name: string
  email?: string
  username: string
  password: string
  avatar: string
  title: string
  isActive: boolean
  points: number
  lifetimePoints: number
  completedTasks: number
  activeTaskIds: string[]
  badge?: string
  shift?: string
  offDay?: Weekday
}

export interface Task {
  id: string
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  audience: TaskAudience
  points: number
  publishedAt: string
  scheduledAt?: string
  endsAt?: string
  assignedTo?: string
  lastAssignedTo?: string
  createdBy: string
  notes?: string
  source: 'manual' | 'pack' | 'routine'
  packId?: string
  packAssignmentId?: string
  routineTemplateId?: string
  routineAssignmentId?: string
  cleaningLocationType?: CleaningLocationType
  cleaningLocationLabel?: string
  cleaningRoomNumber?: number
  cleaningRoomCode?: string
  cleaningRoomSection?: string
  cleaningBedNumber?: number
  bedTask?: boolean
}

export interface CleaningArea {
  id: string
  name: string
  isActive: boolean
}

export interface CleaningRoom {
  id: string
  code: string
  section: string
  label: string
  roomType: RoomType
  bedCount: number
  isActive: boolean
}

export interface CleaningPlaceStatus {
  id: string
  placeType: CleaningLocationType
  roomNumber?: number
  roomCode?: string
  roomSection?: string
  roomType?: RoomType
  cleaningAreaId?: string
  placeLabel: string
  label: string
  color: string
  roomServiceLabel?: string
  roomServiceColor?: string
  beds: BedStatus[]
}

export interface TaskGroupTemplate {
  id: string
  title: string
  description: string
  category: TaskCategory
  startTime: string
  endTime: string
  dayOffset: number
  points: number
  priority: TaskPriority
}

export interface TaskGroup {
  id: string
  name: string
  description: string
  durationDays: number
  isActive: boolean
  templates: TaskGroupTemplate[]
}

export interface PackAssignment {
  id: string
  groupId: string
  volunteerId: string
  startDate: string
  endDate: string
  createdAt: string
}

export interface RoutineTaskTemplate {
  id: string
  name: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  points: number
  isActive: boolean
  notes?: string
}

export interface RoutineTaskAssignment {
  id: string
  templateId: string
  volunteerId: string
  startsOn: string
  endsOn: string
  weekdays: Weekday[]
  startTime: string
  endTime: string
  createdAt: string
}

export interface TaskCompletionRecord {
  id: string
  taskId: string
  volunteerId: string
  completedAt: string
  points: number
  source: Task['source']
  routineTemplateId?: string
  packId?: string
}

export interface Reward {
  id: string
  name: string
  description: string
  cost: number
  category: string
  isActive: boolean
  stock?: number
  icon: string
}

export interface Redemption {
  id: string
  rewardId: string
  volunteerId: string
  createdAt: string
  cost: number
  status: 'completed'
}

export interface ActivityItem {
  id: string
  type:
    | 'task-created'
    | 'task-published'
    | 'task-taken'
    | 'task-released'
    | 'task-completed'
    | 'reward-redeemed'
    | 'pack-assigned'
    | 'routine-assigned'
    | 'volunteer-updated'
  title: string
  description: string
  createdAt: string
}

export interface ToastItem {
  id: string
  title: string
  message: string
  tone: 'success' | 'info' | 'warning'
}

export interface TaskDraftInput {
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  points: number
  notes?: string
  publishAt?: string
  scheduledAt?: string
  endsAt?: string
}

export interface CleaningTaskDraftInput {
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  notes?: string
  publishAt?: string
  scheduledAt?: string
  endsAt?: string
  cleaningLocationType: CleaningLocationType
  cleaningLocationLabel: string
  cleaningRoomNumber?: number
  cleaningRoomCode?: string
  cleaningRoomSection?: string
}

export interface VolunteerDraftInput {
  name: string
  email?: string
  username: string
  password: string
  title: string
  shift: string
  offDay: Weekday
  badge?: string
}

export interface CleanerDraftInput {
  name: string
  email?: string
  username: string
  password: string
  title: string
  shift: string
}

export interface CleaningPlaceStatusDraftInput {
  placeType: CleaningLocationType
  roomNumber?: number
  roomCode?: string
  roomSection?: string
  roomType?: RoomType
  cleaningAreaId?: string
  placeLabel: string
  label: string
  color: string
  beds?: BedStatus[]
  assignCleanerId?: string
  assignVolunteerId?: string
  applyVolunteerAssignment?: boolean
}

export interface BulkBedTaskSelection {
  roomCode: string
  roomSection: string
  roomType: RoomType
  placeLabel: string
  bedNumbers: number[]
}

export interface RewardDraftInput {
  name: string
  description: string
  cost: number
  category: string
  icon: string
  stock?: number
}

export interface TaskGroupDraftInput {
  name: string
  description: string
  durationDays: number
  templates: TaskGroupTemplate[]
}

export interface RoutineTaskDraftInput {
  name: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  points: number
  notes?: string
}
