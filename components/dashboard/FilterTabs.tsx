'use client'

import { useUIStore } from '@/lib/store/ui'
import type { Application, FilterKey } from '@/types'
import { isOverdue, STATUS_LABELS } from '@/lib/utils/applications'
import { cn } from '@/lib/utils'

interface FilterTabsProps {
  applications: Application[]
  overdueDays: number
}

const TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'overdue', label: 'Sessiz' },
  { key: 'preparing', label: STATUS_LABELS.preparing },
  { key: 'waiting', label: STATUS_LABELS.waiting },
  { key: 'responded', label: STATUS_LABELS.responded },
  { key: 'interview', label: STATUS_LABELS.interview },
  { key: 'offer', label: STATUS_LABELS.offer },
  { key: 'rejected', label: STATUS_LABELS.rejected },
]

export function FilterTabs({ applications, overdueDays }: FilterTabsProps) {
  const { filter, setFilter, setView, setSearch } = useUIStore()

  function getCount(key: FilterKey): number {
    if (key === 'all') return applications.length
    if (key === 'overdue') return applications.filter((a) => isOverdue(a, overdueDays)).length
    return applications.filter((a) => a.status === key).length
  }

  return (
    <div data-tour="filter-tabs" className="flex flex-wrap gap-1">
      {TABS.map(({ key, label }) => {
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
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              isActive
                ? isOverdueTab && count > 0
                  ? 'bg-red-700 text-white'
                  : 'bg-primary text-primary-foreground'
                : isOverdueTab && count > 0
                ? 'text-red-400 bg-red-950/40 hover:bg-red-950/60'
                : 'text-muted-foreground bg-muted hover:bg-muted/80 hover:text-foreground'
            )}
          >
            {label}
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[18px] text-center',
                isActive ? 'bg-white/20' : 'bg-background/60'
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
