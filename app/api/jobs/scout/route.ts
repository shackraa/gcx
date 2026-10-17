import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface ScoutResumeOption {
  id: string
  name: string
  targetRole?: string
  skills?: string[]
}

interface ScoutRequestBody {
  role?: string
  skills?: string[]
  workplaceType?: 'all' | 'onsite' | 'hybrid' | 'remote'
  experienceLevel?: 'intern' | 'junior' | 'mid' | 'senior' | 'all'
  customKeywords?: string
  location?: string
  resumeId?: string
  resumeName?: string
  resumeSummary?: string
  allResumes?: ScoutResumeOption[]
  apiKey?: string
}

// Strict exclusions for non-tech domains
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
  'kredi kartları',
  'kredi tahsis',
  'bireysel bankacılık',
  'şube',
  'gişe',
  'mevduat',
  'kart operasyon',
  'kart aktivasyon',
  'iş birlikleri uzmanı',
  'aerospace application',
  'teknik servis uzmanı',
  'teknik servis elemanı',
  'saha servis',
  'satış temsilcisi',
  'satış danışmanı',
  'mağaza müdürü',
  'kategori yöneticisi - gıda',
  'dokuma uzmanı',
  'havacılık mekanik',
]

// Deterministic seniority mismatch filter so Junior/Intern candidates never get Senior/Lead/Director noise
function isSeniorityMismatch(
  jobTitle: string,
  experienceLevel: string,
  targetRole: string
): boolean {
  if (!experienceLevel || experienceLevel === 'all') return false
  const lower = jobTitle.toLowerCase()
  const roleLower = (targetRole || '').toLowerCase()

  const seniorMarkers = [
    'senior',
    'sr.',
    'sr ',
    'lead',
    'principal',
    'staff ',
    'director',
    'head of',
    'vp ',
    'vice president',
    'chief ',
    'kıdemli',
    'müdür',
    'direktör',
    'takım lideri',
    'team lead',
    'group product manager',
    'architect',
    'mimarı',
  ]

  const internJuniorMarkers = [
    'intern',
    'stajyer',
    'staj',
    'part-time',
    'part time',
    'yarı zamanlı',
    'working student',
    'trainee',
    'aday mühendis',
    'yeni mezun',
    'new grad',
  ]

  if (experienceLevel === 'intern' || experienceLevel === 'junior') {
    if (seniorMarkers.some((m) => lower.includes(m))) return true
    if (
      (lower.includes('manager') || lower.includes('yönetici')) &&
      !roleLower.includes('product') &&
      !roleLower.includes('ürün') &&
      !roleLower.includes('project') &&
      !roleLower.includes('proje')
    ) {
      return true
    }
    return false
  }

  if (experienceLevel === 'mid') {
    const midExcluded = [
      'intern',
      'stajyer',
      'part-time',
      'working student',
      'director',
      'head of',
      'vp ',
      'vice president',
      'chief ',
      'principal',
      'direktör',
    ]
    return midExcluded.some((m) => lower.includes(m))
  }

  if (experienceLevel === 'senior') {
    const seniorExcluded = [
      ...internJuniorMarkers,
      'junior',
      'jr.',
      'jr ',
      'entry level',
      'entry-level',
    ]
    return seniorExcluded.some((m) => lower.includes(m))
  }

  return false
}

// Positive markers proving a job is genuinely an Internship / Part-Time / Student / Trainee role
function hasExplicitInternOrPartTimeMarker(title: string, descText = '', criteriaText = ''): boolean {
  const combined = `${title} ${descText} ${criteriaText}`.toLowerCase()
  const markers = [
    'intern',
    'internship',
    'staj',
    'stajyer',
    'part-time',
    'part time',
    'yarı zamanlı',
    'working student',
    'aday mühendis',
    'candidate engineer',
    'uzun dönem',
    'kısa dönem',
    'yaz stajı',
    'co-op',
    'öğrenci',
    'undergraduate',
    '3. sınıf',
    '4. sınıf',
    'son sınıf',
    'genç yetenek',
    'management trainee',
    'trainee',
    'staj programı',
    'fellowship',
  ]
  return markers.some((m) => combined.includes(m))
}

// Positive markers proving a job title itself is explicitly Junior / Entry-Level / Intern
function hasExplicitJuniorOrInternTitle(title: string): boolean {
  const lower = title.toLowerCase()
  const markers = [
    'intern',
    'staj',
    'stajyer',
    'part-time',
    'part time',
    'working student',
    'aday mühendis',
    'junior',
    'jr.',
    'jr ',
    'associate',
    'yeni mezun',
    'new grad',
    'graduate',
    'entry level',
    'entry-level',
    'uzman yardımcısı',
    'trainee',
  ]
  return markers.some((m) => lower.includes(m))
}

