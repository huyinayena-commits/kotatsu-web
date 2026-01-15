import { z } from 'zod';

// ============================================
// SEARCH FORM SCHEMA
// ============================================

export const SearchFormSchema = z.object({
    query: z.string().min(1, 'Masukkan kata kunci pencarian').max(100),
});

export const AdvancedSearchFormSchema = z.object({
    query: z.string().optional(),
    genres: z.array(z.string()).optional().default([]),
    status: z.enum(['all', 'ongoing', 'completed', 'hiatus']).optional().default('all'),
    type: z.enum(['all', 'manga', 'manhwa', 'manhua']).optional().default('all'),
    sortBy: z.enum(['latest', 'popular', 'rating', 'az']).optional().default('latest'),
    page: z.number().optional().default(1),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type SearchFormData = z.infer<typeof SearchFormSchema>;
export type AdvancedSearchFormData = z.infer<typeof AdvancedSearchFormSchema>;
