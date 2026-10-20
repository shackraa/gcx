'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useUIStore } from '@/lib/store/ui'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useTheme } from 'next-themes'
import { exportToStyledExcel } from '@/lib/utils/backup'
import { STATUS_LABELS } from '@/lib/utils/applications'
import { useToast } from '@/hooks/use-toast'
import type { Application } from '@/types'
import {
  Search,
  Plus,
  FileText,
  Sparkles,
  Briefcase,
  GraduationCap,
  BarChart2,
  LayoutList,
  Columns3,
  Sun,
  Moon,
  FileSpreadsheet,
  Wand2,
  RotateCcw,
  ArrowRight,
  Command,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  group: string
  label: string
  subtitle?: string
  shortcut?: string
  icon: React.ElementType
  badge?: string
  action: () => void
}

export function CommandPalette() {
  const {
    commandOpen,
    setCommandOpen,
    setView,
    setFilter,
    openModal,
    openResumeModal,
    uiMode,
    toggleUIMode,
    modalOpen,
    resumeModalOpen,
  } = useUIStore()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const applications = useQuery(api.applications.list) as Application[] | undefined

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep <html data-ui="..."> synced with uiMode
  useEffect(() => {
    document.documentElement.dataset.ui = uiMode
  }, [uiMode])

  // Global keyboard shortcuts (Cmd/Ctrl + K, Escape, plus quick keys when not in input)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(!commandOpen)
        return
      }

      if (commandOpen && e.key === 'Escape') {
        e.preventDefault()
        setCommandOpen(false)
        return
      }

      // Single-key shortcuts when no modal/input is active
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

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        openModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandOpen, setCommandOpen, openModal, modalOpen, resumeModalOpen])

  useEffect(() => {
    if (commandOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 20)
    }
  }, [commandOpen])

  const items = useMemo<CommandItem[]>(() => {
    const baseItems: CommandItem[] = [
      {
        id: 'toggle-ui-mode',
        group: 'Görünüm & Tasarım Modu',
        label:
          uiMode === 'award'
            ? 'Klasik UI Görünümüne Dön (Orijinal)'
            : 'Ödüllü UI Görünümüne Geç (High-Craft)',
        subtitle:
          uiMode === 'award'
            ? 'Tek tıkla önceki klasik arayüze geri dön'
            : 'Linear / Raycast standartlarında yeni arayüzü aktif et',
        shortcut: 'UI',
        icon: uiMode === 'award' ? RotateCcw : Wand2,
        badge: uiMode === 'award' ? 'Anlık Geçiş' : 'Önerilen',
        action: () => {
          const nextMode = uiMode === 'award' ? 'classic' : 'award'
          toggleUIMode()
          toast({
            title:
              nextMode === 'award'
                ? '✨ Ödüllü UI Aktif Edildi'
                : '🏛️ Klasik UI Görünümüne Dönüldü',
            description: 'İstediğin zaman üst bardan veya ⌘K menüsünden tekrar değiştirebilirsin.',
          })
        },
      },
      {
        id: 'new-app',
        group: 'Hızlı Aksiyonlar',
        label: 'Yeni Başvuru Ekle',
        subtitle: 'Şirket, pozisyon ve başvuru durumu kaydet',
        shortcut: 'N',
        icon: Plus,
        action: () => openModal(),
      },
      {
        id: 'new-cv',
        group: 'Hızlı Aksiyonlar',
        label: 'Yeni CV Versiyonu Yükle',
        subtitle: 'PDF CV ekle ve AI ile analiz et',
        icon: FileText,
        action: () => openResumeModal(),
      },
      {
        id: 'filter-overdue',
        group: 'Hızlı Aksiyonlar',
        label: 'Sessiz Bekleyen Başvuruları Göster',
        subtitle: 'Takip e-postası bekleyen başvuruları filtrele',
        icon: Clock,
        action: () => {
          setFilter('overdue')
          setView('list')
        },
      },
      {
        id: 'nav-list',
        group: 'Ekranlar & Navigasyon',
        label: 'Başvurularım — Liste Görünümü',
        subtitle: 'Tüm başvuruları detaylı kartlarla incele',
        icon: LayoutList,
        action: () => {
          setFilter('all')
          setView('list')
        },
      },
      {
        id: 'nav-kanban',
        group: 'Ekranlar & Navigasyon',
        label: 'Başvurularım — Kanban Panosu',
        subtitle: 'Sürükle-bırak aşama yönetimi',
        icon: Columns3,
        action: () => setView('kanban'),
      },
      {
        id: 'nav-resumes',
        group: 'Ekranlar & Navigasyon',
        label: 'CV Havuzum',
        subtitle: 'CV versiyonların, dönüş oranları ve Cover Letter’lar',
        icon: FileText,
        action: () => setView('resumes'),
      },
      {
        id: 'nav-studio',
        group: 'Ekranlar & Navigasyon',
        label: 'CV Stüdyosu (AI Tailor)',
        subtitle: 'İlana özel ATS uyumlu Harvard CV üret',
        icon: Sparkles,
        action: () => setView('studio'),
      },
      {
        id: 'nav-jobs',
        group: 'Ekranlar & Navigasyon',
        label: 'İlan Radarı',
        subtitle: 'CV’ne en uygun açık pozisyonları keşfet',
        icon: Briefcase,
        action: () => setView('jobs'),
      },
      {
        id: 'nav-programs',
        group: 'Ekranlar & Navigasyon',
        label: 'Staj & Kurumsal Programlar',
        subtitle: 'Yetenek programları, burslar ve stajlar',
        icon: GraduationCap,
        action: () => setView('programs'),
      },
      {
        id: 'nav-analytics',
        group: 'Ekranlar & Navigasyon',
        label: 'Kariyer Analizi & Dönüşüm Hunisi',
        subtitle: 'Momentum skoru, İK etkisi ve haftalık tempo',
        icon: BarChart2,
        action: () => setView('analytics'),
      },
      {
        id: 'toggle-theme',
        group: 'Tercihler & Dışa Aktarım',
        label: theme === 'dark' ? 'Aydınlık Temaya Geç (Light)' : 'Karanlık Temaya Geç (Dark)',
        subtitle: 'Göz konforuna göre renk temasını değiştir',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'export-excel',
        group: 'Tercihler & Dışa Aktarım',
        label: 'Başvuruları Excel (.xls) Olarak İndir',
        subtitle: 'Renkli ve biçimlendirilmiş tablo çıktısı al',
        icon: FileSpreadsheet,
        action: () => {
          if (applications && applications.length > 0) {
            exportToStyledExcel(applications)
            toast({ title: 'Excel Tablosu İndirildi ✓' })
          } else {
            toast({ title: 'Dışa aktarılacak başvuru bulunamadı' })
          }
        },
      },
    ]

    const appItems: CommandItem[] = (applications ?? []).slice(0, 15).map((app) => ({
      id: `app-${app._id}`,
      group: 'Başvurularım',
      label: `${app.company} — ${app.position}`,
      subtitle: `Durum: ${STATUS_LABELS[app.status] || app.status}`,
      icon: Briefcase,
      action: () => openModal(app._id),
    }))

    return [...baseItems, ...appItems]
  }, [uiMode, toggleUIMode, toast, openModal, openResumeModal, setFilter, setView, theme, setTheme, applications])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, 14)
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.group.toLowerCase().includes(q)
    )
  }, [items, query])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!commandOpen) return null

  function handleKeyNavigation(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0
      )
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault()
      const chosen = filteredItems[selectedIndex]
      setCommandOpen(false)
      chosen.action()
    }
  }

  // Group items for clean rendering
  const groups = Array.from(new Set(filteredItems.map((i) => i.group)))

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => setCommandOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-popover text-popover-foreground border border-border/90 rounded-2xl shadow-2xl overflow-hidden craft-surface animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyNavigation}
      >
        {/* Top Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70 bg-muted/20">
          <Search className="h-4 w-4 text-primary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Komut çalıştır, ekran değiştir veya şirket ara…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted rounded border border-border/80 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              &ldquo;{query}&rdquo; ile eşleşen bir komut veya başvuru bulunamadı.
            </div>
          ) : (
            groups.map((groupName) => {
              const groupEntries = filteredItems.filter((i) => i.group === groupName)
              return (
                <div key={groupName} className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {groupName}
                  </div>
                  {groupEntries.map((item) => {
                    const globalIdx = filteredItems.indexOf(item)
                    const isSelected = globalIdx === selectedIndex
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => {
                          setCommandOpen(false)
                          item.action()
                        }}
                        className={cn(
                          'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-left transition-all cursor-pointer',
                          isSelected
                            ? 'bg-primary/12 text-foreground ring-1 ring-primary/30'
                            : 'text-foreground/85 hover:bg-muted/60'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors',
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary/40 shadow-xs'
                                : 'bg-muted/70 text-muted-foreground border-border/60'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate flex items-center gap-2">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-semibold">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <div className="text-[11px] text-muted-foreground truncate">
                                {item.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-muted text-muted-foreground rounded border border-border/80">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ArrowRight
                            className={cn(
                              'h-3.5 w-3.5 transition-all',
                              isSelected ? 'opacity-100 translate-x-0 text-primary' : 'opacity-0 -translate-x-1'
                            )}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/70 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Command className="h-3 w-3 text-primary" />
              <strong className="font-semibold text-foreground">GCX Command</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Aktif Tasarım:{' '}
              <strong className="text-foreground">
                {uiMode === 'award' ? '✨ Ödüllü UI' : '🏛️ Klasik UI'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span>↑↓ Gezin</span>
            <span>•</span>
            <span>↵ Seç</span>
          </div>
        </div>
      </div>
    </div>
  )
}
