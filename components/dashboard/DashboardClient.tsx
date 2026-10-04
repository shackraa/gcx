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
import { JobRadarView } from '@/components/jobs/JobRadarView'
import { ApplicationFormModal } from '@/components/applications/ApplicationFormModal'
import { ResumeList } from '@/components/resumes/ResumeList'
import { ResumeFormModal } from '@/components/resumes/ResumeFormModal'
import { ViewToggle } from '@/components/dashboard/ViewToggle'
import { SearchAndFilters } from '@/components/dashboard/SearchAndFilters'
import { filterApplications, computeStats, getUpcomingInterviews, getThisWeekApps } from '@/lib/utils/applications'
import type { Application, Resume } from '@/types'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DashboardClient() {
  const applications = useQuery(api.applications.list) as Application[] | undefined
  const resumes = useQuery(api.resumes.list) as Resume[] | undefined
  const settings = useQuery(api.settings.get)
  const { filter, search, channelFilter, resumeFilter, view, modalOpen, resumeModalOpen } = useUIStore()

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
  const filteredApps = filterApplications(applications, filter, search, channelFilter, overdueDays, resumeFilter)

  const isApplicationsView = view === 'list' || view === 'kanban'

  return (
    <>
      {isApplicationsView && (
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
          <div className="space-y-2.5 mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="order-2 sm:order-1 overflow-hidden min-w-0">
                <FilterTabs applications={applications} overdueDays={overdueDays} />
              </div>
              <div className="order-1 sm:order-2 flex items-center justify-between sm:justify-end gap-2 shrink-0">
                <SearchAndFilters />
                <ViewToggle />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className={cn(isApplicationsView ? 'mt-4' : 'mt-2')}>
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
        {view === 'resumes' && (
          <ResumeList
            resumes={resumes ?? []}
            applications={applications}
          />
        )}
        {view === 'jobs' && (
          <JobRadarView
            resumes={resumes ?? []}
            applications={applications}
          />
        )}
        {view === 'analytics' && (
          <AnalyticsView
            applications={applications}
            resumes={resumes ?? []}
            overdueDays={overdueDays}
          />
        )}
      </div>

      {/* Add/Edit Application Modal */}
      {modalOpen && <ApplicationFormModal applications={applications} />}

      {/* Add/Edit Resume Modal */}
      {resumeModalOpen && <ResumeFormModal resumes={resumes ?? []} />}
    </>
  )
}
