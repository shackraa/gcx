'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUIStore } from '@/lib/store/ui'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Resume } from '@/types'
import { Button } from '@/components/ui/button'
import {
  X,
  Trash2,
  Plus,
  Sparkles,
  Upload,
  Loader2,
  Key,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  Copy,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatFileSize, safeUrl } from '@/lib/utils/applications'
import type { Id } from '@/convex/_generated/dataModel'

const schema = z.object({
  name: z.string().min(1, 'CV adı gerekli'),
  category: z.string().min(1, 'Kategori seçimi gerekli'),
  targetRole: z.string().optional(),
  fileUrl: z.string().url('Geçerli bir URL girin').or(z.literal('')).optional(),
  coverLetter: z.string().optional(),
  rawText: z.string().optional(),
  isDefault: z.boolean().default(false),
})

type FormValues = z.infer<typeof schema>

const COMMON_CATEGORIES = [
  'Yapay Zeka & Veri',
  'Frontend Geliştirme',
  'Backend Geliştirme',
  'Full Stack Geliştirme',
  'Mobil Geliştirme',
  'DevOps & Bulut',
  'Ürün Yönetimi',
  'UI/UX & Tasarım',
  'Genel / Standart CV',
  'Diğer',
]

interface ResumeFormModalProps {
  resumes: Resume[]
}

interface AIAnalysisResult {
  name?: string
  category?: string
  targetRole?: string
  coverLetter?: string
  skills?: string[]
  summary?: string
  experienceLevel?: string
  extractedText?: string
  suggestedLinkedInQueries?: string[]
  strengths?: string[]
  improvements?: string[]
}

