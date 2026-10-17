'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type {
  Resume,
  Application,
  CareerSource,
  CareerSourceType,
  GeneratedCV,
  HarvardCVData,
  HarvardTemplateId,
} from '@/types'
import { useUIStore } from '@/lib/store/ui'
import { HarvardCVPreview, TEMPLATE_META } from './HarvardCVPreview'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Upload,
  Sparkles,
  FileText,
  Trash2,
  CheckCircle2,
  Copy,
  Plus,
  Loader2,
  Brain,
  Link2,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FolderSync,
  History,
  ArrowRight,
  Layers,
  Send,
} from 'lucide-react'
import type { Id } from '@/convex/_generated/dataModel'

interface CVStudioViewProps {
  resumes: Resume[]
  applications: Application[]
}

const SOURCE_TYPE_META: Record<
  CareerSourceType,
  { label: string; badgeClass: string }
> = {
  cv: {
    label: 'CV / Özgeçmiş',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  motivation_letter: {
    label: 'Motivasyon Mektubu',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  },
  fellowship: {
    label: 'Fellowship / Burs',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  project_note: {
    label: 'Proje / Başarı Notu',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  certificate: {
    label: 'Sertifika / Ödül',
    badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
  },
  other: {
    label: 'Kaynak Belge',
    badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  },
}

const DEMO_HARVARD_CV: HarvardCVData = {
  fullName: 'ÖRNEK ADAY PROFİLİ',
  title: 'Product & AI Systems Engineer',
  contact: {
    location: 'İstanbul, Türkiye',
    email: 'aday@universite.edu.tr',
    phone: '+90 555 000 00 00',
    linkedin: 'linkedin.com/in/ornek-aday',
    github: 'github.com/ornek-aday',
  },
  summary:
    'Sol taraftaki "Kariyer Hafızası" alanına geçmiş CV, motivasyon mektubu veya fellowship belgelerinizi sürükleyip bırakın; ardından LinkedIn ilan linkini yapıştırarak saniyeler içinde ilana özel Harvard CV oluşturun.',
  education: [
    {
      institution: 'İstanbul Teknik Üniversitesi',
      degree: 'Matematik / Endüstri / Bilgisayar Mühendisliği (Lisans)',
      location: 'İstanbul, Türkiye',
      date: '2022 – 2026',
      gpaOrHonors: 'Onur Öğrencisi',
      details: [
        'İlgili Dersler: Veri Yapıları, İstatistiksel Modelleme, Makine Öğrenmesi, Optimizasyon',
      ],
    },
  ],
  experience: [
    {
      company: 'Teknoloji & Yapay Zeka A.Ş.',
      role: 'AI & Product Engineering Intern',
      location: 'İstanbul, Türkiye',
      date: 'Haziran 2025 – Eylül 2025',
      bullets: [
        'LLM tabanlı doküman ayrıştırma ve iş akışı otomasyonu geliştirerek operasyonel işlem süresini %42 kısalttı.',
        'Python ve SQL kullanarak 100K+ satırlık kullanıcı geri bildirim verisini analiz etti ve ürün yol haritasına 3 yeni özellik kazandırdı.',
      ],
    },
  ],
  projects: [
    {
      name: 'Dijital Ürün & İçerik Girişimi',
      roleOrTech: 'Kurucu · Python, React, Veri Analitiği',
      date: '2024 – Günümüz',
      bullets: [
        'Sıfırdan kurulan dijital girişimi 45K+ organik takipçiye ve yüksek dönüşüm oranlarına ulaştırdı.',
      ],
    },
  ],
  leadershipAndFellowships: [
    {
      organization: 'Uluslararası Teknoloji & Girişimcilik Fellowship',
      role: 'Fellow (Kabul Oranı: %3)',
      date: '2025',
      bullets: [
        '5000+ başvuru arasından seçilerek 12 haftalık ürün stratejisi, liderlik ve vaka analizi programını tamamladı.',
      ],
    },
  ],
  skills: {
    technical: ['Python', 'SQL', 'TypeScript', 'React', 'Next.js', 'Data Modeling'],
    tools: ['Git', 'Power BI', 'Jira', 'n8n', 'LLM APIs'],
    domains: ['Product Analytics', 'A/B Testing', 'Process Automation', 'Market Research'],
    languages: ['Türkçe (Anadil)', 'İngilizce (İleri / C1)'],
  },
  awardsAndCertifications: [
    'Üniversite Girişimcilik & İnovasyon Yarışması 1.lik Ödülü',
  ],
}

export function CVStudioView({ resumes }: CVStudioViewProps) {
  const { studioPrefill, clearStudioPrefill } = useUIStore()
  const { toast } = useToast()

  // Convex queries & mutations
  const careerSources = useQuery(api.careerSources.list) as CareerSource[] | undefined
  const generatedCvs = useQuery(api.generatedCvs.list) as GeneratedCV[] | undefined
  const createSourceMutation = useMutation(api.careerSources.create)
  const removeSourceMutation = useMutation(api.careerSources.remove)
  const syncFromResumesMutation = useMutation(api.careerSources.syncFromResumes)
  const createGeneratedCvMutation = useMutation(api.generatedCvs.create)
  const updateGeneratedCvMutation = useMutation(api.generatedCvs.update)
  const removeGeneratedCvMutation = useMutation(api.generatedCvs.remove)
  const createResumeMutation = useMutation(api.resumes.create)
  const createApplicationMutation = useMutation(api.applications.create)
  const consumeQuota = useMutation(api.aiUsage.consumeQuota)

  // Rapid Upload / Source State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingQueue, setUploadingQueue] = useState<string[]>([])
  const [quickPasteText, setQuickPasteText] = useState('')
  const [isQuickPasting, setIsQuickPasting] = useState(false)
  const [isSyncingResumes, setIsSyncingResumes] = useState(false)
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null)

  // Tailor Engine State
  const [jobInput, setJobInput] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [language, setLanguage] = useState<'en' | 'tr'>('en')
  const [templateId, setTemplateId] = useState<HarvardTemplateId>('harvard')
  const [density, setDensity] = useState<'compact' | 'standard' | 'spacious'>('standard')
  const [customQuestionsText, setCustomQuestionsText] = useState('')
  const [showCustomQuestions, setShowCustomQuestions] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingToPool, setIsSavingToPool] = useState(false)

  // Active Generated Result State
  const [activeResult, setActiveResult] = useState<{
    _id?: string
    targetCompany: string
    targetRole: string
    jobUrl?: string
    atsScoreBefore: number
    atsScoreAfter: number
    matchedKeywords: string[]
    selectedSources: string[]
    cvData: HarvardCVData
    coverLetter: string
    fellowshipAnswers: Array<{ question: string; answer: string }>
  } | null>(null)

  const [activeOutputTab, setActiveOutputTab] = useState<'cv' | 'letter' | 'fellowship'>('cv')

  // Apply prefill if user clicked "İlana Özel CV Üret" from Job Radar
  useEffect(() => {
    if (studioPrefill) {
      const parts = [
        studioPrefill.jobUrl,
        studioPrefill.description,
      ].filter(Boolean)
      if (parts.length > 0) setJobInput(parts.join('\n\n'))
      if (studioPrefill.company) setTargetCompany(studioPrefill.company)
      if (studioPrefill.role) setTargetRole(studioPrefill.role)
      clearStudioPrefill()
    }
  }, [studioPrefill, clearStudioPrefill])

  // Auto-load the latest generated CV if user hasn't generated one in this session yet
  useEffect(() => {
    if (!activeResult && generatedCvs && generatedCvs.length > 0) {
      const latest = generatedCvs[0]
      setActiveResult({
        _id: latest._id,
        targetCompany: latest.targetCompany,
        targetRole: latest.targetRole,
        jobUrl: latest.jobUrl,
        atsScoreBefore: latest.atsScoreBefore,
        atsScoreAfter: latest.atsScoreAfter,
        matchedKeywords: latest.matchedKeywords,
        selectedSources: latest.selectedSources,
        cvData: latest.cvData,
        coverLetter: latest.coverLetter,
        fellowshipAnswers: latest.fellowshipAnswers || [],
      })
      setTemplateId(latest.templateId)
      setLanguage(latest.language)
    }
  }, [generatedCvs, activeResult])

  // Auto-sync existing resumes into Career Memory on first load if careerSources is empty
  const hasAutoSyncedRef = useRef(false)
  useEffect(() => {
    if (
      !hasAutoSyncedRef.current &&
      careerSources !== undefined &&
      careerSources.length === 0 &&
      resumes.length > 0
    ) {
      hasAutoSyncedRef.current = true
      syncFromResumesMutation().catch(() => {})
    }
  }, [careerSources, resumes, syncFromResumesMutation])

  // Convert File to Base64 or Text and Ingest "Tak Tak Tak"
  async function handleFilesDropped(files: FileList | File[]) {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setUploadingQueue((prev) => [...prev, ...fileArray.map((f) => f.name)])

    let successCount = 0
    for (const file of fileArray) {
      try {
        const isPlainText =
          file.type.includes('text') ||
          file.name.endsWith('.txt') ||
          file.name.endsWith('.md') ||
          file.name.endsWith('.json')

        let payload: Record<string, unknown> = { fileName: file.name }

        if (isPlainText) {
          const textContent = await file.text()
          payload = { fileName: file.name, rawText: textContent }
        } else {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const res = reader.result as string
              resolve(res.split(',')[1] || '')
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
          payload = {
            fileName: file.name,
            fileBase64: base64,
            mimeType: file.type || 'application/pdf',
          }
        }

        const res = await fetch('/api/ai/ingest-source', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const json = await res.json()
        if (res.ok && json.data) {
          await createSourceMutation({
            title: json.data.title || file.name.replace(/\.[^/.]+$/, ''),
            sourceType: json.data.sourceType || 'other',
            rawContent: json.data.rawContent || file.name,
            extractedSummary: json.data.extractedSummary,
            extractedHighlights: json.data.extractedHighlights,
            fileName: file.name,
            fileSize: file.size,
          })
          successCount++
        } else {
          toast({
            title: `${file.name} yüklenemedi`,
            description: json.message || 'Lütfen tekrar deneyin.',
            variant: 'destructive',
          })
        }
      } catch {
        toast({
          title: `${file.name} işlenirken hata oluştu`,
          variant: 'destructive',
        })
      } finally {
        setUploadingQueue((prev) => prev.filter((name) => name !== file.name))
      }
    }

    if (successCount > 0) {
      toast({
        title: `${successCount} Kaynak Belge Hafızaya Eklendi ✓`,
        description: 'CV, motivasyon mektubu ve tüm başarı detaylarınız ayrıştırıldı.',
      })
    }
  }

  async function handleQuickPasteSubmit() {
    const trimmed = quickPasteText.trim()
    if (!trimmed) return

    setIsQuickPasting(true)
    try {
      const isUrl = /^https?:\/\/\S+$/i.test(trimmed)
      const res = await fetch('/api/ai/ingest-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isUrl ? { fileUrl: trimmed } : { rawText: trimmed }
        ),
      })

      const json = await res.json()
      if (res.ok && json.data) {
        await createSourceMutation({
          title: json.data.title,
          sourceType: json.data.sourceType,
          rawContent: json.data.rawContent,
          extractedSummary: json.data.extractedSummary,
          extractedHighlights: json.data.extractedHighlights,
        })
        setQuickPasteText('')
        toast({
          title: 'Bilgi Kariyer Hafızasına Eklendi ✓',
          description: `"${json.data.title}" olarak kaydedildi.`,
        })
      } else {
        toast({
          title: 'Eklenemedi',
          description: json.message || 'Bir hata oluştu.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Bağlantı Hatası', variant: 'destructive' })
    } finally {
      setIsQuickPasting(false)
    }
  }

  async function handleSyncResumes() {
    setIsSyncingResumes(true)
    try {
      const res = await syncFromResumesMutation()
      if (res.importedCount > 0) {
        toast({
          title: `${res.importedCount} Kayıt Hafızaya Aktarıldı ✓`,
          description: 'CV Havuzunuzdaki CV ve ön yazılar Kariyer Hafızasına eklendi.',
        })
      } else {
        toast({
          title: 'Tüm CV Havuzunuz Zaten Hafızada ✓',
        })
      }
    } catch {
      toast({ title: 'Aktarım sırasında hata oluştu', variant: 'destructive' })
    } finally {
      setIsSyncingResumes(false)
    }
  }

  // Compile all available knowledge (careerSources + fallback from resumes)
  function getAllCompiledSources() {
    const list: Array<{
      title: string
      sourceType: string
      rawContent: string
      extractedSummary?: string
      extractedHighlights?: string[]
    }> = []

    if (careerSources && careerSources.length > 0) {
      for (const s of careerSources) {
        list.push({
          title: s.title,
          sourceType: s.sourceType,
          rawContent: s.rawContent,
          extractedSummary: s.extractedSummary,
          extractedHighlights: s.extractedHighlights,
        })
      }
    }

    // Also include any resumes from CV Pool not yet in list
    for (const r of resumes) {
      const alreadyExists = list.some(
        (item) => item.title.toLowerCase() === (r.fileName || r.name).toLowerCase()
      )
      if (!alreadyExists && (r.rawText || r.summary || (r.skills && r.skills.length > 0))) {
        list.push({
          title: r.name,
          sourceType: 'cv',
          rawContent: [
            `CV: ${r.name}`,
            r.targetRole ? `Hedef Rol: ${r.targetRole}` : '',
            r.summary ? `Özet: ${r.summary}` : '',
            r.skills?.length ? `Yetenekler: ${r.skills.join(', ')}` : '',
            r.rawText || '',
            r.coverLetter ? `Ön Yazı (TR):\n${r.coverLetter}` : '',
            r.coverLetterEn ? `Cover Letter (EN):\n${r.coverLetterEn}` : '',
          ]
            .filter(Boolean)
            .join('\n\n'),
          extractedSummary: r.summary,
          extractedHighlights: r.skills,
        })
      }
    }

    return list
  }

  async function handleGenerateTailoredCV() {
    const compiledSources = getAllCompiledSources()
    if (compiledSources.length === 0) {
      toast({
        title: 'Önce Kaynak Belge Yükleyin',
        description:
          'Sol taraftaki kutuya en az bir eski CV, motivasyon mektubu veya kendinizle ilgili bilgi bırakın.',
        variant: 'destructive',
      })
      return
    }

    if (!jobInput.trim() && !targetRole.trim() && !targetCompany.trim()) {
      toast({
        title: 'İlan Linki veya Hedef Rol Girin',
        description:
          'Lütfen LinkedIn ilan linkini, ilan metnini veya başvuracağınız pozisyonu yazın.',
        variant: 'destructive',
      })
      return
    }

    try {
      await consumeQuota()
    } catch (err: unknown) {
      const e = err as Error
      toast({
        title: 'Günlük İşlem Limiti',
        description: e.message || 'Günlük 50 yapay zeka işlem limitinize ulaştınız.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      const customQuestions = customQuestionsText
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 3)

      const res = await fetch('/api/ai/tailor-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobInput,
          targetCompany,
          targetRole,
          language,
          templateId,
          customQuestions,
          sources: compiledSources,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.data) {
        toast({
          title: 'Oluşturulamadı',
          description: json.message || 'Lütfen tekrar deneyin.',
          variant: 'destructive',
        })
        return
      }

      const result = json.data
      const savedId = await createGeneratedCvMutation({
        targetCompany: result.targetCompany,
        targetRole: result.targetRole,
        jobUrl: result.jobUrl,
        jobDescription: jobInput.slice(0, 2000),
        templateId,
        language,
        atsScoreBefore: result.atsScoreBefore,
        atsScoreAfter: result.atsScoreAfter,
        matchedKeywords: result.matchedKeywords,
        selectedSources: result.selectedSources,
        cvData: result.cvData,
        coverLetter: result.coverLetter,
        fellowshipAnswers: result.fellowshipAnswers,
      })

      setActiveResult({
        _id: savedId,
        targetCompany: result.targetCompany,
        targetRole: result.targetRole,
        jobUrl: result.jobUrl,
        atsScoreBefore: result.atsScoreBefore,
        atsScoreAfter: result.atsScoreAfter,
        matchedKeywords: result.matchedKeywords,
        selectedSources: result.selectedSources,
        cvData: result.cvData,
        coverLetter: result.coverLetter,
        fellowshipAnswers: result.fellowshipAnswers || [],
      })
      setActiveOutputTab('cv')

      toast({
        title: 'İlana Özel Harvard CV & Mektup Hazır ✓',
        description: `${result.targetCompany} - ${result.targetRole} için tüm kaynaklarınız taranarak en iyi eşleşme üretildi.`,
      })
    } catch {
      toast({
        title: 'Bağlantı Hatası',
        description: 'Yapay zeka servisine ulaşılamadı.',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleTemplateSwitch(newTemplate: HarvardTemplateId) {
    setTemplateId(newTemplate)
    if (activeResult?._id) {
      try {
        await updateGeneratedCvMutation({
          id: activeResult._id as Id<'generatedCvs'>,
          templateId: newTemplate,
        })
      } catch {
        // ignore
      }
    }
  }

  async function handleSaveToPoolAndApplications() {
    if (!activeResult) return
    setIsSavingToPool(true)
    try {
      const cvTitle = `${activeResult.targetCompany}_${activeResult.targetRole}_Harvard_CV`
        .replace(/\s+/g, '_')
        .slice(0, 80)

      const allSkills = [
        ...(activeResult.cvData.skills?.technical || []),
        ...(activeResult.cvData.skills?.tools || []),
        ...(activeResult.cvData.skills?.domains || []),
      ].slice(0, 12)

      const rawTextCompiled = [
        activeResult.cvData.fullName,
        activeResult.cvData.summary,
        ...(activeResult.cvData.experience || []).map(
          (e) => `${e.role} @ ${e.company} (${e.date}):\n${e.bullets.join('\n')}`
        ),
        ...(activeResult.cvData.projects || []).map(
          (p) => `${p.name}: ${p.bullets.join('\n')}`
        ),
      ]
        .filter(Boolean)
        .join('\n\n')

      // 1. Save to CV Pool (resumes)
      const newResumeId = await createResumeMutation({
        name: cvTitle,
        category: 'Genel / Standart CV',
        targetRole: activeResult.targetRole,
        summary: activeResult.cvData.summary,
        skills: allSkills,
        coverLetter: language === 'tr' ? activeResult.coverLetter : undefined,
        coverLetterEn: language === 'en' ? activeResult.coverLetter : undefined,
        rawText: rawTextCompiled,
        isDefault: false,
      })

      // 2. Save to Applications (Başvurularım)
      await createApplicationMutation({
        company: activeResult.targetCompany,
        position: activeResult.targetRole,
        status: 'preparing',
        appliedAt: new Date().toISOString().slice(0, 10),
        channel: activeResult.jobUrl?.includes('linkedin') ? 'linkedin' : 'online',
        resumeId: newResumeId,
        cvVersion: cvTitle,
        jobLink: activeResult.jobUrl,
        hrContacted: false,
        note: `CV Stüdyosu ile üretildi (ATS Uyum: %${activeResult.atsScoreAfter})`,
      })

      toast({
        title: 'CV Havuzuna & Başvurularıma Kaydedildi ✓',
        description: `"${cvTitle}" CV Havuzunuza eklendi ve başvuru kaydı oluşturuldu.`,
      })
    } catch {
      toast({
        title: 'Kaydedilirken hata oluştu',
        variant: 'destructive',
      })
    } finally {
      setIsSavingToPool(false)
    }
  }

  const totalSourceCount = careerSources?.length || 0

  return (
    <div data-tour="cv-studio-section" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              Kariyer Hafızası & Harvard CV Stüdyosu
            </h2>
            <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
              {totalSourceCount} Kaynak Hafızada
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Eski CV&apos;lerinizi, motivasyon mektuplarınızı, fellowship başvurularınızı ve kendinizle ilgili her şeyi kaynak dosyası gibi <strong>tak tak tak</strong> bırakın. LinkedIn ilanını yapıştırdığınızda sistem hafızanızdaki en iyi bilgileri seçip Harvard standartlarında CV ve mektup üretsin.
          </p>
        </div>

        {resumes.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSyncingResumes}
            onClick={handleSyncResumes}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            {isSyncingResumes ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FolderSync className="h-3.5 w-3.5 text-primary" />
            )}
            CV Havuzumu Hafızaya Eşitle ({resumes.length})
          </Button>
        )}
      </div>

      {/* Main Grid: Left = Rapid Source Memory + Job Tailor Input | Right = Live Harvard Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): 1. Rapid Dropzone + 2. Tailor Engine */}
        <div className="lg:col-span-5 space-y-5">
          {/* STEP 1: TAK TAK TAK KAYNAK YÜKLEME KASASI */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-foreground text-background text-[11px] font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  Kaynak Belgelerini Bırak (Kariyer Hafızası)
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Çoklu Dosya / Metin
              </span>
            </div>

            {/* Multi-file Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFilesDropped(e.dataTransfer.files)
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[0.99]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/40'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.md,.json,.png,.jpg,.jpeg,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesDropped(e.target.files)
                    e.target.value = ''
                  }
                }}
              />
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                <Upload className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                Belgeleri buraya sürükleyin veya tıklayıp topluca seçin
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Eski CV&apos;ler, Motivasyon Mektupları, Fellowship Başvuruları, Projeler (PDF, TXT, Görsel)
              </p>
            </div>

            {/* Active Upload Queue Indicator */}
            {uploadingQueue.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  <span>
                    Hafızaya işleniyor ({uploadingQueue.length} belge kaldı)...
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {uploadingQueue.map((name, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-background border border-border px-2 py-0.5 rounded-md text-muted-foreground truncate max-w-[200px]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Paste Box (Zero-Effort Text / Essay / Drive Link Drop) */}
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <textarea
                  rows={2}
                  value={quickPasteText}
                  onChange={(e) => setQuickPasteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleQuickPasteSubmit()
                    }
                  }}
                  placeholder="Veya eski bir motivasyon mektubunu, fellowship cevabını, Drive linkini ya da kendinizle ilgili bir başarıyı buraya yapıştırıp ekleyin..."
                  className="flex-1 rounded-xl bg-muted/60 border border-border/70 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={!quickPasteText.trim() || isQuickPasting}
                  onClick={handleQuickPasteSubmit}
                  className="h-auto px-3 rounded-xl text-xs font-semibold shrink-0"
                >
                  {isQuickPasting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Ekle
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Uploaded Sources List */}
            {careerSources && careerSources.length > 0 && (
              <div className="space-y-1.5 pt-1 max-h-60 overflow-y-auto pr-1">
                <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between px-0.5">
                  <span>Hafızadaki Kaynaklar ({careerSources.length})</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    ● Tüm üretimler bu havuzu kullanır
                  </span>
                </div>
                {careerSources.map((src) => {
                  const meta =
                    SOURCE_TYPE_META[src.sourceType] || SOURCE_TYPE_META.other
                  const isExpanded = expandedSourceId === src._id
                  return (
                    <div
                      key={src._id}
                      className="bg-muted/30 border border-border/70 rounded-xl p-2.5 text-xs space-y-1.5 transition-colors hover:border-border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedSourceId(isExpanded ? null : src._id)
                          }
                          className="flex-1 text-left min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                'text-[10px] font-semibold px-1.5 py-0.2 rounded border',
                                meta.badgeClass
                              )}
                            >
                              {meta.label}
                            </span>
                            <span className="font-semibold text-foreground truncate">
                              {src.title}
                            </span>
                          </div>
                          {src.extractedSummary && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {src.extractedSummary}
                            </p>
                          )}
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedSourceId(isExpanded ? null : src._id)
                            }
                            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Detayları gör"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              removeSourceMutation({
                                id: src._id as Id<'careerSources'>,
                              })
                            }
                            className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Hafızadan kaldır"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {src.extractedHighlights &&
                        src.extractedHighlights.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {src.extractedHighlights.slice(0, 4).map((h, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-background border border-border/60 px-1.5 py-0.5 rounded text-muted-foreground"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        )}

                      {isExpanded && (
                        <div className="pt-1.5 border-t border-border/50 text-[11px] text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {src.rawContent}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* STEP 2: LINKEDIN İLANINDAN VEYA METİNDEN ÖZEL CV ÜRETİCİ */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  İlana / Programa Özel CV & Mektup Oluştur
                </h3>
              </div>
            </div>

            {/* Job Link / Text Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                LinkedIn İlan Linki veya İlan / Fellowship Açıklaması
              </label>
              <textarea
                rows={4}
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/... linkini yapıştırın VEYA iş ilanının / fellowship programının açıklamasını buraya yapıştırın..."
                className="w-full rounded-xl bg-muted/60 border border-border/80 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-y"
              />
            </div>

            {/* Optional Target Company & Role Override */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Hedef Şirket / Kurum (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="Örn: Teknoloji A.Ş."
                  className="mt-1 w-full h-8 px-2.5 rounded-lg bg-muted/60 border border-border/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground">
                  Hedef Pozisyon (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="Örn: Product Specialist"
                  className="mt-1 w-full h-8 px-2.5 rounded-lg bg-muted/60 border border-border/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Template & Language Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Profesyonel Şablon Seçimi
                </label>
                <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                      language === 'en'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    🇬🇧 English CV
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('tr')}
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                      language === 'tr'
                        ? 'bg-background text-foreground shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    🇹🇷 Türkçe CV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {TEMPLATE_META.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateSwitch(tpl.id)}
                    className={cn(
                      'text-left p-2.5 rounded-xl border transition-all cursor-pointer',
                      templateId === tpl.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border/80 bg-muted/30 hover:border-border'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-foreground">
                        {tpl.name}
                      </span>
                    </div>
                    <span className="inline-block text-[10px] font-medium text-primary mt-0.5">
                      {tpl.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Custom Fellowship / Application Questions */}
            <div>
              <button
                type="button"
                onClick={() => setShowCustomQuestions(!showCustomQuestions)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                {showCustomQuestions ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                <span>
                  Özel Fellowship / Başvuru Formu Soruları Var mı? (Opsiyonel)
                </span>
              </button>
              {showCustomQuestions && (
                <textarea
                  rows={3}
                  value={customQuestionsText}
                  onChange={(e) => setCustomQuestionsText(e.target.value)}
                  placeholder={
                    'Her satıra bir başvuru sorusu yazın (Örn:\nWhy do you want to join this fellowship?\nDescribe a project where you created measurable impact.)'
                  }
                  className="mt-2 w-full rounded-xl bg-muted/60 border border-border/80 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>

            {/* Generate CTA */}
            <Button
              type="button"
              onClick={handleGenerateTailoredCV}
              disabled={isGenerating}
              className="w-full h-10 text-xs font-bold gap-2 rounded-xl shadow-md"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Hafızanız Taranıyor & Harvard CV Hazırlanıyor...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Hafızamdaki En İyi Bilgilerle Özel CV & Mektup Oluştur
                </>
              )}
            </Button>
          </div>

          {/* PREVIOUSLY GENERATED CVS HISTORY */}
          {generatedCvs && generatedCvs.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-primary" />
                  Üretilen Özel CV Geçmişim ({generatedCvs.length})
                </h3>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {generatedCvs.map((item) => {
                  const isSelected = activeResult?._id === item._id
                  return (
                    <div
                      key={item._id}
                      className={cn(
                        'flex items-center justify-between gap-2 p-2 rounded-xl border text-xs transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 font-semibold'
                          : 'border-border/60 bg-muted/30 hover:border-border'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveResult({
                            _id: item._id,
                            targetCompany: item.targetCompany,
                            targetRole: item.targetRole,
                            jobUrl: item.jobUrl,
                            atsScoreBefore: item.atsScoreBefore,
                            atsScoreAfter: item.atsScoreAfter,
                            matchedKeywords: item.matchedKeywords,
                            selectedSources: item.selectedSources,
                            cvData: item.cvData,
                            coverLetter: item.coverLetter,
                            fellowshipAnswers: item.fellowshipAnswers || [],
                          })
                          setTemplateId(item.templateId)
                          setLanguage(item.language)
                        }}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <div className="truncate text-foreground font-semibold">
                          {item.targetCompany} — {item.targetRole}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ATS %{item.atsScoreAfter}
                          </span>
                          <span>•</span>
                          <span className="uppercase">{item.templateId}</span>
                          <span>•</span>
                          <span className="uppercase">{item.language}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removeGeneratedCvMutation({
                            id: item._id as Id<'generatedCvs'>,
                          })
                        }
                        className="p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (7 cols): LIVE HARVARD CV & COVER LETTER & FELLOWSHIP STUDIO */}
        <div className="lg:col-span-7 space-y-4">
          {/* ATS Match & Selected Evidence Banner */}
          {activeResult && (
            <div className="bg-card border border-primary/25 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Özel Üretim Paketi
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {activeResult.targetCompany} · {activeResult.targetRole}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="text-muted-foreground">
                      Genel CV Uyumu:{' '}
                      <strong className="text-foreground">
                        %{activeResult.atsScoreBefore}
                      </strong>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      Yeni Harvard CV Uyumu: %{activeResult.atsScoreAfter}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isSavingToPool}
                  onClick={handleSaveToPoolAndApplications}
                  className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shrink-0 font-semibold"
                >
                  {isSavingToPool ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  CV Havuzuma & Başvurularıma Kaydet
                </Button>
              </div>

              {/* Matched Keywords */}
              {activeResult.matchedKeywords.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    İlandan Yakalanan Anahtar Kelimeler:
                  </span>
                  {activeResult.matchedKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-md"
                    >
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Why AI selected these items from memory */}
              {activeResult.selectedSources.length > 0 && (
                <div className="bg-muted/40 border border-border/60 rounded-xl p-2.5 space-y-1">
                  <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    Kariyer Hafızanızdan Seçilen En Güçlü Kanıtlar:
                  </div>
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 pl-5 list-disc">
                    {activeResult.selectedSources.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Output Sub-Navigation & Density Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card border border-border rounded-xl p-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveOutputTab('cv')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeOutputTab === 'cv'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                Harvard CV Şablonu
              </button>
              <button
                type="button"
                onClick={() => setActiveOutputTab('letter')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeOutputTab === 'letter'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Motivasyon Mektubu
              </button>
              <button
                type="button"
                onClick={() => setActiveOutputTab('fellowship')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                  activeOutputTab === 'fellowship'
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Award className="h-3.5 w-3.5" />
                Fellowship & Mülakat Cevapları
              </button>
            </div>

            {activeOutputTab === 'cv' && (
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                <Layers className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-0.5" />
                {(
                  [
                    { id: 'compact', label: 'Tek Sayfa Sıkı' },
                    { id: 'standard', label: 'Standart' },
                    { id: 'spacious', label: 'Geniş' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDensity(d.id)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer',
                      density === d.id
                        ? 'bg-background text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 1: HARVARD CV PREVIEW */}
          {activeOutputTab === 'cv' && (
            <HarvardCVPreview
              data={activeResult?.cvData || DEMO_HARVARD_CV}
              templateId={templateId}
              language={language}
              density={density}
              fileName={
                activeResult
                  ? `${activeResult.cvData.fullName || 'CV'}_${activeResult.targetCompany}_${activeResult.targetRole}`
                  : 'Harvard_CV_Template'
              }
            />
          )}

          {/* TAB 2: TAILORED COVER LETTER / MOTIVATION LETTER */}
          {activeOutputTab === 'letter' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Kendi Üslubunuzla Üretilen Motivasyon Mektubu (Cover Letter)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Geçmiş motivasyon mektuplarınız ve gerçek metrikleriniz baz alınarak{' '}
                    {activeResult?.targetCompany || 'hedef kurum'} için hazırlandı.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const text =
                      activeResult?.coverLetter ||
                      'Henüz bir ilan için üretim yapmadınız.'
                    await navigator.clipboard.writeText(text)
                    toast({ title: 'Motivasyon Mektubu Kopyalandı ✓' })
                  }}
                  className="h-8 text-xs gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Kopyala
                </Button>
              </div>

              <textarea
                rows={16}
                value={
                  activeResult?.coverLetter ||
                  'Sol taraftan bir LinkedIn ilanı veya program açıklaması girip "Özel CV & Mektup Oluştur" butonuna tıkladığınızda, geçmiş motivasyon mektuplarınızdaki yazı üslubunuzla hazırlanan özel mektup burada yer alır.'
                }
                onChange={(e) => {
                  if (!activeResult) return
                  setActiveResult({
                    ...activeResult,
                    coverLetter: e.target.value,
                  })
                }}
                className="w-full rounded-xl bg-muted/40 border border-border p-4 text-xs sm:text-sm leading-relaxed text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-serif"
              />
            </div>
          )}

          {/* TAB 3: FELLOWSHIP & APPLICATION Q&A */}
          {activeOutputTab === 'fellowship' && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-2xs">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Fellowship & Başvuru Formu Soru-Cevap Seti
                </h3>
                <p className="text-xs text-muted-foreground">
                  Kariyer Hafızanızdaki gerçek proje, girişim ve liderlik hikayelerinizden süzülen hazır başvuru cevapları.
                </p>
              </div>

              {activeResult?.fellowshipAnswers &&
              activeResult.fellowshipAnswers.length > 0 ? (
                <div className="space-y-3">
                  {activeResult.fellowshipAnswers.map((qa, idx) => (
                    <div
                      key={idx}
                      className="bg-muted/30 border border-border rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-foreground">
                          Soru {idx + 1}: {qa.question}
                        </h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await navigator.clipboard.writeText(qa.answer)
                            toast({ title: 'Cevap Panoya Kopyalandı ✓' })
                          }}
                          className="h-7 px-2 text-[11px] gap-1 shrink-0"
                        >
                          <Copy className="h-3 w-3" />
                          Kopyala
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {qa.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  İlan veya Fellowship çağrısı için üretim yaptığınızda, o programa özel açık uçlu başvuru sorularının cevapları burada oluşturulur.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
