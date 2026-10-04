'use client'

import { useState } from 'react'
import type { Resume, Application } from '@/types'
import { useUIStore } from '@/lib/store/ui'
import { getResumeStats, safeUrl, formatFileSize } from '@/lib/utils/applications'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Plus,
  ExternalLink,
  Edit2,
  Sparkles,
  Search,
  CheckCircle,
  Briefcase,
  TrendingUp,
  Download,
  Calendar,
  Clock,
  Copy,
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ResumeListProps {
  resumes: Resume[]
  applications: Application[]
}

export function ResumeList({ resumes, applications }: ResumeListProps) {
  const { openResumeModal, openModal, setResumeFilter, setView } = useUIStore()
  const { toast } = useToast()
  const resumeStats = getResumeStats(applications, resumes)
  const [selectedLangMap, setSelectedLangMap] = useState<Record<string, 'tr' | 'en'>>({})
  const [showDemoResume, setShowDemoResume] = useState(true)

  async function handleCopyCoverLetter(text: string) {
    if (!text) return
    await navigator.clipboard.writeText(text)
    toast({ title: 'Cover Letter Panoya Kopyalandı ✓' })
  }

  const DEMO_RESUME: Resume = {
    _id: 'demo-resume-1' as any,
    _creationTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    userId: 'demo-user',
    name: 'Kıdemli Yazılım Geliştirici (Örnek CV)',
    category: 'Yazılım / Frontend',
    targetRole: 'Senior Frontend / React & TypeScript',
    isDefault: true,
    fileName: 'frontend_developer_cv_2026.pdf',
    fileSize: 1845200,
    fileUrl: '#',
    downloadUrl: '#',
    summary: '5+ yıl React, TypeScript, TailwindCSS ve mikroservis mimarileri deneyimli kıdemli geliştirici.',
    skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Redux', 'GraphQL', 'REST API'],
    coverLetter:
      'Sayın Yetkili,\n\nŞirketiniz bünyesindeki yazılım geliştirme pozisyonu için 5 yılı aşkın modern web mimarileri, React, Next.js ve ölçeklenebilir frontend sistemleri deneyimimle başvurumu sunmaktan memnuniyet duyarım. Performans odaklı, temiz kod standartlarına bağlı çalışma prensiplerimle ekibinize değer katmayı hedefliyorum.\n\nİlginiz için teşekkür ederim.',
    coverLetterEn:
      'Dear Hiring Team,\n\nI am writing to express my strong interest in the software engineering role at your company. With over 5 years of experience building modern, performant web applications using React and Next.js, I look forward to contributing to your team\'s goals.\n\nThank you for your consideration.',
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  }

  if (resumes.length === 0) {
    return (
      <div data-tour="resume-pool-section" className="space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              CV Havuzum (0 Versiyon)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Farklı uzmanlık veya pozisyonlara göre CV versiyonlarınızı buraya yükleyin
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDemoResume(!showDemoResume)}
              className="text-xs text-muted-foreground hover:text-foreground h-8"
            >
              {showDemoResume ? 'Örnek CV’yi Gizle' : 'Örnek CV’yi Göster'}
            </Button>
            <Button onClick={() => openResumeModal()} size="sm" className="gap-1.5 h-8">
              <Plus className="h-4 w-4" />
              İlk CV&apos;ni Ekle
            </Button>
          </div>
        </div>

        {/* Empty state prompt */}
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-card border border-dashed rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div className="max-w-md">
            <h3 className="text-sm font-bold text-foreground">Henüz CV Eklenmemiş</h3>
            <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
              Farklı pozisyonlar için hazırladığın PDF formatındaki CV&apos;lerini buraya yükle. Yapay zekâ yeteneklerini ve ön yazını otomatik oluştursun.
            </p>
          </div>
          <Button onClick={() => openResumeModal()} size="sm" className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            PDF CV Yükle
          </Button>
        </div>

        {/* Demo CV Card Showcase */}
        {showDemoResume && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Örnek CV Kartı (Sistemin nasıl çalıştığını inceleyebilirsiniz)
              </span>
              <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Örnek Gösterim
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-primary/20 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Title & Date */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{DEMO_RESUME.name}</h3>
                        <span className="bg-green-950/60 text-green-400 border border-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                          Varsayılan
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span>{DEMO_RESUME.targetRole}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 border border-border/50 px-2 py-1 rounded-md shrink-0">
                      <Calendar className="h-3 w-3 text-primary shrink-0" />
                      <span>Bugün güncellendi</span>
                    </div>
                  </div>

                  {/* Attached File Indicator */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate text-xs">
                          {DEMO_RESUME.fileName}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{formatFileSize(DEMO_RESUME.fileSize || 1800000)}</span>
                          <span>•</span>
                          <span>Yüklendi</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toast({ title: 'Örnek CV dosyası indirilemez', description: 'Kendi CV’nizi yüklediğinizde PDF dosyanız burada listelenir.' })}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/15 text-primary hover:bg-primary/25 px-2.5 py-1.5 rounded-md transition-colors shrink-0 ml-2 cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      İndir / Aç
                    </button>
                  </div>

                  {/* Cover Letter (Ön Yazı - Türkçe & İngilizce) */}
                  {(() => {
                    const activeLang = selectedLangMap['demo-resume-1'] || 'tr'
                    const currentLetterText = activeLang === 'en' ? DEMO_RESUME.coverLetterEn : DEMO_RESUME.coverLetter

                    return (
                      <div className="space-y-2 bg-muted/20 border border-border/60 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              Ön Yazı (Cover Letter)
                            </span>

                            <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-md border border-border/60">
                              <button
                                type="button"
                                onClick={() => setSelectedLangMap((prev) => ({ ...prev, 'demo-resume-1': 'tr' }))}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer',
                                  activeLang === 'tr'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                )}
                              >
                                <span>TR</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedLangMap((prev) => ({ ...prev, 'demo-resume-1': 'en' }))}
                                className={cn(
                                  'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer',
                                  activeLang === 'en'
                                    ? 'bg-primary text-primary-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                )}
                              >
                                <span>EN</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyCoverLetter(currentLetterText || '')}
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            Kopyala
                          </button>
                        </div>

                        <p className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-3">
                          {currentLetterText}
                        </p>
                      </div>
                    )
                  })()}

                  {/* Skills tags */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Çıkarılan Yetenekler (7 Yetenek):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {DEMO_RESUME.skills?.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-md border border-border/40 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Stats & Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs mt-3">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-foreground font-semibold">12 Başvuru</span>
                    <span>•</span>
                    <span className="text-green-400 font-semibold">%33 Dönüş (4 Yanıt)</span>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    Varsayılan Versiyon
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div data-tour="resume-pool-section" className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            CV Havuzum ({resumes.length} Versiyon)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Yüklediğin CV versiyonları, güncellenme tarihleri ve başvuru başarı oranları
          </p>
        </div>

        <Button onClick={() => openResumeModal()} size="sm" className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Yeni CV Ekle
        </Button>
      </div>

      {/* Resume Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resumeStats.map(({ resume, count, respondedCount, responseRate }) => {
          const cvUrl = safeUrl(resume.downloadUrl || resume.fileUrl)
          const dateTimestamp = resume.updatedAt || resume._creationTime

          return (
            <div
              key={resume._id}
              className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-border/80 transition-all shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Title & Date */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-foreground break-all">{resume.name}</h3>
                      {resume.isDefault && (
                        <span className="bg-green-950/60 text-green-400 border border-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    {resume.targetRole && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Briefcase className="h-3 w-3 shrink-0" />
                        <span className="truncate">{resume.targetRole}</span>
                      </p>
                    )}
                  </div>

                  {/* Upload / Updated Date Badge */}
                  {dateTimestamp && (
                    <div
                      className="flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 border border-border/50 px-2 py-1 rounded-md shrink-0"
                      title="Yüklenme / Son Güncelleme Tarihi"
                    >
                      <Calendar className="h-3 w-3 text-primary shrink-0" />
                      <span>
                        {format(new Date(dateTimestamp), 'd MMM yyyy, HH:mm', { locale: tr })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Attached File Indicator */}
                {resume.fileName || cvUrl ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate text-xs">
                          {resume.fileName || (resume.fileUrl ? 'Harici CV Bağlantısı' : 'CV Dosyası')}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          {resume.fileSize && <span>{formatFileSize(resume.fileSize)}</span>}
                          {resume.fileSize && dateTimestamp && <span>•</span>}
                          {dateTimestamp && (
                            <span>
                              Yüklendi: {format(new Date(dateTimestamp), 'd MMMM yyyy', { locale: tr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {cvUrl && (
                      <a
                        href={cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={resume.fileName || `${resume.name}.pdf`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-primary/15 text-primary hover:bg-primary/25 px-2.5 py-1.5 rounded-md transition-colors shrink-0 ml-2"
                        title="CV Dosyasını İndir / Aç"
                      >
                        <Download className="h-3 w-3" />
                        İndir / Aç
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-dashed border-border/60 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <FileText className="h-3.5 w-3.5 opacity-60" />
                      Dosya eklenmemiş (PDF veya link yükleyin)
                    </span>
                    <button
                      onClick={() => openResumeModal(resume._id)}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      + Dosya Yükle
                    </button>
                  </div>
                )}

                {/* Cover Letter (Ön Yazı - Türkçe & İngilizce) */}
                {(() => {
                  const activeLang = selectedLangMap[resume._id] || 'tr'
                  const currentLetterText = activeLang === 'en' ? resume.coverLetterEn : resume.coverLetter

                  return (
                    <div className="space-y-2 bg-muted/20 border border-border/60 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            Ön Yazı
                          </span>

                          {/* Language Switcher Pills */}
                          <div className="flex items-center gap-0.5 bg-muted p-0.5 rounded-md border border-border/60">
                            <button
                              type="button"
                              onClick={() => setSelectedLangMap((prev) => ({ ...prev, [resume._id]: 'tr' }))}
                              className={cn(
                                'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer',
                                activeLang === 'tr'
                                  ? 'bg-primary text-primary-foreground shadow-xs'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                              )}
                            >
                              <span>TR</span>
                              {Boolean(resume.coverLetter) && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedLangMap((prev) => ({ ...prev, [resume._id]: 'en' }))}
                              className={cn(
                                'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer',
                                activeLang === 'en'
                                  ? 'bg-primary text-primary-foreground shadow-xs'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                              )}
                            >
                              <span>EN</span>
                              {Boolean(resume.coverLetterEn) && <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />}
                            </button>
                          </div>
                        </div>

                        {currentLetterText && (
                          <button
                            type="button"
                            onClick={() => handleCopyCoverLetter(currentLetterText)}
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium cursor-pointer"
                          >
                            <Copy className="h-3 w-3" />
                            Kopyala
                          </button>
                        )}
                      </div>

                      {currentLetterText ? (
                        <p className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-3 hover:line-clamp-none transition-all">
                          {currentLetterText}
                        </p>
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-dashed border-border/60 text-xs text-muted-foreground">
                          <span className="text-[11px] flex items-center gap-1 italic">
                            {activeLang === 'tr' ? 'Türkçe ön yazı henüz oluşturulmamış' : 'İngilizce ön yazı henüz oluşturulmamış'}
                          </span>
                          <button
                            type="button"
                            onClick={() => openResumeModal(resume._id)}
                            className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                          >
                            + {activeLang === 'tr' ? 'Türkçe Oluştur' : 'İngilizce Oluştur'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Stats & Actions */}
              <div className="pt-3 border-t border-border/60 space-y-3">
                {/* Performance Stats Bar */}
                <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-lg text-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Başvuru</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{count}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Dönüş</div>
                    <div className="text-sm font-bold text-green-400 mt-0.5">{respondedCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Dönüş Oranı</div>
                    <div className="text-sm font-bold text-primary mt-0.5">
                      {responseRate > 0 ? `%${responseRate}` : '—'}
                    </div>
                  </div>
                </div>

                {/* Buttons Row */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    {cvUrl && (
                      <a
                        href={cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={resume.fileName || `${resume.name}.pdf`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted px-2.5 py-1.5 rounded-md transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                        CV&apos;yi İndir
                      </a>
                    )}
                    <button
                      onClick={() => openResumeModal(resume._id)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted px-2.5 py-1.5 rounded-md transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Düzenle
                    </button>
                  </div>

                  {count > 0 && (
                    <button
                      onClick={() => {
                        setResumeFilter(resume._id)
                        setView('list')
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Başvuruları Gör ({count}) →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
