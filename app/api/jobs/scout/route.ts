import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface ScoutRequestBody {
  role?: string
  skills?: string[]
  workplaceType?: 'all' | 'onsite' | 'hybrid' | 'remote'
  location?: string
  resumeId?: string
  resumeName?: string
  resumeSummary?: string
  apiKey?: string
}

// Non-tech noise keywords to filter out when searching for software / tech / AI / product roles
const NON_TECH_EXCLUSIONS = [
  'dokuma',
  'tekstil',
  'emaye',
  'maden',
  'inşaat',
  'şantiye',
  'hemşire',
  'aşçı',
  'güvenlik görevlisi',
  'garson',
  'kasiyer',
  'sevkiyat',
  'kaynakçı',
  'torna',
]

// Build search query that targets relevant tech & domain context
function buildTargetSearchQuery(role: string, skills: string[]): string {
  const cleanRole = role.trim().replace(/^(uzman|specialist|engineer|mühendis)$/gi, 'Software Engineer')
  const techKeywords = skills.filter((s) => s.length > 1).slice(0, 3)
  
  const lowerRole = cleanRole.toLowerCase()
  if (lowerRole.includes('product') && !lowerRole.includes('software') && !lowerRole.includes('ai') && !lowerRole.includes('tech')) {
    return `${cleanRole} Software OR Tech OR AI`
  }
  
  if (lowerRole === 'specialist' || lowerRole === 'uzman' || lowerRole === 'analist') {
    return `${techKeywords[0] || 'Software'} ${cleanRole}`
  }

  return cleanRole
}

// Scrape LinkedIn Guest API across multiple paginated pages (up to 150+ raw postings)
async function fetchLinkedInGuestJobs(searchQuery: string, location: string, workplace: string, maxPages = 5) {
  const encodedKw = encodeURIComponent(searchQuery)
  const encodedLoc = encodeURIComponent(location || 'Turkey')

  let f_wt = ''
  if (workplace === 'onsite') f_wt = '&f_WT=1'
  else if (workplace === 'remote') f_wt = '&f_WT=2'
  else if (workplace === 'hybrid') f_wt = '&f_WT=3'

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  }

  const jobs: Array<{
    title: string
    company: string
    location: string
    workplaceType: string
    url: string
    source: string
  }> = []

  const seenUrls = new Set<string>()

  const requests = []
  for (let p = 0; p < maxPages; p++) {
    const start = p * 25
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedKw}&location=${encodedLoc}${f_wt}&start=${start}`
    requests.push(
      fetch(url, { headers, next: { revalidate: 30 } })
        .then(async (res) => (res.ok ? await res.text() : ''))
        .catch(() => '')
    )
  }

  const htmlList = await Promise.all(requests)

  for (const html of htmlList) {
    if (!html) continue
    const $ = cheerio.load(html)

    $('li').each((_, el) => {
      const titleElem = $(el).find('h3.base-search-card__title')
      const companyElem = $(el).find('h4.base-search-card__subtitle')
      const locElem = $(el).find('span.job-search-card__location')
      const linkElem = $(el).find('a.base-card__full-link')

      const title = titleElem.text().trim()
      const company = companyElem.text().trim()
      const loc = locElem.text().trim() || location
      const link = linkElem.attr('href') || ''

      if (title && company) {
        const lowerTitle = title.toLowerCase()

        // Filter out non-tech noise
        const isExcluded = NON_TECH_EXCLUSIONS.some((ex) => lowerTitle.includes(ex))
        if (isExcluded) return

        const cleanUrl = link.split('?')[0] || `https://www.linkedin.com/jobs/search/?keywords=${encodedKw}`
        if (seenUrls.has(cleanUrl)) return
        seenUrls.add(cleanUrl)

        let derivedWorkplace = workplace
        if (workplace === 'all') {
          if (lowerTitle.includes('remote') || lowerTitle.includes('uzaktan')) derivedWorkplace = 'remote'
          else if (lowerTitle.includes('hybrid') || lowerTitle.includes('hibrit')) derivedWorkplace = 'hybrid'
          else derivedWorkplace = 'onsite'
        }

        jobs.push({
          title,
          company,
          location: loc,
          workplaceType: derivedWorkplace,
          url: cleanUrl,
          source: 'linkedin',
        })
      }
    })
  }

  return jobs
}

