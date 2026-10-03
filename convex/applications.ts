import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

// ─────────────────────────────────────────────
// Tüm başvuruları getir (real-time & CV senkronize)
// ─────────────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const apps = await ctx.db
      .query('applications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()

    return await Promise.all(
      apps.map(async (app) => {
        let cvVersion = app.cvVersion
        let cvLink = app.cvLink

        if (app.resumeId) {
          try {
            const resume = await ctx.db.get(app.resumeId as any)
            if (resume) {
              cvVersion = (resume as any).name || cvVersion
              if ((resume as any).storageId) {
                cvLink = (await ctx.storage.getUrl((resume as any).storageId)) || (resume as any).fileUrl || cvLink
              } else if ((resume as any).fileUrl) {
                cvLink = (resume as any).fileUrl
              }
            }
          } catch {}
        }

        return {
          ...app,
          cvVersion,
          cvLink,
        }
      })
    )
  },
})



// ─────────────────────────────────────────────
// Başvuru ekle
// ─────────────────────────────────────────────
export const create = mutation({
  args: {
    company: v.string(),
    position: v.string(),
    status: v.union(
      v.literal('preparing'),
      v.literal('waiting'),
      v.literal('responded'),
      v.literal('interview'),
      v.literal('offer'),
      v.literal('rejected')
    ),
    appliedAt: v.optional(v.string()),
    interviewAt: v.optional(v.string()),
    offerDeadline: v.optional(v.string()),
    channel: v.optional(v.union(
      v.literal('online'),
      v.literal('email'),
      v.literal('referral'),
      v.literal('form'),
      v.literal('linkedin')
    )),
    resumeId: v.optional(v.id('resumes')),
    cvVersion: v.optional(v.string()),
    cvLink: v.optional(v.string()),
    jobLink: v.optional(v.string()),
    contactName: v.optional(v.string()),
    salary: v.optional(v.string()),
    hrContacted: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    return await ctx.db.insert('applications', {
      ...args,
      userId,
    })
  },
})

// ─────────────────────────────────────────────
// Başvuru güncelle
// ─────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id('applications'),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('preparing'),
      v.literal('waiting'),
      v.literal('responded'),
      v.literal('interview'),
      v.literal('offer'),
      v.literal('rejected')
    )),
    appliedAt: v.optional(v.string()),
    interviewAt: v.optional(v.string()),
    offerDeadline: v.optional(v.string()),
    channel: v.optional(v.union(
      v.literal('online'),
      v.literal('email'),
      v.literal('referral'),
      v.literal('form'),
      v.literal('linkedin')
    )),
    resumeId: v.optional(v.id('resumes')),
    cvVersion: v.optional(v.string()),
    cvLink: v.optional(v.string()),
    jobLink: v.optional(v.string()),
    contactName: v.optional(v.string()),
    salary: v.optional(v.string()),
    hrContacted: v.optional(v.boolean()),
    note: v.optional(v.string()),
    followUpSentAt: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) {
      throw new Error('Not found or unauthorized')
    }

    // Remove undefined fields
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    )

    await ctx.db.patch(id, patch)
  },
})

// ─────────────────────────────────────────────
// Başvuru sil
// ─────────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id('applications') },
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

// ─────────────────────────────────────────────
// Hazırlanıyor → Bekleniyor (tek tıkla)
// ─────────────────────────────────────────────
export const markApplied = mutation({
  args: {
    id: v.id('applications'),
    appliedAt: v.string(),
  },
  handler: async (ctx, { id, appliedAt }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) {
      throw new Error('Not found or unauthorized')
    }

    await ctx.db.patch(id, { status: 'waiting', appliedAt })
  },
})

// ─────────────────────────────────────────────
// Bulk import (JSON yedekten yükleme)
// ─────────────────────────────────────────────
export const importBulk = mutation({
  args: {
    applications: v.array(v.any()),
    clearExisting: v.boolean(),
  },
  handler: async (ctx, { applications, clearExisting }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    if (clearExisting) {
      const existing = await ctx.db
        .query('applications')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .collect()
      for (const app of existing) {
        await ctx.db.delete(app._id)
      }
    }

    for (const app of applications) {
      const { _id, _creationTime, id, userId: _uid, user_id, ...rest } = app
      await ctx.db.insert('applications', {
        ...rest,
        userId,
        hrContacted: rest.hrContacted ?? rest.hr_contacted ?? false,
        company: rest.company ?? '',
        position: rest.position ?? '',
        status: rest.status ?? 'waiting',
      })
    }
  },
})
