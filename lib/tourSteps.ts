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
      'GCX; iş başvurularınızı düzenli tutmak, farklı CV versiyonlarınızın performansını ölçmek ve yapay zekâ desteğiyle süreci optimize etmek için tasarlanmıştır.',
    bulletPoints: [
      'Hangi pozisyona hangi CV ile başvurduğunuzu kaydedin.',
      '14 gün ve üzeri sessiz kalan başvurular için hazır takip e-postası şablonu alın.',
      'Yapay zekâ ile iş ilanlarını tarayın ve CV uyum skorunuzu öğrenin.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-resumes',
    targetSelector: '[data-tour="nav-resumes"]',
    targetView: 'resumes',
    title: '1. Adım: CV Havuzunuzu Oluşturun',
    badge: 'CV Yönetimi',
    description:
      'Hedeflediğiniz farklı pozisyonlara özel (Frontend, Backend, Ürün vb.) CV versiyonlarınızı sisteme yükleyin.',
    bulletPoints: [
      'PDF yüklediğinizde yapay zekâ yeteneklerinizi ve profesyonel özeti otomatik çıkarır.',
      'Her CV için Türkçe ve İngilizce özel Ön Yazı (Cover Letter) üretilir.',
      'Hangi CV versiyonunuzun kaç geri dönüş aldığını ve başarı oranını takip edin.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-jobs',
    targetSelector: '[data-tour="nav-jobs"]',
    targetView: 'jobs',
    title: '2. Adım: İlan Radarı ve Uyum Analizi',
    badge: 'İlan Keşfi',
    description:
      'CV\'nize en uygun iş fırsatlarını keşfedin veya herhangi bir iş ilanı metnini analiz ettirin.',
    bulletPoints: [
      'Web üzerindeki güncel ilanları CV yeteneklerinize göre tarayın.',
      'CV\'niz ile ilan arasındaki Uyum Skorunu (%0-100) ve eksik yetenekleri inceleyin.',
      'Uygun bulduğunuz ilanları tek tıkla Başvuru Listenize aktarın.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-applications',
    targetSelector: '[data-tour="nav-applications"]',
    targetView: 'list',
    title: '3. Adım: Başvurularınızı Organize Edin',
    badge: 'Süreç Takibi',
    description:
      'Tüm başvurularınızı Liste veya sürükle-bırak Kanban panosu üzerinden adım adım takip edin.',
    bulletPoints: [
      'Aşamalar: Hazırlanıyor, Beklemede, Dönüş Yapıldı, Mülakatta, Teklif.',
      'Başvurduğunuz kanalı (LinkedIn, Kariyer.net, E-posta) ve maaş beklentinizi not edin.',
      'Mülakat tarihlerinizi takvime ekleyerek yaklaşan görüşmeleri kaçırmayın.',
    ],
    position: 'bottom',
  },
  {
    id: 'add-application',
    targetSelector: '[data-tour="add-application-btn"]',
    targetView: 'list',
    title: 'Yeni Başvuru Kaydetme',
    badge: 'Hızlı Ekleme',
    description:
      'Her yeni iş başvurusunu birkaç saniyede sisteme işleyin.',
    bulletPoints: [
      'Başvurduğunuz şirketi, pozisyonu ve kullandığınız CV versiyonunu seçin.',
      'İlan linkini ve İK yetkilisinin adını kaydedin.',
      'Modal içindeki yapay zekâ butonu ile şirkete özel ön yazı oluşturun.',
    ],
    position: 'bottom',
  },
  {
    id: 'stats-cards',
    targetSelector: '[data-tour="stats-cards"]',
    targetView: 'list',
    title: 'Sessiz Başvuru Uyarısı ve Hatırlatma',
    badge: 'Otomatik Takip',
    description:
      'Başvurunuzun üzerinden 14 günden fazla süre geçip yanıt gelmediğinde başvuru Sessiz olarak işaretlenir.',
    bulletPoints: [
      'Şablonu Kopyala butonuyla profesyonel İK takip e-postası metni alın.',
      'Mülakat ve teklif sayılarınızı kartlar üzerinden tek tıkla filtreleyin.',
      'Haftalık başvuru hedefinize göre ilerlemenizi izleyin.',
    ],
    position: 'bottom',
  },
  {
    id: 'nav-analytics',
    targetSelector: '[data-tour="nav-analytics"]',
    targetView: 'analytics',
    title: 'Analiz ve Başarı Grafikleri',
    badge: 'İçgörüler',
    description:
      'İş arama sürecinizin verimliliğini somut grafiklerle inceleyin.',
    bulletPoints: [
      'Geri dönüş oranınızı (%) ve ortalama yanıt sürelerini görün.',
      'Hangi CV versiyonunuzun en çok mülakat getirdiğini karşılaştırın.',
      'Hangi başvuru kanallarının daha etkili olduğunu tespit edin.',
    ],
    position: 'bottom',
  },
  {
    id: 'help-and-backup',
    targetSelector: '[data-tour="guide-button"]',
    targetView: 'list',
    title: 'Rehber ve Sistem Tercihleri',
    badge: 'Kullanım Kılavuzu',
    description:
      'Tebrikler, temel adımları tamamladınız.',
    bulletPoints: [
      'Rehber butonuna tıklayarak bu tura veya detaylı kılavuza dilediğiniz an tekrar ulaşabilirsiniz.',
      'Yedekleme butonlarıyla verilerinizi JSON olarak dışa veya içe aktarabilirsiniz.',
      'Karanlık ve aydınlık tema tercihini dilediğiniz zaman değiştirebilirsiniz.',
    ],
    position: 'bottom',
  },
]
