import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import type { CorporateProgramItem, ProgramCategory } from '@/types'

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
}

function slugifyMicrofon(text: string): string {
  const trMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  }
  return text
    .split('')
    .map((ch) => trMap[ch] || ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function classifyProgramCategory(
  title: string,
  badgeOrTag: string,
  description: string
): {
  category: ProgramCategory
  badgeLabel: string
} {
  const combined = `${title} ${badgeOrTag} ${description}`.toLowerCase()

  if (
    combined.includes('burs') ||
    combined.includes('scholarship') ||
    combined.includes('finansman')
  ) {
    return {
      category: 'scholarship',
      badgeLabel: badgeOrTag || 'Burs & Destek',
    }
  }

  if (
    combined.includes('fellowship') ||
    combined.includes('fellow') ||
    combined.includes('liderlik') ||
    combined.includes('geleceğin kadın liderleri') ||
    combined.includes('kıvılcımlar') ||
    combined.includes('lead21') ||
    combined.includes('yenibirlider')
  ) {
    return {
      category: 'fellowship',
      badgeLabel: badgeOrTag || 'Fellowship & Liderlik',
    }
  }

  if (
    combined.includes('bootcamp') ||
    combined.includes('hackathon') ||
    combined.includes('ideathon') ||
    combined.includes('datathon') ||
    combined.includes('case study') ||
    combined.includes('yarışma') ||
    combined.includes('summit') ||
    combined.includes('zirve') ||
    combined.includes('workshop') ||
    combined.includes('akademi') ||
    combined.includes('academy') ||
    combined.includes('eğitim') ||
    combined.includes('webinar') ||
    combined.includes('pusulası') ||
    combined.includes('101')
  ) {
    return {
      category: 'bootcamp',
      badgeLabel: badgeOrTag || 'Eğitim, Akademi & Bootcamp',
    }
  }

  if (
    combined.includes('staj') ||
    combined.includes('intern') ||
    combined.includes('part-time') ||
    combined.includes('part time') ||
    combined.includes('uzun dönem') ||
    combined.includes('kısa dönem') ||
    combined.includes('co-op') ||
    combined.includes('öğrenci') ||
    combined.includes('student') ||
    combined.includes('working student') ||
    combined.includes('project intern') ||
    combined.includes('aday mühendis') ||
    combined.includes('summer')
  ) {
    return {
      category: 'intern',
      badgeLabel: badgeOrTag || 'Stajyer / Part-Time',
    }
  }

  if (
    combined.includes('management trainee') ||
    /\bmt\b/.test(combined) ||
    combined.includes('yetenek programı') ||
    combined.includes('talent program') ||
    combined.includes('genç yetenek') ||
    combined.includes('young talent') ||
    combined.includes('graduate program') ||
    combined.includes('future') ||
    combined.includes('next gen') ||
    combined.includes('discover') ||
    combined.includes('compass') ||
    combined.includes('sky ') ||
    combined.includes('take-off')
  ) {
    return {
      category: 'talent_program',
      badgeLabel: badgeOrTag || 'Genç Yetenek / MT',
    }
  }

  if (
    combined.includes('yeni mezun') ||
    combined.includes('new grad') ||
    combined.includes('fresh grad') ||
    combined.includes('junior') ||
    combined.includes('uzman yardımcısı') ||
    combined.includes('associate') ||
    combined.includes('entry level') ||
    combined.includes('asistan')
  ) {
    return {
      category: 'new_grad',
      badgeLabel: badgeOrTag || 'Yeni Mezun / Junior',
    }
  }

  if (
    combined.includes('indirim') ||
    combined.includes('fırsat') ||
    combined.includes('ayrıcalık')
  ) {
    return {
      category: 'opportunity',
      badgeLabel: badgeOrTag || 'Öğrenci Fırsatı',
    }
  }

  return {
    category: 'corporate',
    badgeLabel: badgeOrTag || 'Kurumsal İlan',
  }
}

async function fetchHtmlWithTimeout(url: string, timeoutMs = 4500): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: controller.signal,
      next: { revalidate: 900 },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 1. Microfon.co Scraper (Programlar & Fellowship, Burslar, Fırsatlar)
 * Extracts SSR JSON (`ssrHihglights` + `ssrAds`) from:
 * - https://microfon.co/program
 * - https://microfon.co/scholarship
 * - https://microfon.co/opportunity
 */
async function scrapeMicrofon(): Promise<CorporateProgramItem[]> {
  const [programHtml, scholarshipHtml, opportunityHtml] = await Promise.all([
    fetchHtmlWithTimeout('https://microfon.co/program', 4800),
    fetchHtmlWithTimeout('https://microfon.co/scholarship', 4800),
    fetchHtmlWithTimeout('https://microfon.co/opportunity', 4800),
  ])

  const items: CorporateProgramItem[] = []
  const seenIds = new Set<string>()

  // Helper to collect exact DOM href map keyed by formIdentityNumber
  const extractHrefMap = ($: cheerio.CheerioAPI, prefix: string): Record<string, string> => {
    const map: Record<string, string> = {}
    $(`a[href^="/${prefix}/"]`).each((_, aEl) => {
      const href = $(aEl).attr('href') || ''
      const match = href.match(/-(\d+)$/)
      if (match) {
        map[match[1]] = `https://microfon.co${href}`
      }
    })
    return map
  }

  // A. Parse /program (Fellowship, Akademi, Eğitim, Yarışma, Kariyer Programları)
  if (programHtml) {
    try {
      const $ = cheerio.load(programHtml)
      const hrefMap = extractHrefMap($, 'program')
      const nextDataRaw = $('#__NEXT_DATA__').html()
      if (nextDataRaw) {
        const pageProps = JSON.parse(nextDataRaw)?.props?.pageProps || {}
        const allPrograms = [
          ...(Array.isArray(pageProps.ssrHihglights) ? pageProps.ssrHihglights : []),
          ...(Array.isArray(pageProps.ssrAds) ? pageProps.ssrAds : []),
        ]

        for (const p of allPrograms) {
          const idKey = p?.formIdentityNumber || p?.formId || p?.title
          if (!idKey || !p?.title || seenIds.has(`prog-${idKey}`)) continue
          seenIds.add(`prog-${idKey}`)

          const title = String(p.title).trim()
          const company = String(p.company || 'Microfon Topluluğu').trim()
          const explanation = String(
            p.explanation ||
              `${company} tarafından Microfon üzerinden sunulan ${title} programı.`
          ).trim()

          const formNum = String(p.formIdentityNumber || '')
          const url =
            (formNum && hrefMap[formNum]) ||
            (formNum
              ? `https://microfon.co/program/${slugifyMicrofon(title)}-${formNum}`
              : 'https://microfon.co/program')

          const dueDateStr = p.dueDate
            ? new Date(p.dueDate).toLocaleDateString('tr-TR')
            : undefined
          const isOpen = p.isOpen !== false
          const tags: string[] = Array.isArray(p.tags) ? p.tags : []
          const locationTag = tags.includes('Online')
            ? 'Online / Türkiye Geneli'
            : tags.join(' • ') || 'Türkiye Geneli'

          // Classify whether it's a Fellowship, Internship/New-grad, or Education/Bootcamp
          const lowerTitle = `${title} ${explanation}`.toLowerCase()
          let category: ProgramCategory = 'bootcamp'
          let badgeLabel = p.isFree ? 'Ücretsiz Eğitim & Akademi' : 'Eğitim & Program'

          if (
            lowerTitle.includes('fellowship') ||
            lowerTitle.includes('fellow') ||
            lowerTitle.includes('lider') ||
            lowerTitle.includes('kıvılcımlar') ||
            lowerTitle.includes('lead21')
          ) {
            category = 'fellowship'
            badgeLabel = 'Fellowship & Liderlik'
          } else if (
            lowerTitle.includes('staj') ||
            lowerTitle.includes('aday')
          ) {
            category = 'intern'
            badgeLabel = 'Staj & Kariyer Programı'
          } else if (
            lowerTitle.includes('uzman yardımcısı') ||
            lowerTitle.includes('yeni mezun')
          ) {
            category = 'new_grad'
            badgeLabel = 'Yeni Mezun Programı'
          } else if (
            lowerTitle.includes('ödül') ||
            lowerTitle.includes('yarışma') ||
            lowerTitle.includes('award')
          ) {
            category = 'bootcamp'
            badgeLabel = 'Ödül & Yarışma'
          }

          items.push({
            id: `microfon-prog-${idKey}`,
            title,
            company,
            companyLogo: p.photo || undefined,
            coverImage: p.banner || p.photo || undefined,
            description: explanation,
            category,
            badgeLabel,
            source: 'microfon',
            location: locationTag,
            deadline: isOpen
              ? dueDateStr
                ? `Son: ${dueDateStr}`
                : 'Başvuruya Açık'
              : dueDateStr
                ? `Kapandı (${dueDateStr})`
                : 'Başvurular Tamamlandı',
            isOpen,
            url,
          })
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // B. Parse /scholarship (Eğitim Bursları, Başarı & Staj Bursları, Vakıf Bursları)
  if (scholarshipHtml) {
    try {
      const $ = cheerio.load(scholarshipHtml)
      const hrefMap = extractHrefMap($, 'scholarship')
      const nextDataRaw = $('#__NEXT_DATA__').html()
      if (nextDataRaw) {
        const pageProps = JSON.parse(nextDataRaw)?.props?.pageProps || {}
        const allScholarships = [
          ...(Array.isArray(pageProps.ssrHihglights) ? pageProps.ssrHihglights : []),
          ...(Array.isArray(pageProps.ssrAds) ? pageProps.ssrAds : []),
        ]

        for (const s of allScholarships) {
          const idKey = s?.formIdentityNumber || s?.formId || s?.title
          if (!idKey || !s?.title || seenIds.has(`sch-${idKey}`)) continue
          seenIds.add(`sch-${idKey}`)

          const title = String(s.title).trim()
          const company = String(s.company || 'Microfon Burs Programı').trim()
          const explanation = String(
            s.explanation ||
              `${company} tarafından sağlanan ${title} burs ve eğitim desteği programı.`
          ).trim()

          const formNum = String(s.formIdentityNumber || '')
          const url =
            (formNum && hrefMap[formNum]) ||
            (formNum
              ? `https://microfon.co/scholarship/${slugifyMicrofon(title)}-${formNum}`
              : 'https://microfon.co/scholarship')

          const dueDateStr = s.dueDate
            ? new Date(s.dueDate).toLocaleDateString('tr-TR')
            : undefined
          const isOpen = s.isOpen !== false
          const tags: string[] = Array.isArray(s.tags) ? s.tags : []
          const locationTag = tags.length > 0 ? tags.join(' • ') : 'Türkiye / Üniversite'

          // Format scholarship amount if available
          let amountFormatted: string | undefined
          if (s.amount && String(s.amount).trim() !== '0,00') {
            const rawNum = parseFloat(String(s.amount).replace(',', '.'))
            const curr = s.currency?.name || 'TL'
            if (!isNaN(rawNum) && rawNum > 0) {
              amountFormatted = `${rawNum.toLocaleString('tr-TR')} ${curr === 'TRY' ? 'TL' : curr}`
            }
          }

          const hasStaj = title.toLowerCase().includes('staj')

          items.push({
            id: `microfon-sch-${idKey}`,
            title,
            company,
            companyLogo: s.photo || undefined,
            coverImage: s.banner || s.photo || undefined,
            description: s.applyMounts
              ? `${explanation} (${String(s.applyMounts).trim()})`
              : explanation,
            category: 'scholarship',
            badgeLabel: amountFormatted
              ? `Burs • ${amountFormatted}`
              : hasStaj
                ? 'Başarı Bursu & Staj'
                : 'Eğitim & Başarı Bursu',
            source: 'microfon',
            location: locationTag,
            deadline: isOpen
              ? dueDateStr
                ? `Son: ${dueDateStr}`
                : 'Başvuruya Açık'
              : 'Başvurular Tamamlandı',
            amount: amountFormatted,
            isOpen,
            url,
          })
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // C. Parse /opportunity (Öğrenci Fırsatları, Yurt Dışı Staj & Dil Eğitimi Destekleri)
  if (opportunityHtml) {
    try {
      const $ = cheerio.load(opportunityHtml)
      const nextDataRaw = $('#__NEXT_DATA__').html()
      if (nextDataRaw) {
        const pageProps = JSON.parse(nextDataRaw)?.props?.pageProps || {}
        const allOpps = [
          ...(Array.isArray(pageProps.ssrHihglights) ? pageProps.ssrHihglights : []),
          ...(Array.isArray(pageProps.ssrAds) ? pageProps.ssrAds : []),
        ]

        for (const opp of allOpps) {
          const idKey = opp?.id || opp?.slug || opp?.name
          if (!idKey || !opp?.name || seenIds.has(`opp-${idKey}`)) continue
          seenIds.add(`opp-${idKey}`)

          const title = String(opp.name).trim()
          const catName = opp?.category?.name || 'Öğrenci Fırsatı'
          const description = String(
            opp.description ||
              `Microfon öğrencilerine ve genç yeteneklere özel ${title} fırsatı.`
          ).trim()

          const slug = opp.slug ? String(opp.slug) : ''
          const url = slug
            ? `https://microfon.co/opportunity/${slug}`
            : 'https://microfon.co/opportunity'

          const isOpen = !opp.isExpired
          const dueDateStr = opp.dueDate
            ? new Date(opp.dueDate).toLocaleDateString('tr-TR')
            : undefined

          // Prioritize education, language, and internship opportunities first
          const isEduOrIntern =
            title.toLowerCase().includes('staj') ||
            title.toLowerCase().includes('eğitim') ||
            title.toLowerCase().includes('ingilizce') ||
            title.toLowerCase().includes('almanca') ||
            title.toLowerCase().includes('ielts')

          items.push({
            id: `microfon-opp-${idKey}`,
            title,
            company: `Microfon • ${catName}`,
            companyLogo: opp.photo || undefined,
            coverImage: opp.photo || undefined,
            description,
            category: 'opportunity',
            badgeLabel: isEduOrIntern ? `Eğitim & Staj Fırsatı` : `Fırsat • ${catName}`,
            source: 'microfon',
            location: 'Türkiye Geneli / Online',
            deadline: isOpen
              ? dueDateStr
                ? `Son: ${dueDateStr}`
                : 'Aktif Fırsat'
              : 'Süresi Doldu',
            isOpen,
            url,
          })
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // Sort Microfon items so active/open fellowships, scholarships, and education programs appear first
  return items.sort((a, b) => {
    const aOpen = a.isOpen !== false ? 1 : 0
    const bOpen = b.isOpen !== false ? 1 : 0
    if (aOpen !== bOpen) return bOpen - aOpen
    return 0
  })
}

/**
 * 2. Youthall Scraper (Jobs + Talent Programs)
 * Extracts full 16:9 cover images (`cdn.youthall.com/media/images/...`), company logos, tags, deadlines, and descriptions.
 */
async function scrapeYouthallPage(
  pageUrl: string,
  defaultTag: string,
  prefixId: string
): Promise<CorporateProgramItem[]> {
  const html = await fetchHtmlWithTimeout(pageUrl, 4500)
  if (!html) return []

  const $ = cheerio.load(html)
  const items: CorporateProgramItem[] = []

  // A. Grid cards (.jobs > a)
  $('.jobs > a').each((idx, el) => {
    const href = $(el).attr('href') || ''
    if (!href) return
    const url = href.startsWith('http') ? href : `https://www.youthall.com${href}`

    const coverImgEl = $(el).find('.jobs-cover img').first()
    const coverImage =
      coverImgEl.attr('src') || coverImgEl.attr('data-src') || undefined
    const coverAlt = coverImgEl.attr('alt') || ''

    const logoEl = $(el).find('.jobs-content-logo').first()
    const companyLogo = logoEl.attr('src') || logoEl.attr('data-src') || undefined
    const logoAlt = (logoEl.attr('alt') || '').replace(/\s*logo\s*$/i, '').trim()

    const title = $(el).find('.jobs-content-title h5').first().text().trim()
    const description = $(el).find('.jobs-content-desc').first().text().trim()

    const companyFromCover = coverAlt.includes(' - ')
      ? coverAlt.split(' - ')[0].trim()
      : ''
    const company = logoAlt || companyFromCover || 'Kurumsal Şirket'

    const tags: string[] = []
    $(el)
      .find('.jobs-tag')
      .each((_, tagEl) => {
        const t = $(tagEl).text().replace(/\s+/g, ' ').trim()
        if (t) tags.push(t)
      })

    const rawTypeTag = tags[0] || defaultTag
    const deadlineTag = tags.find((t) => /\d{2}\.\d{2}\.\d{4}/.test(t) || /son/i.test(t))
    const locationTag =
      tags.find(
        (t) =>
          t !== rawTypeTag &&
          t !== deadlineTag &&
          !t.toLowerCase().includes('maaş') &&
          !t.toLowerCase().includes('ücret')
      ) || 'Türkiye / Hibrit'

    if (!title) return

    const { category, badgeLabel } = classifyProgramCategory(title, rawTypeTag, description)

    items.push({
      id: `youthall-${prefixId}-grid-${idx}`,
      title,
      company,
      companyLogo,
      coverImage,
      description:
        description ||
        `${company} tarafından yayınlanan ${title} ilanı. Detaylar ve başvuru kriterleri için ilanı inceleyebilirsiniz.`,
      category,
      badgeLabel,
      source: 'youthall',
      location: locationTag,
      deadline: deadlineTag,
      isOpen: true,
      url,
    })
  })

  // B. Row cards (.jobs-row > a.jobs-row__link)
  $('.jobs-row > a.jobs-row__link').each((idx, el) => {
    const href = $(el).attr('href') || ''
    if (!href) return
    const url = href.startsWith('http') ? href : `https://www.youthall.com${href}`

    const coverImgEl = $(el).find('.jobs-row__cover img').first()
    const coverImage =
      coverImgEl.attr('src') || coverImgEl.attr('data-src') || undefined

    const logoEl = $(el).find('.jobs-row__logo').first()
    const companyLogo = logoEl.attr('src') || logoEl.attr('data-src') || undefined

    const company =
      $(el).find('.jobs-row__company').first().text().trim() ||
      (logoEl.attr('alt') || '').replace(/\s*logo\s*$/i, '').trim() ||
      'Kurumsal Şirket'

    const title = $(el).find('.jobs-row__title h5').first().text().trim()
    const description = $(el).find('.jobs-row__desc').first().text().trim()

    const tags: string[] = []
    $(el)
      .find('.jobs-row__tags .jobs-tag')
      .each((_, tagEl) => {
        const t = $(tagEl).text().replace(/\s+/g, ' ').trim()
        if (t) tags.push(t)
      })

    const rawTypeTag = tags[0] || defaultTag
    const deadlineTag = tags.find((t) => /\d{2}\.\d{2}\.\d{4}/.test(t) || /son/i.test(t))
    const locationTag =
      tags.find((t) => t !== rawTypeTag && t !== deadlineTag) || 'İstanbul / Hibrit'

    if (!title) return

    const { category, badgeLabel } = classifyProgramCategory(title, rawTypeTag, description)

    items.push({
      id: `youthall-${prefixId}-row-${idx}`,
      title,
      company,
      companyLogo,
      coverImage,
      description:
        description ||
        `${company} bünyesinde açılan ${title} programı.`,
      category,
      badgeLabel,
      source: 'youthall',
      location: locationTag,
      deadline: deadlineTag,
      isOpen: true,
      url,
    })
  })

  return items
}

/**
 * 3. Anbean Kampüs Scraper (İlanlar & Etkinlikler)
 */
async function scrapeAnbean(): Promise<CorporateProgramItem[]> {
  const [ilanlarHtml, etkinliklerHtml] = await Promise.all([
    fetchHtmlWithTimeout('https://anbeankampus.co/ilanlar/', 4500),
    fetchHtmlWithTimeout('https://anbeankampus.co/etkinlikler/', 4500),
  ])

  const items: CorporateProgramItem[] = []

  const parseAnbeanHtml = (html: string | null, defaultType: string, keyPrefix: string) => {
    if (!html) return
    const $ = cheerio.load(html)

    $('h6').each((idx, h6El) => {
      const title = $(h6El).text().replace(/\s+/g, ' ').trim()
      if (!title || title.length < 4) return
      if (
        title.toLowerCase().includes('bülten') ||
        title.toLowerCase().includes('iletişim') ||
        title.toLowerCase().includes('menü') ||
        title.toLowerCase().includes('bize ulaş')
      ) {
        return
      }

      const card = $(h6El).closest('div.col-lg-4, div.col-md-6, div.card, article, li, div')
      const parentBox = card.length ? card : $(h6El).parent().parent()

      let href =
        $(h6El).closest('a').attr('href') ||
        parentBox.find('a[href*="anbeankampus.co"]').first().attr('href') ||
        parentBox.find('a').first().attr('href') ||
        ''

      if (!href || href === '#') {
        href =
          keyPrefix === 'ilan'
            ? 'https://anbeankampus.co/ilanlar/'
            : 'https://anbeankampus.co/etkinlikler/'
      } else if (!href.startsWith('http')) {
        href = `https://anbeankampus.co${href.startsWith('/') ? '' : '/'}${href}`
      }

      let coverImage: string | undefined
      parentBox.find('img').each((_, imgEl) => {
        const src =
          $(imgEl).attr('src') ||
          $(imgEl).attr('data-src') ||
          $(imgEl).attr('data-lazy-src') ||
          ''
        if (
          src &&
          !src.includes('logo') &&
          !src.includes('icon') &&
          !src.startsWith('data:image/svg')
        ) {
          coverImage = src.startsWith('http')
            ? src
            : `https://anbeankampus.co${src.startsWith('/') ? '' : '/'}${src}`
        }
      })

      const description =
        parentBox
          .find('p')
          .first()
          .text()
          .replace(/\s+/g, ' ')
          .trim() ||
        `${title} — Anbean Kampüs üzerinden yayınlanan genç yetenek, staj ve kariyer fırsatı.`

      let company = 'Anbean Kampüs Partneri'
      if (title.includes(' - ')) {
        company = title.split(' - ')[0].trim()
      } else if (title.includes(':')) {
        company = title.split(':')[0].trim()
      } else {
        const words = title.split(' ')
        if (words.length >= 2) {
          company = words.slice(0, 2).join(' ')
        }
      }

      const { category, badgeLabel } = classifyProgramCategory(title, defaultType, description)

      items.push({
        id: `anbean-${keyPrefix}-${idx}`,
        title,
        company,
        coverImage,
        description,
        category,
        badgeLabel,
        source: 'anbean',
        location: 'Türkiye Geneli / Hibrit',
        isOpen: true,
        url: href,
      })
    })
  }

  parseAnbeanHtml(ilanlarHtml, 'Genç Yetenek & Staj', 'ilan')
  parseAnbeanHtml(etkinliklerHtml, 'Kariyer Etkinliği', 'etkinlik')

  return items
}

/**
 * 4. Techcareer.net Scraper (Jobs + Bootcamps via __NEXT_DATA__)
 */
async function scrapeTechcareer(): Promise<CorporateProgramItem[]> {
  const [jobsHtml, bootcampHtml] = await Promise.all([
    fetchHtmlWithTimeout('https://www.techcareer.net/jobs', 4500),
    fetchHtmlWithTimeout('https://www.techcareer.net/bootcamp', 4500),
  ])

  const items: CorporateProgramItem[] = []

  if (jobsHtml) {
    try {
      const $ = cheerio.load(jobsHtml)
      const nextDataRaw = $('#__NEXT_DATA__').html()
      if (nextDataRaw) {
        const parsed = JSON.parse(nextDataRaw)
        const jobList =
          parsed?.props?.pageProps?.initialJobList?.jobListItems ||
          parsed?.props?.pageProps?.jobs ||
          []

        for (let i = 0; i < Math.min(jobList.length, 16); i++) {
          const job = jobList[i]
          if (!job?.title) continue

          const company = job?.owner?.name || 'Teknoloji Şirketi'
          const rawLogo = job?.owner?.logo || ''
          const companyLogo = rawLogo
            ? rawLogo.startsWith('http')
              ? rawLogo
              : `https://cdn.gcp.techcareer.net/company/${rawLogo}`
            : undefined

          const slug = job?.slug || ''
          const url = slug
            ? `https://www.techcareer.net/jobs/${slug}`
            : 'https://www.techcareer.net/jobs'

          const cityTitle = job?.location?.city?.title || 'İstanbul'
          const wpType =
            Array.isArray(job?.workPlaces) && job.workPlaces.includes(2)
              ? 'Uzaktan / Hibrit'
              : 'Hibrit / Ofis'

          const endDateRaw = job?.endDate
            ? new Date(job.endDate).toLocaleDateString('tr-TR')
            : undefined

          const { category, badgeLabel } = classifyProgramCategory(
            job.title,
            'Teknoloji İlanı',
            company
          )

          items.push({
            id: `techcareer-job-${job.id || i}`,
            title: job.title,
            company,
            companyLogo,
            description: `${company} tarafından Techcareer.net üzerinde yayınlanan ${job.title} pozisyonu (${cityTitle} • ${wpType}).`,
            category,
            badgeLabel,
            source: 'techcareer',
            location: `${cityTitle} (${wpType})`,
            deadline: endDateRaw ? `Son: ${endDateRaw}` : undefined,
            isOpen: true,
            url,
          })
        }
      }
    } catch {
      // ignore json parse failure
    }
  }

  if (bootcampHtml) {
    try {
      const $ = cheerio.load(bootcampHtml)
      const nextDataRaw = $('#__NEXT_DATA__').html()
      if (nextDataRaw) {
        const parsed = JSON.parse(nextDataRaw)
        const pageProps = parsed?.props?.pageProps || {}
        const events =
          pageProps?.events ||
          pageProps?.bootcamps ||
          pageProps?.initialEventList?.items ||
          pageProps?.data?.items ||
          []

        if (Array.isArray(events)) {
          for (let i = 0; i < Math.min(events.length, 12); i++) {
            const ev = events[i]
            if (!ev?.title) continue
            const img = ev?.imageUrl || ev?.image || ev?.bannerUrl || ''
            const coverImage = img
              ? img.startsWith('http')
                ? img
                : `https://cdn.gcp.techcareer.net/${img.replace(/^\//, '')}`
              : undefined

            const slug = ev?.slug || ''
            const url = slug
              ? `https://www.techcareer.net/bootcamp/${slug}`
              : 'https://www.techcareer.net/bootcamp'

            items.push({
              id: `techcareer-bootcamp-${ev.id || i}`,
              title: ev.title,
              company: ev?.company?.name || 'Techcareer.net',
              coverImage,
              description:
                ev?.shortDescription ||
                ev?.description?.replace(/<[^>]+>/g, '').slice(0, 180) ||
                'Ücretsiz teknoloji eğitimi, proje geliştirme ve işe alım odaklı Bootcamp programı.',
              category: 'bootcamp',
              badgeLabel: 'Bootcamp & İşe Alım',
              source: 'techcareer',
              location: 'Online / Türkiye',
              deadline: ev?.lastApplyDate
                ? new Date(ev.lastApplyDate).toLocaleDateString('tr-TR')
                : undefined,
              isOpen: true,
              url,
            })
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return items
}

/**
 * 5. Toptalent.co Scraper (İş İlanları & Yetenek Programları)
 */
async function scrapeToptalent(): Promise<CorporateProgramItem[]> {
  const html = await fetchHtmlWithTimeout('https://toptalent.co/is-ilanlari', 4500)
  if (!html) return []

  const $ = cheerio.load(html)
  const items: CorporateProgramItem[] = []

  $('a.position').each((idx, el) => {
    const href = $(el).attr('href') || ''
    if (!href) return
    const url = href.startsWith('http') ? href : `https://toptalent.co${href}`

    const logoEl = $(el).find('img.comp-logo').first()
    const rawLogo = logoEl.attr('src') || logoEl.attr('data-src') || ''
    const companyLogo = rawLogo
      ? rawLogo.startsWith('http')
        ? rawLogo
        : `https://toptalent.co${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`
      : undefined

    const company = (logoEl.attr('alt') || 'Kurumsal Firma').trim()
    const title = $(el).find('h5.card-title').first().text().replace(/\s+/g, ' ').trim()
    const location =
      $(el).find('p.card-text span.text-grey-l').first().text().replace(/\s+/g, ' ').trim() ||
      'İstanbul'
    const deadline = $(el)
      .find('.badge-circle-green, .badge-circle-orange, .badge-circle-red')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim()

    if (!title) return

    const { category, badgeLabel } = classifyProgramCategory(title, '', company)

    items.push({
      id: `toptalent-${idx}`,
      title,
      company,
      companyLogo,
      description: `${company} bünyesinde açılan ${title} fırsatı (${location}). Toptalent üzerinden kurumsal başvuru.`,
      category,
      badgeLabel,
      source: 'toptalent',
      location,
      deadline: deadline || undefined,
      isOpen: true,
      url,
    })
  })

  return items
}

/**
 * 6. Curated Flagship Corporate, Internship & University Career Programs
 */
const FLAGSHIP_CORPORATE_PROGRAMS: CorporateProgramItem[] = [
  {
    id: 'uni-yetenek-kapisi',
    title: 'Yetenek Kapısı — Cumhurbaşkanlığı Ulusal Staj & Üniversite Kariyer Portalı',
    company: 'Yetenek Kapısı & Üniversite Kariyer Merkezleri',
    companyLogo: 'https://www.yetenekkapisi.org/assets/images/logo.png',
    coverImage:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    description:
      'Türkiye’deki tüm üniversite kariyer merkezlerinin ortak platformu. Kamu ve özel sektördeki kurumsal staj, yeni mezun, MT ve kariyer fuarı ilanlarına tek noktadan erişim.',
    category: 'intern',
    badgeLabel: 'Ulusal Staj & Kariyer',
    source: 'university',
    location: 'Türkiye Geneli (81 İl)',
    deadline: 'Sürekli Açık',
    isOpen: true,
    url: 'https://www.yetenekkapisi.org/',
  },
  {
    id: 'uni-tubitak-star',
    title: 'TÜBİTAK STAR — Lisans Öğrencileri Stajyer Araştırmacı Burs Programı',
    company: 'TÜBİTAK',
    coverImage:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80',
    description:
      'Lisans öğrencilerinin TÜBİTAK merkez ve enstitülerinde veya desteklenen Ar-Ge projelerinde burslu stajyer araştırmacı olarak görev almasını sağlayan prestijli program.',
    category: 'scholarship',
    badgeLabel: 'Ar-Ge Burslu Staj',
    source: 'university',
    location: 'Ankara / Kocaeli / Türkiye',
    deadline: 'Dönemsel Çağrı',
    isOpen: true,
    url: 'https://star.tubitak.gov.tr/',
  },
  {
    id: 'uni-aselsan-ayetenek',
    title: 'ASELSAN a-Yetenek & Aday Mühendislik / Uzun Dönem Staj Programı',
    company: 'ASELSAN',
    coverImage:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    description:
      'Üniversitelerin 3. ve 4. sınıf mühendislik ile temel bilimler öğrencileri için ASELSAN bünyesinde aday mühendislik, uzun dönem staj ve yeni mezun işe alım programı.',
    category: 'intern',
    badgeLabel: 'Aday Mühendis & Staj',
    source: 'university',
    location: 'Ankara / İstanbul',
    deadline: 'Aktif Başvuru',
    isOpen: true,
    url: 'https://www.aselsan.com/tr/kariyer/aday-muhendislik',
  },
  {
    id: 'uni-tusas-sky',
    title: 'TUSAŞ SKY Experience — Aday Mühendis & Stajyer Programları',
    company: 'TUSAŞ - Türk Havacılık ve Uzay Sanayii',
    coverImage:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80',
    description:
      'Havacılık ve uzay projelerinde gerçek mühendislik deneyimi sunan SKY Experience uzun dönem aday mühendislik, yaz stajı ve yeni mezun yetenek programı.',
    category: 'talent_program',
    badgeLabel: 'Havacılık Genç Yetenek',
    source: 'university',
    location: 'Ankara / İstanbul / Teknoparklar',
    deadline: 'Aktif Program',
    isOpen: true,
    url: 'https://kariyer.tusas.com/',
  },
  {
    id: 'uni-thy-takeoff',
    title: 'Türk Hava Yolları Take-Off Jr. & Part-Time Öğrenci / Yeni Mezun Programı',
    company: 'Türk Hava Yolları (THY)',
    coverImage:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=900&q=80',
    description:
      'Üniversite son sınıf öğrencileri (Part-Time) ve yeni mezunlar (Take-Off Jr.) için THY Genel Müdürlük ve teknoloji birimlerinde global kariyer başlangıç programı.',
    category: 'talent_program',
    badgeLabel: 'Part-Time & Yeni Mezun',
    source: 'university',
    location: 'İstanbul',
    deadline: 'Başvuruya Açık',
    isOpen: true,
    url: 'https://careers.turkishairlines.com/',
  },
  {
    id: 'uni-itu-odtu-boun-koc',
    title: 'Koç Topluluğu Genç Yetenek & Uzun Dönem Staj İlanları (Koç Kariyerim)',
    company: 'Koç Holding & Topluluk Şirketleri',
    coverImage:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
    description:
      'Arçelik, Tüpraş, Ford Otosan, Yapı Kredi, Otokoç ve KoçDigital bünyesinde açılan tüm uzun dönem stajyer, yeni mezun ve MT (Management Trainee) ilanları.',
    category: 'new_grad',
    badgeLabel: 'Holding Staj & MT',
    source: 'university',
    location: 'İstanbul / Ankara / İzmir / Kocaeli',
    deadline: 'Sürekli Güncel',
    isOpen: true,
    url: 'https://www.kockariyerim.com/',
  },
]

export async function GET() {
  try {
    const [
      microfonItems,
      youthallJobs,
      youthallTalent,
      anbeanItems,
      techcareerItems,
      toptalentItems,
    ] = await Promise.all([
      scrapeMicrofon(),
      scrapeYouthallPage('https://www.youthall.com/tr/jobs/', 'Staj & Yeni Mezun', 'jobs'),
      scrapeYouthallPage(
        'https://www.youthall.com/tr/talent-programs/?order=6',
        'Yetenek Programı',
        'talent'
      ),
      scrapeAnbean(),
      scrapeTechcareer(),
      scrapeToptalent(),
    ])

    // Combine and deduplicate by Title+Company
    const combined: CorporateProgramItem[] = [
      ...youthallTalent,
      ...microfonItems,
      ...youthallJobs,
      ...anbeanItems,
      ...techcareerItems,
      ...toptalentItems,
      ...FLAGSHIP_CORPORATE_PROGRAMS,
    ]

    const seen = new Set<string>()
    const deduplicated: CorporateProgramItem[] = []

    for (const item of combined) {
      const normKey = `${item.title.toLowerCase().trim()}::${item.company.toLowerCase().trim()}`
      if (seen.has(normKey)) continue
      seen.add(normKey)
      deduplicated.push(item)
    }

    return NextResponse.json({
      programs: deduplicated,
      counts: {
        total: deduplicated.length,
        youthall: deduplicated.filter((p) => p.source === 'youthall').length,
        microfon: deduplicated.filter((p) => p.source === 'microfon').length,
        anbean: deduplicated.filter((p) => p.source === 'anbean').length,
        techcareer: deduplicated.filter((p) => p.source === 'techcareer').length,
        toptalent: deduplicated.filter((p) => p.source === 'toptalent').length,
        university: deduplicated.filter((p) => p.source === 'university').length,
      },
      fetchedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[PROGRAMS_DISCOVER_ERROR]', error)
    return NextResponse.json({
      programs: FLAGSHIP_CORPORATE_PROGRAMS,
      counts: {
        total: FLAGSHIP_CORPORATE_PROGRAMS.length,
        youthall: 0,
        microfon: 0,
        anbean: 0,
        techcareer: 0,
        toptalent: 0,
        university: FLAGSHIP_CORPORATE_PROGRAMS.length,
      },
      fetchedAt: new Date().toISOString(),
    })
  }
}
