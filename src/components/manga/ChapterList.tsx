'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Check, Play, Circle } from 'lucide-react';

interface Chapter {
    id: string;
    number: number;
    title: string;
    releaseDate: string;
}

interface ChapterListProps {
    chapters: Chapter[];
    mangaId: string;
    source: string;
    readChapterIds: string[];
    lastReadChapterId?: string;
    isSelectMode: boolean;
    selectedChapters: string[];
    onToggleSelection: (chapterId: string) => void;
}

export default function ChapterList({
    chapters,
    mangaId,
    source,
    readChapterIds,
    lastReadChapterId,
    isSelectMode,
    selectedChapters,
    onToggleSelection,
}: ChapterListProps) {
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const days = Math.floor(diff / 86400000);

            if (days < 1) return 'Hari ini';
            if (days === 1) return 'Kemarin';
            if (days < 7) return `${days} hari lalu`;
            if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;

            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
            });
        } catch {
            return dateStr;
        }
    };

    // Auto-scroll to last read chapter
    useEffect(() => {
        if (lastReadChapterId) {
            // Gunakan timeout kecil agar DOM dan Lenis ready
            const timer = setTimeout(() => {
                const element = document.getElementById(`chapter-${lastReadChapterId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [lastReadChapterId]);

    // Reverse chapters for display (newest first)
    const reversedChapters = [...chapters].reverse();
    const [parent] = useAutoAnimate();

    return (
        <div ref={parent} className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
            {reversedChapters.map((chapter) => {
                const isRead = readChapterIds.includes(chapter.id);
                const isLastRead = lastReadChapterId === chapter.id;
                const isSelected = selectedChapters.includes(chapter.id);

                if (isSelectMode) {
                    return (
                        <div
                            key={chapter.id}
                            onClick={() => onToggleSelection(chapter.id)}
                            className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors"
                            style={{
                                background: isSelected
                                    ? 'rgba(168, 85, 247, 0.2)'
                                    : 'transparent',
                            }}
                        >
                            {/* Checkbox */}
                            <div
                                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                                style={{
                                    background: isSelected ? 'var(--accent-primary)' : 'transparent',
                                    borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-default)',
                                }}
                            >
                                {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                            </div>

                            {/* Chapter Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {isRead && (
                                        <Check size={16} style={{ color: 'var(--accent-success)' }} />
                                    )}
                                    <span
                                        className="font-medium"
                                        style={{
                                            color: isRead ? 'var(--text-muted)' : 'var(--text-primary)',
                                        }}
                                    >
                                        Ch. {chapter.number}
                                    </span>
                                    {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
                                        <span
                                            className="truncate"
                                            style={{ color: 'var(--text-secondary)' }}
                                        >
                                            - {chapter.title}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Date */}
                            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                                {formatDate(chapter.releaseDate)}
                            </span>
                        </div>
                    );
                }

                return (
                    <Link
                        key={chapter.id}
                        id={`chapter-${chapter.id}`}
                        href={`/read/${source}/${mangaId}/${chapter.id}`}
                        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/5"
                        style={{
                            background: isLastRead
                                ? 'rgba(168, 85, 247, 0.15)'
                                : 'transparent',
                        }}
                    >
                        {/* Read/Current Indicator */}
                        <div className="w-6 flex justify-center flex-shrink-0 items-center">
                            {isLastRead ? (
                                <Play size={14} className="ml-1" fill="currentColor" style={{ color: 'var(--accent-primary)' }} />
                            ) : isRead ? (
                                <Check size={16} style={{ color: 'var(--accent-success)' }} />
                            ) : (
                                <Circle size={10} style={{ color: 'var(--text-muted)' }} />
                            )}
                        </div>

                        {/* Chapter Info */}
                        <div className="flex-1 min-w-0">
                            <span
                                className="font-medium"
                                style={{
                                    color: isRead ? 'var(--text-muted)' : 'var(--text-primary)',
                                }}
                            >
                                Chapter {chapter.number}
                            </span>
                            {chapter.title && chapter.title !== `Chapter ${chapter.number}` && (
                                <p
                                    className="text-sm truncate"
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    {chapter.title}
                                </p>
                            )}
                        </div>

                        {/* Date */}
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {formatDate(chapter.releaseDate)}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
