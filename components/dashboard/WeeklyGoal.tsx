'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useToast } from '@/hooks/use-toast'

interface WeeklyGoalProps {
  current: number
  goal: number
}

export function WeeklyGoal({ current, goal }: WeeklyGoalProps) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(String(goal))
  const upsertSettings = useMutation(api.settings.upsert)
  const { toast } = useToast()

  const pct = Math.min(100, Math.round((current / (goal || 1)) * 100))
  const done = current >= goal && goal > 0

  async function saveGoal() {
    const newGoal = parseInt(inputVal)
    if (isNaN(newGoal) || newGoal < 1) return

    try {
      await upsertSettings({ weeklyGoal: newGoal })
      setEditing(false)
      toast({ title: 'Hedef güncellendi ✓' })
    } catch {
      toast({ title: 'Hedef güncellenemedi', variant: 'destructive' })
    }
  }

  return (
    <div data-tour="weekly-goal" className="mt-4 flex items-center gap-3">
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            Bu hafta {done && '🎉'}
          </span>
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-12 h-5 text-xs text-center bg-muted rounded border-0 focus:outline-none focus:ring-1 focus:ring-ring"
                min={1}
                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                autoFocus
              />
              <button onClick={saveGoal} className="text-green-400 text-xs hover:text-green-300">✓</button>
              <button onClick={() => setEditing(false)} className="text-muted-foreground text-xs hover:text-foreground">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-muted-foreground hover:text-foreground tabular-nums"
            >
              {current}/{goal} başvuru
            </button>
          )}
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