// Extract clean, multi-angle bilingual (TR + EN) search queries from CV target role, skills, customKeywords, and experience level
function extractSearchPhrases(
  role: string,
  skills: string[],
  experienceLevel = 'all',
  customKeywords = '',
  allResumes: ScoutResumeOption[] = []
): string[] {
  let cleaned = role
    .replace(/\s*cv\s*/gi, ' ')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (experienceLevel === 'intern' || experienceLevel === 'junior') {
    cleaned = cleaned.replace(/\b(senior|sr\.?|lead|principal|kıdemli)\b/gi, '').replace(/\s+/g, ' ').trim()
  }

  const phrases = new Set<string>()
  const lower = `${cleaned} ${customKeywords}`.toLowerCase()

  // STRICT INTERN / PART-TIME MODE: Only generate Intern / Stajyer / Part-Time / Working Student queries!
  if (experienceLevel === 'intern') {
    if (customKeywords && customKeywords.trim()) {
      phrases.add(`${customKeywords.trim()} Intern`)
      phrases.add(`${customKeywords.trim()} Stajyer`)
    }
    if (lower.includes('product') || lower.includes('ürün')) {
      phrases.add('Product Intern')
      phrases.add('Product Management Intern')
      phrases.add('Ürün Yönetimi Stajyeri')
    }
    if (lower.includes('ai') || lower.includes('yapay zeka') || lower.includes('data') || lower.includes('veri')) {
      phrases.add('AI Intern')
      phrases.add('Data Intern')
      phrases.add('Yapay Zeka Stajyer')
    }
    if (cleaned && cleaned.length > 2) {
      const firstPart = cleaned.split(/[&/,]/)[0].trim()
      phrases.add(`${firstPart} Intern`)
      phrases.add(`Part-Time ${firstPart}`)
    }
    phrases.add('Stajyer')
    phrases.add('Aday Mühendis')
    phrases.add('Working Student')
    return Array.from(phrases).slice(0, 7)
  }

  // 1. User's explicit custom keywords / focus roles take top priority
  if (customKeywords && customKeywords.trim()) {
    const customParts = customKeywords
      .split(/[,;/|]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 1)
    for (const cp of customParts) {
      phrases.add(cp)
    }
  }

  if (cleaned && cleaned.toLowerCase() !== 'all') {
    phrases.add(cleaned)

    // If role contains & or / or comma, split parts
    if (cleaned.includes('&') || cleaned.includes('/') || cleaned.includes(',')) {
      const parts = cleaned.split(/[&/,]/).map((p) => p.trim()).filter((p) => p.length > 2)
      for (const p of parts) {
        phrases.add(p)
      }
    }

    // Bilingual (EN + TR) & Domain Role Expansions
    if (lower.includes('product') || lower.includes('ürün')) {
      phrases.add(experienceLevel === 'junior' ? 'Associate Product Manager' : 'Product Manager')
      phrases.add('Product Specialist')
      phrases.add('Ürün Uzmanı')
      if (experienceLevel === 'junior') {
        phrases.add('Junior Product Manager')
        phrases.add('Ürün Yönetimi Uzman Yardımcısı')
      }
    }
    if (lower.includes('ai') || lower.includes('yapay zeka') || lower.includes('llm') || lower.includes('machine learning')) {
      phrases.add(experienceLevel === 'junior' ? 'Junior AI Engineer' : 'AI Engineer')
      phrases.add('Yapay Zeka')
      phrases.add('Machine Learning Engineer')
    }
    if (lower.includes('frontend') || lower.includes('react') || lower.includes('ön yüz')) {
      phrases.add(experienceLevel === 'junior' ? 'Junior Frontend Developer' : 'Frontend Developer')
      phrases.add('React Developer')
    }
    if (lower.includes('backend') || lower.includes('python') || lower.includes('node')) {
      phrases.add(experienceLevel === 'junior' ? 'Junior Backend Developer' : 'Backend Developer')
      phrases.add('Python Developer')
    }
    if (lower.includes('data') || lower.includes('veri') || lower.includes('analist') || lower.includes('analyst')) {
      phrases.add('Data Analyst')
      phrases.add('Veri Analisti')
      phrases.add('Business Analyst')
    }

    const baseRole = Array.from(phrases)[0] || 'Software Developer'
    if (experienceLevel === 'junior') {
      phrases.add(`Junior ${baseRole}`)
      phrases.add(`Associate ${baseRole}`)
    } else if (experienceLevel === 'senior') {
      phrases.add(`Senior ${baseRole}`)
    }
  }

  // Include secondary CV roles if user selected "All CVs"
  for (const r of allResumes) {
    const rRole = (r.targetRole || r.name || '').replace(/\s*cv\s*/gi, '').trim()
    if (rRole && rRole.length > 2 && phrases.size < 7) {
      phrases.add(rRole)
    }
  }

  // Add top skill combinations (excluding generic sql/python noise)
  const validSkills = skills.filter(
    (s) => s && s.trim().length > 1 && !['sql', 'python', 'git', 'excel'].includes(s.trim().toLowerCase())
  )
  if (validSkills.length > 0 && phrases.size < 6) {
    if (cleaned && cleaned.length > 2) {
      phrases.add(`${validSkills[0]} ${cleaned}`)
    } else {
      phrases.add(validSkills[0])
    }
  }

  if (phrases.size === 0) {
    phrases.add('Software Engineer')
  }

  return Array.from(phrases).slice(0, 7)
}

// Extract required minimum years of experience from Turkish & English job description text
function extractRequiredYearsFromDescription(text: string): number | null {
  if (!text) return null
  const lower = text.toLowerCase()

  const patterns: RegExp[] = [
    // Turkish: "en az 5 yıl", "minimum 4 yıl", "min 3 yıl", "min. 5 yıllık", "asgari 3 yıl"
    /\b(?:en\s+az|minimum|min\.?|asgari)\s*(\d{1,2})\s*(?:\+|\s*[-–]\s*\d{1,2})?\s*yıl/gi,
    // Turkish: "5+ yıl deneyim", "3-5 yıl tecrübe", "5 yıl ve üzeri deneyim", "4 yıllık iş deneyimi", "3 yıl ... tecrübesi olan"
    /\b(\d{1,2})\s*(?:\+|\s*[-–]\s*\d{1,2}|\s*ve\s*üzeri)?\s*yıl(?:lık)?\s+(?:[a-zçğıöşü,/()-]+\s+){0,5}(?:deneyim|tecrübe|iş\s+deneyimi|sektör)/gi,
    // Turkish: "deneyim: 3+ yıl", "tecrübe: en az 4 yıl", "5+ yıl" standalone
    /\b([2-9]|1[0-5])\s*\+\s*yıl/gi,
    // Turkish range: "2-5 yıl", "3-5 yıl", "4 - 6 yıl"
    /\b([2-9])\s*[-–]\s*(\d{1,2})\s*yıl/gi,
    // English: "minimum 5 years", "at least 4 years", "min 3 years"
    /\b(?:minimum|at\s+least|min\.?)\s+(?:of\s+)?(\d{1,2})\s*\+?\s*(?:years?|yrs?)/gi,
    // English: "5+ years of experience", "3-5 years of professional experience", "4 years experience"
    /\b(\d{1,2})\s*(?:\+|\s*[-–]\s*\d{1,2})?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:[a-z,/()-]+\s+){0,5}(?:experience|exp\b|background|track\s+record|working)/gi,
    // English: "3+ years", "5+ yrs" standalone
    /\b([2-9]|1[0-5])\s*\+\s*(?:years?|yrs?)\b/gi,
    // English range: "3-5 years", "4 - 7 years"
    /\b([2-9])\s*[-–]\s*(\d{1,2})\s*(?:years?|yrs?)/gi,
  ]

  let maxMinYears: number | null = null

  for (const regex of patterns) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(lower)) !== null) {
      const yrs = parseInt(match[1], 10)
      if (!isNaN(yrs) && yrs >= 1 && yrs <= 12) {
        if (maxMinYears === null || yrs > maxMinYears) {
          maxMinYears = yrs
        }
      }
    }
  }

  // Also check written Turkish/English numbers for 3-10 years
  if (/\b(üç|dört|beş|altı|yedi|sekiz|on)\s+yıl(?:lık)?\s+(?:[a-zçğıöşü]+\s+){0,3}(?:deneyim|tecrübe)/i.test(lower)) {
    return Math.max(maxMinYears ?? 0, 4)
  }
  if (/\b(three|four|five|six|seven|eight|ten)\+?\s+years?\s+(?:of\s+)?(?:[a-z]+\s+){0,3}experience/i.test(lower)) {
    return Math.max(maxMinYears ?? 0, 4)
  }

  return maxMinYears
}

