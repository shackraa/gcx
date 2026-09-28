'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/ui'
import { Plus, Download, Upload, Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from 'next-themes'
import { exportBackup, importBackup } from '@/lib/utils/backup'
import { useToast } from '@/hooks/use-toast'
import type { Application } from '@/types'

export function AppHeader() {
  const { openModal } = useUIStore()
  const { theme, setTheme } = useTheme()
  const applications = useQuery(api.applications.list) as Application[] | undefined
  const importBulkMutation = useMutation(api.applications.importBulk)
  const { signOut } = useAuthActions()
  const { toast } = useToast()
  const router = useRouter()

  function handleExport() {
    if (!applications || applications.length === 0) {
      toast({ title: 'İndirilecek başvuru bulunamadı' })
      return
    }
    exportBackup(applications)
    toast({ title: 'Yedek indirildi ✓', description: 'gcx-yedek dosyası kaydedildi.' })
  }

  async function handleImport() {
    try {
      const imported = await importBackup()
      if (!imported || imported.length === 0) return

      await importBulkMutation({
        applications: imported,
        clearExisting: false,
      })

      toast({ title: `${imported.length} başvuru içeri aktarıldı ✓` })
    } catch {
      toast({ title: 'Yükleme başarısız', variant: 'destructive' })
    }
  }

  async function handleLogout() {
    try {
      await signOut()
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight text-foreground">GCX.</span>
          <span className="text-[10px] text-muted-foreground hidden sm:block">
            Nereye başvurdum, hangi CV ile, kim döndü.
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Temayı değiştir"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleImport}
            title="Yedek yükle"
          >
            <Upload className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            title="Yedek indir"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Çıkış yap"
          >
            <LogOut className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => openModal()}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Başvuru ekle</span>
            <span className="sm:hidden">Ekle</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
