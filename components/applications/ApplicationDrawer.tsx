'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUIStore } from '@/lib/store/ui'
import { useApplicationActions } from '@/lib/hooks/useApplicationActions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  X,
  ExternalLink,
  Edit3,
  Trash2,
  Users,
  Copy,
  CheckCircle2,
  FileText,
  Send,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { LinkedinIcon } from '@/components/ui/icons'
import {
  STATUS_LABELS,
  CHANNEL_LABELS,
  daysSinceApplied,
  formatDate,
  isOverdue,
  getDirectDownloadUrl,
  safeUrl,
} from '@/lib/utils/applications'
import type { Application } from '@/types'
import { cn } from '@/lib/utils'

interface ApplicationDrawerProps {
  app: Application
  overdueDays?: number
}

export interface TargetPerson {
  id: 'recruiter' | 'manager' | 'executive'
  roleType: string
  title: string
  searchQuery: string
  linkedinUrl: string
  customDraft: string
}

const STAGES: Array<Application['status']> = [
  'preparing',
  'waiting',
  'responded',
  'interview',
  'offer',
  'rejected',
]

export function ApplicationDrawer({ app, overdueDays = 14 }: ApplicationDrawerProps) {
  const { setInspectedId, openModal } = useUIStore()
  const { setStatus, markFollowUpSent, remove } = useApplicationActions()
  const { toast } = useToast()

  const [targets, setTargets] = useState<TargetPerson[]>([
    {
      id: 'recruiter',
      roleType: 'İşe Alım Uzmanı',
      title: 'Technical Recruiter / Talent Acquisition',
      searchQuery: `"${app.company}" ("Technical Recruiter" OR "Talent Acquisition Specialist" OR "İşe Alım Uzmanı")`,
      linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${app.company}" ("Technical Recruiter" OR "Talent Acquisition Specialist" OR "İşe Alım Uzmanı")`)}&origin=GLOBAL_SEARCH_HEADER`,
      customDraft: `Merhaba,\n\n${app.company} bünyesindeki ${app.position || 'ilgili'} pozisyonuna gerçekleştirdiğim başvurumla ilgili kısa bir merhaba demek istedim. Özgeçmişimin pozisyon gereksinimleriyle güçlü bir uyum yakaladığını düşünüyorum. Değerlendirme sürecinin güncel durumu hakkında kısa bir bilgi paylaşabilirseniz çok sevinirim.\n\nİlginiz ve vaktiniz için teşekkür ederim.`,
    },
    {
      id: 'manager',
      roleType: 'İşe Alım Müdürü',
      title: 'Talent Acquisition Lead / Manager',
      searchQuery: `"${app.company}" ("Talent Acquisition Manager" OR "Talent Acquisition Lead" OR "İşe Alım Müdürü")`,
      linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${app.company}" ("Talent Acquisition Manager" OR "Talent Acquisition Lead" OR "İşe Alım Müdürü")`)}&origin=GLOBAL_SEARCH_HEADER`,
      customDraft: `Merhaba,\n\n${app.company} bünyesinde ekibinizin yürüttüğü başarılı çalışmaları yakından takip ediyorum. ${app.position || 'ilgili'} rolü için başvurumu ilettim. Ekibinizin hedeflerine değer katabileceğim noktaları konuşmaktan memnuniyet duyarım.\n\nİyi çalışmalar dilerim.`,
    },
    {
      id: 'executive',
      roleType: 'İK Direktörü',
      title: 'Head of HR / İK Direktörü',
      searchQuery: `"${app.company}" ("Head of HR" OR "HR Director" OR "İnsan Kaynakları Direktörü" OR "Head of People")`,
      linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${app.company}" ("Head of HR" OR "HR Director" OR "İnsan Kaynakları Direktörü" OR "Head of People")`)}&origin=GLOBAL_SEARCH_HEADER`,
      customDraft: `Sayın Yetkili,\n\n${app.company} şirket kültürünü ve sektördeki büyümesini takdirle takip ediyorum. ${app.position || 'ilgili'} rolü için başvurumu ilettim. Şirketinizin vizyonuna katkı sağlamak ve ekibin bir parçası olmak beni heyecanlandırıyor. Vaktiniz için teşekkür eder, iyi çalışmalar dilerim.`,
    },
  ])

  const [selectedTargetId, setSelectedTargetId] = useState<'recruiter' | 'manager' | 'executive'>('recruiter')
  const [draftMessage, setDraftMessage] = useState(targets[0].customDraft)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [copied, setCopied] = useState(false)

  const overdue = isOverdue(app, overdueDays)
  const days = daysSinceApplied(app)
  const cvUrl = getDirectDownloadUrl(app.cvLink)
  const jobUrl = safeUrl(app.jobLink)

  // Seçili hedef yetkili
  const activeTarget = targets.find((t) => t.id === selectedTargetId) || targets[0]

  function handleSelectTarget(targetId: 'recruiter' | 'manager' | 'executive') {
    setSelectedTargetId(targetId)
    const t = targets.find((item) => item.id === targetId)
    if (t) {
      setDraftMessage(t.customDraft)
    }
  }

  // Gemini ile şirket İK yetkililerini ve mesajları tam nokta atışı belirle
  useEffect(() => {
    let isMounted = true
    async function loadAITargets() {
      setIsLoadingAI(true)
      try {
        const res = await fetch('/api/ai/find-recruiter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: app.company,
            position: app.position,
            contactName: app.contactName,
          }),
        })
        const data = await res.json()
        if (isMounted && data.success && Array.isArray(data.targets) && data.targets.length > 0) {
          setTargets(data.targets)
          const current = data.targets.find((t: TargetPerson) => t.id === selectedTargetId) || data.targets[0]
          setDraftMessage(current.customDraft)
        }
      } catch {
        // Fallback varsayılanlar hazır
      } finally {
        if (isMounted) setIsLoadingAI(false)
      }
    }

    loadAITargets()
    return () => {
      isMounted = false
    }
  }, [app.company, app.position, app.contactName])

  async function handleCopyOnly() {
    await navigator.clipboard.writeText(draftMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
    toast({
      title: 'Taslak Mesaj Kopyalandı ✓',
      description: 'Mesaj panoya alındı, istediğiniz yere yapıştırabilirsiniz.',
    })
  }

  async function handleCopyAndGo() {
    await navigator.clipboard.writeText(draftMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 6000)
    toast({
      title: 'Taslak Kopyalandı & LinkedIn Açıldı ✓',
      description: `${activeTarget.roleType} arama sayfası açıldı. Yetkilinin 'Mesaj' butonuna tıklayıp sadece Ctrl+V ile yapıştırın ve gönderin.`,
    })
    await markFollowUpSent(app)
    window.open(activeTarget.linkedinUrl, '_blank')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground truncate">{app.company}</h3>
            {overdue && (
              <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                Sessiz
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{app.position}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openModal(app._id)}
            className="h-7 px-2 text-xs gap-1"
          >
            <Edit3 className="h-3 w-3" />
            <span>Düzenle</span>
          </Button>
          <button
            type="button"
            onClick={() => setInspectedId(null)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            title="Kapat (ESC)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stage Progression Buttons */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Süreç Aşaması
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {STAGES.map((s) => {
            const active = app.status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(app, s)}
                className={cn(
                  'px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer border text-center',
                  active
                    ? 'bg-foreground text-background border-foreground shadow-2xs'
                    : 'bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Metadata */}
      <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/30 rounded-lg text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">
            Başvuru Tarihi
          </span>
          <span className="font-semibold text-foreground">
            {formatDate(app.appliedAt) || 'Belirtilmedi'}
            {days !== null && <span className="text-muted-foreground font-normal"> ({days}g önce)</span>}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase block font-medium">
            Kanal & İK
          </span>
          <span className="font-semibold text-foreground">
            {(app.channel && CHANNEL_LABELS[app.channel]) || 'Online'}
            {app.hrContacted ? ' · ✓ İK Yazıldı' : ''}
          </span>
        </div>
      </div>

      {/* External Links */}
      <div className="flex flex-wrap items-center gap-2">
        {jobUrl && (
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>İlan Linkini Aç</span>
          </a>
        )}
        {cvUrl && (
          <a
            href={cvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span>CV Belgesini Aç</span>
          </a>
        )}
      </div>

      {/* İK YETKİLİLERİ SIRALAMASI (SADE, MİNİMAL, TAK TAK TAK) */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>{app.company} İK Yetkilileri</span>
          </label>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            {isLoadingAI ? 'İK Taranıyor...' : 'Hazır'}
          </span>
        </div>

        {/* Minimalist 3 Satır Liste */}
        <div className="space-y-1.5">
          {targets.map((t) => {
            const isSelected = selectedTargetId === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTarget(t.id)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2',
                  isSelected
                    ? 'border-primary bg-primary/5 text-foreground font-semibold shadow-2xs'
                    : 'border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40'
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={cn(
                      'w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] shrink-0',
                      isSelected ? 'border-primary bg-primary text-white font-bold' : 'border-border/80'
                    )}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                  <span className="text-xs text-foreground font-semibold shrink-0">
                    {t.roleType}
                  </span>
                  <span className="text-muted-foreground/40 text-xs hidden sm:inline">•</span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {t.title}
                  </span>
                </div>

                <span className="text-[10px] text-muted-foreground/70 shrink-0">
                  {isSelected ? 'Seçildi' : 'Seç'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* SEÇİLİ İK'YA ÖZEL TASLAK MESAJ */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5 text-primary" />
            <span>{activeTarget.roleType} İçin Hazırlanan Mesaj</span>
          </label>
          <span className="text-[10px] text-muted-foreground">Düzenleyebilirsin</span>
        </div>

        <textarea
          rows={5}
          value={draftMessage}
          onChange={(e) => setDraftMessage(e.target.value)}
          placeholder="İK taslak mesajı burada hazır..."
          className="w-full text-xs p-3 rounded-lg bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none text-foreground font-sans"
        />

        {/* Kopyalandı Bilgi Çubuğu */}
        {copied && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>
              <strong>Mesaj panoya kopyalandı!</strong> Açılan LinkedIn sekmesinde yetkilinin <strong>&apos;Mesaj&apos;</strong> butonuna tıklayıp <code>Ctrl + V</code> yapın ve onaylayın.
            </span>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open('https://www.linkedin.com/messaging/', '_blank')}
            className="h-8 text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            title="LinkedIn sağ alttaki mesajlaşma panelini açar"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#0A66C2]" />
            <span>LinkedIn Mesajlarımı Aç</span>
          </Button>

          <div className="flex items-center gap-1.5 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyOnly}
              className="h-8 text-xs px-2.5 gap-1 cursor-pointer"
              title="Sadece mesajı panoya kopyala"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Kopyala</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopyAndGo}
              className="h-8 text-xs px-3.5 gap-2 font-bold cursor-pointer bg-[#0A66C2] hover:bg-[#004182] text-white shadow-xs shrink-0"
            >
              <LinkedinIcon className="h-3.5 w-3.5" />
              <span>Yetkiliyi Bul & Mesajı Kopyala</span>
              <ExternalLink className="h-3 w-3 opacity-80" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Action */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-end text-xs">
        <button
          type="button"
          onClick={() => {
            setInspectedId(null)
            void remove(app)
          }}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3 w-3" />
          <span>Başvuruyu Sil</span>
        </button>
      </div>
    </motion.div>
  )
}
