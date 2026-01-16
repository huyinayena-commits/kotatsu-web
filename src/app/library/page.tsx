'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Clock,
    Heart,
    Grid,
    List,
    Trash2,
    Play,
    X,
    FolderOpen,
    Folder,
    Globe,
    BookOpen,
    ImageOff,
    Search,
    Inbox,
    HeartCrack,
    Plus,
    ArrowUp,
    ArrowDown,
    MoreVertical,
    CheckCircle2,
    Tv,
    Skull,
    Book,
    Compass
} from 'lucide-react';
import {
    getLibrary,
    getHistory,
    removeFromLibrary,
    removeFromHistory,
    clearHistory,
    getCategories,
    addCategory,
    deleteCategory,
    reorderCategories,
    setMangaCategory,
    getLibraryByCategory,
    getDisplaySettings,
    setDisplaySettings,
    getSortSettings,
    setSortSettings,
    sortHistory,
    sortLibrary,
    type MangaBookmark,
    type ReadingHistory,
    type Category,
    type ViewMode,
    type HistorySortOption,
    type LibrarySortOption
} from '@/lib/storage';

// Helper to proxy external images to bypass CORS
const getProxiedImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    // Only proxy external URLs (not already proxied or local)
    if (url.startsWith('/api/') || url.startsWith('data:')) return url;
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

type TabType = 'history' | 'library';

