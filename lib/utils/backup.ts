import type { Application, BackupData } from '@/types'
import { STATUS_LABELS, CHANNEL_LABELS } from '@/lib/utils/applications'

export function exportToExcel(applications: Application[]): void {
  // UTF-8 BOM so Excel opens Turkish letters (ç, ğ, ı, ö, ş, ü) without encoding issues
  const BOM = '\uFEFF'
  const headers = [
    'Şirket',
    'Pozisyon',
    'Durum',
    'Başvuru Tarihi',
    'Kanal',
    'CV Versiyonu',
    'Mülakat Tarihi',
    'İK ile İletişim',
    'İlan Linki',
    'Notlar',
  ]

  const rows = applications.map((app) => [
    `"${(app.company || '').replace(/"/g, '""')}"`,
    `"${(app.position || '').replace(/"/g, '""')}"`,
    `"${STATUS_LABELS[app.status] || app.status}"`,
    `"${app.appliedAt || ''}"`,
    `"${CHANNEL_LABELS[app.channel || ''] || app.channel || ''}"`,
    `"${(app.cvVersion || '').replace(/"/g, '""')}"`,
    `"${app.interviewAt || ''}"`,
    `"${app.hrContacted ? 'Evet' : 'Hayır'}"`,
    `"${(app.jobLink || '').replace(/"/g, '""')}"`,
    `"${(app.note || '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`,
  ])

  // Use semicolon delimiter which is the standard CSV list separator for Excel in Turkish Windows
  const csvContent = BOM + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gcx-basvurular-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportBackup(applications: Application[]): void {
  const data: BackupData = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    applications,
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gcx-yedek-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function importBackup(): Promise<any[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      try {
        const text = await file.text()
        const parsed = JSON.parse(text)

        // Support both raw array, {applications: [...]}, or Claude artifact backup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rawList: any[] = []
        if (Array.isArray(parsed)) {
          rawList = parsed
        } else if (Array.isArray(parsed.applications)) {
          rawList = parsed.applications
        } else if (Array.isArray(parsed.items)) {
          rawList = parsed.items
        }

        // Normalize items to camelCase
        const normalized = rawList.map((item) => ({
          company: item.company || '',
          position: item.position || '',
          status: item.status || 'waiting',
          appliedAt: item.appliedAt || item.applied_at || undefined,
          interviewAt: item.interviewAt || item.interview_at || undefined,
          offerDeadline: item.offerDeadline || item.offer_deadline || undefined,
          channel: item.channel || undefined,
          cvVersion: item.cvVersion || item.cv_version || undefined,
          cvLink: item.cvLink || item.cv_link || undefined,
          jobLink: item.jobLink || item.job_link || undefined,
          contactName: item.contactName || item.contact_name || undefined,
          salary: item.salary || undefined,
          hrContacted: Boolean(item.hrContacted ?? item.hr_contacted ?? false),
          note: item.note || undefined,
        }))

        resolve(normalized)
      } catch {
        resolve(null)
      }
    }

    input.click()
  })
}
