// src/lib/storage.ts
// Utility untuk LocalStorage - Bookmark & History System

// ============== TYPE DEFINITIONS ==============

export interface Category {
    id: string;
    name: string;
    order: number;
}

export interface MangaBookmark {
    id: string;
    title: string;
    cover: string;
    source: string;
    addedAt: number; // timestamp
    categoryId?: string; // optional, undefined = Uncategorized
}

export interface ReadingHistory {
    mangaId: string;
    mangaTitle: string;
    mangaCover: string;
    source: string;
    chapterId: string;
    chapterNumber: number;
    chapterTitle: string;
    lastReadAt: number; // timestamp
}

// ============== STORAGE KEYS ==============

const STORAGE_KEYS = {
    LIBRARY: 'kotatsu_library',
    HISTORY: 'kotatsu_history',
    CATEGORIES: 'kotatsu_categories',
} as const;

// ============== HELPER FUNCTIONS ==============

function getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

// ============== LIBRARY (BOOKMARK) FUNCTIONS ==============

export function getLibrary(): MangaBookmark[] {
    return getFromStorage<MangaBookmark[]>(STORAGE_KEYS.LIBRARY, []);
}

export function addToLibrary(manga: Omit<MangaBookmark, 'addedAt'>): void {
    const library = getLibrary();

    // Cek duplikasi berdasarkan ID dan Source
    const exists = library.some(
        item => item.id === manga.id && item.source === manga.source
    );

    if (!exists) {
        const newItem: MangaBookmark = {
            ...manga,
            addedAt: Date.now(),
        };
        library.unshift(newItem); // Tambah di awal
        saveToStorage(STORAGE_KEYS.LIBRARY, library);
    }
}

export function removeFromLibrary(mangaId: string, source: string): void {
    const library = getLibrary();
    const filtered = library.filter(
        item => !(item.id === mangaId && item.source === source)
    );
    saveToStorage(STORAGE_KEYS.LIBRARY, filtered);
}

export function isInLibrary(mangaId: string, source: string): boolean {
    const library = getLibrary();
    return library.some(item => item.id === mangaId && item.source === source);
}

export function toggleLibrary(manga: Omit<MangaBookmark, 'addedAt'>): boolean {
    if (isInLibrary(manga.id, manga.source)) {
        removeFromLibrary(manga.id, manga.source);
        return false; // Sekarang tidak ada di library
    } else {
        addToLibrary(manga);
        return true; // Sekarang ada di library
    }
}

// ============== HISTORY FUNCTIONS ==============

export function getHistory(): ReadingHistory[] {
    return getFromStorage<ReadingHistory[]>(STORAGE_KEYS.HISTORY, []);
}

export function addToHistory(entry: Omit<ReadingHistory, 'lastReadAt'>): void {
    const history = getHistory();

    // Hapus entry lama untuk manga yang sama (dari source yang sama)
    const filtered = history.filter(
        item => !(item.mangaId === entry.mangaId && item.source === entry.source)
    );

    // Tambahkan entry baru di awal
    const newEntry: ReadingHistory = {
        ...entry,
        lastReadAt: Date.now(),
    };
    filtered.unshift(newEntry);

    // Batasi history maksimal 100 item
    const limited = filtered.slice(0, 100);

    saveToStorage(STORAGE_KEYS.HISTORY, limited);
}

export function getLastRead(mangaId: string, source: string): ReadingHistory | null {
    const history = getHistory();
    return history.find(
        item => item.mangaId === mangaId && item.source === source
    ) || null;
}

export function removeFromHistory(mangaId: string, source: string): void {
    const history = getHistory();
    const filtered = history.filter(
        item => !(item.mangaId === mangaId && item.source === source)
    );
    saveToStorage(STORAGE_KEYS.HISTORY, filtered);
}

export function clearHistory(): void {
    saveToStorage(STORAGE_KEYS.HISTORY, []);
}

export function clearLibrary(): void {
    saveToStorage(STORAGE_KEYS.LIBRARY, []);
}

// ============== READ CHAPTERS TRACKING ==============

const READ_CHAPTERS_KEY = 'kotatsu_read_chapters';

export interface ReadChapterEntry {
    mangaId: string;
    source: string;
    chapterIds: string[];
}

export function getReadChapters(mangaId: string, source: string): string[] {
    const all = getFromStorage<ReadChapterEntry[]>(READ_CHAPTERS_KEY, []);
    const entry = all.find(e => e.mangaId === mangaId && e.source === source);
    return entry?.chapterIds || [];
}

