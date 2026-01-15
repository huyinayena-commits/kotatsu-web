'use client';

import React from 'react';
import { useInView } from 'react-cool-inview';

interface PageData {
    index: number;
    url: string;
}

interface ChapterInfo {
    id: string;
    mangaId: string;
    chapterNumber: number;
    chapterTitle: string;
    // ... other fields if needed, but strict typing is good
}

interface ChapterItemProps {
    chapter: { info: ChapterInfo; pages: PageData[] };
    onVisible: (id: string, ratio: number) => void;
    // Ref for the DOM element if needed by parent (though useInView handles observation)
    // We can just rely on onVisible bubbling up the ratio
}

export default function ChapterItem({ chapter, onVisible }: ChapterItemProps) {
    const { observe } = useInView({
        threshold: [0, 0.1, 0.3, 0.5, 0.7, 0.9], // Added 0 threshold
        onChange: ({ entry }) => {
            // Always report the intersection ratio (including 0 when not visible)
            onVisible(chapter.info.id, entry.intersectionRatio);
        },
    });

    return (
        <div
            ref={observe}
            className="w-full flex flex-col items-center"
            style={{ minHeight: '50vh' }}
        >
            {/* Chapter Header */}
            <div className="w-full px-4 py-8 text-center bg-gradient-to-b from-black/50 to-transparent" style={{ color: 'var(--text-muted)' }}>
                <p className="text-sm font-medium text-[var(--accent-primary)]">Chapter {chapter.info.chapterNumber}</p>
                <p className="text-xs opacity-75">{chapter.info.chapterTitle}</p>
            </div>

            {/* Pages */}
            {chapter.pages.map((page, index) => {
                const linkRef = React.useRef<HTMLAnchorElement>(null);

                const handleTrigger = (e: React.MouseEvent) => {
                    e.preventDefault();
                    if (linkRef.current) {
                        linkRef.current.click();
                    }
                };

                return (
                    <div
                        key={`${chapter.info.id}-${index}`}
                        className="relative w-full max-w-full md:max-w-2xl lg:max-w-3xl cursor-pointer"
                    >
                        {/* Hidden VenoBox Link */}
                        <a
                            ref={linkRef}
                            href={page.url}
                            className="venobox hidden"
                            data-gall={`chapter-${chapter.info.id}`}
                            data-title={`Page ${index + 1}`}
                        />

                        {/* Visible Image with Triggers */}
                        <img
                            data-src={page.url}
                            alt={`Page ${index + 1}`}
                            className="lazy w-full block"
                            loading="lazy"
                            style={{ minHeight: '100px', display: 'block' }}
                            onDoubleClick={handleTrigger}
                            onContextMenu={handleTrigger}
                            onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200"><rect fill="%231a1a2e" width="800" height="1200"/><text x="400" y="600" text-anchor="middle" fill="%236b7280" font-size="24">Gagal memuat</text></svg>';
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
