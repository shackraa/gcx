'use client'

import type { Application, ApplicationStatus } from '@/types'
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
import { ExternalLink, FileText, Copy, CheckCircle2, Calendar, ChevronDown, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Id } from '@/convex/_generated/dataModel'

interface ApplicationCardProps {
  app: Application
  overdueDays?: number
}

export function ApplicationCard({ app, overdueDays = 14 }: ApplicationCardProps) {
  const { openModal } = useUIStore()
  const markAppliedMutation = useMutation(api.applications.markApplied)
  const updateMutation = useMutation(api.applications.update)
  const { toast } = useToast()
  const overdue = isOverdue(app, overdueDays)
  const days = daysSinceApplied(app)
  const cvUrl = safeUrl(app.cvLink)
  const jobUrl = safeUrl(app.jobLink)

  async function handleStatusChange(newStatus: ApplicationStatus) {
    if (newStatus === app.status) return
    try {
      await updateMutation({
        id: app._id as Id<'applications'>,
        status: newStatus,
      })
      toast({ title: `Durum güncellendi: ${STATUS_LABELS[newStatus]}` })
    } catch {
      toast({ title: 'Durum güncellenemedi', variant: 'destructive' })
    }
  }

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
    preparing: 'border-l-zinc-400 dark:border-l-zinc-500',
    waiting: 'border-l-blue-500 dark:border-l-blue-600',
    responded: 'border-l-purple-500 dark:border-l-purple-600',
    interview: 'border-l-amber-500 dark:border-l-amber-500',
    offer: 'border-l-emerald-500 dark:border-l-green-500',
    rejected: 'border-l-rose-500 dark:border-l-red-700',
  }

  return (
    <div
      className={cn(
        'group relative bg-card border border-l-4 rounded-xl px-4 py-3 transition-all hover:border-border/80 shadow-2xs',
        overdue ? 'border-red-200 dark:border-red-800 border-l-red-500 bg-red-50/50 dark:bg-red-950/10' : 'border-border',
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
                overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
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
        {/* Interactive Status Selector Badge */}
        <div className="relative inline-flex items-center">
          <select
            value={app.status}
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
            title="Durumu doğrudan değiştir"
            className={cn(
              'appearance-none pl-2.5 pr-5 py-0.5 rounded-full text-[11px] font-semibold cursor-pointer border border-transparent hover:border-current/30 focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all shadow-2xs',
              STATUS_COLORS[app.status]
            )}
          >
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option
                key={key}
                value={key}
                className="bg-card text-foreground py-1 font-medium"
              >
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 absolute right-1.5 pointer-events-none opacity-60" />
        </div>

        {/* Overdue badge */}
        {overdue && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 animate-pulse inline-block" />
            Sessiz (Takip maili at)
          </span>
        )}

        {/* Applied date */}
        {app.appliedAt && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            <Calendar className="h-3 w-3 opacity-70" />
            {formatDate(app.appliedAt)}
          </span>
        )}

        {/* Channel */}
        {app.channel && (
          <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {CHANNEL_LABELS[app.channel] ?? app.channel}
          </span>
        )}

        {/* CV version / Resume badge */}
        {app.cvVersion && (
          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-900/60 px-2 py-0.5 rounded-full font-medium">
            <FileText className="h-3 w-3" />
            {app.cvVersion}
          </span>
        )}

        {/* HR contacted */}
        {app.hrContacted ? (
          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 dark:text-green-400 dark:bg-green-950/40 dark:border-transparent px-2 py-0.5 rounded-full">
            ✓ İK&apos;ya yazıldı
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60 px-2 py-0.5 rounded-full">
            İK&apos;ya yazılmadı
          </span>
        )}

        {/* Interview date */}
        {app.interviewAt && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-900/60 px-2 py-0.5 rounded-full">
            <Calendar className="h-3 w-3" />
            {formatDate(app.interviewAt)}
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
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <FileText className="h-3 w-3" />
              CV&apos;yi Aç
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
              İlanı Aç
            </a>
          )}
          {overdue && (
            <button
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer"
            >
              <Copy className="h-3 w-3" />
              Şablonu kopyala
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {app.status === 'preparing' && (
            <button
              onClick={handleMarkApplied}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:text-green-400 dark:hover:text-green-300 dark:bg-green-950/40 dark:hover:bg-green-950/60 dark:border-transparent px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Başvurdum
            </button>
          )}
          {app.status === 'waiting' && (
            <button
              onClick={() => handleStatusChange('responded')}
              title="Doğrudan dönüş aldı olarak güncelle"
              className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 dark:text-purple-300 dark:hover:text-purple-200 dark:bg-purple-950/40 dark:hover:bg-purple-950/60 dark:border-purple-800/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowRight className="h-3 w-3" />
              Dönüş Aldı
            </button>
          )}
          {app.status === 'responded' && (
            <button
              onClick={() => handleStatusChange('interview')}
              title="Mülakat aşamasına taşı"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:text-amber-300 dark:hover:text-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 dark:border-amber-800/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowRight className="h-3 w-3" />
              Mülakat
            </button>
          )}
          {app.status === 'interview' && (
            <button
              onClick={() => handleStatusChange('offer')}
              title="Teklif aşamasına taşı"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:text-green-300 dark:hover:text-green-200 dark:bg-green-950/40 dark:hover:bg-green-950/60 dark:border-green-800/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Teklif Aldı
            </button>
          )}
          <button
            onClick={() => openModal(app._id)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted cursor-pointer"
          >
            Düzenle
          </button>
        </div>
      </div>
    </div>
  )
}
