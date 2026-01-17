'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, Loader2 } from 'lucide-react';

interface PageData {
    index: number;
    url: string;
}

interface PagerReaderProps {
    pages: PageData[];
    currentPage: number;
    onPageChange: (page: number) => void;
    onTap: () => void;
}

export default function PagerReader({
    pages,
    currentPage,
    onPageChange,
    onTap,
}: PagerReaderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Preload adjacent pages
    useEffect(() => {
        const preloadImages = [currentPage - 1, currentPage, currentPage + 1]
            .filter(p => p >= 0 && p < pages.length);

        preloadImages.forEach(idx => {
            const img = new Image();
            img.src = pages[idx].url;
        });
    }, [currentPage, pages]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                if (currentPage > 0) onPageChange(currentPage - 1);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                if (currentPage < pages.length - 1) onPageChange(currentPage + 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage, pages.length, onPageChange]);

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;

        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;
        const threshold = 50; // Minimum swipe distance

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentPage < pages.length - 1) {
                // Swipe left -> next page
                onPageChange(currentPage + 1);
            } else if (diff < 0 && currentPage > 0) {
                // Swipe right -> prev page
                onPageChange(currentPage - 1);
            }
        }
        setTouchStart(null);
    };

    // Click zones (left 1/3 = prev, middle = toggle controls, right 1/3 = next)
    const handleClick = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clickX = e.clientX - rect.left;
        const zoneWidth = rect.width / 3;

        if (clickX < zoneWidth) {
            // Left zone - previous page
            if (currentPage > 0) onPageChange(currentPage - 1);
        } else if (clickX > zoneWidth * 2) {
            // Right zone - next page
            if (currentPage < pages.length - 1) onPageChange(currentPage + 1);
        } else {
            // Middle zone - toggle controls
            onTap();
        }
    };

    const currentPageData = pages[currentPage];

    return (
        <div
            ref={containerRef}
            className="h-dvh w-full flex items-center justify-center overflow-hidden select-none"
            style={{ background: '#000' }}
            onClick={handleClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Page Image */}
            <div className="relative max-h-full max-w-full">
                {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2
                            className="animate-spin"
                            size={40}
                            style={{ color: 'var(--accent-primary)' }}
                        />
                    </div>
                )}
                <img
                    key={currentPage}
                    src={currentPageData?.url}
                    alt={`Page ${currentPage + 1}`}
                    className="max-h-[100dvh] max-w-full object-contain transition-opacity"
                    style={{ opacity: imageLoaded ? 1 : 0 }}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                        setImageLoaded(true);
                    }}
                    draggable={false}
                />
                {/* Fallback for Image Error */}
                <div className="absolute inset-0 items-center justify-center flex-col gap-4 text-gray-500" style={{ display: 'none' }}>
                    <ImageOff size={48} />
                    <span className="text-sm">Gagal memuat gambar</span>
                </div>
            </div>

            {/* Navigation Indicators - Safe area aware */}
            <div
                className="absolute left-0 right-0 flex justify-center gap-2 sm:gap-4 pointer-events-none px-4"
                style={{ bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
            >
                <span
                    className="px-3 py-2 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm touch-target-sm"
                    style={{
                        background: 'rgba(0,0,0,0.8)',
                        color: currentPage > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                >
                    <ChevronLeft size={14} /> Prev
                </span>
                <span
                    className="px-4 py-2 rounded-full text-xs backdrop-blur-sm font-medium"
                    style={{ background: 'rgba(0,0,0,0.8)', color: 'var(--text-primary)' }}
                >
                    {currentPage + 1} / {pages.length}
                </span>
                <span
                    className="px-3 py-2 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm touch-target-sm"
                    style={{
                        background: 'rgba(0,0,0,0.8)',
                        color: currentPage < pages.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                >
                    Next <ChevronRight size={14} />
                </span>
            </div>
        </div>
    );
}
