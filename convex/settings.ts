import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    return settings ?? {
      weeklyGoal: 5,
      overdueDays: 14,
      emailReminders: false,
    }
  },
})

export const upsert = mutation({
  args: {
    weeklyGoal: v.optional(v.number()),
    overdueDays: v.optional(v.number()),
    emailReminders: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first()

    if (existing) {
      const patch = Object.fromEntries(
        Object.entries(args).filter(([, v]) => v !== undefined)
      )
      await ctx.db.patch(existing._id, patch)
    } else {
      await ctx.db.insert('userSettings', {
        userId,
        weeklyGoal: args.weeklyGoal ?? 5,
        overdueDays: args.overdueDays ?? 14,
        emailReminders: args.emailReminders ?? false,
      })
    }
  },
})
