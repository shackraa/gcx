import { NextRequest, NextResponse } from 'next/server'

interface FindRecruiterRequest {
  company: string
  position?: string
  contactName?: string
}

export interface RecruiterTarget {
  id: 'recruiter' | 'manager' | 'executive'
  roleType: string
  strategicGoal: string
  badge: string
  whenToUse: string
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

    // Standart ve Açık Kategoriler
    let targets: RecruiterTarget[] = [
      {
        id: 'recruiter',
        roleType: 'İşe Alım Yetkilisi',
        strategicGoal: '⚡ CV Elemesini Geç & İlk Mülakatı Al',
        badge: 'İlk 1-5 Gün İçin İdeal',
        whenToUse: 'Başvurunu yeni yaptıysan; CV\'nin otomatik sistemde beklememesi ve ilk insan temasını kurup görüşme almak için en doğru kişidir.',
        title: 'Talent Acquisition & Technical Recruiter',
        explanation: `${cleanCompany} bünyesinde bu pozisyonun ilk CV elemesini ve ön mülakatlarını organize eden yetkili.`,
        searchQuery: `"${cleanCompany}" ("Technical Recruiter" OR "Talent Acquisition" OR "İşe Alım Uzmanı")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("Technical Recruiter" OR "Talent Acquisition")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Merhaba,\n\n${cleanCompany} bünyesindeki ${cleanPosition} pozisyonuna gerçekleştirdiğim başvurumla ilgili kısa bir merhaba demek istedim. Özgeçmişimin pozisyon gereksinimleriyle güçlü bir uyum yakaladığını düşünüyorum. Değerlendirme sürecinin güncel durumu hakkında kısa bir bilgi paylaşabilirseniz çok sevinirim.\n\nİlginiz ve vaktiniz için teşekkür ederim.`,
      },
      {
        id: 'manager',
        roleType: 'Departman / Hiring Manager',
        strategicGoal: '🎯 Doğrudan Ekibe & Teknik Lidere Ulaş',
        badge: 'En Yüksek Etki (Teknik Uyum)',
        whenToUse: 'Birlikte çalışacağın doğrudan ekip liderine ulaş. İK elemesini baypas ederek projelerini, GitHub/portfolyonu ve ekibe katacağın doğrudan değeri anlatmak için kullanılır.',
        title: `${cleanPosition} Team Lead / Engineering Manager`,
        explanation: `İşi yapacak ekibin doğrudan lideri; teknik yetkinlik ve takım uyumuna karar veren yönetici.`,
        searchQuery: `"${cleanCompany}" ("${cleanPosition}" OR "Engineering Manager" OR "Team Lead")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("${cleanPosition}" OR "Engineering Manager" OR "Team Lead")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Merhaba,\n\n${cleanCompany} bünyesinde ekibinizin yürüttüğü çalışmaları yakından takip ediyorum. ${cleanPosition} pozisyonu için başvurumu ilettim. Ekibinizin teknik hedeflerine ve mevcut projelerine doğrudan katma değer sağlayabileceğim noktaları konuşmaktan memnuniyet duyarım.\n\nİyi çalışmalar dilerim.`,
      },
      {
        id: 'executive',
        roleType: 'Üst Düzey / İK Direktörü',
        strategicGoal: '👑 Sessiz Kalan Başvuruları Canlandır',
        badge: '10+ Gün Sessizse / Büyük Şirketler',
        whenToUse: 'Başvurun uzun süredir yanıtsız kaldıysa veya şirketin üst düzey kültürüne ve vizyonuna özel bir tutku duyuyorsan nihai karar vericinin dikkatini çekmek için kullanılır.',
        title: 'Head of People / VP of Human Resources',
        explanation: `Şirket içi insan kaynakları stratejisini ve nihai teklif süreçlerini yöneten üst düzey lider.`,
        searchQuery: `"${cleanCompany}" ("Head of People" OR "HR Director" OR "VP of HR")`,
        linkedinUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`"${cleanCompany}" ("Head of People" OR "HR Director" OR "People Partner")`)}&origin=GLOBAL_SEARCH_HEADER`,
        customDraft: `Sayın Yetkili,\n\n${cleanCompany} şirket kültürünü ve sektördeki büyümesini takdirle izliyorum. ${cleanPosition} rolü için başvurumu ilettim. Şirketinizin vizyonuna katkı sağlamak ve ekibin bir parçası olmak beni heyecanlandırıyor. Vaktiniz için teşekkür eder, iyi çalışmalar dilerim.`,
      },
    ]

    // Gemini ile nokta atışı kişiselleştirme
    if (apiKey) {
      try {
        const prompt = `Şirket: "${cleanCompany}"
Başvurulan Pozisyon: "${cleanPosition}"
Bilinen İsim Varsa: "${contactName || ''}"

Bu şirket ve pozisyon için LinkedIn'de iletişime geçilebilecek 3 FARKLI YETKİLİ kategorisini belirle:
1. recruiter: İşe alım uzmanı (Recruiter / Talent Acquisition)
2. manager: Departman yöneticisi (Hiring Manager / Team Lead)
3. executive: Üst düzey yetkili (Head of People / VP / Director)

Her yetkili için:
- Gerçekçi unvan (title)
- Neden ve ne zaman bu kişinin seçilmesi gerektiği (whenToUse)
- LinkedIn search kelimeleri (searchQuery)
- O kişiye gönderilmeye hazır, profesyonel, samimi Türkçe mesaj taslağı (draft)

Bana sadece şu JSON formatında cevap ver:
{
  "recruiter": {
    "title": "Unvan",
    "whenToUse": "Ne zaman seçilmeli",
    "searchQuery": "LinkedIn search keywords",
    "draft": "Mesaj taslağı"
  },
  "manager": {
    "title": "Unvan",
    "whenToUse": "Ne zaman seçilmeli",
    "searchQuery": "LinkedIn search keywords",
    "draft": "Mesaj taslağı"
  },
  "executive": {
    "title": "Unvan",
    "whenToUse": "Ne zaman seçilmeli",
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
              targets[0].whenToUse = parsed.recruiter.whenToUse || targets[0].whenToUse
              targets[0].searchQuery = parsed.recruiter.searchQuery || targets[0].searchQuery
              targets[0].linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(targets[0].searchQuery)}&origin=GLOBAL_SEARCH_HEADER`
              targets[0].customDraft = parsed.recruiter.draft || targets[0].customDraft
            }
            if (parsed.manager) {
              targets[1].title = parsed.manager.title || targets[1].title
              targets[1].whenToUse = parsed.manager.whenToUse || targets[1].whenToUse
              targets[1].searchQuery = parsed.manager.searchQuery || targets[1].searchQuery
              targets[1].linkedinUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(targets[1].searchQuery)}&origin=GLOBAL_SEARCH_HEADER`
              targets[1].customDraft = parsed.manager.draft || targets[1].customDraft
            }
            if (parsed.executive) {
              targets[2].title = parsed.executive.title || targets[2].title
              targets[2].whenToUse = parsed.executive.whenToUse || targets[2].whenToUse
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
