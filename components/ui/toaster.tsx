'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
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
  }, 3000)
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
            'pointer-events-auto max-w-sm w-full px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-2',
            t.variant === 'destructive'
              ? 'bg-red-950 border-red-800 text-red-200'
              : 'bg-card border-border text-foreground'
          )}
        >
          {t.title}
          {t.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
