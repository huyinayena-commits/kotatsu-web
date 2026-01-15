'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
        { id: 'shinigami', name: 'Shinigami', status: 'active' },
        { id: 'komikcast', name: 'Komikcast', status: 'timeout' },
        { id: 'komiku', name: 'Komiku', status: 'blocked' },
    ];

    // Get detail page URL based on source
    const getMangaDetailUrl = (manga: MangaItem, source: string): string => {
        if (source === 'shinigami') {
            // Untuk Shinigami, gunakan manga_id
            return `/manga/shinigami/${manga.id || manga.slug}`;
        }
        // Untuk source lain, gunakan slug
        return `/manga/${source}/${manga.slug}`;
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
                                href="/search"
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all flex items-center gap-2"
                            >
                                🔍 <span className="hidden sm:inline">Cari</span>
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
                {/* Source Selector */}
                <div className="flex flex-wrap gap-3 mb-8">
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
