import {
  differenceInDays,
  formatDistanceToNow,
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  subWeeks,
  isAfter,
  isBefore,
  addDays,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { Application, ApplicationStatus, AppStats, FilterKey, Resume } from '@/types'

export const OVERDUE_DAYS = 14

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  preparing: 'Hazırlanıyor',
  waiting: 'Bekleniyor',
  responded: 'Dönüş aldı',
  interview: 'Mülakat',
  offer: 'Teklif',
  rejected: 'Reddedildi',
}

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  preparing: 'bg-zinc-700 text-zinc-200',
  waiting: 'bg-blue-900 text-blue-200',
  responded: 'bg-purple-900 text-purple-200',
  interview: 'bg-amber-900 text-amber-200',
  offer: 'bg-green-900 text-green-200',
  rejected: 'bg-red-900 text-red-300',
}

export const STATUS_BADGE_COLORS: Record<ApplicationStatus, string> = {
  preparing: 'border-zinc-600',
  waiting: 'border-blue-700',
  responded: 'border-purple-700',
  interview: 'border-amber-600',
  offer: 'border-green-600',
  rejected: 'border-red-700',
}

export const CHANNEL_LABELS: Record<string, string> = {
  online: 'Online ilan',
  email: 'E-posta',
  referral: 'Referans',
  form: 'Form',
  linkedin: 'LinkedIn',
}

// Check if an application is overdue (waiting + 14+ days)
export function isOverdue(app: Application, overdueDays = OVERDUE_DAYS): boolean {
  if (app.status !== 'waiting' || !app.appliedAt) return false
  const days = differenceInDays(new Date(), parseISO(app.appliedAt))
  return days >= overdueDays
}

// Days since applied
export function daysSinceApplied(app: Application): number | null {
  if (!app.appliedAt) return null
  return differenceInDays(new Date(), parseISO(app.appliedAt))
}

// Days until interview
export function daysUntilInterview(app: Application): number | null {
  if (!app.interviewAt) return null
  return differenceInDays(parseISO(app.interviewAt), new Date())
}

// Format date to Turkish locale
export function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null
  try {
    return format(parseISO(dateStr), 'd MMM yyyy', { locale: tr })
  } catch {
    return null
  }
}

// Format relative time
export function formatRelative(dateStr?: string | null): string | null {
  if (!dateStr) return null
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale: tr })
  } catch {
    return null
  }
}

// Sort order for statuses (lower = higher priority)
const STATUS_SORT_ORDER: Record<string, number> = {
  overdue: 0,
  interview: 1,
  responded: 2,
  waiting: 3,
  preparing: 4,
  offer: 5,
  rejected: 6,
}

function getSortKey(app: Application, overdueDays = OVERDUE_DAYS): number {
  if (isOverdue(app, overdueDays)) return STATUS_SORT_ORDER.overdue
  return STATUS_SORT_ORDER[app.status] ?? 7
}

// Sort applications: overdue first, then by status, then by date
export function sortApplications(apps: Application[], overdueDays = OVERDUE_DAYS): Application[] {
  return [...apps].sort((a, b) => {
    const ka = getSortKey(a, overdueDays)
    const kb = getSortKey(b, overdueDays)
    if (ka !== kb) return ka - kb

    // Within overdue group: oldest first (been waiting longest)
    if (ka === 0) {
      if (a.appliedAt && b.appliedAt)
        return parseISO(a.appliedAt).getTime() - parseISO(b.appliedAt).getTime()
    }

    // Within interview group: soonest interview first
    if (ka === 1) {
      if (a.interviewAt && b.interviewAt)
        return parseISO(a.interviewAt).getTime() - parseISO(b.interviewAt).getTime()
    }

    // Default: newest appliedAt first
    if (a.appliedAt && b.appliedAt)
      return parseISO(b.appliedAt).getTime() - parseISO(a.appliedAt).getTime()

    return (b._creationTime || 0) - (a._creationTime || 0)
  })
}

