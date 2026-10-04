'use client'

import { useUIStore } from '@/lib/store/ui'
import { LayoutList, FileText, Briefcase, BarChart2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const { view, setView, openModal } = useUIStore()

  const isApplicationsView = view === 'list' || view === 'kanban'

  return (
    <nav
      aria-label="Mobil Navigasyon"
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-background/95 backdrop-blur-xl border-t border-border/80 px-2 pt-1 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-lg transition-transform"
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* 1. Başvurularım */}
        <button
          type="button"
          onClick={() => setView('list')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 cursor-pointer relative',
            isApplicationsView
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="relative">
            <LayoutList className="h-5 w-5" />
            {isApplicationsView && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </div>
          <span className="mt-0.5">Başvurular</span>
        </button>

        {/* 2. CV Havuzu */}
        <button
          type="button"
          onClick={() => setView('resumes')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 cursor-pointer relative',
            view === 'resumes'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="relative">
            <FileText className="h-5 w-5" />
            {view === 'resumes' && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </div>
          <span className="mt-0.5">CV Havuzu</span>
        </button>

        {/* 3. Center: Hızlı Başvuru Ekle (Floating Hero Action) */}
        <button
          type="button"
          onClick={() => openModal()}
          title="Yeni Başvuru Ekle"
          className="flex flex-col items-center justify-center -mt-4 p-2 bg-primary text-primary-foreground rounded-full shadow-lg ring-4 ring-background active:scale-90 transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          <span className="sr-only">Yeni Başvuru Ekle</span>
        </button>

        {/* 4. İlan Radarı */}
        <button
          type="button"
          onClick={() => setView('jobs')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 cursor-pointer relative',
            view === 'jobs'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="relative">
            <Briefcase className="h-5 w-5" />
            {view === 'jobs' && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </div>
          <span className="mt-0.5">İlan Radarı</span>
        </button>

        {/* 5. Analiz */}
        <button
          type="button"
          onClick={() => setView('analytics')}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all active:scale-95 cursor-pointer relative',
            view === 'analytics'
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="relative">
            <BarChart2 className="h-5 w-5" />
            {view === 'analytics' && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </div>
          <span className="mt-0.5">Analiz</span>
        </button>
      </div>
    </nav>
  )
}
