'use client'

import { useRef } from 'react'
import type { HarvardCVData, HarvardTemplateId } from '@/types'
import { cn } from '@/lib/utils'
import { Download, Printer, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HarvardCVPreviewProps {
  data: HarvardCVData
  templateId: HarvardTemplateId
  language: 'tr' | 'en'
  density?: 'compact' | 'standard' | 'spacious'
  onChange?: (updated: HarvardCVData) => void
  fileName?: string
}

export const TEMPLATE_META: Array<{
  id: HarvardTemplateId
  name: string
  badge: string
  description: string
}> = [
  {
    id: 'harvard',
    name: 'Harvard OCS Classic',
    badge: '%100 ATS · Klasik Serif',
    description: 'Harvard Üniversitesi Kariyer Ofisi resmi formatı. Kurumsal, Ürün ve Yönetim rolleri için altın standart.',
  },
  {
    id: 'jakes',
    name: "Jake's Resume (LaTeX)",
    badge: 'Tech & AI #1',
    description: 'Yazılım, Veri Bilimi ve AI mühendisliğinde dünyada en çok kabul alan Overleaf LaTeX formatı.',
  },
  {
    id: 'mckinsey',
    name: 'McKinsey / WSO Impact',
    badge: 'Executive & PM',
    description: 'Metrik, ciro ve iş etkisi odaklı. Danışmanlık, Product Specialist ve Girişimcilik rolleri için.',
  },
  {
    id: 'academic',
    name: 'Fellowship & Academic',
    badge: 'Burs & Program',
    description: 'Fellowship başvuruları, yüksek lisans, araştırma ve liderlik geçmişini öne çıkaran akademik düzen.',
  },
]

export function HarvardCVPreview({
  data,
  templateId,
  language,
  density = 'standard',
  fileName = 'Harvard_CV',
}: HarvardCVPreviewProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const labels =
    language === 'en'
      ? {
          summary: 'PROFESSIONAL SUMMARY',
          education: 'EDUCATION',
          experience: 'PROFESSIONAL EXPERIENCE',
          projects: 'SELECTED PROJECTS & VENTURES',
          leadership: 'FELLOWSHIPS, LEADERSHIP & ACTIVITIES',
          skills: 'TECHNICAL SKILLS & INTERESTS',
          awards: 'HONORS, AWARDS & CERTIFICATIONS',
          technical: 'Technical & Programming',
          tools: 'Frameworks & Tools',
          domains: 'Domains & Competencies',
          languages: 'Languages',
        }
      : {
          summary: 'PROFESYONEL ÖZET',
          education: 'EĞİTİM',
          experience: 'İŞ & STAJ DENEYİMİ',
          projects: 'SEÇİLMİŞ PROJELER & GİRİŞİMLER',
          leadership: 'FELLOWSHIP, LİDERLİK & TOPLULUK',
          skills: 'TEKNİK YETKİNLİKLER & DİLLER',
          awards: 'ÖDÜLLER, BURSLAR & SERTİFİKALAR',
          technical: 'Teknik & Programlama',
          tools: 'Araçlar & Teknolojiler',
          domains: 'Uzmanlık Alanları',
          languages: 'Yabancı Diller',
        }

  function handleExportVectorPDF() {
    if (!sheetRef.current) return
    const htmlContent = sheetRef.current.innerHTML
    const cleanTitle = (fileName || data.fullName || 'Harvard_CV').replace(/\s+/g, '_')

    const printWindow = window.open('', '_blank', 'width=900,height=1100')
    if (!printWindow) return

    const fontFamily =
      templateId === 'harvard' || templateId === 'academic'
        ? '"Times New Roman", Georgia, Cambria, serif'
        : '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${cleanTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: ${density === 'compact' ? '10mm 12mm' : '13mm 15mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: ${fontFamily};
      font-size: ${density === 'compact' ? '9.5pt' : density === 'spacious' ? '10.8pt' : '10pt'};
      line-height: ${density === 'compact' ? '1.28' : density === 'spacious' ? '1.45' : '1.35'};
    }
    .cv-root {
      width: 100%;
      color: #000;
    }
    h1, h2, h3, p, ul, li {
      margin: 0;
      padding: 0;
    }
    .cv-header-center {
      text-align: center;
      margin-bottom: 10px;
    }
    .cv-header-left {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .cv-name {
      font-size: ${templateId === 'jakes' ? '20pt' : '18pt'};
      font-weight: 700;
      letter-spacing: ${templateId === 'harvard' ? '0.06em' : '0.01em'};
      text-transform: ${templateId === 'harvard' ? 'uppercase' : 'none'};
    }
    .cv-contact {
      font-size: 9pt;
      color: #111;
      margin-top: 3px;
    }
    .cv-section {
      margin-top: ${density === 'compact' ? '7px' : '10px'};
    }
    .cv-section-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #000;
      padding-bottom: 1.5px;
      margin-bottom: 5px;
    }
    .cv-item {
      margin-bottom: ${density === 'compact' ? '5px' : '7px'};
      page-break-inside: avoid;
    }
    .cv-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 8px;
    }
    .cv-bold {
      font-weight: 700;
    }
    .cv-italic {
      font-style: italic;
    }
    .cv-bullets {
      margin-top: 2px;
      padding-left: 15px;
      list-style-type: disc;
    }
    .cv-bullets li {
      margin-bottom: 1.5px;
    }
    .cv-skill-line {
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="cv-root">${htmlContent}</div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 150);
    };
  </script>