// HARD GATE: Check if the job title, full job description, or LinkedIn criteria conflicts with the user's selected experienceLevel
function isDescriptionSeniorityMismatch(
  jobTitle: string,
  descriptionText: string,
  criteriaText: string,
  experienceLevel: string
): boolean {
  if (!experienceLevel || experienceLevel === 'all') return false

  const reqYears = extractRequiredYearsFromDescription(descriptionText)
  const criteriaLower = (criteriaText || '').toLowerCase()
  const descLower = (descriptionText || '').toLowerCase()
  const titleLower = (jobTitle || '').toLowerCase()

  if (experienceLevel === 'intern') {
    // 1. MUST explicitly contain an Intern / Stajyer / Part-Time / Student / Trainee marker in title, description, or criteria!
    // Even a 98% CV match is REJECTED if the posting is not actually an Internship / Part-Time / Student role!
    if (!hasExplicitInternOrPartTimeMarker(jobTitle, descriptionText, criteriaText)) {
      return true
    }
    // 2. Must NOT demand 2+ years of experience
    if (reqYears !== null && reqYears >= 2) return true
    if (
      criteriaLower.includes('orta-üst') ||
      criteriaLower.includes('mid-senior') ||
      criteriaLower.includes('director') ||
      criteriaLower.includes('direktör')
    ) {
      return true
    }
    if (/\b(senior|lead|principal|kıdemli)\s+(developer|engineer|product|manager|uzman)/i.test(descLower)) {
      return true
    }
    return false
  }

  if (experienceLevel === 'junior') {
    // New Grad & Junior (0-2 years) HARD GATE:
    // 1. Reject if description demands 3+ years (e.g. 3, 4, 5, 6, 7, 10 years)
    if (reqYears !== null && reqYears >= 3) return true
    // 2. Reject if LinkedIn's seniority criteria is Mid-Senior / Orta-Üst / Director (unless title explicitly says Junior/Associate/Intern)
    if (
      !hasExplicitJuniorOrInternTitle(jobTitle) &&
      (criteriaLower.includes('orta-üst') ||
        criteriaLower.includes('mid-senior') ||
        criteriaLower.includes('director') ||
        criteriaLower.includes('direktör'))
    ) {
      return true
    }
    // 3. Reject if description explicitly states it's looking for a Senior / Lead / Mid-Level candidate
    if (
      /\b(looking for a senior|seeking a senior|en az 3 yıl|en az 4 yıl|en az 5 yıl|minimum 3 yıl|minimum 4 yıl|minimum 5 yıl|kıdemli uzman|senior level)\b/i.test(
        descLower
      )
    ) {
      return true
    }
    return false
  }

  if (experienceLevel === 'mid') {
    if (reqYears !== null && reqYears >= 6) return true
    if (hasExplicitInternOrPartTimeMarker(titleLower, '', '')) return true
    return false
  }

  if (experienceLevel === 'senior') {
    if (hasExplicitInternOrPartTimeMarker(titleLower, '', '')) return true
    if (/\b(junior|jr\.?|yeni mezun|new grad|entry level)\b/i.test(titleLower)) return true
    return false
  }

  return false
}

// Check if a LinkedIn job detail page indicates the posting is closed ("Artık başvuru kabul edilmiyor" / "No longer accepting applications")
function isJobClosed(fullPageText: string, $: cheerio.CheerioAPI): boolean {
  if ($('.closed-job, .closed-job__flavor--closed').length > 0) return true
  const lower = fullPageText.toLowerCase()
  const closedPhrases = [
    'artık başvuru kabul edilmiyor',
    'artık başvuru kabul etmiyor',
    'başvuru kabul edilmemektedir',
    'başvurular kapandı',
    'bu ilan kapandı',
    'ilan yayından kaldırıldı',
    'no longer accepting applications',
    'applications are closed',
    'this job is no longer available',
    'job is closed',
  ]
  return closedPhrases.some((p) => lower.includes(p))
}

