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
  explanation: string
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

    // Standart Akıllı Varsayılanlar (Gemini yanıtı gelene kadar veya yedek olarak)
    let targets: RecruiterTarget[] = [
      {
        id: 'recruiter',
        roleType: 'İşe Alım Yetkilisi',
        title: 'Talent Acquisition & Technical Recruiter',
        explanation: `${cleanCompany} bünyesinde bu pozisyonun ilk mülakat ve CV elemesini yapan yetkili.`,
        searchQuery: `"${cleanCompany}" ("Technical Recruiter" OR "Talent Acquisition" OR "İşe Alım Uzmanı")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("Technical Recruiter" OR "Talent Acquisition")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Merhaba,\n\n${cleanCompany} bünyesindeki ${cleanPosition} pozisyonuna gerçekleştirdiğim başvurumla ilgili kısa bir merhaba demek istedim. Özgeçmişimin rol gereksinimleriyle güçlü bir uyum yakaladığını düşünüyorum. Değerlendirme sürecinin güncel durumu hakkında kısa bir bilgi paylaşabilirseniz çok sevinirim.\n\nİlginiz ve vaktiniz için teşekkür ederim.`,
      },
      {
        id: 'manager',
        roleType: 'Departman / Hiring Manager',
        title: `${cleanPosition} Team Lead / Manager`,
        explanation: `İşi yapacak ekibin doğrudan lideri; teknik yetkinlik ve takım uyumuna karar veren yönetici.`,
        searchQuery: `"${cleanCompany}" ("${cleanPosition}" OR "Engineering Manager" OR "Team Lead")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("${cleanPosition}" OR "Engineering Manager" OR "Team Lead")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Merhaba,\n\n${cleanCompany} bünyesinde ekibinizin yürüttüğü çalışmaları yakından takip ediyorum. ${cleanPosition} pozisyonu için başvurumu tamamladım. Ekibinizin teknik hedeflerine ve mevcut projelerine değer katabileceğim noktaları konuşmaktan memnuniyet duyarım.\n\nİyi çalışmalar dilerim.`,
      },
      {
        id: 'executive',
        roleType: 'Üst Düzey / İK Direktörü',
        title: 'Head of People / VP of Human Resources',
        explanation: `Şirket içi insan kaynakları stratejisini ve nihai teklif süreçlerini yöneten üst düzey lider.`,
        searchQuery: `"${cleanCompany}" ("Head of People" OR "HR Director" OR "VP of HR")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("Head of People" OR "HR Director" OR "People Partner")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Sayın Yetkili,\n\n${cleanCompany} şirket kültürünü ve sektördeki büyümesini takdirle izliyorum. ${cleanPosition} rolü için başvurumu ilettim. Şirketinizin vizyonuna katkı sağlamak ve ekibin bir parçası olmak beni heyecanlandırıyor. Vaktiniz için teşekkür eder, iyi günler dilerim.`,
      },
    ]

    // Gemini varsa pozisyona ve şirkete özel 3 hedefi ve mesajı tam nokta atışı kişiselleştir
    if (apiKey) {
      try {
        const prompt = `Şirket: "${cleanCompany}"
Başvurulan Pozisyon: "${cleanPosition}"
Bilinen İsim Varsa: "${contactName || ''}"

Bu şirket ve pozisyon için LinkedIn'de iletişime geçilebilecek 3 FARKLI YETKİLİ kategorisini belirle:
1. recruiter: İşe alım uzmanı (Recruiter / Talent Acquisition)
2. manager: Departman yöneticisi (Hiring Manager / Team Lead)
3. executive: Üst düzey yetkili (Head of People / VP / Director)

Her yetkili için LinkedIn search kelimeleri ve o yetkiliye gönderilecek, samimi, net ve profesyonel Türkçe mesaj taslağı oluştur.
Bana sadece şu JSON formatında cevap ver:
{
  "recruiter": {
    "title": "Unvan",
    "explanation": "Neden bu kişi?",
    "searchQuery": "LinkedIn search keywords",
    "draft": "Mesaj taslağı"
  },
  "manager": {
    "title": "Unvan",
    "explanation": "Neden bu kişi?",
    "searchQuery": "LinkedIn search keywords",
    "draft": "Mesaj taslağı"
  },
  "executive": {
    "title": "Unvan",
    "explanation": "Neden bu kişi?",
    "searchQuery": "LinkedIn search keywords",
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
              targets[0].explanation = parsed.recruiter.explanation || targets[0].explanation
              targets[0].searchQuery = parsed.recruiter.searchQuery || targets[0].searchQuery
              targets[0].linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(targets[0].searchQuery)}&origin=GLOBAL_SEARCH_HEADER`
              targets[0].customDraft = parsed.recruiter.draft || targets[0].customDraft
            }
            if (parsed.manager) {
              targets[1].title = parsed.manager.title || targets[1].title
              targets[1].explanation = parsed.manager.explanation || targets[1].explanation
              targets[1].searchQuery = parsed.manager.searchQuery || targets[1].searchQuery
              targets[1].linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(targets[1].searchQuery)}&origin=GLOBAL_SEARCH_HEADER`
              targets[1].customDraft = parsed.manager.draft || targets[1].customDraft
            }
            if (parsed.executive) {
              targets[2].title = parsed.executive.title || targets[2].title
              targets[2].explanation = parsed.executive.explanation || targets[2].explanation
              targets[2].searchQuery = parsed.executive.searchQuery || targets[2].searchQuery
              targets[2].linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(targets[2].searchQuery)}&origin=GLOBAL_SEARCH_HEADER`
              targets[2].customDraft = parsed.executive.draft || targets[2].customDraft
            }
          }
        }
      } catch (err) {
        console.error('Gemini 3-recruiter target error:', err)
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
