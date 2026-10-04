import type { ViewMode } from '@/types'

export interface TourStep {
  id: string
  targetSelector: string
  targetView?: ViewMode
  title: string
  badge: string
  description: string
  bulletPoints: string[]
  position?: 'bottom' | 'top' | 'left' | 'right' | 'center'
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tour="stats-cards"]',
    targetView: 'list',
    title: 'GCX Kariyer ve Başvuru Takip Merkezi',
    badge: 'Genel Bakış',
    description:
      'GCX; iş başvurularınızı düzenli tutmak, farklı CV versiyonlarınızın geri dönüş oranlarını ölçmek ve süreci en verimli şekilde yönetmek için tasarlandı.',
    bulletPoints: [
      'Hangi şirkete hangi CV ile başvurduğunuzu kaydedin.',
      'Sessiz kalan başvuruları tespit edip hazır takip şablonuyla yanıt alın.',
      'Yapay zekâ ile ilanları tarayın ve CV uyum skorunuzu (%0-100) öğrenin.',
    ],
    position: 'bottom',
  },
  {
    id: 'tour-resumes',
    targetSelector: '[data-tour="resume-pool-section"]',
    targetView: 'resumes',
    title: '1. Sekme: CV Havuzum ve Çoklu CV Yönetimi',
    badge: 'CV Havuzu',
    description:
      'Sayfadaki CV kartları üzerinden farklı uzmanlık veya rollere (Frontend, Backend, vb.) özel versiyonlarınızı yönetin.',
    bulletPoints: [
      'PDF yüklediğinizde teknik yetenekleriniz ve profesyonel özetiniz yapay zekâ tarafından otomatik çıkarılır.',
      'Her CV versiyonu için özel Türkçe ve İngilizce Ön Yazı (Cover Letter) üretilir ve tek tıkla kopyalanır.',
      'Hangi CV versiyonunuzun daha çok dönüş aldığını kartlar üzerindeki başarı oranı istatistiklerinden karşılaştırın.',
    ],
    position: 'bottom',
  },
  {
    id: 'tour-jobs-controls',
    targetSelector: '[data-tour="job-radar-controls"]',
    targetView: 'jobs',
    title: '2. Sekme: İlan Radarı ve Otonom Tarama',
    badge: 'İlan Arama & Filtreler',
    description:
      'CV yeteneklerinize göre web üzerindeki güncel iş fırsatlarını sayfadaki kontrol paneli ile filtreleyin ve tarayın.',
    bulletPoints: [
      'Çalışma modelini (Ofiste, Hibrit, Uzaktan) ve aramak istediğiniz şehri/lokasyonu belirleyin.',
      '"Tüm Uygun İlanları Tara" butonuna tıklayarak yapay zekâ taramasını başlatın.',
      'Sistem seçili CV versiyonunuzdaki teknik gereksinimlerle en alakalı açık pozisyonları listeler.',
    ],
    position: 'bottom',
  },
  {
    id: 'scouted-jobs-demo',
    targetSelector: '[data-tour="scouted-jobs-section"]',
    targetView: 'jobs',
    title: 'İlan Radarı: Eşleşme Analizi ve Uyum Skoru',
    badge: 'Uyum Skoru & Yetenekler',
    description:
      'Taranan pozisyonlar sayfada en yüksek uyum skoruna göre listelenir.',
    bulletPoints: [
      'Uyum Skoru: %80 ve üzeri pozisyonlar yeşil etiketle (%94, %88 gibi) öne çıkarılır.',
      'Yetenek Analizi: İlanda istenen ve CV\'nizde olan yetenekler (yeşil), eksikler ise (kırmızı) olarak ayrıştırılır.',
      '"Başvurulara Ekle" butonu ile beğendiğiniz ilanı tek tıkla Başvurularım listenize aktarabilirsiniz.',
    ],
    position: 'top',
  },
  {
    id: 'tour-kanban',
    targetSelector: '[data-tour="kanban-board-section"]',
    targetView: 'kanban',
    title: '3. Sekme: Başvurularım ve Kanban Panosu',
    badge: 'Kanban Süreç Takibi',
    description:
      'Başvurularınızı sürükle-bırak Kanban panosunda adım adım görsel olarak yönetin.',
    bulletPoints: [
      'Aşamalar: Hazırlanıyor ➔ Beklemede ➔ Mülakatta ➔ Teklif.',
      'Başvuru kartını tutup bir sonraki aşama sütununa bırakarak durumunu anında güncelleyin.',
      'Yaklaşan mülakat tarihleri ve sessiz başvuru uyarıları kartların üzerinde canlı görünür.',
    ],
    position: 'bottom',
  },
  {
    id: 'tour-applications-list',
    targetSelector: '[data-tour="applications-list-section"]',
    targetView: 'list',
    title: 'Başvurularım: Sessiz Başvuru Uyarısı ve Takip E-postası',
    badge: 'Sessiz Başvuru Takibi',
    description:
      'Yanıt alamadığınız başvuruları tespit edin ve profesyonel takip e-postasıyla hatırlatın.',
    bulletPoints: [
      '14 gün boyunca dönüş yapılmayan başvurular kırmızı "Sessiz" etiketiyle otomatik vurgulanır.',
      'Kart üzerindeki "Şablonu Kopyala" ile İK yetkilisine özel hazırlanmış profesyonel takip e-postası metni alın.',
      'Filtreler ve arama çubuğu sayesinde şirket veya pozisyona göre anında filtreleme yapın.',
    ],
    position: 'bottom',
  },
  {
    id: 'tour-analytics',
    targetSelector: '[data-tour="analytics-view-section"]',
    targetView: 'analytics',
    title: '4. Sekme: Analiz ve Başarı Grafikleri',
    badge: 'Grafik ve Raporlar',
    description:
      'Sayfadaki interaktif grafiklerle iş arama sürecinizin verimliliğini somut metriklerle inceleyin.',
    bulletPoints: [
      'Geri dönüş oranınızı (%), ortalama yanıt sürelerini ve mülakat sayılarını tek bakışta görün.',
      'Hangi CV versiyonunuzun en çok mülakat getirdiğini karşılaştırmalı grafiklerden tespit edin.',
      'Hangi başvuru kanalının (LinkedIn, Kariyer.net vb.) daha etkili olduğunu analiz edin.',
    ],
    position: 'bottom',
  },
  {
    id: 'help-and-backup',
    targetSelector: '[data-tour="guide-button"]',
    targetView: 'list',
    title: 'Rehber Her Zaman Yanınızda',
    badge: 'Tamamlandı',
    description:
      'Tebrikler! GCX\'in tüm sekmelerini ve sayfadaki kullanım alanlarını başarıyla öğrendiniz.',
    bulletPoints: [
      'Dilediğiniz zaman üst menüdeki "Rehber" butonuna tıklayarak bu tura veya detaylı kullanım kılavuzuna ulaşabilirsiniz.',
      'Yedekleme butonlarıyla verilerinizi JSON olarak dışa aktarabilirsiniz.',
    ],
    position: 'bottom',
  },
]
