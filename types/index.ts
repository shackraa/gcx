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

// Resume (CV) definition
export interface Resume {
  _id: string
  _creationTime: number
  userId: string
  name: string
  category: string
  targetRole?: string
  fileUrl?: string
  skills: string[]
  summary?: string
  rawText?: string
  isDefault: boolean
}

// Form values for Resume create/edit modal
export interface ResumeFormValues {
  name: string
  category: string
  targetRole?: string
  fileUrl?: string
  skills: string[]
  summary?: string
  rawText?: string
  isDefault: boolean
}

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
  resumeId?: string        // Linked Resume ID
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
  resumeId?: string
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

// View mode - list, kanban, resumes, analytics, jobs (Radar)
export type ViewMode = 'list' | 'kanban' | 'resumes' | 'analytics' | 'jobs'

// Workplace type for job filtering (Onsite / Fiziksel, Hybrid, Remote, All)
export type WorkplaceType = 'all' | 'onsite' | 'hybrid' | 'remote'

// Date posted filter for job radar
export type DatePosted = 'all' | 'past_24h' | 'past_week' | 'past_month'

// Matched Job Definition
export interface MatchedJob {
  id: string
  title: string
  company: string
  location: string
  workplaceType: 'onsite' | 'hybrid' | 'remote'
  postedDate?: string
  url: string
  source: 'linkedin' | 'indeed' | 'kariyer' | 'other'
  matchScore: number // 0 - 100
  matchingSkills: string[]
  missingSkills: string[]
  recommendedResumeId?: string
  recommendedResumeName?: string
  reason: string
}

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
  byResume: { name: string; count: number; respondedCount: number }[]
  responseRate: number
  avgResponseDays: number | null
}

// JSON backup format
export interface BackupData {
  version: string
  exportedAt: string
  applications: Partial<Application>[]
  resumes?: Partial<Resume>[]
}

