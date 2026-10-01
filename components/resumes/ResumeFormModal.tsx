'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUIStore } from '@/lib/store/ui'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Resume } from '@/types'
import { Button } from '@/components/ui/button'
import { X, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Id } from '@/convex/_generated/dataModel'

const schema = z.object({
  name: z.string().min(1, 'CV adı gerekli'),
  category: z.string().min(1, 'Kategori seçimi gerekli'),
  targetRole: z.string().optional(),
  fileUrl: z.string().url('Geçerli bir URL girin').or(z.literal('')).optional(),
  summary: z.string().optional(),
  rawText: z.string().optional(),
  isDefault: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

const COMMON_CATEGORIES = [
  'Yapay Zeka / AI & ML',
  'Frontend Geliştirme',
  'Backend Geliştirme',
  'Full-stack Geliştirme',
  'Mobil (iOS / Android / Flutter)',
  'Ürün Yönetimi (Product Manager)',
  'Veri Analitiği / Data Science',
  'DevOps / Cloud',
  'UI / UX Tasarım',
  'Genel / Standart CV',
]

interface ResumeFormModalProps {
  resumes: Resume[]
}

export function ResumeFormModal({ resumes }: ResumeFormModalProps) {
  const { closeResumeModal, editingResumeId } = useUIStore()
  const editingResume = editingResumeId ? resumes.find((r) => r._id === editingResumeId) : null
  const createMutation = useMutation(api.resumes.create)
  const updateMutation = useMutation(api.resumes.update)
  const removeMutation = useMutation(api.resumes.remove)
  const { toast } = useToast()

  const [skills, setSkills] = useState<string[]>(editingResume?.skills ?? [])
  const [skillInput, setSkillInput] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: editingResume?.name ?? '',
      category: editingResume?.category ?? 'Yapay Zeka / AI & ML',
      targetRole: editingResume?.targetRole ?? '',
      fileUrl: editingResume?.fileUrl ?? '',
      summary: editingResume?.summary ?? '',
      rawText: editingResume?.rawText ?? '',
      isDefault: editingResume?.isDefault ?? false,
    },
  })

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeResumeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeResumeModal])

  function handleAddSkill() {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed])
      setSkillInput('')
    }
  }

  function handleRemoveSkill(skillToRemove: string) {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    const payload = {
      name: values.name,
      category: values.category,
      targetRole: values.targetRole || undefined,
      fileUrl: values.fileUrl || undefined,
      skills,
      summary: values.summary || undefined,
      rawText: values.rawText || undefined,
      isDefault: Boolean(values.isDefault),
    }

    try {
      if (editingResume) {
        await updateMutation({
          id: editingResume._id as Id<'resumes'>,
          ...payload,
        })
        toast({ title: 'CV Güncellendi ✓' })
      } else {
        await createMutation(payload)
        toast({ title: 'Yeni CV Eklendi ✓' })
      }
      closeResumeModal()
    } catch {
      toast({ title: 'CV kaydedilemedi', variant: 'destructive' })
    }
  }

  async function handleDelete() {
    if (!editingResume) return
    if (!confirm(`"${editingResume.name}" CV'sini silmek istiyor musun?`)) return
    try {
      await removeMutation({ id: editingResume._id as Id<'resumes'> })
      toast({ title: 'CV Silindi ✓' })
      closeResumeModal()
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
        onClick={closeResumeModal}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full sm:max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">
              {editingResume ? 'CV Profilini Düzenle' : 'Yeni CV Ekle'}
            </h2>
            <p className="text-xs text-muted-foreground">
              İlanlara özel hazırladığın CV versiyonunu tanımla.
            </p>
          </div>
          <button
            onClick={closeResumeModal}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto px-6 py-4 space-y-4 flex-1"
        >
          {/* Name & Target Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                CV İsmi <span className="text-red-400">*</span>
              </label>
              <input
                {...register('name')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Örn: AI & LLM Developer CV v2"
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Hedef Pozisyon
              </label>
              <input
                {...register('targetRole')}
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Örn: AI Engineer / LLM Specialist"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Uzmanlık / Kategori <span className="text-red-400">*</span>
            </label>
            <select
              {...register('category')}
              className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {COMMON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* File / Drive URL */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              CV Linki (Google Drive / PDF / Notion)
            </label>
            <input
              {...register('fileUrl')}
              type="url"
              className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="https://drive.google.com/file/d/..."
            />
            {errors.fileUrl && (
              <p className="text-xs text-red-400 mt-1">{errors.fileUrl.message}</p>
            )}
          </div>

          {/* Skills Tag Input */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Öne Çıkan Yetenekler / Anahtar Kelimeler (İlan Eşleşmesi İçin)
            </label>
            <div className="flex gap-2 mt-1">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddSkill()
                  }
                }}
                className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Örn: Python, LangChain, PyTorch, Next.js (Enter'a bas)"
              />
              <Button type="button" size="sm" variant="secondary" onClick={handleAddSkill} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Ekle
              </Button>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-primary hover:text-red-400 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Summary / Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Kısa Özet / Versiyon Notu
            </label>
            <textarea
              {...register('summary')}
              rows={2}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              placeholder="Örn: Yapay zeka ve LLM projeleri öne çıkarıldı. 3 yıllık deneyim vurgulandı."
            />
          </div>

          {/* Raw Text for AI Analysis */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              CV Metni (LinkedIn İlan Analizi ve Eşleştirme İçin)
            </label>
            <textarea
              {...register('rawText')}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none font-mono"
              placeholder="CV'ndeki metni buraya yapıştırabilirsin. Bu metin, LinkedIn'de sana en uygun ilan filtrelerini sıfır maliyetle çıkarmak için kullanılacak..."
            />
          </div>

          {/* Default Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              {...register('isDefault')}
              className="rounded"
            />
            <span className="text-xs text-muted-foreground">
              Varsayılan CV olarak ayarla (Yeni başvurularda otomatik seçilir)
            </span>
          </label>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          {editingResume ? (
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
            <Button variant="ghost" size="sm" onClick={closeResumeModal}>
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
