'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Application, ApplicationStatus, FilterKey, Resume } from '@/types'
import {
  STATUS_LABELS,
  CHANNEL_LABELS,
  isOverdue,
  getWeeklyData,
  getResumeStats,
  daysSinceApplied,
} from '@/lib/utils/applications'
import { useUIStore } from '@/lib/store/ui'
import { Button } from '@/components/ui/button'
import {
  FileText,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  MessageSquare,
  Calendar,
  ArrowRight,
  Target,
  Zap,
  AlertCircle,
  Send,
  Briefcase,
  ChevronRight,
  Trophy,
  Users,
  Compass,
  Eye,
  EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsViewProps {
  applications: Application[]
  resumes?: Resume[]
  overdueDays?: number
}

const STATUS_META: Record<
  ApplicationStatus,
  {
    label: string
    color: string
    bgClass: string
    textClass: string
    dotClass: string
    desc: string
  }
> = {
  preparing: {
    label: 'Hazırlanıyor',
    color: '#71717a',
    bgClass: 'bg-zinc-500/10 border-zinc-500/20',
    textClass: 'text-zinc-600 dark:text-zinc-300',
    dotClass: 'bg-zinc-500',
    desc: 'CV ve motivasyon mektubu hazırlık aşamasında',
  },
  waiting: {
    label: 'Bekleniyor',
    color: '#3b82f6',
    bgClass: 'bg-blue-500/10 border-blue-500/20',
    textClass: 'text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-500',
    desc: 'Başvuru gönderildi, şirketten ilk dönüş bekleniyor',
  },
  responded: {
    label: 'Dönüş Aldı',
    color: '#8b5cf6',
    bgClass: 'bg-violet-500/10 border-violet-500/20',
    textClass: 'text-violet-600 dark:text-violet-400',
    dotClass: 'bg-violet-500',
    desc: 'İK veya teknik ekipten ilk olumlu iletişim kuruldu',
  },
  interview: {
    label: 'Mülakat',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/10 border-amber-500/20',
    textClass: 'text-amber-600 dark:text-amber-400',
    dotClass: 'bg-amber-500',
    desc: 'Aktif mülakat, vaka çalışması veya teknik değerlendirme',
  },
  offer: {
    label: 'Teklif Alındı',
    color: '#10b981',
    bgClass: 'bg-emerald-500/10 border-emerald-500/20',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
    desc: 'Süreç başarıyla tamamlandı ve iş teklifi alındı',
  },
  rejected: {
    label: 'Olumsuz / Kapandı',
    color: '#ef4444',
    bgClass: 'bg-rose-500/10 border-rose-500/20',
    textClass: 'text-rose-600 dark:text-rose-400',
    dotClass: 'bg-rose-500',
    desc: 'Bu pozisyon için süreç olumsuz sonuçlandı',
  },
}

const DEMO_ANALYTICS_APPS: Application[] = [
  {
    _id: 'd1' as any,
    _creationTime: Date.now() - 14 * 86400000,
    userId: 'demo-user',
    company: 'TechCorp',
    position: 'Frontend Engineer',
    status: 'offer',
    appliedAt: '2026-09-25',
    channel: 'linkedin',
    hrContacted: true,
    resumeId: 'r1' as any,
    cvVersion: 'Harvard Frontend CV',
  },
  {
    _id: 'd2' as any,
    _creationTime: Date.now() - 10 * 86400000,
    userId: 'demo-user',
    company: 'CloudScale',
    position: 'Product Engineer (Yeni Mezun)',
    status: 'interview',
    appliedAt: '2026-10-02',
    interviewAt: '2026-10-22',
    channel: 'linkedin',
    hrContacted: true,
    resumeId: 'r1' as any,
    cvVersion: 'Harvard Frontend CV',
  },
  {
    _id: 'd3' as any,
    _creationTime: Date.now() - 18 * 86400000,
    userId: 'demo-user',
    company: 'DataFlow',
    position: 'React Developer',
    status: 'responded',
    appliedAt: '2026-09-28',
    channel: 'online',
    hrContacted: true,
    resumeId: 'r1' as any,
    cvVersion: 'Harvard Frontend CV',
  },
  {
    _id: 'd4' as any,
    _creationTime: Date.now() - 19 * 86400000,
    userId: 'demo-user',
    company: 'Streamline',
    position: 'Associate Software Engineer',
    status: 'waiting',
    appliedAt: '2026-09-20',
    channel: 'linkedin',
    hrContacted: false,
    resumeId: 'r1' as any,
    cvVersion: 'Harvard Frontend CV',
  },
  {
    _id: 'd5' as any,
    _creationTime: Date.now() - 5 * 86400000,
    userId: 'demo-user',
    company: 'Apex Solutions',
    position: 'Fullstack Management Trainee',
    status: 'interview',
    appliedAt: '2026-10-10',
    interviewAt: '2026-10-24',
    channel: 'referral',
    hrContacted: true,
    resumeId: 'r2' as any,
    cvVersion: 'Fullstack & AI CV',
  },
  {
    _id: 'd6' as any,
    _creationTime: Date.now() - 8 * 86400000,
    userId: 'demo-user',
    company: 'Nova Systems',
    position: 'Junior Software Engineer',
    status: 'rejected',
    appliedAt: '2026-10-04',
    channel: 'online',
    hrContacted: false,
    resumeId: 'r2' as any,
    cvVersion: 'Fullstack & AI CV',
  },
  {
    _id: 'd7' as any,
    _creationTime: Date.now() - 2 * 86400000,
    userId: 'demo-user',
    company: 'Horizon Labs',
    position: 'Part-Time Frontend Student',
    status: 'waiting',
    appliedAt: '2026-10-14',
    channel: 'linkedin',
    hrContacted: false,
    resumeId: 'r1' as any,
    cvVersion: 'Harvard Frontend CV',
  },
  {
    _id: 'd8' as any,
    _creationTime: Date.now(),
    userId: 'demo-user',
    company: 'Vertex Tech',
    position: 'Genç Yetenek Programı',
    status: 'preparing',
    appliedAt: '2026-10-16',
    channel: 'form',
    hrContacted: false,
    resumeId: 'r1' as any,
    cvVersion: 'Harvard Frontend CV',
  },
]

const DEMO_ANALYTICS_RESUMES: Resume[] = [
  {
    _id: 'r1' as any,
    _creationTime: Date.now(),
    userId: 'demo-user',
    name: 'Harvard Frontend CV',
    category: 'Frontend & UI',
    isDefault: true,
    targetRole: 'Frontend Developer',
  },
  {
    _id: 'r2' as any,
    _creationTime: Date.now(),
    userId: 'demo-user',
    name: 'Fullstack & AI CV',
    category: 'Fullstack Mühendislik',
    isDefault: false,
    targetRole: 'Fullstack Engineer',
  },
]

const tooltipStyle = {
  backgroundColor: 'var(--card)',
  color: 'var(--card-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
}

export function AnalyticsView({
  applications,
  resumes = [],
  overdueDays = 14,
}: AnalyticsViewProps) {
  const [showDemoAnalytics, setShowDemoAnalytics] = useState(true)
  const { setView, setFilter, setResumeFilter, openModal } = useUIStore()

  const isDemo = applications.length === 0 && showDemoAnalytics
  const effectiveApps = isDemo ? DEMO_ANALYTICS_APPS : applications
  const effectiveResumes = isDemo ? DEMO_ANALYTICS_RESUMES : resumes

  const analytics = useMemo(() => {
    const total = effectiveApps.length
    const sentApps = effectiveApps.filter((a) => a.status !== 'preparing')
    const sentCount = sentApps.length || 1

    const positiveApps = effectiveApps.filter((a) =>
      ['responded', 'interview', 'offer'].includes(a.status)
    )
    const interviewStageApps = effectiveApps.filter((a) =>
      ['interview', 'offer'].includes(a.status)
    )
    const offerApps = effectiveApps.filter((a) => a.status === 'offer')
    const anyResponseApps = effectiveApps.filter((a) =>
      ['responded', 'interview', 'offer', 'rejected'].includes(a.status)
    )
    const overdueApps = effectiveApps.filter((a) => isOverdue(a, overdueDays))

    const positiveRate =
      total > 0 ? Math.round((positiveApps.length / sentCount) * 100) : 0
    const interviewRate =
      total > 0 ? Math.round((interviewStageApps.length / sentCount) * 100) : 0
    const responseRate =
      total > 0 ? Math.round((anyResponseApps.length / sentCount) * 100) : 0

    // HR Contact Multiplier calculation
    const hrYesApps = effectiveApps.filter((a) => a.hrContacted)
    const hrNoApps = effectiveApps.filter((a) => !a.hrContacted && a.status !== 'preparing')

    const hrYesPositive = hrYesApps.filter((a) =>
      ['responded', 'interview', 'offer'].includes(a.status)
    ).length
    const hrNoPositive = hrNoApps.filter((a) =>
      ['responded', 'interview', 'offer'].includes(a.status)
    ).length

    const hrYesRate =
      hrYesApps.length > 0 ? Math.round((hrYesPositive / hrYesApps.length) * 100) : 0
    const hrNoRate =
      hrNoApps.length > 0 ? Math.round((hrNoPositive / hrNoApps.length) * 100) : 0

    // Channel breakdown with conversion rate
    const channelStats = Object.keys(CHANNEL_LABELS)
      .map((key) => {
        const chApps = effectiveApps.filter((a) => a.channel === key)
        const chPositive = chApps.filter((a) =>
          ['responded', 'interview', 'offer'].includes(a.status)
        ).length
        const convRate =
          chApps.length > 0 ? Math.round((chPositive / chApps.length) * 100) : 0
        return {
          key,
          name: CHANNEL_LABELS[key],
          count: chApps.length,
          positiveCount: chPositive,
          conversionRate: convRate,
        }
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)

    // Status breakdown
    const statusBreakdown = (Object.keys(STATUS_META) as ApplicationStatus[]).map(
      (statusKey) => {
        const count = effectiveApps.filter((a) => a.status === statusKey).length
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0
        return {
          key: statusKey,
          ...STATUS_META[statusKey],
          count,
          percentage,
        }
      }
    )

    // Career Momentum Score (0 - 100 user-friendly composite health score)
    const activityPoints = Math.min(35, total * 4)
    const positivePoints = Math.min(35, positiveRate * 0.7)
    const networkingPoints =
      total > 0 ? Math.min(20, Math.round((hrYesApps.length / total) * 30)) : 0
    const hygienePoints = Math.max(0, 10 - overdueApps.length * 2)
    const momentumScore = Math.min(
      100,
      Math.round(activityPoints + positivePoints + networkingPoints + hygienePoints)
    )

    return {
      total,
      sentCount: sentApps.length,
      positiveCount: positiveApps.length,
      interviewStageCount: interviewStageApps.length,
      offerCount: offerApps.length,
      anyResponseCount: anyResponseApps.length,
      overdueApps,
      positiveRate,
      interviewRate,
      responseRate,
      hrYesCount: hrYesApps.length,
      hrYesRate,
      hrNoRate,
      channelStats,
      statusBreakdown,
      momentumScore,
    }
  }, [effectiveApps, overdueDays])

  const weeklyData = useMemo(() => getWeeklyData(effectiveApps, 8), [effectiveApps])
  const thisWeekCount = weeklyData[weeklyData.length - 1]?.count ?? 0
  const lastWeekCount = weeklyData[weeklyData.length - 2]?.count ?? 0

  const resumeStats = useMemo(
    () =>
      getResumeStats(effectiveApps, effectiveResumes).sort(
        (a, b) => b.responseRate - a.responseRate || b.count - a.count
      ),
    [effectiveApps, effectiveResumes]
  )

  const bestResume = useMemo(
    () => resumeStats.find((r) => r.count > 0) ?? null,
    [resumeStats]
  )

  function navigateToFilteredList(filterKey: FilterKey, resumeId = 'all') {
    setFilter(filterKey)
    setResumeFilter(resumeId)
    setView('list')
  }

  if (applications.length === 0 && !showDemoAnalytics) {
    return (
      <div
        data-tour="analytics-view-section"
        className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-card border border-dashed rounded-2xl p-8"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Compass className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-base font-bold text-foreground">
            Kariyer Analiz Pusulanız Hazır
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            İlk başvurunuzu eklediğinizde burada başvuru huninizi, hangi CV&apos;nin daha çok mülakat getirdiğini ve kişisel kariyer tavsiyelerini göreceksiniz.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openModal()} className="text-xs gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            İlk Başvurumu Ekle
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDemoAnalytics(true)}
            className="text-xs gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            Örnek Görünümü Aç
          </Button>
        </div>
      </div>
    )
  }

  // Generate friendly natural-language coaching insight
  const coachHeadline =
    analytics.offerCount > 0
      ? `Harika gidiyorsunuz! ${analytics.total} başvurudan ${analytics.offerCount} iş teklifi ve ${analytics.interviewStageCount} mülakat aşamasına ulaştınız.`
      : analytics.interviewStageCount > 0
        ? `Süreciniz güçlü ilerliyor: Gönderilen başvurularınızın %${analytics.interviewRate}'i mülakat aşamasına geçti.`
        : analytics.positiveCount > 0
          ? `İlk dönüşler gelmeye başladı! Toplam ${analytics.positiveCount} başvurudan olumlu geri dönüş aldınız.`
          : `Başvuru huniniz oluşuyor. İK ile doğrudan iletişim kurarak geri dönüş hızınızı 2 kata kadar artırabilirsiniz.`

  const coachSubtext =
    analytics.hrYesRate > analytics.hrNoRate && analytics.hrYesCount > 0
      ? `İK ile doğrudan iletişime geçtiğiniz başvurularda olumlu dönüş oranınız %${analytics.hrYesRate} iken, iletişime geçilmeyenlerde %${analytics.hrNoRate}. Başvuru sonrası LinkedIn üzerinden İK uzmanına kısa bir mesaj atmak en güçlü kaldıracınız!`
      : analytics.overdueApps.length > 0
        ? `${analytics.overdueApps.length} başvurunuz ${overdueDays} günü aşkın süredir sessiz bekliyor. Kısa bir hatırlatma (follow-up) e-postası göndermek süreci yeniden canlandırabilir.`
        : `Haftalık başvuru temponuzu koruyarak ve her ilana özel CV eşleştirerek mülakat dönüşüm oranınızı yükseltebilirsiniz.`

  const funnelSteps = [
    {
      id: 'all' as FilterKey,
      step: '1. Adım',
      title: 'Toplam Başvuru',
      subtitle: `${analytics.sentCount} gönderildi • ${analytics.total - analytics.sentCount} hazırlanıyor`,
      count: analytics.total,
      rate: 100,
      colorClass: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
      barClass: 'bg-blue-500',
      icon: Send,
    },
    {
      id: 'responded' as FilterKey,
      step: '2. Adım',
      title: 'Olumlu İlk Dönüş',
      subtitle: 'İK dönüşü, değerlendirme veya mülakat',
      count: analytics.positiveCount,
      rate: analytics.positiveRate,
      colorClass:
        'from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400',
      barClass: 'bg-violet-500',
      icon: MessageSquare,
    },
    {
      id: 'interview' as FilterKey,
      step: '3. Adım',
      title: 'Mülakat Aşaması',
      subtitle: 'Teknik görüşme veya İK mülakatı',
      count: analytics.interviewStageCount,
      rate: analytics.interviewRate,
      colorClass:
        'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
      barClass: 'bg-amber-500',
      icon: Calendar,
    },
    {
      id: 'offer' as FilterKey,
      step: '4. Adım',
      title: 'İş Teklifi (Offer)',
      subtitle: 'Resmi teklif alınan başvurular',
      count: analytics.offerCount,
      rate:
        analytics.sentCount > 0
          ? Math.round((analytics.offerCount / analytics.sentCount) * 100)
          : 0,
      colorClass:
        'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
      barClass: 'bg-emerald-500',
      icon: Trophy,
    },
  ]

  return (
    <div data-tour="analytics-view-section" className="space-y-5 pb-16">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-primary/5 border border-primary/25 rounded-xl px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" />
              Örnek Veri Modu
            </span>
            <span className="text-muted-foreground">
              Henüz başvuru eklemediğiniz için interaktif kariyer analiz ekranının örnek önizlemesini görüyorsunuz.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoAnalytics(false)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold self-start sm:self-auto cursor-pointer shrink-0"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Örnek Veriyi Gizle
          </button>
        </div>
      )}

      {/* 1. HERO: Smart Career Coach & Momentum Score */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-slate-900 via-indigo-950/95 to-slate-900 text-white p-5 sm:p-6 shadow-lg">
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Coaching Narrative */}
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-indigo-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>AKILLI KARİYER PUSULASI & SÜREÇ ÖZETİ</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
              {coachHeadline}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              {coachSubtext}
            </p>

            {/* Quick Interactive Shortcuts */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              {analytics.overdueApps.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigateToFilteredList('overdue')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>
                    {analytics.overdueApps.length} Sessiz Başvuruyu Takip Et
                  </span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setView('studio')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                <span>İlana Özel CV Üret</span>
              </button>

              <button
                type="button"
                onClick={() => setView('programs')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Briefcase className="h-3.5 w-3.5 text-emerald-300" />
                <span>Staj & Kurumsal İlanları Keşfet</span>
              </button>
            </div>
          </div>

          {/* Right: Visual Momentum Score Ring & Mini Highlights */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-between gap-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke={
                      analytics.momentumScore >= 70
                        ? '#10b981'
                        : analytics.momentumScore >= 45
                          ? '#6366f1'
                          : '#f59e0b'
                    }
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${(analytics.momentumScore / 100) * 201} 201`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-white leading-none">
                    {analytics.momentumScore}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-300 mt-0.5">
                    Puan
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Kariyer Momentum Skoru
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Başvuru aktifliğiniz, İK iletişiminiz ve mülakat dönüşümünüze göre hesaplanır.
                </p>
                <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>
                    {analytics.momentumScore >= 75
                      ? 'Çok Güçlü Tempo'
                      : analytics.momentumScore >= 50
                        ? 'Dengeli İlerleyiş'
                        : 'Hızlanma Fırsatı Var'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VISUAL APPLICATION PIPELINE FUNNEL (Başvuru Yolculuğu Hunisi) */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Başvuru Yolculuğu & Dönüşüm Hunisi
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Başvurularınızın hangi aşamada olduğunu görün. Herhangi bir aşamaya tıklayarak o başvuruları filtreleyebilirsiniz.
            </p>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            Toplam Yanıtlanma Oranı:{' '}
            <strong className="text-foreground">%{analytics.responseRate}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {funnelSteps.map((step, idx) => {
            const Icon = step.icon
            return (
              <button
                key={step.title}
                type="button"
                onClick={() => navigateToFilteredList(step.id)}
                className="group relative text-left rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/50 hover:border-primary/40 p-4 transition-all cursor-pointer flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {step.step}
                    </span>
                    <div className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {step.title}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg bg-gradient-to-br border flex items-center justify-center shrink-0',
                      step.colorClass
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-2xl font-extrabold text-foreground">
                      {step.count}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-background border border-border text-foreground">
                      %{step.rate}
                    </span>
                  </div>

                  {/* Visual progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', step.barClass)}
                      style={{ width: `${Math.max(6, step.rate)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                    <span className="truncate">{step.subtitle}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                  </div>
                </div>

                {idx < funnelSteps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-card border border-border items-center justify-center text-muted-foreground shadow-2xs">
                    <ChevronRight className="h-3 w-3" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. HUMAN-CENTRIC INSIGHT CARDS (3 Columns: Networking Effect, Weekly Tempo, Actionable Follow-ups) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card A: HR Contact Multiplier */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Users className="h-4 w-4 text-violet-500" />
                İK İletişimi & Referans Etkisi
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                {analytics.hrYesCount} Başvuruda Yazıldı
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Başvuru yaptıktan sonra İK uzmanına veya ekip liderine ulaşmanın olumlu dönüşe etkisi:
            </p>
          </div>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  İK ile İletişime Geçilenler
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  %{analytics.hrYesRate} Olumlu Dönüş
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.max(5, analytics.hrYesRate)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Sadece Online Başvuru Yapılanlar
                </span>
                <span className="font-bold text-muted-foreground">
                  %{analytics.hrNoRate} Olumlu Dönüş
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-400 dark:bg-slate-600 transition-all"
                  style={{ width: `${Math.max(5, analytics.hrNoRate)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              {analytics.hrYesRate > analytics.hrNoRate
                ? `İK'ya yazmak dönüş şansınızı +%${analytics.hrYesRate - analytics.hrNoRate} artırıyor.`
                : 'Başvurularınızda İK kutucuğunu işaretleyerek etkiyi ölçün.'}
            </span>
          </div>
        </div>

        {/* Card B: Weekly Momentum Area Chart */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Haftalık Başvuru Ritmi (Son 8 Hafta)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Düzenli başvuru alışkanlığınızın zaman içindeki seyri
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-extrabold text-foreground leading-none">
                {thisWeekCount}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Bu hafta (Geçen: {lastWeekCount})
              </div>
            </div>
          </div>

          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ left: -20, right: 5, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="weeklyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Başvuru Sayısı"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#weeklyAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Son 8 haftada toplam {weeklyData.reduce((acc, w) => acc + w.count, 0)} başvuru</span>
            <button
              type="button"
              onClick={() => openModal()}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              + Yeni Ekle
            </button>
          </div>
        </div>

        {/* Card C: Actionable Follow-up & Silent Applications Assistant */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Takip & Hatırlatma Asistanı
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {overdueDays}+ gündür yanıt bekleyen ve aksiyon gerektiren başvurular
              </p>
            </div>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-bold',
                analytics.overdueApps.length > 0
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              )}
            >
              {analytics.overdueApps.length} Bekleyen
            </span>
          </div>

          {analytics.overdueApps.length > 0 ? (
            <div className="space-y-2 my-auto">
              {analytics.overdueApps.slice(0, 3).map((app) => {
                const days = daysSinceApplied(app)
                return (
                  <div
                    key={app._id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate">{app.company}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {app.position}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                      {days ? `${days} gündür sessiz` : 'Yanıt bekleniyor'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-1.5 my-auto bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <div className="text-xs font-bold text-foreground">
                Gecikmiş Başvurunuz Yok!
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tüm aktif başvurularınız güncel takip süresi içinde ilerliyor.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-border/60 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Takip e-postası şablonu hazır
            </span>
            <button
              type="button"
              onClick={() =>
                navigateToFilteredList(analytics.overdueApps.length > 0 ? 'overdue' : 'waiting')
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <span>Listede Gör</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. CV PERFORMANCE LEADERBOARD (Hangi CV Daha Çok İşe Yarıyor?) */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              CV Versiyonları Başarı Sıralaması (A/B Karşılaştırması)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hangi özgeçmişinizin İK taramasından geçip daha yüksek oranda mülakat ve dönüş getirdiğini karşılaştırın.
            </p>
          </div>

          {bestResume && bestResume.responseRate > 0 && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto">
              <Award className="h-3.5 w-3.5" />
              <span>
                En Yüksek Dönüşüm: {bestResume.resume.name} (%{bestResume.responseRate})
              </span>
            </div>
          )}
        </div>

        {resumeStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {resumeStats.map(({ resume, count, respondedCount, responseRate }, idx) => {
              const isTop = idx === 0 && count > 0 && responseRate > 0
              return (
                <div
                  key={resume._id}
                  className={cn(
                    'rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all',
                    isTop
                      ? 'border-primary/40 bg-primary/5 shadow-xs'
                      : 'border-border/80 bg-muted/20 hover:bg-muted/40'
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isTop && (
                            <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-extrabold uppercase">
                              #1 Lider CV
                            </span>
                          )}
                          <span className="text-[11px] font-medium text-muted-foreground truncate">
                            {resume.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-foreground truncate mt-0.5">
                          {resume.name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-extrabold text-primary leading-none">
                          %{responseRate}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Dönüş Oranı
                        </div>
                      </div>
                    </div>

                    {/* Visual Conversion Bar */}
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isTop ? 'bg-primary' : 'bg-blue-500'
                        )}
                        style={{ width: `${Math.max(count > 0 ? 6 : 0, responseRate)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>
                        <strong className="text-foreground">{count}</strong> Başvuru
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {respondedCount}
                        </strong>{' '}
                        Olumlu Dönüş
                      </span>
                    </div>

                    {count > 0 && !isDemo && (
                      <button
                        type="button"
                        onClick={() => navigateToFilteredList('all', resume._id)}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Başvuruları Gör →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <p className="text-xs text-muted-foreground">
              Henüz CV Havuzunuza bir özgeçmiş eklemediniz.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setView('resumes')}
              className="text-xs"
            >
              CV Havuzuna Git
            </Button>
          </div>
        )}
      </div>

      {/* 5. BOTTOM ROW: Interactive Status Breakdown + Channel Conversion Effectiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left (7 cols): Interactive Status Breakdown with descriptions */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Detaylı Durum Dağılımı
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Her bir durumdaki başvuru sayınız ve toplam içindeki payı (Filtrelemek için satıra tıklayın)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Donut Chart */}
            <div className="md:col-span-5 h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusBreakdown.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {analytics.statusBreakdown
                      .filter((s) => s.count > 0)
                      .map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-foreground leading-none">
                  {analytics.total}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Toplam
                </span>
              </div>
            </div>

            {/* Interactive Status Rows */}
            <div className="md:col-span-7 space-y-2">
              {analytics.statusBreakdown.map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => navigateToFilteredList(st.key)}
                  className="w-full flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-muted/60 border border-transparent hover:border-border transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', st.dotClass)} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {st.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {st.desc}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-foreground">
                      {st.count}
                    </span>
                    <span className="text-[10px] text-muted-foreground w-9 text-right">
                      (%{st.percentage})
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right (5 cols): Channel Effectiveness (Hangi Kanal Daha Verimli?) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Başvuru Kanalları Verimliliği
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hangi platform veya kanal üzerinden yaptığınız başvurular daha çok mülakata dönüşüyor?
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {analytics.channelStats.map((ch) => (
              <div
                key={ch.key}
                className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{ch.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {ch.count} başvuru • {ch.positiveCount} olumlu
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px]">
                      %{ch.conversionRate} Dönüş
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.max(8, ch.conversionRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
            💡 <strong>İpucu:</strong> Referans ve doğrudan LinkedIn İK mesajlarıyla desteklenen başvurular genellikle en yüksek mülakat dönüşümünü sağlar.
          </div>
        </div>
      </div>
    </div>
  )
}
