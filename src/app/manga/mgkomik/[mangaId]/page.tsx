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
import { ChapterList } from '@/components/manga';
import ScrollableContainer from '@/components/ui/ScrollableContainer';
import { Search } from 'lucide-react';

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

export default function MgkomikDetailPage() {
    const params = useParams();
    const mangaId = params.mangaId as string;

    const [manga, setManga] = useState<MangaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [lastRead, setLastRead] = useState<ReadingHistory | null>(null);
    const [readChapterIds, setReadChapterIds] = useState<string[]>([]);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

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
            const response = await fetch(`/api/sources/mgkomik/${mangaId}`);
            const data: APIResponse = await response.json();
            if (data.success) {
                setManga(data.data);
                updateReadChapters(data.data.chapters);
            } else {
                setError(data.error || 'Gagal memuat data');
            }
        } catch {
            setError('Terjadi kesalahan saat memuat data');
        } finally {
            setLoading(false);
        }
    };

    const checkBookmarkStatus = () => setIsBookmarked(isInLibrary(mangaId, 'mgkomik'));
    const checkReadingHistory = () => setLastRead(getLastRead(mangaId, 'mgkomik'));

    const updateReadChapters = (chapters: Chapter[]) => {
        const readIds = chapters.filter(ch => isChapterRead(mangaId, 'mgkomik', ch.id)).map(ch => ch.id);
        setReadChapterIds(readIds);
    };

    const toggleChapterSelection = (chapterId: string) => {
        setSelectedChapters(prev => prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]);
    };

    const handleMarkSelectedAsRead = () => {
        if (selectedChapters.length === 0) return;
        markChaptersAsRead(mangaId, 'mgkomik', selectedChapters);
        setReadChapterIds(prev => [...new Set([...prev, ...selectedChapters])]);
        exitSelectMode();
    };

    const handleMarkSelectedAsUnread = () => {
        if (selectedChapters.length === 0) return;
        markChaptersAsUnread(mangaId, 'mgkomik', selectedChapters);
        setReadChapterIds(prev => prev.filter(id => !selectedChapters.includes(id)));
        exitSelectMode();
    };

    const exitSelectMode = () => {
        setIsSelectMode(false);
        setSelectedChapters([]);
    };

    const handleToggleBookmark = () => {
        if (!manga) return;
        const nowBookmarked = toggleLibrary({
            id: manga.id,
            title: manga.title,
            cover: manga.cover,
            source: 'mgkomik',
        });
        setIsBookmarked(nowBookmarked);
    };

    const getFirstChapter = () => manga?.chapters[0] || null;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div
                    className="w-12 h-12 rounded-full animate-spin"
                    style={{ border: '3px solid var(--bg-surface)', borderTopColor: 'var(--accent-primary)' }}
                />
            </div>
        );
    }

    if (error || !manga) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <p style={{ color: 'var(--accent-error)' }} className="text-xl mb-4">
                        ❌ {error || 'Manga tidak ditemukan'}
                    </p>
                    <Link href="/" style={{ color: 'var(--accent-primary)' }} className="hover:underline">
                        ← Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    const firstChapter = getFirstChapter();
    const readProgress = manga.totalChapters > 0 ? Math.round((readChapterIds.length / manga.totalChapters) * 100) : 0;

    const filteredChapters = manga.chapters.filter(chapter =>
        chapter.number.toString().includes(searchQuery) ||
        chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen pb-20">
            <header
                className="sticky top-0 z-40 px-4 py-3 flex items-center gap-4"
                style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-default)' }}
            >
                <Link href="/" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <span style={{ color: 'var(--text-primary)' }}>←</span>
                </Link>
                <h1 className="font-medium truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                    {manga.title}
                </h1>
            </header>

            <main className="p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    <div className="flex-shrink-0 mx-auto sm:mx-0" style={{ width: '160px' }}>
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{ aspectRatio: '2/3', background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                        >
                            {imageError ? (
                                <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                    {manga.title.charAt(0)}
                                </div>
                            ) : (
                                <img
                                    src={`/api/proxy-image?url=${encodeURIComponent(manga.largeCover || manga.cover)}`}
                                    alt={manga.title}
                                    className="w-full h-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{manga.title}</h2>
                        {manga.altTitle && <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{manga.altTitle}</p>}

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                                background: manga.status === 'Ongoing' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                color: manga.status === 'Ongoing' ? 'var(--accent-success)' : 'var(--accent-secondary)',
                            }}>
                                {manga.status}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                                {manga.totalChapters} Chapter
                            </span>
                            {readChapterIds.length > 0 && (
                                <span className="px-3 py-1 rounded-full text-xs" style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-primary)' }}>
                                    {readProgress}% Dibaca
                                </span>
                            )}
                        </div>

                        <div className="space-y-1 text-sm mb-4">
                            {manga.authors.length > 0 && (
                                <p><span style={{ color: 'var(--text-muted)' }}>Author: </span><span style={{ color: 'var(--text-primary)' }}>{manga.authors.join(', ')}</span></p>
                            )}
                        </div>

                        <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                            {lastRead ? (
                                <Link href={`/read/mgkomik/${manga.id}/${lastRead.chapterId}`} className="px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                                    ▶ Lanjut Ch. {lastRead.chapterNumber}
                                </Link>
                            ) : firstChapter ? (
                                <Link href={`/read/mgkomik/${manga.id}/${firstChapter.id}`} className="px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                                    ▶ Mulai Baca
                                </Link>
                            ) : null}

                            <button onClick={handleToggleBookmark} className="px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base" style={{
                                background: isBookmarked ? 'rgba(168, 85, 247, 0.2)' : 'var(--bg-surface)',
                                color: isBookmarked ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                border: `1px solid ${isBookmarked ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                            }}>
                                {isBookmarked ? '❤️ Tersimpan' : '🤍 Simpan'}
                            </button>
                        </div>
                    </div>
                </div>

                {manga.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {manga.genres.map((genre, idx) => (
                            <span key={idx} className="px-3 py-1 rounded-lg text-xs" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                                {genre}
                            </span>
                        ))}
                    </div>
                )}

                <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sinopsis</h3>
                    <p className={`text-sm leading-relaxed whitespace-pre-line ${!showFullDesc ? 'line-clamp-4' : ''}`} style={{ color: 'var(--text-secondary)' }}>
                        {manga.description}
                    </p>
                    {manga.description.length > 200 && (
                        <button onClick={() => setShowFullDesc(!showFullDesc)} className="mt-2 text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                            {showFullDesc ? 'Sembunyikan' : 'Baca Selengkapnya'}
                        </button>
                    )}
                </div>

                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            📚 Chapter ({filteredChapters.length})
                        </h3>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Search Input */}
                            <div className="relative flex-1 sm:w-48">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Cari chapter..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 rounded-lg text-sm transition-colors focus:outline-none"
                                    style={{
                                        background: 'var(--bg-elevated)',
                                        color: 'var(--text-primary)',
                                        border: '1px solid transparent',
                                    }}
                                />
                            </div>

                            <button onClick={() => isSelectMode ? exitSelectMode() : setIsSelectMode(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap" style={{
                                background: isSelectMode ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                                color: isSelectMode ? 'white' : 'var(--text-secondary)',
                            }}>
                                {isSelectMode ? '✕ Batal' : '☑ Pilih'}
                            </button>
                        </div>
                    </div>

                    <ScrollableContainer height="400px">
                        {filteredChapters.length > 0 ? (
                            <ChapterList
                                chapters={filteredChapters}
                                mangaId={manga.id}
                                source="mgkomik"
                                readChapterIds={readChapterIds}
                                lastReadChapterId={lastRead?.chapterId}
                                isSelectMode={isSelectMode}
                                selectedChapters={selectedChapters}
                                onToggleSelection={toggleChapterSelection}
                            />
                        ) : (
                            <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>Belum ada chapter.</div>
                        )}
                    </ScrollableContainer>

                    {isSelectMode && (
                        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2" style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-default)' }}>
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedChapters.length} dipilih</span>
                            <div className="flex gap-2">
                                <button onClick={() => selectedChapters.length === manga.chapters.length ? setSelectedChapters([]) : setSelectedChapters(manga.chapters.map(c => c.id))} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                                    {selectedChapters.length === manga.chapters.length ? 'Batal Semua' : 'Pilih Semua'}
                                </button>
                                <button onClick={handleMarkSelectedAsRead} disabled={selectedChapters.length === 0} className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-50" style={{ background: 'var(--accent-success)', color: 'white' }}>✓ Dibaca</button>
                                <button onClick={handleMarkSelectedAsUnread} disabled={selectedChapters.length === 0} className="px-3 py-1.5 rounded-lg text-xs disabled:opacity-50" style={{ background: 'var(--accent-warning)', color: 'white' }}>✗ Belum</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {lastRead && (
                <Link href={`/read/mgkomik/${manga.id}/${lastRead.chapterId}`} className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 px-4 py-2.5 rounded-full shadow-lg hover:scale-105 flex items-center gap-2 z-30 text-sm" style={{ background: 'var(--accent-primary)', color: 'white', boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)' }}>
                    ▶ Lanjut
                </Link>
            )}
        </div>
    );
}
