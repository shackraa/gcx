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
      'GCX; tüm iş başvurularınızı düzenli tutmak, farklı CV versiyonlarınızın başarısını ölçmek ve süreci yapay zekâ ile hızlandırmak için tasarlandı.',
    bulletPoints: [
      'Hangi şirkete hangi CV ile başvurduğunuzu kaydedin.',
      'Sessiz kalan başvuruları tespit edip hazır takip şablonuyla yanıt alın.',
      'Şimdi sekmeleri sırayla inceleyelim: Önce üst menüdeki yerini, ardından sayfa içi kullanımını göreceksiniz.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-resumes',
    targetSelector: '[data-tour="nav-resumes"]',
    targetView: 'resumes',
    title: '1. Sekme: Üst Menüde "CV Havuzum"',
    badge: 'Menü Butonu',
    description:
      'Farklı uzmanlık veya pozisyonlara özel CV versiyonlarınıza üst menüdeki bu butondan ulaşırsınız.',
    bulletPoints: [
      'Bu sekmeye tıkladığınızda CV Havuzu yönetim sayfası açılır.',
      'Tek bir CV yerine Frontend, Backend veya Ürün gibi farklı CV versiyonlarınızı sisteme yükleyebilirsiniz.',
      'Şimdi aşağıdaki CV kartlarını ve yönetim alanını inceleyelim.',
    ],
    position: 'bottom',
  },
  {
    id: 'resume-pool-page',
    targetSelector: '[data-tour="resume-pool-section"]',
    targetView: 'resumes',
    title: 'CV Havuzum: Kartlar ve Ön Yazı (Cover Letter)',
    badge: 'Sayfa İçi Alan',
    description:
      'Sayfadaki CV kartları üzerinden tüm CV versiyonlarınızı ve performanslarını yönetin.',
    bulletPoints: [
      'PDF yüklediğinizde yapay zekâ teknik yeteneklerinizi ve özetinizi otomatik ayrıştırır.',
      'Her CV için özel Türkçe ve İngilizce Ön Yazı (Cover Letter) üretilir ve tek tıkla kopyalanır.',
      'Her versiyonun kaç başvuru aldığını ve başarı oranını (%0-100) kart üzerinden takip edin.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-jobs',
    targetSelector: '[data-tour="nav-jobs"]',
    targetView: 'jobs',
    title: '2. Sekme: Üst Menüde "İlan Radarı"',
    badge: 'Menü Butonu',
    description:
      'CV yeteneklerinize göre piyasadaki güncel iş fırsatlarını otonom olarak aratmak için üst menüdeki bu sekmeyi açarsınız.',
    bulletPoints: [
      'Bu sekme açıldığında arka plandaki yapay zekâ filtreleri ve canlı ilan tarayıcısı devreye girer.',
      'Şimdi sayfadaki filtreleri ve arama alanını inceleyelim.',
    ],
    position: 'bottom',
  },
  {
    id: 'job-radar-controls-page',
    targetSelector: '[data-tour="job-radar-controls"]',
    targetView: 'jobs',
    title: 'İlan Radarı: Filtreler & Canlı Tarama',
    badge: 'Sayfa İçi Alan',
    description:
      'Çalışma modelini (Ofiste, Hibrit, Uzaktan) ve hedef lokasyonunuzu belirleyip tek tıkla arama başlatın.',
    bulletPoints: [
      'Hedef CV versiyonunuzu seçin ve aramak istediğiniz şehri yazın.',
      '"Tüm Uygun İlanları Tara" butonuna tıklayarak CV yeteneklerinize en uygun pozisyonları bulun.',
      'Arka planda çalışan otonom bot komutuyla da ilanları otomatik toplayabilirsiniz.',
    ],
    position: 'bottom',
  },
  {
    id: 'scouted-jobs-demo-page',
    targetSelector: '[data-tour="scouted-jobs-section"]',
    targetView: 'jobs',
    title: 'İlan Radarı: Uyum Skoru (%90+) ve Yetenek Analizi',
    badge: 'Sayfa İçi Alan',
    description:
      'Taranan pozisyonlar sayfada en yüksek uyum skoruna göre listelenir.',
    bulletPoints: [
      'Uyum Skoru: %80 ve üzeri pozisyonlar yeşil etiketle (%94, %88 gibi) öne çıkarılır.',
      'Yetenek Kıyaslaması: CV\'nizde olanlar yeşil, eksik yetenekler ise kırmızı etiketlenir.',
      '"Başvurulara Ekle" butonu ile beğendiğiniz ilanı tek tıkla takip listenize aktarabilirsiniz.',
    ],
    position: 'top',
  },
  {
    id: 'nav-applications',
    targetSelector: '[data-tour="nav-applications"]',
    targetView: 'kanban',
    title: '3. Sekme: Üst Menüde "Başvurularım"',
    badge: 'Menü Butonu',
    description:
      'Tüm aktif ve geçmiş iş başvurularınızı organize etmek için üst menüdeki bu sekmeyi kullanırsınız.',
    bulletPoints: [
      'Başvurularım sekmesi hem sürükle-bırak Kanban panosunu hem de detaylı Liste görünümünü içerir.',
      'Şimdi sayfadaki Kanban panosunu inceleyelim.',
    ],
    position: 'bottom',
  },
  {
    id: 'kanban-board-page',
    targetSelector: '[data-tour="kanban-board-section"]',
    targetView: 'kanban',
    title: 'Başvurularım: Sürükle-Bırak Kanban Panosu',
    badge: 'Sayfa İçi Alan',
    description:
      'Başvurularınızı sürükle-bırak Kanban panosunda adım adım görsel olarak yönetin.',
    bulletPoints: [
      'Aşamalar: Hazırlanıyor ➔ Beklemede ➔ Mülakatta ➔ Teklif.',
      'Kartları tutup bir sonraki aşama sütununa bırakarak durumunu anında güncelleyin.',
      'Mülakat tarihleri ve sessiz başvuru uyarıları kartların üzerinde canlı görünür.',
    ],
    position: 'bottom',
  },
  {
    id: 'applications-list-page',
    targetSelector: '[data-tour="applications-list-section"]',
    targetView: 'list',
    title: 'Başvurularım: Sessiz Başvuru & İK Takip Şablonu',
    badge: 'Sayfa İçi Alan',
    description:
      '14 gün boyunca yanıt alamadığınız başvuruları tespit edin ve profesyonel takip e-postasıyla hatırlatın.',
    bulletPoints: [
      '14 gün boyunca dönüş yapılmayan başvurular kırmızı "Sessiz" etiketiyle otomatik vurgulanır.',
      'Kart üzerindeki "Şablonu Kopyala" ile İK yetkilisine özel hazırlanmış profesyonel takip e-postası metni alın.',
      'Arama çubuğu ve filtreler sayesinde şirket veya pozisyona göre anında filtreleme yapın.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-analytics',
    targetSelector: '[data-tour="nav-analytics"]',
    targetView: 'analytics',
    title: '4. Sekme: Üst Menüde "Analiz"',
    badge: 'Menü Butonu',
    description:
      'Başvuru sürecinizin geri dönüş ve başarı istatistiklerini görmek için üst menüdeki Analiz sekmesini açarsınız.',
    bulletPoints: [
      'Bu buton sizi başvuru performansı, dönüş oranları ve CV başarı grafiklerine götürür.',
      'Şimdi sayfadaki grafikleri inceleyelim.',
    ],
    position: 'bottom',
  },
  {
    id: 'analytics-view-page',
    targetSelector: '[data-tour="analytics-view-section"]',
    targetView: 'analytics',
    title: 'Analiz: Başarı Oranları ve CV Grafikleri',
    badge: 'Sayfa İçi Alan',
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
    id: 'tour-finish',
    targetSelector: '[data-tour="guide-button"]',
    targetView: 'list',
    title: 'Rehber Her Zaman Yanınızda',
    badge: 'Tamamlandı',
    description:
      'Tebrikler! Hem üst menüdeki sekmeleri hem de sayfadaki tüm özellikleri sırasıyla öğrendiniz.',
    bulletPoints: [
      'Üst menüdeki "Rehber" butonuna dilediğiniz zaman tıklayarak bu tura veya detaylı kullanım kılavuzuna ulaşabilirsiniz.',
      'JSON yedekleme butonlarıyla verilerinizi dışa aktarabilirsiniz.',
    ],
    position: 'bottom',
  },
]
