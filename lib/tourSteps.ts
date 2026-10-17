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
      title: 'GCX Kariyer, CV Stüdyosu & Başvuru Merkezi',
      badge: 'Genel Bakış',
      description:
        'GCX; kariyer belgelerinizi hafızasında tutarak ilana özel Harvard CV üretmek, güncel staj/fellowship/burs ilanlarını keşfetmek ve tüm başvurularınızı takip etmek için tasarlandı.',
      bulletPoints: [
        'Kariyer Hafızası ile geçmiş CV, motivasyon mektubu ve fellowship yazılarınızı tek yerde toplayın.',
        'Youthall, Microfon.co, Anbean Kampüs, Techcareer.net ve Toptalent ilanlarını afişleriyle keşfedin.',
        isMobile
          ? 'Şimdi sekmeleri sırayla inceleyelim: Önce ekranın altındaki barda yerini, ardından sayfa içi kullanımını göreceksiniz.'
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
        'Tek bir CV yerine Frontend, Veri Analitiği, Ürün veya Staj gibi farklı CV versiyonlarınızı yükleyebilirsiniz.',
        'Şimdi sayfadaki CV kartlarını inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
    },
    {
      id: 'resume-pool-page',
      targetSelector: '[data-tour="resume-pool-section"]',
      targetView: 'resumes',
      title: 'CV Havuzum: PDF Ayrıştırma ve Cover Letter',
      badge: 'Sayfa İçi Alan',
      description:
        'Sayfadaki CV kartları üzerinden tüm özgeçmiş versiyonlarınızı ve dönüşüm oranlarını yönetin.',
      bulletPoints: [
        'PDF yüklediğinizde yapay zekâ teknik yeteneklerinizi ve özetinizi otomatik ayrıştırır.',
        'Her CV için özel Türkçe ve İngilizce Cover Letter üretilir ve tek tıkla kopyalanır.',
        'Her versiyonun kaç başvuru aldığını ve başarı oranını (%0-100) kart üzerinden takip edin.',
      ],
      position: 'bottom',
    },
    {
      id: 'nav-studio',
      targetSelector: '[data-tour="nav-studio"]',
      targetView: 'studio',
      title: isMobile ? '2. Sekme: Alt Menüde "Stüdyo"' : '2. Sekme: Üst Menüde "CV Stüdyosu"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'Kariyer Hafızası ve Harvard CV Oluşturucu ekranına alt menüdeki "Stüdyo" butonundan ulaşırsınız.'
        : 'Kariyer Hafızası ve Harvard CV Oluşturucu ekranına üst menüdeki "CV Stüdyosu" sekmesinden ulaşırsınız.',
      bulletPoints: [
        'Geçmiş tüm belgelerinizi kaynak dosyası gibi yükleyip her ilana özel CV üreteceğiniz merkez burasıdır.',
        'Şimdi CV Stüdyosu ve Kariyer Hafızası özelliklerini inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
    },
    {
      id: 'cv-studio-page',
      targetSelector: '[data-tour="cv-studio-section"]',
      targetView: 'studio',
      title: 'Kariyer Hafızası & Harvard CV Stüdyosu',
      badge: 'Yapay Zekâ Stüdyosu',
      description:
        'Eski CV’lerinizi, motivasyon mektuplarınızı ve fellowship başvurularınızı sürükleyip bırakın; sistem hafızasında tutsun.',
      bulletPoints: [
        'Tak-Tak-Tak Belge Yükleme: PDF, Word, metin veya görsel belgelerinizi topluca sürükleyip hafızaya ekleyin.',
        'LinkedIn İlanından Üretim: İlan linkini veya açıklamasını yapıştırın; sistem hafızanızdaki en uygun başarıları seçip ilana özel CV oluştursun.',
        'Harvard, Jake’s Resume, McKinsey ve Akademik şablonlar arasında tek tıkla geçiş yapıp A4 PDF olarak indirin.',
      ],
      position: 'bottom',
    },
    {
      id: 'nav-jobs',
      targetSelector: '[data-tour="nav-jobs"]',
      targetView: 'jobs',
      title: isMobile ? '3. Sekme: Alt Menüde "Radar"' : '3. Sekme: Üst Menüde "İlan Radarı"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'CV yeteneklerinize ve tecrübe seviyenize göre canlı iş ilanlarını taramak için alt menüdeki bu sekmeyi açarsınız.'
        : 'CV yeteneklerinize ve tecrübe seviyenize göre canlı iş ilanlarını taramak için üst menüdeki bu sekmeyi açarsınız.',
      bulletPoints: [
        'İlan açıklamalarının tamamını okuyan ve tecrübe seviyenize uymayan ilanları eleyen akıllı radar.',
        'Şimdi İlan Radarı filtrelerini inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
    },
    {
      id: 'job-radar-controls-page',
      targetSelector: '[data-tour="job-radar-controls"]',
      targetView: 'jobs',
      title: 'İlan Radarı: Kesin Tecrübe & Stajyer Filtresi',
      badge: 'Sayfa İçi Alan',
      description:
        'Tecrübe seviyenizi (Stajyer/Part-Time, Yeni Mezun, Mid, Senior veya CV’den Otomatik) seçip canlı tarama başlatın.',
      bulletPoints: [
        'Kesin Stajyer & Part-Time Koruması: "Stajyer / Part-Time" seçtiğinizde yalnızca açıklamasında gerçekten stajyer/part-time/öğrenci arayan ilanlar gösterilir.',
        'Kapanmış İlan Eleme: "Artık başvuru kabul etmiyor" olan ilanlar otomatik olarak elenir.',
        'Gerçek İlan Açıklaması Analizi: Sadece başlığa değil, ilanın içindeki "5+ yıl tecrübe" gibi gizli şartlara bakılarak uyumsuz ilanlar filtrelenir.',
      ],
      position: 'bottom',
    },
    {
      id: 'nav-programs',
      targetSelector: '[data-tour="nav-programs"]',
      targetView: 'programs',
      title: isMobile
        ? '4. Sekme: Alt Menüde "Kurumsal"'
        : '4. Sekme: Üst Menüde "Staj & Kurumsal"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'Staj, yeni mezun, MT, fellowship ve burs ilanlarını afişleriyle görmek için alt menüdeki "Kurumsal" sekmesini açarsınız.'
        : 'Staj, yeni mezun, MT, fellowship ve burs ilanlarını afişleriyle görmek için üst menüdeki "Staj & Kurumsal" sekmesini açarsınız.',
      bulletPoints: [
        'Youthall, Microfon.co, anbean Kampüs, Techcareer.net, Toptalent.co ve Üniversite Kariyer Merkezleri tek ekranda.',
        'Şimdi görsel ilan ve burs vitrinini inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
    },
    {
      id: 'programs-view-page',
      targetSelector: '[data-tour="programs-view-section"]',
      targetView: 'programs',
      title: 'Staj, Fellowship, Burs & Kurumsal İlan Vitrini',
      badge: 'Canlı Görsel Vitrin',
      description:
        'Türkiye’nin önde gelen genç yetenek, burs ve kariyer platformlarındaki güncel fırsatları afişleriyle inceleyin.',
      bulletPoints: [
        'Microfon.co & Youthall & Anbean & Techcareer: Staj, Management Trainee (MT), Fellowship, Eğitim Bursları ve Bootcamp ilanlarını kategoriye göre filtreleyin.',
        'Üniversite Kariyer Merkezleri: Yetenek Kapısı, İTÜ, ODTÜ, Boğaziçi, Koç, Sabancı ve Bilkent kariyer merkezlerine hızlı geçiş yapın.',
        '"Özel CV Üret" butonuyla beğendiğiniz staj veya fellowship ilanını doğrudan CV Stüdyosu’na aktarıp özel CV oluşturun.',
      ],
      position: 'bottom',
    },
    {
      id: 'nav-applications',
      targetSelector: '[data-tour="nav-applications"]',
      targetView: 'kanban',
      title: isMobile ? '5. Sekme: Alt Menüde "Başvuru"' : '5. Sekme: Üst Menüde "Başvurularım"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'Tüm aktif ve geçmiş başvurularınızı organize etmek için alt menüdeki bu sekmeyi kullanırsınız.'
        : 'Tüm aktif ve geçmiş başvurularınızı organize etmek için üst menüdeki bu sekmeyi kullanırsınız.',
      bulletPoints: [
        'Başvurular sekmesi hem sürükle-bırak Kanban panosunu hem de detaylı Liste görünümünü içerir.',
        'Şimdi Kanban panosu ve sessiz başvuru takibini inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
    },
    {
      id: 'kanban-board-page',
      targetSelector: '[data-tour="kanban-board-section"]',
      targetView: 'kanban',
      title: 'Başvurularım: Sürükle-Bırak Kanban & Takip',
      badge: 'Sayfa İçi Alan',
      description:
        'Başvurularınızı sürükle-bırak Kanban panosunda veya Liste görünümünde adım adım yönetin.',
      bulletPoints: [
        'Aşamalar: Hazırlanıyor ➔ Bekleniyor ➔ Dönüş Aldı ➔ Mülakat ➔ Teklif.',
        '14 gün boyunca dönüş yapılmayan başvurular "Sessiz" olarak vurgulanır ve hazır İK takip şablonu sunar.',
      ],
      position: 'bottom',
    },
    {
      id: 'nav-analytics',
      targetSelector: '[data-tour="nav-analytics"]',
      targetView: 'analytics',
      title: isMobile ? '6. Sekme: Alt Menüde "Analiz"' : '6. Sekme: Üst Menüde "Analiz"',
      badge: isMobile ? 'Alt Menü Butonu' : 'Üst Menü Butonu',
      description: isMobile
        ? 'Yenilenen Akıllı Kariyer Pusulası ve dönüşüm hunisini görmek için alt menüdeki Analiz sekmesini açarsınız.'
        : 'Yenilenen Akıllı Kariyer Pusulası ve dönüşüm hunisini görmek için üst menüdeki Analiz sekmesini açarsınız.',
      bulletPoints: [
        'Kariyer Momentum Skoru, 4 adımlı Başvuru Yolculuğu Hunisi ve İK iletişim çarpanı burada yer alır.',
        'Şimdi yeni Analiz ekranını inceleyelim.',
      ],
      position: isMobile ? 'top' : 'bottom',
    },
    {
      id: 'analytics-view-page',
      targetSelector: '[data-tour="analytics-view-section"]',
      targetView: 'analytics',
      title: 'Akıllı Kariyer Pusulası & Performans Koçu',
      badge: 'İnteraktif Analiz',
      description:
        'Klasik grafikler yerine size yol gösteren interaktif dönüşüm hunisi ve karşılaştırmalı içgörüler.',
      bulletPoints: [
        'Kariyer Momentum Skoru (0-100): Başvuru aktifliğiniz, İK iletişiminiz ve mülakat dönüşümünüze göre hesaplanan sağlık puanınız.',
        'Tıklanabilir Dönüşüm Hunisi: Toplam Başvuru ➔ Olumlu Dönüş ➔ Mülakat ➔ İş Teklifi adımlarına tıklayarak ilgili başvuruları anında filtreleyin.',
        'İK İletişim Etkisi & CV Liderlik Tablosu: İK’ya yazmanın dönüş şansınızı ne kadar artırdığını ve hangi CV’nizin #1 sırada olduğunu görün.',
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
        ? 'Tebrikler! Hem alt menüdeki sekmeleri hem de yeni eklenen tüm kariyer araçlarını sırasıyla öğrendiniz.'
        : 'Tebrikler! Hem üst menüdeki sekmeleri hem de yeni eklenen tüm kariyer araçlarını sırasıyla öğrendiniz.',
      bulletPoints: [
        isMobile
          ? 'Ekranın üstündeki "Rehber" veya sağ alttaki yardım butonuna dilediğiniz zaman dokunarak bu tura veya detaylı kılavuza ulaşabilirsiniz.'
          : 'Üst menüdeki "Rehber" butonuna dilediğiniz zaman tıklayarak bu tura veya detaylı kılavuza ulaşabilirsiniz.',
        'Excel, Google E-Tablolar ve JSON dışa aktarma menüsünden verilerinizi dilediğiniz formatta kaydedebilirsiniz.',
      ],
      position: 'bottom',
    },
  ]
}

export const TOUR_STEPS = getTourSteps(false)