export function markChapterAsRead(mangaId: string, source: string, chapterId: string): void {
    const all = getFromStorage<ReadChapterEntry[]>(READ_CHAPTERS_KEY, []);
    const index = all.findIndex(e => e.mangaId === mangaId && e.source === source);

    if (index >= 0) {
        if (!all[index].chapterIds.includes(chapterId)) {
            all[index].chapterIds.push(chapterId);
        }
    } else {
        all.push({ mangaId, source, chapterIds: [chapterId] });
    }

    saveToStorage(READ_CHAPTERS_KEY, all);
}

export function isChapterRead(mangaId: string, source: string, chapterId: string): boolean {
    const readChapters = getReadChapters(mangaId, source);
    return readChapters.includes(chapterId);
}

export function markChaptersAsRead(mangaId: string, source: string, chapterIds: string[]): void {
    const all = getFromStorage<ReadChapterEntry[]>(READ_CHAPTERS_KEY, []);
    const index = all.findIndex(e => e.mangaId === mangaId && e.source === source);

    if (index >= 0) {
        const existing = new Set(all[index].chapterIds);
        chapterIds.forEach(id => existing.add(id));
        all[index].chapterIds = Array.from(existing);
    } else {
        all.push({ mangaId, source, chapterIds });
    }

    saveToStorage(READ_CHAPTERS_KEY, all);
}

export function markChaptersAsUnread(mangaId: string, source: string, chapterIds: string[]): void {
    const all = getFromStorage<ReadChapterEntry[]>(READ_CHAPTERS_KEY, []);
    const index = all.findIndex(e => e.mangaId === mangaId && e.source === source);

    if (index >= 0) {
        const toRemove = new Set(chapterIds);
        all[index].chapterIds = all[index].chapterIds.filter(id => !toRemove.has(id));
        saveToStorage(READ_CHAPTERS_KEY, all);
    }
}

// ============== CATEGORY FUNCTIONS ==============

export function getCategories(): Category[] {
    return getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, []);
}

export function addCategory(name: string): Category {
    const categories = getCategories();
    const newCategory: Category = {
        id: `cat_${Date.now()}`,
        name,
        order: categories.length,
    };
    categories.push(newCategory);
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
    return newCategory;
}

export function deleteCategory(categoryId: string): void {
    // Remove category
    const categories = getCategories();
    const filtered = categories.filter(c => c.id !== categoryId);
    // Re-order remaining categories
    filtered.forEach((c, idx) => c.order = idx);
    saveToStorage(STORAGE_KEYS.CATEGORIES, filtered);

    // Reset manga categoryId that used this category
    const library = getLibrary();
    const updatedLibrary = library.map(manga =>
        manga.categoryId === categoryId
            ? { ...manga, categoryId: undefined }
            : manga
    );
    saveToStorage(STORAGE_KEYS.LIBRARY, updatedLibrary);
}

export function updateCategory(categoryId: string, name: string): void {
    const categories = getCategories();
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        category.name = name;
        saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
    }
}

export function reorderCategories(orderedIds: string[]): void {
    const categories = getCategories();
    const reordered = orderedIds
        .map((id, index) => {
            const cat = categories.find(c => c.id === id);
            if (cat) {
                cat.order = index;
                return cat;
            }
            return null;
        })
        .filter((c): c is Category => c !== null);
    saveToStorage(STORAGE_KEYS.CATEGORIES, reordered);
}

export function setMangaCategory(mangaId: string, source: string, categoryId: string | undefined): void {
    const library = getLibrary();
    const updatedLibrary = library.map(manga =>
        (manga.id === mangaId && manga.source === source)
            ? { ...manga, categoryId }
            : manga
    );
    saveToStorage(STORAGE_KEYS.LIBRARY, updatedLibrary);
}

export function getLibraryByCategory(): { category: Category | null; mangas: MangaBookmark[] }[] {
    const library = getLibrary();
    const categories = getCategories().sort((a, b) => a.order - b.order);

    const result: { category: Category | null; mangas: MangaBookmark[] }[] = [];

    // Add categorized mangas
    for (const category of categories) {
        const mangas = library.filter(m => m.categoryId === category.id);
        if (mangas.length > 0) {
            result.push({ category, mangas });
        }
    }

    // Add uncategorized mangas at the end
    const uncategorized = library.filter(m => !m.categoryId);
    if (uncategorized.length > 0) {
        result.push({ category: null, mangas: uncategorized });
    }

    return result;
}
