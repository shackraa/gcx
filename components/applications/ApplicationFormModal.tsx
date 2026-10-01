'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUIStore } from '@/lib/store/ui'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Application, Resume } from '@/types'
import { Button } from '@/components/ui/button'
import { X, Trash2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Id } from '@/convex/_generated/dataModel'

const schema = z.object({
  company: z.string().min(1, 'Şirket adı gerekli'),
  position: z.string().min(1, 'Pozisyon gerekli'),
  status: z.enum(['preparing', 'waiting', 'responded', 'interview', 'offer', 'rejected']),
  appliedAt: z.string().optional(),
  interviewAt: z.string().optional(),
  offerDeadline: z.string().optional(),
  channel: z.enum(['online', 'email', 'referral', 'form', 'linkedin']).optional(),
  resumeId: z.string().optional(),
  cvVersion: z.string().optional(),
  cvLink: z.string().url('Geçerli URL gir').or(z.literal('')).optional(),
  jobLink: z.string().url('Geçerli URL gir').or(z.literal('')).optional(),
  contactName: z.string().optional(),
  salary: z.string().optional(),
  hrContacted: z.boolean().default(false),
  note: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface ApplicationFormModalProps {
  applications: Application[]
}

export function ApplicationFormModal({ applications }: ApplicationFormModalProps) {
  const { closeModal, editingId } = useUIStore()
  const editingApp = editingId ? applications.find((a) => a._id === editingId) : null
  const resumes = useQuery(api.resumes.list) as Resume[] | undefined

  const createMutation = useMutation(api.applications.create)
  const updateMutation = useMutation(api.applications.update)
  const removeMutation = useMutation(api.applications.remove)
  const { toast } = useToast()

  // Find default resume if creating new
  const defaultResume = !editingApp ? resumes?.find((r) => r.isDefault) : null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      company: editingApp?.company ?? '',
      position: editingApp?.position ?? '',
      status: editingApp?.status ?? 'waiting',
      appliedAt: editingApp?.appliedAt ?? '',
      interviewAt: editingApp?.interviewAt ? editingApp.interviewAt.slice(0, 16) : '',
      offerDeadline: editingApp?.offerDeadline ?? '',
      channel: editingApp?.channel,
      resumeId: editingApp?.resumeId ?? defaultResume?._id ?? '',
      cvVersion: editingApp?.cvVersion ?? defaultResume?.name ?? '',
      cvLink: editingApp?.cvLink ?? defaultResume?.fileUrl ?? '',
      jobLink: editingApp?.jobLink ?? '',
      contactName: editingApp?.contactName ?? '',
      salary: editingApp?.salary ?? '',
      hrContacted: editingApp?.hrContacted ?? false,
      note: editingApp?.note ?? '',
    },
  })

  const selectedResumeId = watch('resumeId')

  // When a resume is chosen from dropdown, auto-populate name & link
  function handleResumeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const rId = e.target.value
    setValue('resumeId', rId)
    if (rId && resumes) {
      const selected = resumes.find((r) => r._id === rId)
      if (selected) {
        setValue('cvVersion', selected.name)
        if (selected.fileUrl) {
          setValue('cvLink', selected.fileUrl)
        }
      }
    }
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeModal])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    const payload = {
      company: values.company,
      position: values.position,
      status: values.status,
      appliedAt: values.appliedAt || undefined,
      interviewAt: values.interviewAt || undefined,
      offerDeadline: values.offerDeadline || undefined,
      channel: values.channel || undefined,
      resumeId: values.resumeId ? (values.resumeId as Id<'resumes'>) : undefined,
      cvVersion: values.cvVersion || undefined,
      cvLink: values.cvLink || undefined,
      jobLink: values.jobLink || undefined,
      contactName: values.contactName || undefined,
      salary: values.salary || undefined,
      hrContacted: Boolean(values.hrContacted),
      note: values.note || undefined,
    }

    try {
      if (editingApp) {
        await updateMutation({
          id: editingApp._id as Id<'applications'>,
          ...payload,
        })
        toast({ title: 'Kaydedildi ✓' })
      } else {
        await createMutation(payload)
        toast({ title: 'Başvuru eklendi ✓' })
      }
      closeModal()
    } catch {
      toast({ title: 'Kaydedilemedi', variant: 'destructive' })
    }
  }

  async function handleDelete() {
    if (!editingApp) return
    if (!confirm(`"${editingApp.company}" başvurusunu silmek istiyor musun?`)) return
    try {
      await removeMutation({ id: editingApp._id as Id<'applications'> })
      toast({ title: 'Silindi ✓' })
      closeModal()
    } catch {
      toast({ title: 'Silinemedi', variant: 'destructive' })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeModal}
      />

      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-foreground">
            {editingApp ? 'Başvuruyu Düzenle' : 'Başvuru Ekle'}
          </h2>
          <button
            onClick={closeModal}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto px-6 py-4 space-y-4 flex-1"
        >
          {/* Company + Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Şirket <span className="text-red-400">*</span>
              </label>
              <input
                {...register('company')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Örn: Trendyol"
              />
              {errors.company && (
                <p className="text-xs text-red-400 mt-1">{errors.company.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Pozisyon <span className="text-red-400">*</span>
              </label>
              <input
                {...register('position')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Örn: AI Engineer"
              />
              {errors.position && (
                <p className="text-xs text-red-400 mt-1">{errors.position.message}</p>
              )}
            </div>
          </div>

          {/* Status + Applied At */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Durum</label>
              <select
                {...register('status')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="preparing">Hazırlanıyor</option>
                <option value="waiting">Bekleniyor</option>
                <option value="responded">Dönüş aldı</option>
                <option value="interview">Mülakat</option>
                <option value="offer">Teklif</option>
                <option value="rejected">Reddedildi</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Başvuru Tarihi</label>
              <input
                type="date"
                {...register('appliedAt')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* CV Selection from Resume Hub */}
          <div className="bg-muted/40 p-3 rounded-xl border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Kullanılan CV (CV Havuzundan Seç)
              </label>
              {resumes && resumes.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {resumes.length} kayıtlı CV
                </span>
              )}
            </div>

            {resumes && resumes.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={handleResumeChange}
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— Kayıtlı CV Seç veya Manuel Gir —</option>
                {resumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    📄 {r.name} ({r.category}) {r.isDefault ? '⭐' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Henüz CV Havuzuna CV eklemedin. Aşağıdan manuel yazabilir veya &quot;CV Havuzu&quot; sekmesinden ekleyebilirsin.
              </p>
            )}

            {/* CV Name & Link */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[11px] text-muted-foreground">CV Versiyon Adı</label>
                <input
                  {...register('cvVersion')}
                  className="mt-0.5 w-full h-8 px-2.5 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="AI_CV_v2"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">CV Drive / Dosya Linki</label>
                <input
                  {...register('cvLink')}
                  type="url"
                  className="mt-0.5 w-full h-8 px-2.5 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="https://drive.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* Interview At & Channel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">🗓 Mülakat Tarihi & Saati</label>
              <input
                type="datetime-local"
                {...register('interviewAt')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Başvuru Kanalı</label>
              <select
                {...register('channel')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— Seç —</option>
                <option value="online">Online ilan</option>
                <option value="email">E-posta</option>
                <option value="referral">Referans</option>
                <option value="form">Form</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </div>

          {/* Job Link */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">İlan Linki</label>
            <input
              {...register('jobLink')}
              type="url"
              className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="https://www.linkedin.com/jobs/..."
            />
          </div>

          {/* Contact + Salary */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">İletişim Kişisi (İK)</label>
              <input
                {...register('contactName')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Ayşe Kaya (HR)"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Maaş / Teklif</label>
              <input
                {...register('salary')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="80.000 TL brüt"
              />
            </div>
          </div>

          {/* HR Contacted */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              {...register('hrContacted')}
              className="rounded"
            />
            <span className="text-sm text-muted-foreground">İK&apos;ya yazıldı / iletişime geçildi</span>
          </label>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Not</label>
            <textarea
              {...register('note')}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              placeholder="Referans, mülakat notları, take-home ödev detayları…"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          {editingApp ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeModal}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
