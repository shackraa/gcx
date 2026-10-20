'use client'

import { useUIStore } from '@/lib/store/ui'
import type { Application, FilterKey } from '@/types'
import { isOverdue, STATUS_LABELS } from '@/lib/utils/applications'
import { cn } from '@/lib/utils'

interface FilterTabsProps {
  applications: Application[]
  overdueDays: number
}

const TABS: { key: FilterKey; label: string; dot?: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'overdue', label: 'Sessiz', dot: 'bg-red-500' },
  { key: 'preparing', label: STATUS_LABELS.preparing, dot: 'bg-slate-400 dark:bg-slate-500' },
  { key: 'waiting', label: STATUS_LABELS.waiting, dot: 'bg-amber-500' },
  { key: 'responded', label: STATUS_LABELS.responded, dot: 'bg-sky-500' },
  { key: 'interview', label: STATUS_LABELS.interview, dot: 'bg-violet-500' },
  { key: 'offer', label: STATUS_LABELS.offer, dot: 'bg-emerald-500' },
  { key: 'rejected', label: STATUS_LABELS.rejected, dot: 'bg-rose-500' },
]

export function FilterTabs({ applications, overdueDays }: FilterTabsProps) {
  const { filter, setFilter, setView } = useUIStore()

  function getCount(key: FilterKey): number {
    if (key === 'all') return applications.length
    if (key === 'overdue') return applications.filter((a) => isOverdue(a, overdueDays)).length
    return applications.filter((a) => a.status === key).length
  }

  return (
    <div
      data-tour="filter-tabs"
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap scroll-smooth"
    >
      {TABS.map(({ key, label, dot }) => {
        const count = getCount(key)
        const isActive = filter === key
        const isOverdueTab = key === 'overdue'

        return (
          <button
            key={key}
            onClick={() => {
              setFilter(key)
              setView('list')
            }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border shrink-0',
              isActive
                ? isOverdueTab && count > 0
                  ? 'bg-red-600 dark:bg-red-700 text-white border-transparent shadow-xs font-semibold'
                  : 'bg-foreground text-background border-transparent shadow-xs font-semibold'
                : isOverdueTab && count > 0
                ? 'text-red-700 bg-red-50 hover:bg-red-100/80 border-red-200 dark:border-red-900/50 dark:text-red-400 dark:bg-red-950/40 dark:hover:bg-red-950/70'
                : 'text-muted-foreground bg-background hover:bg-muted/70 hover:text-foreground border-border/60 hover:border-border'
            )}
          >
            {dot && (
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0 transition-opacity',
                  dot,
                  isActive && !isOverdueTab ? 'bg-background' : ''
                )}
              />
            )}
            <span>{label}</span>
            <span
              className={cn(
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center transition-colors',
                isActive
                  ? 'bg-background/20 text-inherit'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
