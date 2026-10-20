import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export const metadata = {
  title: 'Kullanım Şartları (Terms of Service) | GCX',
  description: 'GCX Kariyer Takip Sistemi Kullanım Şartları',
}

export default function TermsPage() {
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
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Kullanım Şartları (Terms of Service)</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Son Güncelleme: 20 Ekim 2026</p>
        </div>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">1. Hizmetin Niteliği</h2>
          <p>
            GCX, bireysel iş ve kariyer arayışlarını kolaylaştırmak, başvuru süreçlerini takip etmek ve yapay zeka desteğiyle hazırlık süreçlerini güçlendirmek için geliştirilmiş bağımsız bir üretkenlik yazılımıdır.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">2. Kullanıcı Sorumlulukları</h2>
          <p>
            Kullanıcılar, platforma yükledikleri özgeçmiş (CV), iletişim bilgileri ve başvuru verilerinin doğruluğundan bizzat sorumludur. Platform, üçüncü taraf şirketlerin veya platformların (LinkedIn, Youthall vb.) işe alım kararlarını garanti etmez.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">3. Google Hesap Bağlantısı ve Yetkilendirme</h2>
          <p>
            Kullanıcı, dilediği zaman Google hesap entegrasyonunu devre dışı bırakabilir veya Google Güvenlik Ayarları panelinden GCX uygulamasının yetkilerini geri çekebilir.
          </p>
        </section>

        <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-base font-bold text-foreground">4. İletişim</h2>
          <p>
            Hizmet şartlarımızla ilgili her türlü geri bildirim için:{' '}
            <a href="mailto:atakantrpc@gmail.com" className="text-primary underline">
              atakantrpc@gmail.com
            </a>
          </p>
        </section>

        <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground flex justify-between items-center">
          <span>&copy; {new Date().getFullYear()} GCX Career Platform</span>
          <Link href="/privacy" className="hover:underline">
            Gizlilik Politikası
          </Link>
        </div>
      </div>
    </div>
  )
}
