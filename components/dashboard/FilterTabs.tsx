'use client'

import { useUIStore } from '@/lib/store/ui'
import type { Application, FilterKey } from '@/types'
import { isOverdue, STATUS_LABELS } from '@/lib/utils/applications'
import { motion } from 'motion/react'
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
  const { filter, setFilter, setView, uiMode } = useUIStore()
  const isAward = uiMode === 'award'

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
              'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border shrink-0 active:scale-[0.97]',
              isActive
                ? isOverdueTab && count > 0
                  ? 'text-white border-transparent font-semibold'
                  : isAward
                    ? 'text-primary-foreground border-transparent font-semibold'
                    : 'bg-foreground text-background border-transparent shadow-xs font-semibold'
                : isOverdueTab && count > 0
                  ? 'text-red-700 bg-red-50 hover:bg-red-100/80 border-red-200 dark:border-red-900/50 dark:text-red-400 dark:bg-red-950/40 dark:hover:bg-red-950/70'
                  : 'text-muted-foreground bg-card/80 hover:bg-muted/70 hover:text-foreground border-border/70 hover:border-border'
            )}
          >
            {isActive && isAward && (
              <motion.span
                layoutId="award-filter-tab-pill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className={cn(
                  'absolute inset-0 rounded-xl shadow-xs',
                  isOverdueTab && count > 0 ? 'bg-red-600' : 'bg-primary'
                )}
              />
            )}
            {dot && (
              <span
                className={cn(
                  'relative z-10 w-1.5 h-1.5 rounded-full shrink-0 transition-opacity',
                  dot,
                  isActive && !isOverdueTab ? 'bg-current opacity-90' : ''
                )}
              />
            )}
            <span className="relative z-10">{label}</span>
            <span
              className={cn(
                'relative z-10 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold min-w-[18px] text-center transition-colors tabular-nums',
                isActive
                  ? 'bg-black/15 dark:bg-white/20 text-inherit'
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
