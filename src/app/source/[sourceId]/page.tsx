'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    ArrowLeft,
    Search,
    Filter,
    X,
    BookOpen,
    Tag,
    AlertCircle,
    Inbox,
    Loader2,
    ArrowUp
} from 'lucide-react';
import { MangaCard, MangaGrid, ViewToggle } from '@/components/manga';
import { useScrollDirection } from '@/hooks/useScrollDirection';

interface MangaItem {
    source: string;
    id: string;
    title: string;
    cover: string;
    status?: string;
    type?: string;
    genres?: string[];
    latestChapter?: string;
    link: string;
    slug: string;
}

interface APIResponse {
    success: boolean;
    source: string;
    page: number;
    count: number;
    data: MangaItem[];
    error?: string;
}

const SOURCE_INFO: Record<string, { name: string; icon: string; description: string; baseUrl: string }> = {
    shinigami: {
        name: 'Shinigami',
        icon: 'https://shinigami.id/wp-content/uploads/2022/08/Shinigami-Ico.png',
        description: 'Sumber manga populer dengan update cepat',
        baseUrl: 'id.shinigami.asia'
    },
    mgkomik: {
        name: 'Mgkomik',
        icon: 'https://id.mgkomik.cc/wp-content/uploads/2023/05/cropped-MG-32x32.png',
        description: 'Platform Madara dengan koleksi lengkap',
        baseUrl: 'id.mgkomik.cc'
    },
    komikcast: {
        name: 'Komikcast',
        icon: 'https://komikcast.ch/wp-content/uploads/2020/03/cropped-logo_babi_2-01-32x32.png',
        description: 'Terjemahan berkualitas tinggi',
        baseUrl: 'komikcast.lol'
    },
    komiku: {
        name: 'Komiku',
        icon: 'https://komiku.id/wp-content/uploads/2022/01/cropped-Komiku-32x32.png',
        description: 'Koleksi manga dan manhwa',
        baseUrl: 'komiku.id'
    },
    mangadex: {
        name: 'MangaDex',
        icon: 'https://mangadex.org/favicon.ico',
        description: 'Platform manga internasional',
        baseUrl: 'mangadex.org'
    }
};

const COMIC_TYPES = ['Manga', 'Manhwa', 'Manhua'];

const GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Isekai', 'Martial Arts', 'Mystery', 'Romance', 'School Life',
    'Sci-Fi', 'Seinen', 'Shoujo', 'Shounen', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller', 'Tragedy'
];

