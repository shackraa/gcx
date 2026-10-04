'use client'

import type { AppStats, FilterKey } from '@/types'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/store/ui'

interface StatsCardsProps {
  stats: AppStats
  overdueDays: number
}

interface StatCardProps {
  value: number
  label: string
  filterKey: FilterKey
  variant?: 'default' | 'warning' | 'danger' | 'success'
}

function StatCard({ value, label, filterKey, variant = 'default' }: StatCardProps) {
  const { setFilter, setView, setSearch } = useUIStore()

  function handleClick() {
    setFilter(filterKey)
    setView('list')
    setSearch('')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'text-left bg-card border rounded-xl p-4 space-y-1 transition-all cursor-pointer hover:border-primary/50 hover:shadow-xs w-full',
        variant === 'danger' && value > 0 && 'border-red-200 bg-red-50 hover:border-red-300 dark:border-red-800 dark:bg-red-950/30 dark:hover:border-red-600',
        variant === 'warning' && value > 0 && 'border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:border-amber-600',
        variant === 'success' && value > 0 && 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-green-800 dark:bg-green-950/20 dark:hover:border-green-600',
        (variant === 'default' || value === 0) && 'border-border'
      )}
    >
      <div
        className={cn(
          'text-3xl font-extrabold',
          variant === 'danger' && value > 0 && 'text-red-600 dark:text-red-400',
          variant === 'success' && value > 0 && 'text-emerald-700 dark:text-green-400',
          variant === 'warning' && value > 0 && 'text-amber-700 dark:text-amber-400',
          variant === 'default' && 'text-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
    </button>
  )
}

export function StatsCards({ stats, overdueDays }: StatsCardsProps) {
  return (
    <div data-tour="stats-cards" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
      <StatCard value={stats.total} label="Toplam başvuru" filterKey="all" />
      <StatCard value={stats.active} label="Süreci devam eden" filterKey="waiting" />
      <StatCard
        value={stats.overdue}
        label={`${overdueDays}+ gündür sessiz`}
        filterKey="overdue"
        variant="danger"
      />
      <StatCard value={stats.interview} label="Mülakatta" filterKey="interview" variant="warning" />
      <StatCard value={stats.offer} label="Teklif" filterKey="offer" variant="success" />
    </div>
  )
}
