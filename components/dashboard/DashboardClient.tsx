'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUIStore } from '@/lib/store/ui'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { UpcomingInterviews } from '@/components/dashboard/UpcomingInterviews'
import { WeeklyGoal } from '@/components/dashboard/WeeklyGoal'
import { FilterTabs } from '@/components/dashboard/FilterTabs'
import { ApplicationList } from '@/components/applications/ApplicationList'
import { KanbanBoard } from '@/components/applications/KanbanBoard'
import { AnalyticsView } from '@/components/analytics/AnalyticsView'
import { ApplicationFormModal } from '@/components/applications/ApplicationFormModal'
import { ViewToggle } from '@/components/dashboard/ViewToggle'
import { SearchAndFilters } from '@/components/dashboard/SearchAndFilters'
import { filterApplications, computeStats, getUpcomingInterviews, getThisWeekApps } from '@/lib/utils/applications'
import type { Application } from '@/types'
import { Loader2 } from 'lucide-react'

export function DashboardClient() {
  const applications = useQuery(api.applications.list) as Application[] | undefined
  const settings = useQuery(api.settings.get)
  const { filter, search, channelFilter, view, modalOpen } = useUIStore()

  if (applications === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Başvurular yükleniyor…</p>
      </div>
    )
  }

  const overdueDays = settings?.overdueDays ?? 14
  const weeklyGoal = settings?.weeklyGoal ?? 5

  const stats = computeStats(applications, overdueDays)
  const upcomingInterviews = getUpcomingInterviews(applications)
  const thisWeekApps = getThisWeekApps(applications)
  const filteredApps = filterApplications(applications, filter, search, channelFilter, overdueDays)

  return (
    <>
      {/* Stats */}
      <StatsCards stats={stats} overdueDays={overdueDays} />

      {/* Upcoming interviews */}
      {upcomingInterviews.length > 0 && (
        <UpcomingInterviews interviews={upcomingInterviews} />
      )}

      {/* Weekly goal */}
      <WeeklyGoal
        current={thisWeekApps.length}
        goal={weeklyGoal}
      />

      {/* Controls */}
      <div className="space-y-3 mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <FilterTabs applications={applications} overdueDays={overdueDays} />
          <div className="ml-auto flex items-center gap-2">
            <SearchAndFilters />
            <ViewToggle />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mt-4">
        {view === 'list' && (
          <ApplicationList
            applications={filteredApps}
            overdueDays={overdueDays}
          />
        )}
        {view === 'kanban' && (
          <KanbanBoard
            applications={applications}
            search={search}
          />
        )}
        {view === 'analytics' && (
          <AnalyticsView
            applications={applications}
            overdueDays={overdueDays}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && <ApplicationFormModal applications={applications} />}
    </>
  )
}
