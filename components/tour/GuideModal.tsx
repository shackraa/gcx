'use client'

import { useState, useEffect } from 'react'
import { useTourStore } from '@/lib/store/tour'
import { useUIStore } from '@/lib/store/ui'
import { Button } from '@/components/ui/button'
import type { ViewMode } from '@/types'
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
  Clock,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
  Send,
  Copy,
  Download,
  GraduationCap,
  Brain,
  Award,
  Coins,
  Target,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type GuideTab =
  | 'quickstart'
  | 'studio'
  | 'programs'
  | 'jobs'
  | 'resumes'
  | 'applications'
  | 'analytics'
  | 'faq'

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
    { id: 'studio', label: 'CV Stüdyosu & Hafıza', icon: Brain },
    { id: 'programs', label: 'Staj, Burs & Kurumsal', icon: GraduationCap },
    { id: 'jobs', label: 'İlan Radarı & Filtreler', icon: Briefcase },
    { id: 'resumes', label: 'CV Havuzum', icon: FileText },
    { id: 'applications', label: 'Başvuru Takibi', icon: LayoutList },
    { id: 'analytics', label: 'Kariyer Pusulası (Analiz)', icon: BarChart2 },
    { id: 'faq', label: 'İpuçları & SSS', icon: Lightbulb },
  ]

  function handleStartTour() {
    closeGuideModal()
    startTour(0)
  }

  function handleNavigateView(view: ViewMode) {
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
        className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
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
                Kariyer Hafızası, Harvard CV Stüdyosu, Staj/Burs/Fellowship Vitrini ve İlan Radarı kullanım kılavuzu.
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
                    4 Adımda GCX ile Kariyer, Staj ve Başvuru Sürecinizi Yönetin
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
                    GCX; geçmiş tüm belgelerinizi hafızasında tutarak saniyeler içinde ilana özel Harvard CV üretir, Youthall & Microfon.co gibi platformlardan staj/burs/fellowship fırsatlarını toplar ve başvurularınızın dönüşümünü analiz eder.
                  </p>
                </div>
              </div>

              {/* 4 Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center text-sm">
                      1
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      CV Stüdyosu & Kariyer Hafızası
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Eski CV&apos;lerinizi, motivasyon mektuplarınızı ve fellowship başvurularınızı kaynak dosyası gibi sürükleyip bırakın. Herhangi bir LinkedIn ilan linkini yapıştırarak o ilana özel <strong>Harvard, Jake&apos;s veya McKinsey</strong> şablonunda CV ve motivasyon mektubu üretin.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateView('studio')}
                    className="text-xs gap-1 self-start"
                  >
                    <span>CV Stüdyosuna Git</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 font-bold flex items-center justify-center text-sm">
                      2
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      Staj, Fellowship, Burs & Kurumsal Vitrini
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Youthall</strong>, <strong>Microfon.co</strong>, <strong>anbean Kampüs</strong>, <strong>Techcareer.net</strong>, <strong>Toptalent.co</strong> ve <strong>Üniversite Kariyer Merkezleri</strong> üzerindeki güncel staj, MT, fellowship, eğitim bursu ve bootcamp ilanlarını afişleriyle keşfedin.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateView('programs')}
                    className="text-xs gap-1 self-start"
                  >
                    <span>Staj & Kurumsal Vitrine Git</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 font-bold flex items-center justify-center text-sm">
                      3
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      İlan Radarı (Kesin Stajyer & Tecrübe Filtreli)
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      İlanların sadece başlığına değil <strong>tam açıklamasına</strong> bakan akıllı radar! Stajyer/Part-Time seçtiğinizde 5+ yıl tecrübe isteyen veya başvurusu kapanmış ilanları otomatik eler.
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
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold flex items-center justify-center text-sm">
                      4
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      Kanban Takibi & Akıllı Kariyer Pusulası
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Başvurularınızı sürükle-bırak Kanban panosunda yönetin. Yenilenen <strong>Analiz</strong> sekmesinde 4 adımlı Dönüşüm Huninizi, Kariyer Momentum Skorunuzu ve İK iletişim etkisini inceleyin.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateView('analytics')}
                    className="text-xs gap-1 self-start"
                  >
                    <span>Kariyer Pusulasına Git</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CV STUDIO & CAREER MEMORY */}
          {activeTab === 'studio' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    Kariyer Hafızası & Harvard CV Stüdyosu
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Tüm geçmiş belgelerinizi bir kez yükleyin; her ilana özel en iyi bilgileri seçen akıllı CV üreticiyi kullanın.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleNavigateView('studio')}
                  className="text-xs gap-1.5 self-start"
                >
                  <span>CV Stüdyosunu Aç</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Sparkles className="h-4 w-4" />
                    <span>1. Tak-Tak-Tak Kaynak Belge Kasası (Kariyer Hafızası)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Şimdiye kadar yazdığınız tüm <strong>motivasyon mektuplarını</strong>, <strong>fellowship başvurularını</strong>, <strong>eski CV&apos;lerinizi</strong>, proje notlarınızı ve sertifikalarınızı sürükleyip bırakın. Sistem her belgeyi ayrıştırıp kalıcı Kariyer Hafızanıza kaydeder.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Target className="h-4 w-4" />
                    <span>2. LinkedIn İlanından Otomatik Terzi (Tailoring)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Başvurmak istediğiniz ilanın linkini veya metnini yapıştırın. Yapay zekâ, hafızanızdaki tüm belgeleri tarayarak <strong>o ilanla en çok örtüşen projelerinizi, deneyimlerinizi ve başarılarınızı</strong> seçip öne çıkarır.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <FileText className="h-4 w-4" />
                    <span>3. Harvard, Jake&apos;s, McKinsey & Akademik Şablonlar</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dünyanın en yüksek ATS geçiş oranına sahip <strong>Harvard Kariyer Merkezi</strong>, <strong>Jake&apos;s Resume (Yazılım/Teknoloji)</strong>, <strong>McKinsey Executive</strong> ve <strong>Akademik CV</strong> şablonları arasında anında geçiş yapın ve kusursuz A4 PDF çıktısı alın.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Award className="h-4 w-4" />
                    <span>4. Özel Motivasyon Mektubu & Fellowship Cevapları</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Üretilen her CV ile birlikte o şirkete özel <strong>Motivasyon Mektubu (Cover Letter)</strong> ve başvurularınızda sıkça sorulan <strong>Fellowship Mülakat / Başvuru Soruları</strong> için hazır yanıtlar oluşturulur.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAJ, BURS & KURUMSAL */}
          {activeTab === 'programs' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    Staj, Yeni Mezun, Fellowship, Burs & Kurumsal Vitrini
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    6 büyük platformdaki güncel staj, MT, fellowship, burs ve eğitim fırsatları afişleriyle tek sekmede.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleNavigateView('programs')}
                  className="text-xs gap-1.5 self-start"
                >
                  <span>Staj & Kurumsal Sekmesini Aç</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-indigo-500" />
                    Youthall & anbean Kampüs & Toptalent
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Kurumsal firmaların açtığı uzun dönem staj, yaz stajı, part-time öğrenci, Management Trainee (MT) ve genç yetenek programları şirket logoları ve kapak afişleriyle listelenir.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-fuchsia-500" />
                    Microfon.co Fellowship, Burs & Fırsatlar
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Microfon.co</strong> üzerindeki güncel üniversite/vakıf eğitim bursları (burs tutarlarıyla birlikte), liderlik fellowship programları, akademiler ve öğrenci indirim/fırsatları canlı olarak çekilir.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Techcareer.net & Üniversite Kariyer Merkezleri
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ücretsiz yazılım/veri/AI Bootcamp programları ve <strong>Yetenek Kapısı, İTÜ, ODTÜ, Boğaziçi, Koç, Sabancı, Bilkent</strong> kariyer merkezlerine doğrudan erişim barı yer alır.
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 border border-border/70 rounded-xl p-4 text-xs text-muted-foreground flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Tek Tıkla Özel CV Üretimi:</strong> Vitrin üzerindeki herhangi bir staj, burs veya fellowship kartında bulunan <strong>&quot;Özel CV Üret&quot;</strong> butonuna bastığınızda programın tüm detayları otomatik olarak CV Stüdyosu&apos;na aktarılır.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JOB RADAR */}
          {activeTab === 'jobs' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    İlan Radarı & Kesin Tecrübe Filtreleme Sistemi
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    İlan açıklamalarının tamamını okuyan, kapanmış veya tecrübe seviyenize uymayan ilanları eleyen akıllı radar.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleNavigateView('jobs')}
                  className="text-xs gap-1.5 self-start"
                >
                  <span>İlan Radarına Git</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                    Kesin Stajyer / Part-Time & Tecrübe Seviyesi Koruması
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>&quot;Stajyer / Part-Time / Öğrenci&quot;</strong> filtresini seçtiğinizde sistem yalnızca başlığında veya açıklamasında açıkça stajyer, part-time, aday mühendis veya öğrenci arayan ilanları gösterir. CV uyum skoru %98 olsa bile stajyer/part-time olmayan veya 3-5+ yıl tecrübe isteyen ilanları kesin olarak eler.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
                    Kapanmış İlanları Otomatik Eleme
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    LinkedIn üzerinde <em>&quot;Artık başvuru kabul etmiyor&quot;</em> (No longer accepting applications) durumuna düşmüş eski ilanlar tarama sırasında otomatik olarak tespit edilip listeden çıkarılır.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
                    Uyum Skoru (%0 - %100) ve Eksik Yetenek Analizi
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Her ilanın tam metni okunarak CV&apos;nizde eşleşen yetenekler (yeşil) ve ilanda aranan ek yetenekler (kırmızı) listelenir. Beğendiğiniz ilanı tek tıkla <strong>Başvurulara Ekle</strong> veya <strong>Bu İlana Özel CV Üret</strong> diyerek değerlendirebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RESUMES */}
          {activeTab === 'resumes' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  CV Havuzum & Çoklu Özgeçmiş Yönetimi
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
                    CV PDF dosyanızı yüklediğinizde yapay zekâ teknik yeteneklerinizi, hedef rolünüzü ve profesyonel özetinizi otomatik olarak ayrıştırır.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Copy className="h-4 w-4" />
                    <span>Türkçe & İngilizce Cover Letter</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Her CV için profesyonel Türkçe ve İngilizce Cover Letter üretilir. Başvuru yaparken tek tıkla panoya kopyalayabilir veya özelleştirebilirsiniz.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <BarChart2 className="h-4 w-4" />
                    <span>Hangi CV Daha Başarılı?</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Her CV versiyonunun kaç başvuru aldığını, kaç mülakat getirdiğini ve geri dönüş oranını (%) anlık olarak karşılaştırabilirsiniz.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Download className="h-4 w-4" />
                    <span>Kariyer Hafızası ile Senkronizasyon</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    CV Havuzunuzdaki özgeçmişleri tek tıkla CV Stüdyosu&apos;ndaki Kariyer Hafızasına eşitleyebilir veya Stüdyo&apos;da ürettiğiniz yeni CV&apos;yi doğrudan havuza kaydedebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <LayoutList className="h-4 w-4 text-primary" />
                  Başvuru & Süreç Yönetimi (Liste ve Kanban)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Başvurularınızın hangi aşamada olduğunu Liste veya sürükle-bırak Kanban panosunda yönetin.
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
                    <li>• <strong>Bekleniyor:</strong> Başvuru yapıldı, yanıt bekleniyor.</li>
                    <li>• <strong>Dönüş Aldı:</strong> İK sizinle iletişime geçti.</li>
                    <li>• <strong>Mülakat:</strong> Teknik veya İK mülakatı planlandı.</li>
                    <li>• <strong>Teklif:</strong> Tebrikler, iş teklifi aldınız!</li>
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

          {/* TAB 7: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-primary" />
                    Akıllı Kariyer Pusulası & Performans Koçu
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Klasik grafikler yerine interaktif başvuru hunisi, momentum skoru ve aksiyon tavsiyeleri.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleNavigateView('analytics')}
                  className="text-xs gap-1.5 self-start"
                >
                  <span>Analiz Sekmesini Aç</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border border-border rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Kariyer Momentum Skoru (0-100)
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Başvuru aktifliğiniz, İK iletişiminiz, mülakat dönüşümünüz ve sessiz başvuru takibinize göre hesaplanan genel kariyer ivmeniz.
                  </p>
                </div>

                <div className="p-4 bg-card border border-border rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Target className="h-4 w-4" />
                    4 Adımlı Dönüşüm Hunisi
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Toplam Başvuru ➔ Olumlu Dönüş ➔ Mülakat ➔ İş Teklifi adımlarındaki dönüşüm oranlarınızı görün; herhangi bir adıma tıklayarak o başvuruları filtreleyin.
                  </p>
                </div>

                <div className="p-4 bg-card border border-border rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    İK İletişim Etkisi & CV Lideri
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    İK ile doğrudan iletişime geçtiğiniz başvuruların olumlu dönüş yüzdesini, sadece online başvurularla kıyaslayın ve #1 numaralı CV versiyonunuzu görün.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: FAQ & TIPS */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                  Hesabım ve Verilerim Bana Özel mi?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Evet! Her kullanıcının hesabı, CV&apos;leri, Kariyer Hafızası belgeleri ve başvuruları tamamen kendi hesabına izoledir; başka hiçbir kullanıcı sizin verilerinizi göremez. Dilediğiniz zaman üst menüdeki <strong>Dışa Aktar (Excel, E-Tablolar, JSON)</strong> menüsüyle verilerinizin tam yedeğini bilgisayarınıza indirebilirsiniz.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Kariyer Hafızasına Hangi Belgeleri Yükleyebilirim?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Eski CV&apos;lerinizi (PDF/DOCX/TXT), daha önce yazdığınız tüm motivasyon mektuplarını, fellowship başvuru sorularına verdiğiniz yanıtları, proje özetlerinizi ve sertifikalarınızı sürükleyip bırakabilirsiniz. CV Stüdyosu yeni bir ilana CV hazırlarken tüm bu kaynakları tarayıp en güçlü cümlelerinizi seçer.
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-1.5">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
                  Turu Sıfırlamak veya Tekrar İzlemek İstersem?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  İstediğiniz an aşağıdaki <strong>&quot;Canlı Turu Başlat&quot;</strong> butonuna veya üst menüdeki <strong>Rehber</strong> butonuna basarak interaktif tanıtım turunu baştan izleyebilirsiniz.
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
