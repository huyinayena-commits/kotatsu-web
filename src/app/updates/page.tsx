'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getLibrary, getHistory, type MangaBookmark, type ReadingHistory } from '@/lib/storage';

interface ChapterUpdate {
    mangaId: string;
    mangaTitle: string;
    mangaCover: string;
    source: string;
    latestChapter: number;
    lastReadChapter: number;
    newChaptersCount: number;
    lastChecked: number;
}

// Simulated function to check for updates (in real implementation, this would call the API)
async function checkMangaForUpdates(manga: MangaBookmark, lastRead?: ReadingHistory): Promise<ChapterUpdate | null> {
    try {
        // Fetch manga details to get latest chapter
        const response = await fetch(`/api/sources/${manga.source}/manga/${manga.id}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.success || !data.data) return null;

        const latestChapter = data.data.chapters?.[0]?.number || 0;
        const lastReadChapter = lastRead?.chapterNumber || 0;

        if (latestChapter > lastReadChapter) {
            return {
                mangaId: manga.id,
                mangaTitle: manga.title,
                mangaCover: manga.cover,
                source: manga.source,
                latestChapter,
                lastReadChapter,
                newChaptersCount: latestChapter - lastReadChapter,
                lastChecked: Date.now(),
            };
        }
        return null;
    } catch {
        return null;
    }
}

export default function UpdatesPage() {
    const [mounted, setMounted] = useState(false);
    const [library, setLibrary] = useState<MangaBookmark[]>([]);
    const [history, setHistory] = useState<ReadingHistory[]>([]);
    const [updates, setUpdates] = useState<ChapterUpdate[]>([]);
    const [checking, setChecking] = useState(false);
    const [lastChecked, setLastChecked] = useState<number | null>(null);
    const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        setMounted(true);
        const lib = getLibrary();
        const hist = getHistory();
        setLibrary(lib);
        setHistory(hist);

        // Load cached updates
        const cachedUpdates = localStorage.getItem('kotatsu_updates');
        const cachedTime = localStorage.getItem('kotatsu_updates_time');
        if (cachedUpdates) {
            try {
                setUpdates(JSON.parse(cachedUpdates));
            } catch { }
        }
        if (cachedTime) {
            setLastChecked(parseInt(cachedTime));
        }
    }, []);

    const checkForUpdates = useCallback(async () => {
        if (checking || library.length === 0) return;

        setChecking(true);
        setCheckProgress({ current: 0, total: library.length });
        const newUpdates: ChapterUpdate[] = [];

        for (let i = 0; i < library.length; i++) {
            const manga = library[i];
            const lastRead = history.find(h => h.mangaId === manga.id && h.source === manga.source);

            setCheckProgress({ current: i + 1, total: library.length });

            const update = await checkMangaForUpdates(manga, lastRead);
            if (update) {
                newUpdates.push(update);
            }

            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setUpdates(newUpdates);
        setLastChecked(Date.now());
        setChecking(false);

        // Cache the results
        localStorage.setItem('kotatsu_updates', JSON.stringify(newUpdates));
        localStorage.setItem('kotatsu_updates_time', Date.now().toString());
    }, [checking, library, history]);

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes} menit lalu`;
        if (hours < 24) return `${hours} jam lalu`;
        return `${days} hari lalu`;
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-purple-500/20">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-purple-400 hover:text-purple-300">
                                ← Kembali
                            </Link>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                🔔 Update Bab Baru
                            </h1>
                        </div>
                        <button
                            onClick={checkForUpdates}
                            disabled={checking || library.length === 0}
                            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${checking
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white'
                                }`}
                        >
                            {checking ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Memeriksa... ({checkProgress.current}/{checkProgress.total})
                                </>
                            ) : (
                                <>🔄 Periksa Update</>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 text-center">
                        <p className="text-3xl font-bold text-white mb-1">{library.length}</p>
                        <p className="text-slate-400">Manga di Library</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-2xl border border-orange-500/30 p-6 text-center">
                        <p className="text-3xl font-bold text-orange-400 mb-1">{updates.length}</p>
                        <p className="text-slate-400">Ada Update Baru</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 text-center">
                        <p className="text-sm text-slate-400 mb-1">Terakhir diperiksa</p>
                        <p className="text-white font-medium">
                            {lastChecked ? formatTimeAgo(lastChecked) : 'Belum pernah'}
                        </p>
                    </div>
                </div>

                {/* Progress Bar during checking */}
                {checking && (
                    <div className="mb-8">
                        <div className="bg-slate-800/30 rounded-2xl border border-purple-500/30 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-white font-medium">Memeriksa update...</p>
                                <p className="text-purple-300">{checkProgress.current} / {checkProgress.total}</p>
                            </div>
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                                    style={{ width: `${(checkProgress.current / checkProgress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Updates List */}
                {updates.length > 0 ? (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            📢 Manga dengan Bab Baru
                        </h2>
                        {updates.map((update) => (
                            <div
                                key={`${update.mangaId}-${update.source}`}
                                className="bg-slate-800/30 rounded-2xl border border-orange-500/30 overflow-hidden hover:border-orange-500/50 transition-all"
                            >
                                <div className="flex gap-4 p-4">
                                    {/* Cover */}
                                    <Link
                                        href={`/manga/${update.source}/${update.mangaId}`}
                                        className="flex-shrink-0"
                                    >
                                        <div className="w-24 h-32 rounded-lg overflow-hidden bg-slate-700">
                                            {update.mangaCover ? (
                                                <img
                                                    src={update.mangaCover}
                                                    alt={update.mangaTitle}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-grow min-w-0">
                                        <Link href={`/manga/${update.source}/${update.mangaId}`}>
                                            <h3 className="text-white font-semibold text-lg truncate hover:text-orange-300 transition-colors">
                                                {update.mangaTitle}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-sm rounded-lg">
                                                +{update.newChaptersCount} bab baru
                                            </span>
                                            <span className="text-slate-500 text-sm">
                                                {update.source}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm mt-2">
                                            Terakhir baca: Ch. {update.lastReadChapter} → Terbaru: Ch. {update.latestChapter}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4">
                                            <Link
                                                href={`/manga/${update.source}/${update.mangaId}`}
                                                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded-lg transition-colors"
                                            >
                                                📖 Lihat Bab Baru
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : library.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-6xl mb-4">❤️</p>
                        <p className="text-slate-400 text-lg mb-2">Belum ada manga di library.</p>
                        <p className="text-slate-500 text-sm mb-4">
                            Tambahkan manga ke bookmark untuk mendapatkan notifikasi bab baru.
                        </p>
                        <Link href="/" className="text-purple-400 hover:text-purple-300">
                            Jelajahi manga →
                        </Link>
                    </div>
                ) : !checking && lastChecked ? (
                    <div className="text-center py-20">
                        <p className="text-6xl mb-4">✅</p>
                        <p className="text-slate-400 text-lg mb-2">Semua manga sudah up-to-date!</p>
                        <p className="text-slate-500 text-sm">
                            Klik "Periksa Update" untuk memeriksa kembali.
                        </p>
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-6xl mb-4">🔔</p>
                        <p className="text-slate-400 text-lg mb-2">Periksa update bab baru</p>
                        <p className="text-slate-500 text-sm mb-4">
                            Klik tombol "Periksa Update" untuk melihat manga mana yang punya bab baru.
                        </p>
                        <button
                            onClick={checkForUpdates}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-xl transition-all"
                        >
                            🔄 Periksa Update Sekarang
                        </button>
                    </div>
                )}

                {/* Info */}
                <div className="mt-12 bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">ℹ️ Cara Kerja</h3>
                    <ul className="text-slate-400 text-sm space-y-2">
                        <li>• Fitur ini memeriksa semua manga di library kamu</li>
                        <li>• Membandingkan chapter terakhir yang kamu baca dengan chapter terbaru</li>
                        <li>• Menampilkan manga yang memiliki bab baru yang belum dibaca</li>
                        <li>• Hasil pemeriksaan disimpan untuk akses cepat</li>
                    </ul>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-6 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">
                        Kotatsu Web Clone • Update Checker
                    </p>
                </div>
            </footer>
        </div>
    );
}
