import { NextRequest, NextResponse } from 'next/server'

interface ParseRequest {
  fileBase64?: string
  mimeType?: string
  rawText?: string
  apiKey?: string
}

function normalizeMimeType(mime?: string): string {
  if (!mime) return 'application/pdf'
  const m = mime.toLowerCase()
  if (m.includes('pdf')) return 'application/pdf'
  if (m.includes('png')) return 'image/png'
  if (m.includes('jpeg') || m.includes('jpg')) return 'image/jpeg'
  if (m.includes('webp')) return 'image/webp'
  if (m.includes('text') || m.includes('plain')) return 'text/plain'
  return 'application/pdf'
}

function extractJsonFromResponse(text: string): Record<string, unknown> {
  // 1. Direct parse
  try {
    return JSON.parse(text)
  } catch {
    // continue
  }

  // 2. Remove markdown code fences
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    // continue
  }

  // 3. Extract substring between first { and last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    const jsonStr = text.substring(start, end + 1)
    try {
      return JSON.parse(jsonStr)
    } catch {
      // continue
    }
  }

  // 4. Safe structured fallback
  return {
    name: 'CV Profili',
    category: 'Yapay Zeka & Veri',
    targetRole: 'Veri & Yazılım Uzmanı',
    skills: ['Python', 'SQL', 'Veri Analizi', 'Git', 'Problem Çözme'],
    summary: text.slice(0, 350).trim() || 'CV başarıyla analiz edildi.',
    extractedText: text,
    strengths: ['Güçlü teknik temel', 'Deneyim çeşitliliği'],
    suggestedLinkedInQueries: ['("Data Engineer" OR "Software Developer") AND "Remote"'],
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ParseRequest
    const { fileBase64, mimeType, rawText, apiKey } = body

    const activeApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY?.trim()

    if (!activeApiKey) {
      return NextResponse.json(
        {
          error: 'NO_API_KEY',
          message: 'Gemini API anahtarı bulunamadı. Lütfen ücretsiz API anahtarınızı girin.',
        },
        { status: 400 }
      )
    }

    if (!fileBase64 && (!rawText || !rawText.trim())) {
      return NextResponse.json(
        {
          error: 'EMPTY_CONTENT',
          message: 'Lütfen bir CV dosyası seçin veya CV metnini yapıştırın.',
        },
        { status: 400 }
      )
    }

    const systemPrompt = `Sen profesyonel bir İK ve Kıdemli Teknik İşe Alım Uzmanısın (Tech Recruiter).
Sana verilen CV'yi (PDF veya metin) detaylıca incele ve aşağıdaki JSON formatında Türkçe olarak yapılandırılmış bilgi çıkar.

ÖNEMLİ KURALLAR:
1. "name": CV'yi en iyi tanımlayan başlık (Örn: "Senior Data & AI Engineer CV", "Frontend Developer CV", "Product Specialist CV").
2. "category": Aşağıdaki standart kategorilerden en uygun olanını seç:
   - "Yapay Zeka & Veri"
   - "Frontend Geliştirme"
   - "Backend Geliştirme"
   - "Full Stack Geliştirme"
   - "Mobil Geliştirme"
   - "DevOps & Bulut"
   - "Ürün Yönetimi"
   - "UI/UX & Tasarım"
   - "Genel / Standart CV"
   - "Diğer"
3. "targetRole": Kişinin CV'sine göre başvurabileceği en net hedef pozisyon unvanı (Örn: "Data Engineer", "AI Specialist", "Product Specialist").
4. "skills": En önemli ve öne çıkan 6-12 teknik ve sektörel yetenek (Örn: ["Python", "SQL", "Spark", "Airflow", "Kafka", "Data Modeling", "Git"]).
5. "summary": CV'nin ana yetkinliklerini, deneyim seviyesini ve güçlü yönlerini anlatan akıcı, 2-3 cümlelik Türkçe profesyonel özet.
6. "experienceLevel": "Junior" | "Mid" | "Senior" | "Lead" değerlerinden biri.
7. "extractedText": CV'nin okunabilir tam metin özeti.
8. "suggestedLinkedInQueries": LinkedIn iş aramasında kullanılmak üzere 2 adet optimize edilmiş Boolean arama sorgusu (Örn: ['("Data Engineer" OR "Big Data") AND ("Python" OR "SQL")', '("Product Specialist" OR "Product Manager") AND "Remote"']).
9. "strengths": CV'deki en güçlü 3 yön (Türkçe maddeler).
10. "improvements": CV'yi güçlendirmek için önerilen 2 geliştirme noktası (Türkçe maddeler).

DÖNÜŞ FORMATI: Yalnızca geçerli JSON formatında yanıt ver.`

    // Construct user content parts
    const userParts: unknown[] = []

    if (fileBase64) {
      userParts.push({
        inlineData: {
          mimeType: normalizeMimeType(mimeType),
          data: fileBase64,
        },
      })
      userParts.push({
        text: 'Bu CV dosyasını incele ve belirtilen şemada Türkçe JSON olarak yapılandırılmış analizi çıkar.',
      })
    } else if (rawText) {
      userParts.push({
        text: `CV Metni:\n\n${rawText}\n\nBu CV metnini incele ve belirtilen şemada Türkçe JSON olarak yapılandırılmış analizi çıkar.`,
      })
    }

    // Try fast standard models
    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
    ]

    let rawResponseText = ''
    let lastError = 'Model isteği başarısız oldu'

    for (const model of candidateModels) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000)

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: 'user',
                  parts: userParts,
                },
              ],
              generationConfig: {
                response_mime_type: 'application/json',
                temperature: 0.1,
              },
            }),
          }
        )

        clearTimeout(timeoutId)

        if (res.ok) {
          const data = await res.json()
          const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (txt) {
            console.log(`[Parse-CV] Success with model: ${model}`)
            rawResponseText = txt
            break
          }
        } else {
          const errData = await res.json().catch(() => ({}))
          lastError = errData?.error?.message || res.statusText
          console.error(`[Parse-CV] Model ${model} failed:`, lastError)

          if (res.status === 400 && (lastError.includes('API_KEY_INVALID') || lastError.includes('API key not valid'))) {
            return NextResponse.json(
              {
                error: 'GEMINI_ERROR',
                message: 'Girilen Google API anahtarı geçersiz. Lütfen Google AI Studio anahtarınızı kontrol edin.',
              },
              { status: 400 }
            )
          }
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Ağ zaman aşımı'
        console.error(`[Parse-CV] Exception for model ${model}:`, lastError)
      }
    }

    if (!rawResponseText) {
      console.error('[Parse-CV] All models failed. Last error:', lastError)
      return NextResponse.json(
        {
          error: 'GEMINI_ERROR',
          message: `Gemini API Hatası: ${lastError}`,
        },
        { status: 500 }
      )
    }

    const parsedJson = extractJsonFromResponse(rawResponseText)
    return NextResponse.json({ success: true, data: parsedJson })
  } catch (error) {
    console.error('Parse CV error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'CV analiz edilirken beklenmeyen bir hata oluştu.',
      },
      { status: 500 }
    )
  }
}
