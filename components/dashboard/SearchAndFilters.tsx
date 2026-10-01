'use client'

import { useUIStore } from '@/lib/store/ui'
import { Search } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Resume } from '@/types'

const CHANNELS = [
  { value: 'all', label: 'Tüm kanallar' },
  { value: 'online', label: 'Online ilan' },
  { value: 'email', label: 'E-posta' },
  { value: 'referral', label: 'Referans' },
  { value: 'form', label: 'Form' },
  { value: 'linkedin', label: 'LinkedIn' },
]

export function SearchAndFilters() {
  const { search, setSearch, channelFilter, setChannelFilter, resumeFilter, setResumeFilter } = useUIStore()
  const resumes = useQuery(api.resumes.list) as Resume[] | undefined

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Resume Filter */}
      {resumes && resumes.length > 0 && (
        <select
          value={resumeFilter}
          onChange={(e) => setResumeFilter(e.target.value)}
          className="h-8 text-xs bg-muted border-0 rounded-md px-2 text-muted-foreground focus:ring-0 cursor-pointer max-w-[150px] truncate"
          title="CV'ye göre filtrele"
        >
          <option value="all">Tüm CV&apos;ler</option>
          {resumes.map((r) => (
            <option key={r._id} value={r._id}>
              📄 {r.name}
            </option>
          ))}
        </select>
      )}

      {/* Channel Filter */}
      <select
        value={channelFilter}
        onChange={(e) => setChannelFilter(e.target.value)}
        className="h-8 text-xs bg-muted border-0 rounded-md px-2 text-muted-foreground focus:ring-0 cursor-pointer hidden sm:block"
      >
        {CHANNELS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Şirket, pozisyon, CV…"
          className="h-8 pl-8 pr-3 text-xs bg-muted border-0 rounded-md w-40 sm:w-52 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
