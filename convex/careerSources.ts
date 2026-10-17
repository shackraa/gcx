import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

// Kullanıcının tüm Kariyer Hafızası kaynak belgelerini getir
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const sources = await ctx.db
      .query('careerSources')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()

    return await Promise.all(
      sources.map(async (src) => {
        let downloadUrl: string | null = null
        if (src.storageId) {
          try {
            downloadUrl = await ctx.storage.getUrl(src.storageId)
          } catch {
            // ignore
          }
        }
        return {
          ...src,
          downloadUrl,
        }
      })
    )
  },
})

// Yeni kaynak belge ekle (Tak-tak-tak hızlı yükleme veya yapıştırma)
export const create = mutation({
  args: {
    title: v.string(),
    sourceType: v.union(
      v.literal('cv'),
      v.literal('motivation_letter'),
      v.literal('fellowship'),
      v.literal('project_note'),
      v.literal('certificate'),
      v.literal('other')
    ),
    rawContent: v.string(),
    extractedSummary: v.optional(v.string()),
    extractedHighlights: v.optional(v.array(v.string())),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    return await ctx.db.insert('careerSources', {
      ...args,
      userId,
      createdAt: Date.now(),
    })
  },
})

// Mevcut CV Havuzundaki (resumes) belgeleri ve ön yazıları tek tıkla Kariyer Hafızasına aktar
export const syncFromResumes = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const resumes = await ctx.db
      .query('resumes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const existingSources = await ctx.db
      .query('careerSources')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const existingTitles = new Set(existingSources.map((s) => s.title.toLowerCase()))
    let importedCount = 0

    for (const r of resumes) {
      const cvTitle = r.fileName || r.name
      if (!existingTitles.has(cvTitle.toLowerCase()) && (r.rawText || r.summary || (r.skills && r.skills.length > 0))) {
        const contentParts = [
          r.name ? `CV Başlığı: ${r.name}` : '',
          r.targetRole ? `Hedef Pozisyon: ${r.targetRole}` : '',
          r.summary ? `Özet: ${r.summary}` : '',
          r.skills && r.skills.length > 0 ? `Yetenekler: ${r.skills.join(', ')}` : '',
          r.rawText ? `Detaylı İçerik:\n${r.rawText}` : '',
        ].filter(Boolean)

        await ctx.db.insert('careerSources', {
          userId,
          title: cvTitle,
          sourceType: 'cv',
          rawContent: contentParts.join('\n\n'),
          extractedSummary: r.summary || `${r.name} CV kaydı`,
          extractedHighlights: r.skills?.slice(0, 6) || [],
          fileName: r.fileName,
          fileSize: r.fileSize,
          storageId: r.storageId,
          createdAt: Date.now(),
        })
        existingTitles.add(cvTitle.toLowerCase())
        importedCount++
      }

      if (r.coverLetter && r.coverLetter.trim().length > 30) {
        const letterTitle = `${r.name} - Motivasyon Mektubu (TR)`
        if (!existingTitles.has(letterTitle.toLowerCase())) {
          await ctx.db.insert('careerSources', {
            userId,
            title: letterTitle,
            sourceType: 'motivation_letter',
            rawContent: r.coverLetter,
            extractedSummary: `${r.targetRole || r.name} için yazılmış Türkçe ön yazı / motivasyon mektubu.`,
            extractedHighlights: [r.targetRole || 'Motivasyon Mektubu'],
            createdAt: Date.now(),
          })
          existingTitles.add(letterTitle.toLowerCase())
          importedCount++
        }
      }

      if (r.coverLetterEn && r.coverLetterEn.trim().length > 30) {
        const letterEnTitle = `${r.name} - Cover Letter (EN)`
        if (!existingTitles.has(letterEnTitle.toLowerCase())) {
          await ctx.db.insert('careerSources', {
            userId,
            title: letterEnTitle,
            sourceType: 'motivation_letter',
            rawContent: r.coverLetterEn,
            extractedSummary: `${r.targetRole || r.name} için yazılmış İngilizce Cover Letter.`,
            extractedHighlights: [r.targetRole || 'Cover Letter (EN)'],
            createdAt: Date.now(),
          })
          existingTitles.add(letterEnTitle.toLowerCase())
          importedCount++
        }
      }
    }

    return { importedCount }
  },
})

// Kaynak belge sil
export const remove = mutation({
  args: { id: v.id('careerSources') },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) {
      throw new Error('Not found or unauthorized')
    }

    await ctx.db.delete(id)
  },
})
