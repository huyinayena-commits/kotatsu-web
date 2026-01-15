'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getHistory, type ReadingHistory } from '@/lib/storage';

interface MangaItem {
    source: string;
    id?: string;
    title: string;
    cover: string;
    link: string;
    slug: string;
    status?: string;
    genres?: string[];
    description?: string | null;
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

    useEffect(() => {
        setMounted(true);
        setHistory(getHistory());
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
        } catch (err) {
            setError('Terjadi kesalahan saat memuat data');
            setMangaList([]);
        } finally {
            setLoading(false);
        }
    };

    const sources = [
        { id: 'shinigami', name: 'Shinigami', status: 'active', color: 'purple' },
        { id: 'komikcast', name: 'Komikcast', status: 'timeout', color: 'blue' },
        { id: 'komiku', name: 'Komiku', status: 'blocked', color: 'green' },
    ];

    const getSourceColor = (source: string) => {
        const s = sources.find(src => src.id === source);
        switch (s?.color) {
            case 'purple': return 'bg-purple-500/80';
            case 'blue': return 'bg-blue-500/80';
            case 'green': return 'bg-green-500/80';
            default: return 'bg-slate-500/80';
        }
    };

    // Get detail page URL based on source
    const getMangaDetailUrl = (manga: MangaItem, source: string): string => {
        if (source === 'shinigami') {
            return `/manga/shinigami/${manga.id || manga.slug}`;
        }
        return `/manga/${source}/${manga.slug}`;
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
        if (days < 7) return `${days}h lalu`;
        return `${days}h lalu`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-purple-500/20">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            📚 Kotatsu Web
                        </h1>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/updates"
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white rounded-xl transition-all flex items-center gap-2"
                            >
                                🔔 <span className="hidden sm:inline">Update</span>
                            </Link>
                            <Link
                                href="/search"
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all flex items-center gap-2"
                            >
                                🔍 <span className="hidden sm:inline">Cari</span>
                            </Link>
                            <Link
                                href="/explore"
                                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
                            >
                                🌐 <span className="hidden sm:inline">Sumber</span>
                            </Link>
                            <Link
                                href="/library"
                                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
                            >
                                📚 <span className="hidden sm:inline">Perpustakaan</span>
                            </Link>
                            <Link
                                href="/settings"
                                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
                            >
                                ⚙️
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* History Section - Shown First */}
                {mounted && history.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                🕐 Lanjut Membaca
                            </h2>
                            <Link
                                href="/library"
                                className="text-purple-400 hover:text-purple-300 text-sm"
                            >
                                Lihat Semua →
                            </Link>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-500/50">
                            {history.slice(0, 10).map((item) => (
                                <Link
                                    key={`${item.mangaId}-${item.source}`}
                                    href={`/read/${item.source}/${item.mangaId}/${item.chapterId}`}
                                    className="flex-shrink-0 w-36 group"
                                >
                                    <div className="relative rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all">
                                        <div className="aspect-[3/4] bg-slate-700 overflow-hidden">
                                            {item.mangaCover ? (
                                                <img
                                                    src={item.mangaCover}
                                                    alt={item.mangaTitle}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">📖</div>
                                            )}
                                        </div>

                                        {/* Source Badge */}
                                        <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium rounded text-white ${getSourceColor(item.source)}`}>
                                            {item.source}
                                        </span>

                                        {/* Progress Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                                            <p className="text-white text-xs font-medium">Ch. {item.chapterNumber}</p>
                                            <p className="text-slate-400 text-[10px]">{formatTimeAgo(item.lastReadAt)}</p>
                                        </div>
                                    </div>
                                    <h3 className="text-sm text-slate-300 mt-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                        {item.mangaTitle}
                                    </h3>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Latest Manga Section */}
                <section>
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        🔥 Manga Terbaru
                    </h2>

                    {/* Source Selector */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {sources.map((source) => (
                            <button
                                key={source.id}
                                onClick={() => setCurrentSource(source.id)}
                                className={`
                                    px-6 py-3 rounded-xl font-medium transition-all duration-300
                                    ${currentSource === source.id
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                                    }
                                    ${source.status !== 'active' ? 'opacity-60' : ''}
                                `}
                            >
                                {source.name}
                                {source.status === 'timeout' && <span className="ml-2 text-xs text-yellow-400">⏱️</span>}
                                {source.status === 'blocked' && <span className="ml-2 text-xs text-red-400">🚫</span>}
                            </button>
                        ))}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                            <p className="text-red-400 text-lg mb-2">❌ {error}</p>
                            <p className="text-slate-400 text-sm">
                                Kemungkinan website diblokir oleh ISP atau sedang tidak tersedia.
                            </p>
                        </div>
                    )}

                    {/* Manga Grid */}
                    {!loading && !error && mangaList.length > 0 && (
                        <>
                            <p className="text-slate-400 mb-6">
                                Menampilkan <span className="text-purple-400 font-semibold">{mangaList.length}</span> manga dari{' '}
                                <span className="text-pink-400 font-semibold">{currentSource}</span>
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {mangaList.map((manga, index) => (
                                    <Link
                                        key={manga.id || manga.slug || index}
                                        href={getMangaDetailUrl(manga, currentSource)}
                                        className="group relative rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50 
                                                  hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10
                                                  hover:-translate-y-1"
                                    >
                                        {/* Cover Image */}
                                        <div className="aspect-[3/4] bg-slate-700 overflow-hidden">
                                            {manga.cover ? (
                                                <img
                                                    src={manga.cover}
                                                    alt={manga.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">No Image</text></svg>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                    📖
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Badge */}
                                        {manga.status && (
                                            <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-lg
                                                ${manga.status === 'Ongoing' ? 'bg-green-500/80 text-white' :
                                                    manga.status === 'Completed' ? 'bg-blue-500/80 text-white' :
                                                        'bg-yellow-500/80 text-black'}`}>
                                                {manga.status}
                                            </span>
                                        )}

                                        {/* Source Badge - NEW! */}
                                        <span className={`absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium rounded text-white ${getSourceColor(currentSource)}`}>
                                            {currentSource}
                                        </span>

                                        {/* Title */}
                                        <div className="p-3">
                                            <h3 className="text-sm font-medium text-slate-200 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                                {manga.title}
                                            </h3>
                                            {manga.genres && manga.genres.length > 0 && (
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                                    {manga.genres.slice(0, 2).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Empty State */}
                    {!loading && !error && mangaList.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-slate-400 text-lg">Tidak ada manga ditemukan.</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-6 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">
                        Kotatsu Web Clone • Data dari berbagai sumber manga Indonesia
                    </p>
                </div>
            </footer>
        </div>
    );
}
