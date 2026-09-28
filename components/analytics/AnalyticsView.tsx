'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Application } from '@/types'
import { STATUS_LABELS, CHANNEL_LABELS, isOverdue, getWeeklyData } from '@/lib/utils/applications'

interface AnalyticsViewProps {
  applications: Application[]
  overdueDays?: number
}

const STATUS_CHART_COLORS: Record<string, string> = {
  preparing: '#71717a',
  waiting: '#3b82f6',
  responded: '#8b5cf6',
  interview: '#f59e0b',
  offer: '#22c55e',
  rejected: '#ef4444',
}

export function AnalyticsView({ applications, overdueDays = 14 }: AnalyticsViewProps) {
  const total = applications.length
  if (total === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        Henüz analiz edilecek veri yok.
      </div>
    )
  }

  const responded = applications.filter((a) =>
    ['responded', 'interview', 'offer', 'rejected'].includes(a.status)
  ).length
  const responseRate = Math.round((responded / total) * 100)
  const overdueCount = applications.filter((a) => isOverdue(a, overdueDays)).length
  const hrContacted = applications.filter((a) => a.hrContacted).length
  const withInterviewDate = applications.filter((a) => a.interviewAt).length

  // Status distribution for bar chart
  const statusData = Object.keys(STATUS_LABELS).map((s) => ({
    name: STATUS_LABELS[s as keyof typeof STATUS_LABELS],
    count: applications.filter((a) => a.status === s).length,
    color: STATUS_CHART_COLORS[s] ?? '#666',
  })).filter((d) => d.count > 0)

  // Channel distribution
  const channelData = Object.keys(CHANNEL_LABELS)
    .map((key) => ({
      name: CHANNEL_LABELS[key],
      count: applications.filter((a) => a.channel === key).length,
    }))
    .filter((d) => d.count > 0)

  // Weekly data
  const weeklyData = getWeeklyData(applications, 8)

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Geri dönüş oranı', value: `${responseRate}%` },
          { label: 'Sessiz başvuru', value: overdueCount.toString() },
          { label: 'İK\'ya yazılan', value: hrContacted.toString() },
          { label: 'Mülakatı olan', value: withInterviewDate.toString() },
        ].map((m) => (
          <div key={m.label} className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-extrabold text-foreground">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Durum Dağılımı</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={80}
                tick={{ fontSize: 11, fill: '#888' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="count" radius={4}>
                {statusData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Distribution */}
        {channelData.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Kanal Dağılımı</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={channelData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, percent }) =>
                    `${name} ${Math.round((percent ?? 0) * 100)}%`
                  }
                  labelLine={false}
                >
                  {channelData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#0ea5e9'][i % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weekly Trend */}
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Haftalık Başvurular (Son 8 Hafta)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} margin={{ left: 0, right: 0 }}>
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#888' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
