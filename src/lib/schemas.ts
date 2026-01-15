import { z } from 'zod';

// ============================================
// MANGA SCHEMAS
// ============================================

export const MangaSchema = z.object({
    id: z.string(),
    title: z.string(),
    cover: z.string().url().optional().nullable(),
    description: z.string().optional().nullable(),
    author: z.string().optional().nullable(),
    status: z.enum(['ongoing', 'completed', 'hiatus', 'unknown']).optional().default('unknown'),
    genres: z.array(z.string()).optional().default([]),
    rating: z.number().min(0).max(10).optional().nullable(),
    type: z.enum(['manga', 'manhwa', 'manhua', 'comic']).optional().default('manga'),
    lastUpdated: z.string().optional().nullable(),
});

export const MangaListItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    cover: z.string().optional().nullable(),
    latestChapter: z.string().optional().nullable(),
    rating: z.number().optional().nullable(),
});

// ============================================
// CHAPTER SCHEMAS
// ============================================

export const ChapterSchema = z.object({
    id: z.string(),
    mangaId: z.string().optional().nullable(),
    mangaTitle: z.string().optional().nullable(),
    mangaCover: z.string().optional().nullable(),
    chapterNumber: z.number(),
    chapterTitle: z.string().optional().default(''),
    totalPages: z.number().optional().default(0),
    prevChapterId: z.string().optional().nullable(),
    nextChapterId: z.string().optional().nullable(),
    releasedAt: z.string().optional().nullable(),
});

export const ChapterListItemSchema = z.object({
    id: z.string(),
    chapterNumber: z.number(),
    title: z.string().optional().nullable(),
    releasedAt: z.string().optional().nullable(),
});

// ============================================
// PAGE SCHEMAS
// ============================================

export const PageSchema = z.object({
    index: z.number(),
    url: z.string().url(),
});

// ============================================
// API RESPONSE SCHEMAS
// ============================================

export const MangaDetailResponseSchema = z.object({
    success: z.boolean(),
    manga: MangaSchema.optional(),
    chapters: z.array(ChapterListItemSchema).optional().default([]),
    error: z.string().optional(),
});

export const ChapterResponseSchema = z.object({
    success: z.boolean(),
    chapter: ChapterSchema.optional(),
    pages: z.array(PageSchema).optional().default([]),
    error: z.string().optional(),
});

export const MangaListResponseSchema = z.object({
    success: z.boolean(),
    mangas: z.array(MangaListItemSchema).optional().default([]),
    hasMore: z.boolean().optional().default(false),
    error: z.string().optional(),
});

// ============================================
// TYPE EXPORTS (Inferred from schemas)
// ============================================

export type Manga = z.infer<typeof MangaSchema>;
export type MangaListItem = z.infer<typeof MangaListItemSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type ChapterListItem = z.infer<typeof ChapterListItemSchema>;
export type Page = z.infer<typeof PageSchema>;
export type MangaDetailResponse = z.infer<typeof MangaDetailResponseSchema>;
export type ChapterResponse = z.infer<typeof ChapterResponseSchema>;
export type MangaListResponse = z.infer<typeof MangaListResponseSchema>;

// ============================================
// SAFE PARSE HELPERS
// ============================================

/**
 * Safely parse data with fallback
 * Returns parsed data or null if validation fails
 */
export function safeParse<T>(schema: z.ZodType<T>, data: unknown): T | null {
    const result = schema.safeParse(data);
    if (result.success) {
        return result.data;
    }
    console.warn('[Zod Validation Error]', result.error.issues);
    return null;
}

/**
 * Parse with default fallback value
 */
export function parseWithDefault<T>(schema: z.ZodType<T>, data: unknown, defaultValue: T): T {
    const result = schema.safeParse(data);
    return result.success ? result.data : defaultValue;
}
