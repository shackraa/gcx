'use client'

import { useState } from 'react'
import type { Application } from '@/types'
import { ApplicationCard } from './ApplicationCard'
import { PackageOpen } from 'lucide-react'
import { useUIStore } from '@/lib/store/ui'
import { Button } from '@/components/ui/button'

interface ApplicationListProps {
  applications: Application[]
  overdueDays?: number
}

const DEMO_APPLICATION: Application = {
  _id: 'demo-app-1' as any,
  _creationTime: Date.now() - 16 * 24 * 60 * 60 * 1000,
  userId: 'demo-user',
  company: 'Örnek Teknoloji A.Ş. (Örnek Başvuru)',
  position: 'Senior Frontend Developer',
  status: 'waiting',
  appliedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  channel: 'linkedin',
  cvVersion: 'Frontend Developer CV',
  jobLink: 'https://linkedin.com/jobs',
  hrContacted: false,
  note: 'LinkedIn Easy Apply ile başvuruldu. 16 gündür geri dönüş yok, İK takip şablonu kopyalanabilir.',
}

export function ApplicationList({ applications, overdueDays = 14 }: ApplicationListProps) {
  const { openModal } = useUIStore()
  const [showDemoApp, setShowDemoApp] = useState(true)

  if (applications.length === 0) {
    return (
      <div data-tour="applications-list-section" className="space-y-4">
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-card border border-dashed rounded-xl p-6">
          <PackageOpen className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="text-foreground font-semibold text-sm">Listenizde Henüz Başvuru Yok</p>
            <p className="text-muted-foreground text-xs mt-1">
              İş başvurularınızı kaydedin veya İlan Radarından tek tıkla buraya aktarın.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => openModal()} className="h-8 text-xs">
              + İlk Başvurunu Ekle
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDemoApp(!showDemoApp)}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              {showDemoApp ? 'Örnek Başvuruyu Gizle' : 'Örnek Başvuruyu Göster'}
            </Button>
          </div>
        </div>

        {showDemoApp && (
          <div className="space-y-2 border border-border/80 bg-card rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/40">
              <span className="font-semibold text-foreground">
                Örnek Başvuru Kartı (14 Gün Üzeri Sessiz Uyarısı ve İK Şablonu)
              </span>
              <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Örnek Gösterim
              </span>
            </div>
            <ApplicationCard app={DEMO_APPLICATION} overdueDays={overdueDays} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div data-tour="applications-list-section" className="space-y-2">
      {applications.map((app) => (
        <ApplicationCard key={app._id} app={app} overdueDays={overdueDays} />
      ))}
    </div>
  )
}
