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
    targetSelector: '[data-tour="app-logo"]',
    targetView: 'list',
    title: 'GCX Kariyer ve Başvuru Takip Merkezi',
    badge: 'Başlangıç',
    description:
      'GCX; iş başvurularınızı düzenli tutmak, farklı CV versiyonlarınızın geri dönüş oranlarını ölçmek ve süreci en verimli şekilde yönetmek için tasarlandı.',
    bulletPoints: [
      'Hangi şirkete hangi CV ile başvurduğunuzu kaydedin.',
      'Sessiz kalan başvuruları tespit edip hazır hatırlatma şablonuyla takip edin.',
      'Yapay zekâ ile ilanları tarayın ve CV uyum skorunuzu (%0-100) öğrenin.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-resumes',
    targetSelector: '[data-tour="nav-resumes"]',
    targetView: 'resumes',
    title: '1. Sekme: CV Havuzum ve Çoklu CV Yönetimi',
    badge: 'CV Havuzu',
    description:
      'Farklı roller (Frontend, Backend, Ürün vb.) için CV versiyonlarınızı buraya yükleyin.',
    bulletPoints: [
      'PDF yüklediğinizde teknik yetenekleriniz ve özetiniz otomatik olarak çıkarılır.',
      'Her CV versiyonu için özel Türkçe ve İngilizce Ön Yazı (Cover Letter) üretilir.',
      'Hangi CV versiyonunuzun daha çok dönüş aldığını kartlar üzerinden karşılaştırabilirsiniz.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-jobs',
    targetSelector: '[data-tour="nav-jobs"]',
    targetView: 'jobs',
    title: '2. Sekme: İlan Radarı ve Otonom Tarama',
    badge: 'İlan Radarı',
    description:
      'CV yeteneklerinize göre web üzerindeki güncel iş fırsatlarını tek tıkla aratın.',
    bulletPoints: [
      'Filtreleri (Şehir, Hibrit/Remote) belirleyin ve "CV\'me Uygun İlanları Şimdi Tara" butonuna basın.',
      'Her ilanın gereksinimleri sizin CV\'nizle satır satır karşılaştırılır.',
    ],
    position: 'bottom',
  },
  {
    id: 'scouted-jobs-demo',
    targetSelector: '[data-tour="scouted-jobs-section"]',
    targetView: 'jobs',
    title: 'Örnek İlan Gösterimi ve Uyum Skoru (%90+)',
    badge: 'Eşleşme Analizi',
    description:
      'Taranan pozisyonlar en yüksek uyum skoruna göre listelenir.',
    bulletPoints: [
      'Uyum Skoru: %80 üzeri pozisyonlar yeşil etiketle (%94, %88 gibi) gösterilir.',
      'Yetenek Analizi: İlanda istenen ve CV\'nizde olan yetenekler (yeşil), eksikler ise (kırmızı) olarak ayrıştırılır.',
      'Başvuruya Ekle: Beğendiğiniz ilanı tek tıkla Başvurularım listesine dönüştürebilirsiniz.',
    ],
    position: 'top',
  },
  {
    id: 'nav-applications-kanban',
    targetSelector: '[data-tour="nav-applications"]',
    targetView: 'kanban',
    title: '3. Sekme: Başvurularım ve Kanban Panosu',
    badge: 'Kanban Takibi',
    description:
      'Başvurularınızı Liste yerine sürükle-bırak Kanban panosunda da adım adım takip edebilirsiniz.',
    bulletPoints: [
      'Aşamalar: Hazırlanıyor ➔ Beklemede ➔ Mülakatta ➔ Teklif.',
      'Kartları ilgili sütuna sürükleyerek durumunu anında güncelleyin.',
    ],
    position: 'bottom',
  },
  {
    id: 'stats-cards',
    targetSelector: '[data-tour="stats-cards"]',
    targetView: 'list',
    title: 'Sessiz Başvuru Uyarısı ve Takip E-postası',
    badge: 'Otomatik Hatırlatıcı',
    description:
      '14 gün boyunca dönüş yapılmayan başvurular kırmızı "Sessiz" etiketiyle vurgulanır.',
    bulletPoints: [
      'Kart üzerindeki "Şablonu Kopyala" ile şirkete özel profesyonel takip e-postası alın.',
      'Haftalık başvuru hedefinizi ve yaklaşan mülakatlarınızı takip edin.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-analytics',
    targetSelector: '[data-tour="nav-analytics"]',
    targetView: 'analytics',
    title: '4. Sekme: Analiz ve Başarı Grafikleri',
    badge: 'Grafik ve Raporlar',
    description:
      'Hangi CV versiyonunuzun ve hangi başvuru kanalının daha çok kazandırdığını somut grafiklerle inceleyin.',
    bulletPoints: [
      'Geri dönüş oranınızı (%) ve yanıt sürelerini ölçün.',
      'En başarılı CV versiyonunuzu görerek gelecekteki başvurularınızı optimize edin.',
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
      'Tebrikler! GCX\'in tüm temel özelliklerini öğrendiniz.',
    bulletPoints: [
      'Dilediğiniz zaman üst menüdeki "Rehber" butonuna tıklayarak bu tura veya detaylı kılavuza ulaşabilirsiniz.',
      'Yedekleme butonlarıyla verilerinizi JSON olarak dışa aktarabilirsiniz.',
    ],
    position: 'bottom',
  },
]
