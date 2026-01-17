'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
    Bell,
    RefreshCw,
    CheckCircle2,
    Heart,
    ArrowRight,
    Loader2
} from 'lucide-react';
import { getLibrary, getHistory, type MangaBookmark, type ReadingHistory } from '@/lib/storage';
import { UpdateCard } from './components/UpdateCard';
import { UpdateFilters } from './components/UpdateFilters';
import { UpdateSkeleton } from './components/UpdateSkeleton';

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
    const [lastCheckedTime, setLastCheckedTime] = useState<number | null>(null);
    const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });
    const [activeFilter, setActiveFilter] = useState('all');

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
            setLastCheckedTime(parseInt(cachedTime));
        }
    }, []);

    const checkForUpdates = useCallback(async () => {
        if (checking || library.length === 0) return;

        setChecking(true);
        setCheckProgress({ current: 0, total: library.length });
        const newUpdates: ChapterUpdate[] = [];

        // Clear existing updates temporarily or keep them? 
        // Better to keep them and append/update, but for simplicity let's refresh
        // Actually, UX is better if we don't clear until done, but let's follow standard flow
        // To show "loading" state properly, maybe we clear
        setUpdates([]);

        for (let i = 0; i < library.length; i++) {
            const manga = library[i];
            const lastRead = history.find(h => h.mangaId === manga.id && h.source === manga.source);

            setCheckProgress({ current: i + 1, total: library.length });

            const update = await checkMangaForUpdates(manga, lastRead);
            if (update) {
                newUpdates.push(update);
                // Real-time update adds nice feedback
                setUpdates(prev => [...prev, update]);
            }

            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Final set to ensure order and consistency
        const sortedUpdates = newUpdates.sort((a, b) => b.lastChecked - a.lastChecked);
        setUpdates(sortedUpdates);
        setLastCheckedTime(Date.now());
        setChecking(false);

        localStorage.setItem('kotatsu_updates', JSON.stringify(sortedUpdates));
        localStorage.setItem('kotatsu_updates_time', Date.now().toString());
    }, [checking, library, history]);

    const filteredUpdates = useMemo(() => {
        if (activeFilter === 'unread') {
            // Assuming current logic already only fetches unread. 
            // If we later save read updates, we'd filter here.
            // For now, "unread" and "all" might be same unless we had a mechanism to dismiss updates
            return updates;
        }
        return updates;
    }, [updates, activeFilter]);

    const groupedUpdates = useMemo(() => {
        const groups: Record<string, ChapterUpdate[]> = {
            'Hari Ini': [],
            'Kemarin': [],
            'Minggu Ini': [],
            'Lebih Lama': []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000;
        const weekAgo = today - (86400000 * 7);

        filteredUpdates.forEach(update => {
            if (update.lastChecked >= today) {
                groups['Hari Ini'].push(update);
            } else if (update.lastChecked >= yesterday) {
                groups['Kemarin'].push(update);
            } else if (update.lastChecked >= weekAgo) {
                groups['Minggu Ini'].push(update);
            } else {
                groups['Lebih Lama'].push(update);
            }
        });

        return groups;
    }, [filteredUpdates]);

    const hasUpdates = updates.length > 0;
    const updateCounts = {
        all: updates.length,
        unread: updates.length // To be refined if we add read status
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-4 lg:p-6 mb-20 lg:mb-0 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fadeIn">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                        <span className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                            <Bell size={24} />
                        </span>
                        Update Bab
                    </h1>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Pantau bab terbaru dari manga favoritmu
                    </p>
                </div>

                <button
                    onClick={checkForUpdates}
                    disabled={checking || library.length === 0}
                    className="group relative overflow-hidden px-6 py-2.5 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 active:scale-95 flex items-center justify-center gap-2 font-bold"
                    style={{
                        background: checking ? 'var(--bg-surface)' : 'var(--accent-primary)',
                        color: checking ? 'var(--text-muted)' : 'var(--kotatsu-on-primary)',
                        border: checking ? '1px solid var(--border-default)' : 'none'
                    }}
                >
                    {checking ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Memeriksa {checkProgress.current}/{checkProgress.total}</span>
                        </>
                    ) : (
                        <>
                            <RefreshCw size={18} className="transition-transform group-hover:rotate-180" />
                            <span>Periksa Sekarang</span>
                        </>
                    )}
                </button>
            </div>

            {/* Content State Handling */}
            {checking && updates.length === 0 ? (
                // Loading Initial State
                <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2 text-sm text-[var(--text-muted)]">
                        <Loader2 size={14} className="animate-spin" />
                        Sedang mencari update terbaru...
                    </div>
                    {[1, 2, 3].map(i => <UpdateSkeleton key={i} />)}
                </div>
            ) : hasUpdates ? (
                // Updates List with Filters & Grouping
                <div className="animate-fadeInUp">
                    <UpdateFilters
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                        counts={updateCounts}
                    />

                    <div className="space-y-8">
                        {Object.entries(groupedUpdates).map(([groupName, groupUpdates]) => {
                            if (groupUpdates.length === 0) return null;

                            return (
                                <div key={groupName} className="space-y-4">
                                    <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2 after:h-px after:flex-1 after:bg-[var(--border-default)]">
                                        {groupName}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {groupUpdates.map((update, index) => (
                                            <UpdateCard
                                                key={`${update.mangaId}-${update.source}`}
                                                update={update}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : library.length === 0 ? (
                // Empty Library State
                <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                    <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6 ring-4 ring-[var(--bg-surface)] shadow-xl">
                        <Heart size={40} className="text-[var(--text-muted)] opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Library Masih Kosong</h3>
                    <p className="text-[var(--text-secondary)] text-center max-w-xs mb-8">
                        Tambahkan manga ke library agar bisa mendapatkan notifikasi update bab baru.
                    </p>
                    <Link
                        href="/explore"
                        className="px-8 py-3 rounded-full font-bold bg-[var(--accent-primary)] text-white hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--accent-primary)]/30 flex items-center gap-2"
                    >
                        Jelajahi Manga <ArrowRight size={18} />
                    </Link>
                </div>
            ) : !checking && lastCheckedTime ? (
                // All Caught Up State
                <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center mb-6 ring-4 ring-[var(--bg-surface)] shadow-lg">
                        <CheckCircle2 size={48} className="text-green-500 drop-shadow-sm" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Semua Sudah Update!</h3>
                    <p className="text-[var(--text-secondary)] text-center max-w-sm mb-6">
                        Belum ada bab baru yang ditemukan sejak pemeriksaan terakhir.
                    </p>
                    <button
                        onClick={checkForUpdates}
                        className="text-[var(--accent-primary)] hover:underline font-medium text-sm flex items-center gap-1"
                    >
                        <RefreshCw size={14} /> Coba periksa lagi
                    </button>
                </div>
            ) : (
                // Initial State (Before Check)
                <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
                    <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-6 ring-4 ring-[var(--bg-surface)] shadow-lg">
                        <RefreshCw size={40} className="text-[var(--text-muted)] opacity-50" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Siap Memeriksa Update?</h3>
                    <p className="text-[var(--text-secondary)] text-center max-w-sm mb-8">
                        Kami akan memeriksa {library.length} manga di library kamu untuk mencari bab terbaru.
                    </p>
                    <button
                        onClick={checkForUpdates}
                        className="px-8 py-3 rounded-xl font-bold bg-[var(--accent-primary)] text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[var(--accent-primary)]/30"
                    >
                        Mulai Pemeriksaan
                    </button>
                </div>
            )}
        </div>
    );
}
