'use client'

import type { Application, ApplicationStatus } from '@/types'
import {
  STATUS_LABELS,
  CHANNEL_LABELS,
  isOverdue,
  daysSinceApplied,
  formatDate,
  generateFollowUpTemplate,
  safeUrl,
  getDirectDownloadUrl,
} from '@/lib/utils/applications'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUIStore } from '@/lib/store/ui'
import { cn } from '@/lib/utils'
import { ExternalLink, FileText, Copy, CheckCircle2, ChevronDown, ArrowRight, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Id } from '@/convex/_generated/dataModel'

function humanizeCvName(raw?: string): string {
  if (!raw) return ''
  return raw
    .replace(/\.pdf$/i, '')
    .replace(/_CV$/i, '')
    .replace(/_cv$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface ApplicationCardProps {
  app: Application
  overdueDays?: number
}

const STATUS_DOT: Record<ApplicationStatus, string> = {
  preparing: 'bg-zinc-400 dark:bg-zinc-500',
  waiting: 'bg-blue-500 dark:bg-blue-400',
  responded: 'bg-purple-500 dark:bg-purple-400',
  interview: 'bg-amber-500 dark:bg-amber-400',
  offer: 'bg-emerald-500 dark:bg-emerald-400',
  rejected: 'bg-rose-500 dark:bg-rose-400',
}

const STATUS_TEXT: Record<ApplicationStatus, string> = {
  preparing: 'text-zinc-600 dark:text-zinc-300',
  waiting: 'text-blue-600 dark:text-blue-400',
  responded: 'text-purple-600 dark:text-purple-400',
  interview: 'text-amber-600 dark:text-amber-400',
  offer: 'text-emerald-600 dark:text-emerald-400',
  rejected: 'text-rose-600 dark:text-rose-400',
}

export function ApplicationCard({ app, overdueDays = 14 }: ApplicationCardProps) {
  const { openModal } = useUIStore()
  const markAppliedMutation = useMutation(api.applications.markApplied)
  const updateMutation = useMutation(api.applications.update)
  const { toast } = useToast()
  const overdue = isOverdue(app, overdueDays)
  const days = daysSinceApplied(app)
  const cvUrl = getDirectDownloadUrl(app.cvLink)
  const jobUrl = safeUrl(app.jobLink)

  // Relative human time text
  const daysText = days === 0 ? 'Bugün' : days === 1 ? 'Dün' : `${days}g önce`

  // Extract match score and filter out repetitive boilerplate from note
  const matchScoreMatch = app.note?.match(/Uyumluluk(?: Skoru)?:\s*%?(\d+)/i)
  const matchScore = matchScoreMatch ? matchScoreMatch[1] : null

  let cleanNote = app.note || ''
  if (matchScore) {
    const lines = cleanNote.split(/[\r\n]+/)
    const nonBoilerplate = lines.filter(
      (l) =>
        !l.toLowerCase().includes('uyumluluk') &&
        !l.toLowerCase().includes('doğrudan örtüşmektedir') &&
        !l.toLowerCase().includes('güçlü bir teknik sinerji') &&
        !l.toLowerCase().includes('kariyer adımıdır') &&
        !l.toLowerCase().includes('pozisyonu sql, python')
    )
    cleanNote = nonBoilerplate.join(' ').trim()
  }

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

  return (
    <div
      className={cn(
        'group relative bg-card border rounded-xl p-3.5 sm:p-4 transition-all duration-150 hover:border-border hover:shadow-xs space-y-2.5',
        overdue
          ? 'border-red-200 bg-red-50/20 dark:border-red-900/40 dark:bg-red-950/10'
          : 'border-border/70 hover:bg-card/90'
      )}
    >
      {/* Top row: Company, Position, Job Link & Time */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
            {app.company}
          </span>

          {app.position && (
            <>
              <span className="text-muted-foreground/30 text-xs hidden sm:inline">•</span>
              <span className="text-xs text-muted-foreground font-normal truncate max-w-[280px]">
                {app.position}
              </span>
            </>
          )}

          {jobUrl && (
            <a
              href={jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="İlanı Aç"
              className="inline-flex items-center text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 rounded hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Right side: Overdue badge + relative time */}
        <div className="shrink-0 flex items-center gap-2">
          {overdue && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Sessiz
            </span>
          )}
          {days !== null ? (
            <span
              className={cn(
                'text-xs tabular-nums',
                overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-muted-foreground'
              )}
            >
              {daysText}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">Tarih yok</span>
          )}
        </div>
      </div>

      {/* Middle row: Metadata & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-0.5">
        {/* Left: Metadata list */}
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
          {/* Status Selector */}
          <div className="relative inline-flex items-center">
            <span className={cn('w-2 h-2 rounded-full mr-1.5 shrink-0', STATUS_DOT[app.status])} />
            <select
              value={app.status}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              title="Durumu değiştir"
              className={cn(
                'appearance-none pl-0.5 pr-4 py-0.5 text-xs font-semibold cursor-pointer bg-transparent hover:bg-muted/60 focus:outline-none rounded transition-colors',
                STATUS_TEXT[app.status]
              )}
            >
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-card text-foreground py-1 font-medium">
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-0 pointer-events-none opacity-40" />
          </div>

          {/* Channel & Applied Date */}
          {(app.channel || app.appliedAt) && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-muted-foreground">
                {app.channel && (CHANNEL_LABELS[app.channel] ?? app.channel)}
                {app.channel && app.appliedAt && ' • '}
                {app.appliedAt && formatDate(app.appliedAt)}
              </span>
            </>
          )}

          {/* Match Score */}
          {matchScore && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3 w-3 opacity-80" />
                %{matchScore} Uyum
              </span>
            </>
          )}

          {/* CV Used */}
          {app.cvVersion && (
            <>
              <span className="text-muted-foreground/30">•</span>
              {cvUrl ? (
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="CV'yi İndir / Aç"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline transition-colors max-w-[190px]"
                >
                  <FileText className="h-3 w-3 shrink-0 text-primary" />
                  <span className="truncate">{humanizeCvName(app.cvVersion)}</span>
                </a>
              ) : (
                <span
                  title={app.cvVersion}
                  className="inline-flex items-center gap-1 text-muted-foreground/80 max-w-[180px]"
                >
                  <FileText className="h-3 w-3 shrink-0 opacity-50" />
                  <span className="truncate">{humanizeCvName(app.cvVersion)}</span>
                </span>
              )}
            </>
          )}

          {/* HR Contacted */}
          {app.hrContacted && (
            <>
              <span className="text-muted-foreground/30">•</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                ✓ İK ile Görüşüldü
              </span>
            </>
          )}
        </div>

        {/* Right: Quick Advance & Edit */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          {app.status === 'preparing' && (
            <button
              onClick={handleMarkApplied}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Başvurdum</span>
            </button>
          )}
          {app.status === 'waiting' && (
            <button
              onClick={() => handleStatusChange('responded')}
              title="Doğrudan dönüş aldı olarak güncelle"
              className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <span>Dönüş Aldı</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
          {app.status === 'responded' && (
            <button
              onClick={() => handleStatusChange('interview')}
              title="Mülakat aşamasına taşı"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <span>Mülakat</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
          {app.status === 'interview' && (
            <button
              onClick={() => handleStatusChange('offer')}
              title="Teklif aşamasına taşı"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Teklif Aldı</span>
            </button>
          )}

          <button
            onClick={() => openModal(app._id)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            Düzenle
          </button>
        </div>
      </div>

      {/* Note or Overdue Template (if any) */}
      {(cleanNote || overdue) && (
        <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {cleanNote ? (
            <p className="text-muted-foreground leading-relaxed line-clamp-1 italic font-normal">
              &ldquo;{cleanNote}&rdquo;
            </p>
          ) : <div />}

          {overdue && (
            <button
              onClick={handleCopyTemplate}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer shrink-0"
            >
              <Copy className="h-3 w-3" />
              <span>Takip şablonunu kopyala</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
