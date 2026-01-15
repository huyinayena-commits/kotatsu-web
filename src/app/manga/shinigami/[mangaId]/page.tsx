'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
    isInLibrary,
    toggleLibrary,
    getLastRead,
    isChapterRead,
    markChaptersAsRead,
    markChaptersAsUnread,
    type ReadingHistory
} from '@/lib/storage';

interface Chapter {
    id: string;
    number: number;
    title: string;
    releaseDate: string;
}

interface MangaDetail {
    id: string;
    title: string;
    altTitle: string | null;
    cover: string;
    largeCover: string | null;
    description: string;
    status: string;
    genres: string[];
    authors: string[];
    artists: string[];
    rating: number | null;
    views: number | null;
    chapters: Chapter[];
    totalChapters: number;
}

interface APIResponse {
    success: boolean;
    data: MangaDetail;
    error?: string;
}

export default function MangaDetailPage() {
    const params = useParams();
    const mangaId = params.mangaId as string;

    const [manga, setManga] = useState<MangaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Bookmark & History State (Langkah 3 & 4)
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [lastRead, setLastRead] = useState<ReadingHistory | null>(null);
    const [readChapterIds, setReadChapterIds] = useState<string[]>([]);

    // Multi-select state
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

    useEffect(() => {
        if (mangaId) {
            fetchMangaDetail();
            checkBookmarkStatus();
            checkReadingHistory();
        }
    }, [mangaId]);

    const fetchMangaDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/sources/shinigami/${mangaId}`);
            const data: APIResponse = await response.json();

            if (data.success) {
                setManga(data.data);
                // Update read chapters list after manga loads
                updateReadChapters(data.data.chapters);
            } else {
                setError(data.error || 'Gagal memuat data');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    // Cek status bookmark dari LocalStorage
    const checkBookmarkStatus = () => {
        const bookmarked = isInLibrary(mangaId, 'shinigami');
        setIsBookmarked(bookmarked);
    };

    // Cek history untuk fitur "Lanjut Baca"
    const checkReadingHistory = () => {
        const history = getLastRead(mangaId, 'shinigami');
        setLastRead(history);
    };

    // Update daftar chapter yang sudah dibaca
    const updateReadChapters = (chapters: Chapter[]) => {
        const readIds = chapters
            .filter(ch => isChapterRead(mangaId, 'shinigami', ch.id))
            .map(ch => ch.id);
        setReadChapterIds(readIds);
    };

    // Multi-select handlers
    const toggleChapterSelection = (chapterId: string) => {
        setSelectedChapters(prev =>
            prev.includes(chapterId)
                ? prev.filter(id => id !== chapterId)
                : [...prev, chapterId]
        );
    };

    const selectAllChapters = () => {
        if (!manga) return;
        setSelectedChapters(manga.chapters.map(ch => ch.id));
    };

    const deselectAllChapters = () => {
        setSelectedChapters([]);
    };

    const handleMarkSelectedAsRead = () => {
        if (selectedChapters.length === 0) return;
        markChaptersAsRead(mangaId, 'shinigami', selectedChapters);
        setReadChapterIds(prev => [...new Set([...prev, ...selectedChapters])]);
        exitSelectMode();
    };

    const handleMarkSelectedAsUnread = () => {
        if (selectedChapters.length === 0) return;
        markChaptersAsUnread(mangaId, 'shinigami', selectedChapters);
        setReadChapterIds(prev => prev.filter(id => !selectedChapters.includes(id)));
        exitSelectMode();
    };

    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedChapters([]);
    };

    // Toggle Bookmark Handler (Langkah 3)
    const handleToggleBookmark = () => {
        if (!manga) return;

        const nowBookmarked = toggleLibrary({
            id: manga.id,
            title: manga.title,
            cover: manga.cover,
            source: 'shinigami',
        });

        setIsBookmarked(nowBookmarked);
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Get first chapter for "Mulai Baca"
    const getFirstChapter = () => {
        if (!manga || manga.chapters.length === 0) return null;
        return manga.chapters[0]; // First chapter (ascending order)
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !manga) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-xl mb-4">❌ {error || 'Manga tidak ditemukan'}</p>
                    <Link href="/" className="text-purple-400 hover:text-purple-300 underline">
                        ← Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    const firstChapter = getFirstChapter();

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

                        {/* Library Link */}
                        <Link
                            href="/library"
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            📚 Perpustakaan
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Manga Info Section */}
                <div className="flex flex-col md:flex-row gap-8 mb-10">
                    {/* Cover */}
                    <div className="flex-shrink-0">
                        <div className="w-64 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/20 border border-purple-500/30">
                            <img
                                src={manga.largeCover || manga.cover}
                                alt={manga.title}
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><rect fill="%23374151" width="100" height="140"/><text x="50" y="70" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">No Image</text></svg>';
                                }}
                            />
                        </div>

                        {/* Action Buttons (Mobile) */}
                        <div className="mt-4 space-y-3 md:hidden">
                            {/* Continue/Start Reading Button (Langkah 4) */}
                            {lastRead ? (
                                <Link
                                    href={`/read/shinigami/${manga.id}/${lastRead.chapterId}`}
                                    className="block w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl text-center transition-all shadow-lg shadow-purple-500/30"
                                >
                                    ▶️ Lanjut Chapter {lastRead.chapterNumber}
                                </Link>
                            ) : firstChapter ? (
                                <Link
                                    href={`/read/shinigami/${manga.id}/${firstChapter.id}`}
                                    className="block w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl text-center transition-all shadow-lg shadow-purple-500/30"
                                >
                                    ▶️ Mulai Baca
                                </Link>
                            ) : null}

                            {/* Bookmark Button (Langkah 3) */}
                            <button
                                onClick={handleToggleBookmark}
                                className={`w-full py-3 px-4 font-medium rounded-xl text-center transition-all ${isBookmarked
                                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/30'
                                    : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-700/50'
                                    }`}
                            >
                                {isBookmarked ? '❤️ Tersimpan' : '🤍 Simpan ke Library'}
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-grow">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{manga.title}</h1>
                        {manga.altTitle && (
                            <p className="text-slate-400 text-lg mb-4">{manga.altTitle}</p>
                        )}

                        {/* Status Badge */}
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4
                            ${manga.status === 'Ongoing' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                manga.status === 'Completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                            {manga.status}
                        </span>

                        {/* Action Buttons (Desktop) */}
                        <div className="hidden md:flex gap-3 mb-6">
                            {/* Continue/Start Reading Button */}
                            {lastRead ? (
                                <Link
                                    href={`/read/shinigami/${manga.id}/${lastRead.chapterId}`}
                                    className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl text-center transition-all shadow-lg shadow-purple-500/30"
                                >
                                    ▶️ Lanjut Chapter {lastRead.chapterNumber}
                                </Link>
                            ) : firstChapter ? (
                                <Link
                                    href={`/read/shinigami/${manga.id}/${firstChapter.id}`}
                                    className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl text-center transition-all shadow-lg shadow-purple-500/30"
                                >
                                    ▶️ Mulai Baca
                                </Link>
                            ) : null}

                            {/* Bookmark Button */}
                            <button
                                onClick={handleToggleBookmark}
                                className={`py-3 px-6 font-medium rounded-xl text-center transition-all ${isBookmarked
                                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50 hover:bg-pink-500/30'
                                    : 'bg-slate-800/50 text-slate-300 border border-slate-700 hover:bg-slate-700/50'
                                    }`}
                            >
                                {isBookmarked ? '❤️ Tersimpan' : '🤍 Simpan'}
                            </button>
                        </div>

                        {/* Meta Info */}
                        <div className="space-y-2 mb-6">
                            {manga.authors.length > 0 && (
                                <p className="text-slate-300">
                                    <span className="text-slate-500">Author:</span> {manga.authors.join(', ')}
                                </p>
                            )}
                            {manga.artists.length > 0 && (
                                <p className="text-slate-300">
                                    <span className="text-slate-500">Artist:</span> {manga.artists.join(', ')}
                                </p>
                            )}
                            <p className="text-slate-300">
                                <span className="text-slate-500">Total Chapter:</span> {manga.totalChapters}
                                {readChapterIds.length > 0 && (
                                    <span className="text-green-400 ml-2">
                                        ({readChapterIds.length} sudah dibaca)
                                    </span>
                                )}
                            </p>
                            <p className="text-slate-300">
                                <span className="text-slate-500">Source:</span> id.shinigami.asia
                            </p>
                        </div>

                        {/* Genres */}
                        {manga.genres.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {manga.genres.map((genre, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-slate-800/50 text-slate-300 text-sm rounded-lg border border-slate-700"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Synopsis */}
                        <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
                            <h2 className="text-xl font-semibold text-white mb-3">📖 Sinopsis</h2>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                                {manga.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chapter List */}
                <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">
                            📚 Daftar Chapter ({manga.totalChapters})
                        </h2>

                        {/* Select Mode Toggle */}
                        <button
                            onClick={() => isSelectMode ? exitSelectMode() : setIsSelectMode(true)}
                            className={`px-4 py-2 text-sm rounded-lg transition-colors ${isSelectMode
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {isSelectMode ? '✕ Batal' : '☑️ Pilih'}
                        </button>
                    </div>

                    <div className="max-h-[600px] overflow-y-auto">
                        {manga.chapters.length > 0 ? (
                            <div className="divide-y divide-slate-700/30">
                                {[...manga.chapters].reverse().map((chapter) => {
                                    const isRead = readChapterIds.includes(chapter.id);
                                    const isLastRead = lastRead?.chapterId === chapter.id;
                                    const isSelected = selectedChapters.includes(chapter.id);

                                    return isSelectMode ? (
                                        // Select Mode: Clickable div with checkbox
                                        <div
                                            key={chapter.id}
                                            onClick={() => toggleChapterSelection(chapter.id)}
                                            className={`block px-6 py-4 transition-colors cursor-pointer ${isSelected
                                                ? 'bg-purple-500/30'
                                                : isRead
                                                    ? 'bg-green-500/5 hover:bg-green-500/10'
                                                    : 'hover:bg-purple-500/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {/* Checkbox */}
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                                        ? 'bg-purple-500 border-purple-500'
                                                        : 'border-slate-500'
                                                        }`}>
                                                        {isSelected && <span className="text-white text-xs">✓</span>}
                                                    </div>

                                                    {/* Read Status */}
                                                    {isRead && <span className="text-green-400">✓</span>}

                                                    <span className={`font-medium ${isRead ? 'text-slate-500' : 'text-purple-400'}`}>
                                                        Chapter {chapter.number}
                                                    </span>
                                                    {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
                                                        <span className={isRead ? 'text-slate-600' : 'text-slate-400'}>
                                                            - {chapter.title}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-slate-500 text-sm">
                                                    {formatDate(chapter.releaseDate)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        // Normal Mode: Link to read
                                        <Link
                                            key={chapter.id}
                                            href={`/read/shinigami/${manga.id}/${chapter.id}`}
                                            className={`block px-6 py-4 transition-colors group ${isLastRead
                                                ? 'bg-purple-500/20 hover:bg-purple-500/30'
                                                : isRead
                                                    ? 'bg-green-500/5 hover:bg-green-500/10'
                                                    : 'hover:bg-purple-500/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {/* Read Status Indicator */}
                                                    {isLastRead ? (
                                                        <span className="text-purple-400">▶️</span>
                                                    ) : isRead ? (
                                                        <span className="text-green-400">✓</span>
                                                    ) : null}

                                                    <span className={`font-medium group-hover:text-purple-300 ${isRead ? 'text-slate-500' : 'text-purple-400'
                                                        }`}>
                                                        Chapter {chapter.number}
                                                    </span>
                                                    {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
                                                        <span className={isRead ? 'text-slate-600' : 'text-slate-400'}>
                                                            - {chapter.title}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-slate-500 text-sm">
                                                    {formatDate(chapter.releaseDate)}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-slate-400">
                                Belum ada chapter tersedia.
                            </div>
                        )}
                    </div>

                    {/* Select Mode Action Bar */}
                    {isSelectMode && (
                        <div className="p-4 bg-slate-900/80 border-t border-slate-700/50 flex items-center justify-between flex-wrap gap-2">
                            <div className="text-slate-400 text-sm">
                                {selectedChapters.length} chapter dipilih
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={selectedChapters.length === manga.chapters.length ? deselectAllChapters : selectAllChapters}
                                    className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                                >
                                    {selectedChapters.length === manga.chapters.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                </button>
                                <button
                                    onClick={handleMarkSelectedAsRead}
                                    disabled={selectedChapters.length === 0}
                                    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg"
                                >
                                    ✓ Tandai Dibaca
                                </button>
                                <button
                                    onClick={handleMarkSelectedAsUnread}
                                    disabled={selectedChapters.length === 0}
                                    className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed text-white rounded-lg"
                                >
                                    ✗ Tandai Belum Dibaca
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-6 mt-12">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-slate-500 text-sm">
                        Kotatsu Web Clone • Data dari Shinigami
                    </p>
                </div>
            </footer>
        </div>
    );
}
