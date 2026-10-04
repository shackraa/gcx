'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/ui'
import { useTourStore } from '@/lib/store/tour'
import { useState, useRef, useEffect } from 'react'
import { Plus, Download, Moon, Sun, LogOut, FileText, LayoutList, BarChart2, Briefcase, HelpCircle, FileSpreadsheet, Sheet } from 'lucide-react'
import { useTheme } from 'next-themes'
import { exportToStyledExcel, exportToGoogleSheetsCsv, exportBackup } from '@/lib/utils/backup'
import { useToast } from '@/hooks/use-toast'
import type { Application } from '@/types'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { openModal, openResumeModal, view, setView } = useUIStore()
  const { openGuideModal } = useTourStore()
  const { theme, setTheme } = useTheme()
  const applications = useQuery(api.applications.list) as Application[] | undefined
  const { signOut } = useAuthActions()
  const { toast } = useToast()
  const router = useRouter()
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false)
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsExportMenuOpen(false)
      }
    }
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isExportMenuOpen])

  function handleExportExcel() {
    if (!applications || applications.length === 0) {
      toast({ title: 'Dışa aktarılacak başvuru bulunamadı' })
      return
    }
    exportToStyledExcel(applications)
    setIsExportMenuOpen(false)
    toast({
      title: 'Excel Tablosu İndirildi ✓',
      description: 'Renkli başlıklar ve okunaklı hücrelerle biçimlendirilmiş Excel dosyası (.xls) kaydedildi.',
    })
  }

  function handleExportGoogleSheetsCsv() {
    if (!applications || applications.length === 0) {
      toast({ title: 'Dışa aktarılacak başvuru bulunamadı' })
      return
    }
    exportToGoogleSheetsCsv(applications)
    setIsExportMenuOpen(false)
    toast({
      title: 'Google E-Tablolar CSV İndirildi ✓',
      description: 'E-Tablolar ve Drive ile tam uyumlu CSV dosyası kaydedildi.',
    })
  }


  function handleExportBackupJson() {
    if (!applications || applications.length === 0) {
      toast({ title: 'Yedeklenecek başvuru bulunamadı' })
      return
    }
    exportBackup(applications)
    setIsExportMenuOpen(false)
    toast({
      title: 'JSON Yedeği İndirildi ✓',
      description: 'Tüm başvuru verilerinizin tam yedeği kaydedildi.',
    })
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
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Link
            href="/dashboard"
            data-tour="app-logo"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-extrabold text-xs tracking-wider shadow-2xs transition-transform group-hover:scale-105">
              GCX
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
                GCX
              </span>
              <span className="text-[11px] font-medium text-muted-foreground leading-tight hidden lg:block">
                Kariyer & Başvuru Yönetimi
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            <button
              onClick={() => setView('list')}
              data-tour="nav-applications"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
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
              data-tour="nav-resumes"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                view === 'resumes'
                  ? 'bg-background text-foreground shadow-sm font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              CV Havuzum
            </button>

            <button
              onClick={() => setView('jobs')}
              data-tour="nav-jobs"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                view === 'jobs'
                  ? 'bg-background text-foreground shadow-sm font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              İlan Radarı
            </button>

            <button
              onClick={() => setView('analytics')}
              data-tour="nav-analytics"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
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
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openGuideModal()}
            title="Kullanım Rehberi"
            data-tour="guide-button"
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground font-medium shrink-0"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden md:inline">Rehber</span>
          </Button>

          <div data-tour="header-actions" className="flex items-center gap-0.5 sm:gap-1">

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Temayı değiştir"
              className="h-8 w-8"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Export & Spreadsheet Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <Button
                variant={isExportMenuOpen ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                title="Dışa aktar: Excel, Google E-Tablolar, JSON"
                aria-expanded={isExportMenuOpen}
                className="h-8 w-8 relative"
              >
                <Download className="h-4 w-4" />
              </Button>

              {isExportMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl p-2 z-[60] animate-in fade-in zoom-in-95"
                  role="menu"
                >
                  <div className="px-2.5 py-2 border-b border-border/60">
                    <div className="text-xs font-bold text-foreground">Dışa Aktar & Tablolar</div>
                    <div className="text-[11px] text-muted-foreground">
                      Başvurularınızı istediğiniz formatta dışa aktarın ({applications?.length || 0} başvuru)
                    </div>
                  </div>

                  <div className="py-1 space-y-1">
                    {/* Excel Option */}
                    <button
                      onClick={handleExportExcel}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground">
                          Microsoft Excel (.xls)
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Renkli başlıklar, durum etiketleri ve okunaklı tablo formatı.
                        </div>
                      </div>
                    </button>

                    {/* Google Sheets CSV Option */}
                    <button
                      onClick={handleExportGoogleSheetsCsv}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Sheet className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground">
                          Google E-Tablolar (CSV)
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Google Drive ve E-Tablolar içe aktarmaya hazır dosya.
                        </div>
                      </div>
                    </button>

                    <div className="h-px bg-border/60 my-1" />

                    {/* JSON Backup Option */}
                    <button
                      onClick={handleExportBackupJson}
                      className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted text-left transition-colors cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Download className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground">
                          Tam Veri Yedeği (.json)
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          Tüm başvuru kayıtlarının tam JSON yedeği.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Çıkış yap"
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick CV Add Button */}
          <Button
            onClick={() => openResumeModal()}
            size="sm"
            variant="outline"
            data-tour="add-cv-btn"
            className="h-8 gap-1 text-xs border-primary/30 hover:border-primary/60 text-primary hidden md:inline-flex"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>CV Ekle</span>
          </Button>

          {/* Main Application Add Button */}
          <Button
            onClick={() => openModal()}
            size="sm"
            data-tour="add-application-btn"
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
