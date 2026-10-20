import { NextRequest, NextResponse } from 'next/server'

interface FindRecruiterRequest {
  company: string
  position?: string
  contactName?: string
}

export interface RecruiterTarget {
  id: 'recruiter' | 'manager' | 'executive'
  roleType: string
  title: string
  searchQuery: string
  linkedinUrl: string
  customDraft: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FindRecruiterRequest
    const { company, position, contactName } = body

    if (!company?.trim()) {
      return NextResponse.json({ error: 'Şirket adı zorunludur' }, { status: 400 })
    }

    const cleanCompany = company.trim()
    const cleanPosition = (position || 'Yazılım / İlgili Pozisyon').trim()
    const apiKey = process.env.GEMINI_API_KEY?.trim()

    // Doğrudan İK (İnsan Kaynakları) Hiyerarşisi
    let targets: RecruiterTarget[] = [
      {
        id: 'recruiter',
        roleType: 'İşe Alım Uzmanı',
        title: 'Technical Recruiter / Talent Acquisition',
        searchQuery: `"${cleanCompany}" ("Technical Recruiter" OR "Talent Acquisition Specialist" OR "İşe Alım Uzmanı")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("Technical Recruiter" OR "Talent Acquisition Specialist" OR "İşe Alım Uzmanı")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Merhaba,\n\n${cleanCompany} bünyesindeki ${cleanPosition} pozisyonuna gerçekleştirdiğim başvurumla ilgili kısa bir merhaba demek istedim. Özgeçmişimin pozisyon gereksinimleriyle güçlü bir uyum yakaladığını düşünüyorum. Değerlendirme sürecinin güncel durumu hakkında kısa bir bilgi paylaşabilirseniz çok sevinirim.\n\nİlginiz ve vaktiniz için teşekkür ederim.`,
      },
      {
        id: 'manager',
        roleType: 'İşe Alım Müdürü',
        title: 'Talent Acquisition Lead / Manager',
        searchQuery: `"${cleanCompany}" ("Talent Acquisition Manager" OR "Talent Acquisition Lead" OR "İşe Alım Müdürü")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("Talent Acquisition Manager" OR "Talent Acquisition Lead" OR "İşe Alım Müdürü")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Merhaba,\n\n${cleanCompany} bünyesinde ekibinizin yürüttüğü başarılı çalışmaları yakından takip ediyorum. ${cleanPosition} rolü için başvurumu ilettim. Ekibinizin hedeflerine değer katabileceğim noktaları konuşmaktan memnuniyet duyarım.\n\nİyi çalışmalar dilerim.`,
      },
      {
        id: 'executive',
        roleType: 'İK Direktörü',
        title: 'Head of HR / İK Direktörü',
        searchQuery: `"${cleanCompany}" ("Head of HR" OR "HR Director" OR "İnsan Kaynakları Direktörü" OR "Head of People")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("Head of HR" OR "HR Director" OR "İnsan Kaynakları Direktörü" OR "Head of People")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Sayın Yetkili,\n\n${cleanCompany} şirket kültürünü ve sektördeki büyümesini takdirle takip ediyorum. ${cleanPosition} rolü için başvurumu ilettim. Şirketinizin vizyonuna katkı sağlamak ve ekibin bir parçası olmak beni heyecanlandırıyor. Vaktiniz için teşekkür eder, iyi çalışmalar dilerim.`,
      },
    ]

    // Gemini ile şirket ve pozisyona özel İK unvanlarını ve mesajları kişiselleştir
    if (apiKey) {
      try {
        const prompt = `Şirket: "${cleanCompany}"
Pozisyon: "${cleanPosition}"
Bilinen İsim Varsa: "${contactName || ''}"

Bu şirketteki İNSAN KAYNAKLARI (İK) yetkililerini belirle:
1. recruiter: İlandan sorumlu İşe Alım Uzmanı (Technical Recruiter / Talent Acquisition Specialist)
2. manager: İşe Alım Ekip Lideri / Müdürü (Talent Acquisition Lead / Manager)
3. executive: İK Direktörü / Başkanı (Head of HR / HR Director / VP of People)

Bana sadece şu JSON formatında cevap ver:
{
  "recruiter": {
    "title": "Unvan",
    "searchQuery": "LinkedIn arama terimi",
    "draft": "Mesaj taslağı"
  },
  "manager": {
    "title": "Unvan",
    "searchQuery": "LinkedIn arama terimi",
    "draft": "Mesaj taslağı"
  },
  "executive": {
    "title": "Unvan",
    "searchQuery": "LinkedIn arama terimi",
    "draft": "Mesaj taslağı"
  }
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
            if (parsed.recruiter) {
              targets[0].title = parsed.recruiter.title || targets[0].title
              targets[0].searchQuery = parsed.recruiter.searchQuery || targets[0].searchQuery
              targets[0].linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(targets[0].searchQuery)}&origin=GLOBAL_SEARCH_HEADER`
              targets[0].customDraft = parsed.recruiter.draft || targets[0].customDraft
            }
            if (parsed.manager) {
              targets[1].title = parsed.manager.title || targets[1].title
              targets[1].searchQuery = parsed.manager.searchQuery || targets[1].searchQuery
              targets[1].linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(targets[1].searchQuery)}&origin=GLOBAL_SEARCH_HEADER`
              targets[1].customDraft = parsed.manager.draft || targets[1].customDraft
            }
            if (parsed.executive) {
              targets[2].title = parsed.executive.title || targets[2].title
              targets[2].searchQuery = parsed.executive.searchQuery || targets[2].searchQuery
              targets[2].linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(targets[2].searchQuery)}&origin=GLOBAL_SEARCH_HEADER`
              targets[2].customDraft = parsed.executive.draft || targets[2].customDraft
            }
          }
        }
      } catch (err) {
        console.error('Gemini recruiter target error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      company: cleanCompany,
      position: cleanPosition,
      targets,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Hata oluştu' }, { status: 500 })
  }
}
