'use client'

import type { AppStats, FilterKey } from '@/types'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui'
import { Layers, Activity, AlertCircle, CalendarCheck2, Trophy } from 'lucide-react'

interface StatsCardsProps {
  stats: AppStats
  overdueDays: number
}

interface StatCardProps {
  value: number
  total: number
  label: string
  filterKey: FilterKey
  icon: React.ElementType
  variant?: 'default' | 'warning' | 'danger' | 'success'
  className?: string
}

function StatCard({
  value,
  total,
  label,
  filterKey,
  icon: Icon,
  variant = 'default',
  className,
}: StatCardProps) {
  const { filter, setFilter, setView, setSearch, uiMode } = useUIStore()
  const isAward = uiMode === 'award'
  const isActive = filter === filterKey

  function handleClick() {
    setFilter(filterKey)
    setView('list')
    setSearch('')
  }

  if (!isAward) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'text-left bg-card border rounded-xl p-3 sm:p-4 space-y-0.5 sm:space-y-1 transition-all cursor-pointer hover:border-primary/50 hover:shadow-xs w-full active:scale-[0.98]',
          variant === 'danger' && value > 0 && 'border-red-200 bg-red-50 hover:border-red-300 dark:border-red-800 dark:bg-red-950/30 dark:hover:border-red-600',
          variant === 'warning' && value > 0 && 'border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:border-amber-600',
          variant === 'success' && value > 0 && 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-green-800 dark:bg-green-950/20 dark:hover:border-green-600',
          (variant === 'default' || value === 0) && 'border-border',
          className
        )}
      >
        <div
          className={cn(
            'text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight',
            variant === 'danger' && value > 0 && 'text-red-600 dark:text-red-400',
            variant === 'success' && value > 0 && 'text-emerald-700 dark:text-green-400',
            variant === 'warning' && value > 0 && 'text-amber-700 dark:text-amber-400',
            variant === 'default' && 'text-foreground'
          )}
        >
          {value}
        </div>
        <div className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-tight">{label}</div>
      </button>
    )
  }

  const ratio = filterKey === 'all' ? 100 : total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'group relative text-left bg-card border rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 w-full cursor-pointer craft-surface craft-surface-hover active:scale-[0.98] overflow-hidden',
        variant === 'danger' && value > 0
          ? 'border-red-500/30 bg-gradient-to-b from-red-500/[0.07] to-card hover:border-red-500/50'
          : variant === 'warning' && value > 0
            ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/[0.07] to-card hover:border-amber-500/50'
            : variant === 'success' && value > 0
              ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.07] to-card hover:border-emerald-500/50'
              : 'border-border/80 hover:border-primary/40',
        isActive && 'ring-2 ring-primary/35 border-primary/50',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="text-[11px] sm:text-xs text-muted-foreground font-medium leading-tight truncate">
          {label}
        </span>
        <div
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105',
            variant === 'danger' && value > 0
              ? 'bg-red-500/12 text-red-600 dark:text-red-400 border-red-500/20'
              : variant === 'warning' && value > 0
                ? 'bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : variant === 'success' && value > 0
                  ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-primary/10 text-primary border-primary/20'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 w-full">
        <div
          className={cn(
            'text-2xl sm:text-3xl font-extrabold font-mono tabular-nums tracking-tight leading-none',
            variant === 'danger' && value > 0 && 'text-red-600 dark:text-red-400',
            variant === 'success' && value > 0 && 'text-emerald-600 dark:text-emerald-400',
            variant === 'warning' && value > 0 && 'text-amber-600 dark:text-amber-400',
            (variant === 'default' || value === 0) && 'text-foreground'
          )}
        >
          {value}
        </div>
        {filterKey !== 'all' && total > 0 && (
          <span className="text-[10px] font-mono font-semibold text-muted-foreground/80">
            %{ratio}
          </span>
        )}
      </div>
    </button>
  )
}

export function StatsCards({ stats, overdueDays }: StatsCardsProps) {
  return (
    <div data-tour="stats-cards" className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
      <StatCard
        value={stats.total}
        total={stats.total}
        label="Toplam başvuru"
        filterKey="all"
        icon={Layers}
        className="col-span-2 sm:col-span-1"
      />
      <StatCard
        value={stats.active}
        total={stats.total}
        label="Süreci devam eden"
        filterKey="waiting"
        icon={Activity}
      />
      <StatCard
        value={stats.overdue}
        total={stats.total}
        label={`${overdueDays}+ gündür sessiz`}
        filterKey="overdue"
        icon={AlertCircle}
        variant="danger"
      />
      <StatCard
        value={stats.interview}
        total={stats.total}
        label="Mülakatta"
        filterKey="interview"
        icon={CalendarCheck2}
        variant="warning"
      />
      <StatCard
        value={stats.offer}
        total={stats.total}
        label="Teklif"
        filterKey="offer"
        icon={Trophy}
        variant="success"
      />
    </div>
  )
}

