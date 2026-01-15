'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
    getLibrary,
    getHistory,
    MangaBookmark,
    ReadingHistory
} from '@/lib/storage';

// ============== KOTATSU DATA TYPES ==============

interface KotatsuManga {
    id: number;
    title: string;
    alt_title?: string;
    url: string;
    public_url: string;
    cover_url: string;
    large_cover_url?: string | null;
    source: string;
    author?: string;
    state?: string | null;
    rating?: number;
    nsfw?: boolean;
    content_rating?: string | null;
    tags?: Array<{
        id: number;
        title: string;
        key: string;
        source: string;
    }>;
}

interface KotatsuFavourite {
    manga_id: number;
    category_id: number;
    sort_key: number;
    pinned: boolean;
    created_at: number;
    manga: KotatsuManga;
}

interface KotatsuHistory {
    manga_id: number;
    created_at: number;
    updated_at: number;
    chapter_id: number;
    page: number;
    scroll: number;
    percent: number;
    chapters: number;
    manga: KotatsuManga;
}

// ============== IMPORT STATUS TYPE ==============

interface ImportStatus {
    type: 'idle' | 'success' | 'error';
    message: string;
    details?: {
        libraryImported: number;
        libraryDuplicates: number;
        historyImported: number;
        historyDuplicates: number;
    };
}

// ============== MAPPER FUNCTIONS ==============

function extractMangaIdFromUrl(url: string, source: string): string {
    // Untuk Shinigami: /manga/detail/{uuid} -> {uuid}
    if (source === 'SHINIGAMI') {
        const match = url.match(/\/manga\/detail\/([a-f0-9-]+)/);
        if (match) return match[1];
    }

    // Untuk source lain, gunakan URL sebagai ID
    return url;
}

function mapSourceName(kotatsuSource: string): string {
    // Normalize source name ke lowercase
    return kotatsuSource.toLowerCase();
}

function mapFavouriteToBookmark(fav: KotatsuFavourite): MangaBookmark {
    const manga = fav.manga;
    const mangaId = extractMangaIdFromUrl(manga.url, manga.source);

    return {
        id: mangaId,
        title: manga.title,
        cover: manga.cover_url || '',
        source: mapSourceName(manga.source),
        addedAt: fav.created_at,
        categoryId: fav.category_id > 0 ? `kotatsu_${fav.category_id}` : undefined,
    };
}

function mapHistoryToReadingHistory(hist: KotatsuHistory): ReadingHistory {
    const manga = hist.manga;
    const mangaId = extractMangaIdFromUrl(manga.url, manga.source);

    return {
        mangaId: mangaId,
        mangaTitle: manga.title,
        mangaCover: manga.cover_url || '',
        source: mapSourceName(manga.source),
        chapterId: String(hist.chapter_id),
        chapterNumber: hist.chapters > 0 ? hist.chapters : 1,
        chapterTitle: `Chapter ${hist.chapters}`,
        lastReadAt: hist.updated_at,
    };
}

// Kotatsu category interface
interface KotatsuCategory {
    category_id: number;
    created_at: number;
    sort_key: number;
    title: string;
    order?: string | null;
    track: boolean;
    show_in_lib: boolean;
    deleted_at: number;
}

// ============== STORAGE KEYS (duplicated from storage.ts for direct access) ==============

const STORAGE_KEYS = {
    LIBRARY: 'kotatsu_library',
    HISTORY: 'kotatsu_history',
    CATEGORIES: 'kotatsu_categories',
} as const;

