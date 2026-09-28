import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,

  // Başvurular
  applications: defineTable({
    userId: v.string(),
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
    appliedAt: v.optional(v.string()),       // YYYY-MM-DD
    interviewAt: v.optional(v.string()),      // ISO datetime
    offerDeadline: v.optional(v.string()),    // YYYY-MM-DD
    channel: v.optional(v.union(
      v.literal('online'),
      v.literal('email'),
      v.literal('referral'),
      v.literal('form'),
      v.literal('linkedin')
    )),
    cvVersion: v.optional(v.string()),
    cvLink: v.optional(v.string()),
    jobLink: v.optional(v.string()),
    contactName: v.optional(v.string()),
    salary: v.optional(v.string()),
    hrContacted: v.boolean(),
    note: v.optional(v.string()),
    followUpSentAt: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status']),

  // Kullanıcı ayarları
  userSettings: defineTable({
    userId: v.string(),
    weeklyGoal: v.number(),
    overdueDays: v.number(),
    emailReminders: v.boolean(),
  }).index('by_user', ['userId']),
})
