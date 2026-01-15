'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { useDrag } from '@use-gesture/react';
import toast from 'react-hot-toast';
import LazyLoad from 'vanilla-lazyload';

import { addToHistory, markChapterAsRead, getLastRead, updateHistoryPage } from '@/lib/storage';
import { PagerReader, ReaderSettings, ChapterItem } from '@/components/reader';

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

type ReaderMode = 'webtoon' | 'pager';

export default function ReaderPage() {
    const params = useParams();
    const router = useRouter(); // Need router for navigation
    const initialMangaId = params.mangaId as string;
    const initialChapterId = params.chapterId as string;

    // Store all loaded chapters
    const [chapters, setChapters] = useState<{ info: ChapterInfo; pages: PageData[] }[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingNext, setLoadingNext] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [readerMode, setReaderMode] = useState<ReaderMode>('webtoon');
    const [scrollSpeed, setScrollSpeed] = useState(2); // Default 2x

    // Track current active chapter for URL/History updates
    const [activeChapterId, setActiveChapterId] = useState<string>(initialChapterId);
    const [currentPage, setCurrentPage] = useState(0);

    // Ref for scroll container
    const mainContainerRef = useRef<HTMLDivElement>(null);

    // Refs for observers
    const observerTarget = useRef<HTMLDivElement>(null);
    const visibilityMap = useRef<{ [key: string]: number }>({});


    // Library instances refs
    const lazyLoadInstance = useRef<any>(null);

    // Load saved reader mode and scroll speed preference
    useEffect(() => {
        const savedMode = localStorage.getItem('readerMode') as ReaderMode;
        if (savedMode) setReaderMode(savedMode);

        const savedScrollSpeed = localStorage.getItem('scrollSpeed');
        if (savedScrollSpeed) setScrollSpeed(parseFloat(savedScrollSpeed));
    }, []);

    // Custom wheel scroll handler for speed multiplier
    useEffect(() => {
        if (readerMode !== 'webtoon' || scrollSpeed <= 1) return;

        const handleWheel = (e: WheelEvent) => {
            // Only apply custom scroll if not in a scrollable child element
            if (e.ctrlKey || e.metaKey) return; // Allow zoom

            e.preventDefault();
            const delta = e.deltaY * scrollSpeed;
            window.scrollBy({ top: delta, behavior: 'auto' });
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [scrollSpeed, readerMode]);

    // Initial load
    useEffect(() => {
        // Reset chapters if initial ID doesn't match loaded content (navigation from outside)
        if (chapters.length === 0 || (chapters[0] && chapters[0].info.id !== initialChapterId && !chapters.some(c => c.info.id === initialChapterId))) {
            setChapters([]);
            loadChapter(initialChapterId, true);
        } else if (chapters.some(c => c.info.id === initialChapterId)) {
            // If we already have the chapter, just ensure it's set as active (e.g. back navigation)
            setActiveChapterId(initialChapterId);
        }
    }, [initialChapterId]);

    // Initialize Libraries (LazyLoad)
    useEffect(() => {
        // Initialize LazyLoad only on client side
        if (typeof window === 'undefined') return;

        if (!lazyLoadInstance.current) {
            lazyLoadInstance.current = new LazyLoad({
                elements_selector: ".lazy",
                callback_loaded: (el) => {
                    el.classList.add('loaded');
                }
            });
        }

        return () => {
            // Safely destroy LazyLoad instance
            try {
                if (lazyLoadInstance.current && typeof lazyLoadInstance.current.destroy === 'function') {
                    lazyLoadInstance.current.destroy();
                }
            } catch (e) {
                // Ignore errors during cleanup
            }
            lazyLoadInstance.current = null;
        };
    }, []);

    // Update Libraries when chapters change
    useEffect(() => {
        // Safely update LazyLoad instance
        try {
            if (lazyLoadInstance.current && typeof lazyLoadInstance.current.update === 'function') {
                lazyLoadInstance.current.update();
            }
        } catch (e) {
            // Ignore errors during update
        }
    }, [chapters, readerMode]);

    // Handle visibility updates from ChapterItem
    const handleChapterVisibility = (chapterId: string, ratio: number) => {
        visibilityMap.current[chapterId] = ratio;

        // Find chapter with highest ratio
        let maxRatio = 0;
        let maxId = activeChapterId;

        Object.entries(visibilityMap.current).forEach(([id, r]) => {
            if (r > maxRatio) {
                maxRatio = r;
                maxId = id;
            }
        });

        if (maxId && maxId !== activeChapterId && maxRatio > 0.1) {
            setActiveChapterId(maxId);

            const newUrl = `/read/shinigami/${initialMangaId}/${maxId}`;
            window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);

            const chapter = chapters.find(c => c.info.id === maxId);
            if (chapter) {
                addToHistory({
                    mangaId: chapter.info.mangaId || initialMangaId,
                    mangaTitle: chapter.info.mangaTitle || 'Unknown',
                    mangaCover: chapter.info.mangaCover || '',
                    source: 'shinigami',
                    chapterId: chapter.info.id,
                    chapterNumber: chapter.info.chapterNumber,
                    chapterTitle: chapter.info.chapterTitle,
                });
                markChapterAsRead(chapter.info.mangaId || initialMangaId, 'shinigami', maxId);
            }
        }
    };

    // Gestures (Swipe to Navigate)
    const bind = useDrag(({ active, movement: [mx], cancel }) => {
        if (active && Math.abs(mx) > 100) {
            const activeChapter = chapters.find(c => c.info.id === activeChapterId);
            if (!activeChapter) return;

            if (mx > 0) {
                // Swipe Right -> Prev
                if (activeChapter.info.prevChapterId) {
                    goToChapter(activeChapter.info.prevChapterId);
                    cancel();
                }
            } else {
                // Swipe Left -> Next
                if (activeChapter.info.nextChapterId) {
                    goToChapter(activeChapter.info.nextChapterId);
                    cancel();
                }
            }
        }
    }, {
        axis: 'x',
        filterTaps: true,
        // bgSwipe: true // deprecated or not needed if attached to container
    });

    const loadChapter = async (id: string, isInitial: boolean = false) => {
        if (isInitial) setLoading(true);
        else setLoadingNext(true);

        try {
            // Check if already loaded
            if (chapters.some(c => c.info.id === id)) {
                if (isInitial) setLoading(false);
                else setLoadingNext(false);
                return;
            }

            const response = await fetch(`/api/sources/shinigami/chapter/${id}`);
            const data: APIResponse = await response.json();

            if (data.success) {
                setChapters(prev => {
                    if (prev.some(c => c.info.id === data.chapter.id)) return prev;
                    return [...prev, { info: data.chapter, pages: data.pages }];
                });

                if (isInitial) {
                    setActiveChapterId(data.chapter.id);

                    addToHistory({
                        mangaId: data.chapter.mangaId || initialMangaId,
                        mangaTitle: data.chapter.mangaTitle || 'Unknown',
                        mangaCover: data.chapter.mangaCover || '',
                        source: 'shinigami',
                        chapterId: data.chapter.id,
                        chapterNumber: data.chapter.chapterNumber,
                        chapterTitle: data.chapter.chapterTitle,
                    });

                    // Recover last page position logic could go here
                    const lastRead = getLastRead(initialMangaId, 'shinigami');
                    if (lastRead?.chapterId === id && lastRead.lastReadPage) {
                        setCurrentPage(lastRead.lastReadPage);
                    }

                    markChapterAsRead(data.chapter.mangaId || initialMangaId, 'shinigami', id);
                } else {
                    toast.success(`Chapter ${data.chapter.chapterNumber} loaded`, {
                        position: 'bottom-center',
                        style: { background: 'var(--bg-elevated)', color: 'var(--text-primary)' }
                    });
                }
            } else {
                if (isInitial) setError(data.error || 'Gagal memuat chapter');
                else toast.error('Gagal memuat chapter selanjutnya');
            }
        } catch {
            if (isInitial) setError('Terjadi kesalahan saat memuat chapter');
        } finally {
            if (isInitial) setLoading(false);
            else setLoadingNext(false);
        }
    };

    // Infinite Scroll Observer (Load Next)
    useEffect(() => {
        if (readerMode !== 'webtoon') return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingNext && !loading) {
                    const lastChapter = chapters[chapters.length - 1];
                    if (lastChapter?.info.nextChapterId) {
                        loadChapter(lastChapter.info.nextChapterId);
                    }
                }
            },
            { rootMargin: '600px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [chapters, loading, loadingNext, readerMode]);



    // Save page position logic can be simplified or omitted for infinite scroll to avoid complexity
    // We already save chapter progress in the observer above.

    // Auto-hide controls
    useEffect(() => {
        if (showControls && !showSettings) {
            const timer = setTimeout(() => setShowControls(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showControls, showSettings]);

    // Helpers
    const handleModeChange = (mode: ReaderMode) => {
        setReaderMode(mode);
        localStorage.setItem('readerMode', mode);
        setShowSettings(false);
    };

    const goToChapter = (id: string | null) => {
        if (id) router.push(`/read/shinigami/${initialMangaId}/${id}`);
    };

    const activeChapterData = chapters.find(c => c.info.id === activeChapterId) || chapters[0];

    // Initial Loading State
    if (loading && chapters.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[var(--accent-primary)]" />
                    <p style={{ color: 'var(--text-muted)' }}>Memuat chapter...</p>
                </div>
            </div>
        );
    }

    if (error || !activeChapterData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
                <div className="text-center">
                    <p style={{ color: 'var(--accent-error)' }} className="text-xl mb-4 flex items-center justify-center gap-2">
                        <AlertCircle /> {error || 'Chapter tidak ditemukan'}
                    </p>
                    <Link href={`/manga/shinigami/${initialMangaId}`} style={{ color: 'var(--accent-primary)' }} className="flex items-center justify-center gap-2">
                        <ChevronLeft size={20} /> Kembali ke Detail
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen relative"
            style={{ background: '#000' }}
            {...bind()}
        >
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}
            >
                <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid var(--border-default)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Link
                        href={`/manga/shinigami/${initialMangaId}`}
                        className="p-2 rounded-lg hover:bg-white/10"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        <ChevronLeft size={24} />
                    </Link>

                    <div className="flex-1 text-center px-4">
                        <h1 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {activeChapterData.info.mangaTitle}
                        </h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {activeChapterData.info.chapterTitle}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {readerMode === 'pager' && (
                            <span className="text-xs mr-2" style={{ color: 'var(--text-muted)' }}>
                                {currentPage + 1}/{activeChapterData.pages.length}
                            </span>
                        )}
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 rounded-lg hover:bg-white/10"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {readerMode === 'pager' ? (
                <PagerReader
                    pages={activeChapterData.pages}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    onTap={() => setShowControls(!showControls)}
                />
            ) : (
                <main
                    className="flex flex-col items-center pt-14 pb-10"
                    onClick={() => setShowControls(!showControls)}
                >
                    {chapters.map((chapter) => (
                        <ChapterItem
                            key={chapter.info.id}
                            chapter={chapter}
                            onVisible={handleChapterVisibility}
                        />
                    ))}

                    {activeChapterData?.info?.nextChapterId || loadingNext ? (
                        <div ref={observerTarget} className="h-48 w-full flex items-center justify-center p-4">
                            {loadingNext ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
                                    <span className="text-xs text-[var(--text-muted)]">Memuat chapter selanjutnya...</span>
                                </div>
                            ) : (
                                <div className="h-20" />
                            )}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-[var(--text-muted)]">
                            Selesai
                        </div>
                    )}
                </main>
            )}

            <footer
                className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="px-4 py-3 flex items-center justify-between gap-3"
                    style={{ background: 'rgba(0,0,0,0.9)', borderTop: '1px solid var(--border-default)' }}
                >
                    <button
                        onClick={() => goToChapter(activeChapterData.info.prevChapterId)}
                        disabled={!activeChapterData.info.prevChapterId}
                        className="flex-1 py-2.5 rounded-xl text-center transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>

                    <Link
                        href={`/manga/shinigami/${initialMangaId}`}
                        className="py-2.5 px-4 rounded-xl flex items-center justify-center"
                        style={{ background: 'var(--accent-primary)', color: 'white' }}
                    >
                        <BookOpen size={20} />
                    </Link>

                    <button
                        onClick={() => goToChapter(activeChapterData.info.nextChapterId)}
                        disabled={!activeChapterData.info.nextChapterId}
                        className="flex-1 py-2.5 rounded-xl text-center transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </div>
            </footer>

            <ReaderSettings
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                mode={readerMode}
                onModeChange={handleModeChange}
                scrollSpeed={scrollSpeed}
                onScrollSpeedChange={(speed) => {
                    setScrollSpeed(speed);
                    localStorage.setItem('scrollSpeed', speed.toString());
                }}
            />
        </div>
    );
}
