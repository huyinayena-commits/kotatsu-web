
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';

interface ChapterUpdate {
    mangaId: string;
    mangaTitle: string;
    mangaCover: string;
    source: string;
    latestChapter: number;
    lastReadChapter: number;
    newChaptersCount: number;
    lastChecked: number;
}

interface UpdateCardProps {
    update: ChapterUpdate;
    index: number;
}

export function UpdateCard({ update, index }: UpdateCardProps) {
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div
            className="group rounded-xl overflow-hidden transition-all hover:translate-x-1 hover:shadow-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)]"
            style={{
                animationDelay: `${index * 50}ms`,
            }}
        >
            <div className="flex gap-4 p-4">
                {/* Cover */}
                <Link href={`/manga/${update.source}/${update.mangaId}`} className="flex-shrink-0 relative">
                    <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-lg overflow-hidden relative shadow-md group-hover:shadow-[var(--accent-primary)]/20 transition-all bg-[var(--bg-elevated)]">
                        {update.mangaCover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={`/api/proxy-image?url=${encodeURIComponent(update.mangaCover)}`}
                                alt={update.mangaTitle}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                                <BookOpen size={24} />
                            </div>
                        )}
                        {/* Source Badge */}
                        <div className="absolute top-0 right-0 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-bl-lg text-[10px] font-bold text-white uppercase tracking-wider">
                            {update.source}
                        </div>
                    </div>
                </Link>

                {/* Info */}
                <div className="flex-grow min-w-0 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex justify-between items-start gap-2">
                            <Link href={`/manga/${update.source}/${update.mangaId}`}>
                                <h3 className="font-bold text-lg leading-tight truncate-2-lines text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                    {update.mangaTitle}
                                </h3>
                            </Link>
                            <span className="flex-shrink-0 text-[10px] sm:text-xs text-[var(--text-muted)] flex items-center gap-1 bg-[var(--bg-elevated)] px-2 py-1 rounded-full">
                                <Clock size={10} /> {formatTime(update.lastChecked)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-sm shadow-[var(--accent-primary)]/20">
                                +{update.newChaptersCount} Baru
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mt-3 text-sm text-[var(--text-secondary)] font-medium bg-[var(--bg-elevated)] w-fit px-3 py-1.5 rounded-lg border border-[var(--border-default)]">
                            <span className="opacity-70">Ch. {update.lastReadChapter}</span>
                            <ArrowRight size={14} className="text-[var(--accent-primary)]" />
                            <span className="text-[var(--text-primary)]">Ch. {update.latestChapter}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-3 sm:mt-0">
                        <Link
                            href={`/manga/${update.source}/${update.mangaId}`}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium bg-[var(--active-item)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
                        >
                            <BookOpen size={16} className="transition-transform group-hover/btn:scale-110" />
                            Baca
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
