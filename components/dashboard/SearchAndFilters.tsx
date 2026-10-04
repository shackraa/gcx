'use client'

import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '@/lib/store/ui'
import { Search, ChevronDown, Check, FileText, Globe, X } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Resume } from '@/types'
import { cn } from '@/lib/utils'

const CHANNELS = [
  { value: 'all', label: 'Tüm Kanallar' },
  { value: 'online', label: 'Online İlan' },
  { value: 'email', label: 'E-posta' },
  { value: 'referral', label: 'Referans' },
  { value: 'form', label: 'Form' },
  { value: 'linkedin', label: 'LinkedIn' },
]

export function SearchAndFilters() {
  const { search, setSearch, channelFilter, setChannelFilter, resumeFilter, setResumeFilter } = useUIStore()
  const resumes = useQuery(api.resumes.list) as Resume[] | undefined

  const [isResumeOpen, setIsResumeOpen] = useState(false)
  const [isChannelOpen, setIsChannelOpen] = useState(false)

  const resumeRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resumeRef.current && !resumeRef.current.contains(event.target as Node)) {
        setIsResumeOpen(false)
      }
      if (channelRef.current && !channelRef.current.contains(event.target as Node)) {
        setIsChannelOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsResumeOpen(false)
        setIsChannelOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const selectedResume = resumes?.find((r) => r._id === resumeFilter)
  const selectedChannel = CHANNELS.find((c) => c.value === channelFilter)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Resume Filter Dropdown */}
      {resumes && resumes.length > 0 && (
        <div className="relative" ref={resumeRef}>
          <button
            type="button"
            onClick={() => {
              setIsResumeOpen((prev) => !prev)
              setIsChannelOpen(false)
            }}
            className={cn(
              'h-8 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer max-w-[160px]',
              resumeFilter !== 'all'
                ? 'border-primary/50 bg-primary/10 text-foreground font-semibold shadow-xs'
                : 'border-border/60 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
            title="CV'ye göre filtrele"
            aria-expanded={isResumeOpen}
          >
            <FileText className={cn('h-3.5 w-3.5 shrink-0', resumeFilter !== 'all' ? 'text-primary' : 'text-muted-foreground')} />
            <span className="truncate">
              {resumeFilter === 'all' ? "Tüm CV'ler" : selectedResume?.name || "CV Seçildi"}
            </span>
            <ChevronDown className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200', isResumeOpen && 'rotate-180')} />
          </button>

          {isResumeOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-60 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                CV Havuzu Filtresi
              </div>
              <div className="space-y-0.5 max-h-56 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setResumeFilter('all')
                    setIsResumeOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left',
                    resumeFilter === 'all'
                      ? 'bg-accent text-accent-foreground font-semibold'
                      : 'hover:bg-muted text-foreground/85'
                  )}
                >
                  <span>Tüm CV&apos;ler</span>
                  {resumeFilter === 'all' && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                </button>

                {resumes.map((r) => {
                  const isSelected = resumeFilter === r._id
                  return (
                    <button
                      key={r._id}
                      type="button"
                      onClick={() => {
                        setResumeFilter(r._id)
                        setIsResumeOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left',
                        isSelected
                          ? 'bg-accent text-accent-foreground font-semibold'
                          : 'hover:bg-muted text-foreground/85'
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate font-medium">{r.name}</span>
                        {(r.targetRole || r.category) && (
                          <span className="text-[10px] text-muted-foreground truncate">{r.targetRole || r.category}</span>
                        )}
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Channel Filter Dropdown */}
      <div className="relative hidden sm:block" ref={channelRef}>
        <button
          type="button"
          onClick={() => {
            setIsChannelOpen((prev) => !prev)
            setIsResumeOpen(false)
          }}
          className={cn(
            'h-8 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer',
            channelFilter !== 'all'
              ? 'border-primary/50 bg-primary/10 text-foreground font-semibold shadow-xs'
              : 'border-border/60 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground'
          )}
          title="Kanala göre filtrele"
          aria-expanded={isChannelOpen}
        >
          <Globe className={cn('h-3.5 w-3.5 shrink-0', channelFilter !== 'all' ? 'text-primary' : 'text-muted-foreground')} />
          <span>{selectedChannel?.label || 'Tüm Kanallar'}</span>
          <ChevronDown className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200', isChannelOpen && 'rotate-180')} />
        </button>

        {isChannelOpen && (
          <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-48 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Başvuru Kanalı
            </div>
            <div className="space-y-0.5">
              {CHANNELS.map((c) => {
                const isSelected = channelFilter === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setChannelFilter(c.value)
                      setIsChannelOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer text-left',
                      isSelected
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'hover:bg-muted text-foreground/85'
                    )}
                  >
                    <span>{c.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Şirket, pozisyon, CV…"
          className="h-8 pl-8 pr-7 text-xs bg-background border border-border/60 hover:border-border/90 rounded-lg w-40 sm:w-52 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground transition-all shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            title="Aramayı temizle"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
