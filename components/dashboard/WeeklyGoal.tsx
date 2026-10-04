'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useToast } from '@/hooks/use-toast'
import { Target, CheckCircle2, Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div
      data-tour="weekly-goal"
      className="mt-3.5 bg-card border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
              done
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-primary/10 text-primary'
            )}
          >
            <Target className="h-4 w-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground">Haftalık Başvuru Hedefi</span>
            {done ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Hedef Tamamlandı
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground font-medium">
                ({Math.max(0, goal - current)} başvuru kaldı)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {editing ? (
            <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded-lg border border-border/60">
              <span className="text-[11px] text-muted-foreground">Hedef:</span>
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-12 h-6 text-xs text-center bg-background rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary font-bold tabular-nums"
                min={1}
                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                autoFocus
              />
              <button
                onClick={saveGoal}
                title="Kaydet"
                className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setEditing(false)}
                title="İptal"
                className="p-1 text-muted-foreground hover:bg-muted rounded transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              title="Hedefi güncellemek için tıklayın"
              className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-muted/60"
            >
              <span className="font-bold text-foreground tabular-nums">
                {current} / {goal}
              </span>
              <span className="text-muted-foreground text-[11px]">başvuru</span>
              <Pencil className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-2.5 h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            done ? 'bg-emerald-500' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