// Filter applications by active filter key, search, channel, and resume
export function filterApplications(
  apps: Application[],
  filter: FilterKey,
  search: string,
  channelFilter: string,
  overdueDays = OVERDUE_DAYS,
  resumeFilter = 'all'
): Application[] {
  let result = [...apps]

  // Status / overdue filter
  if (filter === 'overdue') {
    result = result.filter((a) => isOverdue(a, overdueDays))
  } else if (filter !== 'all') {
    result = result.filter((a) => a.status === filter)
  }

  // Channel filter
  if (channelFilter && channelFilter !== 'all') {
    result = result.filter((a) => a.channel === channelFilter)
  }

  // Resume filter
  if (resumeFilter && resumeFilter !== 'all') {
    result = result.filter((a) => a.resumeId === resumeFilter)
  }

  // Text search
  if (search.trim()) {
    const q = search.toLowerCase().trim()
    result = result.filter(
      (a) =>
        a.company.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q) ||
        (a.cvVersion && a.cvVersion.toLowerCase().includes(q))
    )
  }

  return sortApplications(result, overdueDays)
}

// Compute stats cards data
export function computeStats(apps: Application[], overdueDays = OVERDUE_DAYS): AppStats {
  return {
    total: apps.length,
    active: apps.filter((a) =>
      ['waiting', 'responded', 'interview'].includes(a.status)
    ).length,
    overdue: apps.filter((a) => isOverdue(a, overdueDays)).length,
    interview: apps.filter((a) => a.status === 'interview').length,
    offer: apps.filter((a) => a.status === 'offer').length,
  }
}

// Get upcoming interviews (within next 7 days)
export function getUpcomingInterviews(apps: Application[]): Application[] {
  const now = new Date()
  const inSevenDays = addDays(now, 7)
  const yesterday = addDays(now, -1)

  return apps
    .filter((a) => {
      if (!a.interviewAt) return false
      const d = parseISO(a.interviewAt)
      return isAfter(d, yesterday) && isBefore(d, inSevenDays)
    })
    .sort((a, b) =>
      parseISO(a.interviewAt!).getTime() - parseISO(b.interviewAt!).getTime()
    )
}

// Get applications applied this week
export function getThisWeekApps(apps: Application[]): Application[] {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  return apps.filter(
    (a) => a.appliedAt && isAfter(parseISO(a.appliedAt), start)
  )
}

// Get weekly counts for last N weeks (for analytics chart)
export function getWeeklyData(
  apps: Application[],
  numWeeks = 8
): { week: string; count: number }[] {
  const result = []
  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const count = apps.filter((a) => {
      if (!a.appliedAt) return false
      const d = parseISO(a.appliedAt)
      return isAfter(d, weekStart) && isBefore(d, weekEnd)
    }).length
    result.push({
      week: format(weekStart, 'MMM d', { locale: tr }),
      count,
    })
  }
  return result
}

// Get performance stats per resume
export function getResumeStats(
  apps: Application[],
  resumes: Resume[]
): { resume: Resume; count: number; respondedCount: number; responseRate: number }[] {
  return resumes.map((resume) => {
    const matchedApps = apps.filter((a) => a.resumeId === resume._id)
    const respondedApps = matchedApps.filter((a) =>
      ['responded', 'interview', 'offer'].includes(a.status)
    )
    const count = matchedApps.length
    const respondedCount = respondedApps.length
    const responseRate = count > 0 ? Math.round((respondedCount / count) * 100) : 0

    return {
      resume,
      count,
      respondedCount,
      responseRate,
    }
  })
}

// Generate follow-up email template
export function generateFollowUpTemplate(app: Application): string {
  const dateStr = app.appliedAt ? formatDate(app.appliedAt) : 'belirtilen tarihte'
  return `Merhaba${app.contactName ? ' ' + app.contactName : ''},

${dateStr} tarihinde ${app.position} pozisyonuna başvurmuştum. Süreç hakkında bilgi alabilir miyim?

İyi çalışmalar.`
}

// Safe URL check
export function safeUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

// Format file size in bytes to human-readable string (KB, MB)
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
