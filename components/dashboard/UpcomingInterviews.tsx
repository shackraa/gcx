'use client'

import type { Application } from '@/types'
import { daysUntilInterview, formatDate } from '@/lib/utils/applications'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui'
import { CalendarClock } from 'lucide-react'

interface UpcomingInterviewsProps {
  interviews: Application[]
}

export function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  const { openModal } = useUIStore()

  return (
    <section className="mt-4">
      <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
        <CalendarClock className="h-4 w-4" />
        Yaklaşan Mülakatlar
      </h2>
      <div className="space-y-2">
        {interviews.map((app) => {
          const days = daysUntilInterview(app)
          const isToday = days === 0
          const isTomorrow = days === 1
          const isPast = days !== null && days < 0

          const dayLabel = isPast
            ? 'Geçti'
            : isToday
            ? 'Bugün!'
            : isTomorrow
            ? 'Yarın'
            : `${days} gün sonra`

          return (
            <button
              key={app._id}
              onClick={() => openModal(app._id)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-colors hover:bg-muted/50',
                isToday && 'border-red-700 bg-red-950/30',
                isTomorrow && 'border-amber-700 bg-amber-950/20',
                !isToday && !isTomorrow && !isPast && 'border-border bg-card',
                isPast && 'border-border bg-card opacity-60'
              )}
            >
              <div>
                <span className="font-semibold text-sm text-foreground">{app.company}</span>
                <span className="text-muted-foreground text-sm"> · {app.position}</span>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div
                  className={cn(
                    'text-xs font-bold',
                    isToday && 'text-red-400',
                    isTomorrow && 'text-amber-400',
                    !isToday && !isTomorrow && 'text-muted-foreground'
                  )}
                >
                  {dayLabel}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(app.interviewAt)}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