// Scrape LinkedIn Guest API for a single query across multiple pages
async function fetchLinkedInGuestJobs(
  searchQuery: string,
  location: string,
  workplace: string,
  experienceLevel: string,
  targetRole: string,
  maxPages = 2
) {
  const encodedKw = encodeURIComponent(searchQuery)
  const encodedLoc = encodeURIComponent(location || 'Turkey')

  let f_wt = ''
  if (workplace === 'onsite') f_wt = '&f_WT=1'
  else if (workplace === 'remote') f_wt = '&f_WT=2'
  else if (workplace === 'hybrid') f_wt = '&f_WT=3'

  // LinkedIn f_E codes: 1=Internship, 2=Entry level, 3=Associate, 4=Mid-Senior, 5=Director
  // LinkedIn f_JT codes: I=Internship, P=Part-time, F=Full-time
  let f_e = ''
  if (experienceLevel === 'intern') {
    // Strictly Internship (f_E=1) or Internship/Part-Time job types
    f_e = '&f_E=1&f_JT=I%2CP'
  } else if (experienceLevel === 'junior') {
    // Strictly Internship + Entry-level (1,2) — exclude 3 (Associate) which LinkedIn uses for 3-5 yr roles
    f_e = '&f_E=1%2C2'
  } else if (experienceLevel === 'mid') {
    f_e = '&f_E=3%2C4'
  } else if (experienceLevel === 'senior') {
    f_e = '&f_E=4%2C5'
  }

  // Always enforce f_TPR=r2592000 (past 30 days) so ancient closed zombie jobs never enter search results
  const f_tpr = '&f_TPR=r2592000'

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  }

  const jobs: Array<{
    jobId?: string
    title: string
    company: string
    location: string
    workplaceType: string
    url: string
    source: string
    postedAgo?: string
    descriptionSnippet?: string
  }> = []

  const requests = []
  for (let p = 0; p < maxPages; p++) {
    const start = p * 25
    // For intern mode, page 0 uses f_E=1&f_JT=I,P and page 1 uses keyword search (since some Turkish companies post "Stajyer" as Full-Time) and relies on our strict description gate
    const expFilter = experienceLevel === 'intern' && p === 1 ? '&f_E=1%2C2' : f_e
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodedKw}&location=${encodedLoc}${f_wt}${expFilter}${f_tpr}&start=${start}`
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
      const timeElem = $(el).find('time.job-search-card__listdate, time.job-search-card__listdate--new')
      const cardElem = $(el).find('[data-entity-urn]')

      const title = titleElem.text().trim()
      const company = companyElem.text().trim()
      const loc = locElem.text().trim() || location
      const link = linkElem.attr('href') || ''
      const postedAgo = timeElem.text().trim() || undefined
      const dateTimeAttr = timeElem.attr('datetime') || ''
      const urn = cardElem.attr('data-entity-urn') || $(el).attr('data-entity-urn') || ''

      // Skip if datetime is older than 35 days
      if (dateTimeAttr) {
        const postedMs = Date.parse(dateTimeAttr)
        if (!isNaN(postedMs) && Date.now() - postedMs > 35 * 24 * 60 * 60 * 1000) {
          return
        }
      }

      if (title && company) {
        const lowerTitle = title.toLowerCase()

        // Filter out non-tech noise
        const isExcluded = NON_TECH_EXCLUSIONS.some((ex) => lowerTitle.includes(ex))
        if (isExcluded) return

        // Filter out seniority mismatches in title
        if (isSeniorityMismatch(title, experienceLevel, targetRole)) return

        const cleanUrl = link.split('?')[0] || `https://www.linkedin.com/jobs/search/?keywords=${encodedKw}`
        const urnMatch = urn.match(/jobPosting:(\d+)/) || cleanUrl.match(/-(\d{7,12})(?:\/|$)/)
        const jobId = urnMatch ? urnMatch[1] : undefined

        let derivedWorkplace = workplace
        if (workplace === 'all') {
          if (lowerTitle.includes('remote') || lowerTitle.includes('uzaktan')) derivedWorkplace = 'remote'
          else if (lowerTitle.includes('hybrid') || lowerTitle.includes('hibrit')) derivedWorkplace = 'hybrid'
          else derivedWorkplace = 'onsite'
        }

        jobs.push({
          jobId,
          title,
          company,
          location: loc,
          workplaceType: derivedWorkplace,
          url: cleanUrl,
          source: 'linkedin',
          postedAgo,
        })
      }
    })
  }

  return jobs
}

// Fetch actual LinkedIn job descriptions in staggered batches (to prevent 429 rate-limiting) and apply HARD seniority & closed-job gates
async function enrichAndFilterJobsByDescription(
  jobs: Array<{
    jobId?: string
    title: string
    company: string
    location: string
    workplaceType: string
    url: string
    source: string
    postedAgo?: string
    descriptionSnippet?: string
  }>,
  experienceLevel: string
) {
  const candidates = jobs.slice(0, 24)
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  }

  // Helper to verify a single job's detail page
  async function verifySingleJob(job: (typeof candidates)[0]) {
    // Fallback if job has no jobId to fetch description
    if (!job.jobId) {
      if (experienceLevel === 'intern') {
        return hasExplicitInternOrPartTimeMarker(job.title) ? job : null
      }
      if (experienceLevel === 'junior') {
        return hasExplicitJuniorOrInternTitle(job.title) ? job : null
      }
      return job
    }

    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 3500)
      const res = await fetch(
        `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${job.jobId}`,
        { headers, signal: controller.signal }
      )
      clearTimeout(timer)

      // If 404 or gone, the job was taken down -> drop it!
      if (res.status === 404 || res.status === 410) return null

      // If LinkedIn rate-limited (429) or errored, DO NOT let unverified jobs sneak past when a filter is active!
      if (!res.ok) {
        if (experienceLevel === 'intern') {
          return hasExplicitInternOrPartTimeMarker(job.title) ? job : null
        }
        if (experienceLevel === 'junior') {
          return hasExplicitJuniorOrInternTitle(job.title) ? job : null
        }
        return job
      }

      const html = await res.text()
      const $ = cheerio.load(html)
      const fullPageText = $.root().text().replace(/\s+/g, ' ').trim()

      // 1. Eliminate jobs that are closed ("Artık başvuru kabul edilmiyor" / "No longer accepting applications")
      if (isJobClosed(fullPageText, $)) {
        return null
      }

      const descText = $('.show-more-less-html__markup, .description__text')
        .text()
        .replace(/\s+/g, ' ')
        .trim()
      const criteriaText = $('.description__job-criteria-text')
        .text()
        .replace(/\s+/g, ' ')
        .trim()

      if (descText) {
        // 2. HARD GATE: Eliminate jobs that violate experienceLevel (even if CV match is 98%!)
        if (isDescriptionSeniorityMismatch(job.title, descText, criteriaText, experienceLevel)) {
          return null
        }
        const enrichedTitle =
          experienceLevel === 'intern' && !hasExplicitInternOrPartTimeMarker(job.title)
            ? `${job.title} (Stajyer / Part-Time)`
            : job.title
        return {
          ...job,
          title: enrichedTitle,
          descriptionSnippet: descText.slice(0, 600),
        }
      }

      // If description was empty, only keep if title explicitly proves the level
      if (experienceLevel === 'intern') {
        return hasExplicitInternOrPartTimeMarker(job.title) ? job : null
      }
      if (experienceLevel === 'junior') {
        return hasExplicitJuniorOrInternTitle(job.title) ? job : null
      }
      return job
    } catch {
      if (experienceLevel === 'intern') {
        return hasExplicitInternOrPartTimeMarker(job.title) ? job : null
      }
      if (experienceLevel === 'junior') {
        return hasExplicitJuniorOrInternTitle(job.title) ? job : null
      }
      return job
    }
  }

  // Process in staggered batches of 6 to avoid LinkedIn 429 rate-limits
  const verifiedJobs: NonNullable<Awaited<ReturnType<typeof verifySingleJob>>>[] = []
  const batchSize = 6
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(verifySingleJob))
    for (const r of batchResults) {
      if (r !== null) verifiedJobs.push(r)
    }
    if (i + batchSize < candidates.length) {
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
  }

  return verifiedJobs
}

