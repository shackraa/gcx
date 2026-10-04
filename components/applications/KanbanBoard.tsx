'use client'

import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { Application, ApplicationStatus } from '@/types'
import { STATUS_LABELS, STATUS_COLORS, isOverdue, daysSinceApplied } from '@/lib/utils/applications'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUIStore } from '@/lib/store/ui'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { Id } from '@/convex/_generated/dataModel'

const COLUMNS: ApplicationStatus[] = [
  'preparing', 'waiting', 'responded', 'interview', 'offer', 'rejected'
]

interface KanbanBoardProps {
  applications: Application[]
  search: string
}

function KanbanCard({ app }: { app: Application }) {
  const { openModal } = useUIStore()
  const overdue = isOverdue(app)
  const days = daysSinceApplied(app)

  return (
    <button
      onClick={() => openModal(app._id)}
      className={cn(
        'w-full text-left bg-card border rounded-lg px-3 py-2.5 space-y-1 transition-all hover:border-border/80 active:scale-[0.98] cursor-pointer shadow-2xs',
        overdue ? 'border-red-200 bg-red-50/70 dark:border-red-800 dark:bg-red-950/20' : 'border-border'
      )}
    >
      <div className="font-semibold text-xs text-foreground leading-tight">{app.company}</div>
      <div className="text-[11px] text-muted-foreground">{app.position}</div>
      <div className="flex items-center gap-2 pt-0.5">
        {days !== null && (
          <span className={cn('text-[10px] font-medium', overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground/70')}>
            {days}g önce
          </span>
        )}
        {overdue && (
          <span className="text-[10px] text-red-600 dark:text-red-400 font-medium inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 inline-block" />
            Sessiz
          </span>
        )}
        {app.hrContacted && <span className="text-[10px] text-emerald-600 dark:text-green-400 font-medium">✓ İK</span>}
      </div>
    </button>
  )
}

const DEMO_KANBAN_APPS: Application[] = [
  {
    _id: 'demo-k-1' as any,
    _creationTime: Date.now(),
    userId: 'demo-user',
    company: 'Alpha Teknoloji (Örnek)',
    position: 'Frontend Developer',
    status: 'preparing',
    appliedAt: '',
    channel: 'linkedin',
    hrContacted: false,
  },
  {
    _id: 'demo-k-2' as any,
    _creationTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    userId: 'demo-user',
    company: 'Beta Yazılım (Örnek)',
    position: 'Fullstack Engineer',
    status: 'waiting',
    appliedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    channel: 'online',
    hrContacted: true,
  },
  {
    _id: 'demo-k-3' as any,
    _creationTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    userId: 'demo-user',
    company: 'Gamma Bilişim (Örnek)',
    position: 'Senior Web Engineer',
    status: 'interview',
    appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    interviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    channel: 'linkedin',
    hrContacted: true,
  },
  {
    _id: 'demo-k-4' as any,
    _creationTime: Date.now() - 12 * 24 * 60 * 60 * 1000,
    userId: 'demo-user',
    company: 'Delta Cloud (Örnek)',
    position: 'React Specialist',
    status: 'offer',
    appliedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    channel: 'referral',
    hrContacted: true,
  },
]

export function KanbanBoard({ applications, search }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [showDemoKanban, setShowDemoKanban] = useState(true)
  const updateMutation = useMutation(api.applications.update)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const isDemo = applications.length === 0 && showDemoKanban
  const appsToDisplay = isDemo ? DEMO_KANBAN_APPS : applications

  const filtered = search
    ? appsToDisplay.filter(
        (a) =>
          a.company.toLowerCase().includes(search.toLowerCase()) ||
          a.position.toLowerCase().includes(search.toLowerCase())
      )
    : appsToDisplay

  const draggingApp = draggingId ? appsToDisplay.find((a) => a._id === draggingId) : null

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDraggingId(null)

    if (!over) return
    const newStatus = over.id as ApplicationStatus
    const app = appsToDisplay.find((a) => a._id === active.id)

    if (app && app.status !== newStatus) {
      if (isDemo) {
        toast({ title: `${app.company} → ${STATUS_LABELS[newStatus]} (Örnek Kart Taşındı)` })
        return
      }
      try {
        await updateMutation({
          id: app._id as Id<'applications'>,
          status: newStatus,
        })
        toast({ title: `${app.company} → ${STATUS_LABELS[newStatus]} ✓` })
      } catch {
        toast({ title: 'Güncellenemedi', variant: 'destructive' })
      }
    }
  }

  return (
    <div data-tour="kanban-board-section" className="space-y-3">
      {applications.length === 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-card border border-border/80 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Örnek Gösterim
            </span>
            <span className="text-muted-foreground">
              Henüz başvuru eklemediğiniz için panonun işleyişini gösteren örnek kartlar listeleniyor. Kartları sütunlar arasında sürükleyebilirsiniz.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoKanban(!showDemoKanban)}
            className="text-xs text-primary hover:underline font-medium self-start sm:self-auto cursor-pointer shrink-0"
          >
            {showDemoKanban ? 'Örnek Kartları Gizle' : 'Örnek Kartları Göster'}
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setDraggingId(String(e.active.id))}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0 scroll-smooth touch-pan-x">
          {COLUMNS.map((status) => {
            const colApps = filtered.filter((a) => a.status === status)
            return (
              <KanbanColumn
                key={status}
                status={status}
                apps={colApps}
              />
            )
          })}
        </div>

        <DragOverlay>
          {draggingApp && (
            <div className="w-52 opacity-90 rotate-1">
              <KanbanCard app={draggingApp} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

function KanbanColumn({
  status,
  apps,
}: {
  status: ApplicationStatus
  apps: Application[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="shrink-0 w-52">
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', STATUS_COLORS[status])}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-[11px] text-muted-foreground font-medium">{apps.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-24 space-y-2 p-1 rounded-xl transition-colors',
          isOver ? 'bg-muted/60 ring-2 ring-primary/30' : 'bg-transparent'
        )}
      >
        {apps.map((app) => (
          <KanbanDraggableCard key={app._id} app={app} />
        ))}
      </div>
    </div>
  )
}

function KanbanDraggableCard({ app }: { app: Application }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app._id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn('touch-none', isDragging && 'opacity-30')}
    >
      <KanbanCard app={app} />
    </div>
  )
}
