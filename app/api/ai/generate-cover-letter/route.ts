import { NextRequest, NextResponse } from 'next/server'

interface GenerateCoverLetterRequest {
  rawText?: string
  targetRole?: string
  companyName?: string
  jobDescription?: string
  language?: 'tr' | 'en'
  apiKey?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateCoverLetterRequest
    const { rawText, targetRole, companyName, jobDescription, language = 'tr', apiKey } = body

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

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        {
          error: 'EMPTY_CONTENT',
          message: 'Cover letter üretmek için CV metni gereklidir.',
        },
        { status: 400 }
      )
    }

    const isEnglish = language === 'en'

    const systemPrompt = isEnglish
      ? `You are a world-class Executive Career Coach and Senior Tech Recruiter.
Based on the candidate's CV and target application details, write a compelling, concise, impactful, and authentic 3-paragraph English Cover Letter.

RULES:
1. Introduction: Passion for the target role (${targetRole || 'the open position'}) and high-level value proposition.
2. Body Paragraph: Highlight concrete achievements from the CV (projects, revenue/impact, tech stack, internships, problems solved) demonstrating tangible business impact rather than a plain list of skills.
3. Conclusion: Value added to the company (${companyName || 'your organization'}), polite call-to-action for an interview.
4. Salutation & Sign-off: Start with "Dear Hiring Team / Hiring Manager," and conclude with "Sincerely," followed by the candidate's name.
5. Provide clean plain text only (no markdown code fences, headers or asterisks).`
      : `Sen dünyanın en iyi kariyer koçu ve kıdemli işe alım uzmanısın (Executive Career Coach & Tech Recruiter).
Sana verilen adayın CV metnini ve hedef bilgilerini inceleyerek doğrudan iş başvurularında kullanabileceği, son derece etkileyici, samimi, profesyonel ve ikna edici 3 paragraflık bir Türkçe Ön Yazı (Cover Letter) oluştur.

KURALLAR:
1. Giriş: Başvurulan pozisyona (${targetRole || 'İlgili Pozisyon'}) duyulan heyecan ve adayın genel uzmanlık özeti.
2. Gelişme: CV'deki somut başarılar (proje, gelir, staj, teknik araçlar, çözülen problemler) vurgulanmalı; sadece yetenek listelemek yerine yarattığı katma değer anlatılmalıdır.
3. Sonuç: Şirkete (${companyName || 'şirketinize'}) sağlayacağı katkı ve mülakat daveti için kibar bir çağrı.
4. Hitap: "Merhaba Sayın İlgili / İşe Alım Ekibi," ile başlasın ve "Saygılarımla," ile bitsin.
5. Markdown veya kod bloğu olmadan, doğrudan kullanıma hazır düz metin olarak dön.`

    let candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro']
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
          .filter((name) => {
            const lower = name.toLowerCase()
            return (
              !lower.includes('tts') &&
              !lower.includes('audio') &&
              !lower.includes('image') &&
              !lower.includes('embed') &&
              !lower.includes('aqa') &&
              !lower.includes('imagen')
            )
          })
        if (available.length > 0) {
          candidateModels = available
        }
      }
    } catch {
      // fallback
    }

    const promptText = `Adayın CV Metni:
${rawText}

Hedef Pozisyon: ${targetRole || 'Belirtilmedi'}
Şirket: ${companyName || 'Genel Başvuru'}
${jobDescription ? `İlan Detayı / İstenenler: ${jobDescription}` : ''}

Lütfen bu bilgilere göre en yüksek dönüş sağlayacak profesyonel Ön Yazıyı (Cover Letter) oluştur.`

    let generatedText = ''
    let lastError = 'Model isteği başarısız oldu'

    for (const model of candidateModels) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000)

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: promptText }],
                },
              ],
              generationConfig: {
                temperature: 0.3,
              },
            }),
          }
        )

        clearTimeout(timeoutId)

        if (res.ok) {
          const data = await res.json()
          const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (txt) {
            generatedText = txt.trim()
            break
          }
        } else {
          const errData = await res.json().catch(() => ({}))
          lastError = errData?.error?.message || res.statusText
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Ağ hatası'
      }
    }

    if (!generatedText) {
      return NextResponse.json(
        { error: 'GEMINI_ERROR', message: `Cover Letter oluşturulamadı: ${lastError}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, coverLetter: generatedText })
  } catch (error) {
    console.error('Generate Cover Letter error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Cover Letter oluşturulurken bir hata meydana geldi.',
      },
      { status: 500 }
    )
  }
}
