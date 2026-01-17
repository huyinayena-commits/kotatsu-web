'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Info,
    Globe,
    Compass
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
        baseUrl: 'id.mgkomik.cc',
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


    if (!mounted) return null;

    return (
        <div className="min-h-screen p-4 lg:p-6 mb-20 lg:mb-0 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10 animate-fadeIn relative">
                <div className="relative z-10">
                    <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                        <span className="p-2.5 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20 shadow-lg shadow-[var(--accent-primary)]/5">
                            <Compass size={28} />
                        </span>
                        Jelajahi Sumber
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)] max-w-xl leading-relaxed">
                        Temukan dan tambahkan sumber manga favoritmu untuk mulai membaca. Pastikan memilih sumber yang aktif dan stabil.
                    </p>
                </div>

                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* Toolbar */}
            <div className="animate-fadeInUp" style={{ animationDelay: '100ms' }}>
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
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                            : 'space-y-3'
                        } 
                        animate-fadeInUp
                    `}
                    style={{ animationDelay: '200ms' }}
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
                <div className="text-center py-16 sm:py-24 animate-fadeIn">
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-6 ring-4 ring-[var(--bg-surface)] shadow-lg">
                        <Search size={36} className="text-[var(--text-muted)] opacity-50" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-[var(--text-primary)]">Tidak Ditemukan</h3>
                    <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto">
                        Maaf, tidak ada sumber yang cocok dengan kata kunci atau filter yang kamu pilih.
                    </p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setFilterLanguage('all');
                            setFilterStatus('all');
                        }}
                        className="px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white font-medium hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[var(--accent-primary)]/20"
                    >
                        Reset Filter
                    </button>
                </div>
            )}

            {/* Info Box */}
            <div
                className="mt-12 rounded-2xl p-6 flex flex-col sm:flex-row gap-4 sm:items-start animate-slideUp border border-[var(--border-default)]"
                style={{
                    background: 'linear-gradient(to bottom right, var(--bg-surface), var(--bg-elevated))',
                    animationDelay: '300ms'
                }}
            >
                <div className="flex-shrink-0 p-3 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] w-fit">
                    <Info size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold mb-2 text-[var(--text-primary)]">
                        Tentang Status Sumber
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        Sumber manga diambil dari website pihak ketiga. Status <span className="font-bold text-green-500">Aktif</span> berarti extension berjalan normal.
                        Status <span className="font-bold text-orange-500">Timeout</span> atau <span className="font-bold text-red-500">Diblokir</span> mungkin terjadi karena gangguan server asli atau blokir ISP (coba gunakan VPN/DNS).
                    </p>
                </div>
            </div>
        </div>
    );
}
