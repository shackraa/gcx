import { mutation, query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const DAILY_LIMIT = 50

// Kullanıcının bugünkü kalan kullanım hakkını sorgula
export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getAuthUserId(ctx)
      if (!userId) {
        return { count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT }
      }

      const today = new Date().toISOString().slice(0, 10)
      const record = await ctx.db
        .query('aiUsage')
        .withIndex('by_user_date', (q) => q.eq('userId', userId).eq('date', today))
        .first()

      const count = record?.count ?? 0
      return {
        count,
        limit: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - count),
      }
    } catch (err) {
      console.error('aiUsage:getStatus fallback:', err)
      return { count: 0, limit: DAILY_LIMIT, remaining: DAILY_LIMIT }
    }
  },
})

// Yapay zeka işlemi öncesi kotayı kontrol et ve 1 artır
export const consumeQuota = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('İşlem yapabilmek için lütfen giriş yapın.')
    }

    const today = new Date().toISOString().slice(0, 10)
    const record = await ctx.db
      .query('aiUsage')
      .withIndex('by_user_date', (q) => q.eq('userId', userId).eq('date', today))
      .first()

    const currentCount = record?.count ?? 0
    if (currentCount >= DAILY_LIMIT) {
      throw new Error(
        `Günlük ${DAILY_LIMIT} yapay zeka işlem limitinize ulaştınız. Limitiniz bu gece yarısı (00:00) sıfırlanacaktır.`
      )
    }

    if (record) {
      await ctx.db.patch(record._id, { count: currentCount + 1 })
    } else {
      await ctx.db.insert('aiUsage', { userId, date: today, count: 1 })
    }

    const newCount = currentCount + 1
    return {
      count: newCount,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - newCount),
    }
  },
})
