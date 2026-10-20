'use client'

import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { Application, ApplicationStatus } from '@/types'
import { STATUS_LABELS } from '@/lib/utils/applications'
import { useToast } from '@/hooks/use-toast'

type UpdateFields = {
  status?: ApplicationStatus
  appliedAt?: string
  note?: string
  hrContacted?: boolean
  followUpSentAt?: string
}

/**
 * Başvuru aksiyonları.
 * Tüm güncellemeler "optimistic" çalışır: ekran sunucu cevabını beklemeden anında değişir,
 * hata olursa Convex değişikliği otomatik geri alır. Önemli aksiyonlarda "Geri Al" sunulur.
 */
export function useApplicationActions() {
  const { toast } = useToast()

  const updateMutation = useMutation(api.applications.update).withOptimisticUpdate(
    (store, args) => {
      const current = store.getQuery(api.applications.list, {})
      if (!current) return
      const { id, ...fields } = args
      const patch = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      )
      store.setQuery(
        api.applications.list,
        {},
        current.map((a) => (a._id === id ? ({ ...a, ...patch } as typeof a) : a))
      )
    }
  )

  const removeMutation = useMutation(api.applications.remove).withOptimisticUpdate(
    (store, args) => {
      const current = store.getQuery(api.applications.list, {})
      if (!current) return
      store.setQuery(
        api.applications.list,
        {},
        current.filter((a) => a._id !== args.id)
      )
    }
  )

  const createMutation = useMutation(api.applications.create)

  async function patch(app: Application, fields: UpdateFields) {
    try {
      await updateMutation({ id: app._id as Id<'applications'>, ...fields })
      return true
    } catch {
      toast({ title: 'Kaydedilemedi, tekrar dene', variant: 'destructive' })
      return false
    }
  }

  async function setStatus(app: Application, status: ApplicationStatus) {
    if (app.status === status) return
    const prev = app.status
    const extra: UpdateFields = {}
    // "Hazırlanıyor" durumundan çıkınca başvuru tarihi bugün olur (eski "Başvurdum" davranışı)
    if (prev === 'preparing' && status !== 'preparing') {
      extra.appliedAt = new Date().toISOString().slice(0, 10)
    }
    const ok = await patch(app, { status, ...extra })
    if (!ok) return
    toast({
      title: `${app.company} → ${STATUS_LABELS[status]}`,
      action: {
        label: 'Geri Al',
        onClick: () => {
          void patch(app, { status: prev })
        },
      },
    })
  }

  async function markFollowUpSent(app: Application) {
    const prev = app.followUpSentAt
    const ok = await patch(app, { followUpSentAt: new Date().toISOString().slice(0, 10) })
    if (!ok) return
    toast({
      title: 'Takip mesajı gönderildi olarak işaretlendi',
      action: prev
        ? { label: 'Geri Al', onClick: () => void patch(app, { followUpSentAt: prev }) }
        : undefined,
    })
  }

  async function remove(app: Application) {
    const snapshot = {
      company: app.company,
      position: app.position,
      status: app.status,
      appliedAt: app.appliedAt,
      interviewAt: app.interviewAt,
      offerDeadline: app.offerDeadline,
      channel: app.channel,
      resumeId: app.resumeId as Id<'resumes'> | undefined,
      cvVersion: app.cvVersion,
      jobLink: app.jobLink,
      contactName: app.contactName,
      salary: app.salary,
      hrContacted: app.hrContacted ?? false,
      note: app.note,
    }
    try {
      await removeMutation({ id: app._id as Id<'applications'> })
    } catch {
      toast({ title: 'Silinemedi', variant: 'destructive' })
      return
    }
    toast({
      title: `${app.company} silindi`,
      action: {
        label: 'Geri Al',
        onClick: () => {
          createMutation(snapshot).catch(() =>
            toast({ title: 'Geri alınamadı', variant: 'destructive' })
          )
        },
      },
    })
  }

  return { patch, setStatus, markFollowUpSent, remove }
}
