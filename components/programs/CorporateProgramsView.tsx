'use client'

import { useState, useEffect, useMemo } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUIStore } from '@/lib/store/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type {
  Application,
  CorporateProgramItem,
  ProgramCategory,
  ProgramSource,
} from '@/types'
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Award,
  Rocket,
  Compass,
  Briefcase,
  Coins,
  Gift,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CorporateProgramsViewProps {
  applications: Application[]
}

const SOURCE_META: Record<
  ProgramSource,
  {
    label: string
    shortLabel: string
    badgeClass: string
    bannerGradient: string
    portalUrl: string
  }
> = {
  youthall: {
    label: 'Youthall',
    shortLabel: 'Youthall',
    badgeClass:
      'bg-indigo-600/95 text-white border-indigo-400/30 shadow-xs',
    bannerGradient:
      'from-indigo-600 via-violet-600 to-purple-700',
    portalUrl: 'https://www.youthall.com/tr/jobs/',
  },
  microfon: {
    label: 'Microfon.co',
    shortLabel: 'Microfon',
    badgeClass:
      'bg-fuchsia-600/95 text-white border-fuchsia-400/30 shadow-xs',
    bannerGradient:
      'from-fuchsia-600 via-purple-600 to-indigo-700',
    portalUrl: 'https://microfon.co/program',
  },
  anbean: {
    label: 'anbean Kampüs',
    shortLabel: 'anbean',
    badgeClass:
      'bg-rose-600/95 text-white border-rose-400/30 shadow-xs',
    bannerGradient:
      'from-rose-600 via-pink-600 to-orange-500',
    portalUrl: 'https://anbeankampus.co/ilanlar/',
  },
  techcareer: {
    label: 'Techcareer.net',
    shortLabel: 'Techcareer',
    badgeClass:
      'bg-emerald-600/95 text-white border-emerald-400/30 shadow-xs',
    bannerGradient:
      'from-emerald-600 via-teal-600 to-cyan-700',
    portalUrl: 'https://www.techcareer.net/jobs',
  },
  toptalent: {
    label: 'Toptalent.co',
    shortLabel: 'Toptalent',
    badgeClass:
      'bg-amber-600/95 text-white border-amber-400/30 shadow-xs',
    bannerGradient:
      'from-amber-600 via-orange-600 to-red-600',
    portalUrl: 'https://toptalent.co/is-ilanlari',
  },
  university: {
    label: 'Üniversite & Kurumsal',
    shortLabel: 'Üniversite & Kurumsal',
    badgeClass:
      'bg-sky-600/95 text-white border-sky-400/30 shadow-xs',
    bannerGradient:
      'from-sky-600 via-blue-700 to-indigo-800',
    portalUrl: 'https://www.yetenekkapisi.org/',
  },
}

const CATEGORY_META: Record<
  ProgramCategory | 'all',
  {
    label: string
    pillClass: string
  }