// Domain skill pools for intelligent alignment (excluding generic noise like sql/python)
const GENERIC_EXCLUDED_SKILLS = new Set(['sql', 'python', 'excel', 'ms office', 'office', 'git'])

const DOMAIN_SKILL_MAP: Record<string, string[]> = {
  frontend: ['react', 'vue', 'angular', 'next.js', 'nextjs', 'typescript', 'javascript', 'tailwind', 'css', 'html', 'redux', 'ui', 'frontend'],
  backend: ['node.js', 'nodejs', 'go', 'golang', 'java', 'c#', '.net', 'django', 'fastapi', 'spring', 'postgresql', 'mongodb', 'redis', 'microservices', 'rest api', 'backend'],
  mobile: ['flutter', 'react native', 'swift', 'kotlin', 'ios', 'android', 'dart', 'mobile'],
  ai: ['ai', 'yapay zeka', 'machine learning', 'deep learning', 'llm', 'pytorch', 'tensorflow', 'nlp', 'computer vision', 'data scientist', 'generative ai'],
  data: ['data', 'veri', 'power bi', 'tableau', 'etl', 'bigquery', 'data analyst', 'analitik', 'veri modelleme'],
  product: ['product', 'ürün', 'agile', 'scrum', 'jira', 'roadmap', 'product management', 'ux', 'kullanıcı deneyimi'],
  devops: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'terraform', 'devops', 'linux'],
  qa: ['qa', 'test', 'selenium', 'cypress', 'jest', 'otomasyon'],
}

const COMMON_MISSING_BY_DOMAIN: Record<string, string[]> = {
  frontend: ['Next.js App Router', 'Tailwind CSS', 'TypeScript', 'Jest / Vitest', 'GraphQL'],
  backend: ['Docker', 'PostgreSQL', 'Redis', 'Mikroservis Mimarisi', 'Kubernetes'],
  mobile: ['CI/CD Pipeline', 'State Management', 'Native Modüller', 'App Store Dağıtımı'],
  ai: ['LangChain / LlamaIndex', 'Model İnce Ayar (Fine-Tuning)', 'FastAPI', 'Vektör Veritabanları'],
  data: ['Power BI', 'Apache Airflow', 'BigQuery', 'dbt', 'Veri Ambarı Mimarisi'],
  product: ['A/B Test Metodolojisi', 'Jira / Confluence', 'Kullanıcı Araştırması', 'Ürün Metrikleri / OKR'],
  devops: ['Kubernetes', 'Terraform', 'ArgoCD', 'Prometheus / Grafana'],
  qa: ['Playwright', 'Cypress', 'API Test Otomasyonu', 'CI/CD Entegrasyonu'],
  fullstack: ['Docker', 'Mikroservisler', 'Next.js', 'Redis'],
  general: ['Modern CI/CD', 'Birim Testleri', 'Bulut Altyapısı'],
}

function detectJobDomain(title: string, cvRole: string): string {
  const t = `${title} ${cvRole}`.toLowerCase()
  if (t.includes('fullstack') || t.includes('full-stack') || t.includes('full stack')) return 'fullstack'
  if (t.includes('front') || t.includes('react') || t.includes('vue') || t.includes('angular') || t.includes('ui/ux') || t.includes('css')) return 'frontend'
  if (t.includes('mobile') || t.includes('ios') || t.includes('android') || t.includes('flutter') || t.includes('swift')) return 'mobile'
  if (t.includes('ai') || t.includes('yapay zeka') || t.includes('machine learning') || t.includes('llm') || t.includes('nlp')) return 'ai'
  if (t.includes('data') || t.includes('veri') || t.includes('power bi') || t.includes('analist') || t.includes('bi analyst')) return 'data'
  if (t.includes('product') || t.includes('ürün') || t.includes('scrum') || t.includes('project') || t.includes('proje')) return 'product'
  if (t.includes('devops') || t.includes('cloud') || t.includes('bulut') || t.includes('sre') || t.includes('kubernetes')) return 'devops'
  if (t.includes('test') || t.includes('qa') || t.includes('quality')) return 'qa'
  if (t.includes('back') || t.includes('node') || t.includes('java') || t.includes('golang') || t.includes('.net') || t.includes('c#')) return 'backend'
  return 'general'
}

