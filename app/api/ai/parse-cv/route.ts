import { NextRequest, NextResponse } from 'next/server'

interface ParseRequest {
  fileBase64?: string
  mimeType?: string
  rawText?: string
  apiKey?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ParseRequest
    const { fileBase64, mimeType = 'application/pdf', rawText, apiKey } = body

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

    if (!fileBase64 && !rawText) {
      return NextResponse.json(
        { error: 'EMPTY_CONTENT', message: 'Lütfen bir CV dosyası yükleyin veya CV metnini yapıştırın.' },
        { status: 400 }
      )
    }

    const systemPrompt = `Sen profesyonel bir İK ve Kıdemli Teknik İşe Alım Uzmanısın (Tech Recruiter).
Sana verilen CV'yi (PDF veya metin) detaylıca incele ve aşağıdaki JSON formatında Türkçe olarak yapılandırılmış bilgi çıkar.

ÖNEMLİ KURALLAR:
1. "name": CV'yi en iyi tanımlayan başlık (Örn: "Senior React & Next.js Developer CV", "AI & Python Engineer CV", "Full Stack Developer CV").
2. "category": Aşağıdaki standart kategorilerden en uygun olanını seç:
   - "Frontend Geliştirme"
   - "Backend Geliştirme"
   - "Full Stack Geliştirme"
   - "Yapay Zeka & Veri"
   - "Mobil Geliştirme"
   - "DevOps & Bulut"
   - "Ürün Yönetimi"
   - "UI/UX & Tasarım"
   - "Diğer"
3. "targetRole": Kişinin CV'sine göre başvurabileceği en net hedef pozisyon unvanı (Örn: "Senior Frontend Developer", "AI Engineer").
4. "skills": En önemli ve öne çıkan 6-12 teknik yetenek (Örn: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "Docker"]).
5. "summary": CV'nin ana yetkinliklerini, deneyim seviyesini ve güçlü yönlerini anlatan akıcı, 2-3 cümlelik Türkçe profesyonel özet.
6. "experienceLevel": "Junior" | "Mid" | "Senior" | "Lead" değerlerinden biri.
7. "extractedText": CV'nin okunabilir tam metin özeti.
8. "suggestedLinkedInQueries": LinkedIn iş aramasında kullanılmak üzere 2 adet optimize edilmiş Boolean arama sorgusu (Örn: ['("Frontend Developer" OR "React Developer") AND ("Next.js" OR "TypeScript")', '("Senior Frontend" OR "Web Developer") AND "Remote"']).
9. "strengths": CV'deki en güçlü 3 yön (Türkçe maddeler).
10. "improvements": CV'yi güçlendirmek için önerilen 2 geliştirme noktası (Türkçe maddeler).

DÖNÜŞ FORMATI (Sadece geçerli JSON dön):
{
  "name": string,
  "category": string,
  "targetRole": string,
  "skills": string[],
  "summary": string,
  "experienceLevel": string,
  "extractedText": string,
  "suggestedLinkedInQueries": string[],
  "strengths": string[],
  "improvements": string[]
}`

    // Construct parts
    const parts: unknown[] = []

    if (fileBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: fileBase64,
        },
      })
    }

    if (rawText) {
      parts.push({
        text: `CV Metni:\n\n${rawText}`,
      })
    }

    parts.push({
      text: systemPrompt,
    })

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: parts,
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errMsg = errorData?.error?.message || response.statusText
      return NextResponse.json(
        {
          error: 'GEMINI_ERROR',
          message: `Gemini API Hatası: ${errMsg}`,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!contentText) {
      return NextResponse.json(
        { error: 'PARSE_FAILED', message: 'CV analizi yapılamadı veya içerik boş döndü.' },
        { status: 500 }
      )
    }

    const parsedJson = JSON.parse(contentText)
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
