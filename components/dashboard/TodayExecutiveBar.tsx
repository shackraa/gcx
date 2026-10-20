'use client'

import type { Application } from '@/types'
import { isOverdue, getUpcomingInterviews, getThisWeekApps } from '@/lib/utils/applications'
import { useUIStore } from '@/lib/store/ui'
import { Clock, Calendar, Target, ArrowRight } from 'lucide-react'

interface TodayExecutiveBarProps {
  applications: Application[]
  overdueDays?: number
  weeklyGoal?: number
}

export function TodayExecutiveBar({
  applications,
  overdueDays = 14,
  weeklyGoal = 5,
}: TodayExecutiveBarProps) {
  const { setFilter, setView } = useUIStore()

  const overdueApps = applications.filter((a) => isOverdue(a, overdueDays))
  const upcomingInterviews = getUpcomingInterviews(applications)
  const thisWeekApps = getThisWeekApps(applications)

  // Gösterilecek bir şey yoksa yer kaplamasın
  const hasActions = overdueApps.length > 0 || upcomingInterviews.length > 0 || thisWeekApps.length < weeklyGoal
  if (!hasActions && applications.length > 0) return null

  return (
    <div className="bg-muted/40 border border-border/70 rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-foreground font-semibold">Bugünün Odak Noktaları:</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {/* Sessiz başvurular */}
        {overdueApps.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setFilter('overdue')
              setView('list')
            }}
            className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{overdueApps.length} başvuru 14+ gündür sessiz</span>
          </button>
        ) : (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 opacity-60" />
            <span>Sessiz bekleyen yok</span>
          </span>
        )}

        <span className="text-muted-foreground/30 hidden sm:inline">•</span>

        {/* Yaklaşan mülakatlar */}
        {upcomingInterviews.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setFilter('interview')
              setView('list')
            }}
            className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{upcomingInterviews.length} mülakat bu hafta</span>
          </button>
        ) : (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 opacity-60" />
            <span>Yakın mülakat yok</span>
          </span>
        )}

        <span className="text-muted-foreground/30 hidden sm:inline">•</span>

        {/* Haftalık hedef */}
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Target className="h-3.5 w-3.5 text-primary" />
          <span>
            Haftalık tempo:{' '}
            <strong className="text-foreground font-semibold">
              {thisWeekApps.length} / {weeklyGoal}
            </strong>
          </span>
        </span>
      </div>
    </div>
  )
}
