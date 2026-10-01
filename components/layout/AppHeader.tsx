'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/ui'
import { Plus, Download, Upload, Moon, Sun, LogOut, FileText, LayoutList, BarChart2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { exportBackup, importBackup } from '@/lib/utils/backup'
import { useToast } from '@/hooks/use-toast'
import type { Application } from '@/types'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { openModal, openResumeModal, view, setView } = useUIStore()
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

  const isApplicationsView = view === 'list' || view === 'kanban'

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex flex-col leading-none shrink-0">
            <span className="text-xl font-extrabold tracking-tight text-foreground">GCX.</span>
            <span className="text-[10px] text-muted-foreground hidden lg:block">
              Nereye başvurdum, hangi CV ile, kim döndü.
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            <button
              onClick={() => setView('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                isApplicationsView
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Başvurularım
            </button>

            <button
              onClick={() => setView('resumes')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                view === 'resumes'
                  ? 'bg-background text-foreground shadow-sm font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              CV Havuzum
            </button>

            <button
              onClick={() => setView('analytics')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                view === 'analytics'
                  ? 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Analiz
            </button>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Temayı değiştir"
            className="h-8 w-8"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleImport}
            title="Yedek yükle"
            className="h-8 w-8"
          >
            <Upload className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            title="Yedek indir"
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Çıkış yap"
            className="h-8 w-8"
          >
            <LogOut className="h-4 w-4" />
          </Button>

          {/* Quick CV Add Button */}
          <Button
            onClick={() => openResumeModal()}
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs border-primary/30 hover:border-primary/60 text-primary hidden md:inline-flex"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>CV Ekle</span>
          </Button>

          {/* Main Application Add Button */}
          <Button
            onClick={() => openModal()}
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Başvuru ekle</span>
            <span className="sm:hidden">Ekle</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
