import { NextRequest, NextResponse } from 'next/server'

interface InterviewPrepRequest {
  company: string
  position?: string
  skills?: string[]
}

export interface StarInterviewQuestion {
  id: string
  question: string
  category: 'behavioral' | 'technical' | 'cultural' | 'impact'
  categoryLabel: string
  interviewerIntent: string
  starAnswer: {
    situation: string
    task: string
    action: string
    result: string
  }
  proTip: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InterviewPrepRequest
    const { company, position, skills } = body

    if (!company?.trim()) {
      return NextResponse.json({ error: 'Şirket adı zorunludur' }, { status: 400 })
    }

    const cleanCompany = company.trim()
    const cleanPosition = (position || 'Yazılım & Teknoloji').trim()
    const skillsList = skills && skills.length > 0 ? skills.slice(0, 10).join(', ') : 'Modern yazılım teknolojileri, takım çalışması, analitik düşünce'
    const apiKey = process.env.GEMINI_API_KEY?.trim()

    // Standart Yüksek Kalite Varsayılanlar (Yedek)
    let questions: StarInterviewQuestion[] = [
      {
        id: 'q1',
        question: `Geçmiş projelerinde karşılaştığın en karmaşık teknik veya operasyonel zorluğu anlatır mısın?`,
        category: 'technical',
        categoryLabel: 'Teknik Problem Çözme',
        interviewerIntent: `${cleanCompany} ekibi kriz anında paniğe kapılmadan analitik adımlar atıp atmadığını ölçer.`,
        starAnswer: {
          situation: `Önceki projemizde, canlı yayına 2 gün kala veri tabanı darboğazı ve yanıt gecikmesi (latency) oluştu.`,
          task: `Sistem yanıt süresini kullanıcı deneyimini aksatmayacak şekilde 200ms'nin altına indirmekle görevlendirildim.`,
          action: `Veritabanı indekslerini yeniden yapılandırdım, sorguları optimize ettim ve Redis tabanlı bir önbellekleme (cache) katmanı ekledim.`,
          result: `Sistem yanıt süresi %65 azalarak 120ms'ye düştü ve lansman sıfır kesintiyle tamamlandı.`,
        },
        proTip: `Rakam ve yüzde vermeyi unutma; ölçülebilir sonuçlar teknik liderlerin en çok dikkat ettiği şeydir.`,
      },
      {
        id: 'q2',
        question: `Takım içinde farklı görüşte olduğun bir meslektaşınla veya yöneticinle nasıl uzlaştın?`,
        category: 'behavioral',
        categoryLabel: 'Davranışsal & İletişim',
        interviewerIntent: `Egolu olup olmadığını ve takım içi çatışmaları yapıcı bir şekilde çözüp çözemediğini test eder.`,
        starAnswer: {
          situation: `Bir özellik geliştirmesinde mimari yaklaşım konusunda ekipteki bir başka kıdemli mühendisle zıt fikirlere sahiptik.`,
          task: `Sprint takvimini geciktirmeden ortak ve sürdürülebilir bir karara varmamız gerekiyordu.`,
          action: `Fikirlerimizi tartışmak yerine her iki yaklaşımın performans ve bakım maliyetlerini gösteren mini bir POC (Proof of Concept) kıyaslaması hazırladım.`,
          result: `Veriler ışığında hibrit bir modelde anlaştık ve özellik planlanan süreden 1 gün önce sorunsuz teslim edildi.`,
        },
        proTip: `Asla karşı tarafı suçlama; odak noktanın daima 'ekibin başarısı ve ortak hedef' olduğunu vurgula.`,
      },
      {
        id: 'q3',
        question: `Neden ${cleanCompany} bünyesinde ${cleanPosition} rolünde çalışmak istiyorsun?`,
        category: 'cultural',
        categoryLabel: 'Kültür & Şirket Uyumu',
        interviewerIntent: `Rastgele mi başvurdun yoksa şirketin vizyonunu ve ürününü gerçekten benimsedin mi?`,
        starAnswer: {
          situation: `${cleanCompany}'ın sektörde benimsediği yenilikçi yaklaşımı ve mühendislik kültürünü uzun süredir takip ediyorum.`,
          task: `Bu vizyona sadece bir çalışan olarak değil, doğrudan katkı sağlayan bir takım oyuncusu olarak dahil olmak istedim.`,
          action: `${cleanPosition} rolünde aranan yetkinlikler ile kendi tecrübelerimin (%s ${skillsList}) doğrudan örtüştüğünü ve ekibin büyüme hedeflerini hızlandırabileceğimi gördüm.`,
          result: `Hem kişisel gelişimimi en üst seviyeye taşımak hem de şirketin mevcut projelerine katma değer sunmak için buradayım.`,
        },
        proTip: `Şirketin yakın zamanda attığı bir adımı veya projesini cümleye katarak araştırmış olduğunu hissettir.`,
      },
      {
        id: 'q4',
        question: `İnisiyatif alarak süreçleri veya ürünü iyileştirdiğin bir örneği paylaşabilir misin?`,
        category: 'impact',
        categoryLabel: 'Etki & İnisiyatif Alma',
        interviewerIntent: `Sadece söyleneni mi yapıyorsun yoksa şirkete artı değer katacak vizyona sahip misin?`,
        starAnswer: {
          situation: `Ekipte kod gözden geçirme (code review) ve dağıtım süreçlerinin manuel olması haftalık 6 saatlik kayba yol açıyordu.`,
          task: `Kimse benden istememiş olmasına rağmen bu süreci otomatikleştirerek ekibe zaman kazandırmaya karar verdim.`,
          action: `GitHub Actions tabanlı bir CI/CD hattı kurgulayarak otomatik test ve lint denetimlerini devreye aldım.`,
          result: `Yayınlama süreleri %40 hızlandı ve ekibin haftalık 5 saatlik geliştirme vakti kazanmasını sağladım.`,
        },
        proTip: `'Kimse benden istemedi ama şirketin ihtiyacı olduğunu gördüm' vurgusu mülakatta en yüksek puanı getirir.`,
      },
    ]

    // Gemini ile şirket ve pozisyona özel nokta atışı mülakat soruları üret
    if (apiKey) {
      try {
        const prompt = `Şirket: "${cleanCompany}"
Pozisyon: "${cleanPosition}"
Adayın Yetenekleri: "${skillsList}"

Bu şirket ve pozisyon için yapılacak iş mülakatında sorulması en muhtemel 4 soruyu ve her biri için STAR formatında (Durum, Görev, Eylem, Sonuç) güçlü ve gerçekçi Türkçe yanıtları hazırla.

Bana sadece şu JSON formatında cevap ver:
{
  "questions": [
    {
      "id": "q1",
      "question": "Soru metni",
      "category": "technical | behavioral | cultural | impact",
      "categoryLabel": "Kategori Başlığı",
      "interviewerIntent": "Mülakatçının amacı",
      "starAnswer": {
        "situation": "Durum (Situation)",
        "task": "Görev (Task)",
        "action": "Eylem (Action)",
        "result": "Ölçülebilir Sonuç (Result)"
      },
      "proTip": "Mülakatçıya söylenecek kritik tüyo"
    }
  ]
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
            if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              questions = parsed.questions
            }
          }
        }
      } catch (err) {
        console.error('Gemini interview prep error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      company: cleanCompany,
      position: cleanPosition,
      questions,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Hata oluştu' }, { status: 500 })
  }
}
