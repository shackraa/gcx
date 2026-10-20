'use client'

import { useState } from 'react'
import type { Application } from '@/types'
import {
  STATUS_LABELS,
  CHANNEL_LABELS,
  daysSinceApplied,
  formatDate,
  generateFollowUpTemplate,
  safeUrl,
  getDirectDownloadUrl,
  isOverdue,
} from '@/lib/utils/applications'
import { useApplicationActions } from '@/lib/hooks/useApplicationActions'
import { useUIStore } from '@/lib/store/ui'
import { Button } from '@/components/ui/button'
import {
  X,
  ExternalLink,
  FileText,
  Copy,
  Clock,
  Edit3,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface ApplicationDrawerProps {
  app: Application
  overdueDays?: number
}

const STAGES: Array<Application['status']> = [
  'preparing',
  'waiting',
  'responded',
  'interview',
  'offer',
  'rejected',
]

export function ApplicationDrawer({ app, overdueDays = 14 }: ApplicationDrawerProps) {
  const { setInspectedId, openModal } = useUIStore()
  const { setStatus, patch, markFollowUpSent, remove } = useApplicationActions()
  const [inlineNote, setInlineNote] = useState(app.note || '')
  const [isSavingNote, setIsSavingNote] = useState(false)

  const overdue = isOverdue(app, overdueDays)
  const days = daysSinceApplied(app)
  const cvUrl = getDirectDownloadUrl(app.cvLink)
  const jobUrl = safeUrl(app.jobLink)

  async function handleSaveNote() {
    setIsSavingNote(true)
    await patch(app, { note: inlineNote })
    setIsSavingNote(false)
  }

  async function handleCopyTemplate() {
    const template = generateFollowUpTemplate(app)
    await navigator.clipboard.writeText(template)
    await markFollowUpSent(app)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground truncate">{app.company}</h3>
            {overdue && (
              <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                Sessiz
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{app.position}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openModal(app._id)}
            className="h-7 px-2 text-xs gap-1"
          >
            <Edit3 className="h-3 w-3" />
            <span>Düzenle</span>
          </Button>
          <button
            type="button"
            onClick={() => setInspectedId(null)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title="Kapat (ESC)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stage Progression Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Süreç Aşaması
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {STAGES.map((s) => {
            const active = app.status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(app, s)}
                className={cn(
                  'px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer border text-center',
                  active
                    ? 'bg-foreground text-background border-foreground shadow-2xs'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Metadata */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">
            Başvuru Tarihi
          </span>
          <span className="font-semibold text-foreground">
            {formatDate(app.appliedAt) || 'Belirtilmedi'}
            {days !== null && <span className="text-muted-foreground font-normal"> ({days}g önce)</span>}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">
            Kanal & İK
          </span>
          <span className="font-semibold text-foreground">
            {(app.channel && CHANNEL_LABELS[app.channel]) || 'Online'}
            {app.hrContacted ? ' · ✓ İK Yazıldı' : ''}
          </span>
        </div>
      </div>

      {/* External Links */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {jobUrl && (
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>İlan Linkini Aç</span>
          </a>
        )}
        {cvUrl && (
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>CV Belgesini Aç</span>
          </a>
        )}
      </div>

      {/* Inline Quick Note */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Hızlı Not
        </label>
        <textarea
          rows={3}
          value={inlineNote}
          onChange={(e) => setInlineNote(e.target.value)}
          placeholder="Mülakat notu, maaş bilgisi veya iletişim detayları..."
          className="w-full text-xs p-2.5 rounded-md bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        {inlineNote !== (app.note || '') && (
          <Button
            size="sm"
            onClick={handleSaveNote}
            disabled={isSavingNote}
            className="h-7 text-xs px-3"
          >
            {isSavingNote ? 'Kaydediliyor...' : 'Notu Kaydet'}
          </Button>
        )}
      </div>

      {/* Follow-up template */}
      {overdue && (
        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              14+ Gündür Sessiz — Takip Mesajı
            </span>
            <button
              type="button"
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <Copy className="h-3 w-3" />
              <span>Kopyala & Gönderildi Say</span>
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground line-clamp-3 bg-background/60 p-2 rounded border border-border/40 font-mono">
            {generateFollowUpTemplate(app)}
          </p>
        </div>
      )}

      {/* Delete Action */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
        <span className="text-[11px] text-muted-foreground">
          {app.followUpSentAt && `Son takip: ${app.followUpSentAt}`}
        </span>
        <button
          type="button"
          onClick={() => {
            setInspectedId(null)
            void remove(app)
          }}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
          <span>Başvuruyu Sil</span>
        </button>
      </div>
    </motion.div>
  )
}
