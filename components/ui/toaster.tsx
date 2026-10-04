'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: {
    label: string
    onClick: () => void
  }
}

// Global toast state — shared between hook and Toaster
const listeners: ((t: Toast[]) => void)[] = []
let toastState: Toast[] = []

export function toast(t: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toastState = [...toastState, { ...t, id }]
  listeners.forEach((l) => l(toastState))
  setTimeout(() => {
    toastState = toastState.filter((x) => x.id !== id)
    listeners.forEach((l) => l(toastState))
  }, t.action ? 5000 : 3500)
}

export function useToast() {
  return { toast }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const idx = listeners.indexOf(setToasts)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto max-w-sm w-full p-4 rounded-xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-2 duration-200',
            t.variant === 'destructive'
              ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/90 dark:border-red-800 dark:text-red-100'
              : 'bg-card/95 backdrop-blur border-border/80 text-foreground'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs sm:text-sm">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick()
                  toastState = toastState.filter((x) => x.id !== t.id)
                  listeners.forEach((l) => l(toastState))
                }}
                className="shrink-0 text-xs font-bold text-primary hover:text-primary/90 bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg border border-primary/25 transition-all cursor-pointer"
              >
                {t.action.label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
