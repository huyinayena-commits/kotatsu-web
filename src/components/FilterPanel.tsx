'use client';

import { useState } from 'react';

export interface FilterOptions {
    status: string[];
    genres: string[];
    language: string;
}

interface FilterPanelProps {
    onFilterChange: (filters: FilterOptions) => void;
    availableGenres?: string[];
    showLanguage?: boolean;
}

const STATUS_OPTIONS = [
    { id: 'all', label: 'Semua Status' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'completed', label: 'Completed' },
    { id: 'hiatus', label: 'Hiatus' },
];

const DEFAULT_GENRES = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
    'Horror', 'Isekai', 'Martial Arts', 'Mystery', 'Romance',
    'School', 'Sci-Fi', 'Shounen', 'Shoujo', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller', 'Tragedy', 'Webtoon'
];

export default function FilterPanel({
    onFilterChange,
    availableGenres = DEFAULT_GENRES,
    showLanguage = false
}: FilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [language, setLanguage] = useState('all');

    const handleStatusToggle = (status: string) => {
        let newStatus: string[];
        if (status === 'all') {
            newStatus = [];
        } else {
            newStatus = selectedStatus.includes(status)
                ? selectedStatus.filter(s => s !== status)
                : [...selectedStatus, status];
        }
        setSelectedStatus(newStatus);
        onFilterChange({ status: newStatus, genres: selectedGenres, language });
    };

    const handleGenreToggle = (genre: string) => {
        const newGenres = selectedGenres.includes(genre)
            ? selectedGenres.filter(g => g !== genre)
            : [...selectedGenres, genre];
        setSelectedGenres(newGenres);
        onFilterChange({ status: selectedStatus, genres: newGenres, language });
    };

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        onFilterChange({ status: selectedStatus, genres: selectedGenres, language: lang });
    };

    const clearAllFilters = () => {
        setSelectedStatus([]);
        setSelectedGenres([]);
        setLanguage('all');
        onFilterChange({ status: [], genres: [], language: 'all' });
    };

    const activeFilterCount = selectedStatus.length + selectedGenres.length + (language !== 'all' ? 1 : 0);

    return (
        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            {/* Toggle Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">🔍</span>
                    <span className="text-white font-medium">Filter</span>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </button>

            {/* Filter Content */}
            {isExpanded && (
                <div className="p-4 border-t border-slate-700/50 space-y-4">
                    {/* Status Filter */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Status</h4>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleStatusToggle(option.id)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${option.id === 'all'
                                            ? selectedStatus.length === 0
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700 text-slate-400 hover:text-white'
                                            : selectedStatus.includes(option.id)
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Genre Filter */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Genre</h4>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
                            {availableGenres.map((genre) => (
                                <button
                                    key={genre}
                                    onClick={() => handleGenreToggle(genre)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedGenres.includes(genre)
                                            ? 'bg-pink-600 text-white'
                                            : 'bg-slate-700 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Filter */}
                    {showLanguage && (
                        <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-2">Bahasa</h4>
                            <select
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="bg-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm border border-slate-600 focus:outline-none focus:border-purple-500"
                            >
                                <option value="all">Semua Bahasa</option>
                                <option value="id">Indonesia</option>
                                <option value="en">English</option>
                                <option value="jp">Japanese</option>
                                <option value="kr">Korean</option>
                            </select>
                        </div>
                    )}

                    {/* Clear Filters */}
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            ✕ Hapus Semua Filter
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
