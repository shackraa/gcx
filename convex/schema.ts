import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,

  // CV Havuzu (Kullanıcının farklı CV versiyonları)
  resumes: defineTable({
    userId: v.string(),
    name: v.string(),               // Örn: "AI & Python Developer CV"
    category: v.string(),           // Örn: "AI / ML", "Frontend", "Full-stack", "Product"
    targetRole: v.optional(v.string()), // Örn: "Senior AI Engineer"
    fileUrl: v.optional(v.string()),    // Drive veya dosya linki
    skills: v.array(v.string()),        // Örn: ["Python", "LangChain", "FastAPI", "Next.js"]
    summary: v.optional(v.string()),    // CV özeti / öne çıkan noktalar
    rawText: v.optional(v.string()),    // İlan eşleştirme için metin
    isDefault: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_user_category', ['userId', 'category']),

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
    resumeId: v.optional(v.id('resumes')),    // Bağlı CV'nin ID'si
    cvVersion: v.optional(v.string()),        // Serbest CV metni veya versiyon adı
    cvLink: v.optional(v.string()),
    jobLink: v.optional(v.string()),
    contactName: v.optional(v.string()),
    salary: v.optional(v.string()),
    hrContacted: v.boolean(),
    note: v.optional(v.string()),
    followUpSentAt: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_user_status', ['userId', 'status'])
    .index('by_user_resume', ['userId', 'resumeId']),

  // Kullanıcı ayarları
  userSettings: defineTable({
    userId: v.string(),
    weeklyGoal: v.number(),
    overdueDays: v.number(),
    emailReminders: v.boolean(),
  }).index('by_user', ['userId']),

  // jev-ultrafast & İlan Radarı tarafından otomatik bulunan ilanlar
  scoutedJobs: defineTable({
    userId: v.string(),
    title: v.string(),
    company: v.string(),
    location: v.string(),
    workplaceType: v.string(), // 'onsite' | 'hybrid' | 'remote'
    url: v.string(),
    source: v.string(),        // 'linkedin' | 'indeed' | 'kariyer' | 'jev' | 'other'
    matchScore: v.number(),    // 0 - 100
    matchingSkills: v.array(v.string()),
    missingSkills: v.array(v.string()),
    recommendedResumeId: v.optional(v.id('resumes')),
    recommendedResumeName: v.optional(v.string()),
    reason: v.string(),
    applied: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_user_applied', ['userId', 'applied']),
})