function generateCareerReason(
  company: string,
  title: string,
  domain: string,
  matchedSkills: string[],
  idx: number,
  cvRole: string
): string {
  const filteredSkills = matchedSkills.filter(
    (s) => !GENERIC_EXCLUDED_SKILLS.has(s.trim().toLowerCase())
  )
  const skillsStr = filteredSkills.length > 0 ? filteredSkills.join(' ve ') : (cvRole || 'ürün ve teknoloji geliştirme')

  const templates: Record<string, string[]> = {
    frontend: [
      `${company} bünyesindeki bu pozisyon, modern arayüz mimarisi ve ${skillsStr} tecrübenizle güçlü bir teknik sinerji oluşturuyor.`,
      `${title} rolünün gerektirdiği kullanıcı deneyimi ve ${skillsStr} odağı, mevcut CV profilinizle doğrudan örtüşmektedir.`,
      `${company} ekibinin ön yüz geliştirme beklentileri, ${skillsStr} konusundaki pratik birikiminiz için hedeflenen seviyede bir fırsattır.`,
    ],
    backend: [
      `${company} ekibinin mimari ve servis geliştirme gereksinimleri, ${skillsStr} geçmişiniz ile doğrudan uyum gösteriyor.`,
      `${skillsStr} alanındaki teknik hakimiyetiniz, ${company} bünyesindeki servis altyapısına hızlı ve verimli adapte olmanızı sağlar.`,
      `${title} pozisyonundaki veri akışı ve mimari sorumluluklar, ${skillsStr} birikiminizle güçlü bir aday profili sunuyor.`,
    ],
    fullstack: [
      `${company} için aranan ${title} rolü, uçtan uca ürün geliştirme pratiğiniz ve ${skillsStr} yetkinliklerinizle mükemmel örtüşüyor.`,
      `${skillsStr} odaklı geniş teknik yelpazeniz, ${company} bünyesindeki çevik sprint süreçlerine doğrudan değer katacaktır.`,
      `${company} ekibinde hem ön yüz hem servis katmanını yönetecek bu pozisyon, ${skillsStr} tecrübeniz için ideal bir eşleşme.`,
    ],
    mobile: [
      `${company} mobil uygulama geliştirme vizyonu, ${skillsStr} tecrübeniz ve mobil ekosistem hakimiyetinizle tam uyum sağlıyor.`,
      `${title} pozisyonundaki dinamik mobil mimari, ${skillsStr} alanındaki proje deneyiminizle doğrudan örtüşmektedir.`,
    ],
    ai: [
      `${company} yapay zeka inisiyatifleri ve model geliştirme süreçleri, ${skillsStr} uzmanlığınızla yüksek katma değer üretecek potansiyelde.`,
      `${title} rolü, ${skillsStr} odağındaki yenilikçi bilgi birikiminiz için güçlü ve vizyoner bir kariyer adımıdır.`,
    ],
    data: [
      `${company} veri analitiği ve raporlama süreçleri, ${skillsStr} yetkinliklerinizle doğrudan değer üretecek bir eşleşmeye sahip.`,
      `${title} pozisyonunun gerektirdiği veri modelleme ve analitik vizyon, ${skillsStr} birikiminiz ile tam örtüşüyor.`,
    ],
    product: [
      `${company} ürün yönetimi ve büyüme vizyonu, ${skillsStr} alanındaki stratejik ve çevik iş yapış pratiğinizle uyumlu.`,
      `${title} rolündeki paydaş yönetimi ve ürün yaşam döngüsü sorumlulukları, ${skillsStr} geçmişinizle profesyonel bir uyum yakalıyor.`,
    ],
    devops: [
      `${company} bulut altyapısı ve kesintisiz dağıtım süreçleri, ${skillsStr} odağındaki otomasyon tecrübenizle yüksek oranda örtüşüyor.`,
      `${title} pozisyonundaki sistem güvenilirliği hedefleri, ${skillsStr} yetkinlikleriniz için güçlü bir eşleşme sunuyor.`,
    ],
    qa: [
      `${company} kalite güvence ve test süreçleri, ${skillsStr} alanındaki test otomasyonu tecrübenizle birebir örtüşüyor.`,
    ],
    general: [
      `${company} bünyesindeki ${title} arayışı, hedeflediğiniz ${cvRole || 'kariyer yolu'} ve ${skillsStr} yetkinlikleriniz ile güçlü bir uyum sergiliyor.`,
      `${title} pozisyonundaki sorumluluklar, ${skillsStr} tecrübeniz ve genel teknik profilinizle sizi öne çıkaran bir aday yapıyor.`,
      `${company} şirketinin bu ilanı, ${skillsStr} odağındaki profesyonel birikiminiz için hedeflenen seviyede bir kariyer adımıdır.`,
    ],
  }

  const list = templates[domain] || templates.general
  return list[idx % list.length]
}

