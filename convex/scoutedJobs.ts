import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

// Get all scouted jobs for user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    return await ctx.db
      .query('scoutedJobs')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

// Create single scouted job
export const create = mutation({
  args: {
    title: v.string(),
    company: v.string(),
    location: v.string(),
    workplaceType: v.string(),
    url: v.string(),
    source: v.string(),
    matchScore: v.number(),
    matchingSkills: v.array(v.string()),
    missingSkills: v.array(v.string()),
    recommendedResumeId: v.optional(v.id('resumes')),
    recommendedResumeName: v.optional(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    return await ctx.db.insert('scoutedJobs', {
      ...args,
      userId,
      applied: false,
    })
  },
})

// Import bulk scouted jobs from jev crawler
export const importBulk = mutation({
  args: {
    jobs: v.array(
      v.object({
        title: v.string(),
        company: v.string(),
        location: v.string(),
        workplaceType: v.string(),
        url: v.string(),
        source: v.string(),
        matchScore: v.number(),
        matchingSkills: v.array(v.string()),
        missingSkills: v.array(v.string()),
        recommendedResumeId: v.optional(v.id('resumes')),
        recommendedResumeName: v.optional(v.string()),
        reason: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    for (const job of args.jobs) {
      // Check if URL already exists to avoid duplicate
      const existing = await ctx.db
        .query('scoutedJobs')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .filter((q) => q.eq(q.field('url'), job.url))
        .first()

      if (!existing) {
        await ctx.db.insert('scoutedJobs', {
          ...job,
          userId,
          applied: false,
        })
      }
    }
  },
})

// Convert scouted job to application
export const convertToApplication = mutation({
  args: {
    id: v.id('scoutedJobs'),
    status: v.optional(
      v.union(
        v.literal('preparing'),
        v.literal('waiting'),
        v.literal('responded'),
        v.literal('interview'),
        v.literal('offer'),
        v.literal('rejected')
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const job = await ctx.db.get(args.id)
    if (!job || job.userId !== userId) throw new Error('Job not found')

    // 1. Create in applications table
    const appId = await ctx.db.insert('applications', {
      userId,
      company: job.company,
      position: job.title,
      status: args.status || 'preparing',
      appliedAt: new Date().toISOString().split('T')[0],
      channel: job.source === 'linkedin' ? 'linkedin' : 'online',
      resumeId: job.recommendedResumeId,
      cvVersion: job.recommendedResumeName,
      jobLink: job.url || undefined,
      note: `Uyumluluk Skoru: %${job.matchScore}.\n${job.reason}`,
      hrContacted: false,
    })

    // 2. Mark scouted job as applied
    await ctx.db.patch(args.id, { applied: true })

    return appId
  },
})

// Delete scouted job
export const remove = mutation({
  args: { id: v.id('scoutedJobs') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const job = await ctx.db.get(args.id)
    if (!job || job.userId !== userId) throw new Error('Job not found')

    await ctx.db.delete(args.id)
  },
})
