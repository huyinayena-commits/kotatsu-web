'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    Grid,
    List,
    CheckCircle2,
    Clock,
    Ban,
    Wrench,
    Info,
    ArrowRight,
    Globe,
    Filter
} from 'lucide-react';
import { getDisplaySettings, setDisplaySettings, type ViewMode } from '@/lib/storage';

interface SourceInfo {
    id: string;
    name: string;
    language: string;
    status: 'active' | 'timeout' | 'blocked' | 'maintenance';
    description: string;
    genres: string[];
    baseUrl: string;
    icon: string;
}

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
        baseUrl: 'id.mgkomik.cc',
        icon: 'https://id.mgkomik.cc/wp-content/uploads/2023/05/cropped-MG-32x32.png',
    },
    {
        id: 'komikcast',
        name: 'Komikcast',
        language: 'Indonesia',
        status: 'timeout',
        description: 'Sumber manga dengan terjemahan berkualitas tinggi.',
        genres: ['Action', 'Adventure', 'Fantasy', 'Isekai'],
        baseUrl: 'komikcast.lol',
        icon: 'https://komikcast.ch/wp-content/uploads/2020/03/cropped-logo_babi_2-01-32x32.png',
    },
    {
        id: 'komiku',
        name: 'Komiku',
        language: 'Indonesia',
        status: 'blocked',
        description: 'Koleksi manga dan manhwa Indonesia.',
        genres: ['Manhwa', 'Manhua', 'Action', 'Romance'],
        baseUrl: 'komiku.id',
        icon: 'https://komiku.id/wp-content/uploads/2022/01/cropped-Komiku-32x32.png',
    },
    {
        id: 'mangadex',
        name: 'MangaDex',
        language: 'Multi',
        status: 'maintenance',
        description: 'Platform manga internasional dengan multi-bahasa.',
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

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return { bg: 'rgba(129, 199, 132, 0.15)', color: 'var(--accent-success)', border: 'rgba(129, 199, 132, 0.3)' };
            case 'timeout': return { bg: 'rgba(251, 140, 0, 0.15)', color: 'var(--accent-warning)', border: 'rgba(251, 140, 0, 0.3)' };
            case 'blocked': return { bg: 'rgba(255, 180, 169, 0.15)', color: 'var(--accent-error)', border: 'rgba(255, 180, 169, 0.3)' };
            case 'maintenance': return { bg: 'rgba(171, 199, 255, 0.15)', color: 'var(--accent-primary)', border: 'rgba(171, 199, 255, 0.3)' };
            default: return { bg: 'var(--bg-surface)', color: 'var(--text-muted)', border: 'var(--border-default)' };
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle2 size={14} />;
            case 'timeout': return <Clock size={14} />;
            case 'blocked': return <Ban size={14} />;
            case 'maintenance': return <Wrench size={14} />;
            default: return null;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return 'Aktif';
            case 'timeout': return 'Timeout';
            case 'blocked': return 'Diblokir';
            case 'maintenance': return 'Maintenance';
            default: return status;
        }
    };

    const renderIcon = (source: SourceInfo) => {
        if (!source.icon.startsWith('http')) {
            return <span className="text-4xl">{source.icon}</span>;
        }

        const iconUrl = source.icon;

        return (
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white p-1 shadow-sm border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={iconUrl}
                    alt={source.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://www.google.com/s2/favicons?domain=${source.baseUrl}&sz=128`;
                    }}
                />
            </div>
        );
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen p-4 lg:p-6">
            {/* Page Header */}
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Globe size={20} className="text-[var(--accent-primary)]" />
                    Jelajahi Sumber
                </h1>
                <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Pilih sumber manga favoritmu
                </p>
            </div>

            {/* Filters Toolbar */}
            <div
                className="rounded-xl p-3 sm:p-4 mb-4 sm:mb-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                    {/* Search */}
                    <div className="flex-1 min-w-0 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all text-sm"
                            style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-default)',
                            }}
                        />
                    </div>

                    {/* Language Filter */}
                    <div className="relative">
                        <select
                            value={filterLanguage}
                            onChange={(e) => setFilterLanguage(e.target.value)}
                            className="px-4 py-2 pr-8 rounded-lg focus:outline-none appearance-none cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                            style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-default)',
                            }}
                        >
                            <option value="all">Semua Bahasa</option>
                            {languages.filter(l => l !== 'all').map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                            <Filter size={14} />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 pr-8 rounded-lg focus:outline-none appearance-none cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                            style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-default)',
                            }}
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="timeout">Timeout</option>
                            <option value="blocked">Diblokir</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                            <Filter size={14} />
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-4 py-2 pr-8 rounded-lg focus:outline-none appearance-none cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                            style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-default)',
                            }}
                        >
                            <option value="name">Urutkan: Nama</option>
                            <option value="popularity">Urutkan: Popularitas</option>
                            <option value="status">Urutkan: Status</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                            <Filter size={14} />
                        </div>
                    </div>

                    {/* View Mode Toggle */}
                    <div
                        className="flex rounded-lg p-1"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                    >
                        <button
                            onClick={() => handleViewModeChange('grid')}
                            className="px-3 py-1.5 text-sm rounded-md transition-all"
                            style={{
                                background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                                color: viewMode === 'grid' ? 'var(--kotatsu-on-primary)' : 'var(--text-muted)',
                            }}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => handleViewModeChange('list')}
                            className="px-3 py-1.5 text-sm rounded-md transition-all"
                            style={{
                                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                                color: viewMode === 'list' ? 'var(--kotatsu-on-primary)' : 'var(--text-muted)',
                            }}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sources Grid/List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fadeIn">
                    {filteredSources.map((source, index) => {
                        const statusStyle = getStatusStyle(source.status);
                        return (
                            <Link
                                key={source.id}
                                href={`/source/${source.id}`}
                                className="group rounded-xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent-primary)] animate-fadeInUp"
                                style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    opacity: source.status !== 'active' ? 0.7 : 1,
                                    animationDelay: `${index * 50}ms`
                                }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    {renderIcon(source)}
                                    <span
                                        className="px-2 py-1 text-xs rounded-full flex items-center gap-1.5 font-medium border"
                                        style={{
                                            background: statusStyle.bg,
                                            color: statusStyle.color,
                                            borderColor: statusStyle.border,
                                        }}
                                    >
                                        {getStatusIcon(source.status)}
                                        {getStatusLabel(source.status)}
                                    </span>
                                </div>
                                <h3
                                    className="text-xl font-bold mb-1 transition-colors group-hover:text-[var(--accent-primary)]"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    {source.name}
                                </h3>
                                <p className="text-sm mb-3 font-mono opacity-70" style={{ color: 'var(--text-muted)' }}>
                                    {source.baseUrl}
                                </p>
                                <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                    {source.description}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    <span
                                        className="chip chip-primary text-xs"
                                    >
                                        {source.language}
                                    </span>
                                    {source.genres.slice(0, 2).map((genre) => (
                                        <span
                                            key={genre}
                                            className="chip chip-secondary text-xs"
                                        >
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-3 animate-fadeIn">
                    {filteredSources.map((source, index) => {
                        const statusStyle = getStatusStyle(source.status);
                        return (
                            <Link
                                key={source.id}
                                href={`/source/${source.id}`}
                                className="flex items-center gap-4 rounded-xl p-4 transition-all hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)] animate-fadeInUp"
                                style={{
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border-default)',
                                    opacity: source.status !== 'active' ? 0.7 : 1,
                                    animationDelay: `${index * 50}ms`
                                }}
                            >
                                <div className="flex-shrink-0">
                                    {renderIcon(source)}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold group-hover:text-[var(--accent-primary)]" style={{ color: 'var(--text-primary)' }}>
                                            {source.name}
                                        </h3>
                                        <span
                                            className="px-2 py-0.5 text-xs rounded-full flex items-center gap-1 border"
                                            style={{
                                                background: statusStyle.bg,
                                                color: statusStyle.color,
                                                borderColor: statusStyle.border,
                                            }}
                                        >
                                            {getStatusIcon(source.status)}
                                            {getStatusLabel(source.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                                        {source.description}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="chip chip-primary text-xs hidden sm:inline-flex">
                                        {source.language}
                                    </span>
                                    <ArrowRight size={20} className="text-[var(--text-muted)]" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {filteredSources.length === 0 && (
                <div className="text-center py-10 sm:py-20 animate-fadeIn">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-[var(--text-muted)] opacity-50 sm:w-10 sm:h-10" />
                    </div>
                    <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
                        Tidak ada sumber yang cocok dengan filter.
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setFilterLanguage('all');
                            setFilterStatus('all');
                        }}
                        className="mt-4 px-6 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--kotatsu-on-primary)] font-medium transition-transform hover:scale-105"
                    >
                        Reset filter
                    </button>
                </div>
            )}

            {/* Info Box */}
            <div
                className="mt-6 sm:mt-8 rounded-xl p-4 sm:p-6 flex gap-3 sm:gap-4 animate-slideUp"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
                <div className="flex-shrink-0 text-[var(--accent-primary)]">
                    <Info size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Tentang Sumber
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Sumber manga adalah website tempat data manga diambil. Status sumber dapat berubah sewaktu-waktu
                        tergantung ketersediaan dan aksesibilitas website asli. Sumber dengan status "Diblokir" mungkin
                        memerlukan VPN untuk diakses.
                    </p>
                </div>
            </div>
        </div>
    );
}
