import { NextRequest, NextResponse } from 'next/server'
import type { Resume, WorkplaceType, DatePosted, MatchedJob } from '@/types'

interface MatchRequest {
  resumes: Resume[]
  selectedResumeId?: string
  workplaceType?: WorkplaceType
  location?: string
  datePosted?: DatePosted
  jobText?: string
  jobUrl?: string
  apiKey?: string
}

// Generate platform-specific deep links with Boolean search
export function buildPlatformSearchLinks(params: {
  query: string
  location: string
  workplaceType: WorkplaceType
  datePosted: DatePosted
}) {
  const { query, location, workplaceType, datePosted } = params
  const encodedQuery = encodeURIComponent(query)
  const encodedLocation = encodeURIComponent(location || 'Türkiye')

  // LinkedIn Workplace filter: 1=On-site (Fiziksel), 2=Remote (Uzaktan), 3=Hybrid (Hibrit)
  let linkedinWT = ''
  if (workplaceType === 'onsite') linkedinWT = '&f_WT=1'
  else if (workplaceType === 'remote') linkedinWT = '&f_WT=2'
  else if (workplaceType === 'hybrid') linkedinWT = '&f_WT=3'

  // LinkedIn Time filter: r86400=Past 24h, r604800=Past week, r2592000=Past month
  let linkedinTPR = ''
  if (datePosted === 'past_24h') linkedinTPR = '&f_TPR=r86400'
  else if (datePosted === 'past_week') linkedinTPR = '&f_TPR=r604800'
  else if (datePosted === 'past_month') linkedinTPR = '&f_TPR=r2592000'

  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedQuery}&location=${encodedLocation}${linkedinWT}${linkedinTPR}&sortBy=DD`
  const indeedUrl = `https://tr.indeed.com/jobs?q=${encodedQuery}&l=${encodedLocation}&sort=date`
  const kariyerUrl = `https://www.kariyer.net/is-ilanlari?kw=${encodedQuery}`
  const googleJobsUrl = `https://www.google.com/search?q=${encodedQuery}+is+ilanlari+${encodedLocation}&ibp=htl;jobs`

  return {
    linkedin: linkedinUrl,
    indeed: indeedUrl,
    kariyer: kariyerUrl,
    googleJobs: googleJobsUrl,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MatchRequest
    const {
      resumes = [],
      selectedResumeId,
      workplaceType = 'all',
      location = 'Türkiye',
      datePosted = 'past_week',
      jobText,
      jobUrl,
      apiKey,
    } = body

    const activeApiKey = apiKey?.trim() || process.env.GEMINI_API_KEY?.trim()

    if (resumes.length === 0) {
      return NextResponse.json(
        { error: 'NO_RESUMES', message: 'Lütfen önce CV Havuzunuza en az bir CV ekleyin.' },
        { status: 400 }
      )
    }

    const activeResumes = selectedResumeId && selectedResumeId !== 'all'
      ? resumes.filter((r) => r._id === selectedResumeId)
      : resumes

    const primaryResume = activeResumes[0] || resumes[0]

    // Construct primary Boolean query
    const targetKeywords = (primaryResume?.skills || []).slice(0, 4)
    const roleTerm = primaryResume?.targetRole || primaryResume?.name?.replace(/\s*cv\s*/gi, '') || 'Developer'
    const booleanQuery = targetKeywords.length > 0
      ? `"${roleTerm}" AND (${targetKeywords.map((s) => `"${s}"`).join(' OR ')})`
      : `"${roleTerm}"`

    const platformLinks = buildPlatformSearchLinks({
      query: booleanQuery,
      location,
      workplaceType,
      datePosted,
    })

    // If jobText is provided, perform detailed match analysis using Gemini
    let jobAnalysis: MatchedJob | null = null

    if (jobText && jobText.trim() && activeApiKey) {
      const prompt = `Sen uzman bir Kariyer Koçu ve Teknik İşe Alım Yöneticisisin.
Aşağıda kullanıcının CV havuzundaki CV'leri ve başvurmak istediği bir İlan Metni verilmiştir.

KULLANICI CV'LERİ:
${resumes
  .map(
    (r, idx) => `
CV #${idx + 1}: ${r.name} (Kategori: ${r.category}, Hedef Rol: ${r.targetRole || 'Belirtilmemiş'})
Yetenekler: ${(r.skills || []).join(', ')}
Cover Letter: ${r.coverLetter || ''}
Özet: ${r.summary || ''}
Metin: ${r.rawText ? r.rawText.slice(0, 500) : ''}
`
  )
  .join('\n---\n')}

İNCELENECEK İLAN METNİ:
${jobText.slice(0, 3000)}

GÖREVİN:
1. Bu ilanın pozisyon başlığını ve şirket adını çıkar.
2. Bu ilan için en uygun CV'yi belirle (recommendedResumeId).
3. Bu CV ile ilan arasındaki uyumluluk skorunu (0-100 arası tamsayı) hesapla.
4. İlanın gerektirdiği ve kullanıcının CV'sinde bulunan eşleşen yetenekleri listele (matchingSkills).
5. İlanda istenen ama kullanıcının CV'sinde eksik olan yetenekleri listele (missingSkills).
6. 2-3 cümlelik Türkçe samimi ve profesyonel başvuru tavsiyesi yaz (reason). Çalışma modelini (onsite/hybrid/remote) belirle.

DÖNÜŞ FORMATI (Yalnızca geçerli JSON dön):
{
  "title": string,
  "company": string,
  "location": string,
  "workplaceType": "onsite" | "hybrid" | "remote",
  "matchScore": number,
  "matchingSkills": string[],
  "missingSkills": string[],
  "recommendedResumeId": string,
  "recommendedResumeName": string,
  "reason": string
}`

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { response_mime_type: 'application/json', temperature: 0.1 },
            }),
          }
        )

        if (geminiRes.ok) {
          const gData = await geminiRes.json()
          const rawTxt = gData?.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawTxt) {
            const parsed = JSON.parse(rawTxt)
            jobAnalysis = {
              id: 'job_' + Date.now(),
              title: parsed.title || 'İlan Pozisyonu',
              company: parsed.company || 'İlan Veren Şirket',
              location: parsed.location || location,
              workplaceType: (parsed.workplaceType as 'onsite' | 'hybrid' | 'remote') || (workplaceType !== 'all' ? workplaceType : 'onsite'),
              url: jobUrl || '',
              source: jobUrl?.includes('linkedin') ? 'linkedin' : jobUrl?.includes('indeed') ? 'indeed' : 'other',
              matchScore: Math.min(100, Math.max(0, Number(parsed.matchScore) || 75)),
              matchingSkills: parsed.matchingSkills || [],
              missingSkills: parsed.missingSkills || [],
              recommendedResumeId: parsed.recommendedResumeId || primaryResume._id,
              recommendedResumeName: parsed.recommendedResumeName || primaryResume.name,
              reason: parsed.reason || 'CV yetenekleriniz bu ilanla yüksek oranda örtüşmektedir.',
            }
          }
        }
      } catch (err) {
        console.error('Job match analysis error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        booleanQuery,
        platformLinks,
        jobAnalysis,
        activeResumes: activeResumes.map((r) => ({
          id: r._id,
          name: r.name,
          category: r.category,
          targetRole: r.targetRole,
          skills: r.skills,
        })),
      },
    })
  } catch (error) {
    console.error('Match jobs error:', error)
    return NextResponse.json(
      {
        error: 'SERVER_ERROR',
        message: error instanceof Error ? error.message : 'İlan eşleştirme servisinde hata oluştu.',
      },
      { status: 500 }
    )
  }
}
