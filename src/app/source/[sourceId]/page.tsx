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
    ArrowUp,
    Globe,
    Zap,
    TrendingUp,
    BookMarked,
    Sparkles,
    ChevronDown,
    LayoutGrid,
    List,
    SlidersHorizontal
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

const SOURCE_INFO: Record<string, { name: string; icon: string; description: string; baseUrl: string; color: string }> = {
    shinigami: {
        name: 'Shinigami',
        icon: 'https://shinigami.id/wp-content/uploads/2022/08/Shinigami-Ico.png',
        description: 'Sumber manga populer dengan update cepat dan koleksi terlengkap',
        baseUrl: 'id.shinigami.asia',
        color: '#8B5CF6'
    },
    mgkomik: {
        name: 'Mgkomik',
        icon: 'https://id.mgkomik.cc/wp-content/uploads/2023/05/cropped-MG-32x32.png',
        description: 'Platform Madara dengan koleksi manga dan manhwa lengkap',
        baseUrl: 'id.mgkomik.cc',
        color: '#3B82F6'
    },
    komikcast: {
        name: 'Komikcast',
        icon: 'https://komikcast.ch/wp-content/uploads/2020/03/cropped-logo_babi_2-01-32x32.png',
        description: 'Terjemahan berkualitas tinggi dengan update rutin',
        baseUrl: 'komikcast.lol',
        color: '#10B981'
    },
    komiku: {
        name: 'Komiku',
        icon: 'https://komiku.id/wp-content/uploads/2022/01/cropped-Komiku-32x32.png',
        description: 'Koleksi manga dan manhwa Indonesia terlengkap',
        baseUrl: 'komiku.id',
        color: '#F59E0B'
    },
    mangadex: {
        name: 'MangaDex',
        icon: 'https://mangadex.org/favicon.ico',
        description: 'Platform manga internasional dengan multi-bahasa',
        baseUrl: 'mangadex.org',
        color: '#EF4444'
    }
};

const COMIC_TYPES = ['Manga', 'Manhwa', 'Manhua'];

const GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Isekai', 'Martial Arts', 'Mystery', 'Romance', 'School Life',
    'Sci-Fi', 'Seinen', 'Shoujo', 'Shounen', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller', 'Tragedy'
];

type SortOption = 'latest' | 'popular' | 'nameAZ' | 'nameZA';

