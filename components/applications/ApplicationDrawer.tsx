'use client'

import { useState } from 'react'
import type { Application } from '@/types'
import {
  STATUS_LABELS,
  CHANNEL_LABELS,
  daysSinceApplied,
  formatDate,
  generateFollowUpTemplate,
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
  Clock,
  Edit3,
  Trash2,
  Send,
  Users,
  Search,
  CheckCircle2,
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface ApplicationDrawerProps {
  app: Application
  overdueDays?: number
}

const STAGES: Array<Application['status']> = [
  'preparing',
  'waiting',
  'responded',
  'interview',
  'offer',
  'rejected',
]

type MessageType = 'followup' | 'interview' | 'networking'

export function ApplicationDrawer({ app, overdueDays = 14 }: ApplicationDrawerProps) {
  const { setInspectedId, openModal } = useUIStore()
  const { setStatus, patch, markFollowUpSent, remove } = useApplicationActions()
  const { toast } = useToast()

  const [messageType, setMessageType] = useState<MessageType>(
    app.status === 'interview' ? 'interview' : 'followup'
  )
  const [copied, setCopied] = useState(false)

  const overdue = isOverdue(app, overdueDays)
  const days = daysSinceApplied(app)
  const cvUrl = getDirectDownloadUrl(app.cvLink)
  const jobUrl = safeUrl(app.jobLink)

  // 1. Dinamik Hazır İK Mesajları
  function generateHRMessage(type: MessageType): string {
    const contactGreeting = app.contactName ? `Sayın ${app.contactName},` : 'Merhaba,'
    const role = app.position || 'ilgili pozisyon'
    const company = app.company || 'şirketiniz'

    if (type === 'interview') {
      return `${contactGreeting}\n\n${company} bünyesindeki ${role} pozisyonu için gerçekleştireceğimiz mülakat öncesinde iletişim kurmak istedim. Belirlenen tarih ve saatte görüşmeye katılmaktan memnuniyet duyacağım. Görüşme öncesinde incelememi önerdiğiniz ek bir detay veya hazırlamam gereken bir materyal varsa iletebilirseniz sevinirim.\n\nVaktiniz ve ilginiz için teşekkür ederim.\n\nİyi çalışmalar.`
    }

    if (type === 'networking') {
      return `${contactGreeting}\n\n${company} bünyesinde ${role} alanında yürüttüğünüz çalışmaları yakından takip ediyorum. Modern yaklaşımlarınız ve projeleriniz oldukça ilham verici. Bu alandaki deneyimlerim ve şirketinizin hedefleri doğrultusunda ekibinize nasıl katkı sağlayabileceğim üzerine kısa bir tanışma sohbeti gerçekleştirmeyi çok isterim.\n\nDeğerli vaktiniz için teşekkür eder, iyi günler dilerim.`
    }

    // Default: Follow-up / Takip
    if (app.appliedAt) {
      return `${contactGreeting}\n\n${company} bünyesindeki ${role} pozisyonu için ${formatDate(app.appliedAt)} tarihinde gerçekleştirdiğim başvurumun güncel durumu hakkında bilgi almak amacıyla iletişime geçmek istedim. Rol ve ekibinizin hedefleri beni oldukça heyecanlandırıyor. Sürecin ilerleyişi hakkında kısa bir güncelleme paylaşabilirseniz çok sevinirim.\n\nDeğerli vaktiniz ve ilginiz için teşekkür ederim.\n\nSaygılarımla.`
    }

    return generateFollowUpTemplate(app)
  }

  const currentMessage = generateHRMessage(messageType)

  async function handleCopyMessage() {
    await navigator.clipboard.writeText(currentMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'İK Mesajı Panoya Kopyalandı' })
    if (messageType === 'followup') {
      await markFollowUpSent(app)
    }
  }

  // 2. Şirketin İK ve İşe Alım Yöneticileri LinkedIn Linki (jev-radar bot mantığı)
  const encodedCompany = encodeURIComponent(app.company || '')
  const linkedinHRSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedCompany}%20(HR%20OR%20"Human%20Resources"%20OR%20Recruiter%20OR%20"Talent%20Acquisition"%20OR%20"İnsan%20Kaynakları")&origin=GLOBAL_SEARCH_HEADER`
  const linkedinHiringManagerUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedCompany}%20("${app.position || 'Engineering'}"%20OR%20Manager%20OR%20Lead)&origin=GLOBAL_SEARCH_HEADER`

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

      {/* 1. Şirketin İK ve Yetkililerini Bul (İlan Radarı / jev Botu Mantığı) */}
      <div className="p-3 bg-muted/30 border border-border/70 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            {app.company} İK & İşe Alım Ekibi
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">İlan Radarı Botu</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Bu şirketteki İK uzmanlarını, yetenek yöneticilerini veya hiring manager&apos;ları doğrudan LinkedIn&apos;de listele:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          <a
            href={linkedinHRSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border border-border text-xs font-medium text-foreground hover:bg-muted hover:border-border/80 transition-colors"
          >
            <Search className="h-3 w-3 text-primary" />
            <span>İK & Recruiter Ara</span>
            <ExternalLink className="h-3 w-3 opacity-60 ml-auto" />
          </a>
          <a
            href={linkedinHiringManagerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-background border border-border text-xs font-medium text-foreground hover:bg-muted hover:border-border/80 transition-colors"
          >
            <Users className="h-3 w-3 text-primary" />
            <span>Yönetici / Lead Ara</span>
            <ExternalLink className="h-3 w-3 opacity-60 ml-auto" />
          </a>
        </div>
      </div>

      {/* 2. İK'ya Yazabileceğin Hazır Mesaj (Hızlı Not yerine) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5 text-primary" />
            İK&apos;ya Yazabileceğin Mesaj
          </label>

          {/* Mesaj Tipi Seçici */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md border border-border/60">
            <button
              type="button"
              onClick={() => setMessageType('followup')}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer',
                messageType === 'followup'
                  ? 'bg-background text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Durum Takibi
            </button>
            <button
              type="button"
              onClick={() => setMessageType('interview')}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer',
                messageType === 'interview'
                  ? 'bg-background text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Mülakat Öncesi
            </button>
            <button
              type="button"
              onClick={() => setMessageType('networking')}
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer',
                messageType === 'networking'
                  ? 'bg-background text-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Tanışma / Outreach
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={5}
            readOnly
            value={currentMessage}
            className="w-full text-xs p-3 rounded-lg bg-muted/40 border border-border focus:outline-none font-sans leading-relaxed resize-none text-foreground select-all"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {app.followUpSentAt ? `Son gönderim: ${app.followUpSentAt}` : 'Tek tıkla kopyala ve LinkedIn/Mail ile ilet'}
          </span>
          <Button
            size="sm"
            onClick={handleCopyMessage}
            className="h-7 text-xs px-3 gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Kopyalandı!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Mesajı Kopyala</span>
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
