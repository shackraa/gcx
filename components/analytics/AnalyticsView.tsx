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
  Legend,
} from 'recharts'
import type { Application, Resume } from '@/types'
import { STATUS_LABELS, CHANNEL_LABELS, isOverdue, getWeeklyData, getResumeStats } from '@/lib/utils/applications'
import { FileText, TrendingUp, Award } from 'lucide-react'

interface AnalyticsViewProps {
  applications: Application[]
  resumes?: Resume[]
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

export function AnalyticsView({ applications, resumes = [], overdueDays = 14 }: AnalyticsViewProps) {
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

  // Resume performance data
  const resumeStats = getResumeStats(applications, resumes)
  const activeResumeStats = resumeStats.filter((s) => s.count > 0)
  const bestResume = activeResumeStats.length > 0
    ? [...activeResumeStats].sort((a, b) => b.responseRate - a.responseRate)[0]
    : null

  const resumeChartData = activeResumeStats.map((s) => ({
    name: s.resume.name.length > 15 ? s.resume.name.slice(0, 15) + '…' : s.resume.name,
    'Toplam Başvuru': s.count,
    'Dönüş Sayısı': s.respondedCount,
    'Dönüş Oranı (%)': s.responseRate,
  }))

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

      {/* CV Performance Section (if resumes exist) */}
      {resumes.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                CV Performans ve Başarı Oranları
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hangi CV versiyonunun kaç başvuru aldığı ve ne oranda geri dönüş sağladığı
              </p>
            </div>

            {bestResume && bestResume.count >= 2 && (
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full self-start sm:self-auto">
                <Award className="h-3.5 w-3.5" />
                <span>En Yüksek Başarı: {bestResume.resume.name} (%{bestResume.responseRate})</span>
              </div>
            )}
          </div>

          {activeResumeStats.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* CV Chart */}
              <div className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={resumeChartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#1c1c1c', border: '1px solid #333', borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="Toplam Başvuru" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Dönüş Sayısı" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* CV Ranking List */}
              <div className="space-y-2.5 flex flex-col justify-center">
                {resumeStats.map(({ resume, count, respondedCount, responseRate }) => (
                  <div
                    key={resume._id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-foreground truncate">{resume.name}</div>
                      <div className="text-[11px] text-muted-foreground">{resume.category}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-primary">
                        {count > 0 ? `%${responseRate}` : '0 başvuru'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {count > 0 ? `${respondedCount}/${count} dönüş` : 'Henüz kullanılmadı'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-6">
              Henüz başvurularınızda kayıtlı bir CV seçilmedi. Başvuru eklerken veya düzenlerken ilgili CV&apos;yi seçerek buradaki performans verilerini oluşturabilirsiniz.
            </p>
          )}
        </div>
      )}

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
