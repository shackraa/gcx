import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export const metadata = {
  title: 'Gizlilik Politikası (Privacy Policy) | GCX',
  description: 'GCX Kariyer Takip Sistemi Gizlilik Politikası ve Google Kullanıcı Verileri Bildirimi',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Ana Sayfaya Dön</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Gizlilik Politikası (Privacy Policy)</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Son Güncelleme: 20 Ekim 2026</p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">1. Genel Bakış</h2>
          <p>
            GCX (&ldquo;Uygulama&rdquo;), kullanıcıların iş ve staj başvurularını, mülakat süreçlerini ve kariyer hedeflerini otonom olarak organize etmelerini sağlayan bir kariyer yönetim platformudur. Kullanıcılarımızın veri gizliliği en temel önceliğimizdir.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">2. Google API Kullanıcı Verileri ve Gmail Erişimi</h2>
          <p>
            GCX, kullanıcı talebi doğrultusunda Google OAuth 2.0 kimlik doğrulama mekanizmasını kullanarak Gmail gelen kutusuna salt-okunur (<code>gmail.readonly</code>) erişim sağlayabilir.
          </p>
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs">
            <p className="font-semibold text-foreground">Google Sınırlı Kullanım Bildirimi (Limited Use Disclosure):</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Yalnızca İlgili E-postalar:</strong> Sistem, yalnızca iş başvurusu, mülakat daveti, ret ve iş teklifi içeren e-postaları (başvuru durum güncellemelerini) tespit etmek için filtreli sorgular yürütür.
              </li>
              <li>
                <strong>Kişisel E-postalar Okunmaz:</strong> Genel, kişisel veya işle ilgisiz e-postalarınız kesinlikle taranmaz, okunmaz veya kaydedilmez.
              </li>
              <li>
                <strong>Veri Satışı ve Reklam Yasağı:</strong> Google API üzerinden edinilen veriler asla üçüncü taraflara satılmaz, reklam hedeflemesi amacıyla kullanılmaz.
              </li>
              <li>
                <strong>Yapay Zeka Modeli Eğitimi:</strong> E-posta içerikleriniz yapay zeka modellerini eğitmek için kullanılmaz; yalnızca o anki mülakat tarihini ve başvuru durumunu panonuza işlemek için anlık olarak işlenir.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">3. Toplanan Bilgiler ve Saklama</h2>
          <p>
            Platformumuzda kaydedilen CV bilgileri, başvuru notları ve şirket listeleri Convex güvenli bulut altyapısında kullanıcıya özel olarak şifrelenmiş oturumlar altında saklanır. Kullanıcı dilediği an tüm başvuru verilerini tek tıkla silebilir veya dışa aktarabilir.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">4. İletişim</h2>
          <p>
            Gizlilik politikamız veya veri güvenliği ile ilgili sorularınız için bizimle{' '}
            <a href="mailto:atakantrpc@gmail.com" className="text-primary underline">
              atakantrpc@gmail.com
            </a>{' '}
            adresi üzerinden iletişime geçebilirsiniz.
          </p>
        </section>

        <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground flex justify-between items-center">
          <span>&copy; {new Date().getFullYear()} GCX Career Platform</span>
          <Link href="/terms" className="hover:underline">
            Kullanım Şartları
          </Link>
        </div>
      </div>
    </div>
  )
}
