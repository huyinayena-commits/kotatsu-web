'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { addToHistory, markChapterAsRead, getLastRead, updateHistoryPage } from '@/lib/storage';

interface PageData {
    index: number;
    url: string;
}

interface ChapterInfo {
    id: string;
    mangaId: string;
    mangaTitle: string;
    mangaCover: string;
    chapterNumber: number;
    chapterTitle: string;
    totalPages: number;
    prevChapterId: string | null;
    nextChapterId: string | null;
}

interface APIResponse {
    success: boolean;
    chapter: ChapterInfo;
    pages: PageData[];
    error?: string;
}

export default function ReaderPage() {
    const params = useParams();
    const mangaId = params.mangaId as string;
    const chapterId = params.chapterId as string;

    const [chapter, setChapter] = useState<ChapterInfo | null>(null);
    const [pages, setPages] = useState<PageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    // Overscroll navigation state
    const [overscrollMessage, setOverscrollMessage] = useState<string | null>(null);
    const overscrollCount = useRef(0);
    const overscrollTimer = useRef<NodeJS.Timeout | null>(null);
    const isNavigating = useRef(false);

    // Page preloading state
    const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
    const [prefetchedPages, setPrefetchedPages] = useState<Set<number>>(new Set());

    // Saved page position for resume reading
    const [savedPagePosition, setSavedPagePosition] = useState<number | null>(null);
    const hasScrolledToSavedPosition = useRef(false);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Auto-hide controls after 3 seconds
    useEffect(() => {
        if (showControls) {
            const timer = setTimeout(() => setShowControls(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showControls]);

    // Fetch chapter data
    useEffect(() => {
        if (chapterId) {
            // First check if there's a saved position for this chapter
            const lastRead = getLastRead(mangaId, 'shinigami');
            if (lastRead && lastRead.chapterId === chapterId && lastRead.lastReadPage) {
                setSavedPagePosition(lastRead.lastReadPage);
            } else {
                setSavedPagePosition(null);
            }
            hasScrolledToSavedPosition.current = false;
            fetchChapter();
        }
    }, [chapterId, mangaId]);

    // Scroll to saved position after pages are loaded
    useEffect(() => {
        if (savedPagePosition !== null && pages.length > 0 && !hasScrolledToSavedPosition.current && !loading) {
            // Wait a bit for images to render
            const timer = setTimeout(() => {
                const targetPage = pageRefs.current[savedPagePosition];
                if (targetPage) {
                    targetPage.scrollIntoView({ behavior: 'auto', block: 'start' });
                    hasScrolledToSavedPosition.current = true;
                    setCurrentPage(savedPagePosition + 1);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [savedPagePosition, pages.length, loading]);

    const fetchChapter = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/sources/shinigami/chapter/${chapterId}`);
            const data: APIResponse = await response.json();

            if (data.success) {
                setChapter(data.chapter);
                setPages(data.pages);

                // Initialize page refs array
                pageRefs.current = new Array(data.pages.length).fill(null);

                // AUTO-SAVE HISTORY dengan data lengkap
                // Ini akan UPDATE history jika manga sudah ada (bukan duplikat)
                addToHistory({
                    mangaId: data.chapter.mangaId || mangaId,
                    mangaTitle: data.chapter.mangaTitle || 'Unknown',
                    mangaCover: data.chapter.mangaCover || '',
                    source: 'shinigami',
                    chapterId: data.chapter.id,
                    chapterNumber: data.chapter.chapterNumber,
                    chapterTitle: data.chapter.chapterTitle,
                });

                // Mark chapter as read
                markChapterAsRead(data.chapter.mangaId || mangaId, 'shinigami', chapterId);
            } else {
                setError(data.error || 'Gagal memuat chapter');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat memuat chapter');
        } finally {
            setLoading(false);
        }
    };

    // Track scroll position and save to history
    const savePagePositionTimer = useRef<NodeJS.Timeout | null>(null);

    const handleScroll = useCallback(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = scrollTop / docHeight;
        const estimatedPage = Math.ceil(scrollPercent * pages.length) || 1;
        const newPage = Math.min(estimatedPage, pages.length);
        setCurrentPage(newPage);

        // Debounced save to history (save after 1 second of no scrolling)
        if (savePagePositionTimer.current) {
            clearTimeout(savePagePositionTimer.current);
        }
        savePagePositionTimer.current = setTimeout(() => {
            if (chapter) {
                updateHistoryPage(chapter.mangaId || mangaId, 'shinigami', chapterId, newPage - 1);
            }
        }, 1000);
    }, [pages.length, chapter, mangaId, chapterId]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            // Clear pending save on unmount
            if (savePagePositionTimer.current) {
                clearTimeout(savePagePositionTimer.current);
            }
        };
    }, [handleScroll]);

    // Handle page loaded
    const handlePageLoaded = useCallback((pageIndex: number) => {
        setLoadedPages(prev => new Set([...prev, pageIndex]));
    }, []);

    // Prefetch upcoming pages
    useEffect(() => {
        if (pages.length === 0) return;

        const prefetchAhead = 5; // Prefetch 5 pages ahead
        const startPrefetch = currentPage;
        const endPrefetch = Math.min(currentPage + prefetchAhead, pages.length);

        for (let i = startPrefetch; i < endPrefetch; i++) {
            if (!prefetchedPages.has(i)) {
                const img = new Image();
                img.src = pages[i].url;
                img.onload = () => {
                    setPrefetchedPages(prev => new Set([...prev, i]));
                };
            }
        }
    }, [currentPage, pages, prefetchedPages]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && chapter?.prevChapterId) {
                window.location.href = `/read/shinigami/${mangaId}/${chapter.prevChapterId}`;
            } else if (e.key === 'ArrowRight' && chapter?.nextChapterId) {
                window.location.href = `/read/shinigami/${mangaId}/${chapter.nextChapterId}`;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [chapter, mangaId]);

    // Overscroll navigation - auto navigate to prev/next chapter
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (isNavigating.current || !chapter) return;

            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const isAtTop = scrollTop <= 0;
            const isAtBottom = scrollTop >= docHeight - 10;

            // Scrolling up at top
            if (e.deltaY < 0 && isAtTop && chapter.prevChapterId) {
                overscrollCount.current++;
                setOverscrollMessage(`Scroll ${2 - overscrollCount.current}x lagi untuk chapter sebelumnya`);

                if (overscrollCount.current >= 2) {
                    isNavigating.current = true;
                    setOverscrollMessage('Pindah ke chapter sebelumnya...');
                    setTimeout(() => {
                        window.location.href = `/read/shinigami/${mangaId}/${chapter.prevChapterId}`;
                    }, 300);
                }

                // Reset counter after 1 second of no scroll
                if (overscrollTimer.current) clearTimeout(overscrollTimer.current);
                overscrollTimer.current = setTimeout(() => {
                    overscrollCount.current = 0;
                    setOverscrollMessage(null);
                }, 1000);
            }
            // Scrolling down at bottom
            else if (e.deltaY > 0 && isAtBottom && chapter.nextChapterId) {
                overscrollCount.current++;
                setOverscrollMessage(`Scroll ${2 - overscrollCount.current}x lagi untuk chapter selanjutnya`);

                if (overscrollCount.current >= 2) {
                    isNavigating.current = true;
                    setOverscrollMessage('Pindah ke chapter selanjutnya...');
                    setTimeout(() => {
                        window.location.href = `/read/shinigami/${mangaId}/${chapter.nextChapterId}`;
                    }, 300);
                }

                // Reset counter after 1 second of no scroll
                if (overscrollTimer.current) clearTimeout(overscrollTimer.current);
                overscrollTimer.current = setTimeout(() => {
                    overscrollCount.current = 0;
                    setOverscrollMessage(null);
                }, 1000);
            }
            // Not at boundary - hide message
            else if (!isAtTop && !isAtBottom) {
                overscrollCount.current = 0;
                setOverscrollMessage(null);
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [chapter, mangaId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Memuat halaman...</p>
                </div>
            </div>
        );
    }

    if (error || !chapter) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-xl mb-4">❌ {error || 'Chapter tidak ditemukan'}</p>
                    <Link href={`/manga/shinigami/${mangaId}`} className="text-purple-400 hover:text-purple-300 underline">
                        ← Kembali ke Detail Manga
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-black"
            onClick={() => setShowControls(!showControls)}
        >
            {/* Overscroll Navigation Message */}
            {overscrollMessage && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-purple-600/90 backdrop-blur-lg text-white rounded-full text-sm font-medium shadow-lg animate-pulse">
                    {overscrollMessage}
                </div>
            )}

            {/* Loading Progress Bar */}
            {pages.length > 0 && loadedPages.size < pages.length && (
                <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${(loadedPages.size / pages.length) * 100}%` }}
                    />
                </div>
            )}

            {/* Top Navigation Bar */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'
                    }`}
            >
                <div className="bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 px-4 py-3">
                    <div className="container mx-auto flex items-center justify-between">
                        <Link
                            href={`/manga/shinigami/${mangaId}`}
                            className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span>←</span>
                            <span className="hidden sm:inline">Kembali</span>
                        </Link>

                        <div className="text-center flex-1 px-4">
                            <h1 className="text-white font-medium text-sm sm:text-base truncate">
                                {chapter.mangaTitle}
                            </h1>
                            <p className="text-slate-400 text-xs sm:text-sm">
                                Chapter {chapter.chapterNumber}
                            </p>
                        </div>

                        <div className="text-slate-400 text-sm">
                            {currentPage}/{chapter.totalPages}
                        </div>
                    </div>
                </div>
            </header>

            {/* Image Container */}
            <main className="flex flex-col items-center">
                {pages.map((page, index) => (
                    <div
                        key={page.index}
                        className="relative w-full max-w-4xl"
                        ref={(el) => { pageRefs.current[index] = el; }}
                    >
                        {/* Loading placeholder */}
                        {!loadedPages.has(index) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                <div className="text-center">
                                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-slate-500 text-sm">Halaman {index + 1}</p>
                                </div>
                            </div>
                        )}
                        <img
                            src={page.url}
                            alt={`Page ${page.index}`}
                            className={`w-full ${!loadedPages.has(index) ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
                            loading="lazy"
                            onLoad={() => handlePageLoaded(index)}
                            onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200"><rect fill="%231a1a2e" width="800" height="1200"/><text x="400" y="600" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="24">Gagal memuat gambar</text></svg>';
                                handlePageLoaded(index);
                            }}
                        />
                    </div>
                ))}
            </main>

            {/* Bottom Navigation */}
            <footer
                className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 px-4 py-3">
                    <div className="container mx-auto flex items-center justify-between gap-4">
                        {/* Prev Chapter */}
                        {chapter.prevChapterId ? (
                            <Link
                                href={`/read/shinigami/${mangaId}/${chapter.prevChapterId}`}
                                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-center transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                ← Prev
                            </Link>
                        ) : (
                            <div className="flex-1 py-3 px-4 bg-slate-800/50 text-slate-500 rounded-xl text-center cursor-not-allowed">
                                ← Prev
                            </div>
                        )}

                        {/* Back to Detail */}
                        <Link
                            href={`/manga/shinigami/${mangaId}`}
                            className="py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-center transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            📖 Daftar
                        </Link>

                        {/* Next Chapter */}
                        {chapter.nextChapterId ? (
                            <Link
                                href={`/read/shinigami/${mangaId}/${chapter.nextChapterId}`}
                                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-center transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Next →
                            </Link>
                        ) : (
                            <div className="flex-1 py-3 px-4 bg-slate-800/50 text-slate-500 rounded-xl text-center cursor-not-allowed">
                                Next →
                            </div>
                        )}
                    </div>
                </div>
            </footer>

            {/* Scroll to top hint (when at bottom) */}
            {currentPage === pages.length && (
                <div className="fixed bottom-24 left-0 right-0 text-center pointer-events-none">
                    <span className="inline-block bg-slate-900/90 text-slate-300 px-4 py-2 rounded-full text-sm">
                        {chapter.nextChapterId ? 'Tekan → untuk chapter berikutnya' : '🎉 Selesai!'}
                    </span>
                </div>
            )}
        </div>
    );
}
