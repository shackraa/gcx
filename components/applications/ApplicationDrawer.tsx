'use client'

import { useState, useEffect } from 'react'
import type { Application } from '@/types'
import {
  STATUS_LABELS,
  CHANNEL_LABELS,
  daysSinceApplied,
  formatDate,
  safeUrl,
  getDirectDownloadUrl,
  isOverdue,
} from '@/lib/utils/applications'
import { useApplicationActions } from '@/lib/hooks/useApplicationActions'
import { useUIStore } from '@/lib/store/ui'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  X,
  ExternalLink,
  FileText,
  Copy,
  Edit3,
  Trash2,
  Send,
  Users,
  Search,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Briefcase,
  ShieldAlert,
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface ApplicationDrawerProps {
  app: Application
  overdueDays?: number
}

interface TargetPerson {
  id: 'recruiter' | 'manager' | 'executive'
  roleType: string
  title: string
  explanation: string
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
      roleType: 'İşe Alım Yetkilisi',
      title: 'Talent Acquisition & Technical Recruiter',
      explanation: `${app.company} bünyesinde ilk CV elemesini ve mülakat planlamasını yapan uzman.`,
      searchQuery: `"${app.company}" ("Technical Recruiter" OR "Talent Acquisition")`,
      linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${app.company}" ("Technical Recruiter" OR "Talent Acquisition")`)}&origin=GLOBAL_SEARCH_HEADER`,
      customDraft: `Merhaba,\n\n${app.company} bünyesindeki ${app.position || 'ilgili'} pozisyonuna gerçekleştirdiğim başvurumla ilgili kısa bir merhaba demek istedim. Özgeçmişimin rol gereksinimleriyle güçlü bir uyum yakaladığını düşünüyorum. Değerlendirme sürecinin güncel durumu hakkında kısa bir bilgi paylaşabilirseniz çok sevinirim.\n\nİlginiz ve vaktiniz için teşekkür ederim.`,
    },
    {
      id: 'manager',
      roleType: 'Departman / Hiring Manager',
      title: `${app.position || 'Ekip'} Lideri / Engineering Manager`,
      explanation: `Doğrudan ekibin lideri; teknik yetkinlik ve takım uyumuna karar veren yönetici.`,
      searchQuery: `"${app.company}" ("${app.position || 'Manager'}" OR "Team Lead")`,
      linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${app.company}" ("${app.position || 'Engineering'}" OR "Team Lead")`)}&origin=GLOBAL_SEARCH_HEADER`,
      customDraft: `Merhaba,\n\n${app.company} bünyesinde ekibinizin yürüttüğü çalışmaları yakından takip ediyorum. ${app.position || 'ilgili'} pozisyonu için başvurumu tamamladım. Ekibinizin hedeflerine ve projelerine değer katabileceğim noktaları konuşmaktan memnuniyet duyarım.\n\nİyi çalışmalar dilerim.`,
    },
    {
      id: 'executive',
      roleType: 'İK Direktörü / Üst Düzey',
      title: 'Head of People / VP of HR',
      explanation: `Şirket içi insan kaynakları stratejisini ve nihai teklif süreçlerini yöneten üst düzey lider.`,
      searchQuery: `"${app.company}" ("Head of People" OR "HR Director")`,
      linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${app.company}" ("Head of People" OR "HR Director")`)}&origin=GLOBAL_SEARCH_HEADER`,
      customDraft: `Sayın Yetkili,\n\n${app.company} şirket kültürünü ve sektördeki büyümesini takdirle izliyorum. ${app.position || 'ilgili'} rolü için başvurumu ilettim. Şirketinizin vizyonuna katkı sağlamak ve ekibin bir parçası olmak beni heyecanlandırıyor. Vaktiniz için teşekkür eder, iyi günler dilerim.`,
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

  // Yetkili sekmesi değişince taslak mesajı anında onun mesajına geçir
  function handleSelectTarget(targetId: 'recruiter' | 'manager' | 'executive') {
    setSelectedTargetId(targetId)
    const t = targets.find((item) => item.id === targetId)
    if (t) {
      setDraftMessage(t.customDraft)
    }
  }

  // Gemini ile 3 hedefi ve mesajı tam nokta atışı kişiselleştir
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
        // Fallback varsayılanlar zaten hazır
      } finally {
        if (isMounted) setIsLoadingAI(false)
      }
    }

    loadAITargets()
    return () => {
      isMounted = false
    }
  }, [app.company, app.position, app.contactName])

  async function handleCopyAndGo() {
    await navigator.clipboard.writeText(draftMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
    toast({
      title: 'Taslak Mesaj Kopyalandı ✓',
      description: `${activeTarget.roleType} için LinkedIn arama sayfası açılıyor. Mesajı yapıştırıp gönderebilirsin.`,
    })
    await markFollowUpSent(app)
    // Doğrudan o yetkili grubunun LinkedIn arama ekranını aç
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
      <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg text-xs">
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

      {/* 3 YETKİLİ SEÇİM LİSTESİ (RECRUITER, MANAGER, EXECUTIVE) */}
      <div className="space-y-2 pt-1 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            {app.company} Yetkili Listesi (3 Hedef)
          </label>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            {isLoadingAI ? 'Gemini Analiz Ediyor...' : 'Kişiselleştirildi'}
          </span>
        </div>

        {/* 3 Yetkili Kartı */}
        <div className="grid grid-cols-1 gap-2">
          {targets.map((t) => {
            const isSelected = selectedTargetId === t.id
            return (
              <div
                key={t.id}
                onClick={() => handleSelectTarget(t.id)}
                className={cn(
                  'p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-start justify-between gap-2',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                    : 'border-border/80 bg-muted/20 hover:border-border hover:bg-muted/40'
                )}
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {t.roleType}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">{t.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1">
                    {t.explanation}
                  </p>
                </div>

                <div className="shrink-0 mt-0.5">
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center text-[10px]',
                      isSelected ? 'border-primary bg-primary text-white' : 'border-border'
                    )}
                  >
                    {isSelected ? '✓' : ''}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SEÇİLİ YETKİLİYE ÖZEL HAZIR TASLAK MESAJ */}
      <div className="space-y-2 pt-1 border-t border-border/60">
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
          className="w-full text-xs p-3 rounded-lg bg-muted/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none text-foreground font-sans"
        />

        {/* Tek Tıkla Kopyala & LinkedIn'e Git Butonu */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-muted-foreground truncate">
            {app.followUpSentAt ? `Son gönderim: ${app.followUpSentAt}` : 'Mesaj panoya kopyalanıp yetkili aranır'}
          </span>

          <Button
            size="sm"
            onClick={handleCopyAndGo}
            className="h-8 text-xs px-3 gap-1.5 font-semibold cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Mesajı Al & LinkedIn&apos;de Ara</span>
                <ExternalLink className="h-3 w-3 opacity-75" />
              </>
            )}
          </Button>
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
