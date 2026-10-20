'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useToast } from '@/hooks/use-toast'
import { useUIStore } from '@/lib/store/ui'
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
  const { uiMode } = useUIStore()
  const isAward = uiMode === 'award'

  const pct = Math.min(100, Math.round((current / (goal || 1)) * 100))
  const done = current >= goal && goal > 0
  const segments = Math.min(12, Math.max(1, goal || 5))

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
      className={cn(
        'w-full flex flex-col justify-between bg-card border p-3.5 sm:p-4 transition-all',
        isAward
          ? 'rounded-2xl border-border/80 craft-surface'
          : 'rounded-xl border-border/80 shadow-2xs'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors border',
              done
                ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-primary/10 text-primary border-primary/20'
            )}
          >
            <Target className="h-4 w-4" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-foreground">Haftalık Başvuru Hedefi</span>
              {done && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" />
                  Tamamlandı
                </span>
              )}
            </div>
            {!done && (
              <span className="text-[11px] text-muted-foreground font-medium">
                Bu hafta hedefe <strong className="text-foreground font-mono">{Math.max(0, goal - current)}</strong> başvuru kaldı
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
                className="w-12 h-6 text-xs text-center bg-background rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary font-bold font-mono tabular-nums"
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
              className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2.5 py-1 rounded-lg bg-muted/40 hover:bg-muted border border-border/60"
            >
              <span className="font-bold text-foreground font-mono tabular-nums">
                {current}/{goal}
              </span>
              <span className="text-[10px] font-mono text-primary font-semibold">%{pct}</span>
              <Pencil className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity ml-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress Track: Segmented tactile bars in Award mode, classic bar in Classic mode */}
      {isAward && goal <= 10 ? (
        <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}>
          {Array.from({ length: segments }).map((_, idx) => {
            const filled = idx < current
            return (
              <div
                key={idx}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  filled
                    ? done
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)]'
                      : 'bg-primary shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                    : 'bg-muted/90'
                )}
              />
            )
          })}
        </div>
      ) : (
        <div className="mt-2.5 h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              done ? 'bg-emerald-500' : 'bg-primary'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

