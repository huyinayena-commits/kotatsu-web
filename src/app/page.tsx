'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Clock,
    Book,
    Compass,
    Flame,
    Timer,
    Ban,
    AlertCircle,
    ArrowRight,
    Search
} from 'lucide-react';
import { getHistory, removeFromHistory, type ReadingHistory } from '@/lib/storage';
import { MangaCard, MangaGrid, ViewToggle } from '@/components/manga';

interface MangaItem {
    source: string;
    id?: string;
    title: string;
    cover: string;
    link: string;
    slug: string;
    status?: string;
    genres?: string[];
}

interface APIResponse {
    success: boolean;
    source: string;
    count: number;
    data: MangaItem[];
    error?: string;
}

export default function Home() {
    const [mangaList, setMangaList] = useState<MangaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSource, setCurrentSource] = useState('shinigami');
    const [history, setHistory] = useState<ReadingHistory[]>([]);
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');

    useEffect(() => {
        setMounted(true);
        setHistory(getHistory());
        // Load saved preferences
        const savedView = localStorage.getItem('homeViewMode') as 'grid' | 'list';
        if (savedView) setViewMode(savedView);
    }, []);

    useEffect(() => {
        fetchManga(currentSource);
    }, [currentSource]);

    const fetchManga = async (source: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/sources/${source}`);
            const data: APIResponse = await response.json();
            if (data.success) {
                setMangaList(data.data);
            } else {
                setError(data.error || 'Gagal memuat data');
                setMangaList([]);
            }
        } catch {
            setError('Terjadi kesalahan saat memuat data');
            setMangaList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewChange = (view: 'grid' | 'list') => {
        setViewMode(view);
        localStorage.setItem('homeViewMode', view);
    };

    const handleRemoveHistory = (mangaId: string, source: string) => {
        removeFromHistory(mangaId, source);
        setHistory(getHistory());
    };

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes}m lalu`;
        if (hours < 24) return `${hours}j lalu`;
        return `${days}h lalu`;
    };

    const sortedHistory = [...history].sort((a, b) => {
        if (sortBy === 'recent') return b.lastReadAt - a.lastReadAt;
        return a.mangaTitle.localeCompare(b.mangaTitle);
    });

    const sources = [
        { id: 'shinigami', name: 'Shinigami', status: 'active' },
        { id: 'mgkomik', name: 'Mgkomik', status: 'active' },
        { id: 'komikcast', name: 'Komikcast', status: 'timeout' },
        { id: 'komiku', name: 'Komiku', status: 'blocked' },
    ];

    return (
        <div className="min-h-screen p-4 lg:p-6 mb-16 lg:mb-0">
            {/* Page Header */}
            <div className="mb-6 animate-fadeIn">
                <h1
                    className="text-2xl font-bold mb-2 flex items-center gap-2"
                    style={{ color: 'var(--text-primary)' }}
                >
                    <Clock className="text-[var(--accent-primary)]" /> History
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Lanjut membaca manga favoritmu
                </p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4 animate-slideDown">
                <div className="flex items-center gap-2">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
                        className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer"
                        style={{
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-default)',
                        }}
                    >
                        <option value="recent">Terbaru</option>
                        <option value="title">Judul A-Z</option>
                    </select>
                </div>
                <ViewToggle view={viewMode} onChange={handleViewChange} />
            </div>

            {/* History Section */}
            {mounted && sortedHistory.length > 0 && (
                <section className="mb-10 animate-fadeInUp">
                    <MangaGrid variant={viewMode}>
                        {sortedHistory.map((item, index) => (
                            <div key={`${item.mangaId}-${item.source}`} style={{ animationDelay: `${index * 50}ms` }} className="animate-fadeInUp">
                                <MangaCard
                                    id={item.mangaId}
                                    title={item.mangaTitle}
                                    cover={item.mangaCover}
                                    source={item.source}
                                    chapter={item.chapterTitle}
                                    chapterNumber={item.chapterNumber}
                                    lastRead={formatTimeAgo(item.lastReadAt)}
                                    variant={viewMode}
                                    href={`/read/${item.source}/${item.mangaId}/${item.chapterId}`}
                                    onRemove={() => handleRemoveHistory(item.mangaId, item.source)}
                                />
                            </div>
                        ))}
                    </MangaGrid>
                </section>
            )}

            {/* Empty History State */}
            {mounted && sortedHistory.length === 0 && (
                <div
                    className="text-center py-16 rounded-2xl mb-10 animate-scaleIn"
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                    }}
                >
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                        <Book size={40} className="text-[var(--text-muted)] opacity-50" />
                    </div>
                    <h3
                        className="text-lg font-medium mb-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Belum ada riwayat baca
                    </h3>
                    <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                        Mulai baca manga dari Explore
                    </p>
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                        style={{
                            background: 'var(--accent-primary)',
                            color: 'var(--kotatsu-on-primary)',
                        }}
                    >
                        <Compass size={18} /> Explore Manga
                    </Link>
                </div>
            )}

            {/* Divider */}
            <hr
                className="my-8 opacity-50"
                style={{ borderColor: 'var(--border-default)' }}
            />

            {/* Latest Manga Section */}
            <section className="animate-fadeIn">
                <div className="flex items-center justify-between mb-6">
                    <h2
                        className="text-xl font-bold flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <Flame className="text-[var(--accent-error)]" /> Manga Terbaru
                    </h2>
                    <Link
                        href="/explore"
                        className="text-sm hover:underline flex items-center gap-1 group"
                        style={{ color: 'var(--accent-primary)' }}
                    >
                        Lihat Semua <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Source Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                    {sources.map((source) => (
                        <button
                            key={source.id}
                            onClick={() => setCurrentSource(source.id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2"
                            style={{
                                background: currentSource === source.id
                                    ? 'var(--accent-primary)'
                                    : 'var(--bg-surface)',
                                color: currentSource === source.id
                                    ? 'var(--kotatsu-on-primary)'
                                    : 'var(--text-secondary)',
                                border: `1px solid ${currentSource === source.id
                                    ? 'transparent'
                                    : 'var(--border-default)'}`,
                                opacity: source.status !== 'active' ? 0.7 : 1,
                            }}
                        >
                            {source.name}
                            {source.status === 'timeout' && <Timer size={14} className="text-[var(--accent-warning)]" />}
                            {source.status === 'blocked' && <Ban size={14} className="text-[var(--accent-error)]" />}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center py-16 animate-pulse">
                        <div className="flex flex-col items-center gap-4">
                            <div
                                className="w-10 h-10 rounded-full animate-spin"
                                style={{
                                    border: '3px solid var(--bg-surface)',
                                    borderTopColor: 'var(--accent-primary)',
                                }}
                            />
                            <p className="text-sm text-[var(--text-muted)]">Memuat manga...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div
                        className="rounded-xl p-6 text-center animate-scaleIn"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                    >
                        <div className="flex justify-center mb-2">
                            <AlertCircle className="text-[var(--accent-error)]" size={32} />
                        </div>
                        <p className="mb-2 font-medium" style={{ color: 'var(--accent-error)' }}>
                            {error}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Website mungkin diblokir ISP atau sedang tidak tersedia.
                        </p>
                        <button
                            onClick={() => fetchManga(currentSource)}
                            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--accent-error)] hover:text-white"
                            style={{ color: 'var(--accent-error)', border: '1px solid currentColor' }}
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Manga Grid */}
                {!loading && !error && mangaList.length > 0 && (
                    <div className="animate-fadeInUp">
                        <p className="mb-4 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                            Menampilkan <span style={{ color: 'var(--accent-primary)' }}>{mangaList.length}</span> manga
                        </p>

                        <MangaGrid variant={viewMode}>
                            {mangaList.map((manga, index) => (
                                <div key={manga.id || manga.slug || index} className="animate-fadeInUp" style={{ animationDelay: `${index * 50}ms` }}>
                                    <MangaCard
                                        id={manga.id || manga.slug}
                                        title={manga.title}
                                        cover={manga.cover}
                                        source={currentSource}
                                        variant={viewMode}
                                        href={`/manga/${currentSource}/${manga.id || manga.slug}`}
                                    />
                                </div>
                            ))}
                        </MangaGrid>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && mangaList.length === 0 && (
                    <div className="text-center py-16 animate-fadeIn">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                            <Search size={32} className="text-[var(--text-muted)] opacity-50" />
                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Tidak ada manga ditemukan.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