export default function SettingsPage() {
    const [importStatus, setImportStatus] = useState<ImportStatus>({
        type: 'idle',
        message: '',
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<{
        favourites: File | null;
        history: File | null;
        categories: File | null;
    }>({ favourites: null, history: null, categories: null });

    const favouritesInputRef = useRef<HTMLInputElement>(null);
    const historyInputRef = useRef<HTMLInputElement>(null);
    const categoriesInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (type: 'favourites' | 'history' | 'categories', file: File | null) => {
        setSelectedFiles(prev => ({ ...prev, [type]: file }));
        setImportStatus({ type: 'idle', message: '' });
    };

    const readFileAsJSON = (file: File): Promise<unknown> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string;
                    const json = JSON.parse(text);
                    resolve(json);
                } catch (error) {
                    reject(new Error('File tidak valid JSON'));
                }
            };
            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsText(file);
        });
    };

    const handleImport = async () => {
        if (!selectedFiles.favourites && !selectedFiles.history && !selectedFiles.categories) {
            setImportStatus({
                type: 'error',
                message: 'Pilih minimal satu file untuk diimport!',
            });
            return;
        }

        setIsProcessing(true);
        setImportStatus({ type: 'idle', message: 'Memproses...' });

        try {
            let libraryImported = 0;
            let libraryDuplicates = 0;
            let historyImported = 0;
            let historyDuplicates = 0;
            let categoriesImported = 0;

            // ============== IMPORT CATEGORIES FIRST ==============
            if (selectedFiles.categories) {
                const kotatsuCategories = await readFileAsJSON(selectedFiles.categories) as KotatsuCategory[];

                // Get existing categories
                const existingCategoriesRaw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
                const existingCategories: Array<{ id: string; name: string; order: number }> =
                    existingCategoriesRaw ? JSON.parse(existingCategoriesRaw) : [];
                const existingIds = new Set(existingCategories.map(c => c.id));

                // Map and add new categories
                for (const kcat of kotatsuCategories) {
                    if (kcat.deleted_at === 0) { // Only import non-deleted categories
                        const catId = `kotatsu_${kcat.category_id}`;
                        if (!existingIds.has(catId)) {
                            existingCategories.push({
                                id: catId,
                                name: kcat.title,
                                order: kcat.sort_key,
                            });
                            existingIds.add(catId);
                            categoriesImported++;
                        }
                    }
                }

                // Sort by order and save
                existingCategories.sort((a, b) => a.order - b.order);
                localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(existingCategories));
            }

            // ============== IMPORT LIBRARY (FAVOURITES) ==============
            if (selectedFiles.favourites) {
                const kotatsuFavourites = await readFileAsJSON(selectedFiles.favourites) as KotatsuFavourite[];

                // Get existing library
                const existingLibrary = getLibrary();
                const existingIds = new Set(
                    existingLibrary.map(item => `${item.id}:${item.source}`)
                );

                // Map and filter duplicates
                const newBookmarks: MangaBookmark[] = [];
                for (const fav of kotatsuFavourites) {
                    try {
                        const bookmark = mapFavouriteToBookmark(fav);
                        const key = `${bookmark.id}:${bookmark.source}`;

                        if (!existingIds.has(key)) {
                            newBookmarks.push(bookmark);
                            existingIds.add(key); // Prevent duplicate imports from same file
                            libraryImported++;
                        } else {
                            libraryDuplicates++;
                        }
                    } catch (e) {
                        console.error('Error mapping favourite:', fav, e);
                    }
                }

                // Merge and save
                const mergedLibrary = [...newBookmarks, ...existingLibrary];
                localStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(mergedLibrary));
            }

            // ============== IMPORT HISTORY ==============
            if (selectedFiles.history) {
                const kotatsuHistory = await readFileAsJSON(selectedFiles.history) as KotatsuHistory[];

                // Get existing history
                const existingHistory = getHistory();
                const existingIds = new Set(
                    existingHistory.map(item => `${item.mangaId}:${item.source}`)
                );

                // Map and filter duplicates
                const newHistory: ReadingHistory[] = [];
                for (const hist of kotatsuHistory) {
                    try {
                        const reading = mapHistoryToReadingHistory(hist);
                        const key = `${reading.mangaId}:${reading.source}`;

                        if (!existingIds.has(key)) {
                            newHistory.push(reading);
                            existingIds.add(key);
                            historyImported++;
                        } else {
                            historyDuplicates++;
                        }
                    } catch (e) {
                        console.error('Error mapping history:', hist, e);
                    }
                }

                // Merge and save (limit to 500)
                const mergedHistory = [...newHistory, ...existingHistory].slice(0, 500);
                localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(mergedHistory));
            }

            // Update status
            const successMsg = categoriesImported > 0
                ? `Import berhasil! ${categoriesImported} kategori diimport.`
                : 'Import berhasil!';
            setImportStatus({
                type: 'success',
                message: successMsg,
                details: {
                    libraryImported,
                    libraryDuplicates,
                    historyImported,
                    historyDuplicates,
                },
            });

            // Reset file inputs
            setSelectedFiles({ favourites: null, history: null, categories: null });
            if (favouritesInputRef.current) favouritesInputRef.current.value = '';
            if (historyInputRef.current) historyInputRef.current.value = '';
            if (categoriesInputRef.current) categoriesInputRef.current.value = '';

        } catch (error) {
            setImportStatus({
                type: 'error',
                message: error instanceof Error ? error.message : 'Terjadi error saat import',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Kembali
                        </Link>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            ⚙️ Pengaturan
                        </h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Import Section */}
                <section className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        📥 Import Backup Kotatsu
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Import data dari file backup Kotatsu (extract dari file .bk.zip).
                        Upload file <code className="bg-gray-700 px-1 rounded">favourites</code> dan/atau{' '}
                        <code className="bg-gray-700 px-1 rounded">history</code>.
                    </p>

                    {/* Favourites File Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            📚 File Favourites (Library)
                        </label>
                        <input
                            ref={favouritesInputRef}
                            type="file"
                            accept=".json,application/json"
                            onChange={(e) => handleFileSelect('favourites', e.target.files?.[0] || null)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-amber-500 transition-colors"
                        />
                        {selectedFiles.favourites && (
                            <p className="text-sm text-green-400 mt-1">
                                ✅ {selectedFiles.favourites.name}
                            </p>
                        )}
                    </div>

                    {/* History File Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            📖 File History
                        </label>
                        <input
                            ref={historyInputRef}
                            type="file"
                            accept=".json,application/json"
                            onChange={(e) => handleFileSelect('history', e.target.files?.[0] || null)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-amber-500 transition-colors"
                        />
                        {selectedFiles.history && (
                            <p className="text-sm text-green-400 mt-1">
                                ✅ {selectedFiles.history.name}
                            </p>
                        )}
                    </div>

                    {/* Categories File Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            📂 File Categories (Opsional)
                        </label>
                        <input
                            ref={categoriesInputRef}
                            type="file"
                            accept=".json,application/json"
                            onChange={(e) => handleFileSelect('categories', e.target.files?.[0] || null)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:font-medium file:cursor-pointer hover:file:bg-purple-500 transition-colors"
                        />
                        {selectedFiles.categories && (
                            <p className="text-sm text-green-400 mt-1">
                                ✅ {selectedFiles.categories.name}
                            </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                            Untuk menjaga kategori favorit tetap terpisah sesuai aslinya
                        </p>
                    </div>

                    {/* Import Button */}
                    <button
                        onClick={handleImport}
                        disabled={isProcessing || (!selectedFiles.favourites && !selectedFiles.history && !selectedFiles.categories)}
                        className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl font-semibold text-white hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Memproses...
                            </>
                        ) : (
                            <>
                                🚀 Mulai Import
                            </>
                        )}
                    </button>

                    {/* Status Display */}
                    {importStatus.type !== 'idle' && (
                        <div className={`mt-4 p-4 rounded-lg ${importStatus.type === 'success'
                            ? 'bg-green-900/50 border border-green-700'
                            : importStatus.type === 'error'
                                ? 'bg-red-900/50 border border-red-700'
                                : 'bg-gray-700/50 border border-gray-600'
                            }`}>
                            <p className={`font-medium ${importStatus.type === 'success' ? 'text-green-400' :
                                importStatus.type === 'error' ? 'text-red-400' : 'text-gray-300'
                                }`}>
                                {importStatus.type === 'success' ? '✅' : importStatus.type === 'error' ? '❌' : '⏳'}{' '}
                                {importStatus.message}
                            </p>

                            {importStatus.details && (
                                <div className="mt-3 text-sm text-gray-300 space-y-1">
                                    <p>📚 Library: <strong className="text-green-400">{importStatus.details.libraryImported}</strong> ditambahkan, <span className="text-gray-500">{importStatus.details.libraryDuplicates} duplikat dilewati</span></p>
                                    <p>📖 History: <strong className="text-green-400">{importStatus.details.historyImported}</strong> ditambahkan, <span className="text-gray-500">{importStatus.details.historyDuplicates} duplikat dilewati</span></p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Info Section */}
                <section className="bg-gray-800/30 rounded-2xl border border-gray-700/30 p-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">
                        ℹ️ Cara menggunakan
                    </h3>
                    <ol className="text-sm text-gray-500 space-y-2 list-decimal list-inside">
                        <li>Extract file backup Kotatsu (.bk.zip)</li>
                        <li>Cari file <code className="bg-gray-700 px-1 rounded text-gray-300">favourites</code> untuk library</li>
                        <li>Cari file <code className="bg-gray-700 px-1 rounded text-gray-300">history</code> untuk history baca</li>
                        <li>Cari file <code className="bg-gray-700 px-1 rounded text-gray-300">categories</code> untuk kategori favorit</li>
                        <li>Upload file-file tersebut di atas</li>
                        <li>Klik "Mulai Import"</li>
                    </ol>
                    <p className="text-xs text-gray-600 mt-4">
                        ⚠️ Data yang sudah ada tidak akan ditimpa. Kategori dari Kotatsu akan dijaga terpisah sesuai file aslinya.
                    </p>
                </section>
            </div>
        </main>
    );
}