</body>
</html>`)
    printWindow.document.close()
  }

  const contactItems = [
    data.contact?.location,
    data.contact?.email,
    data.contact?.phone,
    data.contact?.linkedin,
    data.contact?.github,
    data.contact?.portfolio,
  ].filter(Boolean)

  const isSerif = templateId === 'harvard' || templateId === 'academic'
  const textSizeClass =
    density === 'compact'
      ? 'text-[11px] leading-[1.32]'
      : density === 'spacious'
      ? 'text-[13px] leading-[1.48]'
      : 'text-[12px] leading-[1.38]'

  const sectionSpacingClass =
    density === 'compact' ? 'mt-2.5' : density === 'spacious' ? 'mt-4' : 'mt-3'

  const renderSectionOrder = () => {
    if (templateId === 'academic') {
      return ['summary', 'education', 'leadership', 'experience', 'projects', 'awards', 'skills']
    }
    if (templateId === 'jakes') {
      return ['education', 'experience', 'projects', 'leadership', 'skills', 'awards']
    }
    if (templateId === 'mckinsey') {
      return ['summary', 'experience', 'projects', 'leadership', 'education', 'skills', 'awards']
    }
    // Harvard OCS Classic
    return ['education', 'experience', 'leadership', 'projects', 'skills', 'awards']
  }

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/50 border border-border rounded-xl p-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            Kağıt üzerindeki herhangi bir metne tıklayarak doğrudan düzenleyebilirsiniz.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleExportVectorPDF}
            className="h-8 text-xs gap-1.5 font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Vektörel PDF İndir (ATS %100)
          </Button>
        </div>
      </div>

      {/* A4 Paper Sheet */}
      <div className="w-full overflow-x-auto pb-2">
        <div
          ref={sheetRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          className={cn(
            'mx-auto bg-white text-black shadow-xl border border-zinc-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all',
            'w-full max-w-[794px] min-h-[1050px]',
            density === 'compact' ? 'p-6 sm:p-8' : 'p-7 sm:p-10',
            isSerif ? 'font-serif' : 'font-sans',
            textSizeClass
          )}
        >
          {/* HEADER */}
          {templateId === 'mckinsey' ? (
            <div className="cv-header-left flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-black pb-2 mb-3 gap-2">
              <div>
                <h1 className="cv-name text-xl sm:text-2xl font-bold tracking-tight text-black">
                  {data.fullName || 'Ad Soyad'}
                </h1>
                {data.title && (
                  <p className="text-xs font-semibold text-zinc-800 mt-0.5">{data.title}</p>
                )}
              </div>
              <div className="cv-contact text-[11px] text-zinc-900 sm:text-right leading-snug">
                {contactItems.join(' • ')}
              </div>
            </div>
          ) : (
            <div className="cv-header-center text-center mb-3">
              <h1
                className={cn(
                  'cv-name font-bold text-black',
                  templateId === 'harvard'
                    ? 'text-xl sm:text-2xl uppercase tracking-widest'
                    : 'text-2xl tracking-tight'
                )}
              >
                {data.fullName || 'Ad Soyad'}
              </h1>
              <p className="cv-contact text-[11px] text-zinc-900 mt-1">
                {contactItems.join('  •  ')}
              </p>
            </div>
          )}

          {/* DYNAMIC SECTIONS */}
          {renderSectionOrder().map((sectionKey) => {
            if (sectionKey === 'summary' && data.summary) {
              return (
                <div key="summary" className={cn('cv-section', sectionSpacingClass)}>
                  <h2 className="cv-section-title text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-black">
                    {labels.summary}
                  </h2>
                  <p className="text-zinc-900 leading-relaxed">{data.summary}</p>
                </div>
              )
            }

            if (sectionKey === 'education' && data.education && data.education.length > 0) {
              return (
                <div key="education" className={cn('cv-section', sectionSpacingClass)}>
                  <h2 className="cv-section-title text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-black">
                    {labels.education}
                  </h2>
                  <div className="space-y-2">
                    {data.education.map((edu, idx) => (
                      <div key={idx} className="cv-item">
                        <div className="cv-row flex justify-between items-baseline gap-2">
                          <span className="cv-bold font-bold text-black">{edu.institution}</span>
                          <span className="text-zinc-900 shrink-0 font-medium">
                            {[edu.location, edu.date].filter(Boolean).join(' | ')}
                          </span>
                        </div>
                        <div className="cv-row flex justify-between items-baseline gap-2">
                          <span className="cv-italic italic text-zinc-900">{edu.degree}</span>
                          {edu.gpaOrHonors && (
                            <span className="text-zinc-900 text-[11px]">{edu.gpaOrHonors}</span>
                          )}
                        </div>
                        {edu.details && edu.details.length > 0 && (
                          <ul className="cv-bullets list-disc pl-4 mt-0.5 space-y-0.5">
                            {edu.details.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            if (sectionKey === 'experience' && data.experience && data.experience.length > 0) {
              return (
                <div key="experience" className={cn('cv-section', sectionSpacingClass)}>
                  <h2 className="cv-section-title text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-black">
                    {labels.experience}
                  </h2>
                  <div className="space-y-2.5">
                    {data.experience.map((exp, idx) => (
                      <div key={idx} className="cv-item">
                        <div className="cv-row flex justify-between items-baseline gap-2">
                          <span className="cv-bold font-bold text-black">{exp.company}</span>
                          <span className="text-zinc-900 shrink-0 font-medium">
                            {[exp.location, exp.date].filter(Boolean).join(' | ')}
                          </span>
                        </div>
                        <div className="cv-row flex justify-between items-baseline gap-2">
                          <span className="cv-italic italic font-medium text-zinc-900">
                            {exp.role}
                          </span>
                        </div>
                        {exp.bullets && exp.bullets.length > 0 && (
                          <ul className="cv-bullets list-disc pl-4 mt-1 space-y-0.5">
                            {exp.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            if (sectionKey === 'projects' && data.projects && data.projects.length > 0) {
              return (
                <div key="projects" className={cn('cv-section', sectionSpacingClass)}>
                  <h2 className="cv-section-title text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-black">
                    {labels.projects}
                  </h2>
                  <div className="space-y-2">
                    {data.projects.map((proj, idx) => (
                      <div key={idx} className="cv-item">
                        <div className="cv-row flex justify-between items-baseline gap-2">
                          <div>
                            <span className="cv-bold font-bold text-black">{proj.name}</span>
                            {proj.roleOrTech && (
                              <span className="cv-italic italic text-zinc-800">
                                {' '}
                                | {proj.roleOrTech}
                              </span>
                            )}
                          </div>
                          {proj.date && (
                            <span className="text-zinc-900 shrink-0 font-medium">{proj.date}</span>
                          )}
                        </div>
                        {proj.bullets && proj.bullets.length > 0 && (
                          <ul className="cv-bullets list-disc pl-4 mt-0.5 space-y-0.5">
                            {proj.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            if (
              sectionKey === 'leadership' &&
              data.leadershipAndFellowships &&
              data.leadershipAndFellowships.length > 0
            ) {
              return (
                <div key="leadership" className={cn('cv-section', sectionSpacingClass)}>
                  <h2 className="cv-section-title text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-black">
                    {labels.leadership}
                  </h2>
                  <div className="space-y-2">
                    {data.leadershipAndFellowships.map((lead, idx) => (
                      <div key={idx} className="cv-item">
                        <div className="cv-row flex justify-between items-baseline gap-2">
                          <div>
                            <span className="cv-bold font-bold text-black">
                              {lead.organization}
                            </span>
                            {lead.role && (
                              <span className="cv-italic italic text-zinc-900">
                                {' '}
                                — {lead.role}
                              </span>
                            )}
                          </div>
                          {lead.date && (
                            <span className="text-zinc-900 shrink-0 font-medium">{lead.date}</span>
                          )}
                        </div>
                        {lead.bullets && lead.bullets.length > 0 && (
                          <ul className="cv-bullets list-disc pl-4 mt-0.5 space-y-0.5">
                            {lead.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }

            if (sectionKey === 'skills' && data.skills) {
              const hasSkills =
                (data.skills.technical && data.skills.technical.length > 0) ||
                (data.skills.tools && data.skills.tools.length > 0) ||
                (data.skills.domains && data.skills.domains.length > 0) ||
                (data.skills.languages && data.skills.languages.length > 0)

              if (!hasSkills) return null

              return (
                <div key="skills" className={cn('cv-section', sectionSpacingClass)}>
                  <h2 className="cv-section-title text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-black">
                    {labels.skills}
                  </h2>
                  <div className="space-y-0.5">
                    {data.skills.technical && data.skills.technical.length > 0 && (
                      <div className="cv-skill-line">
                        <span className="cv-bold font-bold">{labels.technical}: </span>
                        <span>{data.skills.technical.join(', ')}</span>
                      </div>
                    )}
                    {data.skills.tools && data.skills.tools.length > 0 && (
                      <div className="cv-skill-line">
                        <span className="cv-bold font-bold">{labels.tools}: </span>
                        <span>{data.skills.tools.join(', ')}</span>
                      </div>
                    )}
                    {data.skills.domains && data.skills.domains.length > 0 && (
                      <div className="cv-skill-line">
                        <span className="cv-bold font-bold">{labels.domains}: </span>
                        <span>{data.skills.domains.join(', ')}</span>
                      </div>
                    )}
                    {data.skills.languages && data.skills.languages.length > 0 && (
                      <div className="cv-skill-line">
                        <span className="cv-bold font-bold">{labels.languages}: </span>
                        <span>{data.skills.languages.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            if (
              sectionKey === 'awards' &&
              data.awardsAndCertifications &&
              data.awardsAndCertifications.length > 0
            ) {
              return (
                <div key="awards" className={cn('cv-section', sectionSpacingClass)}>
                  <h2 className="cv-section-title text-[11px] font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 text-black">
                    {labels.awards}
                  </h2>
                  <ul className="cv-bullets list-disc pl-4 space-y-0.5">
                    {data.awardsAndCertifications.map((aw, i) => (
                      <li key={i}>{aw}</li>
                    ))}
                  </ul>
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
