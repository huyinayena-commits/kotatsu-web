import { Search, Filter, Grid, List, ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import type { ViewMode } from '@/lib/storage';

interface FilterToolbarProps {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    filterLanguage: string;
    setFilterLanguage: (l: string) => void;
    filterStatus: string;
    setFilterStatus: (s: string) => void;
    sortBy: string;
    setSortBy: (s: string) => void;
    viewMode: ViewMode;
    setViewMode: (m: ViewMode) => void;
    languages: string[];
}

export function FilterToolbar({
    searchQuery,
    setSearchQuery,
    filterLanguage,
    setFilterLanguage,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    languages
}: FilterToolbarProps) {
    const hasActiveFilters = filterLanguage !== 'all' || filterStatus !== 'all' || searchQuery.length > 0;

    const clearFilters = () => {
        setSearchQuery('');
        setFilterLanguage('all');
        setFilterStatus('all');
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari sumber manga..."
                    className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 focus:border-[var(--accent-primary)] transition-all text-sm"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
                {/* Filter Icon */}
                <div className="flex items-center gap-2 text-[var(--text-muted)] mr-1">
                    <SlidersHorizontal size={16} />
                    <span className="text-xs font-medium hidden sm:inline">Filter:</span>
                </div>

                {/* Language Filter */}
                <div className="relative">
                    <select
                        value={filterLanguage}
                        onChange={(e) => setFilterLanguage(e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${filterLanguage !== 'all'
                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--accent-primary)]/50'
                            } border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30`}
                    >
                        <option value="all">🌍 Semua Bahasa</option>
                        {languages.filter(l => l !== 'all').map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-current pointer-events-none opacity-60" />
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${filterStatus !== 'all'
                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/30'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--accent-primary)]/50'
                            } border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30`}
                    >
                        <option value="all">📊 Semua Status</option>
                        <option value="active">✅ Aktif</option>
                        <option value="timeout">⏳ Timeout</option>
                        <option value="blocked">🚫 Diblokir</option>
                        <option value="maintenance">🔧 Maintenance</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-current pointer-events-none opacity-60" />
                </div>

                {/* Sort Filter */}
                <div className="relative">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 cursor-pointer transition-all"
                    >
                        <option value="name">A-Z Nama</option>
                        <option value="popularity">📈 Popularitas</option>
                        <option value="status">Status</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                    >
                        <X size={12} />
                        Reset
                    </button>
                )}

                {/* Spacer */}
                <div className="flex-grow" />

                {/* View Mode Toggle */}
                <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-default)]">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all touch-target-sm ${viewMode === 'grid'
                                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                            }`}
                        title="Grid View"
                    >
                        <Grid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all touch-target-sm ${viewMode === 'list'
                                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                            }`}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
