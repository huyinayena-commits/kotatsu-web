'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { addToHistory, markChapterAsRead, getLastRead, updateHistoryPage } from '@/lib/storage';
import { PagerReader, ReaderSettings } from '@/components/reader';

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

export default function MgkomikReaderPage() {
    const params = useParams();
    const mangaId = params.mangaId as string;
    const chapterId = params.chapterId as string;

    const [chapter, setChapter] = useState<ChapterInfo | null>(null);
    const [pages, setPages] = useState<PageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [readerMode, setReaderMode] = useState<ReaderMode>('webtoon');
    const [scrollSpeed, setScrollSpeed] = useState(2); // Default 2x

    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());

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
            if (e.ctrlKey || e.metaKey) return; // Allow zoom

            e.preventDefault();
            const delta = e.deltaY * scrollSpeed;
            window.scrollBy({ top: delta, behavior: 'auto' });
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [scrollSpeed, readerMode]);

    useEffect(() => {
        if (showControls && !showSettings) {
            const timer = setTimeout(() => setShowControls(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [showControls, showSettings]);

    useEffect(() => {
        if (chapterId) {
            const lastRead = getLastRead(mangaId, 'mgkomik');
            if (lastRead?.chapterId === chapterId && lastRead.lastReadPage) {
                setCurrentPage(lastRead.lastReadPage);
            } else {
                setCurrentPage(0);
            }
            fetchChapter();
        }
    }, [chapterId, mangaId]);

    const fetchChapter = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/sources/mgkomik/chapter/${chapterId}?manga=${mangaId}`);
            const data: APIResponse = await response.json();

            if (data.success) {
                setChapter(data.chapter);
                setPages(data.pages);
                pageRefs.current = new Array(data.pages.length).fill(null);

                addToHistory({
                    mangaId: data.chapter.mangaId || mangaId,
                    mangaTitle: data.chapter.mangaTitle || 'Unknown',
                    mangaCover: data.chapter.mangaCover || '',
                    source: 'mgkomik',
                    chapterId: data.chapter.id,
                    chapterNumber: data.chapter.chapterNumber,
                    chapterTitle: data.chapter.chapterTitle,
                });

                markChapterAsRead(data.chapter.mangaId || mangaId, 'mgkomik', chapterId);
            } else {
                setError(data.error || 'Gagal memuat chapter');
            }
        } catch {
            setError('Terjadi kesalahan saat memuat chapter');
        } finally {
            setLoading(false);
        }
    };

    const savePageTimer = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (!chapter || pages.length === 0) return;
        if (savePageTimer.current) clearTimeout(savePageTimer.current);
        savePageTimer.current = setTimeout(() => {
            updateHistoryPage(chapter.mangaId || mangaId, 'mgkomik', chapterId, currentPage);
        }, 1000);
        return () => { if (savePageTimer.current) clearTimeout(savePageTimer.current); };
    }, [currentPage, chapter, mangaId, chapterId, pages.length]);

    const handleScroll = useCallback(() => {
        if (readerMode !== 'webtoon' || pages.length === 0) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = scrollTop / docHeight;
        const estimatedPage = Math.floor(scrollPercent * pages.length);
        setCurrentPage(Math.min(Math.max(estimatedPage, 0), pages.length - 1));
    }, [pages.length, readerMode]);

    useEffect(() => {
        if (readerMode === 'webtoon') {
            window.addEventListener('scroll', handleScroll);
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll, readerMode]);

    const handleModeChange = (mode: ReaderMode) => {
        setReaderMode(mode);
        localStorage.setItem('readerMode', mode);
        setShowSettings(false);
    };

    const handlePageChange = (page: number) => setCurrentPage(page);

    const goToChapter = (chapterId: string | null) => {
        if (chapterId) window.location.href = `/read/mgkomik/${mangaId}/${chapterId}`;
    };

    const handlePageLoaded = (index: number) => setLoadedPages(prev => new Set([...prev, index]));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[var(--accent-primary)]" />
                    <p style={{ color: 'var(--text-muted)' }}>Memuat halaman...</p>
                </div>
            </div>
        );
    }

    if (error || !chapter) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
                <div className="text-center">
                    <p style={{ color: 'var(--accent-error)' }} className="text-xl mb-4 flex items-center justify-center gap-2">
                        <AlertCircle /> {error || 'Chapter tidak ditemukan'}
                    </p>
                    <Link href={`/manga/mgkomik/${mangaId}`} style={{ color: 'var(--accent-primary)' }} className="flex items-center justify-center gap-2">
                        <ChevronLeft size={20} /> Kembali
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ background: '#000' }}>
            <header className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.9)', borderBottom: '1px solid var(--border-default)' }} onClick={(e) => e.stopPropagation()}>
                    <Link href={`/manga/mgkomik/${mangaId}`} className="p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-primary)' }}>
                        <ChevronLeft size={24} />
                    </Link>
                    <div className="flex-1 text-center px-4">
                        <h1 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{chapter.mangaTitle}</h1>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ch. {chapter.chapterNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentPage + 1}/{pages.length}</span>
                        <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-primary)' }}>
                            <Settings size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {readerMode === 'pager' ? (
                <PagerReader pages={pages} currentPage={currentPage} onPageChange={handlePageChange} onTap={() => setShowControls(!showControls)} />
            ) : (
                <main className="flex flex-col items-center pt-14 pb-20" onClick={() => setShowControls(!showControls)}>
                    {pages.map((page, index) => (
                        <div key={page.index} ref={(el) => { pageRefs.current[index] = el; }} className="relative w-full max-w-4xl">
                            {!loadedPages.has(index) && (
                                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--bg-primary)', minHeight: '300px' }}>
                                    <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)]" />
                                </div>
                            )}
                            <img src={page.url} alt={`Page ${index + 1}`} className="w-full transition-opacity" style={{ opacity: loadedPages.has(index) ? 1 : 0 }} loading="lazy" onLoad={() => handlePageLoaded(index)} onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200"><rect fill="%231a1a2e" width="800" height="1200"/><text x="400" y="600" text-anchor="middle" fill="%236b7280" font-size="24">Gagal memuat</text></svg>'; handlePageLoaded(index); }} />
                        </div>
                    ))}
                </main>
            )}

            <footer className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`} onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'rgba(0,0,0,0.9)', borderTop: '1px solid var(--border-default)' }}>
                    <button onClick={() => goToChapter(chapter.prevChapterId)} disabled={!chapter.prevChapterId} className="flex-1 py-2.5 rounded-xl text-center disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        <ChevronLeft size={16} /> Prev
                    </button>
                    <Link href={`/manga/mgkomik/${mangaId}`} className="py-2.5 px-4 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-primary)', color: 'white' }}>
                        <BookOpen size={20} />
                    </Link>
                    <button onClick={() => goToChapter(chapter.nextChapterId)} disabled={!chapter.nextChapterId} className="flex-1 py-2.5 rounded-xl text-center disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
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
