'use client'

import type { AppStats } from '@/types'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: AppStats
  overdueDays: number
}

interface StatCardProps {
  value: number
  label: string
  variant?: 'default' | 'warning' | 'danger' | 'success'
}

function StatCard({ value, label, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-4 space-y-1 transition-colors',
        variant === 'danger' && value > 0 && 'border-red-800 bg-red-950/30',
        variant === 'warning' && value > 0 && 'border-amber-800 bg-amber-950/20',
        variant === 'success' && value > 0 && 'border-green-800 bg-green-950/20',
        (variant === 'default' || value === 0) && 'border-border'
      )}
    >
      <div
        className={cn(
          'text-3xl font-extrabold',
          variant === 'danger' && value > 0 && 'text-red-400',
          variant === 'success' && value > 0 && 'text-green-400',
          variant === 'warning' && value > 0 && 'text-amber-400',
          variant === 'default' && 'text-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
    </div>
  )
}

export function StatsCards({ stats, overdueDays }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
      <StatCard value={stats.total} label="Toplam başvuru" />
      <StatCard value={stats.active} label="Süreci devam eden" />
      <StatCard
        value={stats.overdue}
        label={`${overdueDays}+ gündür sessiz`}
        variant="danger"
      />
      <StatCard value={stats.interview} label="Mülakatta" variant="warning" />
      <StatCard value={stats.offer} label="Teklif" variant="success" />
    </div>
  )
}
