import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

// Get all scouted jobs for user (Sorted by highest match score, >= 70%)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const jobs = await ctx.db
      .query('scoutedJobs')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        let recommendedResumeName = job.recommendedResumeName
        if (job.recommendedResumeId) {
          try {
            const resume = await ctx.db.get(job.recommendedResumeId as any)
            if (resume && (resume as any).name) {
              recommendedResumeName = (resume as any).name
            }
          } catch {}
        }
        return {
          ...job,
          recommendedResumeName,
        }
      })
    )

    return enrichedJobs
      .filter((j) => (j.matchScore || 0) >= 70)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
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
    recommendedResumeId: v.optional(v.union(v.id('resumes'), v.string())),
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
        id: v.optional(v.string()),
        applied: v.optional(v.boolean()),
        title: v.string(),
        company: v.string(),
        location: v.string(),
        workplaceType: v.string(),
        url: v.string(),
        source: v.string(),
        matchScore: v.number(),
        matchingSkills: v.array(v.string()),
        missingSkills: v.array(v.string()),
        recommendedResumeId: v.optional(v.union(v.id('resumes'), v.string())),
        recommendedResumeName: v.optional(v.string()),
        reason: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    for (const rawJob of args.jobs) {
      // Check if URL already exists to avoid duplicate
      const existing = await ctx.db
        .query('scoutedJobs')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .filter((q) => q.eq(q.field('url'), rawJob.url))
        .first()

      if (!existing) {
        await ctx.db.insert('scoutedJobs', {
          title: rawJob.title,
          company: rawJob.company,
          location: rawJob.location,
          workplaceType: rawJob.workplaceType,
          url: rawJob.url,
          source: rawJob.source,
          matchScore: rawJob.matchScore,
          matchingSkills: rawJob.matchingSkills,
          missingSkills: rawJob.missingSkills,
          recommendedResumeId: rawJob.recommendedResumeId,
          recommendedResumeName: rawJob.recommendedResumeName,
          reason: rawJob.reason,
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

    let cvLink: string | undefined = undefined
    if (job.recommendedResumeId) {
      try {
        const resObj = (await ctx.db.get(job.recommendedResumeId as any)) as {
          storageId?: any
          fileUrl?: string
        } | null
        if (resObj) {
          if (resObj.storageId) {
            cvLink = ((await ctx.storage.getUrl(resObj.storageId)) || resObj.fileUrl) ?? undefined
          } else {
            cvLink = resObj.fileUrl
          }
        }
      } catch {}
    }

    // 1. Create in applications table (default to 'waiting' / Başvuruldu)
    const appId = await ctx.db.insert('applications', {
      userId,
      company: job.company,
      position: job.title,
      status: args.status || 'waiting',
      appliedAt: new Date().toISOString().split('T')[0],
      channel: job.source === 'linkedin' ? 'linkedin' : 'online',
      resumeId: job.recommendedResumeId,
      cvVersion: job.recommendedResumeName,
      cvLink,
      jobLink: job.url || undefined,
      note: `Uyumluluk: %${job.matchScore}`,
      hrContacted: false,
    })

    // 2. Mark scouted job as applied with link to application
    await ctx.db.patch(args.id, {
      applied: true,
      applicationId: appId,
    })

    return appId
  },
})

// Revert scouted job from application (remove application record and mark applied: false)
export const revertApplication = mutation({
  args: {
    id: v.id('scoutedJobs'),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const job = await ctx.db.get(args.id)
    if (!job || job.userId !== userId) throw new Error('Job not found')

    // 1. If explicit applicationId is stored, delete it
    if (job.applicationId) {
      try {
        const app = await ctx.db.get(job.applicationId)
        if (app && app.userId === userId) {
          await ctx.db.delete(job.applicationId)
        }
      } catch {}
    }

    // 2. Also search and delete matching applications in applications table
    const matchingApps = await ctx.db
      .query('applications')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field('company'), job.company),
            q.eq(q.field('position'), job.title)
          ),
          job.url ? q.eq(q.field('jobLink'), job.url) : false
        )
      )
      .collect()

    for (const app of matchingApps) {
      await ctx.db.delete(app._id)
    }

    // 3. Mark scouted job as not applied
    await ctx.db.patch(args.id, {
      applied: false,
      applicationId: undefined,
    })

    return { success: true }
  },
})

// Migration to ensure Leap Games application has waiting status and correct CV
// Migration to sync all scouted jobs and applications with current resume names
export const syncAllResumesAndJobs = mutation({
  args: {},
  handler: async (ctx) => {
    const resumes = await ctx.db.query('resumes').collect()
    const resumeMap = new Map<string, string>()
    for (const r of resumes) {
      resumeMap.set(r._id, r.name)
    }

    const apps = await ctx.db.query('applications').collect()
    let updatedApps = 0
    for (const app of apps) {
      const currentResumeName = app.resumeId ? resumeMap.get(app.resumeId) : undefined
      const isLeap = app.company.toLowerCase().includes('leap games')
      if (currentResumeName && app.cvVersion !== currentResumeName) {
        await ctx.db.patch(app._id, {
          cvVersion: currentResumeName,
          status: isLeap ? 'waiting' : app.status,
        })
        updatedApps++
      } else if (isLeap && app.status !== 'waiting') {
        await ctx.db.patch(app._id, {
          status: 'waiting',
        })
        updatedApps++
      }
    }

    const scouted = await ctx.db.query('scoutedJobs').collect()
    let updatedScouted = 0
    for (const s of scouted) {
      const currentResumeName = s.recommendedResumeId ? resumeMap.get(s.recommendedResumeId) : undefined
      if (currentResumeName && s.recommendedResumeName !== currentResumeName) {
        await ctx.db.patch(s._id, {
          recommendedResumeName: currentResumeName,
        })
        updatedScouted++
      }
    }

    return { updatedApps, updatedScouted }
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

// Clear all scouted jobs for current user
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const jobs = await ctx.db
      .query('scoutedJobs')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()

    for (const job of jobs) {
      await ctx.db.delete(job._id)
    }

    return { count: jobs.length }
  },
})
