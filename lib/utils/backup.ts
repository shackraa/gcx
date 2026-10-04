import type { Application, BackupData } from '@/types'
import { STATUS_LABELS, CHANNEL_LABELS } from '@/lib/utils/applications'

// Helper for escaping HTML special characters in Excel table output
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const STATUS_EXCEL_STYLES: Record<string, string> = {
  preparing: 'background-color: #EFF6FF; color: #1E40AF; font-weight: 600; text-align: center;',
  waiting: 'background-color: #F1F5F9; color: #475569; font-weight: 600; text-align: center;',
  responded: 'background-color: #F3E8FF; color: #6B21A8; font-weight: 600; text-align: center;',
  interview: 'background-color: #FEF3C7; color: #92400E; font-weight: 600; text-align: center;',
  offer: 'background-color: #DCFCE7; color: #166534; font-weight: bold; text-align: center;',
  rejected: 'background-color: #FEE2E2; color: #991B1B; text-align: center;',
}

/**
 * Highly readable, styled Microsoft Excel spreadsheet (.xls).
 * Uses native HTML spreadsheet markup with styled table headers, alternating row colors,
 * colored status badges, clean borders, and proper cell paddings.
 */
export function exportToStyledExcel(applications: Application[]): void {
  const dateStr = new Date().toISOString().slice(0, 10)
  const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  const headers = [
    '#',
    'Şirket',
    'Pozisyon',
    'Durum',
    'Başvuru Tarihi',
    'Kanal',
    'CV Versiyonu',
    'Mülakat Tarihi',
    'İK İletişimi',
    'İlan Linki',
    'Notlar',
  ]

  const rowsHtml = applications
    .map((app, index) => {
      const statusLabel = STATUS_LABELS[app.status] || app.status
      const statusStyle = STATUS_EXCEL_STYLES[app.status] || 'text-align: center;'
      const channelLabel = CHANNEL_LABELS[app.channel || ''] || app.channel || '-'
      const jobLinkHtml = app.jobLink
        ? `<a href="${escapeHtml(app.jobLink)}" style="color: #2563EB; text-decoration: underline;">İlan Linki</a>`
        : '-'
      const cleanNote = (app.note || '-').replace(/[\r\n]+/g, ' ')

      return `<tr>
        <td style="text-align: center; color: #64748B; font-weight: 600;">${index + 1}</td>
        <td style="font-weight: 600; color: #0F172A;">${escapeHtml(app.company || '-')}</td>
        <td style="color: #334155;">${escapeHtml(app.position || '-')}</td>
        <td style="${statusStyle}">${escapeHtml(statusLabel)}</td>
        <td style="text-align: center; font-variant-numeric: tabular-nums;">${escapeHtml(app.appliedAt || '-')}</td>
        <td style="text-align: center;">${escapeHtml(channelLabel)}</td>
        <td style="text-align: center; font-weight: 500;">${escapeHtml(app.cvVersion || '-')}</td>
        <td style="text-align: center; font-variant-numeric: tabular-nums;">${escapeHtml(app.interviewAt || '-')}</td>
        <td style="text-align: center;">${app.hrContacted ? 'Evet' : 'Hayır'}</td>
        <td style="text-align: center;">${jobLinkHtml}</td>
        <td style="color: #475569; max-width: 320px;">${escapeHtml(cleanNote)}</td>
      </tr>`
    })
    .join('\n')

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Başvurular</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #1E293B; margin: 20px; }
  .title { font-size: 16pt; font-weight: bold; color: #0F172A; margin-bottom: 4px; }
  .subtitle { font-size: 10pt; color: #64748B; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; border: 1px solid #CBD5E1; }
  th { background-color: #1E293B; color: #FFFFFF; font-weight: 600; padding: 12px 14px; text-align: left; border: 1px solid #334155; font-size: 11pt; }
  td { padding: 9px 12px; border: 1px solid #E2E8F0; vertical-align: middle; font-size: 10.5pt; }
  tr:nth-child(even) td { background-color: #F8FAFC; }
  tr:hover td { background-color: #F1F5F9; }
</style>
</head>
<body>
  <div class="title">GCX Kariyer ve Başvuru Takip Raporu</div>
  <div class="subtitle">Oluşturulma Tarihi: ${dateStr} ${timeStr} &bull; Toplam Başvuru: ${applications.length}</div>
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</body>
</html>
`

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gcx-basvurular-excel-${dateStr}.xls`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Standard CSV export optimized for Google Sheets (Google E-Tablolar).
 * Uses UTF-8 BOM and standard comma separation (,) with RFC4180 escaping.
 */
export function exportToGoogleSheetsCsv(applications: Application[]): void {
  const BOM = '\uFEFF'
  const headers = [
    'No',
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

  const rows = applications.map((app, index) => [
    `"${index + 1}"`,
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

  const csvContent = BOM + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gcx-basvurular-etablolar-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Copies the applications table as TSV (Tab Separated Values) to clipboard.
 * User can immediately press Ctrl+V in Google Sheets or Excel to paste all columns and rows perfectly.
 */
export async function copyForGoogleSheets(applications: Application[]): Promise<boolean> {
  const headers = [
    'No',
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

  const rows = applications.map((app, index) => [
    String(index + 1),
    app.company || '',
    app.position || '',
    STATUS_LABELS[app.status] || app.status,
    app.appliedAt || '',
    CHANNEL_LABELS[app.channel || ''] || app.channel || '',
    app.cvVersion || '',
    app.interviewAt || '',
    app.hrContacted ? 'Evet' : 'Hayır',
    app.jobLink || '',
    (app.note || '').replace(/[\r\n\t]+/g, ' '),
  ])

  const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\r\n')

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsvContent)
      return true
    }
    return false
  } catch {
    return false
  }
}

// Keep exportToExcel alias for backward compatibility
export const exportToExcel = exportToStyledExcel

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
