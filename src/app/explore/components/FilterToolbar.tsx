
import { Search, Filter, Grid, List, ChevronDown } from 'lucide-react';
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
    return (
        <div className="sticky top-20 z-10 sm:static mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar - Full width on mobile, flexible on desktop */}
                <div className="relative flex-grow">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari sumber manga..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all shadow-sm"
                    />
                </div>

                {/* Filters - Scrollable row on mobile */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">

                    {/* Language Filter */}
                    <div className="relative flex-shrink-0">
                        <select
                            value={filterLanguage}
                            onChange={(e) => setFilterLanguage(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer transition-all shadow-sm min-w-[140px]"
                        >
                            <option value="all">Semua Bahasa</option>
                            {languages.filter(l => l !== 'all').map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative flex-shrink-0">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer transition-all shadow-sm min-w-[130px]"
                        >
                            <option value="all">Semua Status</option>
                            <option value="active">Aktif</option>
                            <option value="timeout">Timeout</option>
                            <option value="blocked">Diblokir</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>

                    {/* Sort Filter */}
                    <div className="relative flex-shrink-0">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer transition-all shadow-sm min-w-[150px]"
                        >
                            <option value="name">Nama (A-Z)</option>
                            <option value="popularity">Popularitas</option>
                            <option value="status">Status</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>

                    <div className="w-px h-8 bg-[var(--border-default)] mx-1 flex-shrink-0"></div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-default)] flex-shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            title="Grid View"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
