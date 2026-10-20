'use client'

import { useState } from 'react'
import type { Application, ApplicationStatus } from '@/types'
import { ApplicationCard } from './ApplicationCard'
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
import {
  PackageOpen,
  LayoutGrid,
  List,
  ExternalLink,
  FileText,
  Copy,
  CheckCircle2,
  Sparkles,
  X,
  Edit3,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { useUIStore } from '@/lib/store/ui'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Id } from '@/convex/_generated/dataModel'

interface ApplicationListProps {
  applications: Application[]
  overdueDays?: number
}

const DEMO_APPLICATION: Application = {
  _id: 'demo-app-1' as any,
  _creationTime: Date.now() - 16 * 24 * 60 * 60 * 1000,
  userId: 'demo-user',
  company: 'Örnek Teknoloji A.Ş. (Örnek Başvuru)',
  position: 'Senior Frontend Developer',
  status: 'waiting',
  appliedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  channel: 'linkedin',
  cvVersion: 'Frontend Developer CV',
  jobLink: 'https://linkedin.com/jobs',
  hrContacted: false,
  note: 'LinkedIn Easy Apply ile başvuruldu. 16 gündür geri dönüş yok, İK takip şablonu kopyalanabilir.',
}

const PIPELINE_STAGES: ApplicationStatus[] = [
  'preparing',
  'waiting',
  'responded',
  'interview',
  'offer',
  'rejected',
]

const STATUS_DOT: Record<ApplicationStatus, string> = {
  preparing: 'bg-zinc-400',
  waiting: 'bg-blue-500',
  responded: 'bg-purple-500',
  interview: 'bg-amber-500',
  offer: 'bg-emerald-500',
  rejected: 'bg-rose-500',
}

const STATUS_PILL: Record<ApplicationStatus, string> = {
  preparing: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20',
  waiting: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  responded: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  interview: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  offer: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  rejected: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
}

