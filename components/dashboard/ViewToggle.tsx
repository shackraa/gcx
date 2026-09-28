'use client'

import { useUIStore } from '@/lib/store/ui'
import { LayoutList, Columns3, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/types'

const VIEWS: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'list', icon: LayoutList, label: 'Liste' },
  { mode: 'kanban', icon: Columns3, label: 'Kanban' },
  { mode: 'analytics', icon: BarChart2, label: 'Analiz' },
]

export function ViewToggle() {
  const { view, setView } = useUIStore()

  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5">
      {VIEWS.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setView(mode)}
          title={label}
          className={cn(
            'flex items-center justify-center w-8 h-7 rounded-md transition-colors',
            view === mode
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}
