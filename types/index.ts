// Application status values
export type ApplicationStatus =
  | 'preparing'
  | 'waiting'
  | 'responded'
  | 'interview'
  | 'offer'
  | 'rejected'

// Application channel values
export type ApplicationChannel =
  | 'online'
  | 'email'
  | 'referral'
  | 'form'
  | 'linkedin'

// Core application type matching Convex schema
export interface Application {
  _id: string
  _creationTime: number
  userId: string
  company: string
  position: string
  status: ApplicationStatus
  appliedAt?: string       // ISO date string YYYY-MM-DD
  interviewAt?: string     // ISO datetime string
  offerDeadline?: string   // ISO date string YYYY-MM-DD
  channel?: ApplicationChannel
  cvVersion?: string
  cvLink?: string
  jobLink?: string
  contactName?: string
  salary?: string
  hrContacted: boolean
  note?: string
  followUpSentAt?: string
}

// Form values for create/edit modal
export interface ApplicationFormValues {
  company: string
  position: string
  status: ApplicationStatus
  appliedAt?: string
  interviewAt?: string
  offerDeadline?: string
  channel?: ApplicationChannel
  cvVersion?: string
  cvLink?: string
  jobLink?: string
  contactName?: string
  salary?: string
  hrContacted: boolean
  note?: string
}

// User settings in Convex
export interface UserSettings {
  _id?: string
  userId?: string
  weeklyGoal: number
  overdueDays: number
  emailReminders: boolean
}

// Filter tab keys
export type FilterKey =
  | 'all'
  | 'overdue'
  | 'preparing'
  | 'waiting'
  | 'responded'
  | 'interview'
  | 'offer'
  | 'rejected'

// View mode
export type ViewMode = 'list' | 'kanban' | 'analytics'

// Stats summary
export interface AppStats {
  total: number
  active: number   // waiting + responded + interview
  overdue: number  // waiting + 14+ days
  interview: number
  offer: number
}

// Analytics data
export interface AnalyticsData {
  byStatus: { status: ApplicationStatus; count: number }[]
  byChannel: { channel: string; count: number }[]
  byWeek: { week: string; count: number }[]
  responseRate: number
  avgResponseDays: number | null
}

// JSON backup format
export interface BackupData {
  version: string
  exportedAt: string
  applications: Partial<Application>[]
}