> = {
  all: {
    label: 'Tüm İlanlar',
    pillClass: 'bg-muted text-foreground',
  },
  intern: {
    label: 'Stajyer & Part-Time',
    pillClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  fellowship: {
    label: 'Fellowship & Liderlik',
    pillClass:
      'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
  },
  scholarship: {
    label: 'Burs & Eğitim Desteği',
    pillClass:
      'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  },
  talent_program: {
    label: 'Genç Yetenek & MT',
    pillClass:
      'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  },
  bootcamp: {
    label: 'Eğitim, Akademi & Bootcamp',
    pillClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  new_grad: {
    label: 'Yeni Mezun & Junior',
    pillClass:
      'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  opportunity: {
    label: 'Öğrenci Fırsatları',
    pillClass:
      'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
  },
  corporate: {
    label: 'Kurumsal İlanlar',
    pillClass:
      'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  },
}

const UNIVERSITY_CAREER_CENTERS = [
  {
    name: 'Yetenek Kapısı (Ulusal Staj)',
    tag: 'Cumhurbaşkanlığı & Tüm Üni.',
    url: 'https://www.yetenekkapisi.org/',
  },
  {
    name: 'Microfon Burs & Fellowship',
    tag: 'Microfon.co',
    url: 'https://microfon.co/scholarship',
  },
  {
    name: 'İTÜ Kariyer ve Staj Merkezi',
    tag: 'İTÜ KM',
    url: 'https://kariyer.itu.edu.tr/',
  },
  {
    name: 'ODTÜ Kariyer Planlama',
    tag: 'ODTÜ KPM',
    url: 'https://kpm.metu.edu.tr/',
  },
  {
    name: 'Boğaziçi Kariyer Merkezi',
    tag: 'BÜMED & Kariyer',
    url: 'https://career.bogazici.edu.tr/',
  },
  {
    name: 'Koç Üniversitesi Kariyer',
    tag: 'KU Career',
    url: 'https://career.ku.edu.tr/',
  },
  {
    name: 'Sabancı Kariyer & Staj',
    tag: 'SU Career',
    url: 'https://career.sabanciuniv.edu/',
  },
  {
    name: 'Bilkent Kariyer Merkezi',
    tag: 'Bilkent KM',
    url: 'https://kariyer.bilkent.edu.tr/',
  },
]

export function CorporateProgramsView({ applications }: CorporateProgramsViewProps) {
  const [programs, setPrograms] = useState<CorporateProgramItem[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<ProgramSource | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<ProgramCategory | 'all'>('all')
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const createApplication = useMutation(api.applications.create)
  const { openStudioWithJob } = useUIStore()
  const { toast } = useToast()

  async function fetchPrograms(forceRefresh = false) {
    setLoading(true)
    try {
      const url = forceRefresh ? '/api/programs/discover?refresh=true' : '/api/programs/discover'
      const res = await fetch(url)
      if (!res.ok) throw new Error('İlanlar alınamadı')
      const data = await res.json()
      if (Array.isArray(data.programs)) {
        setPrograms(data.programs)
        try {
          localStorage.setItem('gcx_cached_programs', JSON.stringify(data.programs))
          localStorage.setItem('gcx_cached_programs_at', String(Date.now()))
        } catch {}

        if (forceRefresh) {
          toast({
            title: 'Canlı İlanlar & Burslar Yenilendi ✓',
            description: `Kariyer portallarından ${data.programs.length} güncel ilan başarıyla listelendi.`,
          })
        }
      }
    } catch {
      toast({
        title: 'Bağlantı Uyarısı',
        description: 'Bazı kariyer portallarına erişilemedi, mevcut güncel vitrin gösteriliyor.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 1. Önce localStorage'da kayıtlı ilanlar var mı kontrol et
    try {
      const cached = localStorage.getItem('gcx_cached_programs')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPrograms(parsed)
          setLoading(false)
          return // Sekme geçişinde asla gereksiz yere tekrar tarama yapma!
        }
      }
    } catch {}

    // Kayıtlı yoksa ilk kez sessizce getir
    void fetchPrograms(false)
  }, [])

  const sourceCounts = useMemo(() => {
    const base = onlyOpen ? programs.filter((p) => p.isOpen !== false) : programs
    const counts: Record<string, number> = {
      all: base.length,
      youthall: 0,
      microfon: 0,
      anbean: 0,
      techcareer: 0,
      toptalent: 0,
      university: 0,
    }
    for (const p of base) {
      counts[p.source] = (counts[p.source] || 0) + 1
    }
    return counts
  }, [programs, onlyOpen])

  const categoryCounts = useMemo(() => {
    let baseList =
      sourceFilter === 'all'
        ? programs
        : programs.filter((p) => p.source === sourceFilter)

    if (onlyOpen) {
      baseList = baseList.filter((p) => p.isOpen !== false)
    }

    const counts: Record<string, number> = {
      all: baseList.length,
      intern: 0,
      fellowship: 0,
      scholarship: 0,
      talent_program: 0,
      bootcamp: 0,
      new_grad: 0,
      opportunity: 0,
      corporate: 0,
    }
    for (const p of baseList) {
      counts[p.category] = (counts[p.category] || 0) + 1
    }
    return counts
  }, [programs, sourceFilter, onlyOpen])

  const filteredPrograms = useMemo(() => {
    return programs.filter((item) => {
      if (onlyOpen && item.isOpen === false) return false
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const hay =
          `${item.title} ${item.company} ${item.badgeLabel} ${item.location} ${item.description}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [programs, sourceFilter, categoryFilter, onlyOpen, searchQuery])

  function isAlreadyTracked(item: CorporateProgramItem) {
    return applications.some(
      (app) =>
        (app.jobLink && app.jobLink === item.url) ||
        (app.company.toLowerCase() === item.company.toLowerCase() &&
          app.position.toLowerCase() === item.title.toLowerCase())
    )
  }

  async function handleSaveToApplications(item: CorporateProgramItem) {
    if (isAlreadyTracked(item)) return
    setSavingId(item.id)
    try {
      const today = new Date().toISOString().split('T')[0]
      await createApplication({
        company: item.company,
        position: item.title,
        status: 'preparing',
        appliedAt: today,
        channel: 'online',
        jobLink: item.url,
        salary: item.amount,
        hrContacted: false,
        note: `[${SOURCE_META[item.source].label} - ${item.badgeLabel}] ${item.deadline ? `Son Başvuru: ${item.deadline}. ` : ''}${item.description}`,
      })
      toast({
        title: 'Başvurularıma Eklendi ✓',
        description: `${item.company} - ${item.title} "Hazırlanıyor" olarak listenize kaydedildi.`,
      })
    } catch {
      toast({
        title: 'Kayıt Hatası',
        description: 'Başvuru kaydedilirken bir sorun oluştu.',
        variant: 'destructive',
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div data-tour="programs-view-section" className="space-y-5 pb-16">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-indigo-950/90 via-slate-900 to-fuchsia-950/90 text-white p-5 sm:p-6 shadow-lg">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold tracking-wide text-indigo-200">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-300" />
              <span>STAJ, FELLOWSHIP, BURS, EĞİTİM & KURUMSAL İLAN MERKEZİ</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Stajyer, Yeni Mezun, Fellowship, Burs & Kurumsal Programlar
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong className="text-white">Youthall</strong>,{' '}
              <strong className="text-white">Microfon.co</strong>,{' '}
              <strong className="text-white">anbean Kampüs</strong>,{' '}
              <strong className="text-white">Techcareer.net</strong>,{' '}
              <strong className="text-white">Toptalent.co</strong> ve{' '}
              <strong className="text-white">Üniversite Kariyer Merkezleri</strong> üzerinde
              yayınlanan tüm staj, part-time, Management Trainee (MT), Fellowship, eğitim bursları
              ve öğrenci fırsatları afişleriyle birlikte tek ekranda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={() => fetchPrograms(true)}
              disabled={loading}
              variant="secondary"
              size="sm"
              className="h-9 gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              <span>Canlı İlanları Yenile</span>
            </Button>
          </div>
        </div>

        {/* Direct Platform Badges */}
        <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-300 mr-1">
            Entegre Kaynaklar:
          </span>
          {(Object.keys(SOURCE_META) as ProgramSource[]).map((srcKey) => {
            const meta = SOURCE_META[srcKey]
            return (
              <a
                key={srcKey}
                href={meta.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-medium text-white transition-colors"
              >
                <span>{meta.label}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-bold">
                  {sourceCounts[srcKey] || 0}
                </span>
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>
            )
          })}
        </div>
      </div>

      {/* University Career Centers Quick Bar */}
      <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Üniversite Kariyer Merkezleri & Ulusal Staj / Burs Portalları
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Doğrudan resmi kariyer ve burs merkezlerine hızlı geçiş
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
          {UNIVERSITY_CAREER_CENTERS.map((uni) => (
            <a
              key={uni.name}
              href={uni.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between p-2 rounded-lg border border-border/70 bg-muted/30 hover:bg-primary/5 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-primary truncate">
                  {uni.tag}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </div>
              <span className="text-[11px] font-medium text-foreground line-clamp-1 mt-1">
                {uni.name}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="rounded-xl border border-border bg-card p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Source Platform Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 no-scrollbar">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer',
                sourceFilter === 'all'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <span>Tüm Platformlar</span>
              <span className="px-1.5 py-0.2 rounded-full bg-background/20 text-[10px]">
                {sourceCounts.all}
              </span>
            </button>

            {(Object.keys(SOURCE_META) as ProgramSource[]).map((srcKey) => {
              const meta = SOURCE_META[srcKey]
              const active = sourceFilter === srcKey
              return (
                <button
                  key={srcKey}
                  type="button"
                  onClick={() => setSourceFilter(srcKey)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer',
                    active
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <span>{meta.label}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px]',
                      active ? 'bg-primary-foreground/20' : 'bg-background/80'
                    )}
                  >
                    {sourceCounts[srcKey] || 0}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Input & Active Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyOpen((prev) => !prev)}
              className={cn(
                'h-8 px-2.5 rounded-lg border text-[11px] font-semibold transition-colors shrink-0 cursor-pointer',
                onlyOpen
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {onlyOpen ? '✓ Sadece Başvuruya Açık' : 'Sadece Açık İlanlar'}
            </button>

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Burs, fellowship, staj, şirket ara..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-border/60 no-scrollbar">
          <span className="text-[11px] font-medium text-muted-foreground mr-1 shrink-0">
            Kategori:
          </span>
          {(
            [
              'all',
              'intern',
              'fellowship',
              'scholarship',
              'talent_program',
              'bootcamp',
              'new_grad',
              'opportunity',
              'corporate',
            ] as const
          ).map((catKey) => {
            const meta = CATEGORY_META[catKey]
            const active = categoryFilter === catKey
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(catKey)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all shrink-0 cursor-pointer border',
                  active
                    ? 'bg-primary/15 text-primary border-primary/40 font-bold'
                    : 'bg-background text-muted-foreground border-border/70 hover:text-foreground'
                )}
              >
                {catKey === 'intern' && <GraduationCap className="h-3 w-3" />}
                {catKey === 'fellowship' && <Sparkles className="h-3 w-3" />}
                {catKey === 'scholarship' && <Coins className="h-3 w-3" />}
                {catKey === 'talent_program' && <Award className="h-3 w-3" />}
                {catKey === 'bootcamp' && <BookOpen className="h-3 w-3" />}
                {catKey === 'new_grad' && <Rocket className="h-3 w-3" />}
                {catKey === 'opportunity' && <Gift className="h-3 w-3" />}
                {catKey === 'corporate' && <Briefcase className="h-3 w-3" />}
                <span>{meta.label}</span>
                <span className="text-[10px] opacity-75">
                  ({categoryCounts[catKey] || 0})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-24 bg-muted rounded" />
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-10 w-full bg-muted rounded" />
                <div className="h-8 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPrograms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 px-4 text-center space-y-3">
          <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto stroke-[1.5]" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              Seçili filtreye uygun ilan veya burs bulunamadı
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Arama kelimesini temizleyebilir veya tüm platformları ve program türlerini görüntülemek için filtreleri sıfırlayabilirsiniz.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSourceFilter('all')
              setCategoryFilter('all')
              setOnlyOpen(false)
              setSearchQuery('')
            }}
            className="text-xs"
          >
            Filtreleri Sıfırla
          </Button>
        </div>
      ) : (
        /* Visual Image Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPrograms.map((item) => {
            const srcMeta = SOURCE_META[item.source]
            const catMeta = CATEGORY_META[item.category]
            const showCoverImg = item.coverImage && !failedImages[item.id]
            const showLogoImg = item.companyLogo && !failedLogos[item.id]
            const tracked = isAlreadyTracked(item)
            const isClosed = item.isOpen === false

            return (
              <div
                key={item.id}
                className={cn(
                  'group flex flex-col rounded-xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-200 overflow-hidden',
                  isClosed && 'opacity-85'
                )}
              >
                {/* Top Visual Cover Banner (`resimleriyle birlikte`) */}
                <div className="relative h-44 w-full overflow-hidden bg-muted shrink-0">
                  {showCoverImg ? (
                    <img
                      src={item.coverImage}
                      alt={`${item.company} - ${item.title}`}
                      loading="lazy"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                      }
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    /* Branded Magazine Cover Fallback when platform only provides company logo */
                    <div
                      className={cn(
                        'h-full w-full bg-gradient-to-br flex flex-col items-center justify-center p-4 text-white relative',
                        srcMeta.bannerGradient
                      )}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_60%)]" />
                      {showLogoImg ? (
                        <div className="relative z-10 w-20 h-20 rounded-2xl bg-white p-2.5 shadow-lg flex items-center justify-center">
                          <img
                            src={item.companyLogo}
                            alt={item.company}
                            loading="lazy"
                            onError={() =>
                              setFailedLogos((prev) => ({ ...prev, [item.id]: true }))
                            }
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-xl font-extrabold tracking-wider">
                          {item.company.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="relative z-10 mt-2 text-[11px] font-semibold text-white/90 text-center line-clamp-1">
                        {item.company}
                      </span>
                    </div>
                  )}

                  {/* Subtle bottom gradient overlay for readability */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none" />

                  {/* Source Platform Badge (Top-Left) */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md',
                        srcMeta.badgeClass
                      )}
                    >
                      {srcMeta.label}
                    </span>
                  </div>

                  {/* Deadline Badge (Top-Right) */}
                  {item.deadline && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md backdrop-blur-md text-[10px] font-semibold border',
                          isClosed
                            ? 'bg-zinc-900/80 text-zinc-300 border-white/10'
                            : 'bg-black/75 text-white border-white/15'
                        )}
                      >
                        <Calendar
                          className={cn(
                            'h-2.5 w-2.5',
                            isClosed ? 'text-zinc-400' : 'text-amber-400'
                          )}
                        />
                        {item.deadline}
                      </span>
                    </div>
                  )}

                  {/* Company Logo Badge Overlapping Cover Bottom-Left (when cover image is shown) */}
                  {showCoverImg && (
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-end justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {showLogoImg ? (
                          <div className="w-9 h-9 rounded-lg bg-white p-1 shadow-md border border-white/40 flex items-center justify-center shrink-0">
                            <img
                              src={item.companyLogo}
                              alt={item.company}
                              loading="lazy"
                              onError={() =>
                                setFailedLogos((prev) => ({ ...prev, [item.id]: true }))
                              }
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/90 text-slate-900 font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                            {item.company.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-bold text-white drop-shadow-sm truncate">
                          {item.company}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="flex-1 p-3.5 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {/* Category & Location Row */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border',
                          catMeta.pillClass
                        )}
                      >
                        {item.badgeLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-[140px]">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </span>
                    </div>

                    {/* Program Title */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group/title"
                    >
                      <h3 className="text-sm font-bold text-foreground group-hover/title:text-primary transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                    </a>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-2.5 border-t border-border/60 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        variant={tracked ? 'secondary' : 'outline'}
                        size="sm"
                        disabled={tracked || savingId === item.id}
                        onClick={() => handleSaveToApplications(item)}
                        className="h-8 text-[11px] font-semibold gap-1 px-2 cursor-pointer"
                      >
                        {savingId === item.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : tracked ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="truncate">Takip Ediliyor</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3 shrink-0" />
                            <span className="truncate">Takibe Al</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          openStudioWithJob({
                            company: item.company,
                            role: item.title,
                            jobUrl: item.url,
                            description: `${item.company} - ${item.title} (${item.badgeLabel}). ${item.description}`,
                          })
                        }
                        className="h-8 text-[11px] font-semibold gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span className="truncate">Özel CV Üret</span>
                      </Button>
                    </div>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <span>İlana / Programa Git</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
