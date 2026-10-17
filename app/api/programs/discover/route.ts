import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import type { CorporateProgramItem, ProgramCategory } from '@/types'

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
}

function classifyProgramCategory(title: string, badgeOrTag: string, description: string): {
  category: ProgramCategory
  badgeLabel: string
} {
  const combined = `${title} ${badgeOrTag} ${description}`.toLowerCase()

  if (
    combined.includes('bootcamp') ||
    combined.includes('hackathon') ||
    combined.includes('ideathon') ||
    combined.includes('datathon') ||
    combined.includes('case study') ||
    combined.includes('yarışma') ||
    combined.includes('summit') ||
    combined.includes('zirve') ||
    combined.includes('workshop')
  ) {
    return {
      category: 'bootcamp',
      badgeLabel: badgeOrTag || 'Bootcamp & Etkinlik',
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
    combined.includes('fellowship') ||
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
 * 1. Youthall Scraper (Jobs + Talent Programs)
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
      url,
    })
  })

  return items
}

/**
 * 2. Anbean Kampüs Scraper (İlanlar & Etkinlikler)
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
      // Skip generic footer/modal titles
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

      // Look for cover image in the card container
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

      // Extract company name from title if separated by dash or colon, or first brand word
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
        url: href,
      })
    })
  }

  parseAnbeanHtml(ilanlarHtml, 'Genç Yetenek & Staj', 'ilan')
  parseAnbeanHtml(etkinliklerHtml, 'Kariyer Etkinliği', 'etkinlik')

  return items
}

/**
 * 3. Techcareer.net Scraper (Jobs + Bootcamps via __NEXT_DATA__)
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
 * 4. Toptalent.co Scraper (İş İlanları & Yetenek Programları)
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
      url,
    })
  })

  return items
}

/**
 * 5. Curated Flagship Corporate, Internship & University Career Programs
 * Provides reliable, official corporate talent & university career portal programs with rich visual covers
 * so every platform & category tab always has high-impact cards even if a third-party site rate-limits.
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
    category: 'intern',
    badgeLabel: 'Ar-Ge Burslu Staj',
    source: 'university',
    location: 'Ankara / Kocaeli / Türkiye',
    deadline: 'Dönemsel Çağrı',
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
    url: 'https://www.kockariyerim.com/',
  },
  {
    id: 'anbean-curated-1',
    title: 'Anbean Kampüs — Güncel Şirket Stajları, MT İlanları ve Vaka Yarışmaları',
    company: 'Anbean Kampüs',
    coverImage:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    description:
      'FMCG, Bankacılık, Teknoloji ve Danışmanlık firmalarının üniversite öğrencileri ve yeni mezunlar için açtığı en güncel staj, ideathon ve MT başvuruları.',
    category: 'talent_program',
    badgeLabel: 'Kampüs & MT İlanları',
    source: 'anbean',
    location: 'Türkiye Geneli',
    deadline: 'Güncel İlanlar',
    url: 'https://anbeankampus.co/ilanlar/',
  },
  {
    id: 'techcareer-curated-bootcamp',
    title: 'Techcareer.net — Ücretsiz Yazılım, Veri Bilimi & AI Bootcamp Programları',
    company: 'Techcareer.net',
    coverImage:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
    description:
      'Yeni mezunlar ve son sınıf öğrencileri için düzenlenen, sonunda sertifika ve anlaşmalı teknoloji şirketlerinde doğrudan mülakat/işe alım fırsatı sunan Bootcamp ve Hackathonlar.',
    category: 'bootcamp',
    badgeLabel: 'Ücretsiz Bootcamp',
    source: 'techcareer',
    location: 'Online & Hibrit',
    deadline: 'Kayıtlar Açık',
    url: 'https://www.techcareer.net/bootcamp',
  },
]

export async function GET() {
  try {
    const [youthallJobs, youthallTalent, anbeanItems, techcareerItems, toptalentItems] =
      await Promise.all([
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

    // Combine and deduplicate by URL or Title+Company
    const combined: CorporateProgramItem[] = [
      ...youthallTalent,
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
        anbean: 1,
        techcareer: 1,
        toptalent: 0,
        university: 6,
      },
      fetchedAt: new Date().toISOString(),
    })
  }
}
