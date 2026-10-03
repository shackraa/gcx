import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

// ─────────────────────────────────────────────
// Dosya Yükleme URL'i Üret (Convex Storage)
// ─────────────────────────────────────────────
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')
    return await ctx.storage.generateUploadUrl()
  },
})

// ─────────────────────────────────────────────
// Kullanıcının tüm CV'lerini getir (downloadUrl ile)
// ─────────────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const resumes = await ctx.db
      .query('resumes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()

    return await Promise.all(
      resumes.map(async (resume) => {
        let downloadUrl = resume.fileUrl || null
        if (resume.storageId) {
          try {
            const sUrl = await ctx.storage.getUrl(resume.storageId)
            if (sUrl) downloadUrl = sUrl
          } catch (e) {
            console.error('Storage URL error:', e)
          }
        }
        return {
          ...resume,
          downloadUrl,
        }
      })
    )
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

    let downloadUrl = resume.fileUrl || null
    if (resume.storageId) {
      try {
        const sUrl = await ctx.storage.getUrl(resume.storageId)
        if (sUrl) downloadUrl = sUrl
      } catch (e) {
        console.error('Storage URL error:', e)
      }
    }

    return {
      ...resume,
      downloadUrl,
    }
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
    storageId: v.optional(v.id('_storage')),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    coverLetter: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
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
      updatedAt: Date.now(),
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
    storageId: v.optional(v.id('_storage')),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    coverLetter: v.optional(v.string()),
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

    // If storageId is changing and old storageId exists, delete old file from storage
    if (fields.storageId && existing.storageId && fields.storageId !== existing.storageId) {
      try {
        await ctx.storage.delete(existing.storageId)
      } catch (err) {
        console.error('Failed to clean up old storage file:', err)
      }
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

    await ctx.db.patch(id, {
      ...patch,
      updatedAt: Date.now(),
    })
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

    // Delete stored file if exists
    if (existing.storageId) {
      try {
        await ctx.storage.delete(existing.storageId)
      } catch (err) {
        console.error('Failed to delete storage file on resume remove:', err)
      }
    }

    // Unlink resumeId from applications using it
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

// ─────────────────────────────────────────────
// Eski CV Adını Dosya Adına Eşitleme (Migration)
// ─────────────────────────────────────────────
export const fixOldResumeName = mutation({
  args: {},
  handler: async (ctx) => {
    const resumes = await ctx.db.query('resumes').collect()
    let updatedCount = 0
    const defaultCoverLetter = `Merhaba Sayın İlgili / İşe Alım Ekibi,

Matematik Mühendisliği son sınıf öğrencisi olarak veri analitiği, yapay zeka ve ürün geliştirme alanlarındaki tutkumu şirketinizin vizyonuyla birleştirmek adına bu başvuruyu yapıyorum. Kendi girişimlerimde elde ettiğim 2.5M+ TL ciro ve 45K+ kitle büyümesi başarılarının yanı sıra, AI Mühendisliği ve İş Zekası stajlarımla analitik ve kullanıcı odaklı problem çözme yetkinliklerimi sahada kanıtladım.

Veri modelleme, pazar araştırması ve kullanıcı deneyimi analizleri konusundaki birikimimi ekibinize katarak ürün metriklerinizi ve hedeflerinizi daha da ileri taşımak için sabırsızlanıyorum. Katkılarımı ve deneyimlerimi detaylandırmak üzere sizinle görüşmekten memnuniyet duyarım.

Saygılarımla,
Atakan Turpcu`

    for (const resume of resumes) {
      const patch: Record<string, unknown> = {}
      if (resume.name === 'Product & AI Engineer CV' || !resume.fileName) {
        patch.name = 'Atakan_Turpcu_GoodJobGames_ProductSpecialist_PartTime_CV'
        patch.fileName = 'Atakan_Turpcu_GoodJobGames_ProductSpecialist_PartTime_CV.pdf'
      }
      if (!resume.coverLetter) {
        patch.coverLetter = defaultCoverLetter
      }
      if (Object.keys(patch).length > 0) {
        patch.updatedAt = Date.now()
        await ctx.db.patch(resume._id, patch)
        updatedCount++
      }
    }
    return { updatedCount }
  },
})
