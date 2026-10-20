import { NextRequest, NextResponse } from 'next/server'

interface FindRecruiterRequest {
  company: string
  position?: string
  contactName?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FindRecruiterRequest
    const { company, position, contactName } = body

    if (!company?.trim()) {
      return NextResponse.json({ error: 'Şirket adı zorunludur' }, { status: 400 })
    }

    const cleanCompany = company.trim()
    const cleanPosition = (position || '').trim()
    const apiKey = process.env.GEMINI_API_KEY?.trim()

    // 1. Gemini ile Pozisyon ve Şirkete Özel İK & Hiring Manager Profil Analizi
    let title = 'Talent Acquisition Specialist'
    let searchKeywords = `"${cleanCompany}" ("Technical Recruiter" OR "Talent Acquisition" OR "İnsan Kaynakları")`
    let explanation = `${cleanCompany} bünyesindeki aktif işe alım ve yetenek uzmanı.`
    let likelyName = contactName || ''

    if (apiKey) {
      try {
        const prompt = `Şirket: "${cleanCompany}"
Başvurulan Pozisyon: "${cleanPosition}"
Bilinen Yetkili: "${likelyName}"

Bu başvuru için LinkedIn'de iletişime geçilmesi gereken EN DOĞRU kişiyi (Recruiter / Hiring Manager / Head of People) analiz et.
Bana şu JSON formatında cevap ver:
{
  "likelyTitle": "Örn: Senior Technical Recruiter veya Engineering Manager",
  "searchQuery": "LinkedIn search query için anahtar kelimeler",
  "explanation": "Neden bu kişinin doğru kişi olduğuna dair 1 cümlelik Türkçe açıklama",
  "recommendedOpening": "Ona LinkedIn üzerinden atılabilecek ilk tanışma mesajının ilk cümlesi"
}`

        const res = await fetch(
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

        if (res.ok) {
          const data = await res.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            const parsed = JSON.parse(text)
            if (parsed.likelyTitle) title = parsed.likelyTitle
            if (parsed.searchQuery) searchKeywords = parsed.searchQuery
            if (parsed.explanation) explanation = parsed.explanation
          }
        }
      } catch (err) {
        console.error('Gemini recruiter lookup error:', err)
      }
    }

    // 2. LinkedIn Özel Arama & Mesajlaşma Linkleri
    const encodedQuery = encodeURIComponent(searchKeywords)
    const linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}&origin=GLOBAL_SEARCH_HEADER`

    // Eğer doğrudan bilinen bir yetkili adı varsa doğrudan isimle arama / mesaj kutusu
    const linkedinDirectUrl = likelyName
      ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${likelyName}" "${cleanCompany}"`)}&origin=GLOBAL_SEARCH_HEADER`
      : linkedinSearchUrl

    return NextResponse.json({
      success: true,
      company: cleanCompany,
      position: cleanPosition,
      likelyTitle: title,
      explanation,
      linkedinSearchUrl,
      linkedinDirectUrl,
      targetName: likelyName || null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Hata oluştu' }, { status: 500 })
  }
}
