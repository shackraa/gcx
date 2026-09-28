'use client'

import { useUIStore } from '@/lib/store/ui'
import { Search } from 'lucide-react'

const CHANNELS = [
  { value: 'all', label: 'Tüm kanallar' },
  { value: 'online', label: 'Online ilan' },
  { value: 'email', label: 'E-posta' },
  { value: 'referral', label: 'Referans' },
  { value: 'form', label: 'Form' },
  { value: 'linkedin', label: 'LinkedIn' },
]

export function SearchAndFilters() {
  const { search, setSearch, channelFilter, setChannelFilter } = useUIStore()

  return (
    <div className="flex items-center gap-2">
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

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Şirket veya pozisyon…"
          className="h-8 pl-8 pr-3 text-xs bg-muted border-0 rounded-md w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