function MangaSkeleton({ variant }: { variant: 'grid' | 'list' }) {
    if (variant === 'list') {
        return (
            <div className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                <div className="w-[60px] h-[90px] rounded-lg skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 skeleton rounded" />
                    <div className="h-3 w-1/2 skeleton rounded" />
                    <div className="flex gap-2">
                        <div className="h-5 w-16 skeleton rounded-full" />
                        <div className="h-5 w-12 skeleton rounded-full" />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="aspect-[2/3] w-full skeleton" />
            <div className="p-3 space-y-2">
                <div className="h-4 w-full skeleton rounded" />
                <div className="h-3 w-1/2 skeleton rounded" />
            </div>
        </div>
    );
}

export default function SourcePage() {
    const params = useParams();
    const sourceId = params.sourceId as string;

    const [mangaList, setMangaList] = useState<MangaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showBackToTop, setShowBackToTop] = useState(false);

    // Multi-select filters
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Infinite scroll ref
    const loaderRef = useRef<HTMLDivElement>(null);

    const scrollDirection = useScrollDirection();
    const isVisible = scrollDirection !== 'down';

    const sourceInfo = SOURCE_INFO[sourceId] || {
        name: sourceId,
        icon: '/placeholder.png',
        description: '',
        baseUrl: ''
    };

    useEffect(() => {
        const savedView = localStorage.getItem('sourceViewMode') as 'grid' | 'list';
        if (savedView) setViewMode(savedView);

        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 500);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setPage(1);
        setMangaList([]);
        setHasMore(true);
        fetchManga(1, true);
    }, [sourceId, searchQuery]);

    // Infinite scroll - Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const first = entries[0];
                if (first.isIntersecting && hasMore && !loadingMore && !loading) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [hasMore, loadingMore, loading, page]);

    const fetchManga = async (pageNum: number, reset: boolean = false) => {
        if (reset) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            let url = `/api/sources/${sourceId}?page=${pageNum}`;
            if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

            const response = await fetch(url);
            const data: APIResponse = await response.json();

            if (data.success) {
                if (reset) {
                    setMangaList(data.data);
                } else {
                    setMangaList(prev => [...prev, ...data.data]);
                }
                setHasMore(data.data.length >= 20); // Assume 20 is page size
            } else {
                setError(data.error || 'Gagal memuat data');
            }
        } catch {
            setError('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Filter manga based on selected types and genres
    const filteredManga = mangaList.filter(manga => {
        if (selectedTypes.length > 0) {
            const mangaType = (manga.type || '').toLowerCase();
            const titleLower = manga.title.toLowerCase();
            const matchesType = selectedTypes.some(type => {
                const typeLower = type.toLowerCase();
                return mangaType.includes(typeLower) || titleLower.includes(typeLower);
            });
            if (!matchesType) return false;
        }

        if (selectedGenres.length > 0) {
            const mangaGenres = (manga.genres || []).map(g => g.toLowerCase());
            const matchesGenre = selectedGenres.some(genre =>
                mangaGenres.some(g => g.includes(genre.toLowerCase()))
            );
            if (!matchesGenre) return false;
        }

        return true;
    });

    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchManga(nextPage, false);
        }
    }, [loadingMore, hasMore, loading, page]);

    const handleViewChange = (view: 'grid' | 'list') => {
        setViewMode(view);
        localStorage.setItem('sourceViewMode', view);
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleGenre = (genre: string) => {
        setSelectedGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
    };

    const clearFilters = () => {
        setSelectedTypes([]);
        setSelectedGenres([]);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const activeFilterCount = selectedTypes.length + selectedGenres.length;

    return (
        <div className="min-h-screen p-4 lg:p-6 relative">
            {/* Header */}
            <div className="mb-6 animate-fadeInUp">
                <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 mb-4 text-sm hover:underline group"
                    style={{ color: 'var(--accent-primary)' }}
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Kembali ke Sumber
                </Link>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white p-1 flex-shrink-0 shadow-sm relative">
                        {sourceInfo.icon.startsWith('http') || sourceInfo.icon.startsWith('/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={sourceInfo.icon}
                                alt={sourceInfo.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://www.google.com/s2/favicons?domain=${sourceInfo.baseUrl || 'google.com'}&sz=128`;
                                }}
                            />
                        ) : (
                            <span className="text-4xl w-full h-full flex items-center justify-center">{sourceInfo.icon}</span>
                        )}
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {sourceInfo.name}
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {sourceInfo.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Search & Toolbar */}
            <div
                className={`rounded-xl p-3 mb-4 sticky top-0 z-30 shadow-sm animate-fadeInUp backdrop-blur-sm transition-transform duration-300 will-change-transform ${!isVisible ? '-translate-y-[150%]' : 'translate-y-0'
                    }`}
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    animationDelay: '100ms'
                }}
            >
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex-grow min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder={`Cari di ${sourceInfo.name}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm"
                            style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid transparent',
                            }}
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 text-sm font-medium"
                        style={{
                            background: showFilters || activeFilterCount > 0 ? 'var(--kotatsu-primary-container)' : 'var(--bg-elevated)',
                            color: showFilters || activeFilterCount > 0 ? 'var(--kotatsu-on-primary-container)' : 'var(--text-secondary)',
                            border: '1px solid transparent',
                        }}
                    >
                        <Filter size={16} />
                        Filter
                        {activeFilterCount > 0 && (
                            <span
                                className="w-5 h-5 flex items-center justify-center text-[10px] rounded-full font-bold -ml-1"
                                style={{ background: 'var(--accent-primary)', color: 'var(--kotatsu-on-primary)' }}
                            >
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <div className="h-8 w-[1px] bg-[var(--border-default)] mx-1 hidden sm:block"></div>

                    <ViewToggle view={viewMode} onChange={handleViewChange} />
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div
                    className="rounded-xl p-5 mb-6 animate-slideDown overflow-hidden"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                <BookOpen size={14} />
                                Jenis Komik
                            </h3>
                            {selectedTypes.length > 0 && (
                                <button
                                    onClick={() => setSelectedTypes([])}
                                    className="text-xs hover:underline flex items-center gap-1"
                                    style={{ color: 'var(--accent-primary)' }}
                                >
                                    <X size={12} />
                                    Reset
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {COMIC_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    className="px-4 py-2 rounded-full text-sm transition-all hover:-translate-y-0.5"
                                    style={{
                                        background: selectedTypes.includes(type) ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                        color: selectedTypes.includes(type) ? 'var(--kotatsu-on-primary)' : 'var(--text-secondary)',
                                        boxShadow: selectedTypes.includes(type) ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium flex items-center gap-2 text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                <Tag size={14} />
                                Genre
                            </h3>
                            {selectedGenres.length > 0 && (
                                <button
                                    onClick={() => setSelectedGenres([])}
                                    className="text-xs hover:underline flex items-center gap-1"
                                    style={{ color: 'var(--accent-primary)' }}
                                >
                                    <X size={12} />
                                    Reset
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                            {GENRES.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className="px-3 py-1.5 rounded-lg text-xs transition-all hover:brightness-110"
                                    style={{
                                        background: selectedGenres.includes(genre) ? 'var(--kotatsu-secondary-container)' : 'var(--bg-elevated)',
                                        color: selectedGenres.includes(genre) ? 'var(--kotatsu-on-secondary-container)' : 'var(--text-secondary)',
                                        border: `1px solid ${selectedGenres.includes(genre) ? 'transparent' : 'var(--border-subtle)'}`,
                                    }}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeFilterCount > 0 && (
                        <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                            <button
                                onClick={clearFilters}
                                className="text-sm flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                                style={{ color: 'var(--accent-error)' }}
                            >
                                <X size={16} />
                                Hapus semua filter ({activeFilterCount})
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Results Info */}
            {!loading && mangaList.length > 0 && (
                <div className="flex items-center justify-between mb-4 animate-fadeIn px-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        {filteredManga.length} hasil ditemukan
                        {searchQuery && <span className="font-normal opacity-70"> untuk "{searchQuery}"</span>}
                    </p>
                    {activeFilterCount > 0 && filteredManga.length < mangaList.length && (
                        <button
                            onClick={clearFilters}
                            className="text-sm hover:underline text-[var(--accent-primary)]"
                        >
                            Lihat semua
                        </button>
                    )}
                </div>
            )}

            {/* Loading State - Skeleton */}
            {loading && (
                <div className="animate-fadeIn">
                    <MangaGrid variant={viewMode}>
                        {[...Array(12)].map((_, i) => (
                            <MangaSkeleton key={i} variant={viewMode} />
                        ))}
                    </MangaGrid>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="text-center py-20 animate-scaleIn">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <p className="text-lg mb-4 font-medium" style={{ color: 'var(--accent-error)' }}>{error}</p>
                    <button
                        onClick={() => fetchManga(1, true)}
                        className="px-6 py-2.5 rounded-lg transition-transform hover:scale-105 active:scale-95 font-medium"
                        style={{ background: 'var(--accent-primary)', color: 'var(--kotatsu-on-primary)' }}
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* Manga Grid */}
            {!loading && !error && filteredManga.length > 0 && (
                <>
                    <MangaGrid variant={viewMode}>
                        {filteredManga.map((manga, index) => (
                            <div
                                key={`${manga.id}-${index}`}
                                className="animate-fadeInUp"
                                style={{ animationDelay: index < 12 ? `${index * 50}ms` : '0ms' }}
                            >
                                <MangaCard
                                    id={manga.id}
                                    title={manga.title}
                                    cover={manga.cover}
                                    source={sourceId}
                                    variant={viewMode}
                                    href={`/manga/${sourceId}/${manga.slug || manga.id}`}
                                />
                            </div>
                        ))}
                    </MangaGrid>

                    {/* Infinite Scroll Loader */}
                    {hasMore && (
                        <div ref={loaderRef} className="flex justify-center py-8">
                            {loadingMore && (
                                <div className="flex items-center gap-3 py-2 px-5 rounded-full bg-[var(--bg-elevated)] shadow-sm border border-[var(--border-subtle)]">
                                    <Loader2 size={18} className="animate-spin text-[var(--accent-primary)]" />
                                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        Memuat lebih banyak...
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* End of list indicator */}
                    {!hasMore && mangaList.length > 0 && (
                        <div className="text-center py-12 opacity-50 flex flex-col items-center gap-2">
                            <div className="w-16 h-1 bg-[var(--border-default)] rounded-full mb-1"></div>
                            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                                Akhir Daftar
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Empty State - No results after filter */}
            {!loading && !error && mangaList.length > 0 && filteredManga.length === 0 && (
                <div className="text-center py-20 animate-fadeIn">
                    <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-6">
                        <Search size={40} className="text-[var(--text-muted)] opacity-50" />
                    </div>
                    <p className="text-lg mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Tidak ditemukan
                    </p>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                        Coba ubah filter atau kata kunci pencarianmu
                    </p>
                    <button
                        onClick={clearFilters}
                        className="px-6 py-2.5 rounded-lg transition-transform hover:scale-105 font-medium"
                        style={{ background: 'var(--accent-primary)', color: 'var(--kotatsu-on-primary)' }}
                    >
                        Hapus Filter
                    </button>
                </div>
            )}

            {/* Empty State - No data */}
            {!loading && !error && mangaList.length === 0 && (
                <div className="text-center py-20 animate-fadeIn">
                    <div className="w-24 h-24 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-6">
                        <Inbox size={40} className="text-[var(--text-muted)] opacity-50" />
                    </div>
                    <p className="text-lg mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                        Belum ada manga
                    </p>
                    <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                        {searchQuery ? `Tidak ditemukan hasil untuk "${searchQuery}"` : 'daftar manga kosong saat ini'}
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{ color: 'var(--accent-primary)' }}
                            className="hover:underline flex items-center gap-2 mx-auto"
                        >
                            <X size={14} />
                            Hapus pencarian
                        </button>
                    )}
                </div>
            )}

            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                    }`}
                style={{
                    background: 'var(--accent-primary)',
                    color: 'var(--kotatsu-on-primary)',
                }}
            >
                <ArrowUp size={24} />
            </button>
        </div>
    );
}
