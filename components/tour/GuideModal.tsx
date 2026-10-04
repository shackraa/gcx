'use client'

import { useState, useEffect } from 'react'
import { useTourStore } from '@/lib/store/tour'
import { useUIStore } from '@/lib/store/ui'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  Sparkles,
  FileText,
  Briefcase,
  LayoutList,
  BarChart2,
  HelpCircle,
  X,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  Send,
  Sliders,
  Copy,
  Download,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type GuideTab = 'quickstart' | 'resumes' | 'jobs' | 'applications' | 'analytics' | 'faq'

export function GuideModal() {
  const { isGuideModalOpen, closeGuideModal, startTour, resetTour } = useTourStore()
  const { setView } = useUIStore()
  const [activeTab, setActiveTab] = useState<GuideTab>('quickstart')

  // Close on Escape
  useEffect(() => {
    if (!isGuideModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeGuideModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isGuideModalOpen, closeGuideModal])

  if (!isGuideModalOpen) return null

  const tabs: { id: GuideTab; label: string; icon: React.ElementType }[] = [
    { id: 'quickstart', label: 'Hızlı Başlangıç', icon: Sparkles },
    { id: 'resumes', label: 'CV Havuzu & AI', icon: FileText },
    { id: 'jobs', label: 'İlan Radarı & Eşleşme', icon: Briefcase },
    { id: 'applications', label: 'Başvuru Takibi', icon: LayoutList },
    { id: 'analytics', label: 'Analiz & Başarı', icon: BarChart2 },
    { id: 'faq', label: 'İpuçları & SSS', icon: Lightbulb },
  ]

  function handleStartTour() {
    closeGuideModal()
    startTour(0)
  }

  function handleNavigateView(view: 'list' | 'resumes' | 'jobs' | 'analytics') {
    setView(view)
    closeGuideModal()
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={closeGuideModal}
    >
      <div
        className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                GCX Kullanım Rehberi & Kılavuz
              </h2>
              <p className="text-xs text-muted-foreground">
                Uygulamanın tüm özelliklerini keşfedin ve iş arama sürecinizi en verimli şekilde yönetin.
              </p>
            </div>
          </div>

          <button
            onClick={closeGuideModal}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-border/60 bg-muted/10 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: QUICKSTART */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    Hoş Geldiniz
                  </span>
                  <h3 className="text-lg font-extrabold text-foreground">
                    3 Kolay Adımda GCX ile İş Arama Sürecinizi Güçlendirin
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    GCX, başvurularınızı unutulmanızı engeller, farklı CV versiyonlarınızın hangisinin daha çok işe yaradığını gösterir ve yapay zekâ ile size zaman kazandırır.
                  </p>
                </div>
              </div>

              {/* 3 Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 font-bold flex items-center justify-center text-sm">
                      1
                    </div>
                    <h4 className="text-sm font-bold text-foreground">CV Versiyonlarınızı Ekleyin</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Frontend, Backend veya farklı uzmanlıklarınız için CV&apos;lerinizi yükleyin. Yapay zekâ yeteneklerinizi ve TR/EN ön yazılarınızı otomatik çıkarsın.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateView('resumes')}
                    className="text-xs gap-1 self-start"
                  >
                    <span>CV Havuzuna Git</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 font-bold flex items-center justify-center text-sm">
                      2
                    </div>
                    <h4 className="text-sm font-bold text-foreground">İlan Radarı ile Keşfedin</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      CV&apos;nize göre piyasadaki canlı ilanları tarayın, eşleşme skorunuzu (%0-100) görün ve eksik yeteneklerinizi öğrenerek başvurun.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateView('jobs')}
                    className="text-xs gap-1 self-start"
                  >
                    <span>İlan Radarına Git</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 font-bold flex items-center justify-center text-sm">
                      3
                    </div>
                    <h4 className="text-sm font-bold text-foreground">Başvuru & Takip Süreci</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Hangi CV ile başvurduğunuzu kaydedin. 14+ gün sessiz kalan başvurular için tek tıkla takip e-postası şablonu kopyalayın.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateView('list')}
                    className="text-xs gap-1 self-start"
                  >
                    <span>Başvurularıma Git</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESUMES */}
          {activeTab === 'resumes' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  CV Havuzu & Akıllı Ön Yazı (Cover Letter)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Farklı sektör ve roller için özelleştirilmiş CV versiyonlarınızı yönetin.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Sparkles className="h-4 w-4" />
                    <span>Yapay Zekâ ile PDF Ayrıştırma</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    CV PDF dosyanızı yüklediğinizde veya metnini yapıştırdığınızda yapay zekâ teknik yeteneklerinizi, hedef rolünüzü ve profesyonel özetinizi otomatik olarak ayrıştırır.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Copy className="h-4 w-4" />
                    <span>Türkçe & İngilizce Ön Yazı (Cover Letter)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Her CV için profesyonel Türkçe ve İngilizce ön yazılar üretilir. Başvuru yaparken tek tıkla panoya kopyalayabilir veya özelleştirebilirsiniz.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <BarChart2 className="h-4 w-4" />
                    <span>Hangi CV Daha Başarılı?</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Her CV versiyonunun kaç başvuru aldığını, kaç mülakat getirdiğini ve geri dönüş oranını (%) anlık olarak karşılaştırarak en güçlü CV versiyonunuzu keşfedebilirsiniz.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Download className="h-4 w-4" />
                    <span>Doğrudan İndirme & Bağlantı</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Yüklediğiniz PDF dosyalarını veya linklerini istediğiniz an tek tıkla indirebilir ve başvurularda kolayca kullanabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JOB RADAR */}
          {activeTab === 'jobs' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  İlan Radarı & Yapay Zekâ Eşleşme Analizi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Canlı web taraması ile CV&apos;nize en uygun iş ilanlarını keşfedin.
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                    1-Tıkla Canlı İlan Tarama (Scout)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Seçtiğiniz CV&apos;deki yetenekleri baz alarak web üzerindeki güncel iş ilanlarını otonom olarak tarar ve CV&apos;nizle eşleştirir.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
                    Eşleşme Skoru (%0 - %100) ve Eksik Yetenekler
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Yapay zekâ; ilanın gereksinimleriyle sizin CV&apos;nizi karşılaştırır. Eşleşen yeteneklerinizi (yeşil) ve ilanda istenen ancak CV&apos;nizde bulunmayan eksik yetenekleri (kırmızı) listeler.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
                    Tek Tıkla Başvuruya Dönüştürme
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Beğendiğiniz bir ilanı &quot;Başvuruya Ekle&quot; butonuyla doğrudan Başvuru Listenize aktarabilir ve takibini başlatabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <LayoutList className="h-4 w-4 text-primary" />
                  Başvuru & Süreç Yönetimi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Başvurularınızın hangi aşamada olduğunu kolayca yönetin.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    Süreç Aşamaları (Status)
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Hazırlanıyor:</strong> İlan bulundu, CV düzenleniyor.</li>
                    <li>• <strong>Beklemede:</strong> Başvuru yapıldı, yanıt bekleniyor.</li>
                    <li>• <strong>Dönüş Yapıldı:</strong> İK sizinle iletişime geçti.</li>
                    <li>• <strong>Mülakatta:</strong> Teknik veya İK mülakatı planlandı.</li>
                    <li>• <strong>Teklif:</strong> Tebrikler, teklif aldınız!</li>
                  </ul>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-red-400" />
                    Sessiz Başvuru & İK Takip Şablonu
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    14 günden uzun süredir haber alamadığınız başvurular için kart üzerindeki <strong>&quot;Şablonu Kopyala&quot;</strong> butonuna tıklayarak şirkete özel profesyonel hatırlatma e-postası metni alabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Analiz & İstatistikler
                </h3>
                <p className="text-xs text-muted-foreground">
                  Veriye dayalı kararlar alarak iş bulma sürenizi kısaltın.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <div className="text-sm font-bold text-primary">Geri Dönüş Oranı</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Yaptığınız başvurulardan yüzde kaçının size geri döndüğünü ölçün.</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <div className="text-sm font-bold text-green-500">CV Performansı</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Hangi CV tasarım veya uzmanlığınızın daha çok mülakat getirdiğini görün.</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg">
                    <div className="text-sm font-bold text-blue-500">Haftalık Trend</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Haftalık başvuru hızınızı ve hedef gerçekleşme yüzdenizi takip edin.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FAQ & TIPS */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                  Verilerim Güvende mi?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Evet! Verileriniz güvenli Convex bulut veritabanında saklanır. Ayrıca dilediğiniz zaman üst menüdeki <strong>Yedek İndir (JSON)</strong> butonuyla verilerinizin tam yedeğini bilgisayarınıza kaydedebilirsiniz.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Gemini API Anahtarımı Nasıl Kullanırım?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  İlan Radarı veya CV ayrıştırma ekranındaki API anahtarı alanına ücretsiz Google Gemini API anahtarınızı girdiğinizde, tarama ve analizler tamamen kişisel limitlerinizle yüksek hızda çalışır.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
                  Turu Sıfırlamak veya Tekrar İzlemek İstersem?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  İstediğiniz an aşağıdaki <strong>&quot;Turu Sıfırla ve Başlat&quot;</strong> butonuna veya üst menüdeki <strong>Rehber</strong> butonuna basarak rehberi tekrar izleyebilirsiniz.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={resetTour}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            Rehber turunu sıfırla ve baştan başlat
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={closeGuideModal}
              className="text-xs h-8"
            >
              Kapat
            </Button>
            <Button
              size="sm"
              onClick={handleStartTour}
              className="gap-1.5 text-xs font-semibold h-8"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Canlı Turu Başlat</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
