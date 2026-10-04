'use client'

import { useState } from 'react'
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

const DEMO_ANALYTICS_APPS: Application[] = [
  { _id: 'd1' as any, _creationTime: Date.now() - 14 * 86400000, userId: 'demo-user', company: 'Google', position: 'Frontend Eng', status: 'offer', appliedAt: '2026-03-01', channel: 'linkedin', hrContacted: true, resumeId: 'r1' as any, cvVersion: 'Frontend CV' },
  { _id: 'd2' as any, _creationTime: Date.now() - 10 * 86400000, userId: 'demo-user', company: 'Spotify', position: 'Web Dev', status: 'interview', appliedAt: '2026-03-05', interviewAt: '2026-03-25', channel: 'linkedin', hrContacted: true, resumeId: 'r1' as any, cvVersion: 'Frontend CV' },
  { _id: 'd3' as any, _creationTime: Date.now() - 18 * 86400000, userId: 'demo-user', company: 'Trendyol', position: 'React Dev', status: 'responded', appliedAt: '2026-02-28', channel: 'online', hrContacted: true, resumeId: 'r1' as any, cvVersion: 'Frontend CV' },
  { _id: 'd4' as any, _creationTime: Date.now() - 16 * 86400000, userId: 'demo-user', company: 'Getir', position: 'Frontend Lead', status: 'waiting', appliedAt: '2026-02-20', channel: 'linkedin', hrContacted: false, resumeId: 'r1' as any, cvVersion: 'Frontend CV' },
  { _id: 'd5' as any, _creationTime: Date.now() - 5 * 86400000, userId: 'demo-user', company: 'Peak Games', position: 'Fullstack Eng', status: 'interview', appliedAt: '2026-03-10', interviewAt: '2026-03-28', channel: 'referral', hrContacted: true, resumeId: 'r2' as any, cvVersion: 'Fullstack CV' },
  { _id: 'd6' as any, _creationTime: Date.now() - 8 * 86400000, userId: 'demo-user', company: 'Dream Games', position: 'Software Eng', status: 'rejected', appliedAt: '2026-03-02', channel: 'referral', hrContacted: false, resumeId: 'r2' as any, cvVersion: 'Fullstack CV' },
  { _id: 'd7' as any, _creationTime: Date.now() - 2 * 86400000, userId: 'demo-user', company: 'Insider', position: 'UI Specialist', status: 'waiting', appliedAt: '2026-03-12', channel: 'linkedin', hrContacted: false, resumeId: 'r1' as any, cvVersion: 'Frontend CV' },
  { _id: 'd8' as any, _creationTime: Date.now(), userId: 'demo-user', company: 'Amazon', position: 'Front End Eng', status: 'preparing', appliedAt: '', channel: 'online', hrContacted: false, resumeId: 'r1' as any, cvVersion: 'Frontend CV' },
]

const DEMO_ANALYTICS_RESUMES: Resume[] = [
  { _id: 'r1' as any, _creationTime: Date.now(), userId: 'demo-user', name: 'Frontend Geliştirici CV', category: 'Frontend', isDefault: true, targetRole: 'Frontend Developer' },
  { _id: 'r2' as any, _creationTime: Date.now(), userId: 'demo-user', name: 'Fullstack Geliştirici CV', category: 'Fullstack', isDefault: false, targetRole: 'Fullstack Engineer' },
]

export function AnalyticsView({ applications, resumes = [], overdueDays = 14 }: AnalyticsViewProps) {
  const [showDemoAnalytics, setShowDemoAnalytics] = useState(true)
  const isDemo = applications.length === 0 && showDemoAnalytics
  const effectiveApps = isDemo ? DEMO_ANALYTICS_APPS : applications
  const effectiveResumes = isDemo ? DEMO_ANALYTICS_RESUMES : resumes

  if (applications.length === 0 && !showDemoAnalytics) {
    return (
      <div data-tour="analytics-view-section" className="flex flex-col items-center justify-center py-20 text-center gap-3 bg-card border border-dashed rounded-2xl p-8">
        <p className="text-muted-foreground text-sm">Henüz analiz edilecek başvuru verisi yok.</p>
        <button
          type="button"
          onClick={() => setShowDemoAnalytics(true)}
          className="text-xs text-primary hover:underline font-medium cursor-pointer"
        >
          Örnek Analiz Grafiklerini Göster
        </button>
      </div>
    )
  }

  const total = effectiveApps.length
  const responded = effectiveApps.filter((a) =>
    ['responded', 'interview', 'offer', 'rejected'].includes(a.status)
  ).length
  const responseRate = Math.round((responded / total) * 100)
  const overdueCount = effectiveApps.filter((a) => isOverdue(a, overdueDays)).length
  const hrContacted = effectiveApps.filter((a) => a.hrContacted).length
  const withInterviewDate = effectiveApps.filter((a) => a.interviewAt).length

  // Status distribution for bar chart
  const statusData = Object.keys(STATUS_LABELS).map((s) => ({
    name: STATUS_LABELS[s as keyof typeof STATUS_LABELS],
    count: effectiveApps.filter((a) => a.status === s).length,
    color: STATUS_CHART_COLORS[s] ?? '#666',
  })).filter((d) => d.count > 0)

  // Channel distribution
  const channelData = Object.keys(CHANNEL_LABELS)
    .map((key) => ({
      name: CHANNEL_LABELS[key],
      count: effectiveApps.filter((a) => a.channel === key).length,
    }))
    .filter((d) => d.count > 0)

  // Weekly data
  const weeklyData = getWeeklyData(effectiveApps, 8)

  // Resume performance data
  const resumeStats = getResumeStats(effectiveApps, effectiveResumes)
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
    <div data-tour="analytics-view-section" className="space-y-6">
      {applications.length === 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-card border border-border/80 rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Örnek Gösterim
            </span>
            <span className="text-muted-foreground">
              Henüz başvuru kaydetmediğiniz için örnek analiz grafikleri ve başarı oranları gösterilmektedir.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoAnalytics(false)}
            className="text-xs text-primary hover:underline font-medium self-start sm:self-auto cursor-pointer shrink-0"
          >
            Örnek Grafikleri Gizle
          </button>
        </div>
      )}
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