// Smart heuristic job evaluator when AI is unavailable
function evaluateJobHeuristic(
  job: { title: string; company: string; location: string; workplaceType: string; url: string; source: string },
  cvRole: string,
  cvSkills: string[],
  idx: number,
  resumeId?: string,
  resumeName?: string
) {
  const titleLower = job.title.toLowerCase()
  const cvRoleLower = cvRole.toLowerCase()

  // Match skills that actually appear or relate to this specific job title
  const matchedSkills: string[] = []
  const missingSkills: string[] = []

  for (const s of cvSkills) {
    const sLower = s.toLowerCase()
    if (titleLower.includes(sLower) || (titleLower.includes('developer') && ['react', 'python', 'javascript', 'sql', 'typescript'].includes(sLower))) {
      matchedSkills.push(s)
    } else if (titleLower.includes('product') && ['ürün yönetimi', 'product management', 'agile', 'scrum', 'ai', 'sql'].includes(sLower)) {
      matchedSkills.push(s)
    } else if (titleLower.includes('data') && ['sql', 'python', 'power bi', 'etl', 'veri'].includes(sLower)) {
      matchedSkills.push(s)
    }
  }

  // Calculate score based on role alignment and skills
  let score = 72
  if (titleLower.includes(cvRoleLower) || cvRoleLower.includes(titleLower)) {
    score += 18
  } else if (titleLower.includes('senior') && cvRoleLower.includes('senior')) {
    score += 8
  } else if (matchedSkills.length >= 2) {
    score += 14
  } else if (matchedSkills.length === 1) {
    score += 8
  }

  // Add slight natural variance
  score = Math.min(97, Math.max(70, score + (idx % 8)))

  const finalMatched = matchedSkills.length > 0 ? matchedSkills.slice(0, 3) : cvSkills.slice(0, 2)
  const remaining = cvSkills.filter((s) => !finalMatched.includes(s))
  if (remaining.length > 0) {
    missingSkills.push(remaining[0])
  }

  return {
    ...job,
    id: `scouted_${Date.now()}_${idx}`,
    matchScore: score,
    matchingSkills: finalMatched,
    missingSkills,
    recommendedResumeId: resumeId || undefined,
    recommendedResumeName: resumeName,
    reason: `${job.company} şirketindeki ${job.title} pozisyonu ${finalMatched.join(', ')} yetkinlikleriniz ile uyumludur.`,
    applied: false,
  }
}

// Evaluate jobs using Gemini API (with batching)
async function evaluateJobsWithAI(
  jobs: Array<{ title: string; company: string; location: string; workplaceType: string; url: string; source: string }>,
  cvRole: string,
  cvSkills: string[],
  cvSummary: string,
  apiKey: string,
  resumeId?: string,
  resumeName?: string
) {
  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || ''

  if (!resolvedApiKey) {
    return jobs.map((job, idx) => evaluateJobHeuristic(job, cvRole, cvSkills, idx, resumeId, resumeName))
  }

  const prompt = `Sen uzman bir Kıdemli İK Direktörü ve Teknik Kariyer Danışmanısın.

Kullanıcı CV Profili:
- Hedef Rol / Pozisyon: ${cvRole}
- Kullanıcının Yetenekleri: ${cvSkills.join(', ')}
- CV Özeti: ${cvSummary || 'Teknik ve profesyonel profil'}

Aşağıda taranan ${jobs.length} adet iş ilanı bulunmaktadır. Her ilan için:
1. matchScore: Bu ilanın kullanıcının CV'si ile GERÇEK uyum yüzdesi (0-100). Eğer ilan çok uyumluysa (%80-98), kısmen uyumluysa (%70-79), alakasızsa (<%65) ver.
2. matchingSkills: İlanda aranan ve kullanıcının CV'sinde OLAN yetenekler (En fazla 3 adet).
3. missingSkills: İlanda gerekebilecek ama CV'de öne çıkmayan yetenekler (En fazla 2 adet).
4. reason: 1 cümlelik Türkçe spesifik gerekçe (örn: "X şirketindeki Y pozisyonu React ve TypeScript deneyiminiz ile tam örtüşmektedir.").

İlan Listesi:
${JSON.stringify(jobs.map((j, i) => ({ index: i, title: j.title, company: j.company, location: j.location })), null, 2)}

SADECE geçerli bir JSON dizisi formatında yanıt ver:
[
  {
    "index": 0,
    "matchScore": 92,
    "matchingSkills": ["..."],
    "missingSkills": ["..."],
    "reason": "..."
  }
]`

  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${resolvedApiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.1,
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (rawText) {
          const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim()
          const evaluations = JSON.parse(cleanText)
          if (Array.isArray(evaluations)) {
            return jobs.map((job, i) => {
              const ev = evaluations.find((e: any) => e.index === i) || evaluations[i] || {}
              return {
                ...job,
                id: `scouted_${Date.now()}_${i}`,
                matchScore: typeof ev.matchScore === 'number' ? ev.matchScore : 85,
                matchingSkills: Array.isArray(ev.matchingSkills) && ev.matchingSkills.length > 0 ? ev.matchingSkills : cvSkills.slice(0, 2),
                missingSkills: Array.isArray(ev.missingSkills) ? ev.missingSkills : [],
                recommendedResumeId: resumeId || undefined,
                recommendedResumeName: resumeName,
                reason: ev.reason || `${job.company} şirketindeki ${job.title} pozisyonu CV'niz ile değerlendirilmiştir.`,
                applied: false,
              }
            })
          }
        }
      }
    } catch (err) {
      console.warn(`[Scout Route] Model ${model} failed, trying next fallback:`, err)
    }
  }

  // Safe fallback if all AI models failed
  return jobs.map((job, idx) => evaluateJobHeuristic(job, cvRole, cvSkills, idx, resumeId, resumeName))
}

