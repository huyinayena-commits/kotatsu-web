'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    Info,
    Globe,
    Compass,
    Sparkles,
    CheckCircle2,
    Clock,
    Ban,
    Wrench,
    ArrowRight,
    Zap,
    TrendingUp,
    Star
} from 'lucide-react';
import { getDisplaySettings, setDisplaySettings, type ViewMode } from '@/lib/storage';
import { SourceCard, type SourceInfo } from './components/SourceCard';
import { FilterToolbar } from './components/FilterToolbar';

const SOURCES: SourceInfo[] = [
    {
        id: 'shinigami',
        name: 'Shinigami',
        language: 'Indonesia',
        status: 'active',
        description: 'Sumber manga populer dengan update cepat dan koleksi lengkap.',
        genres: ['Action', 'Romance', 'Fantasy', 'Comedy', 'Drama'],
        baseUrl: 'id.shinigami.asia',
        icon: 'https://shinigami.id/wp-content/uploads/2022/08/Shinigami-Ico.png',
    },
    {
        id: 'mgkomik',
        name: 'Mgkomik',
        language: 'Indonesia',
        status: 'active',
        description: 'Platform Madara dengan koleksi manga dan manhwa terlengkap.',
        genres: ['Action', 'Romance', 'Fantasy', 'Isekai', 'Manhwa'],
        baseUrl: 'mgkomik.org',
        icon: 'https://id.mgkomik.cc/wp-content/uploads/2023/05/cropped-MG-32x32.png',
    },
    {
        id: 'komikcast',
        name: 'Komikcast',
        language: 'Indonesia',
        status: 'timeout',
        description: 'Sumber manga dengan terjemahan berkualitas tinggi. Sering mengalami timeout pada jam sibuk.',
        genres: ['Action', 'Adventure', 'Fantasy', 'Isekai'],
        baseUrl: 'komikcast.lol',
        icon: 'https://komikcast.ch/wp-content/uploads/2020/03/cropped-logo_babi_2-01-32x32.png',
    },
    {
        id: 'komiku',
        name: 'Komiku',
        language: 'Indonesia',
        status: 'blocked',
        description: 'Koleksi manga dan manhwa Indonesia. Saat ini diblokir oleh beberapa ISP.',
        genres: ['Manhwa', 'Manhua', 'Action', 'Romance'],
        baseUrl: 'komiku.id',
        icon: 'https://komiku.id/wp-content/uploads/2022/01/cropped-Komiku-32x32.png',
    },
    {
        id: 'mangadex',
        name: 'MangaDex',
        language: 'Multi',
        status: 'maintenance',
        description: 'Platform manga internasional dengan multi-bahasa. Sedang dalam perbaikan server.',
        genres: ['All Genres'],
        baseUrl: 'mangadex.org',
        icon: 'https://mangadex.org/favicon.ico',
    },
];

type SortOption = 'name' | 'popularity' | 'status';

