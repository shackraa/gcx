'use client'

import type { Application } from '@/types'
import { ApplicationCard } from './ApplicationCard'
import { PackageOpen } from 'lucide-react'
import { useUIStore } from '@/lib/store/ui'
import { Button } from '@/components/ui/button'

interface ApplicationListProps {
  applications: Application[]
  overdueDays?: number
}

export function ApplicationList({ applications, overdueDays = 14 }: ApplicationListProps) {
  const { openModal } = useUIStore()

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <PackageOpen className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <p className="text-muted-foreground text-sm">Başvuru bulunamadı.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Farklı bir filtre dene veya yeni başvuru ekle.
          </p>
        </div>
        <Button size="sm" onClick={() => openModal()}>
          + Başvuru ekle
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {applications.map((app) => (
        <ApplicationCard key={app._id} app={app} overdueDays={overdueDays} />
      ))}
    </div>
  )
}
