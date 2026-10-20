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
  storageId?: string
  fileName?: string
  fileSize?: number
  downloadUrl?: string | null
  skills?: string[]
  summary?: string
  coverLetter?: string
  coverLetterEn?: string
  rawText?: string
  isDefault: boolean
  updatedAt?: number
}

// Form values for Resume create/edit modal
export interface ResumeFormValues {
  name: string
  category: string
  targetRole?: string
  fileUrl?: string
  storageId?: string
  fileName?: string
  fileSize?: number
  coverLetter?: string
  coverLetterEn?: string
  skills?: string[]
  summary?: string
  rawText?: string
  isDefault: boolean
  updatedAt?: number
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
  lastEmailScanAt?: number
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

// View mode - list, kanban, resumes, studio (CV Oluşturucu & Hafıza), analytics, jobs (Radar), programs (Staj & Kurumsal İlanlar)
export type ViewMode = 'list' | 'kanban' | 'resumes' | 'studio' | 'analytics' | 'jobs' | 'programs'

export type ProgramSource = 'youthall' | 'microfon' | 'anbean' | 'techcareer' | 'toptalent' | 'university'
export type ProgramCategory =
  | 'intern'
  | 'fellowship'
  | 'scholarship'
  | 'talent_program'
  | 'bootcamp'
  | 'new_grad'
  | 'opportunity'
  | 'corporate'

export interface CorporateProgramItem {
  id: string
  title: string
  company: string
  companyLogo?: string
  coverImage?: string
  description: string
  category: ProgramCategory
  badgeLabel: string
  source: ProgramSource
  location: string
  deadline?: string
  amount?: string
  isOpen?: boolean
  url: string
}

// Career Memory Source Type
export type CareerSourceType =
  | 'cv'
  | 'motivation_letter'
  | 'fellowship'
  | 'project_note'
  | 'certificate'
  | 'other'

export interface CareerSource {
  _id: string
  _creationTime: number
  userId: string
  title: string
  sourceType: CareerSourceType
  rawContent: string
  extractedSummary?: string
  extractedHighlights?: string[]
  fileName?: string
  fileSize?: number
  storageId?: string
  downloadUrl?: string | null
  createdAt: number
}

export type HarvardTemplateId = 'harvard' | 'jakes' | 'mckinsey' | 'academic'

export interface HarvardCVData {
  fullName: string
  title?: string
  contact: {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    portfolio?: string
  }
  summary?: string
  education: Array<{
    institution: string
    degree: string
    location?: string
    date: string
    gpaOrHonors?: string
    details?: string[]
  }>
  experience: Array<{
    company: string
    role: string
    location?: string
    date: string
    bullets: string[]
  }>
  projects: Array<{
    name: string
    roleOrTech?: string
    link?: string
    date?: string
    bullets: string[]
  }>
  leadershipAndFellowships?: Array<{
    organization: string
    role: string
    date: string
    bullets: string[]
  }>
  skills: {
    technical?: string[]
    tools?: string[]
    languages?: string[]
    domains?: string[]
  }
  awardsAndCertifications?: string[]
}

export interface GeneratedCV {
  _id: string
  _creationTime: number
  userId: string
  targetCompany: string
  targetRole: string
  jobUrl?: string
  jobDescription?: string
  templateId: HarvardTemplateId
  language: 'tr' | 'en'
  atsScoreBefore: number
  atsScoreAfter: number
  matchedKeywords: string[]
  selectedSources: string[]
  cvData: HarvardCVData
  coverLetter: string
  fellowshipAnswers?: Array<{
    question: string
    answer: string
  }>
  createdAt: number
}

// Workplace type for job filtering (Onsite / Fiziksel, Hybrid, Remote, All)
export type WorkplaceType = 'all' | 'onsite' | 'hybrid' | 'remote'

// Experience level filter for job radar (Auto from CV, Intern, Junior, Mid, Senior, All)
export type ExperienceLevel = 'auto' | 'intern' | 'junior' | 'mid' | 'senior' | 'all'

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