function MangaSkeleton({ variant }: { variant: 'grid' | 'list' }) {
    if (variant === 'list') {
        return (
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] animate-pulse">
                <div className="w-[70px] h-[100px] rounded-xl skeleton flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="h-5 w-3/4 skeleton rounded-lg" />
                    <div className="h-4 w-1/2 skeleton rounded-lg" />
                    <div className="flex gap-2">
                        <div className="h-6 w-16 skeleton rounded-full" />
                        <div className="h-6 w-14 skeleton rounded-full" />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-surface)] animate-pulse">
            <div className="aspect-[2/3] w-full skeleton" />
            <div className="p-4 space-y-3">
                <div className="h-4 w-full skeleton rounded-lg" />
                <div className="h-3 w-2/3 skeleton rounded-lg" />
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
    const [sortBy, setSortBy] = useState<SortOption>('latest');
    const [showSortMenu, setShowSortMenu] = useState(false);

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
        baseUrl: '',
        color: '#8DAFFF'
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

    // Sort manga
    const sortedManga = [...filteredManga].sort((a, b) => {
        switch (sortBy) {
            case 'nameAZ':
                return a.title.localeCompare(b.title);
            case 'nameZA':
                return b.title.localeCompare(a.title);
            case 'popular':
            case 'latest':
            default:
                return 0; // Keep original order
        }
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

    const getSortLabel = (sort: SortOption) => {
        switch (sort) {
            case 'latest': return 'Terbaru';
            case 'popular': return 'Populer';
            case 'nameAZ': return 'Nama A-Z';
            case 'nameZA': return 'Nama Z-A';
        }
    };

    return (
        <div className="min-h-dvh pb-24 lg:pb-8">
            {/* Hero Section with Gradient Background */}
            <div className="relative overflow-hidden">
                {/* Dynamic Background based on source color */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        background: `linear-gradient(135deg, ${sourceInfo.color}40 0%, transparent 50%, var(--kotatsu-secondary)20 100%)`
                    }}
                />
                <div
                    className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4"
                    style={{ background: sourceInfo.color, opacity: 0.15 }}
                />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[var(--kotatsu-secondary)]/15 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 pt-6 pb-8">
                    {/* Back Button */}
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-2 mb-6 text-sm font-medium hover:text-[var(--accent-primary)] transition-all group"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)] group-hover:bg-[var(--kotatsu-primary-container)] transition-all shadow-sm">
                            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <span className="group-hover:translate-x-0.5 transition-transform">Kembali</span>
                    </Link>

                    {/* Source Header Card */}
                    <div className="relative rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)] shadow-xl">
                        {/* Decorative Glow */}
                        <div
                            className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-30 pointer-events-none"
                            style={{ background: sourceInfo.color }}
                        />

                        <div className="relative z-10 p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                {/* Source Icon */}
                                <div className="relative group">
                                    <div
                                        className="absolute inset-0 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity"
                                        style={{ background: sourceInfo.color }}
                                    />
                                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-white p-2 shadow-2xl ring-4 ring-white/10 group-hover:scale-105 transition-transform duration-300">
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
                                    </div>
                                </div>

                                {/* Source Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">
                                            {sourceInfo.name}
                                        </h1>
                                        <span
                                            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
                                            style={{ background: 'var(--kotatsu-success)', color: '#000' }}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                                            Online
                                        </span>
                                    </div>
                                    <p className="text-sm sm:text-base text-[var(--text-secondary)] mb-4 max-w-xl leading-relaxed">
                                        {sourceInfo.description}
                                    </p>

                                    {/* Quick Stats */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                                            <Globe size={14} className="text-[var(--accent-primary)]" />
                                            <span className="text-xs font-medium text-[var(--text-muted)]">{sourceInfo.baseUrl}</span>
                                        </div>
                                        {!loading && mangaList.length > 0 && (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                                                <BookMarked size={14} className="text-[var(--kotatsu-secondary)]" />
                                                <span className="text-xs font-medium text-[var(--text-muted)]">{mangaList.length}+ Manga</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                {/* Search & Toolbar - Sticky */}
                <div
                    className={`rounded-2xl p-3 sm:p-4 mb-6 sticky top-2 z-30 transition-all duration-300 will-change-transform ${!isVisible ? '-translate-y-[150%]' : 'translate-y-0'
                        }`}
                    style={{
                        background: 'rgba(var(--bg-surface-rgb, 26, 29, 35), 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Search Input */}
                        <div className="flex-1 min-w-0 relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                            <input
                                type="text"
                                placeholder={`Cari di ${sourceInfo.name}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm font-medium"
                                style={{
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-subtle)',
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowSortMenu(!showSortMenu)}
                                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110"
                                style={{
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                }}
                            >
                                <TrendingUp size={16} />
                                <span>{getSortLabel(sortBy)}</span>
                                <ChevronDown size={14} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {showSortMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl overflow-hidden border border-[var(--border-default)] shadow-xl z-50 animate-scaleIn origin-top-right"
                                        style={{ background: 'var(--bg-surface)' }}>
                                        {(['latest', 'popular', 'nameAZ', 'nameZA'] as SortOption[]).map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    setSortBy(option);
                                                    setShowSortMenu(false);
                                                }}
                                                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors ${sortBy === option
                                                        ? 'bg-[var(--kotatsu-primary-container)] text-[var(--kotatsu-on-primary-container)]'
                                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                                                    }`}
                                            >
                                                {getSortLabel(option)}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex-shrink-0 p-2.5 sm:px-4 sm:py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95"
                            style={{
                                background: showFilters || activeFilterCount > 0 ? 'var(--kotatsu-primary-container)' : 'var(--bg-elevated)',
                                color: showFilters || activeFilterCount > 0 ? 'var(--kotatsu-on-primary-container)' : 'var(--text-secondary)',
                                border: '1px solid var(--border-subtle)',
                            }}
                        >
                            <SlidersHorizontal size={18} />
                            <span className="hidden sm:inline text-sm font-medium">Filter</span>
                            {activeFilterCount > 0 && (
                                <span
                                    className="min-w-[20px] h-[20px] flex items-center justify-center text-[10px] rounded-full font-bold"
                                    style={{ background: 'var(--accent-primary)', color: 'var(--kotatsu-on-primary)' }}
                                >
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* View Toggle */}
                        <div className="flex rounded-xl overflow-hidden border border-[var(--border-subtle)]" style={{ background: 'var(--bg-elevated)' }}>
                            <button
                                onClick={() => handleViewChange('grid')}
                                className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => handleViewChange('list')}
                                className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div
                        className="rounded-2xl p-5 sm:p-6 mb-6 animate-slideDown overflow-hidden border border-[var(--border-default)] shadow-lg"
                        style={{ background: 'var(--bg-surface)' }}
                    >
                        {/* Comic Types */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                                    <BookOpen size={16} className="text-[var(--accent-primary)]" />
                                    Jenis Komik
                                </h3>
                                {selectedTypes.length > 0 && (
                                    <button
                                        onClick={() => setSelectedTypes([])}
                                        className="text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
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
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${selectedTypes.includes(type)
                                                ? 'shadow-lg'
                                                : 'hover:shadow-md'
                                            }`}
                                        style={{
                                            background: selectedTypes.includes(type) ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                            color: selectedTypes.includes(type) ? 'var(--kotatsu-on-primary)' : 'var(--text-secondary)',
                                            border: `1px solid ${selectedTypes.includes(type) ? 'transparent' : 'var(--border-subtle)'}`,
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Genres */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                                    <Tag size={16} className="text-[var(--kotatsu-secondary)]" />
                                    Genre
                                </h3>
                                {selectedGenres.length > 0 && (
                                    <button
                                        onClick={() => setSelectedGenres([])}
                                        className="text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
                                        style={{ color: 'var(--accent-primary)' }}
                                    >
                                        <X size={12} />
                                        Reset
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                                {GENRES.map(genre => (
                                    <button
                                        key={genre}
                                        onClick={() => toggleGenre(genre)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95`}
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

                        {/* Clear All Filters */}
                        {activeFilterCount > 0 && (
                            <div className="mt-6 pt-4 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                                <span className="text-sm text-[var(--text-muted)]">
                                    {activeFilterCount} filter aktif
                                </span>
                                <button
                                    onClick={clearFilters}
                                    className="text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-[var(--accent-error)]/10 transition-colors"
                                    style={{ color: 'var(--accent-error)' }}
                                >
                                    <X size={16} />
                                    Hapus Semua
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Results Header */}
                {!loading && mangaList.length > 0 && (
                    <div className="flex items-center justify-between mb-5 animate-fadeIn">
                        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Sparkles size={18} className="text-[var(--accent-primary)]" />
                            {searchQuery ? 'Hasil Pencarian' : 'Daftar Manga'}
                            <span className="text-sm font-medium px-2.5 py-0.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                                {sortedManga.length}
                            </span>
                        </h2>

                        {activeFilterCount > 0 && sortedManga.length < mangaList.length && (
                            <button
                                onClick={clearFilters}
                                className="text-sm font-medium hover:underline transition-colors flex items-center gap-1"
                                style={{ color: 'var(--accent-primary)' }}
                            >
                                Tampilkan Semua ({mangaList.length})
                            </button>
                        )}
                    </div>
                )}

                {/* Loading State */}
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
                    <div className="text-center py-16 animate-fadeIn">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <AlertCircle size={48} className="text-red-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Oops! Terjadi Kesalahan</h3>
                        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                        <button
                            onClick={() => fetchManga(1, true)}
                            className="px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-semibold shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, var(--accent-primary), var(--kotatsu-secondary))',
                                color: 'white'
                            }}
                        >
                            Coba Lagi
                        </button>
                    </div>
                )}

                {/* Manga Grid */}
                {!loading && !error && sortedManga.length > 0 && (
                    <>
                        <MangaGrid variant={viewMode}>
                            {sortedManga.map((manga, index) => (
                                <div
                                    key={`${manga.id}-${index}`}
                                    className="animate-fadeInUp"
                                    style={{ animationDelay: index < 12 ? `${index * 40}ms` : '0ms' }}
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
                            <div ref={loaderRef} className="flex justify-center py-10">
                                {loadingMore && (
                                    <div className="flex items-center gap-3 py-3 px-6 rounded-2xl bg-[var(--bg-surface)] shadow-lg border border-[var(--border-subtle)]">
                                        <Loader2 size={20} className="animate-spin text-[var(--accent-primary)]" />
                                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                            Memuat lebih banyak...
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* End of List */}
                        {!hasMore && mangaList.length > 0 && (
                            <div className="text-center py-10 flex flex-col items-center gap-3">
                                <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent rounded-full" />
                                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
                                    Akhir Daftar
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State - Filter Results */}
                {!loading && !error && mangaList.length > 0 && sortedManga.length === 0 && (
                    <div className="text-center py-16 animate-fadeIn">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] flex items-center justify-center mx-auto mb-6 shadow-lg border border-[var(--border-subtle)]">
                            <Search size={40} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Tidak Ditemukan</h3>
                        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            Tidak ada manga yang cocok dengan filter yang dipilih
                        </p>
                        <button
                            onClick={clearFilters}
                            className="px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-semibold shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, var(--accent-primary), var(--kotatsu-secondary))',
                                color: 'white'
                            }}
                        >
                            Hapus Filter
                        </button>
                    </div>
                )}

                {/* Empty State - No Data */}
                {!loading && !error && mangaList.length === 0 && (
                    <div className="text-center py-16 animate-fadeIn">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] flex items-center justify-center mx-auto mb-6 shadow-lg border border-[var(--border-subtle)]">
                            <Inbox size={40} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Belum Ada Manga</h3>
                        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
                            {searchQuery ? `Tidak ditemukan hasil untuk "${searchQuery}"` : 'Daftar manga kosong saat ini'}
                        </p>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 font-semibold"
                                style={{
                                    background: 'var(--bg-elevated)',
                                    color: 'var(--accent-primary)',
                                    border: '1px solid var(--border-subtle)'
                                }}
                            >
                                <X size={18} />
                                Hapus Pencarian
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Back to Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-24 lg:bottom-8 right-4 lg:right-6 w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                    }`}
                style={{
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--kotatsu-secondary))',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(141, 175, 255, 0.3)'
                }}
            >
                <ArrowUp size={22} />
            </button>
        </div>
    );
}