function getInitials(company: string): string {
  const words = company
    .replace(/\([^)]*\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return 'GC'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function ApplicationList({ applications, overdueDays = 14 }: ApplicationListProps) {
  const { openModal, uiMode } = useUIStore()
  const isAward = uiMode === 'award'
  const [showDemoApp, setShowDemoApp] = useState(true)
  const [layoutStyle, setLayoutStyle] = useState<'linear' | 'bento'>('linear')
  const [inspectedId, setInspectedId] = useState<string | null>(null)

  const updateMutation = useMutation(api.applications.update)
  const { toast } = useToast()

  const inspectedApp = applications.find((a) => a._id === inspectedId) || null

  async function handleQuickStatus(app: Application, newStatus: ApplicationStatus) {
    if (app.status === newStatus) return
    try {
      await updateMutation({
        id: app._id as Id<'applications'>,
        status: newStatus,
      })
      toast({ title: `${app.company} → ${STATUS_LABELS[newStatus]}` })
    } catch {
      toast({ title: 'Durum güncellenemedi', variant: 'destructive' })
    }
  }

  async function handleCopyFollowUp(app: Application) {
    const template = generateFollowUpTemplate(app)
    await navigator.clipboard.writeText(template)
    toast({ title: 'İK Takip Mesajı Kopyalandı ✓' })
  }

  if (applications.length === 0) {
    return (
      <div data-tour="applications-list-section" className="space-y-4">
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-card border border-dashed rounded-2xl p-6 craft-surface">
          <PackageOpen className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-foreground font-semibold text-sm">Listenizde Henüz Başvuru Yok</p>
            <p className="text-muted-foreground text-xs mt-1">
              İş başvurularınızı kaydedin veya İlan Radarından tek tıkla buraya aktarın.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => openModal()} className="h-8 text-xs">
              + İlk Başvurunu Ekle
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDemoApp(!showDemoApp)}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              {showDemoApp ? 'Örnek Başvuruyu Gizle' : 'Örnek Başvuruyu Göster'}
            </Button>
          </div>
        </div>

        {showDemoApp && (
          <div className="space-y-2 border border-border/80 bg-card rounded-2xl p-4 craft-surface">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/40">
              <span className="font-semibold text-foreground">
                Örnek Başvuru Kartı (14 Gün Üzeri Sessiz Uyarısı ve İK Şablonu)
              </span>
              <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Örnek Gösterim
              </span>
            </div>
            <ApplicationCard app={DEMO_APPLICATION} overdueDays={overdueDays} />
          </div>
        )}
      </div>
    )
  }

  // Classic UI Mode -> exact original 2-column grid
  if (!isAward) {
    return (
      <div data-tour="applications-list-section" className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
        {applications.map((app) => (
          <ApplicationCard key={app._id} app={app} overdueDays={overdueDays} />
        ))}
      </div>
    )
  }

  // ============================================================================
  // AWARD UI MODE: Linear High-Density Pipeline Table + Bento Cards + Split Inspector
  // ============================================================================
  return (
    <div data-tour="applications-list-section" className="space-y-3">
      {/* Sub-header: Count + Density Switcher (Linear Satır vs Bento Kart) */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono font-bold text-foreground">{applications.length}</span>
          <span>kayıt listeleniyor</span>
          {inspectedApp && (
            <span className="hidden sm:inline text-[11px] text-primary font-medium">
              · Seçili: {inspectedApp.company}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-xl border border-border/70">
          <button
            type="button"
            onClick={() => setLayoutStyle('linear')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
              layoutStyle === 'linear'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>Linear Satır</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutStyle('bento')}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer',
              layoutStyle === 'bento'
                ? 'bg-card text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Bento Kart</span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace: List/Grid on Left + Slide-Over Inspector on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className={cn(inspectedApp ? 'xl:col-span-7' : 'xl:col-span-12')}>
          {layoutStyle === 'bento' ? (
            <div
              className={cn(
                'grid grid-cols-1 gap-3 items-stretch',
                inspectedApp ? 'lg:grid-cols-1' : 'lg:grid-cols-2'
              )}
            >
              {applications.map((app) => (
                <div
                  key={app._id}
                  onClick={() => setInspectedId(inspectedId === app._id ? null : app._id)}
                  className="cursor-pointer"
                >
                  <ApplicationCard app={app} overdueDays={overdueDays} />
                </div>
              ))}
            </div>
          ) : (
            /* LINEAR-STYLE HIGH-DENSITY INTERACTIVE TABLE */
            <div className="bg-card border border-border/85 rounded-2xl overflow-hidden craft-surface divide-y divide-border/60">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2.5 bg-muted/35 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                <div className="col-span-4">Şirket & Pozisyon</div>
                <div className="col-span-2">Durum Aşaması</div>
                <div className="col-span-2">CV & Uyum</div>
                <div className="col-span-2">Kanal & Zaman</div>
                <div className="col-span-2 text-right">Hızlı Aksiyon</div>
              </div>

              {applications.map((app) => {
                const overdue = isOverdue(app, overdueDays)
                const days = daysSinceApplied(app)
                const daysText = days === null ? '—' : days === 0 ? 'Bugün' : days === 1 ? 'Dün' : `${days}g önce`
                const matchScoreMatch = app.note?.match(/Uyumluluk(?: Skoru)?:\s*%?(\d+)/i)
                const matchScore = matchScoreMatch ? matchScoreMatch[1] : null
                const isSelected = inspectedId === app._id

                return (
                  <div
                    key={app._id}
                    onClick={() => setInspectedId(isSelected ? null : app._id)}
                    className={cn(
                      'group grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-4 py-3 items-center transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary/[0.08] hover:bg-primary/[0.11]'
                        : overdue
                          ? 'bg-red-500/[0.03] hover:bg-red-500/[0.07]'
                          : 'hover:bg-muted/45'
                    )}
                  >
                    {/* 1. Company & Position */}
                    <div className="md:col-span-4 flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-xl border flex items-center justify-center font-mono font-bold text-[11px] shrink-0 transition-transform group-hover:scale-105',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-primary/10 text-primary border-primary/20'
                        )}
                      >
                        {getInitials(app.company)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {app.company}
                          </span>
                          {overdue && (
                            <span
                              title="14+ gündür sessiz"
                              className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0"
                            />
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {app.position}
                        </div>
                      </div>
                    </div>

                    {/* 2. Status Pill */}
                    <div className="md:col-span-2 flex items-center" onClick={(e) => e.stopPropagation()}>
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold',
                          STATUS_PILL[app.status]
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[app.status])} />
                        <select
                          value={app.status}
                          onChange={(e) => handleQuickStatus(app, e.target.value as ApplicationStatus)}
                          className="bg-transparent focus:outline-none cursor-pointer font-semibold text-[11px]"
                        >
                          {Object.entries(STATUS_LABELS).map(([k, lbl]) => (
                            <option key={k} value={k} className="bg-card text-foreground">
                              {lbl}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 3. CV & Match Score */}
                    <div className="md:col-span-2 flex items-center gap-1.5 flex-wrap min-w-0">
                      {matchScore && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Sparkles className="h-2.5 w-2.5" />%{matchScore}
                        </span>
                      )}
                      {app.cvVersion ? (
                        <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                          {app.cvVersion.replace(/\.pdf$/i, '')}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40">—</span>
                      )}
                    </div>

                    {/* 4. Channel & Time */}
                    <div className="md:col-span-2 flex items-center gap-2 text-[11px]">
                      <span
                        className={cn(
                          'font-mono tabular-nums',
                          overdue ? 'text-red-500 font-bold' : 'text-muted-foreground'
                        )}
                      >
                        {daysText}
                      </span>
                      {app.channel && (
                        <span className="text-[10px] text-muted-foreground/75 hidden sm:inline">
                          · {CHANNEL_LABELS[app.channel] ?? app.channel}
                        </span>
                      )}
                    </div>

                    {/* 5. Quick Actions */}
                    <div
                      className="md:col-span-2 flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openModal(app._id)}
                        className="px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectedId(isSelected ? null : app._id)}
                        className={cn(
                          'p-1.5 rounded-lg transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                        title="Detay çekmecesini aç"
                      >
                        <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', isSelected && 'rotate-90')} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* =====================================================================
            SLIDE-OVER QUICK INSPECTOR PANEL (Progressive Disclosure Detail View)
            ===================================================================== */}
        {inspectedApp && (
          <div className="xl:col-span-5 bg-card border border-border/90 rounded-2xl p-5 space-y-4 craft-surface sticky top-20 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/12 border border-primary/25 text-primary flex items-center justify-center font-mono font-bold text-sm shrink-0">
                  {getInitials(inspectedApp.company)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-foreground truncate">
                    {inspectedApp.company}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {inspectedApp.position}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openModal(inspectedApp._id)}
                  className="h-7 px-2.5 text-[11px] gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  Düzenle
                </Button>
                <button
                  type="button"
                  onClick={() => setInspectedId(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Interactive 6-Stage Pipeline Stepper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Aşama Hattı (Tıkla & Güncelle)
                </span>
                <span className="font-semibold text-primary">
                  {STATUS_LABELS[inspectedApp.status]}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {PIPELINE_STAGES.map((stage) => {
                  const active = inspectedApp.status === stage
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => handleQuickStatus(inspectedApp, stage)}
                      className={cn(
                        'px-2 py-1.5 rounded-xl border text-[10px] font-semibold text-center transition-all cursor-pointer active:scale-95',
                        active
                          ? STATUS_PILL[stage] + ' ring-1 ring-current'
                          : 'bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {STATUS_LABELS[stage]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Telemetry Metadata Grid */}
            <div className="grid grid-cols-2 gap-2.5 bg-muted/30 p-3 rounded-xl border border-border/60 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Başvuru Tarihi
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatDate(inspectedApp.appliedAt) || 'Belirtilmedi'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Kanal & İK
                </span>
                <span className="font-semibold text-foreground">
                  {(inspectedApp.channel && CHANNEL_LABELS[inspectedApp.channel]) || 'Online'}{' '}
                  {inspectedApp.hrContacted ? '· ✓ İK Yazıldı' : ''}
                </span>
              </div>
            </div>

            {/* Links Row */}
            <div className="flex flex-wrap items-center gap-2">
              {safeUrl(inspectedApp.jobLink) && (
                <a
                  href={safeUrl(inspectedApp.jobLink)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-medium text-foreground transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  <span>İlan Sayfasını Aç</span>
                </a>
              )}
              {getDirectDownloadUrl(inspectedApp.cvLink) && (
                <a
                  href={getDirectDownloadUrl(inspectedApp.cvLink)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-xs font-semibold text-primary border border-primary/20 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Kullanılan CV&apos;yi Aç</span>
                </a>
              )}
            </div>

            {/* Notes */}
            {inspectedApp.note && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Başvuru Notu & AI Özeti
                </span>
                <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/60 leading-relaxed whitespace-pre-wrap">
                  {inspectedApp.note}
                </p>
              </div>
            )}

            {/* Follow-up Template Generator */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Hazır İK Takip (Follow-up) Şablonu
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyFollowUp(inspectedApp)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  Kopyala
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground bg-muted/25 p-2.5 rounded-xl border border-border/50 leading-relaxed line-clamp-3">
                {generateFollowUpTemplate(inspectedApp)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
