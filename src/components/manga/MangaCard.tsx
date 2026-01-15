'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import { X, ImageOff } from 'lucide-react';

interface MangaCardProps {
    id: string;
    title: string;
    cover: string;
    source: string;
    chapter?: string;
    chapterNumber?: number;
    lastRead?: string;
    progress?: number;
    variant?: 'grid' | 'list';
    href?: string;
    onRemove?: () => void;
}

const MangaCard = memo(function MangaCard({
    id,
    title,
    cover,
    source,
    chapter,
    chapterNumber,
    lastRead,
    progress,
    variant = 'grid',
    href,
    onRemove,
}: MangaCardProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const linkHref = href || `/manga/${source.toLowerCase()}/${id}`;

    // Grid variant
    if (variant === 'grid') {
        return (
            <Link
                href={linkHref}
                className="group relative block rounded-xl overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    contentVisibility: 'auto', // Optimization: skip rendering off-screen
                    containIntrinsicSize: '200px 300px' // Placeholder size
                }}
            >
                {/* Cover Image */}
                <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: '2/3' }}
                >
                    {imageLoading && (
                        <div
                            className="absolute inset-0 animate-pulse"
                            style={{ background: 'var(--bg-elevated)' }}
                        />
                    )}

                    {imageError ? (
                        <div
                            className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center"
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                        >
                            <ImageOff size={24} className="mb-2 opacity-50" />
                            <span className="text-xs font-medium line-clamp-2">{title}</span>
                        </div>
                    ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={`/api/proxy-image?url=${encodeURIComponent(cover)}`}
                            alt={title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onLoad={() => setImageLoading(false)}
                            onError={() => {
                                setImageError(true);
                                setImageLoading(false);
                            }}
                            loading="lazy"
                            decoding="async"
                        />
                    )}

                    {/* Progress bar */}
                    {progress !== undefined && progress > 0 && (
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1"
                            style={{ background: 'var(--bg-overlay)' }}
                        >
                            <div
                                className="h-full transition-all"
                                style={{
                                    width: `${Math.min(progress, 100)}%`,
                                    background: 'var(--accent-primary)',
                                }}
                            />
                        </div>
                    )}

                    {/* Source badge */}
                    <div
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-medium"
                        style={{
                            background: 'var(--bg-overlay)',
                            color: 'white',
                            backdropFilter: 'blur(4px)',
                        }}
                    >
                        {source}
                    </div>
                </div>

                {/* Info */}
                <div className="p-3">
                    <h3
                        className="font-medium text-sm line-clamp-2 leading-tight mb-1 group-hover:text-[var(--accent-primary)] transition-colors"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {title}
                    </h3>

                    {chapter && (
                        <p
                            className="text-xs mb-0.5 font-medium"
                            style={{ color: 'var(--accent-primary)' }}
                        >
                            Ch. {chapterNumber || chapter}
                        </p>
                    )}

                    {lastRead && (
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {lastRead}
                        </p>
                    )}
                </div>

                {/* Remove button */}
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-md"
                        style={{
                            background: 'var(--accent-error)',
                            color: 'white',
                        }}
                    >
                        <X size={14} />
                    </button>
                )}
            </Link>
        );
    }

    // List variant
    return (
        <Link
            href={linkHref}
            className="group flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-default)]"
            style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                contentVisibility: 'auto',
                containIntrinsicSize: '0 100px'
            }}
        >
            {/* Cover */}
            <div
                className="relative flex-shrink-0 rounded-lg overflow-hidden"
                style={{ width: '60px', height: '90px' }}
            >
                {imageError ? (
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                    >
                        <ImageOff size={20} className="opacity-50" />
                    </div>
                ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={`/api/proxy-image?url=${encodeURIComponent(cover)}`}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                        loading="lazy"
                        decoding="async"
                    />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3
                    className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-[var(--accent-primary)] transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                >
                    {title}
                </h3>

                {chapter && (
                    <p className="text-xs mb-1 font-medium" style={{ color: 'var(--accent-primary)' }}>
                        Chapter {chapterNumber || chapter}
                    </p>
                )}

                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span
                        className="px-1.5 py-0.5 rounded font-medium"
                        style={{ background: 'var(--bg-elevated)' }}
                    >
                        {source}
                    </span>
                    {lastRead && <span>• {lastRead}</span>}
                </div>
            </div>

            {/* Progress */}
            {progress !== undefined && (
                <div
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                        background: `conic-gradient(var(--accent-primary) ${progress * 3.6}deg, var(--bg-elevated) 0deg)`,
                        color: 'var(--text-primary)',
                    }}
                >
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--bg-surface)' }}
                    >
                        {progress}%
                    </div>
                </div>
            )}

            {/* Remove button */}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--accent-error)] hover:text-white"
                    style={{
                        color: 'var(--text-muted)',
                    }}
                >
                    <X size={16} />
                </button>
            )}
        </Link>
    );
});

export default MangaCard;