export default function ExplorePage() {
    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [filterLanguage, setFilterLanguage] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setMounted(true);
        const settings = getDisplaySettings();
        setViewMode(settings.exploreMode);
    }, []);

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        setDisplaySettings({ exploreMode: mode });
    };

    const languages = ['all', ...new Set(SOURCES.map(s => s.language))];

    const filteredSources = SOURCES
        .filter(source => {
            if (filterLanguage !== 'all' && source.language !== filterLanguage) return false;
            if (filterStatus !== 'all' && source.status !== filterStatus) return false;
            if (searchQuery && !source.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'popularity':
                    const statusOrder = { active: 0, timeout: 1, maintenance: 2, blocked: 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

    // Stats
    const stats = {
        total: SOURCES.length,
        active: SOURCES.filter(s => s.status === 'active').length,
        languages: new Set(SOURCES.map(s => s.language)).size,
    };

    // Featured sources (active ones)
    const featuredSources = SOURCES.filter(s => s.status === 'active').slice(0, 2);

    if (!mounted) return null;

    return (
        <div className="min-h-dvh pb-24 lg:pb-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/10 via-transparent to-[var(--kotatsu-secondary)]/10" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-primary)]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[var(--kotatsu-secondary)]/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 pt-8 pb-12">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 animate-fadeIn">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--kotatsu-secondary)] text-white shadow-lg shadow-[var(--accent-primary)]/30">
                                    <Compass size={28} />
                                </div>
                                <div>
                                    <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                                        Explore
                                    </h1>
                                    <p className="text-sm text-[var(--text-muted)] font-medium">
                                        Temukan sumber manga favoritmu
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            <div className="flex-shrink-0 px-5 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-green-500/10 text-green-500">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">{stats.active}</p>
                                    <p className="text-xs text-[var(--text-muted)]">Aktif</p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 px-5 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">{stats.languages}</p>
                                    <p className="text-xs text-[var(--text-muted)]">Bahasa</p>
                                </div>
                            </div>
                            <div className="flex-shrink-0 px-5 py-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-[var(--text-primary)]">{stats.total}</p>
                                    <p className="text-xs text-[var(--text-muted)]">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Featured Sources */}
                    {featuredSources.length > 0 && (
                        <div className="mb-10 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={18} className="text-yellow-500" />
                                <h2 className="text-lg font-bold text-[var(--text-primary)]">Rekomendasi Untukmu</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {featuredSources.map((source, i) => (
                                    <Link
                                        key={source.id}
                                        href={`/source/${source.id}`}
                                        className="group relative overflow-hidden rounded-3xl p-6 transition-all hover:scale-[1.02] hover:shadow-2xl"
                                        style={{
                                            background: i === 0
                                                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))'
                                                : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(14, 165, 233, 0.15))',
                                            border: '1px solid var(--border-default)',
                                        }}
                                    >
                                        {/* Glow */}
                                        <div
                                            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-80"
                                            style={{
                                                background: i === 0
                                                    ? 'var(--accent-primary)'
                                                    : 'rgb(34, 197, 94)'
                                            }}
                                        />

                                        <div className="relative z-10 flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg flex-shrink-0">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={source.icon}
                                                    alt={source.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = `https://www.google.com/s2/favicons?domain=${source.baseUrl}&sz=128`;
                                                    }}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                                        {source.name}
                                                    </h3>
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-500 border border-green-500/30 flex items-center gap-1">
                                                        <CheckCircle2 size={10} /> Aktif
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                                                    {source.description}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 rounded-lg bg-black/20 text-[var(--text-secondary)]">
                                                        {source.language}
                                                    </span>
                                                    {source.genres.slice(0, 2).map(g => (
                                                        <span key={g} className="text-xs px-2 py-1 rounded-lg bg-black/20 text-[var(--text-secondary)]">
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <ArrowRight
                                                size={24}
                                                className="flex-shrink-0 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all"
                                            />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                {/* Section Title */}
                <div className="flex items-center justify-between mb-6 animate-fadeIn" style={{ animationDelay: '150ms' }}>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Globe size={20} className="text-[var(--accent-primary)]" />
                        Semua Sumber
                        <span className="text-sm font-normal text-[var(--text-muted)] ml-1">
                            ({filteredSources.length})
                        </span>
                    </h2>
                </div>

                {/* Toolbar */}
                <div className="animate-fadeInUp mb-6" style={{ animationDelay: '200ms' }}>
                    <FilterToolbar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filterLanguage={filterLanguage}
                        setFilterLanguage={setFilterLanguage}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        sortBy={sortBy}
                        setSortBy={(s) => setSortBy(s as SortOption)}
                        viewMode={viewMode}
                        setViewMode={handleViewModeChange}
                        languages={languages}
                    />
                </div>

                {/* Results */}
                {filteredSources.length > 0 ? (
                    <div
                        className={`
                            ${viewMode === 'grid'
                                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'
                                : 'space-y-3'
                            } 
                            animate-fadeInUp
                        `}
                        style={{ animationDelay: '250ms' }}
                    >
                        {filteredSources.map((source, index) => (
                            <SourceCard
                                key={source.id}
                                source={source}
                                viewMode={viewMode}
                                index={index}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 animate-fadeIn">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] flex items-center justify-center mx-auto mb-6 shadow-xl ring-4 ring-[var(--bg-primary)]">
                            <Search size={40} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Tidak Ditemukan</h3>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
                            Tidak ada sumber yang cocok dengan filter yang dipilih.
                        </p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterLanguage('all');
                                setFilterStatus('all');
                            }}
                            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--kotatsu-secondary)] text-white font-bold hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[var(--accent-primary)]/30"
                        >
                            Reset Filter
                        </button>
                    </div>
                )}

                {/* Info Box */}
                <div
                    className="mt-12 rounded-3xl overflow-hidden animate-slideUp"
                    style={{ animationDelay: '300ms' }}
                >
                    <div
                        className="p-6 sm:p-8 relative"
                        style={{
                            background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-elevated))',
                            borderTop: '1px solid var(--border-default)',
                            borderBottom: '1px solid var(--border-default)',
                        }}
                    >
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 rounded-full blur-2xl" />

                        <div className="relative z-10 flex flex-col sm:flex-row gap-5 sm:items-start">
                            <div className="flex-shrink-0 p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/5 text-[var(--accent-primary)] w-fit">
                                <Info size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-3 text-[var(--text-primary)]">
                                    Tentang Status Sumber
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <span className="text-[var(--text-secondary)]">Aktif</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                        <Clock size={16} className="text-orange-500" />
                                        <span className="text-[var(--text-secondary)]">Timeout</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                        <Ban size={16} className="text-red-500" />
                                        <span className="text-[var(--text-secondary)]">Diblokir</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <Wrench size={16} className="text-blue-500" />
                                        <span className="text-[var(--text-secondary)]">Maintenance</span>
                                    </div>
                                </div>
                                <p className="text-sm text-[var(--text-muted)] mt-4 leading-relaxed">
                                    Jika sumber timeout atau diblokir, coba gunakan VPN atau ganti DNS untuk mengaksesnya.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
