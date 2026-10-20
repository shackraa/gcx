'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUIStore } from '@/lib/store/ui'
import { useTourStore } from '@/lib/store/tour'
import { useTheme } from 'next-themes'
import { exportToStyledExcel, exportToGoogleSheetsCsv, exportBackup } from '@/lib/utils/backup'
import { getThisWeekApps, isOverdue } from '@/lib/utils/applications'
import { useToast } from '@/hooks/use-toast'
import type { Application, Resume, ViewMode } from '@/types'
import {
  LayoutList,
  Columns3,
  FileText,
  Sparkles,
  Briefcase,
  GraduationCap,
  BarChart2,
  Plus,
  Search,
  Sun,
  Moon,
  Download,
  LogOut,
  HelpCircle,
  RotateCcw,
  FileSpreadsheet,
  Sheet,
  Target,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const VIEW_META: Record<
  ViewMode,
  {
    title: string
    editorialSubtitle: string
    badge: string
  }
> = {
  list: {
    title: 'Başvuru Komuta Merkezi',
    editorialSubtitle: 'Aktif süreçler, sessiz kalan başvurular ve aşama takibi',
    badge: 'PIPELINE',
  },
  kanban: {
    title: 'Kanban Süreç Panosu',
    editorialSubtitle: 'Sürükle-bırak aşama yönetimi ve görsel akış',
    badge: 'KANBAN',
  },
  resumes: {
    title: 'CV Havuzu & Versiyonlar',
    editorialSubtitle: 'Pozisyona özel özgeçmişler, dönüşüm oranları ve önyazılar',
    badge: 'ASSETS',
  },
  studio: {
    title: 'AI CV Stüdyosu',
    editorialSubtitle: 'İlana özel ATS optimizasyonu ve Harvard şablon motoru',
    badge: 'AI STUDIO',
  },
  jobs: {
    title: 'Otonom İlan Radarı',
    editorialSubtitle: 'CV yeteneklerinle eşleşen canlı pozisyonlar ve akıllı filtreleme',
    badge: 'LIVE RADAR',
  },
  programs: {
    title: 'Staj, Burs & Kurumsal Programlar',
    editorialSubtitle: 'Yetenek programları, yeni mezun ilanları ve eğitim bursları',
    badge: 'PROGRAMS',
  },
  analytics: {
    title: 'Kariyer Pusulası & Analitik',
    editorialSubtitle: 'Dönüşüm hunisi, İK çarpan etkisi ve haftalık momentum',
    badge: 'TELEMETRY',
  },
}

export function AwardShell({ children }: { children: React.ReactNode }) {
  const {
    view,
    setView,
    openModal,
    openResumeModal,
    toggleUIMode,
    setCommandOpen,
    commandOpen,
    modalOpen,
    resumeModalOpen,
  } = useUIStore()
  const { openGuideModal } = useTourStore()
  const { theme, setTheme } = useTheme()
  const { signOut } = useAuthActions()
  const { toast } = useToast()
  const router = useRouter()

  const applications = useQuery(api.applications.list) as Application[] | undefined
  const resumes = useQuery(api.resumes.list) as Resume[] | undefined
  const scoutedJobs = useQuery(api.scoutedJobs.list)
  const settings = useQuery(api.settings.get)
  const aiUsage = useQuery(api.aiUsage.getStatus)

  const [collapsed, setCollapsed] = useState(false)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const overdueDays = settings?.overdueDays ?? 14
  const weeklyGoal = settings?.weeklyGoal ?? 5
  const appsList = applications ?? []
  const thisWeekCount = getThisWeekApps(appsList).length
  const overdueCount = appsList.filter((a) => isOverdue(a, overdueDays)).length
  const weeklyPct = Math.min(100, Math.round((thisWeekCount / Math.max(1, weeklyGoal)) * 100))

  // Number keys 1..6 for instant screen switching (Linear / Raycast style)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      if (isEditable || commandOpen || modalOpen || resumeModalOpen || e.metaKey || e.ctrlKey || e.altKey) {
        return
      }
      const keyMap: Record<string, ViewMode> = {
        '1': 'list',
        '2': 'resumes',
        '3': 'studio',
        '4': 'jobs',
        '5': 'programs',
        '6': 'analytics',
      }
      if (keyMap[e.key]) {
        e.preventDefault()
        setView(keyMap[e.key])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setView, commandOpen, modalOpen, resumeModalOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false)
      }
    }
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExportMenuOpen])

  function handleSwitchToClassic() {
    toggleUIMode()
    toast({
      title: '🏛️ Klasik UI (Orijinal) Aktif',
      description: 'Önceki üst bar tasarımına dönüldü. Üst bardaki butondan tekrar Ödüllü UI’a geçebilirsin.',
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
  const meta = VIEW_META[view] || VIEW_META.list

  const navGroups: Array<{
    label: string
    items: Array<{
      id: ViewMode
      active: boolean
      label: string
      icon: React.ElementType
      count?: number
      alertCount?: number
      pill?: string
      shortcut: string
      tour: string
    }>
  }> = [
    {
      label: 'ÇALIŞMA ALANI',
      items: [
        {
          id: 'list' as ViewMode,
          active: isApplicationsView,
          label: 'Başvurularım',
          icon: LayoutList,
          count: appsList.length,
          alertCount: overdueCount,
          shortcut: '1',
          tour: 'nav-applications',
        },
        {
          id: 'resumes' as ViewMode,
          active: view === 'resumes',
          label: 'CV Havuzum',
          icon: FileText,
          count: resumes?.length ?? 0,
          shortcut: '2',
          tour: 'nav-resumes',
        },
        {
          id: 'studio' as ViewMode,
          active: view === 'studio',
          label: 'CV Stüdyosu',
          icon: Sparkles,
          pill: 'AI',
          shortcut: '3',
          tour: 'nav-studio',
        },
      ],
    },
    {
      label: 'KEŞİF & FIRSATLAR',
      items: [
        {
          id: 'jobs' as ViewMode,
          active: view === 'jobs',
          label: 'İlan Radarı',
          icon: Briefcase,
          count: scoutedJobs?.length ?? 0,
          shortcut: '4',
          tour: 'nav-jobs',
        },
        {
          id: 'programs' as ViewMode,
          active: view === 'programs',
          label: 'Staj & Kurumsal',
          icon: GraduationCap,
          shortcut: '5',
          tour: 'nav-programs',
        },
      ],
    },
    {
      label: 'STRATEJİ & VERİ',
      items: [
        {
          id: 'analytics' as ViewMode,
          active: view === 'analytics',
          label: 'Kariyer Analizi',
          icon: BarChart2,
          shortcut: '6',
          tour: 'nav-analytics',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row selection:bg-primary/20">
      {/* =====================================================================
          LEFT SPATIAL COMMAND RAIL (Desktop Sidebar)
          ===================================================================== */}
      <aside
        className={cn(
          'hidden lg:flex flex-col justify-between shrink-0 select-none transition-all duration-200 ease-out pt-3 pb-3 pl-3 pr-1',
          collapsed ? 'w-[72px]' : 'w-[256px]'
        )}
      >
        <div className="space-y-3">
          {/* Top Brand + Collapse Button */}
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <button
              type="button"
              onClick={() => setView('list')}
              data-tour="app-logo"
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-indigo-500 to-violet-600 text-white flex items-center justify-center font-mono font-extrabold text-xs tracking-wider shadow-md ring-1 ring-white/25 shrink-0 group-hover:scale-105 transition-transform">
                GCX
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold tracking-tight text-foreground">
                      GCX
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-primary/15 text-primary border border-primary/25">
                      OS 2.6
                    </span>
                  </div>
                  <p className="text-[11px] font-serif italic text-muted-foreground truncate">
                    Career Command System
                  </p>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt'}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer shrink-0"
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>

          {/* ⌘K Command Palette Trigger Bar */}
          <div className="px-1">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              title="Komut Paleti ve Hızlı Arama (⌘K / Ctrl+K)"
              className={cn(
                'w-full flex items-center justify-between gap-2 h-9 px-2.5 rounded-xl bg-card/80 hover:bg-card border border-border/80 hover:border-primary/40 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer craft-surface',
                collapsed && 'justify-center px-0'
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="h-3.5 w-3.5 text-primary shrink-0" />
                {!collapsed && <span className="text-[11px]">Komut veya arama…</span>}
              </span>
              {!collapsed && (
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-muted text-muted-foreground rounded border border-border/80">
                  ⌘K
                </kbd>
              )}
            </button>
          </div>

          {/* Quick Primary Actions Row */}
          {!collapsed ? (
            <div className="grid grid-cols-2 gap-1.5 px-1">
              <button
                type="button"
                onClick={() => openModal()}
                data-tour="add-application-btn"
                className="h-8 px-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-95 text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Başvuru</span>
                <kbd className="ml-0.5 text-[9px] font-mono opacity-80 bg-black/15 px-1 rounded">
                  N
                </kbd>
              </button>
              <button
                type="button"
                onClick={() => openResumeModal()}
                data-tour="add-cv-btn"
                className="h-8 px-2.5 rounded-xl bg-card hover:bg-muted border border-border/80 text-foreground text-[11px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer craft-surface"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
                <span>CV Yükle</span>
              </button>
            </div>
          ) : (
            <div className="px-1 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => openModal()}
                title="Yeni Başvuru Ekle (N)"
                className="h-9 w-full rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation Groups */}
          <div className="space-y-4 pt-1 px-1">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <div className="px-2 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/70">
                    {group.label}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-tour={item.tour}
                        onClick={() => setView(item.id)}
                        title={`${item.label} (Kısayol: ${item.shortcut})`}
                        className={cn(
                          'relative w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer group active:scale-[0.98]',
                          item.active
                            ? 'text-foreground font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent',
                          collapsed && 'justify-center px-0'
                        )}
                      >
                        {item.active && (
                          <motion.div
                            layoutId="award-nav-active-pill"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-xl bg-card border border-border/90 craft-surface -z-0"
                          />
                        )}
                        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                              item.active
                                ? 'bg-primary text-primary-foreground shadow-2xs'
                                : 'bg-muted/70 text-muted-foreground group-hover:text-foreground'
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!collapsed && (
                          <div className="relative z-10 flex items-center gap-1.5 shrink-0">
                            {item.alertCount ? (
                              <span
                                title={`${item.alertCount} sessiz başvuru`}
                                className="w-2 h-2 rounded-full bg-red-500 animate-pulse"
                              />
                            ) : null}
                            {item.pill && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-primary/15 text-primary border border-primary/25">
                                {item.pill}
                              </span>
                            )}
                            {typeof item.count === 'number' && (
                              <span
                                className={cn(
                                  'px-1.5 py-0.2 rounded-md text-[10px] font-mono font-semibold tabular-nums',
                                  item.active
                                    ? 'bg-primary/12 text-primary'
                                    : 'bg-muted/80 text-muted-foreground'
                                )}
                              >
                                {item.count}
                              </span>
                            )}
                            <kbd className="hidden xl:inline-block text-[9px] font-mono text-muted-foreground/50 group-hover:text-muted-foreground">
                              {item.shortcut}
                            </kbd>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Telemetry & Controls */}
        <div className="space-y-2.5 px-1">
          {!collapsed && (
            <div className="rounded-2xl bg-card/90 border border-border/80 p-3 space-y-2.5 craft-surface">
              {/* Weekly Goal Mini Widget */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    Haftalık Tempo
                  </span>
                  <span className="font-mono font-bold text-foreground tabular-nums">
                    {thisWeekCount}/{weeklyGoal}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: Math.min(8, Math.max(1, weeklyGoal)) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        i < thisWeekCount ? 'bg-primary' : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* AI Quota Mini Bar */}
              {aiUsage && (
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    Günlük AI Kredisi
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {aiUsage.remaining}/50
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Switch to Classic UI Button */}
          <button
            type="button"
            onClick={handleSwitchToClassic}
            title="Tek tıkla önceki Klasik UI görünümüne geri dön"
            className={cn(
              'w-full h-8 px-2.5 rounded-xl border border-border/80 bg-card/60 hover:bg-card text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center justify-between transition-all cursor-pointer',
              collapsed && 'justify-center px-0'
            )}
          >
            <span className="flex items-center gap-1.5 truncate">
              <RotateCcw className="h-3.5 w-3.5 text-primary shrink-0" />
              {!collapsed && <span>Klasik UI&apos;a Dön</span>}
            </span>
            {!collapsed && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                1-Tık
              </span>
            )}
          </button>

          {/* Utility Footer Bar */}
          <div
            data-tour="header-actions"
            className={cn(
              'flex items-center justify-between gap-1 pt-1 px-1',
              collapsed && 'flex-col'
            )}
          >
            <button
              type="button"
              onClick={() => openGuideModal()}
              data-tour="guide-button"
              title="Kullanım Rehberi"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Temayı Değiştir"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Export Menu */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                title="Dışa Aktar (Excel / CSV / JSON)"
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-64 bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl p-2 z-50 craft-surface animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 border-b border-border/60 text-xs font-bold">
                    Dışa Aktar ({appsList.length} Başvuru)
                  </div>
                  <div className="py-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (appsList.length > 0) exportToStyledExcel(appsList)
                        setIsExportMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted text-left text-xs font-medium cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Microsoft Excel (.xls)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (appsList.length > 0) exportToGoogleSheetsCsv(appsList)
                        setIsExportMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted text-left text-xs font-medium cursor-pointer"
                    >
                      <Sheet className="h-4 w-4 text-green-500 shrink-0" />
                      <span>Google E-Tablolar (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (appsList.length > 0) exportBackup(appsList)
                        setIsExportMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted text-left text-xs font-medium cursor-pointer"
                    >
                      <Download className="h-4 w-4 text-primary shrink-0" />
                      <span>Tam Veri Yedeği (.json)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Çıkış Yap"
              className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          INSET ELEVATED WORKSPACE CANVAS (Linear / Arc Spatial Frame)
          ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0 lg:py-2.5 lg:pr-2.5">
        <div className="flex-1 flex flex-col bg-card/75 dark:bg-card/65 backdrop-blur-xl lg:border border-border/85 lg:rounded-[22px] craft-surface overflow-hidden">
          {/* Top Contextual Workspace Bar */}
          <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 shrink-0">
                {meta.badge}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2.5">
                  <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">
                    {meta.title}
                  </h1>
                  <span className="hidden xl:inline text-xs font-serif italic text-muted-foreground truncate">
                    — {meta.editorialSubtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Context Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* View Switcher directly in Context Bar when on Applications */}
              {isApplicationsView && (
                <div className="flex items-center bg-muted/70 p-0.5 rounded-xl border border-border/70">
                  <button
                    type="button"
                    onClick={() => setView('list')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer',
                      view === 'list'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Liste</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('kanban')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-medium transition-all cursor-pointer',
                      view === 'kanban'
                        ? 'bg-card text-foreground shadow-2xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Columns3 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Kanban</span>
                  </button>
                </div>
              )}

              {/* Instant UI Mode Switcher in Top Context Bar too */}
              <button
                type="button"
                onClick={handleSwitchToClassic}
                title="Beğenmezsen tek tıkla önceki Klasik UI görünümüne dön"
                className="h-8 px-2.5 rounded-xl text-[11px] font-semibold inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/18 text-primary border border-primary/25 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Klasik UI&apos;a Dön</span>
              </button>

              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="lg:hidden h-8 w-8 rounded-xl border border-border/80 bg-card flex items-center justify-center text-muted-foreground hover:text-foreground"
                title="Komut Paleti"
              >
                <Search className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => openModal()}
                className="h-8 px-3 rounded-xl bg-primary text-primary-foreground hover:opacity-95 text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Yeni Başvuru</span>
              </button>
            </div>
          </header>

          {/* Main Scrollable Workspace Content */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-28 lg:pb-14 pt-4 sm:pt-5 max-w-[1520px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
