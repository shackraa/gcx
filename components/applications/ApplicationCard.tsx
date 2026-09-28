'use client'

import type { Application } from '@/types'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  CHANNEL_LABELS,
  isOverdue,
  daysSinceApplied,
  formatDate,
  generateFollowUpTemplate,
  safeUrl,
} from '@/lib/utils/applications'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUIStore } from '@/lib/store/ui'
import { cn } from '@/lib/utils'
import { ExternalLink, FileText, Copy, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Id } from '@/convex/_generated/dataModel'

interface ApplicationCardProps {
  app: Application
  overdueDays?: number
}

export function ApplicationCard({ app, overdueDays = 14 }: ApplicationCardProps) {
  const { openModal } = useUIStore()
  const markAppliedMutation = useMutation(api.applications.markApplied)
  const { toast } = useToast()
  const overdue = isOverdue(app, overdueDays)
  const days = daysSinceApplied(app)
  const cvUrl = safeUrl(app.cvLink)
  const jobUrl = safeUrl(app.jobLink)

  async function handleCopyTemplate() {
    const template = generateFollowUpTemplate(app)
    await navigator.clipboard.writeText(template)
    toast({ title: 'Şablon kopyalandı ✓' })
  }

  async function handleMarkApplied() {
    try {
      await markAppliedMutation({
        id: app._id as Id<'applications'>,
        appliedAt: new Date().toISOString().slice(0, 10),
      })
      toast({ title: 'Başvuruldu olarak işaretlendi ✓' })
    } catch {
      toast({ title: 'İşlem başarısız', variant: 'destructive' })
    }
  }

  const leftBorderColor: Record<string, string> = {
    preparing: 'border-l-zinc-500',
    waiting: 'border-l-blue-600',
    responded: 'border-l-purple-600',
    interview: 'border-l-amber-500',
    offer: 'border-l-green-500',
    rejected: 'border-l-red-700',
  }

  return (
    <div
      className={cn(
        'group relative bg-card border border-l-4 rounded-xl px-4 py-3 transition-all hover:border-border/80',
        overdue ? 'border-red-800 border-l-red-500 bg-red-950/10' : 'border-border',
        leftBorderColor[app.status] ?? 'border-l-border'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold text-foreground text-sm">{app.company}</span>
            {app.position && (
              <span className="text-muted-foreground text-xs">{app.position}</span>
            )}
          </div>
        </div>

        {/* Days counter */}
        <div className="shrink-0 flex items-center gap-2">
          {days !== null && (
            <span
              className={cn(
                'text-xs font-semibold tabular-nums',
                overdue ? 'text-red-400' : 'text-muted-foreground'
              )}
            >
              {days}g önce
            </span>
          )}
          {!app.appliedAt && (
            <span className="text-xs text-muted-foreground/60 italic">tarih yok</span>
          )}
        </div>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {/* Status badge */}
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold',
            STATUS_COLORS[app.status]
          )}
        >
          {STATUS_LABELS[app.status]}
        </span>

        {/* Overdue badge */}
        {overdue && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-950 text-red-300">
            🔴 Takip maili at
          </span>
        )}

        {/* Applied date */}
        {app.appliedAt && (
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            📅 {formatDate(app.appliedAt)}
          </span>
        )}

        {/* Channel */}
        {app.channel && (
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {CHANNEL_LABELS[app.channel] ?? app.channel}
          </span>
        )}

        {/* CV version */}
        {app.cvVersion && (
          <span className="text-[11px] text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-full">
            CV: {app.cvVersion}
          </span>
        )}

        {/* HR contacted */}
        {app.hrContacted ? (
          <span className="text-[11px] text-green-400 bg-green-950/40 px-2 py-0.5 rounded-full">
            ✓ İK&apos;ya yazıldı
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60 px-2 py-0.5 rounded-full">
            İK&apos;ya yazılmadı
          </span>
        )}

        {/* Interview date */}
        {app.interviewAt && (
          <span className="text-[11px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full">
            🗓 {formatDate(app.interviewAt)}
          </span>
        )}
      </div>

      {/* Note */}
      {app.note && (
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
          {app.note}
        </p>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between mt-3 gap-2">
        <div className="flex items-center gap-2">
          {cvUrl && (
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FileText className="h-3 w-3" />
              CV&apos;yi aç
            </a>
          )}
          {jobUrl && (
            <a
              href={jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              İlanı aç
            </a>
          )}
          {overdue && (
            <button
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors"
            >
              <Copy className="h-3 w-3" />
              Şablonu kopyala
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {app.status === 'preparing' && (
            <button
              onClick={handleMarkApplied}
              className="inline-flex items-center gap-1 text-xs font-medium text-green-400 hover:text-green-300 bg-green-950/40 hover:bg-green-950/60 px-3 py-1 rounded-lg transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Başvurdum
            </button>
          )}
          <button
            onClick={() => openModal(app._id)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
          >
            Düzenle
          </button>
        </div>
      </div>
    </div>
  )
}
