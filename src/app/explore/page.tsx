'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

// Available sources with metadata
const SOURCES: SourceInfo[] = [
    {
        id: 'shinigami',
        name: 'Shinigami',
        language: 'Indonesia',
        status: 'active',
        description: 'Sumber manga populer dengan update cepat dan koleksi lengkap.',
        genres: ['Action', 'Romance', 'Fantasy', 'Comedy', 'Drama'],
        baseUrl: 'id.shinigami.asia',
        icon: '💀',
    },
    {
        id: 'komikcast',
        name: 'Komikcast',
        language: 'Indonesia',
        status: 'timeout',
        description: 'Sumber manga dengan terjemahan berkualitas tinggi.',
        genres: ['Action', 'Adventure', 'Fantasy', 'Isekai'],
        baseUrl: 'komikcast.lol',
        icon: '📺',
    },
    {
        id: 'komiku',
        name: 'Komiku',
        language: 'Indonesia',
        status: 'blocked',
        description: 'Koleksi manga dan manhwa Indonesia.',
        genres: ['Manhwa', 'Manhua', 'Action', 'Romance'],
        baseUrl: 'komiku.id',
        icon: '📚',
    },
    {
        id: 'mangadex',
        name: 'MangaDex',
        language: 'Multi',
        status: 'maintenance',
        description: 'Platform manga internasional dengan multi-bahasa.',
        genres: ['All Genres'],
        baseUrl: 'mangadex.org',
        icon: '🌐',
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

    // Get unique languages
    const languages = ['all', ...new Set(SOURCES.map(s => s.language))];

    // Filter and sort sources
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
                    // Active sources first
                    const statusOrder = { active: 0, timeout: 1, maintenance: 2, blocked: 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                case 'status':
                    return a.status.localeCompare(b.status);
                default:
                    return 0;
            }
        });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'timeout': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'blocked': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'maintenance': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'active': return '✓ Aktif';
            case 'timeout': return '⏱️ Timeout';
            case 'blocked': return '🚫 Diblokir';
            case 'maintenance': return '🔧 Maintenance';
            default: return status;
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-purple-500/20">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-purple-400 hover:text-purple-300">
                                ← Kembali
                            </Link>
                            <h1 className="text-2xl font-bold text-white">
                                🔍 Jelajahi Sumber
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/library"
                                className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-all"
                            >
                                📚
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
                {/* Filters Toolbar */}
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="flex-grow min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Cari sumber..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900/50 text-white px-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        {/* Language Filter */}
                        <select
                            value={filterLanguage}
                            onChange={(e) => setFilterLanguage(e.target.value)}
                            className="bg-slate-900/50 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
                        >
                            <option value="all">Semua Bahasa</option>
                            {languages.filter(l => l !== 'all').map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-900/50 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="timeout">Timeout</option>
                            <option value="blocked">Diblokir</option>
                            <option value="maintenance">Maintenance</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-slate-900/50 text-slate-300 px-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-purple-500"
                        >
                            <option value="name">Urutkan: Nama</option>
                            <option value="popularity">Urutkan: Popularitas</option>
                            <option value="status">Urutkan: Status</option>
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700">
                            <button
                                onClick={() => handleViewModeChange('grid')}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                ⊞
                            </button>
                            <button
                                onClick={() => handleViewModeChange('list')}
                                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                ☰
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sources Grid/List */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredSources.map((source) => (
                            <Link
                                key={source.id}
                                href={`/?source=${source.id}`}
                                className={`group bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 hover:border-purple-500/50 transition-all hover:-translate-y-1 ${source.status !== 'active' ? 'opacity-70' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-4xl">{source.icon}</span>
                                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(source.status)}`}>
                                        {getStatusLabel(source.status)}
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                                    {source.name}
                                </h3>
                                <p className="text-slate-400 text-sm mb-3">{source.baseUrl}</p>
                                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{source.description}</p>
                                <div className="flex flex-wrap gap-1">
                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                                        {source.language}
                                    </span>
                                    {source.genres.slice(0, 2).map((genre) => (
                                        <span key={genre} className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-xs rounded">
                                            {genre}
                                        </span>
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredSources.map((source) => (
                            <Link
                                key={source.id}
                                href={`/?source=${source.id}`}
                                className={`flex items-center gap-4 bg-slate-800/30 rounded-2xl border border-slate-700/50 p-4 hover:border-purple-500/50 transition-all ${source.status !== 'active' ? 'opacity-70' : ''}`}
                            >
                                <span className="text-3xl flex-shrink-0">{source.icon}</span>
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold text-white">{source.name}</h3>
                                        <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(source.status)}`}>
                                            {getStatusLabel(source.status)}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm">{source.description}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                                        {source.language}
                                    </span>
                                    <span className="text-slate-500">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {filteredSources.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-6xl mb-4">🔍</p>
                        <p className="text-slate-400 text-lg">Tidak ada sumber yang cocok dengan filter.</p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setFilterLanguage('all');
                                setFilterStatus('all');
                            }}
                            className="text-purple-400 hover:text-purple-300 mt-2"
                        >
                            Reset filter
                        </button>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-8 bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-2">ℹ️ Tentang Sumber</h3>
                    <p className="text-slate-400 text-sm">
                        Sumber manga adalah website tempat data manga diambil. Status sumber dapat berubah sewaktu-waktu
                        tergantung ketersediaan dan aksesibilitas website asli. Sumber dengan status "Diblokir" mungkin
                        memerlukan VPN untuk diakses.
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-6 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">
                        Kotatsu Web Clone • {SOURCES.length} sumber tersedia
                    </p>
                </div>
            </footer>
        </div>
    );
}