export default function LibraryPage() {
    const [activeTab, setActiveTab] = useState<TabType>('history');
    const [library, setLibrary] = useState<MangaBookmark[]>([]);
    const [history, setHistory] = useState<ReadingHistory[]>([]);
    const [mounted, setMounted] = useState(false);

    // Category state
    const [categories, setCategories] = useState<Category[]>([]);
    const [libraryByCategory, setLibraryByCategory] = useState<{ category: Category | null; mangas: MangaBookmark[] }[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryMenuOpen, setCategoryMenuOpen] = useState<string | null>(null); // mangaId-source

    // Display and Sort settings state
    const [historyViewMode, setHistoryViewMode] = useState<ViewMode>('list');
    const [libraryViewMode, setLibraryViewMode] = useState<ViewMode>('grid');
    const [historySort, setHistorySort] = useState<HistorySortOption>('lastRead');
    const [librarySort, setLibrarySort] = useState<LibrarySortOption>('lastAdded');

    // Source filter state for library
    const [selectedSource, setSelectedSource] = useState<string>('all');

    // Load data from LocalStorage on mount
    useEffect(() => {
        setMounted(true);
        refreshData();
        // Load display settings
        const displaySettings = getDisplaySettings();
        setHistoryViewMode(displaySettings.historyMode);
        setLibraryViewMode(displaySettings.libraryMode);
        // Load sort settings
        const sortSettings = getSortSettings();
        setHistorySort(sortSettings.historySort);
        setLibrarySort(sortSettings.librarySort);
    }, []);

    const refreshData = () => {
        setLibrary(getLibrary());
        setHistory(getHistory());
        setCategories(getCategories());
        setLibraryByCategory(getLibraryByCategory());
    };

    // Toggle view mode handlers
    const handleHistoryViewModeChange = (mode: ViewMode) => {
        setHistoryViewMode(mode);
        setDisplaySettings({ historyMode: mode });
    };

    const handleLibraryViewModeChange = (mode: ViewMode) => {
        setLibraryViewMode(mode);
        setDisplaySettings({ libraryMode: mode });
    };

    // Sort handlers
    const handleHistorySortChange = (sort: HistorySortOption) => {
        setHistorySort(sort);
        setSortSettings({ historySort: sort });
    };

    const handleLibrarySortChange = (sort: LibrarySortOption) => {
        setLibrarySort(sort);
        setSortSettings({ librarySort: sort });
    };

    // Get sorted data
    const sortedHistory = sortHistory(history, historySort);
    const sortedLibrary = sortLibrary(library, librarySort);

    // Get unique sources from library for source tabs (normalize to lowercase)
    const uniqueSources = Array.from(new Set(library.map(m => m.source.toLowerCase()))).sort();

    // Filter library by selected source (case-insensitive)
    const filteredLibrary = selectedSource === 'all'
        ? sortedLibrary
        : sortedLibrary.filter(m => m.source.toLowerCase() === selectedSource.toLowerCase());

    const handleRemoveFromLibrary = (mangaId: string, source: string) => {
        removeFromLibrary(mangaId, source);
        refreshData();
    };

    const handleRemoveFromHistory = (mangaId: string, source: string) => {
        removeFromHistory(mangaId, source);
        refreshData();
    };

    const handleClearHistory = () => {
        if (confirm('Hapus semua riwayat baca?')) {
            clearHistory();
            refreshData();
        }
    };

    // Category handlers
    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            addCategory(newCategoryName.trim());
            setNewCategoryName('');
            refreshData();
        }
    };

    const handleDeleteCategory = (categoryId: string) => {
        if (confirm('Hapus kategori ini? Manga akan dipindah ke Uncategorized.')) {
            deleteCategory(categoryId);
            refreshData();
        }
    };

    const handleMoveCategory = (direction: 'up' | 'down', categoryId: string) => {
        const sorted = [...categories].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(c => c.id === categoryId);
        if (direction === 'up' && index > 0) {
            [sorted[index], sorted[index - 1]] = [sorted[index - 1], sorted[index]];
        } else if (direction === 'down' && index < sorted.length - 1) {
            [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
        }
        reorderCategories(sorted.map(c => c.id));
        refreshData();
    };

    const handleSetMangaCategory = (mangaId: string, source: string, categoryId: string | undefined) => {
        setMangaCategory(mangaId, source, categoryId);
        setCategoryMenuOpen(null);
        refreshData();
    };

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Baru saja';
        if (minutes < 60) return `${minutes}m lalu`;
        if (hours < 24) return `${hours}j lalu`;
        if (days < 7) return `${days}h lalu`;

        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 lg:p-6" style={{ background: 'var(--bg-primary)' }}>
                <div className="w-12 h-12 rounded-full animate-spin" style={{ border: '3px solid var(--bg-surface)', borderTopColor: 'var(--accent-primary)' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 lg:p-6 mb-16 lg:mb-0">
            {/* Page Header */}
            <div className="mb-4 sm:mb-6 animate-fadeIn">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <BookOpen className="text-[var(--accent-primary)]" size={20} /> Perpustakaan
                </h1>
            </div>

            <main>
                {/* Tab Switcher */}
                <div className="flex gap-2 mb-4 sm:mb-6 animate-slideDown">
                    <button
                        onClick={() => setActiveTab('history')}
                        className="px-3 sm:px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-sm"
                        style={{
                            background: activeTab === 'history' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                            color: activeTab === 'history' ? 'var(--kotatsu-on-primary)' : 'var(--text-secondary)',
                            border: `1px solid ${activeTab === 'history' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                        }}
                    >
                        <Clock size={14} /> Riwayat ({history.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className="px-3 sm:px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 text-sm"
                        style={{
                            background: activeTab === 'library' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                            color: activeTab === 'library' ? 'var(--kotatsu-on-primary)' : 'var(--text-secondary)',
                            border: `1px solid ${activeTab === 'library' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                        }}
                    >
                        <Heart size={16} fill={activeTab === 'library' ? 'currentColor' : 'none'} /> Bookmark ({library.length})
                    </button>
                </div>

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div className="animate-fadeIn">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                {/* View Mode Toggle */}
                                <div className="flex rounded-lg p-1 gap-1" style={{ background: 'var(--bg-elevated)' }}>
                                    <button
                                        onClick={() => handleHistoryViewModeChange('list')}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${historyViewMode === 'list' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <List size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleHistoryViewModeChange('grid')}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${historyViewMode === 'grid' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <Grid size={16} />
                                    </button>
                                </div>

                                {/* Sort Dropdown */}
                                <select
                                    value={historySort}
                                    onChange={(e) => handleHistorySortChange(e.target.value as HistorySortOption)}
                                    className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
                                    style={{
                                        background: 'var(--bg-elevated)',
                                        borderColor: 'var(--border-default)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="lastRead">Terakhir Dibaca</option>
                                    <option value="nameAZ">Nama A-Z</option>
                                    <option value="nameZA">Nama Z-A</option>
                                </select>
                            </div>

                            {history.length > 0 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 hover:bg-red-500/10 text-red-400 font-medium"
                                >
                                    <Trash2 size={16} /> Hapus Semua
                                </button>
                            )}
                        </div>

                        {history.length > 0 ? (
                            historyViewMode === 'list' ? (
                                // List View
                                <div className="space-y-3">
                                    {sortedHistory.map((item, index) => (
                                        <div
                                            key={`${item.mangaId}-${item.source}`}
                                            className="rounded-2xl border overflow-hidden transition-colors hover:border-[var(--accent-primary)] animate-fadeInUp"
                                            style={{
                                                background: 'var(--bg-surface)',
                                                borderColor: 'var(--border-default)',
                                                animationDelay: `${index * 50}ms`
                                            }}
                                        >
                                            <div className="flex gap-4 p-4">
                                                {/* Cover */}
                                                <Link
                                                    href={`/manga/${item.source}/${item.mangaId}`}
                                                    className="flex-shrink-0"
                                                >
                                                    <div className="w-20 h-28 rounded-lg overflow-hidden bg-[var(--bg-elevated)] relative">
                                                        {item.mangaCover ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={item.mangaCover}
                                                                alt={item.mangaTitle}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                                    if (fallback) fallback.style.display = 'flex';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]" style={{ display: item.mangaCover ? 'none' : 'flex' }}>
                                                            <ImageOff size={24} />
                                                        </div>
                                                    </div>
                                                </Link>

                                                {/* Info */}
                                                <div className="flex-grow min-w-0">
                                                    <Link href={`/manga/${item.source}/${item.mangaId}`}>
                                                        <h3 className="font-medium text-lg truncate hover:text-[var(--accent-primary)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                                                            {item.mangaTitle}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                        Terakhir: Chapter {item.chapterNumber}
                                                    </p>
                                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                                        <Clock size={12} /> {formatTimeAgo(item.lastReadAt)} • <span className="capitalize">{item.source}</span>
                                                    </p>

                                                    {/* Actions */}
                                                    <div className="flex gap-2 mt-3">
                                                        <Link
                                                            href={`/read/${item.source}/${item.mangaId}/${item.chapterId}`}
                                                            className="px-4 py-2 bg-[var(--accent-primary)] hover:brightness-110 text-white text-sm rounded-lg transition-all flex items-center gap-2 font-medium"
                                                        >
                                                            <Play size={14} fill="currentColor" /> Lanjut Baca
                                                        </Link>
                                                        <button
                                                            onClick={() => handleRemoveFromHistory(item.mangaId, item.source)}
                                                            className="px-3 py-2 text-[var(--text-muted)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 text-sm rounded-lg transition-colors"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Grid View
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {sortedHistory.map((item, index) => (
                                        <div
                                            key={`${item.mangaId}-${item.source}`}
                                            className="group relative rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all animate-fadeInUp"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <Link href={`/read/${item.source}/${item.mangaId}/${item.chapterId}`}>
                                                <div className="aspect-[3/4] bg-[var(--bg-elevated)] overflow-hidden relative">
                                                    {item.mangaCover ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={item.mangaCover}
                                                            alt={item.mangaTitle}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]" style={{ display: item.mangaCover ? 'none' : 'flex' }}>
                                                        <BookOpen size={32} />
                                                    </div>
                                                </div>
                                                {/* Source Badge */}
                                                <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-medium rounded text-white bg-black/60 backdrop-blur-sm capitalize">
                                                    {item.source}
                                                </span>
                                                {/* Progress Overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
                                                    <p className="text-white text-sm font-medium line-clamp-2">{item.mangaTitle}</p>
                                                    <p className="text-[var(--accent-primary)] text-xs mt-1 font-medium">Ch. {item.chapterNumber}</p>
                                                </div>
                                            </Link>
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => handleRemoveFromHistory(item.mangaId, item.source)}
                                                className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-[var(--accent-error)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="text-center py-20 animate-fadeIn">
                                <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                                    <Inbox size={40} className="text-[var(--text-muted)] opacity-50" />
                                </div>
                                <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Belum ada riwayat baca.</p>
                                <p className="text-sm text-[var(--text-secondary)] mb-6">Mulai baca chapter manapun dan akan muncul di sini.</p>
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                                >
                                    <Search size={18} /> Mulai Membaca
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Library Tab */}
                {activeTab === 'library' && (
                    <div className="animate-fadeIn">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                {/* View Mode Toggle */}
                                <div className="flex rounded-lg p-1 gap-1" style={{ background: 'var(--bg-elevated)' }}>
                                    <button
                                        onClick={() => handleLibraryViewModeChange('grid')}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${libraryViewMode === 'grid' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <Grid size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleLibraryViewModeChange('list')}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${libraryViewMode === 'list' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>

                                {/* Sort Dropdown */}
                                <select
                                    value={librarySort}
                                    onChange={(e) => handleLibrarySortChange(e.target.value as LibrarySortOption)}
                                    className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
                                    style={{
                                        background: 'var(--bg-elevated)',
                                        borderColor: 'var(--border-default)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="lastAdded">Terakhir Ditambah</option>
                                    <option value="nameAZ">Nama A-Z</option>
                                    <option value="nameZA">Nama Z-A</option>
                                    <option value="category">Kategori</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="px-4 py-2 text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors flex items-center gap-2 font-medium"
                            >
                                <FolderOpen size={16} /> Kelola Kategori
                            </button>
                        </div>

                        {/* Source Tabs */}
                        {uniqueSources.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                                <button
                                    onClick={() => setSelectedSource('all')}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 flex-shrink-0 ${selectedSource === 'all'
                                        ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20'
                                        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                                        }`}
                                >
                                    <Globe size={14} /> Semua ({library.length})
                                </button>
                                {uniqueSources.map((source) => {
                                    const count = library.filter(m => m.source.toLowerCase() === source.toLowerCase()).length;
                                    const getIcon = () => {
                                        switch (source) {
                                            case 'shinigami': return <Skull size={14} />;
                                            case 'komikcast': return <Tv size={14} />;
                                            case 'komiku': return <Book size={14} />;
                                            default: return <Globe size={14} />;
                                        }
                                    };

                                    return (
                                        <button
                                            key={source}
                                            onClick={() => setSelectedSource(source)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 flex-shrink-0 ${selectedSource === source
                                                ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20'
                                                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                                                }`}
                                        >
                                            {getIcon()} <span className="capitalize">{source}</span> ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {filteredLibrary.length > 0 ? (
                            <div className="space-y-8 animate-fadeInUp">
                                {libraryByCategory
                                    .map((group) => {
                                        // Filter mangas by selected source (case-insensitive)
                                        const filteredMangas = selectedSource === 'all'
                                            ? group.mangas
                                            : group.mangas.filter(m => m.source.toLowerCase() === selectedSource.toLowerCase());

                                        if (filteredMangas.length === 0) return null;

                                        return (
                                            <div key={group.category?.id || 'uncategorized'}>
                                                {/* Category Header */}
                                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                                    {group.category ? (
                                                        <><Folder size={20} className="text-[var(--accent-primary)]" /> {group.category.name}</>
                                                    ) : (
                                                        <><List size={20} className="text-[var(--text-muted)]" /> Tanpa Kategori</>
                                                    )}
                                                    <span className="text-[var(--text-muted)] text-sm font-normal bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">
                                                        {filteredMangas.length}
                                                    </span>
                                                </h3>

                                                {/* Manga Grid */}
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                                    {filteredMangas.map((item, index) => (
                                                        <div
                                                            key={`${item.id}-${item.source}`}
                                                            className="group relative rounded-xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 animate-fadeInUp"
                                                            style={{ animationDelay: `${index * 30}ms` }}
                                                        >
                                                            <Link href={`/manga/${item.source}/${item.id}`}>
                                                                {/* Cover */}
                                                                <div className="aspect-[3/4] bg-[var(--bg-elevated)] overflow-hidden relative">
                                                                    {item.cover ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img
                                                                            src={getProxiedImageUrl(item.cover)}
                                                                            alt={item.title}
                                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                            referrerPolicy="no-referrer"
                                                                            loading="lazy"
                                                                            onError={(e) => {
                                                                                // Try with proxy first, then fallback to placeholder
                                                                                const img = e.currentTarget;
                                                                                if (!img.dataset.tried) {
                                                                                    img.dataset.tried = 'true';
                                                                                    // Hide the broken image and show fallback
                                                                                    img.style.display = 'none';
                                                                                    const fallback = img.nextElementSibling as HTMLElement;
                                                                                    if (fallback) fallback.style.display = 'flex';
                                                                                }
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    {/* Fallback placeholder */}
                                                                    <div
                                                                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)]"
                                                                        style={{ display: item.cover ? 'none' : 'flex' }}
                                                                    >
                                                                        <BookOpen size={24} className="text-[var(--text-muted)] opacity-50" />
                                                                    </div>
                                                                </div>

                                                                {/* Title */}
                                                                <div className="p-3">
                                                                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors" style={{ color: 'var(--text-primary)' }}>
                                                                        {item.title}
                                                                    </h3>
                                                                    <p className="text-xs mt-1 capitalize opacity-70" style={{ color: 'var(--text-secondary)' }}>
                                                                        {item.source}
                                                                    </p>
                                                                </div>
                                                            </Link>

                                                            {/* Action Buttons */}
                                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                                                {/* Category Dropdown */}
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            setCategoryMenuOpen(
                                                                                categoryMenuOpen === `${item.id}-${item.source}`
                                                                                    ? null
                                                                                    : `${item.id}-${item.source}`
                                                                            );
                                                                        }}
                                                                        className="p-1.5 bg-black/50 hover:bg-[var(--accent-primary)] text-white rounded-full backdrop-blur-sm transition-colors"
                                                                    >
                                                                        <Folder size={14} />
                                                                    </button>

                                                                    {/* Dropdown Menu */}
                                                                    {categoryMenuOpen === `${item.id}-${item.source}` && (
                                                                        <div
                                                                            className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border z-50 overflow-hidden animate-scaleIn origin-top-right"
                                                                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                                                                        >
                                                                            <div className="p-2 border-b border-[var(--border-subtle)]">
                                                                                <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)]">Pindah ke...</p>
                                                                            </div>
                                                                            <div className="max-h-[200px] overflow-y-auto">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.preventDefault();
                                                                                        handleSetMangaCategory(item.id, item.source, undefined);
                                                                                    }}
                                                                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-2 ${!item.categoryId ? 'text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}
                                                                                >
                                                                                    <List size={14} /> Tanpa Kategori
                                                                                    {!item.categoryId && <CheckCircle2 size={12} className="ml-auto" />}
                                                                                </button>
                                                                                {categories.map(cat => (
                                                                                    <button
                                                                                        key={cat.id}
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            handleSetMangaCategory(item.id, item.source, cat.id);
                                                                                        }}
                                                                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-2 ${item.categoryId === cat.id ? 'text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}
                                                                                    >
                                                                                        <Folder size={14} /> {cat.name}
                                                                                        {item.categoryId === cat.id && <CheckCircle2 size={12} className="ml-auto" />}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Remove Button */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handleRemoveFromLibrary(item.id, item.source);
                                                                    }}
                                                                    className="p-1.5 bg-black/50 hover:bg-[var(--accent-error)] text-white rounded-full backdrop-blur-sm transition-colors"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>

                                                            {/* Bookmarked Badge */}
                                                            <div className="absolute top-2 left-2">
                                                                <div className="p-1.5 bg-black/50 rounded-full backdrop-blur-sm text-white">
                                                                    <Heart size={14} fill="currentColor" className="text-[var(--accent-primary)]" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }).filter(Boolean)}
                            </div>
                        ) : (
                            <div className="text-center py-20 animate-fadeIn">
                                <div className="w-20 h-20 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mx-auto mb-4">
                                    <HeartCrack size={40} className="text-[var(--text-muted)] opacity-50" />
                                </div>
                                <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Belum ada manga tersimpan.</p>
                                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                                    Klik tombol <Heart size={12} fill="currentColor" className="inline text-[var(--accent-primary)]" /> di halaman detail manga untuk menyimpan.
                                </p>
                                <Link
                                    href="/explore"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
                                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                                >
                                    <Compass size={18} /> Jelajahi Manga
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Category Management Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
                        <div className="rounded-2xl border w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl animate-scaleIn" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
                                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                    <FolderOpen size={20} className="text-[var(--accent-primary)]" /> Kelola Kategori
                                </h3>
                                <button
                                    onClick={() => setShowCategoryModal(false)}
                                    className="p-1 rounded-full hover:bg-[var(--bg-elevated)] transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                                {/* Add New Category */}
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <Folder size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                        <input
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder="Nama kategori baru..."
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                                            style={{
                                                background: 'var(--bg-elevated)',
                                                border: '1px solid var(--border-subtle)',
                                                color: 'var(--text-primary)'
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={!newCategoryName.trim()}
                                        className="px-4 py-2 bg-[var(--accent-primary)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {/* Category List */}
                                <div className="space-y-2">
                                    <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-50 pl-1" style={{ color: 'var(--text-muted)' }}>Daftar Kategori</div>
                                    {categories.length > 0 ? (
                                        [...categories].sort((a, b) => a.order - b.order).map((cat, index, arr) => (
                                            <div
                                                key={cat.id}
                                                className="flex items-center gap-3 p-3 rounded-xl border group transition-colors hover:border-[var(--border-default)]"
                                                style={{ background: 'var(--bg-elevated)', borderColor: 'transparent' }}
                                            >
                                                <MoreVertical size={16} className="text-[var(--text-muted)] cursor-grab" />
                                                <span className="flex-grow font-medium" style={{ color: 'var(--text-primary)' }}>{cat.name}</span>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleMoveCategory('up', cat.id)}
                                                        disabled={index === 0}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] disabled:opacity-30"
                                                    >
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveCategory('down', cat.id)}
                                                        disabled={index === arr.length - 1}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] disabled:opacity-30"
                                                    >
                                                        <ArrowDown size={14} />
                                                    </button>
                                                    <div className="w-px h-4 bg-[var(--border-subtle)] mx-1"></div>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--accent-error)]/10 text-[var(--accent-error)]"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 border border-dashed rounded-xl" style={{ borderColor: 'var(--border-default)' }}>
                                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                                Belum ada kategori.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t py-8 mt-12 animate-fadeIn" style={{ borderColor: 'var(--border-default)' }}>
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm font-medium opacity-60" style={{ color: 'var(--text-secondary)' }}>
                        Kotatsu Web Clone • Data tersimpan di browser
                    </p>
                </div>
            </footer>
        </div>
    );
}