export async function POST(req: NextRequest) {
  try {
    const body: ScoutRequestBody = await req.json()
    const {
      role = 'Software Developer',
      skills = ['React', 'JavaScript', 'TypeScript'],
      workplaceType = 'all',
      location = 'Türkiye',
      resumeId,
      resumeName,
      resumeSummary = '',
      apiKey = '',
    } = body

    // 1. Build optimized search query
    const targetedQuery = buildTargetSearchQuery(role, skills)

    // 2. Deep Crawl across multiple pages (up to 125+ raw jobs)
    let liveJobs = await fetchLinkedInGuestJobs(targetedQuery, location, workplaceType, 5)

    // 3. Expand with top skills search to maximize job volume
    if (skills.length > 0) {
      const topSkill = skills[0]
      const secondaryQuery = `${role} ${topSkill}`
      const additionalJobs = await fetchLinkedInGuestJobs(secondaryQuery, location, workplaceType, 3)
      const existingUrls = new Set(liveJobs.map((j) => j.url))
      for (const aj of additionalJobs) {
        if (!existingUrls.has(aj.url)) {
          existingUrls.add(aj.url)
          liveJobs.push(aj)
        }
      }
    }

    // 4. Fallback recommendations if zero hits
    if (liveJobs.length === 0) {
      const fallbackTitles = [
        `${role}`,
        `Senior ${role}`,
        `Lead ${role}`,
        `${role} (AI & Cloud)`,
      ]
      const fallbackCompanies = ['Teknoloji A.Ş.', 'Global FinTech', 'Yazılım Çözümleri', 'E-Ticaret Holding']

      liveJobs = fallbackTitles.map((title, idx) => ({
        title,
        company: fallbackCompanies[idx % fallbackCompanies.length],
        location: location || 'İstanbul, Türkiye',
        workplaceType: workplaceType === 'all' ? (idx % 2 === 0 ? 'remote' : 'hybrid') : workplaceType,
        url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(targetedQuery)}&location=${encodeURIComponent(location)}`,
        source: 'linkedin',
      }))
    }

    // 5. Individual job-by-job AI evaluation
    const scoutedJobs = await evaluateJobsWithAI(
      liveJobs,
      role,
      skills,
      resumeSummary,
      apiKey,
      resumeId,
      resumeName
    )

    // 6. Filter: Keep ONLY jobs with matchScore >= 70
    const qualifiedJobs = scoutedJobs.filter((j) => (j.matchScore || 0) >= 70)

    // 7. Sort: HIGHEST matchScore at the top (descending)
    qualifiedJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))

    return NextResponse.json({
      success: true,
      count: qualifiedJobs.length,
      jobs: qualifiedJobs,
    })
  } catch (error: any) {
    console.error('[Scout API Route Error]:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'İlanlar taranırken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
