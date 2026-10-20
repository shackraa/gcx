import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getGoogleOAuthCredentials } from '@/lib/gmail/oauth'

interface ScanJobEmailResult {
  company: string
  position?: string
  detectedStatus: 'waiting' | 'responded' | 'interview' | 'offer' | 'rejected'
  snippet: string
  date: string
  subject: string
  interviewDate?: string
}

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('gcx_gmail_refresh_token')?.value
    const accessToken = req.cookies.get('gcx_gmail_access_token')?.value

    const { clientId, clientSecret } = await getGoogleOAuthCredentials()

    if (!refreshToken && !accessToken) {
      return NextResponse.json(
        {
          connected: false,
          error: 'Gmail henüz bağlanmamış. Lütfen önce Gmail hesabınızı bağlayın.',
        },
        { status: 401 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken,
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // Sadece iş başvurusu, mülakat, teklif ve ret ile ilgili güvenli sorgu
    const query =
      'subject:(başvuru OR mülakat OR interview OR offer OR application OR candidate OR "iş ilanı" OR "kariyer")'

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 15,
    })

    const messages = listRes.data.messages || []
    const results: ScanJobEmailResult[] = []
    const apiKey = process.env.GEMINI_API_KEY?.trim()

    for (const msg of messages.slice(0, 8)) {
      if (!msg.id) continue
      try {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'snippet',
        })

        const snippet = detail.data.snippet || ''
        const headers = detail.data.payload?.headers || []
        const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || ''
        const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || ''
        const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || ''

        // Gemini ile mail içeriğini analiz et
        let detectedCompany = from.split('<')[0].replace(/"/g, '').trim()
        let detectedStatus: 'waiting' | 'responded' | 'interview' | 'offer' | 'rejected' = 'waiting'
        let interviewDate: string | undefined = undefined

        if (apiKey) {
          try {
            const prompt = `Aşağıdaki iş başvurusu ile ilgili gelen e-postayı analiz et:
Gönderen: ${from}
Konu: ${subject}
Özet: ${snippet}

Bana sadece şu JSON formatında cevap ver:
{
  "company": "Tespit edilen şirket adı",
  "status": "waiting | responded | interview | offer | rejected",
  "interviewDate": "Varsa mülakat tarihi/saati YYYY-MM-DD HH:mm formatında veya boş"
}`

            const gRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ role: 'user', parts: [{ text: prompt }] }],
                  generationConfig: { response_mime_type: 'application/json' },
                }),
              }
            )

            if (gRes.ok) {
              const gData = await gRes.json()
              const gText = gData.candidates?.[0]?.content?.parts?.[0]?.text
              if (gText) {
                const parsed = JSON.parse(gText)
                if (parsed.company) detectedCompany = parsed.company
                if (parsed.status) detectedStatus = parsed.status
                if (parsed.interviewDate) interviewDate = parsed.interviewDate
              }
            }
          } catch (e) {
            console.error('Gemini mail parse error:', e)
          }
        } else {
          // Heuristic kural tabanlı tespit
          const lower = (subject + ' ' + snippet).toLowerCase()
          if (lower.includes('mülakat') || lower.includes('interview') || lower.includes('görüşme')) {
            detectedStatus = 'interview'
          } else if (lower.includes('teklif') || lower.includes('offer')) {
            detectedStatus = 'offer'
          } else if (
            lower.includes('olumsuz') ||
            lower.includes('başka bir aday') ||
            lower.includes('maalesef') ||
            lower.includes('regret')
          ) {
            detectedStatus = 'rejected'
          } else if (lower.includes('alındı') || lower.includes('değerlendirme') || lower.includes('süreciniz')) {
            detectedStatus = 'responded'
          }
        }

        results.push({
          company: detectedCompany,
          detectedStatus,
          snippet,
          date,
          subject,
          interviewDate,
        })
      } catch (err) {
        console.error('Single email fetch error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      scannedCount: messages.length,
      updatesFound: results.length,
      results,
    })
  } catch (error: any) {
    console.error('Gmail scan error:', error)
    return NextResponse.json({ error: error.message || 'Mail tarama başarısız' }, { status: 500 })
  }
}
