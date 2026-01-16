'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Clock,
    Flame,
    Timer,
    Ban,
    AlertCircle,
    ArrowRight,
    Search
} from 'lucide-react';
import { getHistory, type ReadingHistory } from '@/lib/storage';
import { MangaCard, MangaGrid, ViewToggle } from '@/components/manga';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { ContinueReadingRow } from '@/components/home/ContinueReadingRow';

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

    const sources = [
        { id: 'shinigami', name: 'Shinigami', status: 'active' },
        { id: 'mgkomik', name: 'Mgkomik', status: 'active' },
        { id: 'komikcast', name: 'Komikcast', status: 'timeout' },
        { id: 'komiku', name: 'Komiku', status: 'blocked' },
    ];

    return (
        <div className="min-h-screen p-4 lg:p-6 mb-16 lg:mb-0">
            {/* Hero Section */}
            <div className="animate-fadeIn">
                <HeroCarousel />
            </div>

            {/* Continue Reading Section (Horizontal) */}
            {mounted && history.length > 0 && (
                <ContinueReadingRow items={history} />
            )}

            {/* Main Content: Latest Manga */}
            <section className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Flame className="text-[var(--accent-error)]" /> Manga Terbaru
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Update terbaru dari sumber favoritmu
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
                            className="px-3 py-2 rounded-xl text-sm font-medium focus:outline-none transition-colors cursor-pointer"
                            style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-default)',
                            }}
                        >
                            <option value="recent">Terbaru</option>
                            <option value="title">Judul A-Z</option>
                        </select>

                        <div className="h-8 w-[1px] bg-[var(--border-default)] hidden md:block"></div>

                        <ViewToggle view={viewMode} onChange={handleViewChange} />
                    </div>
                </div>

                {/* Modern Source Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
                    {sources.map((source) => (
                        <button
                            key={source.id}
                            onClick={() => setCurrentSource(source.id)}
                            className={`relative px-5 py-2.5 rounded-full text-sm font-bold tracking-wide whitespace-nowrap transition-all flex items-center gap-2 ${currentSource === source.id
                                ? 'text-white shadow-lg shadow-[var(--accent-primary)]/25 scale-105'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                                }`}
                            style={{
                                background: currentSource === source.id ? 'var(--accent-primary)' : 'transparent',
                                border: currentSource === source.id ? 'none' : '1px solid var(--border-subtle)',
                            }}
                        >
                            {/* Dot indicator for active */}
                            {currentSource === source.id && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--accent-primary)]"></span>
                                </span>
                            )}

                            {source.name}
                            {source.status === 'timeout' && <Timer size={14} className="text-[var(--accent-warning)]" />}
                            {source.status === 'blocked' && <Ban size={14} className="text-[var(--accent-error)]" />}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 animate-pulse">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] rounded-2xl bg-[var(--bg-elevated)]" />
                        ))}
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div
                        className="rounded-2xl p-8 text-center animate-scaleIn"
                        style={{
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                    >
                        <div className="flex justify-center mb-3">
                            <AlertCircle className="text-[var(--accent-error)]" size={40} />
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--accent-error)' }}>
                            {error}
                        </h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                            Kami tidak dapat menghubungi sumber saat ini.
                        </p>
                        <button
                            onClick={() => fetchManga(currentSource)}
                            className="px-6 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                            style={{
                                background: 'var(--accent-error)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Manga Grid */}
                {!loading && !error && mangaList.length > 0 && (
                    <div className="animate-fadeInUp">
                        <MangaGrid variant={viewMode}>
                            {mangaList.map((manga, index) => (
                                <div key={manga.id || manga.slug || index}>
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
                    <div className="text-center py-20 animate-fadeIn">
                        <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
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
