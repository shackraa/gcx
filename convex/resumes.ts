import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

// ─────────────────────────────────────────────
// Kullanıcının tüm CV'lerini getir
// ─────────────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    return await ctx.db
      .query('resumes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

// ─────────────────────────────────────────────
// Tek bir CV getir
// ─────────────────────────────────────────────
export const get = query({
  args: { id: v.id('resumes') },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const resume = await ctx.db.get(id)
    if (!resume || resume.userId !== userId) return null

    return resume
  },
})

// ─────────────────────────────────────────────
// Yeni CV Ekle
// ─────────────────────────────────────────────
export const create = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    targetRole: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    skills: v.array(v.string()),
    summary: v.optional(v.string()),
    rawText: v.optional(v.string()),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    // If marked as default, unset previous default
    if (args.isDefault) {
      const existing = await ctx.db
        .query('resumes')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect()

      for (const r of existing) {
        if (r.isDefault) {
          await ctx.db.patch(r._id, { isDefault: false })
        }
      }
    }

    return await ctx.db.insert('resumes', {
      ...args,
      userId,
    })
  },
})

// ─────────────────────────────────────────────
// CV Güncelle
// ─────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id('resumes'),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    targetRole: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    summary: v.optional(v.string()),
    rawText: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) {
      throw new Error('Not found or unauthorized')
    }

    if (fields.isDefault) {
      const allResumes = await ctx.db
        .query('resumes')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect()

      for (const r of allResumes) {
        if (r._id !== id && r.isDefault) {
          await ctx.db.patch(r._id, { isDefault: false })
        }
      }
    }

    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    )

    await ctx.db.patch(id, patch)
  },
})

// ─────────────────────────────────────────────
// CV Sil
// ─────────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id('resumes') },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) {
      throw new Error('Not found or unauthorized')
    }

    // Optional: Unlink resumeId from applications using it
    const linkedApps = await ctx.db
      .query('applications')
      .withIndex('by_user_resume', (q) => q.eq('userId', userId).eq('resumeId', id))
      .collect()

    for (const app of linkedApps) {
      await ctx.db.patch(app._id, { resumeId: undefined })
    }

    await ctx.db.delete(id)
  },
})
