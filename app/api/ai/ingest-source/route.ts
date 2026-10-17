import { NextRequest, NextResponse } from 'next/server'

interface IngestSourceRequest {
  fileBase64?: string
  mimeType?: string
  fileName?: string
  rawText?: string
  fileUrl?: string
  apiKey?: string
}

function normalizeMimeType(mime?: string): string {
  if (!mime) return 'application/pdf'
  const m = mime.toLowerCase()
  if (m.includes('pdf')) return 'application/pdf'
  if (m.includes('png')) return 'image/png'
  if (m.includes('jpeg') || m.includes('jpg')) return 'image/jpeg'
  if (m.includes('webp')) return 'image/webp'
  if (m.includes('text') || m.includes('plain') || m.includes('markdown')) return 'text/plain'
  return 'application/pdf'
}

function extractJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text)
  } catch {
    // continue
  }

  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // continue
  }

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.substring(start, end + 1))
    } catch {
      // continue
    }
  }

  return {}
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IngestSourceRequest
    let { fileBase64, mimeType, fileName, rawText, fileUrl } = body
    const activeApiKey = body.apiKey?.trim() || process.env.GEMINI_API_KEY?.trim()

    if (!activeApiKey) {
      return NextResponse.json(
        {
          error: 'SERVICE_UNAVAILABLE',
          message: 'Yapay zeka servisi şu anda hazırlık aşamasında.',
        },
        { status: 503 }
      )
    }

    // Fetch from URL / Google Drive if provided
    if (fileUrl && fileUrl.trim() && !fileBase64 && !rawText) {
      let targetUrl = fileUrl.trim()
      const driveMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      const idParamMatch = targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/)
      const docsMatch = targetUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)

      const fileId = driveMatch?.[1] || idParamMatch?.[1] || docsMatch?.[1]
      if (fileId) {
        targetUrl = docsMatch
          ? `https://docs.google.com/document/d/${fileId}/export?format=pdf`
          : `https://drive.google.com/uc?export=download&id=${fileId}`
      }

      const fileRes = await fetch(targetUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      })
      if (!fileRes.ok) {
        return NextResponse.json(
          { error: 'FETCH_FAILED', message: 'Bağlantıdaki belge indirilemedi.' },
          { status: 400 }
        )
      }
      const arrayBuffer = await fileRes.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      fileBase64 = buffer.toString('base64')
      mimeType = fileRes.headers.get('content-type') || 'application/pdf'
      if (!fileName) fileName = 'Drive_Kaynak_Belge.pdf'
    }

    if (!fileBase64 && (!rawText || !rawText.trim())) {
      return NextResponse.json(
        { error: 'EMPTY_CONTENT', message: 'Yüklenecek belge veya metin bulunamadı.' },
        { status: 400 }
      )
    }

    const systemPrompt = `Sen adayın tüm kariyer geçmişini, motivasyon mektuplarını, fellowship başvurularını, projelerini ve kişisel başarılarını indeksleyen bir "Kariyer Hafızası (Career Memory)" uzmanısın.
Sana verilen kaynak belgeyi (PDF, görsel veya metin) incele ve hiçbir önemli detayı (tarihler, şirketler, metrikler, okul/GPA, iletişim bilgileri, motivasyon mektubu paragrafları, fellowship soru-cevapları, projeler, kullanılan teknolojiler) kaybetmeden aşağıdaki JSON formatında çıkar:

{
  "title": "Belgeyi en iyi tanımlayan net başlık (Örn: 'AI & Product CV 2026', 'GoodJobGames Motivasyon Mektubu', 'Stanford Fellowship Başvuru Yazısı')",
  "sourceType": "cv" | "motivation_letter" | "fellowship" | "project_note" | "certificate" | "other",
  "rawContent": "Belgedeki TÜM bilgilerin, metriklerin, deneyimlerin, iletişim bilgilerinin ve paragrafların eksiksiz, detaylı, temiz metin dökümü. CV oluşturulurken bu metin referans alınacaktır, hiçbir detayı atlama!",
  "extractedSummary": "Bu belgede hangi bilgilerin/başarıların yer aldığını anlatan 1-2 cümlelik Türkçe özet.",
  "extractedHighlights": ["Somut başarı / metrik / yetkinlik 1", "Somut başarı / metrik 2", "Öne çıkan detay 3", "Detay 4"]
}

Yalnızca geçerli JSON döndür.`

    const userParts: unknown[] = []
    if (fileBase64) {
      userParts.push({
        inlineData: {
          mimeType: normalizeMimeType(mimeType),
          data: fileBase64,
        },
      })
      userParts.push({
        text: `Dosya Adı: ${fileName || 'Belge'}\nBu kaynak belgeyi Kariyer Hafızasına kaydetmek üzere eksiksiz analiz et ve JSON döndür.`,
      })
    } else if (rawText) {
      userParts.push({
        text: `Dosya/Kaynak Başlığı: ${fileName || 'Metin Kaynağı'}\nİçerik:\n${rawText}\n\nBu kaynağı Kariyer Hafızasına kaydetmek üzere analiz et ve JSON döndür.`,
      })
    }

    let candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${activeApiKey}`
      )
      if (listRes.ok) {
        const listData = await listRes.json()
        const models = (listData.models || []) as Array<{
          name: string
          supportedGenerationMethods?: string[]
        }>
        const available = models
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''))
          .filter((n) => {
            const l = n.toLowerCase()
            return (
              !l.includes('tts') &&
              !l.includes('audio') &&
              !l.includes('image') &&
              !l.includes('embed') &&
              !l.includes('aqa') &&
              !l.includes('imagen')
            )
          })
        if (available.length > 0) candidateModels = available
      }
    } catch {
      // fallback
    }

    let parsedResult: Record<string, unknown> | null = null
    for (const model of candidateModels.slice(0, 4)) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: 'user', parts: userParts }],
              generationConfig: {
                temperature: 0.15,
                responseMimeType: 'application/json',
              },
            }),
          }
        )

        if (res.ok) {
          const data = await res.json()
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            const extracted = extractJson(text)
            if (extracted && (extracted.rawContent || extracted.extractedSummary)) {
              parsedResult = extracted
              break
            }
          }
        }
      } catch {
        // try next model
      }
    }

    const cleanDefaultTitle = fileName
      ? fileName.replace(/\.[^/.]+$/, '')
      : rawText
      ? rawText.slice(0, 45).trim() + '...'
      : 'Kaynak Belge'

    const validTypes = ['cv', 'motivation_letter', 'fellowship', 'project_note', 'certificate', 'other']
    const detectedType =
      parsedResult && validTypes.includes(String(parsedResult.sourceType))
        ? String(parsedResult.sourceType)
        : fileName?.toLowerCase().includes('fellowship')
        ? 'fellowship'
        : fileName?.toLowerCase().includes('letter') || fileName?.toLowerCase().includes('mektup')
        ? 'motivation_letter'
        : fileBase64
        ? 'cv'
        : 'project_note'

    return NextResponse.json({
      success: true,
      data: {
        title: String(parsedResult?.title || cleanDefaultTitle),
        sourceType: detectedType,
        rawContent: String(parsedResult?.rawContent || rawText || cleanDefaultTitle),
        extractedSummary: String(
          parsedResult?.extractedSummary || 'Kaynak belge Kariyer Hafızasına eklendi.'
        ),
        extractedHighlights: Array.isArray(parsedResult?.extractedHighlights)
          ? (parsedResult.extractedHighlights as string[]).map(String).slice(0, 8)
          : [],
      },
    })
  } catch (error) {
    console.error('[ingest-source] Error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Kaynak belge işlenirken hata oluştu.',
      },
      { status: 500 }
    )
  }
}
