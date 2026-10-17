import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

// Kullanıcının ilana özel ürettiği tüm CV paketlerini getir
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    return await ctx.db
      .query('generatedCvs')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

// Yeni üretilen CV paketini kaydet
export const create = mutation({
  args: {
    targetCompany: v.string(),
    targetRole: v.string(),
    jobUrl: v.optional(v.string()),
    jobDescription: v.optional(v.string()),
    templateId: v.union(
      v.literal('harvard'),
      v.literal('jakes'),
      v.literal('mckinsey'),
      v.literal('academic')
    ),
    language: v.union(v.literal('tr'), v.literal('en')),
    atsScoreBefore: v.number(),
    atsScoreAfter: v.number(),
    matchedKeywords: v.array(v.string()),
    selectedSources: v.array(v.string()),
    cvData: v.any(),
    coverLetter: v.string(),
    fellowshipAnswers: v.optional(
      v.array(
        v.object({
          question: v.string(),
          answer: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    return await ctx.db.insert('generatedCvs', {
      ...args,
      userId,
      createdAt: Date.now(),
    })
  },
})

// Mevcut üretilen CV paketini güncelle (şablon değişimi veya metin düzenleme)
export const update = mutation({
  args: {
    id: v.id('generatedCvs'),
    templateId: v.optional(
      v.union(
        v.literal('harvard'),
        v.literal('jakes'),
        v.literal('mckinsey'),
        v.literal('academic')
      )
    ),
    cvData: v.optional(v.any()),
    coverLetter: v.optional(v.string()),
    fellowshipAnswers: v.optional(
      v.array(
        v.object({
          question: v.string(),
          answer: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) {
      throw new Error('Not found or unauthorized')
    }

    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, val]) => val !== undefined)
    )
    await ctx.db.patch(id, patch)
  },
})

// Üretilen CV paketini sil
export const remove = mutation({
  args: { id: v.id('generatedCvs') },
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
