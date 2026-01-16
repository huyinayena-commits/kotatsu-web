'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Bell,
    RefreshCw,
    Heart,
    CheckCircle2,
    Megaphone,
    BookOpen,
    Info,
    ArrowRight,
    Loader2
} from 'lucide-react';
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

async function checkMangaForUpdates(manga: MangaBookmark, lastRead?: ReadingHistory): Promise<ChapterUpdate | null> {
    try {
        const response = await fetch(`/api/sources/${manga.source}/${manga.id}`);
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.success || !data.data) return null;

        const latestChapter = data.data.chapters?.[data.data.chapters.length - 1]?.number || 0;
        const lastReadChapter = lastRead?.chapterNumber || 0;

        if (latestChapter > lastReadChapter) {
            return {
                mangaId: manga.id,
                mangaTitle: manga.title,
                mangaCover: manga.cover,
                source: manga.source,
                latestChapter,
                lastReadChapter,
                newChaptersCount: Math.floor(latestChapter - lastReadChapter),
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

        const cachedUpdates = localStorage.getItem('kotatsu_updates');
        const cachedTime = localStorage.getItem('kotatsu_updates_time');
        if (cachedUpdates) {
            try { setUpdates(JSON.parse(cachedUpdates)); } catch { }
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

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setUpdates(newUpdates);
        setLastChecked(Date.now());
        setChecking(false);

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
        <div className="min-h-screen p-4 lg:p-6 mb-20 lg:mb-0">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 animate-fadeIn">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Bell className="text-[var(--accent-primary)]" size={20} /> Update Bab
                </h1>
                <button
                    onClick={checkForUpdates}
                    disabled={checking || library.length === 0}
                    className="px-4 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 hover:brightness-110 active:scale-95"
                    style={{
                        background: checking ? 'var(--bg-surface)' : 'var(--accent-primary)',
                        color: checking ? 'var(--text-muted)' : 'var(--kotatsu-on-primary)',
                        border: checking ? '1px solid var(--border-default)' : 'none'
                    }}
                >
                    {checking ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            {checkProgress.current}/{checkProgress.total}
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} /> Periksa Update
                        </>
                    )}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 animate-fadeInUp">
                <div
                    className="rounded-xl p-3 sm:p-4 text-center"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                    <p className="text-xl sm:text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                        {library.length}
                    </p>
                    <p className="text-[10px] sm:text-xs" style={{ color: 'var(--text-muted)' }}>Library</p>
                </div>
                <div
                    className="rounded-xl p-3 sm:p-4 text-center"
                    style={{ background: 'var(--kotatsu-primary-container)', border: '1px solid var(--accent-primary)' }}
                >
                    <p className="text-xl sm:text-2xl font-bold mb-0.5" style={{ color: 'var(--kotatsu-on-primary-container)' }}>
                        {updates.length}
                    </p>
                    <p className="text-[10px] sm:text-xs" style={{ color: 'var(--kotatsu-on-primary-container)' }}>Update</p>
                </div>
                <div
                    className="rounded-xl p-3 sm:p-4 text-center"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                    <p className="text-[10px] sm:text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Dicek</p>
                    <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {lastChecked ? formatTimeAgo(lastChecked) : '-'}
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            {checking && (
                <div
                    className="rounded-xl p-5 mb-6 animate-scaleIn"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-primary)' }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <p className="font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <RefreshCw size={16} className="animate-spin text-[var(--accent-primary)]" /> Memeriksa update...
                        </p>
                        <p style={{ color: 'var(--accent-primary)' }}>{checkProgress.current} / {checkProgress.total}</p>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                        <div
                            className="h-full transition-all duration-300"
                            style={{
                                width: `${(checkProgress.current / checkProgress.total) * 100}%`,
                                background: 'var(--accent-primary)',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Updates List */}
            {updates.length > 0 ? (
                <div className="space-y-4 animate-fadeInUp">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <Megaphone size={20} className="text-[var(--accent-primary)]" /> Manga dengan Bab Baru
                    </h2>
                    {updates.map((update, index) => (
                        <div
                            key={`${update.mangaId}-${update.source}`}
                            className="rounded-xl overflow-hidden transition-all hover:translate-x-1 animate-fadeInUp"
                            style={{
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--accent-primary)',
                                animationDelay: `${index * 50}ms`
                            }}
                        >
                            <div className="flex gap-4 p-4">
                                {/* Cover */}
                                <Link href={`/manga/${update.source}/${update.mangaId}`} className="flex-shrink-0">
                                    <div
                                        className="w-20 h-28 rounded-lg overflow-hidden relative"
                                        style={{ background: 'var(--bg-elevated)' }}
                                    >
                                        {update.mangaCover ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={`/api/proxy-image?url=${encodeURIComponent(update.mangaCover)}`}
                                                alt={update.mangaTitle}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="absolute inset-0 flex items-center justify-center" style={{ display: update.mangaCover ? 'none' : 'flex' }}>
                                            <BookOpen size={24} className="text-[var(--text-muted)] opacity-50" />
                                        </div>
                                    </div>
                                </Link>

                                {/* Info */}
                                <div className="flex-grow min-w-0">
                                    <Link href={`/manga/${update.source}/${update.mangaId}`}>
                                        <h3 className="font-bold text-lg truncate hover:text-[var(--accent-primary)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                                            {update.mangaTitle}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--kotatsu-primary-container)] text-[var(--kotatsu-on-primary-container)]">
                                            +{update.newChaptersCount} bab baru
                                        </span>
                                        <span className="text-sm capitalize opacity-70" style={{ color: 'var(--text-secondary)' }}>
                                            {update.source}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                        Ch. {update.lastReadChapter} <ArrowRight size={14} /> Ch. {update.latestChapter}
                                    </p>

                                    <div className="flex gap-2 mt-3">
                                        <Link
                                            href={`/manga/${update.source}/${update.mangaId}`}
                                            className="px-4 py-2 rounded-lg text-sm transition-all hover:brightness-110 active:scale-95 flex items-center gap-2 font-medium"
                                            style={{ background: 'var(--accent-primary)', color: 'var(--kotatsu-on-primary)' }}
                                        >
                                            <BookOpen size={16} /> Lihat Bab Baru
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : library.length === 0 ? (
                <div className="text-center py-20 animate-fadeIn">
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                        <Heart size={40} className="text-[var(--text-muted)] opacity-50" />
                    </div>
                    <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Belum ada manga di library.</p>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                        Tambahkan manga ke bookmark untuk mendapatkan notifikasi bab baru.
                    </p>
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'var(--accent-primary)', color: 'white' }}
                    >
                        Jelajahi manga <ArrowRight size={16} />
                    </Link>
                </div>
            ) : !checking && lastChecked ? (
                <div className="text-center py-20 animate-fadeIn">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} className="text-green-500" />
                    </div>
                    <p className="text-lg font-bold mb-2 text-green-500">Semua manga sudah up-to-date!</p>
                    <p className="text-sm opacity-70" style={{ color: 'var(--text-muted)' }}>
                        Belum ada bab baru sejak pemeriksaan terakhir.
                    </p>
                    <button
                        onClick={checkForUpdates}
                        className="mt-6 text-[var(--accent-primary)] text-sm hover:underline"
                    >
                        Periksa Lagi
                    </button>
                </div>
            ) : (
                <div className="text-center py-20 animate-fadeIn">
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                        <Bell size={40} className="text-[var(--text-muted)] opacity-50" />
                    </div>
                    <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Periksa update bab baru</p>
                    <p className="text-sm mb-6 opacity-70" style={{ color: 'var(--text-muted)' }}>
                        Klik tombol di bawah untuk memeriksa semua manga di library kamu.
                    </p>
                    <button
                        onClick={checkForUpdates}
                        className="px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-bold shadow-lg shadow-[var(--accent-primary)]/20 flex items-center gap-2 mx-auto"
                        style={{ background: 'var(--accent-primary)', color: 'var(--kotatsu-on-primary)' }}
                    >
                        <RefreshCw size={20} /> Periksa Update Sekarang
                    </button>
                </div>
            )}

            {/* Info Box */}
            <div
                className="mt-8 rounded-xl p-5 animate-fadeInUp"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Info size={20} className="text-[var(--accent-primary)]" /> Cara Kerja
                </h3>
                <ul className="text-sm space-y-2 pl-2" style={{ color: 'var(--text-secondary)' }}>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></div> Memeriksa semua manga di library kamu</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></div> Membandingkan chapter terakhir dibaca dengan chapter terbaru</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></div> Menampilkan manga dengan bab baru yang belum dibaca</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"></div> Hasil pemeriksaan disimpan untuk akses cepat</li>
                </ul>
            </div>
        </div>
    );
}
