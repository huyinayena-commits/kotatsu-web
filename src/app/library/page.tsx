'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
    type MangaBookmark,
    type ReadingHistory,
    type Category
} from '@/lib/storage';

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

    // Load data from LocalStorage on mount
    useEffect(() => {
        setMounted(true);
        refreshData();
    }, []);

    const refreshData = () => {
        setLibrary(getLibrary());
        setHistory(getHistory());
        setCategories(getCategories());
        setLibraryByCategory(getLibraryByCategory());
    };

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
        if (minutes < 60) return `${minutes} menit lalu`;
        if (hours < 24) return `${hours} jam lalu`;
        if (days < 7) return `${days} hari lalu`;

        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-purple-500/20">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
                            <span>←</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                📚 Kotatsu Web
                            </span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Page Title */}
                <h1 className="text-3xl font-bold text-white mb-6">📚 Perpustakaan Saya</h1>

                {/* Tab Switcher */}
                <div className="flex gap-2 mb-8">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'history'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                            }`}
                    >
                        🕐 Riwayat ({history.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'library'
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700'
                            }`}
                    >
                        ❤️ Bookmark ({library.length})
                    </button>
                </div>

                {/* History Tab */}
                {activeTab === 'history' && (
                    <div>
                        {history.length > 0 && (
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={handleClearHistory}
                                    className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    🗑️ Hapus Semua
                                </button>
                            </div>
                        )}

                        {history.length > 0 ? (
                            <div className="space-y-3">
                                {history.map((item) => (
                                    <div
                                        key={`${item.mangaId}-${item.source}`}
                                        className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-purple-500/30 transition-colors"
                                    >
                                        <div className="flex gap-4 p-4">
                                            {/* Cover */}
                                            <Link
                                                href={`/manga/${item.source}/${item.mangaId}`}
                                                className="flex-shrink-0"
                                            >
                                                <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-700">
                                                    {item.mangaCover ? (
                                                        <img
                                                            src={item.mangaCover}
                                                            alt={item.mangaTitle}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                                            📖
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Info */}
                                            <div className="flex-grow min-w-0">
                                                <Link href={`/manga/${item.source}/${item.mangaId}`}>
                                                    <h3 className="text-white font-medium text-lg truncate hover:text-purple-300 transition-colors">
                                                        {item.mangaTitle}
                                                    </h3>
                                                </Link>
                                                <p className="text-slate-400 text-sm mt-1">
                                                    Terakhir: Chapter {item.chapterNumber}
                                                </p>
                                                <p className="text-slate-500 text-xs mt-1">
                                                    {formatTimeAgo(item.lastReadAt)}
                                                </p>

                                                {/* Actions */}
                                                <div className="flex gap-2 mt-3">
                                                    <Link
                                                        href={`/read/${item.source}/${item.mangaId}/${item.chapterId}`}
                                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                                                    >
                                                        ▶️ Lanjut Baca
                                                    </Link>
                                                    <button
                                                        onClick={() => handleRemoveFromHistory(item.mangaId, item.source)}
                                                        className="px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-sm rounded-lg transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-6xl mb-4">📭</p>
                                <p className="text-slate-400 text-lg">Belum ada riwayat baca.</p>
                                <Link href="/" className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
                                    Mulai membaca sekarang →
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Library Tab */}
                {activeTab === 'library' && (
                    <div>
                        {/* Category Management Button */}
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="px-4 py-2 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                            >
                                📂 Kelola Kategori
                            </button>
                        </div>

                        {library.length > 0 ? (
                            <div className="space-y-8">
                                {libraryByCategory.map((group) => (
                                    <div key={group.category?.id || 'uncategorized'}>
                                        {/* Category Header */}
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                            {group.category ? (
                                                <>📁 {group.category.name}</>
                                            ) : (
                                                <>📋 Tanpa Kategori</>
                                            )}
                                            <span className="text-slate-500 text-sm font-normal">
                                                ({group.mangas.length})
                                            </span>
                                        </h3>

                                        {/* Manga Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {group.mangas.map((item) => (
                                                <div
                                                    key={`${item.id}-${item.source}`}
                                                    className="group relative rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                                                >
                                                    <Link href={`/manga/${item.source}/${item.id}`}>
                                                        {/* Cover */}
                                                        <div className="aspect-[3/4] bg-slate-700 overflow-hidden">
                                                            {item.cover ? (
                                                                <img
                                                                    src={item.cover}
                                                                    alt={item.title}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23374151" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14">📖</text></svg>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-4xl">
                                                                    📖
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Title */}
                                                        <div className="p-3">
                                                            <h3 className="text-sm font-medium text-slate-200 line-clamp-2 group-hover:text-purple-300 transition-colors">
                                                                {item.title}
                                                            </h3>
                                                            <p className="text-xs text-slate-500 mt-1 capitalize">
                                                                {item.source}
                                                            </p>
                                                        </div>
                                                    </Link>

                                                    {/* Action Buttons */}
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
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
                                                                className="p-2 bg-black/50 hover:bg-purple-500/80 text-white rounded-full"
                                                            >
                                                                📁
                                                            </button>

                                                            {/* Dropdown Menu */}
                                                            {categoryMenuOpen === `${item.id}-${item.source}` && (
                                                                <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 overflow-hidden">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handleSetMangaCategory(item.id, item.source, undefined);
                                                                        }}
                                                                        className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${!item.categoryId ? 'text-purple-400' : 'text-slate-300'}`}
                                                                    >
                                                                        📋 Tanpa Kategori
                                                                    </button>
                                                                    {categories.map(cat => (
                                                                        <button
                                                                            key={cat.id}
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                handleSetMangaCategory(item.id, item.source, cat.id);
                                                                            }}
                                                                            className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-700 ${item.categoryId === cat.id ? 'text-purple-400' : 'text-slate-300'}`}
                                                                        >
                                                                            📁 {cat.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Remove Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleRemoveFromLibrary(item.id, item.source);
                                                            }}
                                                            className="p-2 bg-black/50 hover:bg-red-500/80 text-white rounded-full"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>

                                                    {/* Bookmarked Badge */}
                                                    <div className="absolute top-2 left-2">
                                                        <span className="text-2xl">❤️</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-6xl mb-4">💔</p>
                                <p className="text-slate-400 text-lg">Belum ada manga tersimpan.</p>
                                <p className="text-slate-500 text-sm mt-2">
                                    Klik tombol ❤️ di halaman detail manga untuk menyimpan.
                                </p>
                                <Link href="/" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
                                    Jelajahi manga →
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Category Management Modal */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md max-h-[80vh] overflow-hidden">
                            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">📂 Kelola Kategori</h3>
                                <button
                                    onClick={() => setShowCategoryModal(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                                {/* Add New Category */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Nama kategori baru..."
                                        className="flex-grow px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                    />
                                    <button
                                        onClick={handleAddCategory}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
                                    >
                                        + Tambah
                                    </button>
                                </div>

                                {/* Category List */}
                                {categories.length > 0 ? (
                                    <div className="space-y-2">
                                        {[...categories].sort((a, b) => a.order - b.order).map((cat, index, arr) => (
                                            <div
                                                key={cat.id}
                                                className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg"
                                            >
                                                <span className="flex-grow text-white">📁 {cat.name}</span>

                                                {/* Reorder Buttons */}
                                                <button
                                                    onClick={() => handleMoveCategory('up', cat.id)}
                                                    disabled={index === 0}
                                                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    ↑
                                                </button>
                                                <button
                                                    onClick={() => handleMoveCategory('down', cat.id)}
                                                    disabled={index === arr.length - 1}
                                                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                                >
                                                    ↓
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.id)}
                                                    className="p-1 text-red-400 hover:text-red-300"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-500 text-center py-4">
                                        Belum ada kategori. Buat kategori baru di atas.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-6 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">
                        Kotatsu Web Clone • Data tersimpan di browser
                    </p>
                </div>
            </footer>
        </div>
    );
}
