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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResumeListProps {
  resumes: Resume[]
  applications: Application[]
}

export function ResumeList({ resumes, applications }: ResumeListProps) {
  const { openResumeModal, openModal, setResumeFilter, setView } = useUIStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const resumeStats = getResumeStats(applications, resumes)

  const categories = ['all', ...Array.from(new Set(resumes.map((r) => r.category)))]

  const filteredStats = selectedCategory === 'all'
    ? resumeStats
    : resumeStats.filter((s) => s.resume.category === selectedCategory)

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-card border border-dashed rounded-2xl p-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <FileText className="h-8 w-8" />
        </div>
        <div className="max-w-md">
          <h3 className="text-base font-bold text-foreground">Henüz CV Eklenmemiş</h3>
          <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
            Farklı pozisyonlar veya uzmanlıklar için hazırladığın CV&apos;lerini buraya ekle. Her başvuruda hangi CV&apos;yi kullandığını takip edebilir ve CV&apos;lerinin başarı oranını karşılaştırabilirsin.
          </p>
        </div>
        <Button onClick={() => openResumeModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          İlk CV&apos;ni Ekle
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border rounded-xl p-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            CV Havuzum ({resumes.length} Versiyon)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Başvurularında kullandığın farklı CV versiyonları, yüklenen dosyalar ve performansları
          </p>
        </div>

        <Button onClick={() => openResumeModal()} size="sm" className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Yeni CV Ekle
        </Button>
      </div>

      {/* Category Tabs */}
      {categories.length > 2 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap',
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {cat === 'all' ? 'Tüm Kategoriler' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Resume Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStats.map(({ resume, count, respondedCount, responseRate }) => {
          const cvUrl = safeUrl(resume.downloadUrl || resume.fileUrl)

          return (
            <div
              key={resume._id}
              className="bg-card border border-border rounded-xl p-5 space-y-4 hover:border-border/80 transition-all shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">{resume.name}</h3>
                      {resume.isDefault && (
                        <span className="bg-green-950/60 text-green-400 border border-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    {resume.targetRole && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {resume.targetRole}
                      </p>
                    )}
                  </div>

                  <span className="bg-muted text-muted-foreground text-[11px] font-medium px-2.5 py-1 rounded-md shrink-0">
                    {resume.category}
                  </span>
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
                        <p className="text-[10px] text-muted-foreground">
                          {resume.fileSize ? formatFileSize(resume.fileSize) : 'Yüklü Belge'}
                        </p>
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

                {/* Summary / Notes */}
                {resume.summary && (
                  <p className="text-xs text-muted-foreground/90 bg-muted/20 p-2.5 rounded-lg border border-border/40 leading-relaxed">
                    {resume.summary}
                  </p>
                )}

                {/* Skills Tags */}
                {resume.skills && resume.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resume.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
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
