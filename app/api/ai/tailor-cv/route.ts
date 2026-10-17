import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface SourceInput {
  title: string
  sourceType: string
  rawContent: string
  extractedSummary?: string
  extractedHighlights?: string[]
}

interface TailorRequest {
  jobInput: string // LinkedIn URL, herhangi bir ilan URL'i veya doğrudan ilan metni
  targetCompany?: string
  targetRole?: string
  language?: 'tr' | 'en'
  templateId?: 'harvard' | 'jakes' | 'mckinsey' | 'academic'
  customQuestions?: string[]
  sources: SourceInput[]
  apiKey?: string
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

async function scrapeJobDetailsFromUrl(url: string): Promise<{
  company?: string
  role?: string
  description?: string
}> {
  try {
    // 1. Check if it's a LinkedIn job URL and extract numeric job ID for guest API
    const linkedInIdMatch =
      url.match(/currentJobId=(\d+)/i) ||
      url.match(/\/jobs\/view\/(?:[^/?#]*-)?(\d+)/i) ||
      url.match(/(\d{9,11})/)

    if (url.toLowerCase().includes('linkedin.com') && linkedInIdMatch?.[1]) {
      const jobId = linkedInIdMatch[1]
      const guestApiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`
      const res = await fetch(guestApiUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      })
      if (res.ok) {
        const html = await res.text()
        const $ = cheerio.load(html)
        const role =
          $('.top-card-layout__title').first().text().trim() ||
          $('h2').first().text().trim()
        const company =
          $('.topcard__org-name-link').first().text().trim() ||
          $('.topcard__flavor').first().text().trim()
        const description =
          $('.show-more-less-html__markup').text().replace(/\s+/g, ' ').trim() ||
          $('.description__text').text().replace(/\s+/g, ' ').trim()

        if (role || description) {
          return { company, role, description }
        }
      }
    }

    // 2. General webpage scrape (Greenhouse, Lever, Kariyer, Workable, LinkedIn public page)
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    })
    if (!res.ok) return {}

    const html = await res.text()
    const $ = cheerio.load(html)
    $('script, style, nav, footer, noscript').remove()

    const ogTitle =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() ||
      $('h1').first().text().trim()
    const ogDescription =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      ''
    const bodyText = $('main, article, .description, .job-description, body')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)

    let guessedCompany = ''
    let guessedRole = ogTitle
    if (ogTitle.includes(' hiring ')) {
      const parts = ogTitle.split(' hiring ')
      guessedCompany = parts[0].trim()
      guessedRole = parts[1]?.split(' in ')[0]?.trim() || ogTitle
    } else if (ogTitle.includes(' - ')) {
      const parts = ogTitle.split(' - ')
      guessedRole = parts[0].trim()
      guessedCompany = parts[1]?.trim() || ''
    } else if (ogTitle.includes(' | ')) {
      const parts = ogTitle.split(' | ')
      guessedRole = parts[0].trim()
      guessedCompany = parts[1]?.trim() || ''
    }

    return {
      company: guessedCompany || undefined,
      role: guessedRole || undefined,
      description: [ogTitle, ogDescription, bodyText].filter(Boolean).join('\n\n'),
    }
  } catch {
    return {}
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as TailorRequest
    const {
      jobInput,
      targetCompany,
      targetRole,
      language = 'en',
      templateId = 'harvard',
      customQuestions = [],
      sources = [],
    } = body

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

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        {
          error: 'NO_SOURCES',
          message:
            'Kariyer Hafızanızda henüz kaynak belge yok. Lütfen önce birkaç CV, motivasyon mektubu veya not yükleyin.',
        },
        { status: 400 }
      )
    }

    let resolvedCompany = targetCompany?.trim() || ''
    let resolvedRole = targetRole?.trim() || ''
    let resolvedJobText = jobInput?.trim() || ''
    let jobUrl: string | undefined = undefined

    // Check if jobInput starts with http or contains a URL
    const urlMatch = resolvedJobText.match(/https?:\/\/[^\s]+/i)
    if (urlMatch) {
      jobUrl = urlMatch[0]
      const scraped = await scrapeJobDetailsFromUrl(jobUrl)
      if (!resolvedCompany && scraped.company) resolvedCompany = scraped.company
      if (!resolvedRole && scraped.role) resolvedRole = scraped.role
      if (scraped.description) {
        resolvedJobText = `${resolvedJobText}\n\n[İlan Sayfasından Çekilen Detaylar]:\n${scraped.description}`
      }
    }

    const compiledMemory = sources
      .map(
        (s, idx) =>
          `--- KAYNAK #${idx + 1}: [${s.sourceType.toUpperCase()}] ${s.title} ---\n${
            s.extractedSummary ? `Özet: ${s.extractedSummary}\n` : ''
          }${s.rawContent}`
      )
      .join('\n\n')

    const langLabel = language === 'en' ? 'İngilizce (English)' : 'Türkçe (Turkish)'

    const systemPrompt = `Sen Harvard Office of Career Services (OCS) Kıdemli Kariyer Danışmanı, Executive Tech Recruiter ve Fellowship Başvuru Komitesi Üyesisin.

GÖREVİN:
Adayın "Kariyer Hafızası"ndaki TÜM kaynak belgeleri (geçmiş CV'ler, motivasyon mektupları, fellowship başvuruları, projeler, sertifikalar ve notlar) inceleyerek hedef ilana/programa %100 özel ("terzi işi") bir **Harvard Standartlarında CV**, **Motivasyon Mektubu (Cover Letter)** ve **Fellowship / Başvuru Soru-Cevap Seti** oluşturmak.

KESİN KURALLAR:
1. **SIFIR UYDURMA (NO HALLUCINATION):** Yalnızca adayın kaynak belgelerinde gerçekten var olan okulları, şirketleri, projeleri, metrikleri (ciro, kullanıcı sayısı, performans artışı vb.) ve iletişim bilgilerini kullan.
2. **AKILLI SEÇİM (EVIDENCE SELECTION):** Adayın tüm geçmişinden hedef ilana EN ÇOK UYAN deneyimleri, projeleri, başarıları ve yetkinlikleri seç ve en üste/öne çıkar.
3. **HARVARD XYZ & ETKİ ODAKLI MADDELER:** Her deneyim ve proje maddesini güçlü aksiyon fiilleriyle (Led, Engineered, Scaled, Speaheaded, Designed / Geliştirdi, Ölçeklendirdi, Liderlik etti) başlat; mümkün olan her yerde kaynaklardaki somut sayısal metrikleri kullan.
4. **ADAYIN GERÇEK ÜSLUBU (ZERO AI-SLOP):** Motivasyon mektubunu ve fellowship cevaplarını yazarken adayın kaynaklarındaki eski motivasyon mektuplarını ve kişisel hikayelerini temel al; yapay zeka klişeleri yerine samimi, ikna edici, somut kanıtlara dayanan üst düzey profesyonel bir üslup kullan.
5. **ÇIKTI DİLİ:** Tüm CV içeriği, Motivasyon Mektubu ve Fellowship soru-cevapları **${langLabel}** dilinde olmalıdır.

Aşağıdaki JSON şemasında eksiksiz yanıt ver:
{
  "targetCompany": "İlandaki şirket veya kurum adı (belirtilmemişse 'Hedef Kurum')",
  "targetRole": "İlandaki pozisyon veya program adı",
  "atsScoreBefore": 68,
  "atsScoreAfter": 95,
  "matchedKeywords": ["İlanla eşleşen ve CV'ye yerleştirilen anahtar kelime 1", "Anahtar kelime 2", "Anahtar kelime 3", "Anahtar kelime 4", "Anahtar kelime 5", "Anahtar kelime 6"],
  "selectedSources": [
    "Hangi kaynak belgeden hangi bilginin/metriğin neden seçildiğini açıklayan madde 1",
    "Seçim gerekçesi 2",
    "Seçim gerekçesi 3"
  ],
  "cvData": {
    "fullName": "Adayın Adı Soyadı",
    "title": "Hedef Pozisyona Uygun Profesyonel Unvan",
    "contact": {
      "email": "e-posta",
      "phone": "telefon",
      "location": "Şehir, Ülke",
      "linkedin": "linkedin linki",
      "github": "github veya portfolyo"
    },
    "summary": "İlana özel 2-3 cümlelik, somut metrik ve uzmanlık içeren Harvard Executive özet",
    "education": [
      {
        "institution": "Üniversite / Okul Adı",
        "degree": "Bölüm ve Derece",
        "location": "Şehir",
        "date": "Tarih Aralığı",
        "gpaOrHonors": "Varsa GPA / Onur derecesi / İlgili dersler",
        "details": ["Varsa akademik başarı veya tez/proje detayı"]
      }
    ],
    "experience": [
      {
        "company": "Şirket / Girişim Adı",
        "role": "Pozisyon Unvanı",
        "location": "Şehir / Remote",
        "date": "Tarih Aralığı",
        "bullets": [
          "Harvard XYZ formatında somut etki ve metrik içeren madde 1",
          "Madde 2",
          "Madde 3"
        ]
      }
    ],
    "projects": [
      {
        "name": "Proje / Ürün / Girişim Adı",
        "roleOrTech": "Kullanılan Teknolojiler veya Rol",
        "date": "Tarih",
        "bullets": [
          "Projenin çözdüğü problem, mimarisi ve elde edilen somut sonuç/metrik 1",
          "Madde 2"
        ]
      }
    ],
    "leadershipAndFellowships": [
      {
        "organization": "Topluluk / Fellowship / Program / Girişim Adı",
        "role": "Rol / Unvan",
        "date": "Tarih",
        "bullets": [
          "Liderlik, topluluk etkisi veya başarı detayı"
        ]
      }
    ],
    "skills": {
      "technical": ["Yetenek 1", "Yetenek 2", "Yetenek 3"],
      "tools": ["Araç 1", "Araç 2"],
      "domains": ["Alan 1", "Alan 2"],
      "languages": ["Dil 1", "Dil 2"]
    },
    "awardsAndCertifications": [
      "Varsa ödül, derece, burs veya sertifika 1",
      "Sertifika / Başarı 2"
    ]
  },
  "coverLetter": "İlana ve şirkete özel, adayın geçmiş mektuplarındaki üslubu ve gerçek başarılarını kullanan 3-4 paragraflık etkileyici Motivasyon Mektubu / Cover Letter",
  "fellowshipAnswers": [
    {
      "question": "Soru 1 (Kullanıcı soru girdiyse o soru; girmediyse bu ilana/fellowship'e en uygun kritik mülakat/başvuru sorusu, örn: Why this role & company? / Biggest measurable impact?)",
      "answer": "Adayın gerçek hikayelerine ve metriklerine dayanan güçlü, doğrudan kopyalanıp kullanılabilir cevap"
    },
    {
      "question": "Soru 2",
      "answer": "Cevap 2"
    }
  ]
}`

    const userPrompt = `HEDEF İLAN / PROGRAM BİLGİLERİ:
Hedef Şirket/Kurum: ${resolvedCompany || 'İlandan tespit et'}
Hedef Pozisyon/Program: ${resolvedRole || 'İlandan tespit et'}
Seçilen Şablon Stili: ${templateId}
İstenen Çıktı Dili: ${langLabel}
${
  customQuestions.length > 0
    ? `Cevaplanması İstenen Özel Başvuru / Fellowship Soruları:\n${customQuestions
        .map((q, i) => `${i + 1}. ${q}`)
        .join('\n')}`
    : ''
}

İLAN METNİ VEYA BAĞLANTISI:
${resolvedJobText || `${resolvedCompany} - ${resolvedRole}`}

====================================================================
ADAYIN KARİYER HAFIZASI (TÜM KAYNAK BELGELERİ, CV'LERİ, MEKTUPLARI, FELLOWSHIP BAŞVURULARI):
${compiledMemory}
====================================================================

Yukarıdaki Kariyer Hafızasını kullanarak bu ilana en uygun bilgileri seç ve belirtilen JSON şemasında (${langLabel} dilinde) eksiksiz yanıt üret.`

    let candidateModels = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
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
    let lastError = ''

    for (const model of candidateModels.slice(0, 4)) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature: 0.25,
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
            if (extracted && extracted.cvData) {
              parsedResult = extracted
              break
            }
          }
        } else {
          const errJson = await res.json().catch(() => ({}))
          lastError = errJson?.error?.message || res.statusText
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Bağlantı hatası'
      }
    }

    if (!parsedResult || !parsedResult.cvData) {
      return NextResponse.json(
        {
          error: 'GENERATION_FAILED',
          message: `Özel CV oluşturulamadı: ${lastError || 'Lütfen tekrar deneyin.'}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        targetCompany: String(parsedResult.targetCompany || resolvedCompany || 'Hedef Şirket'),
        targetRole: String(parsedResult.targetRole || resolvedRole || 'Hedef Pozisyon'),
        jobUrl,
        atsScoreBefore: Number(parsedResult.atsScoreBefore) || 65,
        atsScoreAfter: Number(parsedResult.atsScoreAfter) || 94,
        matchedKeywords: Array.isArray(parsedResult.matchedKeywords)
          ? (parsedResult.matchedKeywords as string[]).map(String)
          : [],
        selectedSources: Array.isArray(parsedResult.selectedSources)
          ? (parsedResult.selectedSources as string[]).map(String)
          : [],
        cvData: parsedResult.cvData,
        coverLetter: String(parsedResult.coverLetter || ''),
        fellowshipAnswers: Array.isArray(parsedResult.fellowshipAnswers)
          ? parsedResult.fellowshipAnswers
          : [],
      },
    })
  } catch (error) {
    console.error('[tailor-cv] Error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'İlana özel CV üretilirken hata oluştu.',
      },
      { status: 500 }
    )
  }
}
