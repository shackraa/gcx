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
        'w-full text-left bg-card border rounded-lg px-3 py-2.5 space-y-1 transition-all hover:border-border/80 active:scale-[0.98]',
        overdue ? 'border-red-800 bg-red-950/20' : 'border-border'
      )}
    >
      <div className="font-semibold text-xs text-foreground leading-tight">{app.company}</div>
      <div className="text-[11px] text-muted-foreground">{app.position}</div>
      <div className="flex items-center gap-2 pt-0.5">
        {days !== null && (
          <span className={cn('text-[10px] font-medium', overdue ? 'text-red-400' : 'text-muted-foreground/70')}>
            {days}g önce
          </span>
        )}
        {overdue && <span className="text-[10px] text-red-400">🔴 Sessiz</span>}
        {app.hrContacted && <span className="text-[10px] text-green-500">✓ İK</span>}
      </div>
    </button>
  )
}

export function KanbanBoard({ applications, search }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const updateMutation = useMutation(api.applications.update)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const filtered = search
    ? applications.filter(
        (a) =>
          a.company.toLowerCase().includes(search.toLowerCase()) ||
          a.position.toLowerCase().includes(search.toLowerCase())
      )
    : applications

  const draggingApp = draggingId ? applications.find((a) => a._id === draggingId) : null

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setDraggingId(null)

    if (!over) return
    const newStatus = over.id as ApplicationStatus
    const app = applications.find((a) => a._id === active.id)

    if (app && app.status !== newStatus) {
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => setDraggingId(String(e.active.id))}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
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