export function ResumeFormModal({ resumes }: ResumeFormModalProps) {
  const { closeResumeModal, editingResumeId } = useUIStore()
  const editingResume = editingResumeId ? resumes.find((r) => r._id === editingResumeId) : null
  const generateUploadUrlMutation = useMutation(api.resumes.generateUploadUrl)
  const createMutation = useMutation(api.resumes.create)
  const updateMutation = useMutation(api.resumes.update)
  const removeMutation = useMutation(api.resumes.remove)
  const { toast } = useToast()

  // AI & File State
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [tempApiKey, setTempApiKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  
  // Selected / Pending File state
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [fileRemoved, setFileRemoved] = useState(false)
  const [selectedFilePreview, setSelectedFilePreview] = useState<{ base64: string; mimeType: string; name: string; size: number } | null>(null)
  const [aiInsights, setAiInsights] = useState<AIAnalysisResult | null>(null)
  const [showInsights, setShowInsights] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: editingResume?.name ?? '',
      category: editingResume?.category ?? 'Yapay Zeka & Veri',
      targetRole: editingResume?.targetRole ?? '',
      fileUrl: editingResume?.fileUrl ?? '',
      coverLetter: editingResume?.coverLetter ?? '',
      rawText: editingResume?.rawText ?? '',
      isDefault: editingResume?.isDefault ?? false,
    },
  })

  // Load stored Gemini API key if present
  useEffect(() => {
    const saved = localStorage.getItem('gcx_gemini_api_key')
    if (saved) {
      setApiKey(saved)
      setTempApiKey(saved)
    }
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeResumeModal()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeResumeModal])

  function handleSaveApiKey() {
    const trimmed = tempApiKey.trim()
    setApiKey(trimmed)
    localStorage.setItem('gcx_gemini_api_key', trimmed)
    setShowKeyInput(false)
    toast({ title: 'Gemini API Anahtarı Kaydedildi ✓' })
  }

  // Generate Cover Letter via AI
  async function handleGenerateCoverLetter() {
    const rawTextValue = watch('rawText')
    const targetRoleValue = watch('targetRole')
    const activeKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('gcx_gemini_api_key') || '' : '')

    if (!rawTextValue && !selectedFilePreview?.base64) {
      toast({
        title: 'CV Bilgisi Gerekli',
        description: 'Ön yazı oluşturmak için lütfen bir CV dosyası seçin veya CV metnini girin.',
        variant: 'destructive',
      })
      return
    }

    setIsGeneratingCoverLetter(true)
    try {
      const res = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawTextValue || selectedFilePreview?.base64 || 'Aday CV Bilgileri',
          targetRole: targetRoleValue || 'İlgili Pozisyon',
          apiKey: activeKey || undefined,
        }),
      })

      const json = await res.json()
      if (res.ok && json.coverLetter) {
        setValue('coverLetter', json.coverLetter, { shouldValidate: true, shouldDirty: true })
        toast({ title: '✨ Cover Letter Oluşturuldu!' })
      } else {
        toast({
          title: 'Hata',
          description: json.message || 'Ön yazı oluşturulamadı.',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Bağlantı Hatası', variant: 'destructive' })
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  async function handleCopyCoverLetter() {
    const text = watch('coverLetter')
    if (text) {
      await navigator.clipboard.writeText(text)
      toast({ title: 'Cover Letter Panoya Kopyalandı ✓' })
    }
  }

  // Handle File selection
  function handleFileSelected(file: File) {
    setPendingFile(file)
    setFileRemoved(false)

    // Dosya adını (uzantısız veya tam) otomatik CV İsmi olarak ayarla
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '') || file.name
    setValue('name', cleanFileName, { shouldValidate: true, shouldDirty: true })

    const reader = new FileReader()
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1]
      const fileData = {
        base64: base64Data,
        mimeType: file.type || 'application/pdf',
        name: file.name,
        size: file.size,
      }
      setSelectedFilePreview(fileData)
      // Automatically trigger analysis!
      parseCVWithAI({ fileBase64: base64Data, mimeType: fileData.mimeType, preferredName: cleanFileName })
    }
    reader.onerror = () => {
      toast({ title: 'Dosya okunamadı', variant: 'destructive' })
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveFile() {
    setPendingFile(null)
    setSelectedFilePreview(null)
    setFileRemoved(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Parse CV via AI
  async function parseCVWithAI(overridePayload?: { fileBase64?: string; mimeType?: string; rawText?: string; preferredName?: string }) {
    setIsAnalyzing(true)

    const filePayload = overridePayload?.fileBase64
      ? { fileBase64: overridePayload.fileBase64, mimeType: overridePayload.mimeType }
      : selectedFilePreview
      ? { fileBase64: selectedFilePreview.base64, mimeType: selectedFilePreview.mimeType }
      : {}

    const activeKey = apiKey || (typeof window !== 'undefined' ? localStorage.getItem('gcx_gemini_api_key') || '' : '')
    const rawTextValue = watch('rawText')
    const reqPayload = {
      ...filePayload,
      rawText: overridePayload?.rawText || rawTextValue || undefined,
      apiKey: activeKey || undefined,
    }

    if (!reqPayload.fileBase64 && !reqPayload.rawText?.trim()) {
      setIsAnalyzing(false)
      toast({
        title: 'CV Seçilmedi',
        description: 'Lütfen bir PDF dosyası yükleyin veya CV metnini yapıştırın.',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await fetch('/api/ai/parse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.error === 'NO_API_KEY') {
          setShowKeyInput(true)
          toast({
            title: 'Gemini API Anahtarı Gerekli',
            description: 'Google AI Studio üzerinden aldığınız ücretsiz anahtarı girin.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Analiz Başarısız',
            description: json.message || 'CV analiz edilemedi.',
            variant: 'destructive',
          })
        }
        setIsAnalyzing(false)
        return
      }

      const data: AIAnalysisResult = json.data
      setAiInsights(data)

      // Auto-populate form fields!
      // Keep file name as the CV name if a file was selected, otherwise use AI extracted name
      const targetName = overridePayload?.preferredName || (pendingFile ? pendingFile.name.replace(/\.[^/.]+$/, '') : data.name)
      if (targetName) setValue('name', targetName, { shouldValidate: true, shouldDirty: true })
      if (data.category) setValue('category', data.category, { shouldValidate: true, shouldDirty: true })
      if (data.targetRole) setValue('targetRole', data.targetRole, { shouldValidate: true, shouldDirty: true })
      if (data.coverLetter) setValue('coverLetter', data.coverLetter, { shouldValidate: true, shouldDirty: true })
      if (data.extractedText) setValue('rawText', data.extractedText, { shouldValidate: true, shouldDirty: true })

      toast({
        title: '✨ CV Başarıyla Analiz Edildi!',
        description: 'Dosya adı, hedef pozisyon ve Cover Letter dolduruldu.',
      })
    } catch (err) {
      console.error(err)
      toast({
        title: 'Bağlantı Hatası',
        description: 'AI servisine bağlanılamadı.',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function onSubmit(values: any) {
    setIsUploading(true)
    try {
      let storageIdToSave: Id<'_storage'> | undefined = undefined
      let fileNameToSave: string | undefined = undefined
      let fileSizeToSave: number | undefined = undefined

      if (pendingFile) {
        // Upload the new file to Convex Storage
        const uploadUrl = await generateUploadUrlMutation()
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': pendingFile.type || 'application/pdf' },
          body: pendingFile,
        })
        if (!uploadRes.ok) {
          throw new Error('Dosya yüklenemedi')
        }
        const { storageId } = await uploadRes.json()
        storageIdToSave = storageId as Id<'_storage'>
        fileNameToSave = pendingFile.name
        fileSizeToSave = pendingFile.size
      } else if (fileRemoved) {
        storageIdToSave = undefined
        fileNameToSave = undefined
        fileSizeToSave = undefined
      } else if (editingResume) {
        storageIdToSave = editingResume.storageId as Id<'_storage'> | undefined
        fileNameToSave = editingResume.fileName
        fileSizeToSave = editingResume.fileSize
      }

      const payload = {
        name: values.name,
        category: values.category,
        targetRole: values.targetRole || undefined,
        fileUrl: values.fileUrl || undefined,
        storageId: storageIdToSave,
        fileName: fileNameToSave,
        fileSize: fileSizeToSave,
        coverLetter: values.coverLetter || undefined,
        rawText: values.rawText || undefined,
        isDefault: Boolean(values.isDefault),
      }

      if (editingResume) {
        await updateMutation({
          id: editingResume._id as Id<'resumes'>,
          ...payload,
        })
        toast({ title: 'CV Güncellendi ✓' })
      } else {
        await createMutation(payload)
        toast({ title: 'Yeni CV ve Dosya Eklendi ✓' })
      }
      closeResumeModal()
    } catch (err) {
      console.error('Save error:', err)
      toast({ title: 'CV kaydedilemedi', variant: 'destructive' })
    } finally {
      setIsUploading(false)
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
      <div className="relative z-10 w-full sm:max-w-xl bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {editingResume ? 'CV Profilini Düzenle' : 'Yeni CV Ekle & AI Analiz'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Google Gemini AI ile otomatik analiz et veya manuel doldur.
              </p>
            </div>
          </div>
          <button
            onClick={closeResumeModal}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
          {/* AI Auto-Fill Hero Box */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/25 rounded-xl p-3.5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-xs font-bold text-foreground">
                  Google Gemini AI ile Otomatik Doldur ($0 Cost)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                title="Gemini API Anahtarı Ayarları"
              >
                <Key className="h-3 w-3" />
                <span>{apiKey ? 'API Anahtarı Kayıtlı ✓' : 'API Key Gir'}</span>
              </button>
            </div>

            {/* API Key Drawer */}
            {showKeyInput && (
              <div className="bg-background/90 border border-border/80 rounded-lg p-2.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Google AI Studio API Anahtarı (Tamamen Ücretsiz)</span>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5 text-[11px]"
                  >
                    Ücretsiz Key Al <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 h-8 px-2.5 rounded-md bg-muted border-0 text-xs font-mono"
                  />
                  <Button size="sm" onClick={handleSaveApiKey} className="h-8 text-xs">
                    Kaydet
                  </Button>
                </div>
              </div>
            )}

            {/* Upload / Action Row */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(file)
              }}
            />

            {pendingFile ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{pendingFile.name}</p>
                    <p className="text-[10px] text-emerald-400">
                      {formatFileSize(pendingFile.size)} • Kaydedildiğinde bulut depoya yüklenecek
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => parseCVWithAI()}
                    disabled={isAnalyzing}
                    className="h-7 text-[11px] px-2 gap-1 text-primary hover:text-primary"
                  >
                    {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    Yeniden Analiz Et
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-[11px] px-2"
                  >
                    Değiştir
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-7 text-[11px] px-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    Kaldır
                  </Button>
                </div>
              </div>
            ) : editingResume?.fileName && !fileRemoved ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-background/80 border border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{editingResume.fileName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {editingResume.fileSize ? formatFileSize(editingResume.fileSize) : 'Yüklü Dosya'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  {(editingResume.downloadUrl || editingResume.fileUrl) && (
                    <a
                      href={editingResume.downloadUrl || editingResume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={editingResume.fileName || `${editingResume.name}.pdf`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 px-2 py-1 rounded-md transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      İndir / Aç
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-[11px] px-2"
                  >
                    Değiştir
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="h-7 text-[11px] px-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    Kaldır
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="h-9 text-xs gap-2 border-dashed border-primary/40 hover:border-primary bg-background/50 justify-center shrink-0 max-w-full sm:max-w-[210px]"
                >
                  <Upload className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">PDF / CV Dosyası Seç</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => parseCVWithAI()}
                  disabled={isAnalyzing}
                  className="flex-1 h-9 text-xs gap-1.5 font-semibold bg-primary text-primary-foreground shadow-sm justify-center"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Gemini CV&apos;yi İnceliyor…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>CV Analiz Et & Doldur</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* AI Insights (Strengths & LinkedIn queries if analyzed) */}
          {aiInsights && (
            <div className="bg-muted/40 border border-border/80 rounded-xl p-3 space-y-2 text-xs">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowInsights(!showInsights)}
              >
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  AI Profil Analizi & LinkedIn Önerileri
                </span>
                {showInsights ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>

              {showInsights && (
                <div className="space-y-2 pt-1 border-t border-border/40 text-[11px]">
                  {aiInsights.strengths && aiInsights.strengths.length > 0 && (
                    <div>
                      <span className="font-semibold text-green-400">💪 Güçlü Yönlerin:</span>
                      <ul className="list-disc list-inside text-muted-foreground mt-0.5 space-y-0.5">
                        {aiInsights.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiInsights.suggestedLinkedInQueries && aiInsights.suggestedLinkedInQueries.length > 0 && (
                    <div>
                      <span className="font-semibold text-primary">🔍 Önerilen LinkedIn Arama Sorguları:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {aiInsights.suggestedLinkedInQueries.map((q, i) => (
                          <span
                            key={i}
                            className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-[10px]"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main Form Fields */}
          <form id="resume-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name & Target Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  CV İsmi <span className="text-red-400">*</span>
                </label>
                <input
                  {...register('name')}
                  className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Örn: Senior Data Engineer CV"
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
                  className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Örn: Data Engineer / Product Specialist"
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
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
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
                CV Linki (Google Drive / Harici Bağlantı vb.)
              </label>
              <input
                {...register('fileUrl')}
                type="url"
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="https://drive.google.com/file/d/..."
              />
              {errors.fileUrl && (
                <p className="text-xs text-red-400 mt-1">{errors.fileUrl.message}</p>
              )}
            </div>

            {/* Cover Letter (Ön Yazı) */}
            <div className="space-y-2 bg-muted/20 border border-border/70 rounded-xl p-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Ön Yazı (Cover Letter)
                </label>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCoverLetter}
                    disabled={!watch('coverLetter')}
                    className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" />
                    Kopyala
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateCoverLetter}
                    disabled={isGeneratingCoverLetter}
                    className="h-7 text-[11px] px-2.5 gap-1.5 text-primary hover:text-primary border-primary/30 bg-primary/5 font-semibold"
                  >
                    {isGeneratingCoverLetter ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Üretiliyor…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>{watch('coverLetter') ? 'Cover Letter Yenile' : 'Cover Letter Oluştur'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <textarea
                {...register('coverLetter')}
                rows={5}
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border/80 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-y leading-relaxed text-foreground placeholder:text-muted-foreground/60"
                placeholder="Bu alana CV'nize ve hedef pozisyonunuza uygun etkileyici bir Cover Letter (Ön Yazı) yazabilir veya 'Cover Letter Oluştur' butonuna basarak yapay zekaya ürettirebilirsiniz..."
              />
            </div>

            {/* Raw Text for AI Analysis & Matching */}
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>CV Metni (LinkedIn İlan Eşleştirme İçin)</span>
                <span className="text-[10px] text-muted-foreground">PDF yüklendiğinde otomatik dolar</span>
              </label>
              <textarea
                {...register('rawText')}
                rows={3}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-ring resize-none font-mono"
                placeholder="CV içeriğini buraya yapıştırabilir veya üstteki butondan PDF yükleyebilirsiniz..."
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border shrink-0">
          {editingResume ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Sil
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeResumeModal} className="text-xs">
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || isUploading}
              className="text-xs font-semibold gap-1.5"
            >
              {isUploading || isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Dosya Yükleniyor & Kaydediliyor…</span>
                </>
              ) : (
                <span>Kaydet</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
