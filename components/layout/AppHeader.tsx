'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/store/ui'
import { useTourStore } from '@/lib/store/tour'
import { useState, useRef, useEffect } from 'react'
import {
  Plus,
  Download,
  Moon,
  Sun,
  LogOut,
  FileText,
  LayoutList,
  BarChart2,
  Briefcase,
  HelpCircle,
  FileSpreadsheet,
  Sheet,
  Sparkles,
  GraduationCap,
  Search,
  Wand2,
  RotateCcw,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { exportToStyledExcel, exportToGoogleSheetsCsv, exportBackup } from '@/lib/utils/backup'
import { useToast } from '@/hooks/use-toast'
import type { Application } from '@/types'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const { openModal, openResumeModal, view, setView, uiMode, toggleUIMode, setCommandOpen } = useUIStore()
  const { openGuideModal } = useTourStore()
  const { theme, setTheme } = useTheme()
  const applications = useQuery(api.applications.list) as Application[] | undefined
  const { signOut } = useAuthActions()
  const { toast } = useToast()
  const router = useRouter()
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const isAward = uiMode === 'award'

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

  function handleToggleUIMode() {
    const nextMode = uiMode === 'award' ? 'classic' : 'award'
    toggleUIMode()
    toast({
      title:
        nextMode === 'award'
          ? '✨ Ödüllü UI (High-Craft) Aktif'
          : '🏛️ Klasik UI (Orijinal) Aktif',
      description:
        nextMode === 'award'
          ? 'OKLCH yüzey katmanları, Bento metrikler ve ⌘K komut paleti devrede.'
          : 'İlk tasarım görünümüne geri dönüldü. İstediğin an tekrar değiştirebilirsin.',
    })
  }

  const isApplicationsView = view === 'list' || view === 'kanban'

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors',
        isAward
          ? 'border-border/70 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65'
          : 'border-border bg-background/80 backdrop-blur-sm'
      )}
    >
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <Link
            href="/dashboard"
            data-tour="app-logo"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs tracking-wider transition-all duration-200 group-hover:scale-105',
                isAward
                  ? 'bg-gradient-to-br from-primary via-indigo-500 to-violet-600 text-white shadow-sm ring-1 ring-white/20'
                  : 'bg-foreground text-background shadow-2xs'
              )}
            >
              GCX
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-foreground leading-tight">
                  GCX
                </span>
                {isAward && (
                  <span className="hidden xl:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold uppercase tracking-widest bg-primary/12 text-primary border border-primary/20">
                    PRO
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground leading-tight hidden 2xl:block">
                Kariyer & Başvuru Yönetimi
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav
            className={cn(
              'hidden sm:flex items-center gap-0.5 p-1 rounded-xl border transition-all',
              isAward
                ? 'bg-muted/50 border-border/70 shadow-2xs'
                : 'bg-muted/60 border-transparent rounded-lg gap-1'
            )}
          >
            <button
              onClick={() => setView('list')}
              data-tour="nav-applications"
              className={cn(
                'flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98]',
                isApplicationsView
                  ? isAward
                    ? 'bg-card text-foreground shadow-xs font-semibold ring-1 ring-border/80'
                    : 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutList className={cn('h-3.5 w-3.5', isApplicationsView && isAward && 'text-primary')} />
              Başvurularım
            </button>

            <button
              onClick={() => setView('resumes')}
              data-tour="nav-resumes"
              className={cn(
                'flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98]',
                view === 'resumes'
                  ? isAward
                    ? 'bg-card text-foreground shadow-xs font-semibold ring-1 ring-border/80'
                    : 'bg-background text-foreground shadow-sm font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              CV Havuzum
            </button>

            <button
              onClick={() => setView('studio')}
              data-tour="nav-studio"
              className={cn(
                'flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98]',
                view === 'studio'
                  ? isAward
                    ? 'bg-card text-foreground shadow-xs font-semibold ring-1 ring-border/80'
                    : 'bg-background text-foreground shadow-sm font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              CV Stüdyosu
            </button>

            <button
              onClick={() => setView('jobs')}
              data-tour="nav-jobs"
              className={cn(
                'flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98]',
                view === 'jobs'
                  ? isAward
                    ? 'bg-card text-foreground shadow-xs font-semibold ring-1 ring-border/80'
                    : 'bg-background text-foreground shadow-sm font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              İlan Radarı
            </button>

            <button
              onClick={() => setView('programs')}
              data-tour="nav-programs"
              className={cn(
                'flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98]',
                view === 'programs'
                  ? isAward
                    ? 'bg-card text-foreground shadow-xs font-semibold ring-1 ring-border/80'
                    : 'bg-background text-foreground shadow-sm font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <GraduationCap className="h-3.5 w-3.5 text-primary" />
              Staj & Kurumsal
            </button>

            <button
              onClick={() => setView('analytics')}
              data-tour="nav-analytics"
              className={cn(
                'flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer active:scale-[0.98]',
                view === 'analytics'
                  ? isAward
                    ? 'bg-card text-foreground shadow-xs font-semibold ring-1 ring-border/80'
                    : 'bg-background text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BarChart2 className={cn('h-3.5 w-3.5', view === 'analytics' && isAward && 'text-primary')} />
              Analiz
            </button>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 1-CLICK UI MODE SWITCHER (Ödüllü UI <-> Klasik UI) */}
          <button
            type="button"
            onClick={handleToggleUIMode}
            title={
              isAward
                ? 'Beğenmezsen tek tıkla önceki Klasik UI görünümüne dön'
                : 'Yeni Ödüllü UI (High-Craft) görünümüne geç'
            }
            className={cn(
              'h-8 px-2.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 shrink-0',
              isAward
                ? 'bg-primary/12 hover:bg-primary/20 text-primary border-primary/30 shadow-2xs'
                : 'bg-amber-500/12 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/35'
            )}
          >
            {isAward ? (
              <>
                <Wand2 className="h-3.5 w-3.5 shrink-0" />
                <span>Ödüllü UI</span>
                <span className="text-[9px] font-mono opacity-80 hidden lg:inline">· Klasik&apos;e Dön</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                <span>Klasik UI</span>
                <span className="text-[9px] font-mono opacity-85 hidden lg:inline">· Yeniye Geç</span>
              </>
            )}
          </button>

          {/* Command Palette Trigger (Cmd + K) */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            title="Hızlı Komut Paleti (Ctrl+K / ⌘K)"
            className="hidden lg:inline-flex items-center gap-2 h-8 px-2.5 rounded-lg bg-muted/60 hover:bg-muted border border-border/70 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer active:scale-95"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="text-[11px]">Komut...</span>
            <kbd className="px-1.5 py-0.2 text-[10px] font-mono font-semibold bg-background/80 text-muted-foreground rounded border border-border/80">
              ⌘K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => openGuideModal()}
            title="Kullanım Rehberi"
            data-tour="guide-button"
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground font-medium shrink-0"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden 2xl:inline">Rehber</span>
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
            className={cn(
              'h-8 gap-1.5 text-xs font-semibold',
              isAward && 'shadow-sm bg-primary text-primary-foreground hover:opacity-95'
            )}
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

