'use client'

import { useState, useEffect } from 'react'
import type { Application } from '@/types'
import { isOverdue, getUpcomingInterviews, getThisWeekApps } from '@/lib/utils/applications'
import { useUIStore } from '@/lib/store/ui'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useToast } from '@/hooks/use-toast'
import { Clock, Calendar, Target, RefreshCw } from 'lucide-react'
import { GmailIcon } from '@/components/ui/icons'
import { differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface TodayExecutiveBarProps {
  applications: Application[]
  overdueDays?: number
  weeklyGoal?: number
}

export function TodayExecutiveBar({
  applications,
  overdueDays = 14,
  weeklyGoal = 5,
}: TodayExecutiveBarProps) {
  const { setFilter, setView } = useUIStore()
  const { toast } = useToast()
  const settings = useQuery(api.settings.get)
  const upsertSettings = useMutation(api.settings.upsert)

  const overdueApps = applications.filter((a) => isOverdue(a, overdueDays))
  const upcomingInterviews = getUpcomingInterviews(applications)
  const thisWeekApps = getThisWeekApps(applications)

  const lastScan = settings?.lastEmailScanAt
  const daysSinceScan = lastScan ? differenceInDays(new Date(), new Date(lastScan)) : null

  function formatScanText(): string {
    if (!lastScan) return 'Henüz taranmadı'
    if (daysSinceScan === 0) return 'Bugün'
    if (daysSinceScan === 1) return 'Dün'
    if (daysSinceScan! < 7) return `${daysSinceScan} gün önce`
    const weeks = Math.floor(daysSinceScan! / 7)
    return `${weeks} hafta önce`
  }

  const [isScanning, setIsScanning] = useState(false)
  const [isGmailConnected, setIsGmailConnected] = useState(false)
  const isGmailActive = Boolean(isGmailConnected || (settings as any)?.isGmailConnected)

  // Gmail bağlantı durumunu sorgula
  useEffect(() => {
    fetch('/api/gmail/status')
      .then((res) => res.json())
      .then((data) => {
        if (data?.connected) {
          setIsGmailConnected(true)
          void upsertSettings({ isGmailConnected: true })
        }
      })
      .catch(() => {})
  }, [])

  // URL'den dönen OAuth sonucunu yakala
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('gmail_connected') === 'true') {
      setIsGmailConnected(true)
      void upsertSettings({ isGmailConnected: true, lastEmailScanAt: Date.now() })
      toast({
        title: 'Gmail Başarıyla Bağlandı! ✓',
        description: 'Google hesabınız bağlandı. Gelen iş mailleriniz Gemini ile taranıyor...',
      })
      window.history.replaceState({}, '', window.location.pathname)
      // İlk taramayı otomatik başlat
      void handleScanJobEmails()
    } else if (params.get('gmail_error')) {
      toast({
        title: 'Gmail Bağlantısı Kurulamadı',
        description: 'Google izin sürecinde bir sorun oluştu veya onay verilmedi.',
        variant: 'destructive',
      })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  function handleConnectGmail() {
    toast({
      title: 'Gmail Bağlanıyor...',
      description: 'İş başvurularınızı otonom takip etmek için Google izin ekranı açılıyor.',
    })
    window.location.href = '/api/gmail/connect'
  }

  async function handleScanJobEmails() {
    setIsScanning(true)
    try {
      const res = await fetch('/api/gmail/scan', { method: 'POST' })
      const data = await res.json()

      if (res.status === 401 || !data.connected) {
        setIsGmailConnected(false)
        handleConnectGmail()
        return
      }

      setIsGmailConnected(true)
      await upsertSettings({ lastEmailScanAt: Date.now(), isGmailConnected: true })

      if (data.results && data.results.length > 0) {
        toast({
          title: `E-postalar Tarandı (${data.updatesFound} İş Maili Bulundu) ✓`,
          description: data.results
            .map((r: any) => `${r.company}: ${r.detectedStatus}`)
            .slice(0, 3)
            .join(' • '),
        })
      } else {
        toast({
          title: 'E-postalar Güncel ✓',
          description: 'Gelen kutunuzda yeni bir mülakat veya başvuru güncellemesi bulunmadı.',
        })
      }
    } catch {
      toast({ title: 'E-posta taraması sırasında bağlantı hatası oluştu', variant: 'destructive' })
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="bg-muted/40 border border-border/70 rounded-xl p-3 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground font-medium shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span className="text-foreground font-semibold">Bugünün Odak Noktaları:</span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Sessiz başvurular */}
        {overdueApps.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setFilter('overdue')
              setView('list')
            }}
            className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:underline font-semibold cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{overdueApps.length} başvuru sessiz (14g+)</span>
          </button>
        ) : (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 opacity-60" />
            <span>Sessiz bekleyen yok</span>
          </span>
        )}

        <span className="text-muted-foreground/30 hidden sm:inline">•</span>

        {/* Yaklaşan mülakatlar */}
        {upcomingInterviews.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setFilter('interview')
              setView('list')
            }}
            className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>{upcomingInterviews.length} mülakat bu hafta</span>
          </button>
        ) : (
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 opacity-60" />
            <span>Yakın mülakat yok</span>
          </span>
        )}

        <span className="text-muted-foreground/30 hidden sm:inline">•</span>

        {/* Haftalık tempo */}
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Target className="h-3.5 w-3.5 text-primary" />
          <span>
            Haftalık tempo:{' '}
            <strong className="text-foreground font-semibold">
              {thisWeekApps.length} / {weeklyGoal}
            </strong>
          </span>
        </span>

        {/* Gmail Senkronizasyonu & Eşitleme (Aktif ve Canlı Buton) */}
        <div className="flex items-center gap-1.5 pl-1 md:border-l md:border-border/60">
          {isGmailActive ? (
            <div className="inline-flex items-center gap-2 bg-background/80 border border-border/80 px-2.5 py-1 rounded-lg shadow-2xs">
              <GmailIcon className="h-4 w-4 shrink-0" />
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-foreground">Gmail Eşitlendi</span>
                <span className="text-[10px] text-muted-foreground">({formatScanText()})</span>
              </div>
              <button
                type="button"
                onClick={handleScanJobEmails}
                disabled={isScanning}
                title="Gmail gelen kutusunu şimdi tara"
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isScanning && 'animate-spin text-primary')} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleConnectGmail}
              disabled={isScanning}
              title="Gmail hesabınızı bağlayarak mülakat davetlerini ve ret bildirimlerini otonom takip edin"
              className="inline-flex items-center gap-2 bg-background border border-border/80 hover:border-foreground/30 px-3 py-1 rounded-lg text-xs font-semibold text-foreground hover:bg-muted/50 transition-all shadow-2xs cursor-pointer group"
            >
              <GmailIcon className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Gmail Eşitle</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">
                Bağla
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
