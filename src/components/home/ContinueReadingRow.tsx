'use client';

import Link from 'next/link';
import { Play, Clock, ArrowRight } from 'lucide-react';
import type { ReadingHistory } from '@/lib/storage';

interface ContinueReadingRowProps {
    items: ReadingHistory[];
}

export function ContinueReadingRow({ items }: ContinueReadingRowProps) {
    if (items.length === 0) return null;

    return (
        <section className="mb-10 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Clock className="text-[var(--accent-primary)]" size={20} /> Lanjut Baca
                </h2>
                <Link
                    href="/library"
                    className="text-sm font-medium hover:underline flex items-center gap-1 group transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    Lihat Semua <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth-touch scroll-px-4 px-4 -mx-4 snap-x snap-mandatory">
                {items.slice(0, 6).map((item) => (
                    <Link
                        key={`${item.mangaId}-${item.source}`}
                        href={`/read/${item.source}/${item.mangaId}/${item.chapterId}`}
                        className="group relative flex-shrink-0 w-[140px] md:w-[160px] flex flex-col gap-2 transition-transform hover:-translate-y-1 snap-start"
                    >
                        {/* Cover Container */}
                        <div
                            className="aspect-[2/3] rounded-xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow"
                            style={{ background: 'var(--bg-elevated)' }}
                        >
                            {item.mangaCover ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={item.mangaCover}
                                    alt={item.mangaTitle}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)]">
                                    <span className="text-xs text-[var(--text-muted)]">No Cover</span>
                                </div>
                            )}

                            {/* Overlay Play Button */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                    <Play size={18} fill="currentColor" className="ml-0.5" />
                                </div>
                            </div>

                            {/* Source Badge */}
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/60 text-white backdrop-blur-md">
                                {item.source}
                            </div>

                            {/* Progress Indicator (Optional visual cue) */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                <div className="h-full bg-[var(--accent-primary)] w-[30%]" />
                                {/* Note: Real progress percentage would require more data */}
                            </div>
                        </div>

                        {/* Info */}
                        <div>
                            <h3
                                className="font-semibold text-sm line-clamp-1 group-hover:text-[var(--accent-primary)] transition-colors"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                {item.mangaTitle}
                            </h3>
                            <p
                                className="text-xs font-medium mt-0.5 flex items-center gap-1"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                                Ch. {item.chapterNumber}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