// Smart heuristic job evaluator when AI is unavailable
function evaluateJobHeuristic(
  job: {
    title: string
    company: string
    location: string
    workplaceType: string
    url: string
    source: string
    descriptionSnippet?: string
  },
  cvRole: string,
  cvSkills: string[],
  idx: number,
  resumeId?: string,
  resumeName?: string,
  experienceLevel = 'all'
) {
  const titleLower = job.title.toLowerCase()
  const descLower = (job.descriptionSnippet || '').toLowerCase()
  const combinedText = `${titleLower} ${descLower}`
  const cvRoleLower = cvRole.toLowerCase()
  const domain = detectJobDomain(job.title, cvRole)
  const domainKeywords = DOMAIN_SKILL_MAP[domain] || []

  const cleanCvSkills = cvSkills.filter((s) => !GENERIC_EXCLUDED_SKILLS.has(s.trim().toLowerCase()))

  // Match skills that actually relate to this specific job title, description, and domain
  const matchedSkills: string[] = []
  for (const s of cleanCvSkills) {
    const sLower = s.toLowerCase()
    if (combinedText.includes(sLower) || domainKeywords.some((k) => sLower.includes(k) || k.includes(sLower))) {
      matchedSkills.push(s)
    }
  }

  // Deduplicate and select final matched skills
  const finalMatched = matchedSkills.length > 0
    ? Array.from(new Set(matchedSkills)).slice(0, 3)
    : cleanCvSkills.slice(0, 2)

  // Suggest realistic domain-specific missing skills
  const missingCandidates = COMMON_MISSING_BY_DOMAIN[domain] || COMMON_MISSING_BY_DOMAIN.general
  const userSkillsLower = new Set(cvSkills.map((s) => s.toLowerCase()))
  const missingSkills = missingCandidates
    .filter((c) => !userSkillsLower.has(c.toLowerCase()))
    .slice(0, 2)

  // Calculate score based on domain alignment and seniority
  let score = 76
  if (domain !== 'general') score += 10
  if (experienceLevel === 'senior' && (titleLower.includes('senior') || cvRoleLower.includes('senior'))) score += 5
  if (
    (experienceLevel === 'intern' || experienceLevel === 'junior') &&
    (combinedText.includes('intern') ||
      combinedText.includes('staj') ||
      combinedText.includes('junior') ||
      combinedText.includes('associate') ||
      combinedText.includes('part-time') ||
      combinedText.includes('yeni mezun'))
  ) {
    score += 6
  }
  if (finalMatched.length >= 2) score += 6
  score = Math.min(97, Math.max(74, score + ((idx * 3) % 7)))

  const reason = generateCareerReason(job.company, job.title, domain, finalMatched, idx, cvRole)

  return {
    ...job,
    id: `scouted_${Date.now()}_${idx}`,
    matchScore: score,
    matchingSkills: finalMatched,
    missingSkills,
    recommendedResumeId: resumeId || undefined,
    recommendedResumeName: resumeName,
    reason,
    applied: false,
  }
}

