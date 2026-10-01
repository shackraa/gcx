'use client'

import { useState, useRef } from 'react'
import type { Resume, Application, WorkplaceType, DatePosted, MatchedJob } from '@/types'
import { Button } from '@/components/ui/button'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUIStore } from '@/lib/store/ui'
import { useToast } from '@/hooks/use-toast'
import type { Id } from '@/convex/_generated/dataModel'
import {
  Briefcase,
  Search,
  Sparkles,
  ExternalLink,
  Plus,
  Building2,
  MapPin,
  Clock,
  Zap,
  Check,
  Loader2,
  Copy,
  Bot,
  Upload,
  Trash2,
  Terminal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface JobRadarViewProps {
  resumes: Resume[]
  applications: Application[]
}

const WORKPLACE_OPTIONS: { value: WorkplaceType; label: string; icon: string }[] = [
  { value: 'all', label: 'Tümü (Tüm Modeller)', icon: '🏢' },
  { value: 'onsite', label: 'Fiziksel / Ofiste', icon: '📍' },
  { value: 'hybrid', label: 'Hibrit', icon: '🔄' },
  { value: 'remote', label: 'Uzaktan (Remote)', icon: '🌐' },
]

const DATE_OPTIONS: { value: DatePosted; label: string }[] = [
  { value: 'past_24h', label: 'Son 24 Saat' },
  { value: 'past_week', label: 'Son 1 Hafta' },
  { value: 'past_month', label: 'Son 1 Ay' },
  { value: 'all', label: 'Tüm Zamanlar' },
]

export function JobRadarView({ resumes }: JobRadarViewProps) {
  const { toast } = useToast()
  const createApplicationMutation = useMutation(api.applications.create)
  const scoutedJobs = useQuery(api.scoutedJobs.list)
  const importBulkScoutedMutation = useMutation(api.scoutedJobs.importBulk)
  const convertScoutedMutation = useMutation(api.scoutedJobs.convertToApplication)
  const removeScoutedMutation = useMutation(api.scoutedJobs.remove)
  const clearAllScoutedMutation = useMutation(api.scoutedJobs.clearAll)

  // Filter States
  const [selectedResumeId, setSelectedResumeId] = useState<string>('all')
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>('all')
  const [location, setLocation] = useState<string>('Türkiye')
  const [datePosted, setDatePosted] = useState<DatePosted>('past_week')

  // Live Auto Scouting State
  const [isScouting, setIsScouting] = useState(false)

  // Custom Job Match State
  const [jobInput, setJobInput] = useState('')
  const [jobUrlInput, setJobUrlInput] = useState('')
  const [isMatching, setIsMatching] = useState(false)
  const [matchedResult, setMatchedResult] = useState<MatchedJob | null>(null)
  const [addedJobs, setAddedJobs] = useState<string[]>([])
  const jsonUploadRef = useRef<HTMLInputElement>(null)

  const activeResume = selectedResumeId === 'all'
    ? resumes[0]
    : resumes.find((r) => r._id === selectedResumeId) || resumes[0]

  // Dynamic Boolean Query for Search Launchpads
  const targetKeywords = activeResume?.skills?.slice(0, 4) || ['Yazılım', 'Developer']
  const roleTerm = activeResume?.targetRole || activeResume?.name?.replace(/\s*cv\s*/gi, '') || 'Developer'
  const booleanQuery = `"${roleTerm}" AND (${targetKeywords.map((s) => `"${s}"`).join(' OR ')})`

  // Live 1-Click Autonomous Job Discovery
  async function handleLiveScout() {
    if (resumes.length === 0) {
      toast({
        title: 'Önce CV Ekleyin',
        description: 'İlanları tarayabilmek için CV Havuzunuzda en az bir CV olmalıdır.',
        variant: 'destructive',
      })
      return
    }

    setIsScouting(true)
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('gcx_gemini_api_key') || '' : ''

    try {
      const res = await fetch('/api/jobs/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: roleTerm,
          skills: activeResume?.skills || [],
          workplaceType,
          location,
          resumeId: activeResume?._id,
          resumeName: activeResume?.name,
          resumeSummary: activeResume?.summary || '',
          apiKey,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast({
          title: 'Tarama Hatası',
          description: data.message || 'İlanlar taranırken bir sorun oluştu.',
          variant: 'destructive',
        })
        return
      }

      if (data.jobs && data.jobs.length > 0) {
        const cleanJobs = data.jobs.map((j: any) => ({
          title: String(j.title || 'Pozisyon'),
          company: String(j.company || 'Şirket'),
          location: String(j.location || location || 'Türkiye'),
          workplaceType: String(j.workplaceType || 'onsite'),
          url: String(j.url || ''),
          source: String(j.source || 'linkedin'),
          matchScore: typeof j.matchScore === 'number' ? j.matchScore : 80,
          matchingSkills: Array.isArray(j.matchingSkills) ? j.matchingSkills.map(String) : [],
          missingSkills: Array.isArray(j.missingSkills) ? j.missingSkills.map(String) : [],
          recommendedResumeId: activeResume?._id || undefined,
          recommendedResumeName: activeResume?.name || undefined,
          reason: String(j.reason || ''),
        }))

        await importBulkScoutedMutation({ jobs: cleanJobs })
        toast({
          title: '🚀 İlanlar Başarıyla Bulundu & Eşleştirildi!',
          description: `${cleanJobs.length} adet güncel ilan radara eklendi.`,
        })
      } else {
        toast({
          title: 'İlan Bulunamadı',
          description: 'Bu kriterlerde yeni ilan bulunamadı. Filtreleri genişletmeyi deneyin.',
        })
      }
    } catch (err: any) {
      console.error('[Live Scout Error]:', err)
      toast({
        title: 'Tarama veya Kayıt Hatası',
        description: err?.message || 'İlanlar kaydedilirken bir hata oluştu.',
        variant: 'destructive',
      })
    } finally {
      setIsScouting(false)
    }
  }

  // Construct URLs
  const encodedQuery = encodeURIComponent(booleanQuery)
  const encodedLoc = encodeURIComponent(location)

  let linkedinWT = ''
  if (workplaceType === 'onsite') linkedinWT = '&f_WT=1'
  else if (workplaceType === 'remote') linkedinWT = '&f_WT=2'
  else if (workplaceType === 'hybrid') linkedinWT = '&f_WT=3'

  let linkedinTPR = ''
  if (datePosted === 'past_24h') linkedinTPR = '&f_TPR=r86400'
  else if (datePosted === 'past_week') linkedinTPR = '&f_TPR=r604800'
  else if (datePosted === 'past_month') linkedinTPR = '&f_TPR=r2592000'

  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&location=${encodedLoc}${linkedinWT}${linkedinTPR}&sortBy=DD`
  const indeedUrl = `https://tr.indeed.com/jobs?q=${encodedQuery}&l=${encodedLoc}&sort=date`
  const kariyerUrl = `https://www.kariyer.net/is-ilanlari?kw=${encodeURIComponent(roleTerm)}`
  const googleJobsUrl = `https://www.google.com/search?q=${encodedQuery}+is+ilanlari+${encodedLoc}&ibp=htl;jobs`

  // Handle Instant AI Match on Pasted Job
  async function handleAnalyzeJob() {
    if (!jobInput.trim()) {
      toast({
        title: 'İlan Metni Gerekli',
        description: 'Lütfen LinkedIn veya diğer sitelerden kopyaladığınız ilan metnini yapıştırın.',
        variant: 'destructive',
      })
      return
    }

    if (resumes.length === 0) {
      toast({
        title: 'Önce CV Ekleyin',
        description: 'İlanı eşleştirebilmek için CV Havuzunuzda en az bir CV olmalıdır.',
        variant: 'destructive',
      })
      return
    }

    setIsMatching(true)
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('gcx_gemini_api_key') || '' : ''

    try {
      const res = await fetch('/api/ai/match-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumes,
          selectedResumeId,
          workplaceType,
          location,
          datePosted,
          jobText: jobInput,
          jobUrl: jobUrlInput,
          apiKey,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast({
          title: 'Eşleştirme Başarısız',
          description: json.message || 'İlan analiz edilemedi.',
          variant: 'destructive',
        })
        setIsMatching(false)
        return
      }

      if (json.data?.jobAnalysis) {
        setMatchedResult(json.data.jobAnalysis)
        toast({
          title: '✨ İlan Analiz Edildi!',
          description: `Uyumluluk Skoru: %${json.data.jobAnalysis.matchScore}`,
        })
      }
    } catch {
      toast({ title: 'Bağlantı hatası', variant: 'destructive' })
    } finally {
      setIsMatching(false)
    }
  }

  // Add matched job directly to GCX applications!
  async function handleAddJobToApplications(job: MatchedJob) {
    try {
      await createApplicationMutation({
        company: job.company,
        position: job.title,
        status: 'preparing',
        appliedAt: new Date().toISOString().split('T')[0],
        channel: job.source === 'linkedin' ? 'linkedin' : 'online',
        resumeId: job.recommendedResumeId as any,
        cvVersion: job.recommendedResumeName,
        jobLink: job.url || undefined,
        note: `AI Uyumluluk Skoru: %${job.matchScore}.\n${job.reason}`,
        hrContacted: false,
      })

      setAddedJobs((prev) => [...prev, job.id])
      toast({
        title: 'Başvurulara Eklendi ✓',
        description: `${job.company} - ${job.title} takip listenize 'Hazırlanıyor' olarak kaydedildi.`,
      })
    } catch {
      toast({ title: 'Kaydedilemedi', variant: 'destructive' })
    }
  }

  // Import scouted jobs JSON file produced by jev_crawler.py
  async function handleImportJevJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (Array.isArray(data) && data.length > 0) {
        const cleanJobs = data.map((j: any) => ({
          title: String(j.title || 'Pozisyon'),
          company: String(j.company || 'Şirket'),
          location: String(j.location || 'Türkiye'),
          workplaceType: String(j.workplaceType || 'onsite'),
          url: String(j.url || ''),
          source: String(j.source || 'linkedin'),
          matchScore: typeof j.matchScore === 'number' ? j.matchScore : 80,
          matchingSkills: Array.isArray(j.matchingSkills) ? j.matchingSkills.map(String) : [],
          missingSkills: Array.isArray(j.missingSkills) ? j.missingSkills.map(String) : [],
          recommendedResumeId: activeResume?._id || undefined,
          recommendedResumeName: activeResume?.name || undefined,
          reason: String(j.reason || ''),
        }))

        await importBulkScoutedMutation({ jobs: cleanJobs })
        toast({
          title: 'jev Bot İlanları Yüklendi ✓',
          description: `${cleanJobs.length} adet ilan radara eklendi.`,
        })
      } else {
        toast({ title: 'Geçersiz JSON formatı', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'JSON yükleme hatası', variant: 'destructive' })
    }
  }

  function handleCopyQuery() {
    navigator.clipboard.writeText(booleanQuery)
    toast({ title: 'Arama Sorgusu Kopyalandı ✓', description: booleanQuery })
  }

  function handleCopyBotCommand() {
    const cmd = `python scripts/jev_crawler.py --role "${roleTerm}" --location "${location}" --workplace "${workplaceType}"`
    navigator.clipboard.writeText(cmd)
    toast({ title: 'jev Bot Komutu Kopyalandı ✓', description: cmd })
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-card border border-primary/25 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              İlan Radarı & Akıllı CV Eşleştirici
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Kayıtlı CV&apos;lerinizdeki yetenekleri tarayarak <strong>Fiziksel (Ofiste)</strong>, <strong>Hibrit</strong> ve <strong>Uzaktan</strong> tüm açık ilanları anında bulur, uyumluluk skorunu hesaplar ve tek tıkla başvurunuza ekler.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg">
              {resumes.length} CV Havuzda
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/50">
          {/* CV Selector */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Hedef CV Versiyonu
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full h-9 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tüm CV&apos;lerim ({resumes.length} Adet)</option>
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>
                  📄 {r.name} ({r.category})
                </option>
              ))}
            </select>
          </div>

          {/* Workplace Type (Onsite / Hybrid / Remote / All) */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Çalışma Modeli
            </label>
            <select
              value={workplaceType}
              onChange={(e) => setWorkplaceType(e.target.value as WorkplaceType)}
              className="w-full h-9 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              {WORKPLACE_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.icon} {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Lokasyon / Şehir
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Örn: Türkiye, İstanbul..."
                className="w-full h-9 text-xs bg-background border border-border rounded-lg px-2.5 pr-6 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <MapPin className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Date Posted */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              İlanın Yayın Tarihi
            </label>
            <select
              value={datePosted}
              onChange={(e) => setDatePosted(e.target.value as DatePosted)}
              className="w-full h-9 text-xs bg-background border border-border rounded-lg px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {DATE_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button: Live Auto Scan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span>
              Seçili CV: <strong>{activeResume?.name || 'Seçilmedi'}</strong> ({roleTerm}) · Hedef: <strong>{location}</strong> ({workplaceType === 'onsite' ? 'Fiziksel' : workplaceType === 'remote' ? 'Uzaktan' : workplaceType === 'hybrid' ? 'Hibrit' : 'Tüm Modeller'})
            </span>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <span className="hidden sm:inline-flex text-[11px] font-bold text-green-400 bg-green-950/40 border border-green-800/60 px-2.5 py-1.5 rounded-lg">
              🎯 %70+ Uyum · En Yüksek Puan En Üstte
            </span>

            <Button
              onClick={handleLiveScout}
              disabled={isScouting || resumes.length === 0}
              className="h-10 px-5 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all flex-1 sm:flex-initial"
            >
              {isScouting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Kapsamlı İlanlar Taranıyor & Eşleştiriliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>🚀 Tüm Uygun İlanları Tara (%70+ Uyum)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 🤖 jev-ultrafast Otonom Bot Entegrasyon Paneli */}
      <div className="bg-card border border-primary/20 rounded-xl p-5 space-y-3 shadow-sm bg-gradient-to-r from-card via-primary/5 to-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                jev-ultrafast Otonom İlan Tarama Robotu
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Bilgisayarınızda arka planda çalışan jev botu LinkedIn&apos;i otomatik tarayıp uygun ilanları GCX hesabınıza aktarır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <input
              ref={jsonUploadRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJevJson}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => jsonUploadRef.current?.click()}
              className="h-8 gap-1.5 text-xs border-primary/30 text-primary"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Bot Çıktısını Yükle (JSON)</span>
            </Button>
            <Button
              size="sm"
              onClick={handleCopyBotCommand}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Bot Komutunu Kopyala</span>
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 p-2.5 rounded-lg border border-border/40 font-mono text-[11px] text-muted-foreground flex items-center justify-between overflow-x-auto">
          <span>python scripts/jev_crawler.py --role &quot;{roleTerm}&quot; --location &quot;{location}&quot; --workplace &quot;{workplaceType}&quot;</span>
          <button onClick={handleCopyBotCommand} className="hover:text-primary pl-2" title="Kopyala">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scouted Jobs List (Found by Live Scout or jev Bot) */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Radara Takılan İlanlar {scoutedJobs && scoutedJobs.length > 0 ? `(${scoutedJobs.length} İlan)` : ''}
              </h3>
              <span className="text-[10px] font-bold text-green-400 bg-green-950/40 border border-green-800/60 px-2 py-0.5 rounded">
                %70+ Uyum · En Yüksek Skor En Başta
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              CV&apos;nizle %70 ve üzeri uyumluluğa sahip tüm pozisyonlar en yüksek uyum puanına göre sıralanmıştır.
            </p>
          </div>

          {scoutedJobs && scoutedJobs.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await clearAllScoutedMutation()
                  toast({ title: 'Radar Temizlendi', description: 'Tüm taranan ilanlar sıfırlandı.' })
                }}
                className="h-8 text-xs gap-1.5 border-border text-muted-foreground hover:text-red-400 hover:border-red-900/50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Radarı Temizle</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleLiveScout}
                disabled={isScouting}
                className="h-8 text-xs gap-1.5 border-primary/30 text-primary"
              >
                {isScouting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>Yeniden Tara</span>
              </Button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {(!scoutedJobs || scoutedJobs.length === 0) && (
          <div className="border border-dashed border-border/80 rounded-xl p-8 text-center space-y-3 bg-muted/20">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Henüz İlan Taranmadı</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                Yukarıdaki filtreleri seçip <strong>&quot;✨ CV&apos;me Uygun İlanları Şimdi Tara&quot;</strong> butonuna basarak LinkedIn ve web&apos;deki tüm güncel pozisyonları tek tıkla listeleyebilirsiniz.
              </p>
            </div>
            <Button
              onClick={handleLiveScout}
              disabled={isScouting || resumes.length === 0}
              size="sm"
              className="gap-2 text-xs font-semibold shadow-sm"
            >
              {isScouting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              <span>Hemen İlanları Tara</span>
            </Button>
          </div>
        )}

        {/* Jobs Grid */}
        {scoutedJobs && scoutedJobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {scoutedJobs.map((job) => (
              <div
                key={job._id}
                className="bg-muted/30 border border-border/70 hover:border-border rounded-xl p-4 space-y-3 flex flex-col justify-between transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{job.title}</h4>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">{job.company}</p>
                    </div>
                    <div className={cn(
                      'text-sm font-black px-2 py-0.5 rounded-md border text-center shrink-0',
                      job.matchScore >= 80 ? 'bg-green-950/40 text-green-400 border-green-800' : 'bg-primary/10 text-primary border-primary/20'
                    )}>
                      %{job.matchScore} Uyum
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    {job.location} · {job.workplaceType === 'onsite' ? '📍 Fiziksel' : job.workplaceType === 'remote' ? '🌐 Uzaktan' : '🔄 Hibrit'}
                  </p>

                  {job.reason && (
                    <p className="text-xs text-muted-foreground/90 bg-card p-2 rounded border border-border/40 leading-relaxed">
                      💡 {job.reason}
                    </p>
                  )}

                  {job.matchingSkills && job.matchingSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.matchingSkills.map((s) => (
                        <span key={s} className="bg-green-950/40 text-green-400 border border-green-800 text-[10px] px-2 py-0.5 rounded font-medium">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted px-2 py-1 rounded"
                      >
                        <ExternalLink className="h-3 w-3" /> İlana Git
                      </a>
                    )}
                    <button
                      onClick={() => removeScoutedMutation({ id: job._id })}
                      className="text-muted-foreground hover:text-red-400 p-1"
                      title="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => convertScoutedMutation({ id: job._id })}
                    disabled={job.applied}
                    className="h-8 text-xs gap-1 font-semibold"
                  >
                    {job.applied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-400" />
                        <span>Başvuruldu ✓</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Başvurularıma Ekle</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1-Click Platform Search Launchpads */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Canlı İlan Platformu Aramaları (Tek Tıkla Aç)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seçili filtrelere ve CV&apos;nizin anahtar kelimelerine göre optimize edilmiş doğrudan arama linkleri
            </p>
          </div>

          <button
            onClick={handleCopyQuery}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted px-2.5 py-1.5 rounded-md transition-colors self-start sm:self-auto"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Sorguyu Kopyala</span>
          </button>
        </div>

        {/* Platform Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* LinkedIn */}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 hover:border-blue-700 hover:bg-blue-950/40 transition-all shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400">LinkedIn İlanları</span>
                <ExternalLink className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {workplaceType === 'onsite' ? 'Ofiste / Yerinde' : workplaceType === 'remote' ? 'Uzaktan' : workplaceType === 'hybrid' ? 'Hibrit' : 'Tüm'} ilanlar
              </p>
            </div>
            <span className="mt-3 text-[11px] font-semibold text-blue-300 flex items-center gap-1">
              İlanları Gör →
            </span>
          </a>

          {/* Indeed */}
          <a
            href={indeedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 hover:border-indigo-700 hover:bg-indigo-950/40 transition-all shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400">Indeed İlanları</span>
                <ExternalLink className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tüm sektörlerdeki güncel açık pozisyonlar
              </p>
            </div>
            <span className="mt-3 text-[11px] font-semibold text-indigo-300 flex items-center gap-1">
              İlanları Gör →
            </span>
          </a>

          {/* Kariyer.net */}
          <a
            href={kariyerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 hover:border-purple-700 hover:bg-purple-950/40 transition-all shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">Kariyer.net</span>
                <ExternalLink className="h-3.5 w-3.5 text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Türkiye geneli şirket ve kurumsal ilanlar
              </p>
            </div>
            <span className="mt-3 text-[11px] font-semibold text-purple-300 flex items-center gap-1">
              İlanları Gör →
            </span>
          </a>

          {/* Google Jobs */}
          <a
            href={googleJobsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 hover:border-emerald-700 hover:bg-emerald-950/40 transition-all shadow-sm"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">Google Jobs</span>
                <ExternalLink className="h-3.5 w-3.5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tüm iş sitelerini tek ekranda toplayan arama
              </p>
            </div>
            <span className="mt-3 text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
              İlanları Gör →
            </span>
          </a>
        </div>
      </div>

      {/* Instant AI Job Matcher & Analyzer Box */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            İlanı Yapıştır & CV Uyumluluğunu Ölç (AI Matcher)
          </h3>
          <p className="text-xs text-muted-foreground">
            LinkedIn veya başka bir sitede bulduğunuz bir ilanın metnini buraya yapıştırın. Gemini 2.0 Flash hangi CV&apos;nizle başvurmanız gerektiğini ve % kaç uyumlu olduğunuzu anında hesaplasın.
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <textarea
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                rows={3}
                placeholder="İlan başlığı, gereksinimleri ve açıklamasını buraya yapıştırın..."
                className="w-full p-3 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div className="space-y-2 flex flex-col justify-between">
              <input
                type="url"
                value={jobUrlInput}
                onChange={(e) => setJobUrlInput(e.target.value)}
                placeholder="İlan Linki (Opsiyonel)"
                className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />

              <Button
                onClick={handleAnalyzeJob}
                disabled={isMatching || !jobInput.trim()}
                className="w-full h-10 gap-2 text-xs font-bold bg-primary text-primary-foreground"
              >
                {isMatching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>CV ile Karşılaştırılıyor…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Uyumluluğu Hesapla</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Matched Result Card */}
        {matchedResult && (
          <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">{matchedResult.title}</h4>
                  <span className="text-[11px] bg-muted px-2 py-0.5 rounded font-medium text-muted-foreground">
                    {matchedResult.company}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {matchedResult.location} · {matchedResult.workplaceType === 'onsite' ? 'Fiziksel / Ofiste' : matchedResult.workplaceType === 'remote' ? 'Uzaktan' : 'Hibrit'}
                </p>
              </div>

              {/* Match Score Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Uyumluluk</div>
                  <div className={cn(
                    'text-xl font-black',
                    matchedResult.matchScore >= 80 ? 'text-green-400' : matchedResult.matchScore >= 60 ? 'text-primary' : 'text-amber-400'
                  )}>
                    %{matchedResult.matchScore}
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleAddJobToApplications(matchedResult)}
                  disabled={addedJobs.includes(matchedResult.id)}
                  className="gap-1.5 text-xs font-semibold"
                >
                  {addedJobs.includes(matchedResult.id) ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      <span>Eklendi ✓</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Başvurularıma Ekle</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* AI Recommendation Reason */}
            <p className="text-xs text-muted-foreground/90 bg-background/50 p-2.5 rounded-lg border border-border/40 leading-relaxed">
              💡 <strong>AI Tavsiyesi:</strong> {matchedResult.reason}
            </p>

            {/* Recommended Resume */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Önerilen CV:</span>
              <span className="font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
                📄 {matchedResult.recommendedResumeName}
              </span>
            </div>

            {/* Matching & Missing Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              {matchedResult.matchingSkills && matchedResult.matchingSkills.length > 0 && (
                <div>
                  <span className="font-semibold text-green-400 block mb-1">✓ Eşleşen Yeteneklerin:</span>
                  <div className="flex flex-wrap gap-1">
                    {matchedResult.matchingSkills.map((s) => (
                      <span key={s} className="bg-green-950/40 text-green-400 border border-green-800 text-[10px] px-2 py-0.5 rounded font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {matchedResult.missingSkills && matchedResult.missingSkills.length > 0 && (
                <div>
                  <span className="font-semibold text-amber-400 block mb-1">⚡ İlanda İstenen Ekstra Yetenekler:</span>
                  <div className="flex flex-wrap gap-1">
                    {matchedResult.missingSkills.map((s) => (
                      <span key={s} className="bg-amber-950/40 text-amber-400 border border-amber-800 text-[10px] px-2 py-0.5 rounded font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
