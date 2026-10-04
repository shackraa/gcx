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

export function getTourSteps(isMobile: boolean = false): TourStep[] {
  return [
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
        isMobile
          ? 'Şimdi sekmeleri sırayla inceleyelim: Önce ekranın altındaki menüdeki yerini, ardından sayfa içi kullanımını göreceksiniz.'
          : 'Şimdi sekmeleri sırayla inceleyelim: Önce üst menüdeki yerini, ardından sayfa içi kullanımını göreceksiniz.',
      ],
      position: 'bottom',
    },
    {
      id: 'nav-resumes',
      targetSelector: '[data-tour="nav-resumes"]',
      targetView: 'resumes',
      title: isMobile ? '1. Sekme: Alt Menüde "CV Havuzu"' : '1. Sekme: Üst Menüde "CV Havuzum"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'Farklı uzmanlık veya pozisyonlara özel CV versiyonlarınıza ekranın altındaki bu butondan ulaşırsınız.'
        : 'Farklı uzmanlık veya pozisyonlara özel CV versiyonlarınıza üst menüdeki bu butondan ulaşırsınız.',
      bulletPoints: [
        isMobile
          ? 'Bu sekmeye dokunduğunuzda CV Havuzu yönetim sayfası açılır.'
          : 'Bu sekmeye tıkladığınızda CV Havuzu yönetim sayfası açılır.',
        'Tek bir CV yerine Frontend, Backend veya Ürün gibi farklı CV versiyonlarınızı sisteme yükleyebilirsiniz.',
        'Şimdi aşağıdaki CV kartlarını ve yönetim alanını inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
    },
    {
      id: 'resume-pool-page',
      targetSelector: '[data-tour="resume-pool-section"]',
      targetView: 'resumes',
      title: 'CV Havuzum: Kartlar ve Cover Letter',
      badge: 'Sayfa İçi Alan',
      description:
        'Sayfadaki CV kartları üzerinden tüm CV versiyonlarınızı ve performanslarını yönetin.',
      bulletPoints: [
        'PDF yüklediğinizde yapay zekâ teknik yeteneklerinizi ve özetinizi otomatik ayrıştırır.',
        'Her CV için özel Türkçe ve İngilizce Cover Letter üretilir ve tek tıkla kopyalanır.',
        'Her versiyonun kaç başvuru aldığını ve başarı oranını (%0-100) kart üzerinden takip edin.',
      ],
      position: 'bottom',
    },
    {
      id: 'nav-jobs',
      targetSelector: '[data-tour="nav-jobs"]',
      targetView: 'jobs',
      title: isMobile ? '2. Sekme: Alt Menüde "İlan Radarı"' : '2. Sekme: Üst Menüde "İlan Radarı"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'CV yeteneklerinize göre piyasadaki güncel iş fırsatlarını aramak için alt menüdeki bu sekmeyi açarsınız.'
        : 'CV yeteneklerinize göre piyasadaki güncel iş fırsatlarını otonom olarak aratmak için üst menüdeki bu sekmeyi açarsınız.',
      bulletPoints: [
        'Bu sekme açıldığında arka plandaki yapay zekâ filtreleri ve canlı ilan tarayıcısı devreye girer.',
        'Şimdi sayfadaki filtreleri ve arama alanını inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
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
        "Yetenek Kıyaslaması: CV'nizde olanlar yeşil, eksik yetenekler ise kırmızı etiketlenir.",
        '"Başvurulara Ekle" butonu ile beğendiğiniz ilanı tek tıkla takip listenize aktarabilirsiniz.',
      ],
      position: 'top',
    },
    {
      id: 'nav-applications',
      targetSelector: '[data-tour="nav-applications"]',
      targetView: 'kanban',
      title: isMobile ? '3. Sekme: Alt Menüde "Başvurular"' : '3. Sekme: Üst Menüde "Başvurularım"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'Tüm aktif ve geçmiş iş başvurularınızı organize etmek için alt menüdeki bu sekmeyi kullanırsınız.'
        : 'Tüm aktif ve geçmiş iş başvurularınızı organize etmek için üst menüdeki bu sekmeyi kullanırsınız.',
      bulletPoints: [
        'Başvurular sekmesi hem sürükle-bırak Kanban panosunu hem de detaylı Liste görünümünü içerir.',
        'Şimdi sayfadaki panoyu ve liste özelliklerini inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
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
      title: isMobile ? '4. Sekme: Alt Menüde "Analiz"' : '4. Sekme: Üst Menüde "Analiz"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'Başvuru sürecinizin geri dönüş ve başarı istatistiklerini görmek için alt menüdeki Analiz sekmesini açarsınız.'
        : 'Başvuru sürecinizin geri dönüş ve başarı istatistiklerini görmek için üst menüdeki Analiz sekmesini açarsınız.',
      bulletPoints: [
        'Bu buton sizi başvuru performansı, dönüş oranları ve CV başarı grafiklerine götürür.',
        'Şimdi sayfadaki grafikleri inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
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
      description: isMobile
        ? 'Tebrikler! Hem alt menüdeki sekmeleri hem de sayfadaki tüm özellikleri sırasıyla öğrendiniz.'
        : 'Tebrikler! Hem üst menüdeki sekmeleri hem de sayfadaki tüm özellikleri sırasıyla öğrendiniz.',
      bulletPoints: [
        isMobile
          ? 'Ekranın üstündeki "Rehber" veya sağ alttaki yardım butonuna dilediğiniz zaman dokunarak bu tura veya detaylı kullanım kılavuzuna ulaşabilirsiniz.'
          : 'Üst menüdeki "Rehber" butonuna dilediğiniz zaman tıklayarak bu tura veya detaylı kullanım kılavuzuna ulaşabilirsiniz.',
        'Excel, Google E-Tablolar ve JSON dışa aktarma menüsünden verilerinizi dilediğiniz formatta kaydedebilirsiniz.',
      ],
      position: 'bottom',
    },
  ]
}

export const TOUR_STEPS = getTourSteps(false)