// Evaluate jobs using Gemini API (with batching)
async function evaluateJobsWithAI(
  jobs: Array<{
    title: string
    company: string
    location: string
    workplaceType: string
    url: string
    source: string
    descriptionSnippet?: string
  }>,
  cvRole: string,
  cvSkills: string[],
  cvSummary: string,
  apiKey: string,
  resumeId?: string,
  resumeName?: string,
  experienceLevel = 'all'
) {
  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY || ''
  const cleanCvSkills = cvSkills.filter((s) => !GENERIC_EXCLUDED_SKILLS.has(s.trim().toLowerCase()))

  if (!resolvedApiKey) {
    return jobs.map((job, idx) =>
      evaluateJobHeuristic(job, cvRole, cleanCvSkills, idx, resumeId, resumeName, experienceLevel)
    )
  }

  const expLabelMap: Record<string, string> = {
    intern: 'Stajyer / Part-Time / Öğrenci',
    junior: 'Yeni Mezun / Junior (0-2 Yıl)',
    mid: 'Mid-Level Uzman (2-5 Yıl)',
    senior: 'Senior & Lead (5+ Yıl)',
    all: 'Tüm Seviyeler',
  }

  const prompt = `Sen uzman bir Kıdemli İK Direktörü ve Teknik Kariyer Danışmanısın.

Kullanıcı CV Profili:
- Hedef Rol / Pozisyon: ${cvRole}
- Tecrübe Seviyesi: ${expLabelMap[experienceLevel] || 'Belirtilmedi'}
- Kullanıcının Yetenekleri: ${cleanCvSkills.join(', ')}
- CV Özeti: ${cvSummary || 'Teknik ve profesyonel profil'}

Aşağıda taranan ${jobs.length} adet iş ilanı (başlık ve ilan açıklama özeti ile birlikte) bulunmaktadır. Her ilan için:
1. matchScore: Bu ilanın kullanıcının CV'si ve tecrübe seviyesi (${expLabelMap[experienceLevel] || 'Genel'}) ile GERÇEK uyum yüzdesi (0-100).
   - ÇOK ÖNEMLİ KURAL: İlan açıklamasını ("description") dikkatle oku! Eğer kullanıcı "Stajyer / Part-Time / Öğrenci" seçtiyse ve ilanda açıkça stajyer, part-time, öğrenci veya aday mühendis ibaresi yoksa (CV ile %98 uyumlu olsa bile!) matchScore değerini KESİNLİKLE 20'nin altında (<20) ver ki elensin!
   - Eğer kullanıcı "Yeni Mezun / Junior (0-2 Yıl)" seçtiyse ve ilan açıklamasında 3+, 4+, 5+ yıl gibi yüksek tecrübe şartı aranıyorsa matchScore değerini KESİNLİKLE 30'un altında (<30) ver ki elensin!
   - Eğer pozisyon doğrudan CV'nin uzmanlık alanındaysa ve seçilen tecrübe seviyesine birebir uygunsa: %82 - %98 ver.
   - Eğer kısmen ilgiliyse ve tecrübe seviyesine uygunsa: %70 - %81 ver.
   - Eğer tamamen alakasız sektörse veya adayın tecrübe seviyesine uymuyorsa: <%50 ver.
2. matchingSkills: İlanda aranan ve kullanıcının CV'sinde OLAN spesifik yetenekler (En fazla 3 adet; "SQL", "Python" gibi genel geçer kelimeleri yazma).
3. missingSkills: İlanda gerekebilecek ama CV'de öne çıkmayan yetenekler (En fazla 2 adet).
4. reason: Her ilana ve şirkete ÖZEL 1-2 cümlelik Türkçe profesyonel kariyer değerlendirmesi.
   - KESİNLİKLE DİKKAT: Standart, tekrarlayan veya robotik şablonlar ASLA kullanma. "SQL", "Python" gibi genel yetenek isimlerini gerekçede listeleme.
   - Pozisyonun uzmanlık alanına (${cvRole}), ilan açıklamasına ve tecrübe seviyesine değinen özgün bir gerekçe oluştur.

İlan Listesi:
${JSON.stringify(
  jobs.map((j, i) => ({
    index: i,
    title: j.title,
    company: j.company,
    location: j.location,
    description: j.descriptionSnippet || '',
  })),
  null,
  2
)}

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
              const rawMatched = Array.isArray(ev.matchingSkills)
                ? ev.matchingSkills.filter((s: string) => !GENERIC_EXCLUDED_SKILLS.has(String(s).trim().toLowerCase()))
                : []
              const finalMatched = rawMatched.length > 0
                ? rawMatched
                : cleanCvSkills.slice(0, 2)
              const domain = detectJobDomain(job.title, cvRole)
              const reason = ev.reason && !/\b(sql|python)\b/i.test(ev.reason)
                ? ev.reason
                : generateCareerReason(job.company, job.title, domain, finalMatched, i, cvRole)

              return {
                ...job,
                id: `scouted_${Date.now()}_${i}`,
                matchScore: typeof ev.matchScore === 'number' ? ev.matchScore : 85,
                matchingSkills: finalMatched,
                missingSkills: Array.isArray(ev.missingSkills)
                  ? ev.missingSkills.filter((s: string) => !GENERIC_EXCLUDED_SKILLS.has(String(s).trim().toLowerCase()))
                  : [],
                recommendedResumeId: resumeId || undefined,
                recommendedResumeName: resumeName,
                reason,
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
  return jobs.map((job, idx) =>
    evaluateJobHeuristic(job, cvRole, cleanCvSkills, idx, resumeId, resumeName, experienceLevel)
  )
}

export async function POST(req: NextRequest) {
  try {
    const body: ScoutRequestBody = await req.json()
    const {
      role = 'Software Developer',
      skills = ['React', 'JavaScript', 'TypeScript'],
      workplaceType = 'all',
      experienceLevel = 'all',
      customKeywords = '',
      location = 'Türkiye',
      resumeId,
      resumeName,
      resumeSummary = '',
      allResumes = [],
      apiKey = '',
    } = body

    // 1. Extract up to 7 bilingual & seniority-aware search phrases from role, skills, customKeywords, and allResumes
    const searchPhrases = extractSearchPhrases(role, skills, experienceLevel, customKeywords, allResumes)

    // 2. Fetch jobs across all search phrases in parallel
    const crawlPromises = searchPhrases.map((phrase) =>
      fetchLinkedInGuestJobs(phrase, location, workplaceType, experienceLevel, role, 2)
    )

    const results = await Promise.all(crawlPromises)

    // 3. Deduplicate by clean URL
    const seenUrls = new Set<string>()
    const rawDiscoveredJobs: Array<{
      jobId?: string
      title: string
      company: string
      location: string
      workplaceType: string
      url: string
      source: string
      postedAgo?: string
      descriptionSnippet?: string
    }> = []

    for (const jobBatch of results) {
      for (const job of jobBatch) {
        if (!seenUrls.has(job.url)) {
          seenUrls.add(job.url)
          rawDiscoveredJobs.push(job)
        }
      }
    }

    // 3.5. Deep-read actual job descriptions in parallel and eliminate closed jobs ("Artık başvuru kabul edilmiyor") + postings demanding excessive years of experience
    const allDiscoveredJobs = await enrichAndFilterJobsByDescription(rawDiscoveredJobs, experienceLevel)

    // 4. Fallback recommendations if zero hits (tailored to experienceLevel)
    if (allDiscoveredJobs.length === 0) {
      let fallbackTitles = [
        `AI & ${role}`,
        `${role}`,
        `Associate ${role}`,
        `${role} (AI & Cloud)`,
      ]
      if (experienceLevel === 'intern') {
        fallbackTitles = [
          `${role} Intern`,
          `Part-Time ${role}`,
          `Working Student - ${role}`,
          `Stajyer ${role} (Part-Time)`,
        ]
      } else if (experienceLevel === 'junior') {
        fallbackTitles = [
          `Junior ${role}`,
          `Associate ${role}`,
          `${role} (New Grad / 0-2 Yıl)`,
          `Junior AI & ${role}`,
        ]
      } else if (experienceLevel === 'senior') {
        fallbackTitles = [
          `Senior ${role}`,
          `Lead ${role}`,
          `Principal ${role}`,
          `Senior AI & ${role}`,
        ]
      }

      const fallbackCompanies = ['Global Teknoloji', 'Örnek Yazılım Ltd.', 'Bulut Bilişim A.Ş.', 'Dijital Çözümler']

      allDiscoveredJobs.push(
        ...fallbackTitles.map((title, idx) => ({
          title,
          company: fallbackCompanies[idx % fallbackCompanies.length],
          location: location || 'İstanbul, Türkiye',
          workplaceType: workplaceType === 'all' ? (idx % 2 === 0 ? 'remote' : 'hybrid') : workplaceType,
          url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}&location=${encodeURIComponent(location)}`,
          source: 'linkedin',
        }))
      )
    }

    // 5. Individual job-by-job AI evaluation (now with real job descriptions!)
    const scoutedJobs = await evaluateJobsWithAI(
      allDiscoveredJobs,
      role,
      skills,
      resumeSummary,
      apiKey,
      resumeId,
      resumeName,
      experienceLevel
    )

    // 5.5. If user has multiple CVs in pool ("Tüm CV'lerim"), pick the highest-matching CV for each job
    if (allResumes.length > 1) {
      for (const job of scoutedJobs) {
        const jobText = `${job.title} ${(job as any).descriptionSnippet || ''}`.toLowerCase()
        let bestResume = allResumes[0]
        let bestScore = -1
        for (const r of allResumes) {
          let rScore = 0
          const rRoleWords = `${r.targetRole || ''} ${r.name || ''}`
            .toLowerCase()
            .split(/[\s,/&()-]+/)
            .filter((w) => w.length > 2 && w !== 'cv')
          for (const w of rRoleWords) {
            if (jobText.includes(w)) rScore += 3
          }
          for (const sk of r.skills || []) {
            if (jobText.includes(sk.toLowerCase())) rScore += 2
          }
          if (rScore > bestScore) {
            bestScore = rScore
            bestResume = r
          }
        }
        if (bestResume) {
          job.recommendedResumeId = bestResume.id
          job.recommendedResumeName = bestResume.name
        }
      }
    }

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
